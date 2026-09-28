# MID 0.9.78.62 – Testbericht

## GitHub #896

Der Installer #896 bestätigte vor dem Regressionsabbruch:

- `npm ci`: erfolgreich
- Produktions-Dependency-Audit: erfolgreich
- TypeScript 7: erfolgreich
- Vite-Produktionsbuild: erfolgreich
- 679 von 680 Regressionen: erfolgreich
- einziger Fehler: `test-precipitation-form-snow-units-093222.mjs` mit veraltetem exaktem 7-Tage-Quelltextvertrag

## Korrekturprüfung

- `test-precipitation-form-snow-units-093222.mjs`: bestanden; lokal mit dem vorhandenen TypeScript-5.8-CLI über einen ausschließlich für die Prüfung verwendeten `--ignoreConfig`-Kompatibilitätsshım. Die fachlichen Assertions selbst laufen unverändert.
- `test-seven-day-condition-label-consistency-097845.mjs`: bestanden.
- `test-pressure-axis-nice-spacing-097861.mjs`: bestanden.
- `test-versioning.mjs`: bestanden.
- `test-release-lineage.mjs`: bestanden.
- `test-baseline-079526-contract.mjs`: bestanden.
- `node --check worker/metar-proxy.js`: bestanden.
- `node --check worker.js`: bestanden.

Der vollständige TypeScript-7-/Vite-Produktionsbuild wird nicht als lokal wiederholt behauptet. Genau dieser Produktionsstand hatte ihn in GitHub #896 bereits bestanden; v0.9.78.62 ändert gegenüber diesem Stand keine fachliche Produktionslogik, sondern den veralteten Regressionstest und Release-Metadaten.
