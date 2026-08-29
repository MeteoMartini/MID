# MID v0.9.69.3 – sicherer automatischer Cloudflare-Worker-Deploy

## Umsetzung
- Der bestehende ZIP-Releasepfad entscheidet nach vollständigem Build/Regressionstest, ob sich der Worker fachlich gegenüber `mid-stable` geändert hat. Reine `WORKER_VERSION`-Änderungen lösen keinen Cloudflare-Deploy aus.
- Bei fachlicher Änderung wird die aktuelle Remote-Konfiguration über die Cloudflare Workers API gelesen. Die temporäre Wrangler-Konfiguration übernimmt Compatibility-Vertrag sowie sicher abbildbare Resource-Bindings; Secret-/Plaintextwerte werden nicht persistiert oder geloggt. Unbekannte Bindings oder Split-Traffic blockieren fail-closed.
- Die neue Worker-Version wird mit Cloudflares Versionsmodell zunächst nur hochgeladen, anschließend mit 0 % Traffic neben der bisherigen 100-%-Version gestaged und über `Cloudflare-Workers-Version-Overrides` gegen den bestehenden produktiven Endpunkt geprüft.
- Erst nach erfolgreichem Versions-Smoke erfolgt die Promotion auf 100 % und ein zweiter produktiver Health-Check.
- Jeder Fehler nach dem Staging führt automatisch zurück auf die zuvor aktive Version. GitHub Pages und die Finalisierung von `mid-stable` hängen vom erfolgreichen Worker-Gate ab.
- `--strict`, `--keep-vars`, `--no-bundle` sowie deaktiviertes Wrangler-Auto-Provisioning verhindern stille Remote-Überschreibungen und unbeabsichtigte Ressourcenerzeugung.
- Cloudflare `wrangler-action` ist auf v4.0.0 Commit `ebbaa1584979971c8614a24965b4405ff95890e0` und Wrangler selbst auf `4.125.0` festgeschrieben.
- Das private RUC-R2-Binding kann nach ausdrücklicher Variable `MID_RUC_BINDING_AUTO_APPROVED=true` mit dem bestehenden Binding-Satz zusammen ergänzt werden; ohne Freigabe wird nichts angelegt oder gebunden.
- Bei aktiver `MID_RUC_PIPELINE_ENABLED=true` gehört `ruc-health` zwingend zum Worker-Deploy-Smoke.

## Dateien
- `tools/cloudflare/prepare_worker_deploy.mjs`
- `tools/cloudflare/worker_semantic_diff.mjs`
- `tools/cloudflare/parse_wrangler_output.mjs`
- `tools/cloudflare/check_worker_health.mjs`
- `ci/github/workflows/install-mid.yml` und gespiegelt `.github/workflows/install-mid.yml`
- `MID_WORKER_AUTO_DEPLOY_CONTRACT.md`
- `MID_CLOUDFLARE_WORKER_DEPLOY_SETUP.md`
- `scripts/test-worker-auto-deploy-09693.mjs`

## Aktivierungsgate
Der Release aktiviert den Worker-Deploy nicht eigenständig. Einmalig sind `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `MID_CLOUDFLARE_WORKER_NAME`, eine Worker-Health-URL sowie `MID_WORKER_DEPLOY_ENABLED=true` in GitHub einzurichten und der kanonische Installer administrativ nach `.github` zu synchronisieren. Danach ist bei künftigen fachlichen Worker-Änderungen kein manueller Worker-ZIP-Upload mehr erforderlich.

## Plattformvertrag
Es gibt keine iOS-spezifische Workerlinie. Browser/PWA und Capacitor-iOS verwenden unverändert denselben React/Vite-Fachkern und denselben Worker. Der native iOS-Meilenstein bleibt nach dieser gemeinsamen Infrastrukturstufe unverändert der nächste Fachschritt.
