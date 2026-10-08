import fs from 'fs';
const items = JSON.parse(fs.readFileSync('zapisy_detail.json','utf8'));
fs.mkdirSync('pdf', {recursive:true});
const pad = n => String(n).padStart(3,'0');
const d = x => { const t=new Date(x.meetingDate); return `${t.getFullYear()}-${pad(t.getMonth()+1).slice(1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; };
let i=0, fails=[];
for (const it of items) {
  const url = it.attachments[0].replace(/&amp;/g,'&');
  const name = `${it.org}_${d(it)}_${pad(++i)}.pdf`;
  it.pdf = 'pdf/'+name;
  if (fs.existsSync('pdf/'+name) && fs.statSync('pdf/'+name).size > 5000) continue;
  let ok=false;
  for (let a=0;a<4 && !ok;a++) {
    try {
      const r = await fetch(url);
      if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); if (b.length>5000 && b.slice(0,4).toString()==='%PDF') { fs.writeFileSync('pdf/'+name, b); ok=true; } }
    } catch {}
    if(!ok) await new Promise(s=>setTimeout(s,900*(a+1)));
  }
  if (!ok) fails.push([name,url]);
  if (i%15===0) console.log(i,'/',items.length);
}
fs.writeFileSync('zapisy_detail.json', JSON.stringify(items,null,2));
console.log('Stazeno. Chyby:', fails.length); fails.forEach(f=>console.log(' ',f[0],f[1]));
