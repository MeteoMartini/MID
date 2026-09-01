# MID v0.9.77.11 – Testbericht

## Änderungsumfang

- Trend-14d+-Klimareferenz: ERA5-Seamless 1991–2020 mit fachlich getrenntem ERA5-Land/ERA5-Fallback.
- Neuer verbindlicher `MID_PARAMETER_COLOR_CONTRACT.md`.
- 24-h-Wetterprofil und 7-Tage-Tagesansichten auf zentrale Parameterfarben vereinheitlicht.

## Prüfstatus

- `test-trend14plus-climatology-097711.mjs`: 11/11 Checks grün.
- `test-parameter-color-contract-097711.mjs`: 20/20 Checks grün.
- `test-appwide-parameter-colors-09779.mjs`: 17/17 Checks grün.
- `test-trend14plus-09770.mjs`: 33/33 Checks grün.
- `test-parameter-colors-trend14plus-09771.mjs`: 18/18 Checks grün.
- Release-Lineage und Release-Uploadbudget grün.
- Worker-Syntax (`node --check`) grün.
- Gesamtsuite lokal: 517/623 grün; 106 Ausfälle ausschließlich wegen fehlendem `typescript-strada` bzw. unvollständiger lokaler Type-Pakete.
- `npm ci --prefer-offline` konnte in der isolierten Laufzeit wegen Transport-Timeout nicht abgeschlossen werden.

## Fachliche Entscheidung

Luftdruck, Wind und Niederschlag behalten eine Klimareferenz. Open-Meteo stellt die benötigten historischen Felder über ERA5/ERA5-Seamless bereit; nur der bisherige reine ERA5-Land-Gesamtabruf war fachlich unvollständig.
