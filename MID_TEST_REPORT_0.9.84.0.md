# MID v0.9.84.0 – Freigabe-/Testbericht

## Ausgangsbasis

- Nutzer-Upload: MID v0.9.83.5
- Enthaltener Ausgangsbericht: TypeScript-Prüfung, Vite-Produktionsbuild und alle 721 automatisch erkannten Regressionen bestanden.

## v0.9.84.0 – erfolgreich geprüft

### RUC/RUC-EPS-Fachverträge
- `scripts/test-ruc-fusion-runtime-09691.mjs`
- `scripts/test-ruc-expanded-extreme-integration-09840.mjs`
- `scripts/test-extreme-threshold-ruc-horizon-09778.mjs`
- `scripts/test-ruc-native-cadence-nowcast-097311.mjs`
- `scripts/test-ruc-parameter-audit-097311.mjs`
- `scripts/test-ruc-dwd-pipeline-09690.mjs`
- `scripts/test-extreme-outlook-mitteleuropa-recovery-096697.mjs`
- `scripts/test-ruc-precip-amplitude-guard-09787.mjs`
- `scripts/test-ruc-mosmix-precip-consensus-09786.mjs`
- `python tools/ruc/test_ruc_pack.py`
- `python tools/ruc/test_prepare_ruc_pages.py`
- synthetischer Lauf von `rapid_extreme_eps_period_summary`: 20 Member in 0–6/6–12/12–14 h, I1–I4-Arrays und 6-h-Abdeckungsvertrag geprüft.

### Release-/Aggregatverträge
- `scripts/test-maintenance-modularization-09560.mjs`
- `scripts/test-aggregate-version-contract-09613.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-release-lineage.mjs`
- `scripts/test-baseline-079526-contract.mjs`
- `scripts/test-worker-auto-deploy-09693.mjs`
- `scripts/test-release-preflight-gate-097868.mjs`
- `worker.js` und `worker/metar-proxy.js` bytegleich
- Worker- und Service-Worker-JavaScript: `node --check` bestanden
- `tools/ruc/build_ruc_bundle.py`: `py_compile` bestanden
- geänderte TS/TSX-Dateien mit lokalem TypeScript-Parser (`--noCheck --noResolve`) syntaktisch geprüft.

## Laufzeit-/Sicherheitsfälle des neuen Tests

- starke RUC-EPS-Memberstützung erhöht eine kurzfristige Regenwahrscheinlichkeit;
- trockener RUC-EPS-Widerspruch senkt sie vorsichtig, löscht eine bereits ensemblegestützte I-Stufe aber nicht;
- RUC-Kälte-/Schneefallphasensignal + RUC-EPS-Niederschlag stärkt bestehende Schnee-Evidenz;
- RUC-Thermodynamik/Phase + RUC-EPS-Niederschlag stärkt bestehende Eis-Evidenz;
- RUC-EPS-Q75 dämpft isolierte zu nasse deterministische RUC-Ausreißer kontinuierlich, ohne harte Mengenobergrenze;
- der Pages-Free-Pfad veröffentlicht weiterhin kein natives RUC-EPS-Member-Cube.

## Infrastrukturhinweis

Ein frisches `npm ci --no-audit --no-fund` wurde versucht, aber die isolierte Containerumgebung brach den Registry-Transport mit `TransportTimeoutError` ab. Deshalb wurde der vollständige TypeScript-7-/Vite-8-Produktionsbuild nicht erneut lokal ausgeführt. Die unveränderte Ausgangsbasis v0.9.83.5 hatte diesen vollständigen Build und 721/721 Regressionen bereits bestanden. Der GitHub-Release-Installer bleibt unverändert fail-closed und führt die vollständige lockfile-genaue Prüfung vor Installation und Worker-Promotion erneut aus.

## Worker-/RUC-Aktivierung

Der semantische Vergleich gegen den hochgeladenen v0.9.83.5-Worker ergibt `changed=true`; v0.9.84.0 enthält also eine **fachliche Workeränderung** und nicht nur eine Versionskennung. Der vorhandene Release-Installer erkennt diese Änderung und führt bei aktivierter Worker-CI (`MID_WORKER_DEPLOY_ENABLED=true`) den bestehenden gestagten Cloudflare-Worker-Deploy mit 0-%-Healthcheck, RUC-Health-Gate und anschließender Promotion automatisch aus. Das `MID-worker.zip` bleibt als Notfall-/manuelles Deploy-Artefakt erhalten.

Die neue `rapid-extreme`-Schema-v4-Evidenz entsteht beim **nächsten vollständigen RUC-Preprocessing-Lauf nach erfolgreicher Stable-Aktivierung**. Der Worker bleibt zu v1–v3 rückwärtskompatibel; bis dahin läuft die bisherige deterministische RUC-Unterstützung weiter.
