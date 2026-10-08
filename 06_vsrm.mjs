import fs from 'fs';
const h = fs.readFileSync('web/vsrm.html','utf8');
const BASE='https://www.novestraseci.cz';
const links = [...h.matchAll(/href="(\/e_download\.php\?file=[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
  .map(m=>({url: BASE+m[1].replace(/&amp;/g,'&'), t:m[2].replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}));
console.log('odkazů:', links.length);
fs.mkdirSync('vsrm',{recursive:true});
let i=0;
for (const l of links) {
  const n = `vsrm/${String(++i).padStart(2,'0')}.pdf`;
  if (fs.existsSync(n)) continue;
  try { const r=await fetch(l.url); const b=Buffer.from(await r.arrayBuffer());
    if (b.slice(0,4).toString()==='%PDF') fs.writeFileSync(n,b); else console.log('nePDF',l.t); } catch(e){ console.log('err',l.t); }
}
fs.writeFileSync('vsrm_links.json', JSON.stringify(links,null,1));
console.log('stazeno:', fs.readdirSync('vsrm').length);
