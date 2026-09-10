# MID Testreport v0.9.84.25

## Gezielte Regressionen
Bestanden:
- `test-ios-resume-location-preservation-098425.mjs`
- `test-startup-splash-preload-097843.mjs`
- `test-location-favorite-selection-08154.mjs`
- `test-location-view-kv-write-savings-09649.mjs`
- `test-kv-archive-ui-efficiency-09650.mjs`
- `test-update-startup-recovery-098415.mjs`
- `test-runtime-lifecycle-offline-resume-09701.mjs`
- `test-startup-recovery-08281.mjs`
- Backup-/Gerätesync-/iCloud- und Favorite-Mirror-Regressionsschutz
- lokale Importziele, Versionierung, Baseline, Release-Lineage und Uploadbudget

Zusätzlich wurde `storageContracts.ts` + `storageSafety.ts` + `portableUserData.ts` unter lokal verfügbarem TypeScript 5.8.3 im Strict-Modus kompiliert. Ein isolierter Lauf bestätigte funktional, dass `mid:lastLocation`, `mid:lastLocation:updated-at` und `mid:lastTrackedLocation` nicht portabel sind, Favoriten/Wetterzwilling/Theme dagegen weiter portabel bleiben.

## Breiter Lauf / Buildgrenze
Der breite automatisch erkannte Regressionslauf wurde gestartet. Die bis zum Laufzeitlimit erreichten fachlich unabhängigen Tests liefen weiter; toolchainabhängige Tests meldeten erwartbar fehlendes `typescript-strada` beziehungsweise den mit lokalem TypeScript 5.8.3 unbekannten TS7-Schalter `--ignoreConfig`. Eine zunächst noch veraltete Standort-Strukturregression wurde dabei gefunden, auf den neuen zentralen Persistenzhelfer migriert und anschließend gezielt bestanden.

Ein frisches lokales `npm ci` konnte wegen des Pakettransport-Limits dieser Arbeitsumgebung nicht abgeschlossen werden. Daher wird kein vollständiger lokaler TypeScript-7-/Vite-Preflight als bestanden behauptet. Die kanonische Gesamtbestätigung erfolgt im GitHub-Installerlauf.

## Release-/Worker-Schutz
- Worker und Service Worker: Syntaxprüfung bestanden.
- `public/sw.js` und `public/service-worker.js`: bytegleich.
- Worker-Fachlogik gegenüber v0.9.84.24 nach Normalisierung von `WORKER_VERSION`: unverändert.
- Vor Verpackung: `mid-stable` weiterhin v0.9.84.24; damit ist v0.9.84.25 die direkte Fortsetzung der aktuellen stabilen Basis.
