// Småbutikerna i Galleria Stjärnan (Pixelskolan): butiker vägg i vägg mellan spelets riktiga
// (Carl 2026-10-07: "det kan vara affärer vägg i vägg … mängder av detaljer"). Man går inte in i dem,
// men expediten står bakom disken och svarar när man klickar. Målade med Snabbfilens penna
// (floor-pix.js); expediterna är spelets figurer (people.js).
// Varje butik har en bakre bild (rummet bakom glaset, målas in i gallerians vägg), en expedit som
// ritas levande och en främre bild (disken, glaset med reflexer och det som står ute på golvet).
import { Pix, SMALL, BIG, textW, text as pixText, mix, mul, hash, bayer } from './sf/js/core/floor-pix.js';
import { drawPerson, makeLookRich } from './sf/js/core/people.js';

export const UNIT_H = 92;   // skylten + skyltfönstret (golvet är gallerians fotlinje g)
export const UNITS = {
  blommor: { label: 'BLOMSTERHANDELN', sign: 'BLOMMOR', col: 0x2e7a46, edge: 0x1c5230, ink: 0xffffff, wall: 0xe4eedb, flo: 0xc4b496, door: 26, keeper: 14,
    lines: ['TULPANERNA KOM I MORSE!', 'EN BUKETT TILL FRÖKEN? SOLROSORNA ÄR FINAST.', 'GLÖM INTE ATT VATTNA BLOMMORNA HEMMA.'] },
  kiosk: { label: 'KIOSKEN', sign: 'KIOSK', col: 0x1d51a0, edge: 0x0c2a5c, ink: 0xf6d02f, wall: 0xf0ece2, flo: 0xb8b2a6, door: 6, keeper: 50,
    lines: ['HEJ HEJ! TIDNINGEN KOM NYSS.', 'GLASSEN FINNS I FRYSEN UTANFÖR.', 'VILL DU HA ETT SERIEMAGASIN?'] },
  godis: { label: 'GODISBUTIKEN', sign: 'GODIS', col: 0xe0457e, edge: 0xa02858, ink: 0xffffff, wall: 0xfff0f5, flo: 0xd8c4cc, door: 34, keeper: 84,
    lines: ['PLOCKGODIS PÅ LÖRDAG!', 'MIN FAVORIT ÄR SURA REMMAR. VAD GILLAR DU?', 'KOM IHÅG ATT BORSTA TÄNDERNA SEN!'] },
  foto: { label: 'FOTOAUTOMATEN', booth: true, lines: ['BLIXT! FYRA BILDER.', 'LE STORT!'] },
  bankomat: { label: 'BANKOMATEN', atm: true },
};

