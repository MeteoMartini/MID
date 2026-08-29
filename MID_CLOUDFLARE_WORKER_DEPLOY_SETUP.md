# Einmalige Einrichtung – automatischer MID-Worker-Deploy

Der Codepfad ist vollständig vorbereitet, verändert aber ohne die folgenden einmaligen Freigaben kein Cloudflare-Konto.

1. In Cloudflare einen API-Token für CI/CD anlegen. Nach aktueller Cloudflare-Dokumentation ist dafür die Vorlage **Edit Cloudflare Workers** vorgesehen. Den Token auf das konkrete MID-Konto beschränken und nicht im Repository speichern.
2. GitHub Actions Secret `CLOUDFLARE_ACCOUNT_ID` setzen.
3. GitHub Actions Secret `CLOUDFLARE_API_TOKEN` setzen.
4. Repository-Variable `MID_CLOUDFLARE_WORKER_NAME` auf den vorhandenen produktiven MID-Worker setzen.
5. Repository-Variable `MID_WORKER_HEALTH_URL` auf dessen bereits verwendete produktive Basis-URL setzen. Ist `VITE_METAR_PROXY_URL` bereits dieselbe URL, kann MID diese automatisch verwenden.
6. Erst danach Repository-Variable `MID_WORKER_DEPLOY_ENABLED=true` setzen.
7. Die kanonische Workflowdatei `ci/github/workflows/install-mid.yml` einmal administrativ nach `.github/workflows/install-mid.yml` synchronisieren (`npm run sync:github-workflows`) und als getrennte `.github`-Änderung committen. Der Release-Installer selbst darf gemäß MID-Sicherheitsvertrag keine Workflowdateien selbst verändern.
8. Danach genügt der normale Upload von `MID-professional-replacement.zip`: bei fachlicher Worker-Änderung wird der Worker automatisch gestaged, getestet, promoviert oder zurückgerollt. Ein manueller Upload von `MID-worker.zip` ist nicht mehr der Normalweg.

## RUC-R2-Binding
Wenn der private RUC-Bucket bereits existiert, können zusätzlich `MID_RUC_R2_BUCKET=<bucket>` und `MID_RUC_BINDING_AUTO_APPROVED=true` gesetzt werden. Der Auto-Deploy liest zunächst alle vorhandenen Worker-Bindings und ergänzt `MID_DWD_RUC_DATA` nur zusammen mit deren verlustfreier Spiegelung. Unbekannte Bindings blockieren fail-closed. Auto-Provisioning ist deaktiviert; der Deploy legt keinen Bucket an.

## Freigabezustand
`MID_RUC_PIPELINE_ENABLED` bleibt vom Worker-Deploy getrennt. Solange die RUC-Pipeline nicht aktiviert ist, muss der Worker lediglich `?mode=health` mit der erwarteten Releaseversion bestehen. Nach aktivierter RUC-Pipeline wird zusätzlich `?mode=ruc-health` zwingend geprüft.
