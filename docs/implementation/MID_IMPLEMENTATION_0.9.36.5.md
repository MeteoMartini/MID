# MID v0.9.36.5

## CI-/Regression-Runner-Fix
Der Dependency-/Maintenance-Audit rief `node scripts/run-regressions.mjs` direkt auf. Dadurch fehlte auf GitHub Actions `node_modules/.bin` im PATH der Kindprozesse. Genau die 12 Regressionen, die intern `tsc` starten, konnten deshalb das projektlokal installierte TypeScript nicht finden.

### Dauerhafte Lösung
- `scripts/run-regressions.mjs` setzt für alle Kindtests projektlokal `node_modules/.bin` an den Anfang von `PATH`.
- `package.json` enthält zusätzlich `test:regressions` als offiziellen npm-Einstiegspunkt.
- `.github/workflows/dependency-audit.yml` und `ci/github/workflows/dependency-audit.yml` verwenden `npm run test:regressions` statt eines direkten Node-Aufrufs.
- Neue Regression `test-regression-runner-local-bin-09365.mjs` schützt diesen Vertrag.

## Prüfung
- Die exakt 12 im GitHub-Screenshot fehlgeschlagenen Tests wurden zunächst mit entferntem globalem `tsc` reproduziert: 12/12 rot.
- Nach Fix mit ausschließlich projektlokalem `node_modules/.bin/tsc`: 12/12 grün.
- Gesamtsuite: 356/356 grün, auf vier Blöcke verteilt.
