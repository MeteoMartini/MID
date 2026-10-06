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

## Cloudflare-Proxy für www.midwx.app ab v0.9.85.184

Die Workers Route greift nur, wenn der bestehende DNS-Verkehr für `www.midwx.app` die Cloudflare-Zone tatsächlich durchläuft. Deshalb prüft der Installer vor der Route den vorhandenen `www.midwx.app`-CNAME und aktiviert ausschließlich dessen `proxied=true`-Flag. Name, Typ und Zielwert müssen unverändert bleiben; neue DNS-Records, parallele A/AAAA-Records, TLS-/Zone-Settings-Änderungen oder Record-Ersetzungen sind unzulässig und blockieren fail-closed.

Der vorhandene CI-Token benötigt dafür zusätzlich **Zone:DNS Edit**, beschränkt auf die Zone `midwx.app`. Kein globaler DNS-Schreibzugriff und kein breiter Ersatzschlüssel sind erforderlich oder zulässig.

## Produktive Same-Origin-Route ab v0.9.85.183

Für das produktive Web ist die exakte Route `www.midwx.app/api/mid-worker* -> <MID_CLOUDFLARE_WORKER_NAME>` verbindlich. Der Installer ruft `tools/cloudflare/ensure_same_origin_route.mjs` auf und prüft anschließend `https://www.midwx.app/api/mid-worker?mode=health`. Bei fachlicher Worker-Änderung muss die erwartete Releaseversion gemeldet werden; bei unverändertem Worker genügt die bereits aktive plausible Worker-Version. Bei aktiver RUC-Pipeline wird zusätzlich der bestehende RUC-Health-Vertrag geprüft.

Der vorhandene CI-Token muss Workers-Routes-Schreibzugriff für die Zone `midwx.app` besitzen. `MID_CLOUDFLARE_ZONE_ID` kann als Repository-Variable gesetzt werden; fehlt sie, wird genau eine aktive Zone namens `midwx.app` ermittelt. Das Skript verändert **keine DNS-Einträge, TLS-Einstellungen oder andere Routes**. Eine kollidierende exakte Route auf einen anderen Worker stoppt fail-closed.

Voraussetzung ist, dass `www.midwx.app` bereits über die Cloudflare-Zone proxied/geroutet wird. Ist das nicht der Fall, schlägt der Same-Origin-Health-Check fehl und die Veröffentlichung stoppt. Es gibt keinen Fallback auf zusätzliche DNS-Schreibrechte, `workers.dev` im produktiven Browser oder abgeschaltete Zertifikatsprüfung.

