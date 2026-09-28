## MID v0.8.27.8

### Umgesetzt
- Temperatur-Ensemble: die Wetter-/Bewölkungskästchen wurden schmaler und mit zusätzlicher Achsenreserve neu austariert, damit sie im Hoch- und Querformat sauber mittig unter der jeweiligen Tagesunterteilung wirken.
- Temperatur-Ensemble: X-Achsenreserve und Chart-Höhe wurden erhöht, damit Datumslabels, Wetterkästchen und Achsentitel sich nicht mehr gegenseitig bedrängen.
- Temperatur-Tooltip: bei rechten Datenpunkten wird das Tooltip-Inlay automatisch nach links gespiegelt, sodass die rechten Spalten nicht mehr abgeschnitten werden.
- CSS: zusätzliche Overflow-Absicherung für Recharts-Tooltip-Wrapper ergänzt.
- Regression: bestehende Temperatur-/Wetterbandtests flexibilisiert und um einen dedizierten Layouttest erweitert.

### Betroffene Dateien
- `src/EnsemblePanel.tsx`
- `src/styles.css`
- `scripts/test-ensemble-temp-axis-08276.mjs`
- `scripts/test-ensemble-weatherband-08273.mjs`
- `scripts/test-ensemble-temp-layout-08278.mjs`
- Versionssynchronisation in Frontend und Worker
