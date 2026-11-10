#!/usr/bin/env python3
"""Offline-only: assess Cloudflare Workers Free SQLite Durable Objects for MID RUC.

This DOES NOT create/activate a Durable Object, deploy Worker code, charge a
Cloudflare account, assert actual SQLite size, or authorize production. Based
on the immutable 27h/EPS20 lossless R2-QA inventory, not the R2 service.
"""
from __future__ import annotations
import argparse
import json
import math
import re
import sqlite3
from pathlib import Path
from ruc_r2_zero_cost_qa import load_inventory

# Documented Workers Free DO limits (verify on actual account before release):
FREE_ACCOUNT_STORAGE = 5_000_000_000
FREE_ONE_OBJECT_STORAGE = 1_000_000_000
FREE_ROWS_WRITTEN_DAY = 100_000
FREE_ROWS_READ_DAY = 5_000_000
FREE_DO_REQUESTS_DAY = 100_000
# Conservative internal safety margins, NOT guaranteed actual SQLite overhead.
MID_ACCOUNT_BUDGET = 4_500_000_000
MID_RUN_OBJECT_BUDGET = 900_000_000
SQL_BLOB_PAGE_BYTES = 4_000_000   # lower than official max 8 MB SQLite BLOB
SQLITE_ASSUMED_OVERHEAD_PERCENT = 15
RETAINED_RUNS = 4
MAX_OVERLAPPING_WRITERS = 1       # requires serialized, fenced staging
DAILY_CYCLES = 24
UPLOAD_ATTEMPTS = 2
SHA40 = re.compile(r"^[a-f0-9]{40}$")
RUN = re.compile(r"^20\d{2}-\d{2}-\d{2}T\d{2}:00$")


def capacity(inventory: dict) -> dict:
    if inventory.get("schema") != "mid.ruc.r2.offline-inventory.v1":
        raise ValueError("untrusted source inventory schema")
    if inventory.get("horizonHours") != 27 or inventory.get("timeCount") != 28:
        raise ValueError("RUC native 27h is missing")
    if inventory.get("epsMemberCount") != 20 or inventory.get("nativeEpsMemberObjectsIncluded") is not True:
        raise ValueError("native EPS20 source is incomplete")
    if not SHA40.fullmatch(str(inventory.get("stableSha", ""))) or not RUN.fullmatch(str(inventory.get("run", ""))):
        raise ValueError("missing exact source identity")
    objects = inventory.get("objects")
    if not isinstance(objects, list) or not 1 <= len(objects) <= 50:
        raise ValueError("incomplete objects")
    if any(type(o.get("bytes")) is not int or o["bytes"] <= 0 for o in objects):
        raise ValueError("unmeasured object bytes")
    source_bytes = sum(o["bytes"] for o in objects)
    # 4 MB SQLite BLOB pages; the original independent 128KiB zlib
    # frames remain byte-for-byte inside each page (NO recompression).
    rows_per_run = sum(math.ceil(o["bytes"] / SQL_BLOB_PAGE_BYTES) for o in objects)
    rows_day = rows_per_run * DAILY_CYCLES * UPLOAD_ATTEMPTS
    one_db_physical_estimate = math.ceil(source_bytes * (100 + SQLITE_ASSUMED_OVERHEAD_PERCENT) / 100)
    all_db_physical_estimate = one_db_physical_estimate * (RETAINED_RUNS + MAX_OVERLAPPING_WRITERS)
    blockers = []
    if one_db_physical_estimate >= MID_RUN_OBJECT_BUDGET or one_db_physical_estimate >= FREE_ONE_OBJECT_STORAGE:
        blockers.append("per-run SQLite DO estimate exceeds safety capacity")
    if all_db_physical_estimate >= MID_ACCOUNT_BUDGET or all_db_physical_estimate >= FREE_ACCOUNT_STORAGE:
        blockers.append("account SQLite DO storage estimate exceeds safety capacity")
    if rows_day >= FREE_ROWS_WRITTEN_DAY // 4:
        blockers.append("projected daily SQLite rows written exceed 25% quota margin")
    # Missing measurements are fatal to any deployment, not to read-only
    # physical-size and daily row-count calculations.
    blockers.extend([
        "actual SQLite page/WAL/index/compaction peaks not measured",
        "actual Free account/other DO/Worker usage not verified",
        "native producer ingestion, network and workload not verified",
        "cross-DO immutable run read/admission and single-writer fencing not qualified",
        "real Workers CPU/point APIs and end-client parity not qualified",
        "Cloudflare Free-only billing/fail-on-limit account gate not verified",
    ])
    return {
        "schema": "mid.ruc.do-free.offline-capacity.v1",
        "run": inventory["run"], "sourceSha": inventory["stableSha"],
        "sourceBytesPerRun": source_bytes, "sourceObjectCount": len(objects),
        "sqliteBlobRowMaxBytes": SQL_BLOB_PAGE_BYTES,
        "sqliteRowsPerRun": rows_per_run,
        "estimatedRowsWrittenDayAt24RunsTwoAttempts": rows_day,
        "retainedRuns": RETAINED_RUNS, "simultaneousStagingRuns": MAX_OVERLAPPING_WRITERS,
        "estimatedPhysicalBytesPerRunIncluding15PctReserve": one_db_physical_estimate,
        "estimatedAccountPeakBytesIncluding15PctReserve": all_db_physical_estimate,
        "officialFreeAccountStorageBytes": FREE_ACCOUNT_STORAGE,
        "officialFreePerDurableObjectBytes": FREE_ONE_OBJECT_STORAGE,
        "estimatedWithinInternalPlanningEnvelope":
            not any("exceeds safety capacity" in reason or "quota margin" in reason for reason in blockers),
        "zeroExtraCostActivated": False,
        "productionApproved": False,
        "activationAuthorized": False,
        "blockers": blockers,
    }


