# MID v0.9.24.2

## DWD Wolken + Niederschlagsart – Gradnetz-Georeferenzierung

- Sichtbarer Titel von **„Niederschlagsart/Satbild“** auf **„Wolken + Niederschlagsart“** geändert.
- Die Standortverortung verwendet nicht mehr die DWD-Stadtbeschriftungen/Pluszeichen als Georeferenzierung.
- Stattdessen wird direkt das im DWD-NinJo-Bild sichtbare geografische Gradnetz verwendet:
  - Längengradlinien 6°, 8°, 10° und 12° E,
  - Breitengradlinien 49°, 50°, 51° und 52° N.
- Zwischen den Rasterlinien wird stückweise interpoliert; außerhalb des zentralen Kalibrierbereichs wird nur über das jeweils nächste Randintervall extrapoliert.
- Die inverse Bildpunkt-zu-Koordinaten-Umrechnung verwendet dasselbe Gradnetz, damit Standortmarker und Antipp-Auswertung konsistent bleiben.
- Eigener Regressionstest für die Gradnetz-Georeferenzierung ergänzt; Wiesbaden wird nun rastergeografisch zwischen Koblenz und Frankfurt sowie südlich von Koblenz verortet.
- DWD-Quellzeitstempel und kreisfreier Standortmarker bleiben unverändert.
