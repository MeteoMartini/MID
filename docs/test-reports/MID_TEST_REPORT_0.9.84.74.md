# MID v0.9.84.74 – Testbericht

## Browser-Viewport-Simulation

Chromium-Simulation mit der aktuellen `src/styles.css` und repräsentativen überlaufkritischen MID-Strukturen:

| Viewport | Ergebnis |
|---|---|
| 320×568 | bestanden |
| 360×800 | bestanden |
| 390×844 | bestanden |
| 430×932 | bestanden |
| 844×390 | bestanden |
| 600×1024 | bestanden |
| 768×1024 | bestanden |
| 834×1194 | bestanden |
| 1024×1366 | bestanden |
| 1366×768 | bestanden |
| 1440×900 | bestanden |
| 1920×1080 | bestanden |

Geprüft wurden insbesondere dokumentweiter horizontaler Überlauf, Event-Workspace-Texte, Event-Sortierung, Eventtitel/-ort/-Wetterkurztext, Ensemble-Tooltip-Breite/-Innenüberlauf sowie der standardmäßig ausgeblendete 24-h-Werteoverlay.

## Erfolgreiche lokale Regressionen

- `test-apple-adaptive-design-contract-098469.mjs`
- `test-appwide-design-coverage-098470.mjs`
- `test-visualization-readability-098470.mjs`
- `test-visualization-readability-2-098471.mjs`
- `test-current-header-density-098472.mjs`
- `test-secondary-detail-popover-readability-098473.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-appwide-touch-responsiveness-09523.mjs`
- `test-mid-weather-profile-layout-09323.mjs`
- `test-cockpit-shortterm-interaction-09173.mjs`
- `test-event-center-sorting-editing-precip-wind-09440.mjs`
- `test-ensemble-mobile-temperature-tooltip-09412.mjs`
- `test-ensemble-mobile-temperature-tooltip-align-09413.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`
- `test-code-quality-0783.mjs`
- `test-ui-architecture-contract-09500.mjs`
- `test-weather-profile-cloud-layer-availability-097876.mjs`
- alle zehn im v0.9.84.73-GitHub-Lauf zuvor fehlgeschlagenen historischen Verträge

Worker, `public/service-worker.js` und `public/sw.js` bestehen `node --check`. `src/styles.css`, `src/styles-src/30-modern.css` und `src/v078.css` wurden mit `tinycss2` ohne Parsefehler geprüft.

## Lokale Buildgrenze

Ein vollständiger lokaler TypeScript-/Vite-Build wurde nicht als bestanden gewertet. Der Versuch einer frischen Abhängigkeitsinstallation konnte in der isolierten Umgebung nicht reproduzierbar abgeschlossen werden; das teilweise angelegte `node_modules` war deshalb nicht buildfähig. Der vollständige Regressionsrunner wurde zusätzlich angestoßen. Soweit Tests keine lokal fehlenden Toolchain-Pakete (`typescript-strada`/vollständige TypeScript-Typdefinitionen) benötigen, liefen die betroffenen Verträge durch; zwei dabei sichtbar gewordene echte Abweichungen (eigene Outside/Escape-Listener im 24-h-Overlay und ein veralteter Wolkenschicht-Testanker) wurden anschließend korrigiert und gezielt erneut erfolgreich geprüft. Der finale GitHub-Installer führt wie vorgesehen `npm ci`, TypeScript/Vite, die vollständigen Regressionen, iOS-Sync und die Stable-Promotion reproduzierbar aus.

Die vorangegangene v0.9.84.72-CI-Ursache (`TS6133` für `formatDayLengthChange` und `formatDuration`) ist bereits im v0.9.84.73-Fortsetzungsstand entfernt und bleibt durch `test-secondary-detail-popover-readability-098473.mjs` geschützt.
