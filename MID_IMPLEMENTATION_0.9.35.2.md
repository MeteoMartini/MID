# MID v0.9.35.2

## 24-h-Wetterprofil
- Exakt 24 einstündige Zeitschritte ab der aktuellen Stunde.
- Keine 15-Minuten-Zeitschritte innerhalb des Wetterprofil-Diagramms.
- 15-Minuten-Daten bleiben weiterhin für die nächsten 90 Minuten und andere Kurzfristfunktionen verfügbar.

## Schneefallgrenze
- `null`/fehlende Ensemblewerte werden nicht mehr als 0 m interpretiert.
- Fehlende `snowfall_height`-Werte verwenden wieder korrekt den vorhandenen Fallback aus der Nullgradgrenze.
- Y-Achse fest 0 bis 4,5 km in 500-m-Schritten.
- 10–90-%- und 25–75-%-Unsicherheitsbänder sowie Multi-Modell-Median bleiben bestehen.
- Erwartete Niederschlagszeitschritte werden dezent im Diagrammhintergrund markiert.
- Gewählter Zeitschritt ergänzt bei Niederschlag Wahrscheinlichkeit und Stundenmenge kompakt.

## Prüfung
- 350/350 Regressionstests bestanden, wegen Sandbox-Laufzeitlimit in vier vollständigen Blöcken.
- `App.tsx`, `ForecastCockpit.tsx` und `mountainSports.ts` mit TypeScript `transpileModule` syntaktisch geprüft.
- Vollständiger Vite-Build lokal nicht möglich, da das Replacement-Paket keine `node_modules` enthält.

## Worker
- Keine funktionale Workeränderung; ausschließlich Versionssynchronisierung auf v0.9.35.2.
