# MID #541 · RUC 0–6h/0–14h – echtes GRIB-Header-Preflight (Draft)

**Stand:** 31.10.2026 · **Arbeitsbasis** `main=mid-stable` v0.9.85.389 @ `6e449be3baf13e9c33ec206864189dd4b580d482`. **Nicht veröffentlicht.**

## Bereits produktiv

- v0.9.85.388: schreibgeschützter 15-min-DWD-Verzeichnisbeobachter und Pages-/Worker-Readback, ohne Erstpublikations- oder GRIB-Zulassungsbehauptung.
- Vollständiger DWD RUC 0..27h / EPS20 / 900-MB-Pages-Codec / Worker-/Pages-Readback bleibt unangetastet.
- Zwei Scheduler-Slots, GitHub- und Cloudflare-Watchdog und atomarer RUC-Releasepfad existieren bereits; nicht als echte datengetriebene P4-Single-Flight implementiert.

## Neuer, unabhängiger P1/P2-Qualifikationsbaustein

`tools/ruc/fast_lane_grib_preflight.py` prüft *bereits lokal gestagte, echte* DWD-GRIB2-Header für exakt 0..+6h oder 0..+14h. Die Standard-CLI ruft den bestehenden ecCodes-Headervertrag auf: GRIB2, DWD-Zentrum 78, Initialisierung, Gültigkeit, nativer RUC-Gitter-Fingerprint, feste GRIB-Flächen-/Parametertypen, Akkumulationssemantik. Zwölf deterministische Felder müssen alle stündlichen ValidTimes erfüllen. EPS TOT_PREC wird **separat** auf alle 20 nummerierten Mitglieder zu jeder ValidTime geprüft; CLAT/CLON-Header bilden einen dritten unabhängigen Status. Nachweisdateien erhalten GRIB-Bytes und SHA256 je Quelldatei. Alle Fehlerfälle einschließlich fehlender Stunden und EPS-Mitglieder bleiben Missing statt 0. Das Werkzeug lädt nichts aus dem Netz, sendet keine Dispatches und publiziert nichts.

Auf bereits geprüftem originalem DWD-Staging:
```bash
python tools/ruc/fast_lane_grib_preflight.py \
  --staging /secure/read-only/staged-run \
  --run 2026-10-31T18:00 --hours 6 \
  --output /secure/new/fast-lane-headers.json
```
Den letzten Laufzeitstempel und Pfad **nicht** blind übernehmen. Der Input muss tatsächlich aus diesem Run stammen. In der neuen Datenpipeline vor produktiver Verwendung zusätzliche SHA-gebundene, authentifizierte Producer-Lineage und unveränderliche Objekt-Identität prüfen; eine nachträgliche Selbstdeklaration reicht nicht. Der Output wurde absichtlich nicht in den produktiven Pointervertrag integriert.

`tools/ruc/test_fast_lane_grib_preflight.py` enthält adversarielle Offline-Fälle (6h/14h, einzelne fehlende Stunden/Felder, 20-EPS-Fehlstellen, Duplikate, unerlaubte Member, Lauf-/Koordinatenmischung, Symlink, falsche Feldliste, Header-Beweis ohne Publikationsrecht). In kanonischer und aktiver Telemetrie-PR-Qualifikation aufgenommen; ein grüner Unit-Test ist **keine** reale GRIB-Wert-/Bitmap-/EPS-Abnahme.

## Zusätzlich: reale Einzeldatei-/Bitmap-/Werteprobe und robuster Messbetrieb (Draft)

`tools/ruc/real_grib_first_field_shadow.py` wählt ausschließlich eine tatsächlich im DWD-Index gelistete native `T_2M`-Datei für +0/+1h, prüft strikte HTTPS-Herkunft und Redirectfreiheit, lädt **höchstens 16 MB** komprimiert und entpackt BZip2 in eine temporäre Datei mit **80-MB-Hartgrenze**. Die freigegebene `read_messages`-/`normalize`-Fachlogik validiert reale DWD-GRIB2-Header und native Bitmap/Werte, Einheiten, Zeit/Run/Grid, fehlende Punkte und plausible unveränderte Temperatur-Extrema. SHA256, Anzahl valider/fehlender Zellen und zensierte Beobachtungszeit werden als JSON-Evidenz gespeichert; Roh-GRIBs werden vernichtet. **Das ist nur ein tatsächlich dekodiertes Feld eines Termins, weder ein vollständiger RUC-Lauf noch EPS20 noch ein 60-Minuten-SLO.** Netzwerk-, Daten-, Quota- und Dekodierfehler ergeben im Bericht `observationStatus: unknown`, ausdrücklich keine synthetische Null.

Die bestehende `mid-ruc-availability-observer.yml` erhält einen zweiten, nicht schreibenden Auslöser nach **erfolgreichem** `MID RUC schedule watchdog`-Workflow ausschließlich vom `main`-Branch desselben Repositorys; der SHA-identische Stable/Main-Checkout bleibt Pflicht. Ein eigenes, eng begrenztes `native-first-field`-Jobfenster wird nur beim **einen stündlichen** Cron `33 * * * *` aktiv. Alle übrigen Verzeichnis-/Pages-Readbacks behalten ihre bisherigen Termine (3, 18 und 48 Minuten). Job-Permissions nur `contents: read`; keine neuen Tokens, Dispatches, Produktiv-Zeiger oder Deployments. Keine externe Cloudflare-Konfigurationsänderung. Die native Probe verwendet die freigegebenen Python-3.12/ecCodes/NumPy-Bereiche aus MID und maximal 8 Minuten Runnerzeit; Ergebnisartefakte 14 Tage, Fehler werden mit unveränderter Fehlersemantik markiert. Github-Schedule bleibt best effort; erfolgreiche Triggerausführung und echte Probe müssen nach Freigabe **live** nachgewiesen werden.

