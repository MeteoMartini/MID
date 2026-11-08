# MID v0.9.85.447 – Governance #702 + #687: gemeinsamer SHA-Vertrag (08.11.2026)

**Status:** Integrationskandidat, nicht selbst ein Releasebeleg. Freigegebener Ausgangspunkt `main=mid-stable=5e25ab60b365950a54a7d113483e8bf519911113`, Paketversion 0.9.85.446. Die Freigabe von v0.9.85.447 erfordert vollständig grüne Source- und Installer-Gates mit nachfolgender SHA-identischer Stable-Promotion.

**Ausgangsquellen:** PR #702 HEAD `092371c27b3d852b1865e2a6d800a22a34c4d54b`; PR #687 HEAD `091fc4cce44d72b22651196674bb27cebd004a32`. Ihre ursprünglichen Draft-Refs und Commit-SHAs bleiben unangetastet. Für bestehende Vertragsdateien wurden nur hinzugefügte Zeilen aus den exakt genannten GitHub-Blobs an ihren Originalankern eingesetzt, ohne Löschen oder Ersetzen von .446 Stable-Zeilen. Die drei #687-Dateien `README.md`, `.github/copilot-instructions.md`, `.kilo/skills/mid-handoff/SKILL.md` sowie vier neue historische Dokumente entsprechen exakt den Original-Git-Blobs.

**Gemeinsame `AGENTS.md`:** #687 fügt drei disjunkte Blöcke zu Task-Routing, Copilot-Issue-/Draft-Handoff und Kilo-GitHub-Read-only-Audit ein. #702 fügt den Draft→Ready→Source-Gate→Bot→Installer-Vertrag an der bestehenden Release-Sektion ein. Keine Überschneidung; keine neue Rechte-, Kosten-, Release- oder DWD/WMO-Ausnahme.

**Ausgangsblobs:** AGENTS .446 `0bf9701d4daec77d337f0daa94854af4c16d29a6`, #702 `074ed1f9266d2301a5314b86b13a1ff13fd456a5`, #687 `da2aef6085e130750a4a840e3f4cfc65d633038e`; MID_CHATGPT_GITHUB_CONTRACT .446 `cac153526f4e2426cacaae72c52457be09fad588`, #702 `510f272b13e0d9d69643fce325d79e018202f6a2`. Sonstige Originaldateien und ihre Provenienz stehen im Git-Diff. Die Dokumente von 2026-11-07/08 enthalten historische Pilot-SHAs und **dürfen nicht als aktuelle Stable- oder Rechteattestation** interpretiert werden.

**Nicht inbegriffen:** #697 CI-Trigger-Patch, #703 Bergwetter-Unixzeit/NoData, RUC-Arbeit, Replit/Widget/iOS-Produktcode, untrusted Copilot-/Kilo-Quellen, Secrets, Rulesets oder CI-Workflows. Parallel-Draft #703 wurde über den Release-Versionskonflikt informiert. Bei erfolgter .447-Promotion muss dessen spätere Integration eine neue aktuelle Versionsbasis nehmen.

**Gates:** Dieser Bericht behauptet keine ausgeführten neuen Tests, kein erfolgreiches .447 Source-Gate, keinen Bot-Merge, keine Worker-/Pages- oder Stable-Promotion. Prüfstatus ergibt sich nur aus den echten GitHub-Läufen auf dem exakten finalen Integration-HEAD; bei Drift oder Fehler fail-closed.
