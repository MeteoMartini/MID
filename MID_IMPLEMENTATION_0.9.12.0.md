# MID v0.9.12.0

## Radar-/Nowcast-Plausibilisierung

- Das Bezugsintervall der 15-Minuten-Kacheln wird jetzt aus dem Zeitraster abgeleitet und nicht mehr davon, ob eine native 15-Minuten-Modellzeile vorliegt.
- Stündliche Modellmengen werden für interpolierte 15-Minuten-Zeitpunkte korrekt auf ein Viertelstundenintervall skaliert.
- Radarintensitäten in mm/h werden vor der Anzeige in eine Intervallmenge umgerechnet.
- Direkte Radarmengen wirken nur bis maximal +120 Minuten.
- Zwischen +120 und +180 Minuten beeinflusst Radar nur noch Timing und Niederschlagswahrscheinlichkeit; die Niederschlagsmenge bleibt modellgeführt.
- Nach +180 Minuten endet der Radarblend vollständig.
- Unsichere oder approximierte Extremraten werden qualitätsabhängig begrenzt und mit dem Modell gemischt, statt unverändert als Intervallmenge ausgegeben zu werden.
- Operative Hauptprognose und lokaler Wetterzwilling verwenden dieselbe zentrale Radar-Modell-Blendlogik.
- Im Kurzfristdetail werden direkte Radarintensität und daraus berechnete Intervallmenge getrennt erläutert.

## Regression

- Schutz gegen die fehlerhafte Ableitung `intervalMinutes = quarter ? 15 : 60`.
- Schutz gegen direkte Radarmengen jenseits von zwei Stunden.
- Schutz für den auslaufenden Timing-/Wahrscheinlichkeitsblend zwischen zwei und drei Stunden.
- Numerischer Test mit 177,6 mm/h: keine Ausgabe von 177,6 mm als 15-Minuten-Menge.
