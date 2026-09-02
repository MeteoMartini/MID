# MID v0.9.77.20 – Testnachweis

Stand: 02.09.2026

## Anlass

GitHub-Installerlauf #829 (Run `33621662217`) hat MID v0.9.77.19 nach erfolgreichem `npm ci`, Dependency-Audit, TypeScript-Prüfung und Vite-Produktionsbuild ausschließlich in zwei veralteten Regressionen angehalten. Die nächtliche Auto-Revision hatte unabhängig davon Issue #28 erzeugt.

## Korrekturen

- `scripts/test-ios-scroll-paint-current-extremes-083316.mjs` schützt jetzt den geglätteten, zeitgenauen Current-Temperaturanker statt des absichtlich entfernten Einzelstunden-Ersatzes.
- `scripts/test-radar-interval-seamless-blend-09120.mjs` akzeptiert die erweiterte zentrale Forecast-Endstufe mit `observedAt` und schützt Radar/Thunder/Current weiterhin gemeinsam.
- `browserslist` ist im Lockfile auf 4.28.7 angehoben; `baseline-browser-mapping` auf 2.11.1.
- Der kritische Open-Meteo-Min/Max-Healthcheck prüft jetzt die dokumentierten nativen ECMWF-IFS-3-h-Min/Max-Felder statt einer generischen Best-Match-/`hourly_6`-Annahme.

## In der Transportumgebung ausgeführt

Bestanden:

- `node scripts/build-maintenance-aggregates.mjs`
- `node --check worker/metar-proxy.js`
- `node --check worker.js`
- `node --check worker-src/05-knmi-eps-cache.js`
- `node scripts/test-openmeteo-update-audit-09540.mjs`
- `node scripts/test-nightly-audit-dependencies-09311.mjs`
- `node scripts/test-current-temperature-smooth-bridge-097719.mjs`
- `node scripts/test-maintenance-modularization-09560.mjs`
- `node scripts/test-versioning.mjs`
- `node scripts/test-aggregate-version-contract-09613.mjs`
- `node scripts/test-knmi-eps-productive-cache-097718.mjs`
- `node scripts/test-knmi-eps-worker-binding-097719.mjs`
- statische Vertragsprüfung der beiden #829-Testmigrationen und des Browserslist-Locks
- semantischer Worker-Vergleich v0.9.77.19 → v0.9.77.20: `changed=false` nach Versionsnormalisierung

## Toolchain-Grenze

Ein vollständiges lokales `npm ci` ist in der Transportumgebung nicht möglich, weil das npm-Paket `yauzl-2.10.0.tgz` nicht im lokalen Offline-Cache liegt. Deshalb können die TypeScript-Strada-gebundenen Einzeltests und das vollständige `npm run verify` hier nicht autoritativ wiederholt werden. Der nächste GitHub-Installerlauf bleibt das vollständige Gate für reproduzierbares `npm ci`, TypeScript 7, Vite, sämtliche Regressionen, iOS-Capacitor-Copy und Deployment.

Die in #829 bereits erfolgreichen TypeScript-/Vite-/Dependency-Schritte werden nicht durch Produktivcode-Rücknahmen umgangen; v0.9.77.20 migriert die beiden veralteten Testverträge und die unabhängigen Nightly-Befunde.
