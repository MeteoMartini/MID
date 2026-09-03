# MID Implementation v0.9.78.18

Datum: 2026-09-03

## Anlass

GitHub Release-Run #854 scheiterte nach erfolgreichem ZIP-Check, `npm ci` und Dependency-Audit im TypeScript-7-Gate. `ForecastCockpit.tsx` übergibt für den neuen 24-h-Wetterstreifen kanonische `ShortTermForecastPoint[]`; `detailSkyBarSegments` war jedoch weiterhin unnötig auf `Hour[]` verengt.

## Umsetzung

- `detailSkyBar.ts` nutzt für seine tatsächlich benötigten Niederschlags-/Wetterstreifenfelder jetzt den gemeinsamen `PrecipSample`-Vertrag.
- Dadurch akzeptiert `detailSkyBarSegments` sowohl reguläre `Hour[]` als auch die aus Radar-/15-min-/Stundenfusion erzeugten `ShortTermForecastPoint[]` ohne unsicheren Cast und ohne Datenkopie.
- Die fachliche Single-Strip-Logik, Niederschlagsart, Sonnenanteile, Bewölkung, Nachtfärbung und expliziten X-Positionen bleiben unverändert.
- Der vorhandene Wetterprofil-Regressionsschutz wurde um den gemeinsamen Typvertrag ergänzt.

## Wirkung

Der konkrete TypeScript-Fehler aus Run #854 (`TS2345: ShortTermForecastPoint[] is not assignable to Hour[]`) ist an der Ursache beseitigt. Es gibt keine funktionale Worker-Änderung; die Worker-Version wird nur releasesynchron gehalten.
