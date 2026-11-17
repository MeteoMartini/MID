# MID #740 · Automatisierte PR-Freigabe ohne menschliche Reviewer: Sicherheitsvertrag (QA-only)

Stand: 17.11.2026. Dieser Entwurf ist **keine** Produktivaktivierung. Repository: `MeteoMartini/MID`. Zum Start der Arbeit live geprüft: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486; alle drei Versionsspiegel synchron. Sicherheits-PR #839 ist OPEN/DRAFT. Die Leitchat-Produkt-PRs bleiben eigenständig.

## Bereits vorliegende Owner-Angaben – **nicht nochmals anfordern**

Der Nutzer hat den Screenshot zum klassischen `main`-Branchschutz bereits mehrfach, zuletzt am 16.11.2026, eingereicht. Bereits daraus bekannt: **Require PR before merging deaktiviert**, **required status checks deaktiviert**, **Require conversation resolution aktiviert**, **Do not allow bypassing aktiviert**, Force Push und Löschen deaktiviert. Die GitHub-Integration liefert bei `/branches/main/protection` zusätzlich 403; die Live-Snapshot-Lücke ist **kein Anlass, denselben Screenshot erneut anzufordern**. Der aktive Ruleset `MID Production Branch Guard` 23963851 erfasst gegenwärtig **main und mid-stable**, Regeltypen `deletion`, `non_fast_forward`, `update`, Ausnahme Integration 5059236 `bypass_mode=always`.

**Verbindliche Produktentscheidung:** Kein menschlicher Code-Reviewer, keine menschliche PR-Approval. ChatGPT und die vorhandenen MID-Tools sollen die Reviewarbeit leisten. Die MID AI Router-ChatGPT-Plugin-Skill stellt **Orchestrierung und Prüfanweisungen**, aber **keine** externe signierende Runtime oder unabhängig gestartete Fremdmodelle bereit. Deshalb nicht behaupten, dass ein Router-Tool eine maschinelle Prüfung außerhalb ChatGPT ausgeführt hat. Kein kostenpflichtiger Provider/BYOK/Token ohne Freigabe.

## Technisch möglicher GitHub-Nativpfad (nach erfolgreicher E2E-Qualifikation)

GitHub erlaubt `Require a pull request before merging` ausdrücklich mit **0 required approvals**. Anstelle einer fingierten menschlichen Review-Identität muss eine **neue, zusätzliche, main-only Ruleset** mit **keiner Bypass-Liste**, `pull_request.required_approving_review_count=0`, `required_review_thread_resolution=true`, und verbindlichen **strict required status checks** greifen. Die GitHub-App als Check-Quelle muss explizit gebunden werden. Die GitHub-Actions-App-ID 15368 ist bei echten #839-Checks beobachtet, reicht **für sich genommen** aber NICHT aus, um untrusted PR-Workflowcode zu authentifizieren.

Die hier deklarierten geplanten Check-Kontexte existieren **noch nicht** als freigeschaltete Release-Gates:

1. `MID / source-gate-provenance` – vertrauenswürdiges Workflow-Git-Objekt, eindeutiger Source-HEAD, Base und sämtliche Pflicht-Source-/Core-/Heavy-Gates
2. `MID / independent-automated-review` – nicht durch den PR-Autor manipulierbare, originalgetreue und ausreichend unabhängige automatisierte Code-/Sicherheitsprüfung; tatsächlich ausführender Provider und konkrete Toolprovenienz nachweisen
3. `MID / critical-P0-P1-P2-dispositions` – alle tatsächlich originalen P0/P1/P2-Findings, einschließlich nur `COMMENTED`-Bodies, individuell mit SHA/Original-Review-ID, code- oder datenbezogenen Nachweisen und reproduzierbaren Regressionen dispositioniert; untrusted `fixed`-Labels zählen nicht
4. `MID / core-heavy-release-admission` – echte vollständige, nicht-übersprungene Pflicht-Gates für den freigegebenen Quell-HEAD vor Merge

