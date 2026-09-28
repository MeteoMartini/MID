# MID Implementation v0.9.78.5

Datum: 2026-09-03

## Anlass

GitHub Actions Run #843 (`MID-Release aus ZIP installieren und veröffentlichen`, Run-ID `33715805828`, Commit `6d4226fa05432dc2e968798f07f9551e99284da5`) wurde anhand des vollständigen Joblogs analysiert.

Der Release war fachlich und technisch bis auf eine einzelne Regression grün:

- ZIP-Prüfung/Entpackung erfolgreich,
- `npm ci` erfolgreich,
- Dependency-Audit 0 Schwachstellen,
- TypeScript 7.0.2 erfolgreich,
- Vite 6.4.3 Produktionsbuild erfolgreich,
- 645 von 646 Regressionen erfolgreich.

## Ursache

`scripts/test-tmin-tmax-number-tone-097717.mjs` erwartete noch die ältere stärkere Kästchentönung aus v0.9.77.25:

- Hintergrund: `9 + intensity * 19`,
- Rahmen: `24 + intensity * 34`.

Seit v0.9.78.4 gilt auf ausdrückliche UI-Vorgabe eine schwächere Darstellung für bessere Zahlenlesbarkeit:

- 14 Tage Hintergrund: `5 + intensity * 11`,
- 14 Tage Rahmen: `20 + intensity * 26`,
- 7 Tage ECMWF-Hintergrund: 10 % des absoluten Temperaturtons.

Die Produktionslogik war bereits korrekt; nur die Regression war veraltet.

## Umsetzung

- `test-tmin-tmax-number-tone-097717.mjs` auf die abgeschwächten v0.9.78.4-Werte migriert.
- Der Test schützt zusätzlich:
  - 7 Tage: absolute ECMWF-Farbskala,
  - 7 Tage: keine Klimaabweichungen,
  - 7 Tage: keine Zusatzlabels `Min`/`Max`,
  - 14 Tage: weiterhin nichtlineare signierte Klimareaktion,
  - unveränderte Tmin-Blau-/Tmax-Rot-Parameterfamilien.
- `MID_PARAMETER_COLOR_CONTRACT.md` sprachlich auf die neue Trennung 7d vs. 14d präzisiert.

## Ergebnis

v0.9.78.5 ist ein reiner Regression-/Release-Hotfix. Wetterdaten, Forecastfusion, RUC, UI-Produktionslogik und Worker-Fachlogik bleiben unverändert.
