# MID DWD RUC/RUC-EPS Pipeline Contract

Stand: v0.9.73.6

## Zweck und fachliche Rolle

DWD ICON-D2-RUC ist in MID ausschließlich ein stündlich aktualisierter Kurzfrist-Kalibrator der bereits kohärenten kanonischen Best-Match-Prognose. Der räumliche Vertrag ist auf `[-3.85, 43.18, 20.22, 58.05]` begrenzt, der zeitliche Vertrag auf 0–14 Stunden ab dem aktuellen Zeitpunkt. Best Match bleibt die Prognosebasis; RUC erzeugt weder eine zweite DWD-Modellfamilienstimme noch einen parallelen UI-Forecast.

RUC-EPS gehört wie ICON-D2-EPS zur Unabhängigkeitsgruppe `dwd-ensemble` und zur gemeinsamen Variantengruppe `dwd-icon-d2-eps-rapid`. In der Kurzfrist/Event-Auswertung wird RUC-EPS bis maximal 14 Stunden vor ICON-D2-EPS versucht. Ist RUC-EPS nicht nutzbar, fällt MID innerhalb derselben Familie auf ICON-D2-EPS zurück. Normale 7-/14-Tage-Ensembleabrufe laden RUC-EPS nicht.

## Meteorologische Schutzregeln

- RUC darf ausschließlich innerhalb des 0–14-h- und Gebietsvertrags kalibrieren.
- Die Gewichtung ist in 0–3 h am höchsten und nimmt danach stufenweise ab. Physikalische Felder werden zusätzlich durch Delta-Grenzen geschützt.
- RUC-Niederschlag wird mit dem kanonischen Best-Match-Niederschlagsbündel reconciled; RUC ersetzt keine Niederschlagsphase blind.
- RUC-EPS kalibriert die kurzfristige Niederschlagswahrscheinlichkeit im normalen Forecast aus bereits im Vorprozessor aggregierten Memberwahrscheinlichkeiten.
- Native RUC-EPS-Member sind ausschließlich eine optionale exakt eventbezogene Zusatzquelle. Fehlen sie im kostenlosen Speicherprofil, fällt diese Memberauswertung auf ICON-D2-EPS innerhalb derselben DWD-Ensemblefamilie zurück.
- Ein numerisches RUC- oder RUC-EPS-Signal darf niemals allein `Gewitter` erzeugen. Die appweite Regel „Gewitter erst bei beobachtetem Blitz“ bleibt verbindlich.
- Radar, Blitz, Stationen und Wetterzwilling bleiben nachgelagerte hyperlokale Korrekturen der kanonischen Reihe.

## DWD-Open-Data-Aufbereitung

Quelle sind die offiziellen DWD-Open-Data-Bäume `icon-d2-ruc` und `icon-d2-ruc-eps`. Der Vorprozessor sucht den jüngsten gemeinsamen vollständigen Lauf, inventarisiert die benötigten Parameterbäume rekursiv und dekodiert GRIB2 mit ecCodes ausschließlich in der GitHub-Actions-/Vorverarbeitungsstufe. Für das 0–14-h-MID-Bundle werden anhand der DWD-Lead-Namen (`PTxxxHyyM`) bereits **vor dem Download** nur die ganzstündlichen Zielstände 0…14 ausgewählt; unbekannte Legacy-Namen bleiben fail-safe erhalten. Damit werden z. B. 5-minütige `TOT_PREC`-Zwischenstände nicht mehr hunderte Male unnötig heruntergeladen. Die native höherfrequente RUC-Zeitauflösung darf zugleich nicht versehentlich auf die ersten 15 Zeitschritte verkürzt werden. Downloads laufen mit begrenzter Parallelität und sichtbarer Fortschrittsausgabe; das teure native Lat/Lon-Gitter wird beim ecCodes-Decoding pro Parameter bzw. EPS-Gitter nur einmal extrahiert.

