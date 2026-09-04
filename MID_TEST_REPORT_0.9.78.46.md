# MID Test Report v0.9.78.46

## Erfolgreich lokal geprüft
- `test-precipitation-forward-slot-presentation-097846.mjs`
- `test-precipitation-trailing-interval-nowcast-097810.mjs`
- `test-period-pictogram-consistency-097843.mjs`
- `test-seven-day-condition-label-consistency-097845.mjs`
- `test-weather-profile-skybar-pills-097723.mjs`
- `test-seven-day-ecmwf-hourly-09781.mjs`
- `test-seven-day-axis-badge-lock-09784.mjs`
- `test-seven-day-curve-night-band-097841.mjs`
- `test-daily-pop-period-fallback-09533.mjs`
- `test-appwide-parameter-colors-09779.mjs`
- `test-parallel-merge-skybar-phase-097839.mjs`
- `test-ensemble-deadline-watchdog-097835.mjs`
- `test-ensemble-fast-availability-097836.mjs`
- `test-ensemble-rate-budget-sunshine-097837.mjs`
- Berg-/Wintersport: Tageslicht/Zonen, Default-Collapse, Matrix-Wind/Niederschlag, Szenarioansicht, Persistenz, Profilplausibilität und Windnormalisierung.

Die geänderten TypeScript-/TSX-Dateien wurden zusätzlich mit `transpileModule` syntaktisch geprüft. Die lokal verfügbare globale TypeScript-Version ist 5.8.3 und ersetzt nicht den verbindlichen GitHub-TypeScript-7.0.2-Gate.

## Vollsuite
Ein vollständiger lokaler Regressionlauf wurde angestoßen, konnte in der isolierten Arbeitsumgebung jedoch nicht vollständig durchlaufen: mehrere bestehende Tests benötigen das nicht lokal installierte `typescript-strada`; weitere ältere Hilfstests erwarten die CI-TypeScript-CLI. Die bisher ausgeführten fachlichen v0.9.78.46- und angrenzenden statischen Regressionen sind grün. Der vollständige `npm ci`-/TypeScript-7-/Vite-/668-Regressions-Gate bleibt daher beim GitHub-Installer verbindlich.

## Worker
Keine fachliche Workeränderung in v0.9.78.46. Der Worker wird nur versionssynchron mit ausgeliefert; ein manueller Worker-Upload ist für diesen Fix nicht erforderlich.
