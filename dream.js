// DREAM LAND – strykmärkena och pärlorna (Pixelskolan, Carl 2026-10-12: "att man själv får sätta märken som butiken
// Dream Land … designa halsbandet pärla för pärla och sätta på iron on patches på väskan, eller sina vanliga kläder").
// Här finns bilderna och sortimentet: märkena (broderade, med kantsöm som riktiga strykmärken), pärlorna, plaggen man
// stryker märken på och pärlhalsbandet på bysten. Dialogerna ligger i butiken (bling.js); figuren ritar märkena och
// pärlorna själv (people.js decorate: look.patches / look.beads – avatar.js cleanLook behåller dem).
import { Pix, SMALL, BIG, textW, eachTextPixel, mix, mul, hash, bayer } from './sf/js/core/floor-pix.js';

const hexOf = (c) => '#' + (c & 0xffffff).toString(16).padStart(6, '0');
const toInt = (h, fb = 0x888888) => (typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h) ? parseInt(h.slice(1), 16) : fb);

// ---------- märkena: motiv i pixlar (färgerna i C), kantsömmen och konturen läggs på av patchImg ----------
const C = { k: 0x2a2230, w: 0xffffff, W: 0xe4e6ee, s: 0xa8b0bc, S: 0x6a7280, r: 0xe8394f, R: 0xa8203a, p: 0xffb8d8, P: 0xf07ab0, m: 0xc83a7a,
  o: 0xf0902e, y: 0xffe066, Y: 0xe8b84a, g: 0x5cc070, G: 0x2e8a4a, l: 0xb8e070, b: 0x3a7bd5, B: 0x1d4a9a, c: 0x9ad8f8, v: 0xa070e0, V: 0xd8c0f8,
  n: 0x8a5a30, N: 0xc8905a, t: 0xf6d2b0, e: 0xffd8c0, x: 0xfff0f6 };
