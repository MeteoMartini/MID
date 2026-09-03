# MID Test Report v0.9.78.12

Datum: 2026-09-03

## Befund Run #850

- `npm ci`: erfolgreich
- Dependency-Audit: erfolgreich, 0 hohe Risiken
- TypeScript 7 (`tsc --noEmit`): erfolgreich
- Vite 6.4.3 Produktionsbuild: erfolgreich
- 650 Regressionstests erkannt
- ausschließlich 3 supersedierte Regressionserwartungen fehlgeschlagen:
  - `test-short-term-rounding-wind-layout-08221.mjs`
  - `test-sunshine-precipitation-coherence-096613.mjs`
  - `test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`

## Korrektur

Alle drei Tests wurden auf den bereits aktiven v0.9.78.10/v0.9.78.11-Fachvertrag migriert. Produktionscode, Niederschlagsmengenlogik und Worker-Fachlogik blieben unverändert.

## Schutz

Die Regressionen schützen jetzt insbesondere das gekürzte erste trailing Intervall ab „jetzt“, die Trennung von PoP und Regendauer sowie die aktive intervalgebundene 24-h-Niederschlagsgeometrie ohne toten `probabilityCellGeometry`-Helper.
