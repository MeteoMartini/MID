# MID Implementation v0.9.78.12

Datum: 2026-09-03

## Anlass

GitHub Release-Run #850 bestand `npm ci`, Dependency-Audit, TypeScript 7 und den Vite-Produktionsbuild. Der Release wurde anschließend ausschließlich durch drei supersedierte Regressionserwartungen blockiert.

## Umsetzung

- `test-short-term-rounding-wind-layout-08221.mjs` auf den seit v0.9.78.10 gültigen trailing-interval-Vertrag migriert. Das erste laufende Viertelstundenintervall darf kürzer als 15 Minuten sein und bildet nur den noch zukünftigen Anteil ab jetzt ab.
- `test-sunshine-precipitation-coherence-096613.mjs` auf die aktuelle, fachlich identische PoP-Erläuterung migriert: Wahrscheinlichkeit ist keine Regendauer.
- `test-weather-profile-cell-gaps-day-wind-pin-097620.mjs` auf die tatsächlich aktive intervalgebundene `profileBandGeometry` umgestellt. Der in v0.9.78.11 entfernte unbenutzte `probabilityCellGeometry`-Helper wird nun ausdrücklich verboten statt gefordert.

## Fachlicher Umfang

Keine Produktionslogik wurde geändert. Die Niederschlags-Intervall-, Radar/NWP-Blend-, Sonnenschein- und 24-h-Profil-Fachlogik aus v0.9.78.10/v0.9.78.11 bleibt unverändert.
