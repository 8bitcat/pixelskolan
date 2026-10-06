// Pixelskolans uppgifter: alla moment från planens lista (Lgr22, åk 1–3) som nivåer per ämne.
// Varje nivå: { name, gen() } → en uppgift:
//   { topic, prompt?, board?: { big?, lines?, after? }, visual?, say, lang?, ans, opts: [{ label, value, sub? }], hint, done }
//   prompt = räkneuppgiften i stor krita (som förut); board = text på tavlan (stort ord och/eller rader);
//   after = det som skrivs på tavlan när man svarat rätt; visual = bild på tavlan (tiorutan, klockan,
//   former, stapeldiagram, tårtbitar).
// Gångertabellerna (fliken Gånger) ligger i skola.js – de hör ihop med huvudräkningen och meddelandet.
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad = (n) => String(n).padStart(2, '0');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// klassens namn till berättelserna (skola.js sätter dem)
let CTX = () => ({ me: 'Mira', kids: ['Alva', 'Noah', 'Selma', 'Elias', 'Wilma', 'Leo', 'Saga'], teacher: 'Fröken Maja' });
export const setContext = (fn) => { CTX = fn; };

export function numOpts(ans, spread) {
  const set = new Set([ans]);
  for (const v of shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + spread, ans - spread, ans + 10, ans + 3])) { if (set.size >= 4) break; if (v >= 0) set.add(v); }
  return shuffle([...set]).map((v) => ({ label: String(v), value: v }));
}
// textsvar: rätt + felaktiga, blandade (värdet = texten)
const textOpts = (right, wrong, n = 3) => shuffle([right, ...shuffle([...new Set(wrong.filter((w) => w !== right))]).slice(0, n - 1)]).map((w) => ({ label: w, value: w }));
// en kunskapsfråga ur en lista: [fråga, rätt, fel, fel]
const quiz = (topic, list) => () => { const [q, right, ...wrong] = pick(list); return { topic, board: { lines: [q.toUpperCase()], after: right.toUpperCase() }, say: q, ans: right, opts: textOpts(right, wrong), hint: 'Läs frågan en gång till och tänk efter.', done: `${q} ${right}.` }; };

