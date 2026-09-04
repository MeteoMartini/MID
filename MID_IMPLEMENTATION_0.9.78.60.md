# MID 0.9.78.60 – 7d-Kurzlabel Buildfix

## Anlass
GitHub Actions Run #892 scheiterte im TypeScript-7-Check. Der unmittelbar zuvor ergänzte Helfer `sevenDayCompactRegime(...)` griff auf nicht existente Felder zu (`Hour.weatherCode` sowie mehrere nicht vorhandene Eigenschaften des Rückgabewerts von `dayPrecipitationAssessment`).

## Umsetzung
- `sevenDayCompactRegime(...)` nutzt ausschließlich den kanonischen MID-Vertrag: `Hour.code` indirekt über `dayWeatherCharacter(...)`, `dayPrecipitationAssessment(...).showery/.dominant` und `Day.wind/gust/max`.
- Die 7-Tage-Kacheln bleiben bei genau einer kompakten Kurzform wie `Sonnig`, `Regen`, `Schauer`, `Ruhig`, `Windig`, `Warm`, `Schnee`, `Schneeregen` oder `Gewitter`.
- Das Forecast-Cockpit erhält für die 7d-Kacheln eine eigene kompakte `sevenDayRegimeLabel(...)`-Darstellung; die ausführliche Tagescharakterisierung bleibt weiterhin im Tooltip/Detailkontext verfügbar.
- Keine Änderung an Prognosedaten, Warnlogik oder Worker-Fachlogik.

## Regression
`scripts/test-seven-day-compact-label-buildfix-097860.mjs` schützt gegen die in Run #892 gemeldeten nicht existenten Felder und stellt die kompakte sichtbare 7d-Darstellung sicher.
