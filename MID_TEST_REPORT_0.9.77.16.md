# MID Test Report v0.9.77.16

Stand: 2026-09-02

## Gegenstand

Regression und Release-Prüfung der UI-Korrekturen aus dem iPhone-Screenshot:

- kontrastfeste ausgewählte Wert-Pills im 24-h-Wetterprofil für Hell/Dunkel,
- deutlich kleinere Tmin/Tmax- und Fokusmarker,
- kein redundanter Modellstand mehr im Header des Witterungstrends,
- tatsächlicher Modelllauf weiterhin in den Modell-/Familien-Pills,
- saisonale Temperatur-/Niederschlags- und Schneelinien-Diagramme ohne horizontales Scrollen,
- unveränderte meteorologische Worker-Fachlogik.

## Gezielte Regressionen

Bestanden:

- `scripts/test-weather-profile-longrange-ui-097716.mjs`
- `scripts/test-shortterm-selected-line-values-097710.mjs`
- `scripts/test-weather-profile-mobile-compact-097612.mjs`
- `scripts/test-weather-profile-daily-extremes-consistency-09402.mjs`
- `scripts/test-weather-profile-modern-dayview-097610.mjs`
- `scripts/test-trend14plus-09770.mjs`
- `scripts/test-trend14plus-buildfix-09775.mjs`
- `scripts/test-mid-ui-longrange-09416.mjs`
- `scripts/test-long-range-release-resilience-09341.mjs`
- `scripts/test-attachment-hazard-temperature-colors-097715.mjs`
- `scripts/test-parameter-color-contract-097712.mjs`

Zwei ältere Quelltextregressionen verlangten noch die frühere `color-mix(...)`-Pillenfüllung bzw. die doppelte Modellstand-Zeile. Beide wurden auf den neuen verbindlichen UI-Vertrag migriert; die neue Produktlogik wurde nicht zurückgedreht.

## Vollständiges Regressionsgate

- erkannte Regressionstests: **629**
- in der verfügbaren Transportumgebung ausführbare, umgebungsunabhängige Tests: **524**
- bestanden: **524/524**
- umgebungsgebundene Tests: **105**

Die 105 nicht erfolgreich startbaren Prüfungen entsprechen vollständig der bekannten Toolchain-Grenze des Transport-Quellstands:

- **86** Tests benötigen das nicht mitgelieferte Paket `typescript-strada`,
- **17** Tests starten eine lokale TypeScript-CLI mit `--ignoreConfig`, die ohne die vorgesehene lokale TypeScript-7-Toolchain nicht verfügbar ist,
- **2** Tests benötigen das nicht mitgelieferte `esbuild`.

Nach Migration der zwei veralteten UI-Assertions blieb **kein zusätzlicher fachlicher Regressionsfehler** durch v0.9.77.16 übrig.

## Syntax-, Aggregat- und Releaseprüfungen

Bestanden:

- `node --check worker/metar-proxy.js`
- `node --check worker.js`
- `node --check public/service-worker.js`
- `node --check public/sw.js`
- Wartungsaggregate erfolgreich neu erzeugt
- `worker.js` ist bytegleich mit dem kanonischen `worker/metar-proxy.js`
- Versionsschema: v0.9.77.16
- Aggregate-Version: package, Baseline, iOS-Status, Worker-Fragment und Worker synchron
- Release-Lineage: `mid-stable` / kanonische Quellbasis geschützt
- Release-Sauberkeit und Browser-Uploadbudget-Verträge bestanden
- Installer-ZIP-Validierungsvertrag bestanden

## Worker-Differenz

Der Worker v0.9.77.16 wurde gegen den vor der Änderung gesicherten Worker v0.9.77.15 geprüft. Nach Ersetzung ausschließlich der Versionszeichenfolge `0.9.77.16` → `0.9.77.15` sind beide Dateien bytegleich.

**Ergebnis: keine meteorologische Worker-Fachlogik geändert. Ein manueller Worker-Upload ist für v0.9.77.16 nicht erforderlich.**

## Build-Grenze

Ein vollständiger lokaler `tsc`-/Vite-Produktionsbuild kann in dieser Transportumgebung nicht belastbar neu ausgeführt werden, weil die dafür erforderliche lokale npm-/TypeScript-Toolchain (`node_modules`) nicht Bestandteil des Professional-Transport-ZIPs ist. Diese Einschränkung ist von den oben bestandenen umgebungsunabhängigen Regressionen getrennt.
