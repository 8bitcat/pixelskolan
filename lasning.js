// Läsförståelse med längre texter (Carl 2026-10-29: "ännu mer läsförståelse med flera meningar och stycken och att man
// sen får frågor om det"). En lektion = en text i flera stycken (berättelse, faktatext, recept, brev, inbjudan, annons …)
// och fem frågor om den. Texten läses i boken som öppnas när lektionen börjar (📖 Texten öppnar den igen); frågorna står
// på tavlan. Frågorna säger vilket stycke svaret står i, och vissa kräver att man läser mellan raderna.
// Text: { id, title, kind, paras: [stycke …], qs: [[fråga, rätt, [fel, fel], stycke (0 = hela texten), mellanRaderna?]] }
// {A} och {B} = två klasskompisar, {T} = läraren, {P} = du, {A:s} = genitiv (Alvas, Elias). Är svaret ett tal skrivs det
// med siffror. Klasskompisarna får aldrig han/hon (namnen väljer man själv) – bara figurerna i texterna har det.
import { pick, shuffle, textOpts, cap, ctx } from './uppgifter.js';

export const TEXTER2 = {
  berattelser: [
    { id: 'nallen', title: 'Nallen som försvann', kind: 'Berättelse', paras: [
      '{A} har en brun nalle som heter Knopp. Knopp har en röd rosett runt halsen och ett öra som är lite trasigt. {A} tar med Knopp överallt.',
      'En dag är {A} och {B} i parken. De gungar, klättrar och leker i sandlådan. När det är dags att gå hem är Knopp borta! {A} blir ledsen och börjar gråta.',
      '{B} letar under bänken och bakom rutschkanan. Till slut syns något rött i sandlådan. Där ligger Knopp, full av sand! {A} kramar nallen och säger tack till {B}.'],
    qs: [['Vad heter nallen?', 'Knopp', ['Bamse', 'Nalle'], 1], ['Vilken färg har rosetten?', 'Röd', ['Blå', 'Gul'], 1], ['Var leker {A} och {B}?', 'I parken', ['I skolan', 'Hemma'], 2],
      ['Hur känner sig {A} när nallen är borta?', 'Ledsen', ['Glad', 'Arg'], 2], ['Var hittar {B} nallen?', 'I sandlådan', ['Under bänken', 'Bakom rutschkanan'], 3],
      ['Vad är det röda som syns i sandlådan?', 'Rosetten', ['En spade', 'En boll'], 3, 1], ['Varför säger {A} tack till {B}?', '{B} hittade nallen', ['{B} gav {A} en glass', '{B} gick hem'], 3, 1]] },
    { id: 'snogubben', title: 'Snögubben', kind: 'Berättelse', paras: [
      'I natt har det snöat. Hela skolgården är vit. På rasten springer {A} och {B} ut med vantar och mössor på.',
      'De rullar tre snöbollar: en stor, en mellanstor och en liten. Den lilla blir huvudet. {B} hämtar två stenar till ögon, och {A} sätter dit en morot som näsa.',
      'Nästa dag skiner solen och det blir varmt. Snögubben blir mindre och mindre. Till slut ligger bara moroten och stenarna kvar på marken.'],
    qs: [['Vad har hänt i natt?', 'Det har snöat', ['Det har regnat', 'Det har blåst'], 1], ['Hur många snöbollar rullar de?', '3', [], 2], ['Vad blir snögubbens näsa?', 'En morot', ['En sten', 'En pinne'], 2],
      ['Vad använder de till ögon?', 'Stenar', ['Knappar', 'Morötter'], 2], ['Varför blir snögubben mindre?', 'Solen smälter den', ['Någon tar snön', 'Det snöar mer'], 3, 1],
      ['Vilken årstid är det?', 'Vinter', ['Sommar', 'Höst'], 1, 1], ['Vad ligger kvar på marken till slut?', 'Moroten och stenarna', ['Vantarna', 'Mössorna'], 3]] },
    { id: 'kalaset', title: 'Kalaset', kind: 'Berättelse', paras: [
      '{B} fyller åtta år och har kalas på lördag. Klockan två kommer kompisarna. {A} har med sig ett paket med randigt papper.',
      'Först leker alla fiskdamm och tittar på en film. Sedan bär {B:s} pappa in en tårta med jordgubbar och åtta ljus. Alla sjunger ja må du leva.',
      '{B} blåser ut alla ljusen på en gång. I paketet från {A} ligger en bok om dinosaurier. {B} blir jätteglad, för dinosaurier är det bästa som finns.'],
    qs: [['Hur gammal blir {B}?', '8', [], 1], ['Vilken dag är kalaset?', 'Lördag', ['Fredag', 'Söndag'], 1], ['Vad leker de först?', 'Fiskdamm', ['Kurragömma', 'Fotboll'], 2],
      ['Vad finns på tårtan?', 'Jordgubbar', ['Choklad', 'Bananer'], 2], ['Vad ligger i paketet?', 'En bok om dinosaurier', ['En boll', 'Ett spel'], 3],
      ['Varför blir {B} så glad för boken?', '{B} älskar dinosaurier', ['Boken är stor', 'Pappret är randigt'], 3, 1], ['Hur många ljus är det på tårtan?', '8', [], 2]] },
    { id: 'valpen', title: 'Valpen Sixten', kind: 'Berättelse', paras: [
      '{A:s} familj har fått en valp. Han heter Sixten och är liten, svart och lurvig. Sixten har stora öron och en svans som aldrig står still.',
      'Första natten piper Sixten i sin korg. Han saknar sin mamma. {A} lägger sin gamla tröja i korgen. Då somnar Sixten direkt.',
      'Dagen efter tuggar Sixten sönder pappas toffel. {A} skrattar, men pappa suckar. Nu ska {A} lära Sixten att sitta och att bara tugga på sitt eget tuggben.'],
    qs: [['Vad heter valpen?', 'Sixten', ['Bamse', 'Knopp'], 1], ['Vilken färg har valpen?', 'Svart', ['Brun', 'Vit'], 1], ['Varför piper Sixten första natten?', 'Han saknar sin mamma', ['Han är hungrig', 'Han är arg'], 2],
      ['Vad lägger {A} i korgen?', 'En gammal tröja', ['En boll', 'En filt'], 2], ['Varför somnar Sixten när tröjan ligger där?', 'Han känner sig trygg', ['Han blir rädd', 'Han vill leka'], 2, 1],
      ['Vad tuggar Sixten sönder?', 'Pappas toffel', ['En sko', 'Ett tuggben'], 3], ['Vad ska {A} lära Sixten?', 'Att sitta', ['Att simma', 'Att skälla'], 3]] },
    { id: 'utflykten', title: 'Utflykten till skogen', kind: 'Berättelse', paras: [
      'En fredag går hela klassen till skogen med {T}. Alla har en ryggsäck med matsäck, och {A} har med sig ett förstoringsglas.',
      'Vid en stor sten hittar klassen en myrstack. Myrorna springer fram och tillbaka och bär barr och pinnar. {A} tittar på dem genom förstoringsglaset. De är mycket starkare än de ser ut.',
      'Sedan sätter sig alla på en filt och äter smörgåsar och dricker saft. Plötsligt börjar det regna. Alla skrattar och springer in under en stor gran tills regnet slutar.'],
    qs: [['Vilken dag går klassen till skogen?', 'Fredag', ['Måndag', 'Söndag'], 1], ['Vad har {A} med sig?', 'Ett förstoringsglas', ['En kikare', 'En boll'], 1], ['Vad hittar klassen vid stenen?', 'En myrstack', ['Ett fågelbo', 'En svamp'], 2],
      ['Vad bär myrorna?', 'Barr och pinnar', ['Bär och svamp', 'Stenar'], 2], ['Vad äter alla?', 'Smörgåsar', ['Korv', 'Glass'], 3],
      ['Varför springer alla in under granen?', 'Det börjar regna', ['Det blir mörkt', 'En myra biter'], 3, 1], ['Vad dricker de?', 'Saft', ['Mjölk', 'Vatten'], 3]] },
    { id: 'hejaklacken', title: 'Hejaklacken', kind: 'Berättelse', paras: [
      'På söndag spelar {B:s} fotbollslag match. {A} vill heja på riktigt och går till butiken HEJA HEJA i Galleria Stjärnan.',
      'I butiken finns dräkter med hjärtan, stjärnor och blixtar. {A} köper rosa pompomer och en rosett till håret. Pompomerna kostar 149 kronor.',
      'På matchen ropar {A} "Heja, heja!" och viftar med pompomerna. {B} gör mål i sista minuten. Laget vinner med 2–1, och {B} vinkar till {A} på läktaren.'],
    qs: [['Vilken dag är matchen?', 'Söndag', ['Lördag', 'Fredag'], 1], ['Vad heter butiken?', 'HEJA HEJA', ['DRÖMLAND', 'Leksakslådan'], 1], ['Vilken färg har pompomerna?', 'Rosa', ['Blå', 'Gul'], 2],
      ['Hur många kronor kostar pompomerna?', '149', [], 2], ['Vad gör {A} på matchen?', 'Hejar med pompomerna', ['Spelar fotboll', 'Säljer glass'], 3],
      ['Vem gör mål?', '{B}', ['{A}', 'Domaren'], 3], ['Hur går matchen för laget?', 'Laget vinner', ['Laget förlorar', 'Det blir oavgjort'], 3]] },
  ],
  fakta: [
    { id: 'igelkotten', title: 'Igelkotten', kind: 'Faktatext', paras: [
      'Igelkotten är ett litet djur med taggar på ryggen. En vuxen igelkott har tusentals taggar. När den blir rädd rullar den ihop sig till en taggig boll.',
      'Igelkotten är vaken på natten och sover på dagen. Den äter maskar, sniglar och skalbaggar. Ge aldrig en igelkott mjölk, för den får ont i magen av det. Vatten är bättre.',
      'När det blir kallt på hösten bygger igelkotten ett bo av löv. Där sover den hela vintern. På våren vaknar den igen och är jättehungrig.'],
    qs: [['Vad har igelkotten på ryggen?', 'Taggar', ['Fjädrar', 'Fjäll'], 1], ['Vad gör igelkotten när den blir rädd?', 'Rullar ihop sig', ['Springer fort', 'Klättrar upp i ett träd'], 1],
      ['När är igelkotten vaken?', 'På natten', ['På dagen', 'Bara på vintern'], 2], ['Vad äter igelkotten?', 'Maskar och sniglar', ['Gräs och blommor', 'Fisk'], 2],
      ['Varför ska man inte ge igelkotten mjölk?', 'Den får ont i magen', ['Den blir för stor', 'Den tycker inte om vitt'], 2], ['Vad bygger igelkotten sitt bo av?', 'Löv', ['Stenar', 'Snö'], 3],
      ['Vad gör igelkotten på vintern?', 'Sover', ['Simmar', 'Flyttar söderut'], 3], ['Vad handlar texten mest om?', 'Hur igelkotten lever', ['Hur man bygger ett bo', 'Vad man äter på hösten'], 0, 1]] },
    { id: 'bina', title: 'Bina', kind: 'Faktatext', paras: [
      'Honungsbin bor tillsammans i en bikupa. I en bikupa kan det bo tusentals bin. Där finns en drottning som lägger alla ägg.',
      'Arbetsbina flyger från blomma till blomma. De suger upp söt nektar och samlar pollen. Av nektarn gör bina honung.',
      'När ett bi hittar många blommor flyger det hem och dansar. Dansen visar de andra bina åt vilket håll blommorna finns. Bina hjälper också blommorna att bli frukt och bär.'],
    qs: [['Vad kallas binas bo?', 'Bikupa', ['Myrstack', 'Grotta'], 1], ['Vem lägger äggen?', 'Drottningen', ['Arbetsbina', 'Alla bin'], 1], ['Vad gör bina honung av?', 'Nektar', ['Vatten', 'Löv'], 2],
      ['Vad samlar arbetsbina från blommorna?', 'Nektar och pollen', ['Frön och blad', 'Sand'], 2], ['Varför dansar biet?', 'För att visa var blommorna finns', ['För att det är glatt', 'För att hålla värmen'], 3],
      ['Hur hjälper bina blommorna?', 'De kan bli frukt och bär', ['Bina vattnar dem', 'Bina plockar dem'], 3]] },
    { id: 'ekorren', title: 'Ekorren', kind: 'Faktatext', paras: [
      'Ekorren är ett litet djur med röd eller brun päls och en lång, yvig svans. Den har vassa klor och är mycket bra på att klättra i träd.',
      'Ekorren äter frön från kottar, nötter, bär och svamp. På hösten gömmer den mat på många ställen i skogen. Då har den mat när det kommer snö.',
      'Ekorren glömmer bort en del av sina gömmor. Där kan nötterna börja gro, och efter många år blir det nya träd. Svansen använder ekorren för att hålla balansen och som en filt när den sover.'],
    qs: [['Hur ser ekorrens svans ut?', 'Lång och yvig', ['Kort och tunn', 'Randig'], 1], ['Vad är ekorren bra på?', 'Att klättra', ['Att simma', 'Att gräva'], 1], ['Vad gör ekorren på hösten?', 'Gömmer mat', ['Sover', 'Flyttar'], 2],
      ['Varför gömmer ekorren mat?', 'För att ha mat på vintern', ['För att leka', 'För att ge bort den'], 2], ['Vad kan hända med nötter som ekorren glömmer?', 'De blir nya träd', ['De blir till sten', 'Fåglarna tar dem'], 3],
      ['Vad använder ekorren svansen till?', 'Balans och som filt', ['Att simma med', 'Att äta med'], 3]] },
    { id: 'solen', title: 'Solen och månen', kind: 'Faktatext', paras: [
      'Solen är en stjärna. Den är jättestor och mycket varm. Solen ger oss ljus och värme, och utan den skulle ingenting kunna växa.',
      'Jorden snurrar runt sig själv ett varv varje dygn. När vår sida av jorden är vänd mot solen är det dag. När den är vänd bort från solen är det natt.',
      'Månen lyser inte själv. Den lyser för att solen skiner på den. Månen går runt jorden, och ett varv tar ungefär en månad. Titta aldrig rakt in i solen, för det är farligt för ögonen.'],
    qs: [['Vad är solen?', 'En stjärna', ['En planet', 'En måne'], 1], ['Vad ger solen oss?', 'Ljus och värme', ['Regn och snö', 'Vind'], 1],
      ['Hur lång tid tar det för jorden att snurra ett varv runt sig själv?', 'Ett dygn', ['En vecka', 'Ett år'], 2], ['När är det natt?', 'När vår sida är vänd bort från solen', ['När solen slocknar', 'När månen täcker solen'], 2],
      ['Varför lyser månen?', 'Solen skiner på den', ['Den brinner', 'Det finns lampor på den'], 3], ['Varför ska man inte titta rakt in i solen?', 'Det är farligt för ögonen', ['Solen blir arg', 'Då blir det natt'], 3]] },
    { id: 'tanderna', title: 'Tänderna', kind: 'Faktatext', paras: [
      'Ett litet barn har 20 mjölktänder. När man är ungefär sex år börjar mjölktänderna lossna. Då växer nya, starkare tänder fram. De ska man ha resten av livet.',
      'På tänderna lever små bakterier. När vi äter godis och dricker läsk får bakterierna socker. Då gör de syra som kan göra hål i tänderna.',
      'Därför ska man borsta tänderna morgon och kväll, i två minuter varje gång. Använd tandkräm med fluor. Fluor gör tänderna starkare.'],
    qs: [['Hur många mjölktänder har ett litet barn?', '20', [], 1], ['Hur gammal är man när mjölktänderna börjar lossna?', 'Ungefär sex år', ['Ett år', 'Tolv år'], 1],
      ['Vad gör bakterierna när de får socker?', 'Gör syra', ['Somnar', 'Försvinner'], 2], ['Hur många gånger om dagen ska man borsta tänderna?', '2', [], 3],
      ['Hur länge ska man borsta varje gång?', 'Två minuter', ['Tio sekunder', 'En timme'], 3], ['Vad gör fluor?', 'Gör tänderna starkare', ['Gör tänderna vita', 'Gör godiset gott'], 3]] },
  ],
  texter: [
    { id: 'inbjudan', title: 'Inbjudan till kalas', kind: 'Inbjudan', paras: [
      'Hej {A}! Du är bjuden på kalas hos mig, {B}. Jag fyller åtta år!',
      'Kalaset är på lördag den 14 maj klockan 14.00–17.00. Vi ses hemma hos mig på Solgatan 5.',
      'Det blir piratkalas, så kom gärna utklädd till pirat. Ta med badkläder, för vi ska bada i poolen. Svara senast på onsdag om du kan komma. Hälsningar {B}'],
    qs: [['Vem har kalas?', '{B}', ['{A}', '{T}'], 1], ['Vilken dag är kalaset?', 'Lördag', ['Söndag', 'Onsdag'], 2], ['Hur dags börjar kalaset?', 'Klockan 14.00', ['Klockan 17.00', 'Klockan 12.00'], 2],
      ['Vilket nummer har huset på Solgatan?', '5', [], 2], ['Vad ska man klä ut sig till?', 'Pirat', ['Prinsessa', 'Spöke'], 3], ['Varför ska man ta med badkläder?', 'De ska bada i poolen', ['Det ska regna', 'De ska åka till havet'], 3],
      ['När ska man svara senast?', 'På onsdag', ['På lördag', 'På fredag'], 3], ['Hur många timmar håller kalaset på?', '3', [], 2, 1]] },
    { id: 'fruktsallad', title: 'Så gör du en fruktsallad', kind: 'Recept', paras: [
      'Du behöver: 1 banan, 1 äpple, 10 vindruvor, 1 apelsin och en skål. Be en vuxen om hjälp med kniven.',
      '1. Tvätta äpplet och vindruvorna. 2. Skala bananen och apelsinen. 3. Skär all frukt i små bitar på en skärbräda.',
      '4. Lägg frukten i skålen och rör om försiktigt. 5. Ställ skålen i kylen en stund. Nu är fruktsalladen klar att äta. Smaklig måltid!'],
    qs: [['Hur många vindruvor behöver du?', '10', [], 1], ['Vem ska hjälpa dig med kniven?', 'En vuxen', ['En kompis', 'Ingen'], 1], ['Vad gör du först?', 'Tvättar äpplet och vindruvorna', ['Skär frukten', 'Rör om'], 2],
      ['Vilka frukter ska du skala?', 'Banan och apelsin', ['Äpple och vindruvor', 'Alla frukter'], 2], ['Var ska skålen stå en stund?', 'I kylen', ['I ugnen', 'På bordet'], 3],
      ['Vilken sorts text är det här?', 'Ett recept', ['En saga', 'Ett brev'], 0, 1]] },
    { id: 'vykortet', title: 'Ett vykort från mormor', kind: 'Vykort', paras: [
      'Hej {P}! Här på Gotland är det soligt och varmt. Morfar och jag bor i en liten röd stuga nära havet.',
      'I går badade vi och byggde ett sandslott med fyra torn. Morfar hittade en stor snäcka som du ska få. På kvällen åt vi glass vid hamnen.',
      'I morgon ska vi cykla till ett fyrtorn. Vi kommer hem på fredag. Många kramar från mormor'],
    qs: [['Vem har skrivit vykortet?', 'Mormor', ['Morfar', '{A}'], 3], ['Var är mormor och morfar?', 'På Gotland', ['I Stockholm', 'I Norge'], 1], ['Vilken färg har stugan?', 'Röd', ['Gul', 'Blå'], 1],
      ['Hur många torn har sandslottet?', '4', [], 2], ['Vad ska du få?', 'En snäcka', ['En glass', 'Ett sandslott'], 2], ['Vad ska de göra i morgon?', 'Cykla till ett fyrtorn', ['Bada', 'Åka hem'], 3],
      ['Hur är vädret?', 'Soligt och varmt', ['Regnigt', 'Kallt och blåsigt'], 1]] },
    { id: 'sagostund', title: 'Sagostund på biblioteket', kind: 'Affisch', paras: [
      'SAGOSTUND PÅ BIBLIOTEKET! Varje tisdag klockan 15.00 läser bibliotekarien Lisa en spännande saga. Sagostunden är för barn mellan 5 och 9 år.',
      'Det kostar ingenting och du behöver inte anmäla dig. Sätt dig på de mjuka kuddarna i sagohörnan och lyssna.',
      'I november läser vi sagor om drakar och troll. Efter sagan får alla rita en bild. Den bästa bilden sätts upp på väggen. Välkommen!'],
    qs: [['Vilken dag är sagostunden?', 'Tisdag', ['Måndag', 'Fredag'], 1], ['Vem läser sagan?', 'Lisa', ['{T}', 'En pirat'], 1], ['Hur mycket kostar det?', 'Ingenting', ['10 kronor', '50 kronor'], 2],
      ['Var sitter man och lyssnar?', 'På kuddar i sagohörnan', ['På stolar i matsalen', 'I gympasalen'], 2], ['Vad handlar sagorna om i november?', 'Drakar och troll', ['Hästar', 'Rymden'], 3],
      ['Vad gör man efter sagan?', 'Ritar en bild', ['Äter glass', 'Går hem direkt'], 3], ['Får en sjuåring vara med?', 'Ja', ['Nej', 'Bara med en vuxen'], 1, 1]] },
  ],
};

