# MID v0.9.15.8 – HX-Georeferenzierung

## Ausgangslage

Das DWD-HX-Deutschlandkomposit wurde bislang aus den vier HDF5-Eckkoordinaten in ein einziges rechteckiges Leaflet-`ImageOverlay` gespannt. Das HX-Raster liegt jedoch in einer ellipsoidischen Polarstereografie. Eine lineare Abbildung in ein geografisches Rechteck verformt und verschiebt die Niederschlagsfelder gegenüber korrekt projizierten DWD-RV-/WMS-Layern.

## Umsetzung

- Neues reines Projektionsmodul `src/radarProjection.ts`.
- Vollständige Auswertung der HX-`projdef`-Parameter einschließlich WGS84-Ellipsoid, wahrer Breite, Zentralmeridian und False Easting/Northing.
- Projektionstreue Leaflet-`GridLayer`-Darstellung für HX:
  - Web-Mercator-Kartenpixel werden in die HX-Polarstereografie transformiert.
  - Die passende Quellzelle wird direkt aus dem 4400 × 4800 Raster gelesen.
  - Die dokumentierte negative y-Richtung wird berücksichtigt.
- Das lokale PX250-Fallback behält die bisherige Bilddarstellung; nur das nationale HX-Komposit verwendet die neue Projektionsebene.
- Farbwerte werden über eine Lookup-Tabelle wiederverwendet; nur sichtbare Leaflet-Kacheln werden asynchron berechnet.

## Regression

`test-hx-projection-alignment-09158.mjs` prüft:

- HX-spezifische kachelweise Projektion statt rechteckigem Bild-Stretching,
- korrekte x-/y-Rasterzuordnung,
- vier bekannte HX-Eckreferenzen gegen die HDF5-Polarstereografie,
- Vorwärts-/Rücktransformation,
- korrekte Rasterzelle für Münster innerhalb eines 250-m-Pixels.

## Deployment

Frontend-Änderung. Der Worker wurde nur versionssynchronisiert; kein funktionaler Worker-Upload erforderlich.
