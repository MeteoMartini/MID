# MID v0.9.84.32 – Implementierungsnotiz

## Ursache
GitHub Actions Run #986 installierte das Release-ZIP, `npm ci` und den Dependency-Audit erfolgreich. Der Abbruch erfolgte erst im TypeScript-Build in `src/ForecastCockpit.tsx`: `dominantPrecipitationForm()` erhielt fälschlich eine einzelne `Hour` statt einer Stundenliste; außerdem waren die CSS-Custom-Properties des Balkenstils nicht als `CSSProperties` typisiert.

## Korrektur
- Phase pro Stundenbalken aus `precipitationParts(hour).type`.
- `precipitationPhaseColor(type)` erhält damit einen echten `PrecipType`.
- Rückgabe des Style-Objekts wird als `CSSProperties` typisiert.
- Veraltete exakte Header-Erwartung in `test-modern-forecast-workspace-09794.mjs` auf den neuen gemeinsamen Forecast-Headervertrag gebracht.
- `test-forecast-entry-consistency-098430.mjs` um Schutz gegen den Einzelstunden-Aufruf und die fehlende CSS-Property-Typisierung ergänzt.

## Umfang
Keine Änderung an Wetterberechnung, Datenquellen, Prognosegewichtung oder Worker-Fachlogik.
