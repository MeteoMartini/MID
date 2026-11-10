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
