# MID v0.9.21.2

## Regression-Fix

Der Wetterkarten-Regressionsstest war nach dem Folgerelease v0.9.21.1 weiterhin auf exakt v0.9.21.0 fest verdrahtet. Dadurch scheiterte der vollständige GitHub-Regressionstest trotz funktional korrektem Code.

### Korrektur
- `scripts/test-weather-maps-module-09210.mjs` prüft nicht mehr auf die feste Zeichenkette `0.9.21.0`.
- Stattdessen werden `package.json`, `MID_BASELINE.json` und `WORKER_VERSION` miteinander abgeglichen.
- Zusätzlich wird nur noch die sachlich notwendige Mindestversion `0.9.21.0` geprüft.

### Funktionale Änderungen
Keine. Splashscreen, Wetterkartenmodul, DWD-Niederschlagsarten-Radar und Meteogramm bleiben unverändert.
