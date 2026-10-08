// Vygeneruje finální REPORT.md ze všech připravených datových souborů.
import fs from 'fs';
import { ROSTER, BYKEY, KOALICE, aktivni, VYBORY } from './roster.mjs';

const ucast = JSON.parse(fs.readFileSync('ucast.json', 'utf8'));
const vi = JSON.parse(fs.readFileSync('vystavba_index.json', 'utf8'));
const kand = JSON.parse(fs.readFileSync('kandidati_aktivita.json', 'utf8'));
const meetings = JSON.parse(fs.readFileSync('meetings.json', 'utf8'));
const ms = meetings.filter(m => m.date >= '2022-10-01');
const zm = ms.filter(m => m.org === 'ZM'), rm = ms.filter(m => m.org === 'RM');
const nVotes = zm.reduce((a, b) => a + b.votes.length, 0);
const nValid = zm.reduce((a, b) => a + b.votes.filter(v => v.valid).length, 0);

const SHORT = {
  'Naše město': 'Naše město',
  'Město pro rodinu - rodina pro město': 'MPR-RPM',
  'NEZÁVISLÍ 2018': 'NEZ 2018',
  'Občanská demokratická strana': 'ODS',
  'Město v pohybu': 'Město v pohybu',
  'Společně pro Nové Strašecí a Pecínov': 'Společně',
};
const short = s => SHORT[s] ?? s;

// mapování: kanonický klíč zastupitele -> kandidatura 2026
const esc = s => s.normalize('NFC').replace(/ű/g, 'ü');
function kandidatura(r) {
  return kand.find(k => esc(k.prijmeni || '') === esc(r.pr) && esc(k.jmenoK || '') === esc(r.jm)) ?? null;
}

const pct = (a, b) => b ? Math.round(100 * a / b) + ' %' : '—';
const sgn = n => n == null ? '—' : (n > 0 ? '+' : '') + n.toFixed(2);

// --- hodnocení indexu slovně
function stance(n) {
  if (n == null) return '—';
  if (n >= 0.25) return '🟢🟢 silně brzdí';
  if (n >= 0.10) return '🟢 brzdí';
  if (n >= -0.10) return '🟡 neutrální';
  if (n >= -0.30) return '🟠 podporuje';
  return '🔴 silně podporuje';
}

// --- postoj k projektům Loskot
// Vědomě se NEPOČÍTÁ průměrný index: hlasování jsou jen 3–5 a dvě z nich byla
// téměř jednomyslná, takže průměr by říkal hlavně to, kdo byl kdy přítomen.
// Místo toho se u každého vypisuje, jak hlasoval konkrétně.
const LOSKOT_IDS = ['loskot-dod3a', 'loskot-dod3b', 'auri-zzn', 'zzn-byty', 'z36-neschv'];
// jak kdo hlasoval u konkrétního klíčového hlasování
function jakHlasoval(voteId, k) {
  const kv = vi.key.find(x => x.id === voteId);
  if (!kv) return '—';
  const v = kv.v;
  if (v.pro.includes(k)) return 'PRO';
  if (v.proti.includes(k)) return 'PROTI';
  if (v.zdrzel.includes(k)) return 'zdržel se';
  if (v.nehlasoval.includes(k)) return 'nehlasoval';
  return 'nepřítomen';
}

const L = [];
const p = s => L.push(s);

