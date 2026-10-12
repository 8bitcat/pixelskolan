# Överlämning: BLING BLING-ateljén → Pixelcity (Snabbfilen)

**Från:** Pixelskolan-sessionen, 2026-10-11 · **Till:** sessionen som jobbar med Snabbfilen/Pixelcity (`D:\GamesProjects\snabbfilen`)

## Vad Carl vill

Carl beställde BLING BLING i Pixelskolan: *"en butik med smycken där man kan designa sitt eget halsband och sin egen väska … massa smycken i glaslådor … massa väskor … de olika delarna kostar olika mycket."*

Sedan bad han om två saker:

- *"Skriv en handover till pixelcity-spelet så den kan lyfta in den i butiken."*
- *"Man ska se hur den blir direkt på karaktären, så man ser hur man ser ut med väskan på … på samma sätt som man kan se andra kläder på."*

## Vad som finns i Pixelskolan (live)

- **Var:** https://8bitcat.github.io/pixelskolan. Gå in i Galleria Stjärnan och åk till plan 1. Butiken ligger till höger om godisbutiken.
- **Commits** i `8bitcat/pixelskolan`:
  - `9bb503e`: butiken, fasaden och ateljén.
  - `f608efb`: provfiguren som i klädaffären.
- **Butiken innehåller:**
  - glasmontrar med halsband, örhängen och armband, ringar och klockor;
  - en väskvägg och ett väskbord;
  - **ateljén**: två bord, *Designa halsband* och *Designa väska*;
  - en spegel.
- **Montrarna** säljer spelets egna katalogvaror (`wardrobe-acc.js`). Ett klick öppnar klädaffärens provdialog (`klader/buy.js openBuy`).

**Ateljén** visar fyra saker samtidigt:

1. Provfiguren *Du nu ➜ Med halsbandet/väskan*. Den går att vrida och vänder sig själv dit väskan syns bäst, tills man vrider själv.
2. En närbild på 96×72 pixlar av smycket eller väskan, med glitter.
3. Delar med eget pris.
4. En prissumma.

Designerna sparas. Väljer man samma design igen blir knappen *Ta på – den är redan din* i stället för att man köper igen.

## Förslag: vad som lyfts in, och var

`js/scenes/shop-accessoarer.js` har redan nästan allt annat som BLING BLING har:
- halsvitrin;
- väskvägg;
- smyckesdisk;
- spegel;
- köpdialog med vridbar figur och färgprov.

**Det nya är alltså ateljén.** Förslaget är att ställa de två ateljéborden i ACCESSOARER, på golvet med en skylt ovanför, i stället för att bygga en egen BLING BLING-byggnad. En egen byggnad skulle dubblera katalogen.

Fråga Carl om han hellre vill ha en egen butik i staden. Fasaden i Pixelskolan finns i så fall att låna: `smabutiker.js`, `UNITS.bling` och `blingBack`/`blingFront`/`blingOut`/`blingSign`.

## Det som ska flyttas (Pixelskolan `bling.js`)

| Del | Rader | Vad den gör |
|---|---|---|
| `GEMS`, `NECK`, `BAGC`, `BAG` | 35–48 | Delarna som `[id, namn, pris]`. Halsband: kedja, hänge, sten och pärlor. Väska: modell, färg, mönster och berlock. |
| `optOf`, `priceOf` | 49–50 | Plockar ut en del och summerar priset. |
| `neckLook`, `BAG_STYLE`, `bagLook` | 52–60 | Gör om en design till `{ id, look }`: närmaste modell i spelet plus `neckColor`/`bagColor`, och basmodellens katalog-id. |
| `SPRITES`, `GEMPOS`, `stampC`, `x2`, `BAGSPR`, `stamp` | 61–89 | Hängena: metall med stenen infattad, och enhörning och katt i egna färger. |
| `drawNecklace(sel, initial)`, `drawBag(sel)` | 90–219 | Närbilderna, 96×72, ritade med `floor-pix.js` (`Pix`, `mix`, `mul`, `hash`, `bayer`). Samma modul finns i Snabbfilen. |
| `bestDir`, `stageHtml`, `stage` | 434–455 | Provfiguren och vridknapparna. |
| `designer(kind)`, `buyDesign(kind, total)` | 485–527 | Ateljédialogen och köpet. |
| `mirror()` | 528– | Spegeln (behövs troligen inte, ACCESSOARER har en egen). |
| CSS `.bl-*` | `pixelskolan.html` / `skola.css`, blocket `/* BLING BLING` | Ska till `css/style.css`. Gäller provfiguren, närbilden, prisrutan och deldelarna. |

