# Digitalni cjenik – Rock Caffe bar Enigma

Mobilna web verzija tiskanog cjenika. Sadržaj se uzima iz InDesign dokumenta (najnoviji `../Enigma_cjenik_*.indd`), pa se cijene mijenjaju samo na jednom mjestu. Stranicu objavljuje GitHub Pages iz mape `docs/`.

## Ažuriranje cijena
1. Promijeni cijene u InDesignu i **spremi** (Cmd+S). InDesign neka ostane pokrenut.
2. U Finderu **dvaput klikni `objavi.command`**.
   Skripta izvuče sadržaj iz InDesigna, provjeri da se HR i EN cijene slažu, napravi stranicu i pošalje je na GitHub.
3. Za otprilike minutu nova verzija je na webu. QR kod se ne mijenja.

Ako dokument spremiš pod novim imenom (npr. `Enigma_cjenik_2026-12.indd`), skripta sama uzima najnoviji. Datoteke s „BACKUP” u imenu preskače.

Prvi put macOS može pitati smije li Terminal upravljati InDesignom – klikni **Allow**.

## Datoteke
| Datoteka | Što je |
|---|---|
| `docs/index.html` | objavljena stranica (jedna datoteka, sve je unutra) |
| `objavi.command` | objava jednim klikom (izvoz → izrada → GitHub) |
| `menu.json` | sadržaj izvučen iz InDesigna (kategorije, artikli HR/EN, cijene, podnožje) |
| `assets/logo.svg` | logotip pretvoren u obrise (font nije potreban na webu) |
| `src/template.html` | izgled i ponašanje stranice |
| `build.py` | spaja predložak + podatke + logo u `docs/index.html` |
| `tools/export_menu.jsx` | InDesign skripta: INDD → `menu.json` |
| `tools/export_logo.jsx` | InDesign skripta: naslov → `assets/logo.svg` (samo ako se logo promijeni) |

## Postavke na stranici (`src/template.html`)
- `SHOW_ANCHOR`: `"always"` = sidrena cijena (10.9.2026.) uvijek prikazana (zadano), `"diff"` = samo kad je drugačija od trenutne, `"never"`.
- Boje i širine stupaca: varijable na vrhu `<style>` (`--yellow`, `--anchor`, `--col-anchor`, `--col-price`).
- Jezik: automatski po jeziku mobitela (hr/bs/sr → HR, inače EN), prekidač HR | EN se pamti.
- Font: Barlow Condensed (Google Fonts) kao zamjena za Neue Plak.
