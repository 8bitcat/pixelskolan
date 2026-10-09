// Bygger app/www/ – Pixelskolan som den ligger i iOS-appen (Capacitor), samma spel som på webben:
//   index.html, skolans egna filer (*.js, *.css i roten), sf/ (Snabbfilens filer, musiken också) och assets/.
// Allt ligger i appen, så den fungerar utan nät. plan.html, README och sidorna för integritet/support
// följer inte med (planlänken visas inte i appen, se IN_APP i skola.js).
//   node build.mjs            (körs av "npm run build" / "npm run sync" och i codemagic.yaml)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(APP, '..');
const WWW = path.join(APP, 'www');

const top = fs.readdirSync(ROOT).filter((f) => f === 'index.html' || /\.(js|css)$/.test(f));
const dirs = ['sf', 'assets'];
for (const need of ['index.html', 'skola.js', 'skola.css', 'iso.js', 'uppgifter.js', 'uppgifter3.js']) if (!top.includes(need)) throw new Error(`saknas i spelet: ${need}`);

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });
let n = 0, bytes = 0;
const copy = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); n++; bytes += fs.statSync(src).size; };
for (const f of top) copy(path.join(ROOT, f), path.join(WWW, f));
const walk = (rel) => {
  for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) walk(r); else copy(path.join(ROOT, r), path.join(WWW, r));
  }
};
for (const d of dirs) walk(d);

// appen får inte hämta något från nätet: inga externa adresser i det som laddas
const ext = /(src|href)=["']https?:\/\//;
for (const f of top) if (ext.test(fs.readFileSync(path.join(WWW, f), 'utf8'))) throw new Error(`${f} laddar något från nätet`);

console.log(`app/www: ${n} filer, ${(bytes / 1048576).toFixed(1)} MB`);
