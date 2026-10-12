// node tools/dream-prov.cjs [BASE=http://localhost:8824/] [desktop|iphone|ipad] – kräver en lokal server för repot.
// DREAM LAND: pärla för pärla (MIRA + glaspärlor), strykmärken på tröjan (dra dit), märken på väskan, sparat på figuren
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://localhost:8824/';
const DEV = process.argv[3] || 'desktop';
const VP = { desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }, iphone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[DEV];
const OUT = 'dl-' + DEV + '-';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(VP);
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); if (m.type() === 'warning' && /\[dream\]/.test(m.text())) errs.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errs.push('404 ' + r.url()); });
  const log = (...a) => console.log(JSON.stringify(a));
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(1500);
  if (await page.$('#modal [data-grade]')) { await page.click('#modal [data-grade="3"]'); await page.waitForTimeout(400); }
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await page.waitForTimeout(400);
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(800);
  const st = () => page.evaluate(() => window.__ps.state());
  const look = () => page.evaluate(() => { const L = window.SF.avatar?.look || {}; return { neck: L.neck, beads: L.beads, patches: L.patches, bag: L.bag }; });
  await page.evaluate(() => window.__ps.give(3000));
  await page.evaluate(() => window.__ps.goScene('galleria', 'klass'));
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__ps.lib())); i++) await page.waitForTimeout(250);
  await page.evaluate(() => { window.__ps.floor(1); window.__ps.cam(560); }); await page.waitForTimeout(1500);
  let cv = await page.$('#stage canvas');
  await cv.screenshot({ path: OUT + 'fasad.png' });
  await page.evaluate(() => window.__ps.enterShop('bling')); await page.waitForTimeout(1200);
  await cv.screenshot({ path: OUT + 'inne.png' });
  const clickS = async (sx, sy) => { const r = await cv.boundingBox(); await page.mouse.click(r.x + sx * r.width / 384, r.y + sy * r.height / 216); };
  const waitModal = async () => { for (let i = 0; i < 50; i++) { if (await page.$('#modal:not(.hidden) .dlg')) return true; await page.waitForTimeout(200); } return false; };
  const closeM = async () => { await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .dlg-foot .btn')].find((x) => /Stäng|Klar/.test(x.textContent)); b?.click(); }); await page.waitForTimeout(400); };
  // ---- pärlbaren ----
  await clickS(192, 156); log('pärlbaren', await waitModal(), await page.textContent('#modal .dlg-head h2'));
  await page.click('#modal [data-bcat="abc"]'); await page.waitForTimeout(200);
  for (const id of ['b-12', 'b-8', 'b-17', 'b-0']) { await page.click(`#modal [data-bead="${id}"]`); await page.waitForTimeout(150); }
  await page.click('#modal [data-bcat="glas"]'); await page.waitForTimeout(200);
  for (const id of ['g-rosa', 'g-lila', 'g-ljusbla']) { await page.click(`#modal [data-bead="${id}"]`); await page.waitForTimeout(150); }
  await page.click('#modal [data-bcat="form"]'); await page.waitForTimeout(200);
  await page.click('#modal [data-bead="f-hjarta"]'); await page.waitForTimeout(150);
  await page.click('#modal [data-bt="rep"]'); await page.waitForTimeout(300);
  log('pärlpris', await page.textContent('#modal .bl-sum b'), await page.textContent('#modal .bl-sum .sp'), await page.textContent('#modal .dlg-foot .btn-go'));
  await page.waitForTimeout(500); await page.screenshot({ path: OUT + 'parlor.png' });
  const m0 = (await st()).money; await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  let L = await look(); log('köpt pärlhalsband', m0 - (await st()).money, L.neck, L.beads?.length);
  // ---- strykbordet: tröjan ----
  await clickS(338, 196); log('strykbordet', await waitModal(), await page.textContent('#modal .dl-areas'));
  await page.click('#modal [data-area="top"]'); await page.waitForTimeout(300);
  await page.click('#modal [data-patch="hjarta"]'); await page.waitForTimeout(300);
  await page.click('#modal [data-pcat="ord"]'); await page.waitForTimeout(200);
  await page.click('#modal [data-patch="t-love"]'); await page.waitForTimeout(300);
  // dra det första märket uppåt till vänster på bröstet
  const box = await (await page.$('#modal .dl-cloth canvas')).boundingBox(), kx = box.width / 96, ky = box.height / 72;
  const pos = await page.evaluate(() => null);
  await page.mouse.move(box.x + (33 + 0.25 * 30) * kx, box.y + (18 + 0.3 * 46) * ky); await page.mouse.down();
  await page.mouse.move(box.x + 38 * kx, box.y + 26 * ky, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(400);
  log('märken på tröjan', await page.textContent('#modal .dl-tools .sp'), await page.textContent('#modal .bl-sum b'), await page.textContent('#modal .dlg-foot .btn-go'));
  await page.waitForTimeout(500); await page.screenshot({ path: OUT + 'stryk-troja.png' });
  const m1 = (await st()).money; await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  L = await look(); log('strukit fast', m1 - (await st()).money, (L.patches || []).map((p) => `${p.a}:${p.p}@${p.u},${p.v}`));
  // ---- väskan: ta på en ryggsäck och stryk märken på den ----
  await page.evaluate(() => { const A = window.SF; A.avatar = { ...A.avatar, look: { ...A.avatar.look, bag: 'backpack', bagColor: '#f07ab0' } }; });
  await clickS(338, 196); await waitModal();
  log('väskan först', await page.$eval('#modal [data-area="bag"]', (b) => b.className.includes('btn-gold')), await page.textContent('#modal [data-view]'));
  await page.click('#modal [data-pcat="natur"]'); await page.waitForTimeout(200); await page.click('#modal [data-patch="regnbage"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-pcat="abc"]'); await page.waitForTimeout(200); await page.click('#modal [data-patch="l-m"]'); await page.waitForTimeout(250);
  await page.click('#modal [data-pcat="glitter"]'); await page.waitForTimeout(200); await page.click('#modal [data-patch="g-stjarna"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + 'stryk-vaska.png' });
  const m2 = (await st()).money; await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  L = await look(); log('väskmärken', m2 - (await st()).money, (L.patches || []).length);
  // ---- spegeln, ut, sparat ----
  await clickS(156, 60); await waitModal(); await page.screenshot({ path: OUT + 'spegel.png' }); await closeM();
  await clickS(192, 70); await page.waitForTimeout(2500);
  const saved = await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('pixelskolan-v3')); return { neck: x.ME.look.neck, beads: (x.ME.look.beads || []).length, patches: (x.ME.look.patches || []).length, designs: x.BLING.map((d) => d.kind + ':' + d.name) }; });
  log('sparat efter ut', saved, (await st()).shop || 'ute');
  // figuren stor: framifrån, från sidan, bakifrån
  await page.evaluate(async (BASE) => {
    const { drawPerson } = await import(BASE + 'sf/js/core/people.js');
    const raw = JSON.parse(localStorage.getItem('pixelskolan-v3')).ME.look;
    const c = document.createElement('canvas'); c.width = 28 * 4; c.height = 44; const g = c.getContext('2d');
    ['down', 'right', 'up', 'left'].forEach((d, i) => drawPerson(g, 14 + i * 28, 41, raw, d, 0));
    const o = document.createElement('canvas'); o.id = 'figs'; o.width = c.width * 6; o.height = c.height * 6; const og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.fillStyle = '#f3e8ef'; og.fillRect(0, 0, o.width, o.height); og.drawImage(c, 0, 0, o.width, o.height);
    o.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.append(o);
  }, BASE);
  await page.locator('#figs').screenshot({ path: OUT + 'figuren.png' });
  await page.evaluate(() => document.getElementById('figs').remove());
  // omladdning: allt kvar
  await page.reload(); await page.waitForTimeout(1800);
  const after = await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('pixelskolan-v3')); return { beads: (x.ME.look.beads || []).length, patches: (x.ME.look.patches || []).length }; });
  log('efter omladdning', after);
  console.log('fel:', errs.length ? errs : 'inga');
  await browser.close();
})();
