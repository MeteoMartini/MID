# MID – Repository instructions for Codex / coding agents

These rules are binding for repository changes.

## Source of truth
- Read `MID_SOURCE_OF_TRUTH.md` and `MID_BASELINE.json` before modifying MID.
- Start from the current `mid-stable` commit. Compare `main` with `mid-stable` first; do not silently continue from an older archive or chat copy.
- `mid-stable` is the canonical released source only after the existing build, deploy and release gates have succeeded.

## Safe write workflow
- Never push agent changes directly to `main` or `mid-stable`.
- Create a short-lived branch named `codex/<topic>` or `chatgpt/<topic>` from the current stable base.
- Preserve all existing release, WMO/DWD, responsive-design and provenance contracts unless the requested change explicitly updates them.
- Do not weaken a valid regression merely to make CI green. Update stale tests only when the production contract has intentionally changed and document why.

## Release delivery contract
- MID releases use the canonical unversioned file name `MID-professional-replacement.zip`.
- Before creating the ZIP, verify the current stable/main state and inspect the latest GitHub Actions runs for failed predecessor uploads.
- Bump the MID maintenance version, synchronize all version mirrors, update the external/internal changelog, and run the focused tests plus the normal release gate when dependencies are available.
- Simulate/verify common iPhone, iPad/tablet, Android-phone and desktop viewport contracts, especially text wrapping, overlays/tooltips and floating navigation.
- For a normal agent-authored release PR, commit the candidate `MID-professional-replacement.zip` to the feature branch and open a PR to `main`. The PR gate validates the ZIP itself. After merge, the existing `install-mid.yml` remains the only path that installs the release, deploys it and promotes the successful result to `mid-stable`.
- Do not bypass the installer by force-updating `mid-stable`.

## GitHub workflow files
- Canonical workflow sources live under `ci/github/` and are mirrored to `.github/` only through `npm run sync:github-workflows` in an explicit repository-maintenance change.
- GitHub Actions must use least privilege and pin third-party/official actions to full commit SHAs.

## MID-specific expectations
- German is the default UI language; established meteorological English technical terms may remain English.
- Follow WMO and relevant national-weather-service conventions, especially DWD for German products.
- Keep parameter colors, weather pictograms and responsive behavior consistent across mobile portrait/landscape, tablet and desktop.
- Prefer the newest validated implementation already in the repository over recreating older code from conversation history.
