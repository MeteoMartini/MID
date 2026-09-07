# MID v0.9.79.10 – Wetterregime/Farben vereinheitlicht

## Umgesetzt
- Zentrale Wetterregime-Palette in Root-Variablen eingeführt.
- 7-Tage- und 14-Tage-Cockpit leiten ihre Regime-Akzentfarbe nun aus `--mid-weather-regime-accent` ab.
- Mobile 7-Tage-Karten behandeln jetzt auch `showery` konsistent.
- Mini-Ribbons und 7-Tage-Legende wurden auf dieselbe Palette umgestellt.

## Absicherung
- Vertrag: `MID_WEATHER_REGIME_COLOR_CONTRACT.md`
- Regressionstest: `scripts/test-weather-regime-color-consistency-097910.mjs`
