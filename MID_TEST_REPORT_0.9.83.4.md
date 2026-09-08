# MID v0.9.83.4 – Freigabe-/Testbericht

## Ausgangslage
GitHub-Lauf #947: `npm ci`, Dependency-Audit, TypeScript 7 und Vite 8.2.2 Produktionsbuild erfolgreich; 3/721 RUC-Regressionen scheiterten ausschließlich am administrativen `.github`-Workflowzustand.

## Gezielte Prüfung
- test-ruc-dwd-pipeline-09690.mjs: PASS
- test-ruc-pages-free-storage-09700.mjs: PASS
- test-ruc-schedule-catchup-09745.mjs: PASS
- test-ruc-workflow-sync-transition-09747.mjs: PASS
- dieselben drei RUC-Fachtests mit absichtlich driftender `.github/workflows/mid-ruc-preprocess.yml`: PASS

## Sicherheitsgrenze
Der Admin-Sync-Vertrag wurde nicht aufgeweicht: unbekannter aktiver Workflow-Drift bleibt im Transition-/Sync-Vertrag ungültig. Der normale ZIP-Release hängt lediglich nicht mehr von einem Zustand ab, den er selbst absichtlich nicht verändern darf.

## Ergebnis
Freigabefähiger Wartungshotfix. Keine fachliche Workeränderung.

## Vollbuild-Nachweis
Der unmittelbar vorherige GitHub-Lauf #947 auf v0.9.83.3 installierte 202 Pakete reproduzierbar und bestand Dependency-Audit, TypeScript-7-Typecheck sowie den Vite-8.2.2-Produktionsbuild. Erst die drei oben korrigierten RUC-Regressionen stoppten den Lauf. Ein erneutes lokales `npm ci` für v0.9.83.4 wurde versucht, aber vom isolierten Container mit `TransportTimeoutError` vor der Installation beendet. Deshalb wird kein zusätzlicher lokaler Vollbuild behauptet; die geänderte Release-/RUC-Grenze wurde stattdessen gezielt und aus dem final entpackten ZIP geprüft.
