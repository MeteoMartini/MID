# MID – ChatGPT / GitHub write contract

## Purpose
This contract makes AI-assisted MID changes durable in GitHub without bypassing the fail-closed source, release, security, and stable-promotion process. GitHub is the source of truth; `mid-stable` is the released codebase after successful promotion.

## Roles and write boundaries
- Before every change, read and compare current `main`, `mid-stable`, the MID version, and the applicable contracts.
- Continue only from a verified current base. If provenance, SHA lineage, or permissions are unclear, stop fail-closed.
- ChatGPT/Codex integration work uses short-lived `chatgpt/v<version>-<topic>` or `codex/v<version>-<topic>` branches created from the verified current `mid-stable`.
- Never write directly to `main` or `mid-stable` from an agent branch.
- Replit is an unprivileged UI/UX design workbench. It may hand off only through `replit/*` and may not change governance, release, Worker, native iOS, version, central build/deploy, `main`, `mid-stable`, `chatgpt/*`, or `codex/*`.
- Existing rulesets, least-privilege permissions, signed contracts, release gates, and secrets must not be weakened to make a change pass.

## Normal source-first agent release
1. Check open PRs/relevant branches for overlapping work, then develop and test from the verified current `mid-stable` on an authorized `chatgpt/v<version>-<topic>` or `codex/v<version>-<topic>` branch.
2. Open a non-draft source pull request against `main`.
3. Do **not** commit or transport `MID-professional-replacement.zip` in the normal agent pull request.
4. The `MID ChatGPT/Codex Source-PR Gate` validates repository structure, lockfile/dependency integrity, production dependencies, production build, full regressions, the shared Web/iOS shell, and server-side packaging readiness.
5. Only after the required source gate is green may the established SHA-bound release automation perform the controlled merge.
6. GitHub Actions creates the canonical unversioned `MID-professional-replacement.zip` server-side from the merged `main` source.
7. `install-mid.yml` remains the release authority for re-verification, Installer processing, Worker/Pages decisions where affected, deployment checks, and fast-forward promotion to `mid-stable`.
8. No force update and no manual direct stable promotion. The browser/manual ZIP path is only the documented emergency fallback.

## Failure handling
- Deterministic code, type, build, regression, dependency/security, provenance, or unknown failures block release.
- A failing product regression is fixed in production code.
- A regression test may change only when the product contract intentionally changes and the replacement assertion preserves at least the same protection.
- Temporary infrastructure failures may be retried only under the existing bounded self-heal rules.
- Never weaken a gate, ruleset, host verification, or credential boundary as a workaround.

## Replit handoff integration
- Replit work is accepted only from a verified `replit/*` remote ref whose base SHA, head SHA, changed paths, tests, responsive checks, and read-only Replit Handoff Gate are verified.
- ChatGPT reviews diff and provenance before selectively integrating the approved UI changes into an authorized `chatgpt/*` or `codex/*` branch.
- A green Replit Handoff Gate is necessary but not sufficient for release; source integration must still pass the normal Source-PR and release gates.

## Permissions
- Read-only validation workflows remain read-only unless the specific established release workflow requires more.
- Release/deploy permissions remain confined to the established MID release actors and workflows.
- Trusted-agent branch bypasses are limited to explicitly identified authorized actors. Replit receives no bypass for `chatgpt/*`, `codex/*`, `main`, or `mid-stable`.

## Workflow and governance synchronization
- Canonical GitHub workflow sources live under `ci/github/workflows/`; mirrors under `.github/workflows/` are synchronized only as an explicit trusted repository-maintenance change.
- Persistent governance changes use an authorized trusted-agent integration branch and the normal source review path.
- Replit may not modify or weaken governance contracts or workflow policy.

## Release performance without weaker gates (v0.9.85.168)
- The Source-PR Gate and Installer continue to execute the complete MID verification path; no regression, dependency/security check, iOS-shell check, Worker smoke, Pages gate, or Stable SHA verification may be skipped for speed.
- Regression execution may parallelize only tests conservatively classified as read-only. Any test or recursively imported local helper that writes files, launches child processes/browser automation, opens servers/listeners, performs fetches, mutates process-global state, or cannot be classified safely remains serial. The execution plan must be a lossless one-to-one partition of the complete discovered regression inventory.
- Git checkouts use shallow snapshots where history is not part of the proof. If the Installer detects that `main` advanced during the long verification window, it must fetch full history before applying the existing race/ancestry check; uncertainty remains fail-closed.
- A Pages artifact may be prepared and uploaded in parallel with the Worker gate because this does not publish it. The actual GitHub Pages deployment remains blocked until the Worker job succeeds.
- Stable promotion may use the GitHub Compare/Refs API instead of downloading repository history, but only after exact Release-SHA verification, an explicit ancestor/fast-forward proof, a non-force ref update (`force=false`), and exact post-update SHA verification.
- The separate Source-Gate and Installer verification stages remain in place. Replacing the second full verification with attestations is a distinct future governance change and is not authorized by this optimization.

