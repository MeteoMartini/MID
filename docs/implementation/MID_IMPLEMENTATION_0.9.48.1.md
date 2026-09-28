# MID v0.9.48.1

Wartungsrelease für die Release-/Regression-Pipeline nach v0.9.48.0.

- `test-current-source-info-type-safety-09471.mjs` ist nicht mehr auf exakt v0.9.47.1 fest verdrahtet. Der Test schützt weiterhin den TS18048-Fix der Messquellenanzeige, verlangt Baseline-/Paketversionsgleichheit und akzeptiert alle nachfolgenden MID-Stände.
- `test-weather-twin-stages-0800.mjs` schützt jetzt die zentrale finale Prognosestufe `finalizeForecastHours(...)` und `displayHours=finalizedHours.hours` statt die vor v0.9.48.0 verwendete direkte `displayHours=useMemo`-Struktur zu erzwingen.
- Keine fachliche Rücknahme der v0.9.48.0-Korrekturen an Event-/Ortsprognose, Astronomie oder hyperlokaler Stationsgewichtung.