// ---------- gemensamt: rummet bakom glaset, skylten, glaset ----------
function room(P, u, d, g) {
  const x0 = u.x + 3, x1 = u.x + u.w - 3, it = g - UNIT_H + 16, fl = g - 9;
  for (let y = it; y < g - 3; y++) for (let x = x0; x < x1; x++) {
    let c;
    if (y < fl) { c = mul(d.wall, 0.98 + hash(x >> 2, y >> 3, 51) * 0.04); if (y < it + 2) c = mul(d.wall, 0.8); }
    else { const v = y - fl; c = (((x + v * 3) >> 2) & 1) ? d.flo : mul(d.flo, 0.9); if (v === 0) c = mul(d.wall, 0.72); }
    P.px(x, y, c);
  }
  for (let x = x0 + 9; x < x1 - 6; x += 20) { P.hl(x - 3, it + 2, 7, 0xfffbe8); P.ell(x, it + 4, 11, 7, 0xfffbe8, 0.22, 3); }   // takets lampor
}
function fascia(P, u, d, g) {
  const x0 = u.x, x1 = u.x + u.w, top = g - UNIT_H, lite = mix(d.edge, 0xffffff, 0.3);
  P.rect(x0, top, 3, UNIT_H, d.edge); P.rect(x1 - 3, top, 3, UNIT_H, d.edge); P.vl(x0 + 1, top, UNIT_H, lite); P.vl(x1 - 2, top, UNIT_H, lite);
  P.rect(x0, top, u.w, 14, d.col); P.hl(x0, top, u.w, mix(d.col, 0xffffff, 0.35)); P.hl(x0, top + 13, u.w, d.edge);
  P.hl(x0 + 3, top + 14, u.w - 6, 0x000000, 0.28); P.hl(x0 + 3, top + 15, u.w - 6, 0x000000, 0.12);
  for (let x = x0 + 4; x < x1 - 4; x += 6) P.px(x, top + 2, mix(d.col, 0xffffff, 0.55));   // ljuskedjan i skylten
  const F = textW(BIG, d.sign) + 10 <= u.w ? BIG : SMALL, tw = textW(F, d.sign), tx = x0 + Math.round((u.w - tw) / 2), ty = top + (F === BIG ? 4 : 5);
  pixText(P, F, d.sign, tx + 1, ty + 1, d.edge); pixText(P, F, d.sign, tx, ty, d.ink);
}
function glassFront(P, u, d, g) {
  const x0 = u.x + 3, x1 = u.x + u.w - 3, top = g - UNIT_H + 16, dx0 = u.x + d.door, dx1 = dx0 + 20;
  for (const [a, b] of [[x0, dx0], [dx1, x1]]) {
    if (b - a < 2) continue;
    for (let y = top; y < g - 3; y++) for (let x = a; x < b; x++) P.px(x, y, 0xcfe6f0, 0.12);
    for (let s = a - 60; s < b; s += 23) for (let j = 0; j < g - 3 - top; j++) { const x = Math.round(s + j * 0.5); if (x >= a && x < b - 1) { P.px(x, top + j, 0xffffff, 0.2); P.px(x + 1, top + j, 0xffffff, 0.1); } }
    P.vl(a, top, g - 3 - top, 0x6a7078); P.vl(b - 1, top, g - 3 - top, 0x6a7078);
    P.rect(a, g - 6, b - a, 3, 0x8a9098); P.hl(a, g - 6, b - a, 0xb8bec6);   // sparkplåten
  }
  P.hl(x0, top, x1 - x0, 0x5a6068);
  P.rect(dx0 + 1, g - 3, 18, 2, 0x3a3a44); for (let x = dx0 + 2; x < dx0 + 19; x += 2) P.px(x, g - 3, 0x4a4a56);   // dörrmattan
  P.rect(dx0 - 1, top, 1, g - top - 3, 0x9aa2ac); P.rect(dx1, top, 1, g - top - 3, 0x9aa2ac);   // skjutdörrarna står öppna
  P.hl(u.x, g - 1, u.w, 0x000000, 0.18);
}
const pot = (P, x, y, c = 0xc0643a) => { P.rect(x, y, 5, 4, c); P.hl(x - 1, y, 7, mix(c, 0xffffff, 0.25)); P.vl(x + 4, y + 1, 3, mul(c, 0.8)); };
function leaves(P, cx, by, h, seed, bloom) {   // en krukväxt: blad i fyra gröna toner (och blommor)
  for (let y = 0; y < h; y++) for (let x = -3; x <= 3; x++) {
    const e = (x / 3.6) ** 2 + ((y - h / 2) / (h / 2)) ** 2 + (hash(cx + x, by - y, seed) - 0.5) * 0.6;
    if (e > 1) continue;
    const l = -x * 0.15 + y / h * 0.6 + (bayer(cx + x, by - y) - 0.5) * 0.3;
    let c = l > 0.55 ? 0x8cc462 : l > 0.3 ? 0x5a9e46 : l > 0.1 ? 0x3a7e38 : 0x28602c;
    if (bloom != null && hash(cx + x, by - y, seed + 1) > 0.78) c = bloom;
    P.px(cx + x, by - y, c);
  }
}
const FLOWER = [0xe8333a, 0xf6d02f, 0xff8ac0, 0xf4f1ea, 0x9a5ad8, 0xf07a2a];
function bucket(P, x, y, kind) {   // en hink snittblommor: 0–5 = tulpaner i olika färger, 6 = solrosor
  P.rect(x, y, 6, 5, 0x8a96a2); P.hl(x, y, 6, 0xb8c2cc); P.vl(x + 5, y + 1, 4, 0x6a7682);
  for (let k = 0; k < 4; k++) {
    const sx = x + 1 + k, sy = y - 4 - (k & 1) * 2;
    P.vl(sx, sy, y - sy, 0x3a8a3a);
    if (kind === 6) { P.rect(sx - 1, sy - 2, 3, 3, 0xf6c02f); P.px(sx, sy - 1, 0x6a3a1a); }
    else { P.rect(sx, sy - 2, 1, 2, FLOWER[(kind + k) % 6]); if (k & 1) P.px(sx - 1, sy - 1, mul(FLOWER[(kind + k) % 6], 0.8)); }
  }
}

