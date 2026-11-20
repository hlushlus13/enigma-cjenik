#!/bin/bash
# Objava digitalnog cjenika: InDesign -> menu.json -> docs/index.html -> GitHub Pages
# Pokretanje: dvoklik u Finderu (InDesign mora biti pokrenut, dokument spremljen).
set -u
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/bin:$PATH"

pauza() { echo; read -r -p "Pritisni Enter za zatvaranje..." _; }
greska() { echo; echo "❌ $1"; pauza; exit 1; }

echo "1/3  Izvoz sadržaja iz InDesigna..."
OUT=$(osascript -e "tell application id \"com.adobe.InDesign\" to do script (POSIX file \"$PWD/tools/export_menu.jsx\") language javascript" 2>&1) \
  || greska "InDesign se nije odazvao. Je li pokrenut? ($OUT)"
echo "$OUT"
echo "$OUT" | grep -q "^GREŠKA" && greska "Izvoz nije uspio."
echo "$OUT" | grep -q "upozorenja (0)" || greska "Izvoz je javio upozorenja (vidi gore). Ispravi u InDesignu pa ponovi."

echo; echo "2/3  Izrada web stranice..."
python3 build.py || greska "Izrada stranice nije uspjela."

echo; echo "3/3  Slanje na GitHub..."
git add -A
if git diff --cached --quiet -- docs; then
  git reset -q
  echo "✅ Cijene su iste kao na webu, nema se što objaviti."
  pauza; exit 0
fi
git commit -q -m "Cjenik ažuriran $(date '+%d.%m.%Y. %H:%M')" || greska "Commit nije uspio."
git push -q || greska "Slanje na GitHub nije uspjelo (provjeri internet / prijavu: gh auth status)."

URL=$(gh api "repos/{owner}/{repo}/pages" --jq .html_url 2>/dev/null)
echo; echo "✅ Objavljeno. Nova verzija je na webu za otprilike 1 minutu:"
echo "   ${URL:-(adresa GitHub Pages)}"
pauza
