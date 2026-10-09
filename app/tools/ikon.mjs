// Appikonen och startbilden till Pixelskolan (iOS-appen), i spelets pixelstil med ett enda pixelkorn:
//   ett barn (spelets egen figur, people.js) framför den gröna tavlan med 3·5 = 15, en guldstjärna och
//   krita på listen – 64×64 pixlar förstorade ×16 till 1024. Startbilden: samma motiv mitt på spelets
//   mörka rutmönster (2732², Xcode fyller skärmen och beskär kanterna).
//   node app/tools/ikon.mjs        → app/store/ikon/*.png + Xcode-projektets AppIcon och Splash (RGB, utan alfa)
// Kräver en lokal server för repot på 8824 (PORT=…): python -m http.server 8824
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const require = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = require('playwright');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'store', 'ikon');
const XC = path.join(APP, 'ios/App/App/Assets.xcassets');
const PORT = process.env.PORT || 8824;
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('sidfel:', e.message));
await p.goto(`http://localhost:${PORT}/editor.css`);
const urls = await p.evaluate(async () => {
  const { drawPerson } = await import('/sf/js/core/people.js');
  const { BIG, SMALL } = await import('/sf/js/core/floor-pix.js');
  const N = 64, c = document.createElement('canvas'); c.width = N; c.height = N;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const P = (x, y, col) => R(x, y, 1, 1, col);
  const glyph = (F, ch, x, y, col) => { const G = F[ch]; G.rows.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') P(x + i, y + j, col); })); return G.w + 1; };
  // väggen: två ljusa band med en ditherrad emellan
  R(0, 0, N, N, '#cfe2e9'); R(0, 40, N, 16, '#bcd6df'); for (let x = 0; x < N; x += 2) P(x, 40, '#cfe2e9');
  // golvet: plankor
  for (let y = 56; y < N; y++) for (let x = 0; x < N; x++) P(x, y, ((x + (y > 59 ? 6 : 0)) % 12 === 0) ? '#a8743e' : y === 56 ? '#e0ae74' : '#c8925a');
  // tavlan med träram
  R(3, 3, 58, 35, '#5e3a1d'); R(4, 4, 56, 33, '#a8703e'); R(4, 4, 56, 1, '#c99258');
  const hs = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  for (let y = 6; y < 35; y++) for (let x = 6; x < 58; x++) { const v = hs(x, y); P(x, y, v > 0.985 ? '#4f7f66' : v > 0.9 ? '#33614b' : '#2c5843'); }   // kritdamm
  // 3·5 = 15 i krita (BIG-typsnittet, punkten som i skolan) och ABC under
  let x = 9; const y = 10;
  x += glyph(BIG, '3', x, y, '#eef3ec'); R(x, y + 3, 2, 2, '#eef3ec'); x += 3;
  x += glyph(BIG, '5', x, y, '#eef3ec'); x += 1; x += glyph(BIG, '=', x, y, '#eef3ec'); x += 1;
  x += glyph(BIG, '1', x, y, '#f8e878'); glyph(BIG, '5', x, y, '#f8e878');
  let ax = 9; for (const ch of 'ABC') ax += glyph(SMALL, ch, ax, 22, '#a8d8f0');
  R(ax + 2, 25, 1, 1, '#8fe0a2'); R(ax + 3, 26, 1, 1, '#8fe0a2'); R(ax + 4, 25, 1, 1, '#8fe0a2'); R(ax + 5, 24, 1, 1, '#8fe0a2'); R(ax + 6, 23, 1, 1, '#8fe0a2');   // en bock
  // guldstjärnan uppe till höger
  const star = ['....#....', '...###...', '#########', '.#######.', '..#####..', '.###.###.', '.##...##.'];
  star.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') P(47 + i, 8 + j, j < 3 && i < 5 ? '#fff2a0' : '#ffd23f'); }));
  P(51, 8, '#c8901a'); P(47, 10, '#c8901a'); P(55, 10, '#c8901a'); P(48, 14, '#c8901a'); P(54, 14, '#c8901a');
  // kritlisten med två kritbitar
  R(2, 37, 60, 2, '#7a4b26'); R(2, 37, 60, 1, '#c99258'); R(12, 36, 4, 1, '#f4f4ee'); R(18, 36, 3, 1, '#f8e878');
  // barnet framför tavlan, med skugga
  g.fillStyle = 'rgba(40,30,20,0.28)'; g.fillRect(25, 61, 14, 2); g.fillRect(27, 60, 10, 1);
  const look = { kid: true, skin: '#f6d7bf', hair: '#ecd489', style: 'long', top: 'tee', shirt: '#f28bb3', bottom: 'jeans', pants: '#3f5f8f', shoes: '#e0b24a' };
  drawPerson(g, 32, 61, look, 'down', 0);
  const scaled = (k, W, H, bg) => {
    const o = document.createElement('canvas'); o.width = W; o.height = H; const q = o.getContext('2d'); q.imageSmoothingEnabled = false;
    if (bg) { for (let yy = 0; yy < H; yy += 32) for (let xx = 0; xx < W; xx += 32) { q.fillStyle = ((xx + yy) / 32) % 2 ? '#151221' : '#100e15'; q.fillRect(xx, yy, 32, 32); } }
    q.drawImage(c, Math.round((W - N * k) / 2), Math.round((H - N * k) / 2), N * k, N * k);
    return o.toDataURL('image/png');
  };
  return { icon: scaled(16, 1024, 1024, false), splash: scaled(12, 2732, 2732, true), small: scaled(2, 128, 128, false) };
});
await b.close();
const save = (name, url) => { const f = path.join(OUT, name); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); return f; };
const icon = save('ikon-1024.png', urls.icon), splash = save('start-2732.png', urls.splash);
save('ikon-128.png', urls.small);
// App Store vill ha ikonen utan alfakanal: gör om till RGB och lägg in i Xcode-projektet
const rgb = (src, dst) => execFileSync('python', ['-c', `from PIL import Image; Image.open(r'${src}').convert('RGB').save(r'${dst}')`]);
rgb(icon, path.join(XC, 'AppIcon.appiconset', 'AppIcon-512@2x.png'));
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) rgb(splash, path.join(XC, 'Splash.imageset', f));
console.log('ikonen och startbilden är inlagda i', XC);