const MOTIF = {
  hjarta: ['.PPP...PPP.', 'PppPP.PPPPP', 'PpPPPPPPPPP', 'PPPPPPPPPPP', 'PPPPPPPPPPm', '.PPPPPPPPm.', '..PPPPPPm..', '...PPPPm...', '....PPm....', '.....m.....'],
  regnbage: ['....rrrrr....', '..rrooooorr..', '.rooyyyyyoor.', '.roygggggyor.', 'roygbbbbbgyor', 'roygb...bgyor', 'wwwwb...bwwww', '.wwww...wwww.', '..ww.....ww..'],
  stjarna: ['.....y.....', '....yyy....', '....yyy....', 'yyyyyyyyyyy', '.yyyywyyyy.', '..yyyyyyY..', '..yyyyyyY..', '.yyyyYyyyY.', '.yyY...yYY.', 'yY.......YY'],
  blixt: ['....yyyy', '...yyyY.', '..yyyY..', '.yyyY...', 'yyyyyyyY', '...yyyY.', '...yyY..', '..yyY...', '..yY....', '.yY.....', '.Y......'],
  smiley: ['...yyyy...', '.yyyyyyyy.', '.ywyyyyyy.', 'yyykyykyyy', 'yyykyykyyy', 'yyyyyyyyyy', 'ykyyyyyyky', 'yykkkkkkyy', '.yyyyyyyY.', '...yyyY...'],
  blomma: ['....www....', '.ww.wWw.ww.', '.wwwwwwwww.', '..wwyyyww..', 'wwwyyyyywww', 'wwwyyoyywWw', 'wwwyyyyywww', '..wwyyyww..', '.wwwwwwwww.', '.ww.wWw.ww.', '....www....'],
  ros: ['..rrrrr...', '.rRrrrRr..', 'rrRRrRRrr.', 'rRrrRrrRr.', 'rrRrrrRrr.', '.rrRRRrr..', '..rrrrr...', '....G.....', '.gg.G.gg..', '..ggGgg...', '....G.....'],
  korsbar: ['......ggg..', '.....gGg...', '....G..G...', '...G....G..', '..G.....G..', '.rr.....rr.', 'rwrr...rwrr', 'rrrr...rrrr', 'RrrR...RrrR', '.RR.....RR.'],
  jordgubbe: ['...ggg...', '.ggGgGgg.', '.rrgggrr.', 'rryrrryrr', 'rrrrrrrrr', 'rrrryrrrr', '.ryrrrry.', '.rrrrrrr.', '..rryrr..', '...rrr...', '....R....'],
  glass: ['...rr...', '..PPPP..', '.PPpPPP.', 'PPPPPPPP', 'PbPPPyPP', 'PPPPPPPP', 'NNNNNNNN', '.NnNnNN.', '.NNnNnN.', '..NnNN..', '..NNnN..', '...NN...'],
  munk: ['...NNNNN...', '.NNPPPPPNN.', '.NPPyPPbPN.', 'NPrPPPPPyPN', 'NPPP...PPPN', 'NPbP...PrPN', 'NPPP...PPPN', 'NPyPPPPPPbN', '.NPPPrPPPN.', '.NNPPPPPNN.', '...NNNNN...'],
  cupcake: ['....rr....', '...pPPp...', '..pPPPPp..', '.pPPyPPPp.', 'pPPPPPbPPp', 'PPPPPPPPPP', '.VvVvVvVv.', '.VvVvVvVv.', '..VvVvVv..', '..VvVvVv..'],
  fjaril: ['....k..k....', '.PPP.kk.PPP.', 'PpyPPkkPPypP', 'PppPPkkPPppP', 'PPPPPkkPPPPP', '.PPPPkkPPPP.', '..VVVkkVVV..', '.VVvVkkVvVV.', '.VVVV..VVVV.', '..VV....VV..'],
  flamingo: ['.PPP.....', 'PPkPPw...', 'PP...k...', '.PP......', '..PP.....', '..PP.....', '.PPPPPP..', 'PPPPPPPPP', '.PpPPPPPP', '..PPPPPP.', '....n....', '....n....', '...nn....'],
  katt: ['ww.......ww', 'wpw.....wpw', 'wwwwwwwwwww', 'wwwwwwwwwww', 'wwkwwwwwkww', 'wwwwwPwwwww', 'wwwwkwkwwww', 'wwwwwwwwwww', '.wwwwwwwww.', '..wwwwwww..'],
  nalle: ['.NN.....NN.', 'NeNNNNNNNeN', 'NNNNNNNNNNN', '.NNkNNNkNN.', '.NNNeeeNNN.', '.NNeekeeNN.', '.NNNeeeNNN.', '..NNNNNNN..', '.NNNNPNNNN.', 'NNNNNNNNNNN', '.NN.....NN.'],
  kanin: ['.ww...ww.', '.wp...pw.', '.wp...pw.', '.wp...pw.', '.ww...ww.', '.wwwwwww.', 'wwwwwwwww', 'wwkwwwkww', 'wpwwPwwpw', 'wwwwkwwww', '.wwwwwww.', '..wwwww..'],
  planet: ['....PPPP....', '...PpPPPP...', '..PPPPPPPP..', 'cccPPPPPPccc', '.cccccccccc.', '..PPPPPPPP..', '...PPPPPP...', '....PPPP....'],
  raket: ['...rr...', '..rrrr..', '..wwww..', '.wwwwww.', '.wwbbww.', '.wbccbw.', '.wwbbww.', '.wwwwww.', 'rwwwwwwr', 'rrwwwwrr', 'r.oyyo.r', '..oyyo..', '...oo...'],
  sol: ['.....yy.....', '.y...yy...y.', '..y.oooo.y..', '...oyyyyo...', 'yyoyyyyyyoyy', 'yyoyyyyyyoyy', '...oyyyyo...', '..y.oooo.y..', '.y...yy...y.', '.....yy.....'],
  svamp: ['...rrrrr...', '.rrwrrrwrr.', 'rrrrrrrrrrr', 'rwrrrwrrrwr', 'rrrrrrrrrrr', '..eeeeeee..', '...wwwww...', '...wwwww...', '...wwwww...', '..wwwwwww..'],
  fred: ['...vvvvv...', '.vvxxvxxvv.', '.vxxxvxxxv.', 'vxxxxvxxxxv', 'vxxxxvxxxxv', 'vxxxxvxxxxv', 'vxxxvvvxxxv', 'vxxvxvxvxxv', '.vvxxvxxvv.', '.vvxxvxxvv.', '...vvvvv...'],
  lappar: ['..rrr..rrr..', '.rwrrrrrrrr.', 'rrrrrrrrrrrr', 'RRRRRRRRRRRR', '.rrrrrrrrrr.', '..rrrrrrrr..', '....rrrr....'],
  rosett: ['PP........PP', 'PpPP....PPpP', 'PppPPmmPPppP', 'PpppPmmPpppP', 'PppPPmmPPppP', 'PpPP.mm.PPpP', 'PP..m..m..PP', '...m....m...'],
  disco: ['...WsWs...', '.WsWsWsWs.', '.sWwWsWsW.', 'WsWsWsWsWs', 'sWsWsWsWsW', 'WsWsWsWsWs', 'sWsWsWsWsS', '.WsWsWsWS.', '.sWsWsWSS.', '...WsSS...'],
};
for (const [k, rows] of Object.entries(MOTIF)) if (rows.some((r) => r.length !== rows[0].length)) console.warn(`[dream] motivet ${k}: raderna är olika långa`);

