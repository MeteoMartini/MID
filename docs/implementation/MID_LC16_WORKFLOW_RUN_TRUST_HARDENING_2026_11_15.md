# MID LC 1.6 – Privilegierte workflow_run-Grenze: Sicherheitsqualifikation

**15.11.2026 · QA-only, KEINE PRODUKTIONSFREIGABE.** Ausgang: main = mid-stable = c9fadfcd0969e949a92f414b321627dd3d4fb0cc (v0.9.85.483). Diese Arbeit gehört ausschließlich zum bestehenden Integrations-Draft #828 (v0.9.85.484). Keine neuen App-Credits, Tokens, Secrets, bezahlten Dienste, Ruleset-Umgehungen oder Änderungen auf main/mid-stable.

## Risikobasis und öffentlich bestätigte Grenzen

GitHub dokumentiert, dass privilegierte workflow_run-Folgeaktionen Zugriff auf Write-Token und Secrets haben können, selbst wenn der auslösende Workflow unprivilegiert war. Fremder PR-Code und fremde Workflow-Artefakte dürfen deshalb nicht in privilegierten Kontexten ausgeführt werden. Quellen: https://docs.github.com/en/actions/reference/security/secure-use sowie https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target .

Der unabhängige zizmor-Pilot listet zwei High-dangerous-triggers-Befunde zu agent-source-release.yml und release-self-heal.yml. Diese neuen Filter sind zusätzliche Defense in Depth: Sie beseitigen den strukturellen Trigger-Typ nicht und ersetzen keine neue unabhängige Security-Abnahme.

## Härtung mit unveränderten Originalrechten und Transport

1. Agent-Source-Release wird bereits auf Job-Ebene nur gestartet, wenn ein erfolgreicher pull_request-Lauf mit head_repository.full_name == github.repository und chatgpt/* oder codex/* als Head-Branch belegt ist. Die bereits vorhandenen sha-, PR-, GitHub-Review- und trusted-workflow-checkout-Prüfungen bleiben vollständig bestehen; vorab wird kein PR-HEAD ausgeführt.
2. Release-Self-Heal akzeptiert am Job-Eintritt nur fehlgeschlagene workflow_dispatch-Installerläufe aus dem eigenen Repository mit head_branch main und run_attempt kleiner 3. Ein fehlerhafter Installerdurchlauf vom zusätzlichen push-Event wird nicht automatisch wiederholt.
3. Vor jeder Retry-Klassifikation wird der Installer per frischer GitHub-API-Auskunft mit ID, .github/workflows/install-mid.yml, workflow_dispatch, Repository, main-Branch, dem gegenwärtigen main-SHA, completed/failure und ursprünglicher Attempt-Nummer abgeglichen. Eine abweichende oder fehlende Eigenschaft ergibt retry=false; dies verhindert auch veraltete Folgeläufe nach späteren main-Commits. Der signierte/gebundene Stable-Classifier bleibt unverändert.
4. Fehlerlogs und Jobdaten werden ausschließlich in einem temporären mktemp-Verzeichnis mit umask 077 und Aufräum-Trap gespeichert, statt unter vorhersagbaren globalen /tmp-Dateinamen.

Beide aktiven Workflows und ihre kanonischen ci/github/workflows-Spiegel bleiben byteidentisch. Installer, ZIP-Verteilung, GitHub-App-Permissions, Produktions-Worker/Pages, branch protection und Source-Core/Heavy-Qualifikation sind nicht geändert.

## Beleg und verbleibende Blocker

tests/unit/mid-privileged-workflow-run-lc16.test.ts prüft die realen Workflow-Schutzbedingungen und **führt das exakt aus der Selbstheilungs-Workflowdatei extrahierte jq-Filterprädikat** mit einem gültigen Run sowie 14 fremden, unvollständigen oder veralteten Gegenbeispielen aus. Der Test prüft außerdem Spiegelgleichheit, SHA-pinned Reviewguard/Stable-Classifier, Original-Retrylimit und Tempdatei-Isolation.

**Nicht geheilt:** Das Review-Readback vor dem Bot-Squash kann eine nach dem Readback, vor dem Merge eingehende fachliche Changes-Requested-Entscheidung nicht atomar sperren (#740). Dafür ist die vorgelagerte native GitHub-Review-Regel nur mit einem vorher end-to-end verifizierten sicheren ZIP-/Installer-/Dist-Transport aktivierbar. Auch die beiden zizmor-High-Hinweise bleiben bis einer eigenen unabhängigen Sicherheitsbeurteilung offen. Keine produktive Freigabe aus Draft-Tests. Reale Source-, Core-4/4, Heavy-6/6, Browser-/iOS-, Installer-, Worker-, Pages- und Stable-Gates bleiben erforderlich.
