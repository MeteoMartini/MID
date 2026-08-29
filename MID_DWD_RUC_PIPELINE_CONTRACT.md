# MID DWD RUC/RUC-EPS Pipeline Contract

Stand: v0.9.69.2

## Zweck und fachliche Rolle

DWD ICON-D2-RUC ist in MID ausschließlich ein stündlich aktualisierter Kurzfrist-Kalibrator der bereits kohärenten kanonischen Best-Match-Prognose. Der räumliche Vertrag ist auf `[-3.85, 43.18, 20.22, 58.05]` begrenzt, der zeitliche Vertrag auf 0–14 Stunden ab dem aktuellen Zeitpunkt. Best Match bleibt die Prognosebasis; RUC erzeugt weder eine zweite DWD-Modellfamilienstimme noch einen parallelen UI-Forecast.

RUC-EPS gehört wie ICON-D2-EPS zur Unabhängigkeitsgruppe `dwd-ensemble` und zur gemeinsamen Variantengruppe `dwd-icon-d2-eps-rapid`. In der Kurzfrist/Event-Auswertung wird RUC-EPS bis maximal 14 Stunden vor ICON-D2-EPS versucht. Ist RUC-EPS nicht nutzbar, fällt MID innerhalb derselben Familie auf ICON-D2-EPS zurück. Normale 7-/14-Tage-Ensembleabrufe laden RUC-EPS nicht.

## Meteorologische Schutzregeln

- RUC darf ausschließlich innerhalb des 0–14-h- und Gebietsvertrags kalibrieren.
- Die Gewichtung ist in 0–3 h am höchsten und nimmt danach stufenweise ab. Physikalische Felder werden zusätzlich durch Delta-Grenzen geschützt.
- RUC-Niederschlag wird mit dem kanonischen Best-Match-Niederschlagsbündel reconciled; RUC ersetzt keine Niederschlagsphase blind.
- RUC-EPS kalibriert die kurzfristige Niederschlagswahrscheinlichkeit im normalen Forecast aus bereits im Vorprozessor aggregierten Memberwahrscheinlichkeiten. Native Member bleiben für die exakt eventbezogene Kurzfristauswertung verfügbar und werden dort nur bei Bedarf gelesen.
- Ein numerisches RUC- oder RUC-EPS-Signal darf niemals allein `Gewitter` erzeugen. Die appweite Regel „Gewitter erst bei beobachtetem Blitz“ bleibt verbindlich.
- Radar, Blitz, Stationen und Wetterzwilling bleiben nachgelagerte hyperlokale Korrekturen der kanonischen Reihe.

## DWD-Open-Data-Aufbereitung

Quelle sind die offiziellen DWD-Open-Data-Bäume `icon-d2-ruc` und `icon-d2-ruc-eps`. Der Vorprozessor sucht den jüngsten gemeinsamen vollständigen Lauf, liest die benötigten Parameterbäume rekursiv und dekodiert GRIB2 mit ecCodes ausschließlich in der GitHub-Actions-/Vorverarbeitungsstufe. Er wählt explizit die vollen Stunden 0…14; die native höherfrequente RUC-Zeitauflösung darf nicht versehentlich auf die ersten 15 Zeitschritte verkürzt werden.

Deterministisch werden mindestens Temperatur, Taupunkt, relative Feuchte, MSL-Druck, 10-m-Windkomponenten, Böen, Gesamtniederschlag, Gesamt-/tiefe Bewölkung, CAPE und CIN verarbeitet. RUC-EPS erzeugt für den normalen Forecast vorab je Punkt/Stunde Niederschlagswahrscheinlichkeit (>0,2 mm), signifikante Wahrscheinlichkeit (>5 mm), Mittel sowie Q25/Q50/Q75. Zusätzlich bleiben die nativen Niederschlagsmember punktweise für die exakt eventbezogene Kurzfristauswertung erhalten. Das gemeinsame native Gitter wird geprüft; uneinheitliche Gitter oder unzureichende räumliche Lookup-Abdeckung brechen die Veröffentlichung fail-closed ab.

## Speicher-/Workervertrag