// ---------- blomsterhandeln ----------
function blommorBack(P, u, d, g) {
  const x0 = u.x + 3, x1 = u.x + u.w - 3, it = g - UNIT_H + 16, fl = g - 9;
  for (let y = it + 2; y < fl; y++) for (let x = x0; x < x1; x++) if ((x - x0) % 5 === 0) P.px(x, y, 0xcfdcc4);   // panelen
  for (const sy of [it + 22, it + 40]) {   // två hyllor med krukväxter
    P.rect(x0 + 1, sy, 26, 2, 0x9a6a3e); P.hl(x0 + 1, sy + 2, 26, 0x000000, 0.2);
    for (let k = 0; k < 4; k++) { const px = x0 + 2 + k * 6; pot(P, px, sy - 4, k & 1 ? 0xd8d0c0 : 0xc0643a); leaves(P, px + 2, sy - 5, 6 + ((k * 7 + sy) % 4), sy + k, k % 3 === 0 ? FLOWER[(k + sy) % 6] : null); }
  }
  for (const hx of [x0 + 14, x0 + 50]) {   // ampelväxter i taket med rankor
    P.vl(hx, it + 2, 6, 0x6a6e76); P.rect(hx - 3, it + 8, 7, 3, 0xa87a4a); P.hl(hx - 3, it + 8, 7, 0xc89a6a);
    for (let k = -3; k <= 3; k++) { const len = 4 + ((k * 5 + hx) % 7 + 7) % 7; for (let j = 0; j < len; j++) P.px(hx + k + (j % 3 === 2 ? (k < 0 ? -1 : 1) : 0), it + 11 + j, j % 2 ? 0x3a7e38 : 0x5a9e46); }
  }
  // trappstegshyllan med hinkar bakom det stora fönstret
  const sx = x0 + 44;
  for (let k = 0; k < 3; k++) { P.rect(sx - k * 2, fl - 4 - k * 9, 26 + k * 2, 2, 0x8a5a30); for (let b = 0; b < 3; b++) bucket(P, sx + 1 + b * 8 - k, fl - 9 - k * 9, (b + k * 2) % 7); }
  leaves(P, x0 + 36, fl - 1, 16, 77, null);   // en stor monstera på golvet
  P.rect(x0 + 34, fl - 1, 5, 4, 0xe8e4dc);
}
function blommorFront(P, u, d, g) {
  const x0 = u.x + 3;
  P.rect(x0 + 2, g - 21, 22, 2, 0xc89a6a); P.hl(x0 + 2, g - 21, 22, 0xe8c08a);   // disken
  for (let y = g - 19; y < g - 3; y++) for (let x = x0 + 2; x < x0 + 24; x++) P.px(x, y, (x - x0) % 4 === 0 ? 0x7a4e2a : 0x9a6a3e);
  P.rect(x0 + 4, g - 24, 6, 3, 0xd8c4a0); P.hl(x0 + 4, g - 24, 6, 0xf0e0c0);   // papperet att slå in buketterna i
  P.rect(x0 + 15, g - 25, 4, 4, 0xa8d0e0); bucket(P, x0 + 14, g - 26, 2);       // en bukett i vas
  P.rect(x0 + 19, g - 23, 3, 2, 0x2a2a30); P.px(x0 + 20, g - 24, 0x46a35a);       // kassan
}
function blommorOut(P, u, g) {   // hinkar ute på golvet och vattenkannan
  const x = u.x + 50;
  P.rect(x - 1, g - 1, 26, 3, 0x8a5a30); P.rect(x + 2, g - 9, 20, 2, 0x8a5a30); P.vl(x, g - 9, 10, 0x6a4020); P.vl(x + 23, g - 9, 10, 0x6a4020);
  for (let b = 0; b < 3; b++) bucket(P, x + 1 + b * 8, g - 6, (b * 2 + 1) % 7);
  for (let b = 0; b < 2; b++) bucket(P, x + 5 + b * 8, g - 14, b ? 6 : 4);
  P.rect(x - 7, g - 3, 5, 4, 0x46a35a); P.line(x - 2, g - 2, x, g - 5, 0x46a35a); P.hl(x - 6, g - 4, 3, 0x2e7a3e);
}

