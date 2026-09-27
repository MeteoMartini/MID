---
name: mid-handoff
description: Use for every MID task in Replit that changes code, UI or design or hands work to GitHub/ChatGPT. Enforces the unprivileged replit/* handoff, SHA verification, protected-file boundaries and the no-release/no-production rule. Do not use it to publish or bypass MID release gates.
---

# MID Replit → ChatGPT Handoff

1. Require a concrete current MID task issued by ChatGPT. Do not originate a MID product/design task or broaden its scope independently.
2. Read `replit.md`, `AGENTS.md`, `MID_REPLIT_HANDOFF_CONTRACT.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json` and `package.json`.
3. Read `main` and `mid-stable` from GitHub and record their SHAs. If the base is ambiguous or divergent, stop instead of guessing.
4. Work only on `replit/<topic>`. Never write `main`, `mid-stable`, `chatgpt/*` or `codex/*`.
5. Keep governance, CI/release, secrets, Worker, native iOS, version/build/deploy configuration and trusted-agent instructions out of the Replit handoff.
6. Prefer the connected GitHub integration/API for the branch handoff. A missing SSH deploy key is not a blocker and must not be replaced with a broad write credential.
7. Verify base/parent/commit object hashes before creating or moving the branch ref. Read the remote ref back after the write and require an exact SHA match.
8. Let the read-only MID Replit Handoff Gate validate the branch. Do not create a direct PR to production.
9. Return a compact handoff receipt: branch, base SHA, head SHA, changed paths, tests, gate result, protected changes needed, and confirmation that no release/promotion occurred.
10. ChatGPT owns tasking, review and integration. Only the existing Source-PR-Gate → controlled merge → server-side ZIP → installer → Worker/Pages → stable-promotion chain may publish MID.
