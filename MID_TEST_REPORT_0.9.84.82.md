# MID v0.9.84.82 – Testbericht

## Bestandene fokussierte Regressionen

- `test-map-chart-responsive-continuation-098482.mjs`
- `test-overlay-viewport-continuation-098480.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-visualization-readability-098470.mjs`
- `test-visualization-readability-2-098471.mjs`
- `test-radar-weather-maps-interaction-09220.mjs`
- `test-radar-weathermaps-followups-09230.mjs`
- `test-weather-maps-module-09210.mjs`
- `test-appwide-design-coverage-098470.mjs`
- `test-appwide-touch-responsiveness-09523.mjs`

## TypeScript-Syntax

`MeteogramPanel.tsx` wurde mit dem global verfügbaren TypeScript-Parser geprüft. Es wurden keine Syntax-/Parserfehler gefunden. Die erwarteten Modulauflösungsfehler entstehen, weil das Professional-ZIP keine installierten Abhängigkeiten enthält. Zwei bereits vorher vorhandene `key`-Typmeldungen sind unter `--noResolve` ebenfalls nicht aussagekräftig, da React-Typen fehlen.

## Nicht als bestanden ausgewiesen

- `test-synoptic-map-direction-09001.mjs`: benötigt `typescript-strada`.
- `test-extreme-outlook-labels-layout-persistence-09668.mjs`: benötigt `typescript-strada`.
- kein vollständiger `npm`-/Vite-/Capacitor-Build in der isolierten Transportumgebung.

## Fachlicher Umfang

Reine UI-/Interaktionskorrektur. Worker-Fachlogik unverändert.

## GitHub-Installer #1036

Der vorgeschriebene Workflow-Abgleich vor der ZIP-Erstellung zeigte einen fehlgeschlagenen Installerlauf für v0.9.84.81. Entpacken, reproduzierbare npm-Installation und Dependency-Audit waren erfolgreich; der Lauf stoppte im TypeScript-Check mit `TS6133` wegen eines ungenutzten `clamp`-Helfers in `SubseasonalTrendPanel.tsx`. Dieser Befund ist in v0.9.84.82 behoben und durch `test-overlay-viewport-continuation-098480.mjs` abgesichert.

Ein lokales `npm ci` wurde zusätzlich versucht, konnte in der Containerumgebung wegen eines Transport-Timeouts nicht abgeschlossen werden. Es wird deshalb kein vollständiger lokaler Build als bestanden ausgewiesen.