// ======================= MATTE =======================
function tio() { const a = rnd(1, 9); return { topic: 'TIOKOMPISAR', prompt: `${a} + ? = 10`, say: `${a} plus hur mycket blir tio?`, ans: 10 - a, opts: numOpts(10 - a, 3), visual: { frame: a }, hint: `Titta på tavlan: ${a} rutor är fyllda. Hur många är tomma?`, done: `${a} och ${10 - a} är tiokompisar.` }; }
function tvilling() { const a = rnd(2, 10); return { topic: 'TVILLINGAR', prompt: `${a} + ${a} = ?`, say: `${a} plus ${a}`, ans: 2 * a, opts: numOpts(2 * a, 2), hint: `Tvillingar är samma tal två gånger. Räkna ${a} steg från ${a}.`, done: `${a} + ${a} = ${2 * a}.` }; }
function plus20() { const a = rnd(6, 9), b = rnd(11 - a, 9), up = 10 - a; return { topic: 'PLUS ÖVER TIOTALET', prompt: `${a} + ${b} = ?`, say: `${a} plus ${b}`, ans: a + b, opts: numOpts(a + b, 2), hint: `Ta dig till tio först: ${a} + ${up} = 10. Sedan ${b - up} till.`, done: `${a} + ${up} = 10, och 10 + ${b - up} = ${a + b}.` }; }
function minus20() { const a = rnd(11, 18), down = a - 10, b = rnd(down + 1, 9); return { topic: 'MINUS ÖVER TIOTALET', prompt: `${a} − ${b} = ?`, say: `${a} minus ${b}`, ans: a - b, opts: numOpts(a - b, 2), hint: `Gå ner till tio först: ${a} − ${down} = 10. Sedan ${b - down} till.`, done: `${a} − ${down} = 10, och 10 − ${b - down} = ${a - b}.` }; }
function dubbelt() {
  if (Math.random() < 0.5) { const n = rnd(2, 10); return { topic: 'DUBBELT', board: { big: `DUBBELT AV ${n}`, lines: ['= ?'], after: `= ${2 * n}` }, say: `Dubbelt av ${n}`, ans: 2 * n, opts: numOpts(2 * n, 2), hint: `Dubbelt är samma tal två gånger: ${n} + ${n}.`, done: `Dubbelt av ${n} är ${2 * n}.` }; }
  const n = 2 * rnd(1, 10); return { topic: 'HÄLFTEN', board: { big: `HÄLFTEN AV ${n}`, lines: ['= ?'], after: `= ${n / 2}` }, say: `Hälften av ${n}`, ans: n / 2, opts: numOpts(n / 2, 2), hint: `Dela ${n} i två lika stora delar. Vilket tal plus samma tal blir ${n}?`, done: `Hälften av ${n} är ${n / 2}, för ${n / 2} + ${n / 2} = ${n}.` };
}
function udda() { const n = rnd(1, 40), j = n % 2 === 0; return { topic: 'UDDA OCH JÄMNT', board: { big: String(n), lines: ['ÄR TALET UDDA ELLER JÄMNT?'], after: j ? 'JÄMNT' : 'UDDA' }, say: `Är ${n} udda eller jämnt?`, ans: j ? 'j' : 'u', opts: [{ label: 'Udda', value: 'u' }, { label: 'Jämnt', value: 'j' }], hint: 'Jämna tal slutar på 0, 2, 4, 6 eller 8. De går att dela i två lika delar.', done: `${n} är ${j ? 'jämnt' : 'udda'}, det slutar på ${n % 10}.` }; }
function tiotal() {
  const r = Math.random();
  if (r < 0.35) { const n = rnd(11, 99); return { topic: 'TIOTAL OCH ENTAL', board: { big: String(n), lines: ['HUR MÅNGA TIOTAL?'], after: `${Math.floor(n / 10)} TIOTAL OCH ${n % 10} ENTAL` }, say: `Hur många tiotal finns det i ${n}?`, ans: Math.floor(n / 10), opts: numOpts(Math.floor(n / 10), 1), hint: 'Tiotalen är den första siffran.', done: `${n} = ${Math.floor(n / 10)} tiotal och ${n % 10} ental.` }; }
  if (r < 0.7) { const t = rnd(1, 9), e = rnd(0, 9), n = 10 * t + e; return { topic: 'TIOTAL OCH ENTAL', board: { lines: [`${t} TIOTAL OCH ${e} ENTAL`], big: '= ?', after: `= ${n}` }, say: `${t} tiotal och ${e} ental`, ans: n, opts: numOpts(n, 10), hint: `${t} tiotal är ${10 * t}. Lägg till ${e}.`, done: `${t} tiotal och ${e} ental är ${n}.` }; }
  const h = rnd(1, 9), t = rnd(0, 9), e = rnd(0, 9), n = 100 * h + 10 * t + e;
  return { topic: 'TALEN TILL 1000', board: { lines: [`${h} HUNDRATAL, ${t} TIOTAL`, `OCH ${e} ENTAL`], big: '= ?', after: `= ${n}` }, say: `${h} hundratal, ${t} tiotal och ${e} ental`, ans: n, opts: numOpts(n, 100), hint: `${h} hundratal är ${100 * h}, ${t} tiotal är ${10 * t}.`, done: `${100 * h} + ${10 * t} + ${e} = ${n}.` };
}
function hundra() {
  const r = rnd(0, 3);
  if (r === 0) { const a = 10 * rnd(1, 6), b = 10 * rnd(1, 9 - a / 10); return { topic: 'PLUS TILL 100', prompt: `${a} + ${b} = ?`, say: `${a} plus ${b}`, ans: a + b, opts: numOpts(a + b, 10), hint: `Räkna tiotal: ${a / 10} + ${b / 10} tiotal.`, done: `${a} + ${b} = ${a + b}.` }; }
  if (r === 1) { const t = rnd(2, 8), e = rnd(1, 6), b = rnd(1, 9 - e), a = 10 * t + e; return { topic: 'PLUS TILL 100', prompt: `${a} + ${b} = ?`, say: `${a} plus ${b}`, ans: a + b, opts: numOpts(a + b, 10), hint: `Tiotalen står still. ${e} + ${b} = ${e + b}.`, done: `${a} + ${b} = ${a + b}.` }; }
  if (r === 2) { const a = 10 * rnd(3, 9), b = 10 * rnd(1, a / 10 - 1); return { topic: 'MINUS TILL 100', prompt: `${a} − ${b} = ?`, say: `${a} minus ${b}`, ans: a - b, opts: numOpts(a - b, 10), hint: `Räkna tiotal: ${a / 10} − ${b / 10} tiotal.`, done: `${a} − ${b} = ${a - b}.` }; }
  const t = rnd(2, 9), e = rnd(3, 9), b = rnd(1, e), a = 10 * t + e; return { topic: 'MINUS TILL 100', prompt: `${a} − ${b} = ?`, say: `${a} minus ${b}`, ans: a - b, opts: numOpts(a - b, 10), hint: `Tiotalen står still. ${e} − ${b} = ${e - b}.`, done: `${a} − ${b} = ${a - b}.` };
}
const GLASS = [['jordgubbsglass', 12], ['chokladglass', 12], ['pistageglass', 14], ['mjukglass', 10], ['glass med två kulor', 20]];
function pengar() {
  if (Math.random() < 0.6) {
    const [what, price] = pick(GLASS), pay = price < 20 && Math.random() < 0.7 ? 20 : 50;
    return { topic: 'PENGAR OCH VÄXEL', board: { lines: [`EN ${what.toUpperCase()} KOSTAR ${price} KR.`, `DU BETALAR MED ${pay} KR.`, 'HUR MYCKET FÅR DU TILLBAKA?'], after: `${pay} − ${price} = ${pay - price} KR` }, say: `En ${what} kostar ${price} kronor. Du betalar med ${pay} kronor. Hur mycket får du tillbaka?`, ans: pay - price, opts: numOpts(pay - price, 5).map((o) => ({ ...o, label: `${o.value} kr` })), hint: `Räkna från ${price} upp till ${pay}.`, done: `${pay} − ${price} = ${pay - price} kr tillbaka.` };
  }
  const c10 = rnd(1, 3), c5 = rnd(0, 3), c1 = rnd(0, 4), sum = 10 * c10 + 5 * c5 + c1;
  const parts = [`${c10} TIOKRON${c10 > 1 ? 'OR' : 'A'}`, c5 && `${c5} FEMKRON${c5 > 1 ? 'OR' : 'A'}`, c1 && `${c1} ENKRON${c1 > 1 ? 'OR' : 'A'}`].filter(Boolean);
  return { topic: 'PENGAR', board: { lines: ['DU HAR', ...parts, 'HUR MYCKET HAR DU?'], after: `${sum} KR` }, say: `Du har ${parts.join(', ').toLowerCase()}. Hur mycket har du?`, ans: sum, opts: numOpts(sum, 5).map((o) => ({ ...o, label: `${o.value} kr` })), hint: 'Räkna tiokronorna först, sedan femkronorna och sist enkronorna.', done: `Det blir ${sum} kr.` };
}
const SAKER = [['godisbitar', 'kompisar'], ['äpplen', 'barn'], ['kulor', 'kompisar'], ['kakor', 'barn'], ['pennor', 'bänkar'], ['jordgubbar', 'tallrikar']];
function dela() { const [sak, vem] = pick(SAKER), n = rnd(2, 5), each = rnd(2, 6), tot = n * each; return { topic: 'DELA LIKA', board: { lines: [`${tot} ${sak.toUpperCase()} DELAS LIKA`, `MELLAN ${n} ${vem.toUpperCase()}.`, 'HUR MÅNGA FÅR VAR OCH EN?'], after: `${tot} DELAT MED ${n} = ${each}` }, say: `${tot} ${sak} delas lika mellan ${n} ${vem}. Hur många får var och en?`, ans: each, opts: numOpts(each, 1), hint: `Dela ut en i taget till alla ${n} tills det är slut. Eller: vilket tal gånger ${n} blir ${tot}?`, done: `${tot} delat med ${n} är ${each}, för ${n} · ${each} = ${tot}.` }; }
const MATT = [
  ['Hur lång är en penna?', '15 cm', '15 m', '15 kg'], ['Hur hög är en dörr?', '2 m', '2 cm', '2 kg'], ['Hur mycket väger en katt?', '4 kg', '4 m', '4 liter'],
  ['Hur mycket vatten ryms i en hink?', '10 liter', '10 cm', '10 kg'], ['Hur lång är en fotbollsplan?', '100 m', '100 cm', '100 kg'],
  ['Hur många centimeter är 1 meter?', '100', '10', '1000'], ['Vilket är längst?', '1 meter', '50 cm', '10 cm'], ['Hur mycket mjölk är det i ett mjölkpaket?', '1 liter', '1 meter', '1 cm'],
  ['Hur lång är en nyckel?', '6 cm', '6 m', '6 liter'], ['Hur mycket väger en påse mjöl?', '2 kg', '2 cm', '2 m'], ['Vad mäter man med en linjal?', 'Längd', 'Vikt', 'Tid'],
];
const mata = quiz('MÄTA', MATT);
const FORMER2 = ['kvadrat', 'rektangel', 'triangel', 'cirkel'], FORMER3 = ['kub', 'klot', 'cylinder', 'kon', 'rätblock', 'pyramid'];
const HORN = { kvadrat: 4, rektangel: 4, triangel: 3 };
function former() {
  if (Math.random() < 0.25) { const f = pick(['kvadrat', 'rektangel', 'triangel']); return { topic: 'FORMER', board: { lines: [`HUR MÅNGA HÖRN HAR EN ${f.toUpperCase()}?`], after: `${HORN[f]} HÖRN` }, visual: { shape: f }, say: `Hur många hörn har en ${f}?`, ans: HORN[f], opts: numOpts(HORN[f], 1), hint: 'Räkna hörnen på formen på tavlan.', done: `En ${f} har ${HORN[f]} hörn.` }; }
  const three = Math.random() < 0.6, list = three ? FORMER3 : FORMER2, f = pick(list);
  return { topic: three ? 'KROPPAR' : 'FORMER', board: { lines: [three ? 'VAD HETER KROPPEN?' : 'VAD HETER FORMEN?'], after: f.toUpperCase() }, visual: { shape: f }, say: three ? 'Vad heter kroppen?' : 'Vad heter formen?', ans: f, opts: textOpts(f, list, 3).map((o) => ({ ...o, label: cap(o.label) })), hint: three ? 'Klot är runt som en boll, en kub har sex lika fyrkantiga sidor och en cylinder ser ut som en burk.' : 'Räkna hörnen: triangel 3, kvadrat och rektangel 4, cirkel inga.', done: `Det är en ${f}.` };
}
const MATRATT = ['PIZZA', 'TACOS', 'FISK', 'SOPPA', 'PASTA'];
function diagram() {
  const foods = shuffle(MATRATT.slice()).slice(0, 4), vals = shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, 4), bars = foods.map((f, i) => [f, vals[i]]);
  const r = rnd(0, 2), maxI = vals.indexOf(Math.max(...vals)), minI = vals.indexOf(Math.min(...vals));
  const v = { chart: bars };
  if (r === 0) return { topic: 'STAPELDIAGRAM', board: { lines: ['SKOLMATEN: VILKEN MAT', 'FICK FLEST RÖSTER?'], after: foods[maxI] }, visual: v, say: 'Vilken mat fick flest röster?', ans: foods[maxI], opts: shuffle(foods.slice()).slice(0, 4).map((f) => ({ label: cap(f.toLowerCase()), value: f })), hint: 'Leta efter den högsta stapeln.', done: `${cap(foods[maxI].toLowerCase())} fick flest röster: ${vals[maxI]}.` };
  if (r === 1) { const i = rnd(0, 3); return { topic: 'STAPELDIAGRAM', board: { lines: [`HUR MÅNGA RÖSTADE`, `PÅ ${foods[i]}?`], after: String(vals[i]) }, visual: v, say: `Hur många röstade på ${foods[i].toLowerCase()}?`, ans: vals[i], opts: numOpts(vals[i], 1), hint: 'Följ stapelns topp åt vänster till siffran.', done: `${vals[i]} röstade på ${foods[i].toLowerCase()}.` }; }
  const d = vals[maxI] - vals[minI];
  return { topic: 'STAPELDIAGRAM', board: { lines: [`HUR MÅNGA FLER RÖSTADE PÅ`, `${foods[maxI]} ÄN PÅ ${foods[minI]}?`], after: `${vals[maxI]} − ${vals[minI]} = ${d}` }, visual: v, say: `Hur många fler röstade på ${foods[maxI].toLowerCase()} än på ${foods[minI].toLowerCase()}?`, ans: d, opts: numOpts(d, 1), hint: 'Läs av båda staplarna och räkna skillnaden.', done: `${vals[maxI]} − ${vals[minI]} = ${d}.` };
}
const BRAK = { '1/2': 'En halv', '1/3': 'En tredjedel', '2/3': 'Två tredjedelar', '1/4': 'En fjärdedel', '2/4': 'Två fjärdedelar', '3/4': 'Tre fjärdedelar' };
function brak() {
  if (Math.random() < 0.3) { const n = pick([2, 4]), tot = n * rnd(2, 6); return { topic: n === 2 ? 'HÄLFTEN' : 'EN FJÄRDEDEL', board: { big: `${n === 2 ? 'HÄLFTEN' : 'EN FJÄRDEDEL'} AV ${tot}`, lines: ['= ?'], after: `= ${tot / n}` }, visual: { pie: [n, 1] }, say: `${n === 2 ? 'Hälften' : 'En fjärdedel'} av ${tot}`, ans: tot / n, opts: numOpts(tot / n, 1), hint: `Dela ${tot} i ${n} lika delar.`, done: `${tot} delat i ${n} delar är ${tot / n}.` }; }
  const n = pick([2, 3, 4]), k = rnd(1, n - 1), key = `${k}/${n}`;
  return { topic: 'BRÅK', board: { lines: ['PIZZAN ÄR DELAD I LIKA BITAR.', 'HUR STOR DEL ÄR GUL?'], after: BRAK[key].toUpperCase() }, visual: { pie: [n, k] }, say: 'Hur stor del av pizzan är gul?', ans: key, opts: textOpts(BRAK[key], Object.keys(BRAK).filter((x) => { const [p, q] = x.split('/'); return p / q !== k / n; }).map((x) => BRAK[x])).map((o) => ({ label: o.label, value: Object.keys(BRAK).find((x) => BRAK[x] === o.label) })), hint: `Räkna bitarna: pizzan har ${n} lika bitar. Hur många är gula?`, done: `${k} av ${n} bitar: ${BRAK[key].toLowerCase()}.` };
}
function tabell2510() { const t = pick([2, 5, 10]), n = rnd(2, 10), seq = Array.from({ length: Math.min(n, 3) }, (_, i) => t * (i + 1)).join(', '); return { topic: `${t}-TABELLEN`, prompt: `${n} · ${t} = ?`, say: `${n} gånger ${t}`, ans: n * t, opts: numOpts(n * t, t), hint: `Räkna ${t}-skutt: ${seq} … tills du har tagit ${n} skutt.`, done: `${n} skutt på ${t} blir ${n * t}.` }; }

