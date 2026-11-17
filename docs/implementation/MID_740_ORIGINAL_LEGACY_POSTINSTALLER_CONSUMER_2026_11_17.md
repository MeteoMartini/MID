# MID #740 · Originales GitHub-Artefakt → abgeschlossener Legacy-Installer: read-only zusammengesetzte End-to-End-QA

Stand: 17.11.2026 (MID Release Konzept 1.6). Ausgangspunkt: `MeteoMartini/MID` Stable v0.9.85.486, `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`. Sicherheits-PR #839 bleibt DRAFT. **Keine produktive Workflow-, Ruleset-, Secret- oder Freigabeveränderung.**

## Problem: drei vorhandene Prüfer hatten keine gemeinsame vertrauenswürdige Eintrittsstelle

1. Der GitHub-REST-Readback `mid-740-github-artifact-readback.mjs` besitzt einen **Legacy-Shadow-Modus** mit exakter Repo-ID, Producer-/Artifact-ID, Run-Attempt, ursprünglichen Job-/Upload-Schritten und vollständigem **abgeschlossenen** Legacy-Installer-Run. Es ist noch kein Pre-Installer-Gate.
2. `mid-740-verify-artifact-envelope.py` verifiziert den ZIP-Envelope, den Git-Package-Commit, die unveränderten ursprünglichen ZIP-Blob-Bytes und den vor dem Merge erzeugten Original-Receipt. Bisher konnte der Receipt zunächst nur als Caller-Datei übergeben werden; er musste aus dem echten Original-Artifact stammen und mit diesem über SHA-256 gebunden werden.
3. `mid-740-postproducer-causality-qa.mjs` überprüft unabhängig Source-Gate-Gesamtlauf, Pflichtjob-Roster, Source-PR, MID-Bot-Squash, Original-Git-Tree-Gleichheit, ursprüngliche Stable-Basis, Laufchronologie und doppelte REST-Readbacks. Vorher akzeptierte er nur das künftige Artefaktformat; der historische ZIP-only-Git-Package-Pfad konnte nicht damit zusammen geprüft werden.

Ein einzelner grüner Teilnachweis genügt **nicht**. Vor allem dürfen weder ein vom PR geliefertes JSON noch ein aus dem Artefakt selbst behauptetes `approved` automatisch Freigabe oder Original-Run-Authentizität erzeugen.

## Neu integriert (QA-only, nach abgeschlossenem Legacy-Installer)

`tools/ci/mid-740-legacy-original-consumer-qa.mjs` führt genau diese **echten, weiterhin unprivilegierten Prüfschritte nacheinander** aus:

1. **Vertrauenswürdiger Checkout:** Lokaler Code-HEAD muss der originalen GitHub-Workflow-SHA entsprechen. Alle SHA-Werte müssen vollständig und unveränderlich sein. Das neue ursprüngliche ZIP-Envelope-Ziel darf nicht bereits bestehen oder über einen Symlink laufen.
2. **Zweifacher Original-GitHub-REST-Readback:** Produzent mit korrektem `workflow_run`-Event, Original-Run-ID/Attempt, Workflowpfad, Repo-Identität, erfolgreich abgeschlossenem Job, erfolgreichem historischen Installer, eindeutigem Artefaktnamen und ID/Digest/Größe sowie Original-Source-/Package-Commit-Parent. Der hinzugefügte Premerge-Receipt-Schritt, Original-Merge, Stage, Upload und Installer-Dispatch müssen in **derselben ursprünglichen Attempt-1-Jobliste** erfolgreich, eindeutig nummeriert und zeitlich geordnet sein. Späte Job-, Step-, Producer-/Artifact-Races sperren.
3. **Originalbytes statt untrusted Metadaten:** ZIP-Envelope direkt über die originale `/actions/artifacts/{id}/zip`-GitHub-API mit geprüfter Cloud-Redirect-Allowlist ohne Tokenweitergabe laden, SHA-256 und Bytegröße **hart** mit Original-REST-Digest abgleichen. Unbekannte/Missing-/Duplicate-/unzulässige ZIP-JSON-Member blockieren.
4. **Kanonischer Original-Receipt:** Der erweiterte Python-Original-Envelope-Verifier kann `--inspect-original-premerge` ausschließlich auf einem vollständig SHA-geprüften Dreierartefakt mit Originalmitgliedern ausführen. Er liefert Receipt-Originaltext, SHA-256 und Manifest nur lesend; **kein PR-Code wird ausgeführt**.
5. **Harter, binärer Original-Git-Blob-Vergleich:** Das bestehende Python-`--expected-legacy-receipt`-/`--expected-premerge-receipt`-Verfahren prüft ZIP-Blob gegen tatsächlichen Package-Git-Commit, Parent, lokale Git-Objekte, Original-Receipt-Bytes, Manifest-SHA, alle Run-/Source-Basiswerte und weiterhin `false`-Flags. Die Erwartungsdateien liegen in einem temporären 0700-Privatverzeichnis (0600-Dateien) und werden nach Auswertung sicher aufgeräumt. **Die zweite Datei stammt aus derselben originalen Envelope; die unabhängige Echtheit stammt erst aus den externen GitHub-REST-/Git-Herkunftsprüfungen**, nicht aus ihrem Selbstvergleich.
6. **Unabhängige Source-Gate-/PR-/Bot-/Installer-Kausalität:** Der bestehende Postproducer-Prüfer nimmt unter einem **separaten, nur für Legacy zugelassenen Intake-Schema** den originalen Package-Git-Blob- und Ancestry-Nachweis entgegen, verwechselt ihn aber nicht mit einem vorab geprüften vollständigen Source-Git-Tree. Er fordert sämtliche echten Source-Run-/Gate-/Core-/Heavy-/PR-HEAD-/PR-Bot-/Squash-Tree-GitHub-Nachweise sowie den bereits vollendeten Installer-Run, und führt seinen ursprünglichen doppelten Readback erneut durch.
7. **Letzter Race-Readback:** Originaler Producer, Artifact-Inventory und alle ursprünglichen Job-Schritte müssen unverändert sein; die unveränderte Stable-Basis wird zuletzt erneut geprüft. Bei Fehler verschwinden neue private Zwischendateien und die allein für diesen Lauf erstellte Envelope-Datei.

