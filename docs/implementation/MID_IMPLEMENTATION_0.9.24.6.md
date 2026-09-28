# MID v0.9.24.6

## DWD Wolken + Niederschlagsart – Georeferenzierung des Quellbildes neu aufgebaut

Die Ursache der weiterhin falschen Ortsmarker war nicht die lokale Interpolation selbst, sondern die Bezugsfläche der Kalibrierung: Rasterkoordinaten aus einem bereits gezoomten bzw. gecroppten Bildschirm-Ausschnitt waren zuvor fälschlich wie Koordinaten des vollständigen DWD-Quellbildes behandelt worden.

### Umsetzung
- Kalibrierung jetzt im Koordinatensystem des vollständigen **900×900-DWD-Quellbildes**.
- 16 zurückgerechnete Schnittpunkte des sichtbaren projizierten DWD-Gradnetzes (6/8/10/12° E × 49/50/51/52° N) dienen als Ground-Control-Points.
- Aus allen 16 Rasterpunkten wird eine zweidimensionale quadratische Projektionsabbildung genutzt; maximale Abweichung zu den Rasterankern liegt unter 0,4 Quellbildpixeln.
- Keine harte Begrenzung mehr auf die inneren vier Rasterlinien: Die Projektion wird kontinuierlich über die gesamte Deutschland-Abdeckung extrapoliert.
- Bildpunkt → geografische Koordinate nutzt die analytisch iterierte inverse Projektion desselben Modells.
- Die betroffenen vorhandenen Regressionstests wurden auf den neuen Vollbild-Georeferenzierungsvertrag aktualisiert; der Test `test-dwd-raster-georef-09242.mjs` schützt explizit gegen eine erneute Verwechslung von Crop-/Viewport- und Quellbildkoordinaten.

### Worker
Keine funktionale Worker-Änderung; lediglich Versionssynchronisierung auf v0.9.24.6.
