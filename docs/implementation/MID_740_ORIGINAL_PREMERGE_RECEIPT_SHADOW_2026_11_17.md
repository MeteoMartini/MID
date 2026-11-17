# MID #740 · Premerge-Source-Gate-Receipt im originalen Producer-Artefakt (QA-only)

17.11.2026. Ausgangs-Stable `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486, drei Versionsspiegel synchron, fünf aktive Rulesets. Dies ist ein **isolierter Handoff-Schritt innerhalb Draft #839**, **kein** Installer-/Review-/Release-Cutover.

## Vorherige, tatsächlich offene Vertrauensgrenze

Der bisherige `tools/ci/mid-740-postproducer-causality-qa.mjs` erwartet die früher vor dem Merge erstellte Source-Gate-/Producer-Receipt als **caller-provided** JSON und kann die Originalherkunft dieses Inputs nicht attestieren (`originalProducerReceiptAttested:false`). Der laufende privilegierte Producer besitzt aber vor dem Original-Squash-Merge den echten `workflow_run`-Event, die vertrauenswürdige GitHub-Workflow-Revision, die vollständigen originalen Source-/Core-/Heavy-Jobs und die GitHub-PR-/Stable-IDs. Nach dem Merge ist dieser Zeitpunkt nicht mehr beliebig rekonstruierbar.

## Tatsächliche Vorbereitung der Quelle (nur optionales QA-Shadow)

`ci/github/workflows/agent-source-release.yml` und ausführende `.github/workflows/agent-source-release.yml` bleiben **bytegleich**. Nach dem bestehenden vertrauenswürdigen Checkout auf `github.workflow_sha` und Node-Setup, aber **vor dem bestehenden SHA-geprüften Merge**, läuft zusätzlich ein mit `continue-on-error: true` gekennzeichneter, also **niemals zum Freigabe-Gate aufgewerteter** SHA-/REST-Readback:

- `tools/ci/mid-740-producer-gate-receipt-qa.mjs` liest den ursprünglichen `GITHUB_EVENT_PATH`, Original-Source-Run, Attempt-1-Jobs, Workflowregistry, aktuellen main/stable-Stand, Original-PR sowie den erst gestarteten, noch nicht abgeschlossenen Producer. Es läuft nur bei einem eindeutigen berechtigten Original-PR **vor Merge**, nicht bei bloßem Recovery/Rerun.
- Der unveränderliche vertrauenswürdige Workflowcode wird mit `MID_TRUSTED_WORKFLOW_SHA=${{ github.workflow_sha }}` geliefert. Die GitHub-Default-Umgebungsvariable `GITHUB_SHA` darf nicht überschrieben werden; sie wird **nicht** als austauschbarer Shortcut verwendet. Das Original-Event und sämtliche SHA-/Run-/PR-Felder werden vor der optionalen Speicherung gegen GitHub-REST und den vertrauenswürdigen SHA überprüft.
- Ein erfolgreiches Premerge-Receipt wird in einer privaten Runner-Temp-Datei gespeichert und durch den späteren unveränderten optionalen Shadow-Schritt `SHA-gebundenes Original-ZIP für #740 bereitstellen` als `premerge-gate-receipt.json` zusammen mit dem bisherigen echten Git-Blob-`MID-professional-replacement.zip` hochgeladen. Das Original-`provenance.json` erhält **`originalPremergeReceiptIncluded`** sowie den unabhängigen SHA-256 der Receipt-Originalbytes (oder `false/null` wenn der optionale Vorgang ausfiel). Alle sonstigen Source-/ZIP-/Installer-Dispatch-/Recovery-Schritte bleiben unangetastet.
- In der Shadow-Stufe wird die verifizierte Receipt auch nach dem Merge erneut gegen Run-ID, Attempt, Original-Source-Gate, Workflow-SHA und alle *false*-Autorisierungsflags validiert. Keine Token- oder vollständige Receipt-Ausgabe in Logs, keine neuen Secrets oder Berechtigungen.

`tools/ci/mid-740-premerge-shadow-link-qa.mjs` kann künftig die **aus dem tatsächlichen und separat SHA-/Digest-verifizierten** Actions-Envelope gelesenen Receipt-Originalbytes kanonisch, einschließlich SHA-256 und aller Run-/PR-Source-Gate-/Producer-/Paket-/ZIP-Identitäten, mit dem Manifest verbinden. Auch das positive Ergebnis meldet `originalProducerAttested:false`, `nativeReviewEnforced:false`, `installerAuthorized:false`, `releaseAuthorized:false` — denn ein von Dritten übergebenes String-Paar ist trotz übereinstimmenden Digests noch **kein** unabhängig authentifizierter GitHub-Actions-Beleg.

## Abnahme und Blocker

