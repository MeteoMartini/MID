# MID v0.9.82.1 – Implementierung

## Anlass
GitHub Actions #939 baute v0.9.82.0 erfolgreich mit TypeScript 7.0.2 und Vite 6.4.3. Erst die Regressionssuite scheiterte in zwei Reiseplaner-Tests, deren statische Quelltext-Erwartungen noch den Klimadatenvertrag vor dem optionalen Böenfeld festschrieben.

## Änderung
- `test-travel-planner-08190.mjs` prüft jetzt Basisvariablen, optionales `wind_gusts_10m_max` und den vorhandenen Fallback getrennt.
- `test-travel-planner-request-budget-08191.mjs` prüft die aktuelle `makeParams(...)`-Konstruktion und stellt im normalen Basisabruf explizit sicher, dass das Böenfeld angefordert wird.
- Keine Änderung an `src/travelPlanner.ts`, `ClimatePanel.tsx`, Wetterdaten, Warnlogik oder Workerfachlogik.

## Release-Einordnung
Wartungsrelease v0.9.82.1, da ausschließlich die CI-/Regressionverträge an die bereits ausgelieferte Funktion v0.9.82.0 angepasst werden.
