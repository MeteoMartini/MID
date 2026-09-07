# MID v0.9.79.12 – CI-Regressionsfix nach Release #923

## Ursache
Der TypeScript-/Vite-Produktionsbuild von v0.9.79.11 war erfolgreich. Vier historische Quelltext-Regressionen suchten die Wetterregime-Klassifikation jedoch weiterhin direkt in `ForecastCockpit.tsx`, obwohl sie in v0.9.79.11 bewusst in `forecastRegime.ts` zentralisiert wurde.

## Korrektur
- `test-day-following-night-boundaries-09155.mjs` prüft die Schauerklassifikation nun im gemeinsamen Regimehelfer und zusätzlich dessen Nutzung durch das Cockpit.
- `test-ensemble-cockpit-clarity-0950.mjs` schützt `forecastRegimeLabel` und die zentrale Fachlogik statt der entfernten lokalen Funktion.
- `test-forecast-cockpit-0920.mjs` erkennt den gemeinsamen Regimevertrag.
- `test-seven-day-orientation-layout-09640.mjs` prüft die zentrale Farbableitung `--mid-weather-regime-accent` und die ausgelagerte Bezeichnungslogik.

## Wirkung
Keine meteorologische oder visuelle Rücknahme. Die in v0.9.79.11 eingeführte zentrale Wetterregime-Logik bleibt unverändert; ausschließlich veraltete Regressionserwartungen werden auf den neuen Architekturvertrag ausgerichtet.

Keine fachliche Workeränderung.
