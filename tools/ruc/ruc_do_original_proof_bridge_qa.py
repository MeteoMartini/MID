#!/usr/bin/env python3
"""SHA-pinned historical DWD RUC QA evidence admission, never source deployment.

The four JSON files come from GitHub Actions artifact 13746075942 (run
42780229524), NOT the original ~2GB weather payload. Verifies authentic
prior proof metadata, geometry and digests; cannot certify current live DWD
or sign a production run.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

RUN = "2026-11-09T14:00"
PRODUCER_SHA = "d8852f672a40d26348d214dc85e9a3a1b9d79c1f"
ORIGINAL_SOURCE_ARTIFACT_SHA = "5a2275e4d75497c08e400b6e6b899254def2330a1b22472fe676d2cf112efe43"
PROOF_ZIP_SHA = "28ed26fe81a29dc74d0360db1a822446dd29479eed1d07ef21ba9f74e68433c1"
SOURCE_MANIFEST_SHA = "0615621952c3c07ebd5d60cfc2e0a44596198a244a75824b58d6b0a7419830ca"
GRID = 542_040
EXPECTED = {
    "report.json": ("540bf9ebb9c335a06d8df782f7b48f6774d8c2ca32d48d2823e68f5adff38d61", 1388),
    "inventory.json": ("e74422fccba6378be519a7e4ee6b57bd0f0812a6bc8853f4a40b16196d323f42", 2580),
    "range-index.json": ("0b5b06b846affab6d08ece9b1aeaa05f5a24a5064c26054248066a0880f998a4", 3157750),
    "consumer-parity.json": ("3fc37b9f98d43ae97f1bafa93acb805abaf34f5a92394deafeb8aefee0632351", 756),
}
PRODUCTS = {
    "deterministic.bin": (364250880, 672),
    "eps-summary.bin": (182125440, 336),
    "eps-members.bin": (607084800, 1120),
    "lookup.bin": (2298176, 1),
    "rapid-5m.bin": (79137840, 146),
    "rapid-15m.bin": (81306000, 150),
    "rapid-extreme.json": (451060, 1),
    "rapid-state-15m.bin": (54204000, 100),
    "rapid-reflectivity-15m.bin": (27102000, 50),
    "rapid-severe-15m.bin": (216816000, 400),
    "specialist-hourly.bin": (303542400, 560),
    "rapid-phase-15m.bin": (81306000, 150),
}
SHA64 = re.compile(r"^[0-9a-f]{64}$")


def deny(reason: str) -> None:
    raise ValueError("original proof inadmissible: " + reason)


def read_proof(directory: Path) -> dict:
    if directory.is_symlink() or not directory.is_dir():
        deny("missing evidence directory")
    observed = {}
    for name, (digest, size) in EXPECTED.items():
        path = directory / name
        if path.is_symlink() or not path.is_file() or path.stat().st_size != size:
            deny("missing/wrong-sized/symlinked pinned " + name)
        raw = path.read_bytes()
        if hashlib.sha256(raw).hexdigest() != digest:
            deny("pinned SHA mismatch " + name)
        observed[name] = json.loads(raw)
    r, inv, idx, cells = (observed[n] for n in EXPECTED)
    if (r.get("schema") != "mid.ruc.r2.lossless-qa-report.v1" or
        inv.get("schema") != "mid.ruc.r2.offline-inventory.v1" or
        idx.get("schema") != "mid.ruc.r2.lossless-range-pack-qa.v1" or
        cells.get("schema") != "mid.ruc.r2.offline-consumer-parity.v1"):
        deny("unrecognized offline proof schema")
    for obj in (r, inv, idx):
        if (obj.get("run") != RUN or obj.get("stableSha") != PRODUCER_SHA or
            obj.get("originalSourceProofSha256") != ORIGINAL_SOURCE_ARTIFACT_SHA):
            deny("source run or producer SHA drift")
    if cells.get("run") != RUN or cells.get("sourceSha") != PRODUCER_SHA:
        deny("point consumer source SHA/run drift")
    if (r.get("sourceManifestSha256") != SOURCE_MANIFEST_SHA or
        idx.get("sourceManifestSha256") != SOURCE_MANIFEST_SHA or
        r.get("postDecodeAllSourceSHAsMatch") is not True or
        r.get("boundedIndexVerified") is not True or
        r.get("sourceObjects") != 12 or
        r.get("originalBytes") != 1_999_624_596 or
        r.get("packedBytes") != 672_790_506 or
        r.get("productionApproved") is not False or
        r.get("r2ActivationAuthorized") is not False):
        deny("original full decode/bytes/provenance unverified")
    for obj in (idx, inv):
        if (obj.get("horizonHours") != 27 or obj.get("timeCount") != 28 or
            obj.get("epsMemberCount") != 20 or obj.get("nativeEpsMemberObjectsIncluded") is not True):
            deny("native 27h/EPS20 incomplete")
    if (idx.get("codec") != "zlib-independent-chunks-v1" or
        idx.get("sourcePointCount") != GRID or idx.get("objectCount") != 12):
        deny("unknown native grid or range codec")
    entries = idx.get("entries")
    if not isinstance(entries, list) or len(entries) != len(PRODUCTS) or {e.get("name") for e in entries} != set(PRODUCTS):
        deny("original product inventory incomplete")
    invrows = inv.get("objects")
    if not isinstance(invrows, list) or len(invrows) != 14:
        deny("physical packed inventory incomplete")
    physical = {x.get("key"): x for x in invrows}
    if len(physical) != 14 or sum(x.get("bytes", 0) for x in invrows) != 672_790_506:
        deny("physical inventory inconsistent")
    if (physical["latest.json"]["sha256"] != SOURCE_MANIFEST_SHA or
        physical["range-index.json"]["sha256"] != EXPECTED["range-index.json"][0]):
        deny("source/index metadata SHA does not match")
    for e in entries:
        raw_size, record = PRODUCTS[e["name"]]
        if (e.get("sourceBytes") != raw_size or e.get("recordBytes") != record or
            e.get("compressedKey") != e["name"] + ".zlib" or
            not isinstance(e.get("sourceSha256"), str) or not SHA64.fullmatch(e["sourceSha256"])):
            deny("native field/rapid product size or hash invalid")
        if record != 1 and raw_size != GRID * record:
            deny("native grid/record geometry invalid")
        phys = physical.get(e["compressedKey"])
        if (not isinstance(phys, dict) or
            phys.get("bytes") != e.get("compressedBytes") or
            phys.get("sha256") != e.get("compressedSha256")):
            deny("per-product packed SHA/bytes differ")
        chunks = e.get("chunks")
        if not isinstance(chunks, list) or not 1 <= len(chunks) <= 10000:
            deny("unbounded/missing range chunks")
        raw_pos = packed_pos = 0
        for ch in chunks:
            if (ch.get("offset") != packed_pos or
                type(ch.get("bytes")) is not int or not 0 < ch["bytes"] <= 4_000_000 or
                type(ch.get("rawBytes")) is not int or not 0 < ch["rawBytes"] <= 4_000_000 or
                not SHA64.fullmatch(str(ch.get("sha256"))) or
                not SHA64.fullmatch(str(ch.get("rawSha256")))):
                deny("range offsets/chunk hash/length invalid")
            packed_pos += ch["bytes"]
            raw_pos += ch["rawBytes"]
        if packed_pos != e["compressedBytes"] or raw_pos != raw_size:
            deny("uncovered original product range")
    if (cells.get("allPointBytesMatchOriginal") is not True or
        cells.get("checkedNativeProductRecords") != 70 or
        cells.get("simulatedR2RangeReads") != 70 or
        cells.get("maxR2ReadsForOneCell") != 10 or
        cells.get("sampledNativeCells") != [0,1,7,47,1704,271020,542039] or
        cells.get("productionApproved") is not False or
        cells.get("r2ActivationAuthorized") is not False):
        deny("independent sample-point comparison incomplete")
    return {
        "schema": "mid.ruc.do.original-proof-bridge-qa.v1",
        "originalModelRun": RUN,
        "originalProducerSha": PRODUCER_SHA,
        "originalSourceArtifactSha256": ORIGINAL_SOURCE_ARTIFACT_SHA,
        "proofArchiveSha256": PROOF_ZIP_SHA,
        "originalSourceManifestSha256": SOURCE_MANIFEST_SHA,
        "sourcePointCount": GRID,
        "nativeLeadHours": 27,
        "nativeEPSMembers": 20,
        "originalObjectCount": 12,
        "originalBytesPreviouslyVerified": 1_999_624_596,
        "losslesslyPackedBytesPreviouslyVerified": 672_790_506,
        "independentOriginalPointRecordsPreviouslyCompared": 70,
        "sourceChecksRecomputedFromOriginalBytesNow": False,
        "historicalProofMetadataPinnedAndCheckedNow": True,
        "dwdOfficialSignatureVerified": False,
        "midCiTrustedIssuerKeyConfigured": False,
        "productionApproved": False,
        "activationAuthorized": False,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--proof-dir", required=True, type=Path)
    p.add_argument("--output", type=Path, required=True)
    a = p.parse_args()
    try:
        result = read_proof(a.proof_dir)
        a.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(json.dumps(result, sort_keys=True))
        return 0
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print(json.dumps({"productionApproved": False, "activationAuthorized": False,
                          "errorType": type(exc).__name__, "reason": str(exc)}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