export const TEXTER3 = {
  berattelser: [
    { id: 'straffen', title: 'Straffen', kind: 'Berättelse', paras: [
      'Det är final i skolans fotbollscup. {A} står i mål, och läktaren är full av föräldrar och kompisar. {B} sitter längst fram i en rosa cheerdräkt med pompomer och ropar så högt det går.',
      'Det står 1–1 och det är bara en minut kvar. Då ramlar en spelare i straffområdet och domaren blåser i pipan. Straff! {A:s} ben skakar när bollen läggs på straffpunkten.',
      '{A} tänker på vad tränaren brukar säga: titta på bollen, inte på spelaren. Skottet går mot det vänstra hörnet. {A} kastar sig och får fingrarna på bollen. Den studsar ut till hörna!',
      'Efter slutsignalen blir det straffläggning, och laget vinner med tre mål mot två. {B} hoppar och viftar med pompomerna. Den kvällen somnar {A} med medaljen runt halsen.'],
    qs: [['Vilken plats har {A} i laget?', 'Målvakt', ['Anfallare', 'Domare'], 1], ['Vad har {B} på sig?', 'En rosa cheerdräkt', ['En fotbollströja', 'En regnjacka'], 1],
      ['Hur mycket tid är kvar när det blir straff?', 'En minut', ['Tio minuter', 'En halvtimme'], 2], ['Varför skakar {A:s} ben?', '{A} är nervös', ['{A} fryser', '{A} är trött'], 2, 1],
      ['Vad brukar tränaren säga?', 'Titta på bollen', ['Spring fortare', 'Blunda'], 3], ['Åt vilket håll går skottet?', 'Mot det vänstra hörnet', ['Mot det högra hörnet', 'Rakt på {A}'], 3],
      ['Hur många mål gör laget i straffläggningen?', '3', [], 4], ['Hur känns det för {A} på kvällen?', 'Stolt och glad', ['Ledsen', 'Arg'], 4, 1]] },
    { id: 'kakorna', title: 'Mysteriet med de försvunna kakorna', kind: 'Berättelse', paras: [
      'Farmor har bakat chokladkakor och ställt dem på köksbordet för att svalna. Hon räknar dem: tolv stycken. Sedan går hon ut i trädgården för att plocka äpplen.',
      'När farmor kommer tillbaka är det bara åtta kakor kvar. {A} och {B} bestämmer sig för att lösa mysteriet. {A} hämtar ett förstoringsglas och {B} tar fram ett anteckningsblock.',
      'På golvet hittar de smulor som leder mot hallen. På mattan syns små, leriga tassavtryck. Och i hundkorgen ligger Bamse och slickar sig om munnen.',
      '– Bamse, var det du? frågar {A}. Bamse viftar på svansen. Farmor säger att hundar inte får äta choklad och ringer veterinären, som lovar att Bamse snart blir frisk. Nu ställer farmor alltid kakorna högt upp på hyllan.'],
    qs: [['Hur många kakor bakade farmor?', '12', [], 1], ['Varför står kakorna på bordet?', 'För att svalna', ['För att visa dem', 'För att Bamse ska få dem'], 1],
      ['Hur många kakor försvann?', '4', [], 2, 1], ['Vad tar {B} fram?', 'Ett anteckningsblock', ['Ett förstoringsglas', 'En ficklampa'], 2],
      ['Vilka spår hittar de?', 'Smulor och tassavtryck', ['Fotspår av skor', 'Fjädrar'], 3], ['Vem åt upp kakorna?', 'Hunden Bamse', ['Farmor', '{B}'], 3, 1],
      ['Varför ringer farmor veterinären?', 'Hundar får inte äta choklad', ['Bamse har brutit benet', 'Bamse är hungrig'], 4], ['Vad gör farmor nu så att det inte händer igen?', 'Ställer kakorna högt upp', ['Slutar baka', 'Låser in Bamse'], 4]] },
    { id: 'nyaeleven', title: 'Den nya eleven', kind: 'Berättelse', paras: [
      'En måndag i oktober står en ny elev i dörren till klassrummet. Han heter Samir och har precis flyttat hit från en annan stad. Samir håller hårt i sin ryggsäck och tittar ner i golvet.',
      '{T} visar Samir till bänken bredvid {A}. På lektionen räknar klassen gånger. Samir räknar snabbt och räcker upp handen, men säger nästan ingenting.',
      'På rasten står Samir ensam vid staketet. {A} och {B} ser det. – Vill du vara med och spela fotboll? frågar {B}. Samir ler för första gången och nickar.',
      'Det visar sig att Samir är jättebra på att dribbla. Efter rasten pratar han hela vägen tillbaka till klassrummet. När skoldagen är slut säger han: – Vi ses i morgon!'],
    qs: [['Vilken månad kommer Samir till klassen?', 'Oktober', ['Augusti', 'Maj'], 1], ['Varför är Samir ny i klassen?', 'Han har flyttat', ['Han har varit sjuk', 'Han har bytt namn'], 1],
      ['Hur känner sig Samir första morgonen?', 'Blyg och lite rädd', ['Arg', 'Glad och pratig'], 1, 1], ['Var får Samir sitta?', 'Bredvid {A}', ['Längst bak', 'Bredvid {B}'], 2],
      ['Vad är Samir bra på i matten?', 'Att räkna gånger', ['Att rita', 'Att stava'], 2], ['Vad frågar {B} på rasten?', 'Om Samir vill spela fotboll', ['Vad Samir heter', 'Var Samir bor'], 3],
      ['Hur märks det att Samir trivs till slut?', 'Han pratar och säger vi ses i morgon', ['Han går hem tidigt', 'Han står vid staketet'], 4, 1], ['Vad vill berättelsen visa?', 'Att det är fint att låta alla vara med', ['Att fotboll är svårt', 'Att man inte ska flytta'], 0, 1]] },
    { id: 'stormen', title: 'Stormen', kind: 'Berättelse', paras: [
      'Det blåser mer och mer. Träden utanför fönstret böjer sig, och regnet smattrar mot rutan. På radion säger de att det är storm i hela landet.',
      'Plötsligt blir allt svart. Tv:n slocknar och kylskåpet slutar brumma. – Strömmen har gått, säger mamma. {A} letar fram en ficklampa i kökslådan.',
      'Familjen tänder levande ljus på bordet. De spelar kort och äter smörgåsar, eftersom spisen inte fungerar. {A} tycker att det känns som att vara på äventyr.',
      'Mitt i ett parti kort blinkar lamporna och tv:n börjar prata igen. Strömmen är tillbaka! {A} blir nästan lite besviken. Nästa morgon ligger grenar över hela gården, men ingen har skadat sig.'],
    qs: [['Hur vet familjen att det är storm i hela landet?', 'Det sägs på radion', ['Grannen berättar', 'Det står i en bok'], 1], ['Vad händer när strömmen går?', 'Tv:n och kylskåpet slutar fungera', ['Det börjar snöa', 'Fönstret går sönder'], 2],
      ['Vad hittar {A} i kökslådan?', 'En ficklampa', ['Tändstickor', 'Ett kortspel'], 2], ['Varför äter familjen smörgåsar?', 'Spisen fungerar inte', ['De är inte hungriga', 'De har bråttom'], 3],
      ['Hur känns det för {A} när strömmen är borta?', 'Som ett äventyr', ['Läskigt och tråkigt', 'Som en vanlig dag'], 3], ['Varför blir {A} lite besviken när strömmen kommer tillbaka?', 'Äventyret tar slut', ['Tv:n är trasig', 'Ljusen slocknar inte'], 4, 1],
      ['Vad ligger på gården nästa morgon?', 'Grenar', ['Snö', 'Leksaker'], 4]] },
    { id: 'draken', title: 'Draken som var rädd för mörker', kind: 'Saga', paras: [
      'Högt uppe i bergen bodde en liten drake som hette Glöd. Han kunde spruta eld och flyga över molnen. Men en sak hade han aldrig berättat för någon: han var rädd för mörker.',
      'Varje kväll när solen gick ner kröp Glöd in i sin grotta och darrade. De andra drakarna skrattade åt honom. – En drake kan väl inte vara mörkrädd, sa de.',
      'En natt gick en flicka vilse i bergen. Hon grät högt i mörkret. Glöd hörde henne och var nästan för rädd för att gå ut. Men så tänkte han: om jag sprutar eld blir det ju ljust!',
      'Glöd sprutade en liten låga och lyste upp stigen. Flickan följde ljuset ända hem till byn. Sedan dess är Glöd inte rädd längre. Han vet att han själv kan göra mörkret ljust.'],
    qs: [['Vad hette draken?', 'Glöd', ['Gnista', 'Flamma'], 1], ['Vad var draken rädd för?', 'Mörker', ['Vatten', 'Andra drakar'], 1], ['Vad gjorde Glöd varje kväll?', 'Kröp in i grottan och darrade', ['Flög över molnen', 'Sjöng en sång'], 2],
      ['Hur kände sig Glöd när de andra skrattade?', 'Ledsen', ['Glad', 'Stolt'], 2, 1], ['Vem gick vilse i bergen?', 'En flicka', ['En drake', 'En pojke'], 3],
      ['Hur hjälpte Glöd flickan?', 'Lyste upp stigen med eld', ['Bar henne på ryggen', 'Ropade på hjälp'], 4], ['Varför är Glöd inte rädd längre?', 'Han kan själv göra mörkret ljust', ['Han har fått en lampa', 'Det är aldrig mörkt'], 4, 1]] },
  ],
  fakta: [
    { id: 'algen', title: 'Älgen', kind: 'Faktatext', paras: [
      'Älgen är Sveriges största landdjur. En stor hanne kan väga över 500 kilo och vara lika hög som en dörr. Älgen kallas ibland för skogens konung.',
      'Hanen kallas tjur och honan kallas ko. Ungarna kallas kalvar och föds på försommaren. Ofta föds två kalvar på en gång, och de följer sin mamma i ungefär ett år.',
      'Tjuren har stora horn. Varje vinter faller hornen av, och på våren börjar nya horn att växa. Hornen blir oftast större för varje år.',
      'Älgen äter blad, kvistar och vattenväxter. På vintern äter den bark och skott från tallar. Älgen är bra på att simma och kan simma över stora sjöar.'],
    qs: [['Vad är älgen i Sverige?', 'Det största landdjuret', ['Det minsta djuret', 'Den snabbaste fågeln'], 1], ['Hur mycket kan en stor hanne väga?', 'Över 500 kilo', ['50 kilo', '5 kilo'], 1],
      ['Vad kallas en älghona?', 'Ko', ['Tjur', 'Kalv'], 2], ['När föds kalvarna?', 'På försommaren', ['På vintern', 'På hösten'], 2], ['Vad händer med hornen varje vinter?', 'De faller av', ['De blir vita', 'De växer dubbelt så fort'], 3],
      ['Vad äter älgen på vintern?', 'Bark och tallskott', ['Fisk', 'Gräs från åkern'], 4], ['Vilket stycke handlar om vad älgen äter?', '4', [], 0, 1]] },
    { id: 'vikingarna', title: 'Vikingarna', kind: 'Faktatext', paras: [
      'För ungefär tusen år sedan levde vikingarna i Sverige, Norge och Danmark. De flesta vikingar var bönder. De odlade säd, hade kor och får och bodde i långa hus av trä.',
      'Vikingarna var duktiga på att bygga båtar. Med sina långskepp seglade och rodde de långt bort över haven. De handlade med pälsar, järn och smycken. Ibland plundrade de också andra länder.',
      'Vikingarna skrev med runor. Runorna ristade de i sten och trä. I Sverige finns tusentals runstenar kvar, och på många av dem står det vem som har rest stenen och varför.',
      'Vikingarna trodde på många gudar. Tor var åskans gud och hade en hammare som hette Mjölner. Oden var den klokaste av gudarna. Några av våra veckodagar har fått namn efter gudarna, till exempel torsdag efter Tor.'],
    qs: [['När levde vikingarna?', 'För ungefär tusen år sedan', ['För hundra år sedan', 'För en miljon år sedan'], 1], ['Vad var de flesta vikingar?', 'Bönder', ['Kungar', 'Riddare'], 1],
      ['Vad hette vikingarnas båtar?', 'Långskepp', ['Kanoter', 'Ångbåtar'], 2], ['Vad skrev vikingarna med?', 'Runor', ['Vanliga bokstäver', 'Bilder'], 3],
      ['Vad berättar många runstenar?', 'Vem som rest stenen och varför', ['Hur man bakar bröd', 'Hur vädret blir'], 3], ['Vem var åskans gud?', 'Tor', ['Oden', 'Mjölner'], 4],
      ['Vilken veckodag har fått namn efter Tor?', 'Torsdag', ['Tisdag', 'Lördag'], 4]] },
    { id: 'fjarilen', title: 'Fjärilens förvandling', kind: 'Faktatext', paras: [
      'En fjäril börjar sitt liv som ett litet ägg på ett blad. Fjärilsmamman väljer ett blad som larven kan äta, till exempel ett nässelblad.',
      'Ur ägget kryper en larv. Larven äter nästan hela tiden och växer fort. Den blir för stor för sitt skinn och byter skinn flera gånger.',
      'När larven är fullvuxen hänger den upp sig och blir en puppa. Inne i puppan händer något otroligt: larven förvandlas sakta till en fjäril.',
      'Till slut spricker puppan och fjärilen kryper ut. Vingarna är skrynkliga och blöta, men efter en stund är de torra och fjärilen kan flyga. Fjärilen dricker nektar från blommor med sin långa sugsnabel.'],
    qs: [['Var lägger fjärilen sina ägg?', 'På ett blad', ['I vattnet', 'I jorden'], 1], ['Vad gör larven nästan hela tiden?', 'Äter', ['Sover', 'Flyger'], 2],
      ['Varför byter larven skinn?', 'Den blir för stor för det', ['Den fryser', 'Den vill byta färg'], 2], ['Vad blir larven när den är fullvuxen?', 'En puppa', ['Ett ägg', 'En humla'], 3],
      ['Hur ser vingarna ut när fjärilen just har krupit ut?', 'Skrynkliga och blöta', ['Stora och torra', 'Svarta'], 4], ['Vad dricker fjärilen?', 'Nektar', ['Vatten från sjön', 'Mjölk'], 4],
      ['Vilken ordning är rätt?', 'Ägg, larv, puppa, fjäril', ['Larv, ägg, fjäril, puppa', 'Puppa, ägg, larv, fjäril'], 0, 1]] },
    { id: 'vattnet', title: 'Vattnets resa', kind: 'Faktatext', paras: [
      'Vattnet på jorden tar aldrig slut. Samma vatten åker runt, runt i ett kretslopp. Vattnet du dricker i dag kan en gång ha druckits av en dinosaurie!',
      'När solen värmer haven, sjöarna och marken blir en del av vattnet till vattenånga. Det kallas avdunstning. Vattenångan är så lätt att den stiger upp i luften.',
      'Högt uppe är det kallt. Där kyls vattenångan av och blir till små droppar. Massor av droppar tillsammans blir ett moln. När dropparna blir tunga faller de ner som regn, eller som snö om det är kallt.',
      'Regnet rinner ner i bäckar och åar och vidare ut i sjöar och hav. En del sjunker ner i marken och blir grundvatten. Sedan värmer solen vattnet igen, och resan börjar om.'],
    qs: [['Vad betyder det att vattnet går i ett kretslopp?', 'Samma vatten åker runt hela tiden', ['Vattnet tar slut', 'Vattnet stannar i havet'], 1], ['Vad kallas det när vatten blir till vattenånga?', 'Avdunstning', ['Frysning', 'Smältning'], 2],
      ['Vad gör att vattnet avdunstar?', 'Solen värmer det', ['Vinden kyler det', 'Månen drar i det'], 2], ['Vad blir massor av små droppar tillsammans?', 'Ett moln', ['En sjö', 'En snöflinga'], 3],
      ['När faller vattnet ner som snö?', 'När det är kallt', ['När det är varmt', 'Bara på natten'], 3], ['Vad kallas vatten som sjunker ner i marken?', 'Grundvatten', ['Havsvatten', 'Regnbåge'], 4],
      ['Kan vattnet du dricker ha druckits av en dinosaurie?', 'Ja', ['Nej', 'Bara havsvattnet'], 1]] },
    { id: 'hjartat', title: 'Hjärtat', kind: 'Faktatext', paras: [
      'Hjärtat sitter i bröstet, lite till vänster. Det är en muskel som är ungefär lika stor som din knutna hand. Hjärtat arbetar hela livet, både när du är vaken och när du sover.',
      'Hjärtat pumpar runt blodet i kroppen. Blodet åker i tunna rör som kallas blodkärl. Det tar med sig syre och näring till alla delar av kroppen.',
      'När ett barn vilar slår hjärtat ungefär 80 till 100 slag i minuten. När du springer behöver musklerna mer syre. Då slår hjärtat fortare.',
      'Du kan känna hjärtslagen med fingrarna på handleden eller på halsen. Det kallas att känna pulsen. Rörelse och bra mat gör hjärtat starkt.'],
    qs: [['Hur stort är hjärtat ungefär?', 'Som en knuten hand', ['Som en fotboll', 'Som en ärta'], 1], ['Vad är hjärtat?', 'En muskel', ['Ett ben', 'En lunga'], 1],
      ['Vad heter rören som blodet åker i?', 'Blodkärl', ['Slangar', 'Sugrör'], 2], ['Vad tar blodet med sig?', 'Syre och näring', ['Luft och sand', 'Ljud'], 2],
      ['Varför slår hjärtat fortare när du springer?', 'Musklerna behöver mer syre', ['Hjärtat blir rädd', 'Blodet blir kallt'], 3], ['Var kan du känna pulsen?', 'På handleden eller halsen', ['I håret', 'På knät'], 4],
      ['Vad gör hjärtat starkt?', 'Rörelse och bra mat', ['Godis', 'Att sova hela dagen'], 4]] },
  ],
  texter: [
    { id: 'solrosen', title: 'Så får du en egen solros', kind: 'Instruktion', paras: [
      'Det här behöver du: ett solrosfrö, en kruka med hål i botten, planteringsjord och vatten. Börja i april, så hinner solrosen bli stor till sommaren.',
      'Steg 1: Fyll krukan med jord. Steg 2: Gör ett hål som är två centimeter djupt med fingret. Steg 3: Lägg fröet i hålet och täck över med jord.',
      'Steg 4: Vattna försiktigt så att jorden blir fuktig men inte blöt. Steg 5: Ställ krukan i ett soligt fönster. Efter ungefär en vecka tittar en liten grön planta upp.',
      'När det inte längre blir frost på nätterna, ofta i slutet av maj, kan du plantera ut solrosen. Välj en solig plats nära en vägg. En solros kan bli högre än en vuxen människa!'],
    qs: [['När ska du börja?', 'I april', ['I oktober', 'I januari'], 1], ['Varför ska krukan ha hål i botten?', 'Så att vattnet kan rinna ut', ['Så att fröet kan titta ut', 'För att den ska bli lätt'], 1, 1],
      ['Hur många centimeter djupt ska hålet vara?', '2', [], 2], ['Vad gör du direkt efter att du lagt fröet i hålet?', 'Täcker över med jord', ['Vattnar', 'Ställer krukan i fönstret'], 2],
      ['Hur lång tid tar det innan plantan tittar upp?', 'Ungefär en vecka', ['En dag', 'Ett år'], 3], ['När kan du plantera ut solrosen?', 'När det inte blir frost längre', ['Mitt i vintern', 'Samma dag som du sår'], 4],
      ['Vilket steg handlar om att vattna?', '4', [], 3]] },
    { id: 'katten', title: 'Borttappad katt!', kind: 'Annons', paras: [
      'BORTTAPPAD KATT! Vår katt Morris har varit borta sedan i torsdags kväll. Vi saknar honom jättemycket.',
      'Morris är grå med vita tassar och en vit fläck på nosen. Han har ett rött halsband med en liten bjällra. Morris är snäll men lite skygg mot främlingar.',
      'Han försvann nära Lindparken och lekplatsen vid Ekvägen. Titta gärna i förråd och garage, för Morris gillar att gömma sig.',
      'Har du sett Morris? Ring familjen Lund på 070-123 45 67. Den som hittar honom får en hittelön på 200 kronor. Tack för hjälpen!'],
    qs: [['Vad heter katten?', 'Morris', ['Lund', 'Sotis'], 1], ['Sedan när har katten varit borta?', 'Sedan i torsdags', ['Sedan i går', 'Sedan i våras'], 1],
      ['Vilken färg har Morris tassar?', 'Vita', ['Svarta', 'Grå'], 2], ['Vad sitter på halsbandet?', 'En bjällra', ['En lapp', 'En lampa'], 2],
      ['Varför ska man titta i förråd och garage?', 'Morris gillar att gömma sig', ['Där bor familjen', 'Där finns mat'], 3], ['Hur många kronor får den som hittar Morris?', '200', [], 4],
      ['Varför har familjen skrivit annonsen?', 'De vill få hjälp att hitta katten', ['De vill sälja katten', 'De har hittat en katt'], 0, 1]] },
    { id: 'brevet', title: 'Ett brev till en brevvän', kind: 'Brev', paras: [
      'Hej Lina! Tack för ditt brev och för bilden på din häst. Jag heter {P} och går i trean. Jag bor i en lägenhet på fjärde våningen, och från mitt fönster ser jag ett pariserhjul.',
      'I min klass går bland andra {A} och {B}. Vår lärare heter {T}. Mitt favoritämne är matte, för det är som att lösa gåtor. Det jag tycker minst om är att städa bänken.',
      'På fritiden spelar jag spel på datorn och går på simning två gånger i veckan. I helgen ska vi åka till farmor. Hon har en katt som heter Sotis.',
      'Hur är det i din skola? Har ni fått några nya djur på gården? Skriv snart! Hälsningar från {P}'],
    qs: [['Vem är brevet till?', 'Lina', ['{A}', 'Farmor'], 1], ['Vad fick du en bild på?', 'En häst', ['En katt', 'Ett pariserhjul'], 1], ['Vilken våning bor du på i brevet?', '4', [], 1],
      ['Vilket är favoritämnet i brevet?', 'Matte', ['Svenska', 'Idrott'], 2], ['Varför är matte roligast?', 'Det är som att lösa gåtor', ['Det är lätt', 'Läraren är snäll'], 2],
      ['Hur många gånger i veckan är det simning?', '2', [], 3], ['Vad heter farmors katt?', 'Sotis', ['Morris', 'Lina'], 3],
      ['Varför ställs frågor i slutet av brevet?', 'För att Lina ska svara', ['För att det är ett prov', 'För att det är roligt att fråga'], 4, 1]] },
    { id: 'tidningen', title: 'Klassen städade parken', kind: 'Tidningsartikel', paras: [
      'I tisdags var klassen ute i Lindparken med {T}. Barnen hade gula västar, handskar och stora sopsäckar. På två timmar fyllde de sju säckar med skräp.',
      '– Det var mest godispapper, burkar och fimpar, berättar {A}. Vi hittade till och med en gammal cykel i dammen!',
      '{T} säger att skräp i naturen är farligt för djuren. Fåglar kan trassla in sig i plast, och igelkottar kan fastna i burkar. Därför ville klassen göra något.',
      'Efter städningen fick alla saft och bullar. Nu har klassen gjort skyltar med texten "Släng skräpet i papperskorgen". Skyltarna sitter vid parkens ingång.'],
    qs: [['Vilken dag städade klassen?', 'Tisdag', ['Lördag', 'Fredag'], 1], ['Hur många säckar med skräp blev det?', '7', [], 1], ['Hur länge städade klassen?', 'Två timmar', ['En hel dag', 'Tio minuter'], 1],
      ['Vad hittade de i dammen?', 'En gammal cykel', ['En fisk', 'En boll'], 2], ['Varför är skräp farligt för djuren?', 'De kan fastna eller trassla in sig', ['De blir rädda för färgerna', 'De äter för mycket'], 3],
      ['Var sitter skyltarna?', 'Vid parkens ingång', ['I skolan', 'Vid dammen'], 4], ['Vem berättar om vad de hittade?', '{A}', ['{B}', 'En polis'], 2]] },
  ],
};

