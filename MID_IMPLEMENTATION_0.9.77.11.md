# MID v0.9.77.11 – Trendklimatologie und verbindlicher Parameter-Farbvertrag

## Anlass

1. Im Witterungstrend Tag 15–46 fehlten Klimareferenzwerte insbesondere für Niederschlag und Wind; der bisherige Archivabruf zwang alle Parameter auf `era5_land`.
2. Das appweite Parameterfarbkonzept war im 24-h-Wetterprofil und in den 7-Tage-Tagesansichten noch nicht vollständig wirksam. Lokale Farbaliases, absolute Temperaturfarbskalen und Klimaabweichungsfarben konnten die kanonische Parameteridentität übersteuern.

## Umsetzung

### Trend 14d+

- Klimareferenz 1991–2020 nutzt primär `era5_seamless`.
- Bei Abruffehler wird fachlich getrennt zurückgefallen:
  - Tmax/Tmin: `era5_land`
  - Niederschlag, MSL-Luftdruck, Bewölkung und 10-m-Wind: `era5`
- Der Klimacache wurde auf `mid:subseasonal-climatology:1991-2020:v3` migriert, damit alte leere ERA5-Land-Atmosphärenwerte nicht wiederverwendet werden.
- Kein Parameter wurde entfernt, weil die historischen Felder grundsätzlich verfügbar sind.

### Appweite Parameterfarben

- Neuer verbindlicher Vertrag: `MID_PARAMETER_COLOR_CONTRACT.md`.
- 24-h-Wetterprofil verwendet die zentralen `--param-*`-Tokens für Temperatur, Tmin/Tmax, Taupunkt, Niederschlag, Wind, Böen, Luftdruck und Bewölkung.
- Die lokale absolute Temperatur-Farbgradientenskala im 24-h-Profil wurde für tatsächliche Temperaturwerte entfernt.
- Normale Windrichtungspfeile bleiben in der Windfarbe; Warnstufen dürfen weiterhin die Warnfarbe übersteuern.
- 7-Tage-Tmin/Tmax werden nicht mehr durch Klimaabweichungsfarben überschrieben. Klimaeinordnung darf im Tooltip erhalten bleiben, die sichtbare Parameteridentität bleibt Tmin blau / Tmax rot.
- Niederschlag, Sonnenscheindauer, Wind und normale Böenangabe der 7-Tage-Karten verwenden die zentralen Tokens.
- Die aufgeklappte 7-Tage-Tagesansicht folgt demselben Vertrag.
- Klimaabweichung, thermisches Empfinden, Wetterregime und Warnstufen bleiben ausdrücklich gekennzeichnete semantische Zusatzkanäle.

## Regression

- `scripts/test-appwide-parameter-colors-09779.mjs` wurde auf 24-h-Profil und 7-Tage-Ansichten erweitert.
- Neu: `scripts/test-parameter-color-contract-097711.mjs`.
- Neu: `scripts/test-trend14plus-climatology-097711.mjs`.

## Architektur / Worker

- Gemeinsamer Browser-/PWA-/iOS-Fachkern bleibt unverändert erhalten.
- Keine neue Backend-/Worker-Funktion.
- Reine Versionssynchronisierung im Worker ist semantisch neutral; ein Worker-Upload ist für diese Änderung nicht erforderlich.
