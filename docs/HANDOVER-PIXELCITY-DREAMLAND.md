# Överlämning: det nya från Pixelskolans DREAM LAND → Pixelcitys BLING BLING

**Från:** Pixelskolan-sessionen, 2026-10-12 · **Till:** sessionen som jobbar med Snabbfilen/Pixelcity (`D:\GamesProjects\snabbfilen`)

**Läget:**
- **Pixelcity** har BLING BLING i Linnéstaden (`js/scenes/shop-bling.js`, v0.106.0, commit `5e64a4e`). Det är en port av Pixelskolans `bling.js` som den såg ut vid `f608efb`: montrarna, väskväggen, ateljén för halsband och väska, spegeln och provfiguren.
- **Pixelskolan** har sedan dess byggt fem saker till (commits `bf108a1` och `d5a8300`, live på https://8bitcat.github.io/pixelskolan, plan 1 i gallerian).

Den här filen beskriver allt som behövs för att få samma saker i Pixelcity. Den ersätter de två tilläggen i `HANDOVER-PIXELCITY-BLING.md`. Radnumren gäller Pixelskolans `main` vid commit `4577c41`.

## Vad Carl har bett om (i Pixelskolan)

1. *"Kan vi göra så att man själv får sätta märken som butiken Dream Land, döp om den till Dream Land och att man kan designa halsbandet pärla för pärla och sätta på iron on patches på väskan, eller sina vanliga kläder … ta inte bort det gamla, lägg bara till detta."*
2. *"Lägg till så man kan designa mobilskal, kan du också lägga till mössor olika sorter och att man kan byta färg på byxorna och tröjorna."*
3. Hela tiden gäller: *"man ser hur den blir direkt på karaktären … på samma sätt som man kan se andra kläder på."*

Han har sedan bett om en överlämning till Pixelcity.

## Fråga Carl innan du börjar

1. **Namnet.** *(Uppdatering 2026-10-12: Carl döpte om Pixelskolans butik till **DRÖMLAND** – riktiga butiksnamn ska inte in i apparna.)* Butiken hette en stund DREAM LAND. Det är också namnet på en riktig butik (drm-lnd.com, varumärket DRMZ), och i App Store kan det ge problem med riktlinje 5.2. Det är samma risk som med KBK-filmens varumärken.
   - Förslag: behåll BLING BLING i Pixelcity, eller välj *DRÖMLAND*.
   - Lägg bara in de nya delarna och byt inte namn utan klartecken.
2. **Priserna.** Förra gången dubblade Carl Pixelskolans priser. Förslag: gör likadant med pärlor, strykmärken, berlocker, skal och band, alltså ×2 mot tabellerna här nedan. Mössorna är vanliga katalogvaror (140–220 kr, samma nivå som spelets andra mössor) och kan stå kvar.
3. **Ett förslag bara för Pixelcity:** spelet har en egen mobil nere till höger (`mobilen.js`). Det egna mobilskalet skulle kunna synas där också, inte bara i figurens hand. Fråga om Carl vill det.

## De fem delarna

| # | Del | Källa i Pixelskolan | Dit i Pixelcity |
|---|---|---|---|
| 1 | **Figuren** ritar strykmärken, egna pärlor och mobilen i handen | `sf/js/core/people.js` rad 655 (anropet) och 683–717 (`PATCH_TAGS`, `decorate`); `sf/js/core/avatar.js` rad 80–94 och 130 | `js/core/people.js`, `js/core/avatar.js` |
| 2 | **Nio nya mössor** | `sf/js/core/people/acc.js` rad 356–396; `sf/js/data/wardrobe-acc.js` rad 54–63 | samma två filer |
| 3 | **Pärlbaren**, halsband pärla för pärla | `bling.js` rad 386 (`beadBarSprite`) och 634–705 (`BST`, `beadDesigner`, `buyBeads`); `dream.js` rad 166–235 | `shop-bling.js` och en ny modul |
| 4 | **Strykbordet med färg**: strykmärken på väskan, tröjan och byxorna, och gratis färgbyte | `bling.js` rad 400 (`ironSprite`) och 707–805 (`BAG_MODEL`, `areaArt`, `colKey`, `patchState`, `patchDesigner`, `ironOn`); `dream.js` rad 15–160 | samma |
| 5 | **Mobilskal och mössvägg** i en bredare butik | `bling.js` rad 32 (`RW = 576`), 232– (`paintBG`: mössväggen och hålplattan), 414 (`arrowSignSprite`), 428–440 (mössorna på hyllorna), 463–468 (platserna), 499 och 893 (kameran), 806–890 (`PH`, `phoneDesigner`, `buyPhone`); `dream.js` rad 238–358 | samma |

Alla delarna syns på figuren och i provfiguren "Du nu ➜ Med …", som går att vrida. De använder `stageHtml`/`stage`/`bestDir`, som Pixelcity redan har från förra porten.

## Arbetsordning

### Steg 1: figuren (`js/core/people.js`, `js/core/avatar.js`)

**`people.js`:**
- Kopiera `PATCH_TAGS` och `function decorate(L, R, view, each, put)` till platsen före `function spriteFor`.
- Lägg in `decorate(L, R, view, each, put);` i `render` direkt efter `hook('last');`, före konturen.
- `decorate` använder `TAG`, `toInt`, `mul`, `SW` och `SH`, som filen redan importerar. Från `R` använder den `tw`, `torsoTop`, `armLen`, `sit`, `carry`, `eat`, `walkA`, `walkB` och `skin`, som redan finns där.

**`avatar.js`:**
- Kopiera `cleanBeads`, `cleanMobil`, `PATCH_AREAS`, `num01` och `cleanPatches`. De står före `cleanLook` och behöver `col`.
- Lägg till `...cleanBeads(L.beads), ...cleanPatches(L.patches), ...cleanMobil(L.mobil),` sist i det `cleanLook` returnerar.
- Fälten skickas bara med när de finns, så alla andra figurer blir pixel för pixel som förut. Kör ändå `tools/people-regress.mjs`.

**Det här gör fälten:**

| Fält | Värde | Hur det ritas |
|---|---|---|
| `look.beads` | `['#rrggbb', …]`, högst 32 | Färgar halsbandets pixlar i ordning från vänster, men bara när `neck === 'pearls'`. |
| `look.patches` | `[{ a: 'top' \| 'bottom' \| 'bag', u, v, c: [färg, glans], p: id }]`, högst 18 | Varje märke blir 2×2 pixlar på plaggets egna pixlar: `TAG.torso`/`TAG.top`, `TAG.pants` eller `TAG.bag`. `u` och `v` (0–1) räknas inom plaggets yta. Tröjan och byxorna syns bara framifrån, väskan från alla håll. |
| `look.mobil` | `[skal, berlock, berlock, mobilband \| null]` | En mobil på 3×4 pixlar i figurens vänstra hand (till höger i bild), bara framifrån när figuren står still. När den går ligger mobilen "i fickan". |

**Online:** `world.js` kör kompisarnas figurer genom `cleanAvatar`, så de ser märkena, pärlorna och mobilen. Äldre appversioner tappar fälten utan att något går sönder. Med 18 märken blir figuren cirka 1–1,5 kB större.

### Steg 2: mössorna (`js/core/people/acc.js`, `js/data/wardrobe-acc.js`)

- Kopiera de nio posterna rakt in sist i `HAT_REG`, efter `unicorn`: `catBeanie`, `bearBeanie`, `frogBeanie`, `doublePom`, `docker`, `chullo`, `dinoBeanie`, `uniBeanie` och `cableBeanie`. Mallarna använder `hatT`, `capPal` och `FIX`, som är identiska i båda spelen.
- **Mössorna använder bara `look.cap` och fasta färger, aldrig `accent`.** Accent hör till tröjans detaljer, och en mössa som satte accent skulle byta färg på tröjans krage.
- Kopiera de nio katalogposterna (`hat-catbeanie` … `hat-cablebeanie`, 140–220 kr) sist bland hattarna. Namnen har mjuka bindestreck (`Katt\u00admössa`), så att de bryts snyggt i korten.
- Accessoarbutiken ställer fram hela katalogen och visar därför mössorna direkt. Lägg in namnen och etiketterna i i18n-pipelinen.

### Steg 3: `dream.js` som egen modul

Pixelskolans `dream.js` (358 rader) har bara bilder och sortiment, inga dialoger. Lägg den till exempel som `js/scenes/bling/dream.js`.

- Byt importen `./sf/js/core/floor-pix.js` mot rätt relativa väg.
- **Språket:** alla namn ska gå genom `$t`: kategorierna, märkena, pärlorna, berlockerna, skalen och banden. Orden *på* märkena och berlockerna (LOVE, BFF, QUEEN, WOW, COOL, GIRL) är bilder och kan vara kvar på engelska.
- Innehåll:

  | Område | Vad som finns |
  |---|---|
  | Märken | 25 motiv i `MOTIF`, fyra glittervarianter, sex ordmärken och 39 bokstavs- och siffermärken. `patchImg` ger märket med kantsöm, kontur och, för glittermärken, paljetter. `patchColors` ger märkets två färger på figuren. |
  | Plagg | `garmentArt('top' \| 'bottom', look)` ritar tröjan eller byxorna och kjolen i figurens färger, 96×72 med `zone`. |
  | Pärlor | `BEADS` med kategorierna glas, pärlemor och metall, kristaller, former och bokstavspärlor A–Ö. `drawBead`, `drawBeadNecklace(st, sel, blink)` (128×88 med `slots` för klick), `LENGTHS` och `TRAD`. |
  | Berlocker | `CHARMS` med glitterstenar, figurer (pixeldino, rymdvarelse, spöke, groda och märkenas motiv), crush, godis, natur och rymd, tjocka 3D-bokstäver och siffror. `charmImg` (emaljblank med kontur och skugga), `charmColor`. |
  | Mobilskal | `CASES` (sju skal), `STRAPS` (fem band) och `drawPhone(st)` (80×136 med `zone`). |

- Granska konsten: Pixelskolans `tools/dream-ark.cjs` ritar ett ark med alla märken, pärlor, plagg och pärlhalsband.

### Steg 4: pärlbaren (`shop-bling.js`)

- **Möbeln:** `beadBarSprite` (68×30) står i Pixelskolan mitt på mattan (`x 158, fy 170`), med två puffar bredvid. Plats `parlor` med `go [192, 182]`.
- **Dialogen** (`beadDesigner`):
  - Man väljer längd (12/16/20 platser) och tråd.
  - En pärla träs på där markeringen blinkar, och sedan hoppar markeringen till nästa tomma plats. Trycker man på halsbandet väljer man vilken plats som ska bytas.
  - Verktyg: Ta bort, Upprepa mönstret, Slumpa och Töm.
  - Det går att köpa från 3 pärlor.
  - Samma design en gång till blir gratis: "Ta på – det är redan ditt".
- **Priser i Pixelskolan:**

  | Del | Pris |
  |---|---|
  | Tråd | genomskinlig 0, silver 30, guld 60 kr |
  | Glaspärla | 5 kr |
  | Pärla | 10 kr |
  | Guld | 15 kr |
  | Silver | 12 kr |
  | Kristall | 20 kr |
  | Former | 8–10 kr |
  | Bokstavspärla | 6 kr |

- **Köpet:** `{ neck: 'pearls', beads: [färger] }` sätts på figuren. `neck-pearls` läggs i `g.wardrobe`, annars tar figurskaparen bort halsbandet. Designen sparas som `kind: 'beads'`. Namnet är det första ordet i bokstavspärlor, till exempel "Pärlhalsband MIRA" (`beadWord`).
- **Viktigt:** när man tar på ett *annat* halsband ska `beads: null` sättas, annars får katalogens pärlhalsband pärlfärgerna. Pixelskolan gör det på fyra ställen:
  - montrarnas kort, där `it2` är en kopia av varan med `look.beads: null` som skickas till `openBuy`;
  - ateljéns köp och "Ta på";
  - spegelns knappar för det man köpt;
  - spegelns knappar för egna designer.

### Steg 5: strykbordet och färgen (`shop-bling.js`)

- **Möbeln:** `ironSprite` (70×34, med strykjärn, märken och skylten STRYKMÄRKEN) står längst ner till höger (`x 304, fy 212`). Plats `stryk` med `go [338, 178]` och `face: 'down'`.
- **Dialogen** "Strykmärken och färg" (`patchDesigner(fresh, startArea)`):
  - Man väljer väskan, tröjan eller byxorna.
  - Färgvalet ligger överst. Det är gratis och ändrar `shirt`, `pants` (eller `shirt` för klänning, se `colKey`) eller `bagColor`.
  - Man trycker på ett märke så hamnar det på plagget, och sedan drar man det. Det är pekhändelser på canvasen med `touch-action: none`.
  - Det får plats högst 6 märken per plagg.
  - Nya märken kostar, medan det är gratis att flytta och ta bort märken som redan sitter fast.
  - Väskan ritas med den befintliga `drawBag` med `{ modell, color: look.bagColor }`. `BAG_BODY` (väskans yta) bröts ut ur `drawBag`, och `drawBag` tar nu emot `sel.color`. `BAG_MODEL` översätter figurens väskor till de sex modellerna. Gitarr, vingar och jetpack får inga märken.
- **Priser i Pixelskolan:** märken 10–40 kr (glitter 40, ord 25, bokstäver 10).
- **Spegeln** har knappen "🎨 Byt färg på kläderna", som öppnar `patchDesigner(true, 'top')`.

### Steg 6: mobilskal, mössvägg och bredare butik (`shop-bling.js`)

- **Bredden:** Pixelskolans butik är 576 px (`RW`) med en kamera som följer figuren:
  - `camX` glider mot `me.x − 192`, och draw sätter `setTransform(…, −camX·pxs, 0)`;
  - `down` och `move` lägger till `camX`;
  - bubblorna och etiketterna begränsas till bilden.
  - Pixelcity har redan en bredare butik med kamera: accessoarbutiken (`cam.x`, `VW`, `lockCam`). Följ det mönstret om det passar bättre. `get worldX`/`worldY` finns redan, eftersom telefonen följer figuren i höjdled.
- **Mössväggen:** hyllor i `paintBG` vid `x 392–474`. Mössorna på hyllorna är spelets figurer (`personSprite` med en skyltdocka, `style: 'bald'`), beskurna till huvudet, rad 428–440. Plats `mossor` öppnar `catalog('mossor')` med de nio nya mössorna och några gamla.
- **Mobilskalshörnan:** en hålplatta med skal på krokar vid `x 486–572` och bordet `tableSprite('phone')` med "DESIGNA MOBILSKAL" vid `x 470, fy 214`. `arrowSignSprite` mitt i butiken visar vägen.
- **Dialogen** (`phoneDesigner`):

  | Del | Pris i Pixelskolan |
  |---|---|
  | Skal | 60 kr (glitter 80) |
  | Band | 0–60 kr |
  | Berlocker | 10–20 kr styck, högst 10, dras dit som märkena |

  Glitterstenarna gnistrar i dialogen.
- **Köpet:** `look.mobil` sätts på figuren och designen sparas som `kind: 'phone'` med `key` (skal, band och berlocker med avrundade lägen), så att samma skal blir gratis att ta fram igen. Spegeln har "📱 Lägg mobilen i fickan" (`mobil: null`).

### Steg 7: sparfilen (`js/game.js`)

Pixelcitys inläsning av `g.designs` släpper bara igenom `kind: 'neck' | 'bag'`. Den tillåter bara enkla `sel`-värden (`/^[a-z0-9]{1,12}$/`) och bara `look`-nycklarna `neck`, `neckColor`, `bag` och `bagColor`. Bygg ut den:

| Typ | Format |
|---|---|
| `kind: 'beads'` | `sel: { len, trad, beads: [id \| null] }` (högst 20, id `/^[a-z0-9-]{1,24}$/`, till exempel `g-rosa`, `b-12`); `look: { neck: 'pearls', beads: [hex] }` |
| `kind: 'phone'` | `key` (sträng); `sel: { case, strap, charms: [{ id, u, v }] }` (högst 10, `u` och `v` 0–1); `look: { mobil: [hex \| null ×4] }` |

Pixelcity bygger designernas namn på spelarens språk när de visas. Gör likadant för pärlhalsbanden (ordet i bokstavspärlor) och mobilskalen (skalets namn plus antal berlocker).

### Steg 8: stilar, språk, prov och släpp

- **CSS:** blocket i Pixelskolans `plan.html` rad 202–258 (samma regler finns i `skola.css`) ska till `css/style.css`. Det gäller `.bl-wide`, `.bl-design` (rutnät i tre spalter), `.dl-canvas`, `.dl-tools`, `.dl-areas`, `.dl-cats`, `.dl-grid`, `.dl-patch`, `.dl-bead`, `.dl-beads`, `.dl-sws`, `.dl-sw` och `.dl-phone`, med reglerna för låga skärmar (`max-height: 520px`) och smala dialoger (`@container max-width: 760px`). Följ Snabbfilens regel att menytexten bara är Pixelstad via `var(--f1..f4)`, och prova på en iPhone 13 mini liggande.
- **Språk:** nästa i18n-paket (21). Glöm inte toast-texterna och expeditens repliker.
- **Prov:** bygg ut `tools/bling-test.mjs` med flödena i Pixelskolans `tools/dream-prov.cjs` och `tools/mobil-prov.cjs`.
  - **Klicka i butikens koordinater med kameran inräknad, och gå först dit när platsen ligger utanför bild** (se `clickS` i Pixelskolans prov). Annars slår proven fel så fort butiken är bredare än bilden.
  - Väntade värden i Pixelskolan (×1-priser):

    | Flöde | Pris |
    |---|---|
    | Pärlhalsbandet MIRA (M, I, R, A, rosa, lila, ljusblå, rött hjärta, upprepat till 16) | 94 kr |
    | Hjärta och LOVE på tröjan | 45 kr |
    | Regnbåge, bokstaven M och guldstjärna på ryggsäcken | 80 kr |
    | Mobilskal: mintgrönt, regnbågsband, dino, rosa diamant och M | 150 kr |

- **Släpp:** `tools/release.mjs`, sedan `verify.mjs` (`bling-test` ligger i `ALWAYS`), push och `node app/paket.mjs`.

## Misstag som redan är gjorda och rättade

- **Pärlhalsbandet** hängde först utanför halsen och för brant, så att namnet hamnade längs sidan. Nu är det en flack båge från axellinjen (`y0 = 42`), och pärlorna skjuts ihop när det blir trångt.
- **Bokstavspärlorna** är 7 px breda, eftersom M och W är 5 px i SMALL.
- **Strykbordets bild:** att rita på `P.ctx` före `P.flush()` skrivs över av `putImageData`. Rita efter flush.
- **Mössornas namn** bröts mitt i ordet ("Öronlappsm-össa") tills de fick mjuka bindestreck.
- **Väskans märken** blir stora mot den lilla väskytan. Därför är det högst 6 per plagg.

## Pixelskolans filer

- `bling.js`: butiken (scenen, dialogerna).
- `dream.js`: bilderna och sortimenten.
- `smabutiker.js` (`UNITS.bling`): fasaden i gallerian.
- `skola.js`: `BLING_STORE` (designerna sparas i skolans sparfil, typerna `neck`, `bag`, `beads` och `phone`).
- `sf/js/core/people.js`, `sf/js/core/avatar.js`, `sf/js/core/people/acc.js`, `sf/js/data/wardrobe-acc.js`: kopior av Snabbfilens filer med tilläggen ovan. Gör Pixelcity samma tillägg kan Pixelskolan kopiera `sf/` på nytt utan att något försvinner.
- `tools/bling-prov.cjs`, `tools/dream-prov.cjs`, `tools/mobil-prov.cjs`, `tools/bling-ark.cjs`, `tools/dream-ark.cjs`: proven och arken. De kräver en lokal server för repot, till exempel `python -m http.server 8824`.
