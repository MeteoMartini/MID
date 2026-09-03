# MID Test Report v0.9.78.5

Datum: 2026-09-03

## GitHub-Referenz

Analysiert: Run #843, Run-ID `33715805828`.

Im GitHub-Runner waren erfolgreich:

- sichere Release-ZIP-Prüfung,
- reproduzierbares `npm ci`,
- Produktions-Dependency-Audit mit 0 Schwachstellen,
- TypeScript 7.0.2,
- Vite 6.4.3 Produktionsbuild,
- 645 von 646 Regressionen.

Einziger Fehler:

- `scripts/test-tmin-tmax-number-tone-097717.mjs`

Fehlermeldung: `Kästchenhintergrund und Rahmen müssen mit der Klimaabweichung reagieren.`

## Korrektur

Der Test erwartet nun die seit v0.9.78.4 verbindliche abgeschwächte Tönung und prüft weiterhin die fachliche Klimareaktion der 14-Tage-Ansicht sowie den ECMWF-Absolutvertrag der 7-Tage-Ansicht.

Direkt nach der Migration grün:

- `scripts/test-tmin-tmax-number-tone-097717.mjs`
- `scripts/test-seven-day-axis-badge-lock-09784.mjs`
- `scripts/test-seven-day-ecmwf-hourly-09781.mjs`
- `scripts/test-climate-delta-badges-097728.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-release-lineage.mjs`

## Befund

Keine Produktionslogik musste zurückgebaut oder verändert werden. Der Fehler aus Run #843 war ausschließlich ein veralteter Regressionserwartungswert.