// ======================= KLOCKAN =======================
const HW = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva'];
const hw = (h) => HW[((h % 12) + 12) % 12];
export function phrase(h, m) { const c = hw(h), n = hw(h + 1); return { 0: `klockan ${c}`, 5: `fem över ${c}`, 10: `tio över ${c}`, 15: `kvart över ${c}`, 20: `tjugo över ${c}`, 25: `fem i halv ${n}`, 30: `halv ${n}`, 35: `fem över halv ${n}`, 40: `tjugo i ${n}`, 45: `kvart i ${n}`, 50: `tio i ${n}`, 55: `fem i ${n}` }[m]; }
function klocka(l) {
  const mins = l === 1 ? [0, 30] : l === 2 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const h = rnd(1, 12), m = pick(mins), right = phrase(h, m);
  const pairs = m === 0 ? [[h, 30], [h - 1, 30], [h + 1, 0]] : [[h - 1, m], [h, (60 - m) % 60], [h + 1, m], [h, (m + 30) % 60]];
  const wrong = []; for (const [a, b] of pairs) { const p = phrase(a, b); if (p !== right && !wrong.includes(p)) wrong.push(p); if (wrong.length === 2) break; }
  const am = h % 12, hint = m === 0 ? 'Den långa visaren pekar rakt upp på tolv. Då är det hel timme, och den korta visaren visar vilken.' : m === 30 ? `Halv betyder halvvägs till nästa timme. Den korta visaren står mellan ${hw(h)} och ${hw(h + 1)}.` : m === 15 ? 'Den långa visaren pekar på tre. Kvart över betyder en kvart efter hel timme.' : m === 45 ? 'Den långa visaren pekar på nio. Kvart i betyder en kvart kvar till nästa hela timme.' : 'Räkna femminuterssteg från tolvan med den långa visaren. Den korta visaren visar timmen.';
  return { topic: l === 1 ? 'HEL OCH HALV' : l === 2 ? 'KVART ÖVER OCH KVART I' : 'FEM MINUTER I TAGET', prompt: 'Vad är klockan?', say: 'Vad är klockan?', ans: right, opts: shuffle([right, ...wrong]).map((p) => ({ label: p, value: p })), visual: { clock: [h, m] }, hint, done: `Det är ${right}, alltså ${pad(am)}:${pad(m)} eller ${pad(am + 12)}:${pad(m)}.` };
}
function digital() {
  const h = rnd(1, 10), m = pick([0, 15, 30, 45]), pm = Math.random() < 0.6, hh = pm ? h + 12 : h, right = `${pad(hh)}:${pad(m)}`;
  const wrong = [`${pad(pm ? h : h + 12)}:${pad(m)}`, `${pad(hh)}:${pad((m + 30) % 60)}`, `${pad(hh + (m === 45 ? 0 : 1))}:${pad(m)}`].filter((w) => w !== right);
  return { topic: 'DIGITAL TID', question: pm ? 'PÅ EFTERMIDDAGEN - DIGITALT?' : 'PÅ FÖRMIDDAGEN - DIGITALT?', prompt: 'Digitalt?', say: `Klockan är ${phrase(h, m)} på ${pm ? 'eftermiddagen' : 'förmiddagen'}. Hur skriver man det digitalt?`, ans: right, opts: shuffle([right, ...new Set(wrong)].slice(0, 3)).map((p) => ({ label: p, value: p })), visual: { clock: [h, m] }, hint: pm ? 'På eftermiddagen lägger man till 12 på timmen: ett blir 13, två blir 14 …' : 'På förmiddagen är timmen samma som på urtavlan.', done: `${cap(phrase(h, m))} på ${pm ? 'eftermiddagen' : 'förmiddagen'} är ${right}.` };
}

