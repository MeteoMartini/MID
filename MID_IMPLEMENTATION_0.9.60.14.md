# MID v0.9.60.14 – Komposit-Zeitpfeil Rollback-Schutz

- Entfernt das zuletzt eingeführte Komplett-DivIcon für die gesamte Zeitpfeilachse. Diese Lösung konnte beim Zoomen/Rotieren visuell vom Kartenanker entkoppeln und erzeugte versetzte Großpfeile.
- Schaft und Tick-Marken sind wieder echte geographische Linien in `mid-motion-vectors` (z-index 860) oberhalb der Referenzkarte (790).
- Die Pfeilspitze ist ein eigener Marker exakt am ausgewählten Ort; Zeitlabels liegen ausschließlich an den geographischen Tickpunkten, niemals direkt am Ort.
- Die runden dynamischen Zeitschritte 2/5/10/15/20/30/45/60 min und die wolkengewichtete Vertikalprofil-Schwerpunktströmung bleiben erhalten.
- `actualLocation` wird im Kompositbild nur noch freigegeben, wenn die aktuelle Auswahl wirklich aus dem laufenden Geräte-Tracking stammt und dem getrackten Ort entspricht. Favoriten/manuelle Orte erhalten immer den neutralen Ortsmarker ohne Sichtrichtung.
