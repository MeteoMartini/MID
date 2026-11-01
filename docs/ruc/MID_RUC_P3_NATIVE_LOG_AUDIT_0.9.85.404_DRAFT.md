# MID RUC P3 · native EPS20-Fachzeiten aus einem Original-Workflow-Log prüfen

**Status:** nicht veröffentlichter, strikt lesender QA-Kandidat für einen künftigen .404-Sammelrelease. Verifizierte Ausgangsbasis `main=mid-stable` v0.9.85.403, SHA `e908b767a9db09df6f07afef86e471978807b5bb`; 1059 Pflichtregressionen, fünf aktive Rulesets. Der parallele .404-Design-Draft #590 bleibt unverändert und muss vor einer Versionierung/Integration erneut SHA-geprüft werden.

`tools/ruc/ruc_p3_native_log_audit.py` verarbeitet zwei *tatsächlich von der .403-Produktionsquelle ausgegebene* Marker aus **einem** übergebenen Log: `RUC_P3_PHASES` und `RUC_P3_EPS_TIMINGS`. Deren Laufidentität, erwartete Vollgebietsdimension 542040 Punkte / 20 Mitglieder / 28 ValidTimes / 133 × 4096-Punkte-Chunks, endliche nichtnegative Zeitwerte und eine physikalisch plausible Summe der verschachtelten Phasen werden verifiziert. Mehrfachmarker, unvollständige Phasen, invalide Daten und zu große Logs werden fail-closed abgewiesen.

Die Ausgabe trennt Download-/Staging-Laufzeit, die gesamte Builder-Laufzeit, originale EPS-Mitgliederschreibzeit, die tatsächliche `eps_summary`-Berechnung und Summary-Packing. **Die Differenz aus gesamter Builder-Zeit und diesen drei EPS-Phasen ist keine nachgewiesene reine GRIB-Decodierzeit.** Auch die Summe der beiden ersten Phasen ist kein echter SHA-identischer Vorher/Nachher-Vergleich.

CLI-Beispiel für eine lokal bereits **autorisiert und SHA-verifiziert heruntergeladene** GitHub-Kalkulationsjob-Logdatei:

```sh
python tools/ruc/ruc_p3_native_log_audit.py --job-log /safe/path/calculate.log --workflow-run-id 41332344121 --head-sha e908b767a9db09df6f07afef86e471978807b5bb --model-run 2026-11-01T16:00 --output /safe/path/p3-native-audit.json
```

Workflow-ID und Head-SHA sind *vom Aufrufer gelieferte Identitätsbehauptungen*. Der Offline-Parser verfügt **nicht** über eine GitHub-Authentifizierung, lädt keine echten DWD-GRIBs und kann deren Quellen-/Bitmap-/Byte-SHAs nicht belegen. Der Modelllauf in diesem Beispiel ist nur ein CLI-Platzhalter: tatsächlichen Lauf vorher aus dem Original-GitHub-Job verifizieren. Alle Freigabeflags bleiben **false** (Produktions-Speedup, 900-MB-Peak, Original-GRIB-Parität, 168h-/Client-P95-SLO). Keine zusätzlichen Worker-/Pages-/DWD-/GitHub-Schreibrechte und keine produktive EPS20-Quantilalgorithmus-Umschaltung.

Der bestehende read-only P3-EPS20-Paritätsworkflow führt zusätzlich die ausführbaren Negativtests dieses Parsers aus, ohne Pflichtchecks abzuschalten. Für echte P3-A/B-Abnahme zusätzlich: gleiche originalen GRIB-Input-SHAs, vollständiger 27h/20EPS/542040-Punkte-Wire-Bytevergleich, CPU-/Peak-RAM-Messung, physische Pages-Gesamtsumme unter 900 MB sowie E2E-Readback nach SHA-gebundener MID-Release-Freigabe.