Kanonische/aktive Workflows müssen byteidentisch bleiben. Der zusätzliche `test_ruc_observation_workflow_contract.py` sichert Herkunftsfilter, SHA-Grenzen, Least Privilege, Ein-Stunden-Probe, unveränderten Ausgabepfad und die zwei Workflows. `test_real_grib_first_field_shadow.py` deckt URL-Umlenkung, Doppellinks, Byte-/Dekompressionslimits, Temperatureinheiten, echte NoData-Anzahl und unknown-Failure-Reporting adversarial ab. Alle Standalone-Tests benutzen künstliche Payloads; der einzige authentische Nachweis ist ein **tatsächlich erfolgreicher** späterer DWD-Probelauf.

**Wichtiger Versionskonflikt:** Parallel läuft der eigenständige Designrelease-PR #550 für v0.9.85.390. Dieser RUC-PR #551 ist darum ausdrücklich **kein freigegebenes .390-Release** und verbleibt Draft. Eine spätere Integration verlangt frische Stable-SHA, eine freie neue Version und alle Versionsspiegel/Source-/Installer-/Worker-/Pages-Gates.

## 168-Stunden-Erstwerte-Schattenauswertung (zusätzlicher P1-Kandidat)

`tools/ruc/ruc_real_grib_interval_report.py` und die dazugehörigen Negativtests erfassen pro 168-stündigem UTC-Modelllauf-Fenster **nur** einen wirklich erfolgreichen `real-grib-first-field-shadow.v1`-Nachweis für den jeweiligen Lauf. Duplizierte Polls werden nicht als weitere Läufe gezählt. Fehlgeschlagene oder fehlende Polls sind **unknown/right-censored**, niemals GRIB-Nullwerte oder Evidenz, dass ein Feld bei DWD fehlte. Die P50/P90/P95-Werte sind ausschließlich **obere Latenzgrenzen zum ersten bestätigten Einzeldatei-Poll**. SHA256 der Datei ist in der Probe vermerkt, aber weder amtlich signiert noch extern kryptografisch bezeugt. 168 Einzeldateiproben würden weiterhin weder alle zwölf Felder noch EPS20, verlustfreies Packing, Client-Adoption oder ≤60-Minuten-SLO belegen.

**Offline-Tests:** 6 zusätzliche adversarielle Tests (darunter 168 synthetische Modellläufe, 1/168, Duplicate/Unknown, Provenienz, UTC, Grid/Bitmap und künstliche Freigabeflags); standardmäßig via `mid-ruc-telemetry-qa.yml`. Echte 168h-Beobachtungen sind noch nicht vorhanden. Roh-GRIBs werden nicht im Repo archiviert. Auswertung nach mindestens sieben realen Tagen aus den unveränderten Beobachtungsartefakten; kein automatisches Stable-/Publisher-Gate.

**Provider-Gegenprobe:** Ein im offiziellen DWD-Verzeichnis historisch gelisteter ICON-D2-RUC-T_2M-Lauf 2026-10-31T12:00 zeigte dateibasiert `PT000H00M` mit Verzeichniseintrag 12:31:45 UTC und `PT006H00M` um 12:34:15 UTC. **Das sind HTML-Verzeichniszeitstempel, keine verifizierten echten Erstveröffentlichungs- oder GRIB-Wertzeitpunkte und nur ein Feld/ein Lauf.** Eine vollständige 0–6h-Freigabe ist daraus verboten.

**Versionsdrift:** Parallel wurde Design-PR #553 als **nicht-Draft v0.9.85.391** aus der veröffentlichten .390 erstellt. RUC-PR #551 bleibt auf seiner separat gesicherten früheren Basis *Draft*, ohne Versionserhöhung oder Release; er darf nicht ungeprüft auf .391 promotet werden.

## Verbindlich offene P1–P5-Gates

1. **P1** echte, wiederholte DWD GRIB-Datei-/Header-/Wert-/Bitmap-Verfügbarkeit über mindestens 168 aufeinanderfolgende Initialisierungen und Beobachtungsfenster; zensierte Stichproben korrekt ausweisen. Der neue Header-Preflight ersetzt dies nicht.
2. **P2** separat versionierter RUC-Fast-Lane-Producer, SHA-gebundene atomare Veröffentlichung, unabhängiger Namespace/Pointer und vollständige kompatible Web-/iOS-/Widget-/Export-Fusion. Kein EPS-Pseudovollstand, keine gemischten gültigen Intervalle.
3. **P3** GRIB-Cache und native Koordinaten nur nach echtem Fingerprint und vollständigem CPU-/RAM-/RUC-Bytebudget-A/B; keine Wegnahme bestehender Daten oder Tests.
4. **P4** GitHub/Cloudflare Single-Flight gegen *authentisch* vollständig geprüfte neuere Quellen; Cancel-/Queue-/Watchdog-/Race-/Quota-/Recoverytests. Alle bestehenden externen Rechte und Secrets unverändert.
5. **P5** reale 168h-Serien über DWD→Build→SHA→Pages→Worker→Client einschließlich Widgets/Export, keine aus synthetischen oder beobachteten Upper Bounds abgeleiteten 60-min-SLO-Zusagen.

**Fail-closed:** Es gibt keinen Fast-Lane-Deploy, keinen neuen kostenpflichtigen Dienst, keine Änderungen am 27h-Kern, keine RUC-Datenveröffentlichung und keine erteilte Freigabe zum Stable-Promotion. Draft bleibt isoliert. Späterer Live-Release verlangt neue Version/Spiegel/Baseline sowie vollständigen MID Source-PR→SHA-Bot→Server-ZIP→Installer→Worker/Pages→Stable-Pfad.
