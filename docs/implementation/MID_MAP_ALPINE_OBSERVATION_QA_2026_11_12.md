# MID Karten · Alpen-Radar/Satellit und Modellraster · QA-Befund 12.11.2026

**Source of Truth**: Veröffentlichtes `main=mid-stable=ef585fdbbfe475146d68868a6b671057f8b52e0d` (`v0.9.85.458`). Diese Änderung ist ein isolierter `chatgpt/*` QA-Draft: **kein Merge, keine Versionsanhebung, kein Release, keine amtliche Warnquelle**. Unabhängige aktuelle Source-/Heavy-/Browser-/Installer-/Worker-/Pages-/Stable- und iOS-Geräteprüfungen sind erforderlich.

## Reproduzierter öffentlicher Sölden-Fall

Prüfpunkt ca. 46,969° N, 11,010° E (Sölden, Österreich), Stand 12.11.2026 ca. 12:38 UTC. Verwendet wurden die öffentlich erreichbaren MID-Routen; keine Nutzerkonten, Tokens, manipulierten Requests oder privaten Daten.

- `https://www.midwx.app/api/mid-worker?mode=composite-times&lat=46.969&lon=11.01` antwortete HTTP 200, `dwdRadar: []`, aber je 12 aktuelle EUMETSAT Tag-/IR-Termine, zuletzt `2026-11-12T12:20:00.000Z`, 0,5 km VIS und 1 km IR.
- `mode=opera-raster-meta` antwortete HTTP 200 mit 13 OPERA-CIRRUS-Einträgen; **jüngster Zeitstand 2026-11-11T20:10:00Z**, für die aktuelle Beobachtung zu alt. Die frühere Quellwahl prüfte nur `operaFrames.length>0`, nicht die gültige Aktualität des gewählten Timeframes.
- `mode=rainviewer-meta` lieferte 12 historische Radarstände über bereits im Repository vorhandenen MID-Proxy. Der bisherige `unified`-Kartenpfad unterdrückte dessen Ladevorgang **und** Darstellung ausdrücklich.
- Bei gleicher Web-Mercator-Kachel (z=8, x=135, y=90) und gleichem 12:20-UTC-Gültigkeitstermin lieferte `composite-wms`, `mtg_fd:vis06_hrfi` **HTTP 502**, während `mtg_fd:ir105_hrfi` **HTTP 200, image/png, 6115 B** lieferte. Diese Einzelprobe beweist einen konkreten VIS-Ausfall, keine generelle Produktverfügbarkeit aller Zooms.
- Die öffentliche Website `/version.json` meldete `0.9.85.458`, der separat angesprochene Wetterdaten-Worker `mode=health` `0.9.85.455`. Dieser Versionsversatz ist als eigenständiger Worker-/Frontend-Vertragsbefund zu prüfen, nicht als Beweis falscher Modellwerte zu interpretieren.

## Reproduzierter ICON-D2-Vollgebietsfehler, außerhalb des vorliegenden UI-Patches

`https://midwx.app/ruc/latest.json` meldete im Lauf 2026-11-12T10:00 UTC tatsächlich `pointCount=542040` und volle RUC-Metadaten über `[-3.85,43.18,20.22,58.05]`. **Aber** es existierte kein `modelFieldsNative`-Eintrag mit `productionApproved=true`; `modelFields` verwies weiterhin auf `mid.icon-d2.fields.v1` (ICON-D2 Lauf 09 UTC). Ein Live-Download aller acht komprimierten + SHA-256-geprüften Original-Kartenframes (+1 h) ergab jeweils **505 Spalten × 410 Zeilen = 207050 Werte**, Bounds **[5.52,47.00,15.60,55.18]**. Die SHA-Werte der 8/8 Dateien stimmten mit dem freigegebenen Index überein; der Fehler ist daher **ein absichtlich eng remapptes Erzeuger-/Publisherraster**, keine durch CSS abgeschnittene Karte.

