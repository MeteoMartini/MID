# MID Release 1.2 – kostenneutraler Qualitäts-Pilot (QA DRAFT, NO RELEASE)

Source at creation: `main = mid-stable = 7272a54ef9a9bd02fa1b6523f0cbf352b9412963`, `v0.9.85.455`. Separate release integration #754 (.456) has ownership of productive workflow paths. This candidate changes neither workflow nor permissions, tokens, secrets, package lock, version, merge, installer nor deployment.

## Scope and execution

- `tools/ci/mid-workflow-quality-pilot.mjs` checks byte-identical canonical/active copies of seven fixed release/source/security/RUC workflows before running the separately, SHA/checksum-verified `actionlint` and `zizmor` executables. Offline `zizmor` receives no token or secret environment variables. Scan findings, missing tools and mirror drift cannot become green. No workflow or CI integration is enabled. On the exact source snapshot, after a trusted offline installation: `node tools/ci/mid-workflow-quality-pilot.mjs`.
- `scripts/test-mid-workflow-quality-pilot-0985455.mjs` has eight self-contained negative/safety test groups, no network, external scanner, new dependency or paid service. Run with `node scripts/test-mid-workflow-quality-pilot-0985455.mjs`.
- `scripts/test-mid-release-property-invariants-0985455.mjs` has 512 seeded property inputs / 2568 version arithmetic and rejection checks against the existing trusted MID versioning implementation. No additional dependency. Run with `node scripts/test-mid-release-property-invariants-0985455.mjs`.

## Qualification, non-authorizations and handoff

1. Pin/verify actionlint and zizmor binaries from official releases (including supply-chain checks); no `curl | bash`, floating version, remote source execution or new App rights. Benchmark confirmed unique findings and runtime against existing CodeQL, NPM audit and PR #759.
2. In a separate controlled integration from newly verified Stable, run the actual scanners and independently triage findings. Only when a measured improvement and complete regression equivalence are proven should an existing CI job invoke the pilot. No new workflow, required status or automatic Cubic dependency.
3. A real `fast-check` integration must wait for reproducible lockfile qualification in the existing combined .456 candidate; this zero-extra-dependency seeded property pilot does NOT claim `fast-check` was installed. Semgrep/Stryker and SonarQube remain optional, no subscription activated.
4. Review issue #740 remains P0. `isResolved` does not prove independent disposition; a newly submitted `CHANGES_REQUESTED` review can race the REST merge. The first .456 bot run still uses published .455 workflow, so new guard cannot be assumed live. Native GitHub merge-time enforcement and real actor/ZIP/negative pilot are prerequisites, not replaceable by unit QA or this pilot.
5. The normal MID path is unchanged: verified Source PR → SHA-bound bot merge → server ZIP → `install-mid.yml` → affected Worker/Pages → Stable promotion. Every script here reports `releaseAuthorized:false`, `mergeAuthorized:false`; draft QA is not release acceptance.
