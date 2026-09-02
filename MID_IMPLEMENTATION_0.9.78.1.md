# MID Implementation v0.9.78.1

Datum: 2026-09-02

## Ziel

Screenshot-3-Design des MID Weather Icon System 2.0 tatsächlich appweit verriegeln und die 7-Tage-Kurvenübersicht so nah wie im produktiven MID-Code sinnvoll an das freigegebene Konzept mit gemeinsamer Stundenachse annähern.

## I. Appweiter Wetterpiktogramm-Lock

- `src/WeatherPictogram.tsx` rendert Wetterglyphen standardmäßig **standalone** (`plain=true`). Die frühere integrierte Sky-Plate ist kein Bestandteil eines Wetterpiktogramms mehr.
- `src/styles-src/10-features.css` enthält zusätzlich einen fail-closed UI-Lock: `.mid-weather-pictogram .mid-weather-skyplate{display:none!important}`. Damit kann auch ein versehentlich alter Aufruf die quadratische Piktogrammplatte nicht zurückbringen.
- Sonne/Mond werden nur noch dort mitgeführt, wo sie meteorologisch Teil des Symbols sind (z. B. heiter/wechselnd bewölkt oder Schauer). Stratiformer Regen, Schnee und Nebel erhalten keinen irreführenden identischen Himmelskörper-Hintergrund.
- `src/App.tsx` und `src/ForecastCockpit.tsx` wählen repräsentative Tagespiktogramme aus `precipitationParts(hour).displayCode`. Eine Niederschlagsphase kann damit nicht mehr durch einen rohen cloud-only Stunden-Wettercode optisch überschrieben werden.
- Bei Konflikt zwischen repräsentativer Sky-Stunde und niederschlagsgeprägtem Tagescharakter darf der niederschlagsgeprägte Fallback das reine Sky-Symbol ersetzen. Dadurch bleiben z. B. „Regenschauer“ und „sonnig“ sichtbar verschieden.
- Der vorhandene WMO/SYNOP/METAR-Zustandsraum bleibt erhalten: Sprühregen, Regen, gefrierende Formen, Schauer, Schnee, Schneegriesel, Schneeschauer, Mischformen, Eiskristalle, Eiskörner, Graupel, Hagel, Gewitter usw. einschließlich Intensität.

## II. 7-Tage-Temperaturtrend und Niederschlag

- `SevenDayCurveOverview` arbeitet nun primär mit den **echten stündlichen `Hour`-Werten** der sichtbaren sieben Tage und nicht mehr mit einer aus Tages-Min/Max konstruierten Kurve.
- Temperatur und Niederschlag teilen exakt dieselbe kontinuierliche 7×24-h-x-Achse.
- Die Achse zeigt 00/12-Stundenmarken, Tagesgrenzen und zentrierte Tageslabels.
- Niederschlag wird stündlich und zur jeweiligen Stunde aus `precipitationParts(hour).total` als Balken dargestellt.
- Die Temperaturkurve ist geglättet, hat einen dezenten Unsicherheits-/Kontrasthalo und horizontale Temperatur-Hilfslinien in 5-K-Schritten.
- `src/temperatureTone.ts` enthält eine zentral interpolierte ECMWF-inspirierte **absolute Temperaturskala** von kalt-violett/blau über grün/gelb/orange bis rot/dunkelrot. Die Kurve erhält einen x-abhängigen SVG-Verlauf aus den tatsächlichen Stundenwerten.
- Tages-Minimum, Tages-Maximum und deren Rangebar verwenden im 7-Tage-Modus dieselbe ECMWF-Skala.
- Im 7-Tage-Modus werden **keine Abweichungen zum Klimamittel** (`±K`, `Δ`) mehr angezeigt. Die 14-Tage-Ansicht behält ihre Klimamittel-/Anomalielogik.
- Mobile/iPhone-, Tablet- und Desktopregeln sind im kanonischen Stylemodul `src/styles-src/30-modern.css` verankert und werden in `src/styles.css` aggregiert.

## III. Verbindliche Verträge

- `MID_WEATHER_PICTOGRAM_STANDARD.md`: Screenshot-3-Lock, standalone SVG-Glyphen und Phasenkohärenz appweit festgeschrieben.
- `MID_PARAMETER_COLOR_CONTRACT.md`: 7-Tage-ECMWF-Absoluttemperatur und gemeinsame Stundenachse als explizite Nachfolgeregel zu den früheren 7-Tage-Klimadelta-Regeln festgeschrieben; 14 Tage bleiben unberührt.
- `MID_SOURCE_OF_TRUTH.md`: beide Änderungen als verbindlicher v0.9.78.1-Projektstand verankert.

## IV. Regressionen

Neue Schutztests:

- `scripts/test-weather-pictogram-ui-lock-09781.mjs`
- `scripts/test-seven-day-ecmwf-hourly-09781.mjs`

Historische 7-Tage-/Temperaturverträge wurden nur dort auf die neue explizite v0.9.78.1-Nachfolgeregel migriert, wo die alte 7-Tage-Klimadelta- oder Importzeilenannahme fachlich überholt wurde. Die 14-Tage-Klimaanomalien bleiben regressionsgeschützt.

## Worker

Keine fachliche Workeränderung. Die Workerquellen werden nur auf die Releaseversion synchronisiert; Forecast-, Radar-, RUC-, Ensemble-, Warn- und Quellenlogik des Workers bleiben unverändert.