`export const BLING_PREVIEW = { drawNecklace, drawBag }` ritar närbilderna fristående. `tools/bling-ark.cjs` använder den för att rita ett ark med alla hängen och väskor.

## Anpassningar för Snabbfilen

1. **Importvägar:** `./sf/js/core/…` blir `../core/…` och `./sf/js/data/…` blir `../data/…`.
2. **Provfiguren:** använd accessoarbutikens egna `figure()` (rad ~1562) och `openBuy()` (rad ~1574) i stället för `klader/buy.js`. Då ser ateljén ut som resten av butiken. Behåll `bestDir`: ryggsäckar syns bäst bakifrån eller från sidan, halsband framifrån.
3. **Språk:** alla texter i `bling.js` är svenska literaler, både delarnas namn och dialogtexterna. De behöver gå genom `$t`/`$tf` och i18n-pipelinen (`docs/SPRAK.md`, `tools/i18n-*.mjs`). Text i pixeltypsnitt går genom `safeTxt`.
4. **Sparning:** Pixelskolan sparar designerna i skolans egen sparfil via ett `store = { list, add }` som skickas i `opts` (`skola.js`: `BLING_STORE`, högst 40 designer). I Snabbfilen räcker det att:
   - lägga till `this.designs = []` i Game-konstruktorn, eftersom `save()` sparar alla uppräkningsbara fält;
   - tvätta fältet vid `load`;
   - skicka `store = { list: () => g.designs, add: (d) => { g.designs.push(d); if (g.designs.length > 40) g.designs.shift(); g.save(); } }`.
5. **Köpet:** `buyDesign` drar pengarna direkt och lägger basmodellens id i `g.wardrobe`, så att figurskaparen låter modellen sitta kvar. I Snabbfilen kan det vara värt att också:
   - ge `g.glad(4, '', 'nytt', 10)`, som `buyWardrobe` gör;
   - låta REA-dagarna gälla (`clothesPrice` ×0,75).
6. **Priserna** är satta för Pixelskolan, där varje stjärna ger 100 kr:

   | | Prisintervall |
   |---|---|
   | Halsband | 20–750 kr |
   | Väska | 30–305 kr |
   | Katalogen som jämförelse | halsband med berlock 450 kr, pärlhalsband 1 200 kr, guldkedja 1 900 kr |

   Snabbfilens ekonomi kan behöva högre priser. Det beslutar Carl.
7. **Online:** `neckColor` och `bagColor` finns redan i `cleanLook`, så kompisar ser modellen och färgen. Hänget, stenen, mönstret och berlocken syns bara i ateljéns närbild.
8. **Mobilen:** menytexten ska vara i Pixelstad via `var(--f1..f4)`, och allt ska fungera på en iPhone 13 mini liggande. `.bl-*`-stilarna hanterar redan låga skärmar (`max-height: 520px`) och smala dialoger (`@container max-width: 760px`).
9. **Släpp** enligt Snabbfilens vanliga flöde: `tools/release.mjs`, sedan `verify.mjs`, sedan push. Kör därefter `node app/paket.mjs` för Pixelcity-appen. Bygg ut `tools/accessoarer-test.mjs` med ateljén.

## Kan bli bättre (förslag till steg 2)

