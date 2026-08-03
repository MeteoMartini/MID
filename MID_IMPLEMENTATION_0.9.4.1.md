# MID v0.9.4.1 – TypeScript-Produktionsbuildfix

## Ursache

Der GitHub-Produktionsbuild von v0.9.4.0 brach unter `noUnusedLocals`/`noUnusedParameters` mit drei `TS6133`-Diagnosen ab:

- `quartileFill` in `src/EnsemblePanel.tsx`
- `weatherFamily` in `src/ForecastCockpit.tsx`
- der nicht mehr verwendete Parameter `frame` in `mapBounds` in `src/SynopticPanel.tsx`

## Korrektur

- Die ungenutzte Quartils-Farbvariable wurde entfernt; die aktive Quartilsdarstellung verwendet weiterhin den bereits vorhandenen Unsicherheitsgradienten.
- Die nach der zentralen Niederschlagsplausibilisierung nicht mehr benötigte lokale Funktion `weatherFamily` wurde entfernt.
- `mapBounds` akzeptiert nur noch die tatsächlich verwendeten Argumente `location`, `candidates` und `stations`; der Aufruf wurde entsprechend angepasst.

Die meteorologische, grafische und responsive Funktionalität von v0.9.4.0 bleibt unverändert.

## Regression

Der neue Schutzvertrag `scripts/test-build-unused-symbols-0941.mjs` verhindert die Wiedereinführung der drei Buildfehler.

## Worker

Keine funktionale Workeränderung. Nur Versionssynchronisation auf v0.9.4.1.
