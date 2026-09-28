# MID 0.9.84.69 – Testbericht

## Verifizierte Basis
- GitHub `main`: v0.9.84.68, Commit `c53b8ccc1a424b91a53739be2d58d7fc8518013f`.
- GitHub `mid-stable`: derselbe Commit und damit kanonisch installierte v0.9.84.68.
- Neuer Wartungsstand: v0.9.84.69.

## Bestanden – gezielter Audit-/Regressionslauf
- `scripts/test-apple-adaptive-design-contract-098469.mjs`
- `scripts/test-ui-audit-standardization-098462.mjs`
- `scripts/test-travel-center-readability-098464.mjs`
- `scripts/test-header-favorites-readability-098465.mjs`
- `scripts/test-extreme-outlook-readability-098466.mjs`
- `scripts/test-shortterm-composite-readability-098467.mjs`
- `scripts/test-openmeteo-watch-ensemble-ui-098468.mjs`
- `scripts/test-responsiveness-071003.mjs`
- `scripts/test-mobile-interaction-reliability-083314.mjs`
- `scripts/test-appwide-touch-responsiveness-09523.mjs`
- `scripts/test-ios-safe-area-header-096671.mjs`
- `scripts/test-ios-resume-location-preservation-098425.mjs`
- `scripts/test-settings-standard-design-08160.mjs`
- `scripts/test-settings-menu.mjs`
- `scripts/test-modern-five-workspaces-09841.mjs`
- `scripts/test-modern-navigation-step2-09791.mjs`
- `scripts/test-optional-bottom-navigation-09790.mjs`
- `scripts/test-day-precipitation-color-contract-098435.mjs`
- `scripts/test-weather-pictogram-appwide-contract-098441.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-release-lineage.mjs`
- `scripts/test-baseline-079526-contract.mjs`

## Zusätzlich geprüft
- Kanonische Style-Aggregation aus `src/styles-src/*` wurde neu erzeugt.
- `worker.js`, `worker/metar-proxy.js`, `public/service-worker.js` und `public/sw.js` bestanden `node --check`.
- `src/styles-src/30-modern.css` und das erzeugte `src/styles.css` wurden mit `tinycss2` geparst: keine Top-Level-Syntaxfehler.
- Worker-Fachlogik ist gegenüber v0.9.84.68 bis auf `WORKER_VERSION` byte-inhaltlich unverändert.
- Das fertige Professional-ZIP wurde in ein frisches Verzeichnis entpackt; daraus bestanden der neue Apple-Vertrag, UI-Audit, Fünf-Bereiche-/Bottom-Navigation, Settings, iOS-Safe-Area, Versionierung und Release-Lineage.
- Beide ZIP-Archive bestanden den CRC-/Integritätstest.

## Lokale Toolchain
`node_modules` ist in der isolierten Arbeitsumgebung absichtlich nicht vorhanden. Deshalb wird hier kein zweiter vollständiger `npm ci`-/TypeScript-/Vite-Gesamtlauf dupliziert. Der GitHub-Release-Installer führt diese reproduzierbare Vollprüfung nach dem Upload durch. Der lokale Lauf konzentriert sich entsprechend der MID-Vorgabe auf die unmittelbar betroffenen Regressionsverträge.
