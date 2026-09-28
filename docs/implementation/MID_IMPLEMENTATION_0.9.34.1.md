# MID v0.9.34.1

## Buildfix
- `test-long-range-grid-ensemble-colors-09332.mjs`, `test-long-range-seasonal-09330.mjs` und `test-long-range-types-09331.mjs` waren auf die exakte Version `0.9.33.2` festgelegt.
- Die drei Verträge prüfen jetzt weiterhin die vollständige Langfristfunktion, akzeptieren aber jede Releaseversion ab `0.9.33.2`, sofern `package.json` und `MID_BASELINE.json` synchron sind.
- Neue Regression `test-long-range-release-resilience-09341.mjs` verhindert erneute exakte Versionssperren und schützt zugleich Multi-Modell-Rauchfahne sowie Schneefallgrenzen-Schnellübersicht.

## Prüfung
- 347/347 automatisch erkannte MID-Regressionstests bestanden (vollständig in vier Laufblöcken).
- Die drei im GitHub-Screenshot genannten Regressionen separat bestanden.
- `worker/metar-proxy.js` Syntaxprüfung bestanden.

## Worker-Upload
- Nein, keine funktionale Workeränderung; ausschließlich Versionssynchronisierung.
