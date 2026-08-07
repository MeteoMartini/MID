# MID v0.9.27.0

## Prognosegüte · parameterspezifische Priorisierung

- Bestehende Wetterzwilling-/Prognosegüte-Daten bleiben vollständig erhalten (`mid:forecast-verification:v3:` und Store-Version 3 unverändert).
- Der Gesamtscore wird aus denselben historischen Parameterfehlern neu nach Relevanz gewichtet: Niederschlagsmenge 28 %, Temperatur 24 %, Böen 20 %, Regenwahrscheinlichkeit 18 %, Sonnenschein 10 %.
- Fehlende Parameter werden nicht als Fehler gewertet; die vorhandenen Gewichte werden für den jeweiligen Vergleich normalisiert.
- Die bereits vorhandenen parameterspezifischen Modellgewichte pro Wetterlage und Prognosehorizont bleiben erhalten und werden weiterverwendet.
- Das kohärente Wetterbündel bleibt bestehen; sein Vertreter wird jetzt mit Priorität Niederschlag > Regenwahrscheinlichkeit > Sonnenschein ausgewählt. Dadurch kann ein Modell nicht hauptsächlich durch eine gute Sonnenscheinprognose zum Wetterbündel-Sieger werden.
- Auch Tagesvergleich, Validierung gegen Best Match und globale Modellrangfolge verwenden das neue Prioritätsprofil, sodass die Freigabelogik intern konsistent bleibt.
- Prognosegüte-Oberfläche weist die Gewichtung transparent aus.
