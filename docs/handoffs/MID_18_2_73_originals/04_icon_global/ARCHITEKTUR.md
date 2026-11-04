# MID · ICON weltweit nur bei Bedarf · Architekturentscheidung, 04.11.2026

**Status:** Forschungs-/Implementierungsauftrag, keine produktive Änderung, keine tatsächliche globale ICON-SIGWX-Abnahme. Ausgangsbasis: MID v0.9.85.427, main=mid-stable `4d3051f80a17a180c3952c83bf5afa51623b1eb3`.

## Verifizierter MID-Bestand (nicht doppelt implementieren)

- `src/WeatherMapsData.ts`: WMS-Layer der DWD ICON Global Familie (`Icon_reg025_fd_*`, u.a. PMSL, T2M, TOTPREC, UV10M, GH, T, RELHUM, WW) und ICON-EPS. `src/unifiedMapCatalog.ts`/`src/UnifiedWeatherMap.tsx` laden Metadaten erst für den gewählten WMS-Produktlayer, anschließend sichtbare 512px-Kacheln nach BBOX/Zoom; Zeit- und Laufparameter sind getrennt.
- `src/cloudWeatherData.ts` hat einen synoptischen kombinierten Cloud/WW-Pfad für ICON Global, aber der **aktuelle** eigene `validateCloudWeatherField` begrenzt geografisch auf etwa 29,5–70,5°N und 23,5°W–62,5°E. Daher heißt „ICON Global“ im Modellnamen nicht, dass die **Kombinationskarte** bereits weltweit numerisch gefüllt ist.
- WMS-Raster sind vom Anbieter gerenderte Karten; daraus dürfen keine hochaufgelösten Gitterpunkte, native WW-Codes, numerischen Isobaren/500-hPa-Isohypsen oder Höhen-/Flächenfeld-Fusionen fingiert werden.

## Zielarchitektur (Priorität nach Aufwand/Nutzen)

**Phase A – vorhandenes globales WMS fachgerecht adaptieren (bevorzugt zuerst):**
1. Verfügbare ICON-Global-WMS-Layer, echte Laufzeit, Termine, stildefinierte Einheiten und Nutzungsbedingungen über den offiziellen DWD-GetCapabilities- und GetMap-Endpunkt live gegenprüfen. Nicht alle bekannten Layernamen müssen zu jedem Zeitpunkt lieferbar sein. Nur der jeweils vom Nutzer gewählte Parameter/Modell lädt Layer-/Time-Metadaten.
2. MapLibre bezieht nur gerade sichtbare Kacheln; bei Zeitwechsel höchstens einen benachbarten bestätigten Frame vorladen, mit dedupliziertem Inflight-Key `(provider, run, validTime, layer, style, level, BBOX, z/x/y)` und einem kleinen kurzen HTTP-TTL. Auf alte Terminkacheln nicht zurückfallen, wenn die UI einen neuen Termin anzeigt; bis zur Verfügbarkeit vorherigen Frame **explizit** zeitbeschriftet lassen oder „wartet auf Originaltermin“ anzeigen.
3. Standortwechsel: natürliche Zoomregion; globales Modell automatisch nur für Ort außerhalb D2/EU-Domäne oder bei expliziter Nutzerwahl. Keine zusätzliche globale Pipeline, kein verdeckter Kostenanstieg. Zuordnung in UI `DWD ICON Global (Kartenprodukt)` statt vermeintliches lokales D2.
4. Profiler/Budget: Requests und Transfers für 320/390/430/834/1024/1440 px und Zoom 2–9, Cold/Warm, neue Region, Offline, 25/23h-Tage; LCP, Karte-interaktiv, P95 Time-to-first-frame. Gerätecache für modelldurchlauf- und terminidentische Kacheln nur mit zulässigen HTTP-Headern.

**Phase B – globales Cloud/WW als eigene, verifizierte Datenstrecke:**
1. DWD nativer Global-ICON-Download ist ein icosahedrisches Modellgitter; vor Web-Rendering wären Rasterisierung/Serverfenster-Ausschnitt, Reprojection, Feldkodierung, Missing-Mask, WW-Originalcode, CLCT, Modelllauf, Zeit und Druckisolinien zu qualifizieren. **Nie** einfach die Europagitter-Feldgrenzen auf 180° erweitern.
2. Beschränkter serverseitiger Batch/Cache **nur für sichtbare geopartitionierte Kacheln** (Webmercator, Auswahlparam/lead, harte AOI-Grenzen), ohne unbudgetierte Weltvorberechnung; nationalen/regionale Datenquellen passend priorisieren. Manifest pro Tile `(source, model, initUTC, validUTC, field, accumulation, CRS, bounds, hash, nodata, quality)`; atomare Veröffentlichungs-Freigabe mit Quelle/SHA und Rückfall.
3. Wolken und WW nur gleiche Modellfamilie, Lauf, Termin, Grid & Qualität. Eigene Modell-WW-Plot-Symbole sind **keine Stations-SYNOP-Meldungen**. Höhendaten aus tatsächlichen 500-hPa-Feldern, Druck aus tatsächlichem MSLP. Kein D2-RUC-Surrogat für eine globale Karte.
4. DWD-/Open-Meteo-Kompatibilität laufend beobachten: Open-Meteo kündigt für >30.11.2026 eine Änderung von DWD ICON Global/EU/D2 auf native Gitter an. Exakte aktuelle API-Semantik und Latitude-/Longitude-Output bei Migration prüfen, nicht einen alten Clientvertrag fortschreiben.

## Entscheidungs-Gates

- Phase A nur nach amtlichem Live-WMS-Gate, überprüfter alternativer Anbieterroute und Performance-/Browserparität.
- Phase B nur bei nachgewiesenem Mehrwert über WMS, belastbarem freiem Daten-/Nutzungs- und Bandbreitenbudget, Snapshot-/SHA-/NoData-Proof, echter globaler 3-Regionen-/3-Modellläufe-/24h-Readbackmatrix.
- Erfolgreiche MID Source-PR-Regressionsgates, kontrollierter SHA-Merge, serverseitiges Release-ZIP, `install-mid.yml`, Worker/Pages und `mid-stable`-Promotion erforderlich. Keine neue Bezahlinfrastruktur oder vergrößerte Cloud-Quoten ohne Nutzerfreigabe.

**Quellen zum Nachprüfen:** DWD Originaldaten `https://opendata.dwd.de/weather/nwp/icon/grib/`; amtliche WMS `https://maps.dwd.de/geoserver/dwd/ows`; Dokumentation `https://open-meteo.com/en/docs/dwd-api`; MapLibre `https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/`. Anbieter-Liveantworten und GetCapabilities sind zur Freigabe neu zu verifizieren; dieses Dokument ersetzt diese Prüfung nicht.
