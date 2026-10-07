// Utsikten genom trapphusets glasvägg i Galleria Stjärnan (Pixelskolan).
// Carl 2026-10-07: "på våningarna högre upp ha stora fönster och visa fåglar, moln långt bort och hustak
// … när det är trapphus stora fönster i bakgrunden". Allt är målat med Snabbfilens penna (floor-pix.js)
// i spelets stil: himlen och molnen som i rummens fönster (room.js skyPx/cloudsIn), stadssilhuetten som
// takvåningens panorama (viewStad) med TV-tornet, och fåglarna är spelets egna förbiflygande fåglar
// (city/life.js BIRD: svala, fiskmås, kråka, stare och grågäss). Lagren ligger olika långt bort och
// glider olika fort när kameran rör sig (parallax): himlen följer med, taken närmast glaset rör sig mest.
// Entréplanet ser ut över torget, gatan med spårvagnen och husen mittemot – i liten skala, så att de
// ligger på andra sidan torget (spelets fasader i full storlek såg ut att stå inne i gallerian).
import { Pix, mix, mul, hash, bayer } from './sf/js/core/floor-pix.js';

// hur mycket varje lager följer kameran (1 = oändligt långt bort)
const K = { sky: 1, cloud: 0.97, plane: 0.98, far: 0.9, balloon: 0.84, flock: 0.8, mid: 0.72, street: 0.6, near: 0.5, plaza: 0.32, gull: 0.38 };

// ---------- spelets fåglar (city/life.js, sedda underifrån) ----------
const BIRD = {
  sw: { pal: { k: 0x241f2a, K: 0x3a3440 }, fr: [
    ['k.......k', '.kK...Kk.', '...kkk...', '....k....'],
    ['.........', 'kkKK.KKkk', '...kkk...', '....k....'],
    ['.........', '...kkk...', '.kK.k.Kk.', 'k.......k'],
  ] },
  gull: { pal: { G: 0xb8c0cc, W: 0xf4f4f0, k: 0x22222a, y: 0xe8c040 }, fr: [
    ['k.........k', '.GG.....GG.', '...GWWWG...', '.....W.....'],
    ['...........', 'kGGGWWWGGGk', '....WWW....', '.....y.....'],
    ['...........', '...GWWWG...', '.GG..W..GG.', 'k.........k'],
  ] },
  crow: { pal: { k: 0x1e1c24, K: 0x3a3844 }, fr: [
    ['k.........k', '.kK.....Kk.', '...kkkkk...', '.....k.....'],
    ['...........', 'kkKKkkkKKkk', '....kkk....', '.....k.....'],
    ['...........', '...kkkkk...', '.kK..k..Kk.', 'k.........k'],
  ] },
  star: { pal: { k: 0x2a2832 }, fr: [['k.k', '.k.'], ['kkk', '...'], ['.k.', 'k.k']] },
  goose: { pal: { k: 0x1e1c20, G: 0x6e665a, g: 0x8e8578, W: 0xe8e4dc }, fr: [
    ['G...........G', '.GG.......GG.', '...ggWkWgg...', '.....WkW.....', '......k......'],
    ['.............', 'GGGgggWkWgggG', '.....WkW.....', '......k......', '.............'],
    ['.............', '...ggWkWgg...', '.GG..WkW..GG.', 'G.....k.....G', '.............'],
  ] },
};
function sprite(rows, pal) {
  const P = new Pix(rows[0].length, rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch] != null) P.px(x, y, pal[ch]); }));
  return P.flush();
}
let BIRDS = null;
const birds = () => (BIRDS ||= Object.fromEntries(Object.entries(BIRD).map(([k, b]) => [k, b.fr.map((r) => sprite(r, b.pal))])));

// ---------- molnen: bomullsmoln i fem toner med platt undersida ----------
const CLOUD_TONES = [0xffffff, 0xf2f6fa, 0xe0e9f1, 0xc9d6e4, 0xb4c4d6];
const CLOUD_SPEC = [[132, 38], [110, 32], [92, 28], [78, 24], [64, 21], [52, 18], [40, 14], [30, 11], [24, 8]];
function cloudSprite(w, h, seed) {
  const P = new Pix(w, h), n = Math.max(3, Math.round(w / 11)), puffs = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), bell = Math.sin(Math.PI * (0.1 + 0.8 * u));
    const r = Math.max(3, (h - 2) * (0.34 + 0.58 * bell) * (0.82 + hash(i, 1, seed) * 0.3));
    puffs.push([r + u * (w - 2 * r), h - 2 - r * 0.72, r]);
  }
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
    let best = -1, nx = 0, ny = 0;
    for (const [cx, cy, r] of puffs) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / (r * 0.92), d = 1 - Math.hypot(dx, dy); if (d > best) { best = d; nx = dx; ny = dy; } }
    if (best < 0) continue;
    if (y === h - 2 && hash(x, 0, seed) > 0.55) continue;   // trasig undersida
    const lum = 0.56 - ny * 0.46 - nx * 0.16 - (y / h) * 0.34 + (bayer(x, y) - 0.5) * 0.22;
    const k = lum > 0.62 ? 0 : lum > 0.42 ? 1 : lum > 0.24 ? 2 : lum > 0.08 ? 3 : 4;
    P.px(x, y, CLOUD_TONES[k], best < 0.07 ? 0.8 : 1);
  }
  return P.flush();
}
let CLOUDS = null;
const clouds = () => (CLOUDS ||= CLOUD_SPEC.map(([w, h], i) => cloudSprite(w, h, 300 + i)));

// ---------- vyn för en våning ----------
// o = { n, w (våningens bredd), viewW (bildens bredd), x0, x1, y0, y1 (glaset), hz (horisonten),
//       mid (marklinjen för kvarteren bortom), near (taknockarna närmast, plan 1–2), cloudY: [över, under] }
export function makeView(o) {
  const V = { ...o, camMax: Math.max(0, o.w - o.viewW), smoke: [], flags: [], turbines: [], wheel: null };
  V.camMid = Math.max(0, Math.min(V.camMax, Math.round((o.x0 + o.x1 - o.viewW) / 2)));
  const lay = (k, y0, y1) => {
    const ext = Math.ceil(V.camMax * k) + 2, P = new Pix(o.x1 - o.x0 + ext + 2, y1 - y0, o.x0 - ext, y0);
    P.k = k; P.L0 = o.x0 - ext; P.L1 = o.x1 + 2; return P;
  };
  const out = (P, id) => ({ id, img: P.flush(), ox: P.ox, oy: P.oy, k: P.k });
  const sky = lay(K.sky, o.y0, o.y1); paintSky(sky, V); V.sky = out(sky, 'sky');
  V.layers = [];
  const far = lay(K.far, o.y0, o.hz + 2); paintFar(far, V); V.layers.push(out(far, 'far'));
  const mid = lay(K.mid, o.y0, o.y1); paintMid(mid, V); V.layers.push(out(mid, 'mid'));
  if (o.n === 0) {
    const st = lay(K.street, o.mid - 11, o.mid + 9); paintStreet(st, V); V.layers.push(out(st, 'street'));
    const pl = lay(K.plaza, o.y0, o.y1); paintPlaza(pl, V); V.layers.push(out(pl, 'plaza'));
  } else {
    const ne = lay(K.near, o.near - 26, o.y1); paintNear(ne, V); V.layers.push(out(ne, 'near'));
  }
  V.cl0 = o.x0 - Math.ceil(V.camMax * K.cloud) - 140; V.clSpan = o.x1 + 10 - V.cl0;
  V.clouds = makeClouds(V);
  V.walkers = o.n === 0 ? makeWalkers(V) : [];
  V.glass = glassImg(o.x1 - o.x0, o.y1 - o.y0);
  return V;
}
// var en sak i ett lager med faktorn k syns mitt i glaset när kameran står mitt för trapphuset
const LC = (V, k) => Math.round((V.x0 + V.x1) / 2 - V.camMid * k);
const wrap = (v, a, span) => a + (((v - a) % span) + span) % span;

// ---------- himlen ----------
function paintSky(P, V) {
  for (let y = P.oy; y < P.oy + P.h; y++) {
    const t = Math.min(1, (y - V.y0) / (V.hz - V.y0));
    for (let x = P.L0; x < P.L1; x++) {
      let c = mix(0x4c92da, 0xd4e8f2, t * 0.65 + t * t * 0.35 + (bayer(x, y) - 0.5) * 0.09);
      if (y > V.hz - 16) c = mix(c, 0xf0f2e6, Math.min(1, (y - V.hz + 16) / 24));   // diset vid horisonten
      P.px(x, y, c);
    }
  }
  // solen (himlen följer kameran, så den står still i bilden) med ett mjukt sken
  const sx = 318, sy = V.y0 + 17;
  P.ell(sx, sy, 48, 36, 0xfff2c4, 0.3, 6); P.ell(sx, sy, 19, 16, 0xfffae0, 0.55, 4);
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) { const d = Math.hypot(x, y); if (d < 6.3) P.px(sx + x, sy + y, d > 5.2 ? 0xfff0b0 : 0xfffef4); }
}

