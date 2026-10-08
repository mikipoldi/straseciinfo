import fs from 'fs';
const all = JSON.parse(fs.readFileSync('zapisy_listing.json','utf8'));
// datum jednání vytáhneme z titulku "ze dne D.M.YYYY", fallback na datum zveřejnění
const parse = (s) => { const m = /(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/.exec(s); return m ? new Date(+m[3], +m[2]-1, +m[1]) : null; };
for (const it of all) {
  it.meetingDate = parse(it.title) || parse(it.published);
  const n = /(\d+)\s*\.\s*(zasedání|rady|schůz)/i.exec(it.title);
  it.num = n ? +n[1] : null;
}
const cutoff = new Date(2022, 8, 1); // od 1.9.2022 (volební období 2022-2026)
const sel = all.filter(it => it.meetingDate && it.meetingDate >= cutoff);
sel.sort((a,b) => a.meetingDate - b.meetingDate);
console.log('Celkem:', all.length, '| od 9/2022:', sel.length);
console.log('ZM:', sel.filter(x=>x.org==='ZM').length, 'RM:', sel.filter(x=>x.org==='RM').length);
console.log('Rozsah:', sel[0].meetingDate.toISOString().slice(0,10), '→', sel.at(-1).meetingDate.toISOString().slice(0,10));
console.log('\nZM seznam:');
sel.filter(x=>x.org==='ZM').forEach(x=>console.log(' ', x.meetingDate.toISOString().slice(0,10), x.num, x.title.slice(0,70)));
fs.writeFileSync('zapisy_filtered.json', JSON.stringify(sel,null,2));
