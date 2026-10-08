// Jak často se každý ze 126 kandidátů 2026 objevuje v zápisech ZM/RM za volební období
// (jako zastupitel, radní, host, nebo občan vystupující v rozpravě).
// Matchuje se "Jméno Příjmení" vedle sebe, aby se vyloučily náhodné shody příjmení.
import fs from 'fs';

const kand = JSON.parse(fs.readFileSync('kandidati.json', 'utf8'));
const meetings = JSON.parse(fs.readFileSync('meetings.json', 'utf8'))
  .filter(m => m.date >= '2022-10-01');

// "Příjmení Jméno Tituly" -> {pr, jm}
const TIT = /^(Mgr|Ing|Bc|BcA|MUDr|JUDr|RNDr|PhDr|MVDr|Dr|prof|doc|MBA|LL|DiS|Ph|CSc|EFP|plk|mjr|npor|et|arch)\.?$/i;
function split(jmeno) {
  const w = jmeno.replace(/,/g, ' ').split(/\s+/).filter(Boolean).filter(x => !TIT.test(x.replace(/\.$/, '')));
  return { pr: w[0], jm: w[1] };
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[üÜ]/g, c => (c === 'ü' ? '[üű]' : '[ÜŰ]'));

// texty všech zápisů (bez diakritických variant)
const docs = meetings.map(m => ({
  org: m.org, date: m.date, num: m.num, url: m.url,
  t: fs.readFileSync(m.file, 'utf8').replace(/\s+/g, ' '),
}));

const out = [];
for (const k of kand) {
  const { pr, jm } = split(k.jmeno);
  if (!pr || !jm) { out.push({ ...k, mentions: 0, meetings: 0, zm: 0, rm: 0, first: null, last: null }); continue; }
  const re = new RegExp(esc(jm) + '\\s+' + esc(pr) + '(?![a-záčďéěíňóřšťúůýž])', 'g');
  let mentions = 0, mt = [], zm = 0, rm = 0;
  for (const d of docs) {
    re.lastIndex = 0;
    const n = (d.t.match(re) || []).length;
    if (n) { mentions += n; mt.push(d.date); if (d.org === 'ZM') zm++; else rm++; }
  }
  out.push({ ...k, prijmeni: pr, jmenoK: jm, mentions, meetings: mt.length, zm, rm, first: mt.sort()[0] ?? null, last: mt.sort().at(-1) ?? null });
}
fs.writeFileSync('kandidati_aktivita.json', JSON.stringify(out, null, 1));

const act = out.filter(x => x.mentions > 0).sort((a, b) => b.mentions - a.mentions);
console.log(`Kandidátů celkem: ${out.length} | zmíněných v zápisech: ${act.length}\n`);
console.log('jméno'.padEnd(34), 'strana'.padEnd(34), '#', 'zmínek'.padStart(7), 'jednání'.padStart(8), 'ZM'.padStart(4), 'RM'.padStart(4));
for (const a of act) console.log(a.jmeno.slice(0, 33).padEnd(34), a.strana.slice(0, 33).padEnd(34), String(a.cislo).padStart(2),
  String(a.mentions).padStart(7), String(a.meetings).padStart(8), String(a.zm).padStart(4), String(a.rm).padStart(4));
