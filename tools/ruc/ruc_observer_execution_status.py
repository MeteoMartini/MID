#!/usr/bin/env python3
"""Classify each real MID RUC observer execution, including release-drift skips.

GitHub Actions 'success' alone does not mean that DWD/Pages/Worker were sampled.
This artifact is strictly observational, never authorizes GRIB, EPS or SLO.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re

SHA = re.compile(r"^[0-9a-f]{40}$")
RUN = re.compile(r"^20\\d\\d-\\d\\d-\\d\\dT\\d\\d:00$")
DIRECTORY = "mid.ruc.dwd-directory-observation.v1"
READBACK = "mid.ruc.e2e-readback-shadow.v1"
SCHEMA = "mid.ruc.observer-execution.v1"


def timestamp(value):
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("missing canonical UTC Z observation clock")
    dt = datetime.fromisoformat(value[:-1] + "+00:00")
    if dt.utcoffset().total_seconds() != 0 or dt > datetime.now(timezone.utc):
        raise ValueError("invalid or future observation clock")
    return dt


def classify(*, event_id, attempt, lineage_ready, checkout_sha=None,
             main_sha=None, stable_sha=None, directory=None, readback=None):
    if (type(event_id) is not int or event_id < 1 or
            type(attempt) is not int or attempt < 1):
        raise ValueError("invalid GitHub Actions event provenance")
    if lineage_ready not in ("true", "false", ""):
        raise ValueError("untrusted release lineage result")
    shas = (checkout_sha, main_sha, stable_sha)
    if any(value and not SHA.fullmatch(str(value)) for value in shas):
        raise ValueError("malformed source SHA")
    sha_consensus = (all(shas) and len(set(shas)) == 1)
    ready = lineage_ready == "true" and bool(sha_consensus)
    if lineage_ready == "true" and not ready:
        raise ValueError("observer ready but source SHA consensus unverified")

    result = {
        "schema": SCHEMA, "runId": event_id, "runAttempt": attempt,
        "checkoutSha": checkout_sha or None, "mainSha": main_sha or None,
        "stableSha": stable_sha or None, "lineageReady": ready,
        "result": "release-drift-or-unverified-lineage",
        "directorySamples": 0, "directoryObserved": False,
        "pagesObservedValid": False, "workerObservedValid": False,
        "sameRunObserved": False, "publicReadbackCaptured": False,
        "gribHeaderOrValuesVerified": False, "eps20ValuesVerified": False,
        "realClientAdoptionVerified": False, "firstDwdPublicationInstantVerified": False,
        "productionSloAuthorized": False, "publicationAuthorized": False,
    }
    dirpath = Path(directory) if directory else None
    rbpath = Path(readback) if readback else None
    if not ready:
        if (dirpath is not None and dirpath.is_file()) or (rbpath is not None and rbpath.is_file()):
            raise ValueError("untrusted files exist after release-lineage skip")
        return result

    result["result"] = "missing-directory-evidence"
    if dirpath is None or not dirpath.is_file():
        return result
    lines = [line for line in dirpath.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not 1 <= len(lines) <= 3:
        raise ValueError("unexpected DWD directory sample count")
    recorded = set()
    for line in lines:
        row = json.loads(line)
        if not isinstance(row, dict) or row.get("schema") != DIRECTORY:
            raise ValueError("invalid DWD directory sample schema")
        run = row.get("run")
        if not isinstance(run, str) or not RUN.fullmatch(run):
            raise ValueError("noncanonical DWD run")
        valid = datetime.strptime(run, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
        if valid.strftime("%Y-%m-%dT%H:%M") != run or timestamp(row.get("observedAtUtc")) < valid:
            raise ValueError("DWD sample before model run")
        if run in recorded:
            raise ValueError("same DWD model run sampled twice in one polling event")
        recorded.add(run)
        if not isinstance(row.get("stages"), dict) or not isinstance(row.get("eps"), dict):
            raise ValueError("invalid DWD directory stage inventory")
    result["directorySamples"] = len(lines)
    result["directoryObserved"] = True
    result["result"] = "directory-only-no-public-readback"
    if rbpath is None or not rbpath.is_file():
        return result
    row = json.loads(rbpath.read_text(encoding="utf-8"))
    if not isinstance(row, dict) or row.get("schema") != READBACK:
        raise ValueError("invalid public readback schema")
    timestamp(row.get("observedAtUtc"))
    for flag in ("pagesValid", "workerValid", "sameRun"):
        if type(row.get(flag)) is not bool:
            raise ValueError("missing explicit public readback validation flag")
    if row["sameRun"] and (not row["pagesValid"] or not row["workerValid"] or
                           row.get("pagesRun") != row.get("workerRun")):
        raise ValueError("contradictory published run claim")
    result["publicReadbackCaptured"] = True
    result["pagesObservedValid"] = row["pagesValid"]
    result["workerObservedValid"] = row["workerValid"]
    result["sameRunObserved"] = row["sameRun"]
    result["result"] = ("directory-and-pages-worker-observed" if row["sameRun"]
                        else "directory-with-partial-public-readback")
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--run-id", type=int, required=True)
    p.add_argument("--attempt", type=int, required=True)
    p.add_argument("--lineage-ready", required=True)
    p.add_argument("--checkout-sha", default="")
    p.add_argument("--main-sha", default="")
    p.add_argument("--stable-sha", default="")
    p.add_argument("--directory", default="")
    p.add_argument("--readback", default="")
    p.add_argument("--output", type=Path, required=True)
    a = p.parse_args()
    evidence = classify(event_id=a.run_id, attempt=a.attempt,
                        lineage_ready=a.lineage_ready, checkout_sha=a.checkout_sha,
                        main_sha=a.main_sha, stable_sha=a.stable_sha,
                        directory=a.directory, readback=a.readback)
    with a.output.open("x", encoding="utf-8") as out:
        json.dump(evidence, out, ensure_ascii=False, sort_keys=True, allow_nan=False)
        out.write("\\n")
    print("MID RUC observer execution evidence: " + json.dumps(evidence, sort_keys=True))


if __name__ == "__main__":
    main()
