# MID DWD ICON-D2 regular original batch · 9-Lead Science & Production Separation

Status: **DRAFT / read-only A/B pending / NO RELEASE**. Datum: 2026-11-03.

## Identität und Provenienz
- Verifizierte Released-Base: `main=mid-stable` MID v0.9.85.414 SHA `b2b9bb3c3eab78fac117bd0b0d2110b1ce127b66`.
- Die drei DWD-Bestandteile `build_model_map_fields.py`, `dwd_stage_batch_reuse.py` und `test_dwd_stage_batch_reuse.py` werden auf einem **separaten autorisierten ChatGPT-Branch** mit unveränderten verifizierten Blob-SHAs aus Draft PR #636 entnommen. PR #636 bleibt Open-Meteo-/RUC-Shadow und gibt keine Originaldaten frei.
- Diese DWD-Änderung dedupliziert ausschließlich **exakte originale HTTPS-Quell-URLs innerhalb eines Laufes und eines Builder-Batches**, nicht unterschiedliche Parameter, Modellläufe, Zeitschritte, Gitter oder abgeleitete Open-Meteo-Daten.
- Es werden keine GPL-Open-Meteo-Reader, Kartenrenderer oder OM-Datendownloads eingebunden. Kein Eingriff in Worker/RUC/EPS/Fast/Pages, keine Secrets, kein Produktionspublishing.

## Erforderlicher wissenschaftlicher Originaldatenbeweis

Science-Skript: `tools/ruc/dwd_real_regular_nine_lead_ab_science_qa.py`. Es prüft den DWD-ICON-D2-Lauf 2026-11-03 09Z mit **neun** Lead Hours `1,2,3,4,5,6,12,24,48`, **zehn** originalen Quellenparametern, daraus **99** tatsächlichen Quellreferenzen, **94** erwarteten unterschiedlichen originalen komprimierten GRIB-URLs und genau **72** gzip-Frames aus **acht** Kartenfeldern x **neun** Zeiten.

Die 94 unterschiedlichen Source-Dateien werden mit echten DWD-Bytes einmal vom Server geladen und jeweils vollständig SHA256-fingerprinted. Ein Original-Builder lädt die Bytes für alle 99 Anforderungen; der Kandidat lädt genau die 94 eindeutigen Bytes. Beide verarbeiten **dieselben** Originalbytes; der unveränderte GRIB-Decoder bleibt in jedem Lauf für Einheiten, UTC-Init/Gültigkeit, Raster, Phasen-, Wind- und Akkumulationssemantik verantwortlich. Erwartet werden Bytegleichheit aller 72 komprimierten Ausgaben inklusive SHA256 und Gleichheit von Source-Provenienz, Manifest, Model-Run- und Validity-Feldern (allein `generatedAt` ist volatil).

### Korrekte Performanceinterpretation
- Messen: tatsächliche Bytegrößen aller 94 DWD-Originalquellen, 99 vs 94 `requests.get`-Aufrufe unter exakt demselben unveränderlichen Replay, die **5 eingesparten echten komprimierten Originalkörper** in Bytes sowie Median der Map-Berechnungslaufzeiten aus drei A/B-Paaren.
- Originaldownloads werden zur Reproduzierbarkeit **einmal** ausgeführt, nicht für beide Vergleichsvarianten neu heruntergeladen. Die theoretische zusätzliche HTTP-Body-Ersparnis für einen ungecachten Live-Lauf ist auf Basis der echten Bytes exakt bestimmbar; eine reale doppelte Ende-zu-Ende-Netztransfermessung oder dynamische CDN-Cachequote wird **nicht** behauptet.
- Download-Zeit einmalig getrennt ausweisen; keine Hochrechnung dieses Benchmarks auf 27h-RUC, 20 EPS, 5-/15-Minuten, atomare Pages-Site oder 168h Endclient-Frische.
- Vor eigenständiger Freigabe muss auch der reguläre Pipeline-E2E-Effekt belegt werden; ein einzelner GitHub-Runner-Median ist **keine** Betriebs-SLO.

### Freigabestrenge
- Der isolierte, nichtprivilegierte `dwd-nine-lead-science.yml`-Workflow wird ausschließlich auf diesem Draft/PR-Branch ausgeführt. Er ist **temporäre Wissenschafts-Qualifikation**, nicht Bestandteil der dauerhaften mandatory Release-Gates. Nach belegtem Erfolg/fail muss diese temporäre Workflow-Einfügung kontrolliert entfernt und der exakte Source SHA/Blobs dokumentiert werden.
- Source Gate, iOS/Widgets/Exporte, 900MB-Budget, Single-Writer/Fencing/CAS/Rollback, DWD protected signature, EPS20, native Vollgebietsgates und 168h Freshness P95 ≤ 60min bleiben unabhängig verpflichtend. Missing≠0, keine unprüfte Glättung, Extreme/Intervallgrenzen erhalten.
- **Kein Direktmerge, keine Stable- oder Main-Änderung, kein ZIP, keine Produktionsfreigabe** durch diesen Proof.

