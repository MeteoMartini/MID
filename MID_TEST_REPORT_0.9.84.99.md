# MID v0.9.84.99 – Testbericht

## Referenzstand

- `mid-stable`: v0.9.84.98
- Commit: `e90ac3e0210ddda50249b92787a1ab050bc2e1a2`
- Installer #1053: erfolgreich
- DWD-RUC-Preprocessing #544: erfolgreich

## Erfolgreiche fokussierte Regressionen

Die folgenden Verträge wurden nach der Korrektur lokal erfolgreich ausgeführt:

- `test-composite-synoptic-completeness-098456.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-synoptic-startup-ceiling-098496.mjs`
- `test-composite-native-history-navigation-097875.mjs`
- `test-view-simulation-bottom-isohypsen-smoothing-098494.mjs`
- `test-composite-visibility-quality-08251.mjs`
- `test-synoptic-contour-path-options-097884.mjs`
- `test-composite-wms-lightning-k3d-wind-08250.mjs`
- `test-bottom-bar-current-persistence-isohypses-098492.mjs`
- `test-weather-pictogram-ui-lock-09781.mjs`
- `test-synoptic-phase-pictogram-cleanup-098499.mjs`

Zusätzlich wurden die geänderten TypeScript/TSX-Dateien mit dem lokal verfügbaren TypeScript-Parser auf Syntaxfehler geprüft.

## Vollständiger Build / Regressionen

Ein lokaler Komplettlauf aller Regressionen wurde gestartet und lief über zahlreiche Tests erfolgreich, erreichte aber vor dem Container-Zeitlimit nicht das Ende. Ein bestehender Bundle-Hygiene-Test konnte lokal außerdem nicht laufen, weil `node_modules/.bin/esbuild` in dieser isolierten Arbeitsumgebung nicht installiert ist.

Ein vollständiger `npm run build` ist lokal aus demselben Umgebungsgrund nicht belastbar möglich: React/Lucide/Capacitor/Astronomy-Engine und weitere Projektabhängigkeiten fehlen. Diese fehlenden Pakete sind **kein** durch v0.9.84.99 verursachter Quellcodefehler. Der GitHub-Installer bleibt deshalb das definitive Node-22/TypeScript/Vite/Gesamtregressions-Gate.

## Release-Checks und frisch entpacktes ZIP

Vor Ausgabe des ZIP wurden zusätzlich erfolgreich geprüft:
- Versionskonsistenz / Release-Lineage für v0.9.84.99
- Browser-Uploadbudget (< 24.000.000 Byte)
- Syntax von Worker und Service Worker
- ZIP-Integrität (`unzip -t`)
- Ausschluss von `node_modules`, `.github`, `dist`, Artefakten und lokalen Parser-/Testresten gemäß Professional-Packer
- erneute fokussierte Synoptik-, Piktogramm-, Viewport-, 7-/14-Tage-, Versionierungs- und Lineage-Regressionen aus einem frisch entpackten Release-ZIP

Der vollständige GitHub-Installer bleibt wegen der lokal nicht installierten npm-Abhängigkeiten das definitive Gesamt-Gate.
