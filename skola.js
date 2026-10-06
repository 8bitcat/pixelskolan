// Pixelskolan – spelbar skiss byggd på Snabbfilens egen motor: figurerna (people.js), pennan och
// typsnitten (floor-pix.js), figurskaparen (avatar.js), dialogerna (ui.js) och möbelatlasen
// (interior.png + frames.js). Pratbubblan och namnskylten är walkable.js-versionerna utan ljud.
import { drawPerson, makeLookRich, portrait, SHOPKEEPER } from './sf/js/core/people.js';
import { Pix, SMALL, BIG, ctxText, textW, text as pixText, mix, mul, hash, bayer, css } from './sf/js/core/floor-pix.js';
import { openModal, closeModal, esc } from './sf/js/core/ui.js';
import { openAvatarEditor, saveAvatar, cleanLook, cleanAvatar, avatarTagColors, MARKER_COLORS } from './sf/js/core/avatar.js';
import { FRAMES } from './sf/js/data/frames.js';

const W = 384, H = 216, WALL_Y = 92;
const $ = (id) => document.getElementById(id);
const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const jit = (c, x, y, s, a) => mul(c, 1 + (hash(x, y, s) - 0.5) * 2 * a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad = (n) => String(n).padStart(2, '0');
const WALK_SEQ = [1, 3, 2, 3];

// spelets typsnittsstorlekar (index.html): en bokstavspixel = hela skärmpixlar
const SF = $('sf');
function fonts() { const d = window.devicePixelRatio || 1; for (let k = 1; k <= 4; k++) SF.style.setProperty('--f' + k, (12 * Math.max(1, Math.round(k * d)) / d) + 'px'); }
fonts(); window.addEventListener('resize', fonts);
// Sidor med strikta säkerhetsregler (artefakten) kan strunta i style="…" i insatt HTML (färgrutorna i
// figurskaparen, rutornas storlek). Samma stil satt via CSSOM går alltid fram.
new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) for (const el of [n, ...n.querySelectorAll('[style]')]) { const s = el.getAttribute('style'); if (s && !el.style.cssText) el.style.cssText = s; } }).observe(SF, { childList: true, subtree: true });

const ATLAS = new Image();
ATLAS.src = 'sf/assets/interior.png';
await ATLAS.decode();
const fr = (k) => FRAMES[k];
// möbel ur atlasen: x = vänsterkant, foot = fotlinje (som room.js spriteProp)
function blit(ctx, k, x, foot) { const f = fr(k); ctx.drawImage(ATLAS, f[0], f[1], f[2], f[3], x, foot - f[3], f[2], f[3]); }
function furnShadow(ctx, k, x, foot) { const f = fr(k); ctx.fillStyle = 'rgba(20,12,28,0.22)'; ctx.fillRect(x + 1, foot - 1, f[2] - 2, 2); }
function furnCanvas(k) { const f = fr(k), c = document.createElement('canvas'); c.width = f[2]; c.height = f[3]; c.getContext('2d').drawImage(ATLAS, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]); return c; }

// ================= pratbubbla och namnskylt (walkable.js, utan ljud) =================
const SAY_OK = /[A-ZÅÄÖÉ0-9 \-+!.:,?/%'=]/;
function sayLines(str, maxW = 124, maxLines = 5) {
  const toks = [];
  for (const g of String(str).replace(/[–—]/g, '-')) { const u = g.toUpperCase(); if (/\s/.test(u)) toks.push({ g: ' ', w: 3 }); else if (SAY_OK.test(u)) toks.push({ g: u, w: textW(SMALL, u) + 1 }); }
  const words = []; let cur = [];
  for (const t of toks) { if (t.g === ' ') { if (cur.length) words.push(cur); cur = []; } else cur.push(t); }
  if (cur.length) words.push(cur);
  const lines = []; let line = [], lw = 0; const ww = (w) => w.reduce((a, t) => a + t.w, 0);
  for (const w of words) { const wd = ww(w); if (line.length && lw + 3 + wd > maxW) { lines.push(line); line = []; lw = 0; if (lines.length >= maxLines) break; } if (line.length) { line.push({ g: ' ', w: 3 }); lw += 3; } line.push(...w); lw += wd; }
  if (line.length && lines.length < maxLines) lines.push(line);
  return lines;
}
const bubbleSize = (str) => { const lines = sayLines(str); return { w: lines.length ? Math.max(...lines.map((l) => l.reduce((a, t) => a + t.w, 0))) + 7 : 0, h: lines.length * 7 + 4 }; };
function sayBubble(ctx, x, y, str, fbx) {   // fbx = bubblans vänsterkant (närbilden lägger bubblorna bredvid varandra)
  const lines = sayLines(str); if (!lines.length) return;
  const w = Math.max(...lines.map((l) => l.reduce((a, t) => a + t.w, 0))) + 7, h = lines.length * 7 + 4;
  const bx = fbx ?? Math.max(2, Math.min(W - w - 2, Math.round(x - w / 2))), by = Math.max(2, Math.round(y - h - 4));
  ctx.fillStyle = '#17151a'; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(bx, by, w, h);
  const tx = Math.max(bx + 2, Math.min(bx + w - 3, Math.round(x)));
  ctx.fillStyle = '#17151a'; ctx.fillRect(tx - 2, by + h, 5, 1); ctx.fillRect(tx - 1, by + h + 1, 3, 1); ctx.fillRect(tx, by + h + 2, 1, 1);
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(tx - 1, by + h, 3, 1);
  let yy = by + 3;
  for (const l of lines) { let xx = bx + 4; for (const t of l) { if (t.g !== ' ') ctxText(ctx, SMALL, t.g, xx, yy, t.c || '#17151a'); xx += t.w; } yy += 7; }
}
function nameTag(ctx, x, y, av) {
  const c = avatarTagColors(av), name = String(av.name || '?').toUpperCase();
  const w = textW(SMALL, name) + 6;
  ctx.fillStyle = c.bg; ctx.fillRect(x - w / 2 | 0, y | 0, w, 9);
  ctxText(ctx, SMALL, name, (x - w / 2 | 0) + 3, (y | 0) + 2, c.fg);
}

// ================= tillstånd (sparas i den här webbläsaren) =================
const SAVE_KEY = 'pixelskolan-v3';
const DEF_NAMES = ['Alva', 'Noah', 'Selma', 'Elias', 'Wilma', 'Leo', 'Saga'];
const kidLook = () => cleanLook({ ...makeLookRich(), kid: true, phones: false });
const adultLook = () => cleanLook({ ...makeLookRich(), kid: false, phones: false });
const TEACHER_LOOK = () => cleanLook({ skin: '#eec3a0', hair: '#6b4226', style: 'bun', top: 'sweater', shirt: '#2aa39a', accent: '#f4f1ea', bottom: 'skirt', pants: '#2d3a5c', shoes: '#6b3e1e', glasses: 'round', kid: false, build: 5 });
const newAv = (name, look) => cleanAvatar({ name, look, color: pick(MARKER_COLORS) });
let ME = null, CLASS = [], TEACHER = null, STARS = 0, KR = 0, LESSONS = 0, OWN = {}, WEAR = {}, PLACED = [], KLASS = '2B';
const D = { tab: 'matte', lvl: { matte: 1, klocka: 1, svenska: 1 }, streak: 0, miss: 0, q: null, tried: false, solved: false, locked: false, last: '', rast: false };
// klassens namn som man skriver in själv (2B, 3A …): versaler, siffror och bokstäver, högst fyra tecken
const cleanKlass = (v) => String(v || '').toUpperCase().replace(/[^0-9A-ZÅÄÖ]/g, '').slice(0, 4);
const gradeOf = (k) => { const m = /^\d/.exec(k); return m ? +m[0] : 0; };
function fresh() {
  ME = null; CLASS = DEF_NAMES.map((n) => newAv(n, kidLook())); TEACHER = newAv('Fröken Maja', TEACHER_LOOK()); KLASS = '2B';
  STARS = 0; KR = 0; LESSONS = 0; OWN = {}; WEAR = {}; PLACED = []; D.lvl = { matte: 1, klocka: 1, svenska: 1 }; D.rast = false;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ME, CLASS, TEACHER, STARS, KR, LESSONS, OWN, WEAR, PLACED, KLASS, lvl: D.lvl })); } catch { /* lagring avstängd */ } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!s || !s.ME || !s.ME.name) return false;
    ME = cleanAvatar(s.ME); CLASS = (s.CLASS || []).map(cleanAvatar); TEACHER = cleanAvatar(s.TEACHER);
    if (CLASS.length !== 7) return false;
    ({ STARS = 0, KR = 0, LESSONS = 0, OWN = {}, WEAR = {}, PLACED = [] } = s); if (s.lvl) D.lvl = s.lvl; KLASS = cleanKlass(s.KLASS) || '2B';
    return true;
  } catch { return false; }
}
fresh();

// ================= stjärnbutikens varor =================
// kläderna är riktiga plagg ur spelets register; möblerna kommer ur möbelatlasen
const ITEMS = {
  keps: { name: 'Keps', short: 'KEPS', price: 2, kind: 'klader', look: { hat: 'cap', cap: '#c9323a' }, desc: 'Röd keps. Syns på din figur direkt.' },
  skor: { name: 'Blinkskor', short: 'SKOR', price: 3, kind: 'klader', look: { shoeType: 'lightUp' }, desc: 'Sulorna lyser i olika färger när du går.' },
  vaska: { name: 'Skolryggsäck', short: 'VÄSKA', price: 3, kind: 'klader', look: { bag: 'schoolBag', bagColor: '#8e5bd1' }, desc: 'Lila skolryggsäck på ryggen.' },
  trojan: { name: 'Klasströja', short: 'TRÖJA', price: 4, kind: 'klader', look: { top: 'college', shirt: '#2aa39a', topPrint: 'star', print2: '#f0b429' }, desc: 'Turkos collegetröja med en guldstjärna.' },
  skrivbord: { name: 'Skrivbord', short: 'BORD', price: 5, kind: 'mobel', k: 'skrivbord1', desc: 'Skickas hem till förrådet. Ställ ut det i ditt rum.' },
  bokhylla: { name: 'Bokhylla', short: 'HYLLA', price: 4, kind: 'mobel', k: 'bokhylla2', desc: 'Skickas hem till förrådet. Ställ ut den i ditt rum.' },
  nalle: { name: 'Jättenalle', short: 'NALLE', price: 4, kind: 'mobel', k: 'jattenalle0', desc: 'Skickas hem till förrådet. Ställ ut den i ditt rum.' },
  staffli: { name: 'Staffli', short: 'STAFFLI', price: 3, kind: 'mobel', k: 'staffli0', desc: 'Skickas hem till förrådet. Ställ ut det i ditt rum.' },
};
let LOOK_CACHE = null;
function myLook() {
  if (LOOK_CACHE) return LOOK_CACHE;
  let L = { ...ME.look };
  for (const id in ITEMS) if (ITEMS[id].kind === 'klader' && WEAR[id]) L = { ...L, ...ITEMS[id].look };
  return (LOOK_CACHE = cleanLook(L));
}
const lookChanged = () => { LOOK_CACHE = null; };
const DOLL = cleanLook({ skin: '#ece6ee', style: 'bald', hair: '#ecd489', top: 'tank', shirt: '#f4f1ea', accent: '#f4f1ea', bottom: 'jeans', pants: '#3f5f8f', shoes: '#1c1c1c', kid: true });
const DOLLS = { keps: cleanLook({ ...DOLL, ...ITEMS.keps.look }), skor: cleanLook({ ...DOLL, ...ITEMS.skor.look }), vaska: cleanLook({ ...DOLL, ...ITEMS.vaska.look }), trojan: cleanLook({ ...DOLL, ...ITEMS.trojan.look }) };

