#!/usr/bin/env python3
"""Read-only accounting of actual RUC EPS20 builder markers from one workflow log.

This parser never authenticates GitHub, original GRIB bytes, or publication.
The caller-supplied IDs are labels, NOT independently verified identities.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re

PHASE = re.compile(r"RUC_P3_PHASES run=(\S+) download_stage_seconds=(\S+) native_builder_seconds=(\S+)")
MARKER = "RUC_P3_EPS_TIMINGS "
MODEL_RUN = re.compile(r"20\d{2}-\d{2}-\d{2}T\d{2}:00")
SOURCE_SHA = re.compile(r"[a-f0-9]{40}")
FIELDS = frozenset(("schema", "chunks", "points", "validTimes", "members",
                    "memberPackWriteSeconds", "epsSummarySeconds", "summaryPackWriteSeconds"))
DURATIONS = ("memberPackWriteSeconds", "epsSummarySeconds", "summaryPackWriteSeconds")


def seconds(value):
    if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
        raise ValueError("invalid negative/nonfinite/non-numeric timing")
    return float(value)


def assess(log: str, *, workflow_run_id: int, head_sha: str, model_run: str) -> dict:
    if type(workflow_run_id) is not int or workflow_run_id <= 0:
        raise ValueError("invalid workflow run ID")
    if not isinstance(head_sha, str) or not SOURCE_SHA.fullmatch(head_sha):
        raise ValueError("invalid supplied source identity")
    if not isinstance(model_run, str) or not MODEL_RUN.fullmatch(model_run):
        raise ValueError("invalid model initialization")
    timestamp = datetime.strptime(model_run, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
    if timestamp.strftime("%Y-%m-%dT%H:%M") != model_run:
        raise ValueError("invalid model timestamp")
    if not isinstance(log, str) or len(log) > 25_000_000:
        raise ValueError("missing or unbounded job log")
    phase_rows, eps_rows = [], []
    for line in log.splitlines():
        if "RUC_P3_PHASES " in line:
            match = PHASE.search(line)
            if match is None:
                raise ValueError("malformed RUC phase marker")
            phase_rows.append(match.groups())
        if MARKER in line:
            raw = line.split(MARKER, 1)[1].strip()
            if len(raw) > 1024:
                raise ValueError("oversized EPS marker")
            eps_rows.append(json.loads(raw))
    if len(phase_rows) != 1 or len(eps_rows) != 1:
        raise ValueError("expected one phase and one EPS marker from one completed build")
    run, download_raw, builder_raw = phase_rows[0]
    if run != model_run:
        raise ValueError("model run mismatch")
    download, builder = seconds(float(download_raw)), seconds(float(builder_raw))
    eps = eps_rows[0]
    if not isinstance(eps, dict) or set(eps) != FIELDS or eps["schema"] != "mid.ruc.p3-eps-timings.v1":
        raise ValueError("unknown EPS timing schema or fields")
    counts = ("chunks", "points", "validTimes", "members")
    if any(type(eps[key]) is not int or eps[key] <= 0 for key in counts):
        raise ValueError("invalid native EPS dimensions")
    if eps["points"] != 542040 or eps["members"] != 20 or eps["validTimes"] != 28:
        raise ValueError("full native 27h / EPS20 / 542040-point scope unverified")
    if eps["chunks"] != math.ceil(eps["points"] / 4096):
        raise ValueError("native chunk count does not match production 4096-point contract")
    amounts = {key: seconds(eps[key]) for key in DURATIONS}
    total = sum(amounts.values())
    if total > builder + 2.0:
        raise ValueError("EPS nested processing exceeds total native builder wall time")
    if builder <= 0:
        raise ValueError("nonpositive native builder duration")
    return {
        "schema": "mid.ruc.p3-native-phase-audit.v1",
        "workflowRunIdClaim": workflow_run_id,
        "sourceShaClaim": head_sha,
        "modelRunUtc": model_run,
        "fullNativeShapeInLog": True,
        "downloadStageSeconds": round(download, 6),
        "nativeBuilderSeconds": round(builder, 6),
        "eps": {**eps, "timedTotalSeconds": round(total, 6),
                "fractionOfNativeBuilder": round(total / builder, 6)},
        "builderTimeOutsideMeasuredEpsSectionsSeconds": round(max(0.0, builder - total), 6),
        "realOriginalLogInputProvided": True,
        "githubRunShaIndependentlyVerified": False,
        "originalGribInputsShaIdentical": False,
        "cpuRamAndPhysicalPagesBudgetVerified": False,
        "sameInputReferenceVsCandidateAbVerified": False,
        "productionSpeedupOrFreshnessSloAuthorized": False,
        "evidenceLimit": "caller-supplied log/IDs, no GitHub/API authentication or original GRIB readback",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--job-log", required=True, type=Path)
    parser.add_argument("--workflow-run-id", required=True, type=int)
    parser.add_argument("--head-sha", required=True)
    parser.add_argument("--model-run", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    result = assess(args.job_log.read_text(encoding="utf-8"),
                    workflow_run_id=args.workflow_run_id,
                    head_sha=args.head_sha, model_run=args.model_run)
    with args.output.open("x", encoding="utf-8") as file:
        json.dump(result, file, indent=2, sort_keys=True, allow_nan=False)
        file.write("\n")
    print("Read-only P3 timing accounting: NO original GRIB A/B or SLO admission")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