p('# Komunální volby Nové Strašecí 2026 — podkladový report pro rozhodování');
p('');
p('**Volby:** 9.–10. října 2026 · **Obec:** Nové Strašecí (okres Rakovník, kód 542164) · **Mandátů:** 21');
p('**Report sestaven:** 8. října 2026 · automatizovaně z primárních zdrojů (viz [Metodika](#metodika-a-zdroje))');
p('');
p('> **Jak report číst.** Hlavní hodnotou nejsou názory, ale **jmenné hlasování**. Zápisy ze zastupitelstva');
p('> Nového Strašecí u každého usnesení uvádějí, kdo byl *pro*, *proti* a kdo se *zdržel*. Z 24 jednání');
p('> volebního období se tak dá u každého dosluhujícího zastupitele doložit, jak konkrétně hlasoval');
p('> o konkrétním developerském projektu. U nových kandidátů bez mandátu taková data neexistují —');
p('> u nich lze posuzovat jen stranu, profesi a případnou aktivitu v rozpravě jako občana.');
p('');
p('---');
p('');
p('## 1. Shrnutí: co z dat vychází');
p('');
p('**1) Rozhodující linie města je spor o lokalitu Z36 „Čelechovická“** — bytový projekt na 126 bytů,');
p('za nímž stojí **Mgr. Ing. Rudolf Loskot, LL.M. MBA** (spolu s Ing. Adolfem Bradáčem) přes firmy');
p('*Auri, energy & property s.r.o.* a *Rezidence Křivoklátská – Nové Strašecí s.r.o.* (obě Průmyslová 1208).');
p('Město s investorem vyjednává **přes dva roky** a 17. 9. 2026 — tři týdny před volbami —');
p('plánovací smlouvu **neschválilo** (16 pro, 2 se zdrželi). Viz [sekci 5](#5-příjmení-loskot).');
p('');
p('**2) Dělící linie nejde přes „koalice vs. opozice“, ale přes postoj k výstavbě.**');
p('Vládnoucí koalice (Naše město + MPR-RPM + NEZÁVISLÍ 2018, 13 z 21 mandátů) hlasovala');
p('developerským smlouvám soustavně **pro**. Opozice (Společně pro NS a Pecínov + STAN, ODS)');
p('se u nich opakovaně **zdržovala nebo byla proti**.');
p('');
p('**3) Nejvíce brzdili výstavbu** (z dosluhujících zastupitelů, kteří znovu kandidují):');
p('**Petr Janouš, Pavel Novák a Kamil Černý** — všichni *Společně pro NS a Pecínov*.');
p('Alena Burešová a Jiří Verner (*Město v pohybu*) a Radek Lopour (*Společně*) vycházejí');
p('jen mírně nad neutrálem. Nejsilněji výstavbu podporovali **Jan Bureš a Štěpán Polívka,');
p('Jan Bechyně, Vladimír Kozel a starosta Karel Filip** — tedy jádro koalice.');
p('Mimo kandidaturu vychází jako největší brzda **Ing. Pavel Adelt (+0,35)**, který už ale nekandiduje.');
p('');
p('**3b) Ale u projektů Loskota samotných hlasování listiny téměř nerozlišují.** Do roku 2025 je podpořili');
p('prakticky všichni zastupitelé napříč koalicí i opozicí (souhlas s bytovými domy v areálu ZZN prošel');
p('**19–0–0 jednomyslně**) a v září 2026 naopak prakticky všichni podpořili zamítnutí smlouvy k Z36.');
p('**Za celé volební období nehlasoval proti žádnému Loskotovu bodu ani jeden zastupitel.**');
p('Jediná výjimka na konci: **ODS se u zamítnutí Z36 jako jediná zdržela**.');
p('');
p('**4) Pozor na dvě zdánlivě „protivýstavbová“ jména.** Ing. et Ing. David Hubáček a Ing. Pavel Vaic (**ODS**)');
p(`mají vysoký počet hlasů „zdržel se“ (${ucast['Hubáček David'].zdrzel} a ${ucast['Vaic Pavel'].zdrzel} z celého období — nejvíc ze všech),`);
p('ale je to **plošné zdržování u většiny usnesení**, ne cílený postoj k výstavbě.');
p('U klíčového hlasování o zamítnutí smlouvy Z36 (17. 9. 2026) byli jediní dva, kdo se **zdržel** —');
p('tedy nepodpořili ani zamítnutí projektu Loskota. Jejich index výstavby je proto jen neutrální.');
p('');
p('**5) „Město v pohybu“ je nová listina složená z části dosavadní opozice** — lídr Jiří Verner');
p('(dosud předseda kontrolního výboru) a dvojka Alena Burešová (členka výboru pro strategický');
p('rozvoj) kandidovali v roce 2022 za „Společně pro NS a Pecínov a STAN“. Opoziční blok se tedy rozdělil.');
p('');
p('---');
p('');
p('## 2. Hlavní tabulka: dosluhující zastupitelé, kteří znovu kandidují');
p('');
p('Toto je rozhodovací jádro reportu — jediná skupina, u níž existují tvrdá data o chování v mandátu.');
p('');
p('| # | Kandidát | Listina 2026 | Poz. | Klub 2022–26 | Funkce | Účast ZM | Účast RM | Hlas. | Proti | Zdržel | **Index výstavby** | Postoj | Zamítnutí Z36 (17.9.26) |');
p('|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---|');

const inc = ROSTER.map(r => ({ r, k: kandidatura(r), u: ucast[r.k], s: vi.stats[r.k] }))
  .filter(x => x.k)
  .sort((a, b) => (b.s.index ?? -9) - (a.s.index ?? -9));