// ================= klassrummet =================
const XS = [92, 140, 188, 236], ROWS = [158, 202];            // bänkarnas mitt och fotlinje
const SEAT = { r: 0, x: 188, ax: 188, ay: 166 };              // din bänk: främre raden mitt under tavlan
const KIDSEATS = [[0, 92], [0, 140], [0, 236], [1, 92], [1, 140], [1, 188], [1, 236]];
const TEACH = { x: 262, y: 118 };
const DOOR = { x0: 296, x1: 324, y0: 36, ax: 311, ay: 100 };
const BOARD = { x0: 118, x1: 262, y0: 20, y1: 62 };
const BAGS = [['ryggsack0', 108, 156], ['ryggsack2', 156, 200], ['ryggsack1', 252, 156]];

function taklist(P) {
  for (let x = 0; x < W; x++) {
    P.px(x, 0, 0x2a1e16); P.px(x, 1, 0x4a3424); P.px(x, 2, jit(0x6a4a30, x, 2, 1, 0.05)); P.px(x, 3, 0x7a5a3c); P.px(x, 4, 0x3a2a1c); P.px(x, 5, 0x000000);
    if (x % 8 === 0) { P.px(x, 2, 0x8a6a48); P.px(x, 3, 0x8a6a48); }
  }
}
function golvlist(P) { for (let x = 0; x < W; x++) { P.px(x, WALL_Y - 4, 0x3a2618); P.px(x, WALL_Y - 3, 0x6a4a30); P.px(x, WALL_Y - 2, 0x5a3c26); P.px(x, WALL_Y - 1, 0x2a1c12); P.px(x, WALL_Y, 0x000000, 0.35); P.px(x, WALL_Y + 1, 0x000000, 0.15); } }
function parkett(P, base, y0 = WALL_Y) {
  for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x, v = y - y0, blk = Math.floor(u / 8) + Math.floor(v / 8), lu = u % 8, lv = v % 8;
    const seam = blk & 1 ? (lu + lv) % 8 === 0 : (lu - lv + 8) % 8 === 0;
    let c = jit(base, Math.floor(u / 8), Math.floor(v / 8) + (blk & 1) * 17, 51, 0.09); c = jit(c, x, y, 52, 0.03);
    P.px(x, y, seam ? mul(c, 0.72) : c);
  }
}
function planks(P, base, y0 = WALL_Y) {
  for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = ((y - y0) / 8) | 0, lx = (x + row * 19) % 48;
    let c = jit(base, (x + row * 19) / 48 | 0, row, 53, 0.08); c = jit(c, x, y >> 1, 54, 0.03);
    if ((y - y0) % 8 === 0) c = mul(c, 0.78); else if (lx === 0) c = mul(c, 0.82); else if ((y - y0) % 8 === 1) c = mix(c, 0xfff4dc, 0.1);
    P.px(x, y, c);
  }
}
function window_(P, x0, y0, w, h) {
  P.rect(x0 - 3, y0 - 3, w + 6, h + 6, 0xece6da); P.box(x0 - 3, y0 - 3, w + 6, h + 6, 0x8a8478); P.hl(x0 - 2, y0 - 2, w + 4, 0xfffaf0);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const lv = Math.min(4, Math.floor((y - y0) / h * 4 + bayer(x, y))); P.px(x, y, mix(0x6aaee6, 0xd8ecf2, lv / 4)); }
  for (const [cx, cy] of [[x0 + 8, y0 + 8], [x0 + w - 14, y0 + 6]]) { P.ell(cx, cy, 7, 3, 0xffffff, 0.95, 3); }
  for (let y = y0 + h - 14; y < y0 + h; y++) for (let x = x0; x < x0 + 18; x++) if (Math.hypot(x - x0 - 8, (y - y0 - h + 6) * 1.2) < 9) P.px(x, y, jit(hash(x >> 1, y >> 1, 9) > 0.5 ? 0x4a9a42 : 0x3a7a34, x, y, 10, 0.05));
  P.vl(x0 + (w >> 1), y0, h, 0xe2ddd0); P.hl(x0, y0 + (h >> 1), w, 0xe2ddd0);
  for (let i = 0; i < 6; i++) P.px(x0 + 3 + i, y0 + 2 + i, 0xffffff, 0.5);
  P.rect(x0 - 5, y0 + h + 3, w + 10, 3, 0xf3efe4); P.hl(x0 - 5, y0 + h + 3, w + 10, 0xfffaf0); P.hl(x0 - 5, y0 + h + 6, w + 10, 0x000000, 0.25);
}
function chalkboard(P, B = BOARD) {
  const { x0, x1, y0, y1 } = B;
  P.rect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8, 0x6a4424); P.box(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8, 0x3a2412);
  P.hl(x0 - 3, y0 - 3, x1 - x0 + 6, 0xa07048); P.vl(x0 - 3, y0 - 3, y1 - y0 + 6, 0x8a5c36);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { let c = jit(0x2a4a3a, x >> 1, y >> 1, 141, 0.05); if (hash(x, y, 142) > 0.97) c = mix(c, 0xd8e0d8, 0.18); P.px(x, y, c); }
  P.rect(x0 - 2, y1 + 4, x1 - x0 + 4, 3, 0x8a5c36); P.hl(x0 - 2, y1 + 4, x1 - x0 + 4, 0xb88458); P.hl(x0 - 2, y1 + 7, x1 - x0 + 4, 0x000000, 0.3);
  P.rect(x0 + 20, y1 + 3, 4, 1, 0xf4f1ea); P.rect(x0 + 28, y1 + 3, 3, 1, 0xf0c8c8); P.rect(x0 + 34, y1 + 3, 3, 1, 0xf8e878);
  P.rect(x1 - 30, y1 + 2, 9, 2, 0x3a3a44); P.hl(x1 - 30, y1 + 2, 9, 0xd8c8a0);
}
function abcStrip(P) {
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ', cols = [0xc9323a, 0x3a7bd5, 0x2f8f46, 0xd08a1a];
  const ws = [...AL].map((c) => textW(SMALL, c) + 2), tot = ws.reduce((a, b) => a + b, 0);
  let x = Math.round((BOARD.x0 + BOARD.x1) / 2 - tot / 2);
  [...AL].forEach((ch, i) => { P.rect(x, 7, ws[i], 9, i % 2 ? 0xf2ead6 : 0xfbf8ef); P.hl(x, 15, ws[i], 0xc8bea8); pixText(P, SMALL, ch, x + 1, 9, cols[i % 4]); x += ws[i]; });
}
function blueDoor(P) {
  const { x0, x1, y0 } = DOOR;
  P.rect(x0, y0, x1 - x0 + 1, WALL_Y - y0, 0x6e4c2e); P.vl(x0, y0, WALL_Y - y0, 0x9a7450); P.hl(x0, y0, x1 - x0 + 1, 0x9a7450);
  for (let y = y0 + 2; y < WALL_Y; y++) for (let x = x0 + 2; x < x1 - 1; x++) { let c = jit(0x3a7ab8, x >> 1, y >> 2, 70, 0.04); if (x === x0 + 2) c = mix(c, 0xfff4e0, 0.2); if (x >= x1 - 3) c = mul(c, 0.8); P.px(x, y, c); }
  P.rect(x0 + 7, y0 + 7, 15, 14, 0xe6e2d8); for (let y = y0 + 8; y < y0 + 20; y++) for (let x = x0 + 8; x < x0 + 21; x++) P.px(x, y, (x - y + 300) % 9 < 2 ? 0xf2fbff : 0xbfe0ee);
  const kw = textW(SMALL, KLASS), pw = Math.max(13, kw + 4), px0 = Math.round((x0 + x1 + 1) / 2 - pw / 2);   // klasskylten på dörren
  P.rect(px0, y0 + 24, pw, 7, 0xf6f2e6); pixText(P, SMALL, KLASS, px0 + Math.round((pw - kw) / 2), y0 + 25, 0x3a7bd5);
  P.rect(x1 - 6, y0 + 34, 3, 2, 0xc8c8d0); P.px(x1 - 6, y0 + 34, 0xf0f0f6);
  P.rect(x0 + 2, WALL_Y - 8, x1 - x0 - 3, 4, 0xa8b0b8); P.hl(x0 + 2, WALL_Y - 8, x1 - x0 - 3, 0xd0d6dc);
}
function poster(P) {
  P.rect(272, 38, 21, 27, 0xfff0b8); P.box(272, 38, 21, 27, 0xc8a050); P.hl(273, 65, 21, 0x000000, 0.3); P.vl(293, 39, 27, 0x000000, 0.3);
  const st = ['..#..', '.###.', '#####', '.###.', '##.##'];
  st.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') P.rect(277 + i * 2, 41 + j * 2, 2, 2, 0xe8b230); }));
  pixText(P, SMALL, 'BUTIK', 273, 53, 0x7a4a00);
  P.hl(276, 61, 9, 0x7a4a00); P.px(283, 60, 0x7a4a00); P.px(283, 62, 0x7a4a00);
}

function paintClass() {
  const P = new Pix(W, H);
  taklist(P);
  for (let y = 6; y < WALL_Y; y++) for (let x = 0; x < W; x++) P.px(x, y, jit(jit(0xe2ead6, x >> 2, y >> 3, 21, 0.02), x, y, 22, 0.02));
  for (let x = 0; x < W; x++) { for (let y = 74; y < WALL_Y; y++) { const k = x % 4; P.px(x, y, k === 0 ? 0x5a3a22 : k === 3 ? 0x7a5234 : jit(0x946a44, x, y, 23, 0.05)); } P.px(x, 73, 0xc8a878); P.px(x, 72, 0x6a4a30); }
  golvlist(P);
  parkett(P, 0xb07a48);
  window_(P, 16, 20, 48, 40);
  for (let y = 77; y < 88; y++) for (let x = 18; x < 62; x++) { const k = (x - 18) % 3; P.px(x, y, y === 77 ? 0xf8f8f2 : y === 87 ? 0xa8a8a2 : k === 2 ? 0xbcbcb6 : k === 0 ? 0xf4f4ee : 0xe6e6e0); }
  P.ell(70, 130, 46, 20, 0xfff6dc, 0.14, 4);                          // dagsljuset på golvet
  chalkboard(P); abcStrip(P); blueDoor(P); poster(P);
  const bg = P.flush(), c = bg.getContext('2d');
  blit(c, 'anslagstavla0', 72, 46); blit(c, 'abcplansch0', 80, 70); blit(c, 'vaggklocka0', 304, 32); blit(c, 'vaggkalender0', 352, 60);
  furnShadow(c, 'bokhylla0', 342, 100); blit(c, 'bokhylla0', 342, 100);
  furnShadow(c, 'gummitrad0', 2, 106); blit(c, 'gummitrad0', 2, 106);
  furnShadow(c, 'barnbord0', 118, 116); blit(c, 'barnbord0', 118, 116); blit(c, 'bordslampa0', 136, 100);
  furnShadow(c, 'papperskorg0', 150, 116); blit(c, 'papperskorg0', 150, 116);
  blit(c, 'rutmatta0', 304, 178);                                     // läshörnans matta (platt)
  return bg;
}
// ================= närbild på tavlan (när man sitter i bänken) =================
// Samma vägg, panel och tavla som i klassrummet, bara tavlan i stort. vis = hur mycket av bilden
// som syns ovanför lektionsrutan; under tavlan finns en remsa för klassens pratbubblor.
const CU_STRIP = 28;
const cuBoard = (vis) => ({ x0: 22, y0: 12, x1: W - 22, y1: vis - CU_STRIP });
const CU_BG = new Map();
function closeBG(vis) {
  if (CU_BG.has(vis)) return CU_BG.get(vis);
  const P = new Pix(W, H), b = cuBoard(vis), rail = b.y1 + 12;
  taklist(P);
  for (let y = 6; y < H; y++) for (let x = 0; x < W; x++) P.px(x, y, jit(jit(0xe2ead6, x >> 2, y >> 3, 21, 0.02), x, y, 22, 0.02));
  for (let x = 0; x < W; x++) { for (let y = rail + 2; y < H; y++) { const k = x % 4; P.px(x, y, k === 0 ? 0x5a3a22 : k === 3 ? 0x7a5234 : jit(0x946a44, x, y, 23, 0.05)); } P.px(x, rail + 1, 0xc8a878); P.px(x, rail, 0x6a4a30); }
  chalkboard(P, b);
  const bg = P.flush(); CU_BG.set(vis, bg); return bg;
}
const STATIC_K = [];
for (const [r, fy] of ROWS.entries()) for (const x of XS) STATIC_K.push({ fy: fy - 3, draw: (c) => { furnShadow(c, 'skolbank0', x - 13, fy); blit(c, 'skolbank0', x - 13, fy); } });
for (const [k, x, fy] of BAGS) STATIC_K.push({ fy, draw: (c) => blit(c, k, x, fy) });
STATIC_K.push({ fy: 172, draw: (c) => blit(c, 'jattenalle0', 340, 172) }, { fy: 184, draw: (c) => blit(c, 'stjarnkudde0', 316, 184) }, { fy: 192, draw: (c) => blit(c, 'golvkudde0', 352, 192) });