På figuren syns i dag bara närmaste modell och färg. Snabbfilen kan få nya look-fält, till exempel `neckCharm`/`neckGem` och `bagPattern`/`bagCharm`. De behöver registreras och tvättas i `cleanLook` och ritas i `js/core/people/acc.js`. Exempel: hängets pixlar `h`/`o` i stenens färg, ett par mönsterpixlar på väskan och en berlockpixel. Då visar provfiguren exakt designen.

Pixelskolan hämtar sedan in det genom att kopiera `sf/` på nytt (`closure.py`).

## Prov (Pixelskolans repo)

Båda kräver en lokal server för repot, till exempel `python -m http.server 8824`.

- **`node tools/bling-prov.cjs [BASE] [desktop|iphone|ipad]`** provar butiken med riktiga klick:
  - fasaden och in genom dörren;
  - provdialogen (vrida, köpa);
  - halsbandsateljén (silverkedja + enhörning + ametist + 6 pärlor = 280 kr);
  - samma design igen, som ska bli gratis;
  - väskateljén (nalleryggsäck + guld + stjärnor + pompom = 255 kr);
  - handväskan i en provad färg och spegeln;
  - ut igen, där ett dubbeltryck inte får gå in igen;
  - att allt är sparat efter omladdning.

  Den skriver `bl-<enhet>-*.png`.
- **`node tools/bling-ark.cjs [BASE]`** skriver `bl-art.png` med alla hängen (utan sten, med ametist och med rubin) och väskmodellerna i olika färger och mönster.

---

## Tillägg 2026-10-12: DREAM LAND (pärla för pärla och strykmärken)

Pixelcity har redan BLING BLING som egen butik (`js/scenes/shop-bling.js`, v0.106.0). I Pixelskolan har Carl därefter bett om mer:

> *"Kan vi göra så att man själv får sätta märken som butiken Dream Land, döp om den till Dream Land och att man kan designa halsbandet pärla för pärla och sätta på iron on patches på väskan, eller sina vanliga kläder … ta inte bort det gamla, lägg bara till detta."*

Det är byggt och live i Pixelskolan (commit `bf108a1`). Om Carl vill ha samma sak i Pixelcity finns det här att porta.

**Nytt i butiken** (`bling.js`):
- **Pärlbaren** (`beadBarSprite`, plats `parlor`, `beadDesigner`/`buyBeads`, rad ~594–660):
  - Man väljer längd (12/16/20 pärlor) och tråd (genomskinlig 0, silver 30, guld 60 kr).
  - Sedan trär man pärla för pärla. Pärlan hamnar där markeringen blinkar, och man trycker på en plats i halsbandet för att byta just den pärlan.
  - Pärltyper: glas 5 kr, pärlemor och metall 10–15 kr, kristaller 20 kr, former 8–10 kr, bokstavspärlor A–Ö 6 kr.
  - Verktyg: Ta bort, Upprepa mönstret, Slumpa och Töm.
  - Sparas som design av typen `kind: 'beads'`. Namnet blir det första ordet i bokstavspärlor, till exempel "Pärlhalsband MIRA".
- **Strykbordet** (`ironSprite`, plats `stryk`, `patchDesigner`/`ironOn`/`areaArt`, rad ~660–750), som Dream Lands designverktyg:
  - Man väljer väskan, tröjan eller byxorna och trycker på ett märke. Märket hamnar på plagget och man drar det dit man vill ha det.
  - Det får plats högst 6 märken per plagg.
  - Nya märken kostar 10–40 kr. Märken som redan sitter fast kan man flytta och ta bort gratis.
  - Väskan ritas med `drawBag` (`BAG_BODY` = väskans yta). Tröjan och byxorna eller kjolen ritas med `garmentArt` i `dream.js`.
