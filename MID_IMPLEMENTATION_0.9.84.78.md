# MID v0.9.84.78 – Header- und BAFU-Hydrologie-Audit

## Design

Der mobile Hauptheader reserviert bis 430 px getrennte Zeilen für Marke/Version, Aktionsleiste und Suche. Die Versionsanzeige nutzt `white-space: nowrap`, kein Ellipsis und eine eigenständige Mindestbreite. Die bestehenden 44-px-Touchziele bleiben erhalten. Damit konkurriert `v0.9.84.xx` nicht mehr mit den fünf Header-Aktionen um dieselbe Restbreite.

## Schweizer Hydrologie

Die öffentliche BAFU-Datenplattform wird serverseitig über den dokumentierten GraphQL-Endpunkt `https://data.bafu.admin.ch/api` angebunden. MID lädt aktive Stationen des nationalen hydrologischen Messnetzes, bestimmt die nächstgelegene Station und liest aus `data_live` die Parameter:

- `W` – Wasserstand
- `Q` – Abfluss
- `WT` – Wassertemperatur

Für die Einheiten werden die parallel verfügbaren 10-Minuten-Daten herangezogen. Wasserstände bleiben im nativen schweizerischen Höhenbezug (`m ü. M.`); es erfolgt ausdrücklich keine Umrechnung in PEGELONLINE-Zentimeter. Livewerte werden pro Parameter auf Plausibilität und maximal 90 Minuten Alter geprüft.

Deutschland verbleibt unverändert auf WSV PEGELONLINE REST API v2 einschließlich `WV/measurements.json`, sofern vorhanden.

## Architektur

BAFU-Rohdaten werden im Worker normalisiert. Das Frontend erhält nur ein kompaktes `OfficialWaterObservation`-JSON. Die Stationsliste wird pro Worker-Instanz bis zu sechs Stunden wiederverwendet; die eigentlichen Livewerte bleiben kurzfristig gecacht.

## Worker

Funktionale Worker-Änderung: **Ja**. Ein Worker-Deployment ist für dieses Release erforderlich.
