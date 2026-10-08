// Normalizace jmen zastupitelů/radních ze zápisů (titulů je v zápisech plno a nekonzistentně)
const TITLES = /\b(Mgr|Ing|Bc|BcA|MUDr|JUDr|RNDr|PhDr|MVDr|PaedDr|Dr|prof|doc|MBA|LL\.?M|DiS|Ph\.?D|CSc|EFP|plk|mjr|npor|et|v\.?r)\b\.?/gi;

export function stripTitles(s) {
  return s.replace(/\*+/g,' ')
    .replace(TITLES, ' ')
    .replace(/[,.;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// vrátí "Prijmeni Jmeno" kanonicky
export function canon(raw) {
  const s = stripTitles(raw);
  const w = s.split(' ').filter(x => /^[A-ZÁ-Žа-я][\p{L}-]{1,}$/u.test(x) || /^[A-ZÁ-Ž][\p{L}-]*$/u.test(x));
  if (w.length < 2) return null;
  // v zápisech je zápis "Jméno Příjmení" (po odstranění titulů), bereme poslední = příjmení
  const sur = w[w.length - 1], giv = w.slice(0, w.length - 1).join(' ');
  return `${sur} ${giv}`;
}

// Rozdělí seznam jmen oddělený čárkami, ale čárky jsou i v titulech (MBA, LL.M.)
export function splitNames(block) {
  const cleaned = block
    .replace(/\s+/g, ' ')
    .replace(/MBA,\s*LL\.?M\.?/gi, 'MBA LLM')
    .replace(/Ing\.\s*et\s*Ing\./gi, 'Ing')
    .replace(/,\s*(Dr|DiS|Ph\.?D|CSc|MBA|LL\.?M|DiS)\.?/gi, ' ')
    .replace(/\ba\b/g, ',');
  return cleaned.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 3);
}

export function namesFrom(block) {
  const out = [];
  for (const p of splitNames(block)) {
    const c = canon(p);
    if (c) out.push(c);
  }
  return [...new Set(out)];
}
