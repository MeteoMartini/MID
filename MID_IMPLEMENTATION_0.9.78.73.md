# MID v0.9.78.73 – CI-Buildfix

Der fehlgeschlagene GitHub-Actions-Lauf #906 wurde anhand des tatsächlichen Job-Logs korrigiert.

- `src/EnsemblePanel.tsx`: nicht verwendeten Import `AGREEMENT_COLOR` entfernt (TS6133).
- `src/ForecastCockpit.tsx`: `confidenceDisplayMode` wird jetzt explizit an `FourteenDayHorizon` übergeben und dort typisiert (TS2552/TS6133).
- Keine fachliche Änderung an Worker- oder Wetterdatenlogik.
- Die beiden geänderten TSX-Dateien wurden zusätzlich mit dem installierten TypeScript-Parser geprüft.

Die lokale Arbeitsumgebung enthält unvollständige `@types`-Pakete; ein vollständiger lokaler `tsc`-Lauf ist deshalb hier nicht belastbar. Die im GitHub-Log konkret ausgewiesenen drei Compilerfehler sind im Quellcode behoben.
