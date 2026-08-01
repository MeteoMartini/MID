# MID v0.8.30.8

## Korrekturen
- Externe, grid-basierte Datumsachse für Niederschlag und Wind/Böen. Sie liegt außerhalb der Recharts-Clippingfläche und bleibt damit im mobilen Hochformat sichtbar.
- Die Datumsfelder werden mit denselben linken/rechten Achsenreserven wie das Diagramm ausgerichtet.
- Die X-Achse im SVG zeigt nur noch die Tickmarken; Beschriftung und Titel werden darunter stabil als HTML gerendert.
- Senkrechte Tageshilfslinien werden über `CartesianGrid vertical` direkt aus der X-Achse erzeugt.
- Tippen auf einen geöffneten Ensemble-Tooltip schließt ihn gezielt.
