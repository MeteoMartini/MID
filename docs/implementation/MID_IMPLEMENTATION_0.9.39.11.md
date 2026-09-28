# MID v0.9.39.11

## Release-Commit: keine Workflow-Selbstmodifikation aus GitHub Actions

Der v0.9.39.10-Installationslauf erreichte erfolgreich Entpacken, Abhängigkeitsinstallation, Produktionsbuild und Regressionstests, scheiterte anschließend aber beim Push des Release-Commits. Ursache war eine automatische Synchronisierung von `ci/github/*` nach `.github/*` innerhalb von `prepare-release-repository.mjs`. Dadurch enthielt der Bot-Commit Änderungen an `.github/workflows/dependency-audit.yml`. GitHub lehnt solche Workflowänderungen für den im Actions-Lauf verwendeten GitHub-App-Token ohne entsprechende Workflow-Berechtigung ab.

v0.9.39.11 trennt deshalb Release-Build und Workflow-Verwaltung strikt:

- `prepare-release-repository.mjs` verändert `.github` nicht mehr.
- Der normale `prebuild` führt nur Repository-Hygiene (`node_modules` aus dem Git-Index entfernen) und Versionssynchronisierung aus.
- Die kanonische Konfiguration unter `ci/github` bleibt erhalten.
- `npm run sync:github-workflows` bleibt als ausdrücklich manuell/administrativ auszuführende Synchronisierung verfügbar.
- Die kanonischen Installer-Patches schließen `.github/**` zusätzlich ausdrücklich aus dem automatischen Release-Commit aus und entfernen eventuell vorgemerkte `.github`-Änderungen vor `git add` aus dem Index.
- Ein neuer Regressionstest führt `prepareReleaseRepository()` in einem isolierten Actions-Szenario aus und belegt, dass eine absichtlich abweichende `.github/workflows/dependency-audit.yml` unverändert bleibt, während die explizite Synchronisierung weiterhin funktioniert.

Damit ist v0.9.39.11 mit dem derzeit noch auf `main` laufenden alten Installer kompatibel: Da das neue Prebuild keine `.github`-Datei mehr verändert, nimmt dessen bestehendes `git add -A` keine Workflowänderung auf und der Release-Commit kann mit der vorhandenen `contents: write`-Berechtigung gepusht werden.