inc.forEach((x, i) => {
  const { r, k, u, s } = x;
  const fn = [r.rada, Object.entries(VYBORY).filter(([, v]) => v.predseda === r.k).map(([n]) => 'předseda ' + n),
  Object.entries(VYBORY).filter(([, v]) => v.clenove.includes(r.k)).map(([n]) => n)].flat().filter(Boolean).join(', ') || '—';
  const z36 = jakHlasoval('z36-neschv', r.k);
  const z36m = z36 === 'PRO' ? '✅ PRO zamítnutí' : z36 === 'zdržel se' ? '⚪ zdržel se' : z36 === 'nepřítomen' ? '– nepřítomen' : z36;
  p(`| ${i + 1} | **${r.disp}** | ${short(k.strana)} | ${k.cislo} | ${r.klub} | ${fn} | ${u.zmPresent}/${u.zmTotal} (${pct(u.zmPresent, u.zmTotal)}) | ${u.rmTotal ? `${u.rmPresent}/${u.rmTotal} (${pct(u.rmPresent, u.rmTotal)})` : '—'} | ${u.votes} | ${u.proti} | ${u.zdrzel} | **${sgn(s.index)}** | ${stance(s.index)} | ${z36m} |`);
});

p('');
p('**Legenda.** *Účast ZM* = na kolika z jednání zastupitelstva byl přítomen (dovozeno ze jmenných hlasování,');
p('ověřeno proti údaji „Přítomno N členů“ v zápise — souhlasí u všech 24 jednání). *Účast RM* = jen pro 7 členů');
p('rady města, z prezenčních listin. *Hlas./Proti/Zdržel* = počet jmenných hlasování za celé období');
p('(tedy ze všech témat, ne jen výstavby). *Index výstavby* viz [sekce 4](#4-index-postoje-k-výstavbě).');
p('*Zamítnutí Z36* = hlasování ze 17. 9. 2026, kterým ZM neschválilo plánovací smlouvu');
p('s investorem Loskot / Auri — jediné hlasování, které o projektu reálně rozhodovalo.');
p('Podrobný rozpad všech hlasování o projektech Loskota je v [sekci 5](#5-příjmení-loskot).');
p('');
p('### Dosluhující zastupitelé, kteří NEKANDIDUJÍ');
p('');
p('| Kandidát | Klub | Účast ZM | Index výstavby |');
p('|---|---|---:|---:|');
for (const r of ROSTER) {
  if (kandidatura(r)) continue;
  const u = ucast[r.k], s = vi.stats[r.k];
  p(`| ${r.disp} | ${r.klub} | ${u.zmPresent}/${u.zmTotal} (${pct(u.zmPresent, u.zmTotal)}) | ${sgn(s.index)} |`);
}
p('');
p('*Dr. Ing. Jan Kleindienst rezignoval 3. 4. 2023 (nahradil ho Z. Doležal), p. Radek Lopour rezignoval');
p('27. 11. 2023 (nahradil ho P. Janouš) — jejich čísla jsou proto za zkrácené období.*');
p('');
p('---');
p('');
p('## 3. Souhrn podle listin');
p('');
p('| Listina | Lídr | Kand. | Dosluh. zastupitelů | Ø účast ZM | Ø index výstavby | Charakter |');
p('|---|---|---:|---:|---:|---:|---|');