`tests/unit/mid-740-premerge-shadow-link-qa.test.ts` prüft kanonische originale JSON-Bytes, Manifest-SHA-256, Source-HEAD/Base/Git-Merge, Original-Source-Gate-Run-ID, Producer-Run/-Attempt, originalen ZIP-Digest, unzulässige Autorisierungsflags und 26 adversariale Negativvarianten. Zusätzlich verifiziert ein Workflow-Mirror-Test die unveränderten Legacy-Transporte, die originale Reihenfolge `Original-Receipt → Merge → ZIP-Shadow` und die bytegleichen Workflowspiegel. **GitHub-CI-Abnahme auf finalem Commit ist separat nachzuweisen**.

Für einen **echten** Nachweis ist später weiterhin ein originärer Producer-Run nach regulärem Source-PR-Gate/automatisiert geprüften Merge erforderlich, dessen **verifizierte originale Actions-Artefakt-ID** das Receipt und ZIP im selben Envelope trägt und dessen Upload-Schritte erfolgreich abgeschlossen sind. Ein bloßes Fixture, ein `continue-on-error`-Step-Ergebnis, eine vom Nutzer bereitgestellte JSON-Datei oder der historische `.486`-Producer ohne Actions-Artefakte sind kein ausreichender Beweis. Das nachfolgende Installer-/Original-Bytes-/Core-/Heavy-/Worker-/Pages-/Stable-/dist-/Widget-/RUC-/PWA-Recovery-E2E ist **nicht** dadurch abgenommen. Beide bestehenden direkten `main`-Pushes dürfen nicht einzeln abgeschaltet werden.

**Nutzerentscheidung:** Keine menschliche GitHub-Codefreigabe, keine erneute Branchschutz-Screenshot-Anforderung; die künftige main-only PR-Pflicht mit null menschlichen Approvals und SHA-/App-/Job-verifizierten automatischen Pflichtchecks ist nach echtem E2E zu qualifizieren. Native Schutzregeln, unveränderliche Releases oder Zugriffsrechte sind **nicht** geändert.

Quellen: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows · https://github.com/actions/upload-artifact/blob/main/README.md · https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts

**Status:** Draft-only · NO READY · NO MERGE · NO INSTALLER · NO RELEASE.


### Original-REST-Identitätskorrektur, vor Freigabe des Premerge-Receipt-Handoffs

Der Original-Workflow `.github/workflows/agent-source-release.yml` deklariert `name: MID Agent Source Release` für die **Workflow-Registry**, aber `run-name: Geprüften Agent-PR automatisch veröffentlichen` für das **Run-Objekt**. Der ältere, bisher nur synthetisch getestete `prepareMid740ProducerGateReceipt` verglich fälschlich `registry.name` mit dem Run-Namen; damit wäre sein optionaler neuer Premerge-Schritt immer `BLOCKED` gewesen. Der Code prüft beide Felder jetzt getrennt auf ihre jeweils originale Identität; die Fixture bildet diese Differenz ab, und adversariale Vertauschungen sind explizit negativ getestet. Dies ist **keine** Aufweichung der Run-ID, Run-Attempt-, Workflow-Pfad-, Repository- oder Git-SHA-Prüfungen.


### Reale GitHub-CI-Erkenntnis und dauerhafte Regressionserweiterung

Der erste Workflow-/Receipt-Handoff-Commit `0c7b5b64ddd5a5a4cc950d2feaa3f2812b437fa5` wurde durch den bestehenden Shell-Integrationstest `mid-740-main-write-inventory.test.ts` **korrekt als FAIL** erkannt: der isoliert ausgeführte echte Bash-Shadow-Step erhielt die neu benötigten `PREMERGE_RECEIPT_OUTCOME`-/`PREMERGE_RECEIPT_PATH`-Environment-Werte nicht und scheiterte unter `set -u`. In der tatsächlichen GitHub-Actions-Stage werden diese Werte durch den Workflow-Env-Block bereitgestellt, aber das Unit-Fixture muss beide Zweige abbilden. Die ursprünglichen 28 Byte-/Manifest-Link-Tests und 25 Producer-Gate-Tests waren am ersten Commit erfolgreich; der **vollständige** Run blieb trotzdem rot und darf nicht als abgenommen bezeichnet werden.

Die korrigierte Regression führt die ursprüngliche Bash-Stage jetzt zusätzlich real mit `PREMERGE_RECEIPT_OUTCOME=skipped` (Legacy-Transport unverändert, Manifestfelder `false/null`) und mit synthetisch gültigen originalen JSON-Receipt-Bytes (`success` mit Manifest-SHA256 und Originalbytegleichheit) aus. Sie prüft einen manipulierten Run-ID-Fall. Ein `ERR`-Trap räumt privat angelegte Runner-Shadow-Verzeichnisse bei der fehlschlagenden optionalen Stage weg, ohne zuvor gesicherte Artefakte anzutasten. Die Runtime bleibt weiterhin optional und der echte Installer-Dispatch unverändert.
