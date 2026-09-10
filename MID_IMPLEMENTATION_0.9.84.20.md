# MID v0.9.84.20 – Release-Hotfix nach GitHub #975

## Extern
- Keine sichtbare Funktionsänderung gegenüber v0.9.84.19.
- Das Widget behält das exakt zweizeilige Wind-/Böenlayout.
- Die optionale ECMWF-Temperaturfärbung bleibt erhalten; neue Standard-Exporte und feste Live-Export-URLs nutzen sie weiterhin automatisch.

## Intern
- GitHub #975 hat `npm ci`, Dependency-Audit, TypeScript 7.0.2 und den Vite-8.2.2-Produktionsbuild erfolgreich abgeschlossen.
- Von 731 Regressionen scheiterten ausschließlich zwei ältere Strukturtests. Beide testeten keine meteorologische Fehlfunktion, sondern starre Quelltextfolgen, die durch das neue optionale `ecmwfTemperatureColors`-Prop nicht mehr zutrafen.
- `test-seven-day-ecmwf-hourly-09781.mjs` schützt jetzt die bedingte Farbwahl und zusätzlich den Standardwert `ecmwfTemperatureColors=true`.
- `test-widget-curve-overview-09845.mjs` prüft `showWind` und `ecmwfTemperatureColors` als unabhängige Props und hängt die Funktionsprüfung nicht mehr von ihrer Reihenfolge im JSX ab.
- Produktionscode, meteorologische Logik und Worker-Fachlogik wurden für diesen Hotfix nicht verändert.
