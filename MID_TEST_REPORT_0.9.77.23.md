# MID v0.9.77.23 – Testnachweis

## Gezielte Regressionen

Bestanden sind insbesondere:

- `scripts/test-weather-profile-skybar-pills-097723.mjs`
- `scripts/test-chart-layout-079.mjs`
- `scripts/test-weather-profile-story-axis-09750.mjs`
- `scripts/test-cloud-profile-structures-09740.mjs`
- `scripts/test-mid-weather-profile-thermal-sun-09320.mjs`
- `scripts/test-weather-profile-rolling-openmeteo-audit-09653.mjs`
- `scripts/test-weather-profile-mobile-compact-097612.mjs`
- `scripts/test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`
- `scripts/test-weather-profile-pressure-hazards-09656.mjs`
- `scripts/test-forecast-cockpit-pictograms-09100.mjs`
- `scripts/test-appwide-parameter-colors-09779.mjs`
- `scripts/test-knmi-eps-point-decoder-097722.mjs`
- `scripts/test-knmi-eps-wasm-feasibility-097723.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-aggregate-version-contract-09613.mjs`

Vier ältere Regressionen mit statischen Annahmen zur bisherigen Gesamtbewölkungs-Grauzeile beziehungsweise zur exakten Decoder-Einführungsversionsnummer wurden an den neuen, ausdrücklich gewünschten UI-Vertrag bzw. an Wartungsrelease-Kompatibilität migriert. Kein Produktionspfad wurde dafür zurückgerollt.

## Vollständiges portables Gate

Automatisch erkannt: **636** Regressionen.

- **531/531** in dieser Transportumgebung ausführbare Tests: bestanden.
- **105** ausschließlich an die nicht mitgelieferte lokale Projekttoolchain gebunden:
  - 86 × `typescript-strada`
  - 17 × projektlokale TypeScript-CLI / `--ignoreConfig`
  - 2 × `esbuild`
- **0** zusätzliche fachliche Regressionen.

Worker-, Service-Worker- und Aggregatsyntax sind grün. Der Worker v0.9.77.23 ist nach Normalisierung von `WORKER_VERSION` fachlich bytegleich zum v0.9.77.22-Worker; v0.9.77.22 war seinerseits gegenüber dem produktiv veröffentlichten v0.9.77.21-Worker fachlich unverändert. Daher entsteht durch dieses Release kein Worker-Deploybedarf.

Ein vollständiger TypeScript-7-/Vite-Produktionsbuild kann im Professional-Transportquellstand ohne `node_modules` nicht seriös lokal ausgeführt werden. Der normale GitHub-Installer installiert die gepinnte npm-Toolchain und bleibt dafür das autoritative Vollgate.
## Aktivierungs-Audit

Abschnitt 4/4 erzeugt in v0.9.77.23 bewusst keine neue Runtime, Binding- oder Worker-Fachänderung. Das Audit dokumentiert zusätzlich den neu identifizierten ecCodes-Wasm-/Free-Queue-Kandidaten, ohne ihn als Produktionsdependency oder Cloudflare-Ressource zu aktivieren. Das bleibt durch einen eigenen Machbarkeitsvertrag regressionsgeschützt.

