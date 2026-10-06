// Egen lagring för Pixelskolan. På GitHub Pages delar Pixelskolan adress (8bitcat.github.io) – och
// därmed localStorage – med Snabbfilen. Snabbfilens moduler sparar under nycklar som börjar med
// 'snabbfilen' (figuren, figurlistan, sparfilen, zoomen …); här får de prefixet 'pixelskolan:' så att
// skolan aldrig skriver i barnens riktiga spel. Den här modulen måste importeras FÖRST i skola.js.
const PRE = 'pixelskolan:';
const SP = Storage.prototype, get0 = SP.getItem, set0 = SP.setItem, del0 = SP.removeItem;

// Engångsstädning efter första versionen (2026-10-06), som hann skriva skolans figurer i Snabbfilens
// lagring: ta bort dem ur figurlistan och lägg tillbaka den senaste riktiga figuren som aktuell.
try {
  const ls = window.localStorage;
  if (!get0.call(ls, PRE + 'repair1')) {
    const school = JSON.parse(get0.call(ls, 'pixelskolan-v3') || 'null');
    const ids = new Set([school?.ME, school?.TEACHER, ...(school?.CLASS || [])].map((a) => a && a.id).filter(Boolean));
    const list = JSON.parse(get0.call(ls, 'snabbfilen_avatars') || 'null');
    if (Array.isArray(list) && ids.size) {
      const keep = list.filter((a) => !(a && ids.has(a.id)));
      if (keep.length !== list.length) set0.call(ls, 'snabbfilen_avatars', JSON.stringify(keep));
      const cur = JSON.parse(get0.call(ls, 'snabbfilen_avatar') || 'null');
      if (cur && (ids.has(cur.id) || !cur.name)) { if (keep[0]) set0.call(ls, 'snabbfilen_avatar', JSON.stringify(keep[0])); else del0.call(ls, 'snabbfilen_avatar'); }
    }
    set0.call(ls, PRE + 'repair1', '1');
  }
} catch { /* lagring avstängd */ }

const map = (k) => (typeof k === 'string' && k.startsWith('snabbfilen') ? PRE + k : k);
SP.getItem = function (k) { return get0.call(this, map(k)); };
SP.setItem = function (k, v) { return set0.call(this, map(k), v); };
SP.removeItem = function (k) { return del0.call(this, map(k)); };
