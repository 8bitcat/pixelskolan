// node tools/cheer-ark.cjs [BASE=http://127.0.0.1:8824/] → cheer-art.png – kräver en lokal server för repot.
// HEJA HEJA: alla klubbars toppar (framifrån), dräkterna i alla riktningar och gångsteg, huvudsakerna och sakerna i
// händerna – granskning av figurernas nya delar (tops.js cheer + tryck, bottoms.js cheerSkirt/cheerDress/cheerShoes,
// acc.js rosetten/diademen/tiarorna, people.js HAND_ITEMS)
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8824/';
const OUT = process.argv[3] || 'cheer-art.png';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1300 } });
  page.on('pageerror', (e) => console.log('sidfel', String(e)));
  page.on('console', (m) => console.log('konsol', m.text()));
  await page.goto(BASE + 'support.html');
  await page.setContent('<body style="margin:0;background:#c9c2cf"><canvas id=c></canvas></body>');
  await page.evaluate(async (BASE) => {
    const P = await import(BASE + 'sf/js/core/people.js');
    const c = document.getElementById('c'); c.width = 1680; c.height = 1280;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const K = 4;
    let x = 8, y = 8, rowH = 0;
    const put = (look, dir, frame, k = K) => { const s = P.personSprite(look, dir, frame); const w = 24 * k, h = 40 * k; if (x + w > 1672) { x = 8; y += rowH + 6; rowH = 0; } g.drawImage(s, x, y, w, h); x += w + 2; rowH = Math.max(rowH, h); };
    const nl = (gap = 10) => { x = 8; y += rowH + gap; rowH = 0; };
    const base = { kid: true, build: 4, skin: '#eec3a0', hair: '#6b4226', style: 'ponytail', shoes: '#f4f1ea', shoes2: '#e0457e', shoeType: 'cheerShoes' };
    const CL = [['heart', '#e0457e', '#f4f1ea', '#f4f1ea'], ['star', '#1d51a0', '#f6d02f', '#f6d02f'], ['bolt', '#2b2a33', '#f6d02f', '#f6d02f'], ['crown', '#8e5bd1', '#f0b429', '#f0b429'], ['paw', '#d9433b', '#f4f1ea', '#f4f1ea'], ['moon', '#2d3a5c', '#c4c9d4', '#f6e7a0'],
      ['flame', '#e07a2e', '#2b2a33', '#d83a3a'], ['diamond', '#2aa39a', '#f4f1ea', '#bfe6f6'], ['flower', '#f2d680', '#46a35a', '#f07ab0'], ['butterfly', '#b07ae0', '#f4f1ea', '#f2a0d8'], ['rainbowArc', '#f4f1ea', '#3a7bd5', '#f4f1ea']];
    for (const [p, sh, ac, pr] of CL) put({ ...base, top: 'cheer', topPrint: p, shirt: sh, accent: ac, print2: pr, bottom: 'cheerSkirt', pants: sh, pants2: ac, hat: 'cheerBow', cap: ac === '#f4f1ea' ? sh : ac }, 'down', 0);
    nl();
    const set = { ...base, top: 'cheer', topPrint: 'heart', shirt: '#e0457e', accent: '#f4f1ea', print2: '#f4f1ea', bottom: 'cheerSkirt', pants: '#e0457e', pants2: '#f4f1ea', hand: ['pompoms', '#e0457e', '#f4f1ea'], hat: 'cheerBow', cap: '#e0457e' };
    const dress = { ...base, top: 'cheer', topPrint: 'star', shirt: '#1d51a0', accent: '#f6d02f', print2: '#f6d02f', bottom: 'cheerDress', hand: ['pompoms', '#f6d02f', '#1d51a0'], hat: 'starTiara', style: 'long', hair: '#ecd489' };
    for (const L of [set, dress]) { for (const d of ['down', 'left', 'up', 'right']) for (const f of [0, 1, 2]) put(L, d, f); nl(4); }
    nl();
    for (const h of ['cheerBow', 'starBand', 'heartBand', 'glitterBand', 'heartTiara', 'starTiara', 'tiara', 'crown', 'bow']) for (const d of ['down', 'left', 'up']) put({ ...set, hand: null, hat: h, cap: '#9a62d8' }, d, 0, 3);
    nl();
    for (const [k, c1, c2] of [['megafon', '#e0457e', '#fff'], ['stav', '#fff', '#fff'], ['flagga', '#1d51a0', '#f6d02f'], ['skylt', '#e0457e', '#fff'], ['band', '#b07ae0', '#fff'], ['ballong', '#e8394f', '#fff'], ['trollstav', '#fff', '#fff'], ['skumhand', '#3a7bd5', '#fff'], ['pokal', '#fff', '#fff'], ['lysstavar', '#5cff9c', '#ff5cf0'], ['flaska', '#3ab0e0', '#fff']])
      for (const [d, f] of [['down', 0], ['down', 1], ['left', 0], ['left', 2], ['up', 0]]) put({ ...set, hand: [k, c1, c2] }, d, f, 3);
  }, BASE);
  await page.locator('#c').screenshot({ path: OUT });
  await browser.close();
})();
