// node tools/las-klocka-prov.cjs [BASE=http://127.0.0.1:8824/] [desktop|iphone|ipad] – kräver en lokal server för repot (bilderna hamnar i arbetsmappen)
// prov: läsförståelse med texter (bok + fem frågor) och de nya klockövningarna (Ställ klockan, två klockor, tidtabellen …)
const { createRequire } = require('module');
const req = createRequire('D:/Qisy/QISYFrontend/QISYFrontend-1/package.json');
const { chromium } = req('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8824/';
const DEV = process.argv[3] || 'desktop';
const VP = { desktop: { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 }, iphone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[DEV];
const OUT = 'lp-' + DEV + '-';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(VP);
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const log = (...a) => console.log(JSON.stringify(a));
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(1200);
  await page.click('#modal [data-grade="2"]'); await page.waitForTimeout(300);
  await page.fill('#av-name', 'Mira'); await page.click('#modal .av-save'); await page.waitForTimeout(400); await page.click('#modal .dlg-foot .btn-go'); await page.waitForTimeout(500);
  await page.click('#sk-below [data-b="sit"]'); await page.waitForTimeout(4800);
  const st = () => page.evaluate(() => window.__ps.state());
  const T = (k) => page.evaluate((x) => window.__ps.type(x), k);
  const closeModal = () => page.evaluate(() => document.querySelector('#modal .dlg-foot .btn-go')?.click());
  const answerRight = async () => { const s = await st(); if (s.input) { for (const ch of s.want) await T(ch); await T('ok'); } else await page.click(`#skolpanel [data-ans="${s.ans}"]`); await page.waitForTimeout(1950); };
  const L = await page.evaluate(() => window.__ps.levels()); log('nivåer åk 2', L);
  // 1 läsförståelse: en berättelse (sista nivåerna i svenska)
  await page.evaluate((n) => window.__ps.lvl('svenska', n - 2), L.svenska); await page.waitForTimeout(800);
  log('boken', await page.evaluate(() => document.querySelector('#modal .dlg-head h2')?.textContent), await page.evaluate(() => window.__ps.read()));
  await page.screenshot({ path: OUT + 'bok.png' });
  await closeModal(); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'fraga1.png' });
  // fel svar först: ledtråden pekar på stycket, 📖 Texten markerar det
  let s = await st();
  if (!s.input) { const wrong = [0, 1, 2].find((i) => i !== s.ans); await page.click(`#skolpanel [data-ans="${wrong}"]`); } else { await T('9'); await T('9'); await T('ok'); }
  await page.waitForTimeout(300); log('ledtråd', await page.evaluate(() => document.querySelector('#skolpanel .sp-fb')?.textContent));
  await page.click('#skolpanel [data-sp="text"]'); await page.waitForTimeout(400);
  log('markerat stycke', await page.evaluate(() => document.querySelector('#modal .rd-p.hl .rd-n')?.textContent));
  await page.screenshot({ path: OUT + 'bok-markerad.png' });
  await closeModal(); await page.waitForTimeout(200);
  if (!s.input) await page.click(`#skolpanel [data-ans="${s.ans}"]`); else { await T('del'); await T('del'); for (const ch of s.want) await T(ch); await T('ok'); }
  await page.waitForTimeout(1950);
  for (let i = 0; i < 4; i++) { log('fråga', (await page.evaluate(() => window.__ps.q().board.lines[0]))); await answerRight(); }
  await page.waitForTimeout(800);
  log('rast', await page.evaluate(() => document.querySelector('#modal .dlg-body')?.textContent.replace(/\s+/g, ' ').slice(0, 120)));
  await page.evaluate(() => document.querySelector('#modal .dlg-foot .btn')?.click()); await page.waitForTimeout(900);
  log('ny text nästa lektion', await page.evaluate(() => window.__ps.read()));
  await closeModal(); await page.waitForTimeout(200);
  // 2 Ställ klockan: kvart (åk 2 nivå 6)
  await page.evaluate(() => window.__ps.lvl('klocka', 6)); await page.waitForTimeout(400);
  let q = await page.evaluate(() => window.__ps.q()); log('ställ', q.question, q.set, await page.evaluate(() => window.__ps.clk()));
  const target = q.set[0] * 60 + q.set[1];
  await page.screenshot({ path: OUT + 'stall-start.png' });
  await T('mr'); await T('mr'); await T('hr'); await T('ok'); await page.waitForTimeout(300);
  log('fel tid', await page.evaluate(() => window.__ps.clk()), (await st()).lesson, await page.evaluate(() => document.querySelector('#skolpanel .sp-fb')?.textContent.slice(0, 60)));
  await page.screenshot({ path: OUT + 'stall-fel.png' });
  // ställ rätt med tryck på urtavlan: den långa visaren (ytterkanten) och den korta (mitten)
  const box = await (await page.$('#room')).boundingBox();
  const geo = await page.evaluate(() => window.__ps.g ? null : null);
  await page.evaluate((t) => { const want = t; let c = window.__ps.clk(); let n = 0; while (c !== want && n < 200) { window.__ps.type(c % 60 !== want % 60 ? 'mr' : 'hr'); c = window.__ps.clk(); n++; } }, target);
  log('ställt', await page.evaluate(() => window.__ps.clk()), target);
  await page.screenshot({ path: OUT + 'stall-ratt.png' });
  await T('ok'); await page.waitForTimeout(400); log('rätt?', (await st()).lesson, await page.evaluate(() => document.querySelector('#skolpanel .sp-fb')?.textContent.slice(0, 50)));
  await page.waitForTimeout(1700);
  // tryck på urtavlan
  q = await page.evaluate(() => window.__ps.q());
  const tap = async (ang, frac) => { const C = await page.evaluate(() => window.__ps.clkGeo && window.__ps.clkGeo()); return C; };
  // 3 klockan med ord + om en stund
  for (const n of [7, 8]) { await page.evaluate((x) => window.__ps.lvl('klocka', x), n); await page.waitForTimeout(400); await page.screenshot({ path: OUT + 'klocka' + n + '.png' }); await answerRight(); }
  // 4 årskurs 3: två klockor, timmar och minuter, tidtabellen, ställ klockan digitalt
  await page.evaluate(() => window.__ps.grade(3)); await page.waitForTimeout(300);
  const L3 = await page.evaluate(() => window.__ps.levels()); log('nivåer åk 3', L3);
  for (const n of [7, 8, 9, 10, 11]) { await page.evaluate((x) => window.__ps.lvl('klocka', x), n); await page.waitForTimeout(500); log('åk3', n, await page.evaluate(() => { const q = window.__ps.q(); return [q.topic, q.question || q.board?.lines?.join(' ')]; })); await page.screenshot({ path: OUT + 'k3-' + n + '.png' }); if (n !== 7) await answerRight(); }
  // läsförståelse åk 3: faktatext
  await page.evaluate((n) => window.__ps.lvl('svenska', n - 1), L3.svenska); await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + 'bok3.png' });
  await closeModal(); await page.waitForTimeout(300); await page.screenshot({ path: OUT + 'fraga3.png' });
  console.log('fel:', errs.length ? errs : 'inga');
  await browser.close();
})();
