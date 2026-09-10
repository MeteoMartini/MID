# MID v0.9.84.39 – Testbericht

## GitHub #992
Erfolgreich vor dem Regressionsschritt: sichere ZIP-Installation, npm ci, Dependency-Audit, TypeScript 7 und Vite-Produktionsbuild. Fehler: 4 von 739 Regressionen mit veralteten Literal-/Vertragserwartungen.

## Lokal nach Maintenance-Aggregation grün
- test-coherent-weather-bundles-08340.mjs
- test-mosmix-adaptive-fusion-08330.mjs
- test-priority-forecast-fusion-08320.mjs
- test-weather-profile-daily-extremes-consistency-09402.mjs
- test-forecast-fusion-canonical-weighting-09610.mjs
- test-forecast-precipitation-support-083317.mjs
- test-mosmix-contribution-freshness-097915.mjs
- test-ruc-mosmix-precip-consensus-09786.mjs
- test-ruc-precip-amplitude-guard-09787.mjs
- test-temperature-canonical-extrema-09751.mjs
- test-weather-profile-pressure-hazards-09656.mjs
- test-current-temperature-smooth-bridge-097719.mjs

## Bewertung
Die vier #992-Fehler waren keine verlorenen Funktionen. Die Tests wurden an die bewusst geänderten .38-Verträge angepasst; die alte harte MOSMIX-Gewichtsstufe wurde ausdrücklich nicht wieder eingeführt.
