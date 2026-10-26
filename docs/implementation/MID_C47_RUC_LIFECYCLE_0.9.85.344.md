# MID-C47 · v0.9.85.344 · RUC lifecycle and immutable readmission

Base: main = mid-stable = `132256654286671e9a6aa30b7183d255562fc896`, published .343. Source PR486, exact head8bbbb4b6b407edb69b4d6d1d84368f759abf18c7, Source40414274781 and Installer40416048972 passed all mandatory groups, Worker, Pages and exact Stable promotion. New source candidate; .344 is not published until its own complete release path passes.

## Cause and unchanged scientific obligations

The historical report records every GitHub job/step, timestamps and actual conclusions for cancelled runs40349487541/40384626826/40398320462 and successful40404899375/40411633451. Decode and Pages preparation together consumed about40–44 minutes in the cancelled cases; final codec checks consequently had insufficient remaining time. Configured prepare limit45 minutes and cancellation boundaries strongly indicate the job deadline. The log's `operation canceled` alone does not identify a human/API caller or prove a timeout independently.

The deceptively narrow Pages-profile step also builds totals, RADOLAN, model maps and synoptic sidecars. In2433, synoptic work alone took596 seconds;2434 spent879 seconds decoding and1013 seconds in preparation. This change separates execution and preserves every existing scientific/byte/decoder/rollback check. It does not simply increase the old45-minute limit.

## Calculation -> preparation -> publication

`calculate` checks out qualified Stable, runs the existing syntax/freshness/download tests and the unchanged qualified27-hour deterministic/EPS builder. It seals all raw object bytes/source identity and archives a non-publishable immutable core checkpoint. `prepare` independently re-verifies that exact checkpoint before running the existing native sidecars, raw rollback, full Python/JS/meteorological migration proof, codec activation and optional map/synoptic admissions. Each job retains a45-minute limit. Rerunning a failed preparation can reuse a successful calculation's artifact within retention.

The phase boundary preserves the already validated original PMSL/CLCT GRIB inputs used by optional RUC synoptic maps. Their exact files, sizes and SHAs accompany the core proof and are restored into the same run/parameter staging paths only after handoff validation. They are not published. Omitting this cache would introduce extra downloads and could reduce optional coverage under its unchanged300-second admission deadline. The handoff validator is stdlib-only and is tested with Python `-S`, because verification intentionally precedes native dependency installation in the next job.

Calculation and preparation run outside the Pages lock. Only the existing publication stage owns `mid-pages`. Fixed900MB RUC/950MB site ceilings, exact immutable data/rollback IDs, original raw rollback, productive Worker health and protected release promotion stay mandatory.

## Fully prepared snapshot reuse

After every existing qualification passes, the final snapshot receives a receipt binding the original producer repository, source/event SHAs, run/attempt, conservative source-contract fingerprint and exact manifest/inventory. The receipt alone grants no trust.

A workflow dispatch can specify `reuse_run_id` for the ORIGINAL data-producing run. This skips GRIB download, forecast recomputation and native sidecar rebuild completely. It does not create a new artificial producer. Replay runs without newly produced original artifact pairs are not reusable producer identities. `force=true` plus reuse is rejected rather than silently choosing one instruction.

The resolver authenticates the protected main-workflow producer, successful original prepare attempt and unexpired exact data/rollback artifact pair. Download checks the immutable artifact digest. Admission binds the authenticated run, attempt and event SHA, proves producer/event ancestry, checks a conservative code/data/dependency contract, rehashes every object, decodes every compressed part in Python and independently in JS, and exercises the actual meteorological record decoder. Original full migration proof, qualified28-term hourly det/EPS axes, established4-hour freshness/5-minute clock tolerance and strict unlisted-file/symlink/budget checks remain required. A newer already published RUC run cannot be replaced with an older prepared run.

Only the current checked-out Stable `dist` supplies the app shell. Data may have an older compatible producer SHA. Main/Stable version drift remains a safe no-op; the immediate pre-publish check binds the exact admitted CONSUMER SHA. A contract mismatch or insufficient provable ancestry fails closed; no fallback publishes unqualified data. Legacy artifacts lacking the new receipt are not retroactively declared authorized.

The first rollout may execute the new workflow while the old Stable lacks its validator. Capability detection intentionally leaves existing valid data intact until promotion. Normal scheduled/watchdog runs then use the newly qualified Stable code. No new paid service, external publisher or production secret was introduced.

## Diagnostics and tests

