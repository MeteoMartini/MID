# MID v0.8.33.1

## Änderungen

1. Temperatur-Ensembletooltip
- Die Zeile „Sonne“ enthält Best-Match-Sonnenscheindauer und P10–P90 nun in einer einzigen, bündigen Wertzelle.
- Die Zeile „Niederschlag“ enthält Niederschlagsart/-menge und Wahrscheinlichkeit ebenfalls in einer einzigen Zeile.
- Mobile Schrift- und Spaltengeometrie bleibt auf schmalen Displays lesbar.

2. Ortssuche
- Die vollständige Eingabefläche fokussiert das Suchfeld bereits beim ersten Pointerkontakt.
- `preventScroll` verhindert einen unnötigen Sprung beim Fokus.

3. Favoriten
- Pointer-Capture für normale Favoriten-Taps entfernt; Ziehen bleibt ausschließlich am Griff.
- Größere Bewegungstoleranz verhindert versehentlich verworfene Taps.
- Standort-Schnellzugriff und Favoritenstern reagieren auf Touch unmittelbar; synthetische Folgeklicks werden unterdrückt.
