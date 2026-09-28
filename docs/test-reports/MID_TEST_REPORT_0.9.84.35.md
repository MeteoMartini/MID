# MID v0.9.84.35 – Testbericht

## Gezielte Prüfungen – bestanden
- TypeScript-Parserdiagnostik für `src/App.tsx`, `src/precipitationPhaseColor.ts`, `src/v078.ts`, `src/eventWeatherEngine.ts`, `src/EventPlannerPanel.tsx` und `src/main.tsx`.
- `scripts/test-day-precipitation-color-contract-098435.mjs`.
- `scripts/test-parallel-merge-skybar-phase-097839.mjs`.
- `scripts/test-weather-profile-skybar-pills-097723.mjs`.
- `scripts/test-forecast-entry-consistency-098430.mjs`.
- `scripts/test-update-event-sources-ios27-098434.mjs`.
- `scripts/test-updater.mjs`.
- `scripts/test-update-startup-recovery-098415.mjs`.
- `scripts/test-event-period-pop-alignment-09491.mjs`.
- `scripts/test-event-pop-weather-twin-09490.mjs`.
- `scripts/test-event-recommendation-sanity-097883.mjs` mit lokalem TypeScript-API-Ersatz für das in CI installierte `typescript-strada`.
- `scripts/test-versioning.mjs`.
- `scripts/test-baseline-079526-contract.mjs`.
- `scripts/test-release-lineage.mjs`.
- `scripts/test-release-upload-budget-097410.mjs`.
- `node --check` für `worker.js`, `worker/metar-proxy.js` und `public/sw.js`; `public/sw.js` und `public/service-worker.js` sind bytegleich.

## Vollständiger Release-Preflight
Der offizielle Packer wurde angestoßen. Seine erste Stufe (`npm ci`) konnte in dieser Ausführungsumgebung nicht abgeschlossen werden, weil `registry.npmjs.org` per DNS nicht auflösbar war (`EAI_AGAIN`). `npm ping` bestätigt dieselbe externe Umgebungsgrenze. Deshalb wird **kein vollständiger lokaler npm-/Vite-/736+-Regressionslauf als bestanden behauptet**.

Der letzte veröffentlichte Basisstand v0.9.84.33 hat den vollständigen GitHub-Installer/TypeScript-7/Vite-Pfad in Release #988 erfolgreich durchlaufen. Die seitdem geänderten v0.9.84.34/.35-Dateien sind über die oben genannten gezielten Verträge und Parserprüfungen abgesichert; der GitHub-ZIP-Installer bleibt der vollständige End-to-End-Gatekeeper.
