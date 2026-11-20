// QR kod za digitalni cjenik: novi privremeni dokument -> PDF (vektor, za tisak) + PNG; dokument se ne sprema.
(function(){
var URL = "https://hlushlus13.github.io/enigma-cjenik/";
var outDir = Folder(File($.fileName).parent.parent.parent.fsName + "/QR");
var old = app.scriptPreferences.measurementUnit; app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;
var d = app.documents.add(false);
try{
  d.documentPreferences.pageWidth = 40; d.documentPreferences.pageHeight = 40;
  d.documentPreferences.facingPages = false;
  var pg = d.pages[0];
  var r = pg.rectangles.add({geometricBounds:[2,2,38,38], strokeWeight:0});
  r.createHyperlinkQRCode(URL, d.swatches.itemByName("Black"));
  var pdf = File(outDir.fsName + "/Enigma_cjenik_QR.pdf"), png = File(outDir.fsName + "/Enigma_cjenik_QR.png");
  app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;
  d.exportFile(ExportFormat.PDF_TYPE, pdf, false);
  app.pngExportPreferences.exportResolution = 600; app.pngExportPreferences.pngExportRange = PNGExportRangeEnum.EXPORT_ALL;
  d.exportFile(ExportFormat.PNG_FORMAT, png, false);
  return "OK\n" + pdf.fsName + "\n" + png.fsName;
} catch(e){ return "GREŠKA (redak " + e.line + "): " + e.message; }
finally { d.close(SaveOptions.NO); app.scriptPreferences.measurementUnit = old; }
})();
