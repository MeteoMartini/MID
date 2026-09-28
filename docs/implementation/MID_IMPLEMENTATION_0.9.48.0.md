# MID v0.9.48.0 – Prognosekonsistenz, präzisere Astronomie und hyperlokale Stationskalibrierung

## Ausgangsbasis

- MID v0.9.47.1
- Stable-Branch: `mid-stable`
- geschützte Lineage: `MID-v0.7.95.26-complete`

## 1. Event-Wetter = reguläre MID-Ortsprognose

Die Event-Prognose besitzt keine abweichende meteorologische Endlogik mehr.

- `finalizeForecastHours()` ist die gemeinsame letzte Prognosestufe für Ortsansicht und Eventplaner.
- Reihenfolge: Mehrquellenfusion → operativer Radar-Nowcast → Konvektiv-/Gewitter-Nowcast → frischer Stations-Temperaturanker → stündlich/täglicher Konsistenzabgleich.
- Liegt ein Event am aktuell geöffneten Ort, übernimmt der Eventplaner exakt die bereits finalisierten `displayHours` der Ortsansicht. Dadurch können für denselben Ort/Zeitpunkt keine parallel unterschiedlich postprozessierten MID-Werte entstehen.
- Für andere Eventorte wird dieselbe Endstufe eigenständig ausgeführt. Bei kurzfristigen Events wird zusätzlich dieselbe 150-Minuten-Frischegrenze für den Stations-Temperaturanker verwendet.
- Die Quellenzeile kennzeichnet den exakten Pfad transparent als „Aktive Ortsvorhersage · identische MID-Endstufe“.

## 2. Astronomie

Die bisherige Mischlogik aus eigenen Näherungsformeln und Astronomy Engine wurde entfernt. Sämtliche Inhalte der Sonne-/Mond-Astronomie verwenden nun Astronomy Engine 2.1.19 als gemeinsame Ephemeridenbasis:

- Sonnenaufgang / Sonnenuntergang: `SearchRiseSet`
- Sonnenhöchststand: `SearchHourAngle`
- zivile, nautische und astronomische Dämmerung: `SearchAltitude`
- blaue und goldene Stunde: `SearchAltitude`
- Mondaufgang / Monduntergang: `SearchRiseSet`
- Mondphase: `MoonPhase`
- beleuchteter Mondanteil: `Illumination`
- nächster Neu-/Vollmond: `SearchMoonPhase`
- Mondalter: aus dem letzten berechneten Neumond
- Sichtbarkeit von Mondfinsternissen: topozentrische Mondhöhe über `Equator` + `Horizon`
- Sonnen- und Mondfinsternisse bleiben standortbezogen auf derselben Engine.

Die Berechnung verwendet die tatsächliche Standortzeitzone inklusive DST-Tagesgrenzen und die Standorthöhe über NHN. Dadurch werden insbesondere die bisherigen Rundungs-/Interpolationsabweichungen bei Mondauf-/untergang und Mondphase vermieden.

## 3. Hyperlokale Stationsanalyse

Die Prüfung gegen v0.9.46.0 zeigte: Der eigentliche Restfeldansatz war weiterhin vorhanden. Die Verschlechterung konnte durch die mit v0.9.47.0 hinzugekommenen Quellen entstehen, insbesondere weil Straßenwetter/GMA allgemeine Luftparameter trotz ihrer speziellen Standortcharakteristik noch zu stark stützen konnte.

Korrekturen:

- Straßenwetter für allgemeine Temperatur, Feuchte und Taupunkt: Qualität 0,42, räumliche Skala 7 km, Altersskala 35 min.
- Straßenwetter-Luftdruck: Qualität 0,28, räumliche Skala 5 km.
- Wind, Sicht, Wolken und Niederschlag aus Straßenwetter bleiben als allgemeine Standortwerte sehr stark gedämpft.
- Fahrbahn-/Straßenparameter bleiben davon unberührt und behalten ihre spezialisierte Rolle.
- Zusätzlich erhält jede geeignete Messstation einen weichen Lokalitätsfaktor. Wirklich nahe Stationen werden dadurch gegenüber weit entfernten, nur aufgrund ihrer Netzklasse hoch bewerteten Stationen wieder etwas stärker berücksichtigt.
- Entfernung, Aktualität, Höhendifferenz, Standorttyp, QC/Trust und feldspezifische Quellenqualität bleiben parallel aktiv.

## Regression

Neu: `scripts/test-event-astronomy-hyperlocal-consistency-09480.mjs`

Der Test schützt:

- gemeinsame Event-/Ortsprognose-Endstufe,
- exakte Übernahme der aktiven Ortsprognose bei identischem Eventort,
- Stationsanker und Aktualitätsgrenze bei anderen Eventorten,
- vollständige Astronomy-Engine-Ephemeridenbasis,
- Entfernung alter Näherungs-/10-Minuten-Mondlogik,
- Straßenwetter-Dämpfung und hyperlokalen Lokalitätsfaktor,
- Versions-/Baseline-Konsistenz.

Zusätzlich wurden die bestehenden Event-, Astronomie-, Hyperlokal-, Quellen-, v0.9.47-Quellenbroker-, Baseline- und Release-Lineage-Regressionen erfolgreich geprüft.