const byStrana = {};
for (const k of kand) (byStrana[k.strana] ??= []).push(k);
const CHAR = {
  'Naše město': 'vládnoucí koalice, starosta; nejsilněji **pro** výstavbu',
  'Město pro rodinu - rodina pro město': 'vládnoucí koalice, 1. místostarosta; silně **pro** výstavbu',
  'NEZÁVISLÍ 2018': 'vládnoucí koalice, 2. místostarosta; **pro** výstavbu',
  'Občanská demokratická strana': 'opozice; plošně se zdržuje, k výstavbě **neutrální**',
  'Město v pohybu': 'nová listina z části dosavadní opozice; mírně **brzdí** výstavbu, velmi mladá',
  'Společně pro Nové Strašecí a Pecínov': 'opozice + občanští aktivisté; nejsilněji **brzdí** výstavbu',
};
for (const [s, list] of Object.entries(byStrana)) {
  const incs = ROSTER.map(r => ({ r, k: kandidatura(r) })).filter(x => x.k && x.k.strana === s);
  const au = incs.length ? incs.reduce((a, x) => a + ucast[x.r.k].zmPresent / ucast[x.r.k].zmTotal, 0) / incs.length : null;
  const ai = incs.length ? incs.reduce((a, x) => a + (vi.stats[x.r.k].index ?? 0), 0) / incs.length : null;
  const avgAge = (list.reduce((a, b) => a + b.vek, 0) / list.length).toFixed(0);
  p(`| **${short(s)}** | ${list[0].jmeno} | ${list.length} | ${incs.length} | ${au == null ? '—' : Math.round(au * 100) + ' %'} | ${ai == null ? '—' : sgn(ai)} | ${CHAR[s] ?? ''} (Ø věk ${avgAge}) |`);
}
p('');
p('**Složení zastupitelstva 2022–2026:** koalice *Naše město* (6) + *MPR-RPM* (4) + *NEZÁVISLÍ 2018* (3) = **13 mandátů**;');
p('opozice *Společně pro NS a Pecínov a STAN* (6) + *ODS* (2) = **8 mandátů**.');
p('Rada města (7 členů) byla celé období obsazena výhradně koalicí.');
p('');
p('---');
p('');
p('## 4. Index postoje k výstavbě');
p('');
p('Nelze jen sčítat hlasy „proti“ — u části usnesení totiž **hlas PRO výstavbu blokuje**');
p('(např. „ZM *rozhoduje nepořídit* změnu ÚP pro LIDL“ nebo „ZM *neschvaluje* plánovací smlouvu Z36“).');
p('Proto bylo ručně vybráno a **polaritou označeno 16 klíčových hlasování** o výstavbě');
p('a developerských projektech. Bodování na jedno hlasování:');
p('');
p('| Typ usnesení | hlas PRO | zdržel se | hlas PROTI |');
p('|---|---:|---:|---:|');
p('| podporuje výstavbu (smlouva s investorem, změna ÚP ve prospěch záměru) | −1 | +0,5 | **+1** |');
p('| brzdí výstavbu (neschválení smlouvy, zamítnutí změny ÚP, veřejné projednání) | **+1** | 0 | −1 |');
p('');
p('Index = průměr bodů přes hlasování, u nichž byl zastupitel přítomen.');
p('**+1 = maximálně brzdí výstavbu, −1 = maximálně ji podporuje.**');
p('');
p('### Klíčová hlasování zařazená do indexu');
p('');
p('| Datum | ZM | Polarita | Usnesení | Výsledek | Proti | Zdrželi se |');
p('|---|---:|---|---|---|---|---|');
for (const k of [...vi.key].sort((a, b) => a.date.localeCompare(b.date))) {
  const v = k.v;
  const pol = k.pol === 'pro-vystavbe' ? '➕ pro výstavbě' : k.pol === 'proti-vystavbe' ? '🛑 brzda' : '· neutrální';
  const nm = a => a.length ? a.map(x => BYKEY[x] ? `${BYKEY[x].jm} ${BYKEY[x].pr}` : x).join(', ') : '—';
  p(`| ${k.date} | ${k.num ?? '—'} | ${pol} | ${k.label} | ${v.pro.length}–${v.proti.length}–${v.zdrzel.length} | ${nm(v.proti)} | ${nm(v.zdrzel)} |`);
}
p('');
p('*Výsledek ve formátu pro–proti–zdrželi se. Všech 16 hlasování bylo strojově ověřeno proti větě');
p('„Pro toto usnesení hlasovalo N členů…“ v zápise.*');
p('');
p('---');
p('');
p('## 5. Příjmení „Loskot“');
p('');
p('Dotaz na příjmení Loskot vede k nejvýznamnějšímu developerskému hráči ve městě.');
p('V zápisech za volební období je **19 výskytů** v 16 jednáních.');
p('');
p('### Kdo to je');
p('');
p('**Mgr. Ing. Rudolf Loskot, LL.M. MBA** — investor a developer, v zápisech vystupuje jako:');
p('');
p('| Role | Subjekt | Co to je |');
p('|---|---|---|');
p('| jednatel | **Rezidence Křivoklátská – Nové Strašecí, s.r.o.** (IČ 07639309, Průmyslová 1208) | bytový dům v Křivoklátském sídlišti; smlouvu o infrastruktuře převzal v r. 2020 od Ing. A. Bradáče |');
p('| prokurista | **AR auto s.r.o.** (jednatel Ing. Adolf Bradáč) | v této roli prezentoval radě města studii Z36 „V Sadu“ |');
p('| žadatel / investor | **Auri, energy & property s.r.o.** (Průmyslová 1208) | lokalita **Z36 Čelechovická** (126 bytů) a areál **ZZN**; zastupuje JUDr. Petr Bauer |');
p('| stavebník | Plánovací smlouva 168/2012/OI | lokalita **V Dolejších Hlavách** (s Ing. Bradáčem) |');
p('');
p('V zápise z 17. 3. 2025 se objevuje také **„Loskotová“** jako strana smlouvy o příspěvku na');
p('kapacitu ČOV u projektu „Novostavba souboru rodinných domů Mšecké Žehrovice“ (spolu s *Auri, energy & property s.r.o.*).');
p('');
p('### Jak se k jeho projektům zastupitelstvo stavělo');
p('');
p('| Datum | Věc | Výsledek | Kdo nepodpořil |');
p('|---|---|---|---|');
for (const id of ['loskot-dod3a', 'loskot-dod3b', 'auri-zzn', 'zzn-byty', 'z36-neschv']) {
  const k = vi.key.find(x => x.id === id); if (!k) continue;
  const v = k.v;
  const nm = a => a.length ? a.map(x => BYKEY[x]?.disp ?? x).join(', ') : '—';
  p(`| ${k.date} | ${k.label} | ${v.pro.length}–${v.proti.length}–${v.zdrzel.length} | proti: ${nm(v.proti)} / zdrželi: ${nm(v.zdrzel)} |`);
}
p('');
p('### Jak hlasoval každý kandidující zastupitel o projektech Loskota');
p('');
p('Záměrně zde **není** souhrnné skóre: hlasování je jen pět, dvě z nich byla téměř jednomyslná');
p('(ZZN 19–0–0, Z36 16–0–2) a průměr by proto vypovídal hlavně o tom, kdo byl kdy přítomen.');
p('');
p('| Kandidát | Listina 2026 | Dodatek č. 3<br>(2023, V Dolejších Hlavách) | Dodatek č. 3<br>— podpis | Auri → ZZN<br>k výboru (2024) | ZZN byty<br>SOUHLAS (2025) | **Z36 NESCHVÁLENO<br>(17. 9. 2026)** |');
p('|---|---|---|---|---|---|---|');
for (const x of inc) {
  const c = id => {
    const h = jakHlasoval(id, x.r.k);
    const pol = vi.key.find(v => v.id === id)?.pol;
    if (h === 'nepřítomen') return '–';
    if (pol === 'proti-vystavbe') return h === 'PRO' ? '✅ pro' : h === 'zdržel se' ? '⚪ zdržel' : '❌ proti';
    return h === 'PRO' ? '🔴 pro' : h === 'zdržel se' ? '⚪ zdržel' : h === 'PROTI' ? '🟢 proti' : h;
  };
  p(`| ${x.r.disp} | ${short(x.k.strana)} | ${c('loskot-dod3a')} | ${c('loskot-dod3b')} | ${c('auri-zzn')} | ${c('zzn-byty')} | ${c('z36-neschv')} |`);
}
p('');
p('🔴 pro = podpořil investora · ⚪ zdržel · 🟢 proti = byl proti investorovi · ✅ pro = podpořil zamítnutí · – nepřítomen');
p('');
p('### Co z toho vyplývá');
p('');
p('- **Zásadní zjištění: do roku 2026 neměl Loskot v zastupitelstvu prakticky žádný odpor — a to ani z opozice.**');
p('  Za celé volební období **nehlasoval proti žádnému jeho bodu ani jeden zastupitel**. Jediný zaznamenaný');
p('  nesouhlas má formu zdržení se, a to jen u čtyř lidí a ve dvou případech:');
p('  u Dodatku č. 3 plánovací smlouvy (2023) se zdrželi **Novák** (u obou hlasování), **Doležal**,');
p('  **Burešová**, **Verner** a **Vaic**; u předání záměru ZZN výboru (2024) se zdržel **Černý**.');
p('- **Souhlas s bytovými domy v areálu ZZN prošel 19–0–0, tedy naprosto jednomyslně** — včetně všech');
p('  opozičních zastupitelů, kteří dnes kandidují jako kritici developerské výstavby.');
p('  Tohle je důležitý korektiv k předvolební rétorice na všech stranách.');
p('- **Zlom přišel 2025–2026.** Investor sám předložil nový, objemnější návrh (podlažnost bytových domů');
p('  z 3+1 na 4 nadzemní podlaží, počet bytů z 123 na **126**, školská skupina přesunuta do zvláštního objektu).');
p('  Město si vyžádalo posudek advokátní kanceláře **Frank Bold Advokáti** a stanovisko městského architekta');
p('  Ing. arch. Jiřího Rákosníka. Část obyvatel **ulice Sadová** podala námitky.');
p('- **17. 9. 2026 zastupitelstvo plánovací smlouvu neschválilo** (usnesení č. 248) a uložilo radě a výboru');
p('  pro strategický rozvoj dál vyjednávat. Pro zamítnutí hlasovalo **16 zastupitelů**;');
p('  **zdrželi se jen Ing. et Ing. David Hubáček a Ing. Pavel Vaic (ODS)**.');
p('- **Rada města zároveň drží páku.** Usnesením č. 647 (15. 4. 2024), potvrzeným i v roce 2026, odmítá podepsat');
p('  smlouvu o budoucím provozování vodovodu, dokud nebude uzavřena smlouva o infrastruktuře k Z36 —');
p('  přes opakované výzvy právního zástupce investora (4. 3. a 24. 3. 2026).');
p('');
p('> **Praktický závěr pro voliče.** Konkrétně u projektů Loskota **jmenná hlasování mezi listinami téměř nerozlišují.**');
p('> Do roku 2025 je podpořili prakticky všichni; v září 2026 naopak prakticky všichni podpořili zamítnutí');
p('> plánovací smlouvy — s výjimkou **ODS (Hubáček, Vaic), která se jako jediná zdržela**.');
p('> Jestliže je kritériem postoj k Loskotovým projektům, pak data dávají jediné jednoznačné vodítko:');
p('> **ODS je k nim nejsmířlivější**, zbytek listin se neliší.');
p('>');
p('> Chcete-li rozlišovat jemněji, použijte buď (a) **zdržení u Dodatku č. 3 v roce 2023** — tam se jako');
p('> jediní ozvali **Novák, Burešová, Verner** (a Doležal s Vaicem), nebo (b) **obecný index výstavby**');
p('> ze [sekce 4](#4-index-postoje-k-výstavbě), který měří postoj k developerské výstavbě jako celku,');
p('> ne jen k jednomu investorovi. Tam je rozdíl mezi koalicí a opozicí velmi zřetelný.');
p('');
p('---');
p('');
p('## 6. Druhá velká linie: těžba ČLUZ a.s.');
p('');
p('Vedle bytové výstavby je sporem **memorandum o spolupráci s ČLUZ a.s.** (pokračování hornické činnosti,');
p('těžba lupku v dobývacím prostoru Rynholec, přeložka železniční trati, nová silnice).');
p('Město memorandum nakonec **podepsalo** (19. 6. 2025, 12–2–3).');
p('');
p('| Datum | ZM | Usnesení | Výsledek | Proti | Zdrželi se |');
p('|---|---:|---|---|---|---|');
for (const k of vi.cluz) {
  const v = k.v;
  const nm = a => a.length ? a.map(x => BYKEY[x] ? `${BYKEY[x].jm} ${BYKEY[x].pr}` : x).join(', ') : '—';
  p(`| ${k.date} | ${k.num ?? '—'} | ${k.label} | ${v.pro.length}–${v.proti.length}–${v.zdrzel.length} | ${nm(v.proti)} | ${nm(v.zdrzel)} |`);
}
p('');
p('**Proti memorandu konzistentně hlasovali pouze Ing. Alena Burešová (nyní Město v pohybu #2)');
p('a Bc. Pavel Novák (Společně #1).** Mgr. Petr Janouš se zdržel. Zajímavé je hlasování 19. 6. 2025, kdy');
p('návrh na *společné jednání s obcí Rynholec* zamítla právě koalice včetně starosty (5–8–4).');
p('V březnu 2026 záměr zkomplikovalo **referendum v obci Rynholec**.');
p('');
p('---');
p('');
p('## 7. Všichni kandidáti (126)');
p('');
p('Sloupec *Zmínek* = kolikrát se jméno objevuje v zápisech ZM/RM za volební období — u nezastupitelů');
p('to indikuje aktivitu jako host nebo občan v rozpravě. **Tučně** = dosluhující zastupitel.');
p('');
for (const [s, list] of Object.entries(byStrana)) {
  p(`### ${s}`);
  p('');
  p('| # | Jméno | Věk | Zaměstnání | Přísl. | Zmínek v zápisech | Role 2022–26 |');
  p('|---:|---|---:|---|---|---:|---|');
  for (const k of list.sort((a, b) => a.cislo - b.cislo)) {
    const r = ROSTER.find(r => esc(r.pr) === esc(k.prijmeni || '') && esc(r.jm) === esc(k.jmenoK || ''));
    const role = r ? [r.rada ?? 'zastupitel', r.klub !== s ? `(2022 za ${r.klub})` : ''].filter(Boolean).join(' ') : '—';
    const nm = r ? `**${k.jmeno}**` : k.jmeno;
    p(`| ${k.cislo} | ${nm} | ${k.vek} | ${k.zamestnani} | ${k.prislusnost === 'BEZPP' ? 'bez PP' : k.prislusnost} | ${k.mentions || '—'} | ${role} |`);
  }
  p('');
}
p('---');
p('');
p('## 8. Účast na jednáních — celý přehled');
p('');
p('| Zastupitel | Klub | Jednání ZM | Účast | Rada města | Účast RM |');
p('|---|---|---:|---:|---:|---:|');
for (const r of ROSTER.slice().sort((a, b) => ucast[b.k].zmPresent / ucast[b.k].zmTotal - ucast[a.k].zmPresent / ucast[a.k].zmTotal)) {
  const u = ucast[r.k];
  p(`| ${r.disp} | ${r.klub} | ${u.zmPresent}/${u.zmTotal} | ${pct(u.zmPresent, u.zmTotal)} | ${r.rada ?? '—'} | ${u.rmTotal ? `${u.rmPresent}/${u.rmTotal} (${pct(u.rmPresent, u.rmTotal)})` : '—'} |`);
}
p('');
p('Nejhorší účast na zastupitelstvu měl **Mgr. Petr Janouš (63 %)**, nejlepší **Filip, Bureš a Bechyně (100 %)**.');
p('V radě města byla nejslabší účast **Michala Büntera (72 %)** — zde ale upozorňuji, že prezenční listiny rady');
p('uvádějí jen přítomné a omluvené, takže jde o měkčí údaj než u zastupitelstva.');
p('');
p('---');
p('');
p('## Metodika a zdroje');
p('');
p('### Co bylo zpracováno');
p('');
p('| Zdroj | Rozsah |');
p('|---|---|');
p(`| Kandidátní listiny | 126 kandidátů na 6 listinách, API volby.gov.cz |`);
p(`| Zápisy zastupitelstva města | **${zm.length} jednání** (ustavující 19. 10. 2022 → 23. ZM 17. 9. 2026) |`);
p(`| Zápisy rady města | **${rm.length} jednání** (99. RM 3. 10. 2022 → 100. RM 5. 10. 2026) |`);
p(`| Jmenná hlasování v ZM | **${nVotes}** bloků, z toho **${nValid} strojově ověřeno** (${Math.round(100 * nValid / nVotes)} %) |`);
p(`| Stažená PDF | ${fs.readdirSync('pdf').length} souborů, ~106 MB |`);
p('| Výbor pro strategický rozvoj | 25 zápisů stáhnuto, **ale jde o skeny bez textové vrstvy** — nebylo možné zpracovat |');
p('');
p('### Postup');
p('');
p('1. **Kandidáti** — nalezeno JSON API za SPA na volby.gov.cz:');
p('   `https://volby.gov.cz/appdata/kv2026/20261009/jmsez/2112/542164.json`');
p('2. **Zápisy** — proleze se stránkování úřední desky (`/samosprava/zapisy-a-videozaznamy-ze-zastupitelstva/`,');
p('   `/samosprava/zapisy-rady-mesta/`, 662 záznamů celkem), odfiltruje se volební období, stáhnou se PDF přílohy.');
p('3. **Text** — `pdftotext` ve dvou variantách (`-layout` i bez). U části PDF je pořadí stránek rozházené');
p('   a `-layout` láme seznamy jmen; pro každý zápis se proto použije ta varianta, která dá víc ověřených hlasování.');
p('4. **Jména** — nehledají se rozsekáním podle čárek (do seznamů se vlamují zápatí stránek), ale přímým');
p('   matchováním proti známému jmenování ZM 2022–2026 ve tvaru „Jméno Příjmení“.');
p('5. **Ověření** — každý blok `(Pro: … Proti: … Zdrželi se: …)` se porovná s větou „Pro toto usnesení');
p('   hlasovalo N členů, M členů hlasovalo proti a K členů se zdrželo hlasování.“ Počty musí souhlasit.');
p('6. **Účast** — dovozena jako sjednocení všech jmen ve jmenných hlasováních daného jednání.');
p('   Kontrola: souhlasí s údajem „Přítomno N členů zastupitelstva města“ **u všech 24 jednání**.');
p('');
p('### Co report neumí a kde být opatrný');
p('');
p('- **6 % hlasovacích bloků se nepodařilo ověřit** (25 z 399) — jde o bloky rozlomené přes stránky.');
p('  Do indexu výstavby ani do klíčových tabulek se nepoužily; ovlivňují jen souhrnné počty');
p('  „proti/zdržel“ v tabulkách, kde jsou uvedeny pro orientaci.');
p('- **Index výstavby je autorský konstrukt**, ne objektivní měřítko. Výběr 16 hlasování a jejich polarita');
p('  jsou ruční rozhodnutí — jsou ale všechna vypsaná v [sekci 4](#4-index-postoje-k-výstavbě), takže se dají přepočítat jinak.');
p('- **„Zdržel se“ je nejednoznačné.** U ODS je to spíš obecný styl než postoj k výstavbě (viz shrnutí, bod 4).');
p('- **Rada města nehlasuje jmenovitě** — její zápisy uvádějí jen agregované počty. Postoj radních');
p('  k jednotlivým usnesením rady proto doložit nelze, jen jejich účast.');
p('- **102 ze 103 zápisů rady** je ve volebním období; 99. RM z 3. 10. 2022 ještě spadá do starého volebního období.');
p('- **U 108 ze 126 kandidátů neexistují žádná hlasovací data** — nikdy nebyli v zastupitelstvu.');
p('- Jména soukromých osob jsou v zápisech anonymizována (`*****`), takže u části pozemkových transakcí');
p('  nelze určit druhou stranu.');
p('');
p('### Skripty');
p('');
p('Vše je v tomto repozitáři a je reprodukovatelné (`node <skript>`), pořadí:');
p('');
p('```');
p('parse_kandidati.mjs       kandidátní listiny -> kandidati.json');
p('01_listing.mjs            stránkování úřední desky -> zapisy_listing.json');
p('02_filter.mjs             filtr na volební období -> zapisy_filtered.json');
p('03_details.mjs            detailní stránky, odkazy na PDF -> zapisy_detail.json');
p('04_download.mjs           stažení 128 PDF do pdf/');
p('05_parse.mjs              prezence + jmenná hlasování + ověření -> meetings.json');
p('06_vsrm.mjs               zápisy výboru pro strategický rozvoj (skeny)');
p('07_ucast.mjs              statistiky účasti -> ucast.json');
p('08_osoby.mjs              kontrola: kdo se v hlasováních vyskytuje a kdy');
p('09_vystavba.mjs           tematická klasifikace hlasování -> hlasovani.json');
p('10_loskot.mjs             všechny výskyty "Loskot" s kontextem');
p('11_mapovani.mjs           zastupitelé 2022-26 -> kandidatury 2026');
p('13_vystavba_index.mjs     kurátorovaná klíčová hlasování + index -> vystavba_index.json');
p('14_kandidati_aktivita.mjs zmínky všech 126 kandidátů -> kandidati_aktivita.json');
p('15_report.mjs             tento report');
p('roster.mjs                jmenování ZM 2022-2026 (ručně ověřeno proti webu města)');
p('lib_names.mjs             normalizace jmen');
p('```');
p('');
p('### Primární odkazy');
p('');
p('- Kandidáti: <https://volby.gov.cz/app/kv2026/cs/20261009/name-lists/!___2100_2112_542164>');
p('- Úřední deska: <https://www.novestraseci.cz/urad/uredni-deska/>');
p('- Zápisy ZM: <https://www.novestraseci.cz/samosprava/zapisy-a-videozaznamy-ze-zastupitelstva/>');
p('- Zápisy RM: <https://www.novestraseci.cz/samosprava/zapisy-rady-mesta/>');
p('- Zastupitelstvo 2022–2026: <https://www.novestraseci.cz/samosprava/zastupitelstvo/>');
p('- Výbor pro strategický rozvoj: <https://www.novestraseci.cz/samosprava/vybory-a-komise-zastupitelstva/vybor-pro-strategicky-rozvoj-mesta/>');
p('- Areál Hamiro: <https://www.novestraseci.cz/samosprava/areal-hamiro-2842026/>');
p('');
p('*Na stránce zastupitelstva jsou k dispozici i „Zásady pro výstavbu na území města Nové Strašecí“');
p('a „Programové prohlášení koalice Naše město, MPR-RPM, Nezávislí 2018 na léta 2022–2026“.*');

fs.writeFileSync('REPORT.md', L.join('\n') + '\n');
console.log('REPORT.md:', L.length, 'řádků,', fs.statSync('REPORT.md').size, 'bajtů');
