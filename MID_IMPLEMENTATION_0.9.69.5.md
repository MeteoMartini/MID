# MID v0.9.69.5 – Worker-Auto-Deploy Entry-Point-Hotfix

## Anlass
Der zweite echte Auto-Deploy-Versuch mit v0.9.69.4 bestand erneut ZIP-Prüfung, vollständige Produktions-/Regressionsprüfung, Release-Commit, Secret-/Variablen-Gate und Remote-Konfigurationsspiegel. Der Placement-Hotfix griff. Wrangler stoppte danach weiterhin vor jeder Traffic-Umschaltung, weil die temporäre Wrangler-Konfiguration unter `/tmp` lag und den relativen Einstiegspfad `worker/metar-proxy.js` deshalb relativ zu `/tmp` auflöste.

## Korrektur
- `prepare_worker_deploy.mjs` schreibt den Worker-Einstiegspfad nun als absoluten Pfad auf den im GitHub-Runner ausgecheckten Release-Arbeitsbaum.
- Die temporäre Konfiguration darf weiterhin unter `/tmp` liegen; ihre Position beeinflusst den Entry Point nicht mehr.
- Remote-Bindings, Secretschutz, Placement-Spiegel, 0-%-Staging, Versionsoverride-Smoke, 100-%-Promotion und Rollback bleiben unverändert.

## Regression
`scripts/test-worker-auto-deploy-09693.mjs` verlangt nun zusätzlich einen absoluten `config.main` und prüft, dass dieser exakt auf `worker/metar-proxy.js` im aktuellen Release-Arbeitsbaum zeigt.

## Sicherheit der fehlgeschlagenen Vorläufe
Sowohl v0.9.69.3 als auch v0.9.69.4 scheiterten vor dem Staging. Es wurde keine neue Worker-Version produktiv geschaltet; Pages und `mid-stable` blieben durch das Worker-Gate blockiert.
