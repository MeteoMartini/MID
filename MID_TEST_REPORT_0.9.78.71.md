# MID Test Report 0.9.78.71

## Neue Regression
- `scripts/test-confidence-display-boundary-info-097871.mjs`
  - prüft Signal/Ampel/Text-Modi, Settings-Wiring, 14d- und Ensemble-Wiring
  - prüft (i)-Popover für Parameter/weitere Zeiträume
  - prüft 15-Tage-Randabruf im App- und Workerpfad
  - prüft kompakte CSS-Verträge

## Relevante bestehende Regressionen – lokal bestanden
- `test-confidence-display-boundary-info-097871.mjs`
- `test-confidence-event-symbols-097870.mjs`
- `test-ensemble-confidence-calibration-097867.mjs`
- `test-ensemble-data-quality-separation-097869.mjs`
- `test-forecast-confidence-layout-090505.mjs`
- `test-fourteen-day-bestmatch-fallback-097829.mjs`
- `test-fourteen-day-pill-favorite-tap-097866.mjs`
- `test-skybar-sun-cloud-exclusive-097863.mjs`
- `test-pressure-axis-nice-spacing-097861.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`
- `test-baseline-079526-contract.mjs`
- `test-release-preflight-gate-097868.mjs`
- `test-codeql-alert-remediation-097834.mjs`
- `test-maintenance-cleanup-097828.mjs`

## Syntax / Struktur
- `node --check worker.js`: bestanden
- `node --check worker/metar-proxy.js`: bestanden
- JSON-Parsing von `package.json`, `package-lock.json`, `MID_BASELINE.json` und `public/version.json`: bestanden
- Die geänderten TS/TSX-Quellen wurden zusätzlich mit der verfügbaren globalen TypeScript-Parser-API ohne Modulauflösung geparst; keine Syntaxdiagnosen.

## Vollbuild / vollständige Regressionssuite
Der kanonische Release-Preflight verlangt zuerst ein frisches `npm ci`, danach TypeScript-7-/Vite-Build und die vollständige Regression. `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline` wurde für 0.9.78.71 erneut gestartet, konnte in dieser Containerumgebung jedoch wegen des externen Transport-/Registry-Zugriffs nicht erfolgreich abgeschlossen werden. Deshalb wird für 0.9.78.71 ausdrücklich **kein lokaler vollständiger TS7-/Vite-Build und keine vollständige 688+-Regression als bestanden behauptet**.

`test-ensemble-multiparameter-097865.mjs` konnte lokal ebenfalls nicht ausgeführt werden, solange `typescript-strada` aus der unvollständigen Dependency-Installation fehlt. Das ist als Umgebungsblocker dokumentiert, nicht als bestandener Test.

## Release-Entscheidung
Die direkt betroffenen Confidence-, 14d-Randtag-, Event-Intervall-, Symbol-, Versions-, Baseline-, Lineage-, Sicherheits- und Worker-Verträge sind gezielt grün. Vor Transport wird das ZIP nach Erstellung nochmals separat entpackt, seine Integrität geprüft und dieselben statischen/gezielten Verträge aus dem tatsächlich ausgelieferten Archiv erneut ausgeführt.