// ================= stjärnbutiken =================
const SHOP = {
  keps: { at: [30, 122], ap: [30, 140] }, skor: { at: [70, 122], ap: [70, 140] }, vaska: { at: [110, 122], ap: [110, 140] }, trojan: { at: [150, 122], ap: [150, 140] },
  skrivbord: { at: [268, 128], ap: [284, 140] }, bokhylla: { at: [342, 104], ap: [357, 140] }, nalle: { at: [314, 128], ap: [322, 140] }, staffli: { at: [364, 136], ap: [370, 148] },
};
const CLERK = { x: 226, y: 112 };
function paintShop() {
  const P = new Pix(W, H);
  taklist(P);
  for (let y = 6; y < WALL_Y; y++) for (let x = 0; x < W; x++) { let c = jit(0xf0dfc2, x >> 1, y >> 3, 31, 0.02); if (x % 24 < 12) c = mul(c, 0.975); P.px(x, y, jit(c, x, y, 32, 0.015)); }
  for (let x = 0; x < W; x++) for (let y = 70; y < WALL_Y; y++) { const px = x % 28; let c = jit(0x7a5234, x, y >> 1, 71, 0.05); if (y === 70) c = 0xc8a070; else if (y === 71) c = 0x4a3020; else if (px === 0 || px === 27) c = 0x5a3a22; else if (px === 3) c = 0x9a7048; P.px(x, y, c); }
  golvlist(P);
  planks(P, 0xb48a5a);
  // skylten
  const tw = textW(BIG, 'STJÄRNBUTIKEN'), sx = Math.round(W / 2 - tw / 2);
  P.rect(sx - 8, 7, tw + 16, 16, 0x2a2440); P.box(sx - 8, 7, tw + 16, 16, 0xe8b230); P.hl(sx - 7, 8, tw + 14, 0xffe27a);
  pixText(P, BIG, 'STJÄRNBUTIKEN', sx, 12, 0xffd23f);
  // podierna för dockorna
  for (const id of ['keps', 'skor', 'vaska', 'trojan']) { const [x, y] = SHOP[id].at; P.ell(x, y, 11, 4, 0x000000, 0.25, 3); P.rect(x - 9, y - 3, 18, 4, 0xe8dcc8); P.hl(x - 9, y - 3, 18, 0xfff6e4); P.hl(x - 9, y, 18, 0xa89878); }
  // fönster och dörrmattor
  window_(P, 22, 24, 36, 32);
  const bg = P.flush(), c = bg.getContext('2d');
  blit(c, 'blomkruka1', 8, 104); blit(c, 'vaggklocka0', 186, 40);
  for (const id of ['skrivbord', 'nalle', 'staffli']) { const [x, fy] = SHOP[id].at, k = ITEMS[id].k, f = fr(k); c.fillStyle = '#e8dcc8'; c.fillRect(x - 3, fy - 3, f[2] + 6, 5); c.fillStyle = '#a89878'; c.fillRect(x - 3, fy + 1, f[2] + 6, 1); }
  blit(c, 'dorrmatta0', 30, 212); blit(c, 'dorrmatta2', 330, 212);
  ctxText(c, SMALL, `TILL ${KLASS}`, 30, 196, '#3a2a10'); ctxText(c, SMALL, 'HEM', 336, 196, '#3a2a10');
  return bg;
}
function paintCounter() {
  const P = new Pix(W, H);
  for (let y = 98; y < 104; y++) for (let x = 196; x < 258; x++) P.px(x, y, y === 98 ? 0xe8c890 : jit(0xd8b07a, x >> 2, y, 55, 0.04));
  for (let y = 104; y < 120; y++) for (let x = 196; x < 258; x++) { let c = jit(0x7ac0a8, x >> 1, y >> 2, 56, 0.04); if (y === 104) c = 0x4a8a78; if (x === 196) c = mix(c, 0xffffff, 0.15); if (x >= 256) c = mul(c, 0.8); P.px(x, y, c); }
  P.box(195, 97, 64, 24, 0x2a1c12); P.hl(196, 121, 62, 0x000000, 0.3); P.hl(196, 122, 62, 0x000000, 0.15);
  ['..#..', '.###.', '#####', '.###.', '##.##'].forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') P.rect(222 + i * 2, 107 + j * 2, 2, 2, 0xffd23f); }));
  P.rect(240, 89, 14, 9, 0x8a8f98); P.rect(242, 90, 10, 4, 0x6ad08a); P.hl(240, 89, 14, 0xb0b6be);
  return P.flush();
}
const COUNTER = paintCounter();
const STATIC_B = [{ fy: 121, draw: (c) => c.drawImage(COUNTER, 0, 0) }];
for (const id of ['skrivbord', 'bokhylla', 'nalle', 'staffli']) { const [x, fy] = SHOP[id].at, k = ITEMS[id].k; STATIC_B.push({ fy, draw: (c) => { furnShadow(c, k, x, fy); blit(c, k, x, fy); } }); }
for (const id of ['keps', 'skor', 'vaska', 'trojan']) { const [x, y] = SHOP[id].at; STATIC_B.push({ fy: y - 1, draw: (c, t) => drawPerson(c, x, y - 1, DOLLS[id], id === 'vaska' ? 'right' : 'down', id === 'skor' ? WALK_SEQ[Math.floor(t * 6) % 4] : 0) }); }
STATIC_B.push({ fy: CLERK.y, draw: (c, t) => drawPerson(c, CLERK.x, CLERK.y, SHOPKEEPER, 'down', Math.sin(t * 1.3) > 0.92 ? 4 : 0) });

// ================= ditt rum =================
const HOME_FIX = [['enkelsang0', 20, 134], ['nattduksbord0', 40, 108], ['kladskap0', 330, 100], ['lampa0', 362, 104]];
const WARDROBE = { x0: 330, x1: 353, y0: 67, y1: 100, ap: [341, 116] };
function paintHome() {
  const P = new Pix(W, H);
  taklist(P);
  for (let y = 6; y < WALL_Y; y++) for (let x = 0; x < W; x++) { let c = jit(0xcfdcee, x >> 2, y >> 3, 81, 0.02); if (x % 14 === 7 && y % 14 === 7) c = mix(c, 0xffffff, 0.5); if ((x + 7) % 14 === 7 && (y + 7) % 14 === 7) c = mix(c, 0xe8a0c0, 0.4); P.px(x, y, c); }
  for (let x = 0; x < W; x++) { for (let y = WALL_Y - 10; y < WALL_Y - 4; y++) P.px(x, y, y === WALL_Y - 10 ? 0xffffff : 0xece6f0); }
  golvlist(P);
  planks(P, 0xc8a070);
  window_(P, 176, 22, 33, 30);
  const bg = P.flush(), c = bg.getContext('2d');
  blit(c, 'gardin0', 176, 54); blit(c, 'barntavla0', 110, 56); blit(c, 'ramtavla0', 136, 50);
  blit(c, 'lillmatta0', 176, 176);
  for (const [k, x, fy] of HOME_FIX) { furnShadow(c, k, x, fy); blit(c, k, x, fy); }
  blit(c, 'dorrmatta1', 26, 212); ctxText(c, SMALL, 'SKOLAN', 26, 196, '#3a2a10');
  return bg;
}

// ================= scenerna =================
const BG = { klass: paintClass(), butik: paintShop(), hem: paintHome() };
const LABEL = { klass: 'KLASSRUM', butik: 'STJÄRNBUTIKEN', hem: 'DITT RUM' };
// nytt klassnamn: dörrskylten och mattan i butiken är målade i bakgrunderna, så de målas om
function setKlass(v) {
  const k = cleanKlass(v); if (!k || k === KLASS) return;
  const g0 = gradeOf(KLASS), g = gradeOf(k); KLASS = k;
  if (g && g !== g0) { const l = Math.max(1, Math.min(3, g - 1)); D.lvl = { matte: l, klocka: l, svenska: l }; }   // åk 1–2 börjar på nivå 1, åk 3 på nivå 2, åk 4+ på nivå 3
  BG.klass = paintClass(); BG.butik = paintShop(); updatePill(); save();
}
const FP = (id, x, y) => { const f = fr(ITEMS[id].k); return [x, y - Math.min(12, f[3] >> 1), x + f[2], y + 1]; };
const BLOCKS = {
  klass: () => [...ROWS.flatMap((fy) => XS.map((x) => [x - 14, fy - 14, x + 14, fy + 1])), ...BAGS.map(([k, x, fy]) => [x, fy - 6, x + 11, fy + 1]), [338, 162, 358, 173], [114, 96, 170, 118]],
  butik: () => [[192, 96, 262, 122], [18, 112, 162, 126], [266, 118, 302, 130], [312, 118, 334, 130], [338, 92, 374, 106], [360, 124, 378, 138]],
  hem: () => [[18, 98, 40, 135], [38, 92, 58, 110], [328, 90, 356, 102], [360, 92, 378, 106], ...PLACED.map((p) => FP(p.id, p.x, p.y))],
};
const BOUNDS = {
  klass: (x, y) => (x >= 6 && x <= 378 && y >= 122 && y <= 213) || (x >= 300 && x <= 322 && y >= 96 && y < 122),
  butik: (x, y) => x >= 6 && x <= 378 && y >= 128 && y <= 213,
  hem: (x, y) => x >= 6 && x <= 378 && y >= 110 && y <= 213,
};

