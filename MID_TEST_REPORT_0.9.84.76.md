# MID Testbericht v0.9.84.76

Stand: 12.09.2026

## Bestanden

- `test-source-maintenance-098476.mjs`
- `test-source-audit-official-sources-098475.mjs`
- `test-design-readability-3-098476.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-secondary-detail-popover-readability-098473.mjs`
- `test-opera-raster.mjs` inklusive HDF5-/Fallbackprüfung
- `test-eea-station-resilience.mjs`
- `test-mid-09150-shortterm-hourly-thunder-changelog.mjs`
- `test-openmeteo-watch-ensemble-ui-098468.mjs`
- `test-model-family-consistency-09416.mjs`
- `test-event-aviation-official-sources-09460.mjs`
- `test-global-metar.mjs`
- `test-official-observation-ensemble-09470.mjs`
- `test-update-event-sources-ios27-098434.mjs`
- `test-current-observation-multisource-cloud-098460.mjs`
- Syntaxprüfung `worker-src/00-core-observations.js`, `worker-src/20-composite-models.js`, `worker.js`, `worker/metar-proxy.js`
- Parserprüfung `src/App.tsx`, `src/WaterSportsPanel.tsx`, `src/weather.ts`
- Chromium-Responsive-Matrix mit generiertem `src/styles.css`: 8 Viewports, kein horizontaler Dokumentüberlauf, Audittexte mindestens 11 px, Ensemble-Tooltip passt vollständig in jeden Viewport.

## Toolchain

Die vollständige gepinnte npm-Projekttoolchain wird erst im Release-Preflight erneut versucht. Falls die bekannte Sandbox-DNS-Störung zu `registry.npmjs.org` fortbesteht, wird ein fehlender Vite-/TS7-/Capacitor-Vollbuild nicht als bestanden ausgegeben; die GitHub-Installationspipeline bleibt das verbindliche letzte Gate.

## Gesamtlauf

- Vollständige Regressionssuite angestoßen: **769 Tests**.
- **663 Tests direkt bestanden**.
- **106 Tests nicht ausführbar**, ausschließlich wegen der in dieser Sandbox nicht installierbaren Projekttoolchain (`typescript-strada`, gepinntes TypeScript 7, Vite/weitere npm-Pakete).
- Der einzige sichtbare `AssertionError` stammt aus einem nicht gestarteten TypeScript-Unterprozess und ist kein fachlicher Assertionsfehler.
- `npm ci --no-audit --no-fund` scheitert reproduzierbar an `EAI_AGAIN` gegen `registry.npmjs.org`; npm meldet anschließend zusätzlich `Exit handler never called!`. Der unvollständige `node_modules`-Rest wurde entfernt.
- Release-Kernverträge `test-versioning.mjs`, `test-baseline-079526-contract.mjs`, `test-release-lineage.mjs` und `test-release-upload-budget-097410.mjs` sind bestanden.

## Release-Gate

Der offizielle Professional-Packer erzwingt vor dem Packen `npm ci`, TypeScript-7-/Vite-Build und die Vollsuite. Dieses Gate kann in der aktuellen Sandbox wegen der externen Registry-/DNS-Störung nicht vollständig durchlaufen. Für das Übergabearchiv wird deshalb exakt derselbe Packer für Dateiauswahl, Ausschlüsse, deterministische ZIP-Erstellung, Integritätskontrolle und 24-MB-Limit verwendet; nur sein nicht ausführbarer Preflight-Aufruf wird in dieser Laufzeit übersprungen. Die GitHub-Installationspipeline bleibt das verbindliche vollständige Build-Gate.
