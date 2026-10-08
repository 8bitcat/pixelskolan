// Pixelskolans uppgifter för ÅRSKURS 3 (Carl 2026-10-08: "det ska vara 3:ans läroplan … välja årskurs 2
// eller 3 i början"). Efter Lgr22: centralt innehåll för åk 1–3 och kunskapskraven i slutet av åk 3 –
// talen till 1000, uppställning med växling, likhetstecknet, tabellerna 1–10, division, bråk som del av
// antal, pengar, mätning med enheter, tid, avrundning och överslag, problemlösning, chans och slump;
// svenska med stavning, ordklasser, böjningar och läsförståelse; engelska; NO och SO.
// Samma format som uppgifter.js. Svar med tal skrivs med siffror på tavlan (input 'num'), klockslag med
// 'time' och vissa ord med 'word'.
import { rnd, pick, shuffle, textOpts, quiz, cap, pad, ctx, phrase, klocka, former, diagram, dubbel, sjtj, slut, storBokstav, ordklass, sammansatt, las, engelska, diktamen, EN, TRAFIK, ARSTID, MATRATT } from './uppgifter.js';

const N = (q) => ({ input: 'num', ...q });
const names = () => { const c = ctx(); return shuffle(c.kids.map((k) => String(k).trim().split(/\s+/)[0].toUpperCase()).filter(Boolean)); };
const nm = (s) => cap(s.toLowerCase());

