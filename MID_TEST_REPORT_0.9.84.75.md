# MID Testbericht v0.9.84.75

Stand: 12.09.2026

## Bereits bestanden

- `test-source-audit-official-sources-098475.mjs`
- `test-eea-station-resilience.mjs`
- `test-maintenance-modularization-09560.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-opera-raster.mjs` inklusive echter Worker-Metadaten-/HDF5-/Fallbackprüfung
- `test-radar.mjs`
- `test-current-dry-pop-travel-water-096511.mjs`
- `test-travel-water-noaa-oisst-09667.mjs`
- `test-water-tide-matrix-081815.mjs`
- Syntaxprüfung des erzeugten `worker/metar-proxy.js` und `worker.js`
- TypeScript-Parserprüfung der geänderten TS/TSX-Quellen mit dem im System verfügbaren Compiler

## Gesamtlauf ohne installierte npm-Projekttoolchain

Alle 767 automatisch erkannten Regressionen wurden zusätzlich parallel angestoßen. Nach der Rückwärtskompatibilitätskorrektur und der Aktualisierung des veralteten v0.9.77-Selected-Line-Testvertrags ergeben sich rechnerisch **661 direkt bestandene Tests**. **106 Tests sind durch die fehlende npm-Projekttoolchain blockiert**: 94 melden fehlende Pakete, 11 fallen auf den globalen TypeScript 5.8 zurück und kennen die projektseitige TS-7-Option `--ignoreConfig` nicht, und `test-travel-water-climatology-resilience-09665.mjs` kann den fehlenden lokalen Compiler deshalb nicht starten. Es verbleibt kein durch den Quellenmerge neu verursachter fachlicher Testfehler.

Der fehlgeschlagene `npm ci --ignore-scripts`-Versuch ist ein Laufzeit-/Netzwerkblocker: DNS `EAI_AGAIN` für `registry.npmjs.org` (u. a. Vite und `typescript-strada`). Daher werden Produktions-Vite-Build, gepinnter TypeScript-7-Vollcheck und Capacitor-Copy **nicht** als lokal bestanden behauptet. Die GitHub-Installationspipeline muss diese Schritte nach dem Upload wie vorgesehen mit Netzwerkzugriff ausführen.
