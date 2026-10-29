// HEJA HEJA – cheerleadingbutiken i Galleria Stjärnan (Pixelskolan, Carl 2026-10-29: "en cheerleadning butik där man kan
// köpa dräkt, överdel, underdel eller hel dräkt, man ska kunna köpa pom poms och tiara att ha på huvudet och cheerleadning
// skor … massa saker man kan köpa att hålla i händer eller ha på huvudet. dräkterna ska kunna ha olika symboler på magen
// för de olika klubbarna, hjärtan, stjärnor, blixtar osv").
// Carl samma kväll: "fler detaljer och outfits … ställ ut många fler skyltdockor … man ser inte så tydligt när man tar på
// sig dräkten, gör så att man bara får cheerdräkten på sig … flikar med toppar och botten, men låt den börja på hela
// cheerdräkter … större när man designar … ett lag som kör cheerleading i affären: bygga en pyramid tillsammans och stå
// i rad och heja, göra det i synk … en klassisk hejasång … mer glitter och en scen där man kan heja och en lampa som
// kommer på en".
// Samma butiksgränssnitt som DRÖMLAND (bling.js): enter/exit/update/draw/down/move/up/key, kameran följer figuren (RW).
//   vänster:  DRÄKTER på galgar, fem skyltdockor i hela dräkter och bordet DESIGNA DRÄKT
//   mitten:   dörren UT, spegeln, cheermattan där LAGET gör sin uppvisning (rad, ramsa, pyramid – i takt med hejasången
//             som spelas med WebAudio), kassan och pokalerna
//   höger:    POMPOMER, HUVUDET, I HÄNDERNA, skohyllan, SCENEN (strålkastaren tänds när man står där) och podiet med
//             HELA DRÄKTER på skyltdockor
// Allt syns på figuren: tops.js cheer/cheerLong/cheerCrop + klubbarnas tryck, bottoms.js cheerSkirt/cheerStripe/cheerDress/
// cheerShoes, acc.js rosetten, diademen och tiarorna, people.js look.hand (det man håller i) och bildruta 10/11 (armarna upp).
// När man tar på sig något härifrån tas väskan, halsduken, förklädet och mobilen av (bara cheerdräkten syns).
import { Pix, SMALL, BIG, textW, text as pixText, ctxText, mix, mul, hash, bayer } from './sf/js/core/floor-pix.js';
import { drawPerson, personSprite, makeLookRich, HAND_ITEMS } from './sf/js/core/people.js';
import { openModal, closeModal, esc, toast } from './sf/js/core/ui.js';
import { itemById, lookForItem, lookWithoutSlot, isWorn } from './sf/js/data/wardrobe.js';
import { CHEER_TOPS } from './sf/js/data/wardrobe-tops.js';
import { fmt } from './sf/js/game.js';
import { play, audioContext, isMuted } from './sf/js/core/sound.js';
import { setDuck } from './sf/js/core/music.js';
import { openBuy, figure } from './sf/js/scenes/klader/buy.js';

const W = 384, H = 216, WALL = 90, RW = 720;
const WALK = [1, 3, 2, 3];
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
const hexI = (h) => parseInt(String(h).slice(1), 16);
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- klubbarna: symbolen på magen och klubbens färger (huvudfärg, kant, symbol) ----------
export const CLUBS = [
  { id: 'heart', name: 'Hjärtana', icon: '💖', c: ['#e0457e', '#f4f1ea', '#f4f1ea'] },
  { id: 'star', name: 'Stjärnorna', icon: '⭐', c: ['#1d51a0', '#f6d02f', '#f6d02f'] },
  { id: 'bolt', name: 'Blixtarna', icon: '⚡', c: ['#2b2a33', '#f6d02f', '#f6d02f'] },
  { id: 'crown', name: 'Kronorna', icon: '👑', c: ['#8e5bd1', '#f0b429', '#f0b429'] },
  { id: 'paw', name: 'Tassarna', icon: '🐾', c: ['#d9433b', '#f4f1ea', '#f4f1ea'] },
  { id: 'moon', name: 'Månarna', icon: '🌙', c: ['#2d3a5c', '#c4c9d4', '#f6e7a0'] },
  { id: 'flame', name: 'Flammorna', icon: '🔥', c: ['#e07a2e', '#2b2a33', '#d83a3a'] },
  { id: 'diamond', name: 'Diamanterna', icon: '💎', c: ['#2aa39a', '#f4f1ea', '#bfe6f6'] },
  { id: 'flower', name: 'Blommorna', icon: '🌸', c: ['#f2d680', '#46a35a', '#f07ab0'] },
  { id: 'butterfly', name: 'Fjärilarna', icon: '🦋', c: ['#6fb4e8', '#f4f1ea', '#f07ab0'] },
  { id: 'rainbowArc', name: 'Regnbågarna', icon: '🌈', c: ['#f4f1ea', '#3a7bd5', '#f4f1ea'] },
];
const CLUB_BY = Object.fromEntries(CLUBS.map((c) => [c.id, c]));
const COLORS = [['rosa', '#e0457e'], ['ljusrosa', '#f5a3c7'], ['röd', '#d9433b'], ['orange', '#e07a2e'], ['gul', '#f6d02f'], ['grön', '#46a35a'], ['turkos', '#2aa39a'], ['ljusblå', '#6fb4e8'],
  ['blå', '#1d51a0'], ['marinblå', '#2d3a5c'], ['lila', '#8e5bd1'], ['svart', '#2b2a33'], ['vit', '#f4f1ea'], ['guld', '#f0b429'], ['silver', '#c4c9d4']];
const colorName = (h) => (COLORS.find((c) => c[1] === h) || ['egen'])[0];
// ---------- plaggen: tre toppar, två kjolar och den hela dräkten (kjoldelen sitter ihop med toppen) ----------
const TOPS = Object.fromEntries(CHEER_TOPS.map(([m, id, name, price]) => [m, { id, name: name.replace(/­/g, ''), price }]));
const TOP_NAMES = { cheer: 'Ärmlös', cheerLong: 'Långärmad', cheerCrop: 'Kort topp' };
const BOTTOMS = { cheerSkirt: { id: 'bottom-cheerSkirt', name: 'Veckad kjol', short: 'Veckad', price: 199 }, cheerStripe: { id: 'bottom-cheerStripe', name: 'Randig kjol', short: 'Randig', price: 229 }, cheerDress: { id: 'bottom-cheerDress', name: 'Hel dräkt (kjoldelen)', short: 'Hel dräkt', price: 249 } };
const SYMBOL_PRICE = 50;
const topId = (model, club) => (club ? `${TOPS[model].id}-${club.toLowerCase()}` : TOPS[model].id);
// det som tas av när man tar på sig något cheerigt (det täcker dräkten) – plaggen ligger kvar i garderoben
const strip = (L) => ({ ...L, bag: null, neck: 'none', apron: false, mobil: null, phones: false });
// den kompletta looken för en dräkt: { top, bottom, club, c: [huvud, kant, symbol] } (+ skor, huvudsak och pompomer)
function suitLook(s) {
  const [main, trim, sym] = s.c, look = {};
  if (s.top) Object.assign(look, { top: s.top, topPrint: s.club || 'none', shirt: main, accent: trim, print2: sym });
  if (s.bottom === 'cheerDress') Object.assign(look, { bottom: 'cheerDress', bottomPrint: 'none', ...(s.top ? {} : { shirt: main, accent: trim }) });
  else if (s.bottom) Object.assign(look, { bottom: s.bottom, bottomPrint: 'none', pants: main, pants2: trim });
  if (s.shoes) Object.assign(look, { shoeType: 'cheerShoes', shoes: '#f4f1ea', shoes2: main === '#f4f1ea' ? trim : main });
  if (s.hat) { const it = itemById(s.hat); if (it) Object.assign(look, it.look, s.cap ? { cap: s.cap } : {}); }
  if (s.pom) look.hand = ['pompoms', ...s.pom];
  return look;
}
// ---------- HELA DRÄKTER: kompletta outfits (topp, kjol eller hel dräkt, cheerskor, något på huvudet och pompomer) ----------
export const OUTFITS = [
  { id: 'hjartana', name: 'Hjärtana', club: 'heart', top: 'cheer', bottom: 'cheerSkirt', c: ['#e0457e', '#f4f1ea', '#f4f1ea'], hat: 'hat-cheerbow', cap: '#e0457e', pom: ['#e0457e', '#f4f1ea'] },
  { id: 'stjarnorna', name: 'Stjärnorna', club: 'star', top: 'cheerLong', bottom: 'cheerSkirt', c: ['#1d51a0', '#f6d02f', '#f6d02f'], hat: 'hat-starband', cap: '#1d51a0', pom: ['#f6d02f', '#1d51a0'] },
  { id: 'blixtarna', name: 'Blixtarna', club: 'bolt', top: 'cheerCrop', bottom: 'cheerStripe', c: ['#2b2a33', '#f6d02f', '#f6d02f'], hat: 'hat-cheerbow', cap: '#f6d02f', pom: ['#f6d02f', '#2b2a33'] },
  { id: 'diamanterna', name: 'Diamanterna', club: 'diamond', top: 'cheerLong', bottom: 'cheerDress', c: ['#2aa39a', '#f4f1ea', '#bfe6f6'], hat: 'hat-hearttiara', pom: ['#2aa39a', '#f4f1ea'] },
  { id: 'kronorna', name: 'Kronorna', club: 'crown', top: 'cheer', bottom: 'cheerStripe', c: ['#8e5bd1', '#f0b429', '#f0b429'], hat: 'hat-tiara', pom: ['#8e5bd1', '#f0b429'] },
  { id: 'fjarilarna', name: 'Fjärilarna', club: 'butterfly', top: 'cheer', bottom: 'cheerDress', c: ['#6fb4e8', '#f4f1ea', '#f07ab0'], hat: 'hat-heartband', cap: '#f07ab0', pom: ['#6fb4e8', '#f07ab0'] },
  { id: 'tassarna', name: 'Tassarna', club: 'paw', top: 'cheerCrop', bottom: 'cheerSkirt', c: ['#d9433b', '#f4f1ea', '#f4f1ea'], hat: 'hat-cheerbow', cap: '#f4f1ea', pom: ['#d9433b', '#f4f1ea'] },
  { id: 'manarna', name: 'Månarna', club: 'moon', top: 'cheerLong', bottom: 'cheerSkirt', c: ['#2d3a5c', '#c4c9d4', '#f6e7a0'], hat: 'hat-glitterband', cap: '#c4c9d4', pom: ['#c4c9d4', '#2d3a5c'] },
  { id: 'flammorna', name: 'Flammorna', club: 'flame', top: 'cheer', bottom: 'cheerSkirt', c: ['#e07a2e', '#2b2a33', '#d83a3a'], hat: 'hat-cheerbow', cap: '#2b2a33', pom: ['#e07a2e', '#2b2a33'] },
  { id: 'blommorna', name: 'Blommorna', club: 'flower', top: 'cheerCrop', bottom: 'cheerStripe', c: ['#f2d680', '#46a35a', '#f07ab0'], hat: 'hat-glitterband', cap: '#46a35a', pom: ['#f2d680', '#46a35a'] },
  { id: 'regnbagarna', name: 'Regnbågarna', club: 'rainbowArc', top: 'cheerLong', bottom: 'cheerStripe', c: ['#f4f1ea', '#3a7bd5', '#f4f1ea'], hat: 'hat-starband', cap: '#3a7bd5', pom: ['#3a7bd5', '#f6d02f'] },
  { id: 'stjarngala', name: 'Stjärnorna gala', club: 'star', top: 'cheer', bottom: 'cheerDress', c: ['#1d51a0', '#f4f1ea', '#f6d02f'], hat: 'hat-startiara', pom: ['#1d51a0', '#f4f1ea'] },
  { id: 'hjartglitter', name: 'Hjärtana glitter', club: 'heart', top: 'cheerLong', bottom: 'cheerDress', c: ['#f5a3c7', '#e0457e', '#e0457e'], hat: 'hat-hearttiara', pom: ['#f5a3c7', '#f4f1ea'] },
  { id: 'hejalaget', name: 'HEJA HEJA-laget', club: 'star', top: 'cheerLong', bottom: 'cheerSkirt', c: ['#e0457e', '#f4f1ea', '#f6d02f'], hat: 'hat-cheerbow', cap: '#f4f1ea', pom: ['#e0457e', '#f6d02f'] },
].map((o) => ({ ...o, shoes: true }));
const OUTFIT_DISCOUNT = 0.85;   // hela dräkten: 15 % billigare än delarna var för sig

// ---------- sakerna man håller i händerna (people.js HAND_ITEMS) ----------
const HAND_SHOP = [['megafon', 129], ['flagga', 89], ['skylt', 79], ['ballong', 49], ['band', 119], ['stav', 99], ['trollstav', 99], ['skumhand', 69], ['lysstavar', 59], ['pokal', 299], ['flaska', 39]];
const POMPOM_PRICE = 149;
const handColors = (k) => { const H = HAND_ITEMS[k]; if (!H) return 0; if (H.two) return 2; const s = H.f[2].join(''); return (/[aAq]/.test(s) ? 1 : 0) + (/[bB]/.test(s) ? 1 : 0); };
const HAND_DEF = { megafon: ['#e0457e', '#f4f1ea'], flagga: ['#1d51a0', '#f6d02f'], skylt: ['#e0457e', '#f4f1ea'], ballong: ['#d9433b', '#f4f1ea'], band: ['#8e5bd1', '#f4f1ea'], skumhand: ['#1d51a0', '#f4f1ea'], lysstavar: ['#5cff9c', '#ff5cf0'], flaska: ['#6fb4e8', '#f4f1ea'], pompoms: ['#e0457e', '#f4f1ea'] };
const GLOW = [['grön', '#5cff9c'], ['rosa', '#ff5cf0'], ['blå', '#5cc8ff'], ['gul', '#fff05c'], ['orange', '#ffa04c'], ['lila', '#b27cff']];
// huvudet och skorna: spelets plagg, provas i klädaffärens provdialog
const CATS = {
  huvud: { title: '🎀 På huvudet', ids: ['hat-cheerbow', 'hat-starband', 'hat-heartband', 'hat-glitterband', 'hat-hearttiara', 'hat-startiara', 'hat-tiara', 'hat-crown', 'hat-bow', 'hat-sweatband', 'hairacc-bowclip'] },
  skor: { title: '👟 Skor', ids: ['shoes-cheerShoes', 'shoes-sneakers', 'shoes-highTops', 'shoes-ballerina'] },
};

