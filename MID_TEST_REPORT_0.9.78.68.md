# MID Test Report 0.9.78.68

## Anlass

GitHub Actions Run #901 (`a7a50c9`) hat den sauberen `npm ci`-Schritt, den Dependency-Audit, TypeScript 7 und den vollständigen Vite-Produktionsbuild erfolgreich abgeschlossen. Erst in der vollständigen Regressionssuite schlugen 7 von 685 Tests fehl. Alle sieben Fehler waren veraltete Testverträge nach der neuen 14-Tage-Konfidenzarchitektur beziehungsweise dem bereits umgesetzten iOS-Favoriten-Touchvertrag; es wurde kein neuer Produktions-Buildfehler gemeldet.

## Korrigierte Regressionen

- `scripts/test-audit-science-097864.mjs`
  - aktueller fachlicher Hinweis: `Der Index ist keine Trefferwahrscheinlichkeit`.
- `scripts/test-compass-scenario-wording-08304.mjs`
  - aktuelles Kompass-Wording `Gut vorhersagbare Zeiträume` / `Konfidenz nimmt ab`.
- `scripts/test-forecast-compass-secure-range-082713.mjs`
  - aktueller gemeinsame Konfidenz- und Datenqualitätsvertrag statt historischer Konsistenzformulierungen.
- `scripts/test-professional-ui-wording-08337.mjs`
  - professionelles aktuelles Kompass-Wording.
- `scripts/test-tooltip-search-favorite-08331.mjs`
  - aktueller iOS-Favoritenvertrag: Drag erst ab 8 px tatsächlicher Bewegung.
- `scripts/test-typescript-7-compatibility-09760.mjs` / `scripts/test-ensemble-multiparameter-097865.mjs`
  - kein Root-TypeScript-Strada-Fallback mehr; Transpilation ausschließlich über `typescript-strada`.
- `scripts/test-warning-text-warm-phase-model-coverage-09645.mjs`
  - parameterbezogene Sollabdeckung mit dem aktuellen Begriff `erwartete Modellgruppen`.

## Neuer verbindlicher Release-Preflight

- `scripts/release-preflight.mjs`
- `scripts/test-release-preflight-gate-097868.mjs`

Der kanonische Professional-Packer darf künftig erst nach folgendem Gate schreiben:

1. sauberes `npm ci` aus dem Lockfile,
2. vollständiger TypeScript-7-/Vite-Produktionsbuild,
3. Syntaxcheck beider Worker-Einstiege,
4. sämtliche automatisch erkannten `test-*.mjs`-Regressionen,
5. Versionsvertrag,
6. Baseline-Vertrag,
7. Release-Lineage,
8. Uploadbudget-Vertrag.

Danach prüft der Packer zusätzlich die ZIP-Integrität und zentrale Pflichtdateien. Fehlt eine Voraussetzung oder schlägt ein Test fehl, wird kein Professional-ZIP erzeugt.

## Lokale Prüfung dieses Hotfixes

Alle sieben in Run #901 fehlgeschlagenen Verträge wurden nach der Korrektur erneut geprüft und bestanden. Die drei transpilerabhängigen fachlichen Regressionen wurden in der lokalen Umgebung mit der vorhandenen TypeScript-Transpiler-API ausgeführt; zusätzlich wurde die TypeScript-7-/Strada-Lockfile- und Direktimporthygiene separat geprüft.

Zusätzlich bestanden:

- `test-release-preflight-gate-097868.mjs`
- `test-release-upload-budget-097410.mjs`
- `test-code-revision-automation-09190.mjs`
- `test-maintenance-cleanup-097828.mjs`
- `test-versioning.mjs`
- `test-baseline-079526-contract.mjs`
- `test-release-lineage.mjs`
- Syntaxprüfung `worker.js`
- Syntaxprüfung `worker/metar-proxy.js`
- Python-Syntaxprüfung des Professional-Packers.

Ein breiter lokaler Lauf bestätigte zahlreiche weitere Regressionen; verbleibende lokale Abbrüche waren ausschließlich auf nicht installierte externe Buildpakete wie `esbuild` beziehungsweise die lokal vorhandene ältere TypeScript-CLI zurückzuführen. Ein erneutes sauberes lokales `npm ci` war in diesem Container nicht möglich, weil `registry.npmjs.org` nicht aufgelöst werden konnte. Dies ist ausdrücklich kein als bestanden deklarierter lokaler Vollbuild.

Für die Produktionsquellen ist relevant: Gegenüber dem von #901 erfolgreich mit TypeScript 7 und Vite gebauten Stand wurden keine meteorologischen/UI-Produktionsquellen geändert; der Hotfix verändert Regressionen, Release-Gate, Dokumentation und die normale Versionssynchronisierung. Die Worker-Dateien unterscheiden sich fachlich nur durch die Releaseversion.

## Artefaktprüfung

Das finale Professional-ZIP wurde separat in ein leeres Verzeichnis entpackt. Dort bestanden erneut:

- Version 0.9.78.68 und Baseline 0.9.78.68,
- Release-Lineage und Uploadbudget,
- alle sieben in #901 fehlgeschlagenen Verträge,
- der neue Release-Preflight-Gate-Vertrag,
- Worker-Syntax beider Einstiege,
- TypeScript-7-/Strada-Lockfile- und Direktimporthygiene.

Beide ZIPs bestanden die ZIP-Integritätsprüfung. Der Worker im separaten Worker-ZIP ist bytegleich zu `worker.js` im Professional-ZIP.
