# MID #740 · Post-Producer-Kausalitätsnachweis (QA-only, 16.11.2026)

**Geltungsbereich:** Sicherheits-Draft [PR #839](https://github.com/MeteoMartini/MID/pull/839), unveröffentlichter QA-Pilot. Zuletzt vor dieser Ergänzung live geprüft: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, Stable `v0.9.85.486`, fünf aktive Rulesets. **NO READY · NO MERGE · NO RELEASE · KEIN CUTOVER.**

## Neue, nicht-privilegierte Nachprüfung

`tools/ci/mid-740-postproducer-causality-qa.mjs` baut **auf** der bereits vorhandenen `collectMid740GitHubReadback`-Prüfung auf. Es ist weder ein zweiter ZIP-Verifier noch ein neuer Release-Workflow. Es verknüpft:

1. Das **vor dem Merge** erstellte, ausdrücklich nicht vertrauensattestierte `mid.740.premerge-producer-receipt.v1` mit eindeutiger Original-Source-Gate-Run-ID, Attempt 1, PR-Nummer, PR-HEAD, Main-/Stable-Basis und Producer-Run.
2. Die erst **nach Producer-Abschluss** erzeugte `mid.740.end-to-end-intake-qa.v1` mit bereits geprüftem Envelope-SHA256, vollständigem lokalen ZIP-/Git-Tree-Byte-/Mode-Readback, Producer-Job-ID und wiederholtem GitHub-Inventar.
3. Ein **eigenständiges GitHub-REST-Readback** des echten Source-Gates, seines Workflow-Registers, des als geschlossen und gemergt ausgewiesenen eindeutigen Source-PR, des tatsächlichen Merge-Bots, des Squash-Merge-SHA mit genau einem Eltern-SHA auf der zuvor bestätigten Basis, des noch nicht promovierten Stable, des abgeschlossenen Producers und dessen originalem Artifact-ID-/Digest-Inventar. Die Reihenfolge Source-Gate → Producer-Start → PR-Merge → Artifact-Upload → Producer-Ende ist zusätzlich notwendig.
4. Einen zweiten REST-Readback von Source-Gate, PR, Git-Merge, **Original-PR-HEAD-Git-Commit**, Stable, Producer, Originalartefakt und vollständigem Artefaktinventar gegen Identity-/Time-of-check-Time-of-use-Drift.
5. Den Git-Tree-SHA des ursprünglichen Source-PR-HEAD aus dem authentifizierten Git-Commit-REST-Objekt exakt gegen den Git-Tree-SHA des Squash-Merge-Commits. Gleicher Tree-SHA und der bereits gebundene Merge-Eltern-SHA auf der ursprünglichen Base belegen die vollständige Gleichheit aller Git-verfolgten Pfade, Blob-OIDs und Dateimodi, also der Source-PR-Differenz gegenüber der ursprünglichen Base. Das beweist weder eine unabhängige Code-Review-Entscheidung noch den Inhalt externer Git-LFS-Objekte oder einen authentifizierten produktiven Handoff.

Die konsumierten Receipt-/Intake-Objekte sind zunächst **Caller-Input** und daher **keine signierten Original-Produktions-Attestierungen**. Ein positiver Rückgabestatus lautet ausschließlich `POST_PRODUCER_CAUSALITY_METADATA_COHERENT_QA_ONLY`; selbst bei synthetisch grünem Testergebnis bleiben `originalProducerReceiptAttested:false`, `nativeGitHubReviewVerified:false`, `installerAuthorized:false`, `recoveryAuthorized:false`, `releaseAuthorized:false`.

**Erweiterte Testgrenze:** Die ursprünglichen 28 synthetischen Vitest-Fälle sind um vier Git-Tree-Negativfälle und einen HEAD-Tree-Late-Race auf **33 Fälle** ergänzt. Ein positiver Fall darf nur bei Original-PR-HEAD/Source-Merge-Git-Tree-Parität und exaktem Merge-Base-Parent `sourceDiffEquivalenceVerified:true` melden. Fehlende oder manipulierte Commitobjekte und späte Tree-Races sperren. Erst neue GitHub-CI am endgültigen SHA kann diese Erweiterung als bestanden bestätigen; kein Source-/Core-/Heavy-/Installer-/Stable-Gate wird durch Draft-Tests ersetzt.

**Release-Blocker bleiben:** Ein echter historischer `.486`-Producer enthält null Actions-Artefakte, eine authentische Premerge-Receipt-/Postproducer-/Originalbyte-/Native-Review-Produktionskette fehlt. Die beiden bestehenden direkten `main`-Transporte, GitHub-natives No-Bypass-/Late-Cubic-P1-Review, immutable dist-/Source-Recovery und vollständige Worker-/Pages-/RUC-/PWA-/Widget-Absicherung sind unangetastet. Kein Zugriff auf Secrets, keine produktive Workflow-/Ruleset-/Installer-/Worker-/Pages-Änderung.

**Verbindlicher Pfad:** Source-PR-Gate → kontrollierter SHA-gebundener Merge → serverseitiges originales Release-ZIP → Installer → alle betroffenen Worker-/Pages-Gates → Stable-Promotion. Das neue Werkzeug liefert lediglich zusätzliche Falsifizierbarkeit einer späteren, separat autorisierten Transportumstellung.

**Echter historischer Originaldaten-Readback (`.486`):** Der ursprüngliche [PR #847](https://github.com/MeteoMartini/MID/pull/847)-HEAD `e39cf853ab0e893f08012c3b3ebe7be1b96d658b` und der authentisch gemergte Squash-Commit `6985ec5238ce9d71bff71b390968949b30d25434` besitzen nach GitHub-Git-Commit-REST jeweils den Tree `31055eed3d71fb22a0c8edf4de3e68653c7e895a`; Merge-Parent ist die ursprüngliche `.485`-Base `ccd1c0f60d67925aa01dd8d946b490fde4142709`. Dieser konkrete Tree-Nachweis gilt nur für die historische Originalquelle; der damalige Producer hatte **null** Actions-Artefakte und liefert keinen echten positiven neuen Producer→Installer-E2E-Beleg.

## Originalquellen
- GitHub: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub: https://docs.github.com/en/rest/actions/workflow-runs
- GitHub: https://docs.github.com/en/rest/actions/artifacts
- Issue: https://github.com/MeteoMartini/MID/issues/740


## MID Release Konzept 1.6 · Authentifizierter Attempt-1-Source-Gate-Jobroster (QA-only)

Die nachgelagerte Kausalitätsprüfung liest zusätzlich **unabhängig** die vollständige GitHub-REST-Jobliste des ursprünglichen Source-Gate-Runs unter `actions/runs/<id>/attempts/1/jobs?per_page=100&page=1`, vor und nach Prüfung des Producer-Artefakts. Der vorhandene Source-Gate-Rostervertrag (13 verpflichtende Core-/Heavy-/Source-Jobs, drei bekannte optionale Jobs) wird dabei unverändert wiederverwendet. Jeder Job muss zum tatsächlichen Run und Attempt 1 mit Original-HEAD-SHA gehören, eindeutig sein, und plausible Jobzeiten innerhalb des Original-Runs besitzen. Bei `skipped` darf GitHubs originaler Zeitstempel geringfügig rückwärts erscheinen; `success` benötigt echte positive Dauer. Fehlende, doppelte, inkonsistente oder erneut veränderte Jobs blockieren. Das Ergebnis `originalSourceGateAttemptJobsVerified:true` ist **nur** authentifizierbares GitHub-Metadaten-QA, kein signiertes Original-Receipt und keine native Mergezeit-/Installer-Freigabe.

Der Original-REST-Readback des `.486`-Source-Gates [#43874951889](https://github.com/MeteoMartini/MID/actions/runs/43874951889) bestätigte 16 Jobobjekte auf Attempt 1 mit Original-HEAD `e39cf853ab0e893f08012c3b3ebe7be1b96d658b`: 13 verpflichtende Jobs erfolgreich, drei optionale übersprungen. Die Originaljobzeiten werden vom neuen Prüfcode realitätsgetreu berücksichtigt. Die Unit-/QA-Ausführung auf dem nächsten GitHub-PR-HEAD ist separat SHA-gebunden zu prüfen.


### Original-GitHub-REST-Vertragsbefund: Source-Gate-Run-Name ≠ Workflow-Registername

Im GitHub-Originalrun [#43874951889](https://github.com/MeteoMartini/MID/actions/runs/43874951889) liefert das **Run-Objekt** `name: MID-Agent-Quellstand prüfen`, obwohl das separate **Workflow-Registrierungsobjekt** den Workflow `MID ChatGPT/Codex Source-PR Gate` nennt. Der frühere `reviewRun`-Prüfer verlangte irrtümlich den Registrierungsnamen auch im Run-Objekt. Das führte beim Versuch, den tatsächlichen Attempt-1-Jobroster nachträglich zu prüfen, zum fail-closed **BLOCKED** und vier fehlgeschlagenen Vitest-Fällen im [vorangehenden Run #43969596029](https://github.com/MeteoMartini/MID/actions/runs/43969596029). Dies war eine **falsche Ablehnung eines gültigen Original-Run-Metadatenstands**, keine Begründung für Freigabe oder eine Aufweichung. In diesem isolierten QA-Fix wird der exakte historische Run-Anzeigename separat vom nach wie vor verbindlichen, eindeutigen Workflow-Registername geprüft. Die beiden betroffenen Original-Source-Trigger-/Producer-Receipt-Fixtures bilden beide Namen ausdrücklich getrennt ab; adversariale Namensverwechslung bleibt gesperrt. Erst eine neue GitHub-Vitest-Abnahme am nachfolgenden SHA qualifiziert den Fix, nicht ein umetikettiertes altes Ergebnis.


## 17.11.2026 · Original-Source-Gate Workflow-Registry vs. Run-Anzeige

Der Originalworkflow `.github/workflows/chatgpt-pr-gate.yml` deklariert `name: MID ChatGPT/Codex Source-PR Gate`, aber `run-name: MID-Agent-Quellstand prüfen`. Der bisherige Postproducer-Kausalitätsprüfer verlangte irrtümlich den Run-Namen ebenfalls in `gateRegistry.name`, wodurch ein korrektes Original-GitHub-REST-Readback immer blockiert würde. Beide Identitäten werden nun getrennt auf ihren **exakten ursprünglichen Wert** geprüft, zusammen mit negativen Vertauschungstests. Das gilt weiterhin ausschließlich für QA: Original-Receipt-/Reviewer-/Installer-/Release-Autorisierung bleibt `false`.
