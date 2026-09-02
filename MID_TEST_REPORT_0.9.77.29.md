# MID Test Report v0.9.77.29

Datum: 2026-09-02

## Gegenstand

- Witterungstrend darf durch die ERA5-Klimatologie nicht mehr endlos im Ladezustand bleiben.
- Langfristmodellvertrag akzeptiert geeignete numerische Nicht-EPS-Beiträge bei unveränderter Unabhängigkeits-/Dublettenregel.
- Neue responsive 7-Tage-Kurvenübersicht oberhalb der kompakten Tageskarten.

## Direkte Prüfungen

Bestanden:

- `test-witterung-seven-day-curve-097729.mjs`
- `test-climate-delta-badges-097728.mjs`
- `test-seasonal-all-model-consensus-097727.mjs`
- `test-visible-app-internals-09751.mjs`
- `test-long-range-model-sources-09774.mjs`
- `test-trend14plus-09770.mjs`
- `test-trend14plus-climatology-097711.mjs`
- `test-forecast-cockpit-pictograms-09100.mjs`
- `test-seven-day-trend-weighting-071056.mjs`

`SubseasonalTrendPanel.tsx`, `ForecastCockpit.tsx`, `LongRangePanel.tsx` und `seasonalForecast.ts` wurden zusätzlich mit dem lokal vorhandenen TypeScript-Parser/Transpiler verarbeitet: keine Syntaxdiagnose.

Worker-Syntax:

- `node --check worker/metar-proxy.js`: bestanden.
- `node --check worker.js`: bestanden.

## Vollregression

`run-regressions.mjs` erkennt **642** Regressionstests.

- **537** sind in dieser Transportumgebung vollständig ausführbar und grün.
- **105** bleiben ausschließlich an der hier fehlenden projektgepinnten TypeScript-7-/`typescript-strada`-Toolchain bzw. der lokalen CLI-Inkompatibilität (`--ignoreConfig`) blockiert.
- Zwei zunächst zusätzlich rot gewordene Altregressionen enthielten wörtliche Erwartungen aus dem vorigen Ensemble-only-Textvertrag; sie wurden auf den gewünschten Nicht-EPS-Vertrag migriert und sind anschließend grün.

Damit gibt es keine verbleibende fachliche Regression aus v0.9.77.29 in den lokal ausführbaren Tests.

## Aggregate

`build-maintenance-aggregates.mjs` erfolgreich:

- Styles aus `styles-src` synchronisiert;
- Weather-Aggregat synchronisiert;
- Worker-Aggregate synchronisiert;
- Direct-Outlook-Aggregat synchronisiert.

## Worker-Vergleich

`worker.js` v0.9.77.29 wurde gegen das ausgelieferte v0.9.77.28-Workerarchiv verglichen. Nach Normalisierung von `WORKER_VERSION` sind Länge und SHA-256 identisch; keine funktionale Workeränderung.

## Ergebnis

Der Witterungsladefehler ist kausal abgesichert. Die neue 7-Tage-Kurvenübersicht verwendet den bestehenden MID-Daten-/Farb-/Piktogrammkern und ist für mobile Hoch-/Querformate sowie Desktop responsive. Der Langfristvertrag erlaubt künftig geeignete Nicht-EPS-Beiträge ohne Doppelgewichtung.
