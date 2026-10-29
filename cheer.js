// HEJA HEJA – cheerleadingbutiken i Galleria Stjärnan (Pixelskolan, Carl 2026-10-29: "en cheerleadning butik där man kan
// köpa dräkt, överdel, underdel eller hel dräkt, man ska kunna köpa pom poms och tiara att ha på huvudet och cheerleadning
// skor … massa saker man kan köpa att hålla i händer eller ha på huvudet. dräkterna ska kunna ha olika symboler på magen
// för de olika klubbarna, hjärtan, stjärnor, blixtar osv").
// Samma butiksgränssnitt som DRÖMLAND (bling.js): enter/exit/update/draw/down/move/up/key, kameran följer figuren (RW).
//   vänster:  DRÄKTER på galgar (klubbarnas toppar, kjolen och hela dräkten), provdockorna och bordet DESIGNA DRÄKT
//             (modell, klubb = symbolen på magen, färgerna)
//   mitten:   dörren UT med skylten, spegeln, cheermattan (tryck på den så hejar du) och kassan
//   höger:    POMPOMER (lårarna och bordet där man väljer pompomernas färger), HUVUDET (rosetter, diadem, tiaror),
//             I HÄNDERNA (megafon, flagga, ballong …) och skohyllan med cheerskorna
// Allt syns på figuren: tops.js cheer + klubbarnas tryck, bottoms.js cheerSkirt/cheerDress/cheerShoes, acc.js rosetten,
// diademen och tiarorna, people.js look.hand (det man håller i händerna). Kläderna och huvudsakerna är spelets egna
// plagg (G.wardrobe, provas som i klädaffären); dräkterna man designat och sakerna i händerna sparar skola.js (opts.store).
import { Pix, SMALL, BIG, textW, text as pixText, ctxText, mix, mul, hash, bayer } from './sf/js/core/floor-pix.js';
import { drawPerson, personSprite, makeLookRich, HAND_ITEMS } from './sf/js/core/people.js';
import { openModal, closeModal, esc, toast } from './sf/js/core/ui.js';
import { itemById, lookForItem, lookWithoutSlot, isWorn } from './sf/js/data/wardrobe.js';
import { fmt } from './sf/js/game.js';
import { play } from './sf/js/core/sound.js';
import { openBuy, figure } from './sf/js/scenes/klader/buy.js';

const W = 384, H = 216, WALL = 90, RW = 544;
const WALK = [1, 3, 2, 3];
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
const hexI = (h) => parseInt(String(h).slice(1), 16);

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
// dräktens modeller: vad man får och vad det kostar (symbolen kostar 50 kr till när toppen är med)
const MODELS = [['set', 'Topp och kjol', 349], ['hel', 'Hel dräkt', 449], ['topp', 'Bara toppen', 199], ['kjol', 'Bara kjolen', 199]];
const SYMBOL_PRICE = 50;
const modelOf = (id) => MODELS.find((m) => m[0] === id) || MODELS[0];
const hasTop = (m) => m !== 'kjol';
const draktPrice = (sel) => modelOf(sel.model)[2] + (hasTop(sel.model) && sel.club ? SYMBOL_PRICE : 0);
function draktLook(sel) {   // dräkten på figuren + plaggen den består av (spelets garderob)
  const look = {}, ids = [];
  if (hasTop(sel.model)) { Object.assign(look, { top: 'cheer', topPrint: sel.club || 'none', shirt: sel.main, accent: sel.trim, print2: sel.sym }); ids.push(sel.club ? `top-cheer-${sel.club.toLowerCase()}` : 'top-cheer'); }
  if (sel.model === 'hel') { Object.assign(look, { bottom: 'cheerDress', bottomPrint: 'none' }); ids.push('bottom-cheerDress'); }
  if (sel.model === 'set' || sel.model === 'kjol') { Object.assign(look, { bottom: 'cheerSkirt', bottomPrint: 'none', pants: sel.main, pants2: sel.trim }); ids.push('bottom-cheerSkirt'); }
  return { look, ids };
}
const draktName = (sel) => `${modelOf(sel.model)[1]}${hasTop(sel.model) && sel.club ? ' · ' + CLUB_BY[sel.club].name : ''}`;

// ---------- sakerna man håller i händerna (people.js HAND_ITEMS) ----------
const HAND_SHOP = [['megafon', 129], ['flagga', 89], ['skylt', 79], ['ballong', 49], ['band', 119], ['stav', 99], ['trollstav', 99], ['skumhand', 69], ['lysstavar', 59], ['pokal', 299], ['flaska', 39]];
const POMPOM_PRICE = 149;
const handColors = (k) => { const H = HAND_ITEMS[k]; if (!H) return 0; if (H.two) return 2; const s = H.f[2].join(''); return (/[aAq]/.test(s) ? 1 : 0) + (/[bB]/.test(s) ? 1 : 0); };
const HAND_DEF = { megafon: ['#e0457e', '#f4f1ea'], flagga: ['#1d51a0', '#f6d02f'], skylt: ['#e0457e', '#f4f1ea'], ballong: ['#d9433b', '#f4f1ea'], band: ['#8e5bd1', '#f4f1ea'], skumhand: ['#1d51a0', '#f4f1ea'], lysstavar: ['#5cff9c', '#ff5cf0'], flaska: ['#6fb4e8', '#f4f1ea'], pompoms: ['#e0457e', '#f4f1ea'] };
const GLOW = [['grön', '#5cff9c'], ['rosa', '#ff5cf0'], ['blå', '#5cc8ff'], ['gul', '#fff05c'], ['orange', '#ffa04c'], ['lila', '#b27cff']];

// ---------- sortimentet på väggarna (spelets plagg, provas som i klädaffären) ----------
const CATS = {
  drakter: { title: '📣 Cheerdräkter', ids: ['top-cheer-heart', 'top-cheer-star', 'top-cheer-bolt', 'top-cheer-crown', 'top-cheer-paw', 'top-cheer-moon', 'top-cheer-flame', 'top-cheer-diamond', 'top-cheer-flower', 'top-cheer-butterfly', 'top-cheer-rainbowarc', 'top-cheer', 'bottom-cheerSkirt', 'bottom-cheerDress'] },
  huvud: { title: '🎀 På huvudet', ids: ['hat-cheerbow', 'hat-starband', 'hat-heartband', 'hat-glitterband', 'hat-hearttiara', 'hat-startiara', 'hat-tiara', 'hat-crown', 'hat-bow', 'hat-sweatband', 'hairacc-bowclip'] },
  skor: { title: '👟 Skor', ids: ['shoes-cheerShoes', 'shoes-sneakers', 'shoes-highTops', 'shoes-ballerina'] },
};

