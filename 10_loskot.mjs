import fs from 'fs';
const files = fs.readdirSync('txt').filter(f=>f.endsWith('.txt'));
const out = [];
for (const f of files.sort()) {
  const t = fs.readFileSync('txt/'+f,'utf8').replace(/\s+/g,' ');
  const re = /Loskot[a-zěščřžýáíéůúóť]*/g; let m;
  while ((m = re.exec(t))) {
    out.push({ file: f, word: m[0], ctx: t.slice(Math.max(0,m.index-1500), m.index+1500) });
  }
}
console.log('Výskytů:', out.length);
for (const o of out) { console.log('\n================', o.file, '['+o.word+']'); console.log(o.ctx); }
