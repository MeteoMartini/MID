# MID v0.9.84.89 · Testbericht

## Ausgangsbasis

Arbeitsbasis ist der zuletzt installierte MID-Stand v0.9.84.87 plus die bereits ausgelieferte, noch nicht installierte v0.9.84.88-Fachänderung. Vor der Paketierung steht GitHub `mid-stable` weiterhin auf v0.9.84.87. Der Upload von v0.9.84.88 startete Installer #1042 und scheiterte im Produktionsbuild.

Die #1042-Logs wurden vor Erstellung des neuen ZIP vollständig geprüft: sichere ZIP-Übernahme, Node 22, `npm ci` und Dependency-Audit waren erfolgreich. Das TypeScript-Gate stoppte bei `src/RadarPanel.tsx` mit TS6133, weil `latestLightningTime` deklariert, aber nicht mehr verwendet wurde. v0.9.84.89 entfernt genau dieses tote Binding. Die Blitz-/Radar-Fachlogik bleibt unverändert.

## Bestandene fokussierte Regressionen

- `test-optional-bottom-navigation-09790.mjs`
- `test-settings-navigation-polish-097917.mjs`
- `test-modern-map-focus-09792.mjs`
- `test-modern-five-workspaces-09841.mjs`
- `test-modern-plan-more-hierarchy-09795.mjs`
- `test-modern-navigation-step2-09791.mjs`
- `test-modern-forecast-workspace-09794.mjs`
- `test-modern-focus-detail-hierarchy-09796.mjs`
- `test-mobile-header-bottom-nav-098481.mjs`
- `test-viewport-textflow-098485.mjs`
- `test-ios-floating-bottom-bar-098489.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`

## Viewport-/Label-Simulation

Die tatsächlichen CSS-Breitenregeln wurden für übliche Gerätebreiten numerisch gegen die fünf sichtbaren Labels geprüft. Mit konservativ um 15 % verbreiterter Textmessung bleibt selbst das längste Label **Kurzfrist** innerhalb seiner Zelle.

| Viewport | Bar-/Rail-Modus | nutzbare Tabbreite | konservative Max.-Textbreite / Tab | Ergebnis |
|---|---|---:|---:|---|
| 320×568 | Floating Bar | 58,4 px | 0,89× | passt |
| 375×812 | Floating Bar | 66,2 px | 0,85× | passt |
| 390×844 | Floating Bar | 69,2 px | 0,81× | passt |
| 393×852 | Floating Bar | 69,8 px | 0,81× | passt |
| 402×874 | Floating Bar | 71,6 px | 0,79× | passt |
| 430×932 | Floating Bar | 77,2 px | 0,80× | passt |
| 568×320 | Landscape Floating | 105,2 px | 0,54× | passt |
| 844×390 | Landscape Floating | 119,6 px | 0,47× | passt |
| 768×1024 | Floating Bar | 119,2 px | 0,52× | passt |
| 820×1180 | Floating Bar | 119,2 px | 0,52× | passt |
| 1024×1366 | kompakte Seitenleiste | Labels bewusst ausgeblendet | – | passt |
| 1366×768 / 1920×1080 | Desktop-Seitenleiste | 168 px | – | passt |

Die CSS-Regel erzwingt zusätzlich `white-space: nowrap`, `word-break: keep-all`, `overflow-wrap: normal` und `hyphens: none`, sodass der bisher sichtbare Umbruch `Kurzfri / st` strukturell nicht mehr auftreten kann.

## Installer-Blocker #1042

- Fehler in v0.9.84.88 reproduziert/aus den GitHub-Logs isoliert: `latestLightningTime` war unbenutzt (TS6133).
- Das Binding ist in `src/RadarPanel.tsx` entfernt.
- Der fokussierte Quellcheck bestätigt, dass `latestLightningTime` im Produktionsmodul nicht mehr vorkommt.
- Worker, Root-Worker und beide Service Worker bestehen `node --check`.
- Der nächste GitHub-Installer ist weiterhin das definitive vollständige TypeScript/Vite/Regression-Gate.

## Renderer-/Build-Hinweis

Ein echter Chromium-Headless-Screenshotlauf wurde versucht, der Chromium-Prozess beendet sich in dieser isolierten Containerumgebung bereits bei `about:blank` wegen der bekannten D-Bus/Renderer-Prozessproblematik nicht zuverlässig. Dieser Lauf wird deshalb ausdrücklich **nicht** als bestandene visuelle Prüfung ausgegeben. Die Layoutprüfung basiert auf den Produktions-CSS-Regeln, dem DOM-/CSS-Regressionsvertrag und der oben dokumentierten Geometriesimulation.

Ein vollständiges lokales `npm ci` wurde ebenfalls versucht, aber der Pakettransport lief in den Container-Timeout. Deshalb wird kein vollständiger TypeScript/Vite-Gesamtlauf behauptet. Der nächste GitHub-Installer bleibt das definitive Voll-Gate.