// ---------- staden långt bort: kullar, silhuetter, TV-tornet, kyrkan, hamnkranarna ----------
const hillTop = (V, x) => V.hz - 8 - Math.round(4 * Math.sin(x / 43) + 3 * Math.sin(x / 17 + 2) + 1.5 * Math.sin(x / 7.3));
function paintFar(P, V) {
  const hz = V.hz, n = V.n, lc = LC(V, P.k);
  if (n > 0) {   // kullarna bortom staden, med skog på krönet och vindkraftverk (snurrar, se drawFarLive)
    for (let x = P.L0; x < P.L1; x++) {
      const top = hillTop(V, x);
      for (let y = top; y < hz; y++) { let c = mix(0xb0cad4, 0x9cb8c2, Math.min(1, (y - top) / 10) + (bayer(x, y) - 0.5) * 0.25); if (y === top) c = 0xbed4dc; P.px(x, y, c); }
      if (hash(x, 1, 64) > 0.7) P.px(x, top - 1, 0x9ebcc4);
      if (hash(x, 2, 64) > 0.9) P.px(x, top - 2, 0xa4c0c8);
    }
    for (const [x, i] of [[lc - 262, 0], [lc - 236, 1], [lc - 208, 2], [lc + 262, 3], [lc + 290, 4], [lc + 318, 5]]) {
      const y = hillTop(V, x) + 1; P.vl(x, y - 13, 13, 0xd8e2e8); P.px(x + 1, y - 6, 0xc4d0d8);
      V.turbines.push({ x, y: y - 14, ph: i * 1.7 });
    }
  }
  const row = (base, minH, maxH, seed, col, win) => {
    let x = P.L0 - 14;
    while (x < P.L1) {
      const w = 5 + Math.floor(hash(x, 1, seed) * 11), h = minH + Math.floor(hash(x, 2, seed) ** 1.5 * (maxH - minH));
      for (let y = base - h; y < base; y++) for (let xx = x; xx < x + w; xx++) {
        let c = col;
        if (xx === x + w - 1) c = mul(c, 0.94);
        if (y === base - h) c = mix(col, 0xffffff, 0.24);
        else if ((xx - x) % 2 === 1 && (y - base + h) % 3 === 2 && xx < x + w - 1 && y < base - 1) c = win;
        P.px(xx, y, c);
      }
      if (hash(x, 4, seed) > 0.8) P.vl(x + (w >> 1), base - h - 3, 3, mul(col, 0.9));   // antenn
      x += w + (hash(x, 3, seed) > 0.75 ? 2 : 0);
    }
  };
  // högst upp ser man ända ut till älven: staden ligger på andra sidan vattnet, med hängbron
  const sb = n > 1 ? hz - 5 : hz;
  if (n > 1) {
    for (let y = sb; y < hz + 2; y++) for (let x = P.L0; x < P.L1; x++) {
      let c = mix(0x7aa8c8, 0x9cc4dc, (y - sb) / 7 + (bayer(x, y) - 0.5) * 0.2);
      if (((x * 7 + y * 13) % 23) === 0) c = 0xe8f4fc;   // glittret
      P.px(x, y, c);
    }
    P.hl(P.L0, sb, P.L1 - P.L0, 0x8eaabc);
    V.water = { y: sb + 3 };
  }
  row(sb, 3, n ? 14 : 10, 62, 0xbccad6, 0xacbacb);
  row(sb + 1, 4, n ? 22 : 15, 63, 0xa8b8ca, 0x95a6ba);
  tvTower(P, lc + 108, sb + 1);
  church(P, lc - 58, sb + 1);
  if (n > 0) { crane(P, lc + 192, sb + 1, 1); crane(P, lc + 224, sb + 1, -1); }
  if (n > 1) {   // hängbron över älven: två pyloner, de böjda kablarna och brobanan
    const b0 = lc + 20, b1 = lc + 150, dy = sb + 1, top = dy - 20, bc = 0x8c9cb0;
    for (const px of [b0 + 22, b1 - 22]) { P.vl(px, top, dy - top + 5, bc); P.vl(px + 2, top, dy - top + 5, bc); P.hl(px, top + 4, 3, bc); P.hl(px, top + 11, 3, bc); }
    for (let x = b0; x <= b1; x++) {
      const p1 = b0 + 23, p2 = b1 - 21;
      let cy;
      if (x < p1) cy = dy - 2 - (x - b0) / (p1 - b0) * 16; else if (x > p2) cy = dy - 2 - (b1 - x) / (b1 - p2) * 16;
      else { const u = (x - p1) / (p2 - p1); cy = top + 1 + 17 * 4 * u * (1 - u); }
      P.px(x, Math.round(cy), 0x9aaabc);
      if (x % 4 === 0 && x > b0 + 2 && x < b1 - 2) P.vl(x, Math.round(cy) + 1, Math.max(0, dy - 2 - Math.round(cy)), 0xb0bece);   // hängstagen
      P.px(x, dy - 2, 0x7a8aa0); P.px(x, dy - 1, 0x93a3b6);
    }
  }
  // pariserhjulet på nöjesfältet: benen målade, hjulet snurrar (drawFarLive)
  const wx = lc - 146, wy = hz - 15;
  P.line(wx - 7, hz, wx, wy, 0x8a9cb0); P.line(wx + 7, hz, wx, wy, 0x8a9cb0); P.line(wx - 6, hz, wx + 1, wy, 0x9aaabc);
  V.wheel = { x: wx, y: wy, r: 11 };
}
function tvTower(P, x, base) {
  const c = 0x8c9cb0, d = 0x7a8aa0;
  P.rect(x - 1, base - 44, 3, 44, c); P.vl(x + 1, base - 44, 44, d);
  P.vl(x - 2, base - 12, 12, c); P.vl(x + 2, base - 12, 12, d); P.hl(x - 3, base - 1, 7, d);
  P.rect(x - 5, base - 38, 11, 3, 0xa8b6c6); P.hl(x - 5, base - 35, 11, 0x6c7c92); P.rect(x - 4, base - 34, 9, 2, 0x98a8ba);
  for (let i = -3; i <= 3; i += 2) P.px(x + i, base - 37, 0xd8e2ea);   // restaurangens fönster
  P.vl(x, base - 56, 12, 0x75859b); P.px(x, base - 57, 0xd86a5a);
}
function church(P, x, base) {
  P.rect(x - 14, base - 11, 20, 11, 0xb0bcca); for (let j = 0; j < 5; j++) P.hl(x - 14 + j, base - 12 - j, 20 - 2 * j, 0x8a9aae);
  for (let k = 0; k < 3; k++) P.rect(x - 11 + k * 6, base - 8, 2, 4, 0x8e9eb2);   // de höga fönstren
  P.rect(x + 6, base - 25, 6, 25, 0xb8c4d0); P.vl(x + 11, base - 25, 25, 0xa4b0be);
  P.rect(x + 8, base - 21, 2, 3, 0x8a9ab0); P.px(x + 8, base - 14, 0xd0d8e0);   // klockluckan och urtavlan
  for (let j = 0; j < 15; j++) { const hw = Math.max(1, 3 - Math.floor(j / 4)); P.hl(x + 9 - hw, base - 26 - j, hw * 2, j < 2 ? 0x76a096 : 0x86aca2); }   // kopparspiran
  P.px(x + 8, base - 42, 0xd0b460);   // tuppen
}
function crane(P, x, base, s) {
  const c = 0xb88a80;
  P.vl(x, base - 27, 27, c); P.vl(x + 1, base - 27, 27, mul(c, 0.88));
  for (let y = base - 25; y < base; y += 3) P.px(x + ((y >> 1) & 1), y, 0xd4b8b0);
  for (let i = -7; i <= 19; i++) P.px(x + s * i, base - 28, c);
  P.vl(x + s * 15, base - 27, 9, 0x8a7c78);
  P.rect(x + s * 15 - 1, base - 18, 3, 2, 0x8a7c78);
  P.rect(x - s * 7 - 1, base - 28, 3, 3, 0x9a8a86);
  P.rect(x - 2, base - 31, 5, 3, 0xc4a49c);   // förarhytten
}

