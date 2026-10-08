// Parsuje zápisy ZM/RM: prezence + jmenná hlasování.
// Jména se nehledají rozsekáním podle čárek (v PDF se do seznamů vlamují
// záhlaví/zápatí stránek), ale přímým matchováním proti jmenování ZM 2022–2026.
// Každé hlasování se validuje proti větě "Pro toto usnesení hlasovalo N členů,
// M členů hlasovalo proti a K členů se zdrželo hlasování." přímo před blokem.
import fs from 'fs';
import { PATTERNS } from './roster.mjs';

const meta = JSON.parse(fs.readFileSync('zapisy_detail.json', 'utf8'));

export function clean(t) {
  return t.replace(/\f/g, '\n')
    .replace(/^\s*\d+\.\s*(zasedání|schůze)\s+(zastupitelstva|rady)\s+města\s*[–-].*$/gmi, '')
    .replace(/^\s*\d{1,3}\s*$/gm, '').replace(/ /g, ' ');
}

function findNames(seg) {
  const out = [];
  for (const p of PATTERNS) { p.re.lastIndex = 0; if (p.re.test(seg)) out.push(p.k); }
  return out;
}

const LABELS = [
  ['pro', /\bPro\s*:/],
  ['proti', /\bProti\s*:/],
  ['zdrzel', /\bZdržel[ai]?\s+se\s*:|\bZdrželi\s+se\s*:|\bZdrželi\s*:|\bZdržela\s+se\s*:/],
  ['nehlasoval', /\bNehlasoval[iay]?\s*:|\bNehlasovali\s*:/],
];

function parseVoteBlock(body) {
  const marks = [];
  for (const [key, re] of LABELS) {
    const r = new RegExp(re.source, 'gi');
    let m;
    while ((m = r.exec(body))) marks.push({ key, start: m.index, end: m.index + m[0].length });
  }
  marks.sort((a, b) => a.start - b.start);
  const out = { pro: [], proti: [], zdrzel: [], nehlasoval: [] };
  for (let i = 0; i < marks.length; i++)
    out[marks[i].key].push(...findNames(body.slice(marks[i].end, i + 1 < marks.length ? marks[i + 1].start : body.length)));
  for (const k of Object.keys(out)) out[k] = [...new Set(out[k])];
  const taken = new Set();
  for (const k of ['proti', 'zdrzel', 'nehlasoval', 'pro']) {
    out[k] = out[k].filter(n => !taken.has(n));
    out[k].forEach(n => taken.add(n));
  }
  return out;
}

// deklarované počty ve větě bezprostředně před blokem "(Pro: ...)"
const NUM = { jeden: 1, jedna: 1, dva: 2, dvě: 2, tři: 3, čtyři: 4, pět: 5, šest: 6, sedm: 7, osm: 8, devět: 9, deset: 10 };
const n = s => s == null ? null : (/^\d+$/.test(s) ? +s : (NUM[s.toLowerCase()] ?? null));
// Deklarované počty: v zápisech vždy číslicí a vždy se slovem "člen*".
// POZOR: \w v JS nepokrývá českou diakritiku ("členů", "členové"),
// proto se koncovky slov matchují jako [^\s,.;:] .
const D = '(\\d{1,2})';
const T = '[^\\s,.;:()]*';                 // zbytek slova včetně diakritiky
const CL = `\\s*člen${T}`;
const ZM_ = '\\s*(?:zastupitelstva\\s*města)?\\s*';
const PRO_RES = [
  new RegExp(`Pro\\s+(?:\\S+\\s+){0,3}?hlasoval[oi]${ZM_}${D}${CL}`, 'gi'),
  new RegExp(`Pro\\s+hlasoval[oi]\\s+${D}${CL}`, 'gi'),
  new RegExp(`by[lt]${T}\\s+(?:schválen|přijat|zvolen)${T}\\s+${D}${CL}`, 'gi'),
  new RegExp(`výsledek\\s+hlasování\\s*:?\\s*pro\\s+${D}${CL}`, 'gi'),
];
const PROTI_RES = [new RegExp(`${D}${CL}${ZM_}hlasoval[oi]\\s+proti`, 'i'), new RegExp(`proti\\s*:?\\s*${D}${CL}`, 'i')];
const ZDR_RES = [new RegExp(`${D}${CL}${ZM_}se\\s+zdržel${T}`, 'i'), new RegExp(`zdržel${T}\\s+se\\s+${D}${CL}`, 'i')];
const NEH_RES = [new RegExp(`${D}${CL}${ZM_}nehlasoval${T}`, 'i'), new RegExp(`nehlasoval${T}\\s+${D}${CL}`, 'i')];

