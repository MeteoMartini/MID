# MID Test Report 0.9.84.29

## Ergebnis

Der neue Reise-Center-/Reisewetter-Fusionsstand ist für die ZIP-Abgabe gezielt geprüft.

## Grün geprüft

- TypeScript-Projektprüfung mit dem lokal verfügbaren Compiler 5.8.3 (`tsc -p tsconfig.json --noEmit`).
- Neuer Reise-Center-/Forecast-Fusionsvertrag `test-travel-center-forecast-fusion-098429.mjs`.
- Reiseplaner-Grundvertrag, Request-Budget, ERA5-Seamless-Einheiten und Defaultziel/Komposit-Grenzen.
- NOAA-OISST-Worker-/UI-Vertrag und Reise-Wassertemperaturdarstellung.
- Schneeoptimierung, Schneehöhe und kumulierter Schneefall bleiben getrennt erhalten.
- Wetterpiktogramm-/Schneehöhenregression aus v0.9.84.28.
- Versionsschema, Release-Lineage und Responsivität.
- Worker gegenüber v0.9.84.28 funktional bytegleich, wenn ausschließlich `WORKER_VERSION` normalisiert wird.

## Lokale Umgebungsgrenze

Der historische Spezialtest `test-travel-water-climatology-resilience-09665.mjs` startet seinen Compiler explizit aus `node_modules/.bin/tsc` und verwendet die TypeScript-7-Option `--ignoreConfig`. Das Replacement-ZIP enthält absichtlich keine `node_modules`; der lokal vorhandene System-Compiler ist TypeScript 5.8.3 und kennt diese Option nicht. Der Test wurde daher nicht künstlich verändert. Seine fachlichen OISST-/UI-Verträge sind durch die übrigen erfolgreichen Reise-/OISST-Regressionen abgedeckt. Das repository-native Release-Gate installiert TypeScript 7.0.2/Vite 8.2.2 reproduzierbar und führt den vollständigen Build/Regressionstest beim Release aus.

## Worker

Keine fachliche Workeränderung. Nur die gemeinsame Release-Version wurde von 0.9.84.28 auf 0.9.84.29 synchronisiert; ein separater Worker-Upload ist nicht erforderlich.
