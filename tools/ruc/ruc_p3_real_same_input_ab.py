#!/usr/bin/env python3
"""P3: same-original-DWD-GRIB, reference-vs-candidate EPS20 shadow only.

This tool NEVER publishes and never changes build_ruc_bundle.eps_summary.
It downloads each original DWD EPS GRIB file ONCE, checks native ecCodes
headers/20 members/bitmap/accumulation through the canonical RUC decoders,
and computes both algorithms over the very same decoded float arrays.
Both complete packed EPS-summary byte streams must be identical.

Neither observed DWD publication time, Pages budget, worker/app adoption
nor a production P95/speedup is asserted by this experimental qualification.
"""
from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import re
import resource
import shutil
import sys
import time
import warnings

import numpy as np
from build_ruc_bundle import collect_eps, eps_summary, hourly_targets
from fetch_and_build_ruc import (
    EPS_BASE, common_runs, session, stage_tree, validate_eps_header_coverage,
)
from ruc_p3_eps_quantile_candidate import candidate_eps_linear_quantiles
from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major

SCHEMA = "mid.ruc.p3-authentic-original-eps20-ab.v1"
DWD_RUN = re.compile(r"^20\d{2}-\d{2}-\d{2}T\d{2}:00$")
FIELDS = ("precipitation_q25", "precipitation_q50", "precipitation_q75")
POINTS = 542040
HOURS = 27
MEMBERS = tuple(range(1, 21))
CHUNK = 4096


def canonical_run(value: str) -> str:
    if not isinstance(value, str) or not DWD_RUN.fullmatch(value):
        raise ValueError("DWD run must be exact YYYY-MM-DDTHH:00 UTC")
    parsed = datetime.strptime(value, "%Y-%m-%dT%H:%M")
    if parsed.strftime("%Y-%m-%dT%H:%M") != value:
        raise ValueError("invalid DWD UTC cycle")
    return value


def fingerprint_original_files(root: Path, files: list[Path]) -> dict:
    root = Path(root).resolve(strict=True)
    if root.is_symlink() or not 27 <= len(files) <= 1024:
        raise ValueError("invalid EPS source file inventory")
    rows = []
    for file in sorted(files):
        file = Path(file)
        if file.is_symlink() or not file.is_file():
            raise ValueError("unsafe/missing DWD GRIB file")
        normalized = file.resolve(strict=True)
        if not normalized.is_relative_to(root):
            raise ValueError("DWD source escaped original stage root")
        if normalized.suffix not in (".bz2", ".grib2", ".grb2"):
            raise ValueError("unexpected non-GRIB original input")
        sha = hashlib.sha256()
        with normalized.open("rb") as stream:
            for piece in iter(lambda: stream.read(1024 * 1024), b""):
                sha.update(piece)
        size = normalized.stat().st_size
        if size <= 0:
            raise ValueError("empty original GRIB")
        rows.append((normalized.relative_to(root).as_posix(), size, sha.hexdigest()))
    payload = json.dumps(rows, separators=(",", ":"), ensure_ascii=True).encode()
    return {
        "sourceFileCount": len(rows),
        "sourceBytes": sum(x[1] for x in rows),
        "sourceManifestSha256": hashlib.sha256(payload).hexdigest(),
        "sourceInventorySha256Verified": True,
    }


def compare_same_cube(cube: np.ndarray, *, full_native: bool = True, chunk_points: int = CHUNK) -> dict:
    if not isinstance(cube, np.ndarray) or cube.ndim != 3 or cube.dtype != np.float64:
        raise ValueError("expected original float64 native EPS cube")
    time_terms, members, points = cube.shape
    if time_terms != 28 or members != 20 or points <= 0:
        raise ValueError("wrong 27h/EPS20 source dimension")
    if full_native and points != POINTS:
        raise ValueError("original DWD native grid lacks 542040 cells")
    if not isinstance(chunk_points, int) or not 0 < chunk_points <= CHUNK:
        raise ValueError("unbounded EPS compare chunk")
    old_sha = hashlib.sha256()
    new_sha = hashlib.sha256()
    old_seconds = new_seconds = 0.0
    verified = 0
    missing_cells = int(np.count_nonzero(~np.isfinite(cube)))
    valid_zero_cells = int(np.count_nonzero(np.isfinite(cube) & (cube == 0.0)))
    for start in range(0, points, chunk_points):
        block = cube[:, :, start : start + chunk_points]
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            t0 = time.perf_counter()
            original = eps_summary(block)
            old_seconds += time.perf_counter() - t0
            t0 = time.perf_counter()
            candidate = candidate_eps_linear_quantiles(block)
            new_seconds += time.perf_counter() - t0
        if candidate.shape != (3, 28, block.shape[2]):
            raise ValueError("optimized quantile shape differs")
        test = dict(original)
        for index, name in enumerate(FIELDS):
            if not np.array_equal(original[name], candidate[index], equal_nan=True):
                raise ValueError(f"actual DWD EPS quantile differs at {name} block {start}")
            test[name] = candidate[index]
        before = pack_cell_major(original, EPS_SUMMARY_FIELDS)
        after = pack_cell_major(test, EPS_SUMMARY_FIELDS)
        if before != after:
            raise ValueError(f"actual DWD EPS packer bytes differ at block {start}")
        old_sha.update(before)
        new_sha.update(after)
        verified += 1
    if verified != math.ceil(points / chunk_points):
        raise ValueError("incomplete native EPS chunk coverage")
    if old_sha.digest() != new_sha.digest():
        raise ValueError("EPS full stream digest mismatch")
    return {
        "originalDwdSourceTimeTermsVerified": time_terms,
        "originalDwdNativePointsVerified": points,
        "originalDwdEpsMembersVerified": members,
        "originalDwdNonfiniteMissingCells": missing_cells,
        "originalDwdFiniteZeroCells": valid_zero_cells,
        "chunks": verified,
        "referenceSeconds": round(old_seconds, 6),
        "candidateSeconds": round(new_seconds, 6),
        "exactFloatQuantilesAllChunks": True,
        "exactPackedEpsSummaryAllChunks": True,
        "identicalPackedSha256": old_sha.hexdigest(),
        "rssMaxKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
        "sameOriginalInputsCompared": True,
    }


