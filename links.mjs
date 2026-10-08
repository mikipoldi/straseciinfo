import fs from 'fs';
const h = fs.readFileSync(process.argv[2],'utf8');
const re = /href="([^"]+)"[^>]*>([\s\S]{0,200}?)<\/a>/g;
const seen = new Set(); let m;
const filt = process.argv[3];
while ((m = re.exec(h))) {
  const txt = m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const key = m[1];
  if (seen.has(key)) continue; seen.add(key);
  if (filt && !(key+txt).toLowerCase().includes(filt.toLowerCase())) continue;
  console.log(key, '||', txt.slice(0,110));
}