// ---------- kvarteren bortom: fasader i Snabbfilens färger, plåt- och tegeltak, skorstenar ----------
const FACADES = [0xe6c48a, 0xdea48c, 0xeedcb8, 0xc4d4b2, 0xd2866c, 0xe6e2d8, 0xb4c6d6, 0xd8b8cc, 0xe8d070, 0xc89870];
function paintMid(P, V) {
  const base = V.mid, n = V.n, seed = 70 + n, SH = 8;
  let x = P.L0 - 8, i = 0;
  while (x < P.L1) {
    const r = (k) => hash(i, k, seed);
    if (i > 0 && r(9) > 0.8) {   // en tvärgata eller en park mellan husen: träd
      const gw = 14 + Math.floor(r(10) * 12);
      tree(P, x + (gw >> 1), base - (n ? 7 : 1), 6 + Math.round(r(11) * 3), seed + i, 0.12);
      x += gw; i++; continue;
    }
    const w = 24 + Math.floor(r(1) * 24), st = (n ? 3 : 4) + Math.floor(r(2) * 3), h = st * SH + 4, top = base - h;
    const col = mix(FACADES[Math.floor(r(3) * FACADES.length)], 0xc8dcea, n ? 0.16 : 0.08);
    for (let y = Math.max(P.oy, top); y < Math.min(base, P.oy + P.h); y++) for (let xx = x; xx < x + w; xx++) {
      let c = mul(col, 0.97 + hash(xx >> 2, y >> 2, seed) * 0.05);
      if (xx === x + w - 1) c = mul(c, 0.84); else if (xx === x) c = mix(c, 0xffffff, 0.12);
      if (y < top + 3) c = y === top ? mix(col, 0xffffff, 0.4) : y === top + 1 ? mix(col, 0xffffff, 0.15) : mul(col, 0.74);   // taklisten
      else if ((base - y) % SH === 0) c = mul(c, 0.93);   // våningsbanden
      P.px(xx, y, c);
    }
    const nw = Math.max(2, Math.floor((w - 3) / 7)), gap = (w - nw * 3) / (nw + 1);
    for (let s = 0; s < st; s++) {
      const wy = base - (s + 1) * SH + 3;
      if (s === 0 && n === 0) { shopfront(P, x, w, base, r); continue; }
      for (let k = 0; k < nw; k++) {
        const wx = Math.round(x + gap + k * (3 + gap)), z = hash(i * 7 + s, k, seed + 3);
        P.rect(wx - 1, wy - 1, 5, 6, mix(col, 0xffffff, 0.55));
        for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 3; xx++) P.px(wx + xx, wy + yy, xx + yy === 0 ? 0xd8ecf8 : yy < 2 ? 0x5a7c9c : 0x3a5470);
        if (z > 0.86) { P.px(wx, wy + 1, 0xf4f1ea); P.px(wx + 2, wy + 1, 0xf4f1ea); }   // vita gardiner
        else if (z > 0.79) P.rect(wx, wy + 2, 3, 2, 0xf0c878);                          // en tänd lampa
        if (z < 0.13) { P.hl(wx - 1, wy + 4, 5, 0x4a7a36); P.px(wx, wy + 3, 0xe04a4a); P.px(wx + 2, wy + 3, 0xf0d040); }   // blomlåda
        else if (z < 0.22 && s > 0) { P.hl(wx - 2, wy + 5, 7, 0x5a5e66); for (let q = wx - 2; q < wx + 5; q += 2) P.px(q, wy + 4, 0x6a6e76); }   // balkong
      }
    }
    roofOn(P, V, x, w, top, r, 'mid');
    x += w + (r(5) > 0.72 ? 1 : 0); i++;
  }
}
// gatuplanet (syns bara från entréplanet): skyltfönster med markis och dörr
function shopfront(P, x, w, base, r) {
  const y0 = base - 8, aw = [[0xd83a3a, 0xf4f1ea], [0x2a6aba, 0xf4f1ea], [0x2e8a4a, 0xf0e8c8], [0xe8a020, 0x5a3a20], [0x8e5bd1, 0xf4f1ea]][Math.floor(r(12) * 5)];
  for (let y = y0 + 2; y < base; y++) for (let xx = x + 2; xx < x + w - 2; xx++) P.px(xx, y, y === y0 + 2 ? 0x2a2e36 : mix(0x3a4a5a, 0x6a7e90, (xx - x) / w));
  for (let xx = x + 1; xx < x + w - 1; xx++) { const a = ((xx - x) >> 1) & 1 ? aw[0] : aw[1]; P.px(xx, y0, a); P.px(xx, y0 + 1, mul(a, 0.8)); if ((xx & 1) === 0) P.px(xx, y0 + 2, mul(a, 0.8)); }
  const dx = x + Math.floor(w * (0.3 + r(13) * 0.4)); P.rect(dx, base - 5, 3, 5, 0x6a4a2e); P.px(dx + 2, base - 3, 0xe8c040);
  for (let xx = x + 4; xx < x + w - 4; xx += 2) if (Math.abs(xx - dx - 1) > 2 && hash(xx, 1, 77) > 0.45) P.px(xx, base - 2 - (hash(xx, 2, 77) > 0.6 ? 1 : 0), [0xf0c020, 0xe04a4a, 0x8ac0e8, 0xf4f1ea, 0x46a35a][xx % 5]);
}
function roofOn(P, V, x, w, top, r, layer) {
  const t = r(6);
  let peak = top;
  if (t < 0.46) {   // Göteborgs svarta plåttak med takkupor
    const rh = 5 + Math.floor(r(7) * 4);
    for (let j = 0; j < rh; j++) {
      const ins = Math.round((j + 1) * 1.1);
      for (let xx = x + ins; xx < x + w - ins; xx++) { let c = (xx - x) % 3 === 0 ? 0x50566a : 0x3a3f4e; if (j === rh - 1) c = 0x6a7084; else if (j === 0) c = 0x2a2e3a; P.px(xx, top - 1 - j, c); }
    }
    for (let dx = x + 6; dx < x + w - 9; dx += 11) if (hash(dx, 2, 71) > 0.35) { P.rect(dx, top - 5, 4, 4, 0xe8e4dc); P.rect(dx + 1, top - 4, 2, 2, 0x5a7a9a); P.hl(dx - 1, top - 6, 6, 0x2a2e3a); }
    peak = top - rh;
  } else if (t < 0.78) {   // tegeltak
    const rh = 4 + Math.floor(r(7) * 4);
    for (let j = 0; j < rh; j++) {
      const ins = Math.round((j + 1) * 1.4);
      for (let xx = x + ins; xx < x + w - ins; xx++) { let c = (j & 1) ? 0xa4482e : 0xbc5a3a; if (((xx + (j & 1) * 2) % 4) === 0) c = mul(c, 0.86); if (j === rh - 1) c = 0x7a3220; P.px(xx, top - 1 - j, c); }
    }
    peak = top - rh;
  } else {   // platt tak: räcke, fläktar och en antenn
    P.hl(x, top - 1, w, 0xb8bec6);
    for (let k = 0; k < 2; k++) { const bx = x + 4 + Math.floor(hash(x, k, 72) * (w - 12)); P.rect(bx, top - 4, 5, 3, 0x9aa2ac); P.hl(bx, top - 4, 5, 0xc4ccd4); }
    const ax = x + w - 6; P.vl(ax, top - 10, 9, 0x5a5e66); P.hl(ax - 2, top - 9, 5, 0x5a5e66); P.hl(ax - 1, top - 7, 3, 0x5a5e66);
    peak = top - 1;
  }
  if (r(14) > 0.86 && t < 0.78) {   // hörntorn med kopparkupol
    const tx = x + w - 8;
    P.rect(tx, peak - 6, 6, 7, 0xe2dccc); P.px(tx + 2, peak - 4, 0x5a7c9c); P.px(tx + 3, peak - 4, 0x5a7c9c);
    for (let j = 0; j < 4; j++) P.hl(tx + j, peak - 7 - j, Math.max(1, 6 - j * 2), j ? 0x6aa894 : 0x5a9884);
    P.vl(tx + 3, peak - 13, 3, 0x4a6a64);
  }
  const nc = r(8) > 0.35 ? 1 + (r(15) > 0.55 ? 1 : 0) : 0;
  for (let k = 0; k < nc; k++) {
    const cx = x + 5 + Math.floor(hash(x, k + 5, 73) * (w - 12));
    P.rect(cx, peak - 3, 3, top - peak + 3, 0xa45a40); P.vl(cx + 2, peak - 3, top - peak + 3, 0x8a4a34); P.hl(cx - 1, peak - 4, 5, 0x5a5e66);
    if (hash(x, k + 9, 73) > 0.3) V.smoke.push({ layer, x: cx + 1, y: peak - 5, ph: hash(x, k, 74) * 9, s: 0.8 });
  }
}
function tree(P, cx, base, rad, seed, haze = 0) {
  const cy = base - 3 - rad;
  P.rect(cx - 1, cy, 2, base - cy, mix(0x6a4a30, 0xc8dcea, haze));
  for (let y = -rad; y <= rad; y++) for (let x = -rad - 1; x <= rad + 1; x++) {
    const e = (x / (rad + 1)) ** 2 + (y / rad) ** 2 + (hash(cx + x, y, seed) - 0.5) * 0.35;
    if (e > 1) continue;
    const l = -(x + y) / (rad * 2) + 0.18 + (bayer(cx + x, y) - 0.5) * 0.3;
    const c = l > 0.35 ? 0x8cc462 : l > 0.1 ? 0x5a9e46 : l > -0.15 ? 0x3a7e38 : 0x28602c;
    P.px(cx + x, cy + y, mix(c, 0xc8dcea, haze));
  }
}

