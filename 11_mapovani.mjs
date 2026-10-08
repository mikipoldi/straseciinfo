import fs from 'fs';
import { ROSTER } from './roster.mjs';
const kand = JSON.parse(fs.readFileSync('kandidati.json','utf8'));
// kandidáti: jméno je "Příjmení Jméno Tituly"
const norm = s => s.normalize('NFC').replace(/ű/g,'ü');
for (const r of ROSTER) {
  const hit = kand.filter(k => {
    const w = norm(k.jmeno).split(/\s+/);
    return w[0] === norm(r.pr) && w[1] === norm(r.jm);
  });
  console.log((r.disp+'  ['+r.klub+']').padEnd(52), hit.length ? hit.map(h=>`${h.strana} #${h.cislo} – ${h.zamestnani}`).join(' | ') : '*** NEKANDIDUJE 2026 ***');
}
console.log('\n--- kandidáti 2026, kteří nebyli zastupiteli, ale jsou v zápisech aktivní (kontrola jmen):');
const sur = new Set(ROSTER.map(r=>norm(r.pr)));
console.log(kand.filter(k=>sur.has(norm(k.jmeno).split(/\s+/)[0])).map(k=>`${k.jmeno} (${k.strana} #${k.cislo})`).join('\n'));
