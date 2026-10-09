// Pixelskolan – spelbar skiss byggd på Snabbfilens egen motor: figurerna (people.js), pennan och
// typsnitten (floor-pix.js), figurskaparen (avatar.js), dialogerna (ui.js) och möbelatlasen
// (interior.png + frames.js). Pratbubblan och namnskylten är walkable.js-versionerna utan ljud.
// På rasten leder den blå dörren ut på STORGATAN med Snabbfilens riktiga butiker: klädaffären,
// skobutiken, Leksakslådan och Möbeljätten (scenerna och fasaderna ur spelet, pengarna i spelets
// Game-objekt). Lektionerna ger pengar i plånboken: 100 kr per stjärna.
import './iso.js';   // FÖRST: egen lagring, så att skolan aldrig skriver i Snabbfilens figur eller sparfil
import { drawPerson, makeLookRich, portrait } from './sf/js/core/people.js';
import { Pix, SMALL, BIG, ctxText, textW, text as pixText, mix, mul, hash, bayer, css } from './sf/js/core/floor-pix.js';
import { openModal, closeModal, esc, toast } from './sf/js/core/ui.js';
import { openAvatarEditor, saveAvatar, cleanLook, cleanAvatar, avatarTagColors, MARKER_COLORS, setAvatarWardrobe } from './sf/js/core/avatar.js';
import { FRAMES } from './sf/js/data/frames.js';
import { Game, fmt } from './sf/js/game.js';
import { LEVELS as UPP, setContext, numOpts } from './uppgifter.js';
import { LEVELS3 } from './uppgifter3.js';
import { toggleMute, isMuted } from './sf/js/core/sound.js';
import { musicTick } from './sf/js/core/music.js';
import { SLOTS, wornItem } from './sf/js/data/wardrobe.js';
import { makeView, drawView } from './utsikt.js';
import { UNITS, UNIT_H, makeUnit, drawUnitLive } from './smabutiker.js';

const W = 384, H = 216, WALL_Y = 92;
// i iOS-appen (Capacitor) finns ingen tillbakaknapp: länkar ut ur spelet visas inte där
const IN_APP = !!window.Capacitor?.isNativePlatform?.();
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
let ME = null, CLASS = [], TEACHER = null, STARS = 0, LESSONS = 0, PLACED = [], KLASS = '2B';
// Plånboken, garderoben, leksakerna och möbelförrådet är Snabbfilens eget Game-objekt (sparas under
// pixelskolan:snabbfilen_save1 tack vare iso.js). Kläderna i figurskaparen = det man köpt + basplaggen.
const G = Game.load();
const KR_PER_STJARNA = 100;
const ownedIds = () => G.ownedWardrobeIds();
const LVL0 = { matte: 1, ganger: 5, klocka: 1, svenska: 1, engelska: 1, no: 1 };
// grade = årskursen (2 eller 3, väljs i början): nivåerna och stjärnorna sparas per årskurs (matte / matte3 …).
// typed = svaret man skriver på tavlan, bad = det skrivna svaret var fel (visas rött tills man skriver igen).
const D = { tab: 'matte', grade: 3, tabell: 5, hist: {}, best: {}, lvl: { ...LVL0 }, streak: 0, miss: 0, q: null, tried: false, solved: false, locked: false, last: '', rast: false, typed: '', bad: false };
// klassens namn som man skriver in själv (2B, 3A …): versaler, siffror och bokstäver, högst fyra tecken
const cleanKlass = (v) => String(v || '').toUpperCase().replace(/[^0-9A-ZÅÄÖ]/g, '').slice(0, 4);
const gradeOf = (k) => { const m = /^\d/.exec(k); return m ? +m[0] : 0; };
function fresh() {
  ME = null; CLASS = DEF_NAMES.map((n) => newAv(n, kidLook())); TEACHER = newAv('Fröken Maja', TEACHER_LOOK()); KLASS = '3A'; D.grade = 3;
  STARS = 0; LESSONS = 0; PLACED = []; D.lvl = { ...LVL0 }; D.tabell = 5; D.hist = {}; D.best = {}; D.rast = false;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ME, CLASS, TEACHER, STARS, LESSONS, PLACED, KLASS, grade: D.grade, lvl: D.lvl, tabell: D.tabell, hist: D.hist, best: D.best })); } catch { /* lagring avstängd */ } G.save(); }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!s || !s.ME || !s.ME.name) return false;
    ME = cleanAvatar(s.ME); CLASS = (s.CLASS || []).map(cleanAvatar); TEACHER = cleanAvatar(s.TEACHER);
    if (CLASS.length !== 7) return false;
    ({ STARS = 0, LESSONS = 0, PLACED = [] } = s); D.lvl = { ...LVL0, ...(s.lvl || {}) }; D.best = s.best && typeof s.best === 'object' ? s.best : {}; D.tabell = Math.max(1, Math.min(10, s.tabell | 0 || 5)); D.hist = s.hist && typeof s.hist === 'object' ? s.hist : {}; KLASS = cleanKlass(s.KLASS) || '3A';
    D.grade = s.grade === 2 || s.grade === 3 ? s.grade : gradeOf(KLASS) && gradeOf(KLASS) <= 2 ? 2 : 3;
    PLACED = (Array.isArray(PLACED) ? PLACED : []).filter((p) => p && typeof p.k === 'string');   // (stjärnbutikens gamla möbler följer inte med)
    return true;
  } catch { return false; }
}
fresh();

// din figur: samma look-objekt så länge inget ändrats (drawPerson cachar spritarna per objekt)
const myLook = () => ME.look;
const lookChanged = () => {};

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

// ================= GALLERIA STJÄRNAN: Snabbfilens riktiga butiker på tre våningar =================
// Stjärnbutiken är en galleria (Carl 2026-10-06: "olika avdelningar … alla affärer i en affär … åka
// rulltrappa till olika våningar eller hiss"). Butiksfronterna är husen ur stadens karta (city/map.js)
// med sina riktiga fasader (city/buildings-*.js); fasadkoden ritar i husets egna stadskoordinater och
// bilden flyttas bara på plats (translate dx/dy). Rulltrapporna och hissen är Möbeljättens egna
// (scenes/ikea/art-transit.js): uppåt försvinner trappan genom bjälken, neråt ner i schaktet i golvet.
// Dörrarna leder in i spelets egna butiksscener (makeShopKlader/Skor/Leksaker/Ikea) – se SHOP.
const GBASE = 136;                                  // butiksfronternas fotlinje = golvets bakkant
const SLAB_Y = GBASE - 26;                          // bjälken (övervåningens golv) som rulltrappan uppåt försvinner i
const ESC = { up: 190, down: 560, run: 134 };       // rulltrapporna: påstigningen (x) och längden
const LIFT_X = 356;                                 // hissdörrens vänsterkant (samma schakt på alla våningar)
// Trapphuset (Carl 2026-10-07: "det kan vara affärer vägg i vägg men när det är trapphus stora fönster i
// bakgrunden så man inte måste gå så långt"): rulltrapporna och hissen står framför en glasvägg från golv
// till tak, butikerna ligger vägg i vägg på båda sidor och våningarna blev kortare. units = småbutikerna
// (smabutiker.js) mellan spelets riktiga.
const TRAP = { x0: 170, x1: 602 };
const FLOORS = [
  { n: 0, name: 'ENTRÉ', w: 840, shops: [], school: [14, 62], home: [780, 828], units: [{ id: 'blommor', x: 606, w: 76 }, { id: 'kiosk', x: 682, w: 84 }] },
  { n: 1, name: 'KLÄDER OCH SKOR', w: 812, shops: [{ id: 'klader', x: 10, label: 'KLÄDAFFÄREN' }, { id: 'skor', x: 606, label: 'SKOBUTIKEN' }], units: [{ id: 'foto', x: 140, w: 26 }, { id: 'godis', x: 702, w: 102 }] },
  { n: 2, name: 'LEKSAKER OCH MÖBLER', w: 840, shops: [{ id: 'leksaker', x: 14, label: 'LEKSAKSLÅDAN' }, { id: 'mobler', x: 606, label: 'MÖBELJÄTTEN' }], units: [{ id: 'bankomat', x: 130, w: 36 }] },
];
const TOPF = FLOORS.length - 1;
let FLOOR = 0;                                       // våningen man är på i gallerian
const FL = () => FLOORS[FLOOR];
const SHOPLABEL = Object.fromEntries(FLOORS.flatMap((f) => f.shops.map((h) => [h.id, h.label])));
const floorOfShop = (id) => FLOORS.findIndex((f) => f.shops.some((h) => h.id === id));
// Butikerna, fasaderna, rulltrapporna och möbelritningen laddas i bakgrunden när skolan har startat (~2,8 MB).
let SHOPLIB = null, SHOPLIB_P = null;
function loadShops() {
  return (SHOPLIB_P ||= Promise.all([
    import('./sf/js/city/map.js'), import('./sf/js/city/buildings-shops.js'), import('./sf/js/city/buildings-downtown.js'), import('./sf/js/city/buildings-leksaker.js'),
    import('./sf/js/scenes/shop-klader.js'), import('./sf/js/scenes/shop-skor.js'), import('./sf/js/scenes/shop-leksaker.js'), import('./sf/js/scenes/shop-ikea.js'),
    import('./sf/js/scenes/room.js'), import('./sf/js/game.js'), import('./sf/js/scenes/ikea/art-transit.js'), import('./sf/js/city/props.js'),
  ]).then(([map, bs, bd, bl, kl, sk, le, ik, room, game, tr, props]) => {
    const ART = { ...bs.BUILDING_ART, ...bl.BUILDING_ART, ...bd.BUILDING_ART };
    for (const f of FLOORS) {
      f.houses = f.shops.map((h) => {
        const b = map.ALL_BUILDINGS.find((x) => x.id === h.id), dx = h.x - b.x, dy = GBASE - map.baseOf(b);
        return { ...h, floor: f.n, b, art: ART[b.kind], dx, dy, w: b.w, door: { x: Math.round((b.door.x0 + b.door.x1) / 2) + dx }, open: 0, img: null };
      });
      f.upE = f.n < TOPF ? { lx: ESC.up, ly: GBASE + 30, sx: 1, sy: -1, run: ESC.run, clip: SLAB_Y, riders: [] } : null;
      const dly = GBASE + 42;
      f.dnE = f.n > 0 ? { lx: ESC.down, ly: dly, sx: -1, sy: 1, run: ESC.run, clip: dly + 14, pit: [ESC.down - 140, ESC.down - 8, dly - 16, dly + 14], riders: [] } : null;
      f.lift = { x: LIFT_X, fy: GBASE, open: 0 };
    }
    SHOPLIB = { artPos: map.artPos, baseOf: map.baseOf, allB: map.ALL_BUILDINGS, propsMod: props, room, katalogOf: game.katalogOf, tr,
      make: { klader: kl.makeShopKlader, skor: sk.makeShopSkor, leksaker: le.makeShopLeksaker, mobler: ik.makeShopIkea } };
    buildGrid();
    return SHOPLIB;
  }).catch((e) => { console.error('gallerian kunde inte laddas:', e); SHOPLIB_P = null; throw e; }));
}
const STREET_ENV = { dark: 0, day: 1, people: [], weather: { season: 'sommar' } };
function houseImg(h) {
  if (!h.img) { try { h.img = h.art.paint(h.b, false, { worn: 0, snow: false, season: 'sommar' }); } catch (e) { console.error(`fasaden ${h.id}:`, e); h.img = null; h.art = null; } }
  return h.img;
}
// gallerians våning: tak med spotlights, ljus vägg, trapphusets glasvägg från golv till tak (glaset är
// genomskinligt – utsikten ritas bakom väggen, se drawView) och blankt stengolv med solkatter
const GAL_BG = {};
function galleriaBG(f) {
  if (GAL_BG[f.n]) return GAL_BG[f.n];
  const T = SHOPLIB.tr, Wf = f.w, P = new Pix(Wf, H), G0 = GL;
  for (let y = 0; y < GBASE; y++) for (let x = 0; x < Wf; x++) {
    let c = jit(0xf2ece0, x >> 2, y >> 3, 81, 0.015);
    if (y < 7) c = y === 6 ? 0x8a8478 : y === 5 ? 0xd8d0c2 : 0xece6da;
    else if (y < 13) c = y === 12 ? 0xb8b0a2 : y === 7 ? 0xfffaf0 : 0xe6dfd2;                        // takkoffern
    else if (y >= GBASE - 8) c = y === GBASE - 8 ? 0xb8ae9e : 0x9a8e7c;                              // sockeln
    P.px(x, y, c);
  }
  for (let x = 16; x < Wf; x += 24) if (x < G0.x0 - 6 || x > G0.x1 + 6) { P.rect(x - 2, 10, 4, 2, 0xfffbe8); P.ell(x, 15, 9, 8, 0xfff6d0, 0.18, 3); }   // spotlights över butikerna
  for (const px of [0, Wf - 6, G0.x0 - 9, G0.x1 + 3]) for (let y = 7; y < GBASE - 8; y++) for (let x = px; x < px + 6; x++) P.px(x, y, x === px ? 0xfffaf0 : x === px + 5 ? 0xb8b0a2 : 0xe2dacc);   // pelarna
  // ---- trapphusets glasvägg ----
  P.erase(G0.x0, G0.y0, G0.x1 - G0.x0, G0.y1 - G0.y0);
  P.rect(G0.x0 - 3, 7, 3, GBASE - 7, 0x6a7078); P.vl(G0.x0 - 3, 7, GBASE - 7, 0xb8bec6);
  P.rect(G0.x1, 7, 3, GBASE - 7, 0x6a7078); P.vl(G0.x1 + 2, 7, GBASE - 7, 0x4a5058);
  P.hl(G0.x0 - 3, 7, G0.x1 - G0.x0 + 6, 0x5a6068);
  for (let y = G0.y1; y < GBASE; y++) for (let x = G0.x0; x < G0.x1; x++) P.px(x, y, y === G0.y1 ? 0xc8ced6 : y === GBASE - 1 ? 0x3a3e46 : jit(0x6a7078, x >> 3, 0, 84, 0.03));   // bröstningen
  for (let x = G0.x0 + 36; x < G0.x1; x += 36) { P.vl(x - 1, G0.y0, G0.y1 - G0.y0, 0x9aa2ac); P.vl(x, G0.y0, G0.y1 - G0.y0, 0x50565e); }   // spröjsarna
  const ty = G0.y0 + 42; P.hl(G0.x0, ty, G0.x1 - G0.x0, 0x9aa2ac); P.hl(G0.x0, ty + 1, G0.x1 - G0.x0, 0x50565e);   // tvärposten
  if (f.n > 0) {   // ledstången framför glaset på övervåningarna
    const ry = GBASE - 22; P.hl(G0.x0, ry, G0.x1 - G0.x0, 0xe2e6ea); P.hl(G0.x0, ry + 1, G0.x1 - G0.x0, 0x8a929c);
    for (let x = G0.x0 + 18; x < G0.x1; x += 36) P.vl(x, ry + 2, G0.y1 - ry - 2, 0x8a929c);
  }
  if (f.n === TOPF) for (let y = 0; y < 7; y++) for (let x = G0.x0; x < G0.x1; x++) P.px(x, y, (x - G0.x0) % 36 < 2 || y === 6 ? 0x6a7078 : mix(0x9cc8e8, 0xd8eef6, y / 7));   // glastaket
  // hisschaktet av glas och stål ovanför hissdörren, med linorna
  const sx0 = LIFT_X - 5, sx1 = LIFT_X + T.LIFT_W + 5, sTop = G0.y0, sBot = GBASE - T.LIFT_H - 19;
  for (let y = sTop; y < sBot; y++) for (let x = sx0; x < sx1; x++) P.px(x, y, 0xd8eef6, 0.24);
  for (let y = sTop; y + 18 <= sBot; y += 18) { P.line(sx0, y, sx1 - 1, y + 18, 0x8a929c, 0.75); P.line(sx1 - 1, y, sx0, y + 18, 0x8a929c, 0.75); P.hl(sx0, y, sx1 - sx0, 0x6a7078); }
  P.rect(sx0 - 1, sTop, 2, sBot - sTop, 0x6a7078); P.rect(sx1 - 1, sTop, 2, sBot - sTop, 0x6a7078);
  P.vl(LIFT_X + 11, sTop, sBot - sTop, 0x3a3e46, 0.7); P.vl(LIFT_X + 15, sTop, sBot - sTop, 0x3a3e46, 0.7);
  // pendellamporna i trapphusets tak (på entréplanet hänger stjärnan i stället för en av dem)
  for (const lx of f.n === 0 ? [272, 318, 566] : [272, 318, 520, 566]) {
    P.vl(lx, 7, 12, 0x4a4e56); P.rect(lx - 2, 18, 5, 1, 0x4a4e56);
    for (let y = 19; y < 25; y++) for (let x = -3; x <= 3; x++) if (x * x / 12 + (y - 22) ** 2 / 9 <= 1) P.px(lx + x, y, y < 21 ? 0xfffef0 : y < 23 ? 0xfff2c8 : 0xe8d8a8);
    P.ell(lx, 23, 13, 9, 0xfff6d0, 0.2, 3);
  }
  if (f.n < TOPF) T.paintSlab(P, 230, 348, SLAB_Y, `PLAN ${f.n + 1}`);
  // ---- golvet: stora blanka plattor med lampornas sken och solkatterna från glasväggen ----
  for (let y = GBASE; y < H; y++) for (let x = 0; x < Wf; x++) {
    const v = y - GBASE, row = v >> 3, lx = (x + (row & 1 ? 12 : 0)) % 24, ly = v % 8;
    let c = jit(0xe4ddd0, (x + (row & 1 ? 12 : 0)) / 24 | 0, row, 82, 0.03);
    if (lx === 0 || ly === 0) c = mul(c, 0.9); else if (ly === 1) c = mix(c, 0xffffff, 0.1);
    if ((x < G0.x0 || x > G0.x1) && ((x - 16) % 24 + 24) % 24 < 8 && v < 18 && hash(x, y, 83) > 0.45) c = mix(c, 0xfffaf0, 0.16);
    P.px(x, y, c);
  }
  for (let y = GBASE + 2; y < GBASE + 36; y++) {
    const v = y - GBASE, k = 1 - v / 36, sh = Math.round(v * 0.55);
    for (let p = G0.x0; p < G0.x1; p += 36) for (let x = p + 3 + sh; x < p + 34 + sh; x++) if (x < G0.x1 + 16 && bayer(x, y) < k * 0.85) P.px(x, y, 0xfffbea, 0.2);
  }
  for (let x = 0; x < Wf; x++) { P.px(x, GBASE, 0x000000, 0.25); P.px(x, GBASE + 1, 0x000000, 0.12); }
  if (f.dnE) T.paintPit(P, ...f.dnE.pit);
  T.paintLiftFrame(P, LIFT_X, GBASE, f.n);
  // våningsskylten hänger i trapphuset
  const sgn = `PLAN ${f.n} - ${f.name}`, sw = textW(SMALL, sgn) + 12, sx = 452 - (sw >> 1);
  P.vl(sx + 4, 7, 39, 0x6a7078); P.vl(sx + sw - 5, 7, 39, 0x6a7078);
  P.rect(sx, 46, sw, 11, 0x1d51a0); P.box(sx, 46, sw, 11, 0x0c2a5c); pixText(P, SMALL, sgn, sx + 6, 49, 0xf6d02f);
  const door = (x0, x1, label) => {   // glasdörrar med skylt (skolan och vägen hem på entréplanet)
    const top = GBASE - 44, mx = (x0 + x1) >> 1;
    P.rect(x0 - 3, top - 3, x1 - x0 + 6, GBASE - top + 3, 0x6a7078); P.hl(x0 - 3, top - 3, x1 - x0 + 6, 0xb8bec6);
    for (let y = top; y < GBASE; y++) for (let x = x0; x < x1; x++) { let c = mix(0x9cc8e0, 0xd8eef6, (y - top) / 44); if (x === mx) c = 0x6a7078; if ((x - y + 300) % 13 < 2) c = mix(c, 0xffffff, 0.5); P.px(x, y, c); }
    const w = textW(SMALL, label) + 10; P.rect(mx - (w >> 1), top - 16, w, 11, 0x2a6a3a); P.box(mx - (w >> 1), top - 16, w, 11, 0xf4f1ea); pixText(P, SMALL, label, mx - (w >> 1) + 5, top - 13, 0xf4f1ea);
  };
  if (f.school) door(f.school[0], f.school[1], 'SKOLAN');
  if (f.home) door(f.home[0], f.home[1], 'HEM');
  if (f.n === 0) {   // entréplanet: gallerians namn på entréväggen, vägvisaren och den stora stjärnan i trapphuset
    const nm = 'GALLERIA STJÄRNAN', tw = textW(BIG, nm), nx = 84 - (tw >> 1);
    P.rect(nx - 8, 18, tw + 16, 16, 0x2a2440); P.box(nx - 8, 18, tw + 16, 16, 0xe8b230); pixText(P, BIG, nm, nx, 23, 0xffd23f);
    for (let x = nx - 6; x < nx + tw + 8; x += 4) P.px(x, 19, 0xfff4c0);
    const bx = 82, by = 44; P.rect(bx, by, 80, 70, 0x2a2440); P.box(bx, by, 80, 70, 0x9aa0a8);
    pixText(P, SMALL, 'VÅNINGAR', bx + 6, by + 5, 0xffd23f);
    const rows = [['2', 'LEKSAKSLÅDAN'], ['2', 'MÖBELJÄTTEN'], ['1', 'KLÄDAFFÄREN'], ['1', 'SKOBUTIKEN'], ['1', 'GODIS'], ['0', 'BLOMMOR + KIOSK']];
    rows.forEach(([n, t2], i) => { P.rect(bx + 5, by + 15 + i * 9, 7, 7, 0xf6cf2a); pixText(P, SMALL, n, bx + 7, by + 16 + i * 9, 0x1d51a0); pixText(P, SMALL, t2, bx + 15, by + 16 + i * 9, 0xf4f1ea); });
    const stx = 520, sty = 34;   // stjärnan: gul, med blank kant, i två linor från taket
    P.vl(stx - 6, 7, 20, 0x8a8e96); P.vl(stx + 6, 7, 20, 0x8a8e96);
    const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i & 1 ? 5.5 : 13; return [Math.cos(a) * r, Math.sin(a) * r]; });
    const inside = (x, y) => { let o = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) o = !o; } return o; };
    for (let y = -13; y <= 13; y++) for (let x = -13; x <= 13; x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const edge = !inside(x + 1.5, y + 0.5) || !inside(x - 0.5, y + 0.5) || !inside(x + 0.5, y + 1.5) || !inside(x + 0.5, y - 0.5);
      P.px(stx + x, sty + y, edge ? 0xc8901a : x + y < -3 ? 0xfff2a0 : x > 1 && y > 0 ? 0xe8a820 : 0xffd23f);
    }
  }
  const bg = P.flush(), c = bg.getContext('2d');
  for (const u of f.units || []) { const U = unitOf(u); c.drawImage(U.back, U.ox, 0); }
  paintBanners(c, f);
  return (GAL_BG[f.n] = bg);
}

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
const BG = { klass: paintClass(), hem: paintHome() };   // (gallerians våningar målas när de behövs: galleriaBG)
const LABEL = { klass: 'KLASSRUM', galleria: 'GALLERIA', hem: 'DITT RUM' };
const sceneW = (sc) => (sc === 'galleria' ? FL().w : W);
// nytt klassnamn: dörrskylten är målad i klassrummets bakgrund, så den målas om
function setKlass(v) {
  const k = cleanKlass(v); if (!k || k === KLASS) return;
  const g = gradeOf(k); KLASS = k;
  if (g) D.grade = g <= 2 ? 2 : 3;   // siffran i klassen väljer årskursen (1:an räknas som 2, 4:an och uppåt som 3)
  BG.klass = paintClass(); updatePill(); save(); gradeButtons();
}
// årskursen 2 eller 3: siffran i klassens namn följer med (3A → 2A)
function setGrade(g) {
  D.grade = g === 2 ? 2 : 3;
  const rest = KLASS.replace(/^\d+/, ''); KLASS = cleanKlass(`${D.grade}${rest || 'A'}`);
  BG.klass = paintClass(); updatePill(); save(); gradeButtons();
  const inp = document.querySelector('#modal [data-klass]'); if (inp) inp.value = KLASS;
}
function gradeButtons() { document.querySelectorAll('#modal [data-grade]').forEach((b) => b.classList.toggle('btn-gold', +b.dataset.grade === D.grade)); }
function gradeDialog(then) {   // allra först i ett nytt spel: årskurs 2 eller 3
  const dlg = openModal('🏫 Välkommen till Pixelskolan', `<p class="sk-big">Vilken årskurs går du i?</p><p class="sp">Uppgifterna följer läroplanen för årskursen du väljer. Du kan byta senare under Figur och klass.</p>
    <div class="sk-grade">${[2, 3].map((g) => `<button type="button" class="btn sk-gr" data-grade="${g}"><b>${g}</b><span>Årskurs ${g}</span></button>`).join('')}</div>`, [], { closable: false });
  dlg.querySelectorAll('[data-grade]').forEach((b) => (b.onclick = () => { setGrade(+b.dataset.grade); closeModal(); then(); }));
}
// möbler från Möbeljätten i ditt rum: { k, v, c, x, y } (x = vänsterkant, y = fotlinje; väggsaker hänger på väggen)
const furnOf = (p) => (SHOPLIB ? SHOPLIB.room.furnView(p.k, p.v, p.c || null, 0) : null);
const isWallFurn = (k) => !!SHOPLIB?.katalogOf(k)?.wall;
const isFlatFurn = (k) => /matta$/.test(k);   // mattorna ligger platt på golvet (som room.js isFlat)
const FP = (p) => { const a = furnOf(p); const w = a ? a.sw : 16, h = a ? a.sh : 16; return [p.x, p.y - Math.min(12, h >> 1), p.x + w, p.y + 1]; };
const BLOCKS = {
  klass: () => [...ROWS.flatMap((fy) => XS.map((x) => [x - 14, fy - 14, x + 14, fy + 1])), ...BAGS.map(([k, x, fy]) => [x, fy - 6, x + 11, fy + 1]), [338, 162, 358, 173], [114, 96, 170, 118]],
  galleria: () => {   // rulltrapporna (beklädnaden under trappan uppåt, schaktet i golvet) och krukväxterna
    const f = FL(), out = [];
    if (f.n < TOPF) out.push([ESC.up + 6, GBASE + 4, ESC.up + 132, GBASE + 34]);
    if (f.n > 0) { const d = ESC.down; out.push([d - 142, GBASE + 24, d - 6, GBASE + 58]); }
    if (SHOPLIB) { floorDecor(f); out.push(...decorBlocks(f)); }
    return out;
  },
  hem: () => [[18, 98, 40, 135], [38, 92, 58, 110], [328, 90, 356, 102], [360, 92, 378, 106], ...PLACED.filter((p) => !isWallFurn(p.k) && !isFlatFurn(p.k)).map(FP)],
};
const BOUNDS = {
  klass: (x, y) => (x >= 6 && x <= 378 && y >= 122 && y <= 213) || (x >= 300 && x <= 322 && y >= 96 && y < 122),
  galleria: (x, y) => x >= 6 && x <= FL().w - 6 && y >= GBASE + 6 && y <= H - 4,
  hem: (x, y) => x >= 6 && x <= 378 && y >= 110 && y <= 213,
};

