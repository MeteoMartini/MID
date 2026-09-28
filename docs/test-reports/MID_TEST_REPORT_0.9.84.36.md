# MID v0.9.84.36 – Testbericht

## Ursache aus GitHub #989
- `src/eventCenter.ts`: TS18049 bei nullable PoP-Subtraktion.
- `src/v078.ts`: TS2345 durch readonly `ServiceWorkerRegistration[]` aus dem DOM-Vertrag.

## Lokal ausgeführt
- `node scripts/build-maintenance-aggregates.mjs`
- `node scripts/test-ci-types-event-update-098436.mjs`
- `node scripts/test-update-event-sources-ios27-098434.mjs`
- `node scripts/test-event-pop-weather-twin-09490.mjs`
- `node scripts/test-day-precipitation-color-contract-098435.mjs`
- `node scripts/test-update-startup-recovery-098415.mjs`
- `node scripts/test-forecast-entry-consistency-098430.mjs`
- `node --check public/service-worker.js`
- `node --check public/sw.js`
- isolierter Strict-TypeScript-Probe für die beiden korrigierten Typmuster

Alle ausführbaren gezielten Prüfungen bestanden. Der vollständige TypeScript-7/Vite/Gesamtregressionslauf wird weiterhin durch den GitHub-Release-Gate erbracht.