Die acht untersuchten Kartenfelder waren `temperature °C`, `pressure hPa`, `wind km/h`, `gust km/h`, `cloud %`, `thetae K`, `sigwx WMO`, `precipitation mm/1 h`. Im +1-h-Raster existierten echte 0-Werte (u.a. Niederschlag), die getrennt von Missing/NoData erhalten bleiben müssen. Einzelwerte der WMS-Karten in Sölden (ICON-EU: ca. 1,54 °C; ICON global: ca. 1,47 °C, gleicher 06-UTC-Lauf und 13-UTC-Gültigkeit) waren am öffentlichen Worker erreichbar, sind aber **nicht** unabhängig an den ursprünglichen GRIB-Quellen gegengeprüft und dürfen deshalb nicht als validiert bezeichnet werden.

**Erforderlicher anderer Workstream:** Signierte/quellen- und geometrieverifizierte 542040-Punkte-DWD-ICON-D2-Felder als `modelFieldsNative` atomar publizieren, `src/nativeD2FullDomain.ts` vollständig bestehen, 8 Felder × 9 Termine, gleiche Modellläufe, WMO-/DWD-Einheiten, zeitliche Akkumulation und NoData; direkte Rasterprobe Köln **und** Sölden, echte Live-CAS-/Pages-Prüfungen. Keine stillschweigende Umetikettierung des getrennten RUC-Datensatzes.

## Anpassung nur für Beobachtungsanzeige

`src/RadarPanel.tsx`: leeres amtlich gelistetes DWD-Lokalradar nicht mit bloß in der Standortanalyse erwähnten Zeitstempeln als abgedeckt behandeln; OPERA nur mit zeitlich zur Ansicht passendem Frame nutzen; vorhandenes RainViewer-Fallback auch im Unified-Map-Modus laden/rendern, mit getrennt gehaltenem Frame-Array zur Vermeidung von DWD-/RainViewer-Zeitquellenmischungen; bei fehlendem Tag-/VIS-Produkt oder realem VIS-Kachelfehler auf bereits vorhandenes EUMETSAT-IR-Produkt wechseln. Fallback-Legenden/-Lizenzen bleiben quellengetreu; kein erfundenes Echobild oder Zeitstempel. Kein neue kostenpflichtige Datenquelle.

`tests/unit/radar-satellite-alpine-fallback.test.ts` prüft Quell-/Interaktionsguards zusätzlich. **Noch offen:** echte Browserprobe mit Sölden und Köln, 320/390/844/1440 px, Touch, Light/Dark, Zeitwechsel, alte/neue Frames, Quelle/Fehlermeldung, Rollback, Belastung und keine Änderung von amtlichen DWD-Warnungen. Externe Werkzeuge liefern keine Abnahme auf einem realen iOS-Gerät.

## Mehrmodelle und WXCharts-artige Parameter

`src/unifiedMapCatalog.ts` lässt Sommer-/Winter-Komposite zurzeit **nur für `icon-d2`** zu. Noch keine freigegebene native Mehrmodell-Kompositkette. Die bereits dokumentierte `docs/implementation/MID_WXCHARTS_SEASONAL_MAP_MATRIX_2026_11_10.md` ist fachliche Matrix: Schnee-/Neuschnee, Niederschlagsphase, CAPE, CIN, 0–6-km-Windscherung, LPI, 0-°C-Höhe, Böen, Sonnenschein und Synoptik erst aus je Anbieter und Lauf/Gültigkeit/GRIB-Step-Unit nachgewiesenen Feldern integrieren. Andere Modelle/Regionen (ICON-EU/Global, ECMWF IFS, GeoSphere C-LAEF Alpengebiet) benötigen ihre eigenen Original- oder verifizierten WMS-Daten und eine explizite fachliche Capability-Matrix. **WXCharts-/MetDesk-Daten, -Tiles, -Code und -Assets nicht übernehmen**; nur eigenständig erstellte meteorologische Darstellungen. Kein fremder kommerzieller Dienst ohne Freigabe.

## Release-Grenze

Dieser QA-Draft **behebt nicht** das fehlende Voll-D2-Publisherprodukt, führt keine neuen Wetterdatenmodelle ein und behauptet keine vollständige Live-Browsermatrix. Der Leitchat darf nur nach gesonderter SHA-gebundener Review-/Source-/Installer-/Deployment-/Stable-Abnahme integrieren.
