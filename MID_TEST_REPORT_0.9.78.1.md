# MID Test Report v0.9.78.1

Datum: 2026-09-02

## Gegenstand

Appweiter Screenshot-3-Lock des Weather Icon System 2.0 sowie produktive 7-Tage-Stundenkurve mit gemeinsamer Temperatur-/Niederschlagsachse und ECMWF-inspirierter Absoluttemperaturskala.

## Direkte Regressionen

Bestanden:

- `test-weather-pictogram-standard-09780.mjs`
- `test-weather-pictogram-ui-lock-09781.mjs`
- `test-seven-day-ecmwf-hourly-09781.mjs`
- `test-witterung-seven-day-curve-097729.mjs`
- `test-climate-delta-badges-097728.mjs`
- `test-trend-seasonal-temperature-ui-097725.mjs`
- `test-tmin-tmax-number-tone-097717.mjs`
- `test-attachment-hazard-temperature-colors-097715.mjs`
- `test-parameter-color-contract-097711.mjs`
- `test-mid-09150-shortterm-hourly-thunder-changelog.mjs`
- `test-maintenance-modularization-09560.mjs`

## Fachliche Schutzpunkte

- Standalone-Wetterglyphen ohne integrierte alte Sky-Plate.
- Appweite CSS-Sperre gegen versehentliches Wiederaktivieren der Plate.
- Kanonische Niederschlagsphase für Tagespiktogramme in App und Forecast Cockpit.
- Sichtbare Differenz zwischen trockenen Sky-Zuständen und Regen-/Schauer-/Schneephasen.
- Tag/Nacht, Hell/Dunkel, WMO/SYNOP/METAR-Niederschlagsart und -intensität bleiben zentral geschützt.
- 7-Tage-Kurve verwendet echte stündliche Forecastwerte, gemeinsame 00/12-Achse und stündliche Niederschlagsbalken.
- ECMWF-inspirierte Absoluttemperaturfarben für Stundenkurve und Tages-Tmin/Tmax.
- Keine Klimadelta-Anzeige im 7-Tage-Modus; 14-Tage-Klimaanomalien bleiben bestehen.

## Vollregression

`run-regressions.mjs` erkennt **645** Regressionstests.

- **540** sind in dieser Transportumgebung fachlich ausführbar und grün.
- **105** bleiben durch exakt dieselbe bereits bei v0.9.78.0 dokumentierte Toolchain-/Dependency-Blockerklasse gesperrt. Der Vergleich der Fail-Listen v0.9.78.0 (643 Tests) gegen v0.9.78.1 (645 Tests) ergibt **keine neuen und keine verschobenen Fehler**.
- Die zwei neuen v0.9.78.1-Regressionsverträge sind beide grün.
- Die zwischenzeitlich ausgelöste Altvertragsabweichung `test-mid-09150-shortterm-hourly-thunder-changelog.mjs` war ausschließlich eine exakte Importzeilenannahme; sie wurde auf die erweiterte zentrale Temperaturfarblogik einschließlich ECMWF-Skala migriert und ist wieder grün.

## Build-/Toolchain-Hinweis

Die Transportumgebung startete ohne installierte Projektabhängigkeiten und global nur mit TypeScript 5.8.3. Ein Versuch `npm ci --ignore-scripts` endete mit einem Container-Transport-Timeout und hinterließ nur eine unvollständige Dependency-Struktur; diese wurde vor der ZIP-Erstellung vollständig entfernt. Ein vollständiger projektgepinnter TypeScript-7/Vite-Build ist deshalb hier nicht reproduzierbar. Die bekannte Blockerklasse (`typescript-strada`, fehlende Dependencies beziehungsweise `--ignoreConfig`) wird separat von fachlichen Regressionen ausgewiesen.

Worker und Service Worker wurden zusätzlich mit `node --check` syntaktisch geprüft. Die kanonischen Maintenance-Aggregate wurden vor der Vollregression neu erzeugt; `test-maintenance-modularization-09560.mjs` ist grün.

## Worker

`worker.js` wurde gegen die v0.9.78.0-Ausgangsbasis verglichen. Nach Normalisierung von `WORKER_VERSION` sind beide Dateien bytegleich; der normalisierte SHA-256 ist `d00525586f9062052425996984e7fe69919bd790629fb93a986604681098fb2d`. Es liegt **keine fachliche Workeränderung** vor.
