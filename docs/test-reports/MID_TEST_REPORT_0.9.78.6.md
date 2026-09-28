# MID Test Report v0.9.78.6

Datum: 2026-09-03

## Geprüfter Vertrag

- DWD MOSMIX-Stundenmenge wird als lokaler Konsensanker eingelesen.
- Ein nasser RUC erhöht sein eigenes Niederschlagsgewicht nicht mehr.
- Ein isolierter RUC-Nassausreißer wird gegen Best Match + MOSMIX + RUC-EPS deutlich gedämpft.
- Ein von den Vergleichssignalen gestützter RUC bleibt wirksam.
- Ein trockener RUC wird durch den speziellen Nass-Ausreißerschutz nicht pauschal beschnitten.
- MOSMIX bleibt Postprocessing und keine zusätzliche unabhängige Modellstimme.
- Wettercode, Bewölkung und Sonnenschein werden nicht aus MOSMIX in das kohärente Wetterbündel gekreuzt.

## Regression

Neue Pflichtregression: `scripts/test-ruc-mosmix-precip-consensus-09786.mjs`.

Zusätzlich auf den neuen Vertrag migriert:

- `test-mosmix-adaptive-fusion-08330.mjs`
- `test-coherent-weather-bundles-08340.mjs`
- `test-priority-forecast-fusion-08320.mjs`
- `test-best-match-sunshine-suffix-strategy-08350.mjs`
- `test-forecast-precipitation-support-083317.mjs`

Die lokale Transportumgebung besitzt die projektgepinnte `typescript-strada`-Dependency nicht; dynamische Altregressionen, die diese lokale Dependency direkt require'n, bleiben deshalb hier transportbedingt blockiert. Die neuen statischen/dynamischen RUC-MOSMIX-Kerntests sind unabhängig davon ausführbar.
