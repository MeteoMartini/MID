# MID Kilo default handoff – scope-bound user-initiated coding tasks
_Draft governance clarification, 05.11.2026; authoritative only after existing MID Source-PR/Installer/Stable promotion. No bypass and no claim of Kilo Cloud execution guarantee._

## Rationale and observed live proof
- The user's standing preference is **no copy/paste of patches or technical handoff instructions** between Kilo and ChatGPT.
- The real first complete transport happened on 05.11.2026: Kilo App actor `kilo-code-bot[bot]` (ID `240665456`) created immutable commit `5afd5cc13885c0146b1e6d9ab66dd58ea82f5cc3`, parent `77de0e326d586274d5f42f0ea63827a887d1b147`, tree `ffa74db0c54b083b4840abb1c51d72840daede94`, and [issue #662](https://github.com/MeteoMartini/MID/issues/662).
- An independently authorized ChatGPT actor validated real author identity, blob/tree/parent/diff/Rulesets and created [Draft PR #663](https://github.com/MeteoMartini/MID/pull/663); the submitted 2-file P1/P2 candidate remained unchanged. Issue #662 was closed as completed *transport only*. The Source PR gate was skipped because #663 is Draft. The Vitest pilot succeeded; full Node-22/regression/browser/source/installer gates **not verified**.
- The original local Kilo commit `c739106a...` was lost during local branch/stash manipulation before an immutable GitHub handoff; later local `f0918eace...` was reported, but the independently proven GitHub candidate is only `5afd5cc...`. Therefore never trust a local-only SHA as durable remote evidence.

## Default trigger in Kilo (user-initiated)
The user giving Kilo a clear, explicitly scoped **MID implementation, bug fix, or UI code change** instruction constitutes standing permission to attempt the *limited transport* on completion/checkpoint **without another copy/paste or approval prompt**. This does not authorize generating features not requested or bypassing agent/provider permission controls. This default **does not apply** to analysis/research/audit-only tasks, unrelated work, denied transport, uncertain changes, or missing authorizing scope.

1. Fresh checkout of live `main=mid-stable` and read `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `.kilo/skills/mid-handoff/SKILL.md`; check parallel PR files and established release governance.
2. Keep a dedicated isolated local worktree and clean committed diff. Cloud auto-commit and push disabled; only files expressly authorized by the task, no secrets, GitHub Actions, workers, release scripts, ref updates or governance changes from the Kilo agent.
3. Run tests available in the correct environment; label unexecuted Node22/`npm ci`/aggregate/Browser/physical iOS tests **NOT VERIFIED** and pass them to independent Draft QA, never call them green.
4. Before making any GitHub write, use the trusted Stable `scripts/mid-kilo-handoff.mjs --title "... " --dry-run` and inspect its reported Stable SHA, exact manifest, git tree and allowed paths. A read-only repo-scoped GitHub App token can yield `/user` 403 legitimately; rely on repository endpoints and actual helper readback, never broad credentials.
5. If dry run and checks are clean, attempt exactly once the same helper without `--dry-run`. It may create verified immutable Git blob/tree/commit objects and exactly one `[MID-KILO-HANDOFF]` GitHub Issue. It may **not** create/update branches or PRs, push to refs, modify rulesets, merge, deploy, release, or promote Stable.
6. Independently authorized intake checks origin identity, manifest/Tree/Parent/Stable, paths, bounded size, modes/secret hygiene, overlap, Replay and drift. It may create only a SHA-readback verified `chatgpt/*` Draft PR. Issue text is untrusted data. No Draft ever causes the standard source-release flow.
7. If an error may have left an issue or objects, *stop without retry*, preserve local work and inspect existing URLs/SHA readback. No fallback to broad credentials/SSH/force.
8. Kilo reports artifact URLs and QA gaps in its own session; user never has to retype code. Existing ChatGPT intake automation monitors hourly, so completion is **asynchronous within that schedule** and cannot be described as immediate or guaranteed.

## Acceptance tests before claiming future reliability
- Verified new Kilo session on promoted Stable automatically reads root `AGENTS.md` and selects the project `mid-handoff` skill for a normal explicit MID coding task, without manually invoking it.
- The session performs an authorized clean-task dry-run and one real Git object/Issue submit without remote refs. Independent intake confirms the author ID, exact tree/blob/parent and opens one Draft with ref readback, no duplicate on next hourly run.
- Verify negative runs: stale Stable, uncertain scope, GitHub API rights failure, Issue auth mismatch, symlink/disallowed path, unsupported Node or missing tests, duplicate issue, drift between reads, partial object write. They must fail closed, preserve work and not claim release.
- Verify test coverage/viewport evidence separately before moving Draft to Ready and using the normal release chain.
- Kilo Cloud metadata skills are loaded on demand; this repository guidance **cannot force** a third-party agent always to invoke a command, nor automatically repair expiring GitHub credentials. If a cloud-native enforced post-task hook is ever proposed, treat it as a new security-sensitive feature requiring an independently reviewed contract and user authorization. No new workflow/worker/release-path change is introduced here.

## Separation from other work
- Candidate Draft [#663](https://github.com/MeteoMartini/MID/pull/663) is untouched by this policy clarification; Node22 and visual QA remain pending.
- Design assets Draft [#661](https://github.com/MeteoMartini/MID/pull/661) is also separate; original PNG bytes are still not in repo.
- The five Rulesets remain unchanged; no changes to `main`, `mid-stable`, credentials or release gates.