// ======================= MATTE =======================
function tal1000() {
  const r = rnd(0, 2);
  if (r === 0) {
    const h = rnd(1, 9), t = rnd(0, 9), e = rnd(0, 9), n = 100 * h + 10 * t + e;
    return N({ topic: 'TALEN TILL 1000', board: { lines: [`${h} HUNDRATAL, ${t} TIOTAL OCH ${e} ENTAL`], big: '= ?' }, say: `${h} hundratal, ${t} tiotal och ${e} ental`, ans: n, hint: `${h} hundratal är ${100 * h}, ${t} tiotal är ${10 * t}. Lägg ihop.`, done: `${100 * h} + ${10 * t} + ${e} = ${n}.` });
  }
  if (r === 1) {
    let n, d, place;
    for (;;) { n = rnd(102, 987); const ds = String(n), i = rnd(0, 2); d = +ds[i]; place = [100, 10, 1][i]; if (d && ds.split('').filter((c) => +c === d).length === 1) break; }
    const nameP = place === 100 ? 'HUNDRATAL' : place === 10 ? 'TIOTAL' : 'ENTAL';
    return N({ topic: 'SIFFRANS VÄRDE', board: { big: String(n), lines: [`VILKET VÄRDE HAR SIFFRAN ${d}?`], after: `${d} ${nameP} = ${d * place}` }, say: `Vilket värde har siffran ${d} i ${n}?`, ans: d * place, hint: 'Längst till höger står entalen, sedan tiotalen och längst till vänster hundratalen.', done: `Siffran ${d} betyder ${d * place} i ${n}.` });
  }
  const h = rnd(1, 9), t = rnd(1, 9), e = rnd(1, 9), n = 100 * h + 10 * t + e, miss = rnd(0, 2), parts = [100 * h, 10 * t, e];
  const expr = parts.map((p, i) => (i === miss ? '?' : String(p))).join(' + ');
  return N({ topic: 'DELA UPP TALET', prompt: `${n} = ${expr}`, say: `${n} är lika med ${expr.replace('?', 'hur mycket')}`, ans: parts[miss], hint: `${n} är ${h} hundratal, ${t} tiotal och ${e} ental.`, done: `${n} = ${parts.join(' + ')}.` });
}
function talraden() {
  const r = rnd(0, 3);
  if (r === 0) { const n = pick([99, 199, 299, 399, 499, 599, 699, 799, 899, 209, 509, rnd(100, 998)]); return N({ topic: 'TALRADEN', board: { big: String(n), lines: ['VILKET TAL KOMMER EFTER?'], after: `${n}, ${n + 1}` }, say: `Vilket tal kommer efter ${n}?`, ans: n + 1, hint: 'Lägg till ett. Blir det tio ental byts de mot ett tiotal till.', done: `Efter ${n} kommer ${n + 1}.` }); }
  if (r === 1) { const n = pick([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 310, 610, rnd(101, 999)]); return N({ topic: 'TALRADEN', board: { big: String(n), lines: ['VILKET TAL KOMMER FÖRE?'], after: `${n - 1}, ${n}` }, say: `Vilket tal kommer före ${n}?`, ans: n - 1, hint: 'Ta bort ett. Finns inga ental får du växla ett tiotal till tio ental.', done: `Före ${n} kommer ${n - 1}.` }); }
  if (r === 2) {
    const step = pick([10, 100]), a = step === 10 ? 10 * rnd(2, 95) : 100 * rnd(1, 8), b = a + 2 * step * (step === 10 ? rnd(1, 3) : 1);
    return N({ topic: 'MITT EMELLAN', board: { lines: [`VILKET TAL LIGGER MITT EMELLAN`, `${a} OCH ${b}?`] }, say: `Vilket tal ligger mitt emellan ${a} och ${b}?`, ans: (a + b) / 2, hint: `Hur långt är det från ${a} till ${b}? Gå halva vägen.`, done: `${(a + b) / 2} ligger mitt emellan ${a} och ${b}.` });
  }
  const more = Math.random() < 0.5, d = pick([10, 100]), n = more ? rnd(100, 899) : rnd(110, 999), ans = more ? n + d : n - d;
  return N({ topic: 'TIO OCH HUNDRA MER OCH MINDRE', board: { lines: [`VILKET TAL ÄR ${d} ${more ? 'MER' : 'MINDRE'} ÄN ${n}?`] }, say: `Vilket tal är ${d} ${more ? 'mer' : 'mindre'} än ${n}?`, ans, hint: d === 10 ? `Tiotalssiffran ändras med ett. Entalen står still.` : `Hundratalssiffran ändras med ett. Tiotalen och entalen står still.`, done: `${n} ${more ? '+' : '−'} ${d} = ${ans}.` });
}
function monster() {
  const step = pick([2, 3, 4, 5, 10, 25, 50, 100]), down = Math.random() < 0.35, len = 5;
  const start = down ? step * rnd(len, len + 6) : step * rnd(0, 6) + (step <= 5 ? rnd(0, step - 1) : 0);
  const seq = Array.from({ length: len }, (_, i) => start + (down ? -1 : 1) * step * i);
  return N({ topic: 'TALFÖLJDER', prompt: `${seq.slice(0, len - 1).join(', ')}, ?`, say: `Vilket tal kommer sedan: ${seq.slice(0, len - 1).join(', ')}?`, ans: seq[len - 1], hint: `Hur mycket ${down ? 'minskar' : 'ökar'} talen varje gång? Jämför de två första.`, done: `Talen ${down ? 'minskar' : 'ökar'} med ${step} varje gång.` });
}
function plus100() {
  let a, b; do { a = rnd(15, 76); b = rnd(12, 98 - a); } while ((a % 10) + (b % 10) < 10 && Math.random() < 0.8);
  const bt = b - (b % 10);
  return N({ topic: 'HUVUDRÄKNING: PLUS', prompt: `${a} + ${b} = ?`, say: `${a} plus ${b}`, ans: a + b, hint: `Ta tiotalen först: ${a} + ${bt} = ${a + bt}. Sedan ${b % 10} till.`, done: `${a} + ${bt} = ${a + bt}, och ${a + bt} + ${b % 10} = ${a + b}.` });
}
function minus100() {
  let a, b; do { a = rnd(31, 99); b = rnd(12, a - 6); } while ((a % 10) >= (b % 10) && Math.random() < 0.8);
  const bt = b - (b % 10);
  return N({ topic: 'HUVUDRÄKNING: MINUS', prompt: `${a} − ${b} = ?`, say: `${a} minus ${b}`, ans: a - b, hint: `Ta tiotalen först: ${a} − ${bt} = ${a - bt}. Sedan ${b % 10} till.`, done: `${a} − ${bt} = ${a - bt}, och ${a - bt} − ${b % 10} = ${a - b}.` });
}
function hela() {
  const r = rnd(0, 4); let a, b, op;
  if (r === 0) { a = 100 * rnd(1, 8); b = 100 * rnd(1, 9 - a / 100); op = '+'; }
  else if (r === 1) { a = 100 * rnd(3, 9); b = 100 * rnd(1, a / 100 - 1); op = '−'; }
  else if (r === 2) { a = 10 * rnd(3, 9); b = 10 * rnd(11 - a / 10, 9); op = '+'; }
  else if (r === 3) { a = 10 * rnd(11, 17); b = 10 * rnd(a / 10 - 9, 9); op = '−'; }
  else { a = 100 * rnd(1, 6) + 10 * rnd(1, 9); b = 100 * rnd(1, 3); op = Math.random() < 0.5 ? '+' : '−'; if (op === '−' && b >= a) op = '+'; }
  const ans = op === '+' ? a + b : a - b;
  return N({ topic: 'HELA TIOTAL OCH HUNDRATAL', prompt: `${a} ${op} ${b} = ?`, say: `${a} ${op === '+' ? 'plus' : 'minus'} ${b}`, ans, hint: a % 100 === 0 && b % 100 === 0 ? `Räkna hundratal: ${a / 100} ${op} ${b / 100} hundratal.` : `Räkna med tiotal: ${a / 10} ${op} ${b / 10} tiotal.`, done: `${a} ${op} ${b} = ${ans}.` });
}
// uppställning: talen under varandra, svaret skrivs från entalen (höger) och åt vänster
function uppAdd() {
  let a, b; do { a = rnd(105, 789); b = rnd(105, 889); } while (a + b > 999 || ((a % 10) + (b % 10) < 10 && (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 10));
  return N({ topic: 'UPPSTÄLLNING: ADDITION', visual: { column: [a, b, '+'] }, rtl: true, say: `${a} plus ${b}. Räkna med uppställning.`, ans: a + b, hint: 'Börja med entalen längst till höger. Blir det tio eller mer skriver du entalssiffran och lägger en minnessiffra på tiotalen.', done: `${a} + ${b} = ${a + b}.` });
}
function uppSub() {
  let a, b; do { a = rnd(300, 999); b = rnd(101, a - 40); } while (!((a % 10) < (b % 10) || (Math.floor(a / 10) % 10) < (Math.floor(b / 10) % 10)));
  return N({ topic: 'UPPSTÄLLNING: SUBTRAKTION', visual: { column: [a, b, '−'] }, rtl: true, say: `${a} minus ${b}. Räkna med uppställning.`, ans: a - b, hint: 'Börja med entalen. Räcker det inte växlar du: ta ett tiotal från grannen och gör det till tio ental.', done: `${a} − ${b} = ${a - b}.` });
}
function likhet() {
  const r = rnd(0, 4);
  if (r === 0) { const a = rnd(5, 45), x = rnd(3, 35); return N({ topic: 'LIKHETSTECKNET', prompt: `${a} + ? = ${a + x}`, say: `${a} plus hur mycket blir ${a + x}?`, ans: x, hint: `Räkna från ${a} upp till ${a + x}.`, done: `${a} + ${x} = ${a + x}.` }); }
  if (r === 1) { const x = rnd(15, 70), b = rnd(3, 14); return N({ topic: 'LIKHETSTECKNET', prompt: `? − ${b} = ${x - b}`, say: `Vilket tal minus ${b} blir ${x - b}?`, ans: x, hint: `Tänk baklänges: ${x - b} + ${b}.`, done: `${x} − ${b} = ${x - b}.` }); }
  if (r === 2) { const a = rnd(4, 30), x = rnd(4, 30); return N({ topic: 'LIKHETSTECKNET', prompt: `${a + x} = ${a} + ?`, say: `${a + x} är lika med ${a} plus hur mycket?`, ans: x, hint: 'Likhetstecknet betyder att det är lika mycket på båda sidor.', done: `${a + x} = ${a} + ${x}.` }); }
  if (r === 3) { const t = rnd(2, 10), k = rnd(2, 10); return N({ topic: 'LIKHETSTECKNET', prompt: `${t} · ? = ${t * k}`, say: `${t} gånger hur mycket blir ${t * k}?`, ans: k, hint: `Räkna ${t}-skutt tills du kommer till ${t * k}.`, done: `${t} · ${k} = ${t * k}.` }); }
  const a = rnd(5, 12), b = rnd(5, 12), c = pick([10, 5, a + b - 3].filter((v) => v < a + b));
  return N({ topic: 'LIKHETSTECKNET', prompt: `${a} + ${b} = ? + ${c}`, say: `${a} plus ${b} är lika med hur mycket plus ${c}?`, ans: a + b - c, hint: `Räkna ut vänstra sidan först: ${a} + ${b} = ${a + b}. Vad plus ${c} blir lika mycket?`, done: `${a} + ${b} = ${a + b} = ${a + b - c} + ${c}.` });
}
function tab10() {
  const t = rnd(2, 10), k = rnd(0, 10);
  if (Math.random() < 0.3 && k > 0) return N({ topic: 'TABELLERNA 1–10', prompt: `? · ${t} = ${k * t}`, say: `Vad gånger ${t} blir ${k * t}?`, ans: k, hint: `Räkna ${t}-skutt tills du kommer till ${k * t}.`, done: `${k} · ${t} = ${k * t}.` });
  const tip = k === 0 ? 'Noll gånger något blir alltid noll.' : t === 4 && k > 1 ? `Fyra är dubbelt två: ${k} · 2 = ${2 * k}, och dubbelt så mycket är ${4 * k}.` : t === 9 ? `Tänk ${k} · 10 = ${10 * k} och ta bort ${k}.` : t === 5 ? `Tänk ${k} · 10 = ${10 * k} och ta hälften.` : `Räkna ${t}-skutt ${k} gånger, eller byt plats: ${t} · ${k}.`;
  return N({ topic: 'TABELLERNA 1–10', prompt: `${k} · ${t} = ?`, say: `${k} gånger ${t}`, ans: k * t, hint: tip, done: `${k} · ${t} = ${k * t}.` });
}
const DELSAK = [['kulor', 'barn'], ['kakor', 'kompisar'], ['pennor', 'grupper'], ['äpplen', 'korgar'], ['klistermärken', 'kompisar'], ['jordgubbar', 'tallrikar']];
function division() {
  const d = rnd(2, 10), q = rnd(2, 10), n = d * q, r = rnd(0, 2);
  if (r === 0) return N({ topic: 'DIVISION', prompt: `${n} / ${d} = ?`, say: `${n} delat med ${d}`, ans: q, hint: `Vilket tal gånger ${d} blir ${n}?`, done: `${n} / ${d} = ${q}, för ${q} · ${d} = ${n}.` });
  if (r === 1) { const [sak, vem] = pick(DELSAK); return N({ topic: 'DELA LIKA', board: { lines: [`${n} ${sak.toUpperCase()} DELAS LIKA MELLAN ${d} ${vem.toUpperCase()}.`, 'HUR MÅNGA FÅR VAR OCH EN?'], after: `${n} / ${d} = ${q}` }, say: `${n} ${sak} delas lika mellan ${d} ${vem}. Hur många får var och en?`, ans: q, hint: `Vilket tal gånger ${d} blir ${n}?`, done: `${n} / ${d} = ${q}.` }); }
  return N({ topic: 'HUR MÅNGA GRUPPER?', board: { lines: [`${n} ÄGG LÄGGS I KARTONGER`, `MED ${d} ÄGG I VARJE.`, 'HUR MÅNGA KARTONGER BLIR DET?'], after: `${n} / ${d} = ${q}` }, say: `${n} ägg läggs i kartonger med ${d} i varje. Hur många kartonger blir det?`, ans: q, hint: `Räkna ${d}-skutt tills du kommer till ${n}. Hur många skutt blev det?`, done: `${q} kartonger med ${d} i varje är ${n} ägg.` });
}
function dubbelt3() {
  if (Math.random() < 0.5) { const n = pick([rnd(11, 49), 5 * rnd(10, 40)]); return N({ topic: 'DUBBELT', board: { big: `DUBBELT AV ${n} = ?` }, say: `Dubbelt av ${n}`, ans: 2 * n, hint: `Ta dubbelt av tiotalen och entalen var för sig: ${n - (n % 10)} och ${n % 10}.`, done: `Dubbelt av ${n} är ${2 * n}.` }); }
  const n = pick([2 * rnd(11, 49), 10 * rnd(11, 40), 100 * rnd(1, 9) * 2]); return N({ topic: 'HÄLFTEN', board: { big: `HÄLFTEN AV ${n} = ?` }, say: `Hälften av ${n}`, ans: n / 2, hint: `Vilket tal plus samma tal blir ${n}? Dela gärna upp: hälften av tiotalen och hälften av entalen.`, done: `Hälften av ${n} är ${n / 2}, för ${n / 2} + ${n / 2} = ${n}.` });
}
const FRN = { 2: 'halv', 3: 'tredjedel', 4: 'fjärdedel', 5: 'femtedel' };
function brakAntal() {
  const n = pick([2, 3, 4, 5]), k = n > 2 && Math.random() < 0.3 ? rnd(2, n - 1) : 1, part = rnd(2, 8), tot = n * part, ans = part * k;
  return N({ topic: 'BRÅK: DEL AV ANTAL', board: { big: `${k}/${n} AV ${tot} = ?`, lines: [`DELA ${tot} I ${n} LIKA DELAR.`] }, visual: { pie: [n, k] }, say: `${k === 1 ? (n === 2 ? 'Hälften' : `En ${FRN[n]}`) : `${k} ${FRN[n]}ar`} av ${tot}`, ans, hint: `Dela ${tot} i ${n} lika delar: ${tot} / ${n} = ${part}.${k > 1 ? ` Ta sedan ${k} sådana delar.` : ''}`, done: `${tot} / ${n} = ${part}${k > 1 ? `, och ${k} delar är ${ans}` : ''}.` });
}
const VAROR = [['en bok', 79], ['en boll', 49], ['ett spel', 129], ['en tröja', 149], ['en nalle', 95], ['ett pussel', 65], ['en mössa', 59], ['en penna', 12], ['en glass', 25], ['ett suddgummi', 8], ['en ryggsäck', 249], ['ett par strumpor', 35], ['en serietidning', 45], ['ett hopprep', 39]];
function pengar3() {
  const r = rnd(0, 3);
  if (r === 0) { const [[a, pa], [b, pb]] = shuffle(VAROR.slice()).slice(0, 2); return N({ topic: 'PENGAR: TILLSAMMANS', board: { lines: [`${a.toUpperCase()} KOSTAR ${pa} KR OCH ${b.toUpperCase()} KOSTAR ${pb} KR.`, 'HUR MYCKET KOSTAR DE TILLSAMMANS?'], after: `${pa} + ${pb} = ${pa + pb} KR` }, say: `${a} kostar ${pa} kronor och ${b} kostar ${pb} kronor. Hur mycket kostar de tillsammans?`, ans: pa + pb, hint: 'Lägg ihop priserna. Ta tiotalen först och sedan entalen.', done: `${pa} + ${pb} = ${pa + pb} kr.` }); }
  if (r === 1) { const [a, pa] = pick(VAROR), pay = pa < 100 ? 100 : pa < 200 ? 200 : 500; return N({ topic: 'PENGAR: VÄXEL', board: { lines: [`${a.toUpperCase()} KOSTAR ${pa} KR.`, `DU BETALAR MED ${pay} KR.`, 'HUR MYCKET FÅR DU TILLBAKA?'], after: `${pay} − ${pa} = ${pay - pa} KR` }, say: `${a} kostar ${pa} kronor. Du betalar med ${pay} kronor. Hur mycket får du tillbaka?`, ans: pay - pa, hint: `Räkna uppåt från ${pa} till ${pay}: först till närmaste tiotal, sedan resten.`, done: `${pay} − ${pa} = ${pay - pa} kr tillbaka.` }); }
  if (r === 2) { const v = pick([20, 50, 100]), k = rnd(2, 9); return N({ topic: 'PENGAR: SEDLAR', board: { lines: [`DU HAR ${k} SEDLAR PÅ ${v} KR.`, 'HUR MYCKET PENGAR HAR DU?'], after: `${k} · ${v} = ${k * v} KR` }, say: `Du har ${k} sedlar på ${v} kronor. Hur mycket har du?`, ans: k * v, hint: `Räkna ${v}-skutt ${k} gånger.`, done: `${k} · ${v} = ${k * v} kr.` }); }
  const [[a, pa], [b, pb]] = shuffle(VAROR.filter((x) => x[1] < 100)).slice(0, 2), have = 200;
  return N({ topic: 'PENGAR: KVAR', board: { lines: [`DU HAR ${have} KR OCH KÖPER ${a.toUpperCase()} FÖR ${pa} KR`, `OCH ${b.toUpperCase()} FÖR ${pb} KR.`, 'HUR MYCKET HAR DU KVAR?'], after: `${have} − ${pa} − ${pb} = ${have - pa - pb} KR` }, say: `Du har ${have} kronor och köper ${a} för ${pa} och ${b} för ${pb} kronor. Hur mycket har du kvar?`, ans: have - pa - pb, hint: `Lägg ihop det du köper: ${pa} + ${pb}. Ta sedan bort det från ${have}.`, done: `${pa} + ${pb} = ${pa + pb}, och ${have} − ${pa + pb} = ${have - pa - pb} kr.` });
}
function enheter() {
  const r = rnd(0, 7), k = rnd(2, 9);
  const U = [
    [`${k} M = ? CM`, `${k} meter är hur många centimeter?`, 100 * k, '1 meter = 100 centimeter.'],
    [`${k * 100} CM = ? M`, `${k * 100} centimeter är hur många meter?`, k, '100 centimeter = 1 meter.'],
    [`${k} DM = ? CM`, `${k} decimeter är hur många centimeter?`, 10 * k, '1 decimeter = 10 centimeter.'],
    [`${k} L = ? DL`, `${k} liter är hur många deciliter?`, 10 * k, '1 liter = 10 deciliter.'],
    [`${Math.min(k, 5)} KG = ? G`, `${Math.min(k, 5)} kilo är hur många gram?`, 1000 * Math.min(k, 5), '1 kilogram = 1000 gram.'],
    [`${k * 10} MM = ? CM`, `${k * 10} millimeter är hur många centimeter?`, k, '10 millimeter = 1 centimeter.'],
    ...[['M', 'CM', 50, 'meter', 'centimeter', '1 meter = 100 centimeter. Hälften är 50.'], ['L', 'DL', 5, 'liter', 'deciliter', '1 liter = 10 deciliter. Hälften är 5.'], ['KG', 'G', 500, 'kilo', 'gram', '1 kilo = 1000 gram. Hälften är 500.']].filter((_, i) => i === k % 3).map(([a, b, v, sa, sb, h]) => [`1/2 ${a} = ? ${b}`, `En halv ${sa} är hur många ${sb}?`, v, h]),
  ];
  if (r < 7) { const [pr, say, ans, hint] = U[r % U.length]; return N({ topic: 'MÄTA: ENHETER', prompt: pr, say, ans, hint, done: `${pr.replace('?', String(ans))}.` }); }
  const a = rnd(8, 25), b = a + rnd(4, 20), [s1, s2] = pick([['EN PENNA', 'EN LINJAL'], ['EN SKO', 'EN ARM'], ['EN BLYERTSPENNA', 'EN BOK']]);
  return N({ topic: 'MÄTA: JÄMFÖRA', board: { lines: [`${s1} ÄR ${a} CM LÅNG. ${s2} ÄR ${b} CM LÅNG.`, `HUR MYCKET LÄNGRE ÄR ${s2.replace(/^EN /, '')}EN?`], after: `${b} − ${a} = ${b - a} CM` }, say: `${s1.toLowerCase()} är ${a} centimeter. ${s2.toLowerCase()} är ${b} centimeter. Hur mycket längre?`, ans: b - a, hint: `Räkna skillnaden: från ${a} upp till ${b}.`, done: `${b} − ${a} = ${b - a} cm.` });
}
function diagram3() {
  if (Math.random() < 0.6) return diagram();
  const foods = shuffle(MATRATT.slice()).slice(0, 4), vals = shuffle([2, 3, 4, 5, 6, 7, 8]).slice(0, 4), sum = vals.reduce((a, b) => a + b, 0);
  return N({ topic: 'STAPELDIAGRAM', board: { lines: ['SKOLMATEN: HUR MÅNGA', 'RÖSTADE SAMMANLAGT?'], after: `${vals.join(' + ')} = ${sum}` }, visual: { chart: foods.map((f, i) => [f, vals[i]]) }, say: 'Hur många röstade sammanlagt?', ans: sum, hint: 'Läs av varje stapel och lägg ihop alla.', done: `${vals.join(' + ')} = ${sum}.` });
}
const HORN3 = [['triangel', 'hörn', 3], ['kvadrat', 'hörn', 4], ['rektangel', 'sidor', 4], ['femhörning', 'hörn', 5], ['sexhörning', 'hörn', 6], ['femhörning', 'sidor', 5], ['kub', 'sidor', 6], ['kub', 'hörn', 8], ['rätblock', 'sidor', 6], ['cirkel', 'hörn', 0], ['triangel', 'sidor', 3], ['pyramid', 'hörn', 5]];
function former3() {
  if (Math.random() < 0.35) return former();
  const [f, what, n] = pick(HORN3), body = ['kub', 'rätblock', 'pyramid'].includes(f), w = what === 'sidor' && body ? 'sidor (ytor)' : what;
  return N({ topic: body ? 'KROPPAR' : 'FORMER', board: { lines: [`HUR MÅNGA ${w.toUpperCase()} HAR EN ${f.toUpperCase()}?`], after: `${n} ${what.toUpperCase()}` }, visual: { shape: f }, say: `Hur många ${w} har en ${f}?`, ans: n, hint: body ? 'Tänk dig kroppen i handen och vänd på den. Räkna även det du inte ser på tavlan.' : 'Räkna på formen på tavlan. Sätt fingret på ett hörn och gå runt.', done: `En ${f} har ${n} ${what}.` });
}
const PROB = [
  (A, B) => { const p = rnd(3, 6), k = rnd(4, 8), g = rnd(3, p * k - 4); return [`${A} HAR ${p} PÅSAR MED ${k} KULOR I VARJE. ${A} GER ${g} KULOR TILL ${B}.`, `HUR MÅNGA KULOR HAR ${A} KVAR?`, p * k - g, `Först ${p} · ${k} = ${p * k}, sedan ${p * k} − ${g} = ${p * k - g}.`]; },
  (A) => { const a = rnd(20, 45), b = rnd(10, 30), c = rnd(5, 25); return [`${A} LÄSER ${a} SIDOR PÅ MÅNDAGEN OCH ${b} SIDOR PÅ TISDAGEN. BOKEN HAR ${a + b + c} SIDOR.`, 'HUR MÅNGA SIDOR ÄR KVAR ATT LÄSA?', c, `${a} + ${b} = ${a + b}, och ${a + b + c} − ${a + b} = ${c}.`]; },
  () => { const v = rnd(4, 8), p = rnd(6, 9); return [`ETT TÅG HAR ${v} VAGNAR. I VARJE VAGN SITTER ${p} PERSONER.`, 'HUR MÅNGA SITTER PÅ TÅGET?', v * p, `${v} · ${p} = ${v * p}.`]; },
  (A, B) => { const a = rnd(7, 10), d = rnd(2, 5); return [`${A} ÄR ${a} ÅR. ${B} ÄR ${d} ÅR ÄLDRE.`, `HUR GAMMAL ÄR ${B}?`, a + d, `${a} + ${d} = ${a + d}.`]; },
  () => { const pr = pick([45, 55, 65, 75, 85]), n = rnd(2, 4); return [`EN PIZZA KOSTAR ${pr} KR.`, `HUR MYCKET KOSTAR ${n} PIZZOR?`, pr * n, `${Array(n).fill(pr).join(' + ')} = ${pr * n}.`]; },
  (A) => { const s = pick([10, 20, 25, 50]), w = rnd(3, 8); return [`${A} SPARAR ${s} KR VARJE VECKA.`, `HUR MYCKET HAR ${A} SPARAT EFTER ${w} VECKOR?`, s * w, `${w} · ${s} = ${s * w}.`]; },
  (A, B) => { const n = 2 * rnd(10, 30); return [`${A} OCH ${B} DELAR ${n} KLISTERMÄRKEN LIKA.`, 'HUR MÅNGA FÅR VAR OCH EN?', n / 2, `Hälften av ${n} är ${n / 2}.`]; },
  () => { const tot = pick([40, 45, 50]), sit = rnd(18, 30), on = rnd(4, tot - sit - 2); return [`BUSSEN HAR ${tot} PLATSER. ${sit} PERSONER SITTER REDAN. VID NÄSTA HÅLLPLATS KLIVER ${on} PÅ.`, 'HUR MÅNGA PLATSER ÄR LEDIGA NU?', tot - sit - on, `${sit} + ${on} = ${sit + on}, och ${tot} − ${sit + on} = ${tot - sit - on}.`]; },
  (A) => { const g = rnd(3, 5), k = rnd(4, 6), s = rnd(1, 3); return [`I KLASSEN FINNS ${g * k + s} BARN. ${s} ÄR SJUKA I DAG. RESTEN DELAS I GRUPPER MED ${k} I VARJE.`, 'HUR MÅNGA GRUPPER BLIR DET?', g, `${g * k + s} − ${s} = ${g * k}, och ${g * k} / ${k} = ${g}.`]; },
  (A) => { const b = rnd(3, 6), r = rnd(2, 4); return [`${A} PLANTERAR ${b} RADER MED ${r} BLOMMOR I VARJE RAD. ${A} PLANTERAR 5 BLOMMOR TILL.`, 'HUR MÅNGA BLOMMOR BLIR DET?', b * r + 5, `${b} · ${r} = ${b * r}, och ${b * r} + 5 = ${b * r + 5}.`]; },
];
function problem() {
  const [A, B] = names(), [text, q, ans, done] = pick(PROB)(A || 'ALVA', B || 'NOAH');
  return N({ topic: 'PROBLEMLÖSNING', board: { lines: [text, q] }, say: `${text.toLowerCase()} ${q.toLowerCase()}`, ans, hint: 'Läs en mening i taget. Vad vet du? Vad ska du räkna ut först? Rita gärna.', done });
}
function avrunda() {
  const r = rnd(0, 2);
  if (r === 0) { let n; do { n = rnd(11, 989); } while (n % 10 === 0); const a = Math.round(n / 10) * 10; return N({ topic: 'AVRUNDA TILL TIOTAL', board: { big: String(n), lines: ['AVRUNDA TILL NÄRMASTE TIOTAL.'], after: `${n} BLIR ${a}` }, say: `Avrunda ${n} till närmaste tiotal.`, ans: a, hint: 'Titta på entalssiffran: 0–4 avrundas nedåt, 5–9 uppåt.', done: `${n} avrundas till ${a}.` }); }
  if (r === 1) { let n; do { n = rnd(110, 990); } while (n % 100 === 0); const a = Math.round(n / 100) * 100; return N({ topic: 'AVRUNDA TILL HUNDRATAL', board: { big: String(n), lines: ['AVRUNDA TILL NÄRMASTE HUNDRATAL.'] }, say: `Avrunda ${n} till närmaste hundratal.`, ans: a, hint: 'Titta på tiotalssiffran: 0–4 avrundas nedåt, 5–9 uppåt.', done: `${n} avrundas till ${a}.` }); }
  let a, b; do { a = rnd(102, 489); b = rnd(102, 489); } while (a % 100 === 50 || b % 100 === 50);
  const ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100;
  return N({ topic: 'ÖVERSLAG', board: { lines: [`UNGEFÄR HUR MYCKET ÄR ${a} + ${b}?`, 'AVRUNDA BÅDA TILL HUNDRATAL FÖRST.'], after: `${ra} + ${rb} = ${ra + rb}` }, say: `Ungefär hur mycket är ${a} plus ${b}? Avrunda till hundratal först.`, ans: ra + rb, hint: `${a} är ungefär ${ra}. Hur mycket är ${b} ungefär?`, done: `${ra} + ${rb} = ${ra + rb}, så svaret blir ungefär ${ra + rb}.` });
}
const CHANS = [['Du slår en vanlig tärning. Kan du få en sjua?', 'Omöjligt', 'Möjligt', 'Säkert'], ['Du slår en tärning. Kan du få en sexa?', 'Möjligt', 'Omöjligt', 'Säkert'],
  ['I en påse finns bara röda kulor. Du tar en kula. Blir den röd?', 'Säkert', 'Möjligt', 'Omöjligt'], ['Du singlar slant. Kan det bli krona?', 'Möjligt', 'Säkert', 'Omöjligt'],
  ['I en påse finns 9 blå kulor och 1 gul. Vilken färg får du troligast?', 'Blå', 'Gul', 'Lika troligt'], ['I en påse finns 5 röda och 5 gröna kulor. Vilken färg får du troligast?', 'Lika troligt', 'Röd', 'Grön'],
  ['Kommer solen att gå upp i morgon?', 'Säkert', 'Möjligt', 'Omöjligt'], ['Du slår en tärning. Blir det ett tal mellan 1 och 6?', 'Säkert', 'Möjligt', 'Omöjligt'],
  ['Kommer det att regna någon gång nästa månad?', 'Troligt', 'Omöjligt', 'Säkert'], ['Kan en katt bli 2 meter lång?', 'Omöjligt', 'Troligt', 'Säkert']];

// ======================= KLOCKAN =======================
function klockaMin() {
  const h = rnd(1, 12), m = Math.random() < 0.7 ? 5 * rnd(0, 11) : rnd(1, 59), h12 = h % 12;
  return { topic: 'SKRIV TIDEN MED SIFFROR', input: 'time', question: 'VAD ÄR KLOCKAN?', prompt: 'Vad är klockan?', visual: { clock: [h, m] }, say: 'Vad är klockan? Skriv med siffror.', ans: `${h}:${pad(m)}`, accept: [h12 * 60 + m, (h12 + 12) * 60 + m], hint: 'Den korta visaren visar timmen. Den långa visaren: fem minuter för varje siffra från tolvan, och små streck för minuterna emellan.', done: `Klockan är ${h}:${pad(m)}${m % 5 === 0 ? `, ${phrase(h, m)}` : ''}.` };
}
function digital24() {
  const h = rnd(1, 11), m = 5 * rnd(0, 11), pm = Math.random() < 0.65, hh = pm ? h + 12 : h, right = `${pad(hh)}:${pad(m)}`;
  return { topic: '24-TIMMARSKLOCKAN', input: 'time', accept: [hh * 60 + m], board: { lines: [`KLOCKAN ÄR ${phrase(h, m).toUpperCase()}`, `PÅ ${pm ? 'EFTERMIDDAGEN' : 'FÖRMIDDAGEN'}. SKRIV DET DIGITALT.`] }, say: `Klockan är ${phrase(h, m)} på ${pm ? 'eftermiddagen' : 'förmiddagen'}. Skriv det digitalt.`, ans: right, hint: pm ? 'På eftermiddagen lägger man till 12 på timmen: tre blir 15. Halv betyder halvvägs till nästa timme.' : 'På förmiddagen är timmen samma som på urtavlan. Halv betyder halvvägs till nästa timme.', done: `${cap(phrase(h, m))} på ${pm ? 'eftermiddagen' : 'förmiddagen'} är ${right}.` };
}
const HANDELSE = [['RASTEN', 'Rasten'], ['FILMEN', 'Filmen'], ['MATCHEN', 'Matchen'], ['GYMPAN', 'Gympan'], ['BUSSRESAN', 'Bussresan'], ['KALASET', 'Kalaset']];
const tid = (t) => `${Math.floor(t / 60)}:${pad(t % 60)}`;
function tidSkillnad() {
  const [H, h] = pick(HANDELSE), s = 60 * rnd(8, 16) + 5 * rnd(0, 10), d = 5 * rnd(3, 11);
  return N({ topic: 'HUR LÅNG TID?', board: { lines: [`${H} BÖRJAR ${tid(s)} OCH SLUTAR ${tid(s + d)}.`, 'HUR MÅNGA MINUTER HÅLLER DEN PÅ?'], after: `${d} MINUTER` }, say: `${h} börjar ${tid(s)} och slutar ${tid(s + d)}. Hur många minuter håller den på?`, ans: d, hint: 'Räkna fram till nästa hela timme först och sedan resten. En timme är 60 minuter.', done: `Från ${tid(s)} till ${tid(s + d)} är det ${d} minuter.` });
}
function tidSen() {
  const s = 60 * rnd(7, 18) + 5 * rnd(0, 11), d = pick([15, 20, 25, 30, 40, 45, 50, 60, 90]), e = s + d;
  return { topic: 'VAD ÄR KLOCKAN SEDAN?', input: 'time', accept: [e], board: { lines: [`KLOCKAN ÄR ${tid(s)}.`, `VAD ÄR KLOCKAN OM ${d} MINUTER?`] }, say: `Klockan är ${tid(s)}. Vad är klockan om ${d} minuter?`, ans: tid(e), hint: 'Lägg till minuterna. Blir det 60 minuter eller mer blir det en timme till.', done: `${tid(s)} + ${d} minuter = ${tid(e)}.` };
}
const KALENDER = [['Hur många dagar har en vecka?', '7'], ['Hur många timmar har ett dygn?', '24'], ['Hur många minuter är en timme?', '60'], ['Hur många minuter är en kvart?', '15'], ['Hur många minuter är en halvtimme?', '30'],
  ['Hur många sekunder är en minut?', '60'], ['Hur många månader har ett år?', '12'], ['Hur många dagar är 2 veckor?', '14'], ['Hur många dagar är 3 veckor?', '21'], ['Hur många dagar har januari?', '31'],
  ['Hur många dagar har april?', '30'], ['Hur många dagar har ett vanligt år?', '365'], ['Hur många timmar är 2 dygn?', '48'], ['Hur många minuter är två timmar?', '120'], ['Hur många veckor har ett år ungefär?', '52']];

// ======================= SVENSKA =======================
const ALFA3 = [['bil', 'boll', 'banan', 'bok'], ['sol', 'säng', 'saft', 'sko'], ['katt', 'kaka', 'kyrka', 'ko'], ['mus', 'mamma', 'moln', 'mjölk'], ['tåg', 'tak', 'tröja', 'tiger'], ['hus', 'hatt', 'hund', 'häst'], ['fisk', 'fot', 'fågel', 'fjäril'], ['penna', 'pojke', 'pappa', 'puss'], ['glass', 'gris', 'gurka', 'get']];
function alfa3() {
  const words = shuffle(pick(ALFA3).slice()).slice(0, 3), first = words.slice().sort((a, b) => a.localeCompare(b, 'sv'))[0];
  return { topic: 'ALFABETISK ORDNING', board: { lines: [words.map((w) => w.toUpperCase()).join('   '), 'VILKET ORD KOMMER FÖRST I ALFABETET?'], after: first.toUpperCase() }, say: `Vilket ord kommer först i alfabetet: ${words.join(', ')}?`, ans: first, opts: words.map((w) => ({ label: w, value: w })), hint: 'Alla börjar på samma bokstav. Titta då på den andra bokstaven.', done: `${cap(first)} kommer först.` };
}
const SYN = [['glad', 'lycklig'], ['stor', 'jättelik'], ['liten', 'pytteliten'], ['snabb', 'kvick'], ['arg', 'ilsken'], ['rädd', 'skrämd'], ['vacker', 'fin'], ['börja', 'starta'], ['prata', 'tala'], ['tyst', 'ljudlös'], ['smart', 'klok'], ['trött', 'sömnig'], ['skratta', 'fnissa'], ['springa', 'rusa'], ['äta', 'mumsa'], ['ledsen', 'sorgsen']];
function synonym() {
  const [w, r] = pick(SYN), others = SYN.filter((p) => p[0] !== w).map((p) => p[1]);
  return { topic: 'SYNONYMER', board: { big: w.toUpperCase(), lines: ['VILKET ORD BETYDER NÄSTAN SAMMA SAK?'], after: `${w.toUpperCase()} = ${r.toUpperCase()}` }, say: `Vilket ord betyder nästan samma sak som ${w}?`, ans: r, opts: textOpts(r, others), hint: 'En synonym är ett annat ord för samma sak. Byt ut ordet i en mening och hör om det låter likadant.', done: `${cap(w)} och ${r} betyder nästan samma sak.` };
}
const MOTS3 = [['varm', 'kall'], ['full', 'tom'], ['upp', 'ner'], ['dag', 'natt'], ['ja', 'nej'], ['stor', 'liten'], ['lång', 'kort'], ['tung', 'lätt'], ['våt', 'torr', ['blöt']], ['mjuk', 'hård'], ['först', 'sist'], ['öppen', 'stängd'], ['ljus', 'mörk'], ['hög', 'låg'], ['snabb', 'långsam'], ['sommar', 'vinter'], ['in', 'ut'], ['svart', 'vit'], ['tjock', 'tunn', ['smal']], ['glad', 'ledsen'], ['börja', 'sluta'], ['köpa', 'sälja'], ['fråga', 'svara'], ['rik', 'fattig'], ['ung', 'gammal']];
function motsats3() {
  const [w, r, alt = []] = pick(MOTS3);
  return { topic: 'SKRIV MOTSATSEN', input: 'word', board: { big: `${w.toUpperCase()} - ?`, lines: ['SKRIV ORDET SOM BETYDER DET MOTSATTA.'] }, say: `Vad är motsatsen till ${w}?`, ans: r, accept: alt, hint: 'Motsatsen betyder det helt omvända. Tänk på ett exempel: om något inte är ' + w + ', vad är det då?', done: `Motsatsen till ${w} är ${r}.` };
}
const ENETT = [['äpple', 'ett'], ['hus', 'ett'], ['bord', 'ett'], ['barn', 'ett'], ['träd', 'ett'], ['öra', 'ett'], ['ägg', 'ett'], ['tåg', 'ett'], ['fönster', 'ett'], ['moln', 'ett'], ['katt', 'en'], ['hund', 'en'], ['bil', 'en'], ['penna', 'en'], ['stol', 'en'], ['bok', 'en'], ['cykel', 'en'], ['glass', 'en'], ['lampa', 'en'], ['blomma', 'en']];
function enett() {
  const [w, a] = pick(ENETT);
  return { topic: 'EN ELLER ETT?', board: { big: `___ ${w.toUpperCase()}`, lines: ['SKA DET VARA EN ELLER ETT?'], after: `${a.toUpperCase()} ${w.toUpperCase()}` }, say: `En eller ett ${w}?`, ans: a, opts: [{ label: 'En', value: 'en' }, { label: 'Ett', value: 'ett' }], hint: `Säg båda högt: en ${w}, ett ${w}. Vilket låter rätt? Prova också: ${a === 'ett' ? 'det' : 'den'} här ${w}.`, done: `Det heter ${a} ${w}.` };
}
const PLURAL = [['katt', 'katter', ['kattar', 'kattor']], ['hund', 'hundar', ['hunder', 'hundor']], ['bil', 'bilar', ['biler', 'bilor']], ['bok', 'böcker', ['bokar', 'boker']], ['mus', 'möss', ['musar', 'muser']], ['barn', 'barn', ['barnar', 'barner']], ['äpple', 'äpplen', ['äpplar', 'äppler']],
  ['stol', 'stolar', ['stoler', 'stolor']], ['fot', 'fötter', ['fotar', 'foter']], ['hand', 'händer', ['handar', 'hander']], ['flicka', 'flickor', ['flickar', 'flicker']], ['pojke', 'pojkar', ['pojker', 'pojkor']], ['träd', 'träd', ['trädar', 'träder']], ['gås', 'gäss', ['gåsar', 'gåser']]];
function plural() {
  const [w, r, wrong] = pick(PLURAL);
  return { topic: 'EN OCH FLERA', board: { lines: [`EN ${w.toUpperCase()} - TVÅ ___`], after: `TVÅ ${r.toUpperCase()}` }, say: `En ${w}, två …`, ans: r, opts: textOpts(r, wrong), hint: 'Säg orden högt: en …, två … Vissa ord ändrar sig mycket, som en mus och två möss.', done: `En ${w}, två ${r}.` };
}
const VERB = [['hoppar', 'hoppade', ['hoppte', 'hoppat']], ['springer', 'sprang', ['springde', 'sprungit']], ['äter', 'åt', ['ätade', 'ätit']], ['sover', 'sov', ['sovde', 'sovit']], ['läser', 'läste', ['läsade', 'läsit']], ['simmar', 'simmade', ['sam', 'simde']],
  ['skriver', 'skrev', ['skrivde', 'skrivade']], ['dricker', 'drack', ['drickade', 'druckit']], ['går', 'gick', ['gådde', 'gåde']], ['ser', 'såg', ['sedde', 'sett']], ['kommer', 'kom', ['kommade', 'kommit']], ['leker', 'lekte', ['lekade', 'lekat']], ['cyklar', 'cyklade', ['cyklte', 'cyklat']], ['sjunger', 'sjöng', ['sjungde', 'sjungit']], ['flyger', 'flög', ['flygde', 'flugit']]];
function verbDa() {
  const [nu, da, wrong] = pick(VERB);
  return { topic: 'VERB: NU OCH DÅ', board: { lines: [`I DAG ${nu.toUpperCase()} JAG.`, 'I GÅR ___ JAG.'], after: `I GÅR ${da.toUpperCase()} JAG.` }, say: `I dag ${nu} jag. I går … jag.`, ans: da, opts: textOpts(da, wrong), hint: 'I går har redan hänt. Många verb får -de eller -te, men vissa ändrar sig helt: går – gick.', done: `I dag ${nu} jag, i går ${da} jag.` };
}
const KOMP = [['stor', 'större', 'störst', ['storare', 'storast']], ['liten', 'mindre', 'minst', ['litnare', 'litenast']], ['snabb', 'snabbare', 'snabbast', ['snabbre', 'snabbst']], ['lång', 'längre', 'längst', ['långare', 'långast']], ['bra', 'bättre', 'bäst', ['brare', 'brast']],
  ['ung', 'yngre', 'yngst', ['ungare', 'ungast']], ['gammal', 'äldre', 'äldst', ['gammalare', 'gammalast']], ['hög', 'högre', 'högst', ['högare', 'högast']], ['glad', 'gladare', 'gladast', ['glädre', 'glädst']], ['rolig', 'roligare', 'roligast', ['roligre', 'roligst']]];
function komparera() {
  const [a, b, c, wrong] = pick(KOMP), sup = Math.random() < 0.5, right = sup ? c : b;
  return { topic: 'JÄMFÖRA: STOR, STÖRRE, STÖRST', board: { big: sup ? `${a} - ${b} - ?`.toUpperCase() : `${a} - ? - ${c}`.toUpperCase(), lines: ['VILKET ORD SAKNAS?'], after: `${a} - ${b} - ${c}`.toUpperCase() }, say: sup ? `${a}, ${b} och …` : `${a}, … och ${c}`, ans: right, opts: textOpts(right, wrong), hint: 'Jämför tre saker: en elefant är stor, en val är större, men vilken är störst? Vissa ord ändrar sig helt: bra, bättre, bäst.', done: `${cap(a)}, ${b}, ${c}.` };
}
const FRAGA = [['___ HETER DU? - JAG HETER {P}.', 'Vad'], ['___ BOR DU? - I GÖTEBORG.', 'Var'], ['___ ÄR KLOCKAN? - HALV TRE.', 'Vad'], ['___ BÖRJAR FILMEN? - KLOCKAN SJU.', 'När'], ['___ ÄR DIN BÄSTA KOMPIS? - {K}.', 'Vem'], ['___ GRÅTER DU? - JAG SLOG MIG.', 'Varför'],
  ['___ MÅR DU? - BRA, TACK.', 'Hur'], ['___ KOMMER DU HEM? - EFTER SKOLAN.', 'När'], ['___ KNACKAR PÅ DÖRREN? - DET ÄR POSTEN.', 'Vem'], ['___ LIGGER MIN MÖSSA? - I HALLEN.', 'Var'], ['___ ÄR DU SÅ GLAD? - JAG HAR FÖDELSEDAG.', 'Varför'], ['___ ÄTER DU TILL FRUKOST? - GRÖT.', 'Vad']];
function fragaord() {
  const c = ctx(), [s0, right] = pick(FRAGA), s = s0.replace('{P}', String(c.me).toUpperCase()).replace('{K}', (names()[0] || 'ALVA'));
  const others = ['Vem', 'Vad', 'Var', 'När', 'Varför', 'Hur'].filter((w) => w !== right);
  return { topic: 'FRÅGEORD', board: { lines: [s, 'VILKET FRÅGEORD PASSAR?'], after: s.replace('___', right.toUpperCase()) }, say: s.toLowerCase().replace('___', 'blank'), ans: right, opts: textOpts(right, others), hint: 'Vem frågar efter en person, vad efter en sak, var efter en plats, när efter en tid, varför efter ett skäl och hur efter ett sätt.', done: `${right} passar.` };
}
const LAS3 = [
  (A) => [`${A} VAKNADE TIDIGT. UTE VAR ALLT VITT OCH TAKEN GLITTRADE. ${A} TOG PÅ SIG VANTAR OCH MÖSSA OCH SPRANG UT MED PULKAN.`, 'Vilken årstid är det?', 'Vinter', ['Sommar', 'Vår']],
  (A) => [`${A} HADE GLÖMT SITT PARAPLY. NÄR ${A} KOM HEM VAR HÅRET HELT BLÖTT OCH DET SKVÄTTE I SKORNA.`, 'Hur var vädret?', 'Det regnade', ['Det var soligt', 'Det snöade']],
  (A, T, B) => [`${B} FYLLER NIO ÅR PÅ LÖRDAG. ${A} SLÅR IN EN BOK I RANDIGT PAPPER OCH SKRIVER ETT KORT MED STORA BOKSTÄVER.`, `Varför slår ${nm(A)} in en bok?`, 'Det är kalas', ['Det är jul', 'Boken är sönder']],
  (A) => [`${A} STOD LÄNGST BAK I KÖN TILL GLASSTÅNDET. KÖN VAR LÅNG OCH SOLEN GASSADE. NÄR DET ÄNTLIGEN BLEV ${A}S TUR VAR CHOKLADGLASSEN SLUT.`, `Hur kände sig ${nm(A)} troligen?`, 'Besviken', ['Glad', 'Rädd']],
  (A, T) => [`${T} SA: TA FRAM ERA GYMNASTIKPÅSAR OCH STÄLL ER I LED VID DÖRREN.`, 'Vart ska klassen gå?', 'Till gympan', ['Till matsalen', 'Hem']],
  (A, T, B) => [`${A} OCH ${B} BYGGDE EN KOJA I SKOGEN. ${B} BAR PINNAR OCH ${A} BAND IHOP DEM MED SNÖRE. PÅ KVÄLLEN ÅT DE SMÖRGÅSAR I KOJAN.`, `Vad gjorde ${nm(B)}?`, 'Bar pinnar', ['Band ihop pinnar', 'Bakade bröd']],
  (A) => [`HUNDEN SKÄLLDE OCH VIFTADE PÅ SVANSEN. DEN RUSADE FRAM TILL DÖRREN NÄR ${A} KOM HEM FRÅN SKOLAN.`, 'Hur kände sig hunden?', 'Glad', ['Arg', 'Ledsen']],
  (A) => [`${A} TITTADE UT GENOM DET STORA FÖNSTRET I GALLERIAN. LÅNGT BORTA SÅG ${A} BÅTAR PÅ ÄLVEN OCH EN HÖG BRO.`, `Var var ${nm(A)}?`, 'I gallerian', ['I skolan', 'På en båt']],
  (A, T, B) => [`${A} RÄCKTE UPP HANDEN. JAG VET! ROPADE ${A}. DET ÄR SJU GÅNGER FYRA, SOM ÄR TJUGOÅTTA.`, `Vilket ämne har klassen?`, 'Matte', ['Engelska', 'Idrott']],
  (A) => [`${A} SATT VID FÖNSTRET OCH RÄKNADE BILAR. EN RÖD, TVÅ BLÅ OCH TRE VITA BILAR KÖRDE FÖRBI.`, 'Hur många bilar räknade ' + nm(A) + '?', 'Sex', ['Tre', 'Fem']],
  (A, T, B) => [`${B} SNUBBLADE PÅ SKOLGÅRDEN OCH SLOG KNÄT. ${A} HJÄLPTE ${B} UPP OCH FÖLJDE MED TILL ${T}.`, `Vad gjorde ${nm(A)}?`, 'Hjälpte till', ['Skrattade', 'Sprang hem']],
  (A) => [`PÅ HÖSTEN SAMLAR EKORREN NÖTTER OCH GÖMMER DEM. NÄR SNÖN KOMMER LETAR DEN FRAM NÖTTERNA IGEN.`, 'Varför gömmer ekorren nötter?', 'För att ha mat på vintern', ['För att leka', 'För att ge bort dem']],
];
function las3() {
  const c = ctx(), [A, B] = names(), [text, q, right, wrong] = pick(LAS3)(A || 'ALVA', String(c.teacher).toUpperCase(), B || 'NOAH');
  return { topic: 'LÄSFÖRSTÅELSE', board: { lines: [text, q.toUpperCase()], after: right.toUpperCase() }, say: `${text.toLowerCase()} ${q}`, ans: right, opts: textOpts(right, wrong), hint: 'Läs texten igen. Ibland står svaret inte rakt ut – tänk på vad som har hänt.', done: `${right}.` };
}
const ORD3 = ['stjärna', 'skjorta', 'hjärta', 'kjol', 'tjugo', 'sjuk', 'simma', 'sjunga', 'kyrka', 'fotboll', 'choklad', 'jordgubbe', 'sjukhus', 'dator', 'månad', 'vecka', 'onsdag', 'december', 'vänner', 'frukost', 'skolgård', 'klocka', 'räkna', 'skriva', 'ljus', 'djur', 'göra', 'fjäril', 'tänka', 'sång', 'tunga', 'flicka', 'pojke', 'hoppa', 'paraply', 'gymnastik', 'kängor', 'äventyr', 'sommarlov', 'bibliotek'];

// ======================= ENGELSKA =======================
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const enNum = (n) => (n === 100 ? 'one hundred' : n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));
function enSiffror() {
  const n = Math.random() < 0.25 ? rnd(11, 19) : rnd(20, 100), w = enNum(n);
  return N({ topic: 'NUMBERS - SIFFROR TILL 100', board: { big: w.toUpperCase(), lines: ['SKRIV TALET MED SIFFROR.'] }, say: w, lang: 'en-GB', ans: n, hint: 'Twenty = 20, thirty = 30, forty = 40, fifty = 50, sixty = 60, seventy = 70, eighty = 80, ninety = 90. Tryck på Läs upp.', done: `${cap(w)} = ${n}.` });
}
const EN3 = {
  skola: [['penna', 'pencil'], ['bok', 'book'], ['linjal', 'ruler'], ['sudd', 'eraser'], ['väska', 'bag'], ['stol', 'chair'], ['bord', 'table'], ['lärare', 'teacher'], ['klassrum', 'classroom'], ['skola', 'school'], ['sax', 'scissors'], ['papper', 'paper'], ['dator', 'computer'], ['tavla', 'board']],
  familj: [['mamma', 'mum'], ['pappa', 'dad'], ['syster', 'sister'], ['bror', 'brother'], ['mormor eller farmor', 'grandma'], ['morfar eller farfar', 'grandpa'], ['bebis', 'baby'], ['familj', 'family'], ['kompis', 'friend'], ['kusin', 'cousin']],
  vader: [['sol', 'sun'], ['regn', 'rain'], ['snö', 'snow'], ['vind', 'wind'], ['moln', 'cloud'], ['soligt', 'sunny'], ['regnigt', 'rainy'], ['vår', 'spring'], ['sommar', 'summer'], ['höst', 'autumn'], ['vinter', 'winter'], ['kallt', 'cold'], ['varmt', 'hot']],
  manader: [['januari', 'January'], ['februari', 'February'], ['mars', 'March'], ['april', 'April'], ['maj', 'May'], ['juni', 'June'], ['juli', 'July'], ['augusti', 'August'], ['september', 'September'], ['oktober', 'October'], ['november', 'November'], ['december', 'December'], ['måndag', 'Monday'], ['tisdag', 'Tuesday'], ['onsdag', 'Wednesday'], ['torsdag', 'Thursday'], ['fredag', 'Friday'], ['lördag', 'Saturday'], ['söndag', 'Sunday']],
  djurmat: [...EN.djur, ...EN.mat],
};
EN.skola = EN3.skola; EN.familj = EN3.familj; EN.vader = EN3.vader; EN.manader = EN3.manader; EN.djurmat = EN3.djurmat;
const FRASER = [['Vad heter du?', 'What is your name?'], ['Hur gammal är du?', 'How old are you?'], ['Jag är nio år.', 'I am nine years old.'], ['Var bor du?', 'Where do you live?'], ['Jag gillar glass.', 'I like ice cream.'], ['Vad är klockan?', 'What time is it?'], ['Förlåt!', 'Sorry!'], ['Varsågod!', 'Here you are!'], ['Hej då, vi ses!', 'Bye, see you!'], ['Hur mår du?', 'How are you?'], ['Jag mår bra, tack.', 'I am fine, thank you.'], ['Vilken är din favoritfärg?', 'What is your favourite colour?']];
function fraser() {
  const [sv, en] = pick(FRASER), toEn = Math.random() < 0.5, others = FRASER.filter((p) => p[0] !== sv).map((p) => (toEn ? p[1] : p[0]));
  return toEn
    ? { topic: 'PHRASES - FRASER', board: { lines: [sv.toUpperCase(), 'HUR SÄGER MAN DET PÅ ENGELSKA?'], after: en.toUpperCase() }, say: sv, ans: en, opts: textOpts(en, others), hint: 'Leta efter ord du känner igen: name, old, live, like …', done: `${sv} heter ${en}` }
    : { topic: 'PHRASES - FRASER', board: { lines: [en.toUpperCase(), 'VAD BETYDER DET PÅ SVENSKA?'], after: sv.toUpperCase() }, say: en, lang: 'en-GB', ans: sv, opts: textOpts(sv, others), hint: 'Tryck på Läs upp och lyssna. Vilka ord känner du igen?', done: `${en} betyder ${sv}` };
}

