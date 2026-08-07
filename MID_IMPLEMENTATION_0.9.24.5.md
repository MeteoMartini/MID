# MID v0.9.24.5

- DWD-Panel **Wolken + Niederschlagsart**: Ortsverortung des Markers und der Bildpunkt-Rückrechnung für das Niederschlagsartbild grundlegend neu implementiert.
- Statt der bisherigen vereinfachten Kurvenkalibrierung wird nun das **sichtbare projizierte Gradnetz** des DWD-Bildes über Raster-Schnittpunkte 6/8/10/12° E und 49/50/51/52° N als lokale Zell-Georeferenz verwendet.
- Vorwärtsrichtung: Markerposition erfolgt je Rasterzelle bilinear über die vier zugehörigen Gitter-Schnittpunkte.
- Rückwärtsrichtung: Bildpunkt -> Lat/Lon erfolgt per lokaler inverser bilinearer Iteration über alle Rasterzellen und Auswahl der plausibelsten Lösung.
- Dadurch ist die Verortung nicht mehr auf Beispielorte abgestimmt, sondern am projizierten DWD-Raster selbst ausgerichtet.
- Die Anzeige der zwei UTC-Quellzeitstempel aus dem Worker bleibt erhalten; Worker-Version, Frontend-Version und Baseline wurden auf **0.9.24.5** synchronisiert.
