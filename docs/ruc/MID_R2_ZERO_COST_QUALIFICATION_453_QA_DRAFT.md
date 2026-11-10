# WE RUC 1.9 — Cloudflare R2 zero-extra-cost qualification (QA-only, NO DEPLOY)

Verified starting released source: MID **v0.9.85.453**, \`main=mid-stable=ba4901932c33e584167c31c310fb11601e77b6df\` at branch creation, 2026-11-10. This draft does NOT change production publisher, Worker, data codec, DWD fetch, Pages, R2 bindings, secrets, release workflow, or version. Owner issue: #541. Existing RUC QA drafts #727 and #732 are separate; no overlap.

## External cost and capability contract

Official Cloudflare docs (checked 2026-11-10):
- https://developers.cloudflare.com/r2/pricing/ — Standard: 10 GB-month, 1M Class-A and 10M Class-B free per account/month. UploadPart, CreateMultipartUpload and CompleteMultipartUpload are Class A. Deletes are free. Infrequent Access has **no free tier**.
- https://developers.cloudflare.com/r2/objects/upload-objects/ — large object uploads may use multipart uploads, not one operation per object.
- https://developers.cloudflare.com/workers/platform/limits/ — Workers Free: 100,000 requests/day *per account*, 10 ms CPU, 50 subrequests/request.
- https://developers.cloudflare.com/billing/manage/budget-alerts/ — alerts are **informational, never a hard cap**. A paid domain does not extend R2 quotas.

The user requires **no extra costs**. R2 is **not subscribed/activated** according to supplied 2026-11-10 Cloudflare dashboard screenshot. Do not set \`MID_RUC_COST_APPROVED\`, enable \`MID_RUC_CLOUDFLARE_BOOTSTRAP_ENABLED\`, create a bucket, configure secrets, bind a Worker, dispatch a publisher, or merge/release based on this QA. Existing Free GitHub Pages/Best Match must continue unchanged.

## Evidence and current blockers

Authentic 2026-11-09 14Z Pages producer run #42641878671 reported **3,408 objects / 586,920,708 B** RUC physical source bytes and **600,058,143 B** complete Pages site. That Pages inventory excludes the original native EPS20 member cubes used by the old R2 contract, and therefore is **not** a full R2 per-run size.

Historical \`tools/ruc/publish_ruc_r2.sh\` is NOT suitable for unmodified deployment:
1. Its regex \`[0-9A-Za-z_-]+\` rejects the current ISO model cycle \`2026-11-09T14:00\`.
2. It accepts a remote object with identical byte count even when the SHA differs.
3. It overwrites the global \`latest.json\` by unconditional \`aws s3 cp\` without compare-and-swap against concurrent writers.
4. It handles only four old flat files and does not prove today's 27h/full-codec/map-native/EPS20 interoperability.

The isolated tools \`tools/ruc/ruc_r2_zero_cost_qa.py\` and \`tools/ruc/test_ruc_r2_zero_cost_qa.py\` **do not correct or activate any of those problems**. They only check local offline *measured* object bytes/SHA, declared provenance, 28 timepoints, EPS20 coverage, quota projections and missing measurements. They never read secrets or contact network/services. A declared original source proof SHA is required as a reference, but is not independently verified by this tool: separate trusted DWD provenance and consumer readbacks remain mandatory.

Use an inventory JSON with:
- \`schema="mid.ruc.r2.offline-inventory.v1"\`
- \`stableSha\` exact full 40-char SHA
- \`run\` ISO minute UTC, e.g. \`2026-11-10T02:00\`
- \`horizonHours=27\`, \`timeCount=28\`, \`epsMemberCount=20\`, \`nativeEpsMemberObjectsIncluded=true\`
- \`originalSourceProofSha256\` of separately authenticated DWD producer receipt
- \`objects\`: local relative \`key\`, measured \`bytes\`, actual file \`sha256\` for **all** R2 payloads, including native EPS20 member files.

Example offline-only command, only after a trusted full object pack exists locally:

\`\`\`bash
python3 tools/ruc/test_ruc_r2_zero_cost_qa.py
python3 tools/ruc/ruc_r2_zero_cost_qa.py \
  --inventory /path/to/read-only/offline/inventory.json \
  --object-root /path/to/read-only/offline/objects \
  --projected-monthly-reads 100000 \
  --projected-worker-requests-day 1000
\`\`\`

Internal conservative planning envelopes: 5,000,000,000 B peak storage, 250,000 Class-A and 2,000,000 Class-B operations/month, 50,000 Workers requests/day. **They are not Cloudflare account quotas** and cannot reserve capacity. Projection assumes 744 model cycles/month, two upload attempts/cycle, four retained plus two staging copies, at least 10 additional Class-A operations/cycle and multipart upload accounting; future production verification must consider actual account-wide concurrent usage, lifecycle, failures and retry storms.

**Terminal conclusion is ALWAYS \`productionApproved=false\` and \`activationAuthorized=false\`** even if measured projections are under ceilings, because Cloudflare R2 has no verified binding zero-dollar invoice stop. A CLI exit code zero means only that the offline inventory was processed successfully. Fixture tests are synthetic, not a full original DWD 27h/EPS20 QA or a live R2 load test.

## Next unblocked work

Prepare a modern lossless, SHA-checked **offline** full-27h/EPS20 object pack from one authenticated DWD original artifact. Run this probe on actual bytes, check Worker lookup/ranges/time/missing parity with existing Pages and current RUC QA. Do not merge or enable R2 before separate release/QA and **explicit cost-risk decision**. Do not duplicate the existing 168h watcher (which is not a blanket release wait).


## Authentic DWD 27h/EPS20 lossless offline byte proof (10.11.2026)

This is **not** a deployed R2 transport, and not a current-.453 producer re-run. It is a byte-verified,
source-SHA-pinned original artifact from the successful previous Stable .451 model-cycle.
The existing 0-USD and meteorological/release gates remain fully binding.

- Exact previous Stable producer: `d8852f672a40d26348d214dc85e9a3a1b9d79c1f`,
  DWD `2026-11-09T14:00`, historical producer
  [#42641878671](https://github.com/MeteoMartini/MID/actions/runs/42641878671),
  GitHub artifact ID `13686254117`, authenticated archive SHA256
  `5a2275e4d75497c08e400b6e6b899254def2330a1b22472fe676d2cf112efe43`.
- Independent pinned offline QA
  [#42778833523](https://github.com/MeteoMartini/MID/actions/runs/42778833523)
  `completed/success` on PR #738 head `5ce76a0f140f4cd7f8e5d1d8173b3bbf69ef944d`.
  GitHub-native artifact download (digest mismatch => error), original model
  and source-GRIB/EPS20 metadata, 12/12 original SHA checks,
  27+1 hourly frames, 542,040 native cells, 20 EPS members.
- Measured **12 source objects 1,999,624,596 bytes**; same objects losslessly
  compressed into independently range-decodable zlib chunks under **12 immutable
  compressed files**, plus the exact original metadata and a verified range index:
  **14 physical offline objects = 667,095,029 bytes** (ratio **0.333610**,
  **66.639% storage reduction**). All original uint16 NoData sentinel bytes,
  real zero, values and original native time/member layout remain byte-exact
  by full independent decompression of every chunk and whole-object SHA equality.
- The range index has **1,913 independently decompressible chunks** (normally ~1 MiB
  aligned to native point-record size); they are packed within 12 objects, **not**
  1,913 individually billed R2 objects. Range metadata is verified but a real Worker
  `bucket.get(range)` / `DecompressionStream('deflate')` integration remains **untested**.
- Conservative storage peak 4 retained + 2 staging = **4,002,570,174 B**,
  below internal 5,000,000,000-B ceiling (not an R2 billing guarantee).
  Multipart planning at 744 runs/month, two upload attempts and ten other
  Class-A operations/run: **174,096 Class-A/month**, below internal 250,000.
  This is a projected worst-case formula, **not** a metered R2 observation.
- Small proof artifact only (no weather payloads uploaded by this QA):
  `mid-ruc-r2-offline-byte-qa-42778833523-1`, ID `13745730614`,
  archive digest `sha256:9a296fb20d1e8fa305049a5b621e3717393e853df1719388d65bd1c434793f99`.
  Read-only proof files: `report.json`, `inventory.json`, `range-index.json`.
- GitHub fixture tests: prior cost preflight **12/12 PASS**, new range-pack /
  same-size tampering / native 28h EPS20 / original bytes / NoData / UTC /
  symlink / output-clobber **12/12 PASS** in original workflow.

**Still BLOCKED:** Original GitHub artifact was from .451 rather than current .453;
the complete current Pages maps/optional sidecars, Worker CPU/memory/range
and point-read parity, Class-B and full account-wide Worker request usage remain
unmeasured. Also, Cloudflare R2 has no independently verified hard `$0`
invoice cap: budget alerts cannot prevent metered charges. Even under every
measured technical budget, `productionApproved=false` and
`r2ActivationAuthorized=false`. No subscription, credentials, bucket,
binding, public domain, publisher, dispatch, merge, release or Stable promotion.

**Next meaningful QA:** a purely in-process Node/Python consumer for range
retrieval and decoding, then real Cloudflare Worker Free CPU/subrequest
benchmarks **only if they can be done without activating metered R2**.
No compromise to MID/P2–P5 scientific or release contracts.


## Genuine original-DWD Worker-compatible range comparison (128 KiB)

A second **read-only authentic-artifact** run completed successfully:
[Actions #42780229524](https://github.com/MeteoMartini/MID/actions/runs/42780229524),
exact PR source SHA `16bf1cb8a5266288fb20f9f6ce70cbcec4a10e3a`,
same original DWD `2026-11-09T14:00` / producer SHA
`d8852f672a40d26348d214dc85e9a3a1b9d79c1f`.
The workflow mirrors under `ci/github/workflows` and `.github/workflows`
have identical Git blob `4740277de7cc0e65f021b5b338844fdccc35c672`.

| Original DWD SHA-verified measurement | 1 MiB independent chunks | 128 KiB independent chunks |
| --- | ---: | ---: |
| Original 12 wire product bytes | 1,999,624,596 B | 1,999,624,596 B |
| 14 packed objects (12 files + 2 metadata) | 667,095,029 B | **672,790,506 B** |
| Six same-size retained+staging run copies | 4,002,570,174 B | **4,036,743,036 B** |
| Projected Class A (744 cycles × 2 attempts) | 174,096/month | **175,584/month** |
| Independent compressed range chunks | 1,913 | **15,268** |
| Index JSON | 403,113 B | **3,157,750 B** |
| 7 cells × 10 native products: compressed bytes fetched | 6,997,555 B | **842,924 B** |
| Same offline Node decoder 70 point records: process CPU | 434,665 µs | **90,457 µs** |
| After full Python decode & SHA and Node point parity | PASS | **PASS** |

The 128-KiB variant costs **5,695,477 B** additional physical storage per run
(+0.85%) but reduces the sampled Node process CPU by **79.2%** and sampled
compressed transport by **88.0%**. It remains well inside the internal 5-GB
six-run planning envelope. The returned 70 native binary point records match
the genuine original files exactly. No precipitation, missing-data, actual
zero, member index, spatial offset, scaling, or valid-time conversion occurs.

**Critical remaining CPU limit:** Node `DecompressionStream('deflate')` is
Web-API-compatible, not a real Cloudflare Workers Free budget test. For the
seven sampled native cells, mean *primary deterministic+EPS-summary* Node CPU
was **4,646 µs/cell**, but the **maximum 17,600 µs** exceeded the theoretical
Workers Free 10-ms request budget; the all-ten-product maximum was
**28,894 µs**. Node CPU additionally measures file/crypto QA overhead, so
this is not a proof that real Workers either pass or fail. A real Cloudflare
Worker integration, explicit CPU/subrequest/cache/key-lookup budget and
bounded-client request mix are separately mandatory. One full-cell mock
point required 10 R2 ranges; seven cells generated 70 ranges total.
Index size also grows to 3.16 MB and must be cached/bounded by run.

**Account and production holds:** Neither free-tier Class-B throughput nor
Worker traffic nor complete Pages map/synoptic sidecars have been measured.
No durable hard `$0` R2 invoice cap has been shown. Therefore all code remains
QA-only and `productionApproved=false`, `r2ActivationAuthorized=false`.
Do not activate R2 or change Pages/Worker/Secrets/DNS/Rulesets/MID release.


## Class-B 31-day no-cache cost readback (10 Nov 2026; QA-only)

The authentic `2026-11-09T14:00` offline consumer trace from
[original range QA #42780229524](https://github.com/MeteoMartini/MID/actions/runs/42780229524)
contains 7 native-grid cells × 10 separate product range reads,
`checkedNativeProductRecords=70`, `maxR2ReadsForOneCell=10`,
`allPointBytesMatchOriginal=true`, and full source SHA
`d8852f672a40d26348d214dc85e9a3a1b9d79c1f`.
It remains a **mock R2 read trace, not real user/Worker metering**.

A new standalone `project_class_b_from_consumer` QA function only accepts
the exact run/SHA-matching byte-parity trace and forecasts a conservative
**10 native-range GETs + 2 uncached metadata GETs** per complete point request,
**31 calendar days** per month, and **no speculative cache hits**.
Its result is fed through the existing fail-closed Class-B and Workers
planning ceilings; request demand MUST be supplied externally, and
unknown real account usage and billable R2 activation stay blocked.

| Hypothetical full-point forecasts/day | Class B operations / 31 days | MID 2M internal ceiling |
|---:|---:|---|
| 1,000 | 372,000 | within (not production approval) |
| 5,000 | 1,860,000 | within (not production approval) |
| 5,376 | 1,999,872 | upper mathematical limit, **no headroom** |
| 6,000 | 2,232,000 | **BLOCKED** |
| 10,000 | 3,720,000 | **BLOCKED** |
| 50,000 | 18,600,000 | **BLOCKED**, also >10M official R2 free Class B |

Even under Cloudflare's published 10M/month Class-B free allowance, the
above no-cache mix would reach that threshold at about 26,881 full-point
requests/day, **before** all other Cloudflare account usage. The 50k/day
Worker Free planning ceiling is NOT a safe R2 Class-B load allowance.
[Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/).

Exact prior source bytes, original ZIP, range-index and consumer reports
were read from the SHA-identified GitHub QA artifact; no new DWD download,
Worker deployment, R2 setup, cache assumption or Cloudflare billing
operation was made during this cost-only follow-up.
Four new negative/threshold Python unit cases also cover source-run drift,
false parity, malformed samples, negative demand and forbidding assumed
metadata-cache savings. They are committed to the existing PR and require
the normal exact-head CI/review; no extra 763-MB workflow is dispatched.

**FAIL-CLOSED:** This is a sizing/rejection preflight, never a metered-service
authorization. `productionApproved=false`,
`r2ActivationAuthorized=false`, and `MID_RUC_COST_APPROVED` remains
unmodified. Neither a cache or 50k/day Worker request ceiling nor
Cloudflare billing alerts can guarantee a hard `$0` invoice. Thus R2
remains OFF; existing Pages-based RUC and model fallback remain untouched.


## Alternative: Workers Free SQLite Durable Objects (fail-on-limit, no R2)

**Official 2026 docs and distinctions (read-only, no account activation):**
- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/):
  **Workers Free** allows SQLite-backed DOs; if a free-tier quota is exhausted,
  subsequent operations of that type **fail** instead of automatically
  consuming billable paid resources. This differs materially from metered R2.
- [DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
  and [DO FAQ](https://developers.cloudflare.com/durable-objects/reference/faq/):
  account-wide SQLite DO storage **5 GB**, *per Free durable object* **1 GB**
  (`SQLITE_FULL` on exceeding; reads and deletes remain available),
  maximum BLOB **8 MB** in current docs, up to 100,000 DO requests/day,
  100,000 rows written/day and 5 million rows read/day. Workers Free still
  has a 100k/day request quota and an outer Worker 10-ms CPU limit.
  These are **account-shared Free-plan restrictions**, not reservations.
- [SQLite-backed DO Storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/):
  transactionSync() is available for a single SQLite-backed DO; this does
  **not** create a transaction spanning several independent Durable Objects.

**Proposed, NOT deployed layout:**
- One *immutable run object* per native DWD run, to keep each ~673 MB source
  below the Free 1GB per-DO limit. Each independent zlib chunk is preserved;
  pack contiguous compressed chunks into SQL BLOB segments **up to 4,000,000
  bytes** to stay comfortably below 8 MB per BLOB, without recompression.
- One tiny *coordinator DO* holds monotonic last-good `run + generation`.
  Stage only **one** candidate at a time via authenticated GitHub source
  grant and shared writer lease. Verify **all** immutable payload bytes,
  native UTC/time, EPS20, SHA and Worker readback before an authorized
  transaction switches the coordinator pointer. Stale writers lose.
  Cleanup must never delete an active or referenced last-good run.
- On `SQLITE_FULL`, a free-quota denial or any dependency failure:
  **do not advance the pointer**; keep the old 27h source/fallback. This
  must be verified in a real Cloudflare Free runtime before adoption.
- No 168-hour release wait is required; the separate P1–P5 core,
  origin-to-client, Fast Lane and native device gates remain open.

**Actual byte-inventory arithmetic** using the original 09 Nov 14Z
27h/EPS20 lossless **672,790,506 B** dataset:
| Conservative offline parameter | Result |
| --- | ---: |
| 14 packed immutable source/metadata objects | 672,790,506 B |
| 4-MB SQL BLOB segments per complete run | **177 rows** |
| 24 runs/day × 2 upload attempts | **8,496 projected rows/day** |
| 1 run with illustrative 15% SQLite/index/WAL allowance | **773,709,082 B** (<1GB/DO) |
| 4 retained + **one strictly serialized staging** | **3,868,545,410 B** (<4.5GB internal limit) |
| 4 retained + 2 overlapping staging (NOT allowed in this design) | **4,642,254,492 B** (>4.5GB internal limit) |
| Real SQLite storage, WAL/compaction and transient peak | **NOT MEASURED** |

These numbers are estimates calculated from actual original-byte inventory,
**not** empirical SQLite disk consumption. In particular, row-size/header
overhead, transient SQLite WAL files, global account quota and read throughput
must be measured before any 0-USD deployment claim.

**Independent small QA:** `tools/ruc/ruc_do_free_capacity_qa.py` plus
`tools/ruc/test_ruc_do_free_capacity_qa.py` establish a planning preflight
and simulate SQLite generation-fenced Last-Good swaps, stale-writer rejection,
incomplete-source rejection and rollback after quota/full-disk failure.
[GitHub #42783187169](https://github.com/MeteoMartini/MID/actions/runs/42783187169):
exact head `38abf3af2e7213dd64e5c80800c17a4f76ee075e`,
all **16 R2 budget + 12 lossless synthetic + 6 DO capacity/SQLite tests =
34/34 PASS**, with matching canonical and active workflow blob
`6999031a9d435b6db8f2d846ac80bca7bc9cb48c`.
No DWD redownload, no Cloudflare API, no subscription, no deployment, no
production code or worker binding modified.

**Architectural decision:** With an absolute **0 USD new-cost** constraint,
prioritize **Workers Free SQLite Durable Objects** over metered R2 for the
NEXT OFFLINE candidate. Do not conflate an SQLite transaction fixture with
a globally published multi-DO system: authenticated immutable run
readmission, real Worker/DO request/CPU tests, SQL transient peak and
client/Widget/Export parity remain prerequisites. `productionApproved=false`
and `activationAuthorized=false` at every offline exit. Existing Pages
and Last Good remain production-safe; no deployment or release authorized.


## Actual host-SQLite physical-byte surrogate (10 Nov 2026)

This new repeatable QA is **not Cloudflare storage**: it writes synthetic
content with the **exact 14 object byte sizes** from original-DWD SHA-bound
GitHub proof artifact `13746075942` (archive SHA-256
`28ed26fe81a29dc74d0360db1a822446dd29479eed1d07ef21ba9f74e68433c1`).
The source's true meteorological bytes and sentinel handling were already
independently verified in Actions [#42780229524](https://github.com/MeteoMartini/MID/actions/runs/42780229524).
**They are not in this SQLite test DB.**

Locally measured with SQLite 3.46.1, WAL, FULL synchronous writes, 4MB
segments, WITHOUT ROWID primary key, a commit for each bounded segment
and WAL auto-checkpoint:

| Surrogate metric | Measured value |
| --- | ---: |
| Original compressed object inventory | 672,790,506 B |
| SQL rows per model run | 177 |
| Actual host SQLite DB file after checkpoint | **673,902,592 B** |
| Max host DB+WAL+SHM physical peak | **682,039,432 B** |
| WAL max observed | 8,104,072 B |
| Four retained plus one staging (x5 post-checkpoint extrapolation) | **3,369,512,960 B** |
| Four retained plus one staging (x5 peak extrapolation) | **3,410,197,160 B** |
| 7 simulated grouped point requests, original range-index geometry | 70 synthetic SQL BLOB segments returned byte-exact |

Measured physical file overhead in this **host** SQLite test is much
lower than the earlier hypothetical 15% reserve. **The 15% conservative
capacity planning reserve remains in force**, because this is not real
Cloudflare storage and WAL may behave differently. A single original 27h
run, including all EPS20, is below the official Free-DO per-object 1GB
limit in this surrogate, but not yet qualified for that limit in Cloudflare.

The proposed consumer batch performs one **hypothetical** DO RPC per point
and ten SQL substr() reads inside the run object, not ten separate DO RPCs.
The SQL storage engine was genuinely exercised; the network/RPC layer was
**not**. Database row indexes, account-shared daily quotas and live Worker
CPU/storage billing remain open, and SQLite index changes may count as
extra paid-plan rows, so do not equate 177 inserted rows with real platform
row-write metering. This QA creates no Cloudflare resources.

Reproduction script: `tools/ruc/ruc_do_sqlite_physical_qa.py` with
`--proof-zip` and `--report`. It rejects a proof ZIP whose exact
SHA-256, UTC run, source SHA, 27h/EPS20 metadata or indexed data lengths
differ. The small no-network fixture suite runs under normal GitHub PR
CI, while the full 673MB offline probe is **not automatically rerun** to
avoid redundant work. Verified snapshot:
`docs/ruc/MID_RUC_DO_SQLITE_PHYSICAL_PROOF_453.json`.

**Zero-new-cost policy unchanged:** Durable Objects Free is only an
OFFLINE candidate; account tier, Cloudflare Free quota fail-closed,
Worker CPU/RPC and all RUC P1–P5 release gates require real independent
qualification before any activation. Neither R2 nor Durable Objects
was subscribed, created, deployed or granted secrets.


## Local SQL-API-compatible Run-DO + Coordinator-DO core pilot (10 Nov 2026)

The **QA-only** JavaScript modules `tools/ruc/ruc_do_worker_core_qa.mjs` and
`tools/ruc/test_ruc_do_worker_core_qa.mjs` exercise Cloudflare's documented
`ctx.storage.sql.exec()` / `ctx.storage.transactionSync()` method contract
through a **Node 22.16.0 experimental SQLite adapter**, not a deployed
Cloudflare Durable Object or `workerd` simulation.

- Three separately deflate-compressed native binary fields contain **28
  hourly values and 20 EPS members**, true zero-byte values and an actual
  `uint16` Missing sentinel `0xFFFF`, with fixed-width records. QA
  retains values **exactly** after SQL `substr(BLOB,...)` / boundary
  crossing and Web `DecompressionStream('deflate')` decoding.
- Per-run inventory includes exact source run, SHA-shaped metadata,
  independent zlib chunk hashes and *per-segment* SHA-256. Any missing
  EPS block, wrong byte length, same-size corruption, duplicate writer,
  out-of-bound point, overlapping object or stale run prevents admission.
- The candidate run is immutable after `sealQa()`. The coordinator
  first **reads the immutable run object's own sealed receipt**, then
  uses a synchronous single-SQLite-DO transaction to compare
  `generation`, monotonic UTC run and last-good. Stale writers,
  spoofed receipts and older runs cannot advance this **local**
  simulation.
- Simulated `SQLITE_FULL` fails the inserted segment transaction; the
  coordinator's last-good pointer remains unchanged. The source upload
  is bounded to **780 MB** so a conservative 15%-overhead estimate stays
  below the separate 900-MB-per-DO MID safety margin.
- The first 8 Node tests require *real Node SQLite*, binary values,
  WebCrypto, zlib, `DecompressionStream` and transactional rollback.
  The prior 38 Python tests remain unchanged; only a small GitHub QA is
  triggered, with no redundant 763-MB DWD artifact download.

**Critical unresolved trust boundary:** SHA-shaped proof references in
these tiny synthetic fixtures are **not signed CI attestations**.
The local core therefore exposes **QA-suffixed methods only**, not
production Worker routes, authenticated ingestion or a deployable
`cloudflare:workers` DurableObject class. The previous original-DWD
27h/EPS20 SHA/byte proof is separate; these new fixture bytes are
synthetic. No claimed live Cloudflare Worker CPU, real DO storage
metering, cross-DO atomic transaction, Cloudflare account access or
zero-cost billing cut-off was tested here. All QA output explicitly
returns `productionApproved=false` and
`activationAuthorized=false`.

**NEXT gate, not automatically dispatched:** authorize and test
a restricted local `workerd`/Wrangler *offline* runtime using a
signed, immutable source manifest and one actual original-byte
fixture. Only after independent Free-plan/account and budget gates
can a real production decision be reconsidered. R2 remains OFF.


## Optional LOCAL workerd runtime proof, never deployed

Official Cloudflare [local development](https://developers.cloudflare.com/workers/local-development/)
and [Miniflare](https://developers.cloudflare.com/workers/testing/miniflare/)
show that SQLite Durable Objects and service RPC can be exercised by a **local
`workerd` process** without any Cloudflare account, public domain, remote
binding, subscription or production deploy. Local Miniflare is *not* a hardened
sandbox, so this uses ephemeral GitHub Actions only, repository-authored QA
source and least-privilege `contents:read`.

New **QA-only** files: `tools/ruc/ruc_do_workerd_entry_qa.mjs`
(two `DurableObject` classes using the previously proven SQL-API core, and
three tightly local QA routes), and
`tools/ruc/test_ruc_do_workerd_qa.mjs` (local Miniflare dispatch).
A missing exact local test binding returns HTTP 403. The fixture uses
**synthetic native bytes** with 28 timesteps, 20 EPS members, genuine zero
and missing `uint16` values; original DWD bytes are **not** uploaded.
The simulator tests immutable SQL upload/independent zlib decode,
one native point at three fields, one generation-fenced promotion and
stale-writer rejection in distinct run/coordinator instances.

Pinned stable offline-only development dependency:
`miniflare@4.20260730.0` (last published stable v4 in official npm
metadata), with matching compatibility date `2026-07-30`. This is deliberately
**older than the current 2026-11 Cloudflare runtime** and therefore will not
be represented as final production runtime compatibility. It is installed
ephemerally in the GitHub runner with no project dependency or lockfile
change. The `local workerd` test may be treated as successful **only**
after the exact-PR-HEAD GitHub job succeeds and is independently read back.
If any dependency/runtime mismatch occurs, remain fail-closed and revise the
isolated QA only; never weaken the zero-cost or original meteorological gates.

*No Cloudflare account authorization, real Workers-Free quota billing,
authenticated original-source admission, production Worker CPU P95, iOS
device or public forecast-client acceptance is provided by this test.*


## SHA-shaped provenance is NOT a signature: Ed25519 admission QA (10 Nov 2026)

The previous local SQL/Workerd prototype checked individual
`sha256` strings supplied within a manifest. This preserves bytes
**after receipt** but alone does not authenticate who authored the
manifest. A malicious submitter could invent a different dataset and
matching hashes. Treating it as a signed original-DWD claim would be
a P0 provenance flaw. This QA draft explicitly holds production on
that condition.

A **second, isolated local-workerd-only** `Ed25519` admission gate
has now been added without weakening/altering the original tests:
`tools/ruc/ruc_do_attestation_qa.mjs`,
`tools/ruc/ruc_do_workerd_signed_entry_qa.mjs`, and
`tools/ruc/test_ruc_do_workerd_signed_qa.mjs`.

- The offline GitHub runner generates a **temporary Ed25519 private/public
  keypair**. Only the public key enters the Miniflare/Workerd environment.
  Private keys are never stored in repository, Cloudflare, secrets,
  logs or production Worker.
- Signature is checked over a domain-separated canonical QA message
  committing to the JSON manifest SHA-256, exact UTC model run, producer
  commit SHA, independent original artifact proof reference and the
  complete 27h/20-EPS contract. `crypto.subtle.importKey('raw',
  publicKey, 'Ed25519', false, ['verify'])` and
  `crypto.subtle.verify` are officially documented by Cloudflare.
  No writable run state is permitted before verification.
- Negative tests must reject **missing signature**, wrong signer,
  altered manifest (same-size valid SHA syntax), corrupt segment
  payload despite valid signature, run replay and stale pointer,
  keeping Last Good readable.
- This keypair represents a **synthetic trusted QA signer** only.
  It is *not* a MID verified CI release signer, DWD official
  signature or authenticated GRIB ingest. Production sign/verify
  trust roots, SHA-bound CI artifact, origin station/model/bitmap
  evidence and grant scopes are separate unresolved gates.
- Again no Cloudflare account touch, subscription, billed R2,
  Durable Object, production route, native iOS deployment or release.
  All QA responses remain `productionApproved=false` and
  `activationAuthorized=false`.

The new workerd test runs on the already provisioned **ephemeral local
Miniflare** job and must be declared successful only after reading the
exact new-head GitHub job result. No 763-MB DWD re-download.


## Additional P0 seal integrity gate (2026-11-10, QA-only)

The source-authoritative trust chain is still incomplete: a test Ed25519
signature alone does not establish DWD data origin. In addition, an in-DO
SQL BLOB could be corrupted *after* its upload SHA passed but *before*
`sealQa`. The old QA-only `sealQa` checked physical bytes and row counts
without re-hashing stored payloads. The new fail-closed QA now reads **each
stored SQL segment** and recomputes its SHA-256, against the signed-manifest
segment digest, before issuing any sealed receipt. It also keeps
`productionApproved=false`, `activationAuthorized=false`, and never
publishes any data. A new same-size SQL mutation test confirms the
candidate cannot be sealed and cannot advance the last-good pointer.

Important: Rehashing a real ~673MB dataset may violate Cloudflare Durable
Object CPU/throughput quotas if done in **one** invocation. Therefore
this is proof of *integrity logic only*, not a deployable sealing design.
A future production-candidate protocol needs bounded incremental
verification, a verified manifest commitment/bitmap persisted in SQL
and a short final atomic state change. Do not remove this validation
to meet CPU budgets; design a bounded chunk-check protocol instead.

## Pinned historical original-DWD proof → local Ed25519 QA metadata bridge

The original read-only 128KiB point-parity GitHub artifact
[Actions #42780229524](https://github.com/MeteoMartini/MID/actions/runs/42780229524),
ID `13746075942`, is only **1.25MB** compressed. It contains four
proof JSON files (not the ~763MB original DWD archived input).
It was independently SHA-256 checked locally at
`28ed26fe81a29dc74d0360db1a822446dd29479eed1d07ef21ba9f74e68433c1`.
The new `tools/ruc/ruc_do_original_proof_bridge_qa.py` verifies pinned
SHA-256 hashes of **every extracted JSON** and independently validates:
12 original field/rapid products, full native point-record geometry,
all 15,268 bounded compressed range descriptors, 27 hourly lead hours,
20 real native EPS members, original full-byte/70-point readbacks as
**historical prior QA assertions**, pinned producer `.451` SHA,
and exact source-run identity. Negative tests reject SHA drift,
unsigned file replacement/symlink, missing files and bogus model-run
metadata. The old large source artifact is never re-downloaded.

The script emits a small **historical evidence receipt**, explicitly
`sourceChecksRecomputedFromOriginalBytesNow=false`,
`dwdOfficialSignatureVerified=false`,
`midCiTrustedIssuerKeyConfigured=false`,
`productionApproved=false`, and `activationAuthorized=false`.
A local offline Ed25519 test signer will now refuse to sign a synthetic
manifest without exactly these independently pinned receipt SHA/source
references. The signed synthetic manifest binds to the **historical
metadata** only; it does **not** claim to sign the real weather payload.
One extra `actions:read` GitHub-token permission is scoped only to
downloading that known artifact inside the existing GitHub PR QA, and
`contents:read` remains unchanged. No Cloudflare calls or new accounts.

**Expiry caveat:** the historical GitHub artifact has short retention.
If it expires, the exact QA will fail closed, not silently replace
the evidence with an invented fixture. After successful validation,
store the minimal immutable evidence receipt and its independent SHA
in the repository for sustainable follow-up tests; *never* convert
this historical QA receipt to a production origin-signing authority.

### Fail-closed revalidation of original-proof bridge tests

The initial pinned-artifact negative test failed because JSON reserialization
changed the file length, correctly triggering the earlier **size gate**
rather than the intended SHA gate. The test now flips the **40-character
producer SHA in-place**, retaining its original JSON file length and
requiring the pinned SHA to reject the corruption. Also, the ephemeral
metadata-only QA signer is strictly restricted to the **exact historical
14Z model run** from the independently verified proof receipt. It no
longer signs a synthetic 15Z run using a 14Z source proof; that scenario
is instead explicitly rejected by the signing step before any DO write.
This preserves the policy that *each run needs its own independent source
admission proof*, even for a local synthetic QA. A previous separate
local DO core test still checks corrupted payload and last-good safety.
The failing first GitHub run is retained as diagnostic evidence, not
misreported as green.
