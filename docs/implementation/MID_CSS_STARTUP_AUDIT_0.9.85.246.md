# MID v0.9.85.246 – CSS-Startlast: Messpilot A

Verifizierte Basis: `b4d6e7dbddb550eb2b5d7b3e87756ebbc2d977fe` (v0.9.85.245), identisch auf main und mid-stable vor Arbeitsbeginn. Ausschließlich Featurebranch `chatgpt/v0.9.85.246-css-startup-audit`.

## Befund
Der Haupt-CSS-Chunk ist rund 1,76 MB roh. 70 Stylesheets werden in einer kanonisch geordneten CSS-Kaskade zusammengeführt; 1122 überdeckte identische Deklarationen sind bereits bereinigt. Vite cssCodeSplit ist aktiv, kann diese eager-Kaskade jedoch nicht automatisch nach Ansichten trennen.

## Umsetzung
Der Build-Budget-Check erhält eine gesonderte, überprüfbare Startup-CSS-Analyse aus den tatsächlichen `rel=stylesheet`-Links des **gebauten** HTML. Er schreibt Roh-, gzip-9- und Brotli-6-Bytes, die CSS-Dateianzahl und einzelne Dateinamen in `artifacts/build-budget.json`. Das neue Start-CSS-Limit von 650000 gzip-Bytes ist bewusst zunächst höchstens so permissiv wie das bestehende Gesamt-CSS-Limit: Der erste Schritt ist eine Messbasis, keine vorgetäuschte Verkleinerung. Fehlende oder externe Stylesheets werden nicht still übersehen. Pflichtregressionen prüfen Lazy-/Preload-Abgrenzung und Fehlpfade.

## Nächste Schritte B/C
Nach reproduzierbarer Messung: optionales CSS anhand der tatsächlichen Modulnutzung zuordnen, visuelle Kaskaden- und DOM-Parität zwischen neuen dynamischen Styles und Stable sicherstellen; anschließend die Startlast nachweisbar verringern und das Budget verschärfen. Testmatrix: 320/390/430/834/1024/1440 px, Portrait/Landscape, Light/Dark/High Contrast, Karten/Ensemble/Bergwetter/Widgets, Touch/Fokus/Overflow, URL-/PNG-Exports und Web-/iOS-Hülle. Kein Ersatz physischer iOS/WKWebView/VoiceOver-Tests durch Chromium. Ausstehende Issues #345/#346 separat verifizieren.

Keine Änderung an bestehenden meteorologischen Werten, Datenquellen, CSS-Regelreihenfolge, Produktionsbranches oder Release-Gates. Source-PR → bot-gesteuerter Merge → Installer → Worker/Pages → Stable bleibt verbindlich.
