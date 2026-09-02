# MID Test Report v0.9.77.15

Stand: 2026-09-02

## Gegenstand

Regression und Release-Prüfung der Umsetzung aus dem Webarchive-Anhang:

- konkrete Gefahrenbezeichnung im Popup der modellierten Gefahrenflächen,
- neutrale Darstellung aktueller und stündlicher Einzeltemperaturen,
- klimatologisch signierte Blau-/Rot-Sättigungsskalen für Tmin/Tmax in der 7-/14-Tage-Darstellung,
- konsistente Darstellung in Hell/Dunkel sowie responsiven Ansichten,
- unveränderte meteorologische Worker-Fachlogik.

## Gezielte Regressionen

Bestanden:

- `scripts/test-attachment-hazard-temperature-colors-097715.mjs`
- `scripts/test-parameter-color-contract-097711.mjs`
- `scripts/test-parameter-color-contract-097712.mjs`
- `scripts/test-hour-temperature-ensemble-desktop-tooltip-09152.mjs`
- `scripts/test-dach-extreme-outlook-09660.mjs`
- `scripts/test-shortterm-selected-line-values-097710.mjs`

## Vollständiges Regressionsgate

- erkannte Regressionstests: **628**
- in der verfügbaren Transportumgebung ausführbare, umgebungsunabhängige Tests: **523**
- bestanden: **523/523**
- umgebungsgebundene Tests: **105**

Die 105 nicht erfolgreich startbaren Prüfungen entsprechen der bereits bekannten lokalen Toolchain-Grenze des Transport-Quellstands: nicht mitgelieferte `node_modules` bzw. fehlende Testwerkzeuge wie `typescript-strada` und `esbuild` sowie TypeScript-7-CLI-Prüfungen, deren lokaler Runner die Option `--ignoreConfig` nicht unterstützt. Es trat kein zusätzlicher fachlicher Regressionsfehler durch v0.9.77.15 auf.

## Syntax- und Aggregatprüfungen

Bestanden:

- `node --check worker/metar-proxy.js`
- `node --check worker.js`
- `node --check public/service-worker.js`
- `node --check public/sw.js`
- Wartungsaggregate erfolgreich neu erzeugt
- `worker.js` ist bytegleich mit dem kanonischen `worker/metar-proxy.js`

## Worker-Differenz

Der Worker v0.9.77.15 wurde gegen den ausgelieferten Worker v0.9.77.14 geprüft. Nach Ersetzung ausschließlich der Versionszeichenfolge `0.9.77.14` → `0.9.77.15` sind beide Dateien bytegleich.

**Ergebnis: keine meteorologische Worker-Fachlogik geändert. Ein manueller Worker-Upload ist für v0.9.77.15 nicht erforderlich.**

## Build-Grenze

Ein vollständiger lokaler `tsc`-/Vite-Produktionsbuild kann in dieser Transportumgebung nicht belastbar neu ausgeführt werden, weil die dafür erforderliche lokale npm-/TypeScript-Toolchain (`node_modules`) nicht Bestandteil des Professional-Transport-ZIPs ist. Diese Einschränkung ist von den oben bestandenen umgebungsunabhängigen Regressionen getrennt.