// ======================= SVENSKA =======================
const RIM = [['katt', 'hatt'], ['hus', 'mus'], ['bil', 'pil'], ['sol', 'stol'], ['ko', 'sko'], ['fisk', 'disk'], ['säng', 'äng'], ['bok', 'krok'], ['mås', 'lås'], ['sten', 'ben'], ['hand', 'sand'], ['tåg', 'våg'], ['ljus', 'hus'], ['räv', 'väv'], ['gris', 'is'], ['mat', 'fat'], ['boll', 'troll'], ['glass', 'pass']];
function rim() {
  const [w, r] = pick(RIM), others = RIM.filter(([a, b]) => a !== w && b !== r && !b.endsWith(r.slice(-2)) && !a.endsWith(r.slice(-2))).map(([a]) => a);
  return { topic: 'RIM', board: { big: w.toUpperCase(), lines: ['VAD RIMMAR?'], after: `${w.toUpperCase()} - ${r.toUpperCase()}` }, say: `Vad rimmar på ${w}?`, ans: r, opts: textOpts(r, others), hint: `Ord som rimmar slutar likadant. Säg ${w} högt och lyssna på slutet.`, done: `${cap(w)} och ${r} rimmar.` };
}
const MOTSATS = [['stor', 'liten'], ['varm', 'kall'], ['glad', 'ledsen'], ['lång', 'kort'], ['ny', 'gammal'], ['ljus', 'mörk'], ['snabb', 'långsam'], ['full', 'tom'], ['hög', 'låg'], ['upp', 'ner'], ['tung', 'lätt'], ['öppen', 'stängd'], ['våt', 'torr'], ['mjuk', 'hård'], ['först', 'sist'], ['dag', 'natt'], ['sommar', 'vinter'], ['ja', 'nej']];
function motsats() {
  const pair = pick(MOTSATS), flip = Math.random() < 0.5, [w, r] = flip ? [pair[1], pair[0]] : pair, others = MOTSATS.filter((p) => p !== pair).map((p) => p[flip ? 0 : 1]);
  return { topic: 'MOTSATSORD', board: { big: w.toUpperCase(), lines: ['VAD ÄR MOTSATSEN?'], after: `${w.toUpperCase()} - ${r.toUpperCase()}` }, say: `Vad är motsatsen till ${w}?`, ans: r, opts: textOpts(r, others), hint: 'Motsatsen betyder det helt omvända.', done: `Motsatsen till ${w} är ${r}.` };
}
const ALFA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ';
const ORDLISTA = ['apa', 'boll', 'cykel', 'docka', 'elefant', 'fisk', 'glass', 'hund', 'is', 'jacka', 'katt', 'lampa', 'mus', 'nalle', 'ost', 'penna', 'ros', 'sol', 'tåg', 'uggla', 'väska', 'yxa', 'zebra', 'ål', 'äpple', 'ö'];
function alfa() {
  if (Math.random() < 0.4) { const i = rnd(0, ALFA.length - 2), c = ALFA[i], nx = ALFA[i + 1]; const wrong = [ALFA[Math.max(0, i - 1)], ALFA[Math.min(ALFA.length - 1, i + 2)], ALFA[(i + 5) % ALFA.length]].filter((x) => x !== nx && x !== c); return { topic: 'ALFABETET', board: { big: c, lines: ['VILKEN BOKSTAV KOMMER EFTER?'], after: `${c} ${nx}` }, say: `Vilken bokstav kommer efter ${c}?`, ans: nx, opts: textOpts(nx, wrong), hint: 'Sjung alfabetet tyst för dig själv fram till bokstaven.', done: `Efter ${c} kommer ${nx}.` }; }
  const words = shuffle(ORDLISTA.slice()).slice(0, 3), first = words.slice().sort((a, b) => ALFA.indexOf(a[0].toUpperCase()) - ALFA.indexOf(b[0].toUpperCase()))[0];
  return { topic: 'ALFABETISK ORDNING', board: { lines: [words.map((w) => w.toUpperCase()).join('   '), 'VILKET ORD KOMMER FÖRST I ALFABETET?'], after: first.toUpperCase() }, say: `Vilket ord kommer först i alfabetet: ${words.join(', ')}?`, ans: first, opts: words.map((w) => ({ label: w, value: w })), hint: 'Titta på första bokstaven i varje ord. Vilken kommer först i alfabetet?', done: `${cap(first)} kommer först, för ${first[0].toUpperCase()} kommer först i alfabetet.` };
}
const SAMMANSATT = [['fot', 'boll'], ['regn', 'båge'], ['glass', 'strut'], ['snö', 'gubbe'], ['cykel', 'hjälm'], ['tand', 'borste'], ['is', 'bit'], ['blå', 'bär'], ['sko', 'snöre'], ['hund', 'koja'], ['sand', 'låda'], ['bok', 'hylla'], ['lek', 'plats'], ['sol', 'glasögon'], ['skol', 'gård']];
function sammansatt() {
  const [a, b] = pick(SAMMANSATT), right = a + b, other = pick(SAMMANSATT.filter((p) => p[0] !== a));
  const wrong = [b + a, a + other[1], other[0] + b].filter((w) => w !== right);
  return { topic: 'SAMMANSATTA ORD', board: { big: `${a.toUpperCase()} + ${b.toUpperCase()}`, lines: ['= ?'], after: `= ${right.toUpperCase()}` }, say: `${a} plus ${b}. Vilket ord blir det?`, ans: right, opts: textOpts(right, wrong), hint: 'Sätt ihop orden i samma ordning som på tavlan.', done: `${cap(a)} och ${b} blir ${right}.` };
}
const VOKAL = [['JAG DRICKER VATTEN UR ETT ___.', 'glas', 'glass'], ['JAG ÄTER EN ___ MED STRÖSSEL.', 'glass', 'glas'], ['HUSET HAR ETT RÖTT ___.', 'tak', 'tack'], ['___ FÖR HJÄLPEN!', 'tack', 'tak'],
  ['GLASET ÄR ___ AV SAFT.', 'full', 'ful'], ['VI BOR I EN ___ MED TRÄDGÅRD.', 'villa', 'vila'], ['EFTER GYMPAN BEHÖVER JAG ___.', 'vila', 'villa'], ['HAN HAR EN ___ PÅ HUVUDET.', 'hatt', 'hat'],
  ['EN HÖG ___ VÄXER I SKOGEN.', 'tall', 'tal'], ['SJU ÄR ETT UDDA ___.', 'tal', 'tall'], ['JAG LÄSER EN ___.', 'bok', 'bock'], ['EN ___ HAR HORN OCH SKÄGG.', 'bock', 'bok'],
  ['ISEN ÄR ___. AKTA SÅ DU INTE RAMLAR!', 'hal', 'hall'], ['SKORNA STÅR I ___.', 'hallen', 'halen'], ['TAVLAN HÄNGER PÅ ___.', 'väggen', 'vägen'], ['BILEN KÖR PÅ ___.', 'vägen', 'väggen']];
