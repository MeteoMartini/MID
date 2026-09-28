# MID v0.9.84.35 – Implementierungsnotiz

## Tagesansicht / Niederschlagsfarben
- `src/styles-src/00-foundation.css`: zentrale Phasentokens für Schnee/Graupel, Misch-/Gefrierphase und Gewitter/Hagel ergänzt; Light/Dark getrennt kontrastiert.
- `src/precipitationPhaseColor.ts`: gemeinsame TS-Farblogik auf diese Tokens umgestellt; Hagelschauer gehören zur Purpur-/Sturmfamilie, Graupel zur hellblauen Schnee-/Graupelfamilie.
- `src/App.tsx`: SVG-Füllmuster der Tagesansicht an die zentrale Palette gebunden. Regenschauer bleiben blau; gefrierender Niederschlag und Schneeregen violett; Hagel purpur. Eigene Muster für Graupel/Hagel.
- `src/styles-src/00-foundation.css` und `src/styles-src/30-modern.css`: Legendenmuster auf denselben Vertrag umgestellt.
- `MID_PARAMETER_COLOR_CONTRACT.md` um den expliziten Phasenvertrag für Tagesansicht/Skybar erweitert.

## Vorheriger v0.9.84.34-Stand
- Update-/Startup-Recovery-Härtung, Quellenübersicht, Event-PoP-Lückenbehandlung und iOS-26/27-Designphase bleiben unverändert enthalten.

## Regressionen
- Neue Regression `scripts/test-day-precipitation-color-contract-098435.mjs`.
- `scripts/test-parallel-merge-skybar-phase-097839.mjs` an die zentralen Farbtokens angepasst.