// ---------- entréplanet: gatan med spårvagnen och torget framför gallerian ----------
function paintStreet(P, V) {
  const y0 = V.mid;
  for (let x = P.L0; x < P.L1; x++) {
    P.px(x, y0, 0xbcb6aa); P.px(x, y0 + 1, 0xa49e94);   // trottoaren på andra sidan
    for (let y = y0 + 2; y < y0 + 9; y++) {
      let c = mix(0x5c5f66, 0x50535a, hash(x >> 1, y, 81));
      if (y === y0 + 5 && (x % 14) < 7) c = 0xe8e4d8;    // mittlinjen
      if (y === y0 + 7 || y === y0 + 3) c = mix(c, 0x9aa0a8, 0.55);   // spårvagnsrälsen
      P.px(x, y, c);
    }
    P.px(x, y0 - 9, 0x3a3e46, 0.75);   // kontaktledningen
  }
  for (let x = Math.ceil(P.L0 / 64) * 64; x < P.L1; x += 64) { P.vl(x, y0 - 10, 11, 0x4a4e56); P.px(x - 1, y0 - 10, 0x4a4e56); P.px(x + 1, y0 - 9, 0x4a4e56); }
}
function paintPlaza(P, V) {
  const y0 = V.mid + 9, y1 = V.y1, lc = LC(V, P.k);
  P.hl(P.L0, y0, P.L1 - P.L0, 0x8e887e);
  let y = y0 + 1, row = 0;
  while (y < y1) {   // stenplattorna: raderna blir högre närmare glaset
    const rh = 2 + (row >> 1), bw = 6 + row * 2;
    for (let yy = y; yy < Math.min(y1, y + rh); yy++) for (let x = P.L0; x < P.L1; x++) {
      const sx = x + (row & 1) * (bw >> 1), lx = ((sx % bw) + bw) % bw;
      let c = mix(0xcac2b4, 0xb8b0a2, hash(Math.floor(sx / bw), row, 82));
      if (yy === y || lx === 0) c = mul(c, 0.86);
      P.px(x, yy, c);
    }
    y += rh; row++;
  }
  const gy = y1 - 3;   // marken där sakerna på torget står
  // reklampelaren
  { const x = lc - 214; P.rect(x - 3, gy - 18, 7, 18, 0x2e5a3e); P.rect(x - 4, gy - 20, 9, 2, 0x24483a); P.rect(x - 2, gy - 23, 5, 3, 0x2e5a3e);
    [[0xf0c020, -3, 3], [0xd83a4a, -3, 9], [0x3a7bd5, 1, 3], [0xf4f1ea, 1, 9]].forEach(([c, dx, dy]) => P.rect(x + dx, gy - 18 + dy, 3, 5, c)); P.vl(x + 3, gy - 18, 18, 0x1e3a2a); }
  // träd i trädgaller
  for (const [x, s] of [[lc - 160, 1], [lc - 14, 2], [lc + 150, 3]]) { tree(P, x, gy, 10, 90 + s); P.rect(x - 5, gy - 1, 10, 2, 0x3a3e46); P.hl(x - 5, gy - 1, 10, 0x5a5e66); }
  // lyktstolparna
  for (const x of [lc - 96, lc + 64, lc + 236]) {
    P.vl(x, gy - 26, 26, 0x2e3a34); P.vl(x + 1, gy - 26, 26, 0x46524a); P.rect(x - 1, gy - 2, 4, 2, 0x2e3a34);
    P.hl(x - 3, gy - 31, 8, 0x2e3a34); P.rect(x - 2, gy - 30, 6, 4, 0x2e3a34); P.rect(x - 1, gy - 29, 4, 2, 0xfff0b8); P.px(x + 1, gy - 32, 0x2e3a34);
  }
  // cykelstället med cyklar
  { const x0 = lc - 70; P.hl(x0 - 2, gy - 3, 30, 0x8a929c);
    for (let k = 0; k < 4; k++) { const bx = x0 + k * 7, col = [0xd83a4a, 0x3a7bd5, 0x2a2a30, 0x46a35a][k];
      for (const wx of [bx, bx + 5]) { P.px(wx - 1, gy - 2, 0x1e1e24); P.px(wx + 1, gy - 2, 0x1e1e24); P.px(wx, gy - 3, 0x1e1e24); P.px(wx, gy - 1, 0x1e1e24); }
      P.line(bx, gy - 2, bx + 2, gy - 5, col); P.line(bx + 2, gy - 5, bx + 5, gy - 2, col); P.hl(bx + 2, gy - 5, 3, col); P.px(bx + 1, gy - 6, 0x2a2a30); P.px(bx + 4, gy - 6, 0x6a6e76); } }
  // busskuren med tidtabell och reklam
  { const x = lc + 186;
    P.rect(x, gy - 18, 22, 1, 0x3a3e46); P.rect(x - 1, gy - 19, 24, 2, 0x5a5e66);
    for (let yy = gy - 17; yy < gy; yy++) for (let xx = x + 1; xx < x + 21; xx++) P.px(xx, yy, 0xcfe6f0, 0.3);
    P.vl(x, gy - 17, 17, 0x5a5e66); P.vl(x + 21, gy - 17, 17, 0x5a5e66);
    P.rect(x + 13, gy - 15, 7, 12, 0xf4f1ea); P.rect(x + 14, gy - 14, 5, 6, 0xf090b8); P.rect(x + 14, gy - 7, 5, 3, 0x3a7bd5);   // reklamtavlan
    P.hl(x + 3, gy - 6, 8, 0x8a6a4a); P.vl(x + 3, gy - 5, 2, 0x5a5e66); P.vl(x + 10, gy - 5, 2, 0x5a5e66);   // bänken
    P.vl(x - 4, gy - 22, 22, 0x6a7078); P.rect(x - 7, gy - 26, 7, 5, 0xf0c020); P.box(x - 7, gy - 26, 7, 5, 0x2a6a3a); P.rect(x - 5, gy - 25, 3, 3, 0x2a6a3a); }   // hållplatsskylten
  // blomlådor
  for (const x of [lc + 92, lc - 124]) { P.rect(x, gy - 4, 14, 4, 0xa8a49c); P.hl(x, gy - 4, 14, 0xc8c4bc); for (let k = 0; k < 14; k++) { P.px(x + k, gy - 5, 0x3a8a3a); if (hash(x + k, 1, 85) > 0.45) P.px(x + k, gy - 6 - (k & 1), [0xe04a5a, 0xf0c020, 0xf4f1ea, 0xd860b0][k % 4]); } }
  // flaggstänger (flaggorna vajar, se drawPlazaLive)
  for (const [k, x] of [[0, lc + 6], [1, lc + 20], [2, lc + 34]]) {
    P.vl(x, gy - 36, 36, 0xf4f1ea); P.vl(x + 1, gy - 36, 36, 0xc8c4bc); P.px(x, gy - 37, 0xe8c040); P.px(x + 1, gy - 37, 0xc8a030); P.rect(x - 1, gy - 1, 4, 1, 0x8a8e96);
    V.flags.push({ x: x + 2, y: gy - 35, kind: k });
  }
}

