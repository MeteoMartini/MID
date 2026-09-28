# MID Test Report v0.9.77.27

Datum: 2026-09-02

## Gegenstand

Vollständiger Saison-/Langfristmodell-Pool mit kanonischer Modellidentität, gleichgewichteter Poor-Man’s-Ensemble-Logik und sparsamer NOAA-NMME-Punktentnahme.

## Quellen-/Modellprüfung

- C3S Seasonal: 10 aktuelle operationelle Systeme getrennt modelliert; ECCC System 4 und 5 bleiben eigenständige numerische Systeme.
- NOAA NMME: dynamische Modellfindung aus dem jeweils neuesten `ENSMEAN`-Lauf; aktueller Lauf `2026080800` enthält sechs gemeinsame `tmp2m`/`prate`-Systeme.
- ECMWF/Open-Meteo bleibt Fallback, erhält bei vorhandenem C3S-SEAS5 keine zweite ECMWF-Stimme.
- WMO LC-LRFMME, APCC, CanSIPS und DWD EPISODES wurden geprüft, aber wegen Zugangsgate, abweichender Zeitachse oder Doppelgewichtungsrisiko nicht als ungeprüfte Zusatzstimmen eingemischt.

## Neue Regression

`scripts/test-seasonal-all-model-consensus-097727.mjs`

Geprüft werden insbesondere:

- zehn getrennte C3S-Systeme;
- kanonische `modelKey`-/`independenceKey`-Identitäten;
- C3S > NOAA NMME > direkter Fallback als Quellenpriorität derselben Modelllinie;
- keine Doppelgewichtung von CFSv2, ECCC GEM5.2-NEMO, CanESM5-Linie und ECMWF SEAS5;
- getrennte Stimmen für NCAR CESM1 und NCAR CCSM4;
- dynamische NOAA-NMME-Modellfindung ohne starre Whitelist;
- Sparse-/HTTP-Multi-Range-NMME-Punktentnahme mit Volldownload-Fallback;
- UI ohne theoretische Modell-/Gateway-Kästchen;
- Single-Model-Fallback aus v0.9.77.26 bleibt erhalten.

## Relevante Tests

Bestanden:

- `test-seasonal-all-model-consensus-097727.mjs`
- `test-long-range-model-sources-09774.mjs`
- `test-seasonal-c3s-dwd-ui-09410.mjs`
- `test-trend-seasonal-temperature-ui-097725.mjs`
- `test-long-range-grid-ensemble-colors-09332.mjs`
- `test-model-family-consistency-09416.mjs`
- `test-true-multimodel-snowline-09350.mjs`
- `test-release-lineage.mjs`
- `test-aggregate-version-contract-09613.mjs`
- `test-maintenance-modularization-09560.mjs`
- `test-release-upload-budget-097410.mjs`

## Vollregression

640 Regressionstests erkannt. 535 in dieser Transportumgebung ausführbare Tests bestanden. 105 Tests bleiben durch die fehlende projektgepinntte TypeScript-7-/`typescript-strada`-Toolchain blockiert. Der erneute `npm ci --no-audit --no-fund`-Versuch scheiterte reproduzierbar am externen DNS/Registry-Zugriff (`EAI_AGAIN` gegen `registry.npmjs.org`), nicht an einem npm-/Quellcodefehler.

## Syntax / Aggregate

- `seasonalForecast.ts`, `LongRangePanel.tsx` und `LongRangeModelComparison.tsx` mit dem lokal verfügbaren TypeScript-Parser/Transpiler syntaktisch grün.
- `npm run sync-version` erfolgreich.
- `npm run maintain:aggregates` erfolgreich; Styles-, Weather- und Worker-Aggregate bytegleich aus ihren kanonischen Teilquellen erzeugt.
- `node --check` für `worker-src/00-core-observations.js`, `worker/metar-proxy.js`, `worker.js`, `public/service-worker.js` und `public/sw.js` grün.
- Direkter Live-Range-Test aus dem Container war wegen desselben temporären DNS-Gates nicht möglich; der Worker besitzt deshalb bewusst einen fail-safe Volldownload-Fallback, falls Range/Multi-Range am Origin nicht nutzbar ist.

## Ergebnis

Die Saisonmodellvereinigung ist als v0.9.77.27 releasefähig vorbereitet. Die Worker-Fachlogik ist verändert; der Worker muss zusammen mit dem Professional-Release aktualisiert werden. Keine neue Cloudflare-Ressource und keine kostenpflichtige Quelle wird aktiviert.
