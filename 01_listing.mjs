// Projde stránkované výpisy zápisů ZM a RM, vytáhne odkazy na detailní stránky
import fs from 'fs';
const BASE = 'https://www.novestraseci.cz';
const SECTIONS = [
  { key: 'ZM', path: '/samosprava/zapisy-a-videozaznamy-ze-zastupitelstva/', pages: 5 },
  { key: 'RM', path: '/samosprava/zapisy-rady-mesta/', pages: 18 },
];

const get = async (url) => {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.text();
    } catch {}
    await new Promise(s => setTimeout(s, 800 * (i + 1)));
  }
  throw new Error('fail ' + url);
};

const items = [];
for (const s of SECTIONS) {
  for (let p = 1; p <= s.pages; p++) {
    const html = await get(`${BASE}${s.path}?page=${p}`);
    const re = /<a href="([^"]+)" class="event-link">[\s\S]*?class="event-name">([\s\S]*?)<\/h3>[\s\S]*?event-info-value event-date">([^<]*)</g;
    let m, n = 0;
    while ((m = re.exec(html))) {
      items.push({
        org: s.key,
        url: m[1].startsWith('http') ? m[1] : BASE + m[1],
        title: m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(),
        published: m[3].trim(),
      });
      n++;
    }
    console.log(`${s.key} page ${p}: ${n}`);
  }
}
fs.writeFileSync('zapisy_listing.json', JSON.stringify(items, null, 2));
console.log('Celkem záznamů:', items.length);
