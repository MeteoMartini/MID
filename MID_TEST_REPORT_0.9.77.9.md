# MID Test Report v0.9.77.9

## Neue/fokussierte Regressionen
- `scripts/test-trend14plus-09770.mjs`
- `scripts/test-parameter-colors-trend14plus-09771.mjs`
- `scripts/test-appwide-parameter-colors-09779.mjs`
- `scripts/test-extreme-outlook-spacing-09779.mjs`

## Benachbarte Fachprüfungen
- `scripts/test-true-multimodel-snowline-09350.mjs`
- `scripts/test-mountain-matrix-cloud-wind-precip-0882.mjs`

## TypeScript-Syntax
Die geänderten TS/TSX-Dateien werden zusätzlich über TypeScript `transpileModule(..., reportDiagnostics:true)` geprüft. Ein vollständiger lokaler Projekt-Typecheck benötigt die im isolierten Runtime-Baum derzeit unvollständig vorhandenen npm/@types-Pakete; GitHub-Installerläufe #814/#815 hatten den vollständigen npm-Baum und gingen bereits bis Build/Regression weiter.

## Fachliche Schutzpunkte
- Keine Böenreferenz im Subseasonal-Trend.
- Temperatur-Default + Persistenz der letzten Auswahl.
- EC46 51 Member / GEFS05 31 Member.
- ERA5-Land 1991–2020 für alle sechs dargestellten Trendparameter.
- getrennte P10–P90-/P25–P75-Darstellung.
- Tmin-Unsicherheitsband nutzt die zentrale blaue Tmin-Farbe.
- zentrale Parameterfarben in den Hauptdiagrammfamilien.
- zusätzlicher Abstand unter Extremwetter-Ausblick.

## Automatisch erkannte Gesamtsuite
- `npm run test:regressions`: **514 von 620** Tests laufen in der isolierten Laufzeit grün.
- Die übrigen **106** Tests brechen an der lokal unvollständigen Test-/npm-Toolchain ab (`typescript-strada`, fehlende Module bzw. der ältere globale TypeScript-Compiler ohne `--ignoreConfig`). Nach Aktualisierung der durch den neuen Farbvertrag bewusst veränderten Erwartungswerte verbleibt keine identifizierte fachliche Regression aus dieser Etappe.

## Produktionsbuild in dieser Laufzeit
- `npm run build` kann lokal nicht vollständig ausgeführt werden, weil zahlreiche `@types/*`-Pakete im bereitgestellten `node_modules`-Baum fehlen (u. a. React, Node, D3, GeoJSON). Dies ist ein Runtime-/Dependencyzustand und kein aus dem bearbeiteten TSX-Code abgeleiteter Compilerfehler.
- Die betroffenen TS/TSX-Dateien wurden ersatzweise mit dem vorhandenen TypeScript-Compiler über `transpileModule(..., reportDiagnostics:true)` parsergeprüft.

## Weitere grüne Schutzprüfungen
- Versionsschema
- Release-Lineage
- Aggregate-Versionen
- 145 relative TypeScript-Importziele
- Worker-Syntax
- Trend-14d+-Buildfixvertrag