// ---------- kiosken ----------
function kioskBack(P, u, d, g) {
  const x0 = u.x + 3, x1 = u.x + u.w - 3, it = g - UNIT_H + 16, fl = g - 9;
  // kylen med flaskor (syns genom dörren)
  P.rect(x0 + 1, it + 6, 18, fl - it - 6, 0xe8ecef); P.rect(x0 + 3, it + 9, 14, fl - it - 12, 0xe4f2fc);
  for (let r = 0; r < 4; r++) { const sy = it + 17 + r * 11; P.hl(x0 + 3, sy, 14, 0xa8b4c0); for (let k = 0; k < 6; k++) { const c = [0xd83a3a, 0x3a9a4a, 0xf0b020, 0x3a7bd5, 0xe8e8e0, 0xf07a2a][(k + r * 2) % 6]; P.rect(x0 + 4 + k * 2, sy - 5, 1, 5, c); P.px(x0 + 4 + k * 2, sy - 6, 0xd8d8dc); } }
  P.vl(x0 + 10, it + 9, fl - it - 12, 0xc8d0d8); P.hl(x0 + 3, it + 9, 14, 0xffffff);
  // hyllorna med godis, chips och tuggummi
  for (let r = 0; r < 4; r++) {
    const sy = it + 12 + r * 10;
    P.rect(x0 + 22, sy, 36, 2, 0xc8c0b0); P.hl(x0 + 22, sy + 2, 36, 0x000000, 0.18);
    for (let k = 0; k < 9; k++) {
      const c = [0xd83a4a, 0xf0c020, 0x3a7bd5, 0x46a35a, 0x8e5bd1, 0xf28bb3, 0xe07a2e][(k * 3 + r) % 7], px = x0 + 23 + k * 4;
      if (r === 3) { P.rect(px, sy - 6, 3, 6, c); P.hl(px, sy - 6, 3, mix(c, 0xffffff, 0.4)); }   // chipspåsar
      else { P.rect(px, sy - 3, 3, 3, c); P.px(px + 1, sy - 2, 0xf4f1ea); }                    // chokladkakor och askar
    }
  }
  // tidningsstället
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
    const px = x1 - 17 + k * 5, py = it + 14 + r * 12, c = [0xd83a4a, 0x3a7bd5, 0xf0c020, 0x46a35a, 0xf28bb3, 0x2b2b30][(k + r * 2) % 6];
    P.rect(px, py, 4, 6, c); P.hl(px, py, 4, 0xf4f1ea); P.px(px + 1, py + 3, 0xf1c9a5); P.px(px + 2, py + 3, 0xf1c9a5);
  }
  P.rect(x1 - 18, it + 50, 16, 2, 0x9a9488);
}
function kioskFront(P, u, d, g) {
  const cx = u.x + 34;
  P.rect(cx, g - 21, 30, 2, 0xf4f1ea); P.hl(cx, g - 19, 30, 0xb8b2a6);
  for (let y = g - 18; y < g - 3; y++) for (let x = cx; x < cx + 30; x++) P.px(x, y, y === g - 12 ? 0xf6d02f : 0x1d51a0);
  for (let k = 0; k < 3; k++) { P.rect(cx + 2 + k * 3, g - 24 + k, 8, 3, 0xf0eee6); P.hl(cx + 3 + k * 3, g - 23 + k, 6, 0x9a9890); }   // tidningshögarna
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) P.rect(cx + 15 + k * 2, g - 26 + r * 2, 1, 2, [0xd83a4a, 0x46a35a, 0xf0c020, 0x3a7bd5][(k + r) % 4]);   // tuggummit
  P.rect(cx + 24, g - 25, 5, 4, 0x2a2a30); P.rect(cx + 25, g - 24, 3, 1, 0x7ad07a);   // kassan
}
function kioskOut(P, u, g) {
  const fx = u.x + 58;   // glassfrysen med glaslock och en glasskylt
  P.rect(fx, g - 9, 22, 10, 0xf4f4f0); P.hl(fx, g - 9, 22, 0xffffff); P.vl(fx + 21, g - 8, 9, 0xc8c8c4); P.hl(fx, g, 22, 0x9a9a96);
  for (let x = fx + 2; x < fx + 20; x++) P.px(x, g - 8, [0xf28bb3, 0xf0c020, 0x8a5a30, 0x3a7bd5, 0xf4f1ea, 0x46a35a][((x - fx) >> 1) % 6]);
  P.rect(fx + 2, g - 7, 18, 1, 0xbfe0f0, 0.7); P.rect(fx + 3, g - 5, 16, 3, 0x1d51a0); pixText(P, SMALL, 'GLASS', fx + 3, g - 5, 0xffffff);
  P.vl(fx + 20, g - 20, 11, 0x6a6e76); P.rect(fx + 15, g - 21, 6, 5, 0xffffff); P.rect(fx + 16, g - 20, 3, 2, 0xf28bb3); P.px(fx + 17, g - 18, 0xc8904a);
  const bx = u.x + 30;   // tidningsbladet på en trottoarpratare
  P.line(bx, g, bx + 4, g - 15, 0x5a5e66); P.line(bx + 11, g, bx + 7, g - 15, 0x5a5e66);
  P.rect(bx + 1, g - 14, 10, 12, 0xf4f1ea); P.rect(bx + 2, g - 13, 8, 3, 0xd8333a); P.hl(bx + 2, g - 9, 8, 0x2a2a30); P.hl(bx + 2, g - 7, 6, 0x2a2a30); P.hl(bx + 2, g - 5, 7, 0x7a7a80);
}

