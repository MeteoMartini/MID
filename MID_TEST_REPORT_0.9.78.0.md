# MID Test Report v0.9.78.0

Datum: 2026-09-02

## Gegenstand

Appweite Einführung des Wetterpiktogramm-Standards 2.0 mit Tag/Nacht-, Hell/Dunkel-, Niederschlagsart- und Intensitätssemantik sowie Entfernung des verbliebenen Forecast-Emoji-Hilfspfads.

## Direkte Prüfungen

Bestanden:

- `test-weather-pictogram-standard-09780.mjs`
- `test-witterung-seven-day-curve-097729.mjs`
- `test-current-nowcards-responsive-096612.mjs`
- `test-maintenance-modularization-09560.mjs`
- `test-release-lineage.mjs`
- `test-versioning.mjs`
- `test-baseline-079526-contract.mjs`
- `test-route-weather.mjs`
- `test-forecast-cockpit-pictograms-09100.mjs`
- `test-ui-polish-night-icons-09145.mjs`
- `test-night-icons-astronomy-08130.mjs`
- `test-detail-pictograms.mjs`
- `test-weather-pictogram-cloud-forms-09143.mjs`
- `test-forecast-inline-precip-types-09132.mjs`
- `test-weather-profile-longrange-ui-097716.mjs`

Die drei älteren Stringverträge `test-ui-polish-night-icons-09145.mjs`, `test-weather-pictogram-cloud-forms-09143.mjs` und `test-weather-profile-longrange-ui-097716.mjs` wurden ohne Abschwächung auf den erweiterten zentralen Renderer beziehungsweise den neuen Funktionsversionszweig v0.9.78.x migriert. `test-weather-pictograms-country-codes-08230.mjs` wurde auf getrennten stratiformen und konvektiven Misch-Niederschlag aktualisiert, bleibt in dieser Transportumgebung aber wie zuvor durch die fehlende projektgepinntte TypeScript-Toolchain blockiert.

## Syntax und Aggregate

Bestanden:

- `build-maintenance-aggregates.mjs`: Styles, Weather, Worker und Direct-Outlook aus ihren kanonischen Teilquellen neu erzeugt.
- `node --check worker.js`
- `node --check worker/metar-proxy.js`
- `node --check public/sw.js`
- `node --check public/service-worker.js`
- isolierter `tsc --noEmit`-Check von `WeatherPictogram.tsx`: ohne Diagnose.

## Vollregression

`run-regressions.mjs` erkennt nun **643** Regressionstests.

- **538** sind in dieser Transportumgebung fachlich ausführbar und grün.
- **105** bleiben – identisch zur bereits dokumentierten Baselineklasse – durch die hier fehlende projektgepinnte TypeScript-7-/`typescript-strada`-Toolchain beziehungsweise die lokale CLI-Inkompatibilität (`--ignoreConfig`) blockiert.
- Gegenüber v0.9.77.29 kommt genau der neue Wetterpiktogramm-Vertragstest hinzu und ist grün.
- Nach Migration der drei genannten Altverträge verbleibt keine zusätzliche lokal ausführbare Regression aus v0.9.78.0.

## Fachliche Piktogrammprüfung

Der neue Vertrag schützt insbesondere:

- Forecastcode → Wetterzustand und Intensität;
- Sprühregen, gefrierenden Sprühregen, Regen, gefrierenden Regen, Schnee, Schneegriesel, Schauer, Schneeschauer und gemischte Niederschläge;
- synoptische Present-Weather-Kürzel für SYNOP/BUFR/METAR einschließlich `DZ`, `SG`, `IC`, `PL`, `GS`, `GR`, `SQ` und `FC`;
- geometrisch unterscheidbare Intensitäten statt reiner Farbskalierung;
- Tag/Nacht und zentralen Hell-/Dunkelmodus;
- Synchronität des modularen Style-Aggregats;
- Entfernung des historischen `weather.icon()`-Emoji-Pfads aus Wetterkern und Routenmodell;
- Binding von Standard und Regression in `MID_BASELINE.json`.

## Worker-Vergleich

`worker.js` v0.9.78.0 wurde gegen die hochgeladene v0.9.77.29-Basis verglichen. Nach Normalisierung von `WORKER_VERSION` sind Inhalt und SHA-256 identisch (`6d5a44d73b01123c9bd73190638edf986a476f431334b7f965c9ff9cbc008d5a`). Es liegt keine fachliche Workeränderung vor.

## Ergebnis

Der Wetterzustandsrenderer ist als verbindlicher appweiter Standard geschützt. Niederschlagsart und -stärke, Tag/Nacht und Hell/Dunkel bleiben auch in kleinen Darstellungen semantisch unterscheidbar. Keine fachliche Workeränderung.
