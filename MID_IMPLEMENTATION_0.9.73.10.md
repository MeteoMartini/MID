# MID v0.9.73.10 – RUC-Zeitachsenfix nach produktivem Run #6

## Anlass

Der manuell gestartete GitHub-Actions-Lauf **MID DWD RUC preprocessing #6** (`run_id 33260127605`, Stable-SHA `fb1c6b54e1abc4e210fa2262869f9305240df64f`) scheiterte reproduzierbar beim Bauen des RUC-Bundles. Download, DWD-Lauf-Erkennung, ecCodes und RUC-EPS funktionierten; der Fehler lag im seit v0.9.73.7 zu streng formulierten Zeitachsenvertrag.

Für die Kandidaten 14:00, 13:00, 12:00 und 11:00 meldete der Builder jeweils fehlende Viertelstundenwerte, beispielhaft:

`temperature_2m: missing hourly targets: ...14:15, ...14:30, ...14:45, ...15:15`

DWD veröffentlicht die einzelnen ICON-D2-RUC-Parameter mit unterschiedlichen nativen Taktungen. Niederschlags- und Konvektionsparameter besitzen feinere Leads, während für die gemeinsame Kombination aus Temperatur, Taupunkt, Feuchte, Druck, Wind und Wolken keine durchgängige gemeinsame Viertelstundenachse vorliegt.

## Korrektur

### Gemeinsamer deterministischer RUC-Kern

- Der veröffentlichte mehrparametrige RUC-Punktadapter verwendet wieder die **gemeinsame native Stundenachse 0…+14 h**.
- Der Fetcher lädt für alle Felder des gemeinsamen deterministischen Bundles nur ganze Stunden (`hourly_only=True`).
- Der Builder verwendet `hourly_targets()` für den gemeinsamen deterministischen Kern und für RUC-EPS.
- RUC-EPS bleibt wie zuvor stündlich bis +14 h.

### Kein Erfinden von Viertelstundenwerten

- Fehlende Temperatur-, Wind-, Druck- oder Wolkenwerte werden **nicht** auf :15/:30/:45 interpoliert.
- Feinere DWD-Leads von `TOT_PREC`, CAPE/CIN oder künftigen Einzelprodukten dürfen später als getrennte, typisierte Fachprodukte genutzt werden, dürfen aber nicht die Zeitachse des gemeinsamen Zustandsvektors erzwingen.
- Die sichtbare 15-Minuten-Kurzfrist in MID bleibt fachlich bei nativen 15-Minuten-/Radar-/Nowcast-Quellen; der RUC-Kern kalibriert diesen Pfad stündlich statt künstlich hochgerechnet zu werden.

### Metadaten / Worker

- `DWD ICON-D2-RUC` weist für den produktiven gemeinsamen Punktadapter jetzt korrekt `temporalResolutionSeconds: 3600` aus.
- Modelltexte benennen den Pfad als **„gemeinsamer Stundenkern bis +14 h“**.
- Da sich Worker-Metadaten semantisch ändern, ist nach grünem Release-CI-Gate die normale automatische semantische Worker-Auslieferung erforderlich. Ein manueller Notfall-Upload ist nicht vorgesehen.

## Regressionen

Neu geschützt durch `scripts/test-ruc-common-hourly-axis-097310.mjs` sowie aktualisierte bestehende Verträge. Lokal grün:

- Python-Syntax für Fetcher und Builder
- synthetischer 0…14-h-Stundenachsencheck
- `test-ruc-common-hourly-axis-097310.mjs`
- `test-ruc-dwd-pipeline-09690.mjs`
- `test-mid-nine-step-integration-09530.mjs`
- `test-model-meta-source-init-08321.mjs`
- `test-ruc-fusion-runtime-09691.mjs`
- `test-ruc-pages-free-storage-09700.mjs`
- `test-ruc-storage-health-09692.mjs`
- Worker-Syntax
- Workflow-Mirror `.github` ↔ `ci/github`

## Produktionsstatus

`MID_RUC_STATUS.json.productionIngestionExecuted` bleibt bewusst `false`, bis ein **frischer RUC-Workflow nach Veröffentlichung von v0.9.73.10** einen Snapshot erfolgreich auf GitHub Pages publiziert und der Worker-Healthcheck diesen bestätigt. Der alte Run #6 wird nicht erneut gestartet, weil ein Rerun weiterhin den fehlerhaften v0.9.73.8-Stable-SHA verwenden würde.
