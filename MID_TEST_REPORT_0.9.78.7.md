# MID Test Report v0.9.78.7

Datum: 2026-09-03

## Prüfgegenstand

Zusammenführung der beiden parallelen v0.9.78.6-Zweige: Open-Meteo MID Watch und DWD-RUC-/MOSMIX-Niederschlagskonsens.

## Neue Regression

`scripts/test-openmeteo-watch-09787.mjs` schützt:

- den aktuell tatsächlich genutzten EC46-Witterungsparameterumfang,
- keine irrtümliche Nutzung der upstream korrigierten EFI-/SOT-/Taupunkt-/Surface-Temperature-Felder,
- getrennte Marineparameter `wave_period` und `wave_peak_period`,
- Nutzung der Open-Meteo-Elevation-API statt lokaler Replikation des alten südlichen DEM-Indexfehlers,
- keine feste GloFAS-51-Memberannahme in MID,
- Dokumentation der relevanten offiziellen Open-Meteo-Upstream-Commits,
- eindeutige Release-Version v0.9.78.7.

## Bestehender Niederschlagsvertrag

`scripts/test-ruc-mosmix-precip-consensus-09786.mjs` bleibt Bestandteil der erforderlichen Regressionen. Damit darf die Zusammenführung die zuvor implementierte DWD-RUC-/MOSMIX-Plausibilisierung nicht zurücknehmen.
