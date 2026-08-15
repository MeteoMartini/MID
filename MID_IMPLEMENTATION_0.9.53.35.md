# MID v0.9.53.35

## Produktionsbuild-Fix
- Behebt den GitHub-Actions-/TypeScript-Abbruch `TS6133` in `src/eventWeatherRefresh.ts` aus dem v0.9.53.34-Kandidaten.
- Der nach der Event-Lifecycle-Umstellung nicht mehr verwendete Typimport `EventCenterRecord` wurde entfernt.
- Die Event-Lifecycle-Funktionalität aus v0.9.53.34 bleibt unverändert: abgelaufene Events werden nicht automatisch wetterseitig refreshed.
- Neue Required Regression: `scripts/test-event-refresh-buildfix-095335.mjs`.

## Release-Linie
- v0.9.53.34 scheiterte im Produktions-Typecheck vor Commit/Pages-Deployment; `mid-stable` blieb deshalb v0.9.53.33.
- v0.9.53.35 ist der korrigierte Release-Kandidat, der die funktionalen Änderungen von v0.9.53.34 vollständig fortführt.
