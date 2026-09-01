# MID Implementation v0.9.77.6

## Anlass
GitHub-Installerlauf **#812** kam durch TypeScript und Vite vollständig durch, scheiterte anschließend aber an drei RUC-Regressionen.

## Ursache
Der aktive Workflow `.github/workflows/mid-ruc-preprocess.yml` bleibt durch den Release-Installer absichtlich unverändert und verwendete noch `actions/setup-python` v5. Der kanonische Professional-Stand unter `ci/github/workflows/mid-ruc-preprocess.yml` verwendet bereits den freigegebenen v7.0.0-Pin. Der vorhandene Sync-Vertrag erkannte diesen exakt erwarteten administrativen Übergang noch nicht.

## Fix
- `scripts/ruc-workflow-sync-contract.mjs` erkennt nun **ausschließlich** den bekannten setup-python-v5→v7-Pin-Unterschied als `pending-admin-sync`.
- Der Vergleich ist byteeng: Nach Austausch genau dieser einen Pin-Zeile müssen aktiver und kanonischer Workflow identisch sein.
- Jede weitere Abweichung, z. B. Scheduler-Slot, Concurrency, Freshness-Guard oder sonstiger Workflowtext, bleibt `unsafe-drift` und damit fail-closed.
- Neuer Regressionstest: `scripts/test-ruc-workflow-setup-python-transition-09776.mjs`.

## Keine fachliche Wetter-/Worker-Änderung
Der Wetter-Worker und die RUC-Datenlogik bleiben unverändert. Der Hotfix betrifft ausschließlich den Release-/Workflow-Synchronisationsvertrag.
