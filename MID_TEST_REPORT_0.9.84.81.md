# MID v0.9.84.81 – Testbericht

## Bestandene fokussierte Regressionen

- `test-mobile-header-bottom-nav-098481.mjs`
- `test-header-version-readability-098478.mjs`
- `test-header-favorites-readability-098465.mjs`
- `test-optional-bottom-navigation-09790.mjs`
- `test-touch-search-responsiveness-082710.mjs`
- `test-current-header-density-098472.mjs`
- `test-appwide-touch-responsiveness-09523.mjs`
- `test-appwide-design-coverage-098470.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`

Zusätzlich syntaktisch geprüft: `worker.js`, `worker/metar-proxy.js`, `public/sw.js`, `public/service-worker.js`.

## Sicht-/Viewport-Prüfung

Die Korrektur ist über einen neuen statischen CSS-/DOM-Vertrag für die mobilen Breakpoints <=850, <=430 und <=360 px geschützt. Ein zusätzlicher Headless-Chromium-Screenshotlauf wurde gestartet, beendet sich in dieser isolierten Laufzeit jedoch nicht zuverlässig. Dieser Lauf wird daher **nicht** als bestandene visuelle Browserprüfung gewertet.

## Fachlicher Umfang

Keine Änderung an Vorhersage-, Beobachtungs-, Warn-, Radar-, Ensemble- oder Piktogrammlogik. Worker-Fachlogik unverändert.