Die Funktion liefert ausschließlich `mid.740.original-legacy-postinstaller-consumer-qa.v1` mit Status `ORIGINAL_GITHUB_ZIP_PREMERGE_SOURCE_AND_INSTALLER_QA_ONLY`; immer `originalProducerReceiptAttested:false`, `nativeGitHubReviewVerified:false`, `installerAuthorized:false`, `releaseAuthorized:false`. Ein GitHub-Originalbyte-/Source-Kausalitätsnachweis ist kein signiertes Release- oder menschliches Reviewer-Approval.

## Sorgfältige Abgrenzung

- **Post-Installer-Evidenz, kein Installer-Cutover:** Der Legacy-Installerlauf ist bereits erfolgreich abgeschlossen. Seine originale Run-HEAD-Bindung an den Package-Commit beweist **nicht**, dass der Installer vor seinem Build ausschließlich diese Artefaktbytes geladen hat. Die künftige originale *Producer-completed → independent Installer-preflight → Build/Worker/Pages/Stable*-Eingabebindung und der Wegfall der zwei alten direkten `main`-Writes brauchen einen getrennt implementierten, vollständig getesteten Releaseschnitt.
- **Keine gefälschten Tool-Attestierungen:** Tests verwenden simulierte GitHub-REST-Objekte und Mock-Verifier-Outputs; die echten Python-ZIP-/Git-Verifikationstests laufen separat mit echten lokalen binären ZIPs. Ein positiver Mock ist **kein** erfolgreicher realer GitHub-Producer-Run. Historischer `.486`-Producer-Run besaß **0 Actions-Artefakte**.
- **Nicht schwächen:** vorhandene `main`/`mid-stable`-Schutzregeln, signierte Verträge, Source/Core/Heavy-Gates, unabhängige Installer-/Worker-/Pages-/Stable- und Recovery-Checks. Die volle native, menschenfreie Freigabe ist das Ziel (`0` menschliche Approvals, geschützte required App-Checks), aber hier noch **nicht** aktiviert. Keine erneute Screenshot-Anforderung, keine menschliche Codefreigabe.
- **Release-Hold:** keine direkte `main`-Schreib-, Merge-, Installer-, Release-, Promotion- oder Secrets-Aktion.

## QA-Nachweise

`tests/unit/mid-740-legacy-original-consumer-qa.test.ts` prüft die Komposition mit einem echten lokal erzeugten Git-Checkout und adversarialen Original-REST-/Installer-/Source-/Digest-/Job-/Race-Fällen; `tests/unit/mid-740-postproducer-causality-qa.test.ts` erweitert die Original-Source-/Installer-REST-Fixture; `tests/unit/mid-740-verify-artifact-envelope.test.ts` führt den echten Python-Originalbyteinspektor mit lokalem Git-Package und binären ZIP-Varianten aus. Die **native CI am finalen HEAD** muss erst abgeschlossen sein, bevor daraus ein grüner Prüfstatus abgeleitet wird.

GitHub-Primärdokumentation:
- https://docs.github.com/en/rest/actions/artifacts – Artefakt-ID, SHA-256-Digest, Run-/Repo-IDs, Archivdownload.
- https://docs.github.com/en/actions/reference/security/secure-use – privilegierte `workflow_run`-Ereignisse niemals mit untrusted PR-Code ausführen.
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows – separate Trigger-/Trust-Boundaries.

**Leitchat-Handoff:** #839 / #740. **NO READY · NO MERGE · NO INSTALLER · NO STABLE PROMOTION · NO RELEASE.**
