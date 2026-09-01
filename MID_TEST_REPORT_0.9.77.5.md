# MID Test Report v0.9.77.5

## Ursache Run #811

GitHub Actions Run #811 (`33492749752`) erreichte erfolgreich:
- sicheres Entpacken der Professional-ZIP,
- vollständigen Release-Spiegel,
- Node.js 22.16.0,
- `npm ci` mit 244 Paketen,
- Dependency-Audit ohne Vulnerabilities.

Der Lauf brach ausschließlich in `verify:types` ab. Die gemeldeten Fehler betrafen `WindUnit`, einen ungültigen Lucide-Export, zu enge Icon-Typisierung und eine Nullability-Stelle im neuen `SubseasonalTrendPanel`.

## Lokale Hotfix-Prüfungen

- `scripts/test-trend14plus-buildfix-09775.mjs` ✅
- `scripts/test-trend14plus-09770.mjs` ✅
- `scripts/test-parameter-colors-trend14plus-09771.mjs` ✅
- isolierter TypeScript-Integrationscheck des Subseasonal-Panels mit kanonischem `WindUnit='kn'` ✅
- `scripts/test-release-upload-budget-097410.mjs` ✅

## Einschränkung der lokalen Laufzeit

Der vollständige `npm run verify` kann in dieser Chat-Laufzeit ohne installierten Projekt-`node_modules`-Baum nicht reproduziert werden. Der konkrete TypeScript-Fehler aus Run #811 wurde jedoch vollständig gegen die gemeldeten Compilerstellen korrigiert und durch einen fokussierten Regressionstest geschützt.

## Automatische Regression in der isolierten Chat-Laufzeit

`node scripts/run-regressions.mjs`:
- **507 / 613** Regressionstests bestanden.
- **106** Tests brechen an der lokal fehlenden npm-Testtoolchain, insbesondere `typescript-strada`, ab.
- Der neue Run-#811-Hotfixtest sowie Trend-/Farb-/Release-/Versionierungs-/Lineage-Tests sind grün.

## Worker-Semantik

`worker.js` enthält keine fachliche Änderung dieses Hotfixes. Der semantische Vergleich ist unverändert; ein manueller Worker-Upload ist nicht erforderlich.
