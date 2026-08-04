# MID v0.9.13.2

## Buildfix
- Die neue Hilfsfunktion der aufklappbaren Tagesdetailansicht verarbeitet das Ergebnis von `precipitationParts()`.
- Der Parameter ist daher jetzt korrekt als `PrecipitationParts` typisiert und nicht mehr als `PrecipSample`.
- `PrecipitationParts` wird explizit als Typ aus `src/precipitation.ts` importiert.
- Dadurch sind `type`, `displayCode` und `weatherLabel` im TypeScript-Vertrag vorhanden und die vier gemeldeten TS2339/TS2345-Fehler entfallen.

## Regression
- Neuer Vertragstest `scripts/test-forecast-inline-precip-types-09132.mjs`.
- Bestehender Wolkenschicht-/Tag-Nacht-/Tagesdetailtest weiterhin bestanden.
- Isolierte strikte semantische TypeScript-Prüfung des Niederschlagstypvertrags bestanden.