// ================= gå: A* på 4 px-rutnät, som i spelet =================
const CELL = 4, GR = H / CELL;
let GC = W / CELL;
const P = { scene: 'klass', x: 220, y: 210, dir: 'up', path: [], dist: 0, seated: false, onArrive: null };
const freeAt = (x, y) => { if (!BOUNDS[P.scene](x, y)) return false; for (const [a, b, c, d] of BLOCKS[P.scene]()) if (x >= a - 5 && x <= c + 5 && y >= b - 2 && y <= d + 2) return false; return true; };
let grid = new Uint8Array(GC * GR);
function buildGrid() { GC = sceneW(P.scene) / CELL; grid = new Uint8Array(GC * GR); for (let j = 0; j < GR; j++) for (let i = 0; i < GC; i++) grid[j * GC + i] = freeAt(i * CELL + 2, j * CELL + 2) ? 1 : 0; }
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
  if (SHOP) { try { SHOP.scene.update?.(dt); } catch (e) { console.error('butiken:', e); } return; }
  if (P.scene === 'galleria' && SHOPLIB) {
    PENV.t += dt; try { propsLib()?.update?.(dt); } catch { /* föremålens rörelser får aldrig stoppa spelet */ }
    crowdTick(dt);
    for (const h of FL().houses) { const by = !RIDE && Math.abs(P.x - h.door.x) < 16 && P.y < GBASE + 20; h.open += ((by ? 1 : 0) - h.open) * Math.min(1, dt * 8); }   // dörrarna glider upp som i staden
    if (RIDE) { rideTick(dt); return; }
  }
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
const meSay = (s) => say('me', () => ({ x: P.x, y: P.y - 36 }), null, s);
const FREE_LINES = ['HEJ {P}!', '{P}, KOM OCH SITT!', 'VI HAR MATTE NU.', '{F} ÄR SNÄLL.', 'SNART RAST!', 'SNYGGA KLÄDER, {P}!', 'JAG HAR FÅTT TRE STJÄRNOR!', '{K}, FÅR JAG LÅNA SUDDET?', 'VAD BLIR 7 + 3?', 'JAG GILLAR KLOCKAN.', 'SKA VI LEKA PÅ RASTEN, {K}?', 'JAG VILL HA BLINKSKORNA.'];
const LESSON_LINES = ['DU KLARAR DET, {P}!', 'SCHH, JAG RÄKNAR.', 'JAG TÄNKER.', 'TIOKOMPISAR ÄR LÄTT!', '{F}, JAG ÄR KLAR!', 'HUR STAVAS REGNBÅGE?', 'HEJA {P}!', 'VAD BLIR 8 + 5, {K}?'];
const RAST_LINES = ['RAST! KOM, {P}!', 'JAG SKA TILL LEKSAKSLÅDAN.', 'SPRING TILL SKOBUTIKEN!', 'HUR MÅNGA STJÄRNOR FICK DU?', 'VI SES EFTER RASTEN!'];
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
function chalkBoard(t) {
  const ch = (s, x, y, k = 1, col = '#e8ece4') => ctxText(ctx, SMALL, s, x, y, col, k);
  const bx = BOARD.x0, by = BOARD.y0, q = D.q;
  const ten = (x, y, n) => { for (let i = 0; i < 10; i++) { const cx = x + (i % 5) * 8, cy = y + Math.floor(i / 5) * 8; fill(cx, cy, 9, 1, '#e8ece4'); fill(cx, cy + 8, 9, 1, '#e8ece4'); fill(cx, cy, 1, 9, '#e8ece4'); fill(cx + 8, cy, 1, 9, '#e8ece4'); if (i < n) { fill(cx + 3, cy + 2, 3, 5, '#f8e878'); fill(cx + 2, cy + 3, 5, 3, '#f8e878'); } } };
  if (D.rast) { ch('RAST!', bx + 8, by + 7, 2); ch('BUTIKERNA ÄR ÖPPNA', bx + 8, by + 24, 1, '#f8e878'); ch(`BRA JOBBAT ${KLASS}!`, bx + 8, by + 32); return; }
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
const CHALK = { ...BIG, '×': { rows: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'], up: [], w: 5 }, '·': { rows: ['..', '..', '..', '##', '##', '..', '..'], up: [], w: 2 }, '_': { rows: ['....', '....', '....', '....', '....', '....', '####'], up: [], w: 4 }, '−': BIG['-'] };
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
  if (chalkMode(b, ch)) return;
  const now = performance.now(), mode = inputOf(q), blink = reduce || Math.floor(now / 450) % 2 === 0;
  // rutan för svaret: det man skrivit (med blinkande markör), rätt svar i gult, ett fel svar i rött
  const slot = !mode || !q ? null : D.solved ? { s: ansText(q), col: CY } : D.bad ? { s: D.typed, col: '#ff9a8a' } : { s: D.typed ? D.typed + (blink ? '_' : '') : (blink ? '_' : '?'), col: D.typed ? CW : CY };
  const SLOT_RE = /(^|\s)\?(\s|$)/;
  const chS = (str, x, y, k, col = CW, calc = false) => {   // en rad med rutan (en ensam ?) utbytt mot svaret i egen färg
    const m = slot && SLOT_RE.exec(str);
    if (!m) { ch(calc && D.solved && !mode ? str.replace('?', String(q.ans)) : str, x, y, k, col); return false; }
    const i = m.index + m[1].length, a = str.slice(0, i), z = str.slice(i + 1);
    let xx = x; if (a) { ch(a, xx, y, k, col); xx += textW(CHALK, a, k) + k; }
    ch(slot.s, xx, y, k, slot.col); xx += textW(CHALK, slot.s || ' ', k) + k;
    if (z) ch(z, xx, y, k, col);
    return true;
  };
  const wS = (str) => (slot ? str.replace(SLOT_RE, `$1${slot.s || ' '}$2`) : str);   // bredden med svaret ifyllt
  const ty = Math.max(b.y0 + 7, pillB + 4);   // första raden under skylten uppe till vänster
  if (D.rast || !q) { ch('RAST!', b.x0 + 12, ty + 4, 2); ch('BUTIKERNA PÅ STORGATAN ÄR ÖPPNA', b.x0 + 12, ty + 26, 1, CY); ch(`BRA JOBBAT ${KLASS}!`, b.x0 + 12, ty + 38); return; }
  ch(q.topic, b.x0 + 9, ty, 1, CBL);
  if (D.solved) ch('RÄTT!', b.x1 - 9 - textW(CHALK, 'RÄTT!'), b.y0 + 7, 1, CG);
  const top = ty + 15, bot = b.y1 - 6, mid = (top + bot) >> 1;
  const v = q.visual || {};
  if (v.column) chalkColumn(b, top, q, slot, blink);   // uppställning
  else if (v.clock) {   // klockan: urtavlan till höger
    const R = Math.max(20, Math.min(60, Math.floor((bh - 10) / 2))), cx = b.x1 - 16 - R, cy = b.y0 + (bh >> 1), tw = cx - R - 16 - (b.x0 + 12);
    const qs = q.question || 'VAD ÄR KLOCKAN?', k = k2(qs, tw);
    if (k === 1 && textW(CHALK, qs) > tw) { let y = top + 2; for (const r of wrapChalk(qs, tw)) { ch(r, b.x0 + 12, y); y += 10; } } else ch(qs, b.x0 + 12, top + 2, k);
    const ay = top + 2 + Math.max(7 * k + 9, textW(CHALK, qs) > tw ? 24 : 0);
    if (mode) chS('= ?', b.x0 + 12, ay, k2(wS('= ?') + '00', tw));
    else if (D.solved) { const a = q.ans.toUpperCase(); ch(a, b.x0 + 12, ay, k2(a, tw), CY); }
    clockFace(cx, cy, R, v.clock);
  } else if (q.look) {   // skriv ordet: ordet syns tills man börjar skriva (titta, täck, skriv)
    const x = b.x0 + 12, tw = bw - 24, show = !D.typed || D.bad || D.solved;
    let y = top + 1;
    if (show) {
      ch(q.look, x, y, k2(q.look, tw), D.solved ? CY : CW); y += 22;
      for (const r of (D.solved ? ['RÄTT STAVAT!'] : D.bad ? ['TITTA IGEN OCH SKRIV EN GÅNG TILL.'] : q.board.lines)) { ch(r, x, y, 1, CBL); y += 10; }
    } else { ch('ORDET ÄR GÖMT. SKRIV DET:', x, y + 2, 1, CBL); y += 14; }
    if (!D.solved) chS('?', x, y + 2, k2(wS('?') + '0', tw));
  } else if (q.board) {   // text på tavlan (svenska, engelska, NO/SO, de nya matteuppgifterna) + ev. bild till höger
    const R = Math.max(18, Math.min(56, Math.floor((bh - 12) / 2)));
    const rw = v.shape ? 2 * R + 10 : v.pie ? 2 * R : v.chart ? Math.min(170, Math.floor(bw * 0.45)) : 0;
    const tw = bw - 24 - (rw ? rw + 14 : 0), x = b.x0 + 12, B = q.board;
    let y = top + 1, placed = false;
    const big = () => { if (!B.big) return; const k = k2(wS(B.big), tw); placed = chS(B.big, x, y, k) || placed; y += 7 * k + 7; };
    const later = B.big && /^=/.test(B.big);   // "= ?" står efter raderna
    if (!later) big();
    const rows = []; for (const ln of B.lines || []) rows.push(...wrapChalk(ln, tw));
    const lh = rows.length > 4 ? 9 : 11;
    for (const r of rows) { const hit = slot && !placed && SLOT_RE.test(r); placed = chS(r, x, y, hit ? 2 : 1) || placed; y += hit ? 18 : lh; }
    if (later) { y += 2; big(); }
    if (mode && !placed) { y += 2; const k = k2(wS('SVAR: ?') + '0', tw); chS('SVAR: ?', x, y, k); y += 7 * k + 6; }
    if (D.solved && B.after && !(placed && /^=/.test(B.after))) for (const r of wrapChalk(B.after, tw)) { y += 2; ch(r, x, y, 1, CY); y += lh; }
    const vx = b.x1 - 14 - rw, vy = b.y0 + 6, vh = bh - 12;
    if (v.shape) chalkShape(vx + (rw >> 1), b.y0 + (bh >> 1) + 2, R, v.shape);
    if (v.pie) chalkPie(vx + R, b.y0 + (bh >> 1) + 2, R - 2, v.pie[0], v.pie[1]);
    if (v.chart) chalkChart(vx, Math.max(vy, ty - 2), rw, vh - Math.max(0, ty - 2 - vy), v.chart);
  } else if (v.groups || v.crab) {   // gånger: guldmynten eller krabban
    const pr = q.prompt;
    if (v.groups) {   // upprepad addition: grupperna med guldmynt + additionen och multiplikationen
      const n = v.groups, perRow = Math.min(n, 10), cw = 15;
      for (let i = 0; i < n; i++) coinBox(b.x0 + 12 + (i % perRow) * cw, top + 1 + Math.floor(i / perRow) * cw, v.t);
      const y2 = top + 1 + Math.ceil(n / perRow) * cw + 4, sum = q.sum;
      chS(sum, b.x0 + 12, y2, k2(wS(sum), bw - 24), CW, true);
      chS(pr, b.x0 + 12, y2 + (textW(CHALK, wS(sum), 2) <= bw - 24 ? 18 : 11), k2(wS(pr), bw - 24), D.solved ? CY : CW, true);
    } else {
      const k = k2(wS(pr), bw - 70);
      chS(pr, b.x0 + 12, mid - ((7 * k) >> 1), k, D.solved ? CY : CW, true);
      crab(b.x1 - 44, mid - 10); if (!D.solved) ch('?', b.x1 - 50, mid - 18, 1, CY);
    }
  } else {   // räkneuppgift i stor krita (+ tiorutan)
    const pr = q.prompt.replace(/−/g, '-');
    const tf = v.frame !== undefined, cs = Math.max(9, Math.min(18, Math.floor((bot - top - 4) / 2.4)));
    const fw = tf ? cs * 5 + 1 : 0, k = k2(wS(pr) + '0', bw - 24 - (tf ? fw + 20 : 0));
    chS(pr, b.x0 + 12, mid - ((7 * k) >> 1), k, D.solved ? CY : CW, true);
    if (tf) tenFrame(b.x1 - 12 - fw, mid - cs, cs, v.frame);
  }
}
// uppställning: talen under varandra med linje, svaret skrivs från entalen och åt vänster (markören visar var)
function chalkColumn(b, top, q, slot, blink) {
  const [a, c, op] = q.visual.column, dw = 12, nd = 4, right = b.x0 + 26 + (nd + 1) * dw, lh = Math.max(15, Math.min(18, Math.floor((b.y1 - top - 26) / 2))), y0 = top + (lh < 18 ? 4 : 6);   // (låg tavla på mobilen: tätare rader)
  const num = (s, y, col) => { for (let i = 0; i < s.length; i++) ctxText(ctx, CHALK, s[s.length - 1 - i], right - (i + 1) * dw, y, col, 2); };
  ['H', 'T', 'E'].forEach((l, i) => ctxText(ctx, SMALL, l, right - (3 - i) * dw + 3, y0 - 7, CBL));
  num(String(a), y0, CW); num(String(c), y0 + lh, CW);
  ctxText(ctx, CHALK, op === '+' ? '+' : '-', right - (nd + 1) * dw, y0 + lh, CW, 2);
  fill(right - (nd + 1) * dw - 2, y0 + 2 * lh - 3, (nd + 1) * dw + 4, 2, CW);
  const s = D.solved ? String(q.ans) : D.typed, yA = y0 + 2 * lh + 2;
  num(s, yA, slot ? slot.col : CW);
  if (!D.solved && !D.bad && blink && s.length < nd) fill(right - (s.length + 1) * dw + 1, yA + 15, dw - 3, 2, CY);
  const tip = D.solved ? `${a} ${op === '+' ? '+' : '-'} ${c} = ${q.ans}` : 'ENTALEN FÖRST', tx = right + 18;
  if (tx + textW(CHALK, tip) < b.x1 - 8) ctxText(ctx, CHALK, tip, tx, yA + 4, D.solved ? CY : CBL);
}
// radbryt kritan (stora typsnittet) på ord så att raden får plats i bredden w
function wrapChalk(text, w) {
  const out = []; let line = '';
  for (const word of String(text).split(' ')) { const t = line ? line + ' ' + word : word; if (line && textW(CHALK, t) > w) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line);
  return out;
}
// kritlinjer: rak linje, ellips (kontur, valfritt bara övre/nedre halvan, streckad)
function cLine(x0, y0, x1, y1, col = CW) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) fill(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1, col); }
function cEll(cx, cy, rx, ry, col = CW, part = 'all', dash = false) {
  const n = Math.max(24, Math.round((rx + ry) * 3));
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, y = Math.sin(a); if (part === 'top' && y > 0.01) continue; if (part === 'bottom' && y < -0.01) continue; if (dash && (i >> 1) % 2) continue; fill(Math.round(cx + Math.cos(a) * rx), Math.round(cy + y * ry), 1, 1, col); }
}
function chalkShape(cx, cy, R, f) {   // former och kroppar i krita
  const s = Math.round(R * 0.9), h = s >> 1;
  const rect = (x, y, w, hh) => { cLine(x, y, x + w, y); cLine(x + w, y, x + w, y + hh); cLine(x + w, y + hh, x, y + hh); cLine(x, y + hh, x, y); };
  if (f === 'kvadrat') rect(cx - h, cy - h, s, s);
  else if (f === 'rektangel') rect(cx - s, cy - (h >> 1) - 4, 2 * s, h + 8);
  else if (f === 'triangel') { cLine(cx, cy - h - 4, cx + h + 6, cy + h); cLine(cx + h + 6, cy + h, cx - h - 6, cy + h); cLine(cx - h - 6, cy + h, cx, cy - h - 4); }
  else if (f === 'cirkel') cEll(cx, cy, h + 4, h + 4);
  else if (f === 'femhörning' || f === 'sexhörning') { const n = f === 'femhörning' ? 5 : 6, r = h + 7, pts = Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)]; }); pts.forEach((pt, i) => cLine(pt[0], pt[1], pts[(i + 1) % n][0], pts[(i + 1) % n][1])); }
  else if (f === 'kub' || f === 'rätblock') {
    const w = f === 'kub' ? s - 6 : s + 10, hh = f === 'kub' ? s - 6 : h + 2, d = Math.round(s * 0.3), x = cx - (w >> 1) - (d >> 1), y = cy - (hh >> 1) + (d >> 1);
    rect(x, y, w, hh); rect(x + d, y - d, w, hh);
    cLine(x, y, x + d, y - d); cLine(x + w, y, x + w + d, y - d); cLine(x + w, y + hh, x + w + d, y + hh - d); cLine(x, y + hh, x + d, y + hh - d, '#9fb2a6');
  } else if (f === 'klot') { cEll(cx, cy, h + 6, h + 6); cEll(cx, cy, h + 6, 4, '#9fb2a6', 'all', true); fill(cx - 5, cy - h + 2, 3, 2, '#ffffff'); }
  else if (f === 'cylinder') { const rx = h, ry = Math.max(3, h >> 2), top = cy - h, bot = cy + h; cEll(cx, top, rx, ry); cEll(cx, bot, rx, ry, CW, 'bottom'); cEll(cx, bot, rx, ry, '#9fb2a6', 'top', true); cLine(cx - rx, top, cx - rx, bot); cLine(cx + rx, top, cx + rx, bot); }
  else if (f === 'kon') { const rx = h + 2, ry = Math.max(3, h >> 2), bot = cy + h; cEll(cx, bot, rx, ry, CW, 'bottom'); cEll(cx, bot, rx, ry, '#9fb2a6', 'top', true); cLine(cx, cy - h - 4, cx - rx, bot); cLine(cx, cy - h - 4, cx + rx, bot); }
  else if (f === 'pyramid') { const bx = cx - h - 4, by = cy + h - 2, w = s + 4, d = Math.round(s * 0.3), ax = cx + 2, ay = cy - h - 6; cLine(bx, by, bx + w, by); cLine(bx + w, by, bx + w + d, by - d); cLine(bx + d, by - d, bx + w + d, by - d, '#9fb2a6'); cLine(bx, by, bx + d, by - d, '#9fb2a6'); cLine(ax, ay, bx, by); cLine(ax, ay, bx + w, by); cLine(ax, ay, bx + w + d, by - d); cLine(ax, ay, bx + d, by - d, '#9fb2a6'); }
}
function chalkPie(cx, cy, r, n, k) {   // en pizza i n lika bitar, k av dem gula
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y); if (d > r) continue;
    let a = Math.atan2(x, -y); if (a < 0) a += Math.PI * 2;
    const part = Math.floor(a / (Math.PI * 2) * n);
    if (part < k && d < r - 1) fill(cx + x, cy + y, 1, 1, (x + y) & 1 ? '#f8e878' : '#f0d050');
  }
  cEll(cx, cy, r, r);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; cLine(cx, cy, Math.round(cx + Math.sin(a) * r), Math.round(cy - Math.cos(a) * r)); }
}
function chalkChart(x, y, w, h, bars) {   // stapeldiagram med skala 0–8 och namnen under staplarna
  const max = 8, ax = x + 12, ay = y + h - 10, top = y + 4, ph = ay - top, step = ph / max;
  cLine(ax, top, ax, ay); cLine(ax, ay, x + w, ay);
  for (let v = 0; v <= max; v += 2) { const yy = Math.round(ay - v * step); ctxText(ctx, SMALL, String(v), x + 2, yy - 2, '#9fb2a6'); if (v) for (let xx = ax + 2; xx < x + w; xx += 3) fill(xx, yy, 1, 1, 'rgba(232,236,228,0.25)'); }
  const bw = Math.floor((w - 18) / bars.length);
  bars.forEach(([name, val], i) => {
    const bx = ax + 4 + i * bw, bh = Math.round(val * step), col = ['#f8e878', '#8fe0a2', '#a8d8f0', '#f0a8c0'][i % 4];
    fill(bx, ay - bh, bw - 6, bh, col); fill(bx, ay - bh, bw - 6, 1, '#ffffff');
    ctxText(ctx, SMALL, name.slice(0, Math.max(3, Math.floor((bw - 2) / 4))), bx - 1, ay + 3, CW);
  });
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
// butiksfronterna i gallerian: bilden och livet (dörrar, skyltar, skyltdockor …) i husets egna stadskoordinater
function stOf(h, t) { return { t, night: false, hour: 12, doorOpen: h.open, env: STREET_ENV, worn: 0 }; }
function drawHouse(c, h, t) {
  const img = houseImg(h); if (!img) return;
  c.save(); c.translate(h.dx, h.dy);
  const p = SHOPLIB.artPos(h.b, img); c.drawImage(img, p.x, p.y);
  try { h.art?.live?.(c, h.b, stOf(h, t)); } catch (e) { console.error(`fasaden ${h.id}:`, e); h.art = { ...h.art, live: null }; }
  c.restore();
}
let camX = 0, CAM_OVR = null;   // (CAM_OVR: testkrokarna kan låsa kameran)
const camFor = () => (P.scene === 'galleria' ? Math.max(0, Math.min(FL().w - W, CAM_OVR ?? Math.round(P.x - W / 2))) : 0);
function draw(now) {
  const t = now / 1000, sc = P.scene;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, cv.width, cv.height);
  if (SHOP) {   // Snabbfilens butiksscen ritar själv (den börjar med ctx.setTransform(A.pxs …) som i spelet)
    A.pxs = scale;
    try { SHOP.scene.draw(ctx); } catch (e) { console.error('butiken:', e); }
    ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.globalAlpha = 1;
    const ft = now - fadeT; if (!reduce && ft < 320) fill(0, 0, W, H, `rgba(10,8,16,${1 - ft / 320})`);
    return;
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (sc === 'klass' && P.seated) {
    ctx.drawImage(closeBG(cuVis), 0, 0); chalkClose(cuBoard(cuVis));
    BUBS = BUBS.filter((b) => b.until > now); closeBubbles(cuVis);
    const ft = now - fadeT; if (!reduce && ft < 320) fill(0, 0, W, H, `rgba(10,8,16,${1 - ft / 320})`);
    return;
  }
  camX = camFor();
  ctx.translate(-camX, 0);   // bara gallerian är bredare än bilden
  if (sc === 'galleria') {
    if (SHOPLIB) { const f0 = FL(); try { drawView(ctx, viewOf(f0), t, camX); } catch (e) { if (!VIEW_ERR) console.error('utsikten:', e); VIEW_ERR = true; } ctx.drawImage(galleriaBG(f0), 0, 0); }
    else fill(camX, 0, W, H, '#2a2440');
  }
  else ctx.drawImage(BG[sc], 0, 0);
  if (sc === 'klass') {
    chalkBoard(t);
    if (doorGlow && (reduce || Math.floor(t * 2.5) % 2 === 0)) { fill(DOOR.x0 - 1, DOOR.y0 - 1, 31, 1, '#ffd23f'); fill(DOOR.x0 - 1, DOOR.y0 - 1, 1, WALL_Y - DOOR.y0 + 1, '#ffd23f'); fill(DOOR.x1 + 1, DOOR.y0 - 1, 1, WALL_Y - DOOR.y0 + 1, '#ffd23f'); }
  }
  const list = [];
  if (sc === 'klass') {
    list.push(...STATIC_K);
    KIDSEATS.forEach(([r, x], i) => list.push({ fy: ROWS[r] - 1, draw: (c) => drawPerson(c, x, ROWS[r] - 1, CLASS[i].look, 'up', Math.floor(t * 0.7 + i * 1.7) % 9 === 0 ? 6 : 5) }));
    list.push({ fy: TEACH.y, draw: (c) => drawPerson(c, TEACH.x, TEACH.y, TEACHER.look, 'down', Math.sin(t * 1.3) > 0.92 ? 4 : 0) });
  } else if (sc === 'galleria') {
    const f = FL();
    if (SHOPLIB) {
      if (f.upE) list.push({ fy: f.upE.ly + 3, draw: (c) => drawEsc(c, f.upE, t) });
      if (f.dnE) list.push({ fy: f.dnE.pit[3], draw: (c) => drawEsc(c, f.dnE, t) });
      list.push({ fy: GBASE - 1, draw: (c) => drawLift(c, t) });
    }
    if (SHOPLIB) {
      for (const d of floorDecor(f)) list.push({ fy: d.y, draw: (c) => drawDecor(c, d) });
      for (const n of crowdFor(f)) list.push({ fy: n.y + (n.mode === 'sit' ? 0.01 : 0), draw: (c) => drawNpc(c, n, t) });
      for (const u of f.units || []) { const U = unitOf(u); list.push({ fy: GBASE - 7, draw: (c) => drawUnitLive(c, U, t, GBASE) }, { fy: GBASE + 3, draw: (c) => c.drawImage(U.front, U.ox, 0) }); }
    }
    if (SHOPLIB) for (const h of f.houses) {
      list.push({ fy: GBASE - 0.5, draw: (c) => drawHouse(c, h, t) });
      if (h.art?.items) try { for (const it of h.art.items(h.b, stOf(h, t)) || []) list.push({ fy: it.y + h.dy, draw: (c) => { c.save(); c.translate(h.dx, h.dy); it.draw(c); c.restore(); } }); } catch (e) { console.error(`fasaden ${h.id}:`, e); }
    }
  } else if (SHOPLIB) for (const p of PLACED) {
    const a = furnOf(p); if (!a) continue;
    const wall = isWallFurn(p.k), flat = isFlatFurn(p.k);
    list.push({ fy: flat ? p.y - 1000 : wall ? p.y - 500 : p.y, draw: (c) => { if (!wall && !flat) { c.fillStyle = 'rgba(20,12,28,0.22)'; c.fillRect(p.x + 1, p.y - 1, a.sw - 2, 2); } SHOPLIB.room.drawArt(c, a, p.x, p.y - a.sh); } });
  }
  const walking = P.path.length > 0;
  if (ME && !(RIDE && (RIDE.kind === 'esc' || inLift()))) list.push({ fy: P.y + 0.01, draw: (c) => drawPerson(c, P.x, P.y, myLook(), P.dir, walking ? WALK_SEQ[Math.floor(P.dist / 7.3) % 4] : (Math.sin(t * 2) > 0.9 ? 4 : 0)) });
  list.sort((a, b) => a.fy - b.fy);
  for (const d of list) d.draw(ctx, t);
  if (sc === 'klass' && !D.rast && ME) drawArrow(t);
  if (sc === 'galleria' && !SHOPLIB) { const s = 'GALLERIAN ÖPPNAR …', w = textW(SMALL, s) + 8; fill(camX + (W - w >> 1), 100, w, 11, '#17151a'); ctxText(ctx, SMALL, s, camX + (W - w >> 1) + 4, 103, '#ffd23f'); }
  if (sc === 'galleria' && hover?.label && mouse && !RIDE) { const s = hover.label, w = textW(SMALL, s) + 6, lx = Math.max(camX + 2, Math.min(camX + W - w - 2, Math.round(mouse[0] - w / 2))); fill(lx, Math.max(2, Math.round(mouse[1]) - 16), w, 9, '#17151a'); ctxText(ctx, SMALL, s, lx + 3, Math.max(2, Math.round(mouse[1]) - 16) + 2, '#ffd23f'); }
  if (sc === 'hem' && placing != null && mouse && SHOPLIB) {
    const it = G.storage[placing], a = it && furnOf(it);
    if (a) { const x = Math.round(mouse[0] - a.sw / 2), y = Math.round(mouse[1] + (isWallFurn(it.k) ? a.sh / 2 : 0)); ctx.globalAlpha = canPlace(it, x, y) ? 0.65 : 0.25; SHOPLIB.room.drawArt(ctx, a, x, y - a.sh); ctx.globalAlpha = 1; }
  }
  if (ME && !RIDE) nameTag(ctx, P.x, P.y - 40, { ...ME, name: firstName(ME) });
  if (hover && hover.t === 'kid') { const a = kidAt(hover.i); nameTag(ctx, a.x, a.y - 2, CLASS[hover.i]); }
  if (hover && hover.t === 'teacher') nameTag(ctx, TEACH.x, TEACH.y - 50, TEACHER);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  BUBS = BUBS.filter((b) => b.until > now);
  for (const b of BUBS) { const at = typeof b.at === 'function' ? b.at() : b.at; sayBubble(ctx, at.x - camX, at.y, b.str); }
  const ft = now - fadeT; if (!reduce && ft < 320) fill(0, 0, W, H, `rgba(10,8,16,${1 - ft / 320})`);
}
function fit() {
  const cs = getComputedStyle(frame), padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const dpr = window.devicePixelRatio || 1, avail = Math.floor(frame.clientWidth - padX), s = Math.floor(avail * dpr / W);
  if (s >= 1 && W * s / dpr < avail * 0.9) {   // hela steg skulle lämna mycket tomt (t.ex. iPhone stående): rita ett steg skarpare och fyll bredden
    scale = s + 1; cv.width = W * scale; cv.height = H * scale; cv.style.width = avail + 'px'; cv.style.height = (avail * H / W) + 'px'; stage.style.width = avail + 'px';
  } else if (s >= 1) { scale = s; cv.width = W * s; cv.height = H * s; const cw = W * s / dpr; cv.style.width = cw + 'px'; cv.style.height = (H * s / dpr) + 'px'; stage.style.width = cw + 'px'; }
  else { scale = 1; cv.width = W; cv.height = H; cv.style.width = '100%'; cv.style.height = 'auto'; stage.style.width = '100%'; }
  requestAnimationFrame(() => measureVis(true));
}

// ================= lektionen: rutan i spelbilden =================
const panel = $('skolpanel');
const TABS = [['matte', 'Matte'], ['ganger', 'Gånger'], ['klocka', 'Klockan'], ['svenska', 'Svenska'], ['engelska', 'Engelska'], ['no', 'NO/SO']];
const TABNAME = { matte: 'MATTE', ganger: 'GÅNGER', klocka: 'KLOCKAN', svenska: 'SVENSKA', engelska: 'ENGELSKA', no: 'NO OCH SO' };
let LES = { results: [] };
function lessonPanel() {
  const q = D.q, n = LES.results.length;
  const dots = [0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? LES.results[i] : i === n ? 'cur' : ''}"></i>`).join('');
  const { i: li, lv, key } = levelOf(D.tab), best = (D.best[key] || {})[li] | 0, mode = inputOf(q);
  panel.innerHTML = `<div class="dlg-head"><h2>${esc(TABS.find((x) => x[0] === D.tab)[1])} · ${li}. ${esc(lv.name)} ${starsHtml(best)}</h2><span class="sp-dots" aria-label="Uppgift ${Math.min(n + 1, 5)} av 5">${dots}</span></div>
    <div class="dlg-body">
      <div class="sp-row">${TABS.map(([k, l]) => `<button type="button" class="btn btn-small${D.tab === k ? ' btn-gold' : ''}" data-tab="${k}">${l}</button>`).join('')}<span class="sp-topic">${esc(q.topic)}</span><span class="sp-spacer"></span><button type="button" class="btn btn-small btn-gold" data-sp="levels">🎯 Nivåer</button>${'speechSynthesis' in window ? '<button type="button" class="btn btn-small" data-sp="say">Läs upp</button>' : ''}<button type="button" class="btn btn-small" data-sp="stand">Res dig</button></div>
      ${D.tab === 'ganger' ? `<div class="sp-row sp-tab"><span class="sp-topic">Tabell ${D.tabell}:</span><button type="button" class="btn btn-small" data-mode="drill">⏱ Huvudräkning</button><button type="button" class="btn btn-small" data-mode="secret">🏴‍☠️ Hemligt meddelande</button></div>` : ''}
      ${mode ? keysHtml(mode) : `<div class="sp-row sp-answers">${q.opts.map((o, i) => `<button type="button" class="btn" data-ans="${i}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`}
      <p class="sp-fb" aria-live="polite">${mode ? esc(q.rtl ? 'Skriv entalen först: siffrorna hamnar från höger, som när du räknar på papper. Tryck sedan på Klar.' : mode === 'time' ? 'Skriv klockslaget, till exempel 14:30, och tryck på Klar.' : mode === 'word' ? 'Skriv med bokstäverna och tryck på Klar.' : 'Skriv svaret med siffrorna och tryck på Klar.') : ''}</p>
    </div>`;
  panel.hidden = false; measureVis(true);   // (ny fråga: tavlan anpassar sig efter rutans höjd)
}
function feedback(lead, rest, kind) { const f = panel.querySelector('.sp-fb'); if (f) f.innerHTML = `<b class="${kind}">${esc(lead)}</b> ${esc(rest)}`; }
panel.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.tab) { D.tab = b.dataset.tab; D.streak = 0; D.miss = 0; newQ(); teacherSay(`NU TAR VI ${TABNAME[D.tab]}!`); }
  else if (b.dataset.ans !== undefined) answer(b, D.q.opts[+b.dataset.ans].value);
  else if (b.dataset.key) typeKey(b.dataset.key);
  else if (b.dataset.mode === 'drill') startDrill();
  else if (b.dataset.mode === 'secret') startSecret();
  else if (b.dataset.pad) drillKey(b.dataset.pad);
  else if (b.dataset.sec !== undefined) secretAnswer(b, +b.dataset.sec);
  else if (b.dataset.sp === 'quit') { MODE = 'lesson'; DRILL = null; SECRET = null; newQ(); teacherSay('VI TAR DET EN ANNAN GÅNG, {P}.'); }
  else if (b.dataset.sp === 'say') { if (MODE === 'secret') speak(`${SECRET.q.k} gånger ${SECRET.t}`); else speak(D.q.say, D.q.lang); }
  else if (b.dataset.sp === 'levels') levelsDialog();
  else if (b.dataset.sp === 'stand') { standUp(); teacherSay('VI SES SNART, {P}!'); }
});
function goSit() { if (P.scene !== 'klass' || P.seated || !ME) return; walkTo(SEAT.ax, SEAT.ay, () => { if (near(SEAT.ax, SEAT.ay)) sitDown(); }); }
function sitDown() { P.seated = true; P.path = []; D.rast = false; doorGlow = LESSONS > 0; LES = { results: [] }; fadeT = performance.now(); newQ(); measureVis(true); teacherSay(`HEJ {P}! VI BÖRJAR MED ${TABNAME[D.tab]}.`); renderBelow(); }
function standUp() { if (!P.seated) return; MODE = 'lesson'; DRILL = null; SECRET = null; P.seated = false; P.x = SEAT.ax; P.y = SEAT.ay; P.dir = 'down'; panel.hidden = true; fadeT = performance.now(); renderBelow(); }
function newQ() {
  let q, n = 0;
  const { lv } = levelOf(D.tab); if (D.tab === 'ganger') D.tabell = lv.t || 5;
  const sig = (x) => (x.prompt || '') + JSON.stringify(x.board || '') + JSON.stringify(x.visual || {}) + x.ans;
  do { q = lv.gen(); n++; } while (sig(q) === D.last && n < 8);
  D.last = sig(q); D.q = q; D.tried = false; D.solved = false; D.locked = false; D.typed = ''; D.bad = false;
  if (P.seated) { if (MODE === 'lesson') lessonPanel(); else modePanel(); }
}
function answer(btn, val, ok = val === D.q.ans) {
  if (D.locked) return;
  if (ok) {
    D.locked = true; D.solved = true; btn?.classList.add('btn-go');
    let line = pick(['RÄTT!', 'BRA JOBBAT!', 'SNYGGT!', 'PRECIS!']), extra = '';
    LES.results.push(D.tried ? 'ok' : 'star');
    if (!D.tried) D.streak++; else D.streak = 0;
    D.miss = 0;
    feedback(D.tried ? 'Rätt nu!' : 'Rätt på första försöket!', D.q.done + extra, 'ok'); teacherSay(line);
    const dots = panel.querySelectorAll('.sp-dots i'), n = LES.results.length; if (dots[n - 1]) dots[n - 1].className = LES.results[n - 1];
    if (Math.random() < 0.35) setTimeout(() => kidSay(rnd(0, 2), pick(CHEER)), 500);
    setTimeout(() => { if (!P.seated) return; if (LES.results.length >= 5) endLesson(); else newQ(); }, 1800);
  } else {
    if (btn) { btn.classList.add('btn-red'); btn.disabled = true; } else D.bad = true;
    D.tried = true; D.streak = 0; D.miss++;
    let line = 'NÄSTAN! LÄS LEDTRÅDEN.', extra = '';
    feedback('Inte riktigt.', D.q.hint + extra, 'no'); teacherSay(line);
  }
}
// ---------- skriva svaret på tavlan (Carl 2026-10-08) ----------
// Knapparna ligger i rutan och siffrorna/bokstäverna hamnar på tavlan, där frågetecknet stod. Inga textfält,
// så iPadens tangentbord kommer aldrig fram. Den gröna knappen Klar rättar. Uppställningar skrivs från
// entalen (höger) och åt vänster, som på papper.
const inputOf = (q) => q?.input || (typeof q?.ans === 'number' ? 'num' : null);
const ansText = (q) => (inputOf(q) === 'word' ? String(q.ans).toUpperCase() : String(q.ans));
const KEYROWS = ['QWERTYUIOPÅ', 'ASDFGHJKLÖÄ', 'ZXCVBNM'];
function keysHtml(mode) {
  const key = (c, cls = '') => `<button type="button" class="btn${cls}" data-key="${c}">${c === 'del' ? '⌫' : c === 'ok' ? '✓ Klar' : c}</button>`;
  if (mode === 'word') return `<div class="sp-kb">${KEYROWS.map((r, i) => `<div class="sp-keys">${[...r].map((c) => key(c)).join('')}${i === 2 ? key('del', ' sp-del') + key('ok', ' btn-go sp-ok') : ''}</div>`).join('')}</div>`;
  return `<div class="sp-kb"><div class="sp-keys">${[...'1234567890'].map((c) => key(c)).join('')}${mode === 'time' ? key(':') : ''}${key('del', ' sp-del')}${key('ok', ' btn-go sp-ok')}</div></div>`;
}
function parseTime(t) {
  let h, m; t = String(t);
  if (t.includes(':')) [h, m] = t.split(':').map((x) => (x === '' ? NaN : +x)); else if (t.length >= 3) { h = +t.slice(0, -2); m = +t.slice(-2); } else return null;
  return h >= 0 && h <= 24 && m >= 0 && m < 60 ? h * 60 + m : null;
}
function typeKey(k) {
  const q = D.q, mode = inputOf(q);
  if (!mode || D.locked || !P.seated || MODE !== 'lesson' || D.rast) return;
  if (k === 'ok') return submitTyped();
  if (D.bad) { D.bad = false; D.typed = ''; }
  if (k === 'del') { D.typed = q.rtl ? D.typed.slice(1) : D.typed.slice(0, -1); return; }
  const okKey = mode === 'num' ? /^\d$/ : mode === 'time' ? /^[\d:]$/ : /^[A-ZÅÄÖ]$/;
  if (!okKey.test(k) || (k === ':' && (!D.typed || D.typed.includes(':'))) || D.typed.length >= (mode === 'word' ? 14 : 5)) return;
  D.typed = q.rtl ? k + D.typed : D.typed + k;
}
function submitTyped() {
  const q = D.q, mode = inputOf(q), t = D.typed;
  if (!t || D.bad) return;
  const norm = (w) => String(w).trim().toUpperCase();
  const ok = mode === 'num' ? +t === q.ans : mode === 'time' ? (q.accept || [parseTime(q.ans)]).includes(parseTime(t)) : [q.ans, ...(q.accept || [])].some((w) => norm(w) === norm(t));
  answer(null, null, ok);
}
// tangentbordet på datorn gör samma sak som knapparna
window.addEventListener('keydown', (e) => {
  if (MODE !== 'lesson' || !P.seated || modalUp() || SHOP || D.rast || !inputOf(D.q) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (k === 'Enter') typeKey('ok'); else if (k === 'Backspace') typeKey('del'); else if (/^[0-9:A-ZÅÄÖ]$/.test(k)) typeKey(k); else return;
  e.preventDefault();
});
const starIco = '<span class="sk-star" aria-label="stjärnor"></span>';
function endLesson() {
  const firstTry = LES.results.filter((r) => r === 'star').length, earned = 1 + (firstTry >= 3 ? 1 : 0) + (firstTry === 5 ? 1 : 0);
  const kr = earned * KR_PER_STJARNA;
  const { L, i: li, key } = levelOf(D.tab), bk = (D.best[key] ||= {}), better = earned > (bk[li] | 0);
  bk[li] = Math.max(bk[li] | 0, earned);
  STARS += earned; G.money += kr; LESSONS++; D.rast = true; doorGlow = true; save(); updatePill();
  loadShops().catch(() => {});
  panel.hidden = true;
  teacherSay(`RAST! DU FICK ${earned} ${earned > 1 ? 'STJÄRNOR' : 'STJÄRNA'}, {P}.`);
  setTimeout(() => kidSay(rnd(0, 2), pick(RAST_LINES)), 1200);
  openModal('🔔 Rast!', `<div class="who"><div class="sk-face"></div><div><p class="sk-big">${firstTry} av 5 rätt på första försöket.</p><p>Du fick <b>${earned} ${starIco}</b> och varje stjärna blir ${KR_PER_STJARNA} kr: <b>${fmt(kr)}</b> i plånboken. Nu har du ${fmt(G.money)}.</p><p>Nivå ${li}, ${esc(L[li - 1].name)}: ${starsHtml(bk[li])}${better ? ' <b>Nytt rekord!</b>' : ''}</p><p class="sp">Galleria Stjärnan ligger bakom den blå dörren bredvid ${esc(TEACHER.name)}: kläder, skor, leksaker och möbler på tre våningar.</p></div></div>`, [
    { label: 'En lektion till', onClick: () => { closeModal(); D.rast = false; LES = { results: [] }; newQ(); teacherSay('EN LEKTION TILL? VAD BRA, {P}!'); } },
    ...(li < L.length ? [{ label: `Nästa nivå: ${L[li].name}`, onClick: () => { closeModal(); D.rast = false; D.lvl[key] = li + 1; save(); LES = { results: [] }; newQ(); teacherSay(`NIVÅ ${li + 1}: ${L[li].name.toUpperCase()}!`); } }] : []),
    { label: 'Gå till gallerian', cls: 'btn-go', onClick: () => { closeModal(); standUp(); goGalleria(); } },
  ]);
  const face = document.querySelector('#modal .sk-face'); if (face) face.append(portrait(myLook(), '#d8cdb8'));
}

// ================= gallerians inredning och folk =================
// Carl 2026-10-06: "mycket mer detaljer … folk, glasstånd, folk som går runt, soptunnor, växter, stora
// fönster man ser ut igenom … precis som en galleria". Föremålen är stadens egna (city/props.js
// createProps): samma instanser som i Pixelstaden, flyttade på plats (translate) – glasståndet med
// glassmenyn och parasollborden, fontänen, parkbänkarna, krukorna, papperskorgarna, träden i galler,
// gunghästen och kaffevagnen. Genom trapphusets glasvägg syns staden (utsikt.js).
const PENV = { t: 0, hour: 12, dark: 0, day: 1, weather: { season: 'sommar', wind: 0 }, people: [] };
let PROPS = null;
function propsLib() {
  if (!PROPS && SHOPLIB?.propsMod) { try { PROPS = SHOPLIB.propsMod.createProps(PENV); } catch (e) { console.error('stadens föremål:', e); PROPS = { items: () => [], update() {} }; } }
  return PROPS;
}
const propNear = (k, x, y) => propsLib().items().filter((i) => i.kind === k).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0] || null;
// en våningsplan: [sort, stadens x, y (vilket exemplar), gallerians x, y, hinder [b, h] (null = inget)]
const DECOR = {
  0: [['kruka', 178, 193, 74, GBASE + 6, [12, 6]], ['blomlåda', 36, 193, 120, GBASE + 4, [32, 6]], ['bänk', 718, 195, 112, GBASE + 70, [30, 6]], ['papperskorg', 1168, 213, 146, GBASE + 72, [8, 4]],
    ['fontän', 934, 379, 420, GBASE + 54, [64, 32]], ['bänk', 718, 195, 300, GBASE + 72, [30, 6]], ['bänk', 1480, 195, 470, GBASE + 76, [30, 6]],
    ['papperskorg', 1168, 213, 386, GBASE + 74, [8, 4]], ['papperskorg', 560, 301, 772, GBASE + 74, [8, 4]],
    ['blomlåda', 114, 193, 416, GBASE + 4, [32, 6]], ['blomlåda', 648, 193, 496, GBASE + 4, [32, 6]], ['kruka', 242, 193, 586, GBASE + 6, [12, 6]]],
  1: [['kruka', 178, 193, 178, GBASE + 6, [12, 6]], ['papperskorg', 1168, 213, 340, GBASE + 72, [8, 4]],
    ['bänk', 718, 195, 252, GBASE + 72, [30, 6]], ['bänk', 1480, 195, 486, GBASE + 74, [30, 6]],
    ['blomlåda', 36, 193, 630, GBASE + 4, [32, 6]], ['kruka', 242, 193, 410, GBASE + 6, [12, 6]], ['kruka', 566, 193, 590, GBASE + 6, [12, 6]],
    ['papperskorg', 560, 301, 700, GBASE + 74, [8, 4]], ['lind', 1066, 213, 598, GBASE + 68, [20, 8]]],
  2: [['gunghäst', 1094, 455, 56, GBASE + 50, [22, 8]], ['gunghäst', 1094, 455, 100, GBASE + 66, [22, 8]], ['kruka', 178, 193, 178, GBASE + 6, [12, 6]],
    ['kaffevagn', 2318, 346, 230, GBASE + 28, [36, 10]], ['kafébord', 975, 201, 282, GBASE + 52, [30, 8]], ['kafébord', 1040, 201, 330, GBASE + 68, [30, 8]], ['kafébord', 975, 201, 232, GBASE + 70, [30, 8]],
    ['kruka', 242, 193, 334, GBASE + 6, [12, 6]], ['kruka', 566, 193, 594, GBASE + 6, [12, 6]], ['papperskorg', 1168, 213, 398, GBASE + 30, [8, 4]],
    ['blomlåda', 648, 193, 424, GBASE + 4, [32, 6]], ['papperskorg', 560, 301, 592, GBASE + 74, [8, 4]]],
};
// egna saker (inte stadens): myntkikarna vid glasväggen högst upp
const OWN_DECOR = { 2: [{ kind: 'kikare', x: 300, y: GBASE + 10, blk: [8, 4] }, { kind: 'kikare', x: 568, y: GBASE + 10, blk: [8, 4] }] };
const GLASS_AT = { floor: 0, x: 558, y: GBASE + 52 };   // glasståndet med menyn, ett bord och bänken (samma förskjutning)
function floorDecor(f) {
  if (f.decor) return f.decor;
  const L = propsLib(); if (!L) return [];
  const out = [];
  for (const [k, cx, cy, x, y, blk] of DECOR[f.n] || []) { const it = propNear(k, cx, cy); if (it) out.push({ it, x, y, blk, kind: k }); }
  for (const d of OWN_DECOR[f.n] || []) out.push({ ...d, own: true });
  if (f.n === GLASS_AT.floor) {
    const g = propNear('glasstånd', 412, 453);
    if (g) for (const it of L.items()) if (/^glass/.test(it.kind) && it.x - g.x > -80 && it.x - g.x < 76 && Math.abs(it.y - g.y) < 50) {
      const x = GLASS_AT.x + (it.x - g.x), y = GLASS_AT.y + (it.y - g.y);
      out.push({ it, x, y, kind: it.kind, blk: it.kind === 'glasstånd' ? [54, 14] : it.kind === 'glassmeny' ? [44, 6] : it.kind === 'glassbord' ? [14, 6] : it.kind === 'glassbänk' ? [30, 6] : null });
    }
  }
  return (f.decor = out);
}
const decorBlocks = (f) => [...(f.decor || []).filter((d) => d.blk).map((d) => [d.x - (d.blk[0] >> 1), d.y - d.blk[1], d.x + (d.blk[0] >> 1), d.y + 1]), ...(f.units || []).flatMap((u) => unitOf(u).blocks)];
function drawKikare(c, d) {   // myntkikaren vid glaset, sedd bakifrån
  const { x, y } = d, f = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(x + a, y + b, w, h); };
  f(-3, -1, 7, 1, '#24483a'); f(-1, -12, 2, 11, '#2e5a3e'); f(1, -12, 1, 11, '#24483a');
  f(-3, -15, 6, 4, '#3a6e4c'); f(-3, -15, 6, 1, '#5a8e6c'); f(1, -13, 2, 1, '#c8a040');
  f(-5, -20, 11, 5, '#2a4a36'); f(-5, -20, 11, 1, '#4a7a5a'); f(-4, -19, 3, 3, '#1a1c22'); f(2, -19, 3, 3, '#1a1c22'); f(-4, -19, 1, 1, '#9aa0a8'); f(2, -19, 1, 1, '#9aa0a8');
}
const drawDecor = (c, d) => { if (d.own) return drawKikare(c, d); c.save(); c.translate(d.x - d.it.x, d.y - d.it.y); try { d.it.draw(c); } catch (e) { console.error(d.kind, e); d.it = { ...d.it, draw() {} }; } c.restore(); };

// ---------- utsikten genom glasväggen (utsikt.js) och småbutikerna (smabutiker.js) ----------
// Horisonten ligger i ögonhöjd på alla våningar; högre upp hamnar kvarteren (mid = deras marklinje)
// och hustaken närmast (near) längre ner i glaset, och himlen blir större.
const GL = { x0: TRAP.x0, x1: TRAP.x1, y0: 8, y1: GBASE - 6 };
const VIEWP = [
  { hz: 104, mid: 104, near: null, cloudY: [10, 50] },
  { hz: 100, mid: 132, near: 106, cloudY: [10, 72] },
  { hz: 104, mid: 152, near: 110, cloudY: [12, 86] },
];
const VIEWS = {};
let VIEW_ERR = false;
const viewOf = (f) => (VIEWS[f.n] ||= makeView({ n: f.n, w: f.w, viewW: W, ...GL, ...VIEWP[f.n] }));
const unitOf = (u) => (u.art ||= makeUnit(u, GBASE));
function unitClick(u) {   // gå fram till butiken: expediten svarar (fotoautomaten blixtrar, bankomaten visar pengarna)
  const U = unitOf(u), [ax, ay] = U.spot;
  walkTo(ax, ay, () => {
    if (!near(ax, ay)) return;
    P.dir = 'up';
    const d = U.d;
    if (d.atm) { say('u', { x: u.x + (u.w >> 1), y: GBASE - 70 }, null, `DU HAR ${fmt(G.money)} I PLÅNBOKEN.`); return; }
    if (d.booth) U.flash = performance.now() / 1000;
    U.line = ((U.line ?? -1) + 1) % d.lines.length;
    say('u', { x: U.keeper ? U.keeper.x : u.x + (u.w >> 1), y: GBASE - (U.keeper ? 46 : 64) }, null, d.lines[U.line]);
  });
}
// banderoller som hänger från taket i trapphuset
function paintBanners(c, f) {
  const B = f.n === 0 ? [['VÄLKOMMEN', '#d83a4a', 186]] : f.n === 1 ? [['NYA SKOR', '#2a8a4a', 186], ['HÖSTMODE', '#d87a1a', 532]] : [['LEKSAKER', '#8e5bd1', 186], ['FIKA', '#d83a4a', 548]];
  for (const [s, col, x] of B) {
    const w = textW(SMALL, s) + 10;
    c.fillStyle = '#6a7078'; c.fillRect(x + 2, 7, 1, 41); c.fillRect(x + w - 3, 7, 1, 41);
    c.fillStyle = col; c.fillRect(x, 48, w, 22); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, 69, w, 1);
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, 48, w, 1);
    for (let k = 0; k < w; k += 4) { c.fillStyle = col; c.fillRect(x + k, 70, 2, 2); }
    ctxText(c, SMALL, s, x + 5, 56, '#ffffff');
  }
}

// ---------- folket ----------
// Shoppare som går mellan butiksfönster, bänkar, glasståndet, fontänen och fönstren, sitter en stund,
// tittar i skyltfönster och ibland åker rulltrappan (och nya kommer upp ur schaktet).
const BAG_COLS = ['#d83a4a', '#3a7bd5', '#f0b429', '#46a35a', '#8e5bd1', '#f28bb3', '#2b2b30'];
function shopperLook() {
  const kid = Math.random() < 0.3, L = { ...makeLookRich(), kid, phones: false };
  if (Math.random() < 0.45) { L.bag = 'shoppingBag'; L.bagColor = pick(BAG_COLS); }
  return cleanLook(L);
}
const GUARD_LOOK = () => cleanLook({ skin: '#c99a76', hair: '#2a1d1a', style: 'short', top: 'police', shirt: '#2d3a5c', accent: '#f0b429', bottom: 'pants', pants: '#1e2433', shoes: '#1c1c1c', hat: 'cap', cap: '#1e2433', kid: false });
function spotsOf(f) {   // ställen folk går till: [x, y, sätt ('look' | 'sit' | 'stand' | 'up'), riktning]
  const S = [];
  for (const h of f.houses || []) S.push([h.door.x - 22, GBASE + 8, 'look', 'up'], [h.door.x + 22, GBASE + 8, 'look', 'up'], [h.door.x, GBASE + 7, 'enter', 'up']);
  for (const d of f.decor || []) {
    if (d.kind === 'bänk') for (const sx of [-7, 6]) if (!(d.taken ||= {})[sx]) S.push([d.x + sx, d.y + 7, 'sit', 'down', { d, sx }]);
    if (d.kind === 'fontän') S.push([d.x - 40, d.y, 'stand', 'right'], [d.x + 40, d.y, 'stand', 'left'], [d.x, d.y + 12, 'stand', 'up']);
    if (d.kind === 'glasstånd') S.push([d.x, d.y + 10, 'stand', 'up'], [d.x - 12, d.y + 16, 'stand', 'up']);
    if (d.kind === 'kaffevagn') S.push([d.x, d.y + 12, 'stand', 'up']);
    if (d.kind === 'kikare') S.push([d.x, d.y + 7, 'stand', 'up']);
  }
  for (let x = GL.x0 + 14; x < GL.x1 - 8; x += 26) if (!(f.upE && x > ESC.up - 12 && x < ESC.up + 142) && !(x > LIFT_X - 14 && x < LIFT_X + 42)) S.push([x, GBASE + 8, 'look', 'up']);   // vid glasväggen
  for (const u of f.units || []) { const U = unitOf(u); S.push([U.spot[0], U.spot[1], 'look', 'up']); if (U.keeper) S.push([U.spot[0], GBASE + 7, 'enter', 'up']); }
  if (f.upE) S.push([f.upE.lx - 10, f.upE.ly, 'ride', 'right']);
  for (let i = 0; i < 6; i++) S.push([40 + Math.random() * (f.w - 80), GBASE + 14 + Math.random() * 60, 'stand', pick(['down', 'left', 'right'])]);
  return S;
}
const CROWD = {};
function npcPlace(n) { for (let k = 0; k < 40; k++) { const x = 20 + Math.random() * (FL().w - 40), y = GBASE + 10 + Math.random() * 66; if (freeAt(x, y)) { n.x = x; n.y = y; return true; } } return false; }
function crowdFor(f) {
  if (CROWD[f.n]) return CROWD[f.n];
  const list = [], N = f.n === 0 ? 9 : 8;
  for (let i = 0; i < N; i++) { const n = { look: shopperLook(), x: 0, y: 0, dir: 'down', path: [], dist: 0, mode: 'idle', t: Math.random() * 3, speed: 26 + Math.random() * 16 }; if (npcPlace(n)) list.push(n); }
  if (f.n === 0) list.push({ look: GUARD_LOOK(), x: 84, y: GBASE + 12, dir: 'down', path: [], dist: 0, mode: 'post', t: 0, speed: 24 });   // väktaren vid skoldörren
  return (CROWD[f.n] = list);
}
function npcGo(n, f) {
  const S = spotsOf(f), s = pick(S);
  const p = findPath(n.x, n.y, s[0], s[1]);
  if (!p || !p.length) { n.mode = 'idle'; n.t = 1 + Math.random() * 2; return; }
  n.path = p; n.mode = 'walk'; n.spot = s;
}
function crowdTick(dt) {
  const f = FL(), list = crowdFor(f);
  for (const n of [...list]) {
    if (n.mode === 'post') { n.t += dt; n.dir = Math.sin(n.t * 0.4) > 0.7 ? 'right' : 'down'; continue; }
    if (n.mode === 'walk') {
      const [tx, ty] = n.path[0], dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy), step = n.speed * dt;
      if (Math.abs(dx) > Math.abs(dy) + 0.5) n.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.5) n.dir = dy > 0 ? 'down' : 'up';
      if (d <= step) { n.x = tx; n.y = ty; n.path.shift(); n.dist += d; } else { n.x += dx / d * step; n.y += dy / d * step; n.dist += step; }
      if (!n.path.length) {
        const s = n.spot || [];
        if (s[2] === 'ride' && f.upE) {   // åker rulltrappan upp och försvinner; en ny kommer in senare
          list.splice(list.indexOf(n), 1); f.upE.riders.push({ look: n.look, d: -8, v: 1 }); setTimeout(() => respawn(f), 5000 + Math.random() * 6000); continue;
        }
        if (s[2] === 'enter') { list.splice(list.indexOf(n), 1); setTimeout(() => respawn(f, s), 4000 + Math.random() * 8000); continue; }   // in i butiken
        if (s[2] === 'sit' && s[4] && !s[4].d.taken[s[4].sx]) { n.seat = s[4]; s[4].d.taken[s[4].sx] = true; n.back = [n.x, n.y]; n.x = s[4].d.x + s[4].sx; n.y = s[4].d.y + 1; }
        n.mode = n.seat ? 'sit' : 'idle'; n.dir = s[3] || 'down'; n.t = n.seat ? 6 + Math.random() * 8 : 2 + Math.random() * 4;
      }
      continue;
    }
    n.t -= dt;
    if (n.t <= 0) { if (n.seat) { n.seat.d.taken[n.seat.sx] = false; n.seat = null; [n.x, n.y] = n.back; } npcGo(n, f); }
  }
  // rulltrapporna: åkarna glider längs trappan; neråt-trappan släpper upp nya ur schaktet
  for (const e of [f.upE, f.dnE]) if (e) for (const r of [...e.riders]) {
    r.d += r.v * RIDE_V * dt;
    if (r.v > 0 && r.d >= e.run) e.riders.splice(e.riders.indexOf(r), 1);
    if (r.v < 0 && r.d <= -12) { e.riders.splice(e.riders.indexOf(r), 1); const n = { look: r.look, x: e.lx - e.sx * 12, y: e.ly, dir: 'down', path: [], dist: 0, mode: 'idle', t: 0.5, speed: 30 + Math.random() * 12 }; list.push(n); }
  }
  if (f.dnE && Math.random() < dt / 9 && f.dnE.riders.length < 2 && list.length < 12) f.dnE.riders.push({ look: shopperLook(), d: f.dnE.run, v: -1 });
}
function respawn(f, at) {   // någon kommer ut ur en butik eller in genom entrén
  const list = CROWD[f.n]; if (!list || list.length > 11) return;
  const h = at ? null : pick(f.houses?.length ? f.houses : [null]);
  const x = at ? at[0] : h ? h.door.x : (f.school ? 38 : 60), n = { look: at ? shopperLook() : shopperLook(), x, y: GBASE + 9, dir: 'down', path: [], dist: 0, mode: 'idle', t: 0.4, speed: 28 + Math.random() * 14 };
  list.push(n);
}
const drawNpc = (c, n, t) => drawPerson(c, Math.round(n.x), Math.round(n.y), n.look, n.dir, n.mode === 'walk' ? WALK_SEQ[Math.floor(n.dist / 7.3) % 4] : n.mode === 'sit' ? 5 : (Math.sin(t * 2 + n.x) > 0.93 ? 4 : 0));

// ================= gallerian: rulltrappor, hiss och butikerna =================
function goGalleria() {
  if (P.scene !== 'klass') return goScene('galleria', P.scene);
  walkTo(DOOR.ax, DOOR.ay, () => { if (near(DOOR.ax, DOOR.ay)) goScene('galleria', 'klass'); });
}
// Åkturen (som i Möbeljätten): { kind: 'esc', e, d, v, onEnd } – d = sträckan längs trappan (< 0 = på
// påstigningsplåten), v = +1 bort från påstigningen, −1 mot den – eller { kind: 'lift', st, t, to }.
let RIDE = null;
const RIDE_V = 40;
const LIFT_T = { open: 0.45, in: 0.5, close: 0.4, move: 1.3, out: 0.5 };
function startEsc(e, fromTop, onEnd) { P.path = []; RIDE = { kind: 'esc', e, d: fromTop ? e.run : -8, v: fromTop ? -1 : 1, onEnd }; }
function switchFloor(n) {
  FLOOR = n; BUBS = []; hover = null; fadeT = performance.now();
  buildGrid(); updatePill(); renderBelow();
}
function rideUp() {   // rulltrappan uppåt (genom bjälken) → upp ur schaktet på våningen ovanför
  const f = FL(), e = f.upE; if (!e || RIDE) return;
  walkTo(e.lx - 10, e.ly, () => {
    if (!near(e.lx - 10, e.ly)) return;
    startEsc(e, false, () => { switchFloor(f.n + 1); const e2 = FL().dnE; P.x = e2.lx; P.y = e2.ly; startEsc(e2, true); });
  });
}
function rideDown() {   // rulltrappan neråt (ner i schaktet) → ner genom taket på våningen under
  const f = FL(), e = f.dnE; if (!e || RIDE) return;
  walkTo(e.lx + 10, e.ly, () => {
    if (!near(e.lx + 10, e.ly)) return;
    startEsc(e, false, () => { switchFloor(f.n - 1); const e2 = FL().upE; P.x = e2.lx; P.y = e2.ly; startEsc(e2, true); });
  });
}
function liftDialog() {
  const f = FL();
  walkTo(LIFT_X + 13, GBASE + 9, () => {
    if (!near(LIFT_X + 13, GBASE + 9)) return;
    P.dir = 'up';
    const btn = (g) => ({ label: `${g.n} · ${g.n === 0 ? 'Entré' : g.shops.map((h) => h.label.charAt(0) + h.label.slice(1).toLowerCase()).join(' och ')}`, cls: g.n === f.n ? '' : 'btn-go', onClick: () => { closeModal(); if (g.n !== f.n) { P.path = []; RIDE = { kind: 'lift', st: 'open', t: 0, to: g.n }; } } });
    openModal('🛗 Hissen', '<p>Vilken våning vill du åka till?</p>', [...FLOORS].reverse().map(btn));
  });
}
function rideTick(dt) {
  const R = RIDE;
  if (R.kind === 'esc') {
    R.d += R.v * RIDE_V * dt;
    if (R.v > 0 && R.d >= R.e.run) { RIDE = null; R.onEnd?.(); }
    else if (R.v < 0 && R.d <= -12) { RIDE = null; P.x = R.e.lx - R.e.sx * 12; P.y = R.e.ly; P.dir = 'down'; }
    else { const [x, y] = R.d < 0 ? [R.e.lx + R.e.sx * R.d, R.e.ly] : SHOPLIB.tr.escPos(R.e, R.d); P.x = x; P.y = y; }
    return;
  }
  const L = FL().lift, T = LIFT_T, cabY = GBASE - 1, outY = GBASE + 9;
  R.t += dt; P.x = LIFT_X + 13;
  const next = (st) => { R.st = st; R.t = 0; };
  if (R.st === 'open') { L.open = Math.min(1, R.t / T.open); if (R.t >= T.open) next('in'); }
  else if (R.st === 'in') { P.y = outY + (cabY - outY) * Math.min(1, R.t / T.in); P.dir = 'up'; if (R.t >= T.in) { P.dir = 'down'; next('close'); } }
  else if (R.st === 'close') { L.open = Math.max(0, 1 - R.t / T.close); if (R.t >= T.close) next('move'); }
  else if (R.st === 'move') { if (R.t >= T.move) { switchFloor(R.to); P.x = LIFT_X + 13; P.y = cabY; FL().lift.open = 0; next('open2'); } }
  else if (R.st === 'open2') { L.open = Math.min(1, R.t / T.open); if (R.t >= T.open) next('out'); }
  else if (R.st === 'out') { P.y = cabY + (outY - cabY) * Math.min(1, R.t / T.out); if (R.t >= T.out) next('close2'); }
  else if (R.st === 'close2') { L.open = Math.max(0, 1 - R.t / T.close); if (R.t >= T.close) RIDE = null; }
}
const inLift = () => RIDE?.kind === 'lift' && P.y <= GBASE + 1;
function drawEsc(c, e, t) {
  const T = SHOPLIB.tr, art = (e.art ||= T.escalatorArt(e));
  c.drawImage(art.back, art.x, art.y);
  c.drawImage(art.treads[Math.floor(t * RIDE_V) % T.ESC_PERIOD], art.x, art.y);
  if (e.riders.length || (RIDE?.kind === 'esc' && RIDE.e === e)) {   // åkarna (folket och figuren) klippta vid bjälken / golvkanten
    c.save(); c.beginPath();
    if (e.sy < 0) c.rect(art.x - 20, e.clip, art.w + 40, 400); else c.rect(art.x - 20, e.clip - 400, art.w + 40, 400);
    c.clip();
    for (const r of [...e.riders].sort((a, b) => T.escPos(e, Math.max(0, a.d))[1] - T.escPos(e, Math.max(0, b.d))[1])) {
      const dir = (r.v > 0 ? e.sx : -e.sx) > 0 ? 'right' : 'left';
      if (r.d < 0) drawPerson(c, Math.round(e.lx + e.sx * r.d), e.ly, r.look, dir, WALK_SEQ[Math.floor(t * 8) % 4]);
      else { const [x, y] = T.escPos(e, r.d); drawPerson(c, Math.round(x), Math.round(y), r.look, dir, 0); }
    }
    c.restore();
  }
  if (RIDE?.kind === 'esc' && RIDE.e === e) {   // figuren på trappan (klippt vid bjälken / golvkanten)
    c.save(); c.beginPath();
    if (e.sy < 0) c.rect(art.x - 20, e.clip, art.w + 40, 400); else c.rect(art.x - 20, e.clip - 400, art.w + 40, 400);
    c.clip();
    const dir = (RIDE.v > 0 ? e.sx : -e.sx) > 0 ? 'right' : 'left';
    drawPerson(c, P.x, P.y, myLook(), dir, RIDE.d < 0 ? WALK_SEQ[Math.floor(t * 8) % 4] : 0);
    c.restore();
  }
  c.drawImage(art.front, art.x, art.y);
  if (e.sy > 0) { e.pf ||= T.pitFrontImg(e.pit[1] - e.pit[0] + 2); c.drawImage(e.pf, e.pit[0] - 1, e.pit[3] - 1); }
}
function drawLift(c, t) {
  const T = SHOPLIB.tr, L = FL().lift, x = L.x, y = L.fy - T.LIFT_H;
  L.cab ||= T.liftCabImg(); L.door ||= T.liftDoorImg();
  c.save(); c.beginPath(); c.rect(x, y, T.LIFT_W, T.LIFT_H); c.clip();
  if (L.open > 0 || inLift()) {
    c.drawImage(L.cab, x, y);
    if (inLift()) drawPerson(c, P.x, P.y, myLook(), P.dir, RIDE.st === 'in' || RIDE.st === 'out' ? WALK_SEQ[Math.floor(t * 8) % 4] : 0);
  }
  const o = Math.round(L.open * 13);
  c.drawImage(L.door, x - o, y);
  c.save(); c.translate(x + T.LIFT_W + o, y); c.scale(-1, 1); c.drawImage(L.door, 0, 0); c.restore();
  c.restore();
  const R = RIDE?.kind === 'lift' ? RIDE : null, f = FL();
  T.drawLiftIndicator(c, x, L.fy, R && R.st === 'move' && R.t > LIFT_T.move / 2 ? R.to : f.n, R && R.st === 'move' ? (R.to > f.n ? 'U' : 'D') : null, !!R);
}

// ---------- Snabbfilens butiksscener: samma A-objekt som main.js ger dem ----------
// A.game = plånboken/garderoben (G), A.avatar = din figur, A.go('city') = ut genom butikens dörr.
let SHOP = null;   // { id, scene } när man är inne i en butik
const A = {
  W, H, pxs: 1, roomSub: 0, game: G, avatar: null, scene: null, sceneName: '',
  view: { w: W, h: H, boxX: 0, boxY: 0, boxed: false, safe: { x0: 0, y0: 0, x1: W, y1: H }, crop: null },
  go(name) { if (name === 'city') { if (SHOP) leaveShop(); return; } if (SHOPLIB?.make[name]) enterShop(name); },
  worldFolksHere: () => [], hasScene: (n) => !!SHOPLIB?.make[n], worldInfo: () => ({ online: 0 }), playersList: () => [],
};
window.SF = A;   // Snabbfilens moduler läser spelet härifrån (musiken väljer låt efter A.sceneName)
const musicScene = () => { if (!SHOP) A.sceneName = P.scene === 'galleria' ? 'mat' : 'room'; };
function enterShop(id) {
  if (!SHOPLIB?.make[id]) return;
  A.avatar = cleanAvatar({ ...ME }); A.game = G; A.pxs = scale; A.sceneName = id;
  panel.hidden = true; homePanel.hidden = true; BUBS = []; hover = null; RIDE = null;
  try { SHOP = { id, scene: null, t0: performance.now() }; SHOP.scene = A.scene = SHOPLIB.make[id](A, {}); SHOP.scene.enter?.(); }
  catch (e) { console.error(`butiken ${id}:`, e); SHOP = null; A.scene = null; toast('🚪 Butiken gick inte att öppna just nu.', 'bad'); return; }
  fadeT = performance.now(); updatePill(); renderBelow();
}
function leaveShop() {
  const id = SHOP.id;
  try { SHOP.scene.exit?.(); } catch (e) { console.error(e); }
  SHOP = null; A.scene = null; A.sceneName = '';
  if (A.avatar?.look && A.avatar.look !== ME.look) ME = cleanAvatar({ ...ME, look: A.avatar.look });   // kläderna man tog på i butiken
  save();
  goScene('galleria', 'shop:' + id);
  LEFT = { id, until: performance.now() + 1500 };
  setTimeout(() => { shopTap = false; }, 400);   // (gick man ut utan klick ska nästa klick i gallerian fungera)
}

// ---------- ditt rum: möblerna från Möbeljätten (Snabbfilens förråd G.storage) ----------
const homePanel = $('decor-panel');
function furnIcon(it) {
  const a = furnOf(it), c = document.createElement('canvas');
  if (!a) { c.width = c.height = 1; return c; }
  c.width = a.sw; c.height = a.sh; SHOPLIB.room.drawArt(c.getContext('2d'), a, 0, 0); return c;
}
function homeStore() {
  if (P.scene !== 'hem' || SHOP) { homePanel.hidden = true; return; }
  const store = SHOPLIB ? G.storage : [];
  const nm = (it) => esc(SHOPLIB.room.nameOf(it.k));
  homePanel.innerHTML = `<div class="dp-head">Förrådet</div><div id="decor-storage">${store.length ? store.map((it, i) => `<button type="button" class="dp-item${placing === i ? ' on' : ''}" data-place="${i}"><span class="sk-ico" data-ico="${i}"></span><span>${nm(it)}<small>${placing === i ? (isWallFurn(it.k) ? 'klicka på väggen' : 'klicka på golvet') : 'ställ ut'}</small></span></button>`).join('') : `<div class="dp-empty">${SHOPLIB ? 'Tomt. Möbler från Möbeljätten i gallerian hamnar här.' : 'Laddar …'}</div>`}</div>${PLACED.length ? '<div class="dp-foot"><small>Klicka på en möbel i rummet för att flytta den.</small></div>' : ''}`;
  homePanel.querySelectorAll('[data-ico]').forEach((s) => s.append(furnIcon(store[+s.dataset.ico])));
  homePanel.querySelectorAll('[data-place]').forEach((b) => (b.onclick = () => { const i = +b.dataset.place; placing = placing === i ? null : i; homeStore(); }));
  homePanel.hidden = false;
}
function canPlace(it, x, y) {
  const r = FP({ ...it, x, y }), wall = isWallFurn(it.k);
  if (r[0] < 6 || r[2] > 378) return false;
  if (wall) return y >= 30 && y <= WALL_Y - 6;
  if (y < 112 || y > 206) return false;
  if (isFlatFurn(it.k)) return true;
  const others = [[18, 98, 40, 135], [38, 92, 58, 110], [328, 90, 356, 102], [360, 92, 378, 106], [20, 196, 56, 215], ...PLACED.filter((p) => !isWallFurn(p.k) && !isFlatFurn(p.k)).map(FP), [P.x - 5, P.y - 3, P.x + 5, P.y + 1]];
  return !others.some((b) => r[0] <= b[2] && r[2] >= b[0] && r[1] <= b[3] && r[3] >= b[1]);
}
function placeAt(x, y) {
  const it = G.storage[placing], a = it && furnOf(it); if (!a) return;
  const px = Math.round(x - a.sw / 2), py = Math.round(y + (isWallFurn(it.k) ? a.sh / 2 : 0));
  if (!canPlace(it, px, py)) { meSay('DEN FÅR INTE PLATS DÄR.'); return; }
  G.storage.splice(placing, 1); PLACED.push({ k: it.k, v: it.v | 0, c: it.c || null, x: px, y: py });
  meSay('DÄR BLEV DET FINT!'); placing = null; buildGrid(); save(); homeStore();
}
function pickUp(p) {
  PLACED = PLACED.filter((q) => q !== p);
  G.storage.unshift({ k: p.k, v: p.v | 0, ...(p.c ? { c: p.c } : {}) }); placing = 0;
  buildGrid(); save(); homeStore();
}

// ================= scenbyten =================
function goScene(name, from) {
  if (SHOP) { try { SHOP.scene.exit?.(); } catch (e) { console.error(e); } SHOP = null; A.scene = null; A.sceneName = ''; }
  P.scene = name; P.path = []; P.seated = false; placing = null; BUBS = []; hover = null; panel.hidden = true; RIDE = null;
  if (name === 'galleria') {
    const shop = /^shop:/.test(from || '') ? from.slice(5) : null;
    if (shop) { FLOOR = Math.max(0, floorOfShop(shop)); const h = FL().houses?.find((x) => x.id === shop); [P.x, P.y] = [h ? h.door.x : 100, GBASE + 12]; P.dir = 'down'; }
    else if (from === 'hem') { FLOOR = 0; [P.x, P.y] = [(FLOORS[0].home[0] + FLOORS[0].home[1]) >> 1, GBASE + 12]; P.dir = 'down'; }
    else { FLOOR = 0; [P.x, P.y] = [38, GBASE + 12]; P.dir = 'down'; }
    loadShops().then(() => { if (P.scene === 'galleria') { buildGrid(); updatePill(); } }).catch(() => {});
  } else if (name === 'hem') { [P.x, P.y] = [40, 200]; P.dir = 'up'; loadShops().then(() => homeStore()).catch(() => {}); }
  else { [P.x, P.y] = from ? [DOOR.ax, 128] : [220, 210]; P.dir = from ? 'down' : 'up'; }
  buildGrid(); fadeT = performance.now();
  if (name === 'klass' && from) setTimeout(() => { if (P.scene === 'klass') kidSay(rnd(0, 6), 'VÄLKOMMEN TILLBAKA, {P}!'); }, 600);
  homeStore(); updatePill(); renderBelow(); musicScene();
}
function updatePill() {
  $('sk-where').textContent = SHOP ? SHOPLABEL[SHOP.id] : P.scene === 'klass' ? `${LABEL.klass} ${KLASS}` : P.scene === 'galleria' ? `GALLERIA · PLAN ${FLOOR}` : LABEL[P.scene];
  $('sk-stars').textContent = STARS; $('sk-kr').textContent = fmt(G.money);
}

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
  } else if (s === 'galleria') {
    if (RIDE || !SHOPLIB) return null;
    const f = FL();
    if (f.school && x >= f.school[0] - 4 && x <= f.school[1] + 4 && y >= GBASE - 48 && y <= GBASE + 10) return { t: 'exit', to: 'klass', at: [(f.school[0] + f.school[1]) >> 1, GBASE + 8], label: 'TILL SKOLAN' };
    if (f.home && x >= f.home[0] - 4 && x <= f.home[1] + 4 && y >= GBASE - 48 && y <= GBASE + 10) return { t: 'exit', to: 'hem', at: [(f.home[0] + f.home[1]) >> 1, GBASE + 8], label: 'HEM' };
    if (x >= LIFT_X - 6 && x <= LIFT_X + 40 && y >= GBASE - 56 && y <= GBASE + 8) return { t: 'lift', label: 'HISSEN' };
    if (f.upE && x >= ESC.up - 20 && x <= ESC.up + 130 && y >= SLAB_Y - 8 && y <= f.upE.ly + 6) return { t: 'up', label: `RULLTRAPPA UPP TILL PLAN ${f.n + 1}` };
    if (f.dnE && x >= f.dnE.pit[0] && x <= ESC.down + 22 && y >= f.dnE.pit[2] - 16 && y <= f.dnE.pit[3] + 4) return { t: 'down', label: `RULLTRAPPA NER TILL PLAN ${f.n - 1}` };
    for (const u of f.units || []) if (x >= u.x && x <= u.x + u.w && y >= GBASE - UNIT_H - 2 && y <= GBASE + 6) return { t: 'unit', u, label: UNITS[u.id].label };
    for (const h of f.houses || []) if (x >= h.x - 4 && x <= h.x + h.w + 4 && y >= GBASE - 120 && y <= GBASE + 6) return { t: 'house', h, label: h.label };
    if (y >= GBASE + 4) return { t: 'floor' };
  } else {
    if (x >= 18 && x <= 60 && y >= 194) return { t: 'exit', to: 'klass', at: [40, 206] };
    if (placing != null) return y >= 24 ? { t: 'put' } : null;
    for (const p of [...PLACED].reverse()) { const a = furnOf(p); if (a && x >= p.x && x <= p.x + a.sw && y >= p.y - a.sh && y <= p.y + 1) return { t: 'pickup', p }; }
    if (x >= WARDROBE.x0 && x <= WARDROBE.x1 && y >= WARDROBE.y0 && y <= WARDROBE.y1 + 6) return { t: 'wardrobe' };
    if (y >= 108) return { t: 'floor' };
  }
  return null;
}
// skärmen → världen (gallerian är bredare än bilden: kameran camX)
const toScreen = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
const toWorld = (e) => { const [x, y] = toScreen(e); return [x + camX, y]; };
// i en butik får butiksscenen pekaren (down/move/up i spelpixlar) och tangenterna, som i spelet
// En tryckning som börjar i en butik hör till butiken. Står man redan på dörrmattan går man ut direkt när man
// trycker på dörren – och klicket som webbläsaren skickar efteråt fick då inte landa på butikens fasad i
// gallerian (då gick figuren rakt in igen).
// Barn trycker gärna två gånger: i gallerian står butikens fasad precis där dörren UT låg inne i butiken, så
// det andra trycket gick rakt in igen (Carl 2026-10-08). Strax efter att man gått ut leder ett tryck på samma
// butik därför några steg ut i gallerian i stället (LEFT), och de första 0,5 sekunderna inne i en butik räknas
// inte (då kunde ett dubbeltryck på fasaden trycka på dörren UT direkt).
let shopTap = false, LEFT = null;
cv.addEventListener('pointerdown', (e) => { shopTap = !!SHOP; if (!SHOP || modalUp() || performance.now() - SHOP.t0 < 500) return; const [x, y] = toScreen(e); try { cv.setPointerCapture(e.pointerId); } catch { /* ok */ } SHOP.scene.down?.(x, y); });
cv.addEventListener('pointermove', (e) => { if (!SHOP || modalUp()) return; const [x, y] = toScreen(e); SHOP.scene.move?.(x, y); });
cv.addEventListener('pointerup', (e) => { if (!SHOP || modalUp() || performance.now() - SHOP.t0 < 500) return; const [x, y] = toScreen(e); SHOP.scene.up?.(x, y); });
window.addEventListener('keydown', (e) => {
  if (!SHOP || modalUp() || e.ctrlKey || e.altKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
  SHOP.scene.key?.(e.key);
});
cv.addEventListener('mousemove', (e) => { if (SHOP) return; const [x, y] = toWorld(e); mouse = [x, y]; const h = ME && !modalUp() ? hit(x, y) : null; hover = h && (h.t === 'kid' || h.t === 'teacher' || h.label) ? h : null; cv.style.cursor = h ? 'pointer' : 'default'; });
cv.addEventListener('mouseleave', () => { mouse = null; hover = null; });
cv.addEventListener('click', (e) => {
  if (shopTap) { shopTap = false; return; }
  if (SHOP || !ME || modalUp()) return;
  const [x, y] = toWorld(e), h = hit(x, y); if (!h) return;
  if (h.t === 'seat') goSit();
  else if (h.t === 'teacher') teacherSay(P.seated ? 'TITTA PÅ TAVLAN, {P}!' : D.rast ? 'DET ÄR RAST! GALLERIAN ÄR BAKOM DÖRREN.' : 'SÄTT DIG I DEN LEDIGA BÄNKEN SÅ BÖRJAR VI.');
  else if (h.t === 'kid') kidSay(h.i, pick(D.rast ? RAST_LINES : P.seated ? LESSON_LINES : FREE_LINES));
  else if (h.t === 'board') teacherSay(P.seated ? 'SVARA I RUTAN, {P}!' : 'UPPGIFTEN KOMMER NÄR DU SITTER.');
  else if (h.t === 'door') { if (P.seated) standUp(); goGalleria(); }
  else if (h.t === 'house' && LEFT && LEFT.id === h.h.id && performance.now() < LEFT.until) walkTo(h.h.door.x, GBASE + 34);   // nyss ute: några steg ut i gallerian
  else if (h.t === 'house') { const hx = h.h.door.x, hy = GBASE + 7; walkTo(hx, hy, () => { if (near(hx, hy)) { P.dir = 'up'; setTimeout(() => { if (P.scene === 'galleria' && !SHOP && near(hx, hy)) enterShop(h.h.id); }, 180); } }); }
  else if (h.t === 'unit') unitClick(h.u);
  else if (h.t === 'up') rideUp();
  else if (h.t === 'down') rideDown();
  else if (h.t === 'lift') liftDialog();
  else if (h.t === 'exit') { const [ax, ay] = h.at; walkTo(ax, ay, () => { if (near(ax, ay)) goScene(h.to, P.scene); }); }
  else if (h.t === 'wardrobe') walkTo(WARDROBE.ap[0], WARDROBE.ap[1], () => { if (near(WARDROBE.ap[0], WARDROBE.ap[1])) { P.dir = 'up'; editPlayer(); } });
  else if (h.t === 'pickup') pickUp(h.p);
  else if (h.t === 'put') placeAt(x, y);
  else if (h.t === 'floor') { if (P.seated) standUp(); walkTo(x, y); }
});

// ================= figur och klass =================
// Garderoben som i spelet: din egen figur kan bara bära det du äger (basplaggen + det du köpt i gallerian).
// Kläderna du valde när du skapade figuren får du behålla. Fröken och kompisarna klär du fritt.
function grantWorn(look) {
  let n = 0;
  for (const slot of SLOTS) { const it = wornItem(look, slot); if (it && !it.free && !G.wardrobe.includes(it.id)) { G.wardrobe.push(it.id); n++; } }
  if (n) G.save();
}
const lockWardrobe = (on) => setAvatarWardrobe(on ? ownedIds : null);
function editPlayer(after) {
  saveAvatar(ME); lockWardrobe(true);
  openAvatarEditor({ onDone: (av) => { ME = cleanAvatar(av); lookChanged(); save(); after?.(); }, onCancel: () => after?.() });
}
function editOther(av, done) {
  saveAvatar(av); lockWardrobe(false);
  const back = () => { if (ME) saveAvatar(ME); lockWardrobe(true); };
  openAvatarEditor({ onDone: (nav) => { back(); done(cleanAvatar(nav)); }, onCancel: () => { back(); done(null); } });
}
function startCreator() {
  saveAvatar(newAv('', kidLook())); lockWardrobe(false);
  openAvatarEditor({ onDone: (av) => { ME = cleanAvatar(av); grantWorn(ME.look); lockWardrobe(true); lookChanged(); classDialog(); }, onCancel: () => { if (!ME) startCreator(); } });
}
function classDialog() {
  const card = (av, i, role) => `<div class="sk-kid"><div class="sk-por" data-por="${i}"></div><input type="text" maxlength="${role === 't' ? 16 : 12}" value="${esc(av.name)}" data-name="${i}" aria-label="${role === 't' ? 'Frökens namn' : `Klasskompis ${i + 1}`}" autocomplete="off" spellcheck="false"><div class="sk-btns"><button type="button" class="btn btn-small" data-edit="${i}">Ändra</button><button type="button" class="btn btn-small" data-rand="${i}">Slumpa</button></div></div>`;
  const dlg = openModal('🏫 Din klass', `<div class="sk-me"><div class="sk-por" data-por="me"></div><div><div class="sk-lbl">Din figur</div><p class="sk-big">${esc(ME?.name || '')}</p>
      <div class="sk-btns"><button type="button" class="btn btn-small" data-me="edit">✏️ Ändra</button><button type="button" class="btn btn-small" data-me="redo">↺ Gör om figuren</button></div></div></div>
    <div class="sk-lbl">Vilken årskurs går du i?</div>
    <div class="sk-grade sk-grade-s">${[2, 3].map((g) => `<button type="button" class="btn${g === D.grade ? ' btn-gold' : ''}" data-grade="${g}">Årskurs ${g}</button>`).join('')}</div>
    <div class="sk-lbl">Vilken klass går du i?</div>
    <div class="sk-klass"><input type="text" maxlength="4" value="${esc(KLASS)}" data-klass aria-label="Din klass" autocomplete="off" spellcheck="false" autocapitalize="characters"><span class="sp">Till exempel 3A eller 2B. Det står på dörren och på tavlan.</span></div>
    <p class="sp">Döp fröken och klasskompisarna. Ändra öppnar samma figurskapare som för din egen figur.</p>
    <div class="sk-lbl">Fröken</div><div class="sk-class">${card(TEACHER, 't', 't')}</div>
    <div class="sk-lbl">Klasskompisar</div><div class="sk-class">${CLASS.map((k, i) => card(k, i, 'k')).join('')}</div>`, [
    { label: '↺ Gör om figuren', onClick: () => redoFigure() },
    { label: 'Börja skolan', cls: 'btn-go', onClick: () => startSchool() },
  ], { closable: false });
  dlg.classList.add('dlg-furn');
  const avOf = (i) => (i === 't' ? TEACHER : i === 'me' ? ME : CLASS[+i]);
  dlg.querySelectorAll('[data-grade]').forEach((b) => (b.onclick = () => setGrade(+b.dataset.grade)));
  dlg.querySelector('[data-me="edit"]').onclick = () => editPlayer(() => classDialog());
  dlg.querySelector('[data-me="redo"]').onclick = () => redoFigure();
  dlg.querySelector('[data-klass]')?.addEventListener('input', (e) => setKlass(e.target.value));
  dlg.querySelectorAll('[data-por]').forEach((d) => d.append(portrait(avOf(d.dataset.por).look, '#d8cdb8')));
  dlg.querySelectorAll('[data-name]').forEach((inp) => inp.addEventListener('input', () => { const i = inp.dataset.name, v = inp.value.replace(/\s+/g, ' ').trim(); const av = avOf(i); av.name = v || (i === 't' ? 'Fröken' : `Kompis ${+i + 1}`); }));
  dlg.querySelectorAll('[data-rand]').forEach((b) => (b.onclick = () => { const i = b.dataset.rand; const av = avOf(i); av.look = i === 't' ? adultLook() : kidLook(); classDialog(); }));
  dlg.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => { const i = b.dataset.edit; editOther(avOf(i), (nav) => { if (nav) { if (i === 't') TEACHER = nav; else CLASS[+i] = nav; } classDialog(); }); }));
}
// göra om sin figur från början (Carl: "när jag gjort en karaktär måste jag ha en knapp för att göra om"):
// figurskaparen med en ny figur och samma namn; Avbryt behåller den gamla
function redoFigure() {
  saveAvatar(newAv(ME?.name || '', kidLook())); lockWardrobe(false);
  openAvatarEditor({ onDone: (av) => { ME = cleanAvatar(av); grantWorn(ME.look); lockWardrobe(true); lookChanged(); save(); classDialog(); }, onCancel: () => { if (ME) saveAvatar(ME); lockWardrobe(true); classDialog(); } });
}
function startSchool() {
  const first = P.scene === 'klass' && !P.seated && P.x === 220 && P.y === 210;
  closeModal(); save(); lookChanged(); renderBelow();
  if (first) { goScene('klass', null); teacherSay(`VÄLKOMMEN TILL ${KLASS}, {P}! SÄTT DIG I DEN LEDIGA BÄNKEN.`); setTimeout(() => { if (P.scene === 'klass') kidSay(rnd(0, 2), 'HEJ {P}!'); }, 1500); nextChat = performance.now() + 5500; }
}

// ================= knapparna under bilden =================
let HELP = '';
function renderBelow() {
  const el = $('sk-below'), btn = (a, t, cls = '', tip = '') => `<button type="button" class="btn btn-small ${cls}" data-b="${a}"${tip ? ` title="${tip}" aria-label="${tip}"` : ''}>${t}</button>`;
  let p, b = '';
  if (!ME) p = 'Börja med att göra din figur och din klass.';
  else if (SHOP) p = `Du är i ${SHOPLABEL[SHOP.id].charAt(0) + SHOPLABEL[SHOP.id].slice(1).toLowerCase()}, Snabbfilens egen butik. Klicka på det du vill titta på. Dörren tar dig ut i gallerian igen. Du har ${fmt(G.money)}.`;
  else if (P.scene === 'klass') { p = P.seated ? 'Du sitter i bänken och ser tavlan på nära håll. Skriv svaret med knapparna i rutan – det hamnar på tavlan – och tryck på den gröna Klar. Efter fem uppgifter blir det rast.' : `Klicka på den lediga bänken för att börja. Efter fem uppgifter blir det rast, och varje stjärna blir ${KR_PER_STJARNA} kr. Den blå dörren leder till Galleria Stjärnan.`; if (!P.seated) b += btn('sit', '🪑 Sätt dig', 'btn-go'); b += btn('shop', '🏬 Gallerian') + btn('class', '🧑 Figur och klass'); }
  else if (P.scene === 'galleria') { p = FLOOR === 0 ? 'Entréplanet. Åk rulltrappan eller hissen upp: plan 1 har klädaffären och skobutiken, plan 2 Leksakslådan och Möbeljätten. Dörrarna leder till skolan och hem.' : `Plan ${FLOOR}. Klicka på en butik för att gå in. Rulltrapporna och hissen tar dig mellan våningarna.`; b += btn('toclass', '🏫 Skolan') + btn('home', '🏠 Hem'); }
  else { p = 'Klicka på klädskåpet för att byta kläder. Möblerna från Möbeljätten står i förrådet: välj en och klicka på golvet (tavlor och lampor på väggen).'; b += btn('shop', '🏬 Gallerian') + btn('toclass', '🏫 Skolan'); }
  if (ME) b += btn('mute', isMuted() ? '🔇' : '🔊', '', isMuted() ? 'Ljudet är av' : 'Ljudet är på') + btn('reset', '↺', '', 'Börja om från början');
  HELP = p;
  el.innerHTML = `<span class="sk-name">Pixelskolan</span><p title="${esc(p)}">${esc(p)}</p><div class="sk-bbtns">${btn('help', '?', '', 'Hjälp')}${b}</div>`;
}
$('sk-below').addEventListener('click', (e) => {
  const b = e.target.closest('[data-b]'); if (!b) return;
  const a = b.dataset.b;
  if (a === 'sit') goSit();
  else if (a === 'shop') { if (P.seated) standUp(); goGalleria(); }
  else if (a === 'toclass') goScene('klass', P.scene);
  else if (a === 'home') goScene('hem', 'galleria');
  else if (a === 'mute') { toggleMute(); musicTick(); renderBelow(); }
  else if (a === 'class') { if (P.seated) standUp(); classDialog(); }
  else if (a === 'help') openModal('❓ Pixelskolan', `<p>${esc(HELP)}</p><p class="sp">${IN_APP ? 'Allt sparas i appen på den här enheten.' : 'Allt sparas i den här webbläsaren. <a href="plan.html">Om Pixelskolan och planen</a>'}</p>`, [{ label: 'Okej', cls: 'btn-go', onClick: closeModal }]);
  else if (a === 'reset') { if (!confirm('Börja om från början? Din figur, klass och allt du köpt försvinner.')) return; try { localStorage.removeItem(SAVE_KEY); } catch { /* lagring avstängd */ } fresh(); doorGlow = false; goScene('klass', null); renderBelow(); gradeDialog(startCreator); }
});

// ================= uppgifterna (uppgifter.js) =================
// Alla moment ur planens lista (matte, svenska, engelska, NO/SO, klockan) ligger som nivåer i uppgifter.js.
// Berättelserna och meningarna använder klassens egna namn.
setContext(() => ({ me: firstName(ME), kids: CLASS.map(firstName), teacher: TEACHER?.name || 'Fröken' }));

// ================= GÅNGER: multiplikation tabell 1–5 (som läxbladen, Carl 2026-10-06) =================
// Läxbladen "Multiplikation tabell 1–5": upprepad addition med guldmynt (5 + 5 + 5 = 3 · 5), krabbans
// luckor (_ · 5 = 30), Träna huvudräkning (25 tal på tid, försöken A–F) och kapten Rödskäggs hemliga
// meddelande (0 = L, 5 = R, 10 = Ä … 50 = N). Man väljer tabell 1–5 (5:an förvald). Multiplikations-
// tecknet är punkten (·) som i skolan.
const CODE = ['L', 'R', 'Ä', 'U', 'T', 'E', 'S', 'K', 'J', 'A', 'N'];   // k · tabellen → bokstaven (läxbladets kod för 5:an)
const MESSAGES = ['NU ÄR SKATTJAKTEN SNART SLUT', 'RASTEN ÄR SNART SLUT', 'ALLA KATTER ÄR SNÄLLA', 'JAKTEN ÄR SLUT', 'SKATTEN SJUNKER', 'LEKA SKA ALLA'];
function genGanger(t) {
  const k = rnd(0, 10), ans = k * t;
  const kind = pick(['add', 'add', 'crab', 'crab', 'tab']);
  const sum = Array(Math.max(1, k)).fill(t).join(' + ');
  if (kind === 'add' && k >= 2) return { topic: 'UPPREPAD ADDITION', prompt: `${k} · ${t} = ?`, sum: `${sum} = ?`, say: `${k} gånger ${t}`, ans, opts: numOpts(ans, t), visual: { groups: k, t }, hint: `Räkna ${t}-skutt, ett för varje grupp: ${Array.from({ length: Math.min(k, 4) }, (_, i) => t * (i + 1)).join(', ')} …`, done: `${k} grupper med ${t} i varje: ${sum} = ${ans}, alltså ${k} · ${t} = ${ans}.` };
  if (kind === 'crab' && Math.random() < 0.6) {   // krabban har stulit faktorn
    const opts = numOpts(k, 2);
    return { topic: 'KRABBANS LUCKOR', prompt: `? · ${t} = ${ans}`, say: `Vad gånger ${t} blir ${ans}?`, ans: k, opts, visual: { crab: true, stolen: k }, hint: `Räkna ${t}-skutt tills du kommer till ${ans}. Hur många skutt blev det?`, done: `${k} · ${t} = ${ans}.` };
  }
  return { topic: kind === 'crab' ? 'KRABBANS LUCKOR' : `${t}:ANS TABELL`, prompt: `${k} · ${t} = ?`, say: `${k} gånger ${t}`, ans, opts: numOpts(ans, t), visual: kind === 'crab' ? { crab: true, stolen: ans } : null, hint: k === 0 ? `Noll grupper blir ingenting alls.` : `${k} · ${t} är samma sak som ${sum}.`, done: `${k} · ${t} = ${ans}.` };
}
// nivåerna i alla ämnen per årskurs (uppgifter.js = åk 2, uppgifter3.js = åk 3). Gånger = tabell 1–5 i åk 2 och
// 1–10 i åk 3, plus blandat (tabellen styr även huvudräkningen och meddelandet).
const gangerLv = (max) => [...Array.from({ length: max }, (_, i) => i + 1), 0].map((t) => ({ name: t ? `${t}:ans tabell` : `Blandat 1–${max}`, t, gen: () => genGanger(t || rnd(1, max)) }));
const LEVELS = { 2: { ...UPP, ganger: gangerLv(5) }, 3: { ...LEVELS3, ganger: gangerLv(10) } };
const LVKEY = (tab) => (D.grade === 3 ? tab + '3' : tab);   // åk 2 behåller de gamla nycklarna (sparade stjärnor)
const levelOf = (tab) => { const L = LEVELS[D.grade][tab], key = LVKEY(tab), i = Math.max(1, Math.min(L.length, D.lvl[key] | 0 || 1)); return { L, i, lv: L[i - 1], key }; };
const starsHtml = (n) => `<span class="lv-stars" aria-label="${n} av 3 stjärnor">${[0, 1, 2].map((k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>`;
function levelsDialog() {
  const tab = D.tab, { L, i: cur, key } = levelOf(tab), best = D.best[key] || {};
  const dlg = openModal(`🎯 Nivåer · ${TABS.find((x) => x[0] === tab)[1]} · åk ${D.grade}`, `<p class="sp">Välj vilken nivå du vill träna. Stjärnorna är det bästa du har fått på nivån (tre stjärnor = fem rätt på första försöket).</p>
    <div class="sk-levels">${L.map((lv, k) => `<button type="button" class="btn sk-lv${k + 1 === cur ? ' on' : ''}" data-lv="${k + 1}"><b>${k + 1}</b><span>${esc(lv.name)}</span>${starsHtml(best[k + 1] | 0)}</button>`).join('')}</div>`, [{ label: 'Stäng', onClick: closeModal }]);
  dlg.querySelectorAll('[data-lv]').forEach((bt) => (bt.onclick = () => {
    D.lvl[key] = +bt.dataset.lv; save(); closeModal();
    if (P.seated && MODE === 'lesson') { LES = { results: [] }; newQ(); teacherSay(`NIVÅ ${D.lvl[key]}: ${levelOf(tab).lv.name.toUpperCase()}!`); }
  }));
}

// ---------- tavlans bilder: guldmynten och krabban ----------
const PIPS = { 1: [[5, 5]], 2: [[2, 2], [8, 8]], 3: [[2, 2], [5, 5], [8, 8]], 4: [[2, 2], [8, 2], [2, 8], [8, 8]], 5: [[2, 2], [8, 2], [5, 5], [2, 8], [8, 8]] };
function coinBox(x, y, n) {   // ruta med n guldmynt (som tärningsprickar), 13 × 13
  fill(x, y, 13, 1, '#c98a10'); fill(x, y + 12, 13, 1, '#c98a10'); fill(x, y, 1, 13, '#c98a10'); fill(x + 12, y, 1, 13, '#c98a10');
  fill(x + 1, y + 1, 11, 11, '#fbe9b0');
  for (const [px, py] of PIPS[n] || []) { fill(x + px, y + py, 3, 3, '#f0b429'); fill(x + px, y + py, 2, 1, '#fff2a8'); fill(x + px + 2, y + py + 1, 1, 2, '#a86b10'); }
}
const CRAB = ['.#.......#.', '##.......##', '.#..#.#..#.', '..#######..', '.#########.', '#.#######.#', '..#.#.#.#..'];
function crab(x, y) { CRAB.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') fill(x + i * 2, y + j * 2, 2, 2, '#e8604a'); })); fill(x + 8, y + 4, 2, 2, '#ffffff'); fill(x + 12, y + 4, 2, 2, '#ffffff'); }

// ---------- Träna huvudräkning: 25 tal på tid ----------
let MODE = 'lesson', DRILL = null, SECRET = null;
const fmtTime = (ms) => { const s = ms / 1000, m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0').replace('.', ',')}`; };
function startDrill() {
  const t = D.tabell, list = [];
  while (list.length < 25) { const k = rnd(1, 10); if (k !== list[list.length - 1]) list.push(k); }
  DRILL = { t, list, i: 0, typed: '', ok: 0, t0: performance.now(), flash: null };
  MODE = 'drill'; teacherSay(`TRÄNA HUVUDRÄKNING! ${t}:ANS TABELL, 25 TAL. KLART, GÅ!`); modePanel();
}
function drillKey(k) {
  if (!DRILL) return;
  if (k === 'del') DRILL.typed = DRILL.typed.slice(0, -1);
  else if (k === 'ok') { if (DRILL.typed) drillSubmit(); return; }
  else if (DRILL.typed.length < 3) DRILL.typed += k;
  const disp = panel.querySelector('.dr-typed'); if (disp) disp.textContent = DRILL.typed || ' ';
}
function drillSubmit() {
  const R = DRILL, k = R.list[R.i], right = +R.typed === k * R.t;
  if (right) R.ok++; else R.flash = { text: `${k} · ${R.t} = ${k * R.t}`, until: performance.now() + 1100 };
  R.i++; R.typed = '';
  if (R.i >= 25) return finishDrill();
  modePanel();
}
function finishDrill() {
  const R = DRILL, ms = performance.now() - R.t0, hist = (D.hist[R.t] ||= []);
  const best = hist.length ? Math.min(...hist.filter((h) => h.ok >= 20).map((h) => h.ms), Infinity) : Infinity;
  const d = new Date(), rec = { d: `${d.getDate()}/${d.getMonth() + 1}`, ok: R.ok, ms: Math.round(ms) };
  hist.push(rec); if (hist.length > 6) hist.shift();
  const better = R.ok >= 20 && ms < best;
  const earned = 1 + (R.ok >= 23 ? 1 : 0) + (better && isFinite(best) ? 1 : 0);
  DRILL = null; MODE = 'lesson';
  const rows = hist.map((h, i) => `<tr><td>${'ABCDEF'[i]}</td><td>${esc(h.d)}</td><td>${h.ok === 25 ? 'Alla' : h.ok}</td><td>${fmtTime(h.ms)}</td></tr>`).join('');
  giveReward(earned, `${R.ok} av 25 rätt på ${fmtTime(ms)}.`, `${better && isFinite(best) ? `<p><b>Nytt rekord!</b> Förra bästa tiden var ${fmtTime(best)}.</p>` : ''}<table class="sk-hist"><tr><th></th><th>Datum</th><th>Antal rätt</th><th>Tid</th></tr>${rows}</table>`, 'HUVUDRÄKNING KLAR');
}

// ---------- kapten Rödskäggs hemliga meddelande ----------
function startSecret() {
  const t = D.tabell, msg = pick(MESSAGES.filter((m) => m !== SECRET?.msg)), letters = [...new Set(msg.replace(/ /g, ''))];
  SECRET = { t, msg, letters, got: new Set(), i: 0, q: null, tried: false };
  MODE = 'secret'; nextSecret(); teacherSay('KAPTEN RÖDSKÄGG HAR SKICKAT ETT HEMLIGT MEDDELANDE. RÄKNA UT BOKSTÄVERNA!');
}
function nextSecret() {
  const S = SECRET, L = S.letters[S.i], k = CODE.indexOf(L), ans = k * S.t;
  S.q = { k, ans, letter: L, opts: numOpts(ans, S.t) }; S.tried = false; modePanel();
}
function secretAnswer(btn, v) {
  const S = SECRET; if (!S || S.lock) return;
  if (v === S.q.ans) {
    btn.classList.add('btn-go'); S.got.add(S.q.letter); S.lock = true;
    const f = panel.querySelector('.sp-fb'); if (f) f.innerHTML = `<b class="ok">Rätt!</b> ${S.q.k} · ${S.t} = ${S.q.ans}, och ${S.q.ans} = ${esc(S.q.letter)}.`;
    setTimeout(() => { S.lock = false; if (MODE !== 'secret') return; S.i++; if (S.i >= S.letters.length) finishSecret(); else nextSecret(); }, 1100);
  } else {
    btn.classList.add('btn-red'); btn.disabled = true; S.tried = true;
    const f = panel.querySelector('.sp-fb'); if (f) f.innerHTML = `<b class="no">Inte riktigt.</b> Räkna ${S.t}-skutt ${S.q.k} gånger.`;
  }
}
function finishSecret() {
  const S = SECRET; MODE = 'lesson';
  speak(S.msg.toLowerCase());
  giveReward(2, `Meddelandet: <b>${esc(S.msg)}!</b>`, '<p class="sp">Kapten Rödskägg tackar för hjälpen.</p>', 'MEDDELANDET KNÄCKT', () => { SECRET = null; });
}

// ---------- rutan i bilden för huvudräkningen och meddelandet ----------
function modePanel() {
  if (MODE === 'drill') {
    const R = DRILL, k = R.list[R.i];
    panel.innerHTML = `<div class="dlg-head"><h2>Träna huvudräkning · tabell ${R.t}</h2><span class="sp-topic sp-light">${R.i + 1} av 25</span></div>
      <div class="dlg-body">
        <div class="sp-row"><span class="dr-q">${k} · ${R.t} =</span><span class="dr-typed">${esc(R.typed) || ' '}</span><span class="sp-spacer"></span><button type="button" class="btn btn-small" data-sp="quit">Avbryt</button></div>
        <div class="sp-pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((d) => `<button type="button" class="btn${d === 'ok' ? ' btn-go' : ''}" data-pad="${d}">${d === 'del' ? '⌫' : d === 'ok' ? 'OK' : d}</button>`).join('')}</div>
      </div>`;
  } else if (MODE === 'secret') {
    const S = SECRET;
    panel.innerHTML = `<div class="dlg-head"><h2>Hemligt meddelande · tabell ${S.t}</h2><span class="sp-topic sp-light">${S.i + 1} av ${S.letters.length} bokstäver</span></div>
      <div class="dlg-body">
        <div class="sp-row"><span class="sp-topic">Vad blir ${S.q.k} · ${S.t}? Svaret är en bokstav i kodtabellen.</span><span class="sp-spacer"></span>${'speechSynthesis' in window ? '<button type="button" class="btn btn-small" data-sp="say">Läs upp</button>' : ''}<button type="button" class="btn btn-small" data-sp="quit">Avbryt</button></div>
        <div class="sp-row sp-answers">${S.q.opts.map((o, i) => `<button type="button" class="btn" data-sec="${o.value}">${esc(o.label)}</button>`).join('')}</div>
        <p class="sp-fb" aria-live="polite"></p>
      </div>`;
  }
  panel.hidden = false; measureVis();
}
// tavlan i närbild för läget som pågår (anropas från chalkClose)
function chalkMode(b, ch) {
  const now = performance.now();
  if (MODE === 'drill') {
    const R = DRILL, k = R.list[R.i], ty = Math.max(b.y0 + 7, pillB + 4);
    ch(`TRÄNA HUVUDRÄKNING - ${R.t}:ANS TABELL`, b.x0 + 9, ty, 1, CBL);
    const tm = fmtTime(now - R.t0), tw = textW(CHALK, tm, 2);
    ch(tm, b.x1 - 10 - tw, ty + 14, 2, CY);
    const best = (D.hist[R.t] || []).filter((h) => h.ok >= 20).map((h) => h.ms);
    if (best.length) { const s = `BÄSTA ${fmtTime(Math.min(...best))}`; ch(s, b.x1 - 10 - textW(CHALK, s), ty + 34, 1, CW); }
    ch(`${R.i + 1} AV 25`, b.x0 + 12, ty + 14, 1, CW);
    const q = `${k} · ${R.t} = ${R.typed}`;
    ch(q, b.x0 + 12, ty + 28, 2, CW);
    if (Math.floor(now / 450) % 2) fill(b.x0 + 12 + textW(CHALK, q, 2) + 4, ty + 28 + 12, 10, 2, CW);   // markören
    if (R.flash && R.flash.until > now) ch(R.flash.text, b.x0 + 12, ty + 50, 1, '#ff9a8a');
    return true;
  }
  if (MODE === 'secret') {
    const S = SECRET, ty = Math.max(b.y0 + 6, pillB + 4);
    ch('KAPTEN RÖDSKÄGGS MEDDELANDE', b.x0 + 9, ty, 1, CBL);
    // kodtabellen: 0 = L, 5 = R …
    let x = b.x0 + 9; const cy = ty + 12;
    for (let k = 0; k <= 10; k++) { const s = `${k * S.t}=${CODE[k]}`, w = textW(SMALL, s) + 5; fill(x - 2, cy - 2, w, 9, k === S.q.k && S.tried ? 'rgba(248,232,120,0.35)' : 'rgba(255,255,255,0.08)'); ctxText(ctx, SMALL, s, x, cy, CW); x += w + 2; if (x > b.x1 - 30) break; }
    // meddelandet i rutor, den bokstav vi letar efter markerad
    const cells = [...S.msg], cw = Math.min(12, Math.floor((b.x1 - b.x0 - 18) / cells.length)), mx = b.x0 + 9, my = cy + 14;
    cells.forEach((c, i) => {
      const xx = mx + i * cw; if (c === ' ') return;
      const got = S.got.has(c), cur = c === S.q?.letter;
      fill(xx, my, cw - 2, 12, cur ? 'rgba(248,232,120,0.45)' : 'rgba(255,255,255,0.12)'); fill(xx, my + 11, cw - 2, 1, CW);
      if (got) ch(c, xx + ((cw - 2 - textW(CHALK, c)) >> 1), my + 3, 1, CY);
    });
    ch(`${S.q.k} · ${S.t} = ?`, b.x0 + 12, my + 22, 2, CW);
    crab(b.x1 - 40, my + 22);
    return true;
  }
  return false;
}
function giveReward(earned, lead, more, boardWord, after) {
  const kr = earned * KR_PER_STJARNA;
  STARS += earned; G.money += kr; LESSONS++; D.rast = true; doorGlow = true; save(); updatePill(); loadShops().catch(() => {});
  panel.hidden = true;
  teacherSay(`${boardWord}! DU FICK ${earned} ${earned > 1 ? 'STJÄRNOR' : 'STJÄRNA'}, {P}.`);
  openModal('🔔 Rast!', `<div class="who"><div class="sk-face"></div><div><p class="sk-big">${lead}</p>${more}<p>Du fick <b>${earned} ${starIco}</b> = <b>${fmt(kr)}</b> i plånboken. Nu har du ${fmt(G.money)}.</p></div></div>`, [
    { label: 'Fortsätt öva', onClick: () => { closeModal(); after?.(); D.rast = false; LES = { results: [] }; newQ(); } },
    { label: 'Gå till gallerian', cls: 'btn-go', onClick: () => { closeModal(); after?.(); standUp(); goGalleria(); } },
  ]);
  const face = document.querySelector('#modal .sk-face'); if (face) face.append(portrait(myLook(), '#d8cdb8'));
}
// siffrorna på tangentbordet under huvudräkningen
window.addEventListener('keydown', (e) => {
  if (MODE !== 'drill' || !P.seated || modalUp() || SHOP) return;
  if (/^[0-9]$/.test(e.key)) drillKey(e.key); else if (e.key === 'Backspace') drillKey('del'); else if (e.key === 'Enter') drillKey('ok'); else return;
  e.preventDefault();
});

function speak(s, lang = 'sv-SE') { try { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(s); u.lang = lang; u.rate = 0.9; const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())); if (v) u.voice = v; speechSynthesis.speak(u); } catch { /* uppläsning saknas */ } }

// ================= start =================
const hasSave = load();
if (KLASS !== '2B') BG.klass = paintClass();
if (hasSave) grantWorn(ME.look);
lockWardrobe(true);
setTimeout(() => loadShops().catch(() => {}), 1500);   // gallerian laddas i bakgrunden
D.q = levelOf('matte').lv.gen();
fit(); buildGrid(); updatePill(); renderBelow();
if (hasSave) { saveAvatar(ME); nextChat = performance.now() + 2500; setTimeout(() => teacherSay('VÄLKOMMEN TILLBAKA, {P}!'), 600); }
else gradeDialog(startCreator);
if (window.ResizeObserver) new ResizeObserver(fit).observe(frame); else window.addEventListener('resize', fit);
let last = performance.now();
let pillT = 0;
const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); chatter(now); draw(now); if (SHOP && now - pillT > 400) { pillT = now; updatePill(); } requestAnimationFrame(loop); };
requestAnimationFrame(loop);
window.__ps = {
  state: () => ({ scene: P.scene, seated: P.seated, x: P.x, y: P.y, stars: STARS, money: G.money, wardrobe: G.wardrobe.length, toys: Object.keys(G.toys || {}).length, storage: G.storage.length, placed: PLACED, floor: FLOOR, shop: SHOP && SHOP.id, ride: RIDE && (RIDE.kind + ':' + (RIDE.st || RIDE.d)), me: ME && ME.name, kid: ME && ME.look.kid, ans: D.q && D.q.opts ? D.q.opts.findIndex((o) => o.value === D.q.ans) : -1, input: inputOf(D.q), typed: D.typed, want: D.q && inputOf(D.q) ? ansText(D.q) : null, grade: D.grade, klass: KLASS, lesson: LES.results.length, panel: !panel.hidden, modal: modalUp(), bubbles: BUBS.map((b) => b.str), cam: camX, npcs: P.scene === 'galleria' && SHOPLIB ? crowdFor(FL()).map((n) => [Math.round(n.x), Math.round(n.y), n.mode]) : [] }),
  give: (n) => { G.money += n; G.save(); updatePill(); }, goScene, walkTo, enterShop, rideUp, rideDown, liftTo: (n) => { P.x = LIFT_X + 13; P.y = GBASE + 9; RIDE = { kind: 'lift', st: 'open', t: 0, to: n }; },
  lib: () => !!SHOPLIB, hit, G, cam: (x) => { CAM_OVR = x; }, floor: (n) => { switchFloor(n); P.x = LIFT_X + 13; P.y = GBASE + 12; }, floorW: () => FL().w, lvl: (tab, i) => { D.tab = tab; D.lvl[LVKEY(tab)] = i; LES = { results: [] }; newQ(); }, levels: () => Object.fromEntries(Object.entries(LEVELS[D.grade]).map(([k, L]) => [k, L.length])), grade: (g) => setGrade(g), type: (k) => typeKey(k),
};
