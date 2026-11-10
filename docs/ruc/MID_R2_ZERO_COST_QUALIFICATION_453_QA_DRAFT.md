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
