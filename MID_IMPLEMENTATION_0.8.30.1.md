# MID v0.8.30.1

## Temperatur-Ensemble
- Die Wetterleiste wird pro Tag aus linker und rechter Intervallgrenze berechnet.
- Der letzte Tagesabschnitt endet exakt am rechten Plotrand; Rundungsfehler können sich nicht mehr aufsummieren.
- Die farbigen Zellen grenzen ohne Zwischenraum aneinander.
- Eine gemeinsame Außenkontur und separate Tagestrenner ersetzen die optisch überstehenden Einzelrahmen.
- Die Mitte jeder Zelle entspricht exakt dem zugehörigen Tageswert auf der X-Achse.

## Kurzfristvorhersage
- Es existiert weiterhin nur eine zentrale `selectedId`.
- Das Antippen einer anderen Zeit ersetzt die bisherige Auswahl und schließt deren Detailinhalt automatisch.
- Erneutes Antippen derselben Zeit schließt die Detailansicht.
- Die parallele PointerUp-/Click-Auslösung wurde entfernt.
- Verschwindet eine ausgewählte Zeit nach einem Datenupdate, wird die Auswahl automatisch bereinigt.
