---
name: mid-handoff
description: Mandatory safe handoff workflow whenever a Kilo cloud coding agent develops, fixes, redesigns or tests an existing MeteoMartini/MID feature and needs to preserve or submit changes. Use for all MID implementation tasks, including tasks started directly from iPhone/iPad.
---

# MID Kilo work and handoff

1. Before work read `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `package.json`, and relevant normative contracts; verify exact live SHAs of `main` and `mid-stable`; identify active PRs and parallel work. If drift or overlap, stop changes.
2. Run in a dedicated **local** worktree branch off the verified latest `mid-stable` commit. Never commit on `main` or `mid-stable`. Kilo cannot create/update protected `chatgpt/*`/`codex/*` refs. Do not attempt to push those refs and never use force, bypasses, SSH credential fallbacks or broaden GitHub permissions.
3. Work only within the scope of the user's task, retain all existing functions, tests and WMO/DWD contracts. Apply least-privilege; never access or copy secrets.
4. Run focused relevant tests and document exact pass/fail evidence. Do not claim browser tests are real iOS/VoiceOver acceptance. Leave intentional version updates and full release to trusted MID integration.
5. Once the task is completed and validated locally, save all work as commits in the isolated local branch; ensure `git status --porcelain` is empty and preserve changes if any handoff step fails.
6. To hand over automatically, run `node scripts/mid-kilo-handoff.mjs --title "<short descriptive topic>"`. This uploads only immutable Git objects and creates a GitHub intake issue. It never creates/updates refs or production branches, opens PRs, or deploys. A separate trusted ChatGPT intake checks and produces at most a Draft PR.
7. If the script fails because GitHub does not permit writing Git objects/issues, leave local commits untouched, report the precise blocker once and **stop**. Do not fall back to creating unauthorized branches or using new credentials. No local reset, no rebase, no deletion of an ephemeral worktree until the handoff issue and remote object have been verified.
8. A successful issue is a **candidate**, not acceptance. Await independent integration, full gates and release. Always report the issue URL, remote candidate SHA, local HEAD, exact stable SHA, tests, and remaining blockers.

Kilo's Cloud Agent may run tools automatically. This skill is policy guidance and does not replace server-side branch protection or the independently authorized GitHub release actor. Never auto-merge or self-release.
