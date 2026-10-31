# MID · RUC-Prioritäten 1–5: read-only Messpilot (Draft, keine Publikationsfreigabe)

**Ursprungsbasis bei Erstellung:** `main == mid-stable`, v0.9.85.385, `1ade69f46b9bf77e9adaa360353ffacc7a0b967c`; fünf GitHub-Rulesets aktiv. Parallele Design-Drafts #538/#540 für `.386` bleiben vollständig unberührt. Diese Datei reserviert keine neue Releaseversion. Vor jeder Integration ist Stable/Main neu abzugleichen.

## P1 · Datenherkunft und Messdefinition

Der neue **nur lesende** HTML-Indexsampler nutzt ausschließlich DWD Open Data über HTTPS, maximal vier parallele Verzeichnisanfragen, begrenzte Timeout-/Indexgrößen und bis zu zwei aktuelle Runs. Für alle zwölf bereits qualifizierten deterministischen RUC-Felder wird der DWD-Dateinamen-Index nach stündlichen Lead-Zeiten 0–6/0–14/0–27h ausgewertet. `TOT_PREC` des RUC-EPS wird **nur als vorhandenes Verzeichnis-/Dateiangebot** erfasst. Das erste gelistete Feld ist nicht das erste vollständig lesbare Feld.

**Wesentliche Unsicherheitsgrenze:** Eine HTML-Liste verifiziert weder GRIB-Header, 20 eindeutige EPS-Mitglieder je Stunde, NoData/Bitmap, CRS/Grid, vollständige Werte, SHA, noch die Uhrzeit der allerersten Veröffentlichung. Der reale DWD-Publikationszeitpunkt liegt frühestens nach einer vorherigen negativen Stichprobe und spätestens beim ersten positiven Abruf. Ohne vorherige negative Stichprobe bleibt die linke Schranke unbekannt. GitHub-Schedule ist best effort: 15-min-Cron bedeutet **keine garantiert exakten 15-min-Beobachtungsabstände**. Netzwerkfehler werden `unknown`, niemals `0` oder vollständige Lieferung.

Ein beabsichtigter eigener GitHub-Observer-Workflow sammelt, wenn er **regulär freigegeben** ist, datums-/rungebundene JSONL-Artefakte mit 14 Tagen Retention (keine neuen Secrets/Cloudflare-/Produktionsrechte). Die Offline-Aggregation berechnet als **vorsichtige obere Beobachtungsgrenzen** P50/P90/P95 nach Nearest-Rank, zählt fehlende/eindeutig unvollständige/nie beobachtete Stundenläufe separat, und gestattet die Kennzeichnung `sevenDayComplete` nur bei 168/168 für diese Stufe positiv beobachteten Run-Slots. Ein Verzeichnis-Quantil darf niemals als tatsächliche DWD-Publikationszeit bezeichnet werden. Die EPS-Mitglieds-P95 und der echte End-to-End-SLO bleiben ohne unabhängige GRIB-/Deployment-Belege `null` bzw. `false`.

## P2 · Separater Fast-Lane-Produktvertrag (NICHT aktiviert)

* Neue, eigens versionierte `fast`-Snapshot-/Pointer-Namespace neben dem unveränderten `27h/20-EPS`-Produkt; niemals `ruc/latest.json` auf verkürzte Horizonte umbiegen.
* Zulassung erst bei authentischen *vollständigen* deterministischen 0–6h-Feldern, Rapid-Kadenz, Native-Grid, korrekter Run/ValidTime-/Akkumulationssemantik und wissenschaftlich plausiblen Werten. EPS nur dann auf der Fast Lane ausgeben, wenn die für dieses Produkt vertraglich geforderte tatsächliche Mitgliedervollständigkeit auch vorliegt; ansonsten `availability: unknown/unavailable`, **nicht EPS=0**.
* `0–14h` als separate mögliche zweite Stufe erst nach echter Header-/Werteabnahme; 27h/20-EPS-Pipeline unverändert weiterlaufen lassen.
* Worker/UI darf frisches Fast-Produkt und vollständiges älteres Produkt nur bei explizit typisierter Quellen-/Lauf-/ValidTime-Abgrenzung fusionieren. Keine stillen Intervallmischungen oder versteckten Lücken; alle Consumer inkl. Widgets/Exporte brauchen Paritätstests.
* Shadow-/Canary-Nachweis auf realen DWD-Runs; keine Fast-Produktionspublikation aus Verzeichnislisten.

