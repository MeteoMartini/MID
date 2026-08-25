# MID 0.9.65.11

## Aktuelle Niederschlagswahrscheinlichkeit

Die appweite PoP-Logik behält weiterhin echte Werte von 0 bis 100 % ohne künstliche 5-%-Untergrenze. Für die **aktuelle** Niederschlagskarte gilt zusätzlich: Sind im Kurzfristfenster keine messbaren Niederschlagssignale vorhanden und bleibt das gesamte Modellrisiko bei höchstens 5 %, wird die aktuelle Lage als 0 % ausgegeben. Bei bestätigter trockener Radarabdeckung wird ein Modell-/Radar-Trockenkonsens bis jeweils 5 % ebenfalls auf 0 % gesetzt. Reale niedrige Prognosewerte oberhalb dieser klaren Trockenkonsensregel bleiben unverändert erhalten.

## Reisewetter

Erwartete Niederschlagstage werden in der Nutzeranzeige auf ganze Tage gerundet; intern bleibt der kontinuierliche Erwartungswert für Scoring und Bedingungen erhalten.

Für Küstenorte verwendet MID keine aktuelle Wassertemperatur. Stattdessen wird zunächst ein kleines historisches Meeresgitter geprüft. Liegt dieses höchstens 45 km vom Reiseziel entfernt, wird einmalig die ERA5-`sea_surface_temperature`-Historie 1991–2020 geladen, zu einer lokalen Tagesklimatologie verdichtet und drei Jahre gecacht. Angezeigt wird der klimatologische Mittelwert exakt für den gewählten Reisezeitraum.

## Warnkopf

Der aktuelle automatische Warnzustand bleibt strikt an `validFrom <= jetzt < validTo` gebunden. Ein erst ab 23:00 Uhr gültiges Signal wird um 22:51 Uhr daher weiterhin korrekt als zukünftiges Warnfenster behandelt und nicht als aktuelle Warnlage ausgegeben.

## Regression

`scripts/test-current-dry-pop-travel-water-096511.mjs` schützt den Trockenkonsens der aktuellen PoP, die historische ERA5-SST-Reiselogik, die Rundung der Niederschlagstage und die zeitstrikte aktuelle Warnlage.
