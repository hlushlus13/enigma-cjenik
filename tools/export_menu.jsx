// Izvoz sadržaja cjenika iz InDesigna u menu.json
// Pokretanje: osascript -e 'tell application id "com.adobe.InDesign" to do script (POSIX file "<ova datoteka>") language javascript'
// Argumenti: čita INDD i piše JSON relativno uz ovu skriptu (../../<INDD>, ../menu.json)
(function(){
var here = File($.fileName).parent;            // .../digitalni-cjenik/tools
var root = here.parent;                         // .../digitalni-cjenik
function newestIndd(dir){ // najnoviji Enigma_cjenik_*.indd (bez BACKUP)
  var fs = dir.getFiles(function(f){ return f instanceof File && /^Enigma_cjenik_.*\.indd$/i.test(decodeURI(f.name)) && !/backup/i.test(f.name); });
  fs.sort(function(a,b){ return b.modified - a.modified; }); return fs[0]; }
var INDD = newestIndd(root.parent);
if (!INDD) return "GREŠKA: u mapi nema Enigma_cjenik_*.indd";
var OUT  = File(root.fsName + "/menu.json");

var wasOpen = null;
for (var i=0;i<app.documents.length;i++) if (app.documents[i].fullName.fsName == INDD.fsName) wasOpen = app.documents[i];
if (wasOpen && wasOpen.modified) return "GREŠKA: dokument " + INDD.name + " ima nespremljene izmjene. Spremi ga (Cmd+S) pa ponovi.";
var d = wasOpen || app.open(INDD, false);

function clean(s){ return s.replace(/[\r]$/,"").replace(/\n/g," ").replace(/  +/g," ").replace(/ /g," ").replace(/\s+$/,"").replace(/^\s+/,""); }
function mainStory(p){ // najveći tekstni okvir na stranici
  var tf = d.pages[p].textFrames, best=null;
  for (var i=0;i<tf.length;i++) if (!best || tf[i].parentStory.paragraphs.length > best.parentStory.paragraphs.length) best = tf[i];
  return best.parentStory;
}
function footer(p){
  var tf = d.pages[p].textFrames;
  for (var i=0;i<tf.length;i++) if (/OIB/.test(tf[i].contents)) return tf[i].contents.split(/[\r\n]+/);
  return [];
}
function parse(p){
  var P = mainStory(p).paragraphs, cats=[], cur=null, last=null, warn=[];
  for (var i=0;i<P.length;i++){
    var raw = P[i].contents.replace(/\r$/,"");
    if (P[i].appliedParagraphStyle.name == "Naslovi"){
      var parts = raw.split("\n"), head = parts[0].split("\t");
      var name = clean(head[0]) + (parts.length>1 ? " " + clean(parts.slice(1).join(" ")) : "");
      cur = { name: name.replace(/\s+/g," ").toUpperCase(), anchorLabel: head[1]?clean(head[1]):"", priceLabel: head[2]?clean(head[2]):"", items: [] };
      cats.push(cur); last=null; continue;
    }
    var t = clean(raw);
    if (!t) { last=null; continue; }
    var m = raw.match(/^(.*?)\t(\d+[.,]\d{2})\t(\d+[.,]\d{2})\s*$/);
    if (m){ last = { name: clean(m[1]), anchor: m[2].replace(",","."), price: m[3].replace(",","."), note: "" }; cur.items.push(last); continue; }
    if (last && /^\(|^[^\t\d]*\)$/.test(t) || (last && last.note && !/\)$/.test(last.note))){ last.note = (last.note ? last.note + " " : "") + t; continue; }
    warn.push("p"+(p+1)+" nepoznat redak: " + raw);
  }
  return { cats: cats, footer: footer(p), warn: warn };
}
var hr = parse(0), en = parse(1), warn = hr.warn.concat(en.warn);
if (hr.cats.length != en.cats.length) warn.push("broj kategorija HR " + hr.cats.length + " ≠ EN " + en.cats.length);
var cats = [], total = 0;
for (var c=0;c<hr.cats.length;c++){
  var a = hr.cats[c], b = en.cats[c] || {name:"",items:[]};
  if (a.items.length != b.items.length) warn.push(a.name + ": HR " + a.items.length + " ≠ EN " + b.items.length);
  var items = [];
  for (var k=0;k<a.items.length;k++){
    var x = a.items[k], y = b.items[k] || {};
    if (y.price && (x.price != y.price || x.anchor != y.anchor)) warn.push("cijena razlika: " + x.name + " " + x.price + " / " + y.name + " " + y.price);
    items.push({ hr: x.name, en: y.name || x.name, noteHr: x.note, noteEn: y.note || "", anchor: x.anchor, price: x.price });
    total++;
  }
  cats.push({ id: "k" + (c+1), hr: a.name, en: b.name, items: items });
}
var data = {
  source: INDD.name,
  exported: (new Date()).toString(),
  labels: { hr: { anchor: hr.cats[0].anchorLabel, price: hr.cats[0].priceLabel }, en: { anchor: en.cats[0].anchorLabel, price: en.cats[0].priceLabel } },
  footer: { hr: hr.footer, en: en.footer },
  categories: cats
};
// JSON serializacija (ExtendScript nema JSON)
function q(s){ return '"' + String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\t/g,"\\t") + '"'; }
function ser(v, ind){
  ind = ind || ""; var n = ind + "  ";
  if (v === null) return "null";
  if (v instanceof Array){ if(!v.length) return "[]"; var a=[]; for(var i=0;i<v.length;i++) a.push(n+ser(v[i],n)); return "[\n"+a.join(",\n")+"\n"+ind+"]"; }
  if (typeof v == "object"){ var a=[]; for (var k in v) a.push(n+q(k)+": "+ser(v[k],n)); return "{\n"+a.join(",\n")+"\n"+ind+"}"; }
  if (typeof v == "number" || typeof v == "boolean") return String(v);
  return q(v);
}
OUT.encoding = "UTF-8"; OUT.lineFeed = "Unix"; OUT.open("w"); OUT.write(ser(data)); OUT.close();
if (!wasOpen) d.close(SaveOptions.NO);
var summary = []; for (var c=0;c<cats.length;c++) summary.push(cats[c].hr + " / " + cats[c].en + ": " + cats[c].items.length);
return "OK → " + OUT.fsName + "\nkategorija: " + cats.length + ", artikala: " + total + "\n" + summary.join("\n") + "\nupozorenja (" + warn.length + "):\n" + warn.join("\n");
})();
