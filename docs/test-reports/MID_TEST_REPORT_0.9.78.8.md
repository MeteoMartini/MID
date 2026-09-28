# MID Test Report v0.9.78.8

Datum: 2026-09-03

## Geprüfte Korrekturen

- veralteter Gewitterrisiko-Kachelvertrag auf integrierte Niederschlagskachel migriert,
- gemeinsames 6-h-Gewitterrisiko für Aktuell/Wassersport erhalten,
- Weather Icon System 2.0 in der Niederschlagskachel geschützt,
- 14-Tage-Querformat-Komprimierung auf maximal 1024 CSS-Pixel begrenzt,
- Desktop-Mindestbreite 190 px und kollisionsfreie Kartenstruktur geschützt.

## Ausgeführte Regressionen

- `test-location-thunder-water-tide-layout-09644.mjs`
- `test-fourteen-day-orientation-layout-09642.mjs`
- `test-current-nowcards-responsive-096612.mjs`
- `test-weather-pictogram-ui-lock-09781.mjs`
- `test-thunder-mobile-place-summary-pin-097625.mjs`
- `test-thunder-mobile-route-cards-097627.mjs`
- `test-cockpit-fourteen-day-character-094017.mjs`
- `test-climate-delta-badges-097728.mjs`

Für den lokal isolierten TypeScript-Vertragstest wurde ausschließlich zur Ausführung der Regression ein temporärer `typescript-strada`-Alias auf die vorhandene TypeScript-Runtime gesetzt und anschließend entfernt; er wird nicht in das Release gepackt.
