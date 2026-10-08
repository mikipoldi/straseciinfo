// Účast a hlasovací statistiky za volební období 2022–2026
import fs from 'fs';
import { ROSTER, RADA, aktivni, KOALICE } from './roster.mjs';

const TERM_START = '2022-10-01';
const meetings = JSON.parse(fs.readFileSync('meetings.json', 'utf8'));
const ms = meetings.filter(m => m.date >= TERM_START);
const zm = ms.filter(m => m.org === 'ZM'), rm = ms.filter(m => m.org === 'RM');

const stats = {};
for (const r of ROSTER) stats[r.k] = { ...r, zmTotal: 0, zmPresent: 0, rmTotal: 0, rmPresent: 0, votes: 0, pro: 0, proti: 0, zdrzel: 0, nehlasoval: 0 };

for (const m of zm) {
  const seen = new Set();
  m.votes.forEach(v => [...v.pro, ...v.proti, ...v.zdrzel, ...v.nehlasoval].forEach(k => seen.add(k)));
  m.presentDerived = [...seen];
  for (const r of ROSTER) {
    if (!aktivni(r, m.date)) continue;
    stats[r.k].zmTotal++;
    if (seen.has(r.k)) stats[r.k].zmPresent++;
  }
  for (const v of m.votes) for (const kind of ['pro', 'proti', 'zdrzel', 'nehlasoval'])
    for (const k of v[kind]) { stats[k][kind]++; stats[k].votes++; }
}

for (const m of rm) for (const k of RADA) {
  stats[k].rmTotal++;
  if (m.present.includes(k)) stats[k].rmPresent++;
}

fs.writeFileSync('ucast.json', JSON.stringify(stats, null, 1));
fs.writeFileSync('meetings.json', JSON.stringify(meetings, null, 1));

const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '—';
console.log(`Volební období 2022–2026: ${zm.length} jednání ZM, ${rm.length} jednání RM, ${zm.reduce((a, b) => a + b.votes.length, 0)} jmenných hlasování\n`);
console.log('jméno'.padEnd(28), 'klub'.padEnd(16), 'ZM účast'.padStart(9), 'RM účast'.padStart(9), '| hlas'.padStart(6), 'pro'.padStart(5), 'proti'.padStart(6), 'zdrž'.padStart(5), '%proti+zdrž');
for (const s of Object.values(stats).sort((a, b) => (b.zmPresent / (b.zmTotal || 1)) - (a.zmPresent / (a.zmTotal || 1)))) {
  const dis = s.votes ? (100 * (s.proti + s.zdrzel) / s.votes).toFixed(1) + '%' : '—';
  console.log(s.disp.slice(0, 27).padEnd(28), s.klub.padEnd(16),
    `${s.zmPresent}/${s.zmTotal} ${pct(s.zmPresent, s.zmTotal)}`.padStart(9),
    (s.rmTotal ? `${s.rmPresent}/${s.rmTotal} ${pct(s.rmPresent, s.rmTotal)}` : '—').padStart(9),
    '|', String(s.votes).padStart(4), String(s.pro).padStart(5), String(s.proti).padStart(6), String(s.zdrzel).padStart(5), dis.padStart(8));
}
console.log('\nKoalice:', ROSTER.filter(r => KOALICE.has(r.klub)).length, 'osob /', 'Opozice:', ROSTER.filter(r => !KOALICE.has(r.klub)).length, 'osob');