// ================= gå: A* på 4 px-rutnät, som i spelet =================
const CELL = 4, GC = W / CELL, GR = H / CELL;
const P = { scene: 'klass', x: 220, y: 210, dir: 'up', path: [], dist: 0, seated: false, onArrive: null };
const freeAt = (x, y) => { if (!BOUNDS[P.scene](x, y)) return false; for (const [a, b, c, d] of BLOCKS[P.scene]()) if (x >= a - 5 && x <= c + 5 && y >= b - 2 && y <= d + 2) return false; return true; };
let grid = new Uint8Array(GC * GR);
function buildGrid() { grid = new Uint8Array(GC * GR); for (let j = 0; j < GR; j++) for (let i = 0; i < GC; i++) grid[j * GC + i] = freeAt(i * CELL + 2, j * CELL + 2) ? 1 : 0; }
function nearestCell(x, y) { let best = -1, bd = Infinity; for (let n = 0; n < GC * GR; n++) if (grid[n]) { const dx = (n % GC) * CELL + 2 - x, dy = ((n / GC) | 0) * CELL + 2 - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = n; } } return best; }
function astar(s, g) {
  const N = GC * GR, gs = new Float32Array(N).fill(Infinity), fs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N), inOpen = new Uint8Array(N);
  const gi = g % GC, gj = (g / GC) | 0, h = (n) => { const dx = Math.abs(n % GC - gi), dy = Math.abs(((n / GC) | 0) - gj); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const open = [s]; gs[s] = 0; fs[s] = h(s); inOpen[s] = 1;
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (fs[open[k]] < fs[open[bi]]) bi = k;
    const c = open[bi]; open.splice(bi, 1); inOpen[c] = 0;
    if (c === g) { const path = []; for (let x = c; x !== -1; x = came[x]) path.push(x); return path.reverse(); }
    closed[c] = 1; const ci = c % GC, cj = (c / GC) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= GC || nj >= GR) continue;
      const n = nj * GC + ni; if (!grid[n] || closed[n]) continue;
      if (di && dj && (!grid[cj * GC + ni] || !grid[nj * GC + ci])) continue;
      const t = gs[c] + (di && dj ? 1.414 : 1);
      if (t < gs[n]) { gs[n] = t; fs[n] = t + h(n); came[n] = c; if (!inOpen[n]) { open.push(n); inOpen[n] = 1; } }
    }
  }
  return null;
}
function sight(x0, y0, x1, y1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2)); for (let k = 0; k <= n; k++) if (!freeAt(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)) return false; return true; }
function findPath(x0, y0, x1, y1) {
  let s = ((y0 / CELL) | 0) * GC + ((x0 / CELL) | 0); if (!grid[s]) s = nearestCell(x0, y0);
  const g = nearestCell(x1, y1); if (s < 0 || g < 0) return null;
  const cells = astar(s, g); if (!cells) return null;
  const pts = cells.map((n) => [(n % GC) * CELL + 2, ((n / GC) | 0) * CELL + 2]);
  if (freeAt(x1, y1)) pts[pts.length - 1] = [x1, y1];
  const out = []; let a = [x0, y0], k = 0;
  while (k < pts.length) { let far = k; for (let m = pts.length - 1; m > k; m--) if (sight(a[0], a[1], pts[m][0], pts[m][1])) { far = m; break; } out.push(pts[far]); a = pts[far]; k = far + 1; }
  return out;
}
function walkTo(x, y, cb) { const p = findPath(P.x, P.y, x, y); if (!p || !p.length) { P.path = []; if (cb) cb(); return; } P.path = p; P.onArrive = cb || null; }
function update(dt) {
  if (!P.path.length) return;
  const [tx, ty] = P.path[0], dx = tx - P.x, dy = ty - P.y, d = Math.hypot(dx, dy), step = 58 * dt;
  if (Math.abs(dx) > Math.abs(dy) + 0.5) P.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.5) P.dir = dy > 0 ? 'down' : 'up';
  if (d <= step) { P.x = tx; P.y = ty; P.path.shift(); P.dist += d; } else { P.x += dx / d * step; P.y += dy / d * step; P.dist += step; }
  if (!P.path.length) { const cb = P.onArrive; P.onArrive = null; if (cb) cb(); }
}
const near = (x, y) => Math.hypot(P.x - x, P.y - y) < 4;

// ================= pratbubblor =================
let BUBS = [];
const firstName = (av) => String(av?.name || 'du').trim().split(/\s+/)[0];
const fillVars = (s, me) => s.replace(/\{P\}/g, firstName(ME)).replace(/\{F\}/g, TEACHER.name).replace(/\{K\}/g, () => firstName(pick(CLASS.filter((k, i) => i !== me))));
function say(key, at, who, s, me) {
  const t = fillVars(s, me), str = who ? `${who === TEACHER ? who.name : firstName(who)}: ${t}` : t;
  BUBS = BUBS.filter((b) => b.key !== key);
  BUBS.push({ key, at, str, until: performance.now() + Math.max(3000, Math.min(7000, str.length * 75)) });
  while (BUBS.length > 3) BUBS.shift();
}
const kidAt = (i) => { const [r, x] = KIDSEATS[i]; return { x, y: ROWS[r] - 36 }; };
const teacherSay = (s) => { if (P.scene === 'klass') say('t', { x: TEACH.x, y: TEACH.y - 44 }, TEACHER, s); };
const kidSay = (i, s) => say('k' + i, kidAt(i), CLASS[i], s, i);
const clerkSay = (s) => say('c', { x: CLERK.x, y: CLERK.y - 44 }, null, s);
const meSay = (s) => say('me', () => ({ x: P.x, y: P.y - 36 }), null, s);
const FREE_LINES = ['HEJ {P}!', '{P}, KOM OCH SITT!', 'VI HAR MATTE NU.', '{F} ÄR SNÄLL.', 'SNART RAST!', 'SNYGGA KLÄDER, {P}!', 'JAG HAR FÅTT TRE STJÄRNOR!', '{K}, FÅR JAG LÅNA SUDDET?', 'VAD BLIR 7 + 3?', 'JAG GILLAR KLOCKAN.', 'SKA VI LEKA PÅ RASTEN, {K}?', 'JAG VILL HA BLINKSKORNA.'];
const LESSON_LINES = ['DU KLARAR DET, {P}!', 'SCHH, JAG RÄKNAR.', 'JAG TÄNKER.', 'TIOKOMPISAR ÄR LÄTT!', '{F}, JAG ÄR KLAR!', 'HUR STAVAS REGNBÅGE?', 'HEJA {P}!', 'VAD BLIR 8 + 5, {K}?'];
const RAST_LINES = ['RAST! KOM, {P}!', 'JAG SKA KÖPA KEPSEN.', 'SPRING TILL BUTIKEN!', 'HUR MÅNGA STJÄRNOR FICK DU?', 'VI SES EFTER RASTEN!'];
const CHEER = ['SNYGGT {P}!', 'BRA {P}!', 'WOW!', 'DU ÄR GRYM, {P}!'];
let nextChat = 0;
function chatter(now) {
  if (!ME || P.scene !== 'klass' || now < nextChat || modalUp()) return;
  nextChat = now + rnd(4200, 8000);
  if (BUBS.length >= 2) return;
  let pool = CLASS.map((k, i) => i).filter((i) => !BUBS.some((b) => b.key === 'k' + i));
  if (P.seated) pool = pool.filter((i) => KIDSEATS[i][0] === 0);
  if (pool.length) kidSay(pick(pool), pick(D.rast ? RAST_LINES : P.seated ? LESSON_LINES : FREE_LINES));
}
const modalUp = () => !$('modal').classList.contains('hidden');

