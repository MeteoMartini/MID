# MID Release Train: version planning and specialist-chat handoff (QA draft, 2026-11-11)

**Status: proposed, non-operative.** This document and `tools/ci/mid-release-version-proposal.mjs` do not alter the production CI/release/merge/installer path, existing GitHub rulesets, permissions, canonical `mid-stable`, version mirrors or any deployed code. Adoption requires the normal trusted integration/source PR/release gates and a separately versioned production release. No auto-release is authorized by this document.

## Verified starting point

At the start of the review on 2026-11-11, `main = mid-stable = ee7a55b5ece4d3d3687202a95caeb6c5ff615055` and the released version is `0.9.85.454`. `AGENTS.md`, `MID_CHATGPT_GITHUB_CONTRACT.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, five active GitHub rulesets and concurrent open Draft PRs were read. This SHA is historical evidence only: **every integration and deployment must read live GitHub state again**. The existing `release-train-preflight.yml` is a strictly read-only one-to-five-PR adviser, not an integration job.

## One lead chat, independent specialist drafts

- A specialist chat may prepare a bounded patch on a verified branch with exact base/head commit SHA, a complete changed-file inventory (including rename sources), original evidence, tests, unresolved blockers, time/units/NoData/source claims where relevant, and a narrowly described user-visible impact. A specialist Draft must never independently exit Draft, merge, deploy, promote Stable or allocate a shared release version.
- The lead chat selects up to five compatible candidates, detects duplications and overlap, verifies actual PR-heads/blobs/parents from GitHub, triages conflicting interpretations and decides which scope to defer. Only selected changes are independently imported into one authorized `chatgpt/*` or `codex/*` integration branch from current verified Stable. **No direct merge of individual Drafts.** Preserve exact source SHAs and original branches. If the source base has drifted, revalidate and selectively transplant after protecting the existing commits; never reset unverified work.
- Existing `tools/ci/release-train-plan.mjs` performs advisory conflict/inventory planning; a future supervised integration executor can reuse its result only after fresh checks on all source files/renames and risk contracts. It must not grant new write rights, expand the existing release bot or bypass independent reviewer evidence.
- The lead chat creates one new synchronized candidate version, documented user changelog and SHA/provenance manifest. Draft QA is selective and scope-based. Only after all actual blockers are resolved may the exact integrated source PR be set Ready-for-review to trigger the **unchanged** complete Source gate. Success allows only the existing SHA-bound MID Agent Source Release bot → server-side ZIP → `install-mid.yml` independent complete verification → affected Worker/Pages gates → verified `mid-stable` promotion.
- Prior successful specialist tests may inform the risk analysis, not substitute mandatory combined Source/Installer tests. The release-train preflight itself always reports `releaseAuthorized:false`.

## MID's actual four-component version convention

Existing repository documentation defines a functional release as `0.7.x` or `0.7.x.0` and maintenance increments of the fourth component (`0.7.x.y`, `y>=1`). Current MID is `0.9.85.454`, which must not be silently converted into three-component SemVer or any external npm semantic-release version format. For clarity this proposal calls the fields **X.Y.Z.W**:

- **X = primary/major product line.** Keep at **0**. Never automatically increment X, even for an incompatible change, a Conventional Commit `BREAKING CHANGE`, a large diff, or a dependency major version. Such a change is a BLOCKER until the user separately and explicitly authorizes a defined major-release procedure and independent enforcement; **no major approval bypass is implemented**.
- **Y = product generation.** A substantial, explicit product-generation change requires a separate user decision and evidence. Never automatically change Y, or reset lower counters without authorization. A large diff or many merged PRs is not itself generation evidence.
- **Z = functional release.** A new, independent, user-visible product capability with demonstrable compatible behavior may propose `X.Y.(Z+1).0`; existing features and weather/hazard provenance must remain correct. Mere refactors, additional diagnostics, QA, error corrections, model-data calibration or minor UX polish do not automatically qualify.
- **W = maintenance release.** A compatible bugfix, security/operational repair, small enhancement, UI refinement, source/governance improvement or mixed maintenance bundle proposes `X.Y.Z.(W+1)`. A meaningful but not independent feature can remain in this lane. It is not a timestamp, arbitrary counter or elapsed-hours measurement.

`0.9.85.454` therefore proposes `0.9.85.455` for maintenance, `0.9.86.0` for a separately evidenced independent compatible feature, and **no automatic proposal** for `0.10.0.0` or `1.0.0.0`.

## Restrictive automated proposal

`tools/ci/mid-release-version-proposal.mjs` deterministically proposes only Z or W increments from a one-to-five-candidate manifest containing stable SHA, main SHA, exact base version, candidate PR/head SHA, scoped changed paths, declared impact and evidence reason. It requires an independently supplied live main/stable/version triple with an exact match. Mixed batches use the highest *compatible* independently assessed impact; `generation`, `breaking`, `unknown`, missing evidence and drift cause BLOCKED, not a default bump. It never modifies `package.json` or any other file and always emits `releaseAuthorized:false`.

**Important limitation:** A specialist-supplied description/`impact` field and filenames do **not** prove the actual semantic scope. The lead integrator must independently compare the real GitHub code diff, meteorological/worker contracts, API/backwards compatibility, release notes and identified user-visible changes before relying on any proposal. Malicious or mistaken labels cannot authorize any release. The proposal's `verifyProposedTarget` is arithmetic/consistency validation, **not** approval. An eventual production gate must independently read the exact current Stable version and candidate version, reject unauthorized X/Y changes, check required sync mirrors, and bind authorization to verified GitHub identities/SHAs, not to a modifiable PR label, self-written manifest or untrusted assistant response.

## Required deployment safety, version mirrors and tests

Once a version is independently approved and proposed, update `package.json` as the canonical version and execute the existing `npm run sync-version` idempotently; verify lockfile, baseline, src/public version, both service workers, all worker sources/mirrors, iOS marketing/build metadata, release notes/changelogs, source-of-truth/contracts and applicable legal/license data. **Do not run this while preparing a QA-only draft.** A Z bump resets W to zero; the current `scripts/sync-version.mjs` maps iOS marketing version to X.Y.Z and CFBundleVersion to W+1; real App Store monotonicity/compatibility constraints require qualification before activating a changed Z/Y policy. Preserve full historical changelogs.

Before promoting this proposed governance: validate negative/adversarial unit cases (malformed versions/evidence, SHA drift, duplicated PR, major/generation attempts, spoofed targets, overflow), real PR diff inventory and all simultaneous work; confirm both canonical CI workflow mirrors if ever modified. No status is green merely because an offline test passes. The complete Source and Installer independent gates remain compulsory; there is **no** cross-gate reuse authorization under issue #526.

## Open integration design decisions

1. Exact trusted intake: a deliberately separate integration helper creates one authorized short-lived branch/PR, not the read-only preflight; first prove no race/overlap and permission/signed-contract violations.
2. Persist a small, machine-readable impact-evidence manifest with actual ref/commit/file IDs; do not make user-supplied kind or PR labels a release authority.
3. Implement a **separate** major-generation approval mechanism only after user direction, with GitHub-native protected review/gate evidence; classic branch-protection API currently yields HTTP 403 for the connected GitHub app, so its absence is unproven. The active rulesets must not be weakened.
4. Review open draft #745 and other specialist PRs as separate scopes; do not silently absorb #749/#750/#748/#746 or bypass their reported blockers.

Sources: `README.md` (current four-component version convention), `scripts/sync-version.mjs`, `scripts/test-versioning.mjs`, `MID_CHATGPT_GITHUB_CONTRACT.md`, `AGENTS.md`, `tools/ci/release-train-plan.mjs`; background: https://semver.org/spec/v2.0.0.html and https://www.conventionalcommits.org/en/v1.0.0/ .
