# MID DWD RUC/RUC-EPS Pipeline Contract

Stand: v0.9.76.24

## Zweck und fachliche Rolle

DWD ICON-D2-RUC ist in MID ein stündlich neu initialisierter Kurzfrist-Kalibrator mit parameterabhängiger nativer Zeitauflösung der bereits kohärenten kanonischen Best-Match-Prognose. Der räumliche Vertrag ist auf `[-3.85, 43.18, 20.22, 58.05]` begrenzt, der zeitliche Vertrag auf 0–14 Stunden ab dem aktuellen Zeitpunkt. Best Match bleibt die Prognosebasis; RUC erzeugt weder eine zweite DWD-Modellfamilienstimme noch einen parallelen UI-Forecast.

RUC-EPS gehört wie ICON-D2-EPS zur Unabhängigkeitsgruppe `dwd-ensemble` und zur gemeinsamen Variantengruppe `dwd-icon-d2-eps-rapid`. In der Kurzfrist/Event-Auswertung wird RUC-EPS bis maximal 14 Stunden vor ICON-D2-EPS versucht. Ist RUC-EPS nicht nutzbar, fällt MID innerhalb derselben Familie auf ICON-D2-EPS zurück. Normale 7-/14-Tage-Ensembleabrufe laden RUC-EPS nicht.

## Meteorologische Schutzregeln

- RUC darf ausschließlich innerhalb des 0–14-h- und Gebietsvertrags kalibrieren.
- Die Gewichtung ist in 0–3 h am höchsten und nimmt danach stufenweise ab. Physikalische Felder werden zusätzlich durch Delta-Grenzen geschützt.
- RUC-Niederschlag wird mit dem kanonischen Best-Match-Niederschlagsbündel reconciled; RUC ersetzt keine Niederschlagsphase blind.
- RUC-EPS kalibriert die kurzfristige Niederschlagswahrscheinlichkeit im normalen Forecast aus bereits im Vorprozessor aggregierten Memberwahrscheinlichkeiten.
- Native RUC-EPS-Member sind ausschließlich eine optionale exakt eventbezogene Zusatzquelle. Fehlen sie im kostenlosen Speicherprofil, fällt diese Memberauswertung auf ICON-D2-EPS innerhalb derselben DWD-Ensemblefamilie zurück.
- Ein numerisches RUC- oder RUC-EPS-Signal darf niemals allein `Gewitter` erzeugen. Die appweite Regel „Gewitter erst bei beobachtetem Blitz“ bleibt verbindlich.
- Radar, Blitz, Stationen und Wetterzwilling bleiben nachgelagerte hyperlokale Korrekturen der kanonischen Reihe.

## DWD-Open-Data-Aufbereitung und native Zeitachsen

Quelle sind die offiziellen DWD-Open-Data-Bäume `icon-d2-ruc` und `icon-d2-ruc-eps`. Der Vorprozessor sucht den jüngsten gemeinsamen vollständigen Lauf, inventarisiert die benötigten Parameterbäume rekursiv und dekodiert GRIB2 mit ecCodes ausschließlich in GitHub Actions. Das native `CLAT`/`CLON`-Dreiecksgitter bleibt unverändert; MID regriddet die RUC-Felder nicht.

**Verbindlicher parameterabhängiger Zeitvertrag ab v0.9.73.11:**

- gemeinsamer Zustandskern 0…+14 h **stündlich**: `T_2M`, `TD_2M`, `RELHUM_2M`, `PMSL`, `U_10M`, `V_10M`, `VMAX_10M`, `CLCT`, `CLCL` sowie stündliche Referenzen für Niederschlag/CAPE/CIN;
- `TOT_PREC` 0…+6 h **5-minütlich** als natives Rapid-Niederschlagsprodukt; daraus wird zusätzlich eine echte 15-min-Akkumulation gebildet;
- `TOT_PREC`, `CAPE_ML` und `CIN_ML` 0…+6 h **15-minütlich** für den kanonischen Kurzfrist-/Konvektionspfad;
- `DBZ_CMAX` wird optional **15-minütlich** verwendet und ausdrücklich nur als **modellierte Reflektivität**, niemals als beobachtetes Radar;
- `RAIN_GSP`/`SNOW_GSP`/`GRAU_GSP` werden optional nur dann als 15-min-Phasenstütze genutzt, wenn der konkrete Lauf eine vollständige gemeinsame 15-min-Serie liefert;
- weitere optionale 15-min-Severe-Diagnostik (`CAPE_MU`, `CIN_MU`, `LPI`, `LPI_MAX`, `UH_MAX*`, `ECHOTOPinM`, `HAIL_GSP`, `LAPSE_RATE`, `W_CTMAX`, `VORW_CTMAX`) wird nur bei vollständiger Zeitachse aufgenommen und nie als alleinige Warn-/Gewitterautorität verwendet;
- `ASOB_S`, `ASWDIR_S`, `ASWDIFD_S` werden optional 15-minütlich als Strahlungsdiagnostik geführt;
- `VIS`, `CEILING`, `HZEROCL`, `SNOWLMT`, `CLCM`, `CLCH`, `T_G`, `H_SNOW` werden optional stündlich als Specialist-Diagnostik geführt; `SRH` und `WSHEAR_U/V` bleiben bis zur expliziten `lvt1`-Layerauswahl deaktiviert;
- RUC-EPS bleibt für den normalen probabilistischen Kurzfristpfad **stündlich 0…+14 h**.

