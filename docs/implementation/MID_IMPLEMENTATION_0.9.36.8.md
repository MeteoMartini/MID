# MID v0.9.36.8

## Regression-Continuity-Fix

- Behebt den CI-Fehler in `scripts/test-regression-continuity.mjs`, der durch die in v0.9.36.7 bewusst eingeführte Umleitung von `npm run verify` auf `npm run test:regressions` ausgelöst wurde.
- Der Kontinuitätstest akzeptiert jetzt beide gültigen, funktional äquivalenten Varianten: den direkten Aufruf von `scripts/run-regressions.mjs` sowie den offiziellen npm-Einstieg `npm run test:regressions`, sofern dieser weiterhin auf denselben Runner zeigt.
- Damit bleibt der automatische Schutz aller `test-*.mjs`-Regressionen erhalten, ohne die neue Runner-Härtung aus v0.9.36.7 zurückzunehmen.
- Die funktionalen Änderungen aus v0.9.36.5 bis v0.9.36.7 bleiben unverändert.
