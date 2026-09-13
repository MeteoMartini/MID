# MID Testbericht v0.9.84.78

Stand: 13.09.2026

## Ergebnis der neuen Pflichtverträge

- `scripts/test-header-version-readability-098478.mjs`: **bestanden**. Der kanonische Header-Vertrag schützt die vollständige Versionsanzeige, verhindert Ellipse/Abschneiden und erzwingt unter 430 px getrennte Zeilen für Marke/Version, Aktionen und Suche.
- `scripts/test-bafu-hydrology-098478.mjs`: **bestanden**. Statische Vertragsprüfung und funktionaler GraphQL-Mocktest für aktive Schweizer Station, Wasserstand `W`, Abfluss `Q`, Wassertemperatur `WT`, native Einheiten und Freshness-Regel.
- `worker.js` und `worker/metar-proxy.js`: **Syntaxprüfung bestanden**.

## Angrenzende Regressionen

Bestanden wurden außerdem die für diesen Auditblock relevanten Verträge:

- `test-current-header-density-098472.mjs`
- `test-secondary-detail-popover-readability-098473.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-source-audit-official-sources-098475.mjs`
- `test-source-maintenance-098476.mjs`
- `test-design-readability-3-098476.mjs`
- `test-mrms-display-source-contract-098477.mjs`
- `test-opera-raster.mjs`
- `test-water-matrix-season-08120.mjs`
- `test-water-tide-matrix-081815.mjs`
- `test-versioning.mjs`
- `test-baseline-079526-contract.mjs`
- `test-release-lineage.mjs`
- `test-release-upload-budget-097410.mjs`

Die geänderten Aggregate `src/App.tsx`, `src/WaterSportsPanel.tsx`, `src/weather.ts` und `src/sourceQuality.ts` wurden zusätzlich mit der in der Laufzeit verfügbaren TypeScript-Transpile-API geparst; dabei traten keine Syntaxdiagnosen auf. Dies ersetzt ausdrücklich nicht den gepinnten Projekt-TypeScript-7-Compiler.

## In dieser Laufzeit nicht ausführbare Gates

Ein einziger reproduzierbarer `npm ci`-Versuch wurde durchgeführt. Die Sandbox konnte mehrere Pakettarballs von `registry.npmjs.org` nicht auflösen (`EAI_AGAIN`, unter anderem Vite/TypeScript). Der angelegte Teilzustand von `node_modules` wurde danach entfernt; es wurde kein weiterer Installationsversuch gestartet.

Daher konnten der vollständige TypeScript-7-Typcheck, Vite-Produktionsbuild und Capacitor-iOS-Copy lokal nicht belastbar ausgeführt werden. Tests, die `typescript-strada` bzw. die vollständige Projekttoolchain benötigen, wurden deshalb nicht als bestanden gewertet. Das GitHub-Installer-Workflow bleibt für diese drei Gates die verbindliche Prüfung.

Eine Browser-Simulation mit Chromium und dem aggregierten MID-CSS wurde ebenfalls versucht. Die Headless-Laufzeit blockierte jedoch in der Sandbox an ihrer D-Bus/Zygote-Umgebung. Deshalb wird für v0.9.84.78 **kein** erfolgreicher Chromium-/Safari-Echtrender behauptet; die mobile Headerkorrektur ist durch den strukturellen CSS-/DOM-Vertrag geschützt.

## Releasebewertung

Die lokal ausführbaren neuen und angrenzenden Auditverträge sind grün. Das Professional-Transport-ZIP darf deshalb erzeugt werden; der vollständige GitHub-Installerlauf bleibt das verbindliche abschließende TypeScript-7-/Vite-/Regression-/Capacitor-Gate nach dem Upload.
