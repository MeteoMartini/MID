# MID Test Report v0.9.77.4

## Ausgeführte Prüfungen
1. `node scripts/test-trend14plus-09770.mjs`
2. `node scripts/test-parameter-colors-trend14plus-09771.mjs`
3. `node scripts/test-release-upload-budget-097410.mjs`
4. `tsc --noEmit --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib ES2022,DOM --skipLibCheck --noResolve src/SubseasonalTrendPanel.tsx`

## Ergebnis
- **Trend 14d+/Tag 15–46 Regression:** bestanden
- **Parameterfarben + Tooltip Regression:** bestanden
- **Release Upload Budget:** bestanden
- **Targeted TS parse check:** keine TS-Syntaxfehler im bearbeiteten Panel; erwartbar verbleiben bei `--noResolve` nur externe Modulauflösungen (`react`, `lucide-react`) außerhalb der lokalen Bearbeitungsprüfung.

## Geprüfte Inhalte
- Tag-15–46-Wochenblöcke weiterhin aktiv
- Seasonal-/Ensemble-Endpunkte weiter korrekt referenziert
- Wind im Trendpanel jetzt kn-basiert angefordert
- Metriken **Tmax**, **Tmin** und **Windböen** vorhanden
- Klimamittel-Zuordnung über `weekly.time` statt nur über festen Indexoffset
- Punkt-Hitareas und Tooltip-Container vorhanden
- neue Farbzuordnungen für Tmax/Tmin/Böen in `styles.css`
- Release-ZIPs weiterhin innerhalb des Upload-Budgets
