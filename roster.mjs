// Zastupitelstvo města Nové Strašecí, volební období 2022–2026 (21 mandátů, 23 osob)
// Zdroje: https://www.novestraseci.cz/samosprava/zastupitelstvo/ , /samosprava/rada-mesta/
//         + zápisy ZM (složení slibu nových členů)
// Změny v průběhu období:
//   Dr. Ing. Jan Kleindienst rezignoval 3.4.2023  -> prof. RNDr. Zdeněk Doležal, Dr. (od 4.4.2023)
//   p. Radek Lopour         rezignoval 27.11.2023 -> Mgr. Petr Janouš (od 28.11.2023)
export const ROSTER = [
  // --- Naše město (6) – koalice, starosta
  { k: 'Filip Karel',      jm: 'Karel',  pr: 'Filip',      disp: 'Mgr. Karel Filip',               klub: 'Naše město',     rada: 'starosta' },
  { k: 'Šnobl Karel',      jm: 'Karel',  pr: 'Šnobl',      disp: 'Bc. Karel Šnobl',                klub: 'Naše město',     rada: 'člen rady' },
  { k: 'Vondra Martin',    jm: 'Martin', pr: 'Vondra',     disp: 'Ing. Martin Vondra, MBA, LL.M.', klub: 'Naše město',     rada: 'člen rady' },
  { k: 'Kozel Vladimír',   jm: 'Vladimír', pr: 'Kozel',    disp: 'Vladimír Kozel',                 klub: 'Naše město',     rada: null },
  { k: 'Polívka Štěpán',   jm: 'Štěpán', pr: 'Polívka',    disp: 'Bc. Štěpán Polívka',             klub: 'Naše město',     rada: null },
  { k: 'Jurgovski Jiří',   jm: 'Jiří',   pr: 'Jurgovski',  disp: 'Ing. Jiří Jurgovski',            klub: 'Naše město',     rada: null },
  // --- Město pro rodinu – rodina pro město (4) – koalice
  { k: 'Bureš Jan',        jm: 'Jan',    pr: 'Bureš',      disp: 'Ing. Jan Bureš',                 klub: 'MPR-RPM',        rada: 'místostarosta' },
  { k: 'Bechyně Jan',      jm: 'Jan',    pr: 'Bechyně',    disp: 'Ing. Jan Bechyně',               klub: 'MPR-RPM',        rada: 'člen rady' },
  { k: 'Vosátková Libuše', jm: 'Libuše', pr: 'Vosátková',  disp: 'RNDr. Libuše Vosátková',         klub: 'MPR-RPM',        rada: null },
  { k: 'Kleindienst Jan',  jm: 'Jan',    pr: 'Kleindienst',disp: 'Dr. Ing. Jan Kleindienst',       klub: 'MPR-RPM',        rada: null, do: '2023-04-03' },
  { k: 'Doležal Zdeněk',   jm: 'Zdeněk', pr: 'Doležal',    disp: 'prof. RNDr. Zdeněk Doležal, Dr.',klub: 'MPR-RPM',        rada: null, od: '2023-04-04' },
  // --- Nezávislí 2018 (3) – koalice
  { k: 'Bünter Michal',    jm: 'Michal', pr: 'Bünter',     disp: 'Michal Bünter',                  klub: 'NEZÁVISLÍ 2018', rada: 'místostarosta' },
  { k: 'Brabec David',     jm: 'David',  pr: 'Brabec',     disp: 'David Brabec',                   klub: 'NEZÁVISLÍ 2018', rada: 'člen rady' },
  { k: 'Bouček Jiří',      jm: 'Jiří',   pr: 'Bouček',     disp: 'Mgr. Jiří Bouček',               klub: 'NEZÁVISLÍ 2018', rada: null },
  // --- Koalice Společně pro Nové Strašecí a Pecínov a STAN (6) – opozice
  { k: 'Adelt Pavel',      jm: 'Pavel',  pr: 'Adelt',      disp: 'Ing. Pavel Adelt, MBA',          klub: 'Společně+STAN',  rada: null },
  { k: 'Burešová Alena',   jm: 'Alena',  pr: 'Burešová',   disp: 'Ing. Alena Burešová',            klub: 'Společně+STAN',  rada: null },
  { k: 'Novák Pavel',      jm: 'Pavel',  pr: 'Novák',      disp: 'Bc. Pavel Novák',                klub: 'Společně+STAN',  rada: null },
  { k: 'Verner Jiří',      jm: 'Jiří',   pr: 'Verner',     disp: 'Mgr. Jiří Verner',               klub: 'Společně+STAN',  rada: null },
  { k: 'Černý Kamil',      jm: 'Kamil',  pr: 'Černý',      disp: 'Bc. Kamil Černý',                klub: 'Společně+STAN',  rada: null },
  { k: 'Lopour Radek',     jm: 'Radek',  pr: 'Lopour',     disp: 'p. Radek Lopour',                klub: 'Společně+STAN',  rada: null, do: '2023-11-27' },
  { k: 'Janouš Petr',      jm: 'Petr',   pr: 'Janouš',     disp: 'Mgr. Petr Janouš',               klub: 'Společně+STAN',  rada: null, od: '2023-11-28' },
  // --- ODS (2) – opozice
  { k: 'Hubáček David',    jm: 'David',  pr: 'Hubáček',    disp: 'Ing. et Ing. David Hubáček',     klub: 'ODS',            rada: null },
  { k: 'Vaic Pavel',       jm: 'Pavel',  pr: 'Vaic',       disp: 'Ing. Pavel Vaic',                klub: 'ODS',            rada: null },
];

export const KOALICE = new Set(['Naše město', 'MPR-RPM', 'NEZÁVISLÍ 2018']);
export const RADA = ROSTER.filter(r => r.rada).map(r => r.k);
export const BYKEY = Object.fromEntries(ROSTER.map(r => [r.k, r]));

// Je osoba v daném datu členem zastupitelstva?
export function aktivni(r, date) {
  if (r.od && date < r.od) return false;
  if (r.do && date > r.do) return false;
  return true;
}

// Regexy pro vyhledání jména v textu zápisu. Diakritika se v PDF liší (ü/ű),
// u příjmení hlídáme hranici slova, aby "Bureš" nechytil "Burešová".
const DI = { 'ü': '[üű]', 'Ü': '[ÜŰ]' };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[üÜ]/g, c => DI[c]);
export const PATTERNS = ROSTER.map(r => ({
  k: r.k,
  // "Jméno Příjmení" s libovolnými mezerami/novými řádky mezi
  re: new RegExp(esc(r.jm) + '\\s+' + esc(r.pr) + '(?![a-záčďéěíňóřšťúůýž])', 'g'),
}));

export const VYBORY = {
  'Finanční výbor':               { predseda: 'Hubáček David', clenove: ['Vondra Martin'] },
  'Kontrolní výbor':              { predseda: 'Verner Jiří',   clenove: ['Jurgovski Jiří'] },
  'Výbor pro strategický rozvoj': { predseda: 'Bureš Jan',     clenove: ['Bechyně Jan', 'Bünter Michal', 'Burešová Alena', 'Hubáček David', 'Novák Pavel', 'Polívka Štěpán'] },
};