// ---------- hustaken nedanför (plan 1 och 2) ----------
function paintNear(P, V) {
  const seed = 90 + V.n, bot = P.oy + P.h;
  let x = P.L0 - 24, i = 0;
  while (x < P.L1) {
    const r = (k) => hash(i, k, seed), kind = r(3), gable = kind >= 0.5 && kind < 0.75;
    const w = gable ? 30 + Math.floor(r(1) * 18) : 46 + Math.floor(r(1) * 40), ridge = V.near + Math.floor(r(2) * 10) - 5;
    if (kind < 0.5) pitchedRoof(P, V, x, w, ridge, r);
    else if (gable) gableHouse(P, V, x, w, ridge - 4, r);
    else if (kind < 0.9) flatRoof(P, V, x, w, ridge + 3, r);
    else greenRoof(P, V, x, w, ridge + 4, r);
    const gap = r(4) > 0.55 ? 3 : 0;
    if (gap) for (let y = ridge + 3; y < bot; y++) for (let xx = x + w; xx < x + w + gap; xx++) P.px(xx, y, mix(0x2e323c, 0x3e4450, (y - ridge) / 30));
    x += w + gap; i++;
  }
}
function pitchedRoof(P, V, x, w, ridge, r) {
  // takfallet mot oss: takpannor i rader, Göteborgs svarta plåt med falsar, eller ärgad koppar
  const t = r(5), kind = t < 0.45 ? 'tile' : t < 0.86 ? 'tin' : 'copper', bot = P.oy + P.h;
  for (let y = ridge; y < bot; y++) {
    const j = y - ridge, l = Math.max(x, x + 6 - j), rr = Math.min(x + w, x + w - 6 + j);
    for (let xx = l; xx < rr; xx++) {
      let c;
      if (kind === 'tile') {
        const row = Math.floor(j / 3), ry = j % 3, base = (row & 1) ? 0xb4553a : 0xc0603f;
        c = ry === 0 ? mix(base, 0xffffff, 0.14) : ry === 2 ? mul(base, 0.7) : base;
        if (ry === 1 && (xx + row * 2) % 3 === 0) c = mul(base, 0.88);
        if (hash(xx >> 1, y >> 1, 91) > 0.96) c = mix(c, 0x6a8a3a, 0.5);   // mossa
      } else {
        const base = kind === 'tin' ? 0x3e4454 : 0x6aa894, sx = (xx - x) % 4;
        c = sx === 0 ? mix(base, 0xffffff, 0.24) : sx === 1 ? mul(base, 0.78) : base;
        if (kind === 'copper' && hash(xx, y >> 2, 95) > 0.88) c = mix(c, 0x9ad4bc, 0.4);
      }
      if (xx === l) c = mix(c, 0xffffff, 0.28); else if (xx === rr - 1) c = mul(c, 0.6);   // valmade hörn: solsidan och skuggsidan
      P.px(xx, y, c);
    }
  }
  const cap = kind === 'tile' ? [0xcc6c4c, 0x7a3222] : kind === 'tin' ? [0x6a7286, 0x23262e] : [0x9ad4bc, 0x3e7a68];
  P.hl(x + 6, ridge - 1, w - 12, cap[0]); P.hl(x + 6, ridge, w - 12, cap[1]);
  // takfönster som speglar himlen
  const nwin = 1 + Math.floor(r(6) * 3);
  for (let k = 0; k < nwin; k++) {
    const sx = x + 10 + Math.floor(((k + 0.5) / nwin) * (w - 26)), sy = ridge + 5 + Math.floor(hash(x, k, 92) * 3);
    P.rect(sx - 1, sy - 1, 9, 7, 0x4a4e56);
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 7; xx++) P.px(sx + xx, sy + yy, xx - yy === 2 || xx - yy === 3 ? 0xe8f4fc : mix(0xa8d4ee, 0x6a9ac4, yy / 5));
  }
  // solpaneler på vartannat tak
  if (r(7) > 0.55) { const sx = x + w - 30, sy = ridge + 4; for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 18; xx++) P.px(sx + xx, sy + yy, xx % 6 === 0 || yy === 3 ? 0x8aa0c0 : mix(0x2a3a6a, 0x3a5090, yy / 7)); }
  // skorstenen (röken stiger)
  if (r(8) > 0.25) {
    const cx = x + 8 + Math.floor(r(9) * (w - 20));
    P.rect(cx, ridge - 7, 5, 10, 0xa45a40); for (let yy = ridge - 6; yy < ridge + 3; yy += 2) P.hl(cx, yy, 5, 0x8a4a34); P.vl(cx + 4, ridge - 7, 10, 0x7a3e2c);
    P.rect(cx - 1, ridge - 8, 7, 1, 0x5a5e66); P.rect(cx, ridge - 9, 2, 1, 0x4a4e56); P.rect(cx + 3, ridge - 9, 2, 1, 0x4a4e56);
    V.smoke.push({ layer: 'near', x: cx + 1, y: ridge - 10, ph: r(10) * 9, s: 1.3 }, { layer: 'near', x: cx + 4, y: ridge - 10, ph: r(10) * 9 + 4, s: 1.3 });
  }
  // tv-antennen och en parabol
  if (r(11) > 0.4) { const ax = x + 12 + Math.floor(r(12) * (w - 24)); P.vl(ax, ridge - 15, 14, 0x4a4e56); for (const [dy, hw] of [[-14, 4], [-11, 3], [-8, 2]]) P.hl(ax - hw, ridge + dy, hw * 2 + 1, 0x5a5e66); }
  if (r(13) > 0.6) { const dx = x + 6 + Math.floor(r(14) * (w - 14)), dy = ridge + 9; P.rect(dx, dy, 4, 3, 0xe8e8e4); P.px(dx + 1, dy + 1, 0xc4c4c0); P.px(dx + 4, dy + 1, 0x6a6e76); }
  // fåglar på nocken: duvor eller en fiskmås
  if (r(15) > 0.45) {
    const bx = x + 10 + Math.floor(r(16) * (w - 22));
    if (r(17) > 0.5) { P.rect(bx, ridge - 3, 3, 2, 0xf4f4f0); P.px(bx, ridge - 3, 0xa9b3c1); P.px(bx + 3, ridge - 3, 0xe8c040); P.px(bx + 1, ridge - 1, 0xe2a676); }
    else for (let k = 0; k < 3; k++) { P.rect(bx + k * 4, ridge - 2, 2, 1, 0x8a8e9a); P.px(bx + k * 4 + 2, ridge - 3, 0x6a6e7a); }
  }
}
function gableHouse(P, V, x, w, ridge, r) {
  // ett hus med gaveln mot oss: vindskivor, gavelfönster och fönsterrader under takfoten
  const bot = P.oy + P.h, half = w / 2, eave = ridge + Math.round(half * 0.75), col = FACADES[Math.floor(r(5) * FACADES.length)];
  const roofC = r(6) < 0.6 ? [0xc0603f, 0x8a3a24] : [0x50586a, 0x23262e];
  for (let y = ridge; y < bot; y++) for (let xx = x; xx < x + w; xx++) {
    const dx = Math.abs(xx + 0.5 - (x + half)), d = y - (ridge + dx * (eave - ridge) / half);
    if (d < 0) continue;
    let c;
    if (d < 3) c = d < 1 ? mix(roofC[0], 0xffffff, 0.22) : d < 2 ? roofC[0] : roofC[1];
    else { c = mul(col, 0.97 + hash(xx >> 2, y >> 2, 96) * 0.05); if (xx === x || xx === x + w - 1) c = mul(c, 0.84); if (d < 5) c = mul(c, 0.85); }
    P.px(xx, y, c);
  }
  const ay = Math.round(ridge + (eave - ridge) * 0.6), cx = Math.round(x + half) - 1;
  P.rect(cx - 2, ay - 1, 5, 5, mix(col, 0xffffff, 0.55)); P.rect(cx - 1, ay, 3, 3, 0x4a6a8a); P.px(cx - 1, ay, 0xd8ecf8);
  const nw = Math.max(2, Math.floor((w - 4) / 8)), gap = (w - nw * 3) / (nw + 1);
  for (let wy = eave + 4; wy < bot; wy += 9) for (let k = 0; k < nw; k++) {
    const wx = Math.round(x + gap + k * (3 + gap)), z = hash(x + k, wy, 97);
    P.rect(wx - 1, wy - 1, 5, 6, mix(col, 0xffffff, 0.55));
    for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 3; xx++) P.px(wx + xx, wy + yy, xx + yy === 0 ? 0xd8ecf8 : yy < 2 ? 0x5a7c9c : 0x3a5470);
    if (z > 0.8) P.rect(wx, wy + 2, 3, 2, 0xf0c878); else if (z < 0.2) { P.hl(wx - 1, wy + 4, 5, 0x4a7a36); P.px(wx + 1, wy + 3, 0xe04a8a); }
  }
  if (r(8) > 0.4) {   // skorstenen på nocken
    const sx = Math.round(x + half) + 3, sy = ridge + 2;
    P.rect(sx, sy - 7, 4, 7, 0xa45a40); P.vl(sx + 3, sy - 7, 7, 0x7a3e2c); P.rect(sx - 1, sy - 8, 6, 1, 0x5a5e66);
    V.smoke.push({ layer: 'near', x: sx + 1, y: sy - 10, ph: r(10) * 9, s: 1.2 });
  }
  if (r(15) > 0.6) { P.rect(Math.round(x + half) - 1, ridge - 3, 3, 2, 0xf4f4f0); P.px(Math.round(x + half) - 1, ridge - 3, 0xa9b3c1); P.px(Math.round(x + half) + 2, ridge - 3, 0xe8c040); }   // en fiskmås på nocken
}
function flatRoof(P, V, x, w, top, r) {
  const bot = P.oy + P.h;
  for (let y = top; y < bot; y++) for (let xx = x; xx < x + w; xx++) {
    let c = mix(0x9a968e, 0x8a867e, hash(xx, y, 93));
    if (y === top) c = 0xd0ccc4; else if (y === top + 1) c = 0x6a665e;
    if (xx === x || xx === x + w - 1) c = mul(c, 0.8);
    P.px(xx, y, c);
  }
  if (r(6) > 0.45) {   // takterrass: trädäck, parasoll, solstolar, krukor och ljusslinga
    const tx = x + 6, tw = Math.min(40, w - 12);
    for (let y = top + 3; y < bot; y++) for (let xx = tx; xx < tx + tw; xx++) P.px(xx, y, ((xx >> 2) & 1) ? 0xa87448 : 0x966640);
    const px = tx + 10, col = [0xd83a4a, 0x3a7bd5, 0xf0c020][Math.floor(r(7) * 3)];
    P.vl(px, top - 8, 12, 0x6a6e76);
    for (let j = 0; j < 4; j++) for (let k = -(j * 2 + 2); k <= j * 2 + 2; k++) P.px(px + k, top - 11 + j, ((k + 9) >> 1) & 1 ? col : 0xf4f1ea);
    for (const sx of [px + 8, px + 15]) { P.line(sx, top + 5, sx + 4, top + 2, 0x3a7bd5); P.line(sx + 1, top + 5, sx + 5, top + 2, 0x6aa0e0); P.px(sx, top + 6, 0x6a6e76); }
    for (const kx of [tx + 1, tx + tw - 4]) { P.rect(kx, top + 1, 3, 3, 0xc0643a); P.rect(kx - 1, top - 3, 5, 4, 0x3a8a3a); P.px(kx, top - 3, 0x5aaa4a); }
    for (let k = 0; k < tw; k++) { const yy = top - 4 + Math.round(Math.sin((k / tw) * Math.PI) * 2); P.px(tx + k, yy, 0x4a4e56); if (k % 4 === 2) P.px(tx + k, yy + 1, [0xffd23f, 0xff7a5a, 0x7ad0ff, 0xb8f07a][(k >> 2) % 4]); }
  }
  for (let k = 0; k < 2; k++) {   // fläktar
    const bx = x + w - 14 - k * 13; if (bx < x + 4) continue;
    P.rect(bx, top - 5, 10, 6, 0xa8b0b8); P.hl(bx, top - 5, 10, 0xd4dae0); P.vl(bx + 9, top - 5, 6, 0x7a828a);
    for (let q = 0; q < 3; q++) P.hl(bx + 2, top - 3 + q * 1, 6, 0x6a727a, q === 1 ? 0 : 1);
  }
  if (r(8) > 0.5) { const ax = x + w - 4; P.vl(ax, top - 14, 13, 0x4a4e56); P.hl(ax - 3, top - 12, 7, 0x5a5e66); P.hl(ax - 2, top - 9, 5, 0x5a5e66); }
}
function greenRoof(P, V, x, w, top, r) {
  const bot = P.oy + P.h;
  for (let y = top; y < bot; y++) for (let xx = x; xx < x + w; xx++) {
    const h = hash(xx >> 1, y >> 1, 94), k = hash(xx, y, 98);
    let c = h > 0.95 ? 0xb85a3a : h > 0.88 ? 0xc8c04a : k > 0.55 ? 0x6aa040 : 0x5a9238;   // sedum: mest grönt med gula och röda tuvor
    if (y === top) c = 0xd0ccc4; else if (y === top + 1) c = 0x6a665e;
    P.px(xx, y, c);
  }
  for (let k = 0; k < 2; k++) {   // bikupor
    const bx = x + 8 + k * 9;
    P.rect(bx, top - 4, 7, 6, k ? 0xf0d060 : 0xf4f1ea); P.hl(bx, top - 2, 7, 0x000000, 0.15); P.rect(bx - 1, top - 5, 9, 1, 0x8a6a4a); P.px(bx + 3, top + 1, 0x3a2a1a);
  }
}