`timed_command.py` streams output, fsyncs start/finish JSONL, measures monotonic duration and reports actual exit/signal/deadline/parent interruption. It uses a separate process group with bounded TERM/KILL cleanup, including descendants holding inherited descriptors. Timing output uses stderr so captured scientific JSON stdout remains parseable. Native sidecars retain subprocess.run(check=True) and fatal native-crash semantics, with additional per-stage timings. The diagnostic job preserves authoritative GitHub timings/conclusions across all phases; a hard kill can leave only the flushed start in the job log. It does not invent cancellation causes.

The new regression executes real Python/JS migration/activation fixtures and actual git ancestry across a version-only consumer change, malicious/corrupt/stale/incompatible cases, raw checkpoint/cache integrity and stdlib-only handoff, process termination/captured JSON tests, and the actual publish guard shell scripts under matching/newer/missing versions and changed consumer SHA. Existing C21/C22 watchdog cases remain intact; only their old single-producer output/upload-boundary selectors were updated for the intentionally expanded original-producer replay contract.

All workflow shell blocks parse with bash -n. Official actionlint1.7.12 was downloaded with its authenticated release asset digest. Both baseline and candidate report the same unsupported existing `concurrency.queue: max` syntax; with only that exact known baseline limitation ignored, the candidate has no additional linter findings. The production queue property is retained, not removed. Workflow mirrors are generated only by npm run sync:github-workflows.

## Real data transport/decoder evidence

Original producer40404899375, immutable data artifact12692561194, ZIP468382280 bytes, SHA256 `b576229daf1b63954e562c6063d41390e688ae48c6eefaf3606248f69a28888d`. The downloaded ZIP matched that authenticated digest before safe extraction. Original rollback artifact12690599146 remains separate.

For run2026-10-26T20:00, manifestSHA `9d1f90a0d2ecddd48a9a38f6ab49bbc8b485a66a6bd2c8ec8d94dfec6a4adda8`: all3363 objects and3046 compressed parts passed complete Python verification in5.847 seconds; physical payload467414084 bytes. Independent JS verified all3046 parts and9138 actual record-decoder samples in33.287 seconds. Proof JSON files are adjacent. This is full real-data transport/decoder evidence, not a new source-GRIB forecast-skill qualification, deployed replay, physical-device test or retroactive producer receipt. No fabricated legacy readmission is claimed.

No expansion beyond qualified+27h, no Rapid/extreme-axis change, no EPS rounding/pruning, no data-color/symbol reinterpretation, no takeover of unqualified draft480/449/433/463.

Local final validation: all1022 core regressions passed in146.8 seconds; production build/types passed. The full1028-test Source/Installer shard partition remains mandatory. Historical source selectors were updated only for the intentional original-producer handoff contract, not to bypass any runtime assertion. Direct public endpoint reads from this environment were unavailable (HTTP403/tool access failure); publication of .343 is established by the successful protected Worker/Pages/Stable pipeline and exact matching refs. No unsupported endpoint-success claim.

Additional action-level review caught a hidden-path exclusion before merge: upload-artifact7 uses @actions/glob excludeHiddenFiles=true, which skips a literal hidden search root/file. The sealed raw directory is renamed to non-hidden ruc-core-checkpoint immediately before upload (the consumer still restores into .ruc-out), and diagnostic outputs use non-hidden ruc-timings.jsonl/ruc-workflow-timings.json. Existing data and rollback uploads already use non-hidden `ruc` as their literal search root. No broad include-hidden-files flag or repository-wide search was introduced. The regression protects these transport paths.

The first Source native-data job121914059846 failed the unchanged LIVE client freshness check. Authenticated artifact12698300224 (ZIP SHA25693dbef762012c474635fbca9ddf87aaec5cbff6cd52cbe5c2643b7053ef9cd4b) records22Z/19Z/18Z; newer21Z/20Z candidates were excluded after SSL EOF failures. The production four-hour check correctly rejected19Z/18Z at23:47Z. A TEMPORARY LOCAL historical-clock diagnosis verified all84 frames/11,131,008 cells/753 real GRIB sources and explicitly recorded19Z/18Z as ineligible at the actual wall clock. That diagnostic clock code was discarded and is NOT part of the application, source gate or publisher. The committed Source verifier is byte-identical to the baseline: it must still pass three actually eligible runs. No clock, limit, frame, hash or decoder check is relaxed. The new corrected source head requires a fresh complete gate; this first failed gate is not a release success.
