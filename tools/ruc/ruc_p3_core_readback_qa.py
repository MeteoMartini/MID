#!/usr/bin/env python3
"""SHA-attested RUC core EPS20 post-quantization readback (NO original GRIB).

Read an authentic, immutable production core checkpoint once, stream its
0.01-mm packed native EPS20 members, and test the optimized quantile implementation
without allocating the 2.4-GiB float cube. The original meteorological floats
are *not* recoverable after packing; NEVER call this an original-GRIB A/B,
a full builder end-to-end benchmark or a publication/SLO authorization.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import resource
import time
import warnings

import numpy as np
from build_ruc_bundle import eps_summary
from prepared_snapshot import core_report
from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major, pack_eps_members
from ruc_p3_eps_quantile_candidate import candidate_eps_linear_quantiles

SCHEMA = "mid.ruc.p3-postpacked-core-snapshot-qa.v1"
SHA = re.compile(r"^[0-9a-f]{40}$")
MODEL = re.compile(r"^20\d\d-\d\d-\d\dT\d\d:00$")
FIELDS = ("precipitation_q25", "precipitation_q50", "precipitation_q75")
NATIVE_POINTS = 542040
CHUNK_POINTS = 4096


def verify_checkpoint(root: Path, source_sha: str, run_id: int, attempt: int,
                      *, native: bool = True):
    root = Path(root).resolve(strict=True)
    if (not SHA.fullmatch(source_sha) or type(run_id) is not int or run_id <= 0
            or type(attempt) is not int or attempt <= 0):
        raise ValueError("invalid authenticated producer identity")
    proof = json.loads((root / "prepared-core-proof.json").read_text(encoding="utf-8"))
    producer = proof.get("producer")
    if (proof.get("schema") != "mid.ruc.prepared-core.v1"
            or not isinstance(producer, dict)
            or producer.get("repository") != "MeteoMartini/MID"
            or producer.get("sourceSha") != source_sha
            or producer.get("eventSha") != source_sha
            or producer.get("runId") != run_id
            or producer.get("runAttempt") != attempt
            or not isinstance(proof.get("compatibilitySha256"), str)
            or not re.fullmatch(r"[a-f0-9]{64}", proof["compatibilitySha256"])):
        raise ValueError("producer SHA/run/attempt or core receipt not authenticated")
    # Exhaustively hash all sealed core objects and preserved map originals.
    report = core_report(root)
    if proof.get("core") != report:
        raise ValueError("sealed core receipt differs from actual complete files")
    metadata = json.loads((root / "latest.json").read_text(encoding="utf-8"))
    points = metadata.get("pointCount")
    if type(points) is not int or points < 1 or (native and points != NATIVE_POINTS):
        raise ValueError("native 542040-point raster not verified")
    run = metadata.get("run")
    if not isinstance(run, str) or not MODEL.fullmatch(run):
        raise ValueError("bad model cycle")
    time0 = datetime.strptime(run, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
    times = [(time0 + timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M") for h in range(28)]
    member = metadata.get("eps")
    summary = metadata.get("epsSummary")
    if not isinstance(member, dict) or not isinstance(summary, dict):
        raise ValueError("EPS native/summary required")
    if (member.get("times") != times or summary.get("times") != times
            or member.get("dtype") != "uint16-le"
            or member.get("layout") != "point-time-member"
            or member.get("unit") != "mm"
            or member.get("scale") != 0.01
            or member.get("memberCount") != 20
            or member.get("nodata") != 65535
            or member.get("recordBytes") != 28 * 20 * 2
            or summary.get("dtype") != "int16-le"
            or summary.get("layout") != "point-time-field"
            or summary.get("recordBytes") != 28 * len(EPS_SUMMARY_FIELDS) * 2):
        raise ValueError("EPS native/summary cadence, unit or layout mismatch")
    fields = summary.get("fields")
    if not isinstance(fields, list) or len(fields) != len(EPS_SUMMARY_FIELDS):
        raise ValueError("summary fields missing")
    if any(row.get("name") != spec.name or row.get("scale") != spec.scale
           or row.get("unit") != spec.unit or row.get("offset") != spec.offset
           for row, spec in zip(fields, EPS_SUMMARY_FIELDS)):
        raise ValueError("summary field semantics changed")
    def object_path(key, length):
        if not isinstance(key, str) or Path(key).name != key:
            raise ValueError("unsafe binary key")
        if key not in metadata["objects"] or metadata["objects"][key]["bytes"] != length:
            raise ValueError("binary length differs from sealed core")
        path = root / key
        if path.is_symlink() or not path.is_file() or path.resolve().parent != root:
            raise ValueError("unsafe or absent core object")
        if path.stat().st_size != length:
            raise ValueError("truncated core object")
        return path
    eps_file = object_path(member.get("key"), points * 28 * 20 * 2)
    summary_file = object_path(summary.get("key"), points * 28 * len(EPS_SUMMARY_FIELDS) * 2)
    return report, metadata, eps_file, summary_file


def assess(root: Path, source_sha: str, run_id: int, attempt: int,
           *, native: bool = True, chunk_points: int = CHUNK_POINTS) -> dict:
    if type(chunk_points) is not int or not 1 <= chunk_points <= CHUNK_POINTS:
        raise ValueError("invalid bounded native point chunk")
    report, meta, eps_path, summary_path = verify_checkpoint(
        root, source_sha, run_id, attempt, native=native
    )
    points = meta["pointCount"]
    member_wire = np.memmap(eps_path, dtype="<u2", mode="r", shape=(points, 28, 20))
    chunks = math.ceil(points / chunk_points)
    reference_chunk_ids = {0, 1, chunks // 2, chunks - 1}
    compared, zeros, missing = 0, 0, 0
    packed_digest = hashlib.sha256()
    start = time.perf_counter()
    for index, offset in enumerate(range(0, points, chunk_points)):
        raw = member_wire[offset:offset+chunk_points]
        finite = raw != 65535
        missing += int(np.count_nonzero(~finite))
        zeros += int(np.count_nonzero(finite & (raw == 0)))
        # The original source was irreversibly quantized. These are unpacked
        # source *bytes*, NOT the original high-precision GRIB float values.
        reconstructed = np.where(finite, raw.astype(np.float64) * 0.01, np.nan)
        cube = reconstructed.transpose(1, 2, 0)
        if pack_eps_members(cube, .01) != raw.tobytes(order="C"):
            raise ValueError("packed core EPS source is not reversibly decoded")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            quantiles = candidate_eps_linear_quantiles(cube)
        if quantiles.shape != (3, 28, raw.shape[0]):
            raise ValueError("optimized EPS summary quantile shape mismatch")
        if index in reference_chunk_ids:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", RuntimeWarning)
                original = eps_summary(cube)
            for q, name in enumerate(FIELDS):
                if not np.array_equal(original[name], quantiles[q], equal_nan=True):
                    raise ValueError(f"postpacked reference/candidate differs at chunk {index}, {name}")
            test = dict(original)
            for q, name in enumerate(FIELDS):
                test[name] = quantiles[q]
            if pack_cell_major(original, EPS_SUMMARY_FIELDS) != pack_cell_major(test, EPS_SUMMARY_FIELDS):
                raise ValueError("reference/candidate 6-field postpacked wire differs")
            compared += 1
        packed_digest.update(quantiles.tobytes(order="C"))
        del raw, finite, reconstructed, cube, quantiles
    peak_mib = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
    if chunks != math.ceil(points/chunk_points) or compared != len(reference_chunk_ids):
        raise ValueError("postpacked full-grid coverage or reference samples incomplete")
    if missing + zeros > points * 28 * 20:
        raise ValueError("invalid missing/zero accounting")
    if peak_mib >= 1536:
        raise ValueError("postpacked streaming QA exceeded 1.5 GiB process-RSS ceiling")
    return {
        "schema": SCHEMA,
        "sourceType": "sealed-production-core-quantized-EPS20-members",
        "producerSourceShaVerifiedAgainstGitHubJob": source_sha,
        "producerRunId": run_id, "producerAttempt": attempt,
        "modelRunUtc": meta["run"],
        "coreManifestSha256": report["manifestSha256"],
        "memberCoreSha256": meta["objects"][meta["eps"]["key"]]["sha256"],
        "summaryCoreSha256": meta["objects"][meta["epsSummary"]["key"]]["sha256"],
        "points": points, "validTimes": 28, "members": 20, "chunks": chunks,
        "candidateQuantileDigestFromPostpackedValues": packed_digest.hexdigest(),
        "postpackedZeroMemberCells": zeros, "postpackedMissingMemberCells": missing,
        "referenceComparedChunksOnly": compared,
        "referenceAllChunksVerifiedHere": False,
        "postpackedStreamingProcessPeakRssMiB": round(peak_mib, 2),
        "postpackedStreamingWallSeconds": round(time.perf_counter() - start, 3),
        "authenticOriginalGribFloatsPresent": False,
        "realOriginalGribProducerEndToEndPeakRamVerified": False,
        "realOriginalGribBuilderSpeedupVerified": False,
        "matchesOriginalPublishedSummaryBytes": None,
        "fullPagesOrWorkerOrClientReadbackVerified": False,
        "sixtyMinuteProductionP95Authorized": False,
        "productionPointerMutated": False,
        "publicationAuthorized": False,
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--checkpoint", type=Path, required=True)
    p.add_argument("--producer-sha", required=True)
    p.add_argument("--run-id", type=int, required=True)
    p.add_argument("--attempt", type=int, required=True)
    p.add_argument("--output", type=Path, required=True)
    a = p.parse_args()
    if a.output.exists() or a.output.is_symlink():
        raise ValueError("never overwrite existing qualification evidence")
    record = assess(a.checkpoint, a.producer_sha, a.run_id, a.attempt)
    with a.output.open("x", encoding="utf-8") as fh:
        json.dump(record, fh, sort_keys=True, indent=2, allow_nan=False)
        fh.write("\n")
    print("RUC_P3_POSTPACKED_CORE_QA " + json.dumps(record, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