// ordmärken (rundad platta + text) och bokstäver/siffror (rund collegemärke)
function textMotif(word, bg, fg) {
  const w = textW(SMALL, word) + 4, h = 9, rows = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => ((x === 0 || x === w - 1) && (y === 0 || y === h - 1) ? '.' : 'B')));
  eachTextPixel(SMALL, word, 2, 2, 1, (x, y) => { if (rows[y]?.[x]) rows[y][x] = 'F'; });
  return { rows: rows.map((r) => r.join('')), pal: { B: bg, F: fg } };
}
function letterMotif(ch, bg, fg) {
  const n = 13, r = 6, rows = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => ((x - r) ** 2 + (y - r) ** 2 <= r * r + 2 ? 'B' : '.')));
  const lw = textW(BIG, ch), lx = r - (lw >> 1), up = BIG[ch]?.up?.length || 0, ly = 3 + Math.ceil(up / 2);
  const px = []; eachTextPixel(BIG, ch, lx, ly, 1, (x, y) => px.push([x, y]));
  for (const [x, y] of px) if (rows[y + 1]?.[x + 1] === 'B') rows[y + 1][x + 1] = 'D';   // skuggan snett nedanför
  for (const [x, y] of px) if (rows[y]?.[x]) rows[y][x] = 'F';
  return { rows: rows.map((rr) => rr.join('')), pal: { B: bg, F: fg, D: mul(bg, 0.62) } };
}