def prepare_simulated_coordinator(conn: sqlite3.Connection) -> None:
    """SQLite transaction fixture; NOT a Cloudflare DO transactionSync proof."""
    conn.execute("CREATE TABLE IF NOT EXISTS active (id INTEGER PRIMARY KEY CHECK(id=1), generation INTEGER NOT NULL, run TEXT NOT NULL, digest TEXT NOT NULL)")
    conn.commit()


def simulated_cas(conn: sqlite3.Connection, *, expected_generation: int,
                  run: str, digest: str, original_verified: bool,
                  all_immutable_objects_present: bool) -> int:
    """No stale writer can replace last-good. Never accepts caller-only proof."""
    if (not original_verified or not all_immutable_objects_present or
        not RUN.fullmatch(run) or not re.fullmatch(r"[a-f0-9]{64}", digest)):
        raise ValueError("source proof, complete immutable run, UTC and SHA required")
    try:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT generation,run FROM active WHERE id=1").fetchone()
        generation, previous_run = (int(row[0]), row[1]) if row else (0, "")
        if generation != expected_generation or (previous_run and run <= previous_run):
            raise ValueError("stale writer or non-monotonic model run")
        conn.execute(
            "INSERT INTO active(id,generation,run,digest) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET generation=excluded.generation,run=excluded.run,digest=excluded.digest",
            (generation + 1, run, digest))
        conn.commit()
        return generation + 1
    except Exception:
        conn.rollback()
        raise


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--inventory", type=Path, required=True)
    a = p.parse_args()
    try:
        inv = load_inventory(a.inventory)
        result = capacity(inv)
    except (OSError, ValueError, TypeError, json.JSONDecodeError) as e:
        print(json.dumps({"activationAuthorized": False, "productionApproved": False,
                          "errorClass": type(e).__name__, "reason": str(e)}))
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0  # This means offline sizing only. Activation always forbidden.


if __name__ == "__main__":
    raise SystemExit(main())
