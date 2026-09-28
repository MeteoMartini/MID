# MID Implementation v0.9.19.2

## Anlass
Anpassung des Kurzfristmeteogramms im Forecast-Cockpit an die gewünschte Kachelmann-ähnliche Anmutung mit Fokus auf Diagramm-/Achsenformat, Vollbreiten-Geometrie und bereinigte Einzeldaten.

## Umgesetzte Punkte
- Plot-Geometrie des 24-h-Meteogramms von zentrierter Spaltenlogik auf vollbreite Punktverteilung über die gesamte Plotbreite umgestellt.
- Hitlayer und Tagesbänder an die neue Geometrie gekoppelt.
- Wetterpiktogramme direkt entlang des Temperaturverlaufs positioniert.
- Responsive Meteogramm-Overlays für Wetterpiktogramme und Windfiedern auf schmalen Displays kompakter abgestimmt.
- Einzeldatenfeld zusammengeführt:
  - Niederschlag enthält jetzt Menge, Wahrscheinlichkeit, Niederschlagsform und geschätzte Niederschlagsdauer.
  - Wind enthält jetzt Richtung, Mittelwind und Böen.
- Regressionsprüfungen `test-cockpit-meteogram-overlay-scale-09186.mjs` und `test-cockpit-meteogram-hourly-detail-09187.mjs` auf den neuen Stand aktualisiert.

## Betroffene Dateien
- `src/ForecastCockpit.tsx`
- `src/styles.css`
- `scripts/test-cockpit-meteogram-overlay-scale-09186.mjs`
- `scripts/test-cockpit-meteogram-hourly-detail-09187.mjs`
- `package.json`
- `package-lock.json`
- `MID_BASELINE.json`
- `public/version.json`
- `src/version.ts`
- `CHANGELOG.md`

## Versionierung
- Vorher: `0.9.19.1`
- Neu: `0.9.19.2`

## Worker
Keine Änderungen erforderlich.
