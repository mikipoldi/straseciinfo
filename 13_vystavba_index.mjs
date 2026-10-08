// Kurátorovaný seznam KLÍČOVÝCH hlasování ZM k výstavbě / developerským projektům,
// s určenou polaritou. U některých usnesení znamená "PRO" podporu výstavby,
// u jiných (např. "neschvaluje plánovací smlouvu", "rozhoduje nepořídit změnu ÚP")
// znamená "PRO" naopak její zablokování. Bez polarity by index neměl smysl.
//
// polarita: 'pro-vystavbe'  = hlas PRO podporuje výstavbu/investora
//           'proti-vystavbe'= hlas PRO výstavbu blokuje / zpřísňuje podmínky
import fs from 'fs';
import { ROSTER, BYKEY, KOALICE, aktivni } from './roster.mjs';

export const KEY_VOTES = [
  { id: 'rgalpha-1',  date: '2022-12-15', vi: 9,  pol: 'pro-vystavbe',
    label: 'RG ALPHA a.s. – smlouva o infrastruktuře, „Technologický park D6“ (NEPŘIJATO 10-3-5)', dev: 'RG ALPHA a.s.' },
  { id: 'lidl',       date: '2022-12-15', vi: 16, pol: 'proti-vystavbe',
    label: 'LIDL ČR – ZM rozhodlo NEPOŘÍDIT změnu ÚP pro obchodní centrum', dev: 'LIDL Česká republika v.o.s.' },
  { id: 'rgalpha-2',  date: '2023-06-22', vi: 13, pol: 'pro-vystavbe',
    label: 'RG ALPHA a.s. – smlouva o infrastruktuře, „Technologický park D6“ (opakovaně, PŘIJATO 11-0-6)', dev: 'RG ALPHA a.s.' },
  { id: 'hliniste',   date: '2023-06-22', vi: 14, pol: 'pro-vystavbe',
    label: 'Smlouva o infrastruktuře – „Nové Strašecí výstavba RD a OV v lokalitě Hliniště“', dev: 'soukromý stavebník' },
  { id: 'loskot-dod3a', date: '2023-06-22', vi: 16, pol: 'pro-vystavbe',
    label: 'Dodatek č. 3 Plánovací smlouvy 168/2012/OI – lokalita V Dolejších Hlavách (LOSKOT + Bradáč)', dev: 'Loskot / Bradáč' },
  { id: 'loskot-dod3b', date: '2023-06-22', vi: 17, pol: 'pro-vystavbe',
    label: 'Dodatek č. 3 Plánovací smlouvy – uložení starostovi podepsat (LOSKOT + Bradáč)', dev: 'Loskot / Bradáč' },
  { id: 'z36-verejne', date: '2023-04-27', vi: 17, pol: 'proti-vystavbe',
    label: 'Návrh svolat VEŘEJNÉ jednání výboru k lokalitám Z36/Z38/Z35 Čelechovice (NEPŘIJATO 11-2-6)', dev: 'Z36 Čelechovická' },
  { id: 'auri-zzn',   date: '2024-04-25', vi: 11, pol: 'neutral',
    label: 'Auri, energy & property s.r.o. (LOSKOT) – areál ZZN předán výboru k projednání', dev: 'Auri / Loskot' },
  { id: 'odpocivka',  date: '2024-11-14', vi: 9,  pol: 'proti-vystavbe',
    label: 'Upuštění od změny ÚP č. 5b – dálniční odpočívka ŘSD, předáno na VEŘEJNÉ jednání výboru', dev: 'ŘSD' },
  { id: 'up5a',       date: '2025-03-06', vi: 8,  pol: 'pro-vystavbe',
    label: 'Vydání změny č. 5.A Územního plánu Nové Strašecí', dev: '—' },
  { id: 'pecinov',    date: '2025-03-06', vi: 10, pol: 'proti-vystavbe',
    label: 'Změna ÚP „Pod viaduktem – Pecínov“ – ZM NESOUHLASÍ (dle doporučení výboru)', dev: 'soukromý žadatel' },
  { id: 'zzn-byty',   date: '2025-03-06', vi: 13, pol: 'pro-vystavbe',
    label: 'Stanovisko k projektu v areálu ZZN – SOUHLAS s bytovými domy (Bradáč/Loskot)', dev: 'Loskot / Bradáč' },
  { id: 'deco-a',     date: '2025-04-24', vi: 13, pol: 'pro-vystavbe',
    label: 'DECO TRADE s.r.o. – smlouva o infrastruktuře (9 RD)', dev: 'DECO TRADE s.r.o.' },
  { id: 'deco-b',     date: '2025-04-24', vi: 12, pol: 'pro-vystavbe',
    label: 'DECO TRADE s.r.o. – uložení starostovi smlouvu podepsat', dev: 'DECO TRADE s.r.o.' },
  { id: 'up2792',     date: '2025-06-19', vi: 13, pol: 'pro-vystavbe',
    label: 'Souhlas s pořízením změny ÚP – pozemky parc. č. 2792/2, 2792/3', dev: 'soukromý žadatel' },
  { id: 'z36-neschv', date: '2026-09-17', vi: 11, pol: 'proti-vystavbe',
    label: 'Z36 Nové Strašecí – ZM NESCHVALUJE plánovací smlouvu (LOSKOT / Auri, 126 bytů)', dev: 'Auri / Loskot' },
];