// ================= butiken: bakgrunden =================
const PINK = 0xe0457e, PINKL = 0xf5a3c7, PINKD = 0xa82a5a, BLUE = 0x1d51a0, BLUEL = 0x6fb4e8, BLUED = 0x0e2f66, YEL = 0xf6d02f, YELD = 0xc09a10, WHITE = 0xf8f6f0;
const DOOR = { x0: 178, x1: 206 };
const MAT = { cx: 196, cy: 150, rx: 72, ry: 24 };
const STAGE = { x0: 556, x1: 646, y0: 104, y1: 142 };   // scenens golv (där man står i strålkastaren)
const PODIUM = { x0: 656, x1: 716, y0: 104, y1: 168 };
function stamp(P, rows, x, y, pal) { rows.forEach((r, j) => [...r].forEach((ch, i) => { const c = pal[ch]; if (c !== undefined) P.px(x + i, y + j, c); })); }
function pompomBlob(P, cx, cy, r, c1, c2, seed) {   // en pompom: band i två färger med glans
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = x * x + y * y; if (d > r * r + 1 + (hash(x, y, seed) > 0.7 ? 2 : 0)) continue;
    const band = ((x * 2 + y * 3 + seed) % 3 + 3) % 3, c = band === 0 ? c2 : c1;
    P.px(cx + x, cy + y, (x + y + seed) % 5 === 0 ? mix(c, 0xffffff, 0.55) : y < 0 && x < 0 ? mix(c, 0xffffff, 0.2) : y > 1 ? mul(c, 0.8) : c);
  }
}
function star5(P, cx, cy, R, r, fill, edge) {   // en femuddig stjärna
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i & 1 ? r : R; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
  const inS = (x, y) => { let o = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) o = !o; } return o; };
  for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) if (inS(x + 0.5, y + 0.5)) P.px(cx + x, cy + y, edge && (!inS(x + 1.5, y + 0.5) || !inS(x - 0.5, y + 0.5) || !inS(x + 0.5, y + 1.5) || !inS(x + 0.5, y - 0.5)) ? edge : (x + y < -2 ? mix(fill, 0xffffff, 0.35) : fill));
}
function miniUniform(P, x, y, sh, ac, pr, club, kind = 0) {   // en dräkt på galge (11 × 20): topp med symbol + kjol
  P.line(x + 2, y + 3, x + 5, y, 0x8a929c); P.line(x + 8, y + 3, x + 5, y, 0x8a929c); P.px(x + 5, y - 1, 0x8a929c); P.px(x + 6, y - 2, 0x8a929c);
  const S = hexI(sh), A = hexI(ac), R = hexI(pr);
  for (let j = 0; j < 9; j++) for (let i = 1; i < 10; i++) { if (j === 0 && (i === 1 || i === 9 || (i > 3 && i < 7))) continue; if (kind === 2 && j > 6) continue; P.px(x + i, y + 3 + j, i === 1 ? mix(S, 0xffffff, 0.2) : i === 9 ? mul(S, 0.75) : S); }
  if (kind === 1) for (let j = 0; j < 7; j++) { P.px(x, y + 4 + j, j === 2 ? A : S); P.px(x + 10, y + 4 + j, j === 2 ? A : mul(S, 0.75)); }   // ärmarna
  P.px(x + 3, y + 3, A); P.px(x + 7, y + 3, A); P.px(x + 4, y + 4, A); P.px(x + 6, y + 4, A); if (kind !== 2) P.hl(x + 2, y + 11, 7, A);
  const SYM = { heart: ['#.#', '###', '.#.'], star: ['.#.', '###', '#.#'], bolt: ['.##', '.#.', '##.'], crown: ['#.#', '###', '###'], paw: ['#.#', '.#.', '###'], moon: ['.##', '#..', '.##'], flame: ['.#.', '##.', '###'], diamond: ['###', '###', '.#.'], flower: ['#.#', '.#.', '#.#'], butterfly: ['#.#', '###', '#.#'], rainbowArc: ['###', '#.#', '#.#'] }[club];
  if (SYM) stamp(P, SYM, x + 4, y + 6, { '#': R });
  if (club === 'rainbowArc') { P.hl(x + 4, y + 6, 3, 0xd83a4a); P.px(x + 4, y + 7, 0xf6d02f); P.px(x + 6, y + 7, 0xf6d02f); P.px(x + 4, y + 8, 0x46a35a); P.px(x + 6, y + 8, 0x46a35a); }
  for (let j = 0; j < 6; j++) for (let i = -(j >> 1); i < 11 + (j >> 1); i++) P.px(x + i, y + 12 + j, kind === 2 ? (j === 3 ? A : S) : j >= 3 && (i % 3 + 3) % 3 === 1 ? A : (i % 3 + 3) % 3 === 2 ? mul(S, 0.8) : S);
}
function paintBG() {
  const P = new Pix(RW, H);
  // väggen: ljusblå med vita lodränder och små glitterprickar, rosa list överst och en rosa panel med vita stjärnor nertill
  for (let y = 0; y < WALL; y++) for (let x = 0; x < RW; x++) {
    let c = (x % 16) < 8 ? 0xd4e6f8 : 0xe4f0fb;
    if ((x % 16 === 12 && y % 14 === 5) || (x % 16 === 4 && y % 14 === 12)) c = 0xffffff;
    if (y < 6) c = y === 5 ? PINKD : PINK; else if (y < 8) c = y === 6 ? PINKL : WHITE;
    if (y >= WALL - 20) { c = y === WALL - 20 ? WHITE : y === WALL - 19 ? YEL : (x % 24 === 0 || x % 24 === 23) ? PINKD : PINK; if (y > WALL - 19 && y < WALL - 1 && (x + y) % 24 === 6) c = mix(c, 0xffffff, 0.25); }
    if (y === WALL - 1) c = PINKD;
    P.px(x, y, c);
  }
  for (let x = 12; x < RW; x += 24) stamp(P, ['.#.', '###', '.#.'], x - 1, WALL - 11, { '#': PINKL });   // stjärnorna i panelen
  // vimplarna i taket: en lina med trekantiga flaggor i rosa, gult, blått och vitt
  const FLAG = [PINK, YEL, BLUE, WHITE];
  for (let x = 2, k = 0; x < RW - 6; x += 9, k++) {
    const sag = (xx) => 9 + Math.round(3 * Math.sin(((xx % 72) / 72) * Math.PI));
    P.px(x, sag(x), 0x6a5a7a); for (let i = 1; i < 9; i++) P.px(x + i, sag(x + i), 0x6a5a7a);
    const c = FLAG[k % 4], y0 = sag(x + 4) + 1;
    for (let j = 0; j < 6; j++) for (let i = j >> 1; i < 7 - (j >> 1); i++) P.px(x + 1 + i, y0 + j, i === (j >> 1) ? mix(c, 0xffffff, 0.3) : c);
  }
  // golvet: ljust trägolv som i en gympasal, med linjer och konfetti
  for (let y = WALL; y < H; y++) for (let x = 0; x < RW; x++) {
    const row = Math.floor((y - WALL) / 6), lx = (x + (row % 3) * 17) % 52, ly = (y - WALL) % 6;
    let c = mix(0xe8c890, 0xdcb478, hash(Math.floor((x + (row % 3) * 17) / 52), row, 5) * 0.8);
    if (ly === 0) c = mul(c, 0.86); else if (lx === 0) c = mul(c, 0.9); else if (ly === 1) c = mix(c, 0xffffff, 0.12);
    if ((x + y * 3) % 23 === 0 && ly > 1) c = mul(c, 0.95);
    P.px(x, y, c);
  }
  for (let x = 0; x < RW; x++) { P.px(x, WALL, 0x000000, 0.18); P.px(x, WALL + 1, 0x000000, 0.08); }
  for (let x = 0; x < RW; x++) if (x % 3 !== 1) P.px(x, 198, BLUE, 0.55);   // gympasalens linje
  for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i, 1, 33) * RW), y = WALL + 6 + Math.floor(hash(i, 2, 33) * (H - WALL - 8)); P.rect(x, y, 2, 1, [PINK, YEL, BLUEL, 0xffffff, PINKL][i % 5]); }   // konfetti på golvet
  // cheermattan: blå med vit kant, rosa stjärna i mitten och texten HEJA!
  for (let y = MAT.cy - MAT.ry - 1; y <= MAT.cy + MAT.ry + 1; y++) for (let x = MAT.cx - MAT.rx - 1; x <= MAT.cx + MAT.rx + 1; x++) {
    const e = ((x - MAT.cx) / MAT.rx) ** 2 + ((y - MAT.cy) / MAT.ry) ** 2; if (e > 1) continue;
    let c = e > 0.9 ? WHITE : e > 0.82 ? BLUED : (Math.floor((x - MAT.cx) / 8) + Math.floor((y - MAT.cy) / 6)) % 2 ? BLUE : mix(BLUE, BLUEL, 0.18);
    if (e > 0.62 && e < 0.66) c = mix(BLUE, 0xffffff, 0.5);
    P.px(x, y, c);
  }
  { const S2 = new Pix(40, 20); star5(S2, 20, 10, 9, 4, PINK, PINKD); const sc = S2.flush().getContext('2d').getImageData(0, 0, 40, 20).data; for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) { const i = (y * 40 + x) * 4; if (sc[i + 3]) for (const dx of [0, 1]) P.px(MAT.cx - 40 + x * 2 + dx, MAT.cy - 12 + y, (sc[i] << 16) | (sc[i + 1] << 8) | sc[i + 2]); } }   // stjärnan, bred i perspektiv
  const ht = 'HEJA!', hw = textW(SMALL, ht); pixText(P, SMALL, ht, MAT.cx - (hw >> 1), MAT.cy + 13, WHITE);
  // dörren UT med skylten HEJA HEJA ovanför (glödlampor runt skylten blinkar i draw)
  P.rect(DOOR.x0 - 3, 46, DOOR.x1 - DOOR.x0 + 6, WALL - 46, PINKD); P.rect(DOOR.x0 - 2, 47, DOOR.x1 - DOOR.x0 + 4, 1, PINKL);
  for (let y = 49; y < WALL - 1; y++) for (let x = DOOR.x0; x < DOOR.x1; x++) { let c = mix(0xbfe6f6, 0xe8f6fc, (y - 49) / 40); if (x === (DOOR.x0 + DOOR.x1) >> 1) c = PINKD; if ((x - y + 400) % 11 < 2) c = mix(c, 0xffffff, 0.6); P.px(x, y, c); }
  P.rect(183, 38, 18, 8, 0x2a8a4a); P.box(183, 38, 18, 8, 0x1a5a2a); pixText(P, SMALL, 'UT', 188, 39, 0xffffff);
  const nm = 'HEJA HEJA', tw = textW(BIG, nm, 2), nx = 192 - (tw >> 1);
  for (let y = 12; y < 35; y++) for (let x = nx - 10; x < nx + tw + 10; x++) P.px(x, y, mix(PINK, 0xf07ab0, (y - 12) / 23 + (bayer(x, y) - 0.5) * 0.1));
  P.box(nx - 10, 12, tw + 20, 23, WHITE); P.box(nx - 9, 13, tw + 18, 21, YEL);
  pixText(P, BIG, nm, nx, 19, BLUED, 1, 2); pixText(P, BIG, nm, nx, 17, WHITE, 1, 2);
  pompomBlob(P, nx - 15, 24, 5, YEL, WHITE, 3); pompomBlob(P, nx + tw + 14, 24, 5, BLUEL, WHITE, 7);
  // skyltarna på väggarna
  const plate = (x, s, c = BLUE) => { const w = textW(SMALL, s) + 10; P.rect(x, 18, w, 11, c); P.box(x, 18, w, 11, BLUED); P.hl(x + 1, 19, w - 2, mix(c, 0xffffff, 0.35)); pixText(P, SMALL, s, x + 5, 21, WHITE); return w; };
  plate(40, 'DRÄKTER'); plate(282, 'POMPOMER', PINK); plate(374, 'HUVUDET'); plate(462, 'I HÄNDERNA', PINK); plate(658, 'HELA DRÄKTER');
  // vänster: klädstången med dräkterna (tre modeller) och hyllan med vikta kjolar
  P.hl(6, 34, 132, 0xc4c9d4); P.hl(6, 35, 132, 0x80879a); P.rect(6, 33, 2, 4, 0x80879a); P.rect(136, 33, 2, 4, 0x80879a);
  CLUBS.slice(0, 10).forEach((cl, i) => miniUniform(P, 9 + i * 13, 37, ...cl.c, cl.id, i % 3));
  P.rect(6, 62, 132, 3, WHITE); P.hl(6, 65, 132, 0xa8b0bc); P.hl(6, 66, 132, 0x000000, 0.12);
  for (let k = 0; k < 11; k++) { const c = hexI(CLUBS[k].c[0]), a = hexI(CLUBS[k].c[1]), x = 9 + k * 12; P.rect(x, 57, 10, 5, c); P.hl(x, 57, 10, mix(c, 0xffffff, 0.3)); for (let i = 1; i < 10; i += 3) P.px(x + i, 60, a); }
  // spegeln till vänster om dörren, med glödlampor runt (som i en loge)
  P.rect(148, 40, 24, 48, YEL); P.box(148, 40, 24, 48, YELD); P.hl(149, 41, 22, 0xfff6c0);
  for (let y = 43; y < 85; y++) for (let x = 151; x < 169; x++) { let c = mix(0xd8eef8, 0xf6fbff, (y - 43) / 42); if ((x - y + 300) % 13 < 3) c = mix(c, 0xffffff, 0.7); P.px(x, y, c); }
  // POMPOMER: tre hyllor fulla med pompomer i alla färger
  const PC = [[PINK, WHITE], [YEL, BLUE], [BLUE, WHITE], [0x8e5bd1, YEL], [0xd9433b, WHITE], [0x46a35a, WHITE], [0x2b2a33, YEL], [0x6fb4e8, PINKL], [0xf0b429, WHITE], [0x2aa39a, PINK], [0xf5a3c7, WHITE], [0xe07a2e, 0x2b2a33]];
  for (let r = 0; r < 3; r++) {
    const sy = 42 + r * 15; P.rect(262, sy + 6, 96, 2, WHITE); P.hl(262, sy + 8, 96, 0xa8b0bc); P.hl(262, sy + 9, 96, 0x000000, 0.12);
    for (let k = 0; k < 8; k++) { const [a, b] = PC[(k + r * 5) % PC.length]; pompomBlob(P, 267 + k * 12, sy + 2, 4, a, b, k * 3 + r); }
  }
  // HUVUDET: två hyllor (huvudena med rosetter och tiaror ritas på i makeShopCheer – spelets figurer)
  for (const sy of [52, 76]) { P.rect(364, sy, 76, 2, WHITE); P.hl(364, sy + 2, 76, 0xa8b0bc); P.hl(364, sy + 3, 76, 0x000000, 0.12); }
  // I HÄNDERNA: hålplatta (sakerna ritas på i makeShopCheer ur people.js mallar)
  for (let y = 34; y < 82; y++) for (let x = 448; x < 540; x++) P.px(x, y, (x - 448) % 6 === 3 && (y - 34) % 6 === 3 ? 0xf0c8dc : 0xfbe4ef);
  P.box(447, 33, 94, 50, PINKD);
  // SCENEN: mörkblå fond med stjärnor, röda ridåer, en skylt med glödlampor och strålkastarna i en ställning i taket
  for (let y = 14; y < WALL; y++) for (let x = STAGE.x0 - 4; x < STAGE.x1 + 4; x++) P.px(x, y, mix(0x1a1450, 0x3a2a78, (y - 14) / 76 + (bayer(x, y) - 0.5) * 0.1));
  for (let i = 0; i < 40; i++) { const x = STAGE.x0 + Math.floor(hash(i, 3, 41) * (STAGE.x1 - STAGE.x0)), y = 26 + Math.floor(hash(i, 4, 41) * 56); P.px(x, y, i % 3 ? 0xfff6c0 : 0xffffff); }
  star5(P, 601, 52, 12, 5, YEL, YELD);
  for (const [x0, dir] of [[STAGE.x0 - 8, 1], [STAGE.x1 - 6, -1]]) for (let y = 12; y < WALL + 30; y++) for (let i = 0; i < 14; i++) {   // ridåerna
    const x = x0 + i, gather = y > 40 ? Math.round((y - 40) * 0.08) * dir : 0, f = (i + gather + 40) % 5;
    if ((dir > 0 && i > 13 - Math.max(0, (y - 70) >> 2)) || (dir < 0 && i < Math.max(0, (y - 70) >> 2))) continue;
    P.px(x, y, f === 0 ? 0x6a0a1a : f < 3 ? 0xb8162e : 0x8e1024);
  }
  for (const x of [STAGE.x0 - 8, STAGE.x1 + 6]) { P.rect(x - 1, 62, 3, 3, YEL); }
  P.hl(STAGE.x0 - 10, 10, STAGE.x1 - STAGE.x0 + 20, 0x4a4e56); P.hl(STAGE.x0 - 10, 11, STAGE.x1 - STAGE.x0 + 20, 0x2a2e36);   // ställningen
  for (const lx of [574, 628]) { P.rect(lx - 3, 12, 7, 5, 0x2a2e36); P.rect(lx - 2, 17, 5, 2, 0x4a4e56); P.px(lx, 18, 0xfff6c0); }
  const ss = 'SCENEN', sw = textW(SMALL, ss) + 14, sx = 601 - (sw >> 1); P.rect(sx, 18, sw, 11, PINK); P.box(sx, 18, sw, 11, YEL); pixText(P, SMALL, ss, sx + 7, 21, WHITE);
  // scenens golv: lackat trä med en vit kant, framsidan glittrig rosa, en trappa till vänster
  for (let y = STAGE.y0 - 2; y < STAGE.y1 + 14; y++) for (let x = STAGE.x0 - 4; x < STAGE.x1 + 4; x++) {
    let c;
    if (y < STAGE.y1) c = ((x >> 3) + (y >> 2)) % 2 ? 0xb8783c : 0xc8884c; else if (y === STAGE.y1) c = WHITE; else c = (x + y * 2) % 7 === 0 ? 0xffffff : (x + y) % 9 === 0 ? PINKL : PINK;
    if (y === STAGE.y0 - 2) c = 0x7a4a24;
    P.px(x, y, c);
  }
  for (let k = 0; k < 3; k++) { const y = STAGE.y1 + 4 + k * 4, x = STAGE.x0 - 16 + k * 4; P.rect(x, y, 14 - k * 2, 4, 0xc8884c); P.hl(x, y, 14 - k * 2, 0xe8a86c); P.hl(x, y + 3, 14 - k * 2, 0x7a4a24); }
  // HELA DRÄKTER: podiet (rund, rosa med guldkant) – skyltdockorna står på det (ritas i makeShopCheer)
  for (let y = 26; y < 50; y++) for (let x = PODIUM.x0 + 4; x < PODIUM.x1 - 4; x++) if ((x + y) % 5 === 0) P.px(x, y, PINKL);
  for (let i = 0; i < 6; i++) { const bx = PODIUM.x0 + 8 + i * 9; P.vl(bx, 30, 14, 0x8a929c); P.rect(bx - 3, 44, 7, 6, [PINK, YEL, BLUEL, 0x8e5bd1, 0x46a35a, WHITE][i]); P.px(bx - 2, 45, 0xffffff); }   // ballonger
  for (let y = PODIUM.y0; y < PODIUM.y1 + 10; y++) for (let x = PODIUM.x0; x < PODIUM.x1; x++) {
    const e = ((x - (PODIUM.x0 + PODIUM.x1) / 2) / ((PODIUM.x1 - PODIUM.x0) / 2)) ** 2 + ((y - (PODIUM.y0 + PODIUM.y1) / 2) / ((PODIUM.y1 - PODIUM.y0) / 2 + 2)) ** 2;
    if (e > 1) continue;
    P.px(x, y, e > 0.9 ? YEL : e > 0.84 ? YELD : (x + y) % 11 === 0 ? 0xffffff : mix(PINKL, 0xfde7f1, e));
  }
  return P.flush();
}

