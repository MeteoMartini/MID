# MID-C51 · GeoSphere TAWES Schnee: read-only Vertragsqualifikation

Basis: v0.9.85.365, `main = mid-stable = 723ef0e11f87963a47aee8a9df8a3c757d07d7ae`; Issue #510. Dieser PR ändert **keine** produktive App, Worker-, Fusion- oder Releasefunktion und ist deshalb kein neuer App-Build.

## Ausgangsbefund
- Die produktive GeoSphere-Anbindung in `worker.js` versucht `HS`, `SH`, `SNOW_DEPTH` nacheinander. Der an den historischen GeoSphere-Tawes-Metadaten orientierte Parameterkatalog nennt dagegen `SCHNEE` = Gesamtschneehöhe in cm: https://zamg-explorer.legner.me/tawes-v1-10min/parameters/ . MID-C51 hat Original-Metadaten und begrenzte echte Stationsantworten nachgewiesen (siehe unten); keine positiven Schneehöhen- oder QC-Abnahmen.
- Offizieller TAWES-Katalog: https://data.hub.geosphere.at/dataset/tawes-v1-10min . 10-Minuten-Rohwerte, **ungeprüft**, CC BY 4.0; offizielle API: https://dataset.api.hub.geosphere.at/v1/docs/getting-started.html .
- Qualifizierte Tagesdaten sind ein anderer Vertrag (GeoSphere `klima-v2-1d`, QC-Flags, teils später nachkontrolliert), nicht mit TAWES Rohdaten zu vertauschen: https://data.hub.geosphere.at/dataset/klima-v2-1d .

## Reproduzierbarer sicherer Offline-Pilot
`node tools/snow/test-tawes-snow-contract.mjs` prüft strikt `SCHNEE`, cm, Semantik, echte Null, Missing/null/Bool, unmögliche Größen, fehlende Zeitzone, Alter, Stationentfernung und Höhendifferenz.
`node tools/snow/tawes-snow-contract.mjs --metadata <OFFLINE_JSON>` prüft gespeicherte Metadaten.
`node tools/snow/tawes-snow-contract.mjs --live` fragt **explizit** nur den amtlichen Metadaten-Endpunkt ab, begrenzt auf 9s/400kB, ohne Originalwerte, Nutzerstandorte oder Geheimnisse zu protokollieren. Weder echte Stationswerte noch Qualitätsflags werden dadurch bestätigt. Fail-closed exit 2.

## Offene Gates
Original-Metadaten und echte Station-Payloads/Qualitätsfelder mit Zeitzone/Einheiten/Alter/0/Missing prüfen, dann den produktiven Einzel-Parameterpfad mit Cache und Standortvalidierung gezielt anpassen, im vollständigen MID-Regressioninventar aufnehmen und als neue versionierte App über Source-PR-Gate → SHA-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable veröffentlichen. SLF, MeteoSchweiz, DWD, INCA/C-LAEF bleiben eigenständige Folgequalifikationen. Bergfex nur mit dokumentierter Lizenz, nie per Scraping.

## Tatsächliche read-only Originalproben aus MID-C51 (29.10.2026)
- Offizielle GeoSphere-TAWES-Metadaten HTTP 200, SHA256 `827b59570d40dd05fed91fa4d43483356488aeb98b4854a45b72f70950bce538`: Feld `SCHNEE`, Langname `Schneehöhe`, Beschreibung Gesamtschneehöhe 10 Minuten (Schneepegelmessung), Einheit `cm`. Die bisherigen Alias-Felder `HS`, `SH`, `SNOW_DEPTH` fehlten im abgerufenen Feldverzeichnis.
- Erste vier echte Stationfeatures HTTP 200, SHA256 `86b1ba3ddb54d18f86045c529538de86d065920a80e497510b1b70ebe1231094`, `2026-10-29T14:30Z`: Innsbruck-Flughafen 11121, Patscherkofel 11126, Rudolfshütte 11138, Sonnblick 11343 mit jeweiligem `SCHNEE.data:[null]` – **fehlend, nicht 0 cm**.
- Weitere neun Features HTTP 200, SHA256 `83b587ebd6e031b94363a03d9aaf4469edec0446cb7148450f8033470e1dda4f`: echte `0.0 cm` an Seefeld 11119, Lofer 11140, Kitzbühel 11279, St. Anton/Arlberg 11311 und Reutte 11314; `null` u. a. Salzburg-Flughafen 11150 und Loferer Alm 11337.
- Diese Proben belegen echte 0/Missing-Feldformen, aber weder einen positiven Schneewert noch tatsächliche automatische QC oder mehrtägige Güte. Die Fachlogik liest **ausschließlich den neuesten Sample**; eine ältere Zahl vor dem neueren `null` wird nicht unter dem aktuellen Zeitstempel als Messung ausgegeben.
- Keine produktive Aktivierung. Draft-PR bleibt Draft; Quelle/Attribution/Budget/Stationstimestamps weiter prüfen.
