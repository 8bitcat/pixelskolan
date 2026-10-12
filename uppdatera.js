// Appen uppdaterar sig själv (Carl 2026-10-12: "kan vi göra så den autouppdateras såsom Pixelcity?").
// I iOS-appen ligger spelet inbyggt. En ny version publiceras som version.json på webben och ett paket (app/www,
// packat av app/paket.mjs) på GitHub-releasen v<version> – tools/release.mjs gör båda. Appen kollar vid start, varje
// minut och när den kommer tillbaka till förgrunden. Finns en nyare version hämtas paketet, och uppdateringspluginet
// (@capgo/capacitor-updater, samma som i Pixelcity) byter till det när barnet inte är mitt i något: inte i en
// lektion, en dialog eller en butik. Allt man har ligger kvar (localStorage). Svarar ett nytt paket inte inom 15 s
// (notifyAppReady) går pluginet själv tillbaka till det förra, och appen går aldrig bakåt i version.
// På webben gör modulen ingenting – GitHub Pages har alltid den senaste versionen.
import { VERSION, TITLE } from './version.js';

const UPD = (() => { try { return window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.CapacitorUpdater || null : null; } catch { return null; } })();
const WEBB = 'https://8bitcat.github.io/pixelskolan/';
const REPO = '8bitcat/pixelskolan';
const PAKET = (v) => `https://github.com/${REPO}/releases/download/v${v}/pixelskolan-${v}.zip`;
const POLL_MS = 60 * 1000, VANTA_S = 8, FEL_MAX = 5;
const nyare = (a, b) => {
  const x = String(a).split('.').map((n) => +n || 0), y = String(b).split('.').map((n) => +n || 0);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
};
const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ok */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* ok */ } },
};

let klar = null;        // { id, version, title } – nedladdat och redo
let hamtar = false, byter = false, ruta = null, nedrakning = VANTA_S, T0 = Date.now();

// lugnt läge: ingen lektion, ingen dialog, ingen butik och ingen som skriver (då sparas allt redan)
const skriver = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
function lugnt() {
  if (skriver()) return false;
  let s = null; try { s = window.__ps?.state?.(); } catch { /* ok */ }
  if (!s) return Date.now() - T0 < 20000;   // spelet har inte startat än
  if (!s.me) return true;                    // allra först, före figuren: inget att förlora
  return !s.shop && !s.seated && !s.modal && !s.ride;
}

function visaRuta(text, knapp) {
  if (!ruta) {
    ruta = document.createElement('div');
    ruta.id = 'sk-upd';
    ruta.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:9999;display:flex;gap:10px;align-items:center;max-width:calc(100% - 24px);padding:6px 10px;background:#fbf6ea;color:#17151a;border:3px solid #17151a;box-shadow:3px 3px 0 #17151a;font:12px/1.3 "Pixelstad",ui-monospace,monospace';
    document.body.append(ruta);
  }
  ruta.innerHTML = `<span>${text}</span>${knapp ? '<button type="button" class="btn btn-small btn-go">Starta nu</button>' : ''}`;
  const b = ruta.querySelector('button'); if (b) b.onclick = () => byt();
}
const tackRuta = () => { if (ruta) { ruta.remove(); ruta = null; } };

// paketets SHA-256 – pluginet vill ha den, och GitHub anger den (digest) för varje fil på releasen
async function summa(v) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/v${v}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`releasen v${v} finns inte än`);
  const a = ((await r.json()).assets || []).find((x) => x.name === `pixelskolan-${v}.zip`);
  const m = /^sha256:([0-9a-f]{64})$/.exec(a?.digest || '');
  if (!m) throw new Error('paketet finns inte på releasen än');
  return m[1];
}

async function hamta(v, title) {
  hamtar = true;
  try {
    const checksum = await summa(v);
    const b = await Promise.race([UPD.download({ url: PAKET(v), version: v, checksum }), new Promise((_, nej) => setTimeout(() => nej(new Error('nedladdningen tog för lång tid')), 120000))]);
    klar = { id: b.id, version: v, title };
    try { await UPD.next({ id: b.id }); } catch { /* byts nästa gång appen startar – annars nedan */ }
  } catch (e) {
    ss.set('sk_upd_fel_' + v, String(+(ss.get('sk_upd_fel_' + v) || 0) + 1));
    console.warn('Pixelskolan: kunde inte hämta', v, e);
  }
  hamtar = false;
}

async function byt() {
  if (!klar || byter) return;
  byter = true;   // set() startar om spelet i det nya paketet – det ska bara ske en gång
  ss.set('sk_upd_mal', klar.version);
  try { window.__ps?.G?.save?.(); } catch { /* skolan sparar ändå vid varje ändring */ }
  visaRuta(`⬇️ Startar Pixelskolan ${klar.version} …`, false);
  try { await UPD.set({ id: klar.id }); } catch (e) { console.warn('Pixelskolan: kunde inte byta version', e); klar = null; byter = false; tackRuta(); }
}

// varje sekund: är det nedladdat och lugnt räknar rutan ner och byter; annars väntar den
function tick() {
  if (!klar || byter) return;
  if (document.hidden) { byt(); return; }   // ingen tittar – byt direkt
  if (!lugnt()) { nedrakning = VANTA_S; visaRuta(`✨ Pixelskolan ${klar.version} har kommit${klar.title ? `: ${klar.title}` : ''}! Den startar när du är klar.`, false); return; }
  let s = null; try { s = window.__ps?.state?.(); } catch { /* ok */ }
  if (!s || !s.me) { byt(); return; }     // allra först: direkt
  nedrakning -= 1;
  if (nedrakning <= 0) { byt(); return; }
  visaRuta(`✨ Pixelskolan ${klar.version} har kommit${klar.title ? `: ${klar.title}` : ''}! Startar om ${nedrakning} s – allt du har är kvar.`, true);
}

async function kolla() {
  if (!UPD || hamtar || klar) return;
  try {
    const r = await fetch(WEBB + 'version.json?' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const d = await r.json();
    if (!d?.version || !nyare(d.version, VERSION)) return;
    if (+(ss.get('sk_upd_fel_' + d.version) || 0) >= FEL_MAX) return;
    await hamta(String(d.version), String(d.title || ''));
  } catch { /* utan nät: nästa gång */ }
}

if (UPD) {
  // "paketet fungerar" när spelet har startat (annars går pluginet tillbaka till förra versionen efter 15 s)
  const iv = setInterval(() => { if (window.__ps) { clearInterval(iv); try { UPD.notifyAppReady(); } catch { /* ok */ } } else if (Date.now() - T0 > 14000) clearInterval(iv); }, 300);
  const mal = ss.get('sk_upd_mal');
  if (mal) { ss.del('sk_upd_mal'); if (mal === VERSION) setTimeout(() => { visaRuta(`✨ Uppdaterat till Pixelskolan ${VERSION}${TITLE ? `: ${TITLE}` : ''}! Allt du hade är kvar.`, false); setTimeout(tackRuta, 5000); }, 1500); }
  setTimeout(kolla, 1500);
  setInterval(kolla, POLL_MS);
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kolla(); else if (klar) byt(); });
}
window.PS_UPDATE = { VERSION, TITLE, kolla, klar: () => klar, lugnt, inApp: !!UPD };
