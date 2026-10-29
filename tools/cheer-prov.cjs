// node tools/cheer-prov.cjs [BASE=http://127.0.0.1:8824/] [desktop|iphone|ipad] – kräver en lokal server för repot (bilderna hamnar i arbetsmappen)
// prov: gå till plan 2, se fasaden, gå in i HEJA HEJA, öppna borden, köp en dräkt och pompomer, heja på mattan
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8824/';
const DEV = process.argv[3] || 'desktop';
const VP = { desktop: { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 }, iphone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[DEV];
const OUT = 'ch-' + DEV + '-';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(VP);
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const log = (...a) => console.log(JSON.stringify(a));
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(1200);
  await page.click('#modal [data-grade="3"]'); await page.waitForTimeout(300);
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await page.waitForTimeout(400); await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(500);
  await page.evaluate(() => { window.__ps.give(3000); window.__ps.goScene('galleria'); }); await page.waitForFunction(() => window.__ps.lib(), null, { timeout: 20000 });
  await page.evaluate(() => window.__ps.floor(2)); await page.waitForTimeout(600);
  log('våningen', await page.evaluate(() => window.__ps.floorW()));
  await page.evaluate(() => window.__ps.cam(972 - 384)); await page.waitForTimeout(600);
  await page.locator('#room').screenshot({ path: OUT + 'fasad.png' });
  await page.evaluate(() => window.__ps.cam(null));
  await page.evaluate(() => window.__ps.enterShop('cheer')); await page.waitForTimeout(700);
  log('i butiken', (await page.evaluate(() => window.__ps.state())).shop);
  await page.locator('#room').screenshot({ path: OUT + 'inne.png' });
  await page.evaluate(() => window.SF.scene._debug.walk(500, 130)); await page.waitForTimeout(4500); await page.locator('#room').screenshot({ path: OUT + 'inne-h.png' }); await page.evaluate(() => window.SF.scene._debug.walk(192, 110)); await page.waitForTimeout(4500);
  const S = () => page.evaluate(() => window.SF.scene);
  // bordet DESIGNA DRÄKT via scenens debug-punkter: klicka i skärmkoordinater
  const clickW = async (x, y) => { if (x > 300) { await page.evaluate(([x]) => window.SF.scene._debug.walk(x, 130), [x]); await page.waitForTimeout(3500); } const cam = await page.evaluate(() => window.SF.scene._debug.cam()); const box = await (await page.$('#room')).boundingBox(); await page.mouse.click(box.x + (x - cam) * box.width / 384, box.y + y * box.height / 216); };
  await clickW(75, 200); await page.waitForTimeout(3500);
  log('dialog', await page.evaluate(() => document.querySelector('#modal .dlg-head h2')?.textContent));
  await page.screenshot({ path: OUT + 'designa.png' });
  await page.click('#modal [data-club="bolt"]'); await page.waitForTimeout(300);
  await page.click('#modal [data-model="hel"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'designa-hel.png' });
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  log('köpt', await page.evaluate(() => ({ look: window.SF.avatar.look.top + '/' + window.SF.avatar.look.topPrint + '/' + window.SF.avatar.look.bottom, money: window.__ps.G.money })));
  // pompomerna
  await clickW(285, 200); await page.waitForTimeout(4000);
  log('dialog', await page.evaluate(() => document.querySelector('#modal .dlg-head h2')?.textContent));
  await page.click('#modal [data-c1="#f6d02f"]'); await page.waitForTimeout(250);
  await page.screenshot({ path: OUT + 'pompom.png' });
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  log('i händerna', await page.evaluate(() => window.SF.avatar.look.hand));
  // mattan
  await clickW(196, 150); await page.waitForTimeout(2600);
  await page.waitForTimeout(100); await page.locator('#room').screenshot({ path: OUT + 'matta.png' });
  // i händerna-väggen
  await clickW(494, 60); await page.waitForTimeout(4500);
  log('dialog', await page.evaluate(() => document.querySelector('#modal .dlg-head h2')?.textContent));
  await page.screenshot({ path: OUT + 'hander.png' });
  await page.click('#modal .bl-card[data-i="3"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + 'ballong.png' });
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  log('i händerna', await page.evaluate(() => window.SF.avatar.look.hand));
  // huvudet
  await clickW(400, 60); await page.waitForTimeout(3500);
  await page.screenshot({ path: OUT + 'huvud.png' });
  await page.evaluate(() => document.querySelector('#modal .dlg-foot .btn')?.click()); await page.waitForTimeout(300);
  // spegeln
  await clickW(160, 60); await page.waitForTimeout(3000);
  await page.screenshot({ path: OUT + 'spegel.png' });
  await page.evaluate(() => document.querySelector('#modal .dlg-foot .btn')?.click()); await page.waitForTimeout(300);
  // ut och tillbaka till gallerian
  await clickW(192, 70); await page.waitForTimeout(3500);
  log('ute', await page.evaluate(() => ({ s: window.__ps.state().scene, shop: window.__ps.state().shop, floor: window.__ps.state().floor })));
  await page.locator('#room').screenshot({ path: OUT + 'ute.png' });
  // omladdning: dräkten, det man håller i och köpen i butiken finns kvar
  await page.reload(); await page.waitForTimeout(1800);
  await page.evaluate(() => window.__ps.goScene('galleria')); await page.waitForFunction(() => window.__ps.lib(), null, { timeout: 20000 });
  await page.evaluate(() => window.__ps.enterShop('cheer')); await page.waitForTimeout(600);
  log('efter omladdning', await page.evaluate(() => { const L = window.SF.avatar.look; return { top: L.top, topPrint: L.topPrint, bottom: L.bottom, hand: L.hand, hat: L.hat }; }));
  await page.evaluate(() => window.SF.scene._debug.walk(160, 98)); await page.waitForTimeout(2500);
  await clickW(160, 60); await page.waitForTimeout(2500);
  log('spegeln', await page.evaluate(() => ({ drakter: document.querySelectorAll('#modal [data-dr]').length, hander: document.querySelectorAll('#modal [data-hd]').length, klader: document.querySelectorAll('#modal [data-own]').length })));
  await page.evaluate(() => document.querySelector('#modal [data-hd="-1"]')?.click()); await page.waitForTimeout(300);
  log('lade ner', await page.evaluate(() => window.SF.avatar.look.hand));
  await page.screenshot({ path: OUT + 'spegel2.png' });
  console.log('fel:', errs.length ? errs : 'inga');
  await browser.close();
})();
