# MID Test Report 0.9.78.52

## GitHub-Run #884
Der Build erreichte erfolgreich ZIP-Prüfung, `npm ci` und Dependency-Audit und scheiterte ausschließlich im TypeScript-7-Check an drei Feldnamenfehlern in `src/weather.ts`.

## Regression
`node scripts/test-warning-probabilistic-hour-fields-buildfix-097852.mjs`

Der Test schützt Fragment und generiertes Aggregat gegen eine Rückkehr zu `hour.precip`, `hour.temp` oder `sumForward('precip', ...)` und verlangt die kanonischen Felder `precipitation` und `temperature`.
