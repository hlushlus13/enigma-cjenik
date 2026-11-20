#!/usr/bin/env python3
"""Spaja src/template.html + menu.json + assets/logo.svg u docs/index.html (jedna samostalna datoteka, objavljuje je GitHub Pages)."""
import json
import re

from pathlib import Path

root = Path(__file__).resolve().parent
data = json.loads((root / "menu.json").read_text(encoding="utf-8"))
logo_full = (root / "assets" / "logo.svg").read_text(encoding="utf-8").strip()


def split_logo(svg):
    """Dijeli obrise naslova na 'ROCK CAFFE BAR' i 'ENIGMA' prema zadnjem razmaku između riječi."""
    d = re.search(r' d="([^"]+)"', svg).group(1)
    subs = [s for s in re.split(r"(?=M)", d) if s]

    def bbox(p):
        n = list(map(float, re.findall(r"-?\d+(?:\.\d+)?", p)))
        xs, ys = n[0::2], n[1::2]
        return min(xs), max(xs), min(ys), max(ys)

    items = sorted(((bbox(p), p) for p in subs), key=lambda t: t[0][0])
    gaps, right = [], items[0][0][1]
    for i in range(1, len(items)):
        gaps.append((items[i][0][0] - right, i))
        right = max(right, items[i][0][1])
    # "Rock Caffe bar ENIGMA" ima 3 razmaka -> 3 najveća razmaka su granice riječi; zadnji odvaja ENIGMA
    word_gaps = sorted(gaps, reverse=True)[:3]
    cut = max(i for _, i in word_gaps)

    def make(part, label):
        bb = [b for b, _ in part]
        x0, x1 = min(b[0] for b in bb), max(b[1] for b in bb)
        y0, y1 = min(b[2] for b in bb), max(b[3] for b in bb)
        path = "".join(p for _, p in part)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} {x1 - x0:.2f} {y1 - y0:.2f}" '
                f'aria-hidden="true"><path fill="currentColor" d="{path}"/></svg>')

    return make(items[:cut], "Rock Caffe bar"), make(items[cut:], "Enigma")


logo_top, logo_enigma = split_logo(logo_full)
logo = (f'<span class="sr">Rock Caffe bar Enigma</span>'
        f'<span class="logo-top">{logo_top}</span><span class="logo-main">{logo_enigma}</span>')
tpl = (root / "src" / "template.html").read_text(encoding="utf-8")

# kontrole
cats = data["categories"]
items = [i for c in cats for i in c["items"]]
assert cats and items, "menu.json je prazan"
for i in items:
    for k in ("hr", "en", "price", "anchor"):
        assert i.get(k), f"nedostaje {k}: {i}"

payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
out = tpl.replace("{{LOGO}}", logo).replace("{{DATA}}", payload)
assert "{{" not in out, "ostao je neki {{placeholder}}"

docs = root / "docs"
docs.mkdir(exist_ok=True)
(docs / "index.html").write_text(out, encoding="utf-8")
(docs / ".nojekyll").write_text("", encoding="utf-8")
print(f"OK docs/index.html – {len(cats)} kategorija, {len(items)} artikala, {len(out.encode()) // 1024} KB")