function declared(before) {
  const tail = before.slice(-900).replace(/\s+/g, ' ');
  // nejbližší (nejpozdější) věta o výsledku hlasování před blokem jmen
  let m = null, idx = -1;
  for (const re of PRO_RES) {
    re.lastIndex = 0;
    let mm, last = null;
    while ((mm = re.exec(tail))) last = mm;
    if (last && last.index > idx) { m = last; idx = last.index; }
  }
  if (!m) return null;
  const rest = tail.slice(idx);
  const first = (res) => { for (const re of res) { const x = re.exec(rest); if (x) return +x[1]; } return 0; };
  return { pro: +m[1], proti: first(PROTI_RES), zdrzel: first(ZDR_RES), nehlasoval: first(NEH_RES) };
}

// U části PDF (např. ZM 24.4.2025) je obsah stránek v jiném pořadí a volba
// pdftotext -layout seznamy jmen rozláme. Pro každý zápis proto zkusíme obě
// varianty extrakce a použijeme tu, která dá víc ověřených hlasování.
function parseOne(t, org) {
  const rec = { present: [], excused: [], votes: [], presentCount: undefined };
  if (org === 'RM') {
    const norm = t
      .replace(/P\s?ř\s?í\s?t\s?o\s?m\s?n\s?i\s?\s*:/i, '###PRITOMNI###')
      .replace(/O\s?m\s?l\s?u\s?v\s?e\s?n\s?[aiy]?\s?\s*:/gi, '###OMLUVEN###')
      .replace(/N\s?e\s?p\s?ř\s?í\s?t\s?o\s?m\s?e\s?n\s?\s*:/gi, '###OMLUVEN###')
      .replace(/H\s?o\s?s\s?t\s?[éi]?\s?\s*:/i, '###HOST###')
      .replace(/O\s?v\s?ě\s?ř\s?o\s?v\s?a\s?t\s?e\s?l\s?[eé]/i, '###OVER###');
    const seg = /###PRITOMNI###([\s\S]*?)(###HOST###|###OVER###|Program\s*:)/.exec(norm);
    if (seg) {
      const parts = seg[1].split('###OMLUVEN###');
      rec.present = findNames(parts[0]);
      if (parts[1]) rec.excused = findNames(parts.slice(1).join(' '));
      rec.present = rec.present.filter(x => !rec.excused.includes(x));
    }
  } else {
    const pr = /Přítomn[oi]\s*:?\s*(\d+)\s*(?:členů|člen|členy)/i.exec(t);
    if (pr) rec.presentCount = +pr[1];
  }
  const vre = /\((?:Pro|Proti|Zdržel|Zdrželi|Nehlasoval)[^)]{10,4000}?\)/gs;
  let v, idx = 0;
  while ((v = vre.exec(t))) {
    const res = parseVoteBlock(v[0].slice(1, -1));
    if (res.pro.length + res.proti.length + res.zdrzel.length + res.nehlasoval.length === 0) continue;
    const dec = declared(t.slice(0, v.index));
    const ok = dec != null && res.pro.length === dec.pro && res.proti.length === dec.proti
      && res.zdrzel.length === dec.zdrzel && res.nehlasoval.length === dec.nehlasoval;
    rec.votes.push({
      i: idx++, pos: v.index, ...res, declared: dec, valid: ok,
      ctx: t.slice(Math.max(0, v.index - 2600), v.index).replace(/\s+/g, ' '),
    });
  }
  return rec;
}

const meetings = [];
for (const m of meta) {
  const f = m.pdf.replace('pdf/', 'txt/').replace('.pdf', '.txt');
  if (!fs.existsSync(f)) { console.log('chybí', f); continue; }
  const t = clean(fs.readFileSync(f, 'utf8'));
  const d = new Date(m.meetingDate);
  const f2 = m.pdf.replace('pdf/', 'txt_nolayout/').replace('.pdf', '.txt');
  const cands = [{ src: 'layout', file: f, r: parseOne(t, m.org) }];
  if (fs.existsSync(f2)) {
    const t2 = clean(fs.readFileSync(f2, 'utf8'));
    cands.push({ src: 'nolayout', file: f2, r: parseOne(t2, m.org) });
  }
  const score = c => c.r.votes.filter(v => v.valid).length;
  cands.sort((a, b) => score(b) - score(a));
  const best = cands[0];

  meetings.push({
    org: m.org, num: m.num,
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    title: m.title, file: best.file, src: best.src, url: m.url, ...best.r,
  });
}

fs.writeFileSync('meetings.json', JSON.stringify(meetings, null, 1));
const zm = meetings.filter(x => x.org === 'ZM' && x.date >= '2022-10-01');
const tot = zm.reduce((a, b) => a + b.votes.length, 0);
const val = zm.reduce((a, b) => a + b.votes.filter(v => v.valid).length, 0);
console.log(`ZM (období 2022–2026): ${zm.length} jednání, ${tot} hlasovacích bloků, ${val} ověřeno (${(100 * val / tot).toFixed(0)}%)\n`);
console.log('Neověřené podle jednání:');
for (const x of zm) {
  const bad = x.votes.filter(v => !v.valid);
  if (bad.length) console.log(` ${x.date} č.${x.num ?? '-'}: ${bad.length}/${x.votes.length} neověřeno  (${x.file})`);
}