function vokal() {
  const [s, right, wrong] = pick(VOKAL);
  return { topic: 'LÅNGA OCH KORTA VOKALER', board: { lines: [s], after: s.replace('___', right.toUpperCase()) }, say: s.toLowerCase().replace('___', 'blank'), ans: right, opts: shuffle([right, wrong]).map((w) => ({ label: w, value: w })), hint: 'Kort vokal har dubbel konsonant efter sig (glass, tack). Lång vokal har en (glas, tak). Säg orden högt.', done: `Det ska vara ${right}.` };
}
const DUBBEL = [['katt', ['kat', 'kaat']], ['hoppa', ['hopa', 'hoopa']], ['sitta', ['sita', 'siitta']], ['komma', ['koma', 'kommma']], ['kudde', ['kude', 'kuddde']], ['boll', ['bol', 'bolll']], ['vatten', ['vaten', 'vattten']], ['flicka', ['flika', 'flickka']], ['sommar', ['somar', 'sommmar']], ['simma', ['sima', 'siimma']], ['mössa', ['mösa', 'möössa']], ['rulle', ['rule', 'ruulle']], ['tröja', ['tröjja', 'trööja']], ['glass', ['glas', 'glasss']], ['pappa', ['papa', 'paappa']]];
function dubbel() { const [right, wrong] = pick(DUBBEL); return { topic: 'DUBBELTECKNING', board: { lines: ['VILKET ORD ÄR RÄTT STAVAT?'], after: right.toUpperCase() }, say: right, ans: right, opts: textOpts(right, wrong), hint: 'Lyssna på vokalen: är den kort skrivs konsonanten efter den dubbelt.', done: `${cap(right)} stavas så.` }; }
const SJTJ = [['sju', ['skju', 'schu'], 'DET FINNS ___ DAGAR I EN VECKA.'], ['sjuk', ['skjuk', 'stjuk'], 'NÄR MAN HAR FEBER ÄR MAN ___.'], ['sjö', ['skjö', 'schö'], 'VI BADAR I EN ___.'], ['skjorta', ['sjorta', 'schorta'], 'PAPPA HAR EN RANDIG ___.'],
  ['stjärna', ['sjärna', 'skjärna'], 'EN ___ LYSER PÅ HIMLEN.'], ['sked', ['sjed', 'sched'], 'JAG ÄTER SOPPA MED EN ___.'], ['tjugo', ['kjugo', 'chugo'], 'TIO PLUS TIO ÄR ___.'], ['kjol', ['tjol', 'chol'], 'HON HAR EN RÖD ___.'],
  ['tjock', ['kjock', 'sjock'], 'BOKEN ÄR TUNN, KUDDEN ÄR ___.'], ['köpa', ['tjöpa', 'chöpa'], 'JAG VILL ___ EN GLASS.'], ['jord', ['gjord', 'djord'], 'BLOMMAN VÄXER I ___.'], ['ljus', ['jus', 'djus'], 'TÄND ETT ___!'],
  ['hjärta', ['järta', 'gjärta'], 'MITT ___ SLÅR FORT.'], ['djur', ['jur', 'hjur'], 'EN KATT ÄR ETT ___.'], ['göra', ['jöra', 'gjöra'], 'VAD SKA VI ___ PÅ RASTEN?']];
function sjtj() { const [right, wrong, s] = pick(SJTJ); return { topic: 'SJ-, TJ- OCH J-LJUD', board: { lines: [s, 'VILKET ÄR RÄTT STAVAT?'], after: s.replace('___', right.toUpperCase()) }, say: s.toLowerCase().replace('___', right), ans: right, opts: textOpts(right, wrong), hint: 'Samma ljud kan stavas på olika sätt. Vilket ord har du sett förut?', done: `${cap(right)} stavas så.` }; }
const NGNK = [['sång', ['sångg', 'sonng'], 'VI SJUNGER EN ___.'], ['lång', ['långg', 'lonng'], 'GIRAFFEN HAR EN ___ HALS.'], ['ring', ['rinng', 'rigng'], 'HON HAR EN ___ PÅ FINGRET.'], ['gunga', ['gungga', 'gunnga'], 'BARNEN ___ PÅ LEKPLATSEN.'],
  ['bank', ['bangk', 'bannk'], 'PENGARNA FINNS PÅ ___.'], ['tänka', ['tängka', 'tännka'], 'JAG MÅSTE ___ EFTER.'], ['bänk', ['bängk', 'bännk'], 'VI SITTER PÅ EN ___.'], ['sjunka', ['sjungka', 'sjunnka'], 'STENEN KOMMER ATT ___.'],
  ['finger', ['fingger', 'finnger'], 'MITT ___ GÖR ONT.'], ['ängel', ['änngel', 'ängl'], 'EN ___ HAR VINGAR.'], ['tunga', ['tungga', 'tunnga'], 'JAG RÄCKER UT ___.']];
