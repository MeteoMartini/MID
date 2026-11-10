#!/usr/bin/env python3
"""Offline ONLY: lossless, range-addressable RUC wire packing and full decode proof.

No R2, GitHub API, credentials, deployments, or network. This is NOT a release
codec: Cloudflare Worker compatibility, CPU, full RUC client semantics and a
hard zero-USD billing cap remain separate mandatory gates.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import tempfile
import zlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

from ruc_r2_zero_cost_qa import evaluate, load_inventory, verify_local_bytes

SCHEMA = "mid.ruc.r2.lossless-range-pack-qa.v1"
SOURCE_SCHEMA = "mid.dwd.ruc.grid.v2"
RUN_RE = re.compile(r"^20\d{2}-\d{2}-\d{2}T\d{2}:00$")
NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,90}$")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
REQUIRED = frozenset(("deterministic.bin", "eps-summary.bin", "eps-members.bin", "lookup.bin"))
DEFAULT_CHUNK_BYTES = 1024 * 1024


def fail(message: str):
    raise ValueError(message)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_check(src: Path, *, expected_run: str, expected_member_count: int = 20):
    meta_path = src / "latest.json"
    if meta_path.is_symlink() or not meta_path.is_file():
        fail("missing or symlinked original core latest.json")
    raw_manifest = meta_path.read_bytes()
    meta = json.loads(raw_manifest)
    if meta.get("schema") != SOURCE_SCHEMA or meta.get("run") != expected_run:
        fail("original run or schema mismatch")
    if not isinstance(expected_run, str) or not RUN_RE.fullmatch(expected_run):
        fail("noncanonical UTC run")
    start = datetime.fromisoformat(expected_run + ":00+00:00")
    if start.strftime("%Y-%m-%dT%H:%M") != expected_run:
        fail("invalid run time")
    points = meta.get("pointCount")
    if type(points) is not int or points <= 0:
        fail("invalid native point count")
    expected_times = [(start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M") for i in range(28)]
    for key in ("deterministic", "epsSummary", "eps"):
        obj = meta.get(key) or {}
        if obj.get("times") != expected_times:
            fail(key + " does not contain native UTC hours 0..27")
    eps = meta["eps"]
    if eps.get("memberCount") != expected_member_count or eps.get("layout") != "point-time-member":
        fail("native EPS20 source metadata mismatch")
    provenance = meta.get("sourceGribContract") or {}
    grid = provenance.get("nativeGrid") or {}
    if (provenance.get("epsMemberIds") != list(range(1, 21)) or
        grid.get("pointCount") != points or
        provenance.get("forecastReferenceTime") != start.isoformat()):
        fail("missing original-DWD source GRIB / EPS20 provenance")
    objects = meta.get("objects")
    if not isinstance(objects, dict) or not REQUIRED.issubset(objects) or not 4 <= len(objects) <= 49:
        fail("incomplete/unbounded original wire object inventory")
    if len(objects) != len(set(objects)):
        fail("duplicate original source objects")
    return meta, objects, sha(raw_manifest)


def pack_file(source: Path, target: Path, item: dict, points: int, chunk_bytes: int) -> dict:
    size = item.get("bytes")
    digest = item.get("sha256")
    if (type(size) is not int or size <= 0 or not isinstance(digest, str) or
        not SHA_RE.fullmatch(digest)):
        fail("source object missing authentic bytes/SHA")
    if source.is_symlink() or not source.is_file() or source.stat().st_size != size:
        fail("source object missing, linked, or wrong size: " + source.name)
    # Align on whole native spatial records for point requests. Never change the
    # raw record's content, uint16 missing sentinel, or binary precision.
    record = size // points if source.suffix == ".bin" and size % points == 0 else 1
    step = max(record, (chunk_bytes // record) * record)
    if step > 4 * 1024 * 1024:
        fail("chunk grows beyond bounded consumer memory")
    chunks, offset, original_hash, packed_hash, total = [], 0, hashlib.sha256(), hashlib.sha256(), 0
    with source.open("rb") as read, target.open("xb") as write:
        while True:
            raw = read.read(step)
            if not raw:
                break
            original_hash.update(raw)
            compressed = zlib.compress(raw, level=6)
            write.write(compressed)
            packed_hash.update(compressed)
            chunks.append({"offset": offset, "bytes": len(compressed), "rawBytes": len(raw),
                           "sha256": sha(compressed), "rawSha256": sha(raw)})
            offset += len(compressed)
            total += len(raw)
    if total != size or original_hash.hexdigest() != digest:
        fail("authentic source byte digest mismatch: " + source.name)
    return {"name": source.name, "sourceBytes": size, "sourceSha256": digest,
            "recordBytes": record, "compressedKey": target.name,
            "compressedBytes": offset, "compressedSha256": packed_hash.hexdigest(),
            "chunks": chunks}


def verify_file(packed: Path, desc: dict) -> None:
    raw_sha, packed_sha, total, packed_bytes = hashlib.sha256(), hashlib.sha256(), 0, 0
    with packed.open("rb") as handle:
        for chunk in desc["chunks"]:
            if chunk["offset"] != packed_bytes:
                fail("broken range offset")
            part = handle.read(chunk["bytes"])
            if len(part) != chunk["bytes"] or sha(part) != chunk["sha256"]:
                fail("packed chunk bytes/SHA mismatch")
            dec = zlib.decompressobj()
            raw = dec.decompress(part, chunk["rawBytes"] + 1)
            raw += dec.flush()
            if (not dec.eof or dec.unused_data or dec.unconsumed_tail or
                len(raw) != chunk["rawBytes"] or sha(raw) != chunk["rawSha256"]):
                fail("range decompression/byte mismatch")
            raw_sha.update(raw)
            packed_sha.update(part)
            total += len(raw)
            packed_bytes += len(part)
        if handle.read(1):
            fail("unindexed trailing packed bytes")
    if (total != desc["sourceBytes"] or raw_sha.hexdigest() != desc["sourceSha256"] or
        packed_bytes != desc["compressedBytes"] or packed_sha.hexdigest() != desc["compressedSha256"]):
        fail("whole-object lossless SHA mismatch: " + desc["name"])


def build(source_dir: Path, output_dir: Path, *, run: str, stable_sha: str,
          original_artifact_sha256: str, chunk_bytes: int = DEFAULT_CHUNK_BYTES) -> dict:
    if not re.fullmatch(r"[0-9a-f]{40}", stable_sha):
        fail("exact producer/source SHA required")
    if not SHA_RE.fullmatch(original_artifact_sha256):
        fail("original authenticated artifact SHA256 required")
    if type(chunk_bytes) is not int or chunk_bytes < 65536 or chunk_bytes > 4 * 1024 * 1024:
        fail("unbounded chunk length")
    source_dir = source_dir.resolve(strict=True)
    output_dir = output_dir.absolute()
    if output_dir.exists() or source_dir == output_dir or source_dir in output_dir.parents:
        fail("output must be NEW and outside the source tree")
    meta, objects, raw_manifest_sha = source_check(source_dir, expected_run=run)
    output_dir.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".ruc-r2-offline-", dir=output_dir.parent) as tmp:
        dst = Path(tmp)
        descriptors = []
        for name, item in sorted(objects.items()):
            if not NAME_RE.fullmatch(name):
                fail("unsafe original object key")
            part = pack_file(source_dir / name, dst / (name + ".zlib"), item, meta["pointCount"], chunk_bytes)
            verify_file(dst / part["compressedKey"], part)
            descriptors.append(part)
        # Both source metadata and independent range index are immutable objects.
        shutil.copyfile(source_dir / "latest.json", dst / "latest.json")
        index = {"schema": SCHEMA, "run": run, "stableSha": stable_sha,
                 "sourceManifestSha256": raw_manifest_sha,
                 "originalSourceProofSha256": original_artifact_sha256,
                 "sourcePointCount": meta["pointCount"], "horizonHours": 27,
                 "timeCount": 28, "epsMemberCount": 20,
                 "nativeEpsMemberObjectsIncluded": True, "codec": "zlib-independent-chunks-v1",
                 "objectCount": len(descriptors), "entries": descriptors}
        (dst / "range-index.json").write_text(json.dumps(index, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
        paths = [x["compressedKey"] for x in descriptors] + ["latest.json", "range-index.json"]
        inventory = {"schema": "mid.ruc.r2.offline-inventory.v1",
                     "stableSha": stable_sha, "run": run, "horizonHours": 27,
                     "timeCount": 28, "epsMemberCount": 20,
                     "nativeEpsMemberObjectsIncluded": True,
                     "originalSourceProofSha256": original_artifact_sha256,
                     "objects": []}
        for p in paths:
            content = dst / p
            digest = hashlib.sha256()
            with content.open("rb") as f:
                for block in iter(lambda: f.read(1024 * 1024), b""):
                    digest.update(block)
            inventory["objects"].append({"key": p, "bytes": content.stat().st_size,
                                          "sha256": digest.hexdigest()})
        (dst / "inventory.json").write_text(json.dumps(inventory, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        checked = load_inventory(dst / "inventory.json")
        verify_local_bytes(checked, dst)
        sizing = evaluate(checked)  # Missing Class B/account and billing cap => always BLOCKED.
        result = {"schema": "mid.ruc.r2.lossless-qa-report.v1",
                  "run": run, "stableSha": stable_sha,
                  "originalSourceProofSha256": original_artifact_sha256,
                  "sourceManifestSha256": raw_manifest_sha,
                  "sourceObjects": len(descriptors),
                  "originalBytes": sum(x["sourceBytes"] for x in descriptors),
                  "packedBytes": sizing["offlineInventoryBytes"],
                  "compressionRatio": round(sizing["offlineInventoryBytes"] / sum(x["sourceBytes"] for x in descriptors), 6),
                  "postDecodeAllSourceSHAsMatch": True,
                  "boundedIndexVerified": True, "cost": sizing,
                  "productionApproved": False, "r2ActivationAuthorized": False}
        (dst / "report.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        os.replace(dst, output_dir)
    return result


def main() -> int:
    arg = argparse.ArgumentParser(description=__doc__)
    arg.add_argument("--source", type=Path, required=True)
    arg.add_argument("--output", type=Path, required=True)
    arg.add_argument("--run", required=True)
    arg.add_argument("--producer-sha", required=True)
    arg.add_argument("--artifact-sha256", required=True)
    arg.add_argument("--chunk-bytes", type=int, default=DEFAULT_CHUNK_BYTES)
    opts = arg.parse_args()
    try:
        result = build(opts.source, opts.output, run=opts.run, stable_sha=opts.producer_sha,
                       original_artifact_sha256=opts.artifact_sha256, chunk_bytes=opts.chunk_bytes)
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError, zlib.error) as e:
        print(json.dumps({"productionApproved": False, "r2ActivationAuthorized": False,
                          "errorClass": type(e).__name__, "reason": str(e)}))
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
