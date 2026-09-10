# MID v0.9.84.21 – Workflow-Konkurrenz und RUC-Effizienz

## Extern
- Keine Änderung an meteorologischer Fachlogik oder sichtbarer App-Funktion gegenüber v0.9.84.20.
- Releases und RUC-Aktualisierungen sollen sich bei gleichzeitigen GitHub-Actions nicht mehr gegenseitig aus einer einzigen Pending-Position verdrängen.

## Intern
- Primäre DWD-RUC-Slots bleiben `:11/:41`; der GitHub-interne Watchdog prüft nur noch `:23/:53`. Die provider-unabhängige Cloudflare-Ebene bleibt unverändert.
- Manueller RUC-Dispatch: `force=false` als sicherer Standard; explizites `force=true` bleibt für Reparaturfälle verfügbar.
- Der bereits in v0.9.84.20 vorhandene Architekturgewinn bleibt bestehen: der teure RUC-Bau läuft außerhalb des `mid-pages`-Locks, nur der Publish-Job wird serialisiert.
- Gemeinsame Pages-Concurrency erhält `queue: max` bei nicht abbrechbaren Publishes.
- Erfolgreiche Pages-Artefakte werden über Deployment-Retries wiederverwendet; ein frischer Upload wird nur nach fehlgeschlagenem/fehlendem Artefakt notwendig.
- GitHub-Pages-RUC installiert nur NumPy, SciPy, ecCodes und Requests; `awscli` bleibt ausschließlich im optionalen R2-Abhängigkeitssatz.
- RUC-EPS-GRIB-Decodierung: konservativ 2 Process-Worker, harte Obergrenze 4; Resultatreihenfolge bleibt deterministisch. P25/P50/P75 werden in einem NumPy-Aufruf berechnet.
- Der historische v0.9.19.0-Revisionsinstaller bleibt als manuell aufrufbarer Altpfad vorhanden, wird aber nicht mehr bei jedem `main`-Push gestartet.

## Aktivierung
- `ci/github/workflows/*` bleibt die kanonische Releasequelle; `.github/workflows/*` wird aus Sicherheitsgründen weiterhin nicht durch den normalen Professional-ZIP-Installer überschrieben.
- Die aktiven Workflowdateien werden deshalb einmal administrativ synchronisiert. Die verbundene GitHub-App besitzt keine Berechtigung zum Schreiben von Workflowdateien bzw. zum Anlegen eines Sync-Branches (GitHub 403); daher ist genau ein administrativer `npm run sync:github-workflows`-Commit erforderlich.
- Der Sync erledigt auch die Stilllegung des automatischen `main`-Triggers des historischen v0.9.19.0-Revisionsinstallers; manuelle YAML-Bearbeitung ist nicht erforderlich.
- Die genaue iOS-/Browser-taugliche Schrittfolge steht in `MID_WORKFLOW_SYNC_GUIDE.md`.
