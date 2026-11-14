# MID – ChatGPT / GitHub write contract

## Purpose
This contract makes AI-assisted MID changes durable in GitHub without bypassing the fail-closed source, release, security, and stable-promotion process. GitHub is the source of truth; `mid-stable` is the released codebase after successful promotion.

## Roles and write boundaries
- Before every change, read and compare current `main`, `mid-stable`, the MID version, and the applicable contracts.
- Continue only from a verified current base. If provenance, SHA lineage, or permissions are unclear, stop fail-closed.
- ChatGPT/Codex integration work uses short-lived `chatgpt/v<version>-<topic>` or `codex/v<version>-<topic>` branches created from the verified current `mid-stable`.
- Never write directly to `main` or `mid-stable` from an agent branch.
- Replit is an unprivileged UI/UX design workbench. It may hand off only through `replit/*` and may not change governance, release, Worker, native iOS, version, central build/deploy, `main`, `mid-stable`, `chatgpt/*`, or `codex/*`.
- Existing rulesets, least-privilege permissions, signed contracts, release gates, and secrets must not be weakened to make a change pass.

## Normal source-first agent release
1. Check open PRs/relevant branches for overlapping work, then develop and test from the verified current `mid-stable` on an authorized `chatgpt/v<version>-<topic>` or `codex/v<version>-<topic>` branch.
2. Open a non-draft source pull request against `main`.
3. Do **not** commit or transport `MID-professional-replacement.zip` in the normal agent pull request.
4. The `MID ChatGPT/Codex Source-PR Gate` validates repository structure, lockfile/dependency integrity, production dependencies, production build, full regressions, the shared Web/iOS shell, and server-side packaging readiness.
5. Only after the required source gate is green may the established SHA-bound release automation perform the controlled merge.
6. GitHub Actions creates the canonical unversioned `MID-professional-replacement.zip` server-side from the merged `main` source.
7. `install-mid.yml` remains the release authority for re-verification, Installer processing, Worker/Pages decisions where affected, deployment checks, and fast-forward promotion to `mid-stable`.
8. No force update and no manual direct stable promotion. The browser/manual ZIP path is only the documented emergency fallback.

## Draft, Review und tatsächlicher Eintritt in das Source-Gate (Präzisierung 08.11.2026)

- **Draft ist Staging, nicht Freigabe.** Nach SHA-/Stable-/Vertrags-/Parallel-PR-Prüfung und fachlicher Draft-Vorqualifikation die konkrete autorisierte Integrations-PR von Draft auf `Ready for review` setzen, sobald keine belegten Blocker vorliegen. Erst dieses Ereignis startet das **volle** `MID ChatGPT/Codex Source-PR Gate`; dessen grünes Ergebnis kann logisch nicht Voraussetzung sein, bereits zuvor Draft zu verlassen. Das Gate darf weder deaktiviert noch durch grüne Draft-Tests ersetzt werden.
- **Keine künstlich erfundene Approval-Pflicht:** `.github/CODEOWNERS` allein beweist keine erzwungene unabhängige Review; nur aktuell einschlägige Rulesets/Branchschutz- und verbindliche Review-Verträge entscheiden darüber. Bei echten Review-Vorgaben sind diese vollständig zu erfüllen – niemals Selbstfreigabe, Fake-Approval oder Admin-Bypass. Auch nicht-formal blockierende, fachlich berechtigte Reviewbefunde werden überprüft und gegebenenfalls behoben. Historisch waren die erfolgreichen PRs #679/#682 ohne formale GitHub-Review; das kann spätere Schutzregeln nicht aufheben.
- **Source-Gate und automatische Releaseinstanz bleiben unverändert:** Der aggregierte `Agent-Quellstand vollständig prüfen` muss auf dem exakten HEAD mit allen tatsächlich erforderlichen Jobs SUCCESS liefern. Nur danach darf `MID Agent Source Release` automatisch den HEAD-gebundenen Bot-Merge, serverseitiges ZIP und `install-mid.yml` auslösen. PR Completion koordiniert Prüfung/Reparatur, nicht eigenständiges Mergen. Installer-/Worker-/Pages-/Stable-Gates folgen vollständig und unabhängig.
- **SLO und Product-Scope unterscheiden:** RUC-P1-168h/P95-Messpflicht bleibt separater, nicht als PASS ausgegebener Betriebsnachweis und ist nicht allein als pauschale siebentägige Wartefrist für jeden App-Release zu interpretieren. Fehlende native Originaldaten-/Feld-/Cloudflare-/Clientbelege und relevante tatsächliche Releasegates werden dadurch **nicht** ausgenommen.
- **Zeitnahe Statusdokumentation:** GitHub-Live-SHAs, PR-HEAD, Run-IDs, Reviewer-/Jobstatus, echte Blocker, Merge-/Installer-/Worker-/Pages-/Stable-Ergebnis getrennt protokollieren. Bei Drift, fehlender Genehmigung oder fehlgeschlagenem obligatorischen Job fail-closed. Ausführlicher Ablauf und 08.11.2026-Referenz: `docs/implementation/MID_CANONICAL_RELEASE_ENTRY_2026_11_08.md`.

