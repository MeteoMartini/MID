#!/usr/bin/env python3
"""Read-only full native MID RUC P3 original-DWD builder A/B qualification.

This only operates on a *single* existing original DWD stage from the unchanged
fetch_and_build_ruc.py producer. The first builder uses the original NumPy
reference; the second runs the same unchanged production builder in an isolated
Python process with its static P3 flag injected to True *in memory only*.

It never publishes, dispatches a workflow, changes a production config,
uses a production token, or claims a 60-minute P95/first-publication SLO.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
RUC = ROOT / "tools" / "ruc"
sys.path.insert(0, str(RUC))
import build_ruc_bundle as production

SCHEMA = "mid.ruc.p3-full-native-same-stage-ab.v1"
RUN = re.compile(r"^20\d\d-\d\d-\d\dT\d\d:00$")
SHA = re.compile(r"^[0-9a-f]{40}$")
METRIC = re.compile(r"^P3_AB_PROFILE ([0-9]+(?:\.[0-9]+)?) ([0-9]+)$")
STATS = re.compile(
    r"^RUC_P3_PHASES run=(\S+) download_stage_seconds=([0-9.]+)"
    r" native_builder_seconds=([0-9.]+)$"
)
FLAG = "_P3_ACCELERATED_QUANTILE_ENABLED"
NEEDED = frozenset({
    "deterministic.bin", "eps-members.bin", "eps-summary.bin",
    "lookup.bin", "rapid-5m.bin", "rapid-15m.bin", "rapid-extreme.json",
})


def clean_run(s: str) -> str:
    if not isinstance(s, str) or not RUN.fullmatch(s):
        raise ValueError("invalid DWD run UTC name")
    t = datetime.strptime(s, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
    if t.strftime("%Y-%m-%dT%H:%M") != s:
        raise ValueError("invalid DWD UTC model cycle")
    return s


def unaltered_source_gate() -> None:
    # This check is on the actual checked-out source, not user-supplied data.
    source = (RUC / "build_ruc_bundle.py").read_text(encoding="utf-8")
    if source.count("_P3_ACCELERATED_QUANTILE_ENABLED = False") != 1:
        raise ValueError("P3 production source must be statically locked OFF")
    if getattr(production, FLAG, None) is not False:
        raise ValueError("P3 production flag is not initially literal False")
    if source.count("q25,q50,q75=np.nanquantile") != 1:
        raise ValueError("original NumPy reference not preserved")
    if source.count("q25,q50,q75=candidate_eps_linear_quantiles(safe)") != 1:
        raise ValueError("candidate guarded branch not exactly as qualified")


def sha_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stage_inventory(stage: Path) -> dict:
    stage = stage.resolve(strict=True)
    if not stage.is_dir() or stage.is_symlink():
        raise ValueError("original GRIB staging invalid")
    rows = []
    for item in sorted(stage.rglob("*")):
        if item.is_symlink():
            raise ValueError("original input has symlink")
        if item.is_file():
            if item.stat().st_size <= 0 or not item.resolve().is_relative_to(stage):
                raise ValueError("empty/escaped GRIB source")
            relative = item.relative_to(stage).as_posix()
            rows.append([relative, item.stat().st_size, sha_file(item)])
    if len(rows) < 560:
        raise ValueError("full-stage GRIB inventory incomplete")
    eps = [x for x in rows if x[0].startswith("eps/TOT_PREC/")]
    if len(eps) != 560:
        raise ValueError("original complete 28x20 EPS20 inventory absent")
    raw = json.dumps(rows, separators=(",", ":"), ensure_ascii=True).encode()
    return {
        "fileCount": len(rows),
        "epsFileCount": len(eps),
        "bytes": sum(x[1] for x in rows),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }


def read_meta(root: Path, run: str) -> dict:
    root = root.resolve(strict=True)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("unsafe native output")
    path = root / "latest.json"
    if path.is_symlink() or not path.is_file():
        raise ValueError("native output lacks metadata")
    meta = json.loads(path.read_text(encoding="utf-8"))
    if (meta.get("schema") != "mid.dwd.ruc.grid.v2"
        or meta.get("run") != run
        or meta.get("pointCount") != 542040
        or not isinstance(meta.get("objects"), dict)
        or not NEEDED.issubset(meta["objects"])
        or meta.get("eps", {}).get("memberCount") != 20
        or meta.get("eps", {}).get("scale") != 0.01
        or meta.get("eps", {}).get("nodata") != 65535):
        raise ValueError("full native 27h/EPS20 physical contract not satisfied")
    time0 = datetime.strptime(run, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
    expected = [(time0 + timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M") for h in range(28)]
    for name in ("deterministic", "epsSummary", "eps"):
        if meta.get(name, {}).get("times") != expected:
            raise ValueError("incomplete full native UTC model horizon")
    # A matching JSON inventory SHA cannot replace a native field-layout proof.
    if (meta["objects"]["eps-members.bin"].get("bytes") != 542040 * 28 * 20 * 2
            or meta["objects"]["eps-summary.bin"].get("bytes") != 542040 * 28 * 6 * 2
            or meta["eps"].get("recordBytes") != 28 * 20 * 2
            or meta["epsSummary"].get("recordBytes") != 28 * 6 * 2
            or meta["epsSummary"].get("dtype") != "int16-le"
            or meta["eps"].get("dtype") != "uint16-le"):
        raise ValueError("EPS20/27h native packed record geometry mismatch")
    return meta


def verify_outputs(ref: Path, candidate: Path, run: str) -> dict:
    baseline = read_meta(ref, run)
    optimized = read_meta(candidate, run)
    old = dict(baseline)
    new = dict(optimized)
    # generatedAt is a build clock, not a meteorological field.
    old.pop("generatedAt", None)
    new.pop("generatedAt", None)
    if old != new:
        raise ValueError("native metadata (excluding only build timestamp) changed")
    names = sorted(baseline["objects"])
    total = 0
    for name in names:
        if (not isinstance(name, str) or name in (".", "..")
                or Path(name).name != name or "/" in name or "\\" in name):
            raise ValueError("unsafe original object name")
        expected = baseline["objects"][name]
        a = ref / name
        b = candidate / name
        if (a.is_symlink() or b.is_symlink() or not a.is_file() or not b.is_file()
                or a.stat().st_size != b.stat().st_size
                or a.stat().st_size != expected.get("bytes")):
            raise ValueError("native object presence or length mismatch: " + name)
        original_sha = sha_file(a)
        optimized_sha = sha_file(b)
        if original_sha != optimized_sha or original_sha != expected.get("sha256"):
            raise ValueError("same-original-GRIB native bytes mismatch: " + name)
        total += a.stat().st_size
    return {
        "byteIdenticalObjects": len(names),
        "byteIdenticalTotalBytes": total,
        "epsSummarySha256": baseline["objects"]["eps-summary.bin"]["sha256"],
        "epsMembersSha256": baseline["objects"]["eps-members.bin"]["sha256"],
        "deterministicSha256": baseline["objects"]["deterministic.bin"]["sha256"],
    }


def profile(path: Path) -> dict:
    rows = [x for x in path.read_text(encoding="utf-8").splitlines()
            if METRIC.fullmatch(x)]
    if len(rows) != 1:
        raise ValueError("missing or ambiguous GNU-time peak RSS evidence")
    found = METRIC.fullmatch(rows[0])
    assert found
    wall = float(found.group(1))
    maxrss = int(found.group(2))
    if not 0 < wall < 3600 or not 500000 <= maxrss < 7500000:
        raise ValueError("invalid or unbounded actual builder resource profile")
    return {"wallSeconds": round(wall, 3), "peakRssKiB": maxrss}


def baseline_builder_seconds(log: Path, run: str) -> float:
    rows = [STATS.fullmatch(x) for x in log.read_text(encoding="utf-8").splitlines()]
    matching = [float(x.group(3)) for x in rows if x and x.group(1) == run]
    if len(matching) != 1 or not 0 < matching[0] < 3600:
        raise ValueError("missing authentic baseline builder-only duration")
    return matching[0]


def run_candidate(stage: Path, output: Path, run: str) -> None:
    """Only this QA interpreter may enable the experimental source branch."""
    clean_run(run)
    unaltered_source_gate()
    if output.exists() or output.is_symlink():
        raise ValueError("candidate output must be a completely new folder")
    if not stage.is_dir() or stage.is_symlink():
        raise ValueError("original same-stage DWD inputs absent")
    if not (stage / "eps" / "TOT_PREC").is_dir():
        raise ValueError("original DWD EPS20 input directory absent")
    source_before = stage_inventory(stage)
    print("RUC_P3_ORIGINAL_STAGE_SHA " + source_before["sha256"], flush=True)
    setattr(production, FLAG, True)
    if getattr(production, FLAG) is not True:
        raise ValueError("in-memory candidate activation did not succeed")
    argv = sys.argv
    try:
        sys.argv = ["build_ruc_bundle.py", "--staging", str(stage),
                    "--output", str(output), "--run", run, "--hours", "27"]
        production.main()
    finally:
        sys.argv = argv
        setattr(production, FLAG, False)
    if stage_inventory(stage) != source_before:
        raise ValueError("original DWD stage was modified by optimized builder")


def verify(ref: Path, fast: Path, stage: Path, run: str, expected_sha: str,
           reference_log: Path, reference_profile: Path,
           candidate_profile: Path) -> dict:
    clean_run(run)
    unaltered_source_gate()
    if not SHA.fullmatch(expected_sha):
        raise ValueError("invalid pinned GitHub HEAD")
    actual_head = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip()
    if actual_head != expected_sha:
        raise ValueError("GitHub candidate SHA drift")
    stage_proof = stage_inventory(stage)
    checked = verify_outputs(ref, fast, run)
    a, b = profile(reference_profile), profile(candidate_profile)
    builder_a = baseline_builder_seconds(reference_log, run)
    if b["peakRssKiB"] >= 6800000 or b["peakRssKiB"] > a["peakRssKiB"] + 262144:
        raise ValueError("candidate full-builder peak RAM regression")
    if b["wallSeconds"] >= builder_a:
        raise ValueError("candidate full native builder not faster on same staged input")
    return {
        "schema": SCHEMA,
        "candidateSourceSha": expected_sha,
        "modelRunUtc": run,
        "originalStage": stage_proof,
        "nativeOutputs": checked,
        "baselineBuilderOnlySeconds": round(builder_a, 3),
        "candidateBuilderOnlySeconds": b["wallSeconds"],
        "baselineFullProducerWithDownloadSeconds": a["wallSeconds"],
        "baselinePeakResidentKiB": a["peakRssKiB"],
        "candidatePeakResidentKiB": b["peakRssKiB"],
        "sameOriginalStagedInputsBothBuilders": True,
        "candidateCodeEnabledOnlyInQaProcess": True,
        "realOriginalGribFullBuilderE2eCompared": True,
        "sourceFirstPublicationInstantVerified": False,
        "production60MinuteP95Verified": False,
        "pages900MBAndJsCodecVerifiedHere": False,
        "workerAndWidgetsAndIosReadbackVerified": False,
        "releaseAuthorized": False,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("mode", choices=("candidate", "verify"))
    ap.add_argument("--stage", type=Path, required=True)
    ap.add_argument("--run", required=True)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--reference", type=Path)
    ap.add_argument("--reference-log", type=Path)
    ap.add_argument("--reference-profile", type=Path)
    ap.add_argument("--candidate-profile", type=Path)
    ap.add_argument("--head")
    ap.add_argument("--report", type=Path)
    args = ap.parse_args()
    if args.mode == "candidate":
        if args.output is None:
            ap.error("--output is required for candidate")
        run_candidate(args.stage, args.output, args.run)
    else:
        if not all((args.output, args.reference, args.reference_log,
                    args.reference_profile, args.candidate_profile,
                    args.head, args.report)):
            ap.error("verification needs all exact source/metric/report paths")
        if args.report.exists() or args.report.is_symlink():
            raise ValueError("never replace an existing scientific QA report")
        record = verify(args.reference, args.output, args.stage, args.run,
                        args.head, args.reference_log,
                        args.reference_profile, args.candidate_profile)
        with args.report.open("x", encoding="utf-8") as handle:
            json.dump(record, handle, indent=2, sort_keys=True, allow_nan=False)
            handle.write("\n")
        print("RUC_P3_NATIVE_FULLBUILDER_AB " + json.dumps(record, sort_keys=True),
              flush=True)


if __name__ == "__main__":
    main()
