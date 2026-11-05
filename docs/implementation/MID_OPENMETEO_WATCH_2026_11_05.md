# Open-Meteo MID Watch – konsolidierte Qualifikation 05.11.2026

Status: Dokumentierte Originalquellen/kleine Livecanaries; keine neue Modellfreigabe oder Veröffentlichung.

Vollständiger Originalbericht: https://github.com/MeteoMartini/MID/issues/405#issuecomment-6651699382



## Verifizierter Nachtrag – Open-Meteo MID Watch 05.11.2026
Stand 07:12 UTC. Aktuelle Stable-Basis .428 `6f08117ed0862c1573fec5c48844136b83e22bd5`; main `bb3407178d225fe8e8143048438446b1b6c92543` enthält den noch nicht promovierten .429-Stand. Reparaturfreigabe #660 läuft; dieser Nachtrag ist keine Produktivfreigabe.

Primärquellen live gelesen: https://github.com/open-meteo/open-meteo/releases/tag/1.8.0 (03.11.), https://open-meteo.com/en/docs/geosphere-austria-api , https://open-meteo.com/en/docs/dwd-api , https://open-meteo.com/en/docs/gfs-api , https://open-meteo.com/en/docs/model-updates . Der vollständige heutige Watch-Lauf wurde direkt aus der bestehenden Automation gelesen (Run cba55bd8-4c50-8320-ba09-ff51e8b91978, completed05.11.06:49UTC) und der Originalbericht vollständig gelesen. Die folgenden Canaries schließen dessen damalige HTTP200-Lücke.

| Priorität | Befund | Verbindliche Folge |
|---|---|---|
| P0 | GeoSphere AROME seit04.11. eingestellt; historische ID bleibt erreichbar. | Bestehenden 12h-Run-Freshness-/Missing-Guard erhalten. Keine HTTP200-Freigabe und keine gleichzeitige unabhängige AROME/C-LAEF-Gewichtung. Migration mit #509 konsolidieren. |
| P1 | C-LAEF `geosphere_claef_austria`:1km, stündlich bis60h, neue Läufe alle3h. | Kontrolllauf und Quantile unterscheiden; keine EPS-Member aus Punkt-/Kontrolldaten behaupten. Native Schneefallgrenze als Höhe behandeln, nicht erneut lokal höhenkorrigieren. |
| P1 | Legacy-ICON-Kennungen wechseln nach30.11. auf native Gitter; Sichtweite fällt weg. | Forecast/Ensemble/Maps/Worker-Kataloge selektiv auf Gitterrand/Missing, Einheiten, Akkumulation und Zeitsemantik prüfen; keine blinde Alias-Ersetzung. #636 bleibt bestehender Open-Meteo-RUC-Shadowpfad; keine neue konkurrierende Pipeline. |
| P1 | RRFS ist öffentlich dokumentiert: Nordamerika ~13km/84h; CONUS3km/84h; CONUS15min18h. NAM als seit01.11. eingestellt, HRRR bis30.11. angekündigt. | Dokumentations-/Betriebswidersprüche getrennt prüfen. RRFS zunächst isolierte nordamerikanische Qualifikation; keine neue Fusion ohne unabhängigen Nutzen-/Run-Nachweis. |
| P1 | Gewichtete `X-RateLimit-*`-Header produktiv sichtbar. | Tatsächliche Cost/Remaining/Reset/Window beachten, 429/Retry-After und bestehendes Gesamtbudget erhalten. Keine kostenpflichtigen Ressourcen. |

