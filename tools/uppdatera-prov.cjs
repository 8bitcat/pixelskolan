// node tools/uppdatera-prov.cjs [BASE=http://localhost:8824/] – kräver en lokal server för repot.
// appen uppdaterar sig själv: låtsas-Capacitor med ett låtsas-uppdateringsplugin, låtsas-version.json (1.1.1) och
// låtsas-release. A: allra först (ingen figur) byts direkt. B: mitt i en lektion väntar den, efter lektionen räknar den
// ner och byter. C: i en butik väntar den. D: samma version eller äldre hämtas inte.
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://localhost:8824/';
const MOCK = (webbVersion) => `
  window.__upd = [];
  window.Capacitor = { isNativePlatform: () => true, Plugins: { CapacitorUpdater: {
    notifyAppReady() { window.__upd.push('ready'); return Promise.resolve(); },
    download(o) { window.__upd.push('download ' + o.version + ' ' + o.url + ' ' + o.checksum.slice(0, 8)); return Promise.resolve({ id: 'paket-' + o.version }); },
    next(o) { window.__upd.push('next ' + o.id); return Promise.resolve(); },
    set(o) { window.__upd.push('set ' + o.id); return Promise.resolve(); },
  } } };`;
async function run(browser, webbVersion, steps) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.addInitScript(MOCK(webbVersion));
  await page.route('https://8bitcat.github.io/pixelskolan/version.json*', (r) => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ version: webbVersion, title: 'Provversionen' }) }));
  await page.route(`https://api.github.com/repos/8bitcat/pixelskolan/releases/tags/v${webbVersion}`, (r) => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ assets: [{ name: `pixelskolan-${webbVersion}.zip`, digest: 'sha256:' + 'ab'.repeat(32) }] }) }));
  await page.goto(BASE + 'index.html');
  const out = await steps(page);
  out.fel = errs.length ? errs : 'inga';
  await page.close();
  return out;
}
const upd = (p) => p.evaluate(() => window.__upd.slice());
const ruta = (p) => p.evaluate(() => document.getElementById('sk-upd')?.textContent || '');
(async () => {
  const browser = await chromium.launch();
  // A: allra först – årskursdialogen är öppen, ingen figur än
  console.log('A', JSON.stringify(await run(browser, '1.1.1', async (p) => { await p.waitForTimeout(4500); return { upd: await upd(p), version: await p.evaluate(() => window.PS_UPDATE.VERSION) }; })));
  // B: mitt i en lektion
  console.log('B', JSON.stringify(await run(browser, '1.2.0', async (p) => {
    await p.waitForTimeout(300);
    await p.click('#modal [data-grade="3"]'); await p.waitForTimeout(300);
    await p.fill('#av-name', 'Mira'); await p.click('#modal .av-save'); await p.waitForTimeout(300); await p.click('#modal .dlg-foot .btn-go'); await p.waitForTimeout(300);
    await p.click('#sk-below [data-b="sit"]'); await p.waitForTimeout(6000);
    const iLektion = { upd: await upd(p), ruta: await ruta(p), seated: (await p.evaluate(() => window.__ps.state())).seated };
    await p.evaluate(() => window.__ps.goScene('galleria', 'klass')); await p.waitForTimeout(3500);
    const efter3s = { upd: await upd(p), ruta: await ruta(p) };
    await p.waitForTimeout(6500);
    return { iLektion, efter3s, efter10s: await upd(p) };
  })));
  // C: i en butik
  console.log('C', JSON.stringify(await run(browser, '1.1.5', async (p) => {
    await p.waitForTimeout(300);
    await p.click('#modal [data-grade="3"]'); await p.waitForTimeout(300);
    await p.fill('#av-name', 'Mira'); await p.click('#modal .av-save'); await p.waitForTimeout(300); await p.click('#modal .dlg-foot .btn-go'); await p.waitForTimeout(300);
    await p.evaluate(() => window.__ps.goScene('galleria', 'klass'));
    for (let i = 0; i < 40 && !(await p.evaluate(() => window.__ps.lib())); i++) await p.waitForTimeout(250);
    await p.evaluate(() => window.__ps.enterShop('bling')); await p.waitForTimeout(12000);
    return { iButiken: await upd(p), ruta: await ruta(p) };
  })));
  // D: webben har samma version
  console.log('D', JSON.stringify(await run(browser, '1.1.0', async (p) => { await p.waitForTimeout(4000); return { upd: await upd(p) }; })));
  await browser.close();
})();
