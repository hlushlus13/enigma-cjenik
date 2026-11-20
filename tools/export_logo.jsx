// Pretvara naslov "Rock Caffe bar ENIGMA" iz tiskanog cjenika u vektorske obrise i zapisuje SVG-ove u ../assets/
// Dokument se otvara bez prozora i zatvara BEZ spremanja (za svaki SVG iznova).
(function(){
var root = File($.fileName).parent.parent;
function newestIndd(dir){ // najnoviji Enigma_cjenik_*.indd (bez BACKUP)
  var fs = dir.getFiles(function(f){ return f instanceof File && /^Enigma_cjenik_.*\.indd$/i.test(decodeURI(f.name)) && !/backup/i.test(f.name); });
  fs.sort(function(a,b){ return b.modified - a.modified; }); return fs[0]; }
var INDD = newestIndd(root.parent);
if (!INDD) return "GREŠKA: u mapi nema Enigma_cjenik_*.indd";
// raspon znakova u "Rock Caffe bar ENIGMA" (null = cijeli naslov)
var OUTS = [["logo.svg", null]]; // build.py ga dijeli na logo-top.svg i logo-enigma.svg
for (var i=0;i<app.documents.length;i++) if (app.documents[i].fullName.fsName == INDD.fsName) return "Zatvori dokument u InDesignu pa ponovi.";
function f(n){ return Math.round(n*100)/100; }

function exportOne(range){
  var d = app.open(INDD, false), out = null;
  try{
    var para = d.pages[0].textFrames[0].paragraphs[0];
    var title = para.contents.replace(/\r$/,"");
    var label = range ? title.substring(range[0], range[1]+1) : title;
    var obj = range ? para.characters.itemByRange(range[0], range[1]) : para;
    var outl = obj.createOutlines(true), polys = [];
    function collect(it){ if (!it || !it.isValid) return;
      if (it.constructor.name=="Group"){ for (var i=0;i<it.pageItems.length;i++) collect(it.pageItems[i]); } else polys.push(it); }
    for (var i=0;i<outl.length;i++) collect(outl[i]);
    var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9, ds=[];
    for (var p=0;p<polys.length;p++){
      var b = polys[p].geometricBounds; minY=Math.min(minY,b[0]); minX=Math.min(minX,b[1]); maxY=Math.max(maxY,b[2]); maxX=Math.max(maxX,b[3]);
      var paths = polys[p].paths, dd = "";
      for (var k=0;k<paths.length;k++){
        var pts = paths[k].entirePath, n = pts.length;
        var A = function(i){ var q=pts[i]; return (q[0] instanceof Array) ? q : [q,q,q]; };
        var first = A(0); dd += "M"+f(first[1][0])+" "+f(first[1][1]);
        var closed = paths[k].pathType == PathType.CLOSED_PATH, cnt = closed ? n : n-1;
        for (var i=0;i<cnt;i++){ var a=A(i), b2=A((i+1)%n);
          dd += "C"+f(a[2][0])+" "+f(a[2][1])+" "+f(b2[0][0])+" "+f(b2[0][1])+" "+f(b2[1][0])+" "+f(b2[1][1]); }
        if (closed) dd += "Z";
      }
      ds.push(dd);
    }
    out = { label: label, n: polys.length, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+f(minX)+' '+f(minY)+' '+f(maxX-minX)+' '+f(maxY-minY)+'" role="img" aria-label="'+label+'"><path fill="currentColor" d="'+ds.join("")+'"/></svg>' };
  } finally { d.close(SaveOptions.NO); }
  return out;
}

var old = app.scriptPreferences.measurementUnit, report = [];
app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
try{
  for (var j=0;j<OUTS.length;j++){
    var r = exportOne(OUTS[j][1]);
    var F = File(root.fsName + "/assets/" + OUTS[j][0]); F.encoding="UTF-8"; F.open("w"); F.write(r.svg); F.close();
    report.push(OUTS[j][0] + " [" + r.label + "] oblika " + r.n + ", " + r.svg.length + " B");
  }
} catch(e){ report.push("GREŠKA (redak " + e.line + "): " + e.message); }
finally { app.scriptPreferences.measurementUnit = old; }
return "Logo izvoz\n" + report.join("\n");
})();