// ================= ritning =================
const cv = $('room'), frame = $('frame'), stage = $('stage'), ctx = cv.getContext('2d');
let scale = 1, mouse = null, hover = null, fadeT = -1e9, doorGlow = false, placing = null;
const fill = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const STAR = ['..#..', '.###.', '#####', '.###.', '##.##'];
const starPx = (x, y, c) => STAR.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') fill(x + i, y + j, 1, 1, c); }));
function dollTag(x, y, id) {
  const it = ITEMS[id], own = !!OWN[id], l1 = it.short, l2 = own ? 'DIN' : String(it.price);
  const w = Math.max(textW(SMALL, l1), textW(SMALL, l2) + (own ? 0 : 7)) + 6, h = 15, x0 = Math.round(x - w / 2);
  fill(x0 - 1, y - 1, w + 2, h + 2, '#17151a'); fill(x0, y, w, h, own ? '#45b964' : '#fbf6ea'); fill(x0, y, w, 2, own ? '#2f8f46' : '#e8b230');
  ctxText(ctx, SMALL, l1, x0 + Math.round((w - textW(SMALL, l1)) / 2), y + 3, own ? '#ffffff' : '#17151a');
  if (own) ctxText(ctx, SMALL, l2, x0 + Math.round((w - textW(SMALL, l2)) / 2), y + 9, '#ffffff');
  else { const lw = textW(SMALL, l2) + 7, lx = x0 + Math.round((w - lw) / 2); ctxText(ctx, SMALL, l2, lx, y + 9, '#6d4a10'); starPx(lx + textW(SMALL, l2) + 2, y + 9, '#c98a10'); }
}
function chalkBoard(t) {
  const ch = (s, x, y, k = 1, col = '#e8ece4') => ctxText(ctx, SMALL, s, x, y, col, k);
  const bx = BOARD.x0, by = BOARD.y0, q = D.q;
  const ten = (x, y, n) => { for (let i = 0; i < 10; i++) { const cx = x + (i % 5) * 8, cy = y + Math.floor(i / 5) * 8; fill(cx, cy, 9, 1, '#e8ece4'); fill(cx, cy + 8, 9, 1, '#e8ece4'); fill(cx, cy, 1, 9, '#e8ece4'); fill(cx + 8, cy, 1, 9, '#e8ece4'); if (i < n) { fill(cx + 3, cy + 2, 3, 5, '#f8e878'); fill(cx + 2, cy + 3, 5, 3, '#f8e878'); } } };
  if (D.rast) { ch('RAST!', bx + 8, by + 7, 2); ch('STJÄRNBUTIKEN ÄR ÖPPEN', bx + 8, by + 24, 1, '#f8e878'); ch(`BRA JOBBAT ${KLASS}!`, bx + 8, by + 32); return; }
  if (!P.seated || !q) { ch('7 + 3 = ?', bx + 8, by + 6, 2); ch(`HEJ KLASS ${KLASS}!`, bx + 8, by + 24); ch('MÅNDAG', bx + 8, by + 32, 1, '#a8d8f0'); ten(bx + 96, by + 6, 7); if (reduce || Math.floor(t * 1.6) % 2 === 0) fill(bx + 8 + textW(SMALL, '7 + 3 = ?', 2) + 3, by + 6, 2, 10, '#e8ece4'); return; }
  ch(q.topic, bx + 5, by + 4, 1, '#a8d8f0');
  if (D.tab === 'matte') { const pr = (D.solved ? q.prompt.replace('?', String(q.ans)) : q.prompt).replace(/−/g, '-').replace(/·/g, '×'); const tf = q.visual && q.visual.frame !== undefined; ch(pr, bx + 8, by + 16, textW(SMALL, pr, 2) <= (tf ? 84 : 128) ? 2 : 1); if (tf) ten(bx + 96, by + 14, q.visual.frame); }
  else if (D.tab === 'klocka') {
    ch('VAD ÄR KLOCKAN?', bx + 5, by + 16); if (D.solved) ch(q.ans, bx + 5, by + 30, 1, '#f8e878');
    const cx = bx + 112, cy = by + 21, [h, m] = q.visual.clock;
    for (let a = 0; a < 360; a += 3) { const r = a * Math.PI / 180; fill(Math.round(cx + Math.cos(r) * 15), Math.round(cy + Math.sin(r) * 15), 1, 1, '#e8ece4'); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; for (let r = (i % 3 ? 13 : 11); r <= 13; r++) fill(Math.round(cx + Math.sin(a) * r), Math.round(cy - Math.cos(a) * r), 1, 1, '#e8ece4'); }
    const hand = (a, len, thick, col) => { for (let s = 0; s <= len; s += 0.5) { const x = Math.round(cx + Math.sin(a) * s), y = Math.round(cy - Math.cos(a) * s); fill(x, y, thick ? 2 : 1, 1, col); } };
    hand(((h % 12) + m / 60) / 12 * Math.PI * 2, 7, true, '#f0c8c8'); hand(m / 60 * Math.PI * 2, 11, false, '#e8ece4');
  } else { ch(q.visual.word, bx + 8, by + 15, 2); ch(D.solved ? CLS[q.ans].label : 'VILKEN ORDKLASS?', bx + 8, by + 32, 1, D.solved ? '#f8e878' : '#e8ece4'); }
  if (D.solved) ch('RÄTT!', BOARD.x1 - 5 - textW(SMALL, 'RÄTT!'), by + 4, 1, '#8fe0a2');
}
function drawArrow(t) {
  const bob = reduce ? 0 : (Math.sin(t * 4) > 0 ? 0 : 1), x = SEAT.x, ly = ROWS[SEAT.r] - 46 + bob, w = textW(SMALL, 'LEDIG') + 6;
  fill(x - (w >> 1), ly, w, 9, '#17151a'); ctxText(ctx, SMALL, 'LEDIG', x - (w >> 1) + 3, ly + 2, '#ffd23f');
  const ay = ly + 11; [[-1, 3], [-1, 3], [-3, 7], [-2, 5], [-1, 3], [0, 1]].forEach(([dx, w2], i) => { fill(x + dx - 1, ay + i, w2 + 2, 1, '#5a3a08'); });
  [[-1, 3], [-1, 3], [-3, 7], [-2, 5], [-1, 3], [0, 1]].forEach(([dx, w2], i) => fill(x + dx, ay + i, w2, 1, i < 2 ? '#ffe27a' : '#ffd23f'));
}
// ---------- närbilden: tavlan i stort ----------
const CHALK = { ...BIG, '×': { rows: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'], up: [], w: 5 } };
const CW = '#e8ece4', CBL = '#a8d8f0', CY = '#f8e878', CG = '#8fe0a2';
let cuVis = 124, pillB = 15;
function measureVis(reset) {   // lektionsrutans överkant i bildens pixlar (rutan under bilden ⇒ hela höjden)
  if (panel.hidden) return;
  const pr = panel.getBoundingClientRect(), cr = cv.getBoundingClientRect(); if (!cr.height) return;
  pillB = Math.ceil(($('sk-pill').getBoundingClientRect().bottom - cr.top) / cr.height * H);   // skylten uppe till vänster
  const v = pr.top >= cr.bottom - 2 ? H : Math.max(96, Math.min(H, (Math.floor((pr.top - cr.top) / cr.height * H) - 2) & ~1));
  cuVis = reset ? v : Math.min(cuVis, v);   // under en lektion krymper tavlan bara, den hoppar inte fram och tillbaka
}
function disk(cx, cy, r, col) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) fill(x, y, 1, 1, col); }
function tenFrame(x, y, cs, n) {
  for (let i = 0; i < 10; i++) {
    const cx = x + (i % 5) * cs, cy = y + Math.floor(i / 5) * cs;
    fill(cx, cy, cs + 1, 1, CW); fill(cx, cy + cs, cs + 1, 1, CW); fill(cx, cy, 1, cs + 1, CW); fill(cx + cs, cy, 1, cs + 1, CW);
    if (i < n) disk(cx + (cs + 1) / 2, cy + (cs + 1) / 2, cs * 0.3, CY);
  }
}
function clockFace(cx, cy, R, [h, m]) {
  for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) { const d = Math.hypot(x, y); if (d <= R + 0.5 && d > R - 1.5) fill(cx + x, cy + y, 1, 1, CW); }
  const at = (a, r) => [Math.round(cx + Math.sin(a) * r), Math.round(cy - Math.cos(a) * r)];
  if (R >= 28) for (let i = 0; i < 60; i++) if (i % 5) { const [x, y] = at(i / 60 * Math.PI * 2, R - 3); fill(x, y, 1, 1, '#9fb2a6'); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; for (let r = R - (i % 3 ? 5 : 7); r <= R - 2; r++) { const [x, y] = at(a, r); fill(x, y, 1, 1, CW); } }
  const NF = R >= 48 ? CHALK : SMALL;   // stor tavla (mobilen): siffrorna i det stora typsnittet
  if (R >= 28) for (let i = 1; i <= 12; i++) { const s = String(i), [x, y] = at(i / 12 * Math.PI * 2, R - (NF === CHALK ? 16 : 13)); ctxText(ctx, NF, s, x - (textW(NF, s) >> 1), y - (NF.h >> 1), CBL); }
  const hand = (a, len, bs, col) => { for (let s = 0; s <= len; s += 0.5) { const x = cx + Math.sin(a) * s, y = cy - Math.cos(a) * s; fill(Math.round(x - (bs - 1) / 2), Math.round(y - (bs - 1) / 2), bs, bs, col); } };
  hand(m / 60 * Math.PI * 2, R - 8, 2, CW);                                   // långa visaren: vit
  hand(((h % 12) + m / 60) / 12 * Math.PI * 2, Math.round(R * 0.48), 3, CY);  // korta visaren: gul och tjock
  fill(cx - 2, cy - 2, 5, 5, '#f4f1ea'); fill(cx - 1, cy - 1, 3, 3, '#c9323a');
}
function chalkClose(b) {
  const q = D.q, bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const ch = (s, x, y, k = 1, col = CW) => ctxText(ctx, CHALK, s, x, y, col, k);
  const k2 = (s, maxW) => (textW(CHALK, s, 2) <= maxW ? 2 : 1);
  const ty = Math.max(b.y0 + 7, pillB + 4);   // första raden under skylten uppe till vänster
  if (D.rast || !q) { ch('RAST!', b.x0 + 12, ty + 4, 2); ch('STJÄRNBUTIKEN ÄR ÖPPEN', b.x0 + 12, ty + 26, 1, CY); ch(`BRA JOBBAT ${KLASS}!`, b.x0 + 12, ty + 38); return; }
  ch(q.topic, b.x0 + 9, ty, 1, CBL);
  if (D.solved) ch('RÄTT!', b.x1 - 9 - textW(CHALK, 'RÄTT!'), b.y0 + 7, 1, CG);
  const top = ty + 15, bot = b.y1 - 6, mid = (top + bot) >> 1;
  if (D.tab === 'matte') {
    const pr = (D.solved ? q.prompt.replace('?', String(q.ans)) : q.prompt).replace(/−/g, '-').replace(/·/g, '×');
    const tf = q.visual && q.visual.frame !== undefined, cs = Math.max(9, Math.min(18, Math.floor((bot - top - 4) / 2.4)));
    const fw = tf ? cs * 5 + 1 : 0, k = k2(pr, bw - 24 - (tf ? fw + 20 : 0));
    ch(pr, b.x0 + 12, mid - ((7 * k) >> 1), k, D.solved ? CY : CW);
    if (tf) tenFrame(b.x1 - 12 - fw, mid - cs, cs, q.visual.frame);
  } else if (D.tab === 'klocka') {
    const R = Math.max(20, Math.min(60, Math.floor((bh - 10) / 2))), cx = b.x1 - 16 - R, cy = b.y0 + (bh >> 1), tw = cx - R - 16 - (b.x0 + 12);
    const qs = 'VAD ÄR KLOCKAN?', k = k2(qs, tw);
    ch(qs, b.x0 + 12, top + 2, k);
    if (D.solved) { const a = q.ans.toUpperCase(); ch(a, b.x0 + 12, top + 2 + 7 * k + 9, k2(a, tw), CY); }
    clockFace(cx, cy, R, q.visual.clock);
  } else {
    const w = q.visual.word, k = k2(w, bw - 24);
    ch(w, b.x0 + 12, top + 2, k);
    ch(D.solved ? CLS[q.ans].label : 'VILKEN ORDKLASS?', b.x0 + 12, top + 2 + 7 * k + 9, 1, D.solved ? CY : CW);
  }
}
// pratbubblorna i remsan under tavlan, i samma ordning som klassen sitter (fröken till höger)
const cuAnchor = (key) => (key === 't' ? W - 46 : key[0] === 'k' ? 56 + (KIDSEATS[+key.slice(1)][1] - 92) * 1.5 : W >> 1);
function closeBubbles(vis) {
  const items = BUBS.map((b) => ({ b, ax: cuAnchor(b.key), ...bubbleSize(b.str) })).sort((a, c) => a.ax - c.ax);
  // bredvid varandra: skjut åt höger vid krock, sedan tillbaka från högerkanten; bara om de inte får plats på en rad läggs en ovanför
  items.forEach((it) => { it.bx = Math.max(2, Math.min(W - it.w - 2, Math.round(it.ax - it.w / 2))); it.base = vis - 1; });
  for (let i = 1; i < items.length; i++) items[i].bx = Math.max(items[i].bx, items[i - 1].bx + items[i - 1].w + 3);
  for (let i = items.length - 1; i >= 0; i--) items[i].bx = Math.min(items[i].bx, i === items.length - 1 ? W - 2 - items[i].w : items[i + 1].bx - 3 - items[i].w);
  if (items.length && items[0].bx < 2) { const up = items.reduce((a, c) => (c.w > a.w ? c : a)); up.base -= Math.max(...items.map((c) => c.h)) + 6; up.bx = Math.max(2, Math.min(W - up.w - 2, Math.round(up.ax - up.w / 2))); const rest = items.filter((c) => c !== up); let x = Math.max(2, Math.round((W - rest.reduce((a, c) => a + c.w + 3, -3)) / 2)); for (const c of rest) { c.bx = x; x += c.w + 3; } }
  for (const it of items) sayBubble(ctx, Math.max(it.bx + 2, Math.min(it.bx + it.w - 3, it.ax)), it.base, it.b.str, it.bx);
}
function draw(now) {
  const t = now / 1000, sc = P.scene;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (sc === 'klass' && P.seated) {
    ctx.drawImage(closeBG(cuVis), 0, 0); chalkClose(cuBoard(cuVis));
    BUBS = BUBS.filter((b) => b.until > now); closeBubbles(cuVis);
    const ft = now - fadeT; if (!reduce && ft < 320) fill(0, 0, W, H, `rgba(10,8,16,${1 - ft / 320})`);
    return;
  }
  ctx.drawImage(BG[sc], 0, 0);
  if (sc === 'klass') {
    chalkBoard(t);
    if (doorGlow && (reduce || Math.floor(t * 2.5) % 2 === 0)) { fill(DOOR.x0 - 1, DOOR.y0 - 1, 31, 1, '#ffd23f'); fill(DOOR.x0 - 1, DOOR.y0 - 1, 1, WALL_Y - DOOR.y0 + 1, '#ffd23f'); fill(DOOR.x1 + 1, DOOR.y0 - 1, 1, WALL_Y - DOOR.y0 + 1, '#ffd23f'); }
  }
  const list = [];
  if (sc === 'klass') {
    list.push(...STATIC_K);
    KIDSEATS.forEach(([r, x], i) => list.push({ fy: ROWS[r] - 1, draw: (c) => drawPerson(c, x, ROWS[r] - 1, CLASS[i].look, 'up', Math.floor(t * 0.7 + i * 1.7) % 9 === 0 ? 6 : 5) }));
    list.push({ fy: TEACH.y, draw: (c) => drawPerson(c, TEACH.x, TEACH.y, TEACHER.look, 'down', Math.sin(t * 1.3) > 0.92 ? 4 : 0) });
    if (P.seated) list.push({ fy: ROWS[SEAT.r] - 1, draw: (c) => drawPerson(c, SEAT.x, ROWS[SEAT.r] - 1, myLook(), 'up', 5) });
  } else if (sc === 'butik') list.push(...STATIC_B);
  else for (const p of PLACED) { const k = ITEMS[p.id].k; list.push({ fy: p.y, draw: (c) => { furnShadow(c, k, p.x, p.y); blit(c, k, p.x, p.y); } }); }
  const walking = P.path.length > 0;
  if (!(sc === 'klass' && P.seated) && ME) list.push({ fy: P.y + 0.01, draw: (c) => drawPerson(c, P.x, P.y, myLook(), P.dir, walking ? WALK_SEQ[Math.floor(P.dist / 7.3) % 4] : (Math.sin(t * 2) > 0.9 ? 4 : 0)) });
  list.sort((a, b) => a.fy - b.fy);
  for (const d of list) d.draw(ctx, t);
  if (sc === 'klass' && !P.seated && !D.rast && ME) drawArrow(t);
  if (sc === 'butik') for (const id in SHOP) { const [x, y] = SHOP[id].at; if (ITEMS[id].kind === 'klader') dollTag(x, y + 3, id); else dollTag(x + Math.round(fr(ITEMS[id].k)[2] / 2), y + 3, id); }
  if (sc === 'hem' && placing && mouse) { const k = ITEMS[placing].k, f = fr(k), x = Math.round(mouse[0] - f[2] / 2), y = Math.round(mouse[1]); ctx.globalAlpha = canPlace(placing, x, y) ? 0.65 : 0.25; blit(ctx, k, x, y); ctx.globalAlpha = 1; }
  if (ME) { if (sc === 'klass' && P.seated) nameTag(ctx, SEAT.x, ROWS[SEAT.r] - 38, { ...ME, name: firstName(ME) }); else nameTag(ctx, P.x, P.y - 40, { ...ME, name: firstName(ME) }); }
  if (hover && hover.t === 'kid') { const a = kidAt(hover.i); nameTag(ctx, a.x, a.y - 2, CLASS[hover.i]); }
  if (hover && hover.t === 'teacher') nameTag(ctx, TEACH.x, TEACH.y - 50, TEACHER);
  BUBS = BUBS.filter((b) => b.until > now);
  for (const b of BUBS) { const at = typeof b.at === 'function' ? b.at() : b.at; sayBubble(ctx, at.x, at.y, b.str); }
  const ft = now - fadeT; if (!reduce && ft < 320) fill(0, 0, W, H, `rgba(10,8,16,${1 - ft / 320})`);
}
function fit() {
  const dpr = window.devicePixelRatio || 1, avail = frame.clientWidth - 16, s = Math.floor(avail * dpr / W);
  if (s >= 1 && W * s / dpr < avail * 0.9) {   // hela steg skulle lämna mycket tomt (t.ex. iPhone stående): rita ett steg skarpare och fyll bredden
    scale = s + 1; cv.width = W * scale; cv.height = H * scale; cv.style.width = avail + 'px'; cv.style.height = (avail * H / W) + 'px'; stage.style.width = avail + 'px';
  } else if (s >= 1) { scale = s; cv.width = W * s; cv.height = H * s; const cw = W * s / dpr; cv.style.width = cw + 'px'; cv.style.height = (H * s / dpr) + 'px'; stage.style.width = cw + 'px'; }
  else { scale = 1; cv.width = W; cv.height = H; cv.style.width = '100%'; cv.style.height = 'auto'; stage.style.width = '100%'; }
  requestAnimationFrame(() => measureVis(true));
}

