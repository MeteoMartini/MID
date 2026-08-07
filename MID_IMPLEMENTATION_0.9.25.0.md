# MID v0.9.25.0

## Wolken + Niederschlagsart – native Georeferenzierung

Die bisherige statische Pixel-Georeferenzierung des DWD-Kombinations-PNG wurde vollständig aus dem aktiven Frontendpfad entfernt. Wiederholte Kalibrierungen des PNG-Rasters waren zwar intern mathematisch konsistent, konnten den realen Standortmarker wegen Crop-/Projektionsbezug des Bildes aber praktisch weiterhin erheblich verschieben.

### Neue Architektur
- Der Standortmarker wird **direkt mit den WGS84-Koordinaten des ausgewählten MID-Ortes** als Leaflet-Marker gesetzt. Es findet keinerlei Umrechnung des Standortes in Pixelkoordinaten eines statischen DWD-Bildes mehr statt.
- Beispiel aus der Fehleranalyse: `50.78362 N / 7.059056 E` wird unverändert als `[50.78362, 7.059056]` an die Karte übergeben; die Implementierung enthält keine ortsspezifische Kalibrierung.
- Wolken werden als georeferenzierter DWD-Meteosat-WMS-Layer dargestellt.
- Die Niederschlagsart wird aus dem nativen DWD-HymecNG-HDF5-Produkt geladen und über dessen eigene Projektions-/Rastermetadaten georeferenziert.
- Bildpunktanalyse verwendet die tatsächliche angeklickte WGS84-Kartenkoordinate und tastet damit das native HymecNG-Raster ab.
- Die DWD-Produktseiten-Zeitstempel bleiben für Radar/Niederschlagsart und Satellit verbindlich; HymecNG/NWCSAF dienen nur als Daten-/Fallbackpfad.
- Kartenausschnitt auf Mobilgeräten ist nun um den echten Standort zentriert und standardmäßig auf Zoom 7 gesetzt.

### Worker
- Neue HymecNG-Metadaten- und Datei-Endpunkte für das aktuelle DWD-HDF5-Produkt.
- Aktuelles HymecNG-Dateinamensformat ersetzt den veralteten HG-Fallbackpfad.
- DWD-Produktseiten-Zeitstempel haben Vorrang vor OpenData-Index-Fallbacks.

### Regression
- Betroffene historische Pixel-/Gradnetztests wurden auf den neuen fachlichen Vertrag umgestellt, statt alte Implementierungsdetails zu erzwingen.
- Neue Regression `test-dwd-native-georef-09250.mjs` schützt die direkte WGS84-Durchleitung und verhindert eine Rückkehr zur PNG-Pixelkalibrierung.
- Alle **317** automatisch erkannten MID-Regressionstests wurden nach der finalen Änderung in vier vollständigen Testsegmenten ausgeführt und bestanden.
- Worker-JavaScript sowie die vier geänderten TypeScript-/TSX-Module wurden zusätzlich auf Syntaxfehler geprüft.