function ngnk() { const [right, wrong, s] = pick(NGNK); return { topic: 'NG OCH NK', board: { lines: [s, 'VILKET ÄR RÄTT STAVAT?'], after: s.split('___').join(right.toUpperCase()) }, say: s.toLowerCase().split('___').join(right), ans: right, opts: textOpts(right, wrong), hint: 'Ng-ljudet stavas ng (sång). Före k blir det bara n (bank).', done: `${cap(right)} stavas så.` }; }
const SLUT = [['VAD HETER DU', '?'], ['JAG HETER {P}', '.'], ['AKTA DIG', '!'], ['VAR BOR DU', '?'], ['VI HAR RAST NU', '.'], ['HJÄLP', '!'], ['VILL DU LEKA', '?'], ['SOLEN SKINER', '.'], ['VAD GOTT DET ÄR', '!'], ['HUR GAMMAL ÄR DU', '?'], ['KATTEN SOVER I SOFFAN', '.'], ['NÄR BÖRJAR SKOLAN', '?']];
const TECKEN = { '.': 'Punkt .', '?': 'Frågetecken ?', '!': 'Utropstecken !' };
function slut() { const [s0, right] = pick(SLUT), s = s0.replace('{P}', CTX().me.toUpperCase()); return { topic: 'PUNKT, FRÅGETECKEN, UTROPSTECKEN', board: { lines: [`${s} _`, 'VAD SKA STÅ I SLUTET?'], after: s + right }, say: s.toLowerCase(), ans: right, opts: ['.', '?', '!'].map((t) => ({ label: TECKEN[t], value: t })), hint: 'En fråga slutar med frågetecken. Något man ropar eller känner starkt slutar med utropstecken. Annars punkt.', done: `Det ska vara ${TECKEN[right].toLowerCase()}.` }; }
const PLATSER = ['Pixelstaden', 'Göteborg', 'Stockholm', 'Sverige', 'Malmö'];
function storBokstav() {
  const c = CTX(), kids = [...new Set(c.kids.map((k) => cap(String(k).trim().split(/\s+/)[0].toLowerCase())))], N = pick(kids), M = pick(kids.filter((k) => k !== N)) || 'Leo', Pl = pick(PLATSER), t = rnd(0, 2);
  const right = t === 0 ? `${N} bor i ${Pl}.` : t === 1 ? `${N} och ${M} leker i parken.` : `Vi åker till ${Pl} på lördag.`;
  const wrong = t === 0 ? [`${N.toLowerCase()} bor i ${Pl}.`, `${N} bor i ${Pl.toLowerCase()}.`, `${N} bor i ${Pl}`] : t === 1 ? [`${N} och ${M.toLowerCase()} leker i parken.`, `${N.toLowerCase()} och ${M} leker i parken.`, `${N} och ${M} leker i parken`] : [`vi åker till ${Pl} på lördag.`, `Vi åker till ${Pl.toLowerCase()} på lördag.`, `Vi åker till ${Pl} på Lördag.`];
  return { topic: 'STOR BOKSTAV', board: { lines: ['VILKEN MENING ÄR RÄTT SKRIVEN?', 'TITTA PÅ KNAPPARNA.'], after: 'RÄTT!' }, say: 'Vilken mening är rätt skriven?', ans: right, opts: textOpts(right, wrong, 3), hint: 'Meningen börjar med stor bokstav och slutar med punkt. Namn och städer har stor bokstav, men inte veckodagar.', done: `${right}` };
}
const ETT = ['äpple', 'hus'];
const WORDS = { N: ['hund', 'katt', 'boll', 'bok', 'hus', 'cykel', 'äpple', 'glass', 'fotboll', 'skolgård', 'frukost', 'regnbåge', 'kompis'], V: ['springer', 'hoppar', 'äter', 'sover', 'läser', 'simmar', 'dansar', 'sjunger', 'tänker', 'cyklar', 'väntar', 'klättrar', 'skrattar'], A: ['glad', 'stor', 'liten', 'snabb', 'röd', 'mjuk', 'kall', 'rolig', 'försiktig', 'nyfiken', 'blöt', 'modig', 'trött'] };
export const CLS = { N: { label: 'Substantiv', sub: 'en eller ett …' }, V: { label: 'Verb', sub: 'jag …' }, A: { label: 'Adjektiv', sub: 'hur något är' } };
function ordklass(keys) {
  return () => {
    const cls = pick(keys), w = pick(WORDS[cls]);
    const done = cls === 'N' ? `”${ETT.includes(w) ? 'ett' : 'en'} ${w}” låter rätt, så det är ett substantiv.` : cls === 'V' ? `”Jag ${w}” låter rätt, så det är ett verb.` : `”En ${w} hund” låter rätt, så det är ett adjektiv.`;
    const hint = keys.length === 2 ? 'Testa båda: ”en …” och ”jag …”. Vilken låter rätt?' : 'Testa alla tre: ”en …”, ”jag …” och ”en … hund”. Vilken låter rätt?';
    return { topic: keys.length === 2 ? 'SUBSTANTIV ELLER VERB' : 'TRE ORDKLASSER', board: { big: w.toUpperCase(), lines: ['VILKEN ORDKLASS?'], after: CLS[cls].label.toUpperCase() }, say: `${w}. Vilken ordklass är det?`, ans: cls, opts: keys.map((k) => ({ label: CLS[k].label, sub: CLS[k].sub, value: k })), hint, done };
  };
}
const MENING = [['HUNDEN ___ EFTER BOLLEN.', 'springer', ['blå', 'stol']], ['JAG ÄTER EN ___.', 'glass', ['springa', 'glad']], ['SOLEN ___ PÅ HIMLEN.', 'lyser', ['bord', 'kall']], ['VI ___ I SKOLAN.', 'läser', ['gul', 'fönster']],
  ['KATTEN SOVER I ___.', 'sängen', ['hoppar', 'snabb']], ['{P} HAR EN ___ CYKEL.', 'röd', ['simmar', 'äpple']], ['FÅGELN ___ HÖGT.', 'flyger', ['lampa', 'mjuk']], ['PAPPA ___ MAT I KÖKET.', 'lagar', ['blå', 'stol']],
  ['MIN KOMPIS ÄR ___ IDAG.', 'glad', ['springer', 'boll']], ['VI SPELAR ___ PÅ RASTEN.', 'fotboll', ['äter', 'trött']]];