## P3 · Verarbeitung und Ressourcen (NICHT aktiviert)

* Bereits vorhandenes `prepared_snapshot`-SHA-Handoff und `prepared-map-grib`-Cache sind die erste Wiederverwendungsbasis. Kein Doppel-Download identischer GRIBs je Run/Parameter/Lead/Byte-SHA. Keine Wiederverwendung über geänderte Modellläufe, Schema, Native-Koordinaten, Lock-/Codecversionen oder Provenienz hinweg.
* Native ecCodes-Arbeit in isolierten Prozessen, unabhängige Felder kontrolliert parallel; Speicherlimit, Aufräumverhalten und Wiederanlauf adversarial testen. Alle 27h/20-EPS-Checks und SHA-/Werte-/NoData-/Decoder-Proofs beibehalten. Zeitgewinn ausschließlich mittels echter vergleichbarer A/B-Läufe beurteilen.

## P4 · Datengetriebener Trigger (NICHT aktiviert)

* Trigger erst auf einen SHA-/Header-verifizierten neuen Kandidaten ausrichten, mit atomarer Single-Flight-Lock-Koordination zwischen GitHub- und Cloudflare-Watchdog; `force=false` und zeitliche Staleness nicht durch Verzeichniswerbung allein übergehen.
* Zeitliche Zuverlässigkeit und Kosten unter echten GitHub-Schedule-Ausfällen/Quoten nachweisen, keine zusätzlichen Secrets oder kostenpflichtige Infrastruktur.

## P5 · End-to-End-Qualifikation/SLO (NICHT erfüllt)

* End-to-End pro Run: DWD-Feldanfang, 6/14/27h-Det.-Vollständigkeit, EPS je ValidTime/20 Mitglieder, Download/Decode/GRIB-Checks, native Koordinaten, SHA, Builder, Zeit-/RAM-/900-MB-Budget, Pages latest, Worker ruc-health, tatsächlich verwendeter App-Run inkl. Widgets/Exporte.
* Kein `missing` als 0; Extremwerte nicht ungetestet glätten; verbundene Zeitsegmente nur bei überprüfter fachlicher Validität; 25/23h-Lokalzeit separat.
* Zielwert `RUC 0–6h ≤60 min` erst nach empirischer, mindestens siebentägiger Verfügbarkeits- und Deployment-/Client-P95 als **SLO** festlegen, nicht aus den prognostizierten Gewinnen oder der beobachteten Directory-P95 ableiten.
* Kontrollierter Release nur Source-PR-Gate → SHA-Bot-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. Der hier gesicherte Draft enthält **kein** Fast-Lane-Deploy und keine Releasefreigabe.

## Test-/Abnahmegrenze

Vorbereitende lokale Tests: `python tools/ruc/test_dwd_availability_observer.py`, `python tools/ruc/test_dwd_availability_report.py`; Dateiquellen und YAML-Kopie vor PR diffbar. Kein DWD-Livenetz aus der lokalen Umgebung, keine echten sieben Tage, kein lokales Gesamt-MID-Repo, kein Full-CI-/Worker-/Pages-/App-Nachweis. Der neue Workflow ist über die kanonische `ci/github/workflows/`-Datei und die byteidentische `.github/workflows/`-Spiegeldatei auszurollen; jede reale Aktivierung benötigt alle regulären Source-Gates und Versionsspiegel.