Kleine Originalcanaries, insgesamt nur3 Metadaten- und2 Punktabfragen; keine DWD-Massenläufe:
- C-LAEF-meta https://api.open-meteo.com/data/geosphere_claef_austria/static/meta.json : HTTP200,599B,SHA256 `eb9ee9883503ab0e1de11909c3676d1d1438f84b7a0d7262db0aa7514bab97a4`. Run05.11.00Z, Verfügbarkeit04:55:16Z: reale Latenz295m16s; **keine feste4h35-Verfügbarkeitsannahme**.
- AROME-meta https://api.open-meteo.com/data/geosphere_arome_austria/static/meta.json : HTTP200,600B,SHA256 `4e1bc1c63c0df7255a0561341fe7ef23558ed5d24fc642dd9a71b188f9982554`. Letzter Run04.11.03Z, >28h alt; HTTP200 beweist keine Frische. Bestehender12h-Guard weist ihn zurück.
- RRFS-CONUS-meta https://api.open-meteo.com/data/ncep_rrfs_conus/static/meta.json : HTTP200,958B,SHA256 `9b8783b92f1fc72f200caa68660895739cbbba4704f42fa753686e9a943128bb`, Run05.11.00Z, Verfügbarkeit05:38:40Z.
- C-LAEF Innsbruck3h (`latitude=47.27&longitude=11.39&models=geosphere_claef_austria&hourly=temperature_2m,precipitation,snowfall_height&forecast_hours=3&timezone=GMT`): HTTP200,452B,SHA256 `897bfcf7a8464bbba09fd622797088486c749e0df4dafefc3bf5aaeb31e776d5`; gültig07/08/09Z,°C/mm/m. Schneefallhöhe2150/2210/2290m. Cost1.0/Limit600/Remaining599/Window60.
- RRFS-CONUS3h40N105W (`models=ncep_rrfs_conus&hourly=temperature_2m,precipitation,wind_direction_10m&forecast_hours=3&timezone=GMT`): HTTP200,454B,SHA256 `afe1530f90d1f036c931ef1aa0b0d054308ba536c7a42f6c33e61818d1a9d048`,°C/mm/°,07/08/09Z. Remaining598. Diese2 erfolgreichen Einzelpunkte beweisen weder3 unabhängige Runs, Qualitätsgewinn noch vollständige Gebiets-/Clientparität.

Upstream-Commits1.8.0: C-LAEF `ecd65b64d966224046aaebbcda33a216f0ebd731`, Timingfix `738bf3d92a86d7e4cf3eeac29131ce1c244c6e86`, RRFS `f3cdf746bee49044a3ec9871237057eeb282b85d`, RUC `a48a37e47d39d02215eff3541fb56d1d437ff64b`, RateLimit `aeab72e33f6a30f1a87d1b5444fd169d536ce914`, NAM-Windfix `e10b415a6f4a348bda75792733f1a3ee9c7cd413`. Historische Wind-/Strahlungsregime nicht rückwirkend ohne Originalprovenienz umschreiben.

Offen vor produktiver Migration:3 nachweislich unterschiedliche aktuelle Runs, native Parameter-/Höhen-/Gitter-/Rand-/Missing-Validierung, Fallback-/Cache-/429-Negativtests und unveränderte Releasekette. Echte168h-RUC-Ende-zu-Ende-Messung bleibt davon getrennt und unersetzt.


## Originalbericht des heutigen Watch-Laufs

## Open-Meteo MID Watch · 05.11.2026 · v1.8.0 / GeoSphere-Sunset / RRFS / DWD-Legacy-Migration

