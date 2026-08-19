# MID v0.9.60.10 – Zeitpfeil zoomabhängig

- Die Zeitpfeil-Achse nutzt nicht mehr eine feste Bildschirm-Länge.
- Ihre geographische Länge entspricht jetzt der 60-min-Anströmungsstrecke aus der aufgelösten Schwerpunktströmungs-Geschwindigkeit (`resolved.speed × 60 min`).
- `trackStart`, `trackMid` und die +15/+30/+45/+60-min-Ticks bleiben dadurch geographisch stabil und werden nach jedem `zoomend` neu in Pixelkoordinaten projiziert.
- Beim Reinzoomen wird die Linie sichtbar länger, beim Herauszoomen sichtbar kürzer.
- Ein kleiner Mindestwert dient nur der grundsätzlichen Erkennbarkeit; die bisherige starre 180–520-px-Skalierung wurde auf einen weiten 56–1800-px-Sicherheitsrahmen reduziert.
- Vertikalprofil-Schwerpunktströmung, Zeitlabel-Vertrag und Standort/Favoriten-Trennung bleiben unverändert.
