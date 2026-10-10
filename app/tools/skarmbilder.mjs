// App Store-bilderna till Pixelskolan: spelet i appens läge (liggande, utan webbläsare) i exakt Apples storlekar.
//   iphone63  iPhone med Dynamic Island (6,3 tum)  874×402 ×3 = 2622×1206 (det enda som krävs för iPhone)
//   ipad13    iPad 13 tum                          1376×1032 ×2 = 2752×2064
//   node app/tools/skarmbilder.mjs [iphone63|ipad13]   → app/store/ladda-upp/<enhet>/<enhet>-NN-namn.png (båda om inget anges)
// Ordningen är den som bilderna ska dras in i App Store Connect. Kräver en lokal server för repot på 8824 (PORT=…).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = require('playwright');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || 8824;
const ENHETER = {
  iphone63: { mapp: 'iPhone 6,3 tum', pre: 'iPhone-6,3', viewport: { width: 874, height: 402 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  ipad13: { mapp: 'iPad 13 tum', pre: 'iPad-13', viewport: { width: 1376, height: 1032 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const val = process.argv[2] ? [process.argv[2]] : Object.keys(ENHETER);

const browser = await chromium.launch();
for (const id of val) {
  const E = ENHETER[id]; if (!E) throw new Error(`okänd enhet ${id}`);
  const OUT = path.join(APP, 'store', 'ladda-upp', E.mapp);
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const ctx = await browser.newContext({ viewport: E.viewport, deviceScaleFactor: E.deviceScaleFactor, isMobile: E.isMobile, hasTouch: E.hasTouch });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true }; });   // appens läge
  page.on('pageerror', (e) => console.log('sidfel:', e.message));
  const st = () => page.evaluate(() => window.__ps.state());
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = async (n, namn) => { await wait(350); await page.screenshot({ path: path.join(OUT, `${E.pre}-${String(n).padStart(2, '0')}-${namn}.png`) });   // enheten först: de två mapparna får inte förväxlas console.log(id, n, namn); };
  const typeAns = async (s) => { for (const c of s) await page.evaluate((k) => window.__ps.type(k), c); };
  // en uppgift av rätt sort på nivån (t.ex. guldmynten i Gånger): be om nya tills den passar
  const pickQ = async (tab, lvl, ok) => { for (let i = 0; i < 40; i++) { await page.evaluate(([t, l]) => window.__ps.lvl(t, l), [tab, lvl]); if (await page.evaluate(ok)) return; } };

  await page.goto(`http://localhost:${PORT}/index.html`); await wait(1500);
  await page.click('#modal [data-grade="3"]'); await wait(400);
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await wait(500);
  await page.click('#modal .dlg-foot .btn-go'); await wait(900);
  await page.evaluate(() => window.__ps.give(1150));
  await page.click('#sk-below [data-b="sit"]'); await wait(4800);

  // 1 Gånger: guldmynten, svaret skrivet på tavlan
  await pickQ('ganger', 5, () => { const q = window.__ps.q(); return !!q.visual?.groups && q.visual.groups >= 3 && q.visual.groups <= 6; });
  await typeAns(String(await page.evaluate(() => window.__ps.q().ans)));
  await shot(1, 'ganger');
  // 3 Uppställning (skrivs från entalen)
  await pickQ('matte', 7, () => true);
  await typeAns([...String(await page.evaluate(() => window.__ps.q().ans))].reverse().join(''));
  await shot(3, 'uppstallning');
  // 4 Klockan: skriv tiden med siffror
  await pickQ('klocka', 2, () => window.__ps.q().ans.split(':')[1] % 5 === 0);
  await typeAns(await page.evaluate(() => window.__ps.q().ans));
  await shot(4, 'klockan');
  // 7 Svenska: skriv motsatsen med bokstäverna
  await pickQ('svenska', 3, () => window.__ps.q().ans.length <= 6);
  await typeAns((await page.evaluate(() => window.__ps.q().ans)).toUpperCase());
  await shot(7, 'svenska');
  // 6 Rasten: fem rätt på matte nivå 1 → tre stjärnor
  await page.evaluate(() => window.__ps.lvl('matte', 1));
  for (let i = 0; i < 5; i++) {
    const want = (await st()).want; await typeAns(want); await page.evaluate(() => window.__ps.type('ok')); await wait(2000);
  }
  await wait(800);
  await shot(6, 'rast');
  await page.click('#modal .dlg-foot .btn-go'); await wait(600);   // Gå till gallerian
  // gallerian: 2 högst upp med utsikten över älven, 5 entrén med fontänen och glasståndet
  await page.evaluate(() => window.__ps.goScene('galleria', 'klass'));
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__ps.lib())); i++) await wait(250);
  await page.evaluate(() => { window.__ps.floor(2); window.__ps.cam(232); }); await wait(3500);
  await shot(2, 'galleria-utsikt');
  await page.evaluate(() => { window.__ps.floor(0); window.__ps.cam(300); }); await wait(3500);
  await shot(5, 'galleria-entre');
  // 8 Klädaffären (spelets egen butik)
  await page.evaluate(() => { window.__ps.floor(1); window.__ps.cam(null); window.__ps.enterShop('klader'); }); await wait(2500);
  await shot(8, 'kladaffaren');
  await ctx.close();
}
await browser.close();