Fehlende Zwischenwerte von Temperatur, Wind, Druck oder Wolken werden nicht interpoliert. Die feineren Einzelprodukte werden als getrennte Wire-Produkte publiziert (`rapid-5m.bin`, `rapid-15m.bin`, optional Reflektivität/Phase) und erzwingen keine falsche gemeinsame 5-/15-min-Zustandsachse.

### Appweite Verwendung

Die RUC-Rapid-Felder laufen in `forecast-fusion` als `rapidMinutes15` in die kanonische `displayMinutes15`-Endstufe ein. RUC wird **vor** Radar/Nowcast angewendet; beobachtetes Radar und lokale Beobachtungen bleiben dadurch nachgelagert und höher priorisiert. 5-min-Niederschläge liefern neben der 15-min-Summe einen Peak-Intensitätswert, CAPE/CIN und optionale modellierte Reflektivität unterstützen die Schauer-/Konvektionsplausibilität. Ohne beobachteten Blitz darf RUC weiterhin keinen Gewittercode erzeugen.

Für den Mitteleuropa-Extremwetter-Ausblick erzeugt der Vorprozessor ein kompaktes räumliches `rapid-extreme.json`. Es enthält ausschließlich für 0–6 h u. a. 6-h-Niederschlag, maximale 15-min-Menge, 5-min-Peakrate, CAPE/CIN und optional `DBZ_CMAX`, MU-CAPE/CIN, UH, LPI, EchoTop und Hagel. Diese deterministische Rapid-Unterstützung ergänzt ICON-D2-EPS/ICON-D2, ersetzt aber weder die Ensemble-Wahrscheinlichkeit noch KONRAD3D/Meso/Blitz als beobachtungsnahe Bestätigung.

### Strahlung und Sonnenscheindauer

Der aktuelle RUC-v1-Baum bietet u. a. `ASOB_S`, `ASWDIR_S` und `ASWDIFD_S`. Diese Felder werden in v0.9.73.11 bewusst **nicht** in Sonnenscheindauer umgerechnet. `ASWDIR_S` beschreibt direkte kurzwellige Strahlung an der Oberfläche; die meteorologische Sonnenscheindauer setzt direkte Sonnenstrahlung normal zur Strahlrichtung gegen die 120-W/m²-Schwelle. Eine belastbare Ableitung benötigt deshalb Sonnenstand/Projektionskorrektur und eine separat validierte Kalibrierung. Der bestehende appweite Sunshine-Duration-Contract bleibt Primärpfad. RUC-Strahlung ist für einen späteren validierten Strahlungs-/PV-/Thermik- und Sunshine-Plausibilitätsadapter vorgemerkt, wird aber nicht nur „weil verfügbar“ heruntergeladen.

Deterministisch werden mindestens Temperatur, Taupunkt, relative Feuchte, MSL-Druck, 10-m-Windkomponenten, Böen, Gesamtniederschlag, Gesamt-/tiefe Bewölkung, CAPE und CIN verarbeitet. RUC-EPS erzeugt für den normalen Forecast vorab je Punkt/Stunde Niederschlagswahrscheinlichkeit (>0,2 mm), signifikante Wahrscheinlichkeit (>5 mm), Mittel sowie Q25/Q50/Q75. Uneinheitliche Gitter, fehlende Pflicht-Rapid-Reihen oder unzureichende räumliche Lookup-Abdeckung brechen die Veröffentlichung fail-closed ab.

