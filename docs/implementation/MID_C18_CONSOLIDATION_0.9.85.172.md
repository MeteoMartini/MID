# MID v0.9.85.172 – Konsolidierungsprüfung

Freigegebene Ausgangsbasis: .170 / 53671910a16d5bd0d6cf9fe47945891789bb0dff.
Parallelstand main: .171 / abe4c5f3e60977c62fd5fc6b0e48f4d0d9a054c6.
RUC-Quellstand: PR #262 / ff6f8595fde73d4c4b6855d24de1a51af0bc37ab.

## Wechselwirkungen
- .170 Widget/Mountain-Lazy-Chunks und geordnete CSS-Kaskade bleiben bytegleich.
- .171 Source-Gate-Sharding und vollständiges Regressionsinventar bleiben erhalten.
- RUC verändert ausschließlich Python-Ingestion und den eigenen CI-Testschritt. Keine Forecast-, Raster-, UI-, Widget-/PNG-Datenverträge geändert.
- Der RUC-Offlinetest läuft nach vorhandener requirements-Installation; requests ist dadurch verfügbar. Kern/Heavy-Shard-Zuordnung unverändert.
- .172 Versionsspiegel gemeinsam synchronisiert; Worker-Fachcode unverändert.
- Älterer Replit-Mountain-Zweig 259d878f43eddf598151672ce7eaf2648f09c29a: 203 Commits hinter Stable / 15 divergent; keine Vollübernahme. Neue Lazy-Komponente und Fach-/UI-Prüfungen aus .170 bleiben autoritativ.
- Offene Dependabot-Major-Upgrades pako 3 und Wrangler werden nicht ohne separate Kompatibilitätsnachweise eingemischt.

## Verifizierter Veröffentlichungsblocker
Installer 37360821392 Versuch 3: Workerjob 111966273776 wurde von keinem Hosted Runner übernommen. GitHub-Annotation: "The job was not acquired by Runner of type hosted even after multiple attempts". Keine Jobschritte liefen; dies ist kein RUC-/Worker-Codefehler. Versuch 4 ist bereits angestoßen. Kein zusätzlicher konkurrierender Installer gestartet.

## Freigabe
Erst .171 regulär Worker/Pages/Stable abschließen; danach jüngste SHAs erneut lesen und Kandidat prüfen. Kein manueller Stable-Push und kein Gate-Bypass. Die Kandidatenprüfungen gelten nicht als Produktionsveröffentlichung.

## GitHub-Störung: keine Sonderänderungen
Auf ausdrücklichen Nutzerwunsch vom 2026-10-05, 23:18 MESZ wurde die vorbereitete No-op-Worker-Runner-Optimierung vollständig aus dem Kandidaten entfernt. Alle drei Installer-Kopien und der Worker-Vertragstest entsprechen wieder exakt main v0.9.85.171. Keine Runner-, Concurrency-, Retry- oder Release-Gate-Änderungen wegen der externen Störung. Die fachlichen RUC-Download-/Decoderkorrekturen und deren echte Offline-GRIB-Prüfung bleiben bestehen.

## Erneute Ursachenprüfung 2026-10-05
Die jüngsten fehlgeschlagenen RUC-Runs 37370145395 (20:30 UTC, Job 111965182799) und 37368066555 (20:10 UTC, Job 111959899141) haben dieselbe GitHub-Annotation: `The job was not acquired by Runner of type hosted even after multiple attempts`. Die Vorbereitung war cancelled, der Publisher skipped; fehlende Joblogs passen zum Nichtstart. Diese beiden Ausfälle dürfen nicht als DWD-Download-/Decoderfehler bezeichnet werden. Lauf 37371180426 startete dagegen und erreichte die DWD-Ingestion. Die Python-Resilienz adressiert die separat beobachteten Netzwerk-/Vollständigkeitsfehler; sie behebt keine Hosted-Runner-Verfügbarkeitsprobleme.

Alle drei Installer-Kopien (kanonisch, aktiv und workflow-patches-Transport) werden gemeinsam aktualisiert. Die volle Regression prüft diese Gleichheit.

## Realer Decoderbefund und Korrektur
Ein echter ecCodes-Test mit drei gültigen GRIB2-Nachrichten reproduziert beim bzip2-Wrapper `AttributeError: BZ2File object has no attribute mode`. Dies betrifft Header-Vorprüfung, Forecast-/EPS-Bundle-Reader und Koordinatenreader. `grib_stream.open_grib_stream` übergibt ecCodes für bzip2 einen normalen seekbaren temporären Dateihandle; die Dekompression erfolgt in 1-MiB-Blöcken auf Disk, ohne komplette EPS-Dateien im RAM zu halten. Temporäre Dateien werden auch bei Fehlern geschlossen.

Acht Offline-Tests prüfen jetzt zusätzlich echte ecCodes-Nachrichten in GRIB2 und GRIB2.bz2: tatsächliche Gültigkeitszeiten, Builder-Werte, EPS-Lesepfad und Koordinatenreader. Abgeschnittenes bzip2 wird weiterhin verworfen. Diese Tests sind sowohl im Source-PR-Gate vor Auto-Release als auch vor der operativen RUC-Ingestion integriert.