// ======================= NO OCH SO =======================
const NATUR3 = [['Vad kommer ut ur ett fjärilsägg?', 'En larv', 'En fjäril', 'En puppa'], ['Ägg, larv, … , fjäril. Vad saknas?', 'Puppa', 'Grodyngel', 'Kalv'], ['Vad äter haren?', 'Gräs och växter', 'Rävar', 'Fiskar'],
  ['Vem äter haren i näringskedjan?', 'Räven', 'Gräset', 'Myran'], ['Vad kallas djur som bara äter växter?', 'Växtätare', 'Rovdjur', 'Allätare'], ['Vad kallas djur som äter andra djur?', 'Rovdjur', 'Växtätare', 'Husdjur'],
  ['Vilket djur är en insekt?', 'Myran', 'Spindeln', 'Masken'], ['Hur många ben har en insekt?', '6', '8', '4'], ['Vad gör bina för blommorna?', 'Pollinerar dem', 'Äter upp dem', 'Vattnar dem'],
  ['Vad behöver en växt för att leva?', 'Ljus, vatten och luft', 'Bara sand', 'Bara mörker'], ['Vilket träd fäller sina löv på hösten?', 'Björken', 'Granen', 'Tallen'], ['Vad är allemansrätten?', 'Att alla får vara ute i naturen', 'Att man får ta allt man vill', 'Att djuren bestämmer'],
  ['Vad gör man med skräpet efter en utflykt i skogen?', 'Tar med det hem', 'Gömmer det under en sten', 'Lämnar det kvar'], ['Vilket djur sover på dagen och jagar på natten?', 'Ugglan', 'Kossan', 'Hönan']];