// ---------- butiken: bakgrunden ----------
const PINK = 0xe0457e, PINKL = 0xf5a3c7, PINKD = 0xa82a5a, BLUE = 0x1d51a0, BLUEL = 0x6fb4e8, BLUED = 0x0e2f66, YEL = 0xf6d02f, YELD = 0xc09a10, WHITE = 0xf8f6f0, CREAM = 0xfff8ee;
const DOOR = { x0: 178, x1: 206 };
const MAT = { cx: 196, cy: 152, rx: 70, ry: 24 };
function stamp(P, rows, x, y, pal) { rows.forEach((r, j) => [...r].forEach((ch, i) => { const c = pal[ch]; if (c !== undefined) P.px(x + i, y + j, c); })); }
function pompomBlob(P, cx, cy, r, c1, c2, seed) {   // en pompom på hyllan: band i två färger med glans
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = x * x + y * y; if (d > r * r + 1 + (hash(x, y, seed) > 0.7 ? 2 : 0)) continue;
    const band = ((x * 2 + y * 3 + seed) % 3 + 3) % 3, c = band === 0 ? c2 : c1;
    P.px(cx + x, cy + y, (x + y + seed) % 5 === 0 ? mix(c, 0xffffff, 0.55) : y < 0 && x < 0 ? mix(c, 0xffffff, 0.2) : y > 1 ? mul(c, 0.8) : c);
  }
}
function miniUniform(P, x, y, sh, ac, pr, club) {   // en dräkt på galge (11 × 20): topp med symbol + veckad kjol
  P.line(x + 2, y + 3, x + 5, y, 0x8a929c); P.line(x + 8, y + 3, x + 5, y, 0x8a929c); P.px(x + 5, y - 1, 0x8a929c); P.px(x + 6, y - 2, 0x8a929c);   // galgen
  const S = hexI(sh), A = hexI(ac), R = hexI(pr);
  for (let j = 0; j < 9; j++) for (let i = 1; i < 10; i++) { if (j === 0 && (i === 1 || i === 9 || (i > 3 && i < 7))) continue; P.px(x + i, y + 3 + j, i === 1 ? mix(S, 0xffffff, 0.2) : i === 9 ? mul(S, 0.75) : S); }
  P.px(x + 3, y + 3, A); P.px(x + 7, y + 3, A); P.px(x + 4, y + 4, A); P.px(x + 6, y + 4, A); P.hl(x + 2, y + 11, 7, A);   // v-ringningen och randen
  const SYM = { heart: ['#.#', '###', '.#.'], star: ['.#.', '###', '#.#'], bolt: ['.##', '.#.', '##.'], crown: ['#.#', '###', '###'], paw: ['#.#', '.#.', '###'], moon: ['.##', '#..', '.##'], flame: ['.#.', '##.', '###'], diamond: ['###', '###', '.#.'], flower: ['#.#', '.#.', '#.#'], butterfly: ['#.#', '###', '#.#'], rainbowArc: ['###', '#.#', '#.#'] }[club];
  if (SYM) stamp(P, SYM, x + 4, y + 6, { '#': R });
  if (club === 'rainbowArc') { P.hl(x + 4, y + 6, 3, 0xd83a4a); P.px(x + 4, y + 7, 0xf6d02f); P.px(x + 6, y + 7, 0xf6d02f); P.px(x + 4, y + 8, 0x46a35a); P.px(x + 6, y + 8, 0x46a35a); }
  for (let j = 0; j < 6; j++) for (let i = -(j >> 1); i < 11 + (j >> 1); i++) P.px(x + i, y + 12 + j, j >= 3 && (i % 3 + 3) % 3 === 1 ? A : (i % 3 + 3) % 3 === 2 ? mul(S, 0.8) : S);
}
function paintBG() {
  const P = new Pix(RW, H);
  // väggen: ljusblå med vita lodränder, rosa list överst och en panel i rosa nertill
  for (let y = 0; y < WALL; y++) for (let x = 0; x < RW; x++) {
    let c = (x % 16) < 8 ? 0xd4e6f8 : 0xe4f0fb;
    if (y < 6) c = y === 5 ? PINKD : PINK; else if (y < 8) c = y === 6 ? PINKL : WHITE;
    if (y >= WALL - 20) { c = y === WALL - 20 ? WHITE : y === WALL - 19 ? YEL : (x % 24 === 0 || x % 24 === 23) ? PINKD : PINK; if (y > WALL - 19 && y < WALL - 1 && (x + y) % 24 === 6) c = mix(c, 0xffffff, 0.25); }
    if (y === WALL - 1) c = PINKD;
    P.px(x, y, c);
  }
  // vimplarna i taket: en lina med trekantiga flaggor i rosa, gult, blått och vitt
  const FLAG = [PINK, YEL, BLUE, WHITE];
  for (let x = 2, k = 0; x < RW - 6; x += 9, k++) {
    const sag = (xx) => 9 + Math.round(3 * Math.sin(((xx % 72) / 72) * Math.PI));
    P.px(x, sag(x), 0x6a5a7a); for (let i = 1; i < 9; i++) P.px(x + i, sag(x + i), 0x6a5a7a);
    const c = FLAG[k % 4], y0 = sag(x + 4) + 1;
    for (let j = 0; j < 6; j++) for (let i = j >> 1; i < 7 - (j >> 1); i++) P.px(x + 1 + i, y0 + j, i === (j >> 1) ? mix(c, 0xffffff, 0.3) : c);
  }
  // golvet: ljust trägolv som i en gympasal, med linjer
  for (let y = WALL; y < H; y++) for (let x = 0; x < RW; x++) {
    const row = Math.floor((y - WALL) / 6), lx = (x + (row % 3) * 17) % 52, ly = (y - WALL) % 6;
    let c = mix(0xe8c890, 0xdcb478, hash(Math.floor((x + (row % 3) * 17) / 52), row, 5) * 0.8);
    if (ly === 0) c = mul(c, 0.86); else if (lx === 0) c = mul(c, 0.9); else if (ly === 1) c = mix(c, 0xffffff, 0.12);
    if ((x + y * 3) % 23 === 0 && ly > 1) c = mul(c, 0.95);
    P.px(x, y, c);
  }
  for (let x = 0; x < RW; x++) { P.px(x, WALL, 0x000000, 0.18); P.px(x, WALL + 1, 0x000000, 0.08); }
  for (let x = 0; x < RW; x++) if (x % 3 !== 1) P.px(x, 196, BLUE, 0.55);   // gympasalens linje
  // cheermattan: blå med vit kant, rosa stjärna i mitten och texten HEJA!
  for (let y = MAT.cy - MAT.ry - 1; y <= MAT.cy + MAT.ry + 1; y++) for (let x = MAT.cx - MAT.rx - 1; x <= MAT.cx + MAT.rx + 1; x++) {
    const e = ((x - MAT.cx) / MAT.rx) ** 2 + ((y - MAT.cy) / MAT.ry) ** 2; if (e > 1) continue;
    let c = e > 0.9 ? WHITE : e > 0.82 ? BLUED : (Math.floor((x - MAT.cx) / 8) + Math.floor((y - MAT.cy) / 6)) % 2 ? BLUE : mix(BLUE, BLUEL, 0.18);
    if (e > 0.62 && e < 0.66) c = mix(BLUE, 0xffffff, 0.5);
    P.px(x, y, c);
  }
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i & 1 ? 5 : 12; return [Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.62]; });
  const inStar = (x, y) => { let o = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) o = !o; } return o; };
  for (let y = -9; y <= 9; y++) for (let x = -18; x <= 18; x++) if (inStar(x + 0.5, y + 0.5)) P.px(MAT.cx + x, MAT.cy - 2 + y, inStar(x + 2.5, y + 1.5) && inStar(x - 1.5, y - 0.5) ? PINK : PINKL);
  const ht = 'HEJA!', hw = textW(SMALL, ht); pixText(P, SMALL, ht, MAT.cx - (hw >> 1), MAT.cy + 11, WHITE);
  // dörren UT med skylten HEJA HEJA ovanför
  P.rect(DOOR.x0 - 3, 46, DOOR.x1 - DOOR.x0 + 6, WALL - 46, PINKD); P.rect(DOOR.x0 - 2, 47, DOOR.x1 - DOOR.x0 + 4, 1, PINKL);
  for (let y = 49; y < WALL - 1; y++) for (let x = DOOR.x0; x < DOOR.x1; x++) { let c = mix(0xbfe6f6, 0xe8f6fc, (y - 49) / 40); if (x === (DOOR.x0 + DOOR.x1) >> 1) c = PINKD; if ((x - y + 400) % 11 < 2) c = mix(c, 0xffffff, 0.6); P.px(x, y, c); }
  P.rect(183, 38, 18, 8, 0x2a8a4a); P.box(183, 38, 18, 8, 0x1a5a2a); pixText(P, SMALL, 'UT', 188, 39, 0xffffff);
  const nm = 'HEJA HEJA', tw = textW(BIG, nm, 2), nx = 192 - (tw >> 1);
  for (let y = 12; y < 35; y++) for (let x = nx - 10; x < nx + tw + 10; x++) P.px(x, y, mix(PINK, 0xf07ab0, (y - 12) / 23 + (bayer(x, y) - 0.5) * 0.1));
  P.box(nx - 10, 12, tw + 20, 23, WHITE); P.box(nx - 9, 13, tw + 18, 21, YEL);
  pixText(P, BIG, nm, nx, 19, BLUED, 1, 2); pixText(P, BIG, nm, nx, 17, WHITE, 1, 2);
  pompomBlob(P, nx - 15, 24, 5, YEL, WHITE, 3); pompomBlob(P, nx + tw + 14, 24, 5, BLUEL, WHITE, 7);   // pompomer i skyltens ändar
  // skyltarna på väggarna
  const plate = (x, s, c = BLUE) => { const w = textW(SMALL, s) + 10; P.rect(x, 18, w, 11, c); P.box(x, 18, w, 11, BLUED); P.hl(x + 1, 19, w - 2, mix(c, 0xffffff, 0.35)); pixText(P, SMALL, s, x + 5, 21, WHITE); return w; };
  plate(40, 'DRÄKTER'); plate(282, 'POMPOMER', PINK); plate(374, 'HUVUDET'); plate(462, 'I HÄNDERNA', PINK);
  // vänster: klädstången med klubbarnas dräkter
  P.hl(6, 34, 132, 0xc4c9d4); P.hl(6, 35, 132, 0x80879a); P.rect(6, 33, 2, 4, 0x80879a); P.rect(136, 33, 2, 4, 0x80879a);
  CLUBS.slice(0, 10).forEach((cl, i) => miniUniform(P, 9 + i * 13, 37, ...cl.c, cl.id));
  P.rect(6, 62, 132, 3, WHITE); P.hl(6, 65, 132, 0xa8b0bc); P.hl(6, 66, 132, 0x000000, 0.12);   // hyllan under: vikta kjolar
  for (let k = 0; k < 11; k++) { const c = hexI(CLUBS[k].c[0]), a = hexI(CLUBS[k].c[1]), x = 9 + k * 12; P.rect(x, 57, 10, 5, c); P.hl(x, 57, 10, mix(c, 0xffffff, 0.3)); for (let i = 1; i < 10; i += 3) P.px(x + i, 60, a); }
  // spegeln till vänster om dörren
  P.rect(148, 40, 24, 48, YEL); P.box(148, 40, 24, 48, YELD); P.hl(149, 41, 22, 0xfff6c0);
  for (let y = 43; y < 85; y++) for (let x = 151; x < 169; x++) { let c = mix(0xd8eef8, 0xf6fbff, (y - 43) / 42); if ((x - y + 300) % 13 < 3) c = mix(c, 0xffffff, 0.7); P.px(x, y, c); }
  stamp(P, ['.#.', '###', '.#.'], 159, 36, WHITE);
  // POMPOMER: tre hyllor fulla med pompomer i alla färger
  const PC = [[PINK, WHITE], [YEL, BLUE], [BLUE, WHITE], [0x8e5bd1, YEL], [0xd9433b, WHITE], [0x46a35a, WHITE], [0x2b2a33, YEL], [0x6fb4e8, PINKL], [0xf0b429, WHITE], [0x2aa39a, PINK], [0xf5a3c7, WHITE], [0xe07a2e, 0x2b2a33]];
  for (let r = 0; r < 3; r++) {
    const sy = 42 + r * 15; P.rect(262, sy + 6, 96, 2, WHITE); P.hl(262, sy + 8, 96, 0xa8b0bc); P.hl(262, sy + 9, 96, 0x000000, 0.12);
    for (let k = 0; k < 8; k++) { const [a, b] = PC[(k + r * 5) % PC.length]; pompomBlob(P, 267 + k * 12, sy + 2, 4, a, b, k * 3 + r); }
  }
  // HUVUDET: två hyllor (huvudena med rosetter och tiaror ritas på i makeShopCheer – spelets figurer)
  for (const sy of [52, 76]) { P.rect(364, sy, 76, 2, WHITE); P.hl(364, sy + 2, 76, 0xa8b0bc); P.hl(364, sy + 3, 76, 0x000000, 0.12); }
  // I HÄNDERNA: hålplatta med sakerna på krokar (ritas i makeShopCheer ur people.js mallar)
  for (let y = 34; y < 82; y++) for (let x = 448; x < 540; x++) P.px(x, y, (x - 448) % 6 === 3 && (y - 34) % 6 === 3 ? 0xf0c8dc : 0xfbe4ef);
  P.box(447, 33, 94, 50, PINKD);
  return P.flush();
}

