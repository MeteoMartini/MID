# MID Test Report v0.9.78.10

Datum: 2026-09-03

## Prüfgegenstand

Niederschlags-Akkumulationszeit, Radar-NWP-Blend und „ab jetzt“-Bilanzierung nach dem Live-Fall 53859/Mondorf.

## Direkt geprüfte Verträge

- `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs`
- `scripts/test-weather-profile-rolling-openmeteo-audit-09653.mjs`
- `scripts/test-mid-weather-profile-full-24h-09350.mjs`
- `scripts/test-weather-profile-hourly-snowline-09352.mjs`
- `scripts/test-weather-profile-story-axis-09750.mjs`
- `scripts/test-shortterm-point-nowcast-k3d-placement-091512.mjs`

## Synthetischer Mengencheck

Für einen Modellwert von 4,4 mm / 98 % im Stundenintervall 12:00–13:00 und `now=12:33` wurde der zentrale Radarblend separat ausgeführt:

- hochwertige, durchgehend trockene Standort-Radarstrecke: ca. 0,333 mm, Radarmengengewicht ca. 0,92;
- hochwertige Nah-Echo-Lage ohne Standorttreffer: ca. 0,693 mm, Radarmengengewicht ca. 0,84; die PoP bleibt als separates Umfeldsignal erhalten.

Der zurückgegebene Radar-Intervallstempel lautet dabei korrekt 12:00–13:00 und nicht mehr 12:30–13:30.

## Syntax-/Transpilationsprüfung

`forecastFusion.ts`, `ShortTermForecast.tsx` und `ForecastCockpit.tsx` wurden mit TypeScript-Transpile ohne Syntaxdiagnose geprüft.

## Erwarteter Releasezustand

Der GitHub-Installer führt zusätzlich den projektgepinnten TypeScript-/Vite-Vollbuild und die vollständige Regression aus. Lokale Tests, die `typescript-strada` voraussetzen, können in der Transportumgebung weiterhin der bekannten Toolchain-Blockerklasse angehören; der neue Fachtest selbst benötigt diese Dependency nicht.
