# MID v0.9.36.7

## GitHub-Actions-/Regression-Installer-Fix

- Behebt den Fehlalarm von `scripts/test-regression-runner-local-bin-09365.mjs` im Release-Installer.
- Der Installer ersetzt absichtlich keine aktive `.github/`-Konfiguration; der Regressionstest prüft deshalb die kanonische Workflow-Quelle unter `ci/github/` statt einen bereits installierten Workflow vorauszusetzen.
- Der Schutz des Regression-Runners bleibt unverändert: `node_modules/.bin` wird im Runner an den Anfang von `PATH` gesetzt.
- `npm run verify` startet die Regressionen nun ebenfalls über den offiziellen Einstieg `npm run test:regressions`.
- Die funktionalen Änderungen aus v0.9.36.5 und v0.9.36.6 bleiben unverändert.