**Wichtige GitHub-Besonderheit:** Übersprungene **Jobs** können trotz required check als `Success` zählen. Daher die tatsächlichen GitHub-Workflow-Runs, Attempts, Job-Objekte, erfolgreich ausgeführten Schritte und vertrauenswürdigen Workflow-Definitionsbytes unabhängig und zweimal lesen. Falscher Check-App-Absender, falsche Run-/Job-ID, SHA, Workflowpfad, `neutral`, `skipped`, fehlende Pflichtschritte und Run-/PR-/Ruleset-Races müssen blockieren. Der zugehörige verifizierte GitHub-Workflow muss vom geschützten Stable-Git-Objekt stammen; nicht aus untrusted PR-Diffs. Die Wahl eines App-Status allein ist keine signierte Build-Attestation.

## Neue isolierte, nicht-privilegierte QA

`tools/ci/mid-740-nonhuman-review-policy-qa.mjs` und `tests/unit/mid-740-nonhuman-review-policy-qa.test.ts` prüfen **synthetisch und fail-closed** die künftige Ruleset- und Check-Form. Reale heutige Ruleset-Metadaten müssen als **BLOCKED** klassifiziert werden; auch ein synthetisch konsistenter Zustand meldet nur `FUTURE_RULESET_AND_CHECK_METADATA_COHERENT_QA_ONLY` und setzt `automatedReviewAttested:false`, `nativePolicyActiveAndQualified:false`, `installerAuthorized:false`, `mergeAuthorized:false`, `releaseAuthorized:false`. Caller-Felder sind keine authentifizierten Originalartefakte. Keine produktive GitHub-Policy-Änderung, kein Bot-Review und kein neues Token.

## Unverzichtbare weitere Implementierung und richtige Reihenfolge

- Das vorhandene #839-Review-Guard verlangt heute für P0/P1/P2 menschliche GitHub-Dispositionsapprovals. **Nicht** einfach `qualifiedApproval` lockern oder bekannte Findings stillschweigend übergehen. Erst eine nachweislich unabhängige, vor Merge autoritativ laufende automatische Review-/Attestationskette mit vollständigen individuellen SHA-/Review-ID-/Originalbyte-/Regressionen-Belegen etablieren; dann den Dispositionsverbraucher mit adversarialen Tests kontrolliert auf diesen neuen Vertrag migrieren.
- Original-Source-Producer→Actions-Artifact-ID/Digest/Original-ZIP-Bytes→Installer-Consumer beweisen. Beide heute nötigen direkten `git push origin HEAD:main` (ZIP und `dist`) **nur gemeinsam** nach erfolgreichem E2E + dauerhaftem `dist`-Recovery ersetzen.
- Stable-Promotion bleibt durch `MID Stable Protection` geschützt und darf **nicht** versehentlich mit einer `main`-Reviewpflicht blockiert werden. `widget-latest` benutzt den bestehenden Rolling-Asset-`--clobber`-Vertrag; globale Immutable-Releases erst nach echter Widget-/dist-/RUC-/PWA-/Worker-/Pages-/Rollback-Probe und fachlich entschiedener unveränderlicher Lieferalternative.
- Anschließend kann der Owner die **main-only PR-Pflicht mit 0 menschlichen Approvals** und verpflichtenden, geschützten, app-/GitHub-Run-gebundenen automatischen Checks im UI aktivieren. Vorher kein Ruleset-/Classic-Branchschutz-Edit. Der Nutzer muss **keinen menschlichen Reviewer benennen** und **keinen Screenshot nochmals liefern**.

Quellen (amtliche GitHub-Dokumentation, Stand 17.11.2026):

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks

**Release-Hold:** NO READY · NO MERGE · NO INSTALLER · NO WORKER/PAGES · NO STABLE PROMOTION · NO RELEASE.