// ---------- sortimentet (kategorier som Dream Lands: Bästsäljare, Crush, Djur … och bokstäver) ----------
export const PATCH_CATS = [
  { id: 'best', label: '⭐ Bästsäljare' }, { id: 'crush', label: '💗 Crush' }, { id: 'djur', label: '🐾 Djur' }, { id: 'godis', label: '🍩 Godis' },
  { id: 'natur', label: '🌈 Natur & rymd' }, { id: 'glitter', label: '✨ Glitter' }, { id: 'ord', label: '💬 Ord' }, { id: 'abc', label: '🔤 ABC' },
];
const M = (id, name, price, cats, o = {}) => ({ id, name, price, cats, art: o.art || id, ...o });
const LIST = [
  M('hjarta', 'Hjärta', 20, ['best', 'crush']), M('regnbage', 'Regnbåge', 30, ['best', 'natur']), M('stjarna', 'Stjärna', 20, ['natur']),
  M('blixt', 'Blixt', 20, ['natur']), M('smiley', 'Smiley', 20, ['best']), M('blomma', 'Prästkrage', 20, ['natur']),
  M('ros', 'Ros', 25, ['crush', 'natur']), M('korsbar', 'Körsbär', 20, ['godis', 'crush']), M('jordgubbe', 'Jordgubbe', 20, ['best', 'godis']),
  M('glass', 'Glass', 25, ['godis']), M('munk', 'Munk', 25, ['godis']), M('cupcake', 'Cupcake', 25, ['godis']),
  M('fjaril', 'Fjäril', 30, ['best', 'djur']), M('flamingo', 'Flamingo', 30, ['djur']), M('katt', 'Katt', 25, ['djur'], { edge: 0xffb8d8 }),
  M('nalle', 'Nalle', 25, ['best', 'djur']), M('kanin', 'Kanin', 25, ['djur'], { edge: 0xffb8d8 }), M('planet', 'Planet', 25, ['natur']),
  M('raket', 'Raket', 30, ['natur']), M('sol', 'Sol', 20, ['natur']), M('svamp', 'Svamp', 20, ['natur']), M('fred', 'Fredsmärke', 20, ['ord']),
  M('lappar', 'Läppar', 20, ['crush']), M('rosett', 'Rosett', 20, ['crush']), M('disco', 'Discokula', 40, ['glitter'], { glitter: true }),
  M('g-hjarta', 'Glitterhjärta', 40, ['glitter', 'crush'], { art: 'hjarta', glitter: true }),
  M('g-stjarna', 'Guldstjärna', 40, ['glitter', 'best'], { art: 'stjarna', glitter: true, recolor: { y: 0xf2c14e, Y: 0xb9862a, w: 0xfff6c0 } }),
  M('g-smiley', 'Glittersmiley', 40, ['glitter'], { art: 'smiley', glitter: true }),
  M('g-blixt', 'Silverblixt', 40, ['glitter'], { art: 'blixt', glitter: true, recolor: { y: 0xe4e8f0, Y: 0x9aa2ac } }),
  ...[['LOVE', 0xf07ab0, 0xffffff], ['GIRL', 0xd8c0f8, 0xc83a7a], ['BFF', 0xffe066, 0xc83a7a], ['WOW', 0x9ad8f8, 0x1d4a9a], ['COOL', 0x3a7bd5, 0xffffff], ['QUEEN', 0xe8b84a, 0x2a2230]]
    .map(([w, bg, fg]) => M('t-' + w.toLowerCase(), w, 25, w === 'LOVE' ? ['ord', 'crush', 'best'] : ['ord'], { text: [w, bg, fg] })),
  ...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789'].map((ch, i) => {
    const bg = [0xe8394f, 0xf07ab0, 0xa070e0, 0x3a7bd5, 0x2a9a8a, 0x5cc070, 0xf0902e][i % 7];
    return M('l-' + 'abcdefghijklmnopqrstuvwxyzaao0123456789'[i] + (ch === 'Å' ? '1' : ch === 'Ä' ? '2' : ch === 'Ö' ? '3' : ''), /\d/.test(ch) ? `Siffran ${ch}` : `Bokstaven ${ch}`, 10, ['abc'], { letter: [ch, bg, 0xffffff] });
  }),
];
export const PATCHES = LIST;
export const PATCH_BY = Object.fromEntries(LIST.map((p) => [p.id, p]));

