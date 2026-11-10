#!/usr/bin/env python3
"""Read-only, fail-closed RUC R2 capacity preflight. NEVER authorizes deployment.

Run on an offline, byte-measured R2 object inventory. Free tier is shared across
the Cloudflare account and budget alerts are not a hard stop. No network/secrets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from pathlib import Path

# Deliberately conservative internal planning ceilings, not Cloudflare quotas.
MAX_RUC_STORED_BYTES = 5_000_000_000
MAX_RUC_CLASS_A_MONTH = 250_000
MAX_RUC_CLASS_B_MONTH = 2_000_000
MAX_RUC_WORKER_REQUESTS_DAY = 50_000
MAX_OBJECTS_PER_RUN = 50
SHA40 = re.compile(r"^[a-f0-9]{40}$")
SHA64 = re.compile(r"^[a-f0-9]{64}$")
RUN = re.compile(r"^20\d{2}-\d{2}-\d{2}T\d{2}:00$")
PART = 8 * 1024 * 1024


def load_inventory(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != "mid.ruc.r2.offline-inventory.v1":
        raise ValueError("unrecognized offline inventory schema")
    if not SHA40.fullmatch(str(data.get("stableSha", ""))):
        raise ValueError("missing exact source SHA")
    from datetime import datetime
    run = data.get("run")
    if not isinstance(run, str) or not RUN.fullmatch(run):
        raise ValueError("noncanonical UTC run")
    try:
        if datetime.fromisoformat(run + ":00+00:00").strftime("%Y-%m-%dT%H:%M") != run:
            raise ValueError("invalid UTC run")
    except ValueError as ex:
        raise ValueError("invalid UTC run") from ex
    if data.get("horizonHours") != 27 or data.get("timeCount") != 28:
        raise ValueError("not the full native 0..27h source")
    if data.get("epsMemberCount") != 20 or data.get("nativeEpsMemberObjectsIncluded") is not True:
        raise ValueError("native EPS20 physical objects not fully inventoried")
    if not SHA64.fullmatch(str(data.get("originalSourceProofSha256", ""))):
        raise ValueError("missing original-source attestation reference")
    rows = data.get("objects")
    if not isinstance(rows, list) or not 1 <= len(rows) <= MAX_OBJECTS_PER_RUN:
        raise ValueError("unbounded/missing R2 object inventory")
    keys = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("invalid object descriptor")
        key = row.get("key")
        if (not isinstance(key, str) or key.startswith("/") or
            ".." in Path(key).parts or "\\" in key or "://" in key or key in keys):
            raise ValueError("untrusted/duplicate object key")
        keys.add(key)
        if not isinstance(row.get("bytes"), int) or isinstance(row["bytes"], bool) or row["bytes"] <= 0:
            raise ValueError("unmeasured object bytes")
        if not SHA64.fullmatch(str(row.get("sha256", ""))):
            raise ValueError("unverified object digest")
    return data


def verify_local_bytes(inventory: dict, directory: Path) -> None:
    """Only actual on-disk bytes count. A signed/verified producer is STILL separate."""
    root = directory.resolve(strict=True)
    for item in inventory["objects"]:
        file = (root / item["key"]).resolve(strict=True)
        if not file.is_relative_to(root) or not file.is_file():
            raise ValueError("object path escapes offline inventory root")
        h = hashlib.sha256()
        size = 0
        with file.open("rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                h.update(chunk)
                size += len(chunk)
        if size != item["bytes"] or h.hexdigest() != item["sha256"]:
            raise ValueError("object size or SHA mismatch: " + item["key"])


def projected_class_a_for_object(size: int) -> int:
    """Conservative multipart S3 estimate: create, upload parts, complete."""
    return 1 if size <= PART else 2 + math.ceil(size / PART)


def project_class_b_from_consumer(
    inventory: dict, trace: dict, *, forecast_requests_per_day: int,
    billing_days: int = 31, uncached_metadata_reads: int = 2,
) -> dict:
    """Conservative NO-CACHE full-point demand from an offline native-cell trace.

    Does not prove actual traffic/Worker CPU. Never authorizes R2 billing.
    """
    if type(forecast_requests_per_day) is not int or forecast_requests_per_day < 0:
        raise ValueError("invalid forecast demand")
    if billing_days != 31 or uncached_metadata_reads != 2:
        raise ValueError("noncanonical conservative Class B assumptions")
    if trace.get("schema") != "mid.ruc.r2.offline-consumer-parity.v1":
        raise ValueError("unrecognized consumer evidence schema")
    if (trace.get("run") != inventory.get("run") or
        trace.get("sourceSha") != inventory.get("stableSha") or
        trace.get("allPointBytesMatchOriginal") is not True):
        raise ValueError("consumer evidence source/run/byte proof mismatch")
    cells = trace.get("sampledNativeCells")
    records = trace.get("checkedNativeProductRecords")
    calls = trace.get("simulatedR2RangeReads")
    maximum = trace.get("maxR2ReadsForOneCell")
    if (not isinstance(cells, list) or len(cells) < 7 or
        type(records) is not int or type(calls) is not int or
        type(maximum) is not int or records < len(cells) or
        calls < records or maximum <= 0 or maximum > 50 or
        calls > maximum * len(cells) or
        trace.get("productionApproved") is not False or
        trace.get("r2ActivationAuthorized") is not False):
        raise ValueError("incomplete/untrusted offline consumer trace")
    reads_per_request = maximum + uncached_metadata_reads
    return {
        "assumedNoCache": True,
        "billingDays": billing_days,
        "rangeReadsPerFullPoint": maximum,
        "uncachedMetadataReadsPerRequest": uncached_metadata_reads,
        "totalClassBReadsPerFullPoint": reads_per_request,
        "requestedFullPointForecastsPerDay": forecast_requests_per_day,
        "projectedClassBPerMonth": forecast_requests_per_day * billing_days * reads_per_request,
        "maxFullPointRequestsPerDayWithinInternalClassBBudget":
            MAX_RUC_CLASS_B_MONTH // (billing_days * reads_per_request),
        "accountWideUsageVerified": False,
        "liveCloudflareCpuVerified": False,
        "productionApproved": False,
        "r2ActivationAuthorized": False,
    }


def evaluate(inventory: dict, *, runs_per_month=744, retries=2,
             retained=4, simultaneous_staging=2, projected_reads=None,
             projected_worker_requests_per_day=None, account_usage_verified=False) -> dict:
    if any(type(x) is not int or x < 1 for x in (runs_per_month, retries, retained, simultaneous_staging)):
        raise ValueError("invalid positive integer planning arguments")
    if projected_reads is not None and (type(projected_reads) is not int or projected_reads < 0):
        raise ValueError("invalid Class B read projection")
    if projected_worker_requests_per_day is not None and (
        type(projected_worker_requests_per_day) is not int or projected_worker_requests_per_day < 0
    ):
        raise ValueError("invalid Worker request projection")
    sizes = [row["bytes"] for row in inventory["objects"]]
    run_size = sum(sizes)
    # Includes independent pointer upload and projected metadata/list operations.
    per_run_class_a = sum(projected_class_a_for_object(s) for s in sizes) + 1 + 10
    projected_class_a = per_run_class_a * runs_per_month * retries
    peak_bytes = run_size * (retained + simultaneous_staging)
    blockers = []
    if peak_bytes > MAX_RUC_STORED_BYTES:
        blockers.append("RUC internal storage planning ceiling exceeded")
    if projected_class_a > MAX_RUC_CLASS_A_MONTH:
        blockers.append("RUC internal Class A planning ceiling exceeded")
    if projected_reads is None:
        blockers.append("Class B demand not measured")
    elif projected_reads > MAX_RUC_CLASS_B_MONTH:
        blockers.append("RUC internal Class B planning ceiling exceeded")
    if projected_worker_requests_per_day is None:
        blockers.append("Worker demand not measured")
    elif projected_worker_requests_per_day > MAX_RUC_WORKER_REQUESTS_DAY:
        blockers.append("RUC internal Workers Free planning ceiling exceeded")
    if not account_usage_verified:
        blockers.append("other Cloudflare account usage unverified")
    # No private subscription is activated and no hard account-wide billing cap
    # is available. Do not mistake projections, including green ones, for 0-USD.
    blockers.append("R2 metered billing has no verified hard 0-USD cap")
    return {
        "schema": "mid.ruc.r2.zero-cost-qa.v1",
        "run": inventory["run"],
        "offlineInventoryBytes": run_size,
        "objectsPerRun": len(sizes),
        "projectedPeakStorageBytes": peak_bytes,
        "projectedMonthlyClassA": projected_class_a,
        "projectedMonthlyClassB": projected_reads,
        "projectedWorkersRequestsPerDay": projected_worker_requests_per_day,
        "planningCeilings": {
            "storageBytes": MAX_RUC_STORED_BYTES,
            "classAMonth": MAX_RUC_CLASS_A_MONTH,
            "classBMonth": MAX_RUC_CLASS_B_MONTH,
            "workerRequestsDay": MAX_RUC_WORKER_REQUESTS_DAY,
        },
        "offlineCapacityWithinPlanningCeilings": not any("ceiling exceeded" in x for x in blockers),
        "productionApproved": False,
        "activationAuthorized": False,
        "blockers": blockers,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", required=True, type=Path)
    parser.add_argument("--object-root", required=True, type=Path)
    parser.add_argument("--projected-monthly-reads", type=int)
    parser.add_argument("--projected-worker-requests-day", type=int)
    parser.add_argument("--offline-consumer-report", type=Path)
    parser.add_argument("--forecast-requests-per-day", type=int)
    opts = parser.parse_args()
    try:
        inventory = load_inventory(opts.inventory)
        verify_local_bytes(inventory, opts.object_root)
        consumer_demand = None
        if opts.offline_consumer_report is not None or opts.forecast_requests_per_day is not None:
            if opts.offline_consumer_report is None or opts.forecast_requests_per_day is None:
                raise ValueError("both consumer trace and forecast demand required")
            offline_trace = json.loads(opts.offline_consumer_report.read_text(encoding="utf-8"))
            consumer_demand = project_class_b_from_consumer(
                inventory, offline_trace, forecast_requests_per_day=opts.forecast_requests_per_day)
        class_b = opts.projected_monthly_reads
        worker_day = opts.projected_worker_requests_day
        if consumer_demand is not None:
            class_b = max(class_b or 0, consumer_demand["projectedClassBPerMonth"])
            worker_day = max(worker_day or 0, opts.forecast_requests_per_day)
        result = evaluate(inventory,
                          projected_reads=class_b,
                          projected_worker_requests_per_day=worker_day)
        if consumer_demand is not None:
            result["conservativeConsumerDemand"] = consumer_demand
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"productionApproved": False, "activationAuthorized": False,
                          "errorClass": type(exc).__name__, "reason": str(exc)}, ensure_ascii=False))
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    return 0  # Offline inventory read OK; deliberately NOT a production approval.


if __name__ == "__main__":
    raise SystemExit(main())