// ================= möblerna (ritas sorterade efter fotlinjen) =================
function tableSprite(kind) {
  const w = 70, h = 32, P = new Pix(w, h);
  P.rect(0, 8, w, 6, WHITE); P.hl(0, 8, w, 0xffffff); P.hl(0, 13, w, BLUED); P.rect(0, 14, w, 14, BLUE); P.box(0, 14, w, 14, YEL);
  P.rect(2, 28, 3, 4, BLUED); P.rect(w - 5, 28, 3, 4, BLUED);
  const name = kind === 'drakt' ? 'DRÄKT' : 'POMPOMER';
  pixText(P, SMALL, 'DESIGNA', (w - textW(SMALL, 'DESIGNA')) >> 1, 16, YEL); pixText(P, SMALL, name, (w - textW(SMALL, name)) >> 1, 22, WHITE);
  for (let x = 3; x < w - 2; x += 6) P.px(x, 26, (x / 6) & 1 ? PINKL : 0xffffff);   // glitterkant
  if (kind === 'drakt') {
    [PINK, YEL, 0x8e5bd1, 0x2aa39a].forEach((c, k) => { P.rect(5 + k * 8, 3, 6, 6, c); P.hl(5 + k * 8, 3, 6, mix(c, 0xffffff, 0.4)); P.vl(10 + k * 8, 3, 6, mul(c, 0.7)); });
    stamp(P, ['#.#', '###', '.#.'], 42, 3, { '#': PINK }); stamp(P, ['.#.', '###', '#.#'], 47, 3, { '#': YEL }); stamp(P, ['.##', '.#.', '##.'], 52, 3, { '#': 0xffffff });
    P.line(58, 4, 64, 10, 0x8a929c); P.line(64, 4, 58, 10, 0x8a929c); P.px(57, 3, 0xd83a4a); P.px(65, 3, 0xd83a4a);
  } else {
    [PINK, YEL, BLUE, 0x8e5bd1, 0xd9433b, 0x46a35a, WHITE, 0xf0b429].forEach((c, k) => { P.vl(5 + k * 3, 2, 7, c); P.vl(6 + k * 3, 3, 6, mul(c, 0.8)); });
    pompomBlob(P, 50, 6, 4, PINK, WHITE, 1); pompomBlob(P, 61, 6, 4, YEL, BLUE, 4);
  }
  return P.flush();
}
function counterSprite() {
  const w = 64, P = new Pix(w, 20);
  P.rect(0, 0, w, 4, WHITE); P.hl(0, 3, w, YEL); P.rect(0, 4, w, 14, PINK); P.box(0, 4, w, 14, PINKD); P.hl(1, 5, w - 2, PINKL);
  for (let x = 6; x < w - 4; x += 10) stamp(P, ['.#.', '###', '.#.'], x, 9, { '#': WHITE });
  P.rect(44, -1, 12, 4, 0x2b2a33); P.rect(46, -1, 8, 1, 0x7ad07a);
  pompomBlob(P, 10, -1, 3, YEL, BLUE, 2);
  return P.flush();
}
function shoeShelfSprite() {
  const w = 60, P = new Pix(w, 30);
  for (const sy of [4, 14]) { P.rect(0, sy + 6, w, 3, WHITE); P.hl(0, sy + 9, w, 0xa8b0bc); }
  P.rect(0, 23, w, 5, BLUE); P.box(0, 23, w, 5, BLUED); P.rect(1, 28, 3, 2, BLUED); P.rect(w - 4, 28, 3, 2, BLUED);
  const SC = [[WHITE, PINK], [WHITE, BLUE], [WHITE, YEL], [0x2b2a33, WHITE], [PINKL, WHITE], [WHITE, 0x8e5bd1]];
  for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
    const [u, s] = SC[(k + r * 3) % SC.length], x = 3 + k * 11, y = 4 + r * 10;
    P.rect(x, y + 2, 8, 3, u); P.rect(x, y + 1, 4, 1, u); P.hl(x, y + 5, 8, s); P.px(x + 2, y + 2, s); P.px(x + 4, y + 2, s); P.px(x + 7, y + 3, mul(u, 0.85));
  }
  const t = 'SKOR', tw = textW(SMALL, t); P.rect(w - tw - 8, 24, tw + 6, 7, YEL); pixText(P, SMALL, t, w - tw - 5, 25, BLUED);
  return P.flush();
}
function trophySprite() {
  const P = new Pix(20, 26);
  P.rect(0, 22, 20, 4, 0xa8743e); P.hl(0, 22, 20, 0xc8945e);
  for (const [x, h, c] of [[2, 14, 0xe8b830], [8, 18, 0xe8b830], [14, 11, 0xc4c9d4]]) {
    P.rect(x, 22 - h, 5, 5, c); P.px(x, 22 - h, mix(c, 0xffffff, 0.6)); P.px(x - 1, 23 - h, c); P.px(x + 5, 23 - h, c);
    P.vl(x + 2, 27 - h, h - 7, mul(c, 0.8)); P.rect(x + 1, 20, 3, 2, mul(c, 0.8));
  }
  return P.flush();
}
function speakerSprite() {   // högtalaren vid mattan (membranen pulserar i takt i draw)
  const P = new Pix(14, 26);
  P.rect(0, 0, 14, 24, 0x2b2a33); P.box(0, 0, 14, 24, 0x17151a); P.hl(1, 1, 12, 0x4a4856);
  for (const [cy, r] of [[6, 3], [16, 5]]) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d <= r * r) P.px(7 + x, cy + y, d > (r - 1) * (r - 1) ? 0x6a6878 : d < 2 ? 0x8a8898 : 0x1e1c24); }
  P.rect(2, 24, 3, 2, 0x17151a); P.rect(9, 24, 3, 2, 0x17151a);
  return P.flush();
}
function balloonsSprite() {   // ett ballongknippe vid dörren
  const P = new Pix(22, 40), C = [PINK, YEL, BLUEL, WHITE, 0x8e5bd1];
  for (let k = 0; k < 5; k++) { const cx = 4 + (k % 3) * 7 + (k > 2 ? 3 : 0), cy = 5 + (k > 2 ? 8 : 0); P.line(cx, cy + 4, 11, 36, 0x8a929c); for (let y = -4; y <= 4; y++) for (let x = -3; x <= 3; x++) if ((x / 3.4) ** 2 + (y / 4.4) ** 2 <= 1) P.px(cx + x, cy + y, x === -1 && y === -2 ? 0xffffff : y > 2 ? mul(C[k], 0.8) : C[k]); }
  P.rect(8, 35, 7, 5, PINKD); P.hl(8, 35, 7, PINK);
  return P.flush();
}
function plantSprite() { const P = new Pix(14, 26); P.rect(3, 18, 8, 8, PINK); P.hl(2, 18, 10, PINKL); P.vl(10, 19, 7, PINKD); for (let y = 0; y < 19; y++) for (let x = 0; x < 14; x++) { const e = ((x - 7) / 6.5) ** 2 + ((y - 9) / 9.5) ** 2 + (hash(x, y, 5) - 0.5) * 0.4; if (e < 1) P.px(x, y, e < 0.3 && x < 7 ? 0x8cc462 : e < 0.6 ? 0x5a9e46 : 0x3a7e38); } return P.flush(); }
function benchSprite() { const P = new Pix(30, 12); P.rect(0, 2, 30, 5, BLUE); P.hl(0, 2, 30, BLUEL); P.hl(0, 6, 30, BLUED); P.rect(2, 7, 2, 5, 0x8a929c); P.rect(26, 7, 2, 5, 0x8a929c); for (let x = 3; x < 28; x += 6) P.px(x, 4, YEL); return P.flush(); }

// ================= hejasången (WebAudio): trummor, handklapp och en blåsmelodi i takt med lagets uppvisning =================
const BPM = 116, BEAT = 60 / BPM, CYCLE = 40;
const NOTE = { G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, C6: 1047 };
const MEL = ['G4', 'C5', 'E5', 'G5', 'E5', null, 'C5', null, 'F5', 'A5', 'G5', 'E5', 'G5', null, null, null,
  'C5', 'C5', 'C5', 'C5', 'G5', 'G5', 'E5', null, 'C5', 'E5', 'G5', 'C6', 'C6', null, 'A5', 'G5', 'E5', 'D5', 'C5', null, 'G4', 'C5', null, null];