// ---------- godisbutiken ----------
const CANDY = [[0xe8333a, 0xffffff], [0xf6d02f, 0xf09a1a], [0x46b04a, 0xa8e070], [0xff8ac0, 0xffffff], [0x2a2228, 0x5a4a52], [0xf07a2a, 0xffc060], [0x3a8ae0, 0xa0d0ff], [0x9a5ad8, 0xd0a8f0], [0xffffff, 0xf0b0c8], [0xe8333a, 0x46b04a]];
function godisBack(P, u, d, g) {
  const x0 = u.x + 3, x1 = u.x + u.w - 3, it = g - UNIT_H + 16, fl = g - 9;
  for (let y = it + 2; y < fl; y++) for (let x = x0; x < x1; x++) if (((x - x0) >> 2) & 1) P.px(x, y, 0xffd2e4);   // rosa och vita ränder
  const cols = 9, bw = 8, bh = 6;
  for (let r = 0; r < 3; r++) {   // plockgodisväggen: tre rader lådor med lock och plexifront
    const by = it + 8 + r * 11;
    for (let k = 0; k < cols; k++) {
      const bx = x0 + 2 + k * (bw + 1), [a, b] = CANDY[(k * 3 + r * 5) % CANDY.length];
      for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) { const h = hash(bx + xx, by + yy, 52); P.px(bx + xx, by + yy, h > 0.92 ? 0xffffff : h > 0.45 ? a : b); }
      P.hl(bx, by - 1, bw, 0xe8e0e8); P.hl(bx, by - 2, bw, 0xb8aab8); P.px(bx + (bw >> 1), by - 3, 0x8a7a8a);
      P.rect(bx, by + 2, bw, bh - 2, 0xffffff, 0.22); P.hl(bx, by + 2, bw, 0xffffff, 0.55); P.vl(bx + bw - 1, by, bh, 0x000000, 0.15);
    }
    P.rect(x0 + 1, by + bh, cols * (bw + 1) + 1, 2, 0xb0784a); P.hl(x0 + 1, by + bh + 2, cols * (bw + 1) + 1, 0x000000, 0.2);
  }
  // den stora klubban på väggen
  const lx = x1 - 7, ly = it + 13;
  P.rect(lx - 1, ly + 5, 2, 20, 0xf4f1ea); P.vl(lx, ly + 5, 20, 0xd8d0c8);
  for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) { const r = Math.hypot(x, y); if (r > 5.4) continue; const a = Math.atan2(y, x) + r * 0.6; P.px(lx + x, ly + y, r > 4.6 ? 0xc02860 : (Math.floor((a + 7) / (Math.PI / 3)) & 1) ? 0xe8333a : 0xffffff); }
  // burkar och godispåsar under lådorna
  for (let k = 0; k < 5; k++) {
    const jx = x0 + 3 + k * 7, jy = fl - 8, [a, b] = CANDY[(k * 2 + 1) % CANDY.length];
    P.rect(jx, jy, 6, 7, 0xe8f2f8); for (let yy = 2; yy < 7; yy++) for (let xx = 0; xx < 6; xx++) P.px(jx + xx, jy + yy, hash(jx + xx, yy, 53) > 0.5 ? a : b);
    P.rect(jx - 1, jy - 1, 8, 2, 0xd83a7a); P.vl(jx, jy + 2, 4, 0xffffff, 0.5);
  }
  for (let k = 0; k < 3; k++) { const bx = x0 + 40 + k * 5; P.rect(bx, fl - 7, 4, 7, 0xf4f1ea); P.hl(bx, fl - 5, 4, 0xe0457e); P.hl(bx, fl - 7, 4, 0xd8d0c8); }
  pixText(P, SMALL, 'PLOCKGODIS', x0 + 10, it + 41, 0xe0457e);
}
function godisFront(P, u, d, g) {
  const cx0 = u.x + 58, cw = u.w - 63;
  P.rect(cx0, g - 21, cw, 2, 0xffffff); P.hl(cx0, g - 19, cw, 0xd8c8d0);
  for (let y = g - 18; y < g - 3; y++) for (let x = cx0; x < cx0 + cw; x++) P.px(x, y, ((x + y) % 6) < 2 ? 0xffffff : 0xf08ab4);
  P.rect(cx0 + 4, g - 23, 9, 2, 0x8a929c); P.hl(cx0 + 5, g - 25, 7, 0xc8d0d8); P.rect(cx0 + 6, g - 22, 4, 1, 0xd83a3a);   // vågen
  const jx = cx0 + cw - 12;   // klubburken
  for (let k = 0; k < 4; k++) { const sx = jx + 1 + k * 2, sy = g - 31 + (k & 1) * 2; P.vl(sx, sy + 2, g - 24 - sy, 0xf4f1ea); P.rect(sx - 1, sy, 3, 3, [0xe8333a, 0x46b04a, 0xf6d02f, 0x3a8ae0][k]); }
  P.rect(jx, g - 26, 9, 5, 0xe8f4fa, 0.6); P.box(jx, g - 26, 9, 5, 0xb8d0dc);
}
function godisOut(P, u, g) {   // en jätteklubba vid dörren
  const x = u.x + 8;
  P.rect(x - 2, g - 1, 6, 2, 0x8a8e96); P.vl(x, g - 20, 19, 0xf4f1ea); P.vl(x + 1, g - 20, 19, 0xd8d0c8);
  for (let y = -5; y <= 5; y++) for (let xx = -5; xx <= 5; xx++) { const r = Math.hypot(xx, y); if (r > 5.4) continue; const a = Math.atan2(y, xx) - r * 0.6; P.px(x + xx, g - 25 + y, r > 4.6 ? 0x2a6aba : (Math.floor((a + 7) / (Math.PI / 3)) & 1) ? 0x46b04a : 0xffffff); }
}

