# MID #740 · Post-Producer-Kausalitätsnachweis (QA-only, 16.11.2026)

**Geltungsbereich:** Sicherheits-Draft [PR #839](https://github.com/MeteoMartini/MID/pull/839), unveröffentlichter QA-Pilot. Zuletzt vor dieser Ergänzung live geprüft: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, Stable `v0.9.85.486`, fünf aktive Rulesets. **NO READY · NO MERGE · NO RELEASE · KEIN CUTOVER.**

## Neue, nicht-privilegierte Nachprüfung

`tools/ci/mid-740-postproducer-causality-qa.mjs` baut **auf** der bereits vorhandenen `collectMid740GitHubReadback`-Prüfung auf. Es ist weder ein zweiter ZIP-Verifier noch ein neuer Release-Workflow. Es verknüpft:

1. Das **vor dem Merge** erstellte, ausdrücklich nicht vertrauensattestierte `mid.740.premerge-producer-receipt.v1` mit eindeutiger Original-Source-Gate-Run-ID, Attempt 1, PR-Nummer, PR-HEAD, Main-/Stable-Basis und Producer-Run.
2. Die erst **nach Producer-Abschluss** erzeugte `mid.740.end-to-end-intake-qa.v1` mit bereits geprüftem Envelope-SHA256, vollständigem lokalen ZIP-/Git-Tree-Byte-/Mode-Readback, Producer-Job-ID und wiederholtem GitHub-Inventar.
3. Ein **eigenständiges GitHub-REST-Readback** des echten Source-Gates, seines Workflow-Registers, des als geschlossen und gemergt ausgewiesenen eindeutigen Source-PR, des tatsächlichen Merge-Bots, des Squash-Merge-SHA mit genau einem Eltern-SHA auf der zuvor bestätigten Basis, des noch nicht promovierten Stable, des abgeschlossenen Producers und dessen originalem Artifact-ID-/Digest-Inventar. Die Reihenfolge Source-Gate → Producer-Start → PR-Merge → Artifact-Upload → Producer-Ende ist zusätzlich notwendig.
4. Einen zweiten REST-Readback von Source-Gate, PR, Git-Merge, Stable, Producer, Originalartefakt und vollständigem Artefaktinventar gegen Identity-/Time-of-check-Time-of-use-Drift.

Die konsumierten Receipt-/Intake-Objekte sind zunächst **Caller-Input** und daher **keine signierten Original-Produktions-Attestierungen**. Ein positiver Rückgabestatus lautet ausschließlich `POST_PRODUCER_CAUSALITY_METADATA_COHERENT_QA_ONLY`; selbst bei synthetisch grünem Testergebnis bleiben `originalProducerReceiptAttested:false`, `sourceDiffEquivalenceVerified:false`, `nativeGitHubReviewVerified:false`, `installerAuthorized:false`, `recoveryAuthorized:false`, `releaseAuthorized:false`.

**Testgrenze:** `tests/unit/mid-740-postproducer-causality-qa.test.ts` enthält 28 synthetische Vitest-Fälle (ein positiver QA-Fall, 25 adversariale Ablehnungen, zwei Late-Races). Lokal mit einem Node-22-Testadapter gegen den echten neuen QA-Code und die bestehende Artifact-Readback-Implementierung: 28/28 PASS. Ein lokaler Adapter ist kein GitHub-Vitest-, Source-, Core-, Heavy-, Browser-, Installer- oder Stable-Gate; diese Ergebnisse müssen auf dem *finalen* PR-HEAD separat gelesen werden.

**Release-Blocker bleiben:** Ein echter historischer `.486`-Producer enthält null Actions-Artefakte, eine authentische Premerge-Receipt-/Postproducer-/Originalbyte-/Native-Review-Produktionskette fehlt. Die beiden bestehenden direkten `main`-Transporte, GitHub-natives No-Bypass-/Late-Cubic-P1-Review, immutable dist-/Source-Recovery und vollständige Worker-/Pages-/RUC-/PWA-/Widget-Absicherung sind unangetastet. Kein Zugriff auf Secrets, keine produktive Workflow-/Ruleset-/Installer-/Worker-/Pages-Änderung.

**Verbindlicher Pfad:** Source-PR-Gate → kontrollierter SHA-gebundener Merge → serverseitiges originales Release-ZIP → Installer → alle betroffenen Worker-/Pages-Gates → Stable-Promotion. Das neue Werkzeug liefert lediglich zusätzliche Falsifizierbarkeit einer späteren, separat autorisierten Transportumstellung.

## Originalquellen
- GitHub: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub: https://docs.github.com/en/rest/actions/workflow-runs
- GitHub: https://docs.github.com/en/rest/actions/artifacts
- Issue: https://github.com/MeteoMartini/MID/issues/740
