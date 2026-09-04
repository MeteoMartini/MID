# MID v0.9.78.40

## Ausgangslage
Basis war MID v0.9.78.39. Gewünscht waren zwei Punkte:
1. prüfen, dass die Parallel-Chat-Änderungen im neuen Build weiterhin enthalten sind,
2. den GitHub-Release-Lauf stabilisieren und zusätzlich den Nachtgraubereich der 7-Tage-Kurvenübersicht über Skybar und Niederschlag hinweg ausdehnen.

## Umsetzung
- Die bereits zusammengeführten Parallel-Chat-Änderungen bleiben aktiv. Der vorhandene Schutztest `scripts/test-parallel-merge-skybar-phase-097839.mjs` wurde erneut erfolgreich ausgeführt.
- In `src/ForecastCockpit.tsx` wurde die Nachtflächen-Geometrie der 7-Tage-Kurvenübersicht von einem nur temperaturbezogenen Bereich auf einen zusammenhängenden Bereich von knapp oberhalb der Skybar bis leicht unter die Niederschlagsbasis erweitert.
- In `ci/github/workflows/install-mid.yml` sowie der kanonischen Patchkopie `workflow-patches/install-mid.yml` wurden Retry-Schleifen für `npm ci` und `npm run audit:dependencies` ergänzt. Nach Fehlschlägen werden `node_modules` bereinigt, der npm-Cache geprüft und der Schritt mit kurzem Backoff wiederholt.
- Zwei neue Regressionstests sichern die Installer-Härtung und die neue Nachtband-Geometrie.

## Unverändert
- Forecast-Fusion, meteorologische Diagnostik, Worker-Fachlogik und die bereits eingeführten phasenabhängigen Skybar-Farben wurden fachlich nicht verändert.
- Die Skybar bleibt hinsichtlich Sonnenschein/Bewölkung/Niederschlagsphase im v0.9.78.39-Stand.