const VATTEN = [['Vad händer med vatten vid 0 grader?', 'Det fryser till is', 'Det kokar', 'Det blir saft'], ['Vid hur många grader kokar vatten?', '100', '50', '0'], ['Vad heter vatten när det är en gas?', 'Vattenånga', 'Is', 'Snö'],
  ['Vad bildas när vattenånga kyls ner högt upp i luften?', 'Moln', 'Sand', 'Is på marken'], ['Vad kallas det när vatten blir till ånga?', 'Avdunstning', 'Frysning', 'Smältning'], ['Vad händer med is i solen?', 'Den smälter', 'Den växer', 'Den blir sten'],
  ['Var finns det mest vatten på jorden?', 'I haven', 'I sjöarna', 'I molnen'], ['Vad mäter en termometer?', 'Temperatur', 'Vind', 'Tid'], ['Regnet rinner till havet. Vad händer sedan i vattnets kretslopp?', 'Vattnet avdunstar och blir moln', 'Vattnet försvinner', 'Vattnet blir sand'],
  ['Vad kallas vatten som faller som små iskristaller?', 'Snö', 'Dimma', 'Dagg'], ['Vad hörs efter en blixt?', 'Åskan', 'Regnbågen', 'Vinden']];
const RYMD = [['Vad drar en magnet till sig?', 'Järn', 'Trä', 'Plast'], ['Vad är ljud?', 'Vibrationer som färdas i luften', 'Ljus', 'Vatten'], ['Vad bildas bakom dig när solen lyser på dig?', 'En skugga', 'En regnbåge', 'Ett moln'],
  ['Vad behöver vi för att kunna se?', 'Ljus', 'Ljud', 'Vind'], ['Vilket material flyter i vatten?', 'Trä', 'Sten', 'Järn'], ['Vad snurrar jorden runt?', 'Solen', 'Månen', 'Mars'],
  ['Hur lång tid tar det för jorden att snurra ett varv runt sig själv?', 'Ett dygn', 'En vecka', 'Ett år'], ['Hur lång tid tar det för jorden att gå ett varv runt solen?', 'Ett år', 'En dag', 'En månad'], ['Vad är månen?', 'Jordens måne som går runt jorden', 'En stjärna', 'En planet som lyser själv'],
  ['Vad är solen?', 'En stjärna', 'En planet', 'En måne'], ['Vilken planet bor vi på?', 'Jorden', 'Mars', 'Venus'], ['Varför blir det natt?', 'Jorden snurrar och vår sida vänds bort från solen', 'Solen slocknar', 'Månen täcker solen']];
