# MID RUC Data 1.4 – Original-Observer-Artefakte und Messlücken (Draft)

## Herkunft und Sicherheitsgrenze
- Startquelle: nach kontrollierter Promotion verifiziertes `mid-stable=main` v0.9.85.398, SHA `adf2a832bd7d66a9bb7c16ec6d9f4dcdedeff855`.
- Fünf aktive Rulesets. Bestehende Quellen `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md` und RUC-Verträge bleiben unverändert.
- Parallelentwicklung PR #574 (DWD-D2) und PR #575 (Design .399) bleibt unberührt. Kein Rewrite früherer RUC-Drafts.
- Dieser Kandidat ändert ausschließlich ein **offline/lesendes** Auswertewerkzeug, seine adversariellen Tests und beide bytegleichen Spiegel des bestehenden PR-QA-Workflows. Kein RUC-Producer, Worker, Cloudflare, Pages, App, Scheduler, Releasepfad oder Secret wird verändert. **Kein Produktiv-Release.**

## Nachgewiesene Messfalle
GitHub Observer-Run #41292543651 (2026-11-01 09:18:19Z) schloss als `success`, aber sämtliche DWD-/Pages-/Worker-Proben und der Artefakt-Upload wurden übersprungen. Ein grüner Jobstatus ist deshalb ausdrücklich **kein** erfolgreicher Datenmesspunkt. Der neue .398-Observer-Status behebt die fehlende Negativdokumentation in Releasefenstern, ersetzt aber nicht den Original-Download/Readback.

## Lieferumfang und Verwendung
`tools/ruc/ruc_observer_artifact_bundle.py` liest nur bereits **außerhalb des Tools** archivierte GitHub-Original-ZIP-Artefakte `dwd-ruc-observation-<runId>-<attempt>.zip`. Aufruf (mit SHA-verifizierter, separat aus GitHub exportierter Run-/Attempt-Liste):

```bash
python3 tools/ruc/ruc_observer_artifact_bundle.py \
  --artifacts evidence/dwd-ruc-observation-*.zip \
  --run-manifest evidence/github-observer-runs.json \
  --ending-at-utc 2026-11-01T11:00:00Z \
  --output-dir evidence/merged
python3 tools/ruc/ruc_p1p5_censor_audit.py \
  --directory evidence/merged/directory.jsonl \
  --readbacks evidence/merged/readbacks.jsonl \
  --ending-at-utc 2026-11-01T11:00:00Z \
  --output evidence/p1p5-report.json
```

Der Run-Manifestvertrag ist eine Liste von `{"runId":123,"runAttempt":1}`-Objekten, die **zuerst gegen die echte GitHub-API** erhoben werden muss. Ohne diese Liste kennzeichnet der Bericht die GitHub-Run-Abdeckung ausdrücklich als nicht geprüft. Das Tool erzeugt `directory.jsonl`, `readbacks.jsonl` und `manifest.json` mit `x`-Dateierstellung, ohne vorhandene Nachweise zu überschreiben.

Pro ZIP werden Dateinamen, Run-ID/Attempt, expliziter Observer-Status, SHA-Gleichstand, Zeit-/Feldschemata, Seiten-/Worker-Konsens, Duplicate-JSON-Keys, ZIP-Pfade, Symlinks, Größe und doppelte Messungen fail-closed geprüft. Frühere vermeintlich grüne Läufe ohne Statusdatei, Release-Drift, fehlende ZIPs und überschattete Run-Attempts dürfen keine positiven Stichproben erzeugen. Bei mehreren Versuchen gilt konservativ der höchste Attempt; der ältere wird gezählt, aber nicht zur Positivquote hinzugemischt.

Die vorhandene 168h-Zensuranalyse bleibt die fachliche Quelle für P50/P90/P95 der **beobachteten Obergrenzen**, nicht für echte DWD-Veröffentlichungslatenzen. Kein Missing wird 0 und keine 0–6h-Schnellveröffentlichung wird aktiviert. Die ZIP-Inhaltsprüfung prüft die **innere Konsistenz**, keine kryptografische GitHub-Provenienz: Dazu bleibt ein authentifiziertes GitHub-Run-/Artifact-API-Inventar erforderlich.

## Negativtests und offene RUC-Prioritäten
- 17 lokale adversarielle Standardbibliothek-Tests am Kandidaten erfolgreich, ohne DWD-Netz und ohne Release. Das ist **kein** Ersatz für auf dem PR-Head ausgeführte GitHub-Tests.
- **P1:** 168+ echte, lückenbewusste stündliche DWD-Original-GRIB-/EPS20-Proben und GitHub-Run-Inventar sammeln; DWD-First-Publication bleibt intervallzensiert.
- **P2:** die bereits integrierte native 0–6h-Qualifikation real auf unveränderten DWD-Dateien ausführen, bevor Single-Writer-/CAS-/Fencing-Design und ein eigener atomarer Pointer geprüft werden. Aktuell ausschließlich inaktiv.
- **P3:** exaktes identisches SHA-DWD-A/B-Experiment für Download, Dekodierung, CPU/RAM, 900-MB-Budget und Validierungsparität.
- **P4:** gemeinsame aktive Publikationssperre zwischen GitHub/Cloudflare samt Fencing und Stale-Writer-/Timeout-/Retry-Tests. GitHub-Concurrency **allein** genügt nicht.
- **P5:** erst nach mehrtägiger realer DWD→Decoder→Sealing→Pages/Worker→Browser/Widget/Export-Messung mit validierter Modell-/Gültigkeitszeit 60-min-P95 beurteilen, niemals aus Index-/Pointerwerten ableiten.

## Releasezustand
Reiner Draft ohne Versionsbump, keine Produktion, keine Freigabe. Erst Versionierungs-/Changelog-Spiegel, 1059+ verpflichtende Regressionen, Source-PR-Gate, SHA-Bot, serverseitiges ZIP, `install-mid.yml`, Worker/Pages/Finalize und Stable-Promotion könnten einen späteren App-Release autorisieren.
