// Zjistí všechny osoby vyskytující se ve jmenných hlasováních ZM a v jakém období
import fs from 'fs';

const meetings = JSON.parse(fs.readFileSync('meetings.json', 'utf8'))
  .filter(m => m.org === 'ZM' && m.date >= '2022-10-01');

// kanonizace: sjednotit unicode varianty (Bűnter/Bünter) a diakritické rozdíly v křestních
const fix = (s) => s.replace(/ű/g, 'ü').replace(/Ű/g, 'Ü').normalize('NFC');

const people = {};
for (const m of meetings) {
  for (const v of m.votes) {
    for (const [kind, arr] of Object.entries({ pro: v.pro, proti: v.proti, zdrzel: v.zdrzel, nehlasoval: v.nehlasoval })) {
      for (const raw of arr) {
        const k = fix(raw);
        (people[k] ??= { k, n: 0, dates: new Set(), kinds: {} });
        people[k].n++;
        people[k].dates.add(m.date);
        people[k].kinds[kind] = (people[k].kinds[kind] || 0) + 1;
      }
    }
  }
}

const list = Object.values(people).map(p => ({
  k: p.k, n: p.n, meetings: p.dates.size,
  first: [...p.dates].sort()[0], last: [...p.dates].sort().at(-1),
})).sort((a, b) => b.n - a.n);

console.log('Distinct jmen v hlasováních:', list.length, '\n');
console.log('jméno'.padEnd(34), 'výskytů'.padStart(7), 'jednání'.padStart(7), 'od'.padStart(11), 'do'.padStart(11));
for (const p of list) console.log(p.k.padEnd(34), String(p.n).padStart(7), String(p.meetings).padStart(7), p.first.padStart(11), p.last.padStart(11));
fs.writeFileSync('osoby_raw.json', JSON.stringify(list, null, 1));
