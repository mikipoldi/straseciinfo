import fs from 'fs';
const items = JSON.parse(fs.readFileSync('zapisy_filtered.json','utf8'));
const BASE = 'https://www.novestraseci.cz';
const get = async (url) => { for (let i=0;i<4;i++){ try { const r = await fetch(url); if (r.ok) return await r.text(); } catch{} await new Promise(s=>setTimeout(s,700*(i+1))); } return null; };

fs.mkdirSync('detail', {recursive:true});
let ok=0;
for (const [i,it] of items.entries()) {
  const slug = it.url.split('/').pop().replace(/\.html$/,'');
  const f = `detail/${it.org}_${slug}.html`;
  if (!fs.existsSync(f)) {
    const h = await get(it.url);
    if (!h) { console.log('FAIL', it.url); continue; }
    fs.writeFileSync(f, h);
  }
  const h = fs.readFileSync(f,'utf8');
  // odkazy na přílohy (PDF/DOC) a youtube
  const files = [...h.matchAll(/href="([^"]*\/data\/[^"]*|[^"]*\.(?:pdf|doc|docx)(?:\?[^"]*)?)"/gi)].map(m=>m[1]);
  it.detailFile = f;
  it.attachments = [...new Set(files)].map(u => u.startsWith('http') ? u : BASE + u);
  it.youtube = [...new Set([...h.matchAll(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/g)].map(m=>m[1]))];
  ok++;
  if (i%20===0) console.log(i, it.org, it.attachments.length, 'příloh');
}
fs.writeFileSync('zapisy_detail.json', JSON.stringify(items,null,2));
const tot = items.reduce((a,b)=>a+(b.attachments?.length||0),0);
console.log('Hotovo:',ok,'/ příloh celkem:',tot);
console.log('Bez příloh:', items.filter(x=>!x.attachments?.length).length);
console.log('\nVzorek příloh:'); items.slice(0,3).forEach(x=>console.log(x.org, x.title.slice(0,40), JSON.stringify(x.attachments)));