function makeSong() {
  let ac = null, out = null, noise = null;
  const init = () => {
    if (ac) return true;
    ac = audioContext(); if (!ac) return false;
    out = ac.createGain(); out.gain.value = 0; out.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  };
  const env = (g, t, a, v, dur) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
  const osc = (t, type, f0, f1, v, dur) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, 0.005, v, dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05); };
  const hiss = (t, dur, f, type, v) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; fl.type = type; fl.frequency.value = f; env(g, t, 0.002, v, dur); s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); };
  const brass = (t, f, dur, v = 0.16) => { const fl = ac.createBiquadFilter(), g = ac.createGain(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(2600, t + 0.05); env(g, t, 0.02, v, dur); fl.connect(g).connect(out); for (const det of [-6, 6]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(fl); o.start(t); o.stop(t + dur + 0.05); } };
  return {
    beat(k, vol) {   // ett slag i sången (k räknas från uppvisningens början)
      if (isMuted() || (typeof document !== 'undefined' && document.hidden) || !init()) return;
      const t = ac.currentTime + 0.03, p = k % CYCLE;
      out.gain.setTargetAtTime(vol, ac.currentTime, 0.2);
      if (p % 2 === 0) osc(t, 'sine', 140, 45, 0.9, 0.18);                                      // stamp (bastrumma)
      else { hiss(t, 0.12, 1800, 'bandpass', 0.7); hiss(t + 0.012, 0.07, 1200, 'bandpass', 0.45); hiss(t + 0.03, 0.06, 1400, 'bandpass', 0.35); }   // virvel och handklapp
      hiss(t, 0.03, 8000, 'highpass', 0.12); hiss(t + BEAT / 2, 0.03, 8000, 'highpass', 0.08);   // hi-hat på åttondelar
      if (p >= 16 && p < 20) osc(t, 'square', 330, 0, 0.05, 0.08);                             // tvåfyrasexåtta: korta stötar
      const n = MEL[p]; if (n) brass(t, NOTE[n], BEAT * (MEL[p + 1] ? 0.9 : 1.6));
      if (p === 0) { for (let i = 0; i < 6; i++) osc(t + i * 0.05, 'sine', 2600, 2300, 0.08, 0.05); }   // visselpipan
      if (p === 26) for (const [i, f] of [[0, 523], [1, 659], [2, 784], [3, 1047]]) brass(t + i * 0.09, f, 0.5, 0.12);   // pyramiden: fanfar
      if (p >= 27 && p <= 30) hiss(t, 0.5, 2500, 'bandpass', 0.06);                             // publiken jublar
    },
    stop() { if (out) { try { out.gain.setTargetAtTime(0, ac.currentTime, 0.05); } catch { /* ok */ } } },
  };
}

