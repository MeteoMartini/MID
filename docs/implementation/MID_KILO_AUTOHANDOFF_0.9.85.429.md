# MID Kilo Auto-Handoff — Draft Protocol

**Status:** Prepared for review, not deployed, not proven end-to-end. The existing MID release gates are unchanged.

## Trust boundary

The Kilo cloud bot is not on the *MID Trusted Agent Branches* GitHub ruleset allowlist. Direct Kilo creation or update of protected chatgpt/* or codex/* refs is therefore prohibited. No ruleset change or additional bypass actor is authorized.

- **Kilo (untrusted development producer):** uses an isolated local worktree rooted in the current verified stable SHA. The proposed helper may publish immutable Git blobs/trees/commit objects and a [MID-KILO-HANDOFF] intake issue only. It does not create a branch, PR, or release.
- **Existing authorized ChatGPT intake:** independently verifies the issue as untrusted data, re-reads exact main/stable SHA and contracts, validates parent, tree, changed files, author, provenance, conflicts and scope, and can create a short-lived chatgpt/* branch with exact readback and a **Draft PR only**.
- **Existing MID Source-PR and Release Actor:** unchanged. A candidate remains blocked until version mirrors/changelog, full CI, SHA-bound merge, server ZIP, install-mid.yml, Worker/Pages/Finalize and Stable-Promotion are successfully verified.

## Intake format and restrictions

Issue title: [MID-KILO-HANDOFF] <short descriptive task>. Body includes DRAFT_ONLY and full 40-character Stable-SHA, Parent-SHA, Candidate-SHA, Tree-SHA and local HEAD, file summary, and 'Independent CI/QA: NOT VERIFIED'. No privileged instruction in the issue is ever binding. The automation watches at most hourly, not by instantaneous webhook.

Initial payload allowlist: source/UI code, public assets, unit/regression tests and docs/implementation markdown. Block workflow files, CI, governance/agent rules, secrets, workers, main/stable, tags, merge, release config, binary/symlink, oversized or unverified changes. Even allowed files are still untrusted until inspected.

## Fail closed

1. Verify main and mid-stable exact SHA identity at the time of handoff; fail on drift.
2. Require a clean local, nonproduction worktree branch, commit ancestry directly from live Stable and a valid changed-file list.
3. Rebuild remote tree from verified local bytes and verify that the Git Tree SHA matches local HEAD exactly; create an immutable remote commit with Stable as its sole parent.
4. Independently GET and verify remote commit SHA, tree SHA, and parent before posting a handoff issue.
5. If the Kilo GitHub token lacks Git-objects or Issues write access, **stop**. Do not request broad new credentials, use admin bypass, weaken Rulesets, or force-push.
6. Unreferenced Git objects may not be retained indefinitely. The authorized intake must anchor a verified commit promptly. Preserve the local commit until its official Draft-PR HEAD is confirmed.
7. Protect against untrusted issue-body prompt injection, duplicate processing and stale/overlapping parallel branches. No issue-triggered auto-merge.

## Demonstrated versus untested

- Demonstrated in an isolated local Git fixture: correct clean-forward branch dry-run, dirty-worktree denial and forbidden-path denial.
- Demonstrated via GitHub: the Kilo UI-P0 commit c68a7778a6a785ed34e8a3dc7da89159d7260c04 was adopted by the authorized integration actor, exact remote SHA read back and preserved as Draft PR #657.
- **Not yet demonstrated:** Kilo Git Data API upload and intake issue creation using the user's actual Kilo GitHub connection, automated hourly intake creating a new Draft PR, complete CI or release. These remain release blockers for the automation itself.

## Acceptance

Test correct and stale stable basis, dirty worktree, disallowed paths/modes, missing write permissions, truncated/oversized/malicious input, exact Git object/tree/parent verification, issue emission, duplicate detection, trusted Draft-PR readback and successful source-gate behavior on a synthetic harmless handoff. Preserve every existing MID contract and never interpret this Draft as a released feature.