## Primärer kostenfreier Speicher-/Workervertrag: GitHub Pages

Der produktive Standardpfad ist `pages-free-v1` und benötigt weder R2 noch eine neue kostenpflichtige Ressource. Veröffentlicht werden laufbezogen:

- deterministische stündliche RUC-Kerndaten,
- native 5-min-/15-min-RUC-Rapid-Produkte,
- ein kompaktes 0–6-h-Extremwetter-Rapid-Summary,
- die voraggregierte RUC-EPS-Zusammenfassung,
- der Punkt-Lookup,
- ein kleines `latest.json`.

Die Binärprodukte werden in immutable Chunks geteilt. Der Worker liest pro Zielpunkt nur den erforderlichen Chunk; HTTP-Range-Unterstützung des Pages-CDN ist keine Voraussetzung. Das native EPS-Memberobjekt wird im Pages-Free-Profil bewusst ausgelassen. Der veröffentlichte Gesamtstand aus MID-App und RUC wird auf weniger als 950 MB begrenzt und hält damit Abstand zum aktuellen 1-GB-Pages-Limit. Daten älter als vier Stunden gelten nicht als frischer RUC-Lauf.

Normale App-Releases erhalten einen vorhandenen Pages-Free-RUC-Snapshot, indem sie dessen Manifest und immutable Chunks vor dem Pages-Deployment wieder in `dist/ruc` übernehmen und per Größe/SHA-256 prüfen. Ist `MID_RUC_PIPELINE_ENABLED=true`, gilt dieser Erhalt fail-closed.

Der Worker nutzt standardmäßig `https://midwx.app/ruc/`; `MID_DWD_RUC_STATIC_BASE_URL` kann diese Quelle ausdrücklich überschreiben. `ruc-health` meldet das aktive Backend und akzeptiert beim Pages-Profil die absichtliche Abwesenheit nativer EPS-Member.

### Scheduler-/Catch-up-Vertrag ab v0.9.74.5

GitHub-`schedule` ist als best-effort Trigger zu behandeln und darf nicht als lückenlose meteorologische Uhr angenommen werden. Der kostenlose RUC-Workflow erhält deshalb zwei versetzte Chancen je Stunde (`:11` und `:41` UTC) und darf einen bereits laufenden Build nicht durch einen verspäteten Folgetrigger abbrechen (`cancel-in-progress: false`). Vor ecCodes/pip vergleicht ein stdlib-only Guard den neuesten gemeinsam beworbenen DWD-RUC/RUC-EPS-Lauf mit dem veröffentlichten Pages-Free-`latest.json`. Nur ein strukturell gültiger, exakt gleicher und innerhalb des Vier-Stunden-Vertrags liegender Lauf darf den teuren Neubau als No-op überspringen. Bei neuerem DWD-Lauf, stale/ungültigem Pages-Metadatensatz oder jeder Discovery-/Netzwerkunsicherheit wird fail-open vollständig verarbeitet. Die eigentliche Vollständigkeitsentscheidung verbleibt bei `fetch_and_build_ruc.py`; ein bloß beworbener, aber unvollständiger neuer DWD-Lauf kann daher weiterhin nicht veröffentlicht werden.

### Scheduler-Resilienz ab v0.9.76.24

Die primären GitHub-Slots bleiben unverändert bei `:11` und `:41` UTC. Zusätzlich prüft der GitHub-interne Watchdog alle zehn Minuten (`:08/:18/:28/:38/:48/:58`). Vor einem Recovery-Dispatch muss er aktive/queued RUC-Läufe respektieren und einen 18-Minuten-`workflow_dispatch`-Cooldown einhalten. Jeder Recovery-Lauf verwendet `force=false`, damit der bestehende Freshness-Guard weiterhin über Neubau oder No-op entscheidet.

Da Primärworkflow und GitHub-Watchdog denselben Scheduler-Provider teilen, ist unter `tools/ruc/cloudflare_schedule_watchdog/` eine optionale provider-unabhängige zweite Cron-Ebene vorbereitet. Sie ist nicht automatisch aktiviert und benötigt kein R2. Ihre Aktivierung setzt ein separat als Cloudflare-Secret hinterlegtes, minimal berechtigtes GitHub-Token voraus. Ohne diese manuelle Credential-Freigabe bleibt die externe Ebene inaktiv; der produktive GitHub-Pfad funktioniert weiterhin mit den beiden Primärslots und dem verdichteten GitHub-Watchdog.

