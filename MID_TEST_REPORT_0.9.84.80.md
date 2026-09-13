# MID Test Report 0.9.84.80

## Neue Pflichtprüfung

`scripts/test-overlay-viewport-continuation-098480.mjs`

Der Test schützt:

- Portalnutzung für Trend-14d+-Punktdetails
- Portalnutzung für Komposit-Ebenenauswahl und Komposit-Dateninformation
- Entfernung der alten diagramminternen Tooltip-Positionierung
- `visualViewport`-basierte zentrale Portalpositionierung
- Außenklick- und Escape-Dismiss
- Scroll-/Maximalhöhenverträge der neuen Popover
- dynamische `dvh`-Dialoghöhen
- korrekte Safe-Area-Behandlung bei Vollbild- und Kompaktdialogen
- mathematische Positionierung über zwölf Referenzviewports
- bitgenaues Stylesheet-Aggregat aus den fünf kanonischen CSS-Modulen

## Bestandene fachliche Trend-/Langfristprüfungen

- `test-trend14plus-09770.mjs`
- `test-trend14plus-buildfix-09775.mjs`
- `test-trend14plus-climatology-097711.mjs`
- `test-parameter-colors-trend14plus-09771.mjs`
- `test-long-range-grid-ensemble-colors-09332.mjs`
- `test-long-range-model-sources-09774.mjs`
- `test-long-range-release-resilience-09341.mjs`
- `test-long-range-subsections-relative-sunshine-097825.mjs`
- `test-subseasonal-unused-parameter-09778.mjs`

Der ältere Trend-14d+-Test wurde an die neue Portalarchitektur angepasst: Er prüft weiterhin den Tooltipinhalt, erwartet aber nicht länger die bewusst entfernte lokale DOM-Positionierung.

## Weitere bereits bestandene fokussierte UI-Prüfungen dieses Blocks

- `test-popover-regression.mjs`
- `test-ui-standardization-095338.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-appwide-readability-continuation-098479.mjs`
- `test-visualization-readability-098470.mjs`
- `test-visualization-readability-2-098471.mjs`

Die beiden geänderten TSX-Dateien `RadarPanel.tsx` und `SubseasonalTrendPanel.tsx` wurden zusätzlich mit der global verfügbaren TypeScript-Transpilation syntaktisch geprüft.

## Nicht lokal als Vollbuild behauptet

Das Professional-Transportarchiv enthält absichtlich keine `node_modules`. Ein vollständiger React-/Capacitor-TypeScript-Build kann deshalb in diesem lokalen Transportstand nicht belastbar als bestanden ausgegeben werden. Der vollständige Installations-/Build-/Regression-Gate bleibt GitHub Actions vorbehalten.

## Finaler Release-Gate vor Verpackung

Nach der Versionssynchronisation auf 0.9.84.80 wurden zusätzlich erfolgreich ausgeführt:

- `test-versioning.mjs`
- `test-baseline-079526-contract.mjs`
- `test-release-lineage.mjs`
- `node --check worker.js`
- `node --check worker/metar-proxy.js`
- TypeScript-Transpilation von `RadarPanel.tsx` und `SubseasonalTrendPanel.tsx`

Unmittelbar vor dem Verpacken wurde GitHub erneut abgeglichen: `mid-stable` steht auf dem erfolgreich installierten v0.9.84.79-Stand. Der jüngste Installerlauf für diesen Upload (`MID-Release aus ZIP installieren und veröffentlichen`, Run 1035) wurde erfolgreich abgeschlossen. Damit ist 0.9.84.79 die bestätigte Ausgangsbasis dieses 0.9.84.80-Fortsetzungsstands.
