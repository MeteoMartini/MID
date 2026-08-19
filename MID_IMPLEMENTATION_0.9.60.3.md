# MID v0.9.60.3 – Kompositbild Zeitpfeil Sichtbarkeitsfix

- Der lange Zeitpfeil im Kompositbild wird nicht mehr als Canvas-Overlay gezeichnet, sondern als echte Karten-Polylinie.
- Dadurch bleiben Schaft, Tick-Striche und die Linie zu den Zeitlabels auch auf mobilen Geräten und über Karten-/Raster-Overlays zuverlässig sichtbar.
- Jede Zeitmarke erhält zusätzlich eine kurze sichtbare Verbindungsstrecke zwischen Pfeilachse und Label-Position.
- Die Zielspitze am Ort, die Richtung nach Schwerpunktströmung und die bestehende Zeitlabel-Logik bleiben unverändert.
- Die Regression `test-composite-time-arrow-09561.mjs` wurde auf den neuen Sichtbarkeitsvertrag verschärft.
