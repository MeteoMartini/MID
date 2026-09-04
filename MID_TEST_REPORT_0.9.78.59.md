# MID Test Report 0.9.78.59

Ausgangsbefund aus GitHub-Actions-Run #890:

- Release-ZIP sicher entpackt: erfolgreich;
- `npm ci`: erfolgreich;
- Produktionsabhängigkeitsaudit: erfolgreich;
- TypeScript 7.0.2: erfolgreich;
- Vite 6.4.3 Produktionsbuild: erfolgreich;
- 677/677 Regressionstests: erfolgreich;
- Capacitor-iOS-Übernahme: erfolgreich;
- Release-Commit: erfolgreich;
- Abbruch erst im Worker-Deploy-Schritt „Remote-Konfiguration und vorherige aktive Version fail-closed spiegeln“.

Fehlerursache laut #890: `prepare_worker_deploy.mjs` meldete die Remote-Konfiguration erfolgreich, schrieb seine Metadaten aber in ein privates Zufallsverzeichnis. Der aktive ältere GitHub-Workflow versuchte anschließend weiterhin `/tmp/mid-worker-deploy-meta.json` zu öffnen und erhielt `FileNotFoundError`.

Prüfungen nach dem Hotfix:

- bestehender `test-worker-auto-deploy-09693.mjs`: PASS; der kanonische sichere Zufallspfad bleibt unverändert;
- neuer `test-worker-auto-deploy-legacy-path-097859.mjs`: PASS; die zwei exakten historischen `/tmp`-Pfade werden funktional erzeugt und zugleich in `GITHUB_OUTPUT` gespiegelt;
- beliebige Legacy-Pfade werden vom Helper weiterhin fail-closed abgelehnt;
- `node --check tools/cloudflare/prepare_worker_deploy.mjs`: PASS.

Der Produktivbuild selbst wurde durch 0.9.78.59 nicht verändert; #890 belegt bereits dessen vollständigen erfolgreichen Build- und Regressionstand.
