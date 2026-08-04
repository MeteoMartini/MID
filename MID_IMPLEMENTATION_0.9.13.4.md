# MID v0.9.13.4 – Forecast-Cockpit Feinschliff

## Umgesetzt

### 1) Nacht-Piktogramm im 7-Tage-Cockpit
- Nacht-Piktogramm im Tageskachel-Cockpit auf **transparenten Hintergrund** umgestellt.
- Deutlichere **Größenabstufung** zwischen Tages- und Nacht-Piktogramm hergestellt.
- Nacht-Piktogramm als separate kleine Überlagerung oben rechts positioniert.

### 2) Bessere Erkennbarkeit der Piktogramme
- Zusätzliche optische Trennung über gezielte **Drop-Shadow-/Kontrastwirkung**.
- Anpassungen auch für schmale Ansichten, damit die Piktogramme auf hellen/gelblichen Hintergründen besser lesbar bleiben.

### 3) Böenangabe in den 7-Tage-Karten
- Gekürzte Darstellung der Böen in den Tageskarten eingeführt.
- Statt längerer Form nun kompakt als z. B. **`G34 kt`** (bzw. einheitenabhängig entsprechend).
- Kartenlayout für die Windzeile zusätzlich so nachgezogen, dass Abschneiden vermieden wird.

## Technische Änderungen
- `src/ForecastCockpit.tsx`
- `src/styles.css`
- neuer Regressionstest:
  - `scripts/test-forecast-cockpit-daynight-wind-09134.mjs`

## Regression
- `test:forecast-cockpit-daynight-wind`
- `test:forecast-cockpit`
- `test:cockpit-responsive`
- `test:cloud-layer-day-night-details`
- `test:buildfix-0971`

## Version
- Frontend/Worker auf **v0.9.13.4** fortgeschrieben.
