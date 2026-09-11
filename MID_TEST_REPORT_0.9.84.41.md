# MID v0.9.84.41 – Prüfbericht

## Wetterpiktogramme und Niederschlagsphase

Bestanden wurden unter anderem:

- `scripts/test-weather-pictogram-appwide-contract-098441.mjs`
- `scripts/test-day-precipitation-color-contract-098435.mjs`
- `scripts/test-appwide-precipitation-and-daily-heat.mjs`
- `scripts/test-pictogram-intensity-snow-depth-098426.mjs`
- `scripts/test-maplibre-precip-probability-09390.mjs`
- `scripts/test-radar-phase-solid-symbols-09414.mjs`
- `scripts/test-composite-phase-grammar-09395.mjs`
- `scripts/test-precipitation.mjs`
- `scripts/test-composite-precipitation-type-layer-09366.mjs` nach Aktualisierung der veralteten Literal-Erwartung auf die getrennten Codes 76/77/78/79.

Weitere vorhandene Piktogramm-/Kurzfrist-/Cockpit-Regressionen liefen ebenfalls grün, soweit sie keine frische npm-Testabhängigkeit erfordern.

## Widget-Bildexport

Bestanden wurden:

- `scripts/test-widget-svg-export-paints-098441.mjs`
- `scripts/test-widget-curve-overview-09845.mjs`
- `scripts/test-seven-day-curve-night-band-097841.mjs`
- `scripts/test-widget-wind-temperature-export-098419.mjs`
- `scripts/test-widget-render-readiness-098424.mjs`

Der neue Test schützt insbesondere, dass die Kurvenübersicht keine `fill="var(--mg-night)"`-Abhängigkeit im Nachtband mehr besitzt, alle relevanten SVG-Paints vor `html-to-image` aufgelöst werden und der Live-DOM nach dem Export wiederhergestellt wird.

## Lokale Toolchain-Grenze

Die lokale Laufzeit besitzt keinen vollständigen frisch installierten `node_modules`-Stand. `vite` und der gepinnte Test-Alias `typescript-strada` fehlen; ein lokal vorhandener älterer TypeScript-Aufruf war zudem nicht mit der aktuellen Projekttoolchain deckungsgleich. Deshalb wurden Tests bzw. Builds, die eine frische `npm ci`-Installation voraussetzen, lokal nicht als Release-Gate gewertet. Beispiel: `test-weather-pictograms-country-codes-08230.mjs` kann ohne `typescript-strada` nicht starten; `test-detail-pictogram-precipitation.mjs` verwendet die für die aktuelle Projekttoolchain vorgesehene `--ignoreConfig`-Option. Auch `npm run verify:vite` kann ohne lokales `node_modules/vite` nicht starten.

Der GitHub-Installer führt vor Veröffentlichung weiterhin `npm ci`, TypeScript-/Vite-Build und die vollständige Regression mit der im Lockfile festgelegten Toolchain fail-closed aus.