## Optionaler R2-Pfad

Der bereits gehärtete private Cloudflare-R2-Pfad bleibt vollständig erhalten, wird aber nicht für den kostenlosen Standardbetrieb benötigt. Falls er später ausdrücklich freigegeben wird, enthält er unveränderliche laufbezogene Binärdateien für Deterministik, EPS-Zusammenfassung, native EPS-Member und Lookup. `latest.json` wird erst nach vollständigem Upload und Remote-Größenprüfung atomar aktualisiert; vier vollständige Runs bleiben erhalten. R2 wird vom Worker bevorzugt, wenn das Binding vorhanden und der Lauf frisch/vollständig ist; ansonsten fällt MID auf GitHub Pages zurück.

Als Legacy-Fallback bleiben `MID_DWD_RUC_POINT_ENDPOINT` und `MID_DWD_RUC_EPS_POINT_ENDPOINT` samt optionalen Bearer-Tokens zulässig, sofern sie bereits dekodierte numerische Punktdaten liefern. Fehlt jede RUC-Quelle, bleibt MID über Best Match, ICON-D2 und ICON-D2-EPS voll funktionsfähig.

## Aktivierung und Kosten

Die GitHub-Actions-Pipeline läuft produktiv nur bei explizitem `MID_RUC_PIPELINE_ENABLED=true`. Für `pages-free-v1` ist dies ein technisches Aktivierungsgate, **kein Kosten-Gate**. Der öffentliche MID-Repository-Standardrunner und GitHub Pages sind der vorgesehene kostenlose Pfad. Es werden keine R2-Secrets und kein Cloudflare-Speicher benötigt.

R2-Bucket, R2-Credentials, Custom Domain oder andere potenziell kostenpflichtige Ressourcen bleiben weiterhin hinter dem separaten MID-Kostenvertrag und dürfen nur nach transparenter Kostenangabe und ausdrücklicher Nutzerfreigabe aktiviert werden.

## Regressionen

- `scripts/test-ruc-native-cadence-nowcast-097311.mjs`: parameterabhängige 5-/15-/60-min-Auflösung, Radarpriorität und Extremwetter-0–6-h-Vertrag.
- `scripts/test-ruc-parameter-audit-097311.mjs`: appweiter 114-Parameter-Audit, Specialist-/Severe-/Solar-Vertrag, Layer-Schutz für SRH/WSHEAR und Sunshine-Duration-Sperre.
- `scripts/test-ruc-dwd-pipeline-09690.mjs`: Domain-, Actions-, Binär-, Free-Pages-, optionaler R2- und Schutzvertrag.
- `scripts/test-ruc-fusion-runtime-09691.mjs`: Worker-Runtimepfad mit RUC-Kalibrierung, EPS-Wahrscheinlichkeit, Cache-/Read-Schutz und Gewittersperre.
- `scripts/test-ruc-pages-free-storage-09700.mjs`: echter statischer Pages-Backendpfad ohne Range-Abhängigkeit.
- `tools/ruc/test_prepare_ruc_pages.py`: Chunking und Ausschluss nativer EPS-Member aus dem Free-Profil.
- `tools/ruc/test_publish_ruc_r2.py`: optionaler Fake-R2-Lauf für atomare Veröffentlichung/Retention.
- `tools/ruc/test_cloudflare_r2_bootstrap.py`: optionaler R2-Bootstrap bleibt private-by-default und kostengegated.
- `scripts/test-ruc-storage-health-09692.mjs` und `tools/ruc/check_ruc_health.py`: Backend-neutrale Health-/Post-Publish-Prüfung ohne Geheimnislecks.
- Bestehende Forecast-Fusion-, Ensemble-, Best-Match-, Worker- und iOS-Regressionen bleiben zusätzlich verbindlich.
## Native ICON-D2-RUC grid coordinates

- Forecast GRIB messages on the native triangular ICON grid are not required to expose synthetic ecCodes `latitudes`/`longitudes` arrays.
- The preprocessing pipeline stages DWD's authoritative `CLAT` and `CLON` fields once per selected run and uses their cell values as the native geographic grid.
- `CLAT`/`CLON` may be encoded in radians; the builder converts them to degrees when their value ranges identify radian units.
- Coordinate count, finiteness and geographic bounds are fail-closed. Deterministic parameters and RUC-EPS must match the native point count.
- No regular-grid regridding is introduced; the compact lookup preserves the native ICON-D2-RUC triangular grid.

