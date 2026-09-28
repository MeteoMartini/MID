# MID Test Report v0.9.77.14

## Ergebnis

- automatisch erkannte Regressionen: 627
- umgebungsunabhängig ausführbar: 522
- bestanden: 522/522
- toolchaingebunden/nicht ausführbar im Transportstand: 105
- fachliche zusätzliche Fehlschläge: 0

## Gezielt geprüft

- `test-regional-model-domain-fusion-097714.mjs`: grün
- `test-openmeteo-rapid-source-contract-097713.mjs`: grün
- `test-model-source-capability-contract-095336.mjs`: grün
- `test-model-skill-twin-consistency-09600.mjs`: grün
- `test-model-family-completeness-09550.mjs`: grün
- `test-official-observation-ensemble-09470.mjs`: grün
- `test-ruc-rapid-update-policy-09400.mjs`: grün
- `test-maintenance-modularization-09560.mjs`: grün
- `test-openmeteo-update-audit-09540.mjs`: grün
- `node --check worker/metar-proxy.js`: grün
- `node --check worker.js`: grün

## Bekannte Umgebungsgrenze

`node_modules` ist im Professional-Transport-ZIP absichtlich ausgeschlossen. Deshalb können 105 Testskripte, die `typescript-strada`, TypeScript 7, `esbuild` oder das lokale `tsc` importieren/aufrufen, in dieser Umgebung nicht gestartet werden. Die Zahl entspricht der bereits bekannten Toolchain-Gruppe; der neue v0.9.77.14-Test gehört nicht dazu und besteht.
