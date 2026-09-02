# MID Test Report v0.9.77.18

Stand: 2026-09-02

## Gegenstand

Prüfung des ersten verbleibenden Hauptabschnitts „produktiver Cache“ für KNMI HARMONIE-AROME Cy43 P4a: persistenter TAR-Strukturindex im vorhandenen Worker-KV, Rolling-Member-Isolation, Sparse-/Multi-Range-Vertrag und unveränderte sichere Worker-Auslieferung.

## Neue Pflichtregression

Bestanden:

- `scripts/test-knmi-eps-productive-cache-097718.mjs`

Geschützt werden:

- POSIX-TAR-Headerparser und korrekte 512-Byte-Offsetsprünge,
- Indexbau ausschließlich aus TAR-Headern ohne Dateiinhaltsabruf,
- persistenter 72-h-KV-Cache im vorhandenen `MID_PUSH_SUBSCRIPTIONS`-Binding,
- getrenntes Präfix `cache:knmi-eps:tar-index:v1:`,
- 10-min-Isolate-Memory-Cache und Inflight-Wiederverwendung,
- kein `KV.list()` im KNMI-Cache,
- unverändert ausschließlich `sub:`-Präfix für Push-Listen,
- keine Persistenz zeitabhängiger Rolling-Membernummern,
- Wiederverwendung desselben Archivindexes bei geänderter 5er-Memberzuordnung,
- 30 disjunkte Sparse-Ranges als zwei Pakete mit 16 + 14 Teilen,
- kein Gap-/Vollarchiv-Overfetch im Range-Packer,
- `?mode=knmi-eps-cache-health`,
- Aufnahme des Moduls in den kanonischen Worker-Aggregator.

## Gezielte bestehende Regressionen

Bestanden:

- `scripts/test-worker-auto-deploy-09693.mjs`
- `scripts/test-worker-kv-operations-budget-09631.mjs`
- `scripts/test-official-observation-ensemble-09470.mjs`
- `scripts/test-model-source-capability-contract-095336.mjs`
- `scripts/test-aggregate-version-contract-09613.mjs`
- `scripts/test-release-lineage.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-install-release-zip-validation-093910.mjs`
- `scripts/test-release-upload-budget-097410.mjs`

Damit bleiben insbesondere Remote-Binding-Spiegel, 0-%-Worker-Smoke/Promotion/Rollback, das bestehende KV-Operationsbudget, Quellen-/Ensembleverträge, Versionslinie und Release-Transport geschützt.

## Vollständiges Regressionsgate

- erkannte Regressionstests: **631**
- in der verfügbaren Transportumgebung ausführbare, umgebungsunabhängige Tests: **525**
- bestanden: **525/525**
- umgebungsgebundene Tests: **106**

Die 106 nicht startbaren Prüfungen lassen sich vollständig auf die bekannte, im Transport-ZIP absichtlich nicht enthaltene lokale Testtoolchain zurückführen:

- **86** Tests importieren `typescript-strada`,
- **18** Tests benötigen die lokale TypeScript-/TypeScript-7-CLI-Toolchain,
- **2** Tests benötigen `esbuild`.

Es bleibt **kein zusätzlicher fachlicher Regressionsfehler** durch v0.9.77.18 übrig.

## Syntax-, Aggregat- und Releaseprüfungen

Bestanden:

- `node --check worker-src/05-knmi-eps-cache.js`
- `node --check worker/metar-proxy.js`
- `node --check worker.js`
- `node --check public/service-worker.js`
- `node --check public/sw.js`
- `worker/metar-proxy.js` und `worker.js` bytegleich
- Wartungsaggregate erfolgreich neu erzeugt
- Versionsschema: v0.9.77.18
- Package, Baseline, iOS-Status, Worker-Fragment und Worker-Aggregate synchron auf v0.9.77.18
- Release-Lineage `mid-stable` / kanonische Quellbasis geschützt
- Installer-ZIP-Validierungsvertrag und <25-MB-Transportpacker-Vertrag bestanden

## Worker-/KV-Differenz

v0.9.77.18 ergänzt funktionale Worker-Fachlogik:

- neues Cachemodul `worker-src/05-knmi-eps-cache.js`,
- neuer Diagnosemodus `knmi-eps-cache-health`,
- Health-Provider für den KNMI-HARMONIE-EPS-Produktivcache.

Das vorhandene KV-Binding `MID_PUSH_SUBSCRIPTIONS` wird lediglich unter einem getrennten Cachepräfix wiederverwendet. Es wird **keine neue Cloudflare-Ressource und keine neue Binding-Konfiguration** benötigt.

**Worker-Aktualisierung erforderlich: ja.** Im normalen freigegebenen Releasepfad erfolgt sie über den bestehenden gestagten Worker-Auto-Deploy; `MID-worker.zip` bleibt Notfall-/Audit-Artefakt.

## Build-Grenze

Ein vollständiger lokaler `tsc`-/Vite-Produktionsbuild sowie `cap copy ios` kann in dieser Transportumgebung nicht belastbar neu ausgeführt werden, weil `node_modules` und damit die gepinnte npm-/TypeScript-Toolchain nicht Bestandteil des Professional-Transport-ZIPs sind. Diese bekannte Transportgrenze ist von den oben bestandenen 525 umgebungsunabhängigen Regressionen getrennt.
