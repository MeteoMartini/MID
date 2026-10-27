# MID-C49: diagnostic security fixes (.348 candidate)

Base: published .347, main=mid-stable=f4360f6e573f78c2be6e20d1c40d9540fd7cb1ea.
Installer 40518231923 completed all required Core/Heavy, worker-health, Pages
and exact stable-promotion jobs successfully. The local duplicate revision
preflight patch was deliberately excluded; PR491 already delivered it.

## Future blocker diagnosis (MID 18.2.50 follow-up)

Do not infer an unavailable integration path solely from the historical
prospective Ref Broker issue176 or from current_user_can_bypass metadata.
Read current AGENTS/source contracts, live refs, actor/permissions, rules and
recent successful source PRs. Use only the authorized integration-branch API
path with ordinary backend enforcement; do not change rules or request force,
admin or protection overrides. In this session normal create_branch accepted
codex/v0.9.85.348-security-diagnostics at the exact verified stable SHA.
Creation success is not release approval. Keep source gate -> dedicated release
bot -> server ZIP -> installer -> worker/Pages -> verified stable promotion.
Never use generic PR Completion landing to replace that chain. If a normal
request is rejected, inspect the actual rejection and fail closed rather than
inventing a bypass. Earlier C49 blanket broker-blocker claims were incorrect.

## Changes and tests

#490 P0: regression timings use mkdtemp private directories and exclusive 0600
files. Both installer uploads consume the new path; all workflow mirrors are
synchronized. Widget browser profiles use mkdtemp. First-failure report ownership
is obtained by exclusive open before collecting the screenshot. Later attempts
cannot replace the report/image. A failed/interrupted first collection stays
reserved; it is not relabeled as valid completed diagnostics. Existing image
symlinks are not followed, and screenshotAvailable is true only for a successful
write by that attempt. URL contract compares the full parsed HTTPS URL.

A behavior regression covers 32 competing writers, retry immutability, report
and image symlink attacks, image/report pairing, 12 independent timing reports,
0700/0600 permissions, both upload paths and deceptive URL suffixes. Existing
widget readiness test now checks exclusive ownership instead of requiring the
old TOCTOU pattern. Focused tests and production build/types passed locally.
Full Core result and GitHub gate evidence are reported separately; do not infer
a CodeQL alert closure or physical iOS acceptance from these local checks.

#490 stays open for remaining CDP argument-binding work and authoritative
CodeQL alert-instance triage. Skybar374, CSS344/463, full-domain446 and ECMWF434
remain separate workstreams with their actual data/visual gates. No unqualified
pilot is enabled, and no missing value or meteorological threshold changed.

## Specific .347 browser-recovery lesson from MID 18.2.50

PR491 comment6443587852 records source gate40514189762 failing with apt exit124:
GitHub Ubuntu24.04's Azure HTTP mirror stalled during Playwright's mandatory
system-dependency installation. Commit4694fc6471f1aa376bdf4e7287ac9d3fab8d8f35
switched that source to the official HTTPS Ubuntu archive. Signature checks,
pinned Playwright, both real engine launches and deadlines stayed required.
Source gate40515554096 and installer40518231923 subsequently completed.
For future setup stalls, distinguish download/mirror failure from browser or
pixel-test failure using actual logs before changing code or retrying. Do not
raise deadlines or skip an engine to hide a download failure.