function motifOf(p) {
  if (p.text) { const t = textMotif(...p.text); return { rows: t.rows, pal: { ...C, ...t.pal } }; }
  if (p.letter) { const t = letterMotif(...p.letter); return { rows: t.rows, pal: { ...C, ...t.pal } }; }
  return { rows: MOTIF[p.art], pal: { ...C, ...(p.recolor || {}) } };
}
// Märket som bild (1×): motivet med broderiets stygn, kantsöm runt om (edge) och mörk kontur. Glittermärken får
// paljetter (varannan pixel ljusare). Bilden sparas – samma canvas används överallt.
const IMG = new Map();
export function patchImg(id) {
  if (IMG.has(id)) return IMG.get(id);
  const p = PATCH_BY[id]; if (!p) return null;
  const { rows, pal } = motifOf(p), w = rows[0].length + 4, h = rows.length + 4, P = new Pix(w, h);
  const on = (i, j) => (rows[j - 2]?.[i - 2] ?? '.') !== '.';
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!on(i, j)) continue;
    let c = pal[rows[j - 2][i - 2]] ?? 0xff00ff;
    c = p.glitter ? ((i + j) % 2 ? mix(c, 0xffffff, 0.42) : mul(c, 0.94)) : mix(c, j % 2 ? 0xffffff : 0x000000, 0.05);   // paljetter / stygnrader
    P.px(i, j, c);
  }
  const edge = p.edge ?? (p.letter || p.text ? 0xffffff : 0xfff8f0), near = (i, j, d) => { for (let y = -d; y <= d; y++) for (let x = -d; x <= d; x++) if (on(i + x, j + y)) return true; return false; };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!on(i, j) && near(i, j, 1)) P.px(i, j, (i + j) % 2 ? edge : mul(edge, 0.9));
  const filled = (i, j) => P.d[(j * w + i) * 4 + 3] > 0;
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!filled(i, j) && ((i > 0 && filled(i - 1, j)) || (i < w - 1 && filled(i + 1, j)) || (j > 0 && filled(i, j - 1)) || (j < h - 1 && filled(i, j + 1)))) out.push([i, j]);
  for (const [i, j] of out) P.px(i, j, 0x4a3048);
  const img = P.flush(); IMG.set(id, img); return img;
}
// Märkets två vanligaste färger: så ser det ut på figuren (2 × 2 pixlar)
export function patchColors(id) {
  const p = PATCH_BY[id]; if (!p) return ['#ffffff', '#ffffff'];
  const { rows, pal } = motifOf(p), n = new Map();
  for (const r of rows) for (const ch of r) if (ch !== '.') n.set(ch, (n.get(ch) || 0) + 1);
  const top = [...n.entries()].sort((a, b) => b[1] - a[1]).map(([ch]) => pal[ch]);
  return [hexOf(top[0] ?? 0xffffff), hexOf(top[1] ?? top[0] ?? 0xffffff)];
}

