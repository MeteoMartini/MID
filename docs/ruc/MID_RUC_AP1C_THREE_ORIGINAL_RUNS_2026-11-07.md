# MID AP1c – drei aufeinanderfolgende echte DWD-Originaldatenläufe, 07.11.2026

**Status:** Read-only wissenschaftliche QA-Evidenz, **kein Build, keine Freigabe, keine amtliche Warnung, keine Produktions-SLO-Zusage**. Entstanden aus dem SHA-gesicherten Draft [PR #684](https://github.com/MeteoMartini/MID/pull/684) für [Issue #541](https://github.com/MeteoMartini/MID/issues/541).

## Provenienz und reproduzierbare Prüfergebnisse

- Kanonische Basis `main=mid-stable`: **v0.9.85.445**, full SHA `b6526e7c5c24035bd1a75b87b77e7bb8e821c334`.
- QA-Probe und Backpressure: `tools/ruc/ruc_p1_original_native_values_probe.py` und `tools/ruc/test_ruc_p1_original_native_values_probe.py`; vollständige Python-/P1-P5-Offline-QA vor jedem großen Echtdatenversuch.
- Zwei erfolgreiche Workflow-Ausführungen: [42379074684](https://github.com/MeteoMartini/MID/actions/runs/42379074684), [42380888840](https://github.com/MeteoMartini/MID/actions/runs/42380888840). Source-Checkout auf jeweiligem exakten PR-HEAD, SHA/Stable-Abgleich vor DWD-Netzwerkverkehr; Artefakt-ZIPs eigenständig erneut geladen, Inhalt und Prüfsummen abgeglichen.
- **Originaldateien wurden im GitHub-Runner echt heruntergeladen/dekodiert.** Das Archiv bewahrt SHA-256 jeder Originaldatei, Metadaten, geprüfte Wertestatistik, Bitmap-/Missing- und Akkumulationsbefunde; **keine GRIB-Rohdateien**. Eine externe erneute Voll-Dekodierung aus den JSON-Archiven allein ist deshalb nicht möglich.

| DWD-RUC Initialisierung UTC | GitHub-HEAD | Dateien | DWD-Bytes | Sek. | Max-RSS KiB | Artifact-ID |
|---|---|---:|---:|---:|---:|---:|
| 2026-11-07 09:00 | `45f97e02a635c4c97bd0e05bab56ce96800a3905` | 1000 | 515790101 | 578.474 | 234196 | 13577609155 |
| 2026-11-07 10:00 | `45f97e02a635c4c97bd0e05bab56ce96800a3905` | 1000 | 520169376 | 466.029 | 232644 | 13577774813 |
| 2026-11-07 11:00 | `bc61761fb970dd185cf1585268328ec535ef68a8` | 1000 | 514930014 | 569.776 | 235548 | 13577341289 |

ZIP-SHA256 / darin enthaltene JSON-SHA256:

- **09Z**: `df3c5f54d35802deefa70a748cd79a8892ffc82ee42f3030f27d85112215e7e1` / `a241e0161db42798192d7790dad9af4e562460a41a55ae21d3e69b3fb590c902`.
- **10Z**: `005a0ddd6a0e3bbf3cf6cae59508b4af0f64c86a7aa4ed75a523d6dcaeb5dcf6` / `675410af2039e3758c2b982bb2eb9ea5ee0eb13eea831b3fd9ed1a8f61f850a0`.
- **11Z**: `ddade900bee7a934916d86befe6d81af516b8ba660c42d11797ec636920d95c3` / `f3fc4af35c47d206f682a6bc2315c6340582b737c451e542005effe0d66dc4ee`.

## Feld- und Datenintegrität

Die drei Archive wurden unabhängig vom angezeigten Actions-Status als ZIP und JSON geöffnet. Die Gesamtmenge enthält **3000 eindeutige Originaldatei-URLs und 3000 unterschiedliche SHA-256**, jeweils 1000 Datensätze je Modelllauf. Pro Lauf: **560 EPS-Datensätze = 20 Mitglieder × 28 volle Stunden 0…27**, plus **440 deterministische, native Rapid- und Koordinaten-Datensätze**. Jeder Datensatz nennt 542040 native Gitterpunkte. Keine fehlenden oder doppelt belegten EPS-Mitglied/Lead-Paare.

| Integritätsbefund | 09Z | 10Z | 11Z | gesamt |
|---|---:|---:|---:|---:|
| Originalwerte und Bitmap-Missing konsistent | 1000 | 1000 | 1000 | **3000** |
| Echte trockene Nullzellen, nicht Missing | 126663184 | 128537632 | 129491311 | **384692127** |
| Als fehlend ausgewiesene Zellen | 16934064 | 16934064 | 16934064 | **50802192** |
| Als Missing→Null deklariert | 0 | 0 | 0 | **0** |
| Als geglättete Extreme deklariert | 0 | 0 | 0 | **0** |
| Geprüfte Akkumulationspaare gegen Vorlead | 612 | 612 | 612 | **1836** |
| Fehlgeschlagene geprüfte Monotonievergleiche | 0 | 0 | 0 | **0** |

Diese Zahlen sind **Originaldatenstatistiken der Probe**, keine meteorologische Prognosegüte. Die Flags `missingAsZero`/`extremesSmoothed` sowie die lokalen Extremwert- und Einheitenprüfungen sind ein Prüfsignal des Kandidaten; sie ersetzen keine fachliche Zulassung des kompletten produktiven Modellpfads. Missing bleibt Missing; echte Null wird nicht wegmaskiert. Keine ungeprüfte Glättung extremer Wetterwerte.

## Speicher, Reproduzierbarkeit und Grenzen

- Originaler Ein-Worker-Versuch [42357321171](https://github.com/MeteoMartini/MID/actions/runs/42357321171): 833 Dateien / 382472894 B, Abbruch durch die gesetzte 26-min-Laufzeitgrenze, kein bestätigter fachlicher Datenfehler.
- Erfolgreicher Zwei-Worker-Backpressure-Ansatz: max 40 MB je GRIB, 1.2 GB aggregiertes Bytebudget mit Lock und Worst-Case-Reservierung konkurrierender Requests; 26 min Skript, 30 min Job, 1.5 GiB nominelle sampled RSS-Schwelle; prüft Reihenfolge, Original-SHA, WMO-/UTC-/Member-/Grid-/Units-/Bitmap-/Werte-/Akkumulationsverträge. Keine produktiven Mutationen.
- Die einmalige GitHub-PR-Body-Auslösefreigabe wurde nach Einplanung beider Folgejobs entfernt. Künftige normale PR-Updates starten keine erneuten 1000-Dateien-Jobs. Die historische AP1b-Draft #681 bleibt unangetastet.

## Ausdrücklich noch nicht erfüllt – Issue #541 P1 bis P5

Das getrennte offizielle RUC-Observer-Archiv [42369751504](https://github.com/MeteoMartini/MID/actions/runs/42369751504), `mid-ruc-original-observer-168h-42369751504-1` / Artifact 13573357243, ZIP-SHA256 `0f7b4bfdce3a9eaf1a69d263d056281a498424309a889cf3568bb5c5f8fcbf8a`, beschreibt ein 168h-Zeitfenster 2026-10-31T12:00Z bis 2026-11-07T11:00Z, aber **48 Ausführungsversuche ohne verwertbares Artefakt bei 120 inventarisierten Versuchen**, davon **47 GitHub-`workflow_run`-Ausführungen mit Conclusion `skipped`** und **nur ein `schedule`-Lauf mit Conclusion `success` ohne verfügbares Artefakt**, 126 DWD-Verzeichnisbeobachtungen und 63 öffentliche Pages/Worker-Readbacks. Ein `skipped`-Versuch ist kein fachlicher DWD-Fehler und darf nicht als misslungener Download oder gemessene Upstream-Latenz gezählt werden. Weitere 7 Beobachterausführungen sind als `release-drift`, 8 mit partiellem öffentlichem Readback und 2 als `missing-status` kategorisiert. Auch die Aggregatzahlen dürfen **nicht als 168h vollständige Messabdeckung** interpretiert werden. Die 168 Stunden umfassenden Tabellen sind *zensierte Directory-/Readback-Beobachtungen*, **keine 168 Stunden Original-GRIB-Bitmap-/EPS20-Verifikation**. Insbesondere sind die 168 möglichen EPS20-Stundenläufe im Observer-Archiv nicht als vollständige Originalwerte verifiziert; exakte Erstveröffentlichung DWD unbekannt. Die drei neuen Vollprüfungen sind separate, nicht rückwirkend die fehlenden historischen Polls ersetzende Einzelfälle.

Offen bleiben insbesondere: belastbares DWD-Erstveröffentlichungsintervall und zensierte P50/P90/P95 für das echte Originaldateninventar über 168+ Stunden; P2 isolierte voll geprüfte Fast Lane; P3 reale Produktions-A/B-Äquivalenz; P4 Trigger-/Fencing-/CAS-/Rollback-Integrität; P5 Pages/Worker/Web/iOS/Widgets/Exports inklusive echter Clientübernahme und E2E-Latenzen. Keine Umdeutung von Missing in 0, keine verspätete Beobachtung als ursprünglichen Veröffentlichungszeitpunkt ausgeben.

**Entscheidung:** AP1c-b *drei aufeinanderfolgende DWD-Originaldatenläufe* = **QA PASS**. **Produkt-Release, 168h-Frische-SLO, Merge und Stable-Promotion = BLOCKED / NOT VERIFIED.** Verbindlicher Releasepfad bleibt Source-PR → SHA-gebundener kontrollierter Merge → serverseitiges Release-ZIP → Installer/Worker/Pages-Gates → Stable-Promotion.
