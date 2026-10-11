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