// ================= lektionen: rutan i spelbilden =================
const panel = $('skolpanel');
const TABS = [['matte', 'Matte'], ['klocka', 'Klockan'], ['svenska', 'Svenska']];
const TABNAME = { matte: 'MATTE', klocka: 'KLOCKAN', svenska: 'SVENSKA' };
let LES = { results: [] };
function lessonPanel() {
  const q = D.q, n = LES.results.length;
  const dots = [0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? LES.results[i] : i === n ? 'cur' : ''}"></i>`).join('');
  panel.innerHTML = `<div class="dlg-head"><h2>${esc(TABS.find((x) => x[0] === D.tab)[1])} · nivå ${D.lvl[D.tab]}</h2><span class="sp-dots" aria-label="Uppgift ${Math.min(n + 1, 5)} av 5">${dots}</span></div>
    <div class="dlg-body">
      <div class="sp-row">${TABS.map(([k, l]) => `<button type="button" class="btn btn-small${D.tab === k ? ' btn-gold' : ''}" data-tab="${k}">${l}</button>`).join('')}<span class="sp-topic">${esc(q.topic)}</span><span class="sp-spacer"></span>${'speechSynthesis' in window ? '<button type="button" class="btn btn-small" data-sp="say">Läs upp</button>' : ''}<button type="button" class="btn btn-small" data-sp="stand">Res dig</button></div>
      <div class="sp-row sp-answers">${q.opts.map((o, i) => `<button type="button" class="btn" data-ans="${i}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>
      <p class="sp-fb" aria-live="polite"></p>
    </div>`;
  panel.hidden = false; measureVis();
}
function feedback(lead, rest, kind) { const f = panel.querySelector('.sp-fb'); if (f) f.innerHTML = `<b class="${kind}">${esc(lead)}</b> ${esc(rest)}`; }
panel.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.tab) { D.tab = b.dataset.tab; D.streak = 0; D.miss = 0; newQ(); teacherSay(`NU TAR VI ${TABNAME[D.tab]}!`); }
  else if (b.dataset.ans !== undefined) answer(b, D.q.opts[+b.dataset.ans].value);
  else if (b.dataset.sp === 'say') speak(D.q.say);
  else if (b.dataset.sp === 'stand') { standUp(); teacherSay('VI SES SNART, {P}!'); }
});
function goSit() { if (P.scene !== 'klass' || P.seated || !ME) return; walkTo(SEAT.ax, SEAT.ay, () => { if (near(SEAT.ax, SEAT.ay)) sitDown(); }); }
function sitDown() { P.seated = true; P.path = []; D.rast = false; doorGlow = LESSONS > 0; LES = { results: [] }; fadeT = performance.now(); newQ(); measureVis(true); teacherSay(`HEJ {P}! VI BÖRJAR MED ${TABNAME[D.tab]}.`); renderBelow(); }
function standUp() { if (!P.seated) return; P.seated = false; P.x = SEAT.ax; P.y = SEAT.ay; P.dir = 'down'; panel.hidden = true; fadeT = performance.now(); renderBelow(); }
function newQ() {
  let q, n = 0;
  do { q = GEN[D.tab](D.lvl[D.tab]); n++; } while ((q.prompt + JSON.stringify(q.visual || {})) === D.last && n < 8);
  D.last = q.prompt + JSON.stringify(q.visual || {}); D.q = q; D.tried = false; D.solved = false; D.locked = false;
  if (P.seated) lessonPanel();
}
function answer(btn, val) {
  if (D.locked) return;
  if (val === D.q.ans) {
    D.locked = true; D.solved = true; btn.classList.add('btn-go');
    let line = pick(['RÄTT!', 'BRA JOBBAT!', 'SNYGGT!', 'PRECIS!']), extra = '';
    LES.results.push(D.tried ? 'ok' : 'star');
    if (!D.tried) D.streak++; else D.streak = 0;
    D.miss = 0;
    if (D.streak >= 3 && D.lvl[D.tab] < 3) { D.lvl[D.tab]++; D.streak = 0; extra = ' Nivå upp!'; line = 'NIVÅ UPP! NU BLIR DET SVÅRARE.'; }
    feedback(D.tried ? 'Rätt nu!' : 'Rätt på första försöket!', D.q.done + extra, 'ok'); teacherSay(line);
    const dots = panel.querySelectorAll('.sp-dots i'), n = LES.results.length; if (dots[n - 1]) dots[n - 1].className = LES.results[n - 1];
    if (Math.random() < 0.35) setTimeout(() => kidSay(rnd(0, 2), pick(CHEER)), 500);
    setTimeout(() => { if (!P.seated) return; if (LES.results.length >= 5) endLesson(); else newQ(); }, 1800);
  } else {
    btn.classList.add('btn-red'); btn.disabled = true; D.tried = true; D.streak = 0; D.miss++;
    let line = 'NÄSTAN! LÄS LEDTRÅDEN.', extra = '';
    if (D.miss >= 2 && D.lvl[D.tab] > 1) { D.lvl[D.tab]--; D.miss = 0; extra = ' Nästa uppgift blir lite lättare.'; line = 'VI TAR DET LITE LÄTTARE EN STUND.'; }
    feedback('Inte riktigt.', D.q.hint + extra, 'no'); teacherSay(line);
  }
}
const starIco = '<span class="sk-star" aria-label="stjärnor"></span>';
function endLesson() {
  const firstTry = LES.results.filter((r) => r === 'star').length, earned = 1 + (firstTry >= 3 ? 1 : 0) + (firstTry === 5 ? 1 : 0);
  STARS += earned; KR += 10; LESSONS++; D.rast = true; doorGlow = true; save(); updatePill();
  panel.hidden = true;
  teacherSay(`RAST! DU FICK ${earned} ${earned > 1 ? 'STJÄRNOR' : 'STJÄRNA'}, {P}.`);
  setTimeout(() => kidSay(rnd(0, 2), pick(RAST_LINES)), 1200);
  openModal('🔔 Rast!', `<div class="who"><div class="sk-face"></div><div><p class="sk-big">${firstTry} av 5 rätt på första försöket.</p><p>Du fick <b>${earned} ${starIco}</b> och <b>10 kr</b> i veckopeng på fredag.</p><p class="sp">Stjärnbutiken ligger bakom den blå dörren bredvid ${esc(TEACHER.name)}.</p></div></div>`, [
    { label: 'En lektion till', onClick: () => { closeModal(); D.rast = false; LES = { results: [] }; newQ(); teacherSay('EN LEKTION TILL? VAD BRA, {P}!'); } },
    { label: 'Gå till stjärnbutiken', cls: 'btn-go', onClick: () => { closeModal(); standUp(); goShop(); } },
  ]);
  const face = document.querySelector('#modal .sk-face'); if (face) face.append(portrait(myLook(), '#d8cdb8'));
}

// ================= butiken, garderoben och möblerna =================
function goShop() { if (P.scene !== 'klass') return goScene('butik', P.scene); walkTo(DOOR.ax, DOOR.ay, () => { if (near(DOOR.ax, DOOR.ay)) goScene('butik', 'klass'); }); }
function itemDialog(id) {
  const it = ITEMS[id], own = !!OWN[id], wear = !!WEAR[id], short = it.price - STARS;
  const preview = it.kind === 'klader' ? 'try' : 'furn';
  let txt, btns = [];
  if (own && it.kind === 'klader') { txt = wear ? 'Du har den på dig.' : 'Den hänger i garderoben.'; btns = [{ label: 'Stäng', onClick: closeModal }, { label: wear ? 'Ta av' : 'Ta på', cls: 'btn-go', onClick: () => { WEAR[id] = !wear; lookChanged(); save(); itemDialog(id); meSay(WEAR[id] ? 'SNYGGT!' : 'AV MED DEN.'); } }]; }
  else if (own) { txt = 'Du har den redan. Den finns hemma.'; btns = [{ label: 'Stäng', onClick: closeModal }]; }
  else if (short <= 0) { txt = esc(it.desc); btns = [{ label: 'Inte nu', onClick: closeModal }, { label: `Köp för ${it.price} ★`, cls: 'btn-go', onClick: () => buy(id) }]; }
  else { txt = `${esc(it.desc)}<br><span class="sp">Du har ${STARS} ★ och behöver ${short} till. Gör en lektion till i klassrummet.</span>`; btns = [{ label: 'Okej', onClick: closeModal }]; }
  openModal(`${it.kind === 'klader' ? '👕' : '🛋️'} ${esc(it.name)}`, `<div class="who"><div class="sk-face"></div><div><p class="sk-big">${it.price} ★</p><p>${txt}</p></div></div>`, btns);
  const face = document.querySelector('#modal .sk-face');
  if (face) { if (preview === 'try') face.append(portrait(cleanLook({ ...myLook(), ...it.look }), '#d8cdb8')); else { const c = furnCanvas(it.k); c.className = 'sk-furn'; face.append(c); } }
}
function buy(id) {
  const it = ITEMS[id]; if (OWN[id] || STARS < it.price) return;
  STARS -= it.price; OWN[id] = true;
  if (it.kind === 'klader') { WEAR[id] = true; lookChanged(); clerkSay('TACK! DEN SITTER SNYGGT PÅ DIG, {P}.'); } else clerkSay('TACK! DEN SKICKAS HEM TILL DIG.');
  save(); updatePill(); itemDialog(id);
}
function wardrobeDialog() {
  const clothes = Object.keys(ITEMS).filter((k) => ITEMS[k].kind === 'klader' && OWN[k]);
  const body = clothes.length ? `<p>Tryck på ett plagg för att ta på eller av det.</p><div class="sk-list">${clothes.map((k) => `<button type="button" class="btn${WEAR[k] ? ' btn-go' : ''}" data-wear="${k}">${esc(ITEMS[k].name)}: ${WEAR[k] ? 'på' : 'av'}</button>`).join('')}</div>` : '<p>Tom än så länge. Kläder från stjärnbutiken hamnar här.</p>';
  const dlg = openModal('👕 Garderoben', `<div class="who"><div class="sk-face"></div><div>${body}</div></div>`, [
    { label: 'Ändra figuren', onClick: () => editPlayer(() => wardrobeDialog()) },
    { label: 'Stäng', cls: 'btn-go', onClick: closeModal },
  ]);
  dlg.querySelector('.sk-face')?.append(portrait(myLook(), '#d8cdb8'));
  dlg.querySelectorAll('[data-wear]').forEach((b) => (b.onclick = () => { const k = b.dataset.wear; WEAR[k] = !WEAR[k]; lookChanged(); save(); wardrobeDialog(); }));
}
const homePanel = $('decor-panel');
function homeStore() {
  if (P.scene !== 'hem') { homePanel.hidden = true; return; }
  const store = Object.keys(ITEMS).filter((k) => ITEMS[k].kind === 'mobel' && OWN[k] && !PLACED.some((p) => p.id === k));
  homePanel.innerHTML = `<div class="dp-head">Förrådet</div><div id="decor-storage">${store.length ? store.map((k) => `<button type="button" class="dp-item${placing === k ? ' on' : ''}" data-place="${k}"><span class="sk-ico" data-ico="${k}"></span><span>${esc(ITEMS[k].name)}<small>${placing === k ? 'klicka på golvet' : 'ställ ut'}</small></span></button>`).join('') : '<div class="dp-empty">Tomt. Möbler från stjärnbutiken hamnar här.</div>'}</div>${PLACED.length ? '<div class="dp-foot"><small>Klicka på en möbel i rummet för att flytta den.</small></div>' : ''}`;
  homePanel.querySelectorAll('[data-ico]').forEach((s) => { const c = furnCanvas(ITEMS[s.dataset.ico].k); s.append(c); });
  homePanel.querySelectorAll('[data-place]').forEach((b) => (b.onclick = () => { placing = placing === b.dataset.place ? null : b.dataset.place; homeStore(); }));
  homePanel.hidden = false;
}
function canPlace(id, x, y) {
  const r = FP(id, x, y);
  if (r[0] < 6 || r[2] > 378 || y < 112 || y > 206) return false;
  const others = [[18, 98, 40, 135], [38, 92, 58, 110], [328, 90, 356, 102], [360, 92, 378, 106], [20, 196, 56, 215], ...PLACED.map((p) => FP(p.id, p.x, p.y)), [P.x - 5, P.y - 3, P.x + 5, P.y + 1]];
  return !others.some((b) => r[0] <= b[2] && r[2] >= b[0] && r[1] <= b[3] && r[3] >= b[1]);
}

// ================= scenbyten =================
function goScene(name, from) {
  P.scene = name; P.path = []; P.seated = false; placing = null; BUBS = []; hover = null; panel.hidden = true;
  if (name === 'butik') { [P.x, P.y] = from === 'hem' ? [342, 200] : [44, 200]; P.dir = 'up'; }
  else if (name === 'hem') { [P.x, P.y] = [40, 200]; P.dir = 'up'; }
  else { [P.x, P.y] = from ? [DOOR.ax, 128] : [220, 210]; P.dir = from ? 'down' : 'up'; }
  buildGrid(); fadeT = performance.now();
  if (name === 'klass' && from) setTimeout(() => { if (P.scene === 'klass') kidSay(rnd(0, 6), 'VÄLKOMMEN TILLBAKA, {P}!'); }, 600);
  if (name === 'butik') setTimeout(() => { if (P.scene === 'butik') clerkSay(`HEJ ${firstName(ME).toUpperCase()}! HÄR BETALAR DU MED STJÄRNOR.`); }, 400);
  homeStore(); updatePill(); renderBelow();
}
function updatePill() { $('sk-where').textContent = P.scene === 'klass' ? `${LABEL.klass} ${KLASS}` : LABEL[P.scene]; $('sk-stars').textContent = STARS; $('sk-kr').textContent = `${KR} kr på fredag`; }

// ================= klick i spelbilden =================
function hit(x, y) {
  const s = P.scene;
  if (s === 'klass' && P.seated) { const b = cuBoard(cuVis); return x >= b.x0 - 4 && x <= b.x1 + 4 && y >= b.y0 - 4 && y <= b.y1 + 8 ? { t: 'board' } : null; }
  if (s === 'klass') {
    if (!P.seated && x >= SEAT.x - 14 && x <= SEAT.x + 14 && y >= ROWS[SEAT.r] - 48 && y <= ROWS[SEAT.r]) return { t: 'seat' };
    if (x >= TEACH.x - 8 && x <= TEACH.x + 8 && y >= TEACH.y - 34 && y <= TEACH.y) return { t: 'teacher' };
    for (let i = 0; i < KIDSEATS.length; i++) { const [r, kx] = KIDSEATS[i], kf = ROWS[r]; if (x >= kx - 8 && x <= kx + 8 && y >= kf - 30 && y <= kf - 6) return { t: 'kid', i }; }
    if (x >= DOOR.x0 - 2 && x <= DOOR.x1 + 2 && y >= DOOR.y0 && y <= 121) return { t: 'door' };
    if (x >= BOARD.x0 - 4 && x <= BOARD.x1 + 4 && y >= BOARD.y0 - 4 && y <= BOARD.y1 + 8) return { t: 'board' };
    if (y >= 118) return { t: 'floor' };
  } else if (s === 'butik') {
    for (const id in SHOP) { const [ax, ay] = SHOP[id].at, it = ITEMS[id]; const f = it.kind === 'mobel' ? fr(it.k) : [0, 0, 16, 30]; const x0 = it.kind === 'mobel' ? ax : ax - 8; if (x >= x0 - 2 && x <= x0 + f[2] + 2 && y >= ay - f[3] - 2 && y <= ay + 18) return { t: 'item', id }; }
    if (x >= CLERK.x - 8 && x <= CLERK.x + 8 && y >= CLERK.y - 34 && y <= CLERK.y) return { t: 'clerk' };
    if (x >= 20 && x <= 70 && y >= 194) return { t: 'exit', to: 'klass', at: [44, 206] };
    if (x >= 318 && x <= 368 && y >= 194) return { t: 'exit', to: 'hem', at: [342, 206] };
    if (y >= 124) return { t: 'floor' };
  } else {
    if (x >= 18 && x <= 60 && y >= 194) return { t: 'exit', to: 'klass', at: [40, 206] };
    if (placing) return y >= 108 ? { t: 'put' } : null;
    for (const p of PLACED) { const f = fr(ITEMS[p.id].k); if (x >= p.x && x <= p.x + f[2] && y >= p.y - f[3] && y <= p.y + 1) return { t: 'pickup', p }; }
    if (x >= WARDROBE.x0 && x <= WARDROBE.x1 && y >= WARDROBE.y0 && y <= WARDROBE.y1 + 6) return { t: 'wardrobe' };
    if (y >= 108) return { t: 'floor' };
  }
  return null;
}
const toWorld = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
cv.addEventListener('mousemove', (e) => { const [x, y] = toWorld(e); mouse = [x, y]; const h = ME && !modalUp() ? hit(x, y) : null; hover = h && (h.t === 'kid' || h.t === 'teacher') ? h : null; cv.style.cursor = h ? 'pointer' : 'default'; });
cv.addEventListener('mouseleave', () => { mouse = null; hover = null; });
cv.addEventListener('click', (e) => {
  if (!ME || modalUp()) return;
  const [x, y] = toWorld(e), h = hit(x, y); if (!h) return;
  if (h.t === 'seat') goSit();
  else if (h.t === 'teacher') teacherSay(P.seated ? 'TITTA PÅ TAVLAN, {P}!' : D.rast ? 'DET ÄR RAST! BUTIKEN ÄR BAKOM DÖRREN.' : 'SÄTT DIG I DEN LEDIGA BÄNKEN SÅ BÖRJAR VI.');
  else if (h.t === 'kid') kidSay(h.i, pick(D.rast ? RAST_LINES : P.seated ? LESSON_LINES : FREE_LINES));
  else if (h.t === 'board') teacherSay(P.seated ? 'SVARA I RUTAN, {P}!' : 'UPPGIFTEN KOMMER NÄR DU SITTER.');
  else if (h.t === 'door') { if (P.seated) standUp(); goShop(); }
  else if (h.t === 'clerk') clerkSay(STARS ? `DU HAR ${STARS} ${STARS > 1 ? 'STJÄRNOR' : 'STJÄRNA'}. VAD VILL DU HA?` : 'GÖR EN LEKTION SÅ FÅR DU STJÄRNOR.');
  else if (h.t === 'item') { const [ax, ay] = SHOP[h.id].ap; walkTo(ax, ay, () => { if (near(ax, ay)) { P.dir = 'up'; itemDialog(h.id); } }); }
  else if (h.t === 'exit') { const [ax, ay] = h.at; walkTo(ax, ay, () => { if (near(ax, ay)) goScene(h.to, P.scene); }); }
  else if (h.t === 'wardrobe') walkTo(WARDROBE.ap[0], WARDROBE.ap[1], () => { if (near(WARDROBE.ap[0], WARDROBE.ap[1])) { P.dir = 'up'; wardrobeDialog(); } });
  else if (h.t === 'pickup') { PLACED = PLACED.filter((p) => p !== h.p); placing = h.p.id; buildGrid(); save(); homeStore(); }
  else if (h.t === 'put') { const f = fr(ITEMS[placing].k), px = Math.round(x - f[2] / 2), py = Math.round(y); if (canPlace(placing, px, py)) { PLACED.push({ id: placing, x: px, y: py }); meSay('DÄR BLEV DET FINT!'); placing = null; buildGrid(); save(); homeStore(); } else meSay('DEN FÅR INTE PLATS DÄR.'); }
  else if (h.t === 'floor') { if (P.seated) standUp(); walkTo(x, y); }
});

// ================= figur och klass =================
function editPlayer(after) {
  saveAvatar(ME);
  openAvatarEditor({ onDone: (av) => { ME = cleanAvatar(av); lookChanged(); save(); after?.(); }, onCancel: () => after?.() });
}
function editOther(av, done) {
  saveAvatar(av);
  openAvatarEditor({ onDone: (nav) => { if (ME) saveAvatar(ME); done(cleanAvatar(nav)); }, onCancel: () => { if (ME) saveAvatar(ME); done(null); } });
}
function startCreator() {
  saveAvatar(newAv('', kidLook()));
  openAvatarEditor({ onDone: (av) => { ME = cleanAvatar(av); lookChanged(); classDialog(); }, onCancel: () => { if (!ME) startCreator(); } });
}
function classDialog() {
  const card = (av, i, role) => `<div class="sk-kid"><div class="sk-por" data-por="${i}"></div><input type="text" maxlength="${role === 't' ? 16 : 12}" value="${esc(av.name)}" data-name="${i}" aria-label="${role === 't' ? 'Frökens namn' : `Klasskompis ${i + 1}`}" autocomplete="off" spellcheck="false"><div class="sk-btns"><button type="button" class="btn btn-small" data-edit="${i}">Ändra</button><button type="button" class="btn btn-small" data-rand="${i}">Slumpa</button></div></div>`;
  const dlg = openModal('🏫 Din klass', `<div class="sk-lbl">Vilken klass går du i?</div>
    <div class="sk-klass"><input type="text" maxlength="4" value="${esc(KLASS)}" data-klass aria-label="Din klass" autocomplete="off" spellcheck="false" autocapitalize="characters"><span class="sp">Till exempel 2B eller 3A. Det står på dörren och på tavlan, och siffran väljer hur svåra uppgifterna är från början.</span></div>
    <p class="sp">Döp fröken och klasskompisarna. Ändra öppnar samma figurskapare som för din egen figur.</p>
    <div class="sk-lbl">Fröken</div><div class="sk-class">${card(TEACHER, 't', 't')}</div>
    <div class="sk-lbl">Klasskompisar</div><div class="sk-class">${CLASS.map((k, i) => card(k, i, 'k')).join('')}</div>`, [
    { label: 'Ändra min figur', onClick: () => editPlayer(() => classDialog()) },
    { label: 'Börja skolan', cls: 'btn-go', onClick: () => startSchool() },
  ], { closable: false });
  dlg.classList.add('dlg-furn');
  const avOf = (i) => (i === 't' ? TEACHER : CLASS[+i]);
  dlg.querySelector('[data-klass]')?.addEventListener('input', (e) => setKlass(e.target.value));
  dlg.querySelectorAll('[data-por]').forEach((d) => d.append(portrait(avOf(d.dataset.por).look, '#d8cdb8')));
  dlg.querySelectorAll('[data-name]').forEach((inp) => inp.addEventListener('input', () => { const i = inp.dataset.name, v = inp.value.replace(/\s+/g, ' ').trim(); const av = avOf(i); av.name = v || (i === 't' ? 'Fröken' : `Kompis ${+i + 1}`); }));
  dlg.querySelectorAll('[data-rand]').forEach((b) => (b.onclick = () => { const i = b.dataset.rand; const av = avOf(i); av.look = i === 't' ? adultLook() : kidLook(); classDialog(); }));
  dlg.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => { const i = b.dataset.edit; editOther(avOf(i), (nav) => { if (nav) { if (i === 't') TEACHER = nav; else CLASS[+i] = nav; } classDialog(); }); }));
}
function startSchool() {
  const first = P.scene === 'klass' && !P.seated && P.x === 220 && P.y === 210;
  closeModal(); save(); lookChanged(); renderBelow();
  if (first) { goScene('klass', null); teacherSay(`VÄLKOMMEN TILL ${KLASS}, {P}! SÄTT DIG I DEN LEDIGA BÄNKEN.`); setTimeout(() => { if (P.scene === 'klass') kidSay(rnd(0, 2), 'HEJ {P}!'); }, 1500); nextChat = performance.now() + 5500; }
}

// ================= knapparna under bilden =================
function renderBelow() {
  const el = $('sk-below'), btn = (a, t, cls = '') => `<button type="button" class="btn btn-small ${cls}" data-b="${a}">${t}</button>`;
  let p, b = '';
  if (!ME) p = 'Börja med att göra din figur och din klass.';
  else if (P.scene === 'klass') { p = P.seated ? 'Du sitter i bänken och ser tavlan på nära håll. Svara i rutan. Efter fem uppgifter blir det rast, och Res dig tar dig tillbaka ut i klassrummet.' : 'Klicka på den lediga bänken för att börja. Efter fem uppgifter blir det rast och den blå dörren leder till stjärnbutiken.'; if (!P.seated) b += btn('sit', 'Gå och sätt dig', 'btn-go'); b += btn('shop', 'Till stjärnbutiken') + btn('class', 'Ändra figur och klass'); }
  else if (P.scene === 'butik') { p = 'Klicka på en vara för att titta närmare. Mattan till vänster går till klassrummet, mattan till höger går hem.'; b += btn('toclass', 'Till klassrummet') + btn('home', 'Gå hem'); }
  else { p = 'Klicka på klädskåpet för att byta kläder. Möblerna från butiken står i förrådet: välj en och klicka på golvet.'; b += btn('toclass', 'Till skolan'); }
  if (ME) b += btn('reset', 'Börja om');
  el.innerHTML = `<p>${p}</p><div class="sk-bbtns">${b}</div>`;
}
$('sk-below').addEventListener('click', (e) => {
  const b = e.target.closest('[data-b]'); if (!b) return;
  const a = b.dataset.b;
  if (a === 'sit') goSit();
  else if (a === 'shop') { if (P.seated) standUp(); goShop(); }
  else if (a === 'toclass') goScene('klass', P.scene);
  else if (a === 'home') goScene('hem', 'butik');
  else if (a === 'class') { if (P.seated) standUp(); classDialog(); }
  else if (a === 'reset') { try { localStorage.removeItem(SAVE_KEY); } catch { /* lagring avstängd */ } fresh(); doorGlow = false; goScene('klass', null); renderBelow(); startCreator(); }
});

// ================= uppgifterna =================
function numOpts(ans, spread) { const set = new Set([ans]); for (const v of shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + spread, ans - spread, ans + 10])) { if (set.size >= 4) break; if (v >= 0) set.add(v); } return shuffle([...set]).map((v) => ({ label: String(v), value: v })); }
function genMatte(l) {
  if (l === 1) { const a = rnd(1, 9); return { topic: 'TIOKOMPISAR', prompt: `${a} + ? = 10`, say: `${a} plus hur mycket blir tio?`, ans: 10 - a, opts: numOpts(10 - a, 3), visual: { frame: a }, hint: `Titta på tavlan: ${a} rutor är fyllda. Hur många är tomma?`, done: `${a} och ${10 - a} är tiokompisar.` }; }
  if (l === 2) {
    if (Math.random() < 0.5) { const a = rnd(6, 9), b = rnd(11 - a, 9), up = 10 - a; return { topic: 'PLUS ÖVER TIOTALET', prompt: `${a} + ${b} = ?`, say: `${a} plus ${b}`, ans: a + b, opts: numOpts(a + b, 2), hint: `Ta dig till tio först: ${a} + ${up} = 10. Sedan ${b - up} till.`, done: `${a} + ${up} = 10, och 10 + ${b - up} = ${a + b}.` }; }
    const a = rnd(11, 18), down = a - 10, b = rnd(down + 1, 9);
    return { topic: 'MINUS ÖVER TIOTALET', prompt: `${a} − ${b} = ?`, say: `${a} minus ${b}`, ans: a - b, opts: numOpts(a - b, 2), hint: `Gå ner till tio först: ${a} − ${down} = 10. Sedan ${b - down} till.`, done: `${a} − ${down} = 10, och 10 − ${b - down} = ${a - b}.` };
  }
  const t = pick([2, 5, 10]), n = rnd(2, 10), seq = Array.from({ length: Math.min(n, 3) }, (_, i) => t * (i + 1)).join(', ');
  return { topic: `${t}-TABELLEN`, prompt: `${n} · ${t} = ?`, say: `${n} gånger ${t}`, ans: n * t, opts: numOpts(n * t, t), hint: `Räkna ${t}-skutt: ${seq} … tills du har tagit ${n} skutt.`, done: `${n} skutt på ${t} blir ${n * t}.` };
}
const HW = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva'];
const hw = (h) => HW[((h % 12) + 12) % 12];
function phrase(h, m) { const c = hw(h), n = hw(h + 1); return { 0: `klockan ${c}`, 5: `fem över ${c}`, 10: `tio över ${c}`, 15: `kvart över ${c}`, 20: `tjugo över ${c}`, 25: `fem i halv ${n}`, 30: `halv ${n}`, 35: `fem över halv ${n}`, 40: `tjugo i ${n}`, 45: `kvart i ${n}`, 50: `tio i ${n}`, 55: `fem i ${n}` }[m]; }
function genKlocka(l) {
  const mins = l === 1 ? [0, 30] : l === 2 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const h = rnd(1, 12), m = pick(mins), right = phrase(h, m);
  const pairs = m === 0 ? [[h, 30], [h - 1, 30], [h + 1, 0]] : [[h - 1, m], [h, (60 - m) % 60], [h + 1, m], [h, (m + 30) % 60]];
  const wrong = []; for (const [a, b] of pairs) { const p = phrase(a, b); if (p !== right && !wrong.includes(p)) wrong.push(p); if (wrong.length === 2) break; }
  const am = h % 12, hint = m === 0 ? 'Den långa visaren pekar rakt upp på tolv. Då är det hel timme, och den korta visaren visar vilken.' : m === 30 ? `Halv betyder halvvägs till nästa timme. Den korta visaren står mellan ${hw(h)} och ${hw(h + 1)}.` : m === 15 ? 'Den långa visaren pekar på tre. Kvart över betyder en kvart efter hel timme.' : m === 45 ? 'Den långa visaren pekar på nio. Kvart i betyder en kvart kvar till nästa hela timme.' : 'Räkna femminuterssteg från tolvan med den långa visaren. Den korta visaren visar timmen.';
  return { topic: l === 1 ? 'HEL OCH HALV' : l === 2 ? 'KVART ÖVER OCH KVART I' : 'FEM MINUTER I TAGET', prompt: 'Vad är klockan?', say: 'Vad är klockan?', ans: right, opts: shuffle([right, ...wrong]).map((p) => ({ label: p, value: p })), visual: { clock: [h, m] }, hint, done: `Det är ${right}, alltså ${pad(am)}:${pad(m)} eller ${pad(am + 12)}:${pad(m)}.` };
}
const ETT = ['äpple', 'hus'];
const WORDS = {
  1: { N: ['hund', 'katt', 'boll', 'bok', 'hus', 'cykel', 'äpple', 'glass'], V: ['springer', 'hoppar', 'äter', 'sover', 'läser', 'simmar', 'dansar', 'sjunger'] },
  2: { N: ['hund', 'katt', 'boll', 'bok', 'hus', 'cykel', 'äpple', 'glass'], V: ['springer', 'hoppar', 'äter', 'sover', 'läser', 'simmar', 'dansar', 'sjunger'], A: ['glad', 'stor', 'liten', 'snabb', 'röd', 'mjuk', 'kall', 'rolig'] },
  3: { N: ['fotboll', 'skolgård', 'frukost', 'regnbåge', 'kompis'], V: ['tänker', 'cyklar', 'väntar', 'klättrar', 'skrattar'], A: ['försiktig', 'nyfiken', 'blöt', 'modig', 'trött'] },
};
const CLS = { N: { label: 'Substantiv', sub: 'en eller ett …' }, V: { label: 'Verb', sub: 'jag …' }, A: { label: 'Adjektiv', sub: 'hur något är' } };
function genSvenska(l) {
  const set = WORDS[l], keys = Object.keys(set), cls = pick(keys), w = pick(set[cls]);
  const done = cls === 'N' ? `”${ETT.includes(w) ? 'ett' : 'en'} ${w}” låter rätt, så det är ett substantiv.` : cls === 'V' ? `”Jag ${w}” låter rätt, så det är ett verb.` : `”En ${w} hund” låter rätt, så det är ett adjektiv.`;
  const hint = keys.length === 2 ? 'Testa båda: ”en …” och ”jag …”. Vilken låter rätt?' : 'Testa alla tre: ”en …”, ”jag …” och ”en … hund”. Vilken låter rätt?';
  return { topic: keys.length === 2 ? 'SUBSTANTIV ELLER VERB' : 'TRE ORDKLASSER', prompt: 'Vilken ordklass?', say: `${w}. Vilken ordklass är det?`, ans: cls, opts: keys.map((k) => ({ label: CLS[k].label, sub: CLS[k].sub, value: k })), visual: { word: w }, hint, done };
}
const GEN = { matte: genMatte, klocka: genKlocka, svenska: genSvenska };
function speak(s) { try { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(s); u.lang = 'sv-SE'; u.rate = 0.9; const v = speechSynthesis.getVoices().find((x) => /^sv/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch { /* uppläsning saknas */ } }

// ================= start =================
const hasSave = load();
if (KLASS !== '2B') { BG.klass = paintClass(); BG.butik = paintShop(); }
D.q = genMatte(D.lvl.matte);
fit(); buildGrid(); updatePill(); renderBelow();
if (hasSave) { saveAvatar(ME); nextChat = performance.now() + 2500; setTimeout(() => teacherSay('VÄLKOMMEN TILLBAKA, {P}!'), 600); }
else startCreator();
if (window.ResizeObserver) new ResizeObserver(fit).observe(frame); else window.addEventListener('resize', fit);
let last = performance.now();
const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); chatter(now); draw(now); requestAnimationFrame(loop); };
requestAnimationFrame(loop);
window.__ps = {
  state: () => ({ scene: P.scene, seated: P.seated, x: P.x, y: P.y, stars: STARS, own: OWN, wear: WEAR, placed: PLACED, me: ME && ME.name, kid: ME && ME.look.kid, ans: D.q && D.q.opts.findIndex((o) => o.value === D.q.ans), lesson: LES.results.length, panel: !panel.hidden, modal: modalUp(), bubbles: BUBS.map((b) => b.str) }),
  give: (n) => { STARS += n; updatePill(); }, goScene, walkTo,
};
