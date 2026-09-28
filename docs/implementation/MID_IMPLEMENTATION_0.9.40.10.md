# MID v0.9.40.10

CI-/Regressionsfix auf Basis v0.9.40.9.

- `test-composite-phase-grammar-09395.mjs`: Schutzvertrag wiederhergestellt – unsichere bzw. eingeschränkt sichere Radar-/Modellphasen bleiben transparent; keine künstliche Rasterunterteilung.
- `test-maplibre-precip-probability-09390.mjs`: DWD-24-h-Terminologie und geschützte Radarphasen-Schwellen wieder hergestellt.
- `test-no-clipped-weather-values-09394.mjs`: kompakter Best-Match-Fallback wieder `bis x %`.
- Echo-Recovery bleibt erhalten, aber fachlich konservativ: 3×3 OPERA-Abtastung innerhalb jeder Modellzelle und nur bei starkem Radar-Echo plus eindeutigem thermischem Signal eine zusätzliche Regen-/Schnee-Zuordnung.
