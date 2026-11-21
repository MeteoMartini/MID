# MID-Karten 1.20 – Native DWD-RV-Projektion auf MapLibre-WebMercator

**QA-DRAFT in PR #937; NO READY / NO MERGE / NO RELEASE.**

## Source of Truth
- Bei Arbeitsbeginn main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776, v0.9.85.497. Alle drei Versionsspiegel synchron, fünf Rulesets aktiv, AGENTS.md, MID_SOURCE_OF_TRUTH.md, UI- und Cross-Platform-Verträge gelesen.
- Fortschreibung von https://github.com/MeteoMartini/MID/pull/937, vorheriger HEAD a18d7c9f972b82b4ba539ab24692e4893c3dc85e. Kein Rebase, Reset oder Force-Push. #955 WMS-Worker-Proxy und #929 Nowcast-Daten separat.

## Offizieller Live-Originalbeleg, 19.11.2026
- DWD WMS 1.1.1 GetCapabilities: https://maps.dwd.de/geoserver/wms?service=WMS&version=1.1.1&request=GetCapabilities (HTTP 200, application/vnd.ogc.wms_xml). Im echten XML steht der exakte Layer dwd:Radar_rv_product_1x1km_ger.
- Im RV-Layer steht SRS EPSG:4326 sowie ausdrücklich BoundingBox SRS=EPSG:3857 (minx 162893.97899880027, miny 5729950.328541203, maxx 2085194.0054682754, maxy 7602217.1933928775). EPSG:3857 ist außerdem im übergeordneten CRS-Angebot enthalten.
- Ein echter DWD GetMap für denselben RV-Layer, WMS 1.1.1 / SRS=EPSG:3857 / BBOX=723576.690156,6515839.147612,946215.671743,6872776.253674 / WIDTH=128 / HEIGHT=192 / TIME=2026-11-19T21:00:00.000Z antwortete HTTP 200 mit image/png. Dieser HTTP-Beleg bestätigt keine konkreten meteorologischen Rasterpixel, Qualitätsmasken oder Nutzungsrechte.
- RV-Zeitdimension PT5M. Original-5-Minuten-Zeiten dürfen nicht mit MID-15-Minuten-Bedienabschnitten verwechselt werden.
- **Wichtige zukünftige DWD-Änderung:** Der RV-Layer weist ausdrücklich darauf hin, dass am **24.11.2026** die Scanreichweite von **150 auf 180 km** erweitert werden soll. Weniger NaN-Bereiche, etwas andere BBOX, gleicher Layername. Bis dahin nicht als eingetreten ausgeben; danach frische Original-Capabilities/NoData-Ränder erneut prüfen.

## Projektionsvertrag und eng begrenzter Fix
- OGC WMS 1.1.1 EPSG:4326 platziert Bildpixel in linearem Längen-/Breitengradraster. MapLibre-Bildquads verwenden WebMercator; passende vier Ecken garantieren keine georeferenzierten Echos im Bildinnern.
- **Nur DWD RV:** Neuer pure helper src/surroundingsMercatorWmsRaster.ts berechnet aus derselben nach map.getBounds() erfassten geografischen BBOX einen projizierten EPSG:3857-BBOX in Metern mit R=6378137 m, nach außen auf höchstens 1 mm gerundet. WIDTH/HEIGHT folgen dem metrischen Seitenverhältnis; harte Limits 512x256 und 131072 Pixel; keine zusätzliche Canvas-Resampling- oder Full-RGBA-Readbacklast.
- CurrentSurroundings.tsx verwendet den memoisierten radarWmsPlan für GetMap-URL und exakte Decodierungsgröße. OPERA/Phasenraster bleiben auf originalen geografischen Bounds und Mercator-Bildzeilen. ALLE nicht für EPSG:3857 einzeln verifizierten Satellitenprodukte behalten geographicWmsPlan/EPSG:4326 – dies ist noch eine getrennte Bildinnen-Projektionslücke.
- Keine neuen Wetter-/Warnwerte, Niederschlag 0 aus NoData, künstlichen Originalzeiten, Modell-/RUC-Artefakten, Providern, Lizenzen oder neuen kostenpflichtigen Diensten.

## Gezielte Negativ-QA
- Neue tests/unit/surroundings-mercator-wms-qa.test.ts: Responsive Breiten 320/390/430/768/1024/1440, Raster-Limit, Projektions-Innenpunkte 10/25/50/75/90 Prozent, metergenau nach außen gerundete BBOX und Polar-/Datumsgrenzen-/NaN-Fail-closed.
- Bestehende tests/unit/surroundings-viewport-current-qa.test.ts verschärft die echte CRS-Trennung: nur verifizierter DWD-RV nativ, Satelliten weiter geografisch, Decoder-Abmessungen auf denselben projizierten Plan gebunden.
- Bestehende scripts/verify-unified-map-browser-0985167.mjs verlangt im Chromium-Radarfall explizit srs=EPSG:3857, metrische BBOX, passendes dimensionsgebundenes PNG und ursprüngliche Originalzeit/NoData-Behandlung. Synthetische Fixtures beweisen keine echte Datenmaske.
- Vor neuem HEAD-CI ausdrücklich keine Freigabe. Notwendig: Vitest/V8, gezielte Chromium-Regression, separate originale georeferenzierte DWD-RV-PNG-Referenzpixel/NoData-Maske, per-Layer EUMETSAT-/DWD-Satellit-Capabilities, WebKit/Capacitor/iOS, Review/Core/Heavy/Worker/Pages/Installer/Stable-Gates.

## Auto-Priorität für Leit-Chat/-Work
1. P0: Neuen #937-HEAD exakt testen und regressionsfrei für Source-Train qualifizieren; #955 bei disjunkter SHA-/Worker-Gate-Prüfung gesondert integrieren.
2. P0: Tatsächliche DWD-RV-PNG-Originalpixel und Coverage-NaN an Rand- und Innenpunkten nachweisen; EPSG:3857-Kompatibilität von Satellitenprodukten pro Layer nachziehen, ohne pauschalen Wechsel.
3. P0: Amtliche Radar-RV-Scanreichweitenänderung am 24.11.2026 gegen neue GetCapabilities und NoData-Maske prüfen.
4. P1: Tatsächliche WMS-Bilddecode-/GPU-/Netzlast im Chromium/WebKit messen, bevor #889/#904/#908 gemeinsam integriert werden.
5. P2: Originalzeit, Quelle, Gültigkeit, Unsicherheit, 44px-Touch, Light/Dark, 320–1440px, 200%-Text und echte VoiceOver-Checks. Radar+-Ansatz von Windy und Quellenmetadaten von meteoblue nur konzeptionell vergleichen.

## Verbindliche Links
- OGC WMS 1.1.1: https://cite.ogc.org/te2/about/wms11/1.1.1/site/OGCTestData/wms/1.1.1/spec/wms1.1.1.html
- DWD Original-WMS: https://maps.dwd.de/geoserver/wms?service=WMS&version=1.1.1&request=GetCapabilities
- MapLibre WebMercator: https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/
- Windy Radar+: https://community.windy.com/topic/36164/windy-launches-radar-layer-combining-satellite-and-radar-view
- meteoblue data sources: https://docs.meteoblue.com/en/meteo/data-sources

**Der Draft darf die etablierten MID-Source-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates nicht ersetzen oder überspringen.**