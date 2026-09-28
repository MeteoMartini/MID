# MID v0.9.36.2

## 14-Tage-Ensemble-Niederschlag
- Die bestehende Tagesansicht bleibt Standard.
- Im Modus `kumuliert` wird innerhalb des bisherigen P10–P90-Bandes zusätzlich P25–P75 dargestellt.
- P10–P90 bleibt hellblau; P25–P75 wird als etwas dunkleres inneres Band gerendert.
- `EnsembleDay` enthält dafür nun auch `precipitationQ25` und `precipitationQ75`, abgeleitet aus derselben gewichteten Niederschlagsverteilung wie P10/P90.
- Die kumulierte Darstellung summiert die täglichen P25-/P75-Grenzen analog zum bisherigen kumulierten P10-/P90-Vertrag.
- Tooltip, Legende, Erklärung und Export-Metadaten wurden erweitert.

## Prüfung
- 353/353 automatisch erkannte MID-Regressionstests bestanden.
- `src/weather.ts` und `src/EnsemblePanel.tsx` mit dem TypeScript-Parser geprüft.
- Neue Schutzregression: `scripts/test-ensemble-cumulative-rain-quartiles-09362.mjs`.

## Worker
- Keine funktionale Worker-Änderung; nur Versionssynchronisierung.