function mening() { const [s0, right, wrong] = pick(MENING), s = s0.replace('{P}', CTX().me.toUpperCase()); return { topic: 'MENINGAR', board: { lines: [s, 'VILKET ORD PASSAR?'], after: s.replace('___', right.toUpperCase()) }, say: s.toLowerCase().replace('___', 'blank'), ans: right, opts: textOpts(right, wrong), hint: 'Läs meningen med varje ord. Vilken blir en riktig mening?', done: `${cap(s.toLowerCase().replace('___', right))}` }; }
// läsförståelse: korta berättelser med klassens egna namn
const LAS = [
  (A) => [`${A} GÅR TILL GLASSTÅNDET OCH KÖPER EN JORDGUBBSGLASS FÖR 12 KR.`, `Vilken glass köper ${cap(A.toLowerCase())}?`, 'Jordgubb', ['Choklad', 'Pistage']],
  (A) => [`${A} HAR EN HUND SOM HETER BAMSE. BAMSE ÄLSKAR ATT SPRINGA I PARKEN.`, 'Vad heter hunden?', 'Bamse', [cap(A.toLowerCase()), 'Parken']],
  (A) => [`DET REGNAR UTE. ${A} TAR PÅ SIG GUMMISTÖVLAR OCH EN GUL REGNJACKA.`, 'Vilken färg har regnjackan?', 'Gul', ['Röd', 'Blå']],
  (A) => [`PÅ RASTEN SPELAR ${A} FOTBOLL OCH GÖR TRE MÅL.`, 'Hur många mål blir det?', '3', ['2', '5']],
  (A) => [`${A} ÅKER RULLTRAPPAN TILL PLAN 2 OCH KÖPER EN NALLE I LEKSAKSLÅDAN.`, 'Var köps nallen?', 'I Leksakslådan', ['I skobutiken', 'I klädaffären']],
  (A) => [`${A} VAKNAR KLOCKAN SJU, ÄTER GRÖT TILL FRUKOST OCH CYKLAR TILL SKOLAN.`, 'Vad blir det till frukost?', 'Gröt', ['Glass', 'Pizza']],
  (A) => [`${A} VAKNAR KLOCKAN SJU, ÄTER GRÖT TILL FRUKOST OCH CYKLAR TILL SKOLAN.`, 'Hur kommer man till skolan?', 'Cyklar', ['Går', 'Åker buss']],
  (A) => [`${A} HAR TAPPAT SIN MÖSSA. DEN LIGGER UNDER BÄNKEN I KLASSRUMMET.`, 'Var ligger mössan?', 'Under bänken', ['I hallen', 'På tavlan']],
  (A, T) => [`${T} LÄSER EN BOK OM EN GRÖN DRAKE SOM INTE KAN FLYGA.`, 'Vad kan inte draken?', 'Flyga', ['Simma', 'Springa']],
  (A, T) => [`${T} LÄSER EN BOK OM EN GRÖN DRAKE SOM INTE KAN FLYGA.`, 'Vilken färg har draken?', 'Grön', ['Röd', 'Lila']],
  (A) => [`${A} PLANTERAR TRE SOLROSOR OCH VATTNAR DEM VARJE DAG. EFTER EN VECKA HAR DE VUXIT.`, 'Hur många solrosor blir det?', 'Tre', ['Två', 'Fem']],
  (A, T, B) => [`${A} OCH ${B} BAKAR KAKOR. ${B} HÄLLER I SOCKER OCH ${A} RÖR I DEGEN.`, 'Vem häller i sockret?', cap(B.toLowerCase()), [cap(A.toLowerCase()), 'Fröken']],
];
function las() {
  const c = CTX(), A = pick(c.kids), B = pick(c.kids.filter((k) => k !== A)), [text, q, right, wrong] = pick(LAS)(A.toUpperCase(), c.teacher.toUpperCase(), B.toUpperCase());
  return { topic: 'LÄSFÖRSTÅELSE', board: { lines: [text, q.toUpperCase()], after: right.toUpperCase() }, say: `${text.toLowerCase()} ${q}`, ans: right, opts: textOpts(right, wrong), hint: 'Läs berättelsen på tavlan en gång till. Svaret står där.', done: `${right}.` };
}

// ======================= ENGELSKA =======================
const EN = {
  farger: [['röd', 'red'], ['blå', 'blue'], ['grön', 'green'], ['gul', 'yellow'], ['svart', 'black'], ['vit', 'white'], ['rosa', 'pink'], ['lila', 'purple'], ['orange', 'orange'], ['brun', 'brown'], ['grå', 'grey']],
  siffror: [['ett', 'one'], ['två', 'two'], ['tre', 'three'], ['fyra', 'four'], ['fem', 'five'], ['sex', 'six'], ['sju', 'seven'], ['åtta', 'eight'], ['nio', 'nine'], ['tio', 'ten'], ['elva', 'eleven'], ['tolv', 'twelve'], ['tretton', 'thirteen'], ['fjorton', 'fourteen'], ['femton', 'fifteen'], ['sexton', 'sixteen'], ['sjutton', 'seventeen'], ['arton', 'eighteen'], ['nitton', 'nineteen'], ['tjugo', 'twenty']],
  djur: [['hund', 'dog'], ['katt', 'cat'], ['häst', 'horse'], ['ko', 'cow'], ['gris', 'pig'], ['fågel', 'bird'], ['fisk', 'fish'], ['kanin', 'rabbit'], ['mus', 'mouse'], ['får', 'sheep'], ['anka', 'duck'], ['björn', 'bear'], ['lejon', 'lion'], ['apa', 'monkey'], ['elefant', 'elephant']],
  klader: [['tröja', 'sweater'], ['byxor', 'trousers'], ['skor', 'shoes'], ['jacka', 'jacket'], ['strumpor', 'socks'], ['klänning', 'dress'], ['kjol', 'skirt'], ['mössa', 'hat'], ['huvud', 'head'], ['hand', 'hand'], ['fot', 'foot'], ['öga', 'eye'], ['öra', 'ear'], ['näsa', 'nose'], ['mun', 'mouth'], ['ben', 'leg'], ['hår', 'hair']],
  mat: [['äpple', 'apple'], ['banan', 'banana'], ['bröd', 'bread'], ['mjölk', 'milk'], ['ost', 'cheese'], ['ägg', 'egg'], ['glass', 'ice cream'], ['vatten', 'water'], ['smörgås', 'sandwich'], ['apelsin', 'orange'], ['kaka', 'cake'], ['jordgubbe', 'strawberry']],
  dagar: [['måndag', 'Monday'], ['tisdag', 'Tuesday'], ['onsdag', 'Wednesday'], ['torsdag', 'Thursday'], ['fredag', 'Friday'], ['lördag', 'Saturday'], ['söndag', 'Sunday'], ['hej', 'hello'], ['hej då', 'goodbye'], ['tack', 'thank you'], ['god morgon', 'good morning'], ['god natt', 'good night'], ['hur mår du?', 'how are you?']],
};
function engelska(key, topic) {
  return () => {
    const list = EN[key], [sv, en] = pick(list), toEn = Math.random() < 0.55;
    const others = list.filter((p) => p[0] !== sv && p[1] !== en).map((p) => (toEn ? p[1] : p[0]));
    return toEn
      ? { topic, board: { big: sv.toUpperCase(), lines: ['PÅ ENGELSKA?'], after: en.toUpperCase() }, say: sv, ans: en, opts: textOpts(en, others), hint: 'Tänk på en sång, ett spel eller en film där ordet finns.', done: `${cap(sv)} heter ${en} på engelska.` }
      : { topic, board: { big: en.toUpperCase(), lines: ['VAD BETYDER DET PÅ SVENSKA?'], after: sv.toUpperCase() }, say: en, lang: 'en-GB', ans: sv, opts: textOpts(sv, others), hint: 'Tryck på Läs upp och lyssna på ordet.', done: `${cap(en)} betyder ${sv}.` };
  };
}