// Hlasování o těžbě (ČLUZ) – vedeno zvlášť, jde o průmysl, ne bytovou výstavbu
export const CLUZ_VOTES = [
  { id: 'cluz-spolecne', date: '2025-06-19', vi: 6, pol: 'proti-tezbe',
    label: 'Návrh svolat společné jednání zastupitelů NS a Rynholce k memorandu ČLUZ (NEPŘIJATO 5-8-4)' },
  { id: 'cluz-podpis',   date: '2025-06-19', vi: 7, pol: 'pro-tezbe',
    label: 'Memorandum o spolupráci s ČLUZ a.s. – uložení starostovi podepsat (PŘIJATO 12-2-3)' },
  { id: 'cluz-zruseni',  date: '2025-07-15', vi: 5, pol: 'proti-tezbe',
    label: 'Zrušení usnesení o memorandu ČLUZ a informování společnosti (NEPŘIJATO 7-6-3)' },
  { id: 'cluz-rev',      date: '2025-10-09', vi: 5, pol: 'pro-tezbe',
    label: 'Memorandum ČLUZ – zpráva výboru / potvrzení postupu (12-2-4)' },
  { id: 'cluz-vybor',    date: '2025-10-09', vi: 20, pol: 'proti-tezbe',
    label: 'Návrh uložit výboru pro strategický rozvoj zabývat se memorandem ČLUZ (NEPŘIJATO 8-0-11)' },
];

const meetings = JSON.parse(fs.readFileSync('meetings.json', 'utf8'));
const idx = {};
for (const m of meetings) for (const v of m.votes) idx[m.date + '#' + v.i] = { m, v };

function resolve(list) {
  return list.map(k => {
    const hit = idx[k.date + '#' + k.vi];
    if (!hit) { console.error('CHYBÍ hlasování', k.id, k.date, k.vi); return null; }
    return { ...k, v: hit.v, num: hit.m.num, url: hit.m.url, valid: hit.v.valid };
  }).filter(Boolean);
}

const key = resolve(KEY_VOTES), cluz = resolve(CLUZ_VOTES);

// --- index postoje k výstavbě
// Za každé hlasování dostane zastupitel skóre:
//   +1 = zabrzdil/odmítl výstavbu, 0.5 = zdržel se u prorůstového návrhu,
//    0 = nebyl přítomen / neutrální, -1 = podpořil výstavbu
const stats = {};
for (const r of ROSTER) stats[r.k] = { ...r, body: 0, ucast: 0, protiVystavbe: 0, proVystavbe: 0, zdrzel: 0, detail: [] };

for (const k of key) {
  if (k.pol === 'neutral') continue;
  const { v } = k;
  const was = n => v.pro.includes(n) || v.proti.includes(n) || v.zdrzel.includes(n) || v.nehlasoval.includes(n);
  for (const r of ROSTER) {
    if (!aktivni(r, k.date) || !was(r.k)) continue;
    const s = stats[r.k]; s.ucast++;
    let how, pts;
    if (k.pol === 'pro-vystavbe') {
      if (v.proti.includes(r.k)) { how = 'PROTI'; pts = 1; s.protiVystavbe++; }
      else if (v.zdrzel.includes(r.k) || v.nehlasoval.includes(r.k)) { how = 'zdržel se'; pts = 0.5; s.zdrzel++; }
      else { how = 'PRO'; pts = -1; s.proVystavbe++; }
    } else { // proti-vystavbe: hlas PRO = brzda výstavby
      if (v.pro.includes(r.k)) { how = 'PRO (brzda)'; pts = 1; s.protiVystavbe++; }
      else if (v.zdrzel.includes(r.k) || v.nehlasoval.includes(r.k)) { how = 'zdržel se'; pts = 0; s.zdrzel++; }
      else { how = 'PROTI (brzdy)'; pts = -1; s.proVystavbe++; }
    }
    s.body += pts;
    s.detail.push({ id: k.id, date: k.date, how, pts, pol: k.pol, dev: k.dev });
  }
}

for (const s of Object.values(stats)) s.index = s.ucast ? +(s.body / s.ucast).toFixed(2) : null;
fs.writeFileSync('vystavba_index.json', JSON.stringify({ stats, key, cluz }, null, 1));

console.log(`Klíčových hlasování k výstavbě: ${key.length} (z toho ověřeno: ${key.filter(k => k.valid).length})`);
console.log(`Hlasování k těžbě ČLUZ: ${cluz.length} (ověřeno: ${cluz.filter(k => k.valid).length})\n`);
console.log('INDEX POSTOJE K VÝSTAVBĚ  (+1 = maximálně brzdí výstavbu, -1 = maximálně podporuje)\n');
console.log('jméno'.padEnd(30), 'klub'.padEnd(16), 'účast'.padStart(6), 'index'.padStart(7), 'protiV'.padStart(7), 'zdrž'.padStart(5), 'proV'.padStart(5));
for (const s of Object.values(stats).sort((a, b) => (b.index ?? -9) - (a.index ?? -9)))
  console.log(s.disp.slice(0, 29).padEnd(30), s.klub.padEnd(16), `${s.ucast}/${key.filter(k => k.pol !== 'neutral' && aktivni(s, k.date)).length}`.padStart(6),
    String(s.index ?? '—').padStart(7), String(s.protiVystavbe).padStart(7), String(s.zdrzel).padStart(5), String(s.proVystavbe).padStart(5));
