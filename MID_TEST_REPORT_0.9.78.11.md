# MID Test Report v0.9.78.11

Datum: 2026-09-03

## Befund Run #849

- `npm ci`: erfolgreich
- Dependency-Audit: erfolgreich
- Abbruch ausschließlich bei TypeScript mit `TS6133` für `probabilityCellGeometry` in `src/ForecastCockpit.tsx`.

## Korrektur

Der unbenutzte Helper wurde entfernt. Die Niederschlagslogik aus v0.9.78.10 blieb fachlich unverändert.

## Regression

`scripts/test-forecast-cockpit-probability-cell-buildfix-097811.mjs` schützt, dass der tote Helper nicht erneut eingeführt wird und der neue Niederschlags-Intervallvertrag weiterhin vorhanden ist.
