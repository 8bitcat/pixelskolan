// node tools/dream-ark.cjs [BASE=http://localhost:8824/] → dream-art.png – kräver en lokal server för repot.
// alla strykmärken (×4), pärlorna (×6), plaggen och ett pärlhalsband – granskning av dream.js
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://localhost:8824/';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  page.on('pageerror', (e) => console.log('sidfel', String(e)));
  page.on('console', (m) => console.log('konsol', m.text()));
  await page.goto(BASE + 'support.html');   // samma ursprung som modulerna
  await page.setContent('<body style="margin:0;background:#c9c2cf"><canvas id=c></canvas></body>');
  await page.evaluate(async (BASE) => {
    const D = await import(BASE + 'dream.js');
    const c = document.getElementById('c'); c.width = 1560; c.height = 1180;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    let x = 8, y = 8, rowH = 0;
    const put = (img, k, gap = 8) => { const w = img.width * k, h = img.height * k; if (x + w > 1552) { x = 8; y += rowH + gap; rowH = 0; } g.drawImage(img, x, y, w, h); x += w + gap; rowH = Math.max(rowH, h); };
    for (const p of D.PATCHES.filter((p) => !p.letter)) put(D.patchImg(p.id), 4);
    x = 8; y += rowH + 16; rowH = 0;
    for (const p of D.PATCHES.filter((p) => p.letter)) put(D.patchImg(p.id), 3, 4);
    x = 8; y += rowH + 16; rowH = 0;
    const bc = document.createElement('canvas'); bc.width = 9; bc.height = 9;
    for (const b of D.BEADS) { const { Pix } = await import(BASE + 'sf/js/core/floor-pix.js'); const P = new Pix(9, 9); D.drawBead(P, b, 1, 1); put(P.flush(), 6, 4); }
    x = 8; y += rowH + 16; rowH = 0;
    const look = { shirt: '#3a7bd5', accent: '#f4f1ea', top: 'hoodie', pants: '#2d3a5c', bottom: 'jeans' };
    put(D.garmentArt('top', look).canvas, 3); put(D.garmentArt('top', { ...look, top: 'tee', shirt: '#f07ab0' }).canvas, 3); put(D.garmentArt('bottom', look).canvas, 3); put(D.garmentArt('bottom', { ...look, bottom: 'skirt', pants: '#9a62d8' }).canvas, 3);
    const st = { len: 'mellan', trad: 'guld', beads: ['g-rosa', 'parla', 'b-12', 'b-8', 'b-17', 'b-0', 'parla', 'f-hjarta', 'k-lila', 'g-ljusbla', 'f-smiley', 'guld', 'f-blomma', null, null, null] };
    put(D.drawBeadNecklace(st, 13, true).canvas, 3);
    put(D.drawBeadNecklace({ len: 'lang', trad: 'klar', beads: Array.from({ length: 20 }, (_, i) => ['g-rod', 'g-orange', 'g-gul', 'g-gron', 'g-bla', 'g-lila'][i % 6]) }).canvas, 3);
  }, BASE);
  await page.locator('#c').screenshot({ path: 'dream-art.png' });
  await browser.close();
})();
