# MID v0.9.78.42

## Anlass
GitHub-Release-Run #876 erreichte nach erfolgreichem `npm ci`, Dependency-Audit, TypeScript-7-Prüfung und Vite-Produktionsbuild die vollständige Regression-Suite. Dort schlug genau `scripts/test-appwide-parameter-colors-09779.mjs` fehl.

## Ursache
Der Test suchte im `ForecastCockpit.tsx` noch direkt nach dem früheren Inline-Rückgabewert `return 'var(--param-precipitation)'`. Seit v0.9.78.39 ist die bereits zuvor vorhandene phasenabhängige Niederschlagsfarblogik jedoch bewusst in `src/precipitationPhaseColor.ts` zentralisiert. Flüssiger Niederschlag verwendet dort weiterhin den appweiten Parameterfarbtoken; Schnee, Misch-/gefrierende Phase und Gewitter/Hagel verwenden die festgelegten Phasenfarben.

## Fix
- Keine Produktionslogik zurückgedreht.
- Die Regression folgt nun der tatsächlichen zentralen Implementierung und schützt gleichzeitig:
  - Regen/Sprühregen/Schauer → `var(--param-precipitation)`;
  - Schnee → `#66bce8`;
  - Misch-/gefrierende Phase → `#a769d8`;
  - Gewitter/Hagel → `#7869e8`.
- `ForecastCockpit.tsx` muss die gemeinsame `precipitationPhaseColor()`-Funktion verwenden.
- Der v0.9.78.41-TS6133-Schutztest ist nicht mehr auf die exakte Releasezeichenfolge `0.9.78.41` gepinnt, sondern schützt den Buildfix ab dieser Mindestversion bei weiterhin synchronem Package-/Baseline-Stand. Dadurch erzeugt er bei Folgereleases keine künstliche Regression.

## Unverändert
Ensemble-Bootstrap/Watchdogs, Skybar-Geometrie, 24-h-Tageskarten-Skybar, Sonnensymbol, Parallel-Chat-Security und die erweiterte Nachtfläche der 7-Tage-Kurvenübersicht bleiben unverändert erhalten.