## Failure handling
- Deterministic code, type, build, regression, dependency/security, provenance, or unknown failures block release.
- A failing product regression is fixed in production code.
- A regression test may change only when the product contract intentionally changes and the replacement assertion preserves at least the same protection.
- Temporary infrastructure failures may be retried only under the existing bounded self-heal rules.
- Never weaken a gate, ruleset, host verification, or credential boundary as a workaround.

## Replit handoff integration
- Replit work is accepted only from a verified `replit/*` remote ref whose base SHA, head SHA, changed paths, tests, responsive checks, and read-only Replit Handoff Gate are verified.
- ChatGPT reviews diff and provenance before selectively integrating the approved UI changes into an authorized `chatgpt/*` or `codex/*` branch.
- A green Replit Handoff Gate is necessary but not sufficient for release; source integration must still pass the normal Source-PR and release gates.

## Permissions
- Read-only validation workflows remain read-only unless the specific established release workflow requires more.
- Release/deploy permissions remain confined to the established MID release actors and workflows.
- Trusted-agent branch bypasses are limited to explicitly identified authorized actors. Replit receives no bypass for `chatgpt/*`, `codex/*`, `main`, or `mid-stable`.

## Workflow and governance synchronization
- Canonical GitHub workflow sources live under `ci/github/workflows/`; mirrors under `.github/workflows/` are synchronized only as an explicit trusted repository-maintenance change.
- Persistent governance changes use an authorized trusted-agent integration branch and the normal source review path.
- Replit may not modify or weaken governance contracts or workflow policy.

## Release performance without weaker gates (v0.9.85.168)
- The Source-PR Gate and Installer continue to execute the complete MID verification path; no regression, dependency/security check, iOS-shell check, Worker smoke, Pages gate, or Stable SHA verification may be skipped for speed.
- Regression execution may parallelize only tests conservatively classified as read-only. Any test or recursively imported local helper that writes files, launches child processes/browser automation, opens servers/listeners, performs fetches, mutates process-global state, or cannot be classified safely remains serial. The execution plan must be a lossless one-to-one partition of the complete discovered regression inventory.
- Git checkouts use shallow snapshots where history is not part of the proof. If the Installer detects that `main` advanced during the long verification window, it must fetch full history before applying the existing race/ancestry check; uncertainty remains fail-closed.
- A Pages artifact may be prepared and uploaded in parallel with the Worker gate because this does not publish it. The actual GitHub Pages deployment remains blocked until the Worker job succeeds.
- Stable promotion may use the GitHub Compare/Refs API instead of downloading repository history, but only after exact Release-SHA verification, an explicit ancestor/fast-forward proof, a non-force ref update (`force=false`), and exact post-update SHA verification.
- The separate Source-Gate and Installer verification stages remain in place. Replacing the second full verification with attestations is a distinct future governance change and is not authorized by this optimization.

