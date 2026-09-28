# MID Implementation v0.9.78.11

Datum: 2026-09-03

## Anlass

GitHub Release-Run #849 scheiterte im Schritt `verify:types` mit `TS6133`: `probabilityCellGeometry` war in `src/ForecastCockpit.tsx` deklariert, wurde nach der Niederschlags-Intervallkorrektur aus v0.9.78.10 aber nicht mehr verwendet.

## Umsetzung

- Den unbenutzten Helper vollständig entfernt.
- Die in v0.9.78.10 eingeführte trailing-interval-/Radar-Nowcast-Logik bleibt unverändert.
- Regression ergänzt, die den toten Helper künftig verbietet.

## Fachlicher Umfang

Kein meteorologischer Algorithmus, keine Forecast-Fusion und keine Worker-Fachlogik wurden verändert. Es handelt sich ausschließlich um einen TypeScript-/CI-Hotfix.
