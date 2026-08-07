# MID v0.9.21.1

## Umsetzung aus dem verlinkten MID-Chat

- Niederschlagsarten-Radar: Verortung der Favoriten/aktiven Orte korrigiert. Karte und Marker nutzen eine gemeinsame Mercator-Projektion ohne Koordinatenrundung; der aktive Ort wird geometrisch exakt in den Mittelpunkt des gezoomten Ausschnitts transformiert.
- Niederschlagsarten-Radar: DWD-Klassenlegende hinter einem kompakten `(i)` ergänzt.
- Kurzfristmeteogramm: Stundenpiktogramme aus dem separaten HTML-Overlay in das SVG des Diagramms verlagert. X- und Y-Koordinaten stammen damit direkt aus derselben Graphgeometrie; responsive Drift ist ausgeschlossen.
- Regressionstest `scripts/test-dwd-radar-meteogram-alignment-09211.mjs` ergänzt und bestehende betroffene Tests synchronisiert.

## Worker
Keine funktionale Worker-Änderung. Versionsnummer wird lediglich synchron gehalten.
