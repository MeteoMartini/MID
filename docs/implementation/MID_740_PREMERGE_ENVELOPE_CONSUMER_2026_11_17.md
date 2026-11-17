# MID #740 / PR #839 · Original-Receipt im ZIP-Envelope: rückwärtskompatible, harte Byteprüfung

Stand 17.11.2026, QA-only. Autoritatives Ausgangs-Stable `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486. **Keine** Freigabe des produktiven Producers/Installers, kein Merge und kein Ruleset-Edit.

## Ausgangsbug und Sicherheitsauswirkung

Der in PR #839 vorbereitete Source-Producer erzeugt bei erfolgreichem Source-Gate-Readback ein originalgebundenes dreiteiliges GitHub-Actions-Artefakt:

- `MID-professional-replacement.zip` – tatsächliche Git-Blob-Bytes des ZIP-only-Commit
- `provenance.json` – Producer-Run/-Attempt, Source-Gate-Run/-Attempt, Package-/Merge-/Workflow-SHA, ZIP-SHA-256, `originalPremergeReceiptIncluded` und `originalPremergeReceiptSha256`
- `premerge-gate-receipt.json` – vor dem Source-Squash-Merge vom authentifizierten `workflow_run`-Kontext erzeugte Originaldaten

Der bestehende unabhängige `tools/ci/mid-740-verify-artifact-envelope.py` ließ ausschließlich **genau zwei** ZIP-Member und ein altes Manifest ohne neue Receipt-Felder zu. Damit wäre sogar ein korrektes, nach Original-GitHub-REST belegtes neues Producer-Artefakt beim Consumer stets gesperrt. Bei optional nicht ausgeführtem Receipt besitzt das neue Zweierartefakt zudem ausdrücklich `false/null` statt der früheren vollständig fehlenden Felder.

## Implementierte Änderung (kein Berechtigungs-Cutover)

`verify_legacy_shadow` nimmt nur drei eindeutig erlaubte Formate an:
1. Historisch zweigeteilt mit altem, exakt gebundenem Manifest.
2. Neu zweigeteilt mit den ausdrücklich als **fehlend** markierten Receipt-Feldern `false/null`.
3. Neu dreigeteilt **ausschließlich wenn** der unabhängige Aufrufer mit `--expected-premerge-receipt` eine zweite, getrennt beschaffte, reguläre Originalbyte-Datei übergibt.

Der Prüfer verlangt für Fall 3 vollständige ZIP-Envelope-SHA-256, tatsächliche Git-Blob-ID des ZIP, Source-Package-Git-Ancestry und unveränderten Paketinhalt, exakt drei allowlist-Member mit ZIP-CRC, keine Symlinks/Duplikate/Extraktionspfade, höchstens 64 KiB je JSON-Member, inhaltlich **identische** erwartete Receipt-Bytes, deren SHA-256 im Manifest, kanonisches `JSON.stringify(record)+newline`, keine doppelten JSON-Keys, die vollständige 16-Felder-Receipt-Schemaform, korrekte Source-Gate-/Producer-ID und Attempts, Workflow-/Source-Basis-SHA sowie **alle** vorhandenen `false`-Autorisierungsflags. Fehlender dritter Member, ungeklärte Provenienz, falsches Caller-Receipt, falscher Digest, falsch gemeldetes `true/false`, Zusatz-Member und Run-/SHA-Drift werden **gesperrt**, nicht als Zweierartefakt heruntergestuft.

Der Output enthält `originalPremergeReceiptBytesVerified` und den SHA-256 der tatsächlich geprüften Receipt-Originalbytes; weiterhin explizit `authenticatedGitHubProducer:false`, `nativeReviewVerified:false`, `installerAuthorized:false` und `releaseAuthorized:false`. **Byteidentität mit einer zweiten Eingabedatei ist keine eigenständige GitHub-Origin-Authentifizierung**; dafür sind zusätzlich der bestehende Attempt-/Job-/Step-/Artifact-REST-Readback und originaler Download mit unabhängiger ZIP-Digest-Prüfung erforderlich.

## Regressionen

`tests/unit/mid-740-verify-artifact-envelope.test.ts` führt reale Git-Commits und binäre Producer-Envelope-ZIPs aus, einschließlich historischer und neuer Zweierform, positiver originalgebundener Dreierform sowie vielfältiger Fälschungen: fremder Producer-/Gate-Run, veränderte Source-Basis, Selbstautorisierung, fehlender Source-Gate-Nachweis, manipuliertes JSON, duplizierte Keys, verweigerte Originalbytes, falsche Digest-/Presence-Felder, unerlaubte Zusatzmember und zusätzlicher erwarteter Receipt ohne Originalmember. Bestehende allgemeine Source-Envelope-Prüfungen dürfen durch die neue 2-/3-Member-Erweiterung **nicht** gelockert werden.

## Verbleibende harte Abnahmegrenzen

- Der neue Dreierformat-Consumer ist zunächst nur **offline/QA**. Er muss später nach **original authentifiziertem Producer-Run-Abschluss**, kompletter Job-/Upload-Step-/Attempt-Prüfung und zweimaligem GitHub-REST-Readback die aus **demselben echten GitHub-Actions-Artefakt** entnommenen Originalbytes prüfen. Kein untrusted PR-/LLM-JSON darf den Nachweis erzeugen.
- Die anschließende Installer-Eingabe muss auf exakt diese bytegeprüften Artefakte und den Quell-Git-Tree gebunden werden; die zwei Legacy-`main`-Pushes erst **gemeinsam** und nach dist-/Manifest-/RUC-/Widget-/PWA-/Worker-/Pages-/Stable-Restore-Tests ablösen.
- Die User-Vorgabe **null menschliche Codefreigaben**, später verpflichtende app-/SHA-/Job-/Step-gebundene automatische GitHub-Checks mit PR-Pflicht, bleibt unverändert. Bereits gelieferte Branchschutz-Screenshots nicht erneut anfordern.

Quelle: GitHub REST Actions Artifact API https://docs.github.com/en/rest/actions/artifacts (Original `workflow_run`/ID/Digest/Archive-URL) sowie https://docs.github.com/en/actions/tutorials/store-and-share-data (Artifact-Digest ist zu prüfen). Das Browser-/Cloudflare-/iOS-Release wurde in diesem QA-Schritt **nicht** ausgeführt.

**NO READY · NO MERGE · NO INSTALLER · NO RELEASE.**
