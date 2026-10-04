# MID – Repository instructions for ChatGPT, Codex and coding agents

These rules are binding for repository changes.

## Source of truth
- Read `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json` and `package.json` before modifying MID.
- Start from the current `mid-stable` commit. Compare `main` with `mid-stable` first; do not silently continue from an older archive, Replit workspace state or chat copy.
- `mid-stable` is the canonical released source only after the existing build, deploy and release gates have succeeded.

## Trust zones and safe write workflow
- Never push agent changes directly to `main` or `mid-stable`.
- ChatGPT/Codex integration work uses only short-lived `chatgpt/v<version>-<topic>` or `codex/v<version>-<topic>` branches from the verified stable base.
- Replit is an unprivileged UI/design workbench. ChatGPT is the sole tasking authority for MID work sent to Replit; Replit must not originate MID product/design work or broaden a ChatGPT-issued task independently. Replit handoffs use only `replit/v<version>-<topic>` branches and must follow `replit.md` and `MID_REPLIT_HANDOFF_CONTRACT.md`.
- Replit must never create or update `chatgpt/*`, `codex/*`, `main` or `mid-stable`, open a direct production PR, merge a PR, publish, deploy, or promote a release.
- Persistent agent/governance instructions and release/CI configuration are maintained only through a trusted ChatGPT/Codex integration branch, never through a Replit handoff.
- Before starting overlapping work, inspect open PRs and relevant agent/Replit branches; do not create parallel duplicate implementations.
- Preserve all existing release, WMO/DWD, responsive-design, provenance and security contracts unless the requested change explicitly updates them.
- Do not weaken a valid regression merely to make CI green. Update stale tests only when the production contract has intentionally changed and document why.

## Replit Git transport
- A missing local SSH deploy key is not a reason to create, repair, copy, expose or weaken an SSH credential automatically.
- For the normal MID Replit handoff, use the connected GitHub integration/API path and write only the intended `replit/*` branch ref.
- Keep strict SSH host verification intact. Do not disable host-key checking or add broad write credentials as a fallback.
- Before creating or updating a Replit handoff ref, verify the current `main`/`mid-stable` SHA, the intended base/parent SHA and the locally produced commit SHA. After writing the ref, read it back and verify the exact remote head SHA.
- If provenance, permissions, hashes or the stable base cannot be verified, fail closed and leave the work local/unpublished.

## Release delivery contract
- The normal agent release is source-first: open a non-draft PR from an authorized `chatgpt/*` or `codex/*` branch to `main`.
- Do not commit or transport `MID-professional-replacement.zip` in a normal agent PR. The Source-PR Gate explicitly rejects it.
- After a green Source-PR Gate, `MID Agent Source Release` performs the controlled SHA-bound merge, creates `MID-professional-replacement.zip` server-side from the current `main` source and starts `install-mid.yml`.
- `install-mid.yml` remains the only normal path that verifies, deploys Worker/Pages and fast-forward promotes a successful release to `mid-stable`.
- Never force-update or manually promote `mid-stable`.
- For an actual application release, bump the MID maintenance version, synchronize all version mirrors, update the external/internal changelog, and run the focused tests plus the normal release gate.
- Simulate/verify common iPhone, iPad/tablet, Android-phone and desktop viewport contracts, especially text wrapping, overlays/tooltips and floating navigation.

## GitHub workflow files
- Canonical managed workflow sources live under `ci/github/` and are mirrored to `.github/` only through `npm run sync:github-workflows` in an explicit trusted repository-maintenance change.
- GitHub Actions must use least privilege and pin third-party/official actions to full commit SHAs.
- Replit handoffs may not modify canonical or active workflow/configuration sources.

## MID-specific expectations
- German is the default UI language; established meteorological English technical terms may remain English.
- Follow WMO and relevant national-weather-service conventions, especially DWD for German products.
- Keep parameter colors, weather pictograms and responsive behavior consistent across mobile portrait/landscape, tablet and desktop.
- Prefer the newest validated implementation already in the repository over recreating older code from conversation history.

- Changes to shared UI elements must reach every consumer, including widgets and URL/PNG exports: reuse the common renderer and pass the same canonical data/settings. Verify all consumers rather than maintaining parallel implementations.