// ---------- fotoautomaten och bankomaten ----------
function fotoBack(P, u, g) {
  const x0 = u.x, w = u.w, top = g - 60;
  P.rect(x0, top + 10, w, 50, 0x3a6ab8); P.vl(x0, top + 10, 50, 0x5a8ad8); P.vl(x0 + w - 1, top + 10, 50, 0x24488a); P.rect(x0, g - 3, w, 3, 0x2a2a30);
  P.rect(x0 - 1, top, w + 2, 10, 0xd83a3a); P.box(x0 - 1, top, w + 2, 10, 0x9a1e2a); pixText(P, SMALL, 'FOTO', x0 + Math.round((w - textW(SMALL, 'FOTO')) / 2), top + 3, 0xffd23f);
  for (let x = x0 + 1; x < x0 + w; x += 3) P.px(x, top + 1, 0xfff4c0);   // lamporna runt skylten
  for (let y = top + 13; y < g - 5; y++) for (let x = x0 + 2; x < x0 + 16; x++) P.px(x, y, ((x - x0) % 3 === 0) ? 0x9a1e2c : 0xc42a3a);   // draperiet
  P.hl(x0 + 1, top + 12, 16, 0xc8ccd2);
  P.rect(x0 + 18, top + 14, 7, 26, 0xf4f1ea);   // provbilderna
  for (let k = 0; k < 4; k++) { const py = top + 15 + k * 6; P.rect(x0 + 19, py, 5, 5, 0xbfe0f0); P.rect(x0 + 20, py + 1, 3, 2, ['#2a1d1a', '#c8a050', '#6a4a2a', '#1a1416'].map((s) => parseInt(s.slice(1), 16))[k]); P.rect(x0 + 20, py + 2, 3, 2, 0xf1c9a5); P.px(x0 + 21, py + 4, 0xd83a3a); }
  P.rect(x0 + 19, top + 44, 5, 3, 0xc8ccd2); P.hl(x0 + 20, top + 45, 3, 0x2a2a30);   // myntinkastet
}
function atmBack(P, u, g) {
  const x0 = u.x, w = u.w, top = g - 66;
  P.rect(x0, top, w, 58, 0x8a929c); P.hl(x0, top, w, 0xc4ccd4); P.vl(x0 + w - 1, top, 58, 0x5a6068);
  P.rect(x0 + 1, top + 1, w - 2, 9, 0x2e7a46); pixText(P, SMALL, 'BANKOMAT', x0 + Math.round((w - textW(SMALL, 'BANKOMAT')) / 2), top + 3, 0xffffff);
  P.rect(x0 + 3, top + 12, w - 6, 40, 0x4a525c);
  P.rect(x0 + 8, top + 15, w - 16, 12, 0x2a5ab8); P.hl(x0 + 8, top + 15, w - 16, 0x6a9ae8);
  for (let k = 0; k < 3; k++) P.hl(x0 + 10, top + 18 + k * 3, w - 22 - k * 3, 0xe8f0ff);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) P.rect(x0 + 10 + k * 4, top + 30 + r * 3, 3, 2, 0xd8dce0);
  P.rect(x0 + 23, top + 30, 3, 2, 0xd83a3a); P.rect(x0 + 23, top + 33, 3, 2, 0xf0c020); P.rect(x0 + 23, top + 36, 3, 2, 0x46a35a);
  P.rect(x0 + 10, top + 44, 10, 2, 0x1a1c22); P.rect(x0 + 10, top + 48, 16, 1, 0x1a1c22);
  P.line(x0 + 2, top + 12, x0 + 6, top + 10, 0x6a727a); P.line(x0 + w - 3, top + 12, x0 + w - 7, top + 10, 0x6a727a);   // insynsskyddet
}

