"""One-run, all-109-original DWD ICON-D2-RUC IR10.8 and GSP QA.

Read-only standalone source-science proof, NOT production source admission.
The official DWD catalogue and 48 original late-lead GRIBs from three runs
were already checked independently. This extends the actual ecCodes/bitmap
checks to every native 15-minute frame of ONE coherent model run only.

No WMO 4677 code synthesis, observation claims, interpolation, renderer,
worker writes, publication, release authorization, or arbitrary URL fetches.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path
from urllib.request import Request, build_opener

import ir108_original_probe as ir
from original_15min_phase_gate import RATE_PARAMETERS, inspect_rate_grib
from qa_ruc_original_horizon_inventory import (
    PRODUCTS, DenyRedirect, HorizonInventoryError, canonical_run,
    discover_recent, source_url,
)
from qa_ruc_late_originals import (
    IR_PRODUCT, LateOriginalError, diagnostic_ir_27h, verify_decoded,
)

SCHEMA = "mid.ruc.ir108-gsp-full-109-original-grib-qa.v1"
FRAME_COUNT = 109
STEP_MINUTES = 15
LAST_LEAD = 1620
MAX_ORIGINAL_BYTES = 8 * 1024 * 1024
# Upper bound is deliberately below the total budget for all model sources;
# scripts cannot be re-used as an unbounded general-purpose downloader.
MAX_TOTAL_BYTES = 384 * 1024 * 1024
MAX_DOWNLOAD_WORKERS = 3

class FullOriginalError(ValueError):
    pass

def filename_at(minute: int) -> str:
    if type(minute) is not int or not 0 <= minute <= LAST_LEAD or minute % STEP_MINUTES:
        raise FullOriginalError("noncanonical 0..27h quarter-hour original")
    return f"PT{minute // 60:03d}H{minute % 60:02d}M.grib2"

def full_plan(catalogue: dict) -> tuple[str, dict[str, list[dict]]]:
    if (not isinstance(catalogue, dict)
            or catalogue.get("catalogue27hQualified") is not True
            or catalogue.get("qualifiedRunCount") != 3):
        raise FullOriginalError("three official complete source-run catalogues required")
    runs = catalogue.get("runs")
    if not isinstance(runs, list) or len(runs) != 3:
        raise FullOriginalError("exactly three source runs required before full GRIB admission")
    run = runs[0]["run"]
    canonical_run(run)
    if len({r.get("run") for r in runs}) != 3:
        raise FullOriginalError("duplicate original model runs")
    for item in runs:
        canonical_run(item["run"])
        if (item.get("completeFourProduct27hCatalogue") is not True
                or set(item.get("products", {})) != set(PRODUCTS)
                or any(item["products"][p].get("complete0To27h") is not True
                       for p in PRODUCTS)):
            raise FullOriginalError("incomplete or foreign source product")
    plan = {}
    for product in PRODUCTS:
        plan[product] = [
            {"run": run, "product": product, "leadMinutes": minute,
             "name": filename_at(minute),
             "url": source_url(product, run) + filename_at(minute)}
            for minute in range(0, LAST_LEAD+1, STEP_MINUTES)
        ]
    if (len(plan) != 4 or any(len(rows) != FRAME_COUNT for rows in plan.values())
            or len({(x["product"], x["leadMinutes"]) for v in plan.values() for x in v})
               != FRAME_COUNT * len(PRODUCTS)):
        raise FullOriginalError("not exactly 436 unique original GRIB source identities")
    return run, plan

def bounded_download(item: dict) -> bytes:
    """Four exact products and canonical URL/run/lead; no redirect allowed."""
    original = source_url(item["product"], item["run"]) + filename_at(item["leadMinutes"])
    if item.get("url") != original or item.get("name") != filename_at(item["leadMinutes"]):
        raise FullOriginalError("untrusted DWD source URL/lead in full-run plan")
    with build_opener(DenyRedirect()).open(
            Request(original, headers={"User-Agent": "MID-full-109-readonly-QA/1.0"}),
            timeout=30) as response:
        if response.geturl() != original or getattr(response, "status", 200) != 200:
            raise FullOriginalError("foreign or redirected original DWD response")
        length = response.headers.get("Content-Length")
        try:
            declared = int(length) if length is not None else None
        except ValueError as exc:
            raise FullOriginalError("invalid DWD Content-Length") from exc
        if declared is not None and not 80 <= declared <= MAX_ORIGINAL_BYTES:
            raise FullOriginalError("original GRIB declared source size exceeded")
        raw = response.read(MAX_ORIGINAL_BYTES + 1)
    if (not 80 <= len(raw) <= MAX_ORIGINAL_BYTES
            or (declared is not None and len(raw) != declared)
            or raw[:4] != b"GRIB" or raw[-4:] != b"7777"):
        raise FullOriginalError("missing, corrupted, truncated or oversized DWD GRIB")
    return raw

def admit_original(item: dict, raw: bytes) -> dict:
    if not 80 <= len(raw) <= MAX_ORIGINAL_BYTES:
        raise FullOriginalError("invalid original GRIB byte budget")
    digest = hashlib.sha256(raw).hexdigest()
    # No source file or manifest escapes this ephemeral job directory.
    with tempfile.TemporaryFile(mode="w+b") as original:
        original.write(raw)
        original.flush()
        original.seek(0)
        if hashlib.sha256(original.read()).hexdigest() != digest:
            raise FullOriginalError("local immutable GRIB digest check failed")
        original.seek(0)
        # Native public auditors take a Path, so isolate one file in a temporary
        # directory (per-product cleanup even on exceptions).
        with tempfile.TemporaryDirectory(prefix="mid-one-grib-qa-") as folder:
            path = Path(folder) / item["name"]
            path.write_bytes(raw)
            if item["product"] == IR_PRODUCT:
                with diagnostic_ir_27h():
                    decoded = ir.inspect_local_grib(path, item["run"], audit_values=True)
            else:
                decoded = inspect_rate_grib(path, item["product"], item["run"])
            if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
                raise FullOriginalError("original GRIB mutated during source decoding")
    evidence = verify_decoded(item, decoded)
    return {
        "run": item["run"], "product": item["product"],
        "leadMinutes": item["leadMinutes"], "valid": decoded["valid"],
        "sha256": digest, "bytes": len(raw),
        "nativePoints": ir.NATIVE_GRID[3],
        **evidence,
    }

def summarize_product(product: str, records: list[dict]) -> dict:
    if len(records) != FRAME_COUNT or [r["leadMinutes"] for r in records] != list(
            range(0, LAST_LEAD+1, STEP_MINUTES)):
        raise FullOriginalError("missing, shifted or reordered native GRIB original")
    if len({r["sha256"] for r in records}) != FRAME_COUNT:
        raise FullOriginalError("distinct quarter-hour originals have duplicate raw SHA")
    missing = [r["missingCells"] for r in records]
    if any(type(v) is not int or v < 0 or v >= ir.NATIVE_GRID[3] for v in missing):
        raise FullOriginalError("missing native raster bitmap/NoData counts")
    # No implicit bitmap drift across a source run. A future legitimate DWD
    # domain change must be explicitly recalibrated, not silently resampled.
    if len(set(missing)) != 1:
        raise FullOriginalError("inconsistent native DWD bitmap coverage over forecast leads")
    digest = hashlib.sha256("\n".join(
        f'{r["leadMinutes"]}:{r["sha256"]}' for r in records
    ).encode("ascii")).hexdigest()
    output = {
        "originalFrames": len(records),
        "firstValid": records[0]["valid"],
        "lastValid": records[-1]["valid"],
        "lastLeadMinutes": LAST_LEAD,
        "missingNativeCellsPerOriginal": missing[0],
        "sha256OfOrderedOriginalSHA256List": digest,
        "originalBytes": sum(r["bytes"] for r in records),
        "extremesSmoothed": False,
        "missingConvertedToZero": False,
    }
    if product == IR_PRODUCT:
        output.update({
            "unit": "K",
            "minimumOriginalBrightnessKelvin": min(r["originalMinimumKelvin"] for r in records),
            "maximumOriginalBrightnessKelvin": max(r["originalMaximumKelvin"] for r in records),
            "spectralIdentity": "GRIB2_PDT32_SEVIRI_IR10.8",
        })
    else:
        output.update({
            "unit": "kg m-2 s-1", "stepType": "instant",
            "maximumOriginalRateKgM2S": max(r["maximumOriginalRateKgM2S"] for r in records),
            "isOfficialWmoWeatherCode": False,
        })
    return output

def qualify_full_run(catalogue: dict, *, downloader=bounded_download,
                     decoder=admit_original) -> dict:
    run, planned = full_plan(catalogue)
    products, total = {}, 0
    for product, plan in planned.items():
        records = []
        # Bounded parallel source reads only; ecCodes decoding remains
        # serialized in this thread because its native library is stateful.
        with ThreadPoolExecutor(max_workers=MAX_DOWNLOAD_WORKERS) as pool:
            for item, raw in zip(plan, pool.map(downloader, plan)):
                total += len(raw)
                if total > MAX_TOTAL_BYTES:
                    raise FullOriginalError("full-run native GRIB transfer exceeds 384 MiB")
                row = decoder(item, raw)
                if row.get("product") != product or row.get("run") != run:
                    raise FullOriginalError("decoded original GRIB source identity differs")
                records.append(row)
                if len(records) % 27 == 0 or len(records) == FRAME_COUNT:
                    print(f'MID real original {run} {product}: '
                          f'{len(records)}/{FRAME_COUNT} ecCodes + native bitmap admitted',
                          flush=True)
        products[product] = summarize_product(product, records)
    count = sum(r["originalFrames"] for r in products.values())
    if count != FRAME_COUNT * len(PRODUCTS) or set(products) != set(PRODUCTS):
        raise FullOriginalError("not all 436 native GRIB originals admitted")
    if len({(r["firstValid"], r["lastValid"]) for r in products.values()}) != 1:
        raise FullOriginalError("four original products have mismatched absolute UTC axes")
    return {
        "schema": SCHEMA, "run": run,
        "originalsDecodedWithEcCodes": count,
        "allFourProduct109FrameNativeOriginals": True,
        "nativePointsPerOriginal": ir.NATIVE_GRID[3],
        "originalSourceBytes": total,
        "products": products,
        "qualificationScope": "ONE_MODEL_RUN_FULL_27H_ALL_FOUR_NATIVE_FIELDS",
        "otherRunsFullOriginalBytesVerified": False,
        "nativeLookupVerified": False,
        "rendererVerified": False,
        "browserOrIosVerified": False,
        "isObservedSatelliteImage": False,
        "isOfficialWmoWeatherCode": False,
        "activationAuthorized": False, "releaseAuthorized": False,
    }

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lookback-hours", type=int, default=10)
    opts = parser.parse_args()
    try:
        inventory = discover_recent(opts.lookback_hours)
        report = qualify_full_run(inventory)
    except (FullOriginalError, LateOriginalError, HorizonInventoryError,
            ValueError, TypeError, KeyError, OSError, RuntimeError) as exc:
        print(json.dumps({"schema": SCHEMA, "result": "BLOCKED",
                          "activationAuthorized": False, "releaseAuthorized": False,
                          "error": str(exc)}, sort_keys=True))
        raise SystemExit(1) from None
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    print("REAL_ONE_RUN_436_ORIGINAL_GRIBS_ECCODES_PASS; NO RENDERER / PRODUCTION APPROVAL")

if __name__ == "__main__":
    main()