const KROPP3 = [['Vad heter alla ben i kroppen tillsammans?', 'Skelettet', 'Musklerna', 'Huden'], ['Vad gör musklerna?', 'Får kroppen att röra sig', 'Pumpar blod', 'Tänker'], ['Var hamnar maten efter att du svalt den?', 'I magen', 'I lungorna', 'I hjärtat'],
  ['Vad tänker vi med?', 'Hjärnan', 'Magen', 'Knät'], ['Hur många mjölktänder har ett barn?', '20', '32', '10'], ['Vilka är våra fem sinnen?', 'Syn, hörsel, lukt, smak och känsel', 'Gå, springa, hoppa, simma och åka', 'Röd, blå, gul, grön och vit'],
  ['Vart hostar man så att man inte smittar andra?', 'I armvecket', 'På kompisen', 'I handen'], ['Vad behöver kroppen för att må bra?', 'Mat, sömn och rörelse', 'Godis och läsk', 'Bara tv-spel'], ['Vilket organ pumpar runt blodet?', 'Hjärtat', 'Njurarna', 'Magen'],
  ['Vad andas vi in?', 'Syre i luften', 'Vatten', 'Sand']];
const SVERIGE = [['Vad heter Sveriges huvudstad?', 'Stockholm', 'Göteborg', 'Malmö'], ['Vad heter Sveriges största sjö?', 'Vänern', 'Vättern', 'Mälaren'], ['Vilket väderstreck är uppåt på en karta?', 'Norr', 'Söder', 'Väster'],
  ['Var går solen upp?', 'I öster', 'I väster', 'I norr'], ['Var går solen ner?', 'I väster', 'I öster', 'I söder'], ['Vilket land ligger väster om Sverige?', 'Norge', 'Finland', 'Danmark'],
  ['Vilket land ligger öster om Sverige, på andra sidan Bottenviken?', 'Finland', 'Norge', 'Island'], ['Vilken stad ligger där Göta älv rinner ut i havet?', 'Göteborg', 'Stockholm', 'Umeå'], ['Vad heter Sveriges högsta berg?', 'Kebnekaise', 'Mount Everest', 'Åreskutan'],
  ['Vad visar en karta?', 'Hur ett område ser ut uppifrån', 'Vad klockan är', 'Vad det blir för väder'], ['Vilka färger har Sveriges flagga?', 'Blå och gul', 'Röd och vit', 'Grön och gul'], ['Vilken är Sveriges största ö?', 'Gotland', 'Öland', 'Orust'],
  ['Vad heter Sveriges sydligaste landskap?', 'Skåne', 'Lappland', 'Dalarna']];