**Aktuelle MID-Source-of-Truth (live aus GitHub gelesen):**
- `mid-stable`: **v0.9.85.428**, SHA `6f08117ed0862c1573fec5c48844136b83e22bd5` (Installer-Commit vom 04.11.2026, 19:02 UTC).
- `main`: **v0.9.85.429**, SHA `bb3407178d225fe8e8143048438446b1b6c92543`, zwei Commits vor Stable. PR [#657](https://github.com/MeteoMartini/MID/pull/657) ist in main gemergt; PR [#658](https://github.com/MeteoMartini/MID/pull/658) ist weiterhin Draft. Dieser Watch hat weder diese Release-/Handoff-Arbeit noch main/stable verändert.
- Stable-Dateien abgeglichen: `package.json`, `MID_BASELINE.json`, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, Forecast-Modellkatalog, Worker-Fusion und bestehende GeoSphere-/BOM-Regressionen.

### P1 – GeoSphere AROME seit 04.11. offiziell eingestellt; C-LAEF jetzt öffentlich dokumentiert

Offizielle Primärquellen:
- [GeoSphere Austria API-Dokumentation](https://open-meteo.com/en/docs/geosphere-austria-api): führt jetzt **GeoSphere C-LAEF Austria** auf und markiert **GeoSphere AROME Austria als discontinued 2026-11-04**.
- [Open-Meteo v1.8.0 Release vom 03.11.2026](https://github.com/open-meteo/open-meteo/releases/tag/1.8.0) und [Upstream-PR #2258](https://github.com/open-meteo/open-meteo/pull/2258): C-LAEF `geosphere_claef_austria` ist integriert.
- Upstream beschreibt C-LAEF: 1-km-Gitter, 1300 × 945, 43.002–51.498°N / 5.0317–22.5682°E, stündlich 0–60 h, acht Läufe täglich im 3-h-Takt, Datenbereitstellung etwa 4 h 35 min nach Initialisierung. GeoSphere veröffentlicht laut PR nur den österreichischen Ausgabeausschnitt, nicht das gesamte AlpeAdria-Rechengebiet; keine Land-Meer-Maske.
- C-LAEF-Details laut PR: Niederschlag/Regen/Schneefall/Sonnenschein als Stundenmengen; `ssrd` als Stundenmittel W/m²; Druck aus `msl`; Böen aus `10fg`; Schneehöhe aus `sd`; `zsurf` als Geländehöhe. `snowlmt` wird direkt verwendet. Obwohl die Beschreibung „above ground“ sagt, zeigen die Werte laut Upstream kaum Geländeabhängigkeit und sind bereits über NN zu interpretieren – **keine zusätzliche DEM-/Höhenkorrektur** einführen.
- Upstream nennt vorübergehend einen SDK-/FlatBuffers-Modell-ID-Platzhalter `geosphereAromeAustria`, bis die SDK-Kennung veröffentlicht wird. Deshalb Response-/Metadatenprovenienz separat prüfen.

**Stable-Codebefund:** `src/weather-src/00-types-models-search.tsfrag` und generiertes `src/weather.ts` führen weiterhin `geosphere_arome_austria`; `geosphere_claef_austria` fehlt. `worker-src/00-core-observations.js`, `worker/metar-proxy.js` und `worker.js` führen `geosphere_arome` als optionalen separaten Abruf. Die vorhandene 12-h-Originallauf-Frischeprüfung verhindert bereits, dass alte AROME-Läufe als aktuelle Werte zählen. Die Regression `scripts/test-openmeteo-geosphere-arome-retirement-0985410.mjs` behauptet derzeit ausdrücklich, C-LAEF dürfe nicht angefragt werden – dieser Testvertrag ist durch die neue offizielle Dokumentation überholt.

**Nächster Build – sichere Umsetzung nach Live-Canary:**
1. AROME aus dem **aktiven** Forecast-Katalog und Worker-Abruf entfernen (historische/archive Provenienz nicht löschen); keine nutzlosen Wiederholungsanfragen nach dem offiziellen Sunset.
2. C-LAEF als **optionale, isolierte** GeoSphere-Fähigkeit ergänzen: `apiIds:['geosphere_claef_austria']`, AT-only und konservative tatsächliche Coverage; nicht in die gemeinsame MultiDomains-Anfrage mischen, solange die Capability nicht durch reale Antworten bestätigt ist. 12-h-Originalinitialisierungs-/Availability-Guard an 3-h-Zyklus und ca. 4h35-Lag anpassen.
3. C-LAEF und `geosphere_seamless` nicht als zwei unabhängige GeoSphere-Stimmen zählen. Fehlende Stunden/Felder bleiben Missing, nicht 0.
4. `snowfall_height` erst nach separater Höhen-/Schneegrenzenprüfung in MID-Schneeprodukte übernehmen; insbesondere keine DEM-Korrektur oder doppelte Höhenverschiebung.

**Live-Verifikation dieses Laufs:** Die offizielle Dokumentation listet C-LAEF jetzt als Modell; die frühere HTTP-400-Beobachtung vom 02.11. ist damit nicht mehr als aktueller API-Status zu behandeln. Ein erneuter direkter HTTP-200-Canary (Wien/Innsbruck/Graz plus österreichischer Rand, vollständige Stunden-/Metadatenantwort) war aus dieser Ausführungsumgebung nicht erreichbar. Ich behaupte deshalb **keinen** aktuellen HTTP-200-Status. Der sichere nächste Schritt ist ein gezielter Canary auf dem MID-Worker/CI-Netz, nicht ein blindes Produktiv-Fallback.

### P1 – NOAA RRFS ist in Open-Meteo v1.8.0 veröffentlicht; MID führt noch kein RRFS

Offizielle Quellen:
- [Open-Meteo v1.8.0 Release](https://github.com/open-meteo/open-meteo/releases/tag/1.8.0)
- [Upstream-PR #2133](https://github.com/open-meteo/open-meteo/pull/2133)
- [GFS & RRFS API-Dokumentation](https://open-meteo.com/en/docs/gfs-api)

Öffentlich dokumentierte RRFS-Kennungen/Produkte:
- `ncep_rrfs_north_america`: nominal 13 km, stündlich, 00/06/12/18 UTC, 84 h, ein deterministischer Lauf.
- `ncep_rrfs_conus`: 3 km, stündlich, 00/06/12/18 UTC, 84 h.
- `ncep_rrfs_conus_15min`: 3 km, 15-minütig, stündliche Updates, 18 h; reduzierter Variablenumfang, keine Druckflächen.
- `ncep_rrfs_conus_ensemble`: fünf Mitglieder, 60 h; die daraus abgeleitete Niederschlagswahrscheinlichkeit ist nur für CONUS dokumentiert, nicht für North America.
- Upstream weist darauf hin, dass RRFS noch nicht automatisch in `best_match` oder die bestehende NCEP-Seamless-Auswahl integriert ist. Keine automatische zusätzliche unabhängige Stimme behaupten.
- Für die geprüften Produkte ist akkumuliertes `freezing_rain` nicht verfügbar; `categorical_freezing_rain` bleibt. Bei einem MID-Adapter also nicht blind `freezing_rain` anfordern oder fehlende Werte synthetisieren.

**Stable-Codebefund:** Weder `src/weather-src/00-types-models-search.tsfrag` noch `worker-src/00-core-observations.js` enthalten RRFS-Kennungen. Der aktuelle Worker verwendet `OPEN_METEO_FORECAST='https://api.open-meteo.com/v1/forecast'`; die offizielle RRFS-Anleitung ist die GFS-&-RRFS-API unter `/v1/gfs`. Vor Integration daher den exakten öffentlichen Endpoint/Modellparameter und tatsächliche JSON-Suffixe mit Live-Canarys prüfen. Nicht einfach die neue Kennung in den bisherigen Forecast-Batch hängen. Für CONUS außerdem die 15-minütige Quelle und Ensemble-PoP getrennt behandeln; `ncep_rrfs_seamless` nicht allein aus dem Upstream-Readernamen als öffentlich bestätigte Kennung übernehmen.

### P1 – bevorstehende DWD-ICON-Legacy-Abschaltung am 30.11.2026

Die [offizielle DWD-ICON-API-Dokumentation](https://open-meteo.com/en/docs/dwd-api) und die [Single-Runs-Modelübersicht](https://open-meteo.com/en/docs/single-runs-api) markieren:
- DWD ICON Global, ICON-EU und ICON-D2: **Discontinued 2026-11-30**.
- DWD ICON Global Native, ICON-EU Native, ICON-D2 Native, ICON-D2 RUC Native und DWD AICON Global Native bleiben in der Modellauswahl gelistet; DWD ICON Seamless bleibt ebenfalls verfügbar.

**Stable-Codebefund:** Worker-Fusion verwendet derzeit die Legacy-IDs `dwd_icon`, `dwd_icon_eu`, `dwd_icon_d2` (zusätzlich zu `icon_global`, `icon_eu`, `icon_d2`). Vor dem 30.11. einen eigenen Migrations-Canary für native Kennungen bzw. Seamless planen: akzeptierte IDs, Feldverfügbarkeit, Zeitauflösung, Laufzeiten, Coverage/NoData, Cache und Konsens-/Unabhängigkeitsgruppen nachweisen. Nicht vorsorglich native Modelle als identisch mit den bisherigen Legacy-Produkten behandeln.

**Wichtig für MID-RUC:** Open-Meteo v1.8.0 enthält außerdem [ICON-D2-RUC-Integration #2186](https://github.com/open-meteo/open-meteo/pull/2186), einschließlich `dwd_icon_d2_ruc_native`. Das ist nicht automatisch gleichbedeutend mit MID's eigenem DWD→Pages/R2-RUC-Punktadapter. Keine Ersetzung, Zusammenführung oder doppelte Gewichtung ohne separate RUC-Zeit-/Gitter-/Akkumulationsabnahme.

### P2 – NOAA HRRR/NAM und widersprüchliche offizielle Sunset-Angaben

- Die [GFS-&-RRFS-Dokumentation](https://open-meteo.com/en/docs/gfs-api) sagt, HRRR und NAM würden Ende November 2026 eingestellt; NBM sei nicht betroffen und RRFS bereits verfügbar.
- Die [Single-Runs-Modelübersicht](https://open-meteo.com/en/docs/single-runs-api) markiert HRRR mit 2026-11-30, NAM jedoch bereits mit **2026-11-01**.

Das ist ein Widerspruch innerhalb offizieller Open-Meteo-Dokumentation. Stable verwendet weiterhin `ncep_hrrr_conus` und `ncep_nam_conus`. **NAM deshalb nicht allein aufgrund der Single-Runs-Beschriftung entfernen**; tatsächliche Forecast-API-Verfügbarkeit und eine eindeutige offizielle Korrektur abwarten. HRRR bis zur angekündigten 30.11.-Umstellung weiter überwachen und RRFS-Migration vorbereiten. NBM bleibt laut GFS-Doku unverändert.

### P2 – gewichtete Rate-Limits: neue Header noch nicht in MID verarbeitet

Offizieller Upstream-Commit [#2263](https://github.com/open-meteo/open-meteo/commit/aeab72e33f6a30f1a87d1b5444fd169d536ce914) ergänzt `X-RateLimit-Cost`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Window` und `Retry-After`. Die Limits zählen gewichtete API-Aufrufe; für die Free API gelten Minuten-/Stunden-/Tagesfenster. Das ist kein neues JSON-Feld, aber für MID's viele parallele Modell-/Kartenanfragen relevant.

**Stable-Codebefund:** `src/openMeteoGuard.ts` verarbeitet bereits HTTP 429 und `Retry-After`, liest aber die neuen `X-RateLimit-*`-Header noch nicht. Für den nächsten Guard-Update die Header nur defensiv auswerten (insbesondere Remaining=0 bis Reset, ungültige Header ignorieren), Queue/Worker-Konkurrenz berücksichtigen und Tests für alle Zeitfenster ergänzen. Kein pauschales Hochsetzen der Parallelität.

### Weitere offizielle Änderungen ohne aktuell belegten MID-Patch

- [#2289](https://github.com/open-meteo/open-meteo/pull/2289) (01.11. gemergt): Taupunktberechnung bei RH=0 verhindert NaN. MID fordert `dew_point_2m` an; Grenzfall als Regression beobachten, keine Missing-Fallbacks lockern.
- [#2287](https://github.com/open-meteo/open-meteo/pull/2287) (01.11. gemergt): HTTP-400-Datumsfehler geben wieder konkreten `reason`-Text aus; Status/Grundschema bleiben erhalten.
- [#2268](https://github.com/open-meteo/open-meteo/pull/2268) (30.10. gemergt): Korrektur der Priorität/Gitterzellen bei echten Bounding-Box-Requests. MID's geprüfter Forecast-Fusionspfad sendet Einzelkoordinaten; daher kein direkter Punktrequest-Patch belegt. Separate Raster-/BBox-Requests gegebenenfalls prüfen.
- [#2301](https://github.com/open-meteo/open-meteo/commit/4e602ccddf8e4e519855aac02ed402261800512a): SARAH-3-Zeitlabels wurden auf vorwärts gelabelte 30-Minuten-Mittel angepasst. Im geprüften MID-Dateibaum kein SARAH-3-Open-Meteo-Pfad gefunden; keine Änderung abgeleitet.
- [#2282](https://github.com/open-meteo/open-meteo/pull/2282) bleibt offen: mögliche doppelte Geländeberücksichtigung bei AROME-`snowfall_height`; keine lokale Höhenkorrektur hinzufügen.
- [#2298](https://github.com/open-meteo/open-meteo/pull/2298) GOES-19-Strahlungsintegration und [#2302](https://github.com/open-meteo/open-meteo/pull/2302) Release 1.8.1 sind noch offen; nicht als produktive API-Änderung behandeln.

### Übergabe / Umsetzung im nächsten MID-Build

Dieses Issue ist die persistente Übergabe an **MID 18.2.74 bzw. den jeweils neuesten Nachfolger**. Priorität für den nächsten autorisierten Entwicklungsstand:
1. GeoSphere AROME aus aktivem Abruf entfernen und C-LAEF nach echtem API-/Metadaten-Canary isoliert aufnehmen; Regression `test-openmeteo-geosphere-arome-retirement-0985410.mjs` fachlich aktualisieren.
2. RRFS-Endpunkt-/ID-/Payload-Canary und danach gezielte CONUS/North-America-Adapter samt Variablen-/Zeit-/Ensembletests.
3. DWD ICON Native/Seamless-Migration vor 30.11. abnehmen; Legacy-IDs erst nach verifizierter Alternative entfernen.
4. NAM-Widerspruch klären, HRRR-Sunset beobachten.
5. X-RateLimit-Header in Client- und Worker-Guard integrieren, wenn Header auf den tatsächlich verwendeten Free-API-Antworten bestätigt sind.

**Release-/Cloudflare-Vertrag:** Bei App-/Worker-Änderung ausschließlich vom dann aktuellen `mid-stable` in einem autorisierten kurzlebigen `chatgpt/*`-/`codex/*`-Branch starten. Kanonische und generierte Forecast-/Worker-Spiegel, beide Baseline-Testinventare, Verträge, Changelogs und Versionsspiegel gemeinsam aktualisieren. Source-PR-Gate → kontrollierter SHA-Bot-Merge → serverseitiges Release-ZIP → `install-mid.yml` Core/Heavy/Worker/Pages/Finalize → Stable-Promotion. Worker-Deployment ist erforderlich, wenn Modellfusion/Rate-Guard im Worker geändert wird; Pages/PWA nur über den Installer. Keine manuellen Cloudflare-Schritte, keine Direktwrites auf main/stable, kein Bypass/Force-Push.

**Status dieses Watch-Laufs:** Offizielle Quellen und Stable-Code wurden abgeglichen und dieser Handoff ergänzt. Kein API-Live-200 für C-LAEF/RRFS in dieser Umgebung, kein lokaler vollständiger MID-Checkout/Build/Regression-Gate; daher keine ungetestete Code-/Versions-/Release-Mutation, keine ZIP-Dateien und kein Worker-/Cloudflare-Deployment. Vorhandene Stable-/Main-Arbeit bleibt unverändert.
