# MID v0.9.84.97 – Test- und Releasebericht

## GitHub-Ausgangslage

- `mid-stable`: v0.9.84.95, Commit `bc4c0100f6d7034ee2d1c46461d51dcc1865c139`.
- Installer #1050 / Run `34827211600`: **fehlgeschlagen**, ausschließlich im Schritt `Produktionsbuild und Regressionstests ausführen`.
- `npm ci`: erfolgreich.
- Produktionsabhängigkeitsaudit: erfolgreich, keine HIGH/CRITICAL-Befunde.
- TypeScript 7.0.2: erfolgreich.
- Vite 8.2.2 Produktionsbuild: erfolgreich.
- Regressionssuite: 789 Tests erkannt; 787 bestanden, 2 veraltete statische Quelltextverträge fehlgeschlagen.

## Behobene Regressionen

- `test-ensemble-wind-selection-cloud-reconciliation-08173.mjs`: prüft jetzt die aktuelle zweistufige Bewölkungsprovenienz (`baseCloudSource` plus ausdrücklich gekennzeichnetes Modell-Ceiling), statt die frühere Direktzuweisung zu verlangen.
- `test-view-simulation-bottom-isohypsen-smoothing-098494.mjs`: prüft jetzt den produktiven Isohypsenvertrag aus nativem DWD-WMS **oder** geglättetem Vektor-/Canvas-Fallback, statt nur den alten Vektorpfad zu akzeptieren.

Beide korrigierten Tests bestehen lokal im v0.9.84.97-Stand.

## Fokussierte Nachprüfung

Zusätzlich erfolgreich geprüft:

- `test-synoptic-startup-ceiling-098496.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-synoptic-contour-path-options-097884.mjs`
- `test-synoptic-regional-fronts-098488.mjs`
- `test-hyperlocal-fields.mjs`
- `test-german-weather-terminology-performance-098461.mjs`
- Versionsschema und Release-Lineage
- Syntax von Worker, Worker-Proxy und beiden Service-Worker-Dateien

## Responsive Nachprüfung

Da v0.9.84.97 keinen Produktions-UI-Code gegenüber v0.9.84.96 verändert, wurden die relevanten statischen Viewport-/Lesbarkeitsverträge erneut ausgeführt. Erfolgreich waren unter anderem Header-/Versionslesbarkeit, mobile Tooltip-Geometrie, Safe Areas, Karten-/Diagramm-Querformat, Overlays und sekundäre Popover. Damit entsteht durch den Hotfix keine neue iPhone-/iPad-/Desktop-Geometrie.

## Vollständiger Release-Gate

Der vollständige TypeScript-/Vite-Gate ist bereits im fehlgeschlagenen GitHub-Lauf #1050 für denselben Produktionscode erfolgreich gelaufen. v0.9.84.97 verändert ausschließlich die beiden veralteten Testverträge, Versionsmetadaten und Release-Dokumentation. Der nächste GitHub-Installer bleibt dennoch der definitive fail-closed Komplettnachweis für 789/789.

## Worker

Keine neue Worker-Fachlogik gegenüber v0.9.84.96; kein separater manueller Worker-Upload erforderlich.