const FORR = [['Vilken tid kom först?', 'Stenåldern', 'Bronsåldern', 'Järnåldern'], ['Vad gjorde man verktyg av på stenåldern?', 'Sten, ben och trä', 'Plast', 'Järn'], ['Vilka seglade långt i långskepp?', 'Vikingarna', 'Dinosaurierna', 'Stenåldersfolket'],
  ['Vilken tid kom efter bronsåldern?', 'Järnåldern', 'Stenåldern', 'Dinosauriernas tid'], ['Vad hette vikingarnas bokstäver?', 'Runor', 'Hieroglyfer', 'Emojier'], ['Vad är en runsten?', 'En sten med runor inristade', 'En sten man springer runt', 'En stjärna'],
  ['Vilken metall har gett namn åt en av forntidens tider?', 'Brons', 'Guld', 'Aluminium'], ['Hur lagade man mat innan det fanns spis?', 'Över öppen eld', 'I mikron', 'I diskmaskinen'], ['Vad hade man i stället för elljus förr i tiden?', 'Stearinljus och fotogenlampor', 'Lysrör', 'Mobiler'],
  ['Vad skrev barnen på i skolan för länge sedan?', 'Griffeltavlor', 'Datorer', 'Mobiler'], ['Vad jagade man på stenåldern?', 'Vilda djur som älg och säl', 'Bilar', 'Dinosaurier']];
