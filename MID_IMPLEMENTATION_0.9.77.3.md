# MID 0.9.77.3 – RUC Actions Wartung: PR #26

## Umfang

- PR #26 separat übernommen: `actions/setup-python` 5.x → 7.0.0, SHA `5fda3b95a4ea91299a34e894583c3862153e4b97`.
- Python 3.12 und der bestehende `pip`-Cachevertrag des RUC-Preprocessors bleiben unverändert.
- Der kanonische RUC-Workflow und `sync-github-workflows.mjs` sind gemeinsam aktualisiert; dadurch entsteht nicht der Dependabot-Fehlerzustand „aktive .github-Datei neu, kanonische Quelle alt“.
- RUC-Scheduler `:11/:41`, Guard, Non-Cancelling-Concurrency, Pages-Storage und Worker-Fachlogik bleiben unverändert.
- Ein fokussierter Regressionsvertrag schützt zusätzlich die drei freigegebenen PRs und die weiterhin zurückgestellten React-/plugin-react-Majors.

## Aktivierung

Der normale Release-Installer verändert `.github` weiterhin nicht. Die aktiven GitHub-Workflows müssen nach Installation des Professional-Stands über den ausdrücklich administrativen `npm run sync:github-workflows`-Pfad synchronisiert werden.

## Worker

Keine semantische Worker-Änderung; kein Worker-Upload erforderlich.

## GitHub-Connectorstatus

Ein direktes Ergänzen der Dependabot-Branches um die kanonischen MID-Dateien wurde versucht, aber vom verbundenen GitHub-App-Token mit HTTP 403 (`Resource not accessible by integration`) abgewiesen. Deshalb wurden die unvollständigen PRs nicht blind gemergt. Der Professional-Stand enthält die fachlich vollständige, konsistente Umsetzung; die aktive `.github`-Konfiguration ist nach Installation ausdrücklich administrativ zu synchronisieren.
