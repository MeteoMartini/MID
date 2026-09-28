# MID v0.8.30.6

## Korrektur
- Die Tageszentren des Temperatur-Ensembles werden nach dem Rendern direkt aus den Recharts-X-Achsenmarken ausgelesen.
- Das Sonne-/Wolkenband berechnet jede Zellgrenze als Mittelpunkt zwischen zwei benachbarten Tagesmarken. Erste und letzte Zellgrenze werden aus dem tatsächlichen Achsabstand extrapoliert.
- Eine eigene, nicht interaktive SVG-Ebene zeichnet die senkrechten Hilfslinien exakt an denselben gemessenen Tageszentren vom X-Achsenbereich bis zum oberen Plotrand.
- Die bisherigen theoretischen Pixelberechnungen, die nach rechts sichtbar drifteten, werden nicht mehr verwendet.
