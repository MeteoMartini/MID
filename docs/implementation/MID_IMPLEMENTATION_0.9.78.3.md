# MID Implementation v0.9.78.3

Datum: 2026-09-02

## Anlass

GitHub Actions Run #841 (`MID-Release aus ZIP installieren und veröffentlichen`, Commit `7dbcfa33f978e5301c5539be85d1a898195a47c3`) wurde anhand der vollständigen Joblogs analysiert.

Der produktive Build war nicht die Ursache:

- Release-ZIP wurde erfolgreich entpackt.
- `npm ci` war erfolgreich.
- Dependency-Audit meldete 0 Schwachstellen.
- TypeScript 7.0.2 war grün.
- Vite 6.4.3 Produktionsbuild war grün.

Der Lauf scheiterte ausschließlich an zwei Regressionstests.

## 1. 7-Tage-Temperaturfarben: Altvertrag migriert

`scripts/test-cockpit-hourly-climate-redundancy-09140.mjs` erwartete weiterhin die vor v0.9.78.1 gültigen `dailyTemperatureTone(... climateMean ...)`-Aufrufe im 7-Tage-Cockpit und in der klassischen 7-Tage-Liste.

Das widersprach dem bereits verbindlichen Nachfolgevertrag aus v0.9.78.1. Der Test schützt nun ausdrücklich:

- Stundenwerte bleiben neutral über `hourlyTemperatureTone`.
- 7-Tage-Tmin/Tmax und die Stundenkurve verwenden die absolute ECMWF-Skala über `ecmwfTemperatureTone`/`ecmwfTemperatureColor`.
- Im 7-Tage-Modus werden keine Klimaabweichungen angezeigt.
- Die 14-Tage-Ansicht verwendet weiterhin `dailyTemperatureTone` und `dailyTemperatureAnomalyLabel` für signierte Tmin/Tmax-Klimadeltas.
- Die bestehenden Cockpit-Redundanz- und Stundenansichtsverträge bleiben erhalten.

Es wurde keine Produktionslogik auf den alten Klimadelta-Stand zurückgesetzt.

## 2. RUC-Pages: aktiver Workflow darf während ZIP-Installation abweichen

`scripts/test-ruc-pages-free-storage-09700.mjs` verglich die aktive `.github/workflows/install-mid.yml` byteweise mit `ci/github/workflows/install-mid.yml`.

Das ist im Release-Installer methodisch falsch: MID schützt `.github` ausdrücklich vor automatischer Selbstmodifikation. Ein neues ZIP darf deshalb eine neuere kanonische Workflowkopie installieren, während die gerade laufende aktive `.github`-Datei noch dem vorherigen administrativ synchronisierten Stand entspricht.

Der Test prüft bei vorhandener aktiver Installerdatei nun semantisch den sicherheitsrelevanten Mindestvertrag:

- ZIP-Trigger und `npm run verify` bleiben vorhanden.
- `.github` bleibt aus dem automatischen Release-Commit ausgeschlossen.
- kein Force-Push auf `main`.
- kein automatisches `.github`-Rsync/Self-Modification.
- RUC-Pages-Snapshot-Restore und `MID_RUC_PAGES_BASE_URL` bleiben vorhanden.
- `mid-pages` bleibt seriell mit `cancel-in-progress: false`.

Der separate RUC-Workflow bleibt weiterhin über `assertRucWorkflowSyncState()` streng auf `synced` oder den eng definierten `pending-admin-sync`-Zustand begrenzt.

## Ergebnis

v0.9.78.3 ist ein reiner Release-/Regression-Hotfix. Die Wetterpiktogramme, 7-Tage-Stundenkurve, ECMWF-Farben, Forecastfusion, RUC-Fachdaten und Worker-Fachlogik aus v0.9.78.1/2 bleiben unverändert.