// ---------- plaggen man stryker märken på (96 × 72) och ytan märkena får sitta på ----------
// Väskan ritas av butiken (bling.js drawBag); här finns tröjan och byxorna/kjolen i figurens egna färger.
const bgArt = (P, a = 0xfbe6ef, b = 0xf3d6e6) => { for (let y = 0; y < 72; y++) for (let x = 0; x < 96; x++) P.px(x, y, mix(a, b, y / 72 + (bayer(x, y) - 0.5) * 0.06)); P.ell(48, 30, 42, 30, 0xffffff, 0.35, 5); };
function inPoly(x, y, pts) { let o = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) o = !o; } return o; }
function shade(P, inside, base, x0, x1) {
  const lite = mix(base, 0xffffff, 0.3), dark = mul(base, 0.74), line = mul(base, 0.5);
  for (let y = 0; y < 72; y++) for (let x = 0; x < 96; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
    P.px(x, y, edge ? line : x < x0 + 3 ? lite : x > x1 - 4 ? dark : base);
  }
}
export function garmentArt(area, look) {
  const P = new Pix(96, 72); bgArt(P);
  if (area === 'top') {
    const base = toInt(look.shirt, 0x3a7bd5), acc = toInt(look.accent, 0xf4f1ea), tank = /tank|linne/i.test(look.top || ''), hood = /hood/i.test(look.top || '');
    const body = [[30, 12], [66, 12], [66, 68], [30, 68]];
    const sl = tank ? null : [[[30, 12], [14, 22], [10, 34], [22, 38], [30, 26]], [[66, 12], [82, 22], [86, 34], [74, 38], [66, 26]]];
    if (hood) shade(P, (x, y) => ((x - 48) / 13) ** 2 + ((y - 12) / 9) ** 2 <= 1 && y < 14, mul(base, 0.85), 35, 61);
    shade(P, (x, y) => inPoly(x, y, body) || (sl && (inPoly(x, y, sl[0]) || inPoly(x, y, sl[1]))), base, 10, 86);
    for (let x = 0; x < 96; x++) for (let y = 0; y < 72; y++) { const e = ((x + 0.5 - 48) / 9) ** 2 + ((y + 0.5 - 11) / 5) ** 2; if (e <= 1) P.px(x, y, e < 0.55 ? mul(base, 0.45) : acc); }   // halsringningen
    for (let y = 22; y < 68; y += 7) P.px(34 + (y % 3), y, mul(base, 0.85));   // veck
    if (hood) { P.rect(38, 50, 20, 10, mul(base, 0.88)); P.hl(38, 50, 20, mul(base, 0.6)); }
    return { canvas: P.flush(), zone: [33, 18, 63, 64] };
  }
  const base = toInt(look.pants, 0x2d3a5c), skirt = /skirt|kjol|dress|tutu/i.test(look.bottom || '');
  if (skirt) {
    shade(P, (x, y) => y >= 10 && y <= 54 && Math.abs(x - 48) <= 18 + (y - 10) * 0.3, base, 18, 78);
    for (let x = 30; x < 67; x++) { P.px(x, 10, mul(base, 0.6)); P.px(x, 11, mul(base, 0.8)); }
    for (let k = 0; k < 6; k++) P.line(36 + k * 5, 14, 30 + k * 7, 52, mul(base, 0.85));
    return { canvas: P.flush(), zone: [27, 13, 69, 52] };
  }
  const legs = (x, y) => y >= 8 && y <= 68 && ((x >= 28 + (y - 8) * 0.04 && x <= 47) || (x >= 49 && x <= 68 - (y - 8) * 0.04) || (y < 26 && x >= 28 && x <= 68));
  shade(P, legs, base, 28, 68);
  for (let x = 28; x <= 68; x++) for (let y = 8; y < 12; y++) P.px(x, y, y === 8 ? mix(base, 0xffffff, 0.2) : mul(base, 0.78));   // linningen
  for (const lx of [33, 48, 63]) P.rect(lx, 8, 2, 4, mul(base, 0.6));                                                          // hällorna
  P.rect(47, 9, 2, 2, 0xc9b27a); P.vl(48, 12, 12, mul(base, 0.6));                                                             // knapp och gylf
  P.line(30, 14, 37, 20, mul(base, 0.62)); P.line(66, 14, 59, 20, mul(base, 0.62));                                             // fickorna
  return { canvas: P.flush(), zone: [29, 12, 67, 66] };
}

// ---------- pärlorna: glas, pärlemor och metall, kristaller, former och bokstavspärlor ----------
export const BEAD_CATS = [{ id: 'glas', label: 'Glaspärlor' }, { id: 'parlemor', label: 'Pärlemor & metall' }, { id: 'kristall', label: '✨ Kristaller' }, { id: 'form', label: '💗 Former' }, { id: 'abc', label: '🔤 Bokstäver' }];
const B = (id, name, cat, price, kind, c, c2) => ({ id, name, cat, price, kind, c, c2 });
const GLAS = [['rod', 'Röd', 0xe8394f], ['orange', 'Orange', 0xf0902e], ['gul', 'Gul', 0xf6d02f], ['lime', 'Limegrön', 0xa8d84a], ['gron', 'Grön', 0x3fae5a], ['turkos', 'Turkos', 0x2ab0b0],
  ['ljusbla', 'Ljusblå', 0x7fc8f0], ['bla', 'Blå', 0x3a6ad5], ['lila', 'Lila', 0x9a62d8], ['rosa', 'Rosa', 0xf07ab0], ['vit', 'Vit', 0xf4f4f6], ['svart', 'Svart', 0x2a2830]];
