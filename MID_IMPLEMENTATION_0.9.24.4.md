# MID v0.9.24.4

## Buildfix
- Entfernt die nach der Umstellung auf verbindliche DWD-UTC-Quellzeitstempel nicht mehr verwendete lokale `timezone`-Variable in `DwdPrecipitationTypeRadar.tsx`.
- Funktional bleiben die DWD-Quellzeitstempel, die gekrümmte Raster-Georeferenzierung und die übrigen Änderungen aus v0.9.24.3 unverändert.
- Eigener Regressionstest schützt vor Wiedereinführung des TypeScript-Fehlers TS6133.
