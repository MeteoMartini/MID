# MID – ChatGPT / GitHub write contract

## Purpose
This contract makes AI-assisted MID changes durable in GitHub without allowing an assistant to bypass the existing fail-closed release process.

## Product limitation and executor
The standard ChatGPT GitHub connection is used for repository and CI read access. Direct repository writes are executed through a coding environment with GitHub write capability (for example Codex) or by the repository owner. ChatGPT may prepare the change, tests and release artifact, but the canonical repository write must follow the branch/PR flow below.

## Branch and PR flow
1. Read current `main` and `mid-stable`; use the latest validated state as the base.
2. Create `codex/<topic>` or `chatgpt/<topic>`; never write directly to `mid-stable`.
3. Implement and test the change on that branch.
4. Build the canonical unversioned `MID-professional-replacement.zip`.
5. Open a pull request to `main` containing the release ZIP (and only intentional repository-maintenance files when explicitly required).
6. The `MID ChatGPT/Codex Release-PR Gate` extracts and validates the ZIP before merge.
7. Merge only after the PR gate is green.
8. The existing `install-mid.yml` processes the ZIP on `main`, runs the authoritative install/build/regression gates, deploys the app/worker where required, and only then promotes the validated commit to `mid-stable`.

## Failure handling
- A failed PR or installer run is fixed on a new commit/branch candidate; do not force-promote a failed state.
- A stale static regression may be updated only if the production architecture intentionally changed and the replacement assertion still protects the intended behavior.
- A real regression must be fixed in production code.

## Permissions
The PR validation workflow is read-only (`contents: read`). It does not merge, deploy or modify branches. Release/deploy permissions remain exclusively in the established MID release workflows.

## Workflow synchronization
Canonical GitHub workflow sources are stored in `ci/github/workflows/`. Run `npm run sync:github-workflows` only as an explicit repository-maintenance change to mirror them into `.github/workflows/`.
