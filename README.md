# Pixelskolan

Lågstadieskolan i [Snabbfilens](https://8bitcat.github.io/snabbfilen) pixelstad.

Spela: **https://8bitcat.github.io/pixelskolan** (dator, iPad och iPhone)

- Välj årskurs 2 eller 3 (uppgifterna följer läroplanen för årskursen), gör din figur – knappen *Gör om figuren* finns i klassdialogen – skriv in din klass och döp fröken och klasskompisarna.
- Sätt dig i bänken: tavlan visas i närbild. Svaren **skrivs på tavlan** med knapparna i rutan (siffror, klockslag eller bokstäver) och rättas med den gröna *Klar* – inga textfält, så iPadens tangentbord kommer inte fram. Uppställningar skrivs från entalen, som på papper.
- Flikarna **Matte**, **Gånger**, **Klockan**, **Svenska**, **Engelska** och **NO/SO**: 50 nivåer i årskurs 2 och 71 i årskurs 3 (talen till 1000, uppställning med växling, tabellerna 1–10, division, bråk, enheter, tid, problemlösning, synonymer, böjningar, läsförståelse, Sverige, förr i tiden …). Under 🎯 *Nivåer* syns 0–3 stjärnor för den bästa lektionen på varje nivå.
- **Gånger** (som läxbladen, tabell 1–5): upprepad addition med guldmynt, krabbans luckor, *Träna huvudräkning* (25 tal på tid, försöken A–F sparas) och *kapten Rödskäggs hemliga meddelande*.
- Fem uppgifter → rast. Varje stjärna blir 100 kr i plånboken.
- Den blå dörren leder till **Galleria Stjärnan**: tre våningar med Snabbfilens riktiga butiker (klädaffären, skobutiken, Leksakslådan, Möbeljätten) vägg i vägg med småbutiker (blommor, kiosk, godis, fotoautomat, bankomat). På plan 1 ligger **DREAM LAND** (hette BLING BLING): smycken i glasmontrar, en vägg full av väskor, en ateljé där du designar ditt eget halsband och din egen väska (varje del kostar olika mycket), en pärlbar där du trär ett halsband pärla för pärla – med bokstavspärlor för ditt namn – ett strykbord där du själv drar strykmärken dit du vill ha dem på väskan, tröjan eller byxorna och byter färg på dem, en vägg med nya mössor (katt, björn, groda, dino, enhörning …) och en hörna där du designar ditt eget mobilskal med berlocker och mobilband. Allt syns på din figur – mobilen har du i handen. Trapphuset med rulltrapporna och hissen har en glasvägg från golv till tak: från entrén syns torget med spårvagnen, högre upp hustaken, fåglarna och molnen – och högst upp ända ut till älven med hängbron.
- Hemma ställer du ut möblerna från Möbeljätten.

Filer:

- `index.html` – spelet · `plan.html` – planen för hur skolan byggs in i Snabbfilen
- `skola.js` – skolan och gallerian · `uppgifter.js` – nivåerna för årskurs 2 · `uppgifter3.js` – nivåerna för årskurs 3
- `utsikt.js` – utsikten genom glasväggen · `smabutiker.js` – småbutikerna i gallerian · `bling.js` – DREAM LAND inifrån (montrarna, väskväggen, ateljén, pärlbaren, strykbordet) · `dream.js` – strykmärkena, pärlorna och plaggbilderna
- `iso.js` – egen lagring: Pixelskolan skriver aldrig i Snabbfilens figur eller sparfil (samma adress på GitHub Pages)
- `sf/` – Snabbfilens egna filer (figurerna, figurskaparen, dialogerna, butiksscenerna, fasaderna, rulltrapporna, musiken). **Fyra har Pixelskolans tillägg:** `sf/js/core/people.js` (`decorate`: figuren ritar strykmärkena, pärlorna och mobilen i handen), `sf/js/core/avatar.js` (`cleanBeads`/`cleanPatches`/`cleanMobil`: de sparas), `sf/js/core/people/acc.js` (nio nya mössor sist i `HAT_REG`) och `sf/js/data/wardrobe-acc.js` (mössorna i katalogen). Kopieras `sf/` om från Snabbfilen måste tilläggen följa med, annars försvinner märkena, pärlorna, mobilen och mössorna.

Allt sparas i webbläsaren (localStorage).
