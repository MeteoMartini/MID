# MID_TEST_REPORT_0.9.77.25.md

## Zielregressionen

Bestanden:

- `scripts/test-trend14plus-09770.mjs` – 33 Checks
- `scripts/test-long-range-model-sources-09774.mjs` – 8 Checks
- `scripts/test-long-range-seasonal-09330.mjs`
- `scripts/test-long-range-grid-ensemble-colors-09332.mjs`
- `scripts/test-true-multimodel-snowline-09350.mjs`
- `scripts/test-seasonal-c3s-dwd-ui-09410.mjs`
- `scripts/test-long-range-release-resilience-09341.mjs`
- `scripts/test-parameter-color-contract-097711.mjs` – 21 Checks
- `scripts/test-attachment-hazard-temperature-colors-097715.mjs`
- `scripts/test-tmin-tmax-number-tone-097717.mjs`
- `scripts/test-trend-seasonal-temperature-ui-097725.mjs`
- `scripts/test-fourteen-day-orientation-layout-09642.mjs`
- `scripts/test-visible-app-internals-09751.mjs`
- `scripts/test-knmi-eps-wasm32-prototype-097724.mjs`

Die drei veralteten Erwartungen auf den vorherigen Season-/Tmin-Tmax-Vertrag wurden semantisch auf den neuen Vertrag migriert. Die bestehende 14-Tage-Regression bleibt ohne horizontalen Scrollverlust grün.

## Vollregression

`npm run test:regressions` erkennt 638 Tests. **533 umgebungsunabhängig ausführbare Regressionen bestehen.** 105 Tests sind in diesem Transport-Arbeitsbaum nicht ausführbar, weil `npm ci --ignore-scripts` zuvor mit einem Container-Transporttimeout abbrach und dadurch die gepinnte lokale TypeScript-7-/`typescript-strada`-Testtoolchain nicht installiert ist. Die verbleibenden Fehlerbilder sind `MODULE_NOT_FOUND` für `typescript-strada` bzw. der globale TypeScript-5.8.3-Fallback, der die von der Test-API verwendete Option `--ignoreConfig` nicht kennt.

## TypeScript / Vite

Der vollständige `npm run verify:types`-/Vite-Produktionsbuild ist lokal aus demselben Grund nicht belastbar ausführbar: `node_modules` ist im Transport-ZIP nicht enthalten und die Installation wurde durch den Container-Transporttimeout unterbrochen. Der vorhandene globale `tsc` ist 5.8.3 und nicht die im Projekt gepinnte TypeScript-7-Toolchain. Die geänderten TS/TSX-Dateien wurden zusätzlich parser-/transpilebasiert ohne Syntaxdiagnosen geprüft.

## Worker / Aggregate

- `npm run maintain:aggregates`: grün
- `node --check worker/metar-proxy.js`: grün
- `node --check worker.js`: grün
- Worker-Fachlogik gegenüber v0.9.77.24 unverändert; nur Versionssynchronisierung auf v0.9.77.25.

## Ergebnis

Die neuen Fach-/UI-Verträge sind regressionsgeschützt. Die nicht ausführbaren Toolchain-Tests sind ein lokaler Abhängigkeits-/Containerblocker und kein festgestellter Fehler der v0.9.77.25-Änderungen; der normale Installer/CI-Pfad muss die gepinnte Toolchain installieren und dort den vollständigen TypeScript-/Vite-Gate ausführen.
