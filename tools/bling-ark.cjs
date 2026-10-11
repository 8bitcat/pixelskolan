// node tools/bling-ark.cjs [BASE=http://localhost:8824/] → bl-art.png – kräver en lokal server för repot.
// alla hängen (utan sten / med ametist / med rubin) och väskmodellerna i olika färger och mönster, i ett ark
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://localhost:8824/';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('pageerror', (e) => console.log('sidfel', String(e)));
  await page.goto(BASE + 'support.html');   // samma ursprung som bling.js (modulen laddas därifrån)
  await page.setContent('<body style="margin:0;background:#333"><canvas id=c></canvas></body>');
  await page.evaluate(async (BASE) => {
    const { BLING_PREVIEW: B } = await import(BASE + 'bling.js');
    const H = ['inget', 'hjarta', 'stjarna', 'mane', 'bokstav', 'fjaril', 'katt', 'enhorning', 'krona', 'diamant'];
    const rows = [
      H.map((h) => ({ kedja: 'guld', hange: h, sten: 'ingen', parlor: '0' })),
      H.map((h) => ({ kedja: 'silver', hange: h, sten: 'lila', parlor: '2' })),
      H.map((h, i) => ({ kedja: ['lader', 'sammet', 'regnbage', 'parlor', 'guld'][i % 5], hange: h, sten: 'rod', parlor: '4' })),
    ];
    const bags = ['kasse', 'midje', 'rygg', 'axel', 'nalle', 'hand'];
    const B1 = bags.map((m, i) => ({ modell: m, farg: ['rosa', 'bla', 'gron', 'lila', 'guld', 'svart'][i], monster: ['inget', 'prickar', 'rander', 'hjartan', 'stjarnor', 'leopard'][i], berlock: ['ingen', 'pompom', 'hjarta', 'stjarna', 'nalle', 'pompom'][i] }));
    const B2 = bags.map((m, i) => ({ modell: m, farg: ['glitter', 'silver', 'turkos', 'rod', 'vit', 'orange'][i], monster: ['leopard', 'inget', 'hjartan', 'prickar', 'rander', 'stjarnor'][i], berlock: 'ingen' }));
    const k = 2, c = document.getElementById('c'); c.width = 10 * 98 * k; c.height = 5 * 74 * k;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    rows.forEach((r, j) => r.forEach((sel, i) => g.drawImage(B.drawNecklace(sel, 'M'), i * 98 * k, j * 74 * k, 96 * k, 72 * k)));
    [B1, B2].forEach((r, j) => r.forEach((sel, i) => g.drawImage(B.drawBag(sel), i * 98 * k, (3 + j) * 74 * k, 96 * k, 72 * k)));
  }, BASE);
  await page.locator('#c').screenshot({ path: 'bl-art.png' });
  await browser.close();
})();
