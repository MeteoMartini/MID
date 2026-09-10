# MID v0.9.84.32 – Testbericht

## GitHub-Fehleranalyse
Run #986: ZIP-Integrität/Struktur, Node 22.16, npm 10.9.2, `npm ci` und Produktions-Dependency-Audit erfolgreich. TypeScript meldete ausschließlich vier zusammenhängende Fehler in `ForecastCockpit.tsx` an der neuen Niederschlagsbalken-Farbableitung. Diese Ursache ist in v0.9.84.32 korrigiert.

## Lokal erfolgreich
- `test-forecast-entry-consistency-098430.mjs`
- `test-modern-forecast-workspace-09794.mjs`
- `test-modern-five-workspaces-09841.mjs`
- `test-modern-focus-detail-hierarchy-09796.mjs`
- `test-optional-bottom-navigation-09790.mjs`
- `test-short-term-card-labels-08223.mjs`
- `test-seven-day-orientation-layout-09640.mjs`
- `test-seven-day-axis-badge-lock-09784.mjs`
- `test-seven-day-curve-night-band-097841.mjs`
- `test-seven-day-ecmwf-hourly-09781.mjs`
- `test-seven-day-today-precipitation-09554.mjs`
- `test-fourteen-day-orientation-layout-09642.mjs`
- `test-fourteen-day-header-density-097880.mjs`
- `test-fourteen-day-confidence-no-clipping-097879.mjs`
- `test-appwide-parameter-colors-09779.mjs`
- `test-parameter-color-contract-097711.mjs`
- `test-parameter-color-contract-097712.mjs`
- `test-precipitation-forward-slot-presentation-097846.mjs`
- `test-precipitation-trailing-interval-nowcast-097810.mjs`
- `test-travel-center-forecast-fusion-098429.mjs`
- `test-release-preflight-gate-097868.mjs`
- `test-install-workflow-registry-retries-097840.mjs`
- `test-github-workflow-bootstrap-08263.mjs`
- Worker-Syntaxprüfung

## Lokale Umgebungsgrenzen
Einige historische Tests starten einen projektinternen TypeScript-/Typdefinitionspfad (`typescript-strada`, D3/React-Typen bzw. TS7 `--ignoreConfig`). Diese Module sind in der aktuellen Sandbox nicht vollständig installiert. Run #986 belegt jedoch, dass `npm ci` im Release-Runner erfolgreich ist und genau diese Projektabhängigkeiten dort vor dem Build verfügbar sind.

## Worker-Semantik
Vergleich v0.9.84.31 → v0.9.84.32: `changed=false`; ausschließlich Versionsmarke, kein fachlicher Worker-Deploy erforderlich.
