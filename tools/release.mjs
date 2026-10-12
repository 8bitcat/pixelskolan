// Släpp en ny version av Pixelskolan – webben OCH appen (som Pixelcitys tools/release.mjs + app/paket.mjs):
//   node tools/release.mjs 1.1.1 "Kort rubrik på svenska"
// 1. skriver version.js och version.json (appen jämför sin version med version.json på webben)
// 2. committar dem, taggar v<version> och pushar (GitHub Pages publicerar webben)
// 3. kör app/paket.mjs: bygger och packar spelet och lägger paketet på GitHub-releasen – appen hämtar det själv
// Allt annat (koden, testerna) ska redan vara committat och pushat. Versionen måste vara nyare än den förra.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [V, ...rest] = process.argv.slice(2), TITLE = rest.join(' ').trim();
if (!/^\d+\.\d+\.\d+$/.test(V || '') || !TITLE) { console.error('Så här: node tools/release.mjs 1.1.1 "Kort rubrik"'); process.exit(1); }
const nyare = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
const forra = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8')).version;
if (!nyare(V, forra)) { console.error(`${V} är inte nyare än ${forra}`); process.exit(1); }
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
if (git('status', '--porcelain', '--untracked-files=no')) { console.error('Committa allt annat först (git status är inte tom).'); process.exit(1); }

const datum = new Date().toISOString().slice(0, 10), txt = TITLE.replace(/'/g, '’');
fs.writeFileSync(path.join(ROOT, 'version.js'), `// Pixelskolans version (tools/release.mjs skriver den här filen och version.json; appen jämför med version.json på webben)\nexport const VERSION = '${V}';\nexport const TITLE = '${txt}';\n`);
fs.writeFileSync(path.join(ROOT, 'version.json'), JSON.stringify({ version: V, date: datum, title: TITLE }, null, 2) + '\n');
git('add', 'version.js', 'version.json');
git('commit', '-q', '-m', `chore(release): v${V} – ${TITLE}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`);
git('tag', '-a', `v${V}`, '-m', `v${V} – ${TITLE}`);
git('push', '-q', 'origin', 'HEAD');
git('push', '-q', 'origin', `v${V}`);
console.log(`v${V} pushad – nu paketet till appen`);
execFileSync(process.execPath, [path.join(ROOT, 'app', 'paket.mjs')], { cwd: ROOT, stdio: 'inherit' });