- **`dream.js`** (235 rader) innehåller:
  - 29 motiv i pixelkonst med kantsöm och kontur (`patchImg`);
  - ordmärken och bokstavs- och siffermärken;
  - kategorierna Bästsäljare, Crush, Djur, Godis, Natur & rymd, Glitter, Ord och ABC;
  - pärlorna (`drawBead`), pärlhalsbandet på bysten (`drawBeadNecklace`) och plaggbilderna.
  - Arket med alla märken ritas av `tools/dream-ark.cjs`.

**Figuren** (det som gör att det syns på karaktären) är två små tillägg i Snabbfilens egna filer. Pixelskolans kopior är redan ändrade:
- `js/core/people.js`:
  - `decorate(L, R, view, each, put)` anropas efter `hook('last')` i `render`, före konturen.
  - `look.patches` (`[{ a: 'top' | 'bottom' | 'bag', u, v, c: [färg, glans], p }]`) blir 2×2 pixlar på plaggets egna etiketterade pixlar. Tröjan och byxorna visas bara framifrån, väskan från alla håll.
  - `look.beads` (`['#rrggbb', …]`) färgar halsbandets pixlar i ordning från vänster, men bara när `neck === 'pearls'`.
- `js/core/avatar.js`: `cleanBeads`/`cleanPatches` i `cleanLook` gör att fälten sparas, överlever figurskaparen och följer med till kompisar online. De skickas bara med när de finns, så andra figurer påverkas inte.
- Ett annat halsband ur montrarna eller ateljén sätts med `beads: null`. Annars skulle catalog-pärlhalsbandet få pärlfärgerna.

**Gör Snabbfilen tilläggen i `people.js` och `avatar.js`** skrivs Pixelskolans kopior över utan problem nästa gång `sf/` kopieras om. Annars måste Pixelskolan föra in dem igen för hand. Det står i Pixelskolans README.

**Att tänka på:** "Dream Land" är också namnet på en riktig butik (drm-lnd.com, varumärket DRMZ). I App Store kan ett lånat butiksnamn ge problem med riktlinje 5.2, samma risk som med KBK-filmen. Fråga Carl innan namnet används i Pixelcity-appen. Ett alternativ är *DRÖMLAND*.

## Tillägg 2026-10-12, del 2: mobilskal, mössor och färg (commit `d5a8300`)

Carl bad i Pixelskolan om *"designa mobilskal, mössor olika sorter och att man kan byta färg på byxorna och tröjorna"*. Det är byggt och live där:

- **Mössor:** nio nya mössor ligger sist i `HAT_REG` i `js/core/people/acc.js`: `catBeanie`, `bearBeanie`, `frogBeanie`, `doublePom`, `docker`, `chullo`, `dinoBeanie`, `uniBeanie` och `cableBeanie`. Katalogposterna `hat-*beanie` med flera ligger sist bland hattarna i `js/data/wardrobe-acc.js`.
  - De använder bara `look.cap` och fasta färger, alltså inte `accent`, som hör till tröjan.
  - Det här är Snabbfilens egna filer, så posterna kan kopieras rakt in i Pixelcity. Accessoarbutiken visar då mössorna automatiskt, eftersom den ställer fram hela katalogen.
- **Mobilskal:** `drawPhone`, `CHARMS`/`charmImg`, `CASES` och `STRAPS` ligger i `dream.js`. Dialogen är `phoneDesigner`/`buyPhone` i `bling.js`.
  - Figuren får `look.mobil = [skal, berlock, berlock, mobilband]`. `decorate` i `people.js` ritar mobilen i handen när figuren står still framifrån, och `cleanMobil` i `avatar.js` sparar fältet.
- **Färg:** strykbordets dialog har färgval för tröjan (`shirt`), byxorna (`pants`, eller `shirt` för klänning) och väskan (`bagColor`). Det är gratis. Figurskaparen har samma val, men där är de lätta att missa.
- **Butiken** i Pixelskolan är nu 576 px bred med en kamera som följer figuren (`RW`, `camX` i `bling.js`).
