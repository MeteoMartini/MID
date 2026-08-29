# MID v0.9.69.6 – Wrangler-Action-Output-Hotfix

## Anlass
Der echte Auto-Deploy-Versuch mit v0.9.69.5 bestand ZIP-Prüfung, Produktionsbuild, vollständige Regressionen, Release-Commit, Remote-Konfigurationsspiegel und erstmals auch den tatsächlichen `wrangler versions upload`. Cloudflare erzeugte die neue Worker-Version erfolgreich, aber der nachfolgende Parser erwartete fälschlich eine lokale Datei `/tmp/mid-wrangler-upload.jsonl`. `cloudflare/wrangler-action` stellt die Wrangler-Standardausgabe stattdessen als Action-Output `command-output` bereit.

## Korrektur
- `install-mid.yml` übergibt `steps.worker_upload.outputs.command-output` explizit als `WRANGLER_COMMAND_OUTPUT` an den fail-closed Parser.
- Die nicht unterstützte Annahme `WRANGLER_OUTPUT_FILE` wurde entfernt.
- `parse_wrangler_output.mjs` unterstützt weiterhin JSONL-Dateien für lokale/kompatible Tests, wertet im Releasepfad aber die echte Wrangler-Ausgabe aus.
- Er akzeptiert nur genau eine eindeutige Worker-Version-ID und stoppt bei null oder mehreren IDs.
- 0-%-Staging, Versionsoverride-Smoke, 100-%-Promotion, Produktions-Smoke und Rollback bleiben unverändert.

## Regression
`scripts/test-worker-auto-deploy-09693.mjs` enthält nun die reale Wrangler-4.125.0-Ausgabeform `Worker Version ID: <uuid>` und verlangt die explizite `command-output`-Verdrahtung im Workflow.

## Sicherheit des v0.9.69.5-Versuchs
Die neue Worker-Version wurde zwar erfolgreich als nicht produktive Version hochgeladen, aber vor Staging/Traffic-Umschaltung gestoppt. Der bisherige produktive Worker blieb bei 100 %, Pages und `mid-stable` wurden nicht freigegeben.