Deterministisch werden mindestens Temperatur, Taupunkt, relative Feuchte, MSL-Druck, 10-m-Windkomponenten, Böen, Gesamtniederschlag, Gesamt-/tiefe Bewölkung, CAPE und CIN verarbeitet. RUC-EPS erzeugt für den normalen Forecast vorab je Punkt/Stunde Niederschlagswahrscheinlichkeit (>0,2 mm), signifikante Wahrscheinlichkeit (>5 mm), Mittel sowie Q25/Q50/Q75. Das gemeinsame native Gitter wird geprüft; uneinheitliche Gitter oder unzureichende räumliche Lookup-Abdeckung brechen die Veröffentlichung fail-closed ab.

## Primärer kostenfreier Speicher-/Workervertrag: GitHub Pages

Der produktive Standardpfad ist `pages-free-v1` und benötigt weder R2 noch eine neue kostenpflichtige Ressource. Veröffentlicht werden laufbezogen:

- deterministische RUC-Daten,
- die voraggregierte RUC-EPS-Zusammenfassung,
- der Punkt-Lookup,
- ein kleines `latest.json`.

Die Binärprodukte werden in immutable Chunks geteilt. Der Worker liest pro Zielpunkt nur den erforderlichen Chunk; HTTP-Range-Unterstützung des Pages-CDN ist keine Voraussetzung. Das native EPS-Memberobjekt wird im Pages-Free-Profil bewusst ausgelassen. Der veröffentlichte Gesamtstand aus MID-App und RUC wird auf weniger als 950 MB begrenzt und hält damit Abstand zum aktuellen 1-GB-Pages-Limit. Daten älter als vier Stunden gelten nicht als frischer RUC-Lauf.

Normale App-Releases erhalten einen vorhandenen Pages-Free-RUC-Snapshot, indem sie dessen Manifest und immutable Chunks vor dem Pages-Deployment wieder in `dist/ruc` übernehmen und per Größe/SHA-256 prüfen. Ist `MID_RUC_PIPELINE_ENABLED=true`, gilt dieser Erhalt fail-closed.

Der Worker nutzt standardmäßig `https://midwx.app/ruc/`; `MID_DWD_RUC_STATIC_BASE_URL` kann diese Quelle ausdrücklich überschreiben. `ruc-health` meldet das aktive Backend und akzeptiert beim Pages-Profil die absichtliche Abwesenheit nativer EPS-Member.

## Optionaler R2-Pfad

Der bereits gehärtete private Cloudflare-R2-Pfad bleibt vollständig erhalten, wird aber nicht für den kostenlosen Standardbetrieb benötigt. Falls er später ausdrücklich freigegeben wird, enthält er unveränderliche laufbezogene Binärdateien für Deterministik, EPS-Zusammenfassung, native EPS-Member und Lookup. `latest.json` wird erst nach vollständigem Upload und Remote-Größenprüfung atomar aktualisiert; vier vollständige Runs bleiben erhalten. R2 wird vom Worker bevorzugt, wenn das Binding vorhanden und der Lauf frisch/vollständig ist; ansonsten fällt MID auf GitHub Pages zurück.

Als Legacy-Fallback bleiben `MID_DWD_RUC_POINT_ENDPOINT` und `MID_DWD_RUC_EPS_POINT_ENDPOINT` samt optionalen Bearer-Tokens zulässig, sofern sie bereits dekodierte numerische Punktdaten liefern. Fehlt jede RUC-Quelle, bleibt MID über Best Match, ICON-D2 und ICON-D2-EPS voll funktionsfähig.

## Aktivierung und Kosten

Die GitHub-Actions-Pipeline läuft produktiv nur bei explizitem `MID_RUC_PIPELINE_ENABLED=true`. Für `pages-free-v1` ist dies ein technisches Aktivierungsgate, **kein Kosten-Gate**. Der öffentliche MID-Repository-Standardrunner und GitHub Pages sind der vorgesehene kostenlose Pfad. Es werden keine R2-Secrets und kein Cloudflare-Speicher benötigt.

R2-Bucket, R2-Credentials, Custom Domain oder andere potenziell kostenpflichtige Ressourcen bleiben weiterhin hinter dem separaten MID-Kostenvertrag und dürfen nur nach transparenter Kostenangabe und ausdrücklicher Nutzerfreigabe aktiviert werden.

## Regressionen

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