export const BEADS = [
  ...GLAS.map(([k, n, c]) => B('g-' + k, n, 'glas', 5, 'round', c)),
  B('parla', 'Vit pärla', 'parlemor', 10, 'round', 0xf6f0e6), B('parla-rosa', 'Rosa pärla', 'parlemor', 10, 'round', 0xf8d6dc),
  B('guld', 'Guldpärla', 'parlemor', 15, 'metal', 0xe8b84a), B('silver', 'Silverpärla', 'parlemor', 12, 'metal', 0xc8d0da),
  B('k-klar', 'Kristall', 'kristall', 20, 'crystal', 0xe8f6ff), B('k-rosa', 'Rosa kristall', 'kristall', 20, 'crystal', 0xffb8d8),
  B('k-lila', 'Lila kristall', 'kristall', 20, 'crystal', 0xc8a8f0), B('k-bla', 'Blå kristall', 'kristall', 20, 'crystal', 0x9ad8f8),
  B('f-hjarta', 'Rött hjärta', 'form', 8, 'heart', 0xe8394f), B('f-hjarta-rosa', 'Rosa hjärta', 'form', 8, 'heart', 0xf07ab0),
  B('f-stjarna', 'Stjärna', 'form', 8, 'star', 0xf6d02f), B('f-blomma', 'Blomma', 'form', 8, 'flower', 0xf8a4c8, 0xf6d02f),
  B('f-blomma-vit', 'Vit blomma', 'form', 8, 'flower', 0xffffff, 0xf6d02f), B('f-smiley', 'Smiley', 'form', 10, 'smiley', 0xf6d02f),
  ...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'].map((ch, i) => ({ ...B('b-' + i, ch, 'abc', 6, 'letter', 0xffffff), ch })),
];
export const BEAD_BY = Object.fromEntries(BEADS.map((b) => [b.id, b]));
export const beadW = (b) => (b && b.kind === 'letter' ? 7 : 5);
export const beadColor = (b) => hexOf(b.kind === 'letter' ? 0xf4f4f6 : b.c);
const SHAPE = {
  round: ['.HBB.', 'HWBBL', 'HBBBL', 'BBBLL', '.LLL.'],
  metal: ['.HBB.', 'HWHBL', 'HBBBL', 'BBBLL', '.LLL.'],
  crystal: ['..H..', '.HWB.', 'HBWBL', '.BLL.', '..L..'],
  heart: ['HB.BB', 'BWBBB', 'BBBBL', '.BBL.', '..L..'],
  star: ['..B..', '.BWB.', 'BBBBB', '.BBL.', '.B.L.'],
  flower: ['.B.B.', 'BBYBB', '.YYY.', 'BBYBB', '.B.L.'],
  smiley: ['.BBB.', 'BkBkB', 'BBBBB', 'BkkkB', '.BBB.'],
};
// pärlan i (x, y) = övre vänstra hörnet; bokstavspärlan är en vit kub (7 × 7) med bokstaven
export function drawBead(P, b, x, y) {
  if (b.kind === 'letter') {
    P.rect(x, y, 7, 7, 0xf8f8fa); P.hl(x, y, 7, 0xffffff); P.vl(x + 6, y + 1, 6, 0xc8ccd6); P.hl(x + 1, y + 6, 6, 0xb8bcc8);
    const F = SMALL, w = textW(F, b.ch); eachTextPixel(F, b.ch, x + 3 - (w >> 1) + (w >= 4 ? 0 : 0), y + 1, 1, (px, py) => P.px(Math.min(px, x + 5), py, 0x2a2230));
    return;
  }
  const c = b.c, pal = { H: mix(c, 0xffffff, 0.5), B: c, L: mul(c, b.kind === 'metal' ? 0.66 : 0.74), W: 0xffffff, Y: b.c2 ?? 0xf6d02f, k: 0x2a2230 };
  SHAPE[b.kind].forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') P.px(x + i, y + j, pal[ch]); }));
}
export const LENGTHS = [['kort', 'Kort', 12], ['mellan', 'Mellan', 16], ['lang', 'Lång', 20]];
export const TRAD = [['klar', 'Genomskinlig tråd', 0, 0xdce6f0], ['silver', 'Silverkedja', 30, 0xc8d0da], ['guld', 'Guldkedja', 60, 0xe8b84a]];

