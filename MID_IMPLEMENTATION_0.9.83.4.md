# MID v0.9.83.4 – Implementierungsbericht

## Anlass
GitHub-Installerlauf #947 baute MID v0.9.83.3 erfolgreich mit TypeScript 7 und Vite 8, brach aber anschließend bei drei RUC-Regressionen ab. Alle drei verglichen die aktive `.github/workflows/mid-ruc-preprocess.yml` mit der kanonischen Releasekopie.

## Ursache
Der Release-Installer schützt `.github` absichtlich und schließt es beim ZIP-Rsync aus. Ein normales MID-ZIP kann deshalb einen administrativen Workflow-Drift nicht selbst beheben. Die drei fachlichen RUC-Tests machten den Release dennoch von diesem externen Zustand abhängig und erzeugten damit einen Release-Deadlock.

## Änderung
- `test-ruc-dwd-pipeline-09690.mjs`, `test-ruc-pages-free-storage-09700.mjs` und `test-ruc-schedule-catchup-09745.mjs` validieren jetzt die kanonische RUC-Pipeline unter `ci/github/workflows`; auch der Cloudflare-Bootstrapvertrag des Pipeline-Tests stammt ausschließlich aus der kanonischen Releasekopie.
- `ruc-workflow-sync-contract.mjs` stellt dafür `assertCanonicalRucWorkflow()` bereit.
- Der administrative Sicherheitsvertrag bleibt unverändert in `rucWorkflowSyncState()` und `test-ruc-workflow-sync-transition-09747.mjs` fail-closed.
- Die Tests wurden zusätzlich mit einer absichtlich abweichenden aktiven `.github`-RUC-Datei ausgeführt; die drei fachlichen Tests bleiben dabei grün, während der separate Sync-Vertrag weiterhin unbekannten Drift ablehnt.

## Fachliche Auswirkungen
Keine Änderung an Wetter-, RUC-, Ensemble-, Klima-, Warn-, Pages- oder Worker-Fachlogik.
