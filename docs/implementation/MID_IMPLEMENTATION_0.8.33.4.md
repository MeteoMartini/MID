# MID v0.8.33.4

## GitHub-CI-Buildfix

- Keine funktionale Änderung an der trockenen Nowcast-/MOSMIX-Konsistenzlogik.
- `test-nowcast-daily-consistency-08333.mjs` lädt TypeScript nun zuerst aus den regulären Projektabhängigkeiten (`node_modules`).
- Der feste NVM-Pfad wird ausschließlich als lokaler Fallback verwendet.
- Die Pfadauflösung nutzt `fileURLToPath`, damit der Test unabhängig von Betriebssystem, Arbeitsverzeichnis und URL-Encoding bleibt.
- Die bestehende CI-Determinismusprüfung schützt diesen Vertrag künftig vor Regressionen.