## GitHub-Actions Originaldaten-A/B – erfolgreich am 03.11.2026

**Exakte Quelle:** [Science Run #41632822563](https://github.com/MeteoMartini/MID/actions/runs/41632822563), Job `125906426104`, Prüflauf-Head `128c218a2dc44c58afb653f6a2596bcbd2c69ece`; ergänzend [Unit/Coverage #41632822442](https://github.com/MeteoMartini/MID/actions/runs/41632822442) jeweils `success`. Ursprünglich auf `main=mid-stable .414` `b2b9bb3c3eab78fac117bd0b0d2110b1ce127b66` gebaut. Detailbericht mit **sämtlichen 94 Original-Quell-SHA256 und 72 gzip-Frame-SHA256**: `docs/ruc/MID_DWD_BATCH_NINE_LEAD_RUN_20261103T09Z_PROOF.json`, Kopie aus den GitHub-Run-Logs; alle Prüfbooleans bleiben unverändert.

| Messung | Ursprünglicher Builder | Deduplizierter Builder |
| --- | ---: | ---: |
| Originale GRIB-Body-Aufrufe im identischen Byte-Replay | 99 | 94 |
| Komprimierte Original-Quellbytes im Byte-Replay | 91.595.380 | 86.326.124 |
| Tatsächliche real heruntergeladene eindeutige Dateien | 94 | exakt dieselben 94 |
| Tatsächliche Original-Input-Bytes aus einmaligem DWD-Download | 86.326.124 | identisch |
| Byte-identische Ausgabe-Frames (alle neun 1/2/3/4/5/6/12/24/48h x 8) | 72/72 | 72/72 |
| Median Build-Rechenzeit ohne Quellen-Download, n=3 | 9,614 s | 9,350 s |

Die realen originalen komprimierten Bytes der fünf redundanten Dateien betragen **5.269.256 Byte**. Das entspricht der rechnerischen Netz-Body-Ersparnis, wenn beide Varianten alle HTTP-Quellen ohne Cache jeweils separat abfragen würden, **nicht** einer separat ausgeführten, wiederholten HTTP-Benchmarkmessung. Die einmalige tatsächliche Quelleinlesezeit für alle 94 DWD-Dateien war **16,805 s**; daraus ist keine verlässliche Live-CDN-Latenzreduktion ableitbar. Originale GRIB-Headerprüfungen für Modelllauf, Gültigkeit, parametergemäße Einheiten/Akkumulationen und Raster bleiben im unveränderten Original-Decoder, der alle 72 Kartenwerte und die Origins erzeugte.

**Drei reale Berechnungs-Paare:**
- Baseline 9,851/9,614/9,592 s gegenüber dedupliziert 9,336/9,350/9,414 s; Median-Differenz 0,264 s. Keine bereinigte Infrastrukturmessung / kein Betriebs-SLO, nur dieser reproduzierbare Runner.
- Unveränderte 72 byteidentische komprimierte Werteprodukte und unverändertes wissenschaftliches Manifest (ohne volatiles `generatedAt`) in allen drei Wiederholungen.
- Originale DWD-Gittergeometrie dieses Proofs ist **germany_regular-lat-lon-Remapping** und der bisherige Deutschland-Ausschnitt. Dieser Proof umfasst **nicht** das unstrukturierte 542.040-Zellen-Vollgebiet, native RUC 27h/EPS20/5m/15m, unabhängige Fast, gesichertes Pages-CAS, 168h Endclient-Frische oder Browser/iOS/Widgets/Exporte.

**Schlussfolgerung:** Wissenschaftlicher DWD-Originaldaten-Byte-Paritätsnachweis bestanden; produktive Auslieferung **weiter gesperrt**. Die einmalige branchbeschränkte Online-Science-Workflow-Einfügung wird nach dieser Beweisaufnahme aus dem PR-Branch entfernt; die offline-regressionsfähige DWD-Batch-Implementierung bleibt in diesem Draft separat von Open-Meteo PR #636. Neuer Source-/Core-/Heavy-/Installer-/Worker-/Pages-/Finalize-Gate erst nach vollständigem kontrolliertem Releasekandidaten; keine vorgezogene Stable-Promotion.
