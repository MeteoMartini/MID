# MID v0.9.84.91 · Testbericht

## Fokussiert geprüft

Bestanden wurden insbesondere:

- `test-ios-floating-bottom-bar-098489.mjs`
- `test-optional-bottom-navigation-09790.mjs`
- `test-modern-five-workspaces-09841.mjs`
- `test-modern-today-overview-09793.mjs`
- `test-modern-focus-detail-hierarchy-09796.mjs`
- `test-modern-map-focus-09792.mjs`
- `test-modern-plan-more-hierarchy-09795.mjs`
- `test-mobile-dayrange-contour-overlays-071083.mjs`
- `test-navigation-composite-ruc-098491.mjs`
- `test-ruc-native-phase-radar-098491.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-radar-model-phase-request-budget-093913.mjs`
- `test-radar-nowcast-null-buildfix-091111.mjs`
- `test-appwide-readability-continuation-098479.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`
- `test-release-upload-budget-097410.mjs`

Die zwei älteren, nach Entfernung der Beta-Current-Ansicht zunächst noch auf alte JSX-Strings festgelegten Verträge (`test-best-match-sunshine-suffix-strategy-08350.mjs`, `test-forecast-precipitation-support-083317.mjs`) wurden auf den direkten kanonischen `case 'current' → MemoCurrent`-Pfad aktualisiert. Ihr statischer Vorlauf erreicht nun den externen Testcompiler; lokal fehlt dem Transportbaum lediglich `typescript-strada`.

## Syntax / Aggregate

- `src/App.tsx`, `src/RadarPanel.tsx`, `src/RadarModelPrecipTypeOverlay.tsx`, `src/WeatherMapsData.ts`: TypeScript-Transpile-Syntaxcheck bestanden.
- `worker.js`, `worker/metar-proxy.js`, `public/service-worker.js`, `public/sw.js`: `node --check` bestanden.
- `build-maintenance-aggregates.mjs` wurde nach allen Änderungen ausgeführt; Styles-/Weather-/Worker-Aggregate sind synchron.
- Das obsolete `modern-today-*`-CSS wurde zusammen mit dem verworfenen Beta-DOM entfernt.

## Viewport-/Bottom-Bar-Prüfung

Die fünf Primärziele wurden für 320×568, 375×812, 390×844, 393×852, 402×874, 430×932, 568×320, 844×390, 768×1024, 820×1180 sowie Desktop/Rail-Breiten geprüft. Unter 350 px reduziert das Produktions-CSS die Labelschrift auf 9 px; `white-space:nowrap`, `word-break:keep-all` und `hyphens:none` verhindern Wortbruch. Ab 851 px wechselt MID in den Rail-Modus.

Der minimierte Zustand bleibt durch den sichtbaren Griff bedienbar; die vollständige Leiste wird bei Aufwärtsscrollen, Tab-/Griffinteraktion, geöffnetem Mehr-Menü und nahe Seitenanfang wieder eingeblendet.

## Vollsuite-Hinweis

Der vollständige lokale Regression-Runner wurde gestartet, kann im transportbereinigten Arbeitsbaum ohne `node_modules` jedoch die `typescript-strada`-basierten Harnesses nicht ausführen. Diese fehlende lokale Dependency wird nicht als fachlicher Fehler bewertet und der Volltest wird ausdrücklich **nicht als bestanden behauptet**. Die dabei zusätzlich sichtbaren, tatsächlich veralteten Current-/Navigation-Stringtests wurden korrigiert und fokussiert erneut geprüft.

Der nächste GitHub-Installer bleibt das definitive vollständige Node-22-/TypeScript-/Vite-/783+-Regression-Gate.
