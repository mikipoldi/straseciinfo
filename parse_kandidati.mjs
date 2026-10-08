import fs from 'fs';
const d = JSON.parse(fs.readFileSync('kandidati_raw.json','utf8'));
const out = [];
for (const [sid, s] of Object.entries(d.platni)) {
  for (const r of s.seznam) {
    out.push({ strana: s.stranaNazev, stranaId: sid, cislo: r[0], jmeno: r[1], vek: r[2], navrh: r[3], prislusnost: r[4], zamestnani: r[5], bydliste: r[6] });
  }
}
fs.writeFileSync('kandidati.json', JSON.stringify(out,null,2));
console.log('Celkem kandidátů:', out.length);
const byStrana = {};
out.forEach(c => (byStrana[c.strana] ??= []).push(c));
for (const [k,v] of Object.entries(byStrana)) {
  console.log(`\n### ${k} (${v.length})`);
  v.forEach(c => console.log(`  ${c.cislo}. ${c.jmeno} | ${c.vek} | ${c.navrh}/${c.prislusnost} | ${c.zamestnani}`));
}