## Isolated Source-Gate regression shards (v0.9.85.171)
- Full Source-PR regression coverage may be distributed across isolated GitHub jobs only when a versioned shard manifest proves that the automatically discovered regression inventory is a lossless one-to-one partition.
- Heavy browser/map regressions run on the same pull-request merge SHA as the core gate, in separate workspaces with independent dependency installation and production builds. A test may not appear in more than one shard.
- The established required check name `Agent-Quellstand vollständig prüfen` remains a final fail-closed aggregator. It must not succeed unless the core result and the complete heavy matrix result are both `success`.
- Matrix `fail-fast` remains disabled so one failing heavy shard cannot hide the result of another shard.
- This optimization applies only to the Source-PR Gate in v0.9.85.171. The Installer continues its complete independent verification until a separately versioned and proven equivalent installer-sharding or attestation contract is approved.


## Isolated Installer Core shards (v0.9.85.376)

- The Installer independently executes **all** regressions again; no prior Source-Gate result, cache flag, diagnostic report or artifact attestation authorizes skipping a required test.
- The complete Installer Core inventory may run as four isolated `core-1/4` through `core-4/4` jobs only with the same lossless one-to-one partition already enforced for Source-Core. Each job independently installs dependencies, builds, verifies the exact event-bound immutable release snapshot, manifest, archive digest and all file hashes, then executes its assigned tests.
- The separate `verify_core` job retains production build, dependency audit, Worker syntax and iOS copy/version checks. All six Heavy jobs, existing Worker/RUC/Pages checks and Stable promotion requirements remain mandatory.
- `install_build` requires `prepare_release`, `verify_core`, the **entire** `verify_core_shards` matrix and the **entire** `verify_heavy` matrix to report success. Failed, cancelled, skipped, partial or unknown mandatory results cannot authorize install, deployment or promotion. `fail-fast: false` preserves independent evidence for each matrix member.
- All verification jobs remain read-only, with no deployment secrets or increased token privileges. Timing artifact namespaces must be distinct per run/attempt/shard.
- Release-train preflight is advisory only. Explicit `candidateMode: draft-planning` may inventory authorized same-repository Draft candidates without changing their state. It always reports `releaseAuthorized: false`; it never merges or executes candidate code. Before integration, revalidate exact heads, live Main/Stable, complete inventories (including rename sources) and conflicts. The combined new version must pass the full independent Source-Gate and Installer again.
- A live runtime improvement is established only by real complete release evidence. Future cross-gate build/test reuse remains a separate unapproved change requiring independently verified attestation, equivalence, negative cases and A/B qualification (#526).


## Build parity qualification and release diagnostics (v0.9.85.377)

- Independent diagnostic builds have only contents:read, exact source checkout and the same qualified build variables/toolchain. They install and build separately, compare complete output bytes and input fingerprints, and never grant artifact reuse, regression credit or release authorization. Unsigned manifests are not attestations. The existing web-build identity contains an actual build timestamp: its source/asset inventory must be independently validated; full byte equality and additional payload equality must be separate explicit outcomes. No differing execution metadata may be described as a byte-identical complete artifact. All Source and Installer regressions remain independently mandatory.
- The diagnostic comparator requires both independent builds, exact same-run/attempt artifact names and enforced artifact digests. Different source/tree/lockfile/toolchain/environment/image, missing/duplicate/unsafe files or source mutations block equivalence. No deployment credentials or attestation write permissions are introduced.
- Timing is observational: earlier attempts, actual cancelled work, waiting gaps and missing data remain visible. Retained successful executions must not be counted twice. Changed API observations must fail closed. Runner seconds are not billed minutes. Automatic post-installer reports are never release gates or permission to retry a release.
- The source release bot serializes requests using queue:max and cancel-in-progress:false. The queue has GitHub's documented limit of 100 pending requests and gives no dispatch-order or release entitlement guarantee. Each request still undergoes the existing exact-head eligibility checks. The Installer's separately namespaced release-supersession policy and all Main-race/Stable/freshness gates remain unchanged.
- Productive cross-gate artifact reuse still requires independently verified attestation, all adversarial equivalence tests and real A/B acceptance under #526. A pair of byte-identical builds alone does not satisfy that contract.

- Source Node setup explicitly disables optional remote npm package caching after a measured account-egress stall. Reproducible npm ci, exact Node/action/lockfile, registry integrity, Python and all mandatory independent gates are unchanged. A cache availability issue cannot justify skipping installation, audits, builds or tests; Installer caching remains separately qualified.


## MID code-quality tooling: normative PR and release evidence (14.11.2026, v0.9.85.477 QA)

This section belongs to the existing registered MID_CHATGPT_GITHUB_CONTRACT.md. It creates no new workflow, required GitHub status, App permission, secret, subscription, auto-merge, release entitlement or versioned application build. Live SHA-bound source plus actual tool-run artifacts establish operation; a name, old QA draft or successful parent job alone does not.

### Checked tools and boundaries
- **Existing required MID gates:** the full source PR, independent Core/Heavy, meteorological and dependency checks, TypeScript/build, secure server ZIP, independent Installer, affected Worker/Pages and Stable promotion remain required without substitution. CodeQL JavaScript/TypeScript is operational in both mirrored mid-code-revision.yml workflows. Its init/analyze actions must be pinned to the same full immutable commit SHA (v4.39.3 on this source). CodeQL success does not imply that a release is approved.
- **Optional P1 PR scanners:** actionlint v1.7.12 (workflow syntax/shell), zizmor v1.32.0 (Actions security) and Biome v2.6.7 (scoped source lint) run in mirrored unit-coverage.yml workflows on pull_request events with chatgpt/* or codex/* head names. This optional step currently checks the branch name but not head.repo.full_name; fork-origin scanner results must be treated as untrusted and never authorize a Source Gate or release. The bootstrap verifies complete SHA-256 digests of exact versioned binary assets; the scanners execute read-only with GitHub tokens removed, no auto-fix or secret access. Biome does not yet cover the full repository.
- **Optional P1 accessibility:** @axe-core/playwright v4.14.0 runs in the existing mid-code-revision.yml browser job only if its prerequisites are available. The diagnostic npm package install is version-specific; do not claim a binary digest lock equivalent to the SHA-256 scanner bootstrap. Browser simulation does not replace real iOS, VoiceOver or WCAG 2.2 AA acceptance.
- **External advisory review:** Cubic (including optional AutoFix), PR Completion, and other AI reviewers may provide independently triaged findings, but cannot merge, change protection, or substitute for the MID Source/Installer/Stable path. fast-check was QA-piloted in #760 but is not thereby a required production gate. Semgrep, Stryker, Sonar/SonarQube and any paid service are not authorized or asserted operational by this contract.

### Evidence and non-bypass rules
1. The P1 steps use continue-on-error: true and are **not** newly required status checks. Read their actual artifact, exit codes and complete tool/scan outcomes. PILOT_PASS, PILOT_FINDINGS_OR_FAILURE, SCANNER_BOOTSTRAP_ERROR, missing evidence, skipped and partial coverage are distinct. An overall green workflow must never silently relabel non-green diagnostics as PASS.
2. For every finding or tool error, record exact source SHA, path inventory, tool/version and SHA-256 or action commit pin, run/job/artifact, actual outcome, severity, whether data are complete and the independent disposition. Do not mark an old run or a three-file Biome sample as whole-repository verification.
3. Unresolved material P0/P1 and meteorological/security-critical P2, native unresolved review threads, and active CHANGES_REQUESTED require independent disposition before release regardless of optional diagnostic success. Known false positives and duplicates need concrete SHA/path/rule evidence; no blanket suppression, disabling sound regressions or infinite AutoFix loops. Scanner findings are not by themselves a new required GitHub status.
4. Both canonical ci/github/workflows/ and installed .github/workflows/ managed mirrors must remain byte-identical. The non-mutating contract regression must catch removed scanners, missing artifact capture, lost read-only/optional gates, missing token scrubbing, asset hash pin loss and mismatched CodeQL pins. No scanner may edit workflows during a PR check.
5. If main and mid-stable diverge, overlapping authorship or provenance is uncertain, or current protections cannot be established, halt all source and release writes. A future integration must use the established version-bumped Source-PR Gate -> controlled SHA merge -> server ZIP -> Installer -> affected Worker/Pages -> Stable process.

Relevant source: tools/ci/mid-p1-tool-bootstrap.mjs, tools/ci/mid-workflow-quality-pilot.mjs, tests/smoke/mid-axe-p1-audit.spec.mjs, tests/unit/mid-code-quality-contract.test.ts. This QA-only contract does not declare any new application release.
