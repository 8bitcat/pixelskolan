// node tools/uppstallning-prov.cjs [BASE=http://localhost:8824/] [desktop|iphone|ipad] – kräver en lokal server för repot.
// uppställning i rutnät: lätt plus med minnessiffra, lätt minus med växling (10 + strykning), svår: ställ upp själv
// (rätt direkt = stjärna; fel två gånger = rätt uppställning visas), tryck på en ruta på tavlan, belöningen som trappas av
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://localhost:8824/';
const DEV = process.argv[3] || 'desktop';
const VP = { desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }, iphone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[DEV];
const OUT = 'up-' + DEV + '-';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(VP);
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const log = (...a) => console.log(JSON.stringify(a));
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(1500);
  await page.click('#modal [data-grade="3"]'); await page.waitForTimeout(300);
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await page.waitForTimeout(400); await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(500);
  await page.click('#sk-below [data-b="sit"]'); await page.waitForTimeout(4800);
  const T = (k) => page.evaluate((x) => window.__ps.type(x), k);
  const g = () => page.evaluate(() => window.__ps.g());
  const q = () => page.evaluate(() => window.__ps.q());
  const st = () => page.evaluate(() => window.__ps.state());
  const fb = () => page.evaluate(() => document.querySelector('#skolpanel .sp-fb')?.textContent || '');
  // skriv svaret från entalen med minnes-/växlingssiffror som på papper
  async function solve(opts = {}) {
    const Q = await q(), { a, b, op } = Q.grid, G0 = await g(), n = G0.n;
    const A = String(a).padStart(n, ' '), B = String(b).padStart(n, ' ');
    let carry = 0, borrow = 0;
    for (let i = n - 1; i >= 0; i--) {
      const da = +A[i] || 0, db = +B[i] || 0;
      let digit;
      if (op === '+') { const s = da + db + carry; digit = s % 10; carry = s >= 10 ? 1 : 0; if (carry && i > 0 && opts.carry) { await T('left'); await T('up'); await T('1'); await T('down'); await T('right'); } }
      else { let x = da - borrow; borrow = 0; if (x < db) { x += 10; borrow = 1; if (opts.carry) { await T('up'); await T('1'); await T('0'); await T('left'); await T(String(+A[i - 1] - 1)); await T('down'); await T('right'); } } digit = x - db; }
      const remaining = String(Q.ans).length; if (n - 1 - i >= remaining) break;
      await T(String(digit));
    }
  }
  // 1 lätt plus (nivå 7)
  await page.evaluate(() => window.__ps.lvl('matte', 7)); await page.waitForTimeout(300);
  let Q = await q(); log('lätt plus', Q.input, Q.grid, Q.ans, (await g()).cur);
  await solve({ carry: true }); await page.waitForTimeout(300);
  let G = await g(); log('ifyllt', G.carry.join('|'), G.ans.join('|'));
  await page.waitForTimeout(300); await page.screenshot({ path: OUT + 'plus.png' });
  await T('ok'); await page.waitForTimeout(400); log('rättat', (await st()).lesson, await fb());
  await page.waitForTimeout(1700);
  // 2 lätt minus (nivå 8) med växling
  await page.evaluate(() => window.__ps.lvl('matte', 8)); await page.waitForTimeout(300);
  Q = await q(); log('lätt minus', Q.grid, Q.ans);
  await solve({ carry: true }); G = await g(); log('ifyllt', G.carry.join('|'), G.ans.join('|'));
  await page.waitForTimeout(300); await page.screenshot({ path: OUT + 'minus.png' });
  await T('ok'); await page.waitForTimeout(400); log('rättat', await fb());
  await page.waitForTimeout(1700);
  // 3 svår: ställ upp själv rätt (nivå 21)
  await page.evaluate(() => window.__ps.lvl('matte', 21)); await page.waitForTimeout(300);
  Q = await q(); G = await g(); log('svår', Q.grid, 'fas', G.phase, G.cur);
  await page.waitForTimeout(300); await page.screenshot({ path: OUT + 'stall-upp.png' });
  const place = async (row, s) => { const n = G.n, start = n - s.length; for (let k = 0; k < n; k++) await T('left'); if (row === 'b') await T('down'); else await T('up'); for (let k = 0; k < start; k++) await T('right'); for (const ch of s) await T(ch); };
  await place('a', String(Q.grid.a)); await place('b', String(Q.grid.b));
  G = await g(); log('uppställt', G.a.join('|'), G.b.join('|'));
  await page.waitForTimeout(300); await page.screenshot({ path: OUT + 'uppstallt.png' });
  await T('ok'); await page.waitForTimeout(400); G = await g(); log('rätt uppställt', G.phase, G.star, (await page.evaluate(() => window.__ps.les())).setup, await fb());
  await solve({ carry: false }); await T('ok'); await page.waitForTimeout(400); log('svaret', await fb());
  await page.waitForTimeout(1700);
  // 4 svår: fel två gånger → rätt uppställning visas, ingen stjärna
  Q = await q(); G = await g();
  for (const ch of String(Q.grid.b)) await T(ch);   // andra talet längst till vänster i första raden = fel
  await T('ok'); await page.waitForTimeout(300); log('fel 1', (await g()).tries, await fb());
  await T('ok'); await page.waitForTimeout(300); G = await g(); log('fel 2', G.phase, G.star, G.a.join('|'), G.b.join('|'), await fb());
  // tryck på en ruta på tavlan: översta raden ovanför tiotalen
  const r = G.rects.find((x) => x.r === 'carry' && x.c === G.n - 2), box = await (await page.$('#stage canvas')).boundingBox();
  await page.mouse.click(box.x + (r.x + 6) * box.width / 384, box.y + (r.y + 4) * box.height / 216); await page.waitForTimeout(200);
  log('tryck på rutan', (await g()).cur, r.r, r.c);
  await page.screenshot({ path: OUT + 'fel-visat.png' });
  // 5 lektionen klar: belöningen med stjärnan för uppställningen
  await T('down'); await solve({ carry: false }); await T('ok'); await page.waitForTimeout(2200);
  Q = await q(); if (Q.grid && Q.grid.setup) { await place('a', String(Q.grid.a)); await place('b', String(Q.grid.b)); await T('ok'); await page.waitForTimeout(200); await solve({ carry: false }); await T('ok'); }
  await page.waitForTimeout(2600);
  log('rast', await page.evaluate(() => document.querySelector('#modal .dlg-body')?.textContent.replace(/\s+/g, ' ').slice(0, 260)));
  await page.screenshot({ path: OUT + 'rast.png' });
  // 6 samma nivå många gånger: kronorna per stjärna sjunker
  await page.evaluate(() => { document.querySelector('#modal .dlg-foot .btn')?.click(); });
  const pays = [];
  for (let k = 0; k < 6; k++) {
    await page.evaluate(() => window.__ps.lvl('matte', 1)); await page.waitForTimeout(150);
    const m0 = (await st()).money;
    for (let i = 0; i < 5; i++) { const want = (await st()).want; for (const ch of want) await T(ch); await T('ok'); await page.waitForTimeout(1950); }
    await page.waitForTimeout(400);
    pays.push([(await st()).money - m0, await page.evaluate(() => window.__ps.pay('matte3:1'))]);
    await page.evaluate(() => { document.querySelector('#modal .dlg-foot .btn')?.click(); });
  }
  log('kronor per lektion (3 stjärnor) och nästa pris', pays);
  await page.evaluate(() => window.__ps.lvl('matte', 1));
  await page.click('#skolpanel [data-sp="levels"]'); await page.waitForTimeout(400); await page.screenshot({ path: OUT + 'nivaer.png' });
  console.log('fel:', errs.length ? errs : 'inga');
  await browser.close();
})();
