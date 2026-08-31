# MID v0.9.76.24 – RUC-Scheduler-Resilienz und unabhängige Recovery-Vorbereitung

## Anlass
Der RUC-Pfad verfügte bereits über zwei primäre GitHub-`schedule`-Chancen (`:11` und `:41`) und einen GitHub-internen Recovery-Watchdog. Beide Ebenen hängen jedoch am selben GitHub-Scheduler. Bei einer providerweiten Schedulerlücke kann deshalb sowohl der Primärtrigger als auch der Watchdog verspätet oder gar nicht starten.

## Umsetzung
1. **Primärslots unverändert**
   - `ci/github/workflows/mid-ruc-preprocess.yml` behält exakt `:11` und `:41` UTC.
   - Der vorhandene Freshness-Guard bleibt vor apt/pip/ecCodes und verhindert unnötige Neubauten.
   - `workflow_dispatch` erhält ausschließlich das zusätzliche Diagnosefeld `trigger_source`; `force=false` bleibt der Recovery-Vertrag.

2. **GitHub-Watchdog verdichtet und entstapelt**
   - `ci/github/workflows/mid-ruc-schedule-watchdog.yml` prüft jetzt bei `:08/:18/:28/:38/:48/:58`.
   - Vor einem Recovery-Dispatch werden aktive/queued RUC-Läufe erkannt und respektiert.
   - Ein 18-Minuten-Cooldown verhindert Dispatch-Stapelung bei wiederholten Watchdog-Läufen.
   - Recovery-Läufe werden mit `trigger_source=github-watchdog` protokolliert.

3. **Provider-unabhängige zweite Ebene vorbereitet**
   - `tools/ruc/cloudflare_schedule_watchdog/` enthält einen separaten Cloudflare-Cron-Watchdog ohne R2-Abhängigkeit.
   - Er prüft alle zehn Minuten den RUC-Workflow und dispatcht nur bei stale/fehlgeschlagenem Zustand, niemals bei aktivem Lauf oder innerhalb des Cooldowns.
   - Externe Dispatches verwenden immer `force=false` und `trigger_source=cloudflare-watchdog`.
   - `workers_dev=false`; keine öffentliche Worker-Route ist erforderlich.
   - Die externe Ebene ist nur quellseitig vorbereitet. Aktivierung verlangt einmalig ein minimal berechtigtes GitHub-Token als Cloudflare-Secret und bleibt deshalb ein manueller Administrationsschritt.

4. **Regression**
   - `scripts/test-ruc-scheduler-resilience-097624.mjs` schützt Primärslots, 10-Minuten-Watchdog, Active-Run-Sperre, Cooldown, Dispatch-Herkunft und die nicht aktivierte externe Source-Preparation.

## Deployment/Workflow-Dateien
Das Professional-ZIP transportiert gemäß bestehendem Sicherheitsvertrag keine aktive `.github/`-Konfiguration. Deshalb werden die zwei aktiven Workflowdateien zusätzlich einzeln ausgeliefert. Die kanonischen Spiegel unter `ci/github/workflows/` sind Bestandteil des Professional-ZIPs.

## Worker
Keine fachliche Änderung am produktiven MID-Wetterdaten-Worker. Nur die Releaseversionsmarke wird synchronisiert. Das gekoppelte `MID-worker.zip` bleibt Notfall-/Audit-Artefakt; **kein manueller Worker-Upload erforderlich**.