const THEME = { blommor: [blommorBack, blommorFront, blommorOut], kiosk: [kioskBack, kioskFront, kioskOut], godis: [godisBack, godisFront, godisOut] };

// bygger butikens bilder (en gång): { back, front, ox, keeper, blocks }
export function makeUnit(u, g) {
  const d = UNITS[u.id], M = 12, ox = u.x - M;
  const B = new Pix(u.w + M * 2, g + 12, ox, 0), F = new Pix(u.w + M * 2, g + 12, ox, 0);
  const U = { u, d, ox, back: null, front: null, keeper: null, blocks: [], spot: [u.x + (u.w >> 1), g + 8] };
  if (d.booth) { fotoBack(B, u, g); U.blocks.push([u.x, g - 2, u.x + u.w, g + 1]); }
  else if (d.atm) atmBack(B, u, g);
  else {
    const [back, front, outside] = THEME[u.id];
    room(B, u, d, g); back(B, u, d, g); fascia(B, u, d, g);
    front(F, u, d, g); glassFront(F, u, d, g); outside(F, u, g);
    U.keeper = { x: u.x + d.keeper, look: makeLookRich() };
    U.spot = [u.x + d.door + 10, g + 8];
    if (u.id === 'blommor') U.blocks.push([u.x + 42, g - 2, u.x + 76, g + 2]);
    if (u.id === 'kiosk') U.blocks.push([u.x + 28, g - 2, u.x + 42, g + 1], [u.x + 58, g - 2, u.x + 80, g + 1]);
    if (u.id === 'godis') U.blocks.push([u.x + 4, g - 2, u.x + 12, g + 1]);
  }
  U.back = B.flush(); U.front = F.flush();
  return U;
}
// expediten bakom disken (tittar sig omkring), fotoautomatens blixt och bankomatens lampa
export function drawUnitLive(c, U, t, g) {
  const { u, d } = U;
  if (U.keeper) {
    const k = U.keeper, ph = t * 0.35 + u.x * 0.01, dir = Math.sin(ph) > 0.75 ? 'left' : Math.sin(ph) < -0.8 ? 'right' : 'down';
    c.save(); c.beginPath(); c.rect(u.x + 3, g - UNIT_H + 16, u.w - 6, UNIT_H - 19); c.clip();
    drawPerson(c, k.x, g - 7, k.look, dir, Math.sin(t * 2 + u.x) > 0.93 ? 4 : 0);
    c.restore();
  }
  if (d.booth) {   // någon sitter i fotoautomaten: fötterna under draperiet, och blixten
    const cyc = (t + u.x * 0.1) % 16;
    if (cyc < 7) { c.fillStyle = '#2d3a5c'; c.fillRect(u.x + 6, g - 7, 2, 3); c.fillRect(u.x + 10, g - 7, 2, 3); c.fillStyle = '#1c1c1c'; c.fillRect(u.x + 5, g - 4, 3, 1); c.fillRect(u.x + 10, g - 4, 3, 1); }
    if (cyc > 2 && cyc < 6 && (cyc % 1) < 0.12) { c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(u.x + 2, g - 47, 14, 6); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(u.x - 4, g - 52, 26, 18); }
    if (U.flash != null && t - U.flash < 0.15) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(u.x - 6, g - 62, u.w + 12, 64); }
  }
  if (d.atm && Math.floor(t * 2) % 2) { c.fillStyle = '#5ae07a'; c.fillRect(u.x + 21, g - 22, 1, 2); }
}
