# MID Worker Auto-Deploy Contract

## Zweck
Der Cloudflare-Worker wird bei fachlichen Worker-Änderungen automatisch aus demselben bereits geprüften MID-Releasecommit veröffentlicht. Browser/PWA und Capacitor-iOS verwenden weiterhin denselben React/Vite-/Worker-Fachkern; es entsteht kein Plattformfork.

## Harte Freigabereihenfolge
1. Professional-ZIP sicher installieren.
2. `npm ci`, Dependency-Audit, TypeScript/Vite-Build, Worker-Syntax und vollständige MID-Regressionen bestehen.
3. Fachliche Worker-Änderung gegen `mid-stable` ermitteln. Eine reine Änderung von `WORKER_VERSION` löst keinen Deploy aus.
4. Aktuelle Cloudflare-Worker-Settings und das aktive Deployment lesen. Bestehende Variablen/Secrets werden nicht exportiert.
5. Nur sicher abbildbare Resource-Bindings in eine temporäre Wrangler-Konfiguration spiegeln. Unbekannte Binding-Typen, fehlende Compatibility-Date oder ein aktives Split-Deployment brechen fail-closed ab.
6. Neue Worker-Version mit exakt gepinntem Wrangler hochladen, noch ohne Produktivtraffic.
7. Vorherige Worker-Version bleibt bei 100 %, neue Version wird mit 0 % in ein Deployment aufgenommen.
8. `?mode=health` wird über `Cloudflare-Workers-Version-Overrides` gezielt gegen die neue 0-%-Version geprüft. Bei aktiver RUC-Pipeline muss zusätzlich `?mode=ruc-health` `configured:true`, `ready:true`, `fresh:true` melden.
9. Erst nach grünem Smoke wird die neue Version auf 100 % promoviert und nochmals ohne Override geprüft.
10. Bei Fehler nach dem 0-%-Staging wird automatisch die vorherige Version wieder zu 100 % aktiviert. Pages und `mid-stable` werden in diesem Lauf nicht weitergeführt.
11. Erst nach grünem Worker-Gate darf das GitHub-Pages-Deployment beginnen; erst danach wird `mid-stable` finalisiert.

## Konfigurationsschutz
- Wrangler v4 wird in CI auf eine konkrete Version festgeschrieben; die GitHub Action selbst ist auf einen vollständigen Commit-SHA gepinnt.
- `--strict`, `--keep-vars`, `--no-bundle`, `--experimental-provision=false` und `--experimental-auto-create=false` sind Pflicht.
- Die aktuelle Remote-`compatibility_date` und vorhandene `compatibility_flags` werden übernommen; kein Datum wird geraten.
- Secrets werden niemals in Repositorydateien, temporäre Config-Dateien oder Logs geschrieben.
- `plain_text`/JSON-Dashboardvariablen werden über `keep_vars` erhalten.
- Aktuell sicher unterstützte Resource-Bindings: KV, R2, D1, Service, Analytics Engine, Vectorize und Hyperdrive. Andere Binding-Typen blockieren den automatischen Deploy, bis ihre verlustfreie Abbildung implementiert und regressionsgeschützt ist.
- Das R2-Binding `MID_DWD_RUC_DATA` darf nur automatisch ergänzt werden, wenn `MID_RUC_R2_BUCKET` gesetzt und `MID_RUC_BINDING_AUTO_APPROVED=true` ausdrücklich freigegeben ist. Wrangler darf dabei keinen Bucket automatisch anlegen.

## Einmalige GitHub-/Cloudflare-Freigaben
Für fachlich geänderte Worker sind erforderlich:
- Secret `CLOUDFLARE_ACCOUNT_ID`
- Secret `CLOUDFLARE_API_TOKEN` (Cloudflare-Token für Worker-CI/CD, auf das MID-Konto begrenzt)
- Variable `MID_CLOUDFLARE_WORKER_NAME`
- Variable `MID_WORKER_HEALTH_URL` oder vorhandene `VITE_METAR_PROXY_URL`
- Variable `MID_WORKER_DEPLOY_ENABLED=true`

Optional für den bereits vorbereiteten privaten RUC-R2-Pfad:
- `MID_RUC_R2_BUCKET`
- `MID_RUC_BINDING_AUTO_APPROVED=true`, sobald der Bucket existiert und die Bindung automatisch ergänzt werden soll
- `MID_RUC_PIPELINE_ENABLED=true` erst nach erfolgreicher RUC-Erstinbetriebnahme; dann wird RUC-Health Teil des Worker-Deploy-Gates.

## Notfallartefakt
`MID-worker.zip` wird weiterhin bei jedem gekoppelten Release erzeugt. Es ist Backup/Notfall-/Audit-Artefakt, nicht mehr der reguläre Veröffentlichungsweg, sobald der Auto-Deploy einmalig aktiviert wurde.
