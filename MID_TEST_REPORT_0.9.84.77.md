# MID Testbericht v0.9.84.77

Stand: 12.09.2026

## Fehlerursache aus GitHub Actions #1032

- `npm ci`: erfolgreich, 202 Pakete installiert.
- Dependency-Audit: erfolgreich.
- TypeScript: Abbruch mit `src/RadarPanel.tsx(74,178): TS2322`, weil `mrms` nicht zu `CompositeSource` gehörte.

## Korrekturprüfungen

- `test-mrms-display-source-contract-098477.mjs`: bestanden.
- Minimales TypeScript-Narrowing des korrigierten `sourceForLocation()` mit strengem Typcheck: bestanden.
- `test-source-audit-official-sources-098475.mjs`: bestanden.
- `test-source-maintenance-098476.mjs`: bestanden.
- `test-opera-raster.mjs`: bestanden, inklusive HDF5-/Fallbackprüfung.
- Radar-Regressionen ohne npm-Spezialparser: bestanden.
- Tests mit `typescript-strada` bleiben in dieser Sandbox ohne vollständige npm-Projektinstallation nicht ausführbar; GitHub Installer bleibt das verbindliche vollständige TypeScript-7-/Vite-Gate.
- `worker.js` und `worker/metar-proxy.js`: Syntaxprüfung bestanden.

## Erwartung für den nächsten Installerlauf

Der konkrete `TS2322`-Pfad ist beseitigt. Ein neuer Installerlauf muss anschließend den vollständigen TypeScript-7-/Vite-/Regressions- und Capacitor-iOS-Pfad durchlaufen; erst dessen Erfolg bestätigt das vollständige Release-Gate.
