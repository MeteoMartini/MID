# MID v0.9.53.21

## Luftqualität – dezente Parameterskalen im EU-AQI-Dialog

- Im erweiterten EU-AQI-Dialog besitzt nun jeder Einzelparameter (`PM2,5`, `PM10`, `NO₂`, `O₃`, `SO₂`) eine eigene dezente horizontale Vergleichsskala.
- Die Skala bildet die offiziellen sechs europäischen AQI-Stufen je Schadstoff ab; die aktive Stufe wird hervorgehoben.
- Ein Marker zeigt zusätzlich die relative Lage des aktuellen Messwerts innerhalb der jeweiligen Stufe, damit Grenznähe schneller erkennbar ist.
- Oberhalb der Kachelmatrix erklärt ein kurzer Hinweis die Leserichtung: links gut, rechts äußerst schlecht.
- Die Darstellung bleibt bewusst kompakt und ist für schmalere Ansichten responsive auf eine Spalte reduziert.

Aktualisierte Regression: `scripts/test-aqi-card.mjs`.