Die Produktionsform besteht aus unveränderlichen laufbezogenen Binärdateien für Deterministik, voraggregierte EPS-Zusammenfassung, native EPS-Member und Punkt-Lookup sowie einem kleinen `latest.json`. Auch der Lookup liegt unter `runs/<run>/lookup.bin`; es existiert kein global überschriebenes Lookup-Objekt. `latest.json` wird erst nach vollständigem Upload und Remote-Größenprüfung aller Laufobjekte atomar aktualisiert. Ein bereits vollständig veröffentlichter identischer Lauf ist idempotent und erzeugt keine neuen Schreiboperationen. Alte Runs werden erst nach dem Pointerwechsel entfernt; vier vollständige Runs bleiben erhalten. Vor einem neuen großen Upload darf eine Preflight-Bereinigung verwaiste Präfixe entfernen, muss aber den aktuell von `latest.json` referenzierten vollständigen Fallback unverändert lassen. Ein zusätzlicher R2-Lifecycle auf `runs/` räumt nach 48 Stunden liegengebliebene Uploadreste auf; die zeitnahe Vier-Run-Retention bleibt Aufgabe des Publishers. Der Worker liest nur die für den Zielpunkt erforderlichen Byte-Ranges und dekodiert kein GRIB/BUFR. Daten älter als vier Stunden gelten nicht als frischer RUC-Lauf.

Als Legacy-Fallback bleiben `MID_DWD_RUC_POINT_ENDPOINT` und `MID_DWD_RUC_EPS_POINT_ENDPOINT` samt optionalen Bearer-Tokens zulässig, sofern sie bereits dekodierte numerische Punktdaten liefern. Fehlt jede Adapterkonfiguration, bleibt MID über Best Match, ICON-D2 und ICON-D2-EPS voll funktionsfähig.

## Kosten- und Aktivierungsgate

Die GitHub-Actions-Pipeline ist standardmäßig deaktiviert und läuft produktiv nur bei explizitem `MID_RUC_PIPELINE_ENABLED=true`. Der R2-Bucket bleibt standardmäßig privat; `r2.dev` wird im Bootstrap deaktiviert und ein Custom Domain ist nur nach separater Öffentlichkeitsfreigabe zulässig. Das vorgesehene Cloudflare-R2-Binding heißt `MID_DWD_RUC_DATA`. Weder R2-Bucket noch Credentials, kostenpflichtige Dienste oder eine automatisch kostenverursachende Aktivierung dürfen ohne vorherige transparente Kostenangabe und ausdrückliche Nutzerfreigabe eingerichtet werden. Der Quellrelease darf die Pipeline und den Adapter vollständig vorbereiten, ohne dieses Gate zu öffnen.

## Regressionen

- `scripts/test-ruc-dwd-pipeline-09690.mjs`: statischer Pipeline-, Kosten-, Domain-, Actions-, Binär- und Schutzvertrag.
- `scripts/test-ruc-fusion-runtime-09691.mjs`: echter Worker-Runtimepfad mit synthetischem R2-Punkt, voraggregierter EPS-Zusammenfassung, nur bei Eventbedarf gelesenen 20 EPS-Membern, physikalischer RUC-Kalibrierung, EPS-Wahrscheinlichkeit, Cache-/Read-Schutz und Gewittersperre.
- `tools/ruc/test_publish_ruc_r2.py`: Fake-R2-Lauf prüft Preflight-Schutz des aktuellen Fallbacks, Uploadreihenfolge, atomaren `latest.json`-Pointer, Cleanup erst nach Pointerwechsel und idempotenten Null-Write-Zweitlauf.
- `tools/ruc/test_cloudflare_r2_bootstrap.py`: prüft private-by-default, aktuellen Location-Hint-Vertrag, 48-h-Lifecycle, Kosten-Gate und reine Worker-Binding-Verifikation ohne riskantes Settings-Rewrite.
- `scripts/test-ruc-storage-health-09692.mjs`: echter Worker-Runtimecheck für konfiguriert/frisch/vollständig, stale, fehlendes Objekt und fehlendes Binding; der Health-Pfad gibt keine Infrastrukturgeheimnisse aus.
- `tools/ruc/check_ruc_health.py` / `test_ruc_health_check.py`: optionaler Post-Publish-Smoke verlangt exakt den lokal publizierten Run als `ready` und `fresh`, bevor die Stundenpipeline als produktiv gilt.
- Bestehende Forecast-Fusion-, Ensemble-, Best-Match-, Worker- und iOS-Regressionen bleiben zusätzlich verbindlich.
