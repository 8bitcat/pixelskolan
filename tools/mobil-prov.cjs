// node tools/mobil-prov.cjs [BASE=http://localhost:8824/] [desktop|iphone|ipad] – kräver en lokal server för repot.
// DREAM LAND, del 3: hörnan längst bort (kameran följer), kattmössan, mobilskalet (skal, band, berlocker, dra), färgen på
// tröjan och byxorna vid strykbordet, spegeln (byt färg, mobilen i fickan), sparat
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://localhost:8824/';
const DEV = process.argv[3] || 'desktop';
const VP = { desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }, iphone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[DEV];
const OUT = 'mb-' + DEV + '-';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(VP);
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); if (m.type() === 'warning' && /\[dream\]|\[acc\]/.test(m.text())) errs.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errs.push('404 ' + r.url()); });
  const log = (...a) => console.log(JSON.stringify(a));
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(1500);
  if (await page.$('#modal [data-grade]')) { await page.click('#modal [data-grade="3"]'); await page.waitForTimeout(400); }
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await page.waitForTimeout(400);
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(800);
  const st = () => page.evaluate(() => window.__ps.state());
  const look = () => page.evaluate(() => { const L = window.SF.avatar?.look || {}; return { hat: L.hat, cap: L.cap, mobil: L.mobil, shirt: L.shirt, pants: L.pants }; });
  await page.evaluate(() => window.__ps.give(3000));
  await page.evaluate(() => window.__ps.goScene('galleria', 'klass'));
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__ps.lib())); i++) await page.waitForTimeout(250);
  await page.evaluate(() => window.__ps.enterShop('bling')); await page.waitForTimeout(1200);
  const cv = await page.$('#stage canvas');
  const cam = () => page.evaluate(() => window.SF.scene._debug.cam());
  const clickW = async (wx, wy) => { const c = await cam(), r = await cv.boundingBox(); await page.mouse.click(r.x + (wx - c) * r.width / 384, r.y + wy * r.height / 216); };
  const waitModal = async () => { for (let i = 0; i < 60; i++) { if (await page.$('#modal:not(.hidden) .dlg')) return true; await page.waitForTimeout(200); } return false; };
  const closeM = async () => { await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .dlg-foot .btn')].find((x) => /Stäng|Klar|Tillbaka/.test(x.textContent)); b?.click(); }); await page.waitForTimeout(400); };
  // gå bort till hörnan
  await clickW(380, 150); await page.waitForTimeout(3500); await clickW(470, 140); await page.waitForTimeout(3000);
  log('kameran', await cam(), await page.evaluate(() => window.SF.scene._debug.me()));
  await cv.screenshot({ path: OUT + 'hornan.png' });
  // mössorna
  await clickW(434, 50); log('mössväggen', await waitModal(), await page.textContent('#modal .dlg-head h2'), await page.$$eval('#modal .bl-card', (c) => c.length));
  await page.screenshot({ path: OUT + 'mossor.png' });
  await page.click('#modal .bl-card[data-i="0"]'); await page.waitForTimeout(600);
  const sw = await page.$$eval('#modal [data-c]', (b) => b.map((x) => x.dataset.c)); await page.click(`#modal [data-c="${sw[2]}"]`); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'prova-mossa.png' });
  const m0 = (await st()).money; await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  let L = await look(); log('kattmössa', m0 - (await st()).money, L.hat, L.cap === sw[2]);
  // mobilskalet
  await clickW(505, 196); log('mobilbordet', await waitModal(), await page.textContent('#modal .dlg-head h2'));
  await page.click('#modal [data-case="mint"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-strap="regnbage"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-mcat="figur"]'); await page.waitForTimeout(200); await page.click('#modal [data-charm="c-dino"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-mcat="glitter"]'); await page.waitForTimeout(200); await page.click('#modal [data-charm="c-diamant-rosa"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-mcat="abc"]'); await page.waitForTimeout(200); await page.click('#modal [data-charm="c-l-12"]'); await page.waitForTimeout(250);
  const box = await (await page.$('#modal .dl-phone canvas')).boundingBox(), kx = box.width / 80, ky = box.height / 136;
  await page.mouse.move(box.x + (22 + 0.3 * 36) * kx, box.y + (10 + 0.32 * 86) * ky); await page.mouse.down(); await page.mouse.move(box.x + 40 * kx, box.y + 70 * ky, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(400);
  log('mobilpris', await page.textContent('#modal .bl-sum b'), await page.textContent('#modal .dl-tools .sp'), await page.textContent('#modal .dlg-foot .btn-go'));
  await page.waitForTimeout(400); await page.screenshot({ path: OUT + 'mobilskal.png' });
  const m1 = (await st()).money; await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  L = await look(); log('köpt mobilskal', m1 - (await st()).money, L.mobil);
  await page.waitForTimeout(800); await cv.screenshot({ path: OUT + 'med-mobil.png' });
  // färg vid strykbordet
  await clickW(338, 196); await waitModal();
  await page.click('#modal [data-area="top"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-col="#46a35a"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-area="bottom"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-col="#b83d7a"]'); await page.waitForTimeout(400);
  log('färg', await page.textContent('#modal .sk-lbl'), await page.textContent('#modal .dlg-foot .btn-go'));
  await page.screenshot({ path: OUT + 'farg.png' });
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  L = await look(); log('ny färg', L.shirt, L.pants);
  // spegeln
  await clickW(156, 60); await waitModal(); await page.screenshot({ path: OUT + 'spegel.png' });
  log('spegeln', await page.$$eval('#modal [data-mx]', (b) => b.map((x) => x.textContent)));
  await page.click('#modal [data-mx="ficka"]'); await page.waitForTimeout(400); L = await look(); log('i fickan', L.mobil);
  await page.click('#modal [data-mx="farg"]'); await page.waitForTimeout(400); log('färg från spegeln', await page.textContent('#modal .dlg-head h2'));
  await closeM();
  // ut och sparat
  await clickW(192, 70); await page.waitForTimeout(2500);
  const saved = await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('pixelskolan-v3')); return { hat: x.ME.look.hat, shirt: x.ME.look.shirt, pants: x.ME.look.pants, mobil: x.ME.look.mobil || null, designs: x.BLING.map((d) => d.kind + ':' + d.name) }; });
  log('sparat', saved, (await st()).shop || 'ute');
  console.log('fel:', errs.length ? errs : 'inga');
  await browser.close();
})();
