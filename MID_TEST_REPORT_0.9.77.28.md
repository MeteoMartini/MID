# MID Test Report v0.9.77.28

Datum: 2026-09-02

## Gegenstand

Wiederherstellung der sichtbaren individuellen Tmin-/Tmax-Abweichungen zum Klimamittel und der daraus abgeleiteten Intensitätsstufen in 7-/14-Tage-Übersichten.

## Direkte Prüfungen

Bestanden:

- `test-climate-delta-badges-097728.mjs`
- `test-trend-seasonal-temperature-ui-097725.mjs`
- `test-tmin-tmax-number-tone-097717.mjs`
- `test-seven-day-trend-weighting-071056.mjs`
- `test-forecast-summary-landscape.mjs`
- `test-forecast-cockpit-pictograms-09100.mjs`
- `test-mid-09150-shortterm-hourly-thunder-changelog.mjs`

Zusätzlich wurden `App.tsx`, `ForecastCockpit.tsx`, `temperatureTone.ts` und das generierte `weather.ts` mit dem lokal vorhandenen TypeScript-Parser/Transpiler ohne Syntaxdiagnose verarbeitet.

## Vollregression vor Versionssynchronisierung

641 automatisch erkannte Regressionstests. Nach Migration der zwei veralteten Erwartungsverträge bleiben 105 Tests ausschließlich durch die in dieser Transportumgebung fehlende projektgepinntte TypeScript-7-/`typescript-strada`-Toolchain bzw. deren CLI-Kompatibilität blockiert. Damit bleiben 536 in dieser Umgebung fachlich ausführbare Tests grün. Der neue Klimamitteltest ist zusätzlich zu den 535 bereits in v0.9.77.27 ausführbaren Tests grün.

## Aggregate

`build-maintenance-aggregates.mjs` erfolgreich: Styles und Weather wurden aus den kanonischen Teilquellen neu erzeugt. Die Stale-Klimacache-Logik liegt deshalb sowohl in `weather-src/30-ensemble-climate-hazards.tsfrag` als auch bytekonsistent im generierten `weather.ts`.

## Ergebnis

Die im Screenshot beobachtete fehlende Klimaabweichung ist kausal behoben: der Klimadatenabruf hängt nicht länger von der optionalen Summary-Anzeige ab und die individuellen ±K-Werte sind direkt in den Tmin-/Tmax-Kästchen sichtbar. Keine funktionale Workeränderung.
