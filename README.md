# straseciinfo

Analýza chování zastupitelů města **Nové Strašecí** ve volebním období 2022–2026
jako podklad pro komunální volby 9.–10. října 2026.

## 👉 [REPORT.md](REPORT.md) — výsledný report

Obsahuje: tabulku všech 126 kandidátů, účast dosluhujících zastupitelů na jednáních,
index postoje k výstavbě podle jmenných hlasování, rozbor projektů developera
**Loskot** (lokalita Z36 Čelechovická) a hlasování o těžbě ČLUZ.

## Data

| Zdroj | Rozsah |
|---|---|
| Kandidátní listiny | 126 kandidátů / 6 listin (API volby.gov.cz) |
| Zápisy zastupitelstva | 24 jednání (10/2022 – 9/2026) |
| Zápisy rady města | 102 jednání |
| Jmenná hlasování | 399 bloků, 374 (94 %) strojově ověřeno |

Účast dovozená ze jmenných hlasování souhlasí s údajem „Přítomno N členů“
v zápise **u všech 24 jednání zastupitelstva**.

## Reprodukce

Potřeba: `node` ≥ 20 a `pdftotext` (poppler). Pak postupně:

```bash
node parse_kandidati.mjs        # kandidátní listiny
node 01_listing.mjs             # stránkování úřední desky
node 02_filter.mjs              # filtr na volební období
node 03_details.mjs             # detailní stránky + odkazy na PDF
node 04_download.mjs            # stažení 128 PDF (~106 MB)

mkdir -p txt txt_nolayout       # extrakce textu ve dvou variantách
for f in pdf/*.pdf; do b=$(basename "$f" .pdf); \
  pdftotext -layout -enc UTF-8 "$f" "txt/$b.txt"; \
  pdftotext         -enc UTF-8 "$f" "txt_nolayout/$b.txt"; done

node 05_parse.mjs               # prezence + jmenná hlasování + ověření
node 07_ucast.mjs               # statistiky účasti
node 09_vystavba.mjs            # tematická klasifikace hlasování
node 13_vystavba_index.mjs      # index postoje k výstavbě
node 14_kandidati_aktivita.mjs  # zmínky kandidátů v zápisech
node 15_report.mjs              # -> REPORT.md
```

Pomocné / kontrolní skripty: `06_vsrm.mjs` (zápisy výboru pro strategický rozvoj —
jsou to skeny bez textové vrstvy), `08_osoby.mjs` (kdo se v hlasováních vyskytuje a kdy),
`10_loskot.mjs` (výskyty „Loskot“ s kontextem), `11_mapovani.mjs` (zastupitelé → kandidatury 2026),
`12_klice.mjs` (výpis ověřených tematických hlasování).

`roster.mjs` obsahuje jmenování zastupitelstva 2022–2026 včetně dvou rezignací
(Kleindienst → Doležal, Lopour → Janouš) — ručně ověřeno proti webu města a zápisům.

Stažená data (`pdf/`, `txt/`, …) jsou v `.gitignore`, protože je lze znovu vygenerovat.