// ---------- molnen, folket och trafiken (rörliga) ----------
function makeClouds(V) {
  const [ya, yb] = V.cloudY, out = [], N = 9 + V.n * 2, seed = 200 + V.n;
  for (let i = 0; i < N; i++) {
    const u = hash(i, 3, seed), y = Math.round(ya + u * (yb - ya));
    // högt upp: stora moln som driver fort; nere vid horisonten: små och långsamma (långt bort)
    const sz = Math.min(CLOUD_SPEC.length - 1, Math.floor(u * 6 + hash(i, 1, seed) * 3.5) - (V.n > 1 ? 1 : 0));
    out.push({ s: Math.max(0, sz), x: hash(i, 2, seed) * 1200, y: y - Math.round(CLOUD_SPEC[Math.max(0, sz)][1] * 0.6), v: 0.6 + (1 - u) * 2.6 });
  }
  return out.sort((a, b) => b.s - a.s);   // de små (längst bort) först
}
const SKIN = ['#f1c9a5', '#e0ac69', '#c68642', '#8d5524', '#f6d7c3'];
const SHIRT = ['#d83a4a', '#3a7bd5', '#46a35a', '#f0b429', '#8e5bd1', '#f28bb3', '#f4f1ea', '#2b2b30', '#e07a2e'];
const HAIR = ['#2a1d1a', '#6a4a2a', '#c8a050', '#1a1416', '#a0522d', '#d8d0c0'];
const PANTS = ['#2d3a5c', '#3a3a40', '#5a4a3a', '#2a4a6a', '#6a6e76'];
function makeWalkers(V) {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const h = (k) => hash(i, k, 400);
    out.push({ x: h(1) * 900, v: (h(2) > 0.5 ? 1 : -1) * (5 + h(3) * 6), y: V.y1 - 2 - Math.floor(h(4) * 7), kid: h(5) > 0.72,
      skin: SKIN[Math.floor(h(6) * SKIN.length)], shirt: SHIRT[Math.floor(h(7) * SHIRT.length)], hair: HAIR[Math.floor(h(8) * HAIR.length)], pants: PANTS[Math.floor(h(9) * PANTS.length)],
      bag: h(10) > 0.6 ? SHIRT[Math.floor(h(11) * 6)] : null, balloon: h(5) > 0.72 && h(12) > 0.4, dog: h(13) > 0.86 });
  }
  return out;
}
const fr = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
function miniPerson(c, x, y, p, step, dir) {   // 9 pixlar hög (barn 7): som grannarna i rummens fönster, fast närmare
  const s = p.kid ? 2 : 0;
  fr(c, x, y - 9 + s, 2, 1, p.hair); fr(c, x, y - 8 + s, 2, 1, p.skin);
  fr(c, x, y - 7 + s, 2, 3 - (s ? 1 : 0), p.shirt);
  fr(c, x - 1, y - 7 + s, 1, 2, p.skin); fr(c, x + 2, y - 7 + s, 1, 2, p.skin);
  const ly = y - 4 + (s ? 1 : 0), lh = s ? 2 : 3;
  if (step) { fr(c, x - 1, ly, 1, lh, p.pants); fr(c, x + 2, ly, 1, lh, p.pants); } else { fr(c, x, ly, 1, lh, p.pants); fr(c, x + 1, ly, 1, lh, p.pants); }
  if (p.bag) fr(c, x + (dir > 0 ? -2 : 3), y - 5 + s, 2, 2, p.bag);
  if (p.balloon) { fr(c, x + 2, y - 15, 1, 8, 'rgba(60,60,70,0.6)'); fr(c, x + 1, y - 19, 3, 4, '#e8333a'); fr(c, x + 1, y - 19, 1, 1, '#ff9a9a'); }
  if (p.dog) { const dx = x + dir * 5; fr(c, dx, y - 3, 4, 2, '#8a5a30'); fr(c, dx + (dir > 0 ? 3 : -1), y - 4, 2, 2, '#8a5a30'); fr(c, dx, y - 1, 1, 1, '#5a3a1a'); fr(c, dx + 3, y - 1, 1, 1, '#5a3a1a'); }
}
const VEHICLES = [
  { kind: 'tram', v: 13, x0: 0, lane: 1 }, { kind: 'car', v: 22, x0: 160, lane: 0, col: '#d83a4a' }, { kind: 'bus', v: 16, x0: 420, lane: 0 },
  { kind: 'car', v: 26, x0: 300, lane: 1, col: '#f4f1ea' }, { kind: 'car', v: 19, x0: 620, lane: 0, col: '#3a7bd5' }, { kind: 'car', v: 24, x0: 760, lane: 1, col: '#f0b429' },
];
function vehicle(c, x, y, k, dir) {
  const m = (dx, dy, w, h, col) => fr(c, dir > 0 ? x + dx : x - dx - w, y + dy, w, h, col);
  if (k.kind === 'car') {
    m(0, -4, 14, 3, k.col); m(3, -6, 7, 2, k.col); m(4, -6, 2, 1, '#bfe0f0'); m(7, -6, 2, 1, '#bfe0f0'); m(0, -2, 14, 1, 'rgba(0,0,0,0.25)');
    m(2, -2, 3, 2, '#1e1e24'); m(9, -2, 3, 2, '#1e1e24'); m(3, -1, 1, 1, '#9aa0a8'); m(10, -1, 1, 1, '#9aa0a8'); m(13, -4, 1, 1, '#fff4c0'); m(0, -4, 1, 1, '#d83a3a');
  } else if (k.kind === 'bus') {
    m(0, -10, 30, 8, '#2a6ab8'); m(0, -10, 30, 1, '#5a9ae0'); m(0, -5, 30, 1, '#f4f1ea');
    for (let i = 0; i < 6; i++) m(3 + i * 4, -9, 3, 3, '#bfe0f0');
    m(26, -9, 3, 3, '#1e2a3a'); m(27, -9, 2, 1, '#f0a020'); m(9, -6, 3, 4, '#1e2a3a');
    m(4, -2, 4, 2, '#1e1e24'); m(22, -2, 4, 2, '#1e1e24'); m(5, -1, 1, 1, '#9aa0a8'); m(23, -1, 1, 1, '#9aa0a8');
  } else {   // spårvagnen: blå och vit med strömavtagaren mot kontaktledningen
    for (const s of [0, 24]) { m(s, -11, 23, 9, '#f4f1ea'); m(s, -5, 23, 3, '#2a5ab0'); m(s, -11, 23, 1, '#c8d0d8'); for (let i = 0; i < 5; i++) m(s + 2 + i * 4, -9, 3, 3, '#9cc8e0'); m(s + 3, -2, 4, 2, '#2a2a30'); m(s + 16, -2, 4, 2, '#2a2a30'); }
    m(23, -10, 1, 8, '#3a3e46'); m(44, -9, 2, 3, '#1e2a3a'); m(45, -9, 1, 1, '#f0a020');
    m(12, -12, 6, 1, '#3a3e46'); m(13, -14, 1, 2, '#3a3e46'); m(16, -14, 1, 2, '#3a3e46'); m(14, -16, 2, 2, '#3a3e46'); m(12, -17, 6, 1, '#3a3e46');
  }
}
function drawTraffic(c, V, t, off) {
  const L0 = V.x0 - Math.ceil(V.camMax * K.street) - 60, span = V.x1 + 60 - L0;
  for (const k of VEHICLES) {
    const dir = k.lane ? 1 : -1, len = k.kind === 'tram' ? 47 : k.kind === 'bus' ? 30 : 14;
    const x = wrap(k.x0 + dir * k.v * t, L0, span + len) - (dir > 0 ? len : 0);
    vehicle(c, Math.round(x) + off, V.mid + (k.lane ? 8 : 4), k, dir);
  }
  // folk på trottoaren på andra sidan (små: de är långt bort)
  for (let i = 0; i < 6; i++) {
    const dir = i & 1 ? 1 : -1, x = Math.round(wrap(hash(i, 1, 410) * 900 + dir * (3 + i) * t, L0, span)) + off, y = V.mid + 1, st = Math.floor(t * 3 + i) & 1;
    fr(c, x, y - 5, 1, 1, SKIN[i % 5]); fr(c, x, y - 4, 1, 2, SHIRT[(i * 3) % 9]); fr(c, x - st, y - 2, 1, 2, PANTS[i % 5]); fr(c, x + st, y - 2, 1, 2, PANTS[i % 5]);
  }
}
const FLAG = [
  (x, y) => (x === 3 || x === 4 || y === 2 || y === 3 ? '#f0c020' : '#2a6ab8'),                                       // Sverige
  (x, y) => ((x === 4 || x === 5) && y >= 1 && y <= 4) || ((y === 2 || y === 3) && x >= 3 && x <= 6) ? '#ffd23f' : '#d8458a',   // Galleria Stjärnan
  (x, y) => (y & 1 ? '#f4f1ea' : '#2e8a4a'),
];
function drawPlazaLive(c, V, t, off) {
  for (const f of V.flags) for (let x = 0; x < 10; x++) {
    const dy = Math.round(Math.sin(t * 4.5 - x * 0.7 + f.kind) * 0.9 + x * 0.08);
    for (let y = 0; y < 6; y++) fr(c, f.x + x + off, f.y + y + dy, 1, 1, FLAG[f.kind](x, y));
  }
  const L0 = V.x0 - Math.ceil(V.camMax * K.plaza) - 20, span = V.x1 + 20 - L0;
  for (const p of [...V.walkers].sort((a, b) => a.y - b.y)) {
    const x = Math.round(wrap(p.x + p.v * t, L0, span)) + off;
    miniPerson(c, x, p.y, p, Math.floor(t * Math.abs(p.v) * 0.45 + p.x) & 1, Math.sign(p.v));
  }
  // duvorna som pickar på torget
  const px = LC(V, K.plaza) - 40 + off;
  for (let k = 0; k < 4; k++) { const bob = Math.sin(t * 3 + k * 2) > 0.6 ? 1 : 0; fr(c, px + k * 6, V.y1 - 3 + bob, 3, 2, '#8a8e9a'); fr(c, px + k * 6 + (k & 1 ? -1 : 3), V.y1 - 4 + bob * 2, 1, 1, '#5a5e6a'); }
}
function drawSmoke(c, V, t, layer, off) {
  for (const s of V.smoke) {
    if (s.layer !== layer) continue;
    for (let i = 0; i < 5; i++) {
      const p = ((t * 0.28 + s.ph + i / 5) % 1), sz = 1 + Math.floor(p * 3 * s.s);
      const x = s.x + off + Math.round(p * 9 * s.s + Math.sin(t + i) * 0.6), y = s.y - Math.round(p * 15 * s.s);
      c.fillStyle = `rgba(236,238,242,${(0.55 * (1 - p)).toFixed(3)})`; c.fillRect(x, y, sz, sz);
    }
  }
}
function drawFarLive(c, V, t, off) {
  if (V.water) {   // båtarna på älven: färjan och en segelbåt
    const L0 = V.x0 - Math.ceil(V.camMax * K.far) - 30, span = V.x1 + 30 - L0, y = V.water.y;
    const fx = Math.round(wrap(80 + t * 2.2, L0, span)) + off;
    fr(c, fx, y - 2, 12, 2, '#f4f4f0'); fr(c, fx + 1, y, 10, 1, '#d83a3a'); fr(c, fx + 3, y - 4, 6, 2, '#f4f4f0'); fr(c, fx + 4, y - 4, 1, 1, '#5a7c9c'); fr(c, fx + 6, y - 4, 1, 1, '#5a7c9c'); fr(c, fx + 7, y - 6, 1, 2, '#3a3e46');
    fr(c, fx - 6, y + 1, 6, 1, 'rgba(255,255,255,0.5)');
    const sx = Math.round(wrap(400 - t * 1.3, L0, span)) + off;
    fr(c, sx, y - 1, 6, 1, '#f4f1ea'); fr(c, sx + 1, y, 4, 1, '#2a5ab0'); fr(c, sx + 3, y - 7, 1, 6, '#5a4a3a');
    for (let j = 0; j < 5; j++) fr(c, sx + 4, y - 6 + j, 1 + (j >> 1), 1, '#ffffff');
  }
  const hw = V.wheel;
  if (hw) {   // pariserhjulet: fälgen, ekrarna och gondolerna snurrar sakta
    const a0 = t * 0.12;
    for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; fr(c, Math.round(hw.x + off + Math.cos(a) * hw.r), Math.round(hw.y + Math.sin(a) * hw.r), 1, 1, '#8c9cb0'); }
    for (let k = 0; k < 8; k++) {
      const a = a0 + (k / 8) * Math.PI * 2;
      for (let q = 2; q < hw.r; q += 2) fr(c, Math.round(hw.x + off + Math.cos(a) * q), Math.round(hw.y + Math.sin(a) * q), 1, 1, '#a0aec0');
      fr(c, Math.round(hw.x + off + Math.cos(a) * hw.r) - 1, Math.round(hw.y + Math.sin(a) * hw.r) + 1, 2, 2, ['#d86a6a', '#e8c060', '#6a9ad8', '#7ac08a'][k % 4]);
    }
    fr(c, hw.x + off, hw.y, 1, 1, '#6a7a8e');
  }
  for (const tb of V.turbines) {   // vindkraftverken
    const a0 = t * 1.6 + tb.ph;
    fr(c, tb.x + off, tb.y, 2, 1, '#e8eef2');
    for (let k = 0; k < 3; k++) { const a = a0 + (k / 3) * Math.PI * 2; for (let q = 1; q <= 5; q++) fr(c, Math.round(tb.x + off + Math.cos(a) * q), Math.round(tb.y + Math.sin(a) * q), 1, 1, '#eef2f4'); }
  }
}
function drawPlane(c, V, t, off) {
  const cyc = t % 70; if (cyc > 44) return;
  const L0 = V.x0 - Math.ceil(V.camMax * K.plane) - 20, span = V.x1 + 140 - L0;
  const x = Math.round(L0 + (cyc / 44) * span) + off, y = V.y0 + 7 + V.n * 2;
  for (let i = 4; i < 110; i++) { const a = 0.5 * (1 - i / 110); if ((i & 1) || i < 40) { c.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; c.fillRect(x - i, y, 1, 1); if (i > 8) c.fillRect(x - i, y + 1 + (i > 70 ? 1 : 0), 1, 1); } }
  fr(c, x - 3, y, 8, 1, '#f4f6f8'); fr(c, x + 5, y, 1, 1, '#c8d0d8'); fr(c, x - 3, y - 1, 1, 1, '#f4f6f8'); fr(c, x, y + 1, 2, 1, '#d0d8e0'); fr(c, x - 1, y - 1, 2, 1, '#e0e6ec');
}
function drawBalloon(c, V, t, off) {
  if (V.n === 0) return;
  const L0 = V.x0 - Math.ceil(V.camMax * K.balloon) - 20, span = V.x1 + 20 - L0;
  const x = Math.round(wrap(120 + t * 1.6, L0, span)) + off, y = V.cloudY[1] - 4 + Math.round(Math.sin(t * 0.4) * 2);
  const cols = ['#e8333a', '#f6d02f', '#3a7bd5', '#f6d02f', '#e8333a'];
  const rows = [[2, 5], [1, 7], [0, 9], [0, 9], [0, 9], [1, 7], [2, 5], [3, 3]];
  rows.forEach(([a, w], j) => { for (let i = 0; i < w; i++) fr(c, x + a + i, y + j, 1, 1, cols[Math.floor(((a + i) / 9) * 5)]); });
  fr(c, x + 2, y + 1, 1, 2, 'rgba(255,255,255,0.6)');
  fr(c, x + 3, y + 8, 1, 2, '#5a4a3a'); fr(c, x + 5, y + 8, 1, 2, '#5a4a3a'); fr(c, x + 3, y + 10, 3, 2, '#8a5a30');
}
function drawBirds(c, V, t, offFlock, offGull, near) {
  const B = birds(), [ya, yb] = V.cloudY;
  if (near) return drawNearBirds(c, V, t, offGull, B, yb);
  // ett stim starar som böljar fram (vart 80:e sekund)
  const fc = t % 80;
  if (fc < 50) {
    const L0 = V.x0 - Math.ceil(V.camMax * K.flock) - 60, span = V.x1 + 60 - L0, cx = L0 + (fc / 50) * span, cy = (ya + yb) / 2 + 6 + Math.sin(t * 0.2) * 6;
    for (let i = 0; i < 18; i++) {
      const dx = Math.sin(t * 0.7 + i * 1.9) * 14 + Math.cos(t * 0.31 + i) * 7, dy = Math.cos(t * 0.9 + i * 2.7) * 5 + Math.sin(t * 0.5 + i) * 2;
      c.drawImage(B.star[Math.floor(t * 8 + i * 1.3) % 3], Math.round(cx + dx) + offFlock, Math.round(cy + dy));
    }
  }
  // grågäss i plog (vart tredje minut)
  const gc = (t + 40) % 180;
  if (gc < 60) {
    const L0 = V.x0 - Math.ceil(V.camMax * K.flock) - 80, span = V.x1 + 80 - L0, gx = L0 + span - (gc / 60) * span, gy = ya + 6;
    for (let k = 0; k < 7; k++) { const side = k === 0 ? 0 : (k & 1 ? 1 : -1) * Math.ceil(k / 2); c.drawImage(B.goose[Math.floor(t * 4 + k) % 3], Math.round(gx + Math.abs(side) * 9) + offFlock, Math.round(gy + side * 4)); }
  }
}
function drawNearBirds(c, V, t, offGull, B, yb) {
  // fiskmåsarna glider förbi nära glaset (och kråkor eller svalor beroende på våning)
  const L0 = V.x0 - Math.ceil(V.camMax * K.gull) - 30, span = V.x1 + 30 - L0;
  const gulls = V.n === 0 ? 1 : V.n === 1 ? 2 : 3;
  for (let i = 0; i < gulls; i++) {
    const dir = i & 1 ? -1 : 1, x = wrap(i * 260 + dir * (9 + i * 3) * t, L0, span), y = yb - 8 + i * 9 + Math.sin(t * 0.6 + i * 2) * 5;
    const flap = (t * 0.5 + i) % 4 < 1.2 ? Math.floor(t * 9) % 4 : -1;
    c.drawImage(B.gull[flap < 0 ? 1 : [0, 1, 2, 1][flap]], Math.round(x) + offGull, Math.round(y));
  }
  if (V.n > 0) for (let i = 0; i < 2; i++) {   // svalorna slår lovar
    const a = t * (0.9 + i * 0.3) + i * 3, x = LC(V, K.gull) + Math.sin(a) * 120 + Math.sin(a * 2.3) * 30, y = yb + 10 + Math.sin(a * 1.7) * 10;
    c.drawImage(B.sw[Math.floor(t * 12 + i) % 3], Math.round(x) + offGull, Math.round(y));
  } else {   // kråkan flyger över torget
    const cc = t % 50; if (cc < 20) c.drawImage(B.crow[Math.floor(t * 6) % 3], Math.round(V.x1 + 40 - (cc / 20) * (V.x1 - V.x0 + 600)) + offGull, yb + 2);
  }
}
function glassImg(w, h) {
  const P = new Pix(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) P.px(x, y, 0xb8dcf0, 0.09);
  for (let s = -h; s < w; s += 41) for (let j = 0; j < h; j++) { const x = Math.round(s + j * 0.42); P.hl(x, j, 3, 0xffffff, 0.11); P.px(x + 6, j, 0xffffff, 0.07); }
  return P.flush();
}

