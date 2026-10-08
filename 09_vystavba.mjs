// Klasifikuje jmenná hlasování ZM podle témat (výstavba / developer / pozemky / těžba)
// Bod programu se přiřazuje podle pozice: každé hlasování patří k nejbližšímu
// předcházejícímu nadpisu "N) Název bodu" v textu zápisu.
import fs from 'fs';

const meetings = JSON.parse(fs.readFileSync('meetings.json', 'utf8'))
  .filter(m => m.org === 'ZM' && m.date >= '2022-10-01');

function clean(t) {
  return t.replace(/\f/g, '\n')
    .replace(/^\s*\d+\.\s*(zasedání|schůze)\s+(zastupitelstva|rady)\s+města\s*[–-].*$/gmi, '')
    .replace(/^\s*\d{1,3}\s*$/gm, '').replace(/ /g, ' ');
}

// nadpisy bodů v těle zápisu: řádek začínající "12)" nebo "12 )"
function headings(t) {
  const out = [];
  const re = /^[ \t]*(\d{1,2})[ \t]*\)[ \t]*(\S.{3,150})$/gm;
  let m;
  while ((m = re.exec(t))) out.push({ pos: m.index, n: +m[1], title: m[2].replace(/\s+/g, ' ').trim() });
  return out;
}

const KW = {
  developer: /plánovací smlouv|developer|developm|Auri|energy ?& ?property|bytov[ýéá]\w* dom|obytn[ýá] (?:zóna|soubor)|lokalit[aěyu] Z\d+|Čelechovick|investiční záměr|stavební záměr|zastavovac|RG ALPHA|IMPRESTA/i,
  vystavba: /výstavb|zástavb|stavebník|územní(?:ho|m)? plán|změn[aěyu] č\.\s*\d+\s*územního|regulační plán|zásady pro výstavbu|parcelac|rodinn[ýéá]\w* dom|dopravní nebo technické infrastruktury/i,
  pozemky: /prodej\w* (?:pozemk|části pozemk|připloceného)|směn[aěnyu]\w* (?:smlouv|pozemk)|koup[eěi] (?:pozemk|nemovitost)|nabytí pozemk|odkoupení (?:části )?pozemk/i,
  tezba: /těžb|dobývací|kaolin|pískovn|LB MINERALS|Sedlecký|memorand/i,
};

const rows = [];
for (const m of meetings) {
  const t = clean(fs.readFileSync(m.file, 'utf8'));
  const hs = headings(t);
  for (const v of m.votes) {
    const h = [...hs].reverse().find(x => x.pos < v.pos);
    const ctx = v.ctx;
    const iu = Math.max(ctx.lastIndexOf('s c h v a l u j e'), ctx.lastIndexOf('n e s c h v a l u j e'),
      ctx.lastIndexOf('b e r e'), ctx.lastIndexOf('u k l á d á'), ctx.lastIndexOf('s o u h l a s í'),
      ctx.lastIndexOf('n e s o u h l a s í'), ctx.lastIndexOf('v y d á v á'), ctx.lastIndexOf('r o z h o d l'));
    const usn = (iu > 0 ? ctx.slice(iu) : ctx.slice(-800)).replace(/\s+/g, ' ');
    const bod = h ? h.title : '';
    const hay = bod + ' || ' + usn;
    const tags = Object.entries(KW).filter(([, re]) => re.test(hay)).map(([k]) => k);
    rows.push({
      date: m.date, num: m.num, vi: v.i, bodN: h?.n ?? null, bod, usneseni: usn.slice(0, 700), tags,
      pro: v.pro, proti: v.proti, zdrzel: v.zdrzel, nehlasoval: v.nehlasoval,
      nPro: v.pro.length, nProti: v.proti.length, nZdr: v.zdrzel.length, url: m.url, file: m.file, pos: v.pos,
    });
  }
}
fs.writeFileSync('hlasovani.json', JSON.stringify(rows, null, 1));

const tagged = rows.filter(r => r.tags.length);
console.log(`Hlasování: ${rows.length} | s tématem: ${tagged.length} | s nalezeným bodem: ${rows.filter(r => r.bod).length}`);
for (const k of Object.keys(KW)) console.log(`  ${k}: ${rows.filter(r => r.tags.includes(k)).length}`);

console.log('\n=== TÉMATICKÁ HLASOVÁNÍ (výstavba/developer/pozemky/těžba) ===');
for (const r of tagged) {
  console.log(`\n### ${r.date} ZM${r.num ?? ''} v${r.vi} [${r.tags.join(',')}] pro:${r.nPro} proti:${r.nProti} zdrž:${r.nZdr}`);
  console.log(`BOD ${r.bodN ?? '?'}) ${r.bod.slice(0, 150)}`);
  console.log(`USN: ${r.usneseni.slice(0, 380)}`);
  if (r.proti.length) console.log(`PROTI:  ${r.proti.join(', ')}`);
  if (r.zdrzel.length) console.log(`ZDRŽEL: ${r.zdrzel.join(', ')}`);
  if (r.nehlasoval.length) console.log(`NEHLAS: ${r.nehlasoval.join(', ')}`);
}
