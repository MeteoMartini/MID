# MID Implementation v0.9.78.7

Datum: 2026-09-03

## Anlass

Am 03.09.2026 entstanden zwei voneinander unabhängige Wartungszweige mit derselben Versionskennung `v0.9.78.6`:

1. der Open-Meteo-Wartungszweig „Open-Meteo MID Watch“;
2. der anschließend in MID 17.7.14 erstellte DWD-RUC-/MOSMIX-Niederschlagskonsenszweig.

Die identische Versionskennung darf nicht dazu führen, dass einer der beiden Stände stillschweigend den anderen ersetzt. `v0.9.78.7` ist deshalb der verbindliche Merge-Stand.

## Zusammengeführte Verträge

### DWD-RUC / MOSMIX

Die gesamte v0.9.78.6-Niederschlagskorrektur bleibt erhalten: MOSMIX-Stundenniederschlag als DWD-Konsensanker, kein Nass-Selbstbonus für deterministischen RUC, getrenntes RUC-Niederschlagsgewicht, RUC-EPS-Unterstützung, kohärente Skalierung von Regen/Schauer/Schnee und Diagnosefelder.

### Open-Meteo Watch 2026-09-03

Der heutige offizielle Upstream-Zeitraum ist in `MID_OPEN_METEO_WATCH_2026-09-03.md` festgeschrieben. Besonders geschützt sind:

- die korrigierten EC46-/Forecast-Metadaten und dimensionslosen EFI/SOT-Felder,
- die Eigenständigkeit von `wave_peak_period`,
- der korrigierte GloFAS-Ensemble-/Perzentilvertrag ohne feste 51-Member-Annahme,
- die südliche Copernicus-DEM-Korrektur,
- die Tatsache, dass Open-Meteo-interne Météo-France-GRIB- und S3-Serverlogik nicht clientseitig dupliziert wird.

MID nutzt die von den betroffenen Upstream-Fixes berührten EC46-Fehlfelder derzeit nicht operativ. Deshalb ist keine fachlich falsche Umrechnung oder Ersatzlogik hinzugefügt worden. Stattdessen ist der korrekte Konsumentenvertrag regressionsgeschützt.

## Version

Der doppelte lokale Versionsname `v0.9.78.6` ist damit beendet. Alle weiteren Releases bauen ausschließlich auf `v0.9.78.7` oder höher auf.
