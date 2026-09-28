# MID 0.9.77.3 – Prüfbericht

## Freigegebene PR-Wartung

- #25 `actions/upload-artifact` → 7.0.1 / `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`
- #24 CodeQL → 4.37.9 / `cdf488f595d80d6e07e03d4674febd5ab45fa938`, `init` und `analyze` gemeinsam
- #26 `actions/setup-python` → 7.0.0 / `5fda3b95a4ea91299a34e894583c3862153e4b97`
- React 19 / React DOM 19 / react-is 19 sowie `@vitejs/plugin-react` 6 bleiben zurückgestellt.

## Grün

- GitHub-PR-Wartungsvertrag 0.9.77.3
- explizite GitHub-Workflow-Synchronisierung
- Dependency-/Actions-Wartungsvertrag
- Release-Workflow-Pin-Grenze
- Stable-Hardening
- RUC-Workflow-Sync-Transition
- RUC-Scheduler-Catch-up
- RUC-DWD-Pipeline-Vertrag
- RUC-Pages-Storage-Runtimevertrag
- RUC-Schedule-Guard-Python-Unitregression
- YAML-Syntax der geänderten kanonischen Workflows
- Node-Syntax der geänderten Sync-/Regression-Skripte
- Worker-Syntax
- Versions-/Baseline-/iOS-Status-Synchronität 0.9.77.3

## Vollständige lokale Regression

612 automatisch erkannte Regressionstests; 506 bestanden. 106 Tests scheitern in dieser isolierten Laufzeit an der fehlenden npm-/Testtoolchain, insbesondere `typescript-strada`, wie bereits beim Vorgängerstand. Kein neuer Ausfall betrifft die geänderten PR-/Workflow-/RUC-Verträge.

## Build

Der Produktcode wurde durch diesen Wartungsschritt nicht verändert. Ein vollständiges lokales `npm run verify` ist ohne installierten npm-Abhängigkeitsbaum nicht möglich. Die ursprünglichen Dependabot-CI-Läufe belegen für #25 einen grünen MID-CI-Lauf; bei #24 war der einzige spezifische neue Fehler der gemischte CodeQL-Stand, und bei #26 lagen die roten Tests am aktiven/kanonischen RUC-Workflow-Drift. Beide Ursachen sind in diesem Professional-Stand korrigiert.

## GitHub-Aktivierung

Direkte Connector-Schreibzugriffe auf die Dependabot-Branches werden weiterhin mit HTTP 403 abgewiesen. Daher keine unvollständigen Blind-Merges. Nach Installation ist `npm run sync:github-workflows` ausdrücklich administrativ auszuführen; danach ist ein realer RUC-Preprocess-Lauf mit setup-python 7 zu kontrollieren.

## Worker

Keine semantische Worker-Änderung. Gegen v0.9.77.1 ist der Worker nach Normalisierung der Versionsnummer bytegleich. Worker-Upload nicht erforderlich.