// ======================= NO OCH SO =======================
const ARSTID = [['Vilken årstid kommer efter vintern?', 'Våren', 'Sommaren', 'Hösten'], ['Vilken månad kommer efter mars?', 'April', 'Maj', 'Februari'], ['Hur många månader har ett år?', '12', '10', '7'],
  ['När faller löven från träden?', 'På hösten', 'På våren', 'På sommaren'], ['Vilken månad är det julafton?', 'December', 'November', 'Januari'], ['Hur många dagar har en vecka?', '7', '5', '10'],
  ['Vilken månad börjar året med?', 'Januari', 'Mars', 'December'], ['När firar vi midsommar?', 'I juni', 'I december', 'I mars'], ['Vilken årstid är kallast?', 'Vintern', 'Sommaren', 'Våren'],
  ['Vilken dag kommer efter onsdag?', 'Torsdag', 'Tisdag', 'Fredag'], ['Vilken månad kommer före juni?', 'Maj', 'Juli', 'April']];
const NATUR = [['Vilket djur ger oss mjölk?', 'Kon', 'Grisen', 'Hönan'], ['Vad heter en hästunge?', 'Föl', 'Kalv', 'Lamm'], ['Vad heter en kounge?', 'Kalv', 'Föl', 'Kattunge'], ['Vilket djur sover hela vintern?', 'Björnen', 'Älgen', 'Räven'],
  ['Vad behöver en växt för att växa?', 'Vatten och ljus', 'Bara sand', 'Mörker'], ['Vilket djur lägger ägg?', 'Hönan', 'Katten', 'Kon'], ['Vad heter en fårunge?', 'Lamm', 'Föl', 'Kalv'],
  ['Vad blir ett grodyngel när det växer upp?', 'En groda', 'En fisk', 'En fjäril'], ['Vad blir en larv?', 'En fjäril', 'En spindel', 'En mask'], ['Vilket träd har barr?', 'Granen', 'Björken', 'Eken'],
  ['Vilken fågel kan inte flyga?', 'Pingvinen', 'Kråkan', 'Måsen'], ['Hur många ben har en spindel?', '8', '6', '4']];
const TRAFIK = [['Vad betyder rött ljus?', 'Stanna', 'Gå', 'Spring'], ['Var går man över gatan?', 'Vid övergångsstället', 'Mitt i kurvan', 'Bakom bussen'], ['Vad har man på huvudet när man cyklar?', 'Cykelhjälm', 'Keps', 'Ingenting'],
  ['Vilken sida av vägen cyklar man på i Sverige?', 'Höger', 'Vänster', 'Mitten'], ['Vad gör man innan man går över gatan?', 'Tittar åt båda hållen', 'Blundar', 'Springer direkt'],
  ['Vad har man på sig för att synas i mörkret?', 'Reflex', 'Solglasögon', 'Mössa'], ['Vad betyder grön gubbe i trafikljuset?', 'Du får gå', 'Stanna', 'Vänta'],
  ['Var går man om det inte finns trottoar?', 'Längs vänsterkanten', 'Mitt i vägen', 'Längs högerkanten']];
const KROPP = [['Hur många gånger om dagen borstar man tänderna?', 'Två', 'En', 'Fem'], ['Vilket organ pumpar runt blodet?', 'Hjärtat', 'Magen', 'Lungorna'], ['Vad andas vi med?', 'Lungorna', 'Hjärtat', 'Magen'],
  ['Vad luktar du med?', 'Näsan', 'Örat', 'Handen'], ['Vad gör man innan man äter?', 'Tvättar händerna', 'Springer', 'Sover'], ['Vad är bra för kroppen?', 'Frukt och grönsaker', 'Bara godis', 'Bara läsk'],
  ['Hur många sinnen har vi?', 'Fem', 'Tre', 'Tio'], ['Vad behöver kroppen när den är trött?', 'Sömn', 'Godis', 'Läsk'], ['Vad skyddar hjärnan?', 'Skallen', 'Magen', 'Knät']];

// ======================= NIVÅERNA =======================
export const LEVELS = {
  matte: [
    { name: 'Tiokompisar', gen: tio }, { name: 'Tvillingar', gen: tvilling }, { name: 'Plus över tiotalet', gen: plus20 }, { name: 'Minus över tiotalet', gen: minus20 },
    { name: 'Dubbelt och hälften', gen: dubbelt }, { name: 'Udda och jämnt', gen: udda }, { name: 'Tiotal och ental', gen: tiotal }, { name: 'Plus och minus till 100', gen: hundra },
    { name: 'Pengar och växel', gen: pengar }, { name: 'Dela lika', gen: dela }, { name: 'Mäta: cm, m, kg, liter', gen: mata }, { name: 'Former och kroppar', gen: former },
    { name: 'Stapeldiagram', gen: diagram }, { name: 'Bråk: halv, tredjedel, fjärdedel', gen: brak }, { name: 'Tabellerna 2, 5 och 10', gen: tabell2510 },
  ],
  klocka: [{ name: 'Hel och halv', gen: () => klocka(1) }, { name: 'Kvart över och kvart i', gen: () => klocka(2) }, { name: 'Fem minuter i taget', gen: () => klocka(3) }, { name: 'Digital tid', gen: digital }],
  svenska: [
    { name: 'Rim', gen: rim }, { name: 'Motsatsord', gen: motsats }, { name: 'Alfabetisk ordning', gen: alfa }, { name: 'Sammansatta ord', gen: sammansatt },
    { name: 'Långa och korta vokaler', gen: vokal }, { name: 'Dubbelteckning', gen: dubbel }, { name: 'Stavning: sj-, tj- och j-ljud', gen: sjtj }, { name: 'Stavning: ng och nk', gen: ngnk },
    { name: 'Punkt, frågetecken, utropstecken', gen: slut }, { name: 'Stor bokstav', gen: storBokstav }, { name: 'Substantiv eller verb', gen: ordklass(['N', 'V']) }, { name: 'Tre ordklasser', gen: ordklass(['N', 'V', 'A']) },
    { name: 'Meningar', gen: mening }, { name: 'Läsförståelse', gen: las },
  ],
  engelska: [
    { name: 'Färger', gen: engelska('farger', 'COLOURS - FÄRGER') }, { name: 'Siffror 1–20', gen: engelska('siffror', 'NUMBERS - SIFFROR') }, { name: 'Djur', gen: engelska('djur', 'ANIMALS - DJUR') },
    { name: 'Kläder och kroppen', gen: engelska('klader', 'CLOTHES AND BODY') }, { name: 'Mat', gen: engelska('mat', 'FOOD - MAT') }, { name: 'Veckodagar och hälsningar', gen: engelska('dagar', 'DAYS AND GREETINGS') },
  ],
  no: [
    { name: 'Årstider och månader', gen: quiz('ÅRSTIDER OCH MÅNADER', ARSTID) }, { name: 'Djur och natur', gen: quiz('DJUR OCH NATUR', NATUR) },
    { name: 'Trafikregler', gen: quiz('TRAFIKREGLER', TRAFIK) }, { name: 'Kroppen och hälsa', gen: quiz('KROPPEN OCH HÄLSA', KROPP) },
  ],
};
