import fs from 'fs';
const rows = JSON.parse(fs.readFileSync('hlasovani.json','utf8'));
const meetings = JSON.parse(fs.readFileSync('meetings.json','utf8'));
const vmap = {};
for (const m of meetings) for (const v of m.votes) vmap[m.date+'#'+v.i] = v.valid;
// jen hlasování ověřená proti deklarovaným počtům a s tématem výstavba/developer
const sel = rows.filter(r => vmap[r.date+'#'+r.vi] && (r.tags.includes('developer')||r.tags.includes('vystavba')) );
console.log('ověřených tematických hlasování:', sel.length, '\n');
for (const r of sel) {
  console.log(`@@ ${r.date} ZM${r.num??''} v${r.vi} | ${r.nPro}-${r.nProti}-${r.nZdr}`);
  console.log(`   BOD ${r.bodN}) ${r.bod.slice(0,110)}`);
  console.log(`   ${r.usneseni.slice(0,260)}`);
  if (r.proti.length) console.log(`   PROTI:  ${r.proti.join(', ')}`);
  if (r.zdrzel.length) console.log(`   ZDRZEL: ${r.zdrzel.join(', ')}`);
}