def download_verified_eps(root: Path, run: str) -> tuple[list[Path], dict]:
    run = canonical_run(run)
    target = root / re.sub(r"[^A-Za-z0-9_-]", "", run) / "eps" / "TOT_PREC"
    if target.exists():
        raise ValueError("refuse stale/reused native EPS staging directory")
    target.mkdir(parents=True)
    try:
        with session() as client:
            advertised = stage_tree(
                client, f"{EPS_BASE}/TOT_PREC/r/{run}/",
                target, HOURS, f"P3 original {run} EPS20", mode="hourly"
            )
        files = [target / relative for relative in advertised]
        validate_eps_header_coverage(files, run, HOURS)
        manifest = fingerprint_original_files(target, files)
        return files, manifest
    except BaseException:
        shutil.rmtree(target, ignore_errors=True)
        raise


def run_original_shadow(*, run: str, stage: Path, output: Path) -> dict:
    if output.exists():
        raise ValueError("P3 evidence output must be new, never overwrite")
    if stage.exists() and (stage.is_symlink() or any(stage.iterdir())):
        raise ValueError("P3 original source staging must start empty")
    stage.mkdir(parents=True, exist_ok=True)
    if run == "auto":
        with session() as client:
            candidates = common_runs(client)[:3]
    else:
        candidates = [canonical_run(run)]
    if not candidates:
        raise ValueError("no DWD RUC/EPS run candidates; no P3 admission")
    errors = []
    for cycle in candidates:
        canonical_run(cycle)
        try:
            files, original = download_verified_eps(stage, cycle)
            times = hourly_targets(cycle, HOURS)["eps"]
            cube, members = collect_eps(
                files, times, POINTS, expected_members=MEMBERS
            )
            if tuple(members) != MEMBERS:
                raise ValueError("missing or misordered original EPS members")
            measure = compare_same_cube(cube, full_native=True)
            evidence = {
                "schema": SCHEMA,
                "runUtc": cycle,
                "nativeOriginal": original,
                "sameInputAB": measure,
                "githubSourceShaClaim": os.environ.get("GITHUB_SHA", ""),
                "producerReleaseShaVerified": False,
                "dwdFirstPublicationInstantVerified": False,
                "physicalPagesBudgetVerified": False,
                "realAppWidgetExportAdoptionVerified": False,
                "sameInputReferenceVsCandidateAbVerified": True,
                "productionSpeedupOrFreshnessSloAuthorized": False,
                "publicationAuthorized": False,
            }
            output.parent.mkdir(parents=True, exist_ok=True)
            with output.open("x", encoding="utf-8") as file:
                json.dump(evidence, file, indent=2, sort_keys=True, allow_nan=False)
                file.write("\n")
            print("RUC_P3_AUTHENTIC_AB " + json.dumps(evidence, sort_keys=True), flush=True)
            return evidence
        except (OSError, ValueError, RuntimeError, SystemExit) as exc:
            errors.append(f"{cycle}: {type(exc).__name__} - {exc}")
            print(f"::notice::DWD source candidate not admitted: {cycle}: {type(exc).__name__}", flush=True)
    raise ValueError("no complete original EPS20 cycle accepted: " + "; ".join(errors))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", default="auto", help="auto or exact UTC DWD run")
    parser.add_argument("--stage", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    a = parser.parse_args()
    run_original_shadow(run=a.run, stage=a.stage, output=a.output)


if __name__ == "__main__":
    main()