export function drawView(c, V, t, camX) {
  const o = (k) => Math.round(camX * k);
  c.save(); c.beginPath(); c.rect(V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0); c.clip();
  c.drawImage(V.sky.img, V.sky.ox + o(K.sky), V.sky.oy);
  const CS = clouds(), co = o(K.cloud);
  for (const cl of V.clouds) c.drawImage(CS[cl.s], Math.round(wrap(cl.x + t * cl.v, V.cl0, V.clSpan)) + co, cl.y);
  drawPlane(c, V, t, o(K.plane));
  for (const L of V.layers) {
    c.drawImage(L.img, L.ox + o(L.k), L.oy);
    if (L.id === 'far') { drawFarLive(c, V, t, o(K.far)); drawBalloon(c, V, t, o(K.balloon)); }
    drawSmoke(c, V, t, L.id, o(L.k));
    if (L.id === 'street') drawTraffic(c, V, t, o(K.street));
    if (L.id === 'plaza') drawPlazaLive(c, V, t, o(K.plaza));
    if (L.id === 'mid') drawBirds(c, V, t, o(K.flock), o(K.gull), false);
  }
  drawBirds(c, V, t, o(K.flock), o(K.gull), true);
  c.restore();
  c.drawImage(V.glass, V.x0, V.y0);
}