const HOGTID = [['Vad firar kristna på jul?', 'Att Jesus föddes', 'Att sommaren kommer', 'Att året slutar'], ['Vilken högtid firar man med att måla ägg?', 'Påsk', 'Jul', 'Midsommar'], ['Vad firar muslimer när fastemånaden ramadan är slut?', 'Id al-fitr', 'Hanukka', 'Diwali'],
  ['Vilken högtid kallas ljusets högtid i hinduismen?', 'Diwali', 'Påsk', 'Midsommar'], ['Vilken religion firar hanukka?', 'Judendomen', 'Hinduismen', 'Buddhismen'], ['Vad heter kristendomens heliga bok?', 'Bibeln', 'Koranen', 'Toran'],
  ['Vad heter islams heliga bok?', 'Koranen', 'Bibeln', 'Toran'], ['Vilken dag firar vi Lucia?', '13 december', '24 december', '6 juni'], ['Vad firar vi på Sveriges nationaldag den 6 juni?', 'Sverige', 'Jul', 'Påsk'],
  ['Var samlas muslimer för att be tillsammans?', 'I en moské', 'I en kyrka', 'I en synagoga'], ['Var samlas judar för att be tillsammans?', 'I en synagoga', 'I en moské', 'I en kyrka'], ['Var samlas kristna till gudstjänst?', 'I en kyrka', 'I en moské', 'I en synagoga']];