// ================= scenen =================
export function makeShopCheer(A, opts = {}) {
  const G = A.game, store = opts.store || { list: () => [], add() {} };
  const bg = paintBG();
  const WIGS = [['#d8b878', 'ponytail'], ['#8a5a3a', 'bun'], ['#2a2026', 'long'], ['#c8644a', 'ponytail'], ['#ecd489', 'bun'], ['#5a3a2a', 'ponytail']];
  const dollLook = (look, w = 0) => ({ skin: '#ece4ea', hair: WIGS[w % WIGS.length][0], style: WIGS[w % WIGS.length][1], kid: true, build: 4, top: 'tee', shirt: '#f4eef2', bottom: 'skirt', pants: '#cfc6c0', shoeType: 'normal', shoes: '#f4f1ea', eyes: 'normal', mouth: 'normal', ...look });
  {
    const c = bg.getContext('2d'); c.imageSmoothingEnabled = false;
    const HEADS = [['hat-cheerbow', '#e0457e'], ['hat-starband', '#1d51a0'], ['hat-heartband', '#e0457e'], ['hat-hearttiara'], ['hat-startiara'], ['hat-glitterband', '#8e5bd1'], ['hat-tiara'], ['hat-cheerbow', '#f6d02f']];
    HEADS.forEach(([id, cap], i) => {
      const it = itemById(id); if (!it) return;
      const L = dollLook({ kid: false, build: 5, style: 'bald', hair: '#ece4ea', ...it.look, ...(it.colors || {}), ...(cap ? { cap } : {}) });
      c.drawImage(personSprite(L, 'down', 0), 4, 0, 16, 20, 366 + (i % 4) * 18, (i < 4 ? 52 : 76) - 20, 16, 20);
    });
    const P = { w: '#f4f1ea', W: '#d2cdc0', s: '#c4c9d4', S: '#f4f6fa', z: '#80879a', g: '#e8b830', G: '#fff0a0', y: '#a87a1c', t: '#f8d860', k: '#2a2630' };
    const hook = (x, y) => { c.fillStyle = '#8a929c'; c.fillRect(x, y, 2, 1); c.fillRect(x + 1, y + 1, 1, 2); };
    const items = [['megafon', 451, 40], ['flagga', 466, 38], ['skylt', 482, 38], ['ballong', 500, 36], ['skumhand', 516, 42], ['trollstav', 530, 40], ['band', 452, 62], ['stav', 468, 60], ['pokal', 482, 64], ['lysstavar', 498, 62], ['flaska', 514, 64], ['megafon', 526, 62]];
    items.forEach(([k, x, y]) => {
      const Hd = HAND_ITEMS[k], [c1, c2] = HAND_DEF[k] || ['#e0457e', '#f4f1ea'], c1d = '#' + mul(hexI(c1), 0.75).toString(16).padStart(6, '0'), c1l = '#' + mix(hexI(c1), 0xffffff, 0.35).toString(16).padStart(6, '0');
      const pal = { ...P, a: c1, A: c1l, q: c1d, b: c2, B: c2 };
      hook(x + 3, y - 3);
      if (k === 'lysstavar') { for (const [dx, col] of [[0, c1], [4, c2]]) { c.fillStyle = col; c.fillRect(x + dx + 1, y, 2, 12); c.fillStyle = '#ffffff'; c.fillRect(x + dx + 1, y, 2, 2); } return; }
      const rows = Hd.f[2], sc = rows.length > 8 ? 1 : 2;
      rows.forEach((r, j) => [...r].forEach((ch, ii) => { const col = pal[ch]; if (!col) return; c.fillStyle = col; c.fillRect(x + ii * sc, y + j * sc, sc, sc); }));
    });
  }
  const keeper = { x: 254, y: 98, look: { ...makeLookRich(), kid: false, build: 5, hair: '#3b2619', style: 'ponytail', ...suitLook({ ...OUTFITS[1], hat: 'hat-cheerbow', cap: '#f6d02f' }) } };
  // skyltdockorna: fem vid dräkterna och sex på podiet – alla i hela dräkter (tryck på en så provar du den)
  const dolls = [
    ...[0, 1, 2, 3, 4].map((k) => ({ x: 18 + k * 22, y: 118, o: k })),
    ...[5, 6, 7].map((k, i) => ({ x: 668 + i * 18, y: 126, o: k })), ...[8, 9, 10].map((k, i) => ({ x: 668 + i * 18, y: 154, o: k })),
  ].map((d) => ({ ...d, look: dollLook(suitLook(OUTFITS[d.o]), d.o) }));
  const F = [
    { img: tableSprite('drakt'), x: 40, fy: 214, design: 'drakt' },
    { img: tableSprite('pompom'), x: 250, fy: 214, design: 'pompom' },
    { img: counterSprite(), x: 222, fy: 112 },
    { img: shoeShelfSprite(), x: 470, fy: 150 },
    { img: trophySprite(), x: 290, fy: 106 },
    { img: speakerSprite(), x: 108, fy: 150, speaker: true }, { img: speakerSprite(), x: 272, fy: 150, speaker: true },
    { img: balloonsSprite(), x: 208, fy: 100 },
    { img: plantSprite(), x: 4, fy: 112 }, { img: plantSprite(), x: 400, fy: 212 }, { img: plantSprite(), x: 536, fy: 118 }, { img: plantSprite(), x: 700, fy: 212 },
    { img: benchSprite(), x: 370, fy: 136 }, { img: benchSprite(), x: 140, fy: 212 }, { img: benchSprite(), x: 590, fy: 196 },
  ];
  for (const f of F) { f.w = f.img.width; f.h = f.img.height; f.rect = [f.x, f.fy - Math.min(12, f.h), f.x + f.w, f.fy]; }
  for (const d of dolls) F.push({ doll: d, x: d.x - 6, fy: d.y, w: 12, h: 30, rect: [d.x - 6, d.y - 4, d.x + 6, d.y] });
  const SP = {
    door: { r: [DOOR.x0 - 3, 34, DOOR.x1 + 3, WALL + 2], go: [192, 98], label: 'GÅ UT', act: () => { play('door'); A.go('city'); } },
    drakter: { r: [4, 30, 140, 68], go: [72, 98], label: 'DRÄKTER', act: () => drakter('hela') },
    drakt: { r: [40, 182, 110, 214], go: [75, 176], face: 'down', label: 'DESIGNA DRÄKT', act: () => designer() },
    spegel: { r: [146, 34, 174, 90], go: [160, 98], label: 'SPEGELN', act: () => mirror() },
    pompomer: { r: [260, 36, 360, 88], go: [310, 120], label: 'POMPOMER', act: () => pompomDesigner() },
    pompom: { r: [250, 182, 320, 214], go: [285, 176], face: 'down', label: 'DESIGNA POMPOMER', act: () => pompomDesigner() },
    huvud: { r: [362, 26, 442, 82], go: [400, 100], label: 'PÅ HUVUDET', act: () => catalog('huvud') },
    hander: { r: [446, 26, 542, 84], go: [494, 100], label: 'I HÄNDERNA', act: () => handCatalog() },
    skor: { r: [468, 118, 532, 152], go: [500, 158], label: 'SKOR', act: () => catalog('skor') },
    scen: { r: [STAGE.x0 - 4, 20, STAGE.x1 + 4, STAGE.y1 + 14], go: [601, 126], face: 'down', label: 'SCENEN - STÄLL DIG I LJUSET', act: () => cheer(true) },
    podium: { r: [PODIUM.x0, 24, PODIUM.x1, 60], go: [686, 176], label: 'HELA DRÄKTER', act: () => drakter('hela') },
    matta: { r: [MAT.cx - MAT.rx, MAT.cy - MAT.ry, MAT.cx + MAT.rx, MAT.cy + MAT.ry], go: [MAT.cx, MAT.cy + 34], face: 'up', label: 'LAGET - HEJA MED!', act: () => cheer(false) },
    kassa: { r: [222, 88, 286, 114], go: [254, 120], label: 'KASSAN', act: () => say(pickOf(['VÄLKOMMEN TILL HEJA HEJA!', 'VILKEN KLUBB HEJAR DU PÅ?', 'HELA DRÄKTER FINNS PÅ PODIET LÄNGST BORT!', 'DESIGNA EN EGEN DRÄKT VID BORDET!', 'STÄLL DIG PÅ SCENEN - DÅ TÄNDS STRÅLKASTAREN!', 'LAGET BYGGER PYRAMID VARJE MINUT!', 'VÄLJ FÄRG PÅ DINA POMPOMER!', 'I SPEGELN SER DU ALLT DU HAR KÖPT.']), keeper.x, keeper.y - 42) },
  };
  dolls.forEach((d, i) => { SP['docka' + i] = { r: [d.x - 7, d.y - 30, d.x + 7, d.y], go: [d.x, d.y + (d.x > 600 ? (d.y > 140 ? 24 : 52) : 10)], label: `${OUTFITS[d.o].name.toUpperCase()} - PROVA`, act: () => outfitDetail(d.o) }; });
  const ORDER = ['door', 'spegel', 'drakt', 'pompom', 'kassa', 'skor', ...dolls.map((_, i) => 'docka' + i), 'drakter', 'pompomer', 'huvud', 'hander', 'podium', 'scen', 'matta'];   // dockorna före väggarna bakom dem
  const onStage = (x, y) => x >= STAGE.x0 + 2 && x <= STAGE.x1 - 2 && y >= STAGE.y0 && y <= STAGE.y1;
  const blocked = (x, y) => {
    if (y < WALL + 6 || y > H - 3 || x < 4 || x > RW - 4) return true;
    if (x >= STAGE.x0 - 4 && x <= STAGE.x1 + 4 && y > STAGE.y1 && y < STAGE.y1 + 15 && x > STAGE.x0 + 2) return true;   // scenens framsida (trappan till vänster)
    if (x >= PODIUM.x0 && x <= PODIUM.x1 && y >= PODIUM.y0 && y <= PODIUM.y1 + 4) return true;
    return F.some((f) => !f.doll && x >= f.rect[0] - 3 && x <= f.rect[2] + 3 && y >= f.rect[1] - 2 && y <= f.rect[3] + 2) || dolls.some((d) => d.x < 600 && Math.abs(x - d.x) < 7 && y > d.y - 5 && y < d.y + 3);
  };
  const C = 4, GW = RW / C, GH = H / C;
  const free = new Uint8Array(GW * GH); for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) free[j * GW + i] = blocked(i * C + 2, j * C + 2) ? 0 : 1;
  const nearest = (x, y) => { let b = -1, bd = 1e9; for (let n = 0; n < free.length; n++) if (free[n]) { const d = ((n % GW) * C + 2 - x) ** 2 + (((n / GW) | 0) * C + 2 - y) ** 2; if (d < bd) { bd = d; b = n; } } return b; };
  function path(x0, y0, x1, y1) {
    let s = ((y0 / C) | 0) * GW + ((x0 / C) | 0); if (!free[s]) s = nearest(x0, y0);
    const g = nearest(x1, y1); if (s < 0 || g < 0) return [];
    const N = free.length, gs = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), done = new Uint8Array(N), open = [s]; gs[s] = 0;
    const hh = (n) => Math.hypot((n % GW) - (g % GW), ((n / GW) | 0) - ((g / GW) | 0));
    while (open.length) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (gs[open[k]] + hh(open[k]) < gs[open[bi]] + hh(open[bi])) bi = k;
      const c = open.splice(bi, 1)[0]; if (c === g) break; if (done[c]) continue; done[c] = 1;
      const ci = c % GW, cj = (c / GW) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
        const n = nj * GW + ni; if (!free[n] || done[n] || (di && dj && (!free[cj * GW + ni] || !free[nj * GW + ci]))) continue;
        const t2 = gs[c] + (di && dj ? 1.414 : 1); if (t2 < gs[n]) { gs[n] = t2; came[n] = c; open.push(n); }
      }
    }
    const out = []; for (let n = g; n !== -1 && n !== s; n = came[n]) out.unshift([(n % GW) * C + 2, ((n / GW) | 0) * C + 2]);
    if (!blocked(x1, y1)) out.push([x1, y1]);
    return out;
  }
  const me = { x: 192, y: 100, dir: 'down', path: [], dist: 0, then: null, jump: -9 };
  const kidCheer = (o) => ({ ...makeLookRich(), kid: true, build: 4, neck: 'none', bag: null, phones: false, glasses: false, ...suitLook(OUTFITS[o]) });
  const folk = [{ look: kidCheer(0), x: 330, y: 160 }, { look: kidCheer(3), x: 120, y: 170 }, { look: kidCheer(7), x: 620, y: 180 }].map((n, i) => ({ ...n, dir: 'up', path: [], dist: 0, t: 1 + i * 2.5, jump: -9 }));
  const BROWSE = [[72, 98, 'up'], [62, 132, 'up'], [310, 120, 'up'], [400, 100, 'up'], [494, 100, 'up'], [500, 158, 'up'], [75, 176, 'down'], [285, 176, 'down'], [MAT.cx - 30, MAT.cy + 34, 'up'], [MAT.cx + 30, MAT.cy + 36, 'up'], [686, 186, 'up'], [600, 170, 'up']];
  // LAGET: sex cheerleaders i lagets dräkt, var och en med egen frisyr och hy
  const TEAM_SUIT = suitLook(OUTFITS[13]);
  const TEAM_HAIR = [['#3b2619', 'ponytail'], ['#ecd489', 'ponytail'], ['#1d1714', 'bun'], ['#a5692f', 'long'], ['#b7392b', 'ponytail'], ['#6b4226', 'bun']], TEAM_SKIN = ['#f6d7bf', '#e0a97f', '#744a2d', '#eec3a0', '#c68a5c', '#a06a43'];
  const team = Array.from({ length: 6 }, (_, i) => {
    const look = { ...makeLookRich(), kid: true, build: 4, beard: false, glasses: false, neck: 'none', jewel: 'none', phones: false, bag: null, makeup: 'none', marks: 'none', skin: TEAM_SKIN[i], hair: TEAM_HAIR[i][0], style: TEAM_HAIR[i][1], hairFx: 'none', ...TEAM_SUIT, cap: '#e0457e', hand: ['pompoms', i % 2 ? '#f6d02f' : '#e0457e', '#f4f1ea'] };
    return { look, bare: { ...look, hand: null }, x: MAT.cx, y: MAT.cy, fr: 0, lift: 0, lvl: 0, pom: true };
  });
  const rowPos = (i) => [MAT.cx - 45 + i * 18, MAT.cy + 4];
  const pyrPos = (i) => (i < 3 ? [MAT.cx - 18 + i * 18, MAT.cy + 8, 0] : i < 5 ? [MAT.cx - 9 + (i - 3) * 18, MAT.cy + 8, 1] : [MAT.cx, MAT.cy + 8, 2]);
  const JUMPS = new Set([4, 6, 8, 10, 12, 13, 14, 15, 18, 19, 36]);
  const WORDS = { 0: 'ÄR NI REDO?', 4: 'HEJA!', 6: 'HEJA!', 8: 'HEJA!', 10: 'HEJA HEJA!', 12: 'TVÅ', 13: 'FYRA', 14: 'SEX', 15: 'ÅTTA', 16: 'VEM SKA VI', 17: 'HEJA PÅ?', 18: '{P}!', 19: '{P}!', 20: 'PYRAMID!', 26: 'TA-DA!', 28: 'VI ÄR', 29: 'BÄST!', 36: 'HEJA HEJA!' };
  const song = makeSong();
  let showT = 0, lastBeat = -1, word = null, ducked = false;
  let bubble = null, hover = null, t = 0, camX = 0, spot = 0;
  const CONF = [], GLIT = [];
  const SPARK = []; for (let i = 0; i < 70; i++) { const z = pickOf([[128, 12, 128, 23], [262, 36, 96, 46], [6, 37, 132, 30], [STAGE.x0, 20, STAGE.x1 - STAGE.x0, 70], [PODIUM.x0, 26, PODIUM.x1 - PODIUM.x0, 28], [PODIUM.x0, 100, PODIUM.x1 - PODIUM.x0, 70], [148, 40, 24, 48], [362, 30, 80, 50], [MAT.cx - 60, MAT.cy - 20, 120, 40]]); SPARK.push({ x: z[0] + Math.random() * z[2], y: z[1] + Math.random() * z[3], ph: Math.random() * 6, sp: 1.5 + Math.random() * 2.5 }); }
  const BULBS = []; for (let x = 128; x <= 256; x += 6) BULBS.push([x, 10], [x, 36]); for (let y = 16; y <= 30; y += 6) BULBS.push([126, y], [258, y]);
  for (let x = STAGE.x0 - 2; x <= STAGE.x1 + 2; x += 5) BULBS.push([x, 16]);
  const cam = () => Math.round(camX);
  const playerName = () => String(A.avatar.name || 'DIG').trim().split(/\s+/)[0].toUpperCase().slice(0, 10);
  const say = (s, x, y) => { bubble = { s, x, y, until: t + Math.max(2.6, s.length * 0.08) }; };
  const walkTo = (x, y, then) => { me.path = path(me.x, me.y, x, y); me.then = then || null; if (!me.path.length && then) { me.then = null; then(); } };
  const step = (o, dt, sp) => {
    if (!o.path.length) return false;
    const [tx, ty] = o.path[0], dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), s = sp * dt;
    if (Math.abs(dx) > Math.abs(dy) + 0.5) o.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.5) o.dir = dy > 0 ? 'down' : 'up';
    if (d <= s) { o.x = tx; o.y = ty; o.path.shift(); o.dist += d; } else { o.x += dx / d * s; o.y += dy / d * s; o.dist += s; }
    return !o.path.length;
  };
  const confetti = (x, y, n = 26) => { const cols = ['#e0457e', '#f6d02f', '#1d51a0', '#ffffff', '#6fb4e8', '#f5a3c7']; for (let i = 0; i < n; i++) CONF.push({ x: x + (Math.random() - 0.5) * 10, y: y - 30, vx: (Math.random() - 0.5) * 70, vy: -40 - Math.random() * 60, c: pickOf(cols), life: 1.4 + Math.random() * 0.8 }); };
  const glitter = (x, y, n = 18) => { for (let i = 0; i < n; i++) GLIT.push({ x: x + (Math.random() - 0.5) * 30, y: y - 40 - Math.random() * 30, vy: 12 + Math.random() * 18, life: 1.5 + Math.random(), ph: Math.random() * 6 }); };
  const CHEERS = ['HEJA HEJA!', 'GE MIG ETT H!', 'VI ÄR BÄST!', 'HEJA {K}!', 'HOPPA HÖGT!', 'TVÅ, FYRA, SEX, ÅTTA - VEM SKA VI HEJA PÅ?', 'JA!'];
  function cheer(stage) {   // hopp med armarna upp, konfetti och ett tillrop (på scenen: strålkastaren och glitter)
    me.jump = t; play('ok');
    const club = CLUB_BY[A.avatar.look.topPrint]?.name.toUpperCase() || 'ALLA';
    setTimeout(() => { if (!me.path.length) { confetti(me.x, me.y); if (stage) glitter(me.x, me.y, 30); } }, 250);
    say(pickOf(CHEERS).replace('{K}', club), me.x, me.y - 50);
    setTimeout(() => say(stage ? pickOf([`BRAVO ${playerName()}!`, 'VILKEN STJÄRNA!', 'APPLÅDER FÖR DIG!']) : pickOf(['SNYGGT HOPP!', 'VILKEN ENERGI!', 'DU ÄR EN RIKTIG CHEERLEADER!', 'MER! MER!']), stage ? 601 : keeper.x, stage ? 70 : keeper.y - 42), 1500);
  }
  const jumpY = (o) => { const u = t - o.jump; return u >= 0 && u < 1.2 ? Math.round(Math.abs(Math.sin(u / 0.4 * Math.PI)) * 7) : 0; };
  // lagets uppvisning: position, lyft och bildruta för varje medlem vid takten b (slag sedan uppvisningen började)
  function choreo(b) {
    const p = b % CYCLE, k = Math.floor(p), fr = p - k;
    const hop = JUMPS.has(k) ? Math.round(Math.sin(Math.min(1, fr / 0.8) * Math.PI) * 6) : 0;
    const toPyr = smooth(20, 22.5, p) * (1 - smooth(34, 36, p));
    team.forEach((m, i) => {
      const [rx, ry] = rowPos(i), [px, py, lvl] = pyrPos(i);
      m.x = rx + (px - rx) * toPyr; m.y = ry + (py - ry) * toPyr; m.lvl = lvl;
      const up = lvl === 1 ? smooth(22.5, 24, p) * (1 - smooth(33, 34.2, p)) : lvl === 2 ? smooth(24, 25.6, p) * (1 - smooth(32, 33.2, p)) : 0;
      m.lift = Math.round(up * lvl * 14) + (toPyr < 0.02 ? hop : 0);
      const cheerArms = (p >= 4 && p < 20) || p >= 36;
      m.fr = toPyr > 0.02 ? (lvl === 2 && up > 0.95 ? (Math.floor(b * 2) % 2 ? 10 : 11) : lvl === 1 && up > 0.95 && p >= 26 && p < 32 ? 10 : up > 0.05 && up < 0.95 ? 3 : 0)
        : cheerArms ? (hop ? 11 : (k % 2 ? 10 : 4)) : (k % 2 ? 4 : 0);
      m.dir = 'down'; m.pom = !(toPyr > 0.3 && lvl < 2);   // de som bär lägger ner pompomerna
    });
  }

  // ---------- provfiguren: stor, vridbar, med närbild (Carl: "kan man göra den större när man designar så man ser bättre?") ----------
  const wearing = (it) => isWorn(it, A.avatar.look);
  const setLook = (look) => { A.avatar = { ...A.avatar, look }; opts.onLook?.(look); };   // (skolan sparar figuren direkt – stängs appen i butiken är dräkten kvar)
  const DIRS = ['down', 'left', 'up', 'right'], DIR_NAMES = ['Framifrån', 'Från sidan', 'Bakifrån', 'Från sidan'];
  const bigS = () => (window.innerHeight >= 700 && window.innerWidth >= 900 ? 7 : window.innerHeight >= 560 ? 6 : window.innerHeight < 480 ? 4 : 5);
  const VIEW = { i: 0, zoom: false };
  const stageHtml = (what) => `<div class="bl-try"><div class="bl-stage ch-stage"><div class="bl-fig" data-fig="now"><i></i><small>Du nu</small></div><div class="bl-arrow">➜</div><div class="bl-fig" data-fig="new"><i></i><small>${esc(what)}</small></div></div>
    <div class="bl-turn"><button type="button" class="btn btn-small" data-turn="-1" aria-label="Vrid åt vänster">⟲</button><b class="bl-view" data-view></b><button type="button" class="btn btn-small" data-turn="1" aria-label="Vrid åt höger">⟳</button><button type="button" class="btn btn-small" data-zoom>🔍</button></div></div>`;
  function stage(dlg, withLook) {
    const render = () => {
      const dir = DIRS[VIEW.i], L = withLook(), kid = !!L.kid;
      const crop = VIEW.zoom ? (kid ? [22, 18] : [14, 24]) : (kid ? [6, 37] : [0, 43]);
      dlg.querySelector('[data-fig="now"] i')?.replaceChildren(figure(A.avatar.look, dir, 2, kid ? [6, 37] : [0, 43]));
      dlg.querySelector('[data-fig="new"] i')?.replaceChildren(figure(L, dir, VIEW.zoom ? Math.round(bigS() * 1.7) : bigS(), crop));
      dlg.querySelector('[data-view]').textContent = VIEW.zoom ? 'Närbild' : DIR_NAMES[VIEW.i];
      const z = dlg.querySelector('[data-zoom]'); if (z) z.textContent = VIEW.zoom ? '🔍 Hela' : '🔍 Närbild';
    };
    dlg.querySelectorAll('[data-turn]').forEach((b) => (b.onclick = () => { VIEW.i = (VIEW.i + +b.dataset.turn + 4) % 4; play('click'); render(); }));
    const z = dlg.querySelector('[data-zoom]'); if (z) z.onclick = () => { VIEW.zoom = !VIEW.zoom; play('click'); render(); };
    render();
    return render;
  }
  const big = (cv, k) => { const o = document.createElement('canvas'); o.width = cv.width * k; o.height = cv.height * k; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, o.width, o.height); o.style.width = o.width + 'px'; o.style.height = o.height + 'px'; return o; };
  const preview = (look, mode = 'full') => {
    const c = document.createElement('canvas'); c.width = 30; c.height = 44; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    drawPerson(g, 15, 42, mode === 'head' ? { ...look, hand: null } : look, 'down', 0);
    const o = document.createElement('canvas'), og = o.getContext('2d'); og.imageSmoothingEnabled = false;
    if (mode === 'head') { const d = g.getImageData(0, 0, 30, 44).data; let top = 0; while (top < 43 && ![...Array(30).keys()].some((x) => d[(top * 30 + x) * 4 + 3] > 0)) top++; o.width = 24; o.height = 22; og.drawImage(c, 3, Math.max(0, top - 1), 24, 22, 0, 0, 24, 22); return big(o, 4); }
    if (mode === 'feet') { o.width = 24; o.height = 14; og.drawImage(c, 3, 30, 24, 14, 0, 0, 24, 14); return big(o, 5); }
    const kid = !!look.kid, y0 = kid ? 9 : 3, h = 42 - y0; o.width = 26; o.height = h; og.drawImage(c, 2, y0, 26, h, 0, 0, 26, h); return big(o, kid ? 4 : 3);
  };
  const nameOf = (it) => esc(it.name).replace(/­/g, '&shy;');
  function catalog(cat) {   // huvudet och skorna: klädaffärens provdialog
    const D = CATS[cat], items = D.ids.map(itemById).filter(Boolean);
    const card = (it, i) => { const own = G.ownsWardrobe(it.id), on = own && wearing(it); return `<button type="button" class="bl-card${on ? ' on' : own ? ' own' : ''}" data-i="${i}"><span class="bl-pre"></span><b>${nameOf(it)}</b><span class="bl-tag">${on ? '✓ PÅ DIG' : own ? '✓ DIN' : fmt(G.clothesPrice(it))}</span></button>`; };
    const dlg = openModal(D.title, `<p class="sp">Du har <b>${fmt(G.money)}</b>. Klicka på något så provar du det på dig – vrid figuren och välj färg innan du köper.</p><div class="bl-grid">${items.map(card).join('')}</div>`, [{ label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-furn');
    dlg.querySelectorAll('.bl-card').forEach((b) => {
      const it = items[+b.dataset.i];
      b.querySelector('.bl-pre').append(preview(lookForItem(it, A.avatar.look, { colors: !wearing(it) }), it.slot === 'hat' || it.slot === 'hairAcc' ? 'head' : 'feet'));
      b.onclick = () => { play('click'); openBuy(A, it, { where: `HEJA HEJA · ${D.title.replace(/^\S+\s/, '')}`, back: () => catalog(cat), onBought: () => say(pickOf(['HEJA! DET PASSAR DIG.', 'NU ÄR DU REDO FÖR MATCHEN!', 'SNYGGT, CHEERLEADER!']), keeper.x, keeper.y - 42) }); };
    });
  }

  // ---------- DRÄKTER: flikar med hela dräkter (först), toppar och kjolar ----------
  const owns = (id) => G.ownsWardrobe(id);
  const ownsPom = (pom) => store.list().some((d) => d.kind === 'hand' && d.k === 'pompoms' && d.c1 === pom[0] && d.c2 === pom[1]);
  function partsOf(o) {   // delarna i en hel dräkt: [id | 'pompoms', namn, pris, äger]
    const P = [[topId(o.top, o.club), `${TOPS[o.top].name} ${CLUB_BY[o.club]?.name || ''}`.trim(), TOPS[o.top].price + (o.club ? SYMBOL_PRICE : 0)], [BOTTOMS[o.bottom].id, BOTTOMS[o.bottom].name, BOTTOMS[o.bottom].price]];
    if (o.shoes) P.push(['shoes-cheerShoes', 'Cheerskor', itemById('shoes-cheerShoes')?.price || 299]);
    if (o.hat) { const it = itemById(o.hat); if (it) P.push([it.id, it.name.replace(/­/g, ''), it.price]); }
    if (o.pom) P.push(['pompoms', `Pompomer ${colorName(o.pom[0])} och ${colorName(o.pom[1])}`, POMPOM_PRICE]);
    return P.map(([id, name, price]) => ({ id, name, price, own: id === 'pompoms' ? ownsPom(o.pom) : owns(id) }));
  }
  const outfitPrice = (o) => { const sum = partsOf(o).filter((p) => !p.own).reduce((s, p) => s + p.price, 0); return Math.round(sum * OUTFIT_DISCOUNT); };
  const TAB = { tab: 'hela', model: 'cheer' };
  function drakter(tab = TAB.tab) {
    TAB.tab = tab;
    const tabs = [['hela', '✨ Hela dräkter'], ['toppar', '👕 Toppar'], ['kjolar', '👗 Kjolar och dräkter']];
    let cards = '', intro = '';
    if (tab === 'hela') {
      intro = 'Kompletta dräkter: topp, kjol, cheerskor, något på huvudet och pompomer – 15 % billigare än delarna var för sig. Tryck så provar du.';
      cards = OUTFITS.map((o, i) => { const all = partsOf(o).every((p) => p.own); return `<button type="button" class="bl-card${all ? ' own' : ''}" data-o="${i}"><span class="bl-pre"></span><b>${esc(o.name)}</b><span class="bl-tag">${all ? '✓ DIN' : fmt(outfitPrice(o))}</span></button>`; }).join('');
    } else if (tab === 'toppar') {
      intro = 'Välj modell och klubb. Färgerna väljer du när du provar.';
      cards = `<div class="ch-models">${Object.entries(TOP_NAMES).map(([m, n]) => `<button type="button" class="btn btn-small${TAB.model === m ? ' btn-gold' : ''}" data-model="${m}">${n}</button>`).join('')}</div>`
        + `<div class="bl-grid">${[null, ...CLUBS.map((c) => c.id)].map((cl) => { const it = itemById(topId(TAB.model, cl)); const own = it && owns(it.id); return it ? `<button type="button" class="bl-card${own ? ' own' : ''}" data-it="${it.id}"><span class="bl-pre"></span><b>${cl ? `${CLUB_BY[cl].icon} ${esc(CLUB_BY[cl].name)}` : 'Utan symbol'}</b><span class="bl-tag">${own ? '✓ DIN' : fmt(G.clothesPrice(it))}</span></button>` : ''; }).join('')}</div>`;
    } else {
      intro = 'Kjolarna passar till alla toppar. Den hela dräkten är kjolen sydd ihop med toppen, i toppens färg.';
      cards = Object.values(BOTTOMS).map((b) => { const it = itemById(b.id), own = it && owns(it.id); return it ? `<button type="button" class="bl-card${own ? ' own' : ''}" data-it="${it.id}"><span class="bl-pre"></span><b>${esc(b.name)}</b><span class="bl-tag">${own ? '✓ DIN' : fmt(b.price)}</span></button>` : ''; }).join('');
    }
    const dlg = openModal('📣 Cheerdräkter', `<div class="ch-tabs">${tabs.map(([k, l]) => `<button type="button" class="btn btn-small${tab === k ? ' btn-gold' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <p class="sp">Du har <b>${fmt(G.money)}</b>. ${intro} Vill du välja allt själv? Gå till bordet <b>DESIGNA DRÄKT</b>.</p>${tab === 'toppar' ? cards : `<div class="bl-grid">${cards}</div>`}`, [{ label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-furn');
    dlg.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { play('click'); drakter(b.dataset.tab); }));
    dlg.querySelectorAll('[data-model]').forEach((b) => (b.onclick = () => { play('click'); TAB.model = b.dataset.model; drakter('toppar'); }));
    dlg.querySelectorAll('[data-o]').forEach((b) => { const o = OUTFITS[+b.dataset.o]; b.querySelector('.bl-pre').append(preview(dollLook(suitLook(o), +b.dataset.o))); b.onclick = () => { play('click'); outfitDetail(+b.dataset.o); }; });
    dlg.querySelectorAll('[data-it]').forEach((b) => { const it = itemById(b.dataset.it); b.querySelector('.bl-pre').append(preview(dollLook(lookForItem(it, suitLook({ top: 'cheer', bottom: 'cheerSkirt', c: ['#f4eef2', '#e2d8e2', '#e2d8e2'] }), { colors: true })))); b.onclick = () => { play('click'); tryItem(it.id); }; });
  }
  // en hel dräkt: provas på dig (bara dräkten syns), delarna och priset, köp allt på en gång
  function outfitDetail(i) {
    const o = OUTFITS[i], parts = partsOf(o), price = outfitPrice(o), all = parts.every((p) => p.own);
    const withLook = () => ({ ...strip(A.avatar.look), ...suitLook(o) });
    const dlg = openModal(`✨ ${esc(o.name)}`, `<div class="ch-design"><div class="ch-left">${stageHtml(o.name)}
      <div class="bl-sum"><span>${all ? 'Allt är ditt' : 'Kostar'}</span><b>${all ? '✓' : fmt(price)}</b><span class="sp">Du har ${fmt(G.money)}</span></div></div>
      <div class="bl-pick"><div class="sk-lbl">Det här ingår</div><ul class="bl-list ch-parts">${parts.map((p) => `<li class="${p.own ? 'own' : ''}"><span>${esc(p.name)}</span><b>${p.own ? '✓ din' : `${p.price} kr`}</b></li>`).join('')}</ul>
      <p class="sp">Hela dräkten är 15 % billigare än delarna var för sig, och det du redan har betalar du inte för igen. När du tar på dig den tar du av väskan, halsduken och förklädet – bara cheerdräkten syns.</p>
      <div class="bl-mine"><button type="button" class="btn btn-small" data-edit>🎨 Ändra färgerna vid designbordet</button><button type="button" class="btn btn-small" data-back>⬅ Alla dräkter</button></div></div></div>`,
      [all ? { label: 'Ta på – den är din', cls: 'btn-go', onClick: () => wearOutfit(o) }
        : { label: G.money >= price ? `Köp för ${fmt(price)}` : `Du behöver ${fmt(price - G.money)} till`, cls: 'btn-go', disabled: G.money < price, onClick: () => buyOutfit(o) },
       { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('bl-wide');
    stage(dlg, withLook);
    dlg.querySelector('[data-back]').onclick = () => { play('click'); drakter('hela'); };
    dlg.querySelector('[data-edit]').onclick = () => { play('click'); Object.assign(SEL, { model: o.bottom === 'cheerDress' ? 'hel' : 'set', top: o.top, skirt: o.bottom === 'cheerDress' ? 'cheerSkirt' : o.bottom, club: o.club, main: o.c[0], trim: o.c[1], sym: o.c[2] }); designer(); };
  }
  function wearOutfit(o) { setLook({ ...strip(A.avatar.look), ...suitLook(o) }); closeModal(); play('ok'); toast(`📣 Du har på dig ${o.name}!`, 'good'); say(`HEJA ${CLUB_BY[o.club]?.name.toUpperCase() || ''}!`, keeper.x, keeper.y - 42); }
  function buyOutfit(o) {
    const price = outfitPrice(o); if (G.money < price) return;
    G.money -= price;
    for (const p of partsOf(o)) if (p.id !== 'pompoms' && !owns(p.id)) G.wardrobe.push(p.id);
    G.save();
    if (!ownsPom(o.pom)) store.add({ kind: 'hand', k: 'pompoms', c1: o.pom[0], c2: o.pom[1], look: { hand: ['pompoms', ...o.pom] }, price: POMPOM_PRICE, name: `Pompomer ${colorName(o.pom[0])} och ${colorName(o.pom[1])}` });
    store.add({ kind: 'drakt', sel: { outfit: o.id }, look: suitLook({ ...o, pom: null }), price, name: o.name });
    play('buy'); confetti(me.x, me.y, 30);
    wearOutfit(o);
  }
  // en topp eller kjol: provas på dig med färgerna du väljer
  const ITEM = { id: null, c: {} };
  function tryItem(id) {
    const it = itemById(id); if (!it) return;
    if (ITEM.id !== id) ITEM.c = { ...(it.colors || {}) };
    ITEM.id = id;
    const fields = it.slot === 'top' ? [['shirt', 'Toppens färg'], ['accent', 'Kanterna'], ...(it.look.topPrint && it.look.topPrint !== 'rainbowArc' ? [['print2', 'Symbolen']] : [])]
      : it.look.bottom === 'cheerDress' ? [['shirt', 'Dräktens färg (som toppen)'], ['accent', 'Vecken och kanterna']] : [['pants', 'Kjolens färg'], ['pants2', it.look.bottom === 'cheerStripe' ? 'Ränderna' : 'Vecken']];
    const own = owns(id), price = G.clothesPrice(it);
    const withLook = () => ({ ...lookForItem(it, strip(A.avatar.look)), ...ITEM.c });
    const dlg = openModal(`📣 ${esc(it.name.replace(/­/g, ''))}`, `<div class="ch-design"><div class="ch-left">${stageHtml('Med ' + (it.slot === 'top' ? 'toppen' : 'kjolen'))}
      <div class="bl-sum"><span>${own ? 'Den är din' : 'Kostar'}</span><b>${own ? '✓' : fmt(price)}</b><span class="sp">Du har ${fmt(G.money)}</span></div></div>
      <div class="bl-pick">${fields.map(([f, l]) => swatches(f, COLORS, ITEM.c[f] || '#f4f1ea', l)).join('')}
      <div class="bl-mine"><button type="button" class="btn btn-small" data-back>⬅ Tillbaka</button></div></div></div>`,
      [own ? { label: 'Ta på – den är din', cls: 'btn-go', onClick: () => { setLook(withLook()); closeModal(); play('ok'); toast('📣 Du har bytt till cheerkläderna.', 'good'); } }
        : { label: G.money >= price ? `Köp för ${fmt(price)}` : `Du behöver ${fmt(price - G.money)} till`, cls: 'btn-go', disabled: G.money < price, onClick: () => { if (G.money < price) return; G.money -= price; G.wardrobe.push(id); G.save(); setLook(withLook()); closeModal(); play('buy'); toast(`📣 ${it.name.replace(/­/g, '')} – den är din!`, 'good'); say('SNYGGT! DET PASSAR DIG.', keeper.x, keeper.y - 42); } },
       { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('bl-wide');
    stage(dlg, withLook);
    for (const [f] of fields) dlg.querySelectorAll(`[data-${f}]`).forEach((b) => (b.onclick = () => { ITEM.c[f] = b.dataset[f]; play('click'); tryItem(id); }));
    dlg.querySelector('[data-back]').onclick = () => { play('click'); drakter(TAB.tab); };
  }

  // ---------- DESIGNA DRÄKT: modell, topp, kjol, klubb (symbolen på magen) och färgerna ----------
  const MODELS = [['hel', 'Hel dräkt'], ['set', 'Topp och kjol'], ['topp', 'Bara toppen'], ['kjol', 'Bara kjolen']];
  const SEL = { model: 'hel', top: 'cheer', skirt: 'cheerSkirt', club: 'heart', main: '#e0457e', trim: '#f4f1ea', sym: '#f4f1ea' };
  const hasTop = (m) => m !== 'kjol';
  const selSuit = (s) => ({ top: hasTop(s.model) ? s.top : null, bottom: s.model === 'hel' ? 'cheerDress' : s.model === 'topp' ? null : s.skirt, club: hasTop(s.model) ? s.club : '', c: [s.main, s.trim, s.sym] });
  const selParts = (s) => { const u = selSuit(s), P = []; if (u.top) P.push([topId(u.top, u.club), `${TOPS[u.top].name}${u.club ? ' · ' + CLUB_BY[u.club].name : ''}`, TOPS[u.top].price + (u.club ? SYMBOL_PRICE : 0)]); if (u.bottom) P.push([BOTTOMS[u.bottom].id, BOTTOMS[u.bottom].name, BOTTOMS[u.bottom].price]); return P; };
  const selPrice = (s) => selParts(s).reduce((a, p) => a + p[2], 0) - (selParts(s).length > 1 ? 50 : 0);
  const swatches = (key, list, cur, label) => `<div class="bl-grp"><div class="sk-lbl">${label}</div><div class="dl-sws">${list.map(([n, h]) => `<button type="button" class="dl-sw${cur === h ? ' on' : ''}" data-${key}="${h}" style="background:${h}" title="${esc(n)}" aria-label="${esc(n)}"></button>`).join('')}</div></div>`;
  function designer() {
    const sel = SEL, total = selPrice(sel), u = selSuit(sel), withLook = () => ({ ...strip(A.avatar.look), ...suitLook(u) });
    const mine = store.list().filter((d) => d.kind === 'drakt' && d.sel && d.sel.model), key = JSON.stringify(sel), same = mine.find((d) => JSON.stringify(d.sel) === key);
    const top = hasTop(sel.model), opt = (k, v, n, sub) => `<button type="button" class="btn btn-small${sel[k] === v ? ' btn-gold' : ''}" data-${k}="${v}">${n}${sub ? `<small>${sub}</small>` : ''}</button>`;
    const dlg = openModal('📣 Designa din cheerdräkt', `<div class="ch-design"><div class="ch-left">${stageHtml('Med dräkten')}
      <div class="bl-sum"><span>Kostar</span><b>${fmt(total)}</b><span class="sp">Du har ${fmt(G.money)}</span></div>
      <ul class="bl-list">${selParts(sel).map(([, n, p]) => `<li><span>${esc(n)}</span><b>${p} kr</b></li>`).join('')}${selParts(sel).length > 1 ? '<li><span>Topp och kjol tillsammans</span><b>−50 kr</b></li>' : ''}</ul></div>
      <div class="bl-pick">
        <div class="bl-grp"><div class="sk-lbl">Modell</div><div class="bl-opts">${MODELS.map(([v, n]) => opt('model', v, n)).join('')}</div></div>
        ${top ? `<div class="bl-grp"><div class="sk-lbl">Toppen</div><div class="bl-opts">${Object.entries(TOP_NAMES).map(([v, n]) => opt('top', v, n, `${TOPS[v].price} kr`)).join('')}</div></div>` : ''}
        ${sel.model === 'set' || sel.model === 'kjol' ? `<div class="bl-grp"><div class="sk-lbl">Kjolen</div><div class="bl-opts">${['cheerSkirt', 'cheerStripe'].map((v) => opt('skirt', v, BOTTOMS[v].short, `${BOTTOMS[v].price} kr`)).join('')}</div></div>` : ''}
        ${top ? `<div class="bl-grp"><div class="sk-lbl">Klubb – symbolen på magen</div><div class="bl-opts"><button type="button" class="btn btn-small${!sel.club ? ' btn-gold' : ''}" data-club="">Ingen symbol<small>0 kr</small></button>${CLUBS.map((c) => `<button type="button" class="btn btn-small${sel.club === c.id ? ' btn-gold' : ''}" data-club="${c.id}">${c.icon} ${esc(c.name)}<small>${SYMBOL_PRICE} kr</small></button>`).join('')}</div></div>` : ''}
        ${swatches('main', COLORS, sel.main, sel.model === 'kjol' ? 'Kjolens färg' : 'Dräktens färg')}
        ${swatches('trim', COLORS, sel.trim, sel.model === 'kjol' ? (sel.skirt === 'cheerStripe' ? 'Ränderna' : 'Vecken') : 'Kanterna och vecken')}
        ${top && sel.club && sel.club !== 'rainbowArc' ? swatches('sym', COLORS, sel.sym, 'Symbolens färg') : ''}
        ${mine.length ? `<div class="sk-lbl">Dina egna dräkter</div><div class="bl-mine">${mine.map((d, i) => `<button type="button" class="btn btn-small" data-mine="${i}">📣 ${esc(d.name)}</button>`).join('')}</div>` : ''}</div></div>`,
      [same ? { label: 'Ta på – den är redan din', cls: 'btn-go', onClick: () => { setLook({ ...strip(A.avatar.look), ...same.look }); closeModal(); play('ok'); toast(`📣 Du har på dig ${same.name}.`, 'good'); } }
        : { label: G.money >= total ? `Köp för ${fmt(total)}` : `Du behöver ${fmt(total - G.money)} till`, cls: 'btn-go', disabled: G.money < total, onClick: () => buyDrakt(total) },
       { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('bl-wide');
    stage(dlg, withLook);
    for (const k of ['model', 'top', 'skirt']) dlg.querySelectorAll(`[data-${k}]`).forEach((b) => (b.onclick = () => { sel[k] = b.dataset[k]; play('click'); designer(); }));
    dlg.querySelectorAll('[data-club]').forEach((b) => (b.onclick = () => { const c = CLUB_BY[b.dataset.club]; sel.club = c ? c.id : ''; if (c) [sel.main, sel.trim, sel.sym] = c.c; play('click'); designer(); }));
    for (const k of ['main', 'trim', 'sym']) dlg.querySelectorAll(`[data-${k}]`).forEach((b) => (b.onclick = () => { sel[k] = b.dataset[k]; play('click'); designer(); }));
    dlg.querySelectorAll('[data-mine]').forEach((b) => (b.onclick = () => { Object.assign(sel, mine[+b.dataset.mine].sel); play('click'); designer(); }));
  }
  function buyDrakt(total) {
    if (G.money < total) return;
    const sel = { ...SEL }, u = selSuit(sel), look = suitLook(u);
    const name = `${MODELS.find((m) => m[0] === sel.model)[1]}${hasTop(sel.model) && sel.club ? ' · ' + CLUB_BY[sel.club].name : ''}`;
    G.money -= total;
    for (const [id] of selParts(sel)) if (!owns(id)) G.wardrobe.push(id);
    G.save();
    store.add({ kind: 'drakt', sel, look, price: total, name });
    setLook({ ...strip(A.avatar.look), ...look });
    closeModal(); play('buy'); confetti(me.x, me.y, 30);
    toast(`📣 Din egen dräkt är klar: ${name}!`, 'good');
    say(sel.club ? `HEJA ${CLUB_BY[sel.club].name.toUpperCase()}!` : 'VILKEN SNYGG DRÄKT!', keeper.x, keeper.y - 42);
  }

  // ---------- POMPOMER: två färger ----------
  const PST = { c1: '#e0457e', c2: '#f4f1ea' };
  const ownedHand = (k, c1, c2) => store.list().find((d) => d.kind === 'hand' && d.k === k && (handColors(k) < 1 || d.c1 === c1) && (handColors(k) < 2 || d.c2 === c2));
  function pompomDesigner() {
    const look = () => ({ ...A.avatar.look, hand: ['pompoms', PST.c1, PST.c2] }), same = ownedHand('pompoms', PST.c1, PST.c2);
    const dlg = openModal('🎉 Designa dina pompomer', `<div class="ch-design"><div class="ch-left">${stageHtml('Med pompomerna')}
      <div class="bl-sum"><span>${same ? 'De är dina' : 'Kostar'}</span><b>${same ? '✓' : fmt(POMPOM_PRICE)}</b><span class="sp">Du har ${fmt(G.money)}</span></div></div>
      <div class="bl-pick"><div class="dl-canvas ch-pom"></div>${swatches('c1', COLORS, PST.c1, 'Första färgen')}${swatches('c2', COLORS, PST.c2, 'Andra färgen')}
      <p class="sp">Pompomerna har du i båda händerna. När du sätter dig lägger du ner dem.</p></div></div>`,
      [same ? { label: 'Ta fram dem – de är dina', cls: 'btn-go', onClick: () => { setLook(look()); closeModal(); play('ok'); toast('🎉 Du har pompomerna i händerna.', 'good'); } }
        : { label: G.money >= POMPOM_PRICE ? `Köp för ${fmt(POMPOM_PRICE)}` : `Du behöver ${fmt(POMPOM_PRICE - G.money)} till`, cls: 'btn-go', disabled: G.money < POMPOM_PRICE, onClick: () => buyHand('pompoms', POMPOM_PRICE, PST.c1, PST.c2) },
       { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('bl-wide');
    VIEW.zoom = false; stage(dlg, look);
    const cv = document.createElement('canvas'), P = new Pix(40, 22);
    pompomBlob(P, 10, 11, 8, hexI(PST.c1), hexI(PST.c2), 1); pompomBlob(P, 29, 11, 8, hexI(PST.c1), hexI(PST.c2), 6);
    cv.width = 40 * 4; cv.height = 22 * 4; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(P.flush(), 0, 0, cv.width, cv.height);
    dlg.querySelector('.ch-pom').append(cv);
    for (const k of ['c1', 'c2']) dlg.querySelectorAll(`[data-${k}]`).forEach((b) => (b.onclick = () => { PST[k] = b.dataset[k]; play('click'); pompomDesigner(); }));
  }
  function buyHand(k, price, c1, c2) {
    if (G.money < price) return;
    G.money -= price; G.save();
    const name = k === 'pompoms' ? `Pompomer ${colorName(c1)} och ${colorName(c2)}` : `${HAND_ITEMS[k].label.replace(/­/g, '')}${handColors(k) ? ' ' + colorName(c1) : ''}`;
    store.add({ kind: 'hand', k, c1, c2, look: { hand: [k, c1, c2] }, price, name });
    setLook({ ...A.avatar.look, hand: [k, c1, c2] });
    closeModal(); play('buy');
    toast(`🎉 ${name} – nu håller du ${k === 'pompoms' ? 'dem' : 'den'} i handen!`, 'good');
    say(pickOf(['HEJA HEJA!', 'NU KAN DU HEJA PÅ RIKTIGT!', 'PROVA PÅ SCENEN!']), keeper.x, keeper.y - 42);
  }
  // ---------- I HÄNDERNA ----------
  const HST = { k: 'megafon', c1: '#e0457e', c2: '#f4f1ea' };
  function handCatalog() {
    const card = ([k, pr], i) => { const [c1, c2] = HAND_DEF[k] || ['#e0457e', '#f4f1ea'], own = store.list().some((d) => d.kind === 'hand' && d.k === k); return `<button type="button" class="bl-card${own ? ' own' : ''}" data-i="${i}"><span class="bl-pre" data-c="${c1}" data-c2="${c2}"></span><b>${esc(HAND_ITEMS[k].label)}</b><span class="bl-tag">${own ? '✓ DIN' : fmt(pr)}</span></button>`; };
    const dlg = openModal('📣 I händerna', `<p class="sp">Du har <b>${fmt(G.money)}</b>. Något att hålla i när du hejar – klicka så provar du det. Pompomerna gör du vid bordet <b>DESIGNA POMPOMER</b>.</p><div class="bl-grid">${HAND_SHOP.map(card).join('')}</div>`, [{ label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-furn');
    dlg.querySelectorAll('.bl-card').forEach((b) => {
      const [k] = HAND_SHOP[+b.dataset.i], pre = b.querySelector('.bl-pre');
      pre.append(preview({ ...strip(A.avatar.look), hand: [k, pre.dataset.c, pre.dataset.c2] }, 'full'));
      b.onclick = () => { play('click'); const [c1, c2] = HAND_DEF[k] || ['#e0457e', '#f4f1ea']; Object.assign(HST, { k, c1, c2 }); handItem(); };
    });
  }
  function handItem() {
    const k = HST.k, pr = HAND_SHOP.find((h) => h[0] === k)?.[1] || 99, nc = handColors(k), list = k === 'lysstavar' ? GLOW : COLORS;
    const look = () => ({ ...A.avatar.look, hand: [k, HST.c1, HST.c2] }), same = ownedHand(k, HST.c1, HST.c2);
    const dlg = openModal(`📣 ${HAND_ITEMS[k].label}`, `<div class="ch-design"><div class="ch-left">${stageHtml(`Med ${HAND_ITEMS[k].label.toLowerCase()}`)}
      <div class="bl-sum"><span>${same ? 'Den är din' : 'Kostar'}</span><b>${same ? '✓' : fmt(pr)}</b><span class="sp">Du har ${fmt(G.money)}</span></div></div>
      <div class="bl-pick">${nc >= 1 ? swatches('c1', list, HST.c1, nc === 2 ? 'Första färgen' : 'Färgen') : '<p class="sp">Den här finns bara i en färg.</p>'}${nc >= 2 ? swatches('c2', list, HST.c2, 'Andra färgen') : ''}
      <p class="sp">Du håller den i handen när du går och står. När du sätter dig lägger du ner den.</p></div></div>`,
      [same ? { label: 'Ta fram den – den är din', cls: 'btn-go', onClick: () => { setLook(look()); closeModal(); play('ok'); toast(`📣 Du har ${HAND_ITEMS[k].label.toLowerCase()} i handen.`, 'good'); } }
        : { label: G.money >= pr ? `Köp för ${fmt(pr)}` : `Du behöver ${fmt(pr - G.money)} till`, cls: 'btn-go', disabled: G.money < pr, onClick: () => buyHand(k, pr, HST.c1, HST.c2) },
       { label: 'Tillbaka', onClick: () => handCatalog() }]);
    dlg.classList.add('bl-wide');
    VIEW.zoom = false; stage(dlg, look);
    for (const c of ['c1', 'c2']) dlg.querySelectorAll(`[data-${c}]`).forEach((b) => (b.onclick = () => { HST[c] = b.dataset[c]; play('click'); handItem(); }));
  }

  // ---------- spegeln: allt man köpt här ----------
  function mirror() {
    const ids = new Set([...Object.values(CATS).flatMap((c) => c.ids), ...CHEER_TOPS.flatMap(([, id]) => [id, ...CLUBS.map((c) => `${id}-${c.id.toLowerCase()}`)]), ...Object.values(BOTTOMS).map((b) => b.id)]);
    const owned = [...ids].map(itemById).filter((it) => it && G.ownsWardrobe(it.id));
    const draks = store.list().filter((d) => d.kind === 'drakt'), hands = store.list().filter((d) => d.kind === 'hand');
    const L = A.avatar.look;
    const dlg = openModal('🪞 Spegeln', `<div class="ch-design"><div class="ch-left">${stageHtml(String(A.avatar.name || 'Du'))}</div><div class="bl-pick"><p class="sp">Ta på och av det du har köpt här – figuren visar hur du ser ut.</p>
      ${draks.length ? `<div class="sk-lbl">Dina dräkter</div><div class="bl-mine">${draks.map((d, i) => `<button type="button" class="btn btn-small" data-dr="${i}">📣 ${esc(d.name)}</button>`).join('')}</div>` : ''}
      ${hands.length ? `<div class="sk-lbl">I händerna</div><div class="bl-mine">${hands.map((d, i) => { const on = Array.isArray(L.hand) && L.hand[0] === d.k && L.hand[1] === d.c1 && L.hand[2] === d.c2; return `<button type="button" class="btn btn-small${on ? ' btn-gold' : ''}" data-hd="${i}">${on ? '✓ ' : ''}${esc(d.name)}</button>`; }).join('')}${L.hand ? '<button type="button" class="btn btn-small" data-hd="-1">✋ Lägg ner det du håller i</button>' : ''}</div>` : ''}
      ${owned.length ? `<div class="sk-lbl">Kläder och huvudsaker</div><div class="bl-mine">${owned.map((it) => `<button type="button" class="btn btn-small${wearing(it) ? ' btn-gold' : ''}" data-own="${it.id}">${wearing(it) ? '✓ ' : ''}${esc(it.name.replace(/­/g, ''))}</button>`).join('')}</div>` : ''}
      ${!owned.length && !draks.length && !hands.length ? '<p class="sp">Du har inte köpt något här än. Titta på skyltdockorna, pompomerna och hyllorna!</p>' : ''}</div></div>`,
      [{ label: 'Klar', cls: 'btn-go', onClick: closeModal }]);
    dlg.classList.add('bl-wide');
    stage(dlg, () => A.avatar.look);
    dlg.querySelectorAll('[data-own]').forEach((b) => (b.onclick = () => { const it = itemById(b.dataset.own); play('click'); setLook(wearing(it) ? lookWithoutSlot(it.slot, A.avatar.look) : lookForItem(it, it.slot === 'top' || it.slot === 'bottom' ? strip(A.avatar.look) : A.avatar.look, { colors: true })); mirror(); }));
    dlg.querySelectorAll('[data-dr]').forEach((b) => (b.onclick = () => { play('click'); setLook({ ...strip(A.avatar.look), ...draks[+b.dataset.dr].look }); mirror(); }));
    dlg.querySelectorAll('[data-hd]').forEach((b) => (b.onclick = () => { play('click'); const i = +b.dataset.hd; setLook({ ...A.avatar.look, hand: i < 0 ? null : hands[i].look.hand }); mirror(); }));
  }

  const spotAt = (x, y) => { for (const k of ORDER) { const s = SP[k]; if (s && x >= s.r[0] && x <= s.r[2] && y >= s.r[1] && y <= s.r[3]) return [k, s]; } return null; };
  return {
    enter() { me.x = 192; me.y = 100; me.dir = 'down'; me.path = []; camX = 0; showT = 0; lastBeat = -1; say('VÄLKOMMEN TILL HEJA HEJA!', keeper.x, keeper.y - 42); },
    exit() { song.stop(); if (ducked) { setDuck(0); ducked = false; } },
    update(dt) {
      t += dt; showT += dt;
      if (step(me, dt, 58) && me.then) { const f = me.then; me.then = null; f(); }
      const tc = Math.max(0, Math.min(RW - W, me.x - W / 2)); camX += (tc - camX) * Math.min(1, dt * 5); if (Math.abs(tc - camX) < 0.3) camX = tc;
      // lagets uppvisning och sången i takt (sången hörs mest när man är nära mattan)
      const b = showT / BEAT, k = Math.floor(b);
      choreo(b);
      if (k !== lastBeat) {
        lastBeat = k; const p = k % CYCLE, near = Math.max(0, 1 - Math.abs(me.x - MAT.cx) / 520);
        song.beat(k, 0.32 * (0.35 + 0.65 * near));
        if (WORDS[p]) word = { s: WORDS[p].replace('{P}', playerName()), t, big: p === 26 || p === 20 };
        if (p === 26) { confetti(MAT.cx, MAT.cy - 20, 40); glitter(MAT.cx, MAT.cy - 10, 26); }
        if (p === 27 && Math.random() < 0.6) { const n = pickOf(folk); n.jump = t; }
      }
      if (!ducked) { setDuck(1); ducked = true; }
      // strålkastaren tänds när man står på scenen
      spot += ((onStage(me.x, me.y) ? 1 : 0) - spot) * Math.min(1, dt * 4);
      if (spot > 0.6 && Math.random() < dt * 8) GLIT.push({ x: me.x + (Math.random() - 0.5) * 26, y: me.y - 60, vy: 10 + Math.random() * 14, life: 2.4, ph: Math.random() * 6 });
      for (const n of folk) {
        if (n.path.length) { step(n, dt, 30); continue; }
        n.t -= dt;
        if (n.t <= 0) { const [x, y, d] = pickOf(BROWSE); n.path = path(n.x, n.y, x, y + (Math.random() * 6 - 3)); n.face = d; n.t = 3 + Math.random() * 5; }
        else if (n.face) n.dir = n.face;
      }
      for (const p of CONF) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.vx *= 0.98; p.life -= dt; }
      for (let i = CONF.length - 1; i >= 0; i--) if (CONF[i].life <= 0 || CONF[i].y > H) CONF.splice(i, 1);
      for (const g of GLIT) { g.y += g.vy * dt; g.life -= dt; }
      for (let i = GLIT.length - 1; i >= 0; i--) if (GLIT[i].life <= 0) GLIT.splice(i, 1);
    },
    draw(ctx) {
      const cx0 = cam(), pulse = (showT / BEAT) % 1;
      ctx.setTransform(A.pxs, 0, 0, A.pxs, -cx0 * A.pxs, 0); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bg, 0, 0);
      // glödlamporna runt skylten och över scenen blinkar i takt
      BULBS.forEach(([x, y], i) => { const on = ((i + Math.floor(showT / BEAT)) % 3) !== 0 || (spot > 0.5 && x > 500); ctx.fillStyle = on ? (i % 2 ? '#fff6c0' : '#ffe08a') : '#a8865a'; ctx.fillRect(x - 1, y - 1, 2, 2); });
      for (const lx of [96, 272, 456]) { ctx.fillStyle = '#80879a'; ctx.fillRect(lx, 8, 1, 6); ctx.fillStyle = '#fffbe8'; ctx.fillRect(lx - 4, 14, 9, 2); ctx.fillStyle = 'rgba(255,246,208,0.13)'; ctx.fillRect(lx - 14, 16, 29, 10); }
      // strålkastarna: ljuskäglor från taket ner på den som står på scenen
      if (spot > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const lx of [574, 628]) { ctx.fillStyle = `rgba(255,244,210,${0.13 * spot})`; ctx.beginPath(); ctx.moveTo(lx - 2, 18); ctx.lineTo(lx + 2, 18); ctx.lineTo(me.x + 15, me.y + 2); ctx.lineTo(me.x - 15, me.y + 2); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = `rgba(255,250,225,${0.35 * spot})`; ctx.beginPath(); ctx.ellipse(me.x, me.y, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      const fig = (o, look) => { const j = jumpY(o), moving = o.path.length, cheering = j || (t - o.jump < 1.4 && t - o.jump >= 0); const fr = cheering ? (Math.floor((t - o.jump) * 6) % 2 ? 10 : 11) : moving ? WALK[Math.floor(o.dist / 7.3) % 4] : 0; drawPerson(ctx, Math.round(o.x), Math.round(o.y) - j, look, cheering ? 'down' : o.dir, fr); };
      const list = F.map((f) => ({ fy: f.fy, draw: () => { if (f.doll) drawPerson(ctx, f.doll.x, f.doll.y, f.doll.look, 'down', 0); else { ctx.drawImage(f.img, f.x, f.fy - f.h); if (f.speaker) { const r = pulse < 0.25 ? 1 : 0; if (r) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(f.x + 1, f.fy - f.h + 10, 12, 12); } } } } }));
      list.push({ fy: keeper.y, draw: () => drawPerson(ctx, keeper.x, keeper.y, keeper.look, Math.sin(t * 0.5) > 0.8 ? 'left' : 'down', Math.sin(t * 2) > 0.93 ? 4 : 0) });
      for (const n of folk) list.push({ fy: n.y, draw: () => fig(n, n.look) });
      team.forEach((m) => list.push({ fy: m.y + m.lvl * 0.3, draw: () => drawPerson(ctx, Math.round(m.x), Math.round(m.y) - m.lift, m.pom ? m.look : m.bare, m.dir, m.fr) }));
      list.push({ fy: me.y + 0.01, draw: () => fig(me, A.avatar.look) });
      list.sort((a, b) => a.fy - b.fy); for (const d of list) d.draw();
      if (spot > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,200,${0.1 * spot})`; ctx.fillRect(Math.round(me.x) - 10, Math.round(me.y) - 34, 20, 34); ctx.restore(); }
      for (const p of CONF) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, (Math.floor(p.life * 10) & 1) ? 1 : 2); }
      for (const g of GLIT) { const on = Math.sin(t * 9 + g.ph) > 0; ctx.fillStyle = on ? '#ffffff' : '#ffe8a0'; ctx.fillRect(Math.round(g.x), Math.round(g.y), 1, 1); if (on) { ctx.fillRect(Math.round(g.x) - 1, Math.round(g.y), 3, 1); ctx.fillRect(Math.round(g.x), Math.round(g.y) - 1, 1, 3); } }
      for (const s of SPARK) { const v = Math.sin(t * s.sp + s.ph); if (v < 0.72) continue; const r = v > 0.93 ? 2 : 1; ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(Math.round(s.x) - r, Math.round(s.y), r * 2 + 1, 1); ctx.fillRect(Math.round(s.x), Math.round(s.y) - r, 1, r * 2 + 1); }
      for (const k of ['drakt', 'pompom']) { const sp = SP[k], x = Math.round((sp.r[0] + sp.r[2]) / 2), on = Math.sin(t * 3 + x) > 0.2; ctx.fillStyle = on ? '#fff6a0' : '#f6d02f'; ctx.fillRect(x, 175 - (on ? 2 : 1), 1, on ? 5 : 3); ctx.fillRect(x - (on ? 2 : 1), 175, on ? 5 : 3, 1); }
      // lagets ramsa: orden i stor text över mattan, i takt
      if (word && t - word.t < BEAT * 1.6) {
        const k = word.s.length <= 8 ? 2 : 1, w = textW(BIG, word.s, k), th = 7 * k, top = Math.min(...team.map((m) => m.y - m.lift)) - 36;
        const bx = Math.round(MAT.cx - w / 2) - 5, by = Math.round(top - th - 8) - (t - word.t < 0.12 ? 2 : 0), bw = w + 10, bh = th + 8;
        ctx.fillStyle = '#0e2f66'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2); ctx.fillStyle = word.big ? '#f6d02f' : '#ffffff'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#e0457e'; ctx.fillRect(bx, by + bh - 2, bw, 2); ctx.fillStyle = '#0e2f66'; ctx.fillRect(MAT.cx - 2, by + bh + 1, 5, 1); ctx.fillRect(MAT.cx - 1, by + bh + 2, 3, 1); ctx.fillRect(MAT.cx, by + bh + 3, 1, 1);
        ctxText(ctx, BIG, word.s, bx + 5, by + 4, word.big ? '#e0457e' : '#1d51a0', k);
      }
      if (bubble && t < bubble.until) { const w = textW(SMALL, bubble.s) + 8, x = Math.max(cx0 + 2, Math.min(cx0 + W - w - 2, Math.round(bubble.x - w / 2))), y = Math.max(2, bubble.y); ctx.fillStyle = '#17151a'; ctx.fillRect(x - 1, y - 1, w + 2, 11); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, 9); ctx.fillRect(Math.round(bubble.x) - 1, y + 9, 3, 2); ctxText(ctx, SMALL, bubble.s, x + 4, y + 2, '#17151a'); }
      if (hover) { const w = textW(SMALL, hover.label) + 6, x = Math.max(cx0 + 2, Math.min(cx0 + W - w - 2, Math.round(hover.x - w / 2))), y = Math.max(2, Math.round(hover.y) - 14); ctx.fillStyle = '#17151a'; ctx.fillRect(x, y, w, 9); ctxText(ctx, SMALL, hover.label, x + 3, y + 2, '#ffd23f'); }
    },
    down(sx, y) {
      const x = sx + cam(), s = spotAt(x, y);
      if (s) { const [, sp] = s; walkTo(sp.go[0], sp.go[1], () => { me.dir = sp.face || 'up'; sp.act(); }); return; }
      if (y > WALL + 4) walkTo(x, y);
    },
    move(sx, y) { const x = sx + cam(), s = spotAt(x, y); hover = s ? { label: s[1].label, x, y } : null; },
    up() {},
    key(k) { if (k === 'Escape') me.path = []; },
    _debug: { spots: () => Object.fromEntries(Object.entries(SP).map(([k, s]) => [k, s.r])), me: () => ({ x: me.x, y: me.y, jump: me.jump }), cam: () => cam(), sel: () => ({ ...SEL }), cheer, walk: (x, y) => walkTo(x, y), spot: () => spot, team: () => team.map((m) => [Math.round(m.x), Math.round(m.y) - m.lift, m.fr]), show: (beat) => { showT = beat * BEAT; lastBeat = Math.floor(beat) - 1; } },
  };
}
export const CHEER_PREVIEW = { pompomBlob, miniUniform, CLUBS, OUTFITS };
