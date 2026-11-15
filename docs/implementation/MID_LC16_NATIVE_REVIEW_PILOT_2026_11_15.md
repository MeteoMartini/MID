# MID LC 1.6 · #740/#775 – isolierte Native-Review-/ZIP-Qualifikation

**Arbeitsstand:** v0.9.85.484 als Draft-PR #828 auf Basis `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`. Die unveränderte Alt-Kandidatur #775 (HEAD `aae5d6731e34b20c5d439bfa3c7b572e9c89d772`) bleibt separat bestehen; hier werden nur ihre zwei read-only Tools übernommen, nicht ihr alter Stand .460 oder ihre Ruleset-Konfiguration.

## Neu im Sammel-PR
- `tools/ci/mid-native-review-policy.mjs` – aus #775 selektiv übernommen; zusätzlich bewusst enger: `allowed_merge_methods` muss **exakt** `['squash']` sein. Die Repo-/Source-/Branch-/Enforcement-/Approval-/Stale-/Thread-/Bypass-Bedingungen sind weiterhin fail-closed.
- `tools/ci/verify-source-release-zip.py` – **byteidentisch** zu #775. Liest nur lokalen Git-Commit und ZIP; SHA, Inventar, Mode und Git-Blob-OID werden geprüft, `.github`/generierte Artefakte nach vorhandenem Vertrag ausgenommen.
- `tests/unit/mid-native-review-sourcezip-lc16.test.ts`: 1 valid/15 unzulässige Regeln sowie echter, lokal neu erzeugter SHA-1-Git-Commit mit legitimen/exkludierten Dateien; 1 positive ZIP-Abnahme, 6 negative ZIP-Varianten (Fremdinhalte, fehlende/zusätzliche Dateien, Mode, Traversal, Duplikat), falscher Commit-SHA. Keine GitHub- oder Cloudflare-Aktion aus Unit-Tests.

## Nicht implementiert / kein Freigabeanspruch
**Keine** Regeln werden erstellt, geändert oder gelockert; weder Workflows noch Installer, Tokens, Secrets, Bot, `main`, `mid-stable` oder Releases werden geändert. Der positive synthetische ZIP-Test ist keine Validierung einer neuen produktiven Veröffentlichung, und ein statischer Ruleset-Readback ist keine echte GitHub-native Race-Abnahme mit unabhängigem Reviewer. Der echte Pilot mit berechtigter Reviewentscheidung am letzten Mergezeitpunkt, späterem `CHANGES_REQUESTED`, kompatiblem geschütztem ZIP-/Dist-Transport und tatsächlichem GitHub-Release bleibt unter #740/#775 **BLOCKED** bis zu nachgewiesener End-to-End-Qualifikation und ausdrücklicher Policyentscheidung des Owners.

Die zwei High-`dangerous-triggers`-Befunde des bisherigen `workflow_run`-Transports werden durch diese read-only Tools **nicht** beseitigt. Neuer Unit/Coverage-Lauf und alle relevanten Gate-Nachweise müssen anhand der geänderten HEAD-SHA unabhängig geprüft werden. 
