# MID v0.9.85.168 · Sicher beschleunigter Releasepfad

## Verifizierte Ausgangslage

Basis ist `mid-stable@5afebb86b585666e02ddf901c04f3c3703078aef` = `main@5afebb86b585666e02ddf901c04f3c3703078aef`, MID v0.9.85.167. Vor Beginn bestanden keine offenen Pull Requests. Die zwei pausierten Works wurden nicht verändert oder als Codebasis verwendet.

## Umsetzung

### Vollständige Regressionen, konservativ parallelisiert
`scripts/regression-execution.mjs` klassifiziert jeden automatisch entdeckten Test einschließlich rekursiv importierter lokaler Helfer. Parallel zugelassen werden nur Prüfungen ohne erkannte Datei-Schreibzugriffe, Child Processes, Server/Listener, Browserautomation, Fetch/Netzwerkpfade, process-globale Mutationen oder nicht statisch auflösbare Loader. Alles andere bleibt seriell. Der Plan muss eine verlustfreie 1:1-Partition des bestehenden `regressionSuite()`-Inventars sein. Standard sind höchstens vier parallele Prozesse.

### Flache Git-Snapshots im Normalpfad
Source-Gate, Auto-Release-Paketierung und Installer laden zunächst nur den benötigten aktuellen Snapshot. Der Installer behält den bisherigen Race-Schutz: Erkennt er während des langen Prüflaufs einen anderen `main`-SHA, wird die vollständige Historie nachgeladen, bevor Ancestor-, Diff- und Rebase-Prüfungen erfolgen. `mid-stable` wird im Installer über eine explizite Remote-Refspec geladen.

### Pages-Artefakt parallel vorbereiten
Nach erfolgreichem Installer-Build kann das unveröffentlichte Pages-Artefakt einschließlich erhaltenem RUC-Snapshot bereits parallel zum Worker-Gate vorbereitet werden. `deploy-pages` selbst startet weiterhin ausschließlich nach erfolgreichem Worker-Job. Fehlschläge der frühen Vorbereitung fallen in die bestehenden begrenzten Retry-Pfade zurück.

### Stable-Freigabe ohne historischen Checkout
Der Abschluss verifiziert den Release-Commit SHA-genau und den aktuellen `mid-stable`-SHA über die GitHub API. Die Compare-API muss eine Fast-Forward-Beziehung bestätigen. Die Ref-Aktualisierung erfolgt mit `force=false`; danach wird `mid-stable` erneut gelesen und muss exakt dem geprüften Release-SHA entsprechen. Candidate-/Stable-Quality-Status bleiben erhalten.

## Unveränderte Sicherheitsgrenzen

Source-PR-Gate, zweiter Installer-Verify, Dependency-/Security-Audit, Produktionsbuild, vollständiges Regressionsinventar, iOS-Hüllenprüfung, Worker-0%-Smoke/Produktions-Smoke/Rollback, Pages-Gate, Least Privilege, Branchschutz und Stable-SHA-Verifikation bleiben verbindlich. Die separat diskutierte Attestationslösung zum Ersetzen der zweiten Vollprüfung wurde ausdrücklich **nicht** eingeführt.

## Regression

`scripts/test-regression-parallel-execution-0985168.mjs` schützt die 1:1-Testinventarabdeckung, die konservative Parallelklassifikation, die serielle Lane und die Synchronität der geänderten Workflow-Spiegel. Bestehende Workflow-Regressionen wurden auf die gleichwertige API-Fast-Forward- und Pages-Prestage-Architektur aktualisiert.
