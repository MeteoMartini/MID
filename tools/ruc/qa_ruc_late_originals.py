"""PRIVATE, read-only late-lead DWD ICON-D2-RUC original-GRIB boundary QA.

Deliberately separate from all 0..14h production/shadow source admission.
Tests native 14:00, 14:15, 26:45 and 27:00 originals from three exact
official runs. Catalogue claims are not original-byte evidence.
No rendering, image publishing, WMO WW synthesis or application activation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import tempfile
from contextlib import contextmanager
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch
from urllib.request import Request, build_opener

import ir108_original_probe as ir
from original_15min_phase_gate import inspect_rate_grib, RATE_PARAMETERS
from qa_ruc_original_horizon_inventory import (
    PRODUCTS, DenyRedirect, HorizonInventoryError, canonical_run,
    discover_recent, fetch_inventory, source_url,
)

SCHEMA = "mid.ruc.ir108-gsp-late-original-boundary-qa.v1"
LEADS_MINUTES = (840, 855, 1605, 1620)
MAX_FILE_BYTES = 8 * 1024 * 1024
MAX_TOTAL_BYTES = 160 * 1024 * 1024
IR_PRODUCT = "SYNMSG_BT_CL_IR10.8"

class LateOriginalError(ValueError):
    pass

def filename(lead_minutes: int) -> str:
    if type(lead_minutes) is not int or lead_minutes not in LEADS_MINUTES:
        raise LateOriginalError("only four exact, predeclared late-lead boundaries permitted")
    return f"PT{lead_minutes // 60:03d}H{lead_minutes % 60:02d}M.grib2"

def make_plan(catalogue_report: dict) -> list[dict]:
    if (not isinstance(catalogue_report, dict)
            or catalogue_report.get("catalogue27hQualified") is not True
            or catalogue_report.get("qualifiedRunCount") != 3
            or catalogue_report.get("activationAuthorized") is not False):
        raise LateOriginalError("three independent complete 27h original inventories required")
    runs = catalogue_report.get("runs")
    if not isinstance(runs, list) or len(runs) != 3:
        raise LateOriginalError("exactly three source runs required")
    output, seen = [], set()
    for item in runs:
        run = item["run"]
        canonical_run(run)
        if run in seen or item.get("completeFourProduct27hCatalogue") is not True:
            raise LateOriginalError("duplicate or incomplete original DWD source run")
        seen.add(run)
        if set(item.get("products", {})) != set(PRODUCTS):
            raise LateOriginalError("wrong four-product original source inventory")
        for product in PRODUCTS:
            product_report = item["products"][product]
            if (product_report.get("complete0To27h") is not True
                    or product_report.get("term14h15Present") is not True
                    or product_report.get("term27h00Present") is not True
                    or product_report.get("term27h15Present") is not False):
                raise LateOriginalError("original boundary catalogue not fully qualified")
            for lead in LEADS_MINUTES:
                name = filename(lead)
                output.append({"run": run, "product": product, "leadMinutes": lead,
                               "name": name, "url": source_url(product, run) + name})
    if len(output) != 48:
        raise LateOriginalError("expected exactly 48 native original boundary files")
    return output

def fetch_original(item: dict, opener=None) -> bytes:
    """Network target is constructed, never supplied as an arbitrary URL."""
    expected = source_url(item["product"], item["run"]) + filename(item["leadMinutes"])
    if item.get("url") != expected:
        raise LateOriginalError("unexpected source URL/product/run/lead")
    opener = opener or build_opener(DenyRedirect())
    with opener.open(Request(expected, headers={"User-Agent": "MID-RUC-late-GRIB-QA/1.0"}),
                     timeout=20) as response:
        if response.geturl() != expected or getattr(response, "status", 200) != 200:
            raise LateOriginalError("unexpected DWD source redirect or HTTP status")
        declared = response.headers.get("Content-Length")
        try:
            length = int(declared) if declared is not None else None
        except ValueError as exc:
            raise LateOriginalError("invalid original Content-Length") from exc
        if length is not None and not 80 <= length <= MAX_FILE_BYTES:
            raise LateOriginalError("original GRIB Content-Length outside budget")
        raw = response.read(MAX_FILE_BYTES + 1)
    if not 80 <= len(raw) <= MAX_FILE_BYTES or (length is not None and len(raw) != length):
        raise LateOriginalError("truncated or oversized actual original GRIB")
    if raw[:4] != b"GRIB" or raw[-4:] != b"7777":
        raise LateOriginalError("source does not have a complete original GRIB envelope")
    return raw

@contextmanager
def diagnostic_ir_27h():
    """Only the *private QA process* may ask the tested IR decoder about 27h.

    The canonical 14h source-admission code and all files stay unchanged;
    production code must NEVER import this context manager.
    """
    if ir.MAX_LEAD_SECONDS != 14 * 3600:
        raise LateOriginalError("canonical production IR limit changed unexpectedly")
    with patch.object(ir, "MAX_LEAD_SECONDS", 27 * 3600):
        yield
    if ir.MAX_LEAD_SECONDS != 14 * 3600:
        raise LateOriginalError("original IR 14h guard not restored")

def verify_decoded(item: dict, original: dict) -> dict:
    """Fail closed on source time, grid, channel, units and unaltered extrema."""
    lead = item["leadMinutes"]
    run = item["run"]
    valid = (canonical_run(run) + timedelta(minutes=lead)).strftime("%Y-%m-%dT%H:%M:%SZ")
    if (original.get("run") != run or original.get("valid") != valid
            or original.get("leadSeconds") != lead * 60):
        raise LateOriginalError("GRIB initialization, original lead or UTC valid-time mismatch")
    if item["product"] == IR_PRODUCT:
        if (original.get("channelIdentity") != "DWD_PDT32_SEVIRI_IR108_SPECTRAL_MATCH"
                or original.get("valueAndMissingQuality") != "NATIVE_BITMAP_AND_KELVIN_AUDITED"
                or original.get("points") != ir.NATIVE_GRID[3]
                or original.get("unit") != "K"):
            raise LateOriginalError("uncertified IR10.8 spectral/bitmap/native-grid identity")
        values = original.get("brightnessKelvinAudit", {})
        if (values.get("nativeCells") != ir.NATIVE_GRID[3]
                or values.get("validCells", 0) <= 0
                or values.get("missingConvertedToZero") is not False
                or values.get("extremesSmoothed") is not False):
            raise LateOriginalError("IR10.8 native Kelvin extrema/missing evidence absent")
        return {"missingCells": values["missingCells"],
                "originalMinimumKelvin": values["rawMinimumKelvin"],
                "originalMaximumKelvin": values["rawMaximumKelvin"]}
    if (item["product"] not in RATE_PARAMETERS
            or original.get("nativePoints") != ir.NATIVE_GRID[3]
            or original.get("unit") != "kg m-2 s-1"
            or original.get("stepType") != "instant"
            or original.get("isOfficialWmoWeatherCode") is not False):
        raise LateOriginalError("foreign/incomplete GSP original rate identity")
    values = original.get("nativeValues", {})
    if (values.get("validCells", 0) <= 0
            or "missingCells" not in values
            or "maximumOriginalRateKgM2S" not in values):
        raise LateOriginalError("missing native rate bitmap/true intensity audit")
    return {"missingCells": values["missingCells"],
            "maximumOriginalRateKgM2S": values["maximumOriginalRateKgM2S"]}

def qualify_one(item: dict, opener=None) -> dict:
    raw = fetch_original(item, opener)
    digest = hashlib.sha256(raw).hexdigest()
    with tempfile.TemporaryDirectory(prefix="mid-late-grib-readonly-") as directory:
        path = Path(directory) / filename(item["leadMinutes"])
        path.write_bytes(raw)
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise LateOriginalError("original GRIB SHA mismatch after private staging")
        if item["product"] == IR_PRODUCT:
            with diagnostic_ir_27h():
                decoded = ir.inspect_local_grib(path, item["run"], audit_values=True)
        else:
            decoded = inspect_rate_grib(path, item["product"], item["run"])
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise LateOriginalError("original GRIB changed during ecCodes decode")
    details = verify_decoded(item, decoded)
    return {"run": item["run"], "product": item["product"],
            "valid": decoded["valid"], "leadMinutes": item["leadMinutes"],
            "sourceUrl": item["url"], "rawSha256": digest,
            "rawBytes": len(raw), "nativePoints": ir.NATIVE_GRID[3],
            **details}

def qualify_late_originals(catalogue_report: dict, opener=None) -> dict:
    plan = make_plan(catalogue_report)
    records = []
    total = 0
    for item in plan:
        record = qualify_one(item, opener)
        total += record["rawBytes"]
        if total > MAX_TOTAL_BYTES:
            raise LateOriginalError("48-original audit exceeds aggregate GRIB byte budget")
        records.append(record)
    if len(records) != 48 or len({(r["run"], r["product"], r["leadMinutes"])
                                   for r in records}) != 48:
        raise LateOriginalError("incomplete or duplicated late original source inventory")
    return {"schema": SCHEMA, "source": "official DWD ICON-D2-RUC original GRIB2",
            "actualOriginalGribFilesAudited": 48, "sourceRunCount": 3,
            "sourceBytes": total, "originalEcCodesAudited": True,
            "qualificationScope": "FOUR_BOUNDARY_LEADS_ONLY_NOT_COMPLETE_27H_GRID",
            "records": records, "nativeLookupVerified": False,
            "rendererVerified": False, "activationAuthorized": False,
            "releaseAuthorized": False}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lookback-hours", type=int, default=10)
    args = parser.parse_args()
    try:
        inventory = discover_recent(args.lookback_hours)
        report = qualify_late_originals(inventory)
    except (LateOriginalError, HorizonInventoryError, OSError, ValueError, TypeError,
            KeyError, RuntimeError) as exc:
        print(json.dumps({"schema": SCHEMA, "activationAuthorized": False,
                          "releaseAuthorized": False, "result": "BLOCKED",
                          "error": str(exc)}, sort_keys=True))
        raise SystemExit(1) from None
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    print("BOUNDARY_GRIB_REAL_48_ECCODES_PASS; 27h full source/renderer NOT approved")

if __name__ == "__main__":
    main()
