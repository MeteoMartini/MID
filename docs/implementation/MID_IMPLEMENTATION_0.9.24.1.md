# MID v0.9.24.1

## DWD Niederschlagsart/Satbild – Georeferenzierung und Quellzeitstempel

- Standortverortung des DWD-NinJo-Komposits neu kalibriert: affine Bild-Georeferenzierung anhand dauerhaft sichtbarer DWD-Stadtanker statt Bounding-Box-/Frame-Näherung. Wiesbaden wird dadurch zwischen Koblenz und Frankfurt am korrekten Bildpunkt verankert; dieselbe inverse Abbildung gilt für die Bildpunkt-Auswertung.
- Radar-/Satelliten-Zeitstempel werden verbindlich aus der DWD-Produktseite `wolken_niederschlagsart.html` gelesen. Der bisherige Last-Modified-/Kompositzeit-Fallback wird für die sichtbaren Radar-/Sat-Zeitangaben nicht mehr verwendet.
- Standortmarker im Kartenbild ohne umgebenden Kreis dargestellt.
- Bestehende betroffene Regressionstests auf den neuen Vertrag angepasst und neuer Georeferenzierungs-/Quellzeit-Test ergänzt.
- Vollständiger Regressionstestlauf: 313/313 bestanden.
