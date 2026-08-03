# MID v0.9.7.1

## Buildfix

Der GitHub-Produktionsbuild von v0.9.7.0 wurde durch fünf ungenutzte Deklarationen in `src/ForecastCockpit.tsx` abgebrochen:

- `CloudRain`
- `Compass`
- `GaugeCircle`
- `finite`
- `circularDelta`

Die ungenutzten Symbole wurden entfernt. Es wurden keine meteorologischen, visuellen oder funktionalen Änderungen gegenüber v0.9.7.0 vorgenommen.

## Versionierung

- Vorher: **0.9.7.0**
- Neu: **0.9.7.1**

## Worker-Upload

- **Nein** – der Worker wurde ausschließlich versionssynchronisiert.
