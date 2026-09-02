# MID Test Report v0.9.77.26

Datum: 2026-09-02

## Neue Regression

`scripts/test-long-range-single-model-fallback-097726.mjs`

Geprüft wird insbesondere:

- saisonaler Langfristtrend wird bereits bei genau einer numerisch verfügbaren Modellfamilie gerendert;
- Temperatur- und Niederschlags-Rauchfahne verwenden dann die echte Modell-/Ensemble-Streuung;
- der alte reine Single-Model-Hinweiskasten ist entfernt;
- Poor-Man’s-Ensemble bleibt ab zwei Modellfamilien bestehen;
- gemeinsamer Einzelmodellvergleich bleibt zur Redundanzvermeidung ab zwei Linien aktiv;
- Releaseversion und Baseline sind synchronisiert.

## Relevante Regressionen

Bestanden:

- `test-long-range-single-model-fallback-097726.mjs`
- `test-trend-seasonal-temperature-ui-097725.mjs`
- `test-long-range-seasonal-09330.mjs`
- `test-long-range-release-resilience-09341.mjs`
- `test-long-range-model-sources-09774.mjs`
- `test-true-multimodel-snowline-09350.mjs`
- `test-maintenance-modularization-09560.mjs`

## Vollregression

639 Regressionstests erkannt. 534 umgebungsunabhängig ausführbare Tests bestanden. 105 Tests bleiben in dieser Transportumgebung durch die nicht installierte projektgepinntte TypeScript-7-/`typescript-strada`-Toolchain blockiert; der Umfang entspricht dem bekannten Toolchain-Gate plus der neuen bestandenen Regression.

## Syntax / Aggregate

- `LongRangePanel.tsx`, `LongRangeModelComparison.tsx` und `seasonalForecast.ts` mit dem lokal verfügbaren TypeScript-Parser/Transpiler syntaktisch geprüft.
- `build-maintenance-aggregates.mjs` erfolgreich; Styles, Weather- und Worker-Aggregate synchronisiert.
- `worker/metar-proxy.js`, `worker-src/00-core-observations.js`, `public/service-worker.js` und `public/sw.js` mit `node --check` geprüft.

## Ergebnis

Der beobachtete Ausfall ist geschlossen: Auch bei nur einer aktuell numerisch verfügbaren Saisonmodellfamilie bleibt ein echter saisonaler Langfristtrend sichtbar. Keine fachliche Workeränderung erforderlich.
