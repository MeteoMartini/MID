# MID .381 – Reproduzierbare CI/CD-Phasenauswertung

## Live verifizierte Basis

Vor Arbeitsbeginn: `main=mid-stable` v0.9.85.380 @ `e6d70e1104bee5980ac5153fc99f59775756014e`; Installer 41123191600 `completed/success`, SHA-Merge/Server-ZIP/Worker/Pages/Stable nachgewiesen; fünf aktive GitHub-Rulesets. Authorisierter Source-Branch `chatgpt/v0.9.85.381-cicd-stage-observation`. Die vorhandene freie Modell-/Wetter-App-Fachlogik bleibt unberührt. Alle regulären Prüfungen bleiben Pflicht.

## Primärdaten und Semantik

`tools/ci/release-timing.mjs` verwendet nur GitHub-Workflowdateinamen und Events zur Stichprobenauswahl und lädt echte Jobs/Schritte mit Run-/Attempt-Gegenprüfung. Ergänzung `tools/ci/release-phase-observation.mjs` klassifiziert **exakt** bekannte Job- und Schrittnamen: Queue; Setup (nur gemessene Setup-Schritte); npm-Installation (nur npm-Schritte); Build (nur Build-Schritte); Core, Heavy, Bot, Paket, Worker, Pages, Stable (Jobzeiten). Unbekannte neue Jobbezeichnungen werden nicht geraten. Nicht auftretende Phasen erhalten `observed:0, wallSeconds:null`. Fehlende, ungültige und rückwärts gerichtete Zeitstempel führen zu `missing>0` und **keinem** gültigen P50/P95-Stichprobenwert. Echte positive oder 0-s-Zeitintervalle bleiben messbar; Skips werden nicht als Null- oder Erfolgsmessung ausgegeben.

Die tatsächliche phasenbezogene **Wall-Time** ist die Vereinigung aller ausgeführten Intervalle (also kein doppeltes Zählen bei vier parallelen Core- bzw. sechs Heavy-Shards). Die **Runnerzeit** addiert die tatsächlich ausgeführten Intervalle und ist **keine GitHub-Rechnung**. `spanSeconds` zeigt die Spanne vom frühesten Start bis zum letzten Ende und erfasst Leerlücken, nicht Runnerarbeit. Keine der Phasen darf zur End-to-End-Zeit addiert werden, denn Core/Heavy umfassen eigene npm-/Build-/Setupzeiten und laufen teils parallel. Queue ist ausdrücklich Run-Erstellung bis zum frühesten dokumentierten Job-Start, nicht jeder einzelnen Matrixqueue.

## Stichprobe und Fehlerindikatoren

Für jede Workflow-Datei und Phase werden `successfulRuns`, `measuredRuns`, `incompleteRuns` und `absentRuns` berichtet. P50 und P95 werden nur aus erfolgreichen, vollständig messbaren Laufphasen berechnet. Eine kleine Stichprobe begründet keine gesicherte Aussage über typische zukünftige Releases. Der ältere reine Laufzeitreport bleibt erhalten; `phaseDiagnostics` erweitert ausschließlich die Diagnose/JSON-Ausgabe. Bisherige Retry-, PR-/SHA-, Security-/Deploy- und Worker-Gates wurden nicht verändert.

## Regressionsnachweise und Abnahmegrenzen

Neuer Test `tools/ci/release-phase-observation.test.mjs` wird vom bereits verpflichtenden `scripts/test-release-timing-0985376.mjs` importiert. Er prüft überlappende Matrixjobs, auseinanderliegende Jobintervalle, gemessene vs fehlende 0, fehlende/nicht aufsteigende Zeiten, übersprungene Jobs, doppelt gezählte Retrys, gesonderte Worker/Pages/Stable-/Bot-Phasen, unvollständige P50/P95-Samples und unveränderliche `releaseAuthorized:false`/`reuseAuthorized:false`. Ein erfolgreicher CI-Test ist kein echter Signaturbeleg und keine echte A/B-Produktionsevaluierung.

**Offen:** geschützter *realer* manuell gestarteter Sigstore-Verifier-Run auf Stable, unabhängige signierte Build-/Testartefakt-Provenienz und identische Tree-/Lock-/VITE-/Env-/Run-A/B-Gates inkl. Worker/Pages/Stable sowie ausreichend reale natürliche Releases für neue belastbare P50/P95. Kein Produktiv-Reuse und keine Freigabe unter 25-Minuten-Ziel ohne Evidenz. Siehe #526.
