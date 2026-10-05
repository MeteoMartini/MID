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
