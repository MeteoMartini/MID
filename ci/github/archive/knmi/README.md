# KNMI P4a: historisches Diagnose-Workflow-Archiv

Seit dem SHA-gebundenen Repository-Cleanup-Draft PR #543 existieren **keine aktiven** eigenständigen `mid-knmi-*.yml`-Diagnose-Workflows mehr. Ihre früheren Quellen und ausgeführten Prüfungen bleiben im Git-Verlauf und die zehn älteren Diagnose-YAMLs bewusst unter `ci/github/archive/knmi/` als **nicht ausführbare Fachnachweise** erhalten.

Die entfernten manuellen Workflows waren:
- `mid-knmi-eps-rolling-manifest.yml`: sechs Stundenarchive, 6×5-Assignment und gemeinsamer Lead-Horizont;
- `mid-knmi-eps-rolling-offset-smoke.yml`: echte Felder und Niederschlags-Offset am Punkt.

**Historische GitHub-Erfolge existieren:** Rolling Manifest am 02.09.2026, Run [33603092196](https://github.com/MeteoMartini/MID/actions/runs/33603092196) `success`; Rolling Offset am selben Tag, Run [33610910173](https://github.com/MeteoMartini/MID/actions/runs/33610910173) `success` (vorangegangener Run 33610029845 `failure`). Diese erfolgreich abgeschlossenen *Diagnosen* beweisen **keine** aktivierte, aktuelle, kontinuierliche KNMI-P4a-Produktionsdatenversorgung.

Die Archiv-Workflows waren keine obligatorischen Source-/Release-Gates und keine zeitgesteuerten Produktionsjobs. Deren Entfernung darf keine KNMI HARMONIE-Europe-/Niederlande-Forecasts oder KNMI AIRMET/SIGMET/Beobachtungen entfernen. Der möglicherweise separat konfigurierte P4a-Punktdecoder und Worker-Cache bleiben bis zur positiven, unabhängigen Betriebs-/Konfigurationsprüfung und einer gesonderten Freigabe unverändert.

Der verpflichtende Test `scripts/test-knmi-workflow-consolidation-0985127.mjs` verhindert eine Wiederaktivierung eigenständiger P4a-Workflows und bewahrt die regulären KNMI-Quellen. Der vollständige Befund steht in `docs/implementation/MID_REPOSITORY_BRANCH_CLEANUP_AUDIT_385.md`.