// ---------- namnen i texten ----------
const gen = (n) => (/[sxz]$/i.test(n) ? n : n + 's');   // genitiv: Alvas, Elias, Max
export function fillNames(R) {   // R.names = { A, B, T, P }
  const N = R.names;
  return (s) => String(s).replace(/\{([ABTP])(:s)?\}/g, (_, k, g) => (g ? gen(N[k]) : N[k]));
}
const firstName = (s) => cap(String(s || '').trim().split(/\s+/)[0].toLowerCase());
export function namesFor() {
  const c = ctx(), kids = shuffle([...new Set(c.kids.map(firstName).filter(Boolean))]);
  return { A: kids[0] || 'Alva', B: kids[1] || 'Noah', T: String(c.teacher || 'Fröken Maja').trim(), P: firstName(c.me) || 'Mira' };
}
// ---------- en text till en lektion: fem frågor i textens ordning ----------
export function startText(list, seen = []) {
  const fresh = list.filter((t) => !seen.includes(t.id)), T = pick(fresh.length ? fresh : list);
  const names = namesFor(), f = fillNames({ names });
  const idx = shuffle(T.qs.map((_, i) => i)).slice(0, 5).sort((a, b) => a - b);
  return { id: T.id, title: f(T.title), kind: T.kind, paras: T.paras.map(f), qs: idx.map((i) => T.qs[i]), i: 0, names };
}
// en fråga om texten i samma format som de andra uppgifterna (+ read: stycket svaret står i)
export function readQ(R, q) {
  const f = fillNames(R), [q0, a0, w0, p, inf] = q, question = f(q0), right = f(a0), num = /^\d+$/.test(right);
  const where = p ? `stycke ${p}` : 'hela texten';
  const hint = p ? `Läs stycke ${p} en gång till${inf ? ' och tänk efter. Svaret står inte rakt ut i texten' : ''}. Tryck på 📖 Texten.` : 'Tänk på hela texten. Tryck på 📖 Texten och läs den igen.';
  return { topic: R.title.toUpperCase(), board: { lines: [question.toUpperCase()], after: right.toUpperCase(), big2: true }, say: question,
    ...(num ? { input: 'num', ans: +right } : { ans: right, opts: textOpts(right, w0.map(f)) }),
    hint, done: `${right}.${p ? ` Det står i ${where}.` : ''}`, read: { p, inf: !!inf } };
}
// nivåerna: lv.read = listan med texter (skola.js sköter lektionen); gen() ger en fristående fråga (proven, fuzz)
export const readLevel = (name, list) => ({ name, read: list, gen: () => { const R = startText(list); return readQ(R, pick(R.qs)); } });
// nivåerna som läggs sist i svenska (skola.js) – sist så att de sparade stjärnorna på de gamla nivåerna står kvar
export const READ_LEVELS = {
  2: [readLevel('Läsa berättelser', TEXTER2.berattelser), readLevel('Läsa faktatexter', TEXTER2.fakta), readLevel('Läsa inbjudan, recept och vykort', TEXTER2.texter)],
  3: [readLevel('Läsa berättelser', TEXTER3.berattelser), readLevel('Läsa faktatexter', TEXTER3.fakta), readLevel('Läsa annonser, brev och artiklar', TEXTER3.texter)],
};