const SAMHALLE = [['Vilka stiftar lagarna i Sverige?', 'Riksdagen', 'Polisen', 'Skolan'], ['Vad gör man när man röstar?', 'Väljer vilka som ska bestämma', 'Springer ett lopp', 'Köper något'], ['Hur gammal måste man vara för att rösta i riksdagsvalet?', '18', '12', '30'],
  ['Vad är en regel?', 'Något man har kommit överens om', 'En leksak', 'En sorts mat'], ['Vilket nummer ringer man om det brinner eller någon är svårt skadad?', '112', '911', '100'], ['Vad gör en brandman?', 'Släcker bränder och räddar människor', 'Bakar bröd', 'Lagar tänder'],
  ['Vad betalar vi skatt till?', 'Skolor, vård och vägar', 'Godis till kungen', 'Ingenting'], ['Vad är demokrati?', 'Att folket får vara med och bestämma', 'Att en person bestämmer allt', 'Att ingen får säga vad den tycker'], ['Vad handlar barnkonventionen om?', 'Barns rättigheter', 'Regler i fotboll', 'Hur man bakar'],
  ['Vad gör man om man ser att någon blir retad?', 'Säger ifrån eller hämtar en vuxen', 'Skrattar med', 'Går därifrån och glömmer det']];

// ======================= NIVÅERNA (årskurs 3) =======================
export const LEVELS3 = {
  matte: [
    { name: 'Talen till 1000', gen: tal1000 }, { name: 'Talraden till 1000', gen: talraden }, { name: 'Talföljder och mönster', gen: monster }, { name: 'Huvudräkning: plus till 100', gen: plus100 },
    { name: 'Huvudräkning: minus till 100', gen: minus100 }, { name: 'Hela tiotal och hundratal', gen: hela }, { name: 'Uppställning: addition', gen: uppAdd }, { name: 'Uppställning: subtraktion', gen: uppSub },
    { name: 'Likhetstecknet', gen: likhet }, { name: 'Tabellerna 1–10', gen: tab10 }, { name: 'Division', gen: division }, { name: 'Dubbelt och hälften', gen: dubbelt3 },
    { name: 'Bråk: del av antal', gen: brakAntal }, { name: 'Pengar', gen: pengar3 }, { name: 'Mäta: enheter', gen: enheter }, { name: 'Stapeldiagram', gen: diagram3 },
    { name: 'Former och kroppar', gen: former3 }, { name: 'Problemlösning', gen: problem }, { name: 'Avrundning och överslag', gen: avrunda }, { name: 'Chans och slump', gen: quiz('CHANS OCH SLUMP', CHANS) },
  ],
  klocka: [
    { name: 'Fem minuter i taget', gen: () => klocka(3) }, { name: 'Skriv tiden med siffror', gen: klockaMin }, { name: '24-timmarsklockan', gen: digital24 },
    { name: 'Hur lång tid?', gen: tidSkillnad }, { name: 'Vad är klockan sedan?', gen: tidSen }, { name: 'Tid och kalender', gen: quiz('TID OCH KALENDER', KALENDER) },
  ],
  svenska: [
    { name: 'Alfabetisk ordning', gen: alfa3 }, { name: 'Synonymer', gen: synonym }, { name: 'Skriv motsatsen', gen: motsats3 }, { name: 'Sammansatta ord', gen: sammansatt },
    { name: 'Skriv ordet', gen: diktamen(ORD3) }, { name: 'Dubbelteckning', gen: dubbel }, { name: 'Stavning: sj-, tj- och j-ljud', gen: sjtj }, { name: 'Ordklasser', gen: ordklass(['N', 'V', 'A']) },
    { name: 'En eller ett?', gen: enett }, { name: 'En och flera', gen: plural }, { name: 'Verb: nu och då', gen: verbDa }, { name: 'Stor, större, störst', gen: komparera },
    { name: 'Frågeord', gen: fragaord }, { name: 'Punkt, frågetecken, utropstecken', gen: slut }, { name: 'Stor bokstav', gen: storBokstav }, { name: 'Läsförståelse', gen: las3 },
  ],
  engelska: [
    { name: 'Siffror till 100', gen: enSiffror }, { name: 'Skolan', gen: engelska('skola', 'SCHOOL - SKOLAN') }, { name: 'Familjen', gen: engelska('familj', 'FAMILY - FAMILJEN') },
    { name: 'Väder och årstider', gen: engelska('vader', 'WEATHER - VÄDER') }, { name: 'Månader och veckodagar', gen: engelska('manader', 'MONTHS AND DAYS') }, { name: 'Kläder och kroppen', gen: engelska('klader', 'CLOTHES AND BODY') },
    { name: 'Djur och mat', gen: engelska('djurmat', 'ANIMALS AND FOOD') }, { name: 'Fraser', gen: fraser },
  ],
  no: [
    { name: 'Djur och natur', gen: quiz('DJUR OCH NATUR', NATUR3) }, { name: 'Vatten och väder', gen: quiz('VATTEN OCH VÄDER', VATTEN) }, { name: 'Ljus, ljud och rymden', gen: quiz('LJUS, LJUD OCH RYMDEN', RYMD) },
    { name: 'Kroppen och hälsa', gen: quiz('KROPPEN OCH HÄLSA', KROPP3) }, { name: 'Trafik och säkerhet', gen: quiz('TRAFIKREGLER', TRAFIK) }, { name: 'Årstider och månader', gen: quiz('ÅRSTIDER OCH MÅNADER', ARSTID) },
    { name: 'Sverige och kartan', gen: quiz('SVERIGE OCH KARTAN', SVERIGE) }, { name: 'Förr i tiden', gen: quiz('FÖRR I TIDEN', FORR) }, { name: 'Högtider och religioner', gen: quiz('HÖGTIDER OCH RELIGIONER', HOGTID) },
    { name: 'Samhället', gen: quiz('SAMHÄLLET', SAMHALLE) },
  ],
};
