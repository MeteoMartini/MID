# MID-C32 · Full RUC inventory evidence · .264

Verified base main=mid-stable=6364ee7b4baf1bd6c809b22ecb4468618c06129e (.263). No overlapping RUC PR. Production profile, raw keys, bytes, weather products, fields, deadlines, codec pilot and 900000000-byte budget remain unchanged. Worker changes are version-only.

## Operational integrity fix

The existing hourly full storage audit now verifies **all** declared payload sizes and SHA-256 values before its compression measurements. Previously only eligible binary candidates were read and checked by this audit; JSON, already-compressed maps and objects beyond candidate bounds were represented by declared sizes. Publication has its own independent checks; this change closes the full-audit evidence gap without claiming a previously observed corrupted publication.

`tools/ruc/lossless_inventory.py` supplies a separate offline full-inventory proof. It accepts only the existing grid.v2/pages-free-v1 profile and fixed budget; rejects duplicate/unsafe keys, escaped symlinks, bad sizes, hashes, totals and int16 geometry. Every input file is hashed, including files that remain uncompressed. Only declared int16 deterministic/EPS-summary/rapid products are candidates. Logical chunk aliases are checked but physical originals counted once. Lookup and native JSON/gzip remain unchanged.

Parts end on complete records and never exceed 524288 decoded bytes, preserving all int16 bit patterns including Missing/zero. Streaming input and bounded codec calls avoid loading whole products. Each part roundtrips in Python. Content-addressed wires are deduplicated. Incompressible originals stay raw. Source objects and latest.json are reverified before the proof directory is atomically renamed; an error removes the incomplete output. Output must be a new directory outside the source snapshot. It never changes source objects or invokes a publisher.

`tools/ruc/verify_lossless_inventory.mjs` independently hashes every original, runs the actual shared JavaScript codec on every candidate part, compares each byte at the declared original offset and verifies reconstructed whole-object SHA and complete record coverage. Overlaps, gaps and altered wire/manifest/geometry fail closed. Node timings/RSS are host diagnostics, not provider CPU/RAM/SLO evidence or physical iOS acceptance.

## Exact accounting and limits

The offline plan includes the original manifest plus the complete conversion map. Its byte length, retained originals and unique wire files are counted exactly. A replacement layout and a layout retaining **all** original payloads are reported independently against the unchanged budget. `report.json` is explicitly excluded from these hypothetical layouts; all other proof files are included. Original files retained by a layout must still be supplied from the snapshot. Existing production pilot wires are conservatively retained. This is an offline layout, **not a publishable new manifest or approval to switch formats**. No product-wide number is extrapolated from one chunk or from a partial download.

Usage:

```
python3 tools/ruc/lossless_inventory.py SNAPSHOT_ROOT NEW_PROOF_DIRECTORY
node tools/ruc/verify_lossless_inventory.mjs SNAPSHOT_ROOT NEW_PROOF_DIRECTORY
```

Regression includes multiple record-aligned parts spanning all 65536 bit patterns, zero/Missing, aliased physical originals, incompressible input, retained native gzip/JSON, Python/actual-JS reconstruction, exact output-file accounting and failure cases. Existing Python Pages-profile tests remain required. Full source/build/audit and heavy release gates remain unchanged.

## Completion boundary

The full-audit integrity fix and reproducible offline planning/verification tooling are complete. Full raw replacement remains disabled until a deployable bounded format and rollback-compatible atomic rollout plus provider CPU/RAM/SLO evidence are available. Raw-retaining dual residency is not assumed to fit. This release does not remove fields/maps/times or raise the budget to claim savings. Partial/failed downloads are not full evidence. See MID_DWD_RUC_PIPELINE_CONTRACT.md and the .263 evidence for the already deployed pilot and browser/SW compatibility.

## Full real-run result

Downloaded immutable Pages artifact11994818307 from successful RUC run38776538266 (source .263), archive321790423B, SHA158f5bc6d92ebc6a8b7758a685b231d29760ffb341d1256d48934f0239d171a8 verified. It contains the complete published16UTC snapshot:1286 payload objects,899175863B plus264517B original manifest; manifest SHA550915a7c81f8521af94af62421774a3bd460a476eafb015e448069ee3f5f111. Both Python and JavaScript hashed **every** object. All1029 declared int16 physical objects (833387312B) roundtripped through2179 record-aligned parts in both languages.2117 distinct wire files total206915707B. Retained lookup/native/other original payloads65788551B; complete offline descriptors1296922B.

The exact offline replacement layout totals274001180B; the layout retaining all original payloads totals1107388492B. The latter **exceeds the fixed budget by207388492B**. Therefore full dual residency cannot simply extend the current pilot. These are exact bytes for this one immutable run and this offline layout, not an already deployed reduction or a capacity guarantee for all future runs. Full raw replacement needs a new atomic rollout/rollback design; no old raw keys were deleted here. Prior public multi-object downloads became incomplete during run turnover/network errors and were not used as full evidence; the immutable artifact resolved that measurement problem.

Actual JS decoder p95 over all2179 parts5.093ms; whole Node process peak RSS137612KiB. These figures are not Cloudflare request CPU or incremental isolate RAM. Machine-readable evidence: MID_C32_RUC_INVENTORY_PROOF_0.9.85.264.json.974/974 local regressions passed in119.9s, Python Pages profile15 tests passed, final build/types/registry and83-package production audit passed. No UI change or physical-device claim.
