# MID Test Report v0.9.77.17

Stand: 2026-09-02

## Gegenstand

Prüfung der präzisierten Tmin/Tmax-Farblogik: Klimaabweichung ausschließlich an der Zahlfarbe, keine klimatologisch getönte Hinterlegung oder Umrandung.

## Gezielte Regressionen

Bestanden:

- `scripts/test-tmin-tmax-number-tone-097717.mjs`
- `scripts/test-attachment-hazard-temperature-colors-097715.mjs`
- `scripts/test-parameter-color-contract-097712.mjs`
- `scripts/test-parameter-color-contract-097711.mjs`
- `scripts/test-appwide-parameter-colors-09779.mjs`
- `scripts/test-weather-profile-longrange-ui-097716.mjs`

Der v0.9.77.16-UI-Test war noch auf genau diese Paketversion festgenagelt. Er wurde auf einen dauerhaften „ab v0.9.77.16“-Vertrag migriert; die geschützte UI-Funktionalität selbst wurde nicht verändert.

## Vollständiges Regressionsgate

- erkannte Regressionstests: **630**
- in der verfügbaren Transportumgebung ausführbare, umgebungsunabhängige Tests: **525**
- bestanden: **525/525**
- umgebungsgebundene Tests: **105**

Die 105 nicht erfolgreich startbaren Prüfungen entsprechen vollständig der bekannten Toolchain-Grenze des Transport-Quellstands:

- **86** Tests benötigen das nicht mitgelieferte Paket `typescript-strada`,
- **17** Tests starten eine lokale TypeScript-CLI mit `--ignoreConfig`, die ohne die vorgesehene lokale TypeScript-7-Toolchain nicht verfügbar ist,
- **2** Tests benötigen das nicht mitgelieferte `esbuild`.

Nach Migration der einen veralteten Versionsassertion blieb **kein zusätzlicher fachlicher Regressionsfehler** durch v0.9.77.17 übrig.

## Syntax-, Aggregat- und Releaseprüfungen

Bestanden:

- `node --check worker/metar-proxy.js`
- `node --check worker.js`
- `node --check public/service-worker.js`
- `node --check public/sw.js`
- Wartungsaggregate erfolgreich neu erzeugt
- Versionsschema: v0.9.77.17
- Aggregate-Version: package, Baseline, iOS-Status, Worker-Fragment und Worker synchron
- Release-Lineage: `mid-stable` / kanonische Quellbasis geschützt
- Release-Sauberkeit und Browser-Uploadbudget-Verträge bestanden
- Installer-ZIP-Validierungsvertrag bestanden

## Worker-Differenz

Der Worker v0.9.77.17 wurde gegen den vorherigen v0.9.77.16-Worker geprüft. Nach Normalisierung ausschließlich der Versionszeichenfolge sind beide Dateien bytegleich.

**Ergebnis: keine meteorologische Worker-Fachlogik geändert. Ein manueller Worker-Upload ist für v0.9.77.17 nicht erforderlich.**

## Build-Grenze

Ein vollständiger lokaler `tsc`-/Vite-Produktionsbuild kann in dieser Transportumgebung nicht belastbar neu ausgeführt werden, weil die dafür erforderliche lokale npm-/TypeScript-Toolchain (`node_modules`) nicht Bestandteil des Professional-Transport-ZIPs ist. Diese Einschränkung ist von den oben bestandenen umgebungsunabhängigen Regressionen getrennt.