// Pärlhalsbandet på bysten (128 × 88): tråden och pärlorna i ordning. slots = var varje pärla sitter (för klick).
export function drawBeadNecklace(st, selIdx = -1, blink = false) {
  const W = 128, H = 88, P = new Pix(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) P.px(x, y, mix(0xfbe6ef, 0xf1cde0, y / H + (bayer(x, y) - 0.5) * 0.06));
  P.ell(64, 28, 58, 40, 0xffffff, 0.35, 5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {   // sammetsbysten
    const neck = Math.abs(x - 64) <= 13 && y < 44, sh = y >= 38 && Math.abs(x - 64) <= 13 + (y - 38) * 2.1 + Math.sqrt(Math.max(0, y - 38)) * 3;
    if (neck || sh) P.px(x, y, x - 64 < -5 - (y > 38 ? (y - 38) * 0.8 : 0) ? 0x3a3c78 : 0x23244f);
  }
  // tråden: en båge från axlarna (där bysten börjar) och ner över bröstet – längre halsband hänger lägre
  const n = LENGTHS.find((l) => l[0] === st.len)?.[2] || 16, sag = n <= 12 ? 18 : n <= 16 ? 28 : 40, half = n <= 12 ? 24 : n <= 16 ? 25 : 26, y0 = 42;
  const pts = []; for (let t = 0; t <= 600; t++) { const u = (t / 600) * 2 - 1; pts.push([64 + half * u, y0 + sag * (1 - u * u)]); }
  const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s) => { let i = len.findIndex((v) => v >= s); if (i < 0) i = len.length - 1; return pts[i]; };
  const trad = TRAD.find((t) => t[0] === st.trad) || TRAD[0];
  for (const [x, y] of pts) P.px(Math.round(x), Math.round(y), trad[3]);
  const beads = st.beads.slice(0, n), widths = beads.map((id) => beadW(BEAD_BY[id]) + 1), total = widths.reduce((a, b) => a + b, 0);
  const L = len[len.length - 1], k = Math.min(1, (L - 2) / Math.max(1, total));   // trångt: pärlorna skjuts ihop
  let s = (L - total * k) / 2;
  const slots = [];
  beads.forEach((id, i) => {
    const w = widths[i] * k, [cx, cy] = at(s + w / 2), b = BEAD_BY[id], bw = beadW(b), bh = b && b.kind === 'letter' ? 7 : 5;
    const x = Math.round(cx - bw / 2), y = Math.round(cy - bh / 2);
    if (b) drawBead(P, b, x, y); else { P.px(Math.round(cx), Math.round(cy), 0x9aa2ac); P.px(Math.round(cx) - 1, Math.round(cy), 0xd8dce4); P.px(Math.round(cx) + 1, Math.round(cy), 0xd8dce4); }
    if (i === selIdx) { const c = blink ? 0xffffff : 0xf07ab0; P.box(x - 2, y - 2, bw + 4, bh + 4, c); }
    slots.push({ x: cx, y: cy, w: bw + 2 });
    s += w;
  });
  return { canvas: P.flush(), slots, w: W, h: H };
}
