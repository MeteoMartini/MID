# MID P1 scanner findings – SHA-bound quality triage (14.11.2026)

## Source and exact evidence

- Canonical released main=mid-stable: `4f6c167cc41ab588dfeb2e512ad17a8683a99096` / MID v0.9.85.477. Five existing GitHub rulesets are active; no ruleset modification in this QA.
- QA: PR [#807](https://github.com/MeteoMartini/MID/pull/807) (Draft; no release); first complete scanner readback on `c41bd96388e013608f2f00694f296d5f4e6f7f1f` (before this documentation/test extension).
- GitHub run [#43635301349](https://github.com/MeteoMartini/MID/actions/runs/43635301349): Unit/Coverage PASS; optional scanner step reported a **nonzero outcome** under `continue-on-error: true`, so the parent job remains SUCCESS without a scanner clean pass.
- Downloaded original artifact `mid-p1-quality-report`, artifact ID `14130291114`, JSON `mid-p1-tool-report.json` (40,214 bytes). All three downloaded scanner binaries were SHA-256 checked. This artifact is evidence for **that exact run** and does not qualify a future commit.

## Measured findings, not approval

| Tool | Exact tested version | Reported result | Classification |
| --- | --- | --- | --- |
| actionlint | 1.7.12 | Exit 1; **8** observations | 7 `queue: max` syntax diagnostics + 1 `SC2129` shell style |
| zizmor | 1.32.0 | Exit 14; **31** observations | 2 High (`dangerous-triggers`), 13 Medium (`artipacked`), 2 Low (`adhoc-packages`), 14 Informational (`template-injection`) |
| Biome | 2.6.7 | Exit 0 | Three explicitly selected files only; no whole-app coverage |

The zizmor summary counts all 31 findings **before** truncation; its stored detailed stdout is capped at 32,768 characters (`outputTruncated: true`). The available artifact is therefore **insufficient for an independent finding-by-finding disposition** of every Medium/Low/Informational instance. Do not claim an issue-free scan or invent a complete location ledger.

### Assessment by risk

**High – `dangerous-triggers` (2): needs explicit independent security acceptance, not a blanket false positive.**
- Current `.github/workflows/agent-source-release.yml` uses `workflow_run` for the SHA-bound source gate with a privileged GitHub App. It filters source event, PR origin, trusted branch, exact PR SHA, non-Draft status and main/Stable compatibility; the reviewguard is loaded from `github.workflow_sha` rather than a candidate PR. The source gate and native review protection remain mandatory. The first truncated zizmor finding explicitly points to this workflow.
- `.github/workflows/release-self-heal.yml` also uses `workflow_run`, with restricted actions-write scope. It loads the classifier only from a verified protected `mid-stable` SHA, compares the checkout SHA, runs it without `GH_TOKEN`, and retries only bounded previously failed jobs; its overall trust boundary still merits independent review. **The clipped finding ledger does not prove which specific file contains the second High**.
- These source safeguards mitigate specific untrusted-code paths, but do **not** prove absence of argument/environment injection or TOCTOU races. In particular [issue #740](https://github.com/MeteoMartini/MID/issues/740) and [QA Draft #775](https://github.com/MeteoMartini/MID/pull/775) remain separate native review/merge-safety work. Do not remove or replace `workflow_run` in isolation: that could break the signed MID Bot→ZIP→Installer chain.
- This QA adds a regression to `tests/unit/mid-code-quality-contract.test.ts` for trusted workflow SHA, head SHA guard, protected stable classifier and bounded retry. It is a source-level invariant, **not** a demonstrated exploit-negative end-to-end GitHub pilot.

**Medium – `artipacked` (13): assess individual checkout credential persistence.** GitHub checkout defaults can persist a token to the runner; for each affected job, review whether `persist-credentials: false` preserves any required git operations and whether artifact packaging could capture runner state. Never bulk-rewrite workflows or weaken GitHub App identity/least privilege.

**Informational – `template-injection` (14):** distinguish trusted hash/step-output use from attacker-controllable event content inserted into shell `run:`; move any independently confirmed risky dynamic expression to validated `env:` boundaries and add negative tests. No broad finding suppression.

**Low – `adhoc-packages` (2):** determine whether downloaded/package-manager dependencies have immutable pins, hashes, lockfiles, sandboxed credentials and known-purpose install operations. Do not treat offline success as dependency supply-chain verification.

**actionlint:** GitHub's current official concurrency documentation explicitly supports `queue: max` with `cancel-in-progress: false`; the seven `queue` warnings are a **scanner-schema compatibility gap**, not grounds for changing valid production concurrency behavior. `SC2129` is a shell style suggestion; any optional refactor must preserve exact output and regression checks.

Official review references: [GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), [zizmor audit semantics](https://docs.zizmor.sh/audits/#dangerous-triggers), [zizmor credential risk](https://docs.zizmor.sh/audits/#artipacked).

## Required follow-up / no production write

1. Preserve the scanned SHA, job IDs, timestamps, asset digests, aggregate counts and **complete** individual machine-readable finding inventory in a future bounded scanner-evidence improvement. The existing pilot stores a 32 KiB excerpt; changing that tool touches old Draft #760 and needs an independently coordinated, nonoverlapping integration scope.
2. Classify both High findings against current workflow security and native protection with an independent reviewer; require evidence before a release disposition. Triage Medium/Low/info by path and risk, fixing actual issues on qualified integration branches only.
3. Do not change protected branches, rulesets, workflow triggers, required statuses, credentials or release actors through this QA. All normal Source-PR/Installer/Worker/Pages/Stable gates stay in force. PR #807 remains Draft / **NO RELEASE**, for selective Lead Release-Train integration after updated Stable and PR-overlap checks.
