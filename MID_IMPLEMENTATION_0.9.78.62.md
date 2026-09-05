# MID 0.9.78.62 – Release #896 Regressionsfix

## Ursache

GitHub-Installer #896 hat `npm ci`, Dependency-Audit, TypeScript 7 und den vollständigen Vite-Produktionsbuild erfolgreich abgeschlossen. Der Lauf wurde anschließend ausschließlich durch die historische Regression `test-precipitation-form-snow-units-093222.mjs` blockiert.

Die Regression erwartete noch die frühere Inline-Verarbeitung `precipitationForm=dominantPrecipitationForm(dayHours)` direkt im 7-Tage-Cockpit. Seit dem verbindlichen kompakten 7-Tage-Vertrag wird die Niederschlagsform stattdessen zentral in `src/forecastDayLabel.ts` durch `compactSevenDayConditionLabel(...)` ausgewertet.

## Korrektur

- Keine Rücknahme der produktiven 7-Tage-Kurzlabels.
- 7-Tage-Cockpit-Regressionsvertrag auf `compactSevenDayConditionLabel(day, displayHours)` umgestellt.
- Die Regression prüft nun zusätzlich direkt, dass `forecastDayLabel.ts` die dominante Niederschlagsform weiterhin über `dominantPrecipitationForm(dayHours)` erhält.
- Phasen `Schnee`, `Schneeregen`, `Schauer` und `Regen` bleiben im kompakten Einzeiler abgesichert.
- Der separate 14-Tage-Pfad bleibt weiterhin auf seine direkte dominante Niederschlagsform geprüft.
- Keine funktionale Änderung an Prognose, Luftdruckachse oder Worker.
