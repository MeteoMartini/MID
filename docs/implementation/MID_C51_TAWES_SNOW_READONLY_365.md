# MID-C51 · GeoSphere TAWES Schnee: read-only Vertragsqualifikation

Basis: v0.9.85.365, `main = mid-stable = 723ef0e11f87963a47aee8a9df8a3c757d07d7ae`; Issue #510. Dieser PR ändert **keine** produktive App, Worker-, Fusion- oder Releasefunktion und ist deshalb kein neuer App-Build.

## Ausgangsbefund
- Die produktive GeoSphere-Anbindung in `worker.js` versucht `HS`, `SH`, `SNOW_DEPTH` nacheinander. Der an den historischen GeoSphere-Tawes-Metadaten orientierte Parameterkatalog nennt dagegen `SCHNEE` = Gesamtschneehöhe in cm: https://zamg-explorer.legner.me/tawes-v1-10min/parameters/ . Noch kein echter aktueller Stations-Payload verifiziert.
- Offizieller TAWES-Katalog: https://data.hub.geosphere.at/dataset/tawes-v1-10min . 10-Minuten-Rohwerte, **ungeprüft**, CC BY 4.0; offizielle API: https://dataset.api.hub.geosphere.at/v1/docs/getting-started.html .
- Qualifizierte Tagesdaten sind ein anderer Vertrag (GeoSphere `klima-v2-1d`, QC-Flags, teils später nachkontrolliert), nicht mit TAWES Rohdaten zu vertauschen: https://data.hub.geosphere.at/dataset/klima-v2-1d .

## Reproduzierbarer sicherer Offline-Pilot
`node tools/snow/test-tawes-snow-contract.mjs` prüft strikt `SCHNEE`, cm, Semantik, echte Null, Missing/null/Bool, unmögliche Größen, fehlende Zeitzone, Alter, Stationentfernung und Höhendifferenz.
`node tools/snow/tawes-snow-contract.mjs --metadata <OFFLINE_JSON>` prüft gespeicherte Metadaten.
`node tools/snow/tawes-snow-contract.mjs --live` fragt **explizit** nur den amtlichen Metadaten-Endpunkt ab, begrenzt auf 9s/400kB, ohne Originalwerte, Nutzerstandorte oder Geheimnisse zu protokollieren. Weder echte Stationswerte noch Qualitätsflags werden dadurch bestätigt. Fail-closed exit 2.

## Offene Gates
Original-Metadaten und echte Station-Payloads/Qualitätsfelder mit Zeitzone/Einheiten/Alter/0/Missing prüfen, dann den produktiven Einzel-Parameterpfad mit Cache und Standortvalidierung gezielt anpassen, im vollständigen MID-Regressioninventar aufnehmen und als neue versionierte App über Source-PR-Gate → SHA-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable veröffentlichen. SLF, MeteoSchweiz, DWD, INCA/C-LAEF bleiben eigenständige Folgequalifikationen. Bergfex nur mit dokumentierter Lizenz, nie per Scraping.
