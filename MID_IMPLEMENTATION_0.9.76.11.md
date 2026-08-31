# MID v0.9.76.11 – DWD-Ortsausschnitt mit Originallegende und Originalpixel-Auswertung

Stand: 2026-08-31

## Ausgangsstand

Die Umsetzung ist auf dem vom Nutzer übergebenen Professional-Quellstand
v0.9.76.10 aufgebaut. Reisewetter v0.9.76.9 und das nach dem Prinzip der
Tagesansicht modernisierte 24-h-Wetterprofil v0.9.76.10 bleiben unverändert
enthalten.

## Umsetzung

- „Wolken + Niederschlagsart“ startet für den gewählten Standort oder
  Favoritenort innerhalb Deutschlands als standortzentrierter Ausschnitt des
  unveränderten amtlichen DWD-Kombinationsbilds.
- Eine ausschließlich für Ansicht und Marker verwendete bilineare Abbildung
  wurde an 17 sichtbaren DWD-Stadtankern in Nord-, Süd-, Ost-, West- und
  Mitteldeutschland geprüft. Sie rekonstruiert weder ein Raster noch einen
  georeferenzierten Kartenlayer.
- Der Standortmarker und beliebige Bildklicks werden im Koordinatensystem des
  vollständigen Original-PNG ausgewertet. Zoom und Panning verändern nur die
  Ansicht; die Worker-Anfrage erhält weiterhin die normierten Originalpixel
  `x`/`y` und den gebundenen Produktzeitstand.
- Die permanent sichtbare Legende ist ein Ausschnitt derselben geladenen
  DWD-Bildantwort. Die ergänzende barrierearme HTML-Legende bleibt über den
  Info-Schalter erreichbar.
- Browser, PWA und Capacitor-iOS verwenden denselben React/Vite-Kern. Es gibt
  keinen Plattformfork und keine neue native Berechtigung.

## Mehrort- und Randprüfung

Der Required-Test vergleicht Kiel, Rostock, Hamburg, Bremen, Hannover, Berlin,
Magdeburg, Leipzig, Dresden, Düsseldorf, Köln, Frankfurt am Main, Erfurt,
Saarbrücken, Nürnberg, Stuttgart und München mit den sichtbaren Stadtankern des
Referenzbilds. Flensburg, Aachen, Görlitz, Freiburg und Passau prüfen zusätzlich
die deutsche Randabdeckung. Für alle Anker wird auch die inverse
Originalpixel-Rückrechnung kontrolliert.

## Worker-Entscheidung

Der bestehende Workerpfad unterstützt die Originalbildkoordinaten und den
Produktstand bereits. Die Änderung betrifft nur Darstellung, Marker und
Ansichtsgeometrie. **Kein manueller Worker-Upload erforderlich.**

## Validierung

- TypeScript-7.0.2-NoEmit für App und Node im Strict-Modus: bestanden.
- Vite-6.4.3-Produktionsbuild: bestanden.
- Alle 594 automatisch erkannten MID-Regressionstests: bestanden.
- Worker-Syntax und Bytegleichheit von `worker.js` und
  `worker/metar-proxy.js`: bestanden.
- `cap copy ios` sowie Cross-Platform-, WidgetKit-, TypeScript-7-/Capacitor-,
  Datenschutz-, Push-/Background- und Logo-/PNG-Strukturtests: bestanden.
