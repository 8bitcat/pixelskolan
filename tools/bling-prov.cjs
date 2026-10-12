// node tools/bling-prov.cjs [BASE=http://localhost:8824/] [desktop|iphone|ipad] – kräver en lokal server för repot.
// BLING BLING: fasaden på plan 1, in genom dörren med riktiga klick, köpa i montern, designa halsband och väska,
// väskväggen, spegeln, ut igen (dubbeltryck får inte gå in igen), sparat efter omladdning
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://localhost:8824/';
const DEV = process.argv[3] || 'desktop';
const VP = { desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }, iphone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[DEV];
const OUT = 'bl-' + DEV + '-';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(VP);
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errs.push('404 ' + r.url()); });
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(1500);
  if (await page.$('#modal [data-grade]')) { await page.click('#modal [data-grade="3"]'); await page.waitForTimeout(400); }
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await page.waitForTimeout(400);
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(800);
  const st = () => page.evaluate(() => window.__ps.state());
  const look = () => page.evaluate(() => { const L = window.SF.avatar?.look || {}; return { neck: L.neck, neckColor: L.neckColor, bag: L.bag, bagColor: L.bagColor, jewel: L.jewel }; });
  await page.evaluate(() => window.__ps.give(3000));
  await page.evaluate(() => window.__ps.goScene('galleria', 'klass'));
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__ps.lib())); i++) await page.waitForTimeout(250);
  await page.waitForTimeout(600);
  let cv = await page.$('#stage canvas');
  const log = { push: (l) => console.log(JSON.stringify(l)) };
  const waitFor = async (fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (fn(s)) return s; await page.waitForTimeout(200); } return await st(); };
  const camOf = async () => (await page.evaluate(() => window.SF?.scene?._debug?.cam?.())) || 0;
  const clickS = async (wx, wy) => {   // butikens punkter: ligger platsen utanför bild går figuren först ditåt (kameran följer)
    for (let k = 0; k < 5; k++) { const c = await camOf(); if (wx >= c + 10 && wx <= c + 374) break; const r = await cv.boundingBox(), sx = Math.max(12, Math.min(372, wx - c)); await page.mouse.click(r.x + sx * r.width / 384, r.y + 150 * r.height / 216); await page.waitForTimeout(1800); }
    const c = await camOf(), r = await cv.boundingBox(); await page.mouse.click(r.x + (wx - c) * r.width / 384, r.y + wy * r.height / 216);
  };
  const hitAt = (x, y) => page.evaluate(([x, y]) => { const h = window.__ps.hit(x, y); return h && (h.t + ':' + (h.label || '')); }, [x, y]);
  // fasaden
  await page.evaluate(() => { window.__ps.floor(1); window.__ps.cam(560); }); await page.waitForTimeout(1800);
  await cv.screenshot({ path: OUT + 'fasad.png' });
  log.push(['plan 1 bredd', await page.evaluate(() => window.__ps.floorW()), 'träff', await hitAt(872, 100), await hitAt(820, 50)]);
  // in genom dörren: klick på fasaden (figuren går dit från hissen)
  await page.evaluate(() => window.__ps.walkTo(760, 176)); await page.waitForTimeout(4000);
  let s = await st(); await clickS(872 - s.cam, 100);
  s = await waitFor((s) => s.shop === 'bling', 20000);
  log.push(['inne', s.shop]); await page.waitForTimeout(900);
  await cv.screenshot({ path: OUT + 'inne.png' });
  const waitModal = async () => { for (let i = 0; i < 40; i++) { if (await page.$('#modal:not(.hidden) .dlg')) return true; await page.waitForTimeout(200); } return false; };
  const closeM = async () => { await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .dlg-foot .btn')].find((x) => /Stäng|Klar/.test(x.textContent)); b?.click(); }); await page.waitForTimeout(500); };
  // halsbandsmontern: köp halsbandet med berlock
  await clickS(43, 112); log.push(['monter öppnas', await waitModal()]);
  await page.screenshot({ path: OUT + 'monter.png' });
  const m0 = (await st()).money;
  await page.click('#modal .bl-card[data-i="1"]'); await page.waitForTimeout(600);   // pärlhalsbandet: klädaffärens provdialog
  log.push(['provdialog', await page.textContent('#modal .dlg-head h2'), await page.$$eval('#modal .klb-fig canvas', (c) => c.map((x) => x.style.width)), await page.textContent('#modal [data-view]')]);
  await page.click('#modal [data-turn="1"]'); await page.waitForTimeout(200); log.push(['vriden', await page.textContent('#modal [data-view]')]);
  await page.click('#modal [data-turn="-1"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'prova-halsband.png' });
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(500);
  log.push(['köpt pärlhalsband', m0 - (await st()).money, await look()]);
  // ateljén: halsband av silver med enhörning, ametist och sex pärlor = 40 + 120 + 60 + 60
  await clickS(151, 200); log.push(['halsbandsbordet', await waitModal()]);
  for (const [k, v] of [['kedja', 'silver'], ['hange', 'enhorning'], ['sten', 'lila'], ['parlor', '6']]) { await page.click(`#modal [data-k="${k}"][data-v="${v}"]`); await page.waitForTimeout(250); }
  log.push(['pris', await page.textContent('#modal .bl-sum b'), await page.textContent('#modal .dlg-foot .btn-go')]);
  log.push(['provfigur i ateljén', await page.$$eval('#modal .bl-fig canvas', (c) => c.map((x) => x.style.width)), await page.textContent('#modal [data-view]')]);
  await page.waitForTimeout(400); await page.screenshot({ path: OUT + 'design-halsband.png' });
  const m1 = (await st()).money; await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  log.push(['köpt eget halsband', m1 - (await st()).money, await look()]);
  // samma design igen: ta på gratis
  await clickS(151, 200); await waitModal();
  log.push(['samma igen', await page.textContent('#modal .dlg-foot .btn-go'), await page.$$eval('#modal [data-mine]', (b) => b.length)]);
  await closeM();
  // väskbordet: nalleryggsäck i guld med stjärnor och pompom = 110 + 80 + 40 + 25
  await clickS(231, 200); await waitModal();
  for (const [k, v] of [['modell', 'nalle'], ['farg', 'guld'], ['monster', 'stjarnor'], ['berlock', 'pompom']]) { await page.click(`#modal [data-k="${k}"][data-v="${v}"]`); await page.waitForTimeout(250); }
  log.push(['väskpris', await page.textContent('#modal .bl-sum b'), 'syns', await page.textContent('#modal [data-view]')]);
  await page.waitForTimeout(400); await page.screenshot({ path: OUT + 'design-vaska.png' });
  const m2 = (await st()).money; await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(600);
  log.push(['köpt egen väska', m2 - (await st()).money, await look()]);
  // fler väskor: handväskan på väggen
  await clickS(300, 50); await waitModal(); await page.screenshot({ path: OUT + 'vaskor.png' });
  const m3 = (await st()).money; await page.click('#modal .bl-card[data-i="0"]'); await page.waitForTimeout(600);   // handväskan
  const sw = await page.$$eval('#modal [data-c]', (b) => b.map((x) => x.dataset.c)); await page.click(`#modal [data-c="${sw[3]}"]`); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'prova-vaska.png' });
  await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(500);
  log.push(['handväska', m3 - (await st()).money, (await look()).bag, (await look()).bagColor === sw[3]]);
  // örhängen, armband
  await clickS(113, 112); await waitModal(); log.push(['örhängen', await page.$$eval('#modal .bl-card', (b) => b.length)]); await closeM();
  await clickS(55, 168); await waitModal(); log.push(['armband', await page.$$eval('#modal .bl-card', (b) => b.length)]); await closeM();
  // spegeln
  await clickS(156, 60); await waitModal(); await page.screenshot({ path: OUT + 'spegel.png' });
  log.push(['spegeln', await page.$$eval('#modal [data-own]', (b) => b.length), await page.$$eval('#modal [data-des]', (b) => b.length), 'figur', await page.$$eval('#modal .bl-fig canvas', (c) => c.length)]);
  await page.click('#modal [data-des="0"]'); await page.waitForTimeout(300); log.push(['egen design på', await look()]);
  await closeM();
  await page.waitForTimeout(600); await cv.screenshot({ path: OUT + 'inne2.png' });
  // ut genom dörren och ett dubbeltryck på fasaden direkt efter
  await clickS(192, 70); s = await waitFor((s) => !s.shop, 15000);
  log.push(['ute', s.shop, s.floor, Math.round(s.x)]);
  await page.waitForTimeout(150); s = await st(); await clickS(872 - s.cam, 100);
  await page.waitForTimeout(2500); s = await st(); log.push(['dubbeltryck', s.shop || 'ute', Math.round(s.x), Math.round(s.y)]);
  const saved = await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('pixelskolan-v3')); return { neck: x.ME.look.neck, neckColor: x.ME.look.neckColor, bag: x.ME.look.bag, designs: x.BLING.length }; });
  log.push(['sparat', saved]);
  await page.evaluate(() => window.__ps.cam(560)); await page.waitForTimeout(800); await cv.screenshot({ path: OUT + 'fasad-ute.png' });
  // omladdning: designerna finns kvar
  await page.reload(); await page.waitForTimeout(1800); cv = await page.$('#stage canvas');
  await page.evaluate(() => window.__ps.goScene('galleria', 'klass'));
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__ps.lib())); i++) await page.waitForTimeout(250);
  await page.evaluate(() => window.__ps.enterShop('bling')); await page.waitForTimeout(800);
  await clickS(156, 60); await waitModal();
  log.push(['efter omladdning', await page.$$eval('#modal [data-des]', (b) => b.length), await page.$$eval('#modal [data-own]', (b) => b.length)]);

  console.log('fel:', errs.length ? errs : 'inga');
  await browser.close();
})();
