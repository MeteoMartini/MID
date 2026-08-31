# MID RUC Scheduler-Resilienz – Aktivierungsleitfaden

Stand: v0.9.76.24

## Ziel
Der bestehende DWD-RUC/RUC-EPS-Pfad bleibt fachlich unverändert. Diese Änderung reduziert ausschließlich das Risiko ausgefallener Scheduler-Trigger. Die primären GitHub-Slots bleiben verbindlich bei `:11` und `:41` UTC.

## Ebene 1 – GitHub-interner Watchdog
Der kanonische Workflow `ci/github/workflows/mid-ruc-schedule-watchdog.yml` prüft künftig alle zehn Minuten (`:08/:18/:28/:38/:48/:58`). Er startet keinen zusätzlichen Recovery-Lauf, solange bereits ein RUC-Workflow aktiv ist, und hält nach einem `workflow_dispatch` einen 18-Minuten-Cooldown ein. Jeder Recovery-Dispatch bleibt mit `force=false` hinter dem vorhandenen RUC-Freshness-Guard.

## Ebene 2 – provider-unabhängiger Cloudflare Cron Watchdog
Unter `tools/ruc/cloudflare_schedule_watchdog/` liegt eine optionale zweite Scheduler-Ebene. Sie ist **nur quellseitig vorbereitet und nicht aktiviert**. Der Cloudflare Cron prüft GitHub alle zehn Minuten und dispatcht nur bei stale/fehlgeschlagenem RUC-Lauf, ohne aktive Läufe oder den 18-Minuten-Cooldown zu überfahren.

### Erforderlicher manueller Schritt
Für die externe Ebene wird einmalig ein Fine-Grained-GitHub-Token benötigt, das ausschließlich auf `MeteoMartini/MID` und die minimal notwendige Actions-Lese-/Dispatch-Berechtigung begrenzt wird. Dieses Token gehört als Cloudflare-Secret `GITHUB_TOKEN` in den separaten Watchdog-Worker und **niemals** in Repositorydateien oder Chat-Nachrichten.

Der Watchdog ist mit `workers_dev=false` vorbereitet; ein öffentlicher workers.dev-Endpunkt ist nicht erforderlich. R2, RUC-R2-Bucket oder andere MID-Speicherressourcen werden dadurch nicht aktiviert.

## Workflow-Synchronisierung
Das Professional-Transport-ZIP enthält absichtlich keine `.github/`-Dateien. Deshalb müssen die mitgelieferten Einzeldateien administrativ nach `.github/workflows/` übernommen werden oder später über den ausdrücklich administrativen Workflow-Sync synchronisiert werden.

## Worker
Der produktive MID-Wetterdaten-Worker wird fachlich nicht verändert. `MID-worker.zip` wird als gekoppeltes Notfall-/Audit-Artefakt erzeugt; ein manueller Upload ist für diese Scheduler-Mitigation nicht erforderlich.
