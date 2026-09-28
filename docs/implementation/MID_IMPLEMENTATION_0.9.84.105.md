# MID v0.9.84.105 – GitHub-Workflow-Bootstrap-Hotfix

## Ausgangslage
Der Release-Kandidat v0.9.84.104 wurde in GitHub Actions als Installer #1060 vollständig bis durch TypeScript, Vite und fast die gesamte Regression Suite geprüft. Zwei von 793 Regressionstests stoppten den Release.

## Ursache
1. `scripts/test-github-workflow-bootstrap-08263.mjs` enthielt weiterhin die alte Liste von sieben verwalteten GitHub-Dateien. Durch `chatgpt-pr-gate.yml` sind es jetzt acht.
2. `scripts/test-no-actions-workflow-self-modification-093911.mjs` baute ein isoliertes Test-Repository auf, legte dort aber die neue kanonische Datei `ci/github/workflows/chatgpt-pr-gate.yml` nicht an. Der explizite Sync brach daher mit `ENOENT` ab.

## Korrektur
- `managedFiles` wird nun aus `scripts/sync-github-workflows.mjs` exportiert und ist die einzige kanonische Liste der verwalteten GitHub-Dateien.
- Der Bootstrap-Test verwendet diese Liste direkt statt einer eigenen Zählliste.
- Der Selbstmodifikationsschutz erzeugt sein isoliertes `ci/github`-Fixture ebenfalls generisch aus derselben Liste. Neue kanonische Workflows werden dadurch künftig automatisch mitgetestet.
- Der produktive Sync-Code und die Sicherheitsarchitektur werden nicht aufgeweicht. `.github` bleibt im normalen Release-Prebuild unverändert; nur der explizite Maintainer-Sync darf aktive Workflowdateien aktualisieren.

## Releasewirkung
Keine meteorologische, UI-, Datenquellen-, Worker- oder Kartenfachlogik wurde verändert.
