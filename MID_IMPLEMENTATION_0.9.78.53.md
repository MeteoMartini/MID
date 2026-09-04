# MID Implementation 0.9.78.53

## Schwerpunkt
Warnrelevante MID-Prognosehinweise nutzen kurzfristig echte Ensemble-Unterstützung und eine räumliche Umfeldbetrachtung, statt Unsicherheitsfenster nur aus der deterministischen Punktreihe abzuleiten.

## Umgesetzt

1. **EPS-Unterstützung für Warnparameter**
   - Für die ersten rund 54 Stunden werden `wind_gusts_10m`, `precipitation` und `temperature_2m` aus bis zu zwei voneinander unabhängigen Ensemble-Modellfamilien ausgewertet.
   - Für Wind und Niederschlag werden P50/P75/P90, für Temperatur zusätzlich P10/P25/P50/P75/P90 abgeleitet.
   - Modelle derselben `independenceGroup` werden nicht als unabhängige Stimmen doppelt gezählt.

2. **Umfeldprüfung statt reiner Punktbetrachtung**
   - Neben dem Standort werden vier Nachbarpunkte Nord/Ost/Süd/West in 12 km Radius gemeinsam abgefragt. Die Mehrpunktabfrage nutzt eine gemeinsame GMT-Zeitachse, damit auch nahe Zeitzonengrenzen keine Stunden gegeneinander verschieben.
   - Pro Ensemblemitglied wird zuerst das räumliche Maximum für Böen/Niederschlag bzw. Minimum/Maximum für Temperatur bestimmt. Erst danach werden Ensemble-Quantile berechnet.
   - Dadurch entstehen aus fünf Rasterpunkten ausdrücklich **keine fünf zusätzlichen Pseudomitglieder**.
   - Die Standortwerte bleiben stärker gewichtet; Umfeldsignale verbreitern oder stützen ein Warnfenster, ohne einen Treffer am Ort als sicher darzustellen.

3. **Frühere probabilistische Warnfenster**
   - Relevante EPS-Signale können einen MID-Hinweis schon vor dem deterministischen Kernzeitpunkt stützen; bei Wind werden bei vorhandener EPS-Unterstützung bis zu vier Stunden vor dem Kernfenster auf belastbare Signale geprüft.
   - Das ist insbesondere für Böen, Stark-/Dauerregen, Schnee, Glätte, Frost und Hitze vorgesehen.
   - Gewitter werden weiterhin nicht allein aus Ensemble-Niederschlag oder Böen erfunden; EPS dient dort nur als Zusatzstütze eines bereits vorhandenen Gewittersignals.

4. **Darstellung ohne pseudogenaue Von-bis-Spannen**
   - Wind, Niederschlag, Schnee und Hitze werden in den MID-Hinweisen als `bis zu …` formuliert.
   - Frost verwendet eine örtliche Untergrenze statt einer numerischen Spannweite.
   - Knoten werden gemäß App-Vertrag sichtbar als `kt` dargestellt.

5. **Amtliche Warnungen bleiben unverändert**
   - Die neue EPS-/Umfeldlogik verändert ausschließlich MID-eigene Prognosehinweise.
   - Amtliche Originalwarntexte, Einheiten und Formulierungen werden weiterhin nicht manipuliert.

## Technische Integration
- `warningEnsembleNeighborhood()` bündelt die Mehrpunkt-Ensembleabfragen, cached kurzzeitig und kann auf einen noch gültigen Stale-Wert zurückfallen.
- `App.tsx` lädt die Warn-Ensembledaten verzögert und abbrechbar parallel zum übrigen Forecast.
- `hazards()` erhält die Ensemble-Unterstützung optional; ohne EPS bleiben die bestehenden deterministischen Warnpfade funktionsfähig.

## Betroffene Dateien
- `src/App.tsx`
- `src/weather-src/00-types-models-search.tsfrag`
- `src/weather-src/30-ensemble-climate-hazards.tsfrag`
- `src/weather.ts`
- `MID_WARNING_HYBRID_CONTRACT.md`
- `scripts/test-warning-eps-neighborhood-097853.mjs`
- `scripts/test-current-warning-compact-responsive-09654.mjs` (an den neueren Vertrag angepasst: entfernte Hilfs-/Prompttexte müssen entfernt bleiben)
- `MID_BASELINE.json`
- `package.json`
- `CHANGELOG.md`

## Worker
Keine funktionale Worker-Änderung erforderlich. Die neuen Ensemble-Abfragen laufen im bestehenden Frontend-Datenpfad; der Worker wird lediglich versionssynchronisiert.