// ---------- möblerna (ritas sorterade efter fotlinjen) ----------
function tableSprite(kind) {   // borden: DESIGNA DRÄKT (tygrullar, sax, symboler) och DESIGNA POMPOMER (band i alla färger)
  const w = 70, h = 32, P = new Pix(w, h);
  P.rect(0, 8, w, 6, WHITE); P.hl(0, 8, w, 0xffffff); P.hl(0, 13, w, BLUED); P.rect(0, 14, w, 14, BLUE); P.box(0, 14, w, 14, YEL);
  P.rect(2, 28, 3, 4, BLUED); P.rect(w - 5, 28, 3, 4, BLUED);
  const name = kind === 'drakt' ? 'DRÄKT' : 'POMPOMER';
  pixText(P, SMALL, 'DESIGNA', (w - textW(SMALL, 'DESIGNA')) >> 1, 16, YEL); pixText(P, SMALL, name, (w - textW(SMALL, name)) >> 1, 22, WHITE);
  if (kind === 'drakt') {
    [PINK, YEL, 0x8e5bd1, 0x2aa39a].forEach((c, k) => { P.rect(5 + k * 8, 3, 6, 6, c); P.hl(5 + k * 8, 3, 6, mix(c, 0xffffff, 0.4)); P.vl(10 + k * 8, 3, 6, mul(c, 0.7)); });
    stamp(P, ['#.#', '###', '.#.'], 42, 3, { '#': PINK }); stamp(P, ['.#.', '###', '#.#'], 47, 3, { '#': YEL }); stamp(P, ['.##', '.#.', '##.'], 52, 3, { '#': 0xffffff });
    P.line(58, 4, 64, 10, 0x8a929c); P.line(64, 4, 58, 10, 0x8a929c); P.px(57, 3, 0xd83a4a); P.px(65, 3, 0xd83a4a);   // saxen
  } else {
    const C = [PINK, YEL, BLUE, 0x8e5bd1, 0xd9433b, 0x46a35a, WHITE, 0xf0b429];
    C.forEach((c, k) => { P.vl(5 + k * 3, 2, 7, c); P.vl(6 + k * 3, 3, 6, mul(c, 0.8)); });
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
function shoeShelfSprite() {   // skohyllan: låg hylla med skor och skylten SKOR
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
function trophySprite() {   // pokalhyllan vid kassan
  const P = new Pix(20, 26);
  P.rect(0, 22, 20, 4, 0xa8743e); P.hl(0, 22, 20, 0xc8945e);
  for (const [x, h, c] of [[2, 14, 0xe8b830], [8, 18, 0xe8b830], [14, 11, 0xc4c9d4]]) {
    P.rect(x, 22 - h, 5, 5, c); P.px(x, 22 - h, mix(c, 0xffffff, 0.6)); P.px(x - 1, 23 - h, c); P.px(x + 5, 23 - h, c);
    P.vl(x + 2, 27 - h, h - 7, mul(c, 0.8)); P.rect(x + 1, 20, 3, 2, mul(c, 0.8));
  }
  return P.flush();
}
function plantSprite() { const P = new Pix(14, 26); P.rect(3, 18, 8, 8, PINK); P.hl(2, 18, 10, PINKL); P.vl(10, 19, 7, PINKD); for (let y = 0; y < 19; y++) for (let x = 0; x < 14; x++) { const e = ((x - 7) / 6.5) ** 2 + ((y - 9) / 9.5) ** 2 + (hash(x, y, 5) - 0.5) * 0.4; if (e < 1) P.px(x, y, e < 0.3 && x < 7 ? 0x8cc462 : e < 0.6 ? 0x5a9e46 : 0x3a7e38); } return P.flush(); }
function benchSprite() { const P = new Pix(30, 12); P.rect(0, 2, 30, 5, BLUE); P.hl(0, 2, 30, BLUEL); P.hl(0, 6, 30, BLUED); P.rect(2, 7, 2, 5, 0x8a929c); P.rect(26, 7, 2, 5, 0x8a929c); for (let x = 3; x < 28; x += 6) P.px(x, 4, YEL); return P.flush(); }

// ---------- scenen ----------
export function makeShopCheer(A, opts = {}) {
  const G = A.game, store = opts.store || { list: () => [], add() {} };
  const bg = paintBG();
  const doll = (look) => ({ skin: '#ebe3e8', hair: '#ebe3e8', style: 'bald', top: 'tee', shirt: '#f4eef2', bottom: 'skirt', pants: '#cfc6c0', kid: true, build: 4, shoeType: 'normal', shoes: '#f4f1ea', ...look });
  {
    const c = bg.getContext('2d'); c.imageSmoothingEnabled = false;
    // huvudena på hyllorna: spelets figurer med rosetterna, diademen och tiarorna på
    const HEADS = [['hat-cheerbow', '#e0457e'], ['hat-starband', '#1d51a0'], ['hat-heartband', '#e0457e'], ['hat-hearttiara'], ['hat-startiara'], ['hat-glitterband', '#8e5bd1'], ['hat-tiara'], ['hat-cheerbow', '#f6d02f']];
    HEADS.forEach(([id, cap], i) => {
      const it = itemById(id); if (!it) return;
      const L = doll({ kid: false, build: 5, ...it.look, ...(it.colors || {}), ...(cap ? { cap } : {}) });
      c.drawImage(personSprite(L, 'down', 0), 4, 0, 16, 20, 366 + (i % 4) * 18, (i < 4 ? 52 : 76) - 20, 16, 20);
    });
    // hålplattan: sakerna i händerna i dubbel storlek ur figurernas egna mallar
    const P = { a: 0, A: 0, q: 0, b: 0, B: 0, w: '#f4f1ea', W: '#d2cdc0', s: '#c4c9d4', S: '#f4f6fa', z: '#80879a', g: '#e8b830', G: '#fff0a0', y: '#a87a1c', t: '#f8d860', k: '#2a2630' };
    const hook = (x, y) => { c.fillStyle = '#8a929c'; c.fillRect(x, y, 2, 1); c.fillRect(x + 1, y + 1, 1, 2); };
    const items = [['megafon', 451, 40], ['flagga', 466, 38], ['skylt', 482, 38], ['ballong', 500, 36], ['skumhand', 516, 42], ['trollstav', 530, 40], ['band', 452, 62], ['stav', 468, 60], ['pokal', 482, 64], ['lysstavar', 498, 62], ['flaska', 514, 64], ['megafon', 526, 62]];
    items.forEach(([k, x, y], i) => {
      const Hd = HAND_ITEMS[k], [c1, c2] = HAND_DEF[k] || ['#e0457e', '#f4f1ea'], c1d = '#' + mul(hexI(c1), 0.75).toString(16).padStart(6, '0'), c1l = '#' + mix(hexI(c1), 0xffffff, 0.35).toString(16).padStart(6, '0');
      const pal = { ...P, a: c1, A: c1l, q: c1d, b: c2, B: c2 };
      hook(x + 3, y - 3);
      if (k === 'lysstavar') { for (const [dx, col] of [[0, c1], [4, c2]]) { c.fillStyle = col; c.fillRect(x + dx + 1, y, 2, 12); c.fillStyle = '#ffffff'; c.fillRect(x + dx + 1, y, 2, 2); } return; }
      const rows = Hd.f[2], sc = rows.length > 8 ? 1 : 2;
      rows.forEach((r, j) => [...r].forEach((ch, ii) => { const col = pal[ch]; if (!col) return; c.fillStyle = col; c.fillRect(x + ii * sc, y + j * sc, sc, sc); }));
      if (i === 5) { c.fillStyle = '#ffffff'; c.fillRect(x + 4, y - 1, 1, 1); }
    });
  }
  const keeper = { x: 254, y: 98, look: { ...makeLookRich(), kid: false, build: 5, hair: '#3b2619', style: 'ponytail', top: 'cheer', topPrint: 'star', shirt: '#1d51a0', accent: '#f6d02f', print2: '#f6d02f', bottom: 'cheerSkirt', pants: '#1d51a0', pants2: '#f6d02f', shoeType: 'cheerShoes', shoes: '#f4f1ea', shoes2: '#1d51a0', hat: 'cheerBow', cap: '#f6d02f', hand: ['pompoms', '#f6d02f', '#1d51a0'] } };
  // provdockorna vid dräkterna: topp och kjol, hel dräkt
  const dolls = [
    { x: 30, y: 116, look: doll({ top: 'cheer', topPrint: 'heart', shirt: '#e0457e', accent: '#f4f1ea', print2: '#f4f1ea', bottom: 'cheerSkirt', pants: '#e0457e', pants2: '#f4f1ea', shoeType: 'cheerShoes', shoes2: '#e0457e', hat: 'cheerBow', cap: '#e0457e', hand: ['pompoms', '#e0457e', '#f4f1ea'] }) },
    { x: 62, y: 116, look: doll({ top: 'cheer', topPrint: 'bolt', shirt: '#2b2a33', accent: '#f6d02f', print2: '#f6d02f', bottom: 'cheerDress', shoeType: 'cheerShoes', shoes2: '#f6d02f', hat: 'starTiara', hand: ['pompoms', '#f6d02f', '#2b2a33'] }) },
    { x: 94, y: 116, look: doll({ top: 'cheer', topPrint: 'butterfly', shirt: '#6fb4e8', accent: '#f4f1ea', print2: '#f07ab0', bottom: 'cheerSkirt', pants: '#6fb4e8', pants2: '#f07ab0', shoeType: 'cheerShoes', shoes2: '#f07ab0', hat: 'heartBand', cap: '#f07ab0', hand: ['ballong', '#e0457e', '#f4f1ea'] }) },
  ];
  const F = [
    { img: tableSprite('drakt'), x: 40, fy: 214, design: 'drakt' },
    { img: tableSprite('pompom'), x: 250, fy: 214, design: 'pompom' },
    { img: counterSprite(), x: 222, fy: 112 },
    { img: shoeShelfSprite(), x: 470, fy: 150 },
    { img: trophySprite(), x: 290, fy: 106 },
    { img: plantSprite(), x: 4, fy: 112 }, { img: plantSprite(), x: 400, fy: 212 }, { img: plantSprite(), x: 530, fy: 118 }, { img: plantSprite(), x: 530, fy: 212 },
    { img: benchSprite(), x: 370, fy: 136 }, { img: benchSprite(), x: 120, fy: 212 },
  ];
  for (const f of F) { f.w = f.img.width; f.h = f.img.height; f.rect = [f.x, f.fy - Math.min(12, f.h), f.x + f.w, f.fy]; }
  for (const d of dolls) F.push({ doll: d, x: d.x - 6, fy: d.y, w: 12, h: 30, rect: [d.x - 6, d.y - 4, d.x + 6, d.y] });
  const SP = {
    door: { r: [DOOR.x0 - 3, 34, DOOR.x1 + 3, WALL + 2], go: [192, 98], label: 'GÅ UT', act: () => { play('door'); A.go('city'); } },
    drakter: { r: [4, 30, 140, 68], go: [72, 98], label: 'DRÄKTER', act: () => catalog('drakter') },
    dockor: { r: [20, 84, 104, 118], go: [62, 124], label: 'DRÄKTER', act: () => catalog('drakter') },
    drakt: { r: [40, 182, 110, 214], go: [75, 176], face: 'down', label: 'DESIGNA DRÄKT', act: () => designer() },
    spegel: { r: [146, 34, 174, 90], go: [160, 98], label: 'SPEGELN', act: () => mirror() },
    pompomer: { r: [260, 36, 360, 88], go: [310, 120], label: 'POMPOMER', act: () => pompomDesigner() },
    pompom: { r: [250, 182, 320, 214], go: [285, 176], face: 'down', label: 'DESIGNA POMPOMER', act: () => pompomDesigner() },
    huvud: { r: [362, 26, 442, 82], go: [400, 100], label: 'PÅ HUVUDET', act: () => catalog('huvud') },
    hander: { r: [446, 26, 542, 84], go: [494, 100], label: 'I HÄNDERNA', act: () => handCatalog() },
    skor: { r: [468, 118, 532, 152], go: [500, 158], label: 'SKOR', act: () => catalog('skor') },
    matta: { r: [MAT.cx - MAT.rx, MAT.cy - MAT.ry, MAT.cx + MAT.rx, MAT.cy + MAT.ry], go: [MAT.cx, MAT.cy], face: 'down', label: 'CHEERMATTAN - HEJA!', act: () => cheer() },
    kassa: { r: [222, 88, 286, 114], go: [254, 120], label: 'KASSAN', act: () => say(pickOf(['VÄLKOMMEN TILL HEJA HEJA!', 'VILKEN KLUBB HEJAR DU PÅ?', 'DESIGNA EN EGEN DRÄKT VID BORDET!', 'VÄLJ FÄRG PÅ DINA POMPOMER!', 'STÅ PÅ MATTAN OCH HEJA!', 'TIAROR OCH ROSETTER FINNS PÅ HYLLAN.', 'MEGAFONEN HÖRS ÄNDA UPP TILL TAKET!', 'I SPEGELN SER DU ALLT DU HAR KÖPT.']), keeper.x, keeper.y - 42) },
  };
  const blocked = (x, y) => y < WALL + 6 || y > H - 3 || x < 4 || x > RW - 4 || F.some((f) => x >= f.rect[0] - 3 && x <= f.rect[2] + 3 && y >= f.rect[1] - 2 && y <= f.rect[3] + 2);
  // A* på 4 px-rutnät (som i DRÖMLAND)
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
  const kidCheer = (c1, c2, club) => ({ ...makeLookRich(), kid: true, build: 4, top: 'cheer', topPrint: club, shirt: c1, accent: c2, print2: c2, bottom: 'cheerSkirt', pants: c1, pants2: c2, shoeType: 'cheerShoes', shoes: '#f4f1ea', shoes2: c1, hat: 'cheerBow', cap: c1, hand: ['pompoms', c1, c2] });
  const folk = [{ look: kidCheer('#e0457e', '#f4f1ea', 'heart'), x: 300, y: 150 }, { look: kidCheer('#8e5bd1', '#f0b429', 'crown'), x: 120, y: 160 }].map((n, i) => ({ ...n, dir: 'up', path: [], dist: 0, t: 1 + i * 2.5, jump: -9 }));
  const BROWSE = [[72, 98, 'up'], [62, 124, 'up'], [310, 120, 'up'], [400, 100, 'up'], [494, 100, 'up'], [500, 158, 'up'], [75, 176, 'down'], [285, 176, 'down'], [MAT.cx - 20, MAT.cy, 'down'], [MAT.cx + 20, MAT.cy + 4, 'down']];
  let bubble = null, hover = null, t = 0, camX = 0;
  const CONF = [];   // konfettin när någon hejar på mattan
  const cam = () => Math.round(camX);
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
  const CHEERS = ['HEJA HEJA!', 'GE MIG ETT H!', 'VI ÄR BÄST!', 'HEJA {K}!', 'HOPPA HÖGT!', 'TVÅ, FYRA, SEX, ÅTTA - VEM SKA VI HEJA PÅ?', 'JA!'];
  function cheer() {   // hopp med armarna (pompomerna), konfetti och ett tillrop
    me.jump = t; play('ok');
    const club = CLUB_BY[A.avatar.look.topPrint]?.name.toUpperCase() || 'ALLA';
    setTimeout(() => { if (!me.path.length) confetti(me.x, me.y); }, 250);
    say(pickOf(CHEERS).replace('{K}', club), me.x, me.y - 46);
    setTimeout(() => say(pickOf(['SNYGGT HOPP!', 'VILKEN ENERGI!', 'DU ÄR EN RIKTIG CHEERLEADER!', 'MER! MER!']), keeper.x, keeper.y - 42), 1500);
  }
  const jumpY = (o) => { const u = t - o.jump; return u >= 0 && u < 1.2 ? Math.round(Math.abs(Math.sin(u / 0.4 * Math.PI)) * 7) : 0; };

  // ---------- provfiguren: "Du nu ➜ Med …" som går att vrida (samma som i DRÖMLAND och klädaffären) ----------
  const wearing = (it) => isWorn(it, A.avatar.look);
  const setLook = (look) => { A.avatar = { ...A.avatar, look }; };
  const DIRS = ['down', 'left', 'up', 'right'], DIR_NAMES = ['Framifrån', 'Från sidan', 'Bakifrån', 'Från sidan'];
  const figScale = () => (window.innerHeight >= 620 && window.innerWidth >= 560 ? 5 : window.innerHeight < 480 ? 3 : 4);
  const stageHtml = (what, single = false) => `<div class="bl-try"><div class="bl-stage">${single ? '' : '<div class="bl-fig" data-fig="now"><i></i><small>Du nu</small></div><div class="bl-arrow">➜</div>'}<div class="bl-fig" data-fig="new"><i></i><small>${esc(what)}</small></div></div>
    <div class="bl-turn"><button type="button" class="btn btn-small" data-turn="-1" aria-label="Vrid åt vänster">⟲ Vrid</button><b class="bl-view" data-view></b><button type="button" class="btn btn-small" data-turn="1" aria-label="Vrid åt höger">Vrid ⟳</button></div></div>`;
  function stage(dlg, withLook, dr) {
    const render = () => {
      const dir = DIRS[dr.i];
      dlg.querySelector('[data-fig="now"] i')?.replaceChildren(figure(A.avatar.look, dir, 2));
      dlg.querySelector('[data-fig="new"] i')?.replaceChildren(figure(withLook(), dir, figScale()));
      dlg.querySelector('[data-view]').textContent = DIR_NAMES[dr.i];
    };
    dlg.querySelectorAll('[data-turn]').forEach((b) => (b.onclick = () => { dr.i = (dr.i + +b.dataset.turn + 4) % 4; dr.user = true; play('click'); render(); }));
    render();
    return render;
  }
  const big = (cv, k) => { const o = document.createElement('canvas'); o.width = cv.width * k; o.height = cv.height * k; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, o.width, o.height); o.style.width = o.width + 'px'; o.style.height = o.height + 'px'; return o; };
  const preview = (look, mode = 'full') => {   // korten: hela figuren (kläder, skor, saker i händerna) eller huvudet inzoomat
    const c = document.createElement('canvas'); c.width = 30; c.height = 44; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    drawPerson(g, 15, 42, mode === 'head' ? { ...look, hand: null } : look, 'down', 0);   // (huvudbilderna utan det man håller i – ballongen skymmer)
    const o = document.createElement('canvas'), og = o.getContext('2d'); og.imageSmoothingEnabled = false;
    if (mode === 'head') { const d = g.getImageData(0, 0, 30, 44).data; let top = 0; while (top < 43 && ![...Array(30).keys()].some((x) => d[(top * 30 + x) * 4 + 3] > 0)) top++; o.width = 24; o.height = 22; og.drawImage(c, 3, Math.max(0, top - 1), 24, 22, 0, 0, 24, 22); return big(o, 4); }
    if (mode === 'feet') { o.width = 24; o.height = 14; og.drawImage(c, 3, 30, 24, 14, 0, 0, 24, 14); return big(o, 5); }
    o.width = 26; o.height = 38; og.drawImage(c, 2, 5, 26, 38, 0, 0, 26, 38); return big(o, 3);
  };
  const nameOf = (it) => esc(it.name).replace(/­/g, '&shy;');
  function catalog(cat) {
    const D = CATS[cat], items = D.ids.map(itemById).filter(Boolean);
    const card = (it, i) => { const own = G.ownsWardrobe(it.id), on = own && wearing(it); return `<button type="button" class="bl-card${on ? ' on' : own ? ' own' : ''}" data-i="${i}"><span class="bl-pre"></span><b>${nameOf(it)}</b><span class="bl-tag">${on ? '✓ PÅ DIG' : own ? '✓ DIN' : fmt(G.clothesPrice(it))}</span></button>`; };
    const tip = cat === 'drakter' ? ' Vill du ha egna färger och välja klubb själv? Gå till bordet <b>DESIGNA DRÄKT</b>.' : '';
    const dlg = openModal(D.title, `<p class="sp">Du har <b>${fmt(G.money)}</b>. Klicka på något så provar du det på dig – vrid figuren och välj färg innan du köper.${tip}</p><div class="bl-grid">${items.map(card).join('')}</div>`, [{ label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-furn');
    dlg.querySelectorAll('.bl-card').forEach((b) => {
      const it = items[+b.dataset.i];
      b.querySelector('.bl-pre').append(preview(lookForItem(it, A.avatar.look, { colors: !wearing(it) }), it.slot === 'hat' || it.slot === 'hairAcc' ? 'head' : it.slot === 'shoes' ? 'feet' : 'full'));
      b.onclick = () => { play('click'); openBuy(A, it, { where: `HEJA HEJA · ${D.title.replace(/^\S+\s/, '')}`, back: () => catalog(cat), onBought: () => say(pickOf(['HEJA! DET PASSAR DIG.', 'NU ÄR DU REDO FÖR MATCHEN!', 'SNYGGT, CHEERLEADER!']), keeper.x, keeper.y - 42) }); };
    });
  }

  // ---------- DESIGNA DRÄKT: modell, klubb (symbolen på magen) och färgerna ----------
  const SEL = { model: 'set', club: 'heart', main: '#e0457e', trim: '#f4f1ea', sym: '#f4f1ea' };
  const DIRD = { i: 0, user: false };
  const swatches = (key, list, cur, label) => `<div class="bl-grp"><div class="sk-lbl">${label}</div><div class="dl-sws">${list.map(([n, h]) => `<button type="button" class="dl-sw${cur === h ? ' on' : ''}" data-${key}="${h}" style="background:${h}" title="${esc(n)}" aria-label="${esc(n)}"></button>`).join('')}</div></div>`;
  function designer() {
    const sel = SEL, total = draktPrice(sel), m = draktLook(sel), withLook = () => ({ ...A.avatar.look, ...m.look });
    const mine = store.list().filter((d) => d.kind === 'drakt'), key = JSON.stringify(sel), same = mine.find((d) => JSON.stringify(d.sel) === key);
    const top = hasTop(sel.model);
    const dlg = openModal('📣 Designa din cheerdräkt', `<div class="bl-design">${stageHtml('Med dräkten')}
      <div class="bl-show"><div class="bl-sum"><span>Kostar</span><b>${fmt(total)}</b><span class="sp">Du har ${fmt(G.money)}</span></div>
      <ul class="bl-list"><li><span>${esc(modelOf(sel.model)[1])}</span><b>${modelOf(sel.model)[2]} kr</b></li>${top && sel.club ? `<li><span>Symbol: ${esc(CLUB_BY[sel.club].name)}</span><b>${SYMBOL_PRICE} kr</b></li>` : ''}<li><span>Färgerna</span><b>gratis</b></li></ul></div>
      <div class="bl-pick">
        <div class="bl-grp"><div class="sk-lbl">Modell</div><div class="bl-opts">${MODELS.map(([id, n, pr]) => `<button type="button" class="btn btn-small${sel.model === id ? ' btn-gold' : ''}" data-model="${id}">${esc(n)}<small>${pr} kr</small></button>`).join('')}</div></div>
        ${top ? `<div class="bl-grp"><div class="sk-lbl">Klubb – symbolen på magen</div><div class="bl-opts"><button type="button" class="btn btn-small${!sel.club ? ' btn-gold' : ''}" data-club="">Ingen symbol<small>0 kr</small></button>${CLUBS.map((c) => `<button type="button" class="btn btn-small${sel.club === c.id ? ' btn-gold' : ''}" data-club="${c.id}">${c.icon} ${esc(c.name)}<small>${SYMBOL_PRICE} kr</small></button>`).join('')}</div></div>` : ''}
        ${swatches('main', COLORS, sel.main, sel.model === 'kjol' ? 'Kjolens färg' : 'Dräktens färg')}
        ${swatches('trim', COLORS, sel.trim, sel.model === 'kjol' ? 'Färgen i vecken' : 'Kanterna och vecken')}
        ${top && sel.club && sel.club !== 'rainbowArc' ? swatches('sym', COLORS, sel.sym, 'Symbolens färg') : ''}
        ${mine.length ? `<div class="sk-lbl">Dina egna dräkter</div><div class="bl-mine">${mine.map((d, i) => `<button type="button" class="btn btn-small" data-mine="${i}">📣 ${esc(d.name)}</button>`).join('')}</div>` : ''}</div></div>`,
      [same ? { label: 'Ta på – den är redan din', cls: 'btn-go', onClick: () => { setLook({ ...A.avatar.look, ...same.look }); closeModal(); play('ok'); toast(`📣 Du har på dig ${same.name}.`, 'good'); } }
        : { label: G.money >= total ? `Köp för ${fmt(total)}` : `Du behöver ${fmt(total - G.money)} till`, cls: 'btn-go', disabled: G.money < total, onClick: () => buyDrakt(total) },
       { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('bl-wide');
    if (!DIRD.user) DIRD.i = 0;
    stage(dlg, withLook, DIRD);
    dlg.querySelectorAll('[data-model]').forEach((b) => (b.onclick = () => { sel.model = b.dataset.model; play('click'); designer(); }));
    dlg.querySelectorAll('[data-club]').forEach((b) => (b.onclick = () => { const c = CLUB_BY[b.dataset.club]; sel.club = c ? c.id : ''; if (c) [sel.main, sel.trim, sel.sym] = c.c; play('click'); designer(); }));   // klubben föreslår sina färger
    for (const k of ['main', 'trim', 'sym']) dlg.querySelectorAll(`[data-${k}]`).forEach((b) => (b.onclick = () => { sel[k] = b.dataset[k]; play('click'); designer(); }));
    dlg.querySelectorAll('[data-mine]').forEach((b) => (b.onclick = () => { Object.assign(sel, mine[+b.dataset.mine].sel); play('click'); designer(); }));
  }
  function buyDrakt(total) {
    if (G.money < total) return;
    const sel = { ...SEL }, m = draktLook(sel), name = draktName(sel);
    G.money -= total;
    for (const id of m.ids) if (!G.ownsWardrobe(id)) G.wardrobe.push(id);   // plaggen blir dina (figurskaparen låter dem sitta kvar)
    G.save();
    store.add({ kind: 'drakt', sel, look: m.look, price: total, name });
    setLook({ ...A.avatar.look, ...m.look });
    closeModal(); play('buy');
    toast(`📣 Din egen dräkt är klar: ${name}!`, 'good');
    say(sel.club ? `HEJA ${CLUB_BY[sel.club].name.toUpperCase()}!` : 'VILKEN SNYGG DRÄKT!', keeper.x, keeper.y - 42);
  }

  // ---------- POMPOMER: två färger ----------
  const PST = { c1: '#e0457e', c2: '#f4f1ea' };
  const DIRP = { i: 0, user: true };
  const ownedHand = (k, c1, c2) => store.list().find((d) => d.kind === 'hand' && d.k === k && (handColors(k) < 1 || d.c1 === c1) && (handColors(k) < 2 || d.c2 === c2));
  function pompomDesigner() {
    const look = () => ({ ...A.avatar.look, hand: ['pompoms', PST.c1, PST.c2] }), same = ownedHand('pompoms', PST.c1, PST.c2);
    const dlg = openModal('🎉 Designa dina pompomer', `<div class="bl-design">${stageHtml('Med pompomerna')}
      <div class="bl-show"><div class="dl-canvas ch-pom"></div><div class="bl-sum"><span>Kostar</span><b>${fmt(POMPOM_PRICE)}</b><span class="sp">Du har ${fmt(G.money)}</span></div></div>
      <div class="bl-pick">${swatches('c1', COLORS, PST.c1, 'Första färgen')}${swatches('c2', COLORS, PST.c2, 'Andra färgen')}
      <p class="sp">Pompomerna har du i båda händerna. När du sätter dig lägger du ner dem.</p></div></div>`,
      [same ? { label: 'Ta fram dem – de är dina', cls: 'btn-go', onClick: () => { setLook(look()); closeModal(); play('ok'); toast('🎉 Du har pompomerna i händerna.', 'good'); } }
        : { label: G.money >= POMPOM_PRICE ? `Köp för ${fmt(POMPOM_PRICE)}` : `Du behöver ${fmt(POMPOM_PRICE - G.money)} till`, cls: 'btn-go', disabled: G.money < POMPOM_PRICE, onClick: () => buyHand('pompoms', POMPOM_PRICE, PST.c1, PST.c2) },
       { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('bl-wide');
    stage(dlg, look, DIRP);
    const cv = document.createElement('canvas'), P = new Pix(40, 22);
    pompomBlob(P, 10, 11, 8, hexI(PST.c1), hexI(PST.c2), 1); pompomBlob(P, 29, 11, 8, hexI(PST.c1), hexI(PST.c2), 6);
    cv.width = 40 * 4; cv.height = 22 * 4; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(P.flush(), 0, 0, cv.width, cv.height);
    dlg.querySelector('.ch-pom').append(cv);
    for (const k of ['c1', 'c2']) dlg.querySelectorAll(`[data-${k}]`).forEach((b) => (b.onclick = () => { PST[k] = b.dataset[k]; play('click'); pompomDesigner(); }));
  }
  function buyHand(k, price, c1, c2) {
    if (G.money < price) return;
    G.money -= price; G.save();
    const name = k === 'pompoms' ? `Pompomer ${colorName(c1)} och ${colorName(c2)}` : `${HAND_ITEMS[k].label}${handColors(k) ? ' ' + colorName(c1) : ''}`;
    store.add({ kind: 'hand', k, c1, c2, look: { hand: [k, c1, c2] }, price, name });
    setLook({ ...A.avatar.look, hand: [k, c1, c2] });
    closeModal(); play('buy');
    toast(`🎉 ${name} – nu håller du ${k === 'pompoms' ? 'dem' : 'den'} i handen!`, 'good');
    say(pickOf(['HEJA HEJA!', 'NU KAN DU HEJA PÅ RIKTIGT!', 'PROVA PÅ MATTAN!']), keeper.x, keeper.y - 42);
  }
  // ---------- I HÄNDERNA: megafon, flagga, ballong … (en färg eller två, några har fasta färger) ----------
  const HST = { k: 'megafon', c1: '#e0457e', c2: '#f4f1ea' };
  const DIRH = { i: 0, user: true };
  function handCatalog() {
    const card = ([k, pr], i) => { const [c1, c2] = HAND_DEF[k] || ['#e0457e', '#f4f1ea'], own = store.list().some((d) => d.kind === 'hand' && d.k === k); return `<button type="button" class="bl-card${own ? ' own' : ''}" data-i="${i}"><span class="bl-pre" data-c="${c1}" data-c2="${c2}"></span><b>${esc(HAND_ITEMS[k].label)}</b><span class="bl-tag">${own ? '✓ DIN' : fmt(pr)}</span></button>`; };
    const dlg = openModal('📣 I händerna', `<p class="sp">Du har <b>${fmt(G.money)}</b>. Något att hålla i när du hejar – klicka så provar du det. Pompomerna gör du vid bordet <b>DESIGNA POMPOMER</b>.</p><div class="bl-grid">${HAND_SHOP.map(card).join('')}</div>`, [{ label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-furn');
    dlg.querySelectorAll('.bl-card').forEach((b) => {
      const [k] = HAND_SHOP[+b.dataset.i], pre = b.querySelector('.bl-pre');
      pre.append(preview({ ...A.avatar.look, hand: [k, pre.dataset.c, pre.dataset.c2] }, 'full'));
      b.onclick = () => { play('click'); const [c1, c2] = HAND_DEF[k] || ['#e0457e', '#f4f1ea']; Object.assign(HST, { k, c1, c2 }); handItem(); };
    });
  }
  function handItem() {
    const k = HST.k, pr = HAND_SHOP.find((h) => h[0] === k)?.[1] || 99, nc = handColors(k), list = k === 'lysstavar' ? GLOW : COLORS;
    const look = () => ({ ...A.avatar.look, hand: [k, HST.c1, HST.c2] }), same = ownedHand(k, HST.c1, HST.c2);
    const dlg = openModal(`📣 ${HAND_ITEMS[k].label}`, `<div class="bl-design">${stageHtml(`Med ${HAND_ITEMS[k].label.toLowerCase()}`)}
      <div class="bl-show"><div class="bl-sum"><span>Kostar</span><b>${fmt(pr)}</b><span class="sp">Du har ${fmt(G.money)}</span></div></div>
      <div class="bl-pick">${nc >= 1 ? swatches('c1', list, HST.c1, nc === 2 ? 'Första färgen' : 'Färgen') : '<p class="sp">Den här finns bara i en färg.</p>'}${nc >= 2 ? swatches('c2', list, HST.c2, 'Andra färgen') : ''}
      <p class="sp">Du håller den i handen när du går och står. När du sätter dig lägger du ner den.</p></div></div>`,
      [same ? { label: 'Ta fram den – den är din', cls: 'btn-go', onClick: () => { setLook(look()); closeModal(); play('ok'); toast(`📣 Du har ${HAND_ITEMS[k].label.toLowerCase()} i handen.`, 'good'); } }
        : { label: G.money >= pr ? `Köp för ${fmt(pr)}` : `Du behöver ${fmt(pr - G.money)} till`, cls: 'btn-go', disabled: G.money < pr, onClick: () => buyHand(k, pr, HST.c1, HST.c2) },
       { label: 'Tillbaka', onClick: () => handCatalog() }]);
    dlg.classList.add('bl-wide');
    stage(dlg, look, DIRH);
    for (const c of ['c1', 'c2']) dlg.querySelectorAll(`[data-${c}]`).forEach((b) => (b.onclick = () => { HST[c] = b.dataset[c]; play('click'); handItem(); }));
  }

  // ---------- spegeln: allt man köpt här, ta på och av, lägg ner det man håller i ----------
  const MIR = { i: 0, user: true };
  function mirror() {
    const owned = Object.values(CATS).flatMap((c) => c.ids).map(itemById).filter((it) => it && G.ownsWardrobe(it.id));
    const draks = store.list().filter((d) => d.kind === 'drakt'), hands = store.list().filter((d) => d.kind === 'hand');
    const L = A.avatar.look;
    const dlg = openModal('🪞 Spegeln', `<div class="bl-mirror">${stageHtml(String(A.avatar.name || 'Du'), true)}<div class="bl-mir-r"><p class="sp">Ta på och av det du har köpt här – figuren visar hur du ser ut.</p>
      ${draks.length ? `<div class="sk-lbl">Dina dräkter</div><div class="bl-mine">${draks.map((d, i) => `<button type="button" class="btn btn-small" data-dr="${i}">📣 ${esc(d.name)}</button>`).join('')}</div>` : ''}
      ${hands.length ? `<div class="sk-lbl">I händerna</div><div class="bl-mine">${hands.map((d, i) => { const on = Array.isArray(L.hand) && L.hand[0] === d.k && L.hand[1] === d.c1 && L.hand[2] === d.c2; return `<button type="button" class="btn btn-small${on ? ' btn-gold' : ''}" data-hd="${i}">${on ? '✓ ' : ''}${esc(d.name)}</button>`; }).join('')}${L.hand ? '<button type="button" class="btn btn-small" data-hd="-1">✋ Lägg ner det du håller i</button>' : ''}</div>` : ''}
      ${owned.length ? `<div class="sk-lbl">Kläder och huvudsaker</div><div class="bl-mine">${owned.map((it) => `<button type="button" class="btn btn-small${wearing(it) ? ' btn-gold' : ''}" data-own="${it.id}">${wearing(it) ? '✓ ' : ''}${esc(it.name.replace(/­/g, ''))}</button>`).join('')}</div>` : ''}
      ${!owned.length && !draks.length && !hands.length ? '<p class="sp">Du har inte köpt något här än. Titta på dräkterna, pompomerna och hyllorna!</p>' : ''}</div></div>`,
      [{ label: 'Klar', cls: 'btn-go', onClick: closeModal }]);
    stage(dlg, () => A.avatar.look, MIR);
    dlg.querySelectorAll('[data-own]').forEach((b) => (b.onclick = () => { const it = itemById(b.dataset.own); play('click'); setLook(wearing(it) ? lookWithoutSlot(it.slot, A.avatar.look) : lookForItem(it, A.avatar.look, { colors: true })); mirror(); }));
    dlg.querySelectorAll('[data-dr]').forEach((b) => (b.onclick = () => { play('click'); setLook({ ...A.avatar.look, ...draks[+b.dataset.dr].look }); mirror(); }));
    dlg.querySelectorAll('[data-hd]').forEach((b) => (b.onclick = () => { play('click'); const i = +b.dataset.hd; setLook({ ...A.avatar.look, hand: i < 0 ? null : hands[i].look.hand }); mirror(); }));
  }

  const spotAt = (x, y) => Object.entries(SP).find(([, s]) => x >= s.r[0] && x <= s.r[2] && y >= s.r[1] && y <= s.r[3]);
  return {
    enter() { me.x = 192; me.y = 100; me.dir = 'down'; me.path = []; camX = 0; say('VÄLKOMMEN TILL HEJA HEJA!', keeper.x, keeper.y - 42); },
    exit() {},
    update(dt) {
      t += dt;
      if (step(me, dt, 58) && me.then) { const f = me.then; me.then = null; f(); }
      const tc = Math.max(0, Math.min(RW - W, me.x - W / 2)); camX += (tc - camX) * Math.min(1, dt * 5); if (Math.abs(tc - camX) < 0.3) camX = tc;
      for (const n of folk) {
        if (n.path.length) { step(n, dt, 30); continue; }
        n.t -= dt;
        if (n.t <= 0) {
          const [x, y, d] = pickOf(BROWSE); n.path = path(n.x, n.y, x, y + (Math.random() * 6 - 3)); n.face = d; n.t = 3 + Math.random() * 5;
          n.onMat = Math.abs(x - MAT.cx) < 30 && Math.abs(y - MAT.cy) < 10;
        } else { if (n.face) n.dir = n.face; if (n.onMat && n.t < 2.5 && t - n.jump > 2) { n.jump = t; confetti(n.x, n.y, 12); } }
      }
      for (const p of CONF) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.vx *= 0.98; p.life -= dt; }
      for (let i = CONF.length - 1; i >= 0; i--) if (CONF[i].life <= 0 || CONF[i].y > H) CONF.splice(i, 1);
    },
    draw(ctx) {
      const cx0 = cam();
      ctx.setTransform(A.pxs, 0, 0, A.pxs, -cx0 * A.pxs, 0); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bg, 0, 0);
      // lamporna i taket
      for (const lx of [96, 272, 456]) { ctx.fillStyle = '#80879a'; ctx.fillRect(lx, 8, 1, 6); ctx.fillStyle = '#fffbe8'; ctx.fillRect(lx - 4, 14, 9, 2); ctx.fillStyle = 'rgba(255,246,208,0.13)'; ctx.fillRect(lx - 14, 16, 29, 10); }
      const fig = (o, look) => { const j = jumpY(o), moving = o.path.length, fr = j ? (j > 3 ? 3 : 4) : moving ? WALK[Math.floor(o.dist / 7.3) % 4] : 0; drawPerson(ctx, Math.round(o.x), Math.round(o.y) - j, look, j ? 'down' : o.dir, fr); };
      const list = F.map((f) => ({ fy: f.fy, draw: () => (f.doll ? drawPerson(ctx, f.doll.x, f.doll.y, f.doll.look, 'down', 0) : ctx.drawImage(f.img, f.x, f.fy - f.h)) }));
      list.push({ fy: keeper.y, draw: () => drawPerson(ctx, keeper.x, keeper.y, keeper.look, Math.sin(t * 0.5) > 0.8 ? 'left' : 'down', Math.sin(t * 2) > 0.93 ? 4 : 0) });
      for (const n of folk) list.push({ fy: n.y, draw: () => fig(n, n.look) });
      list.push({ fy: me.y + 0.01, draw: () => fig(me, A.avatar.look) });
      list.sort((a, b) => a.fy - b.fy); for (const d of list) d.draw();
      for (const p of CONF) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, (Math.floor(p.life * 10) & 1) ? 1 : 2); }
      // borden och mattan blinkar så att man hittar dit
      for (const k of ['drakt', 'pompom']) { const sp = SP[k], x = Math.round((sp.r[0] + sp.r[2]) / 2), on = Math.sin(t * 3 + x) > 0.2; ctx.fillStyle = on ? '#fff6a0' : '#f6d02f'; ctx.fillRect(x, 175 - (on ? 2 : 1), 1, on ? 5 : 3); ctx.fillRect(x - (on ? 2 : 1), 175, on ? 5 : 3, 1); }
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
    _debug: { spots: () => Object.fromEntries(Object.entries(SP).map(([k, s]) => [k, s.r])), me: () => ({ x: me.x, y: me.y, jump: me.jump }), cam: () => cam(), sel: () => ({ ...SEL }), cheer, walk: (x, y) => walkTo(x, y) },
  };
}
export const CHEER_PREVIEW = { pompomBlob, miniUniform, CLUBS };
