# Copilot AP1b transport and read-only receipt

Base: MID v0.9.85.443, main=mid-stable `fda79a1683ec78cdf602416b2a5486a9f9512a9a`.
This tooling/governance candidate is not an application build or production release.

## Assigned task, not general agent access

The user requested automated Copilot handoff without manual file/text relay. The first task is recovery of the already secured AP1b tree `239e809be2ba1e535e26d7ad1ab27df1e8ab0241`. The two Python paths, historical parent and submitter ID/login are pinned in `tools/handoff/ap1b.json`. This configuration authorizes no other file, task, identity or tree. MeteoMartini ID 75040651 was verified through the connected GitHub profile; no Copilot bot ID is guessed or implicitly trusted. A different authenticated identity blocks transport; do not create a broader token to fix it.

The original patch SHA-256 reported by Copilot is `285bb5680d990b58ea13a3188e69f6e42f4257cba400594ce0adde0ac7faf9f2`. Its contents are not available in this integration workspace. This SHA remains reported evidence, not an independently verified result. The actual AP1b Python source is not recreated or copied from the old PR.

## Sender

A Copilot execution with the existing staged AP1b tree uses the **trusted installed** helper `node scripts/mid-copilot-handoff.mjs` for dry-run, then the same helper once with `--submit`. No local branch switch, local commit or index mutation is needed. `git write-tree` records Git objects only. The helper must not be modified in the untrusted session; its code must come from the reviewed published version of this package. Do not change or reset the old checkout merely to install it: deliver the reviewed scripts/module/config together outside that checkout and invoke the helper there while its working directory remains the original repository.

The helper checks actual HEAD, exact staged tree, exact paths, regular-file modes, size/UTF-8/secret guards, live main/stable agreement and the existing authenticated submitter. It creates only blobs, a tree, an immutable single-parent commit and a JSON issue `[MID-COPILOT-HANDOFF] ap1b-p1-probe`. No ref, branch, push, PR, merge, deployment or workflow dispatch. Existing handoffs are searched across bounded complete pagination before object writes. Existing issues are verified instead of duplicated. After a partial failure retain the logged immutable commit; never blindly retry. The original index and secured patch remain intact.

Frozen historical base is allowed **only as recovery transport**. After receipt, development must use fresh verified Stable, review the complete diff and test on the resulting integration SHA. A historical receipt never authorizes integration or bypasses the normal main/stable drift rule.

## Receiver and automation

`scripts/mid-copilot-intake.mjs` requires a current Stable checkout. It validates issue author ID/login, task binding, commit parent/tree, complete recursive source/target trees, exact changed-file inventory, modes and blob hashes/bytes. Candidate code is never checked out, imported or run. Receipt explicitly reports `qa: NOT VERIFIED`, `releaseAuthorized: false` and whether fresh integration is required.

The canonical `ci/github/workflows/mid-copilot-intake.yml` and generated mirror perform read-only receipt on issue open/reopen, manual dispatch and an hourly schedule. Token permissions are contents:read and issues:read; checkout does not persist credentials. No secrets, new scopes, bypasses, PR permissions or release actor changes. Schedule is eventual, not an immediate-delivery guarantee. This workflow can run only after regular integration publishes it on the default branch. A green receipt is transport proof only. ChatGPT/authorized integration retrieves the recorded objects, independently reviews them and creates at most a Draft; release still requires the complete existing source-first path.

This package does **not** provide remote control of an already open Copilot Chat session or access to its local filesystem. A running session must execute the sender for its bytes to reach GitHub. New repository instructions are not a push notification to existing sessions. End-to-end sender identity, actual AP1b upload, automatic workflow receipt and three real DWD runs remain NOT VERIFIED until observed. No claim that manual transfer has already been eliminated for that inaccessible session.

## Verification

Run `node scripts/test-mid-copilot-handoff.mjs`, existing Kilo handoff regression and workflow mirror validation. Negative cases cover forged ID/login, malformed/closed/PR issues, wrong task/base/tree/parents, truncated/duplicate/extra paths, modes, blob bytes/sizes and invalid source. No candidate code or external network is used in these unit tests. The normal full source/installer gates remain required and are not claimed by this package.

## Release integration v0.9.85.444

PR679 is prepared for the normal source-first release on unchanged Stable .443. All version mirrors and user/technical changelogs are synchronized. Reproducible npm ci, the focused sender/receiver/Kilo tests, version/registry/write-contract and Actions-runtime checks passed under Node 22.16.0; the production TypeScript/Vite build passed. Full independent Source/Installer gates, runtime receipt and real DWD evidence are still required. The inline AP1b patch supplied during this work is separate untrusted input and does not become part of this transport release without its own exact blob/tree review.
