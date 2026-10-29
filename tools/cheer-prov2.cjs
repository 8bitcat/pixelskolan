// node tools/cheer-prov2.cjs [BASE=http://127.0.0.1:8824/] [desktop|iphone|ipad] – kräver en lokal server för repot (bilderna hamnar i arbetsmappen)
// prov: HEJA HEJA 2 – flikarna (hela dräkter först), en hel dräkt köps (bara dräkten syns), närbilden, scenen med
// strålkastaren och lagets uppvisning (rad, ramsa, pyramid i takt)
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8824/';
const DEV = process.argv[3] || 'desktop';
const VP = { desktop: { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 }, iphone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[DEV];
const OUT = 'c2-' + DEV + '-';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(VP);
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const log = (...a) => console.log(JSON.stringify(a));
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(1200);
  await page.click('#modal [data-grade="3"]'); await page.waitForTimeout(300);
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await page.waitForTimeout(400); await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(500);
  await page.evaluate(() => { window.__ps.give(5000); window.__ps.goScene('galleria'); }); await page.waitForFunction(() => window.__ps.lib(), null, { timeout: 20000 });
  await page.evaluate(() => window.__ps.enterShop('cheer')); await page.waitForTimeout(700);
  // väska och halsduk på, som Carls figur (ryggsäcken skymde dräkten)
  await page.evaluate(() => { window.SF.avatar = { ...window.SF.avatar, look: { ...window.SF.avatar.look, bag: 'backpack', bagColor: '#2a5cc0', neck: 'scarf' } }; });
  const S = () => window.SF.scene;
  const clickW = async (x, y) => { { const c0 = await page.evaluate(() => window.SF.scene._debug.cam()); if (x - c0 < 12 || x - c0 > 372) { await page.evaluate(([x]) => window.SF.scene._debug.walk(x, 130), [x]); await page.waitForTimeout(4500); } } const cam = await page.evaluate(() => window.SF.scene._debug.cam()); const box = await (await page.$('#room')).boundingBox(); await page.mouse.click(box.x + (x - cam) * box.width / 384, box.y + y * box.height / 216); };
  const title = () => page.evaluate(() => document.querySelector('#modal .dlg-head h2')?.textContent);
  // lagets uppvisning: raden, ramsan och pyramiden
  for (const [b, name] of [[6, 'rad'], [14, 'ramsa'], [28, 'pyramid']]) {
    await page.evaluate((x) => window.SF.scene._debug.show(x), b); await page.waitForTimeout(250);
    log('laget takt ' + b, await page.evaluate(() => window.SF.scene._debug.team()));
    await page.locator('#room').screenshot({ path: OUT + 'laget-' + name + '.png' });
  }
  // dräktväggen: flikarna, hela dräkter först
  await clickW(72, 50); await page.waitForTimeout(3200);
  log('dialog', await title(), await page.evaluate(() => [...document.querySelectorAll('#modal [data-tab]')].map((b) => b.textContent + (b.classList.contains('btn-gold') ? '*' : ''))), await page.evaluate(() => document.querySelectorAll('#modal [data-o]').length));
  await page.screenshot({ path: OUT + 'hela.png' });
  await page.click('#modal [data-tab="toppar"]'); await page.waitForTimeout(300);
  await page.click('#modal [data-model="cheerLong"]'); await page.waitForTimeout(300);
  log('toppar', await page.evaluate(() => document.querySelectorAll('#modal [data-it]').length));
  await page.screenshot({ path: OUT + 'toppar.png' });
  await page.click('#modal [data-tab="kjolar"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'kjolar.png' });
  await page.click('#modal [data-tab="hela"]'); await page.waitForTimeout(300);
  await page.click('#modal [data-o="2"]'); await page.waitForTimeout(400);
  log('hel dräkt', await title());
  await page.screenshot({ path: OUT + 'hel-detalj.png' });
  await page.click('#modal [data-zoom]'); await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + 'hel-narbild.png' });
  await page.click('#modal [data-zoom]'); await page.waitForTimeout(200);
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(700);
  log('köpt', await page.evaluate(() => { const L = window.SF.avatar.look; return { top: L.top, print: L.topPrint, bottom: L.bottom, shoes: L.shoeType, hat: L.hat, hand: L.hand, bag: L.bag, neck: L.neck, kr: window.__ps.G.money }; }));
  // en topp med egna färger
  await clickW(72, 50); await page.waitForTimeout(3200);
  await page.click('#modal [data-tab="toppar"]'); await page.waitForTimeout(300);
  await page.click('#modal [data-model="cheerCrop"]'); await page.waitForTimeout(300);
  await page.click('#modal [data-it="top-cheercrop-paw"]'); await page.waitForTimeout(400);
  await page.click('#modal [data-shirt="#46a35a"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'topp-prova.png' });
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  log('topp', await page.evaluate(() => { const L = window.SF.avatar.look; return [L.top, L.topPrint, L.shirt]; }));
  // designbordet: större figur
  await clickW(75, 200); await page.waitForTimeout(3500);
  await page.click('#modal [data-top="cheerLong"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'designa.png' });
  await page.evaluate(() => document.querySelector('#modal [data-close]')?.click()); await page.waitForTimeout(200);
  // en skyltdocka på podiet
  await page.evaluate(() => window.SF.scene._debug.walk(686, 180)); await page.waitForTimeout(5000);
  await page.locator('#room').screenshot({ path: OUT + 'podiet.png' });
  // scenen: strålkastaren
  await clickW(601, 60); await page.waitForTimeout(2600);
  log('scenen', await page.evaluate(() => ({ me: window.SF.scene._debug.me(), spot: window.SF.scene._debug.spot() })));
  await page.locator('#room').screenshot({ path: OUT + 'scenen.png' });
  await page.evaluate(() => window.SF.scene._debug.walk(192, 110)); await page.waitForTimeout(6000);
  await page.locator('#room').screenshot({ path: OUT + 'inne.png' });
  console.log('fel:', errs.length ? errs : 'inga');
  await browser.close();
})();
