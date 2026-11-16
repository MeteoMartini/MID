"""Bounded, user-invoked 3x10 native DWD GSP-rate GRIB source staging.

Private QA only. No MID Worker/Pages/renderer/publication side effects.
Source selection, run, valid time and SHA manifest are separately verified by
original_15min_phase_gate.py against an independently staged IR10.8 manifest.
Only official DWD files from ONE run and ten consecutive quarter-hours.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import tempfile
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, build_opener

from ir108_original_probe import MAX_COMPRESSED_BYTES, utc
from ir108_stage_originals import (
    FileInventory, NoRedirects, _checked_response, run_dir,
)
from original_15min_phase_gate import (
    RATE_PARAMETERS, SCHEMA, PhaseOriginalError, source_lead,
)

ROOT = "https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/"
FRAME_COUNT = 10
MAX_INDEX_BYTES = 1024 * 1024
MAX_TOTAL_BYTES = 180 * 1024 * 1024
SOURCE_TIMEOUT = 25


def source_directory(product: str, run: str) -> str:
    if product not in RATE_PARAMETERS:
        raise PhaseOriginalError("unknown native GSP rate product")
    return f"{ROOT}{product}/r/{quote(run_dir(run), safe='')}/s/"


def source_url(product: str, run: str, name: str) -> str:
    result = source_directory(product, run) + name
    source_lead(result, product, run)
    return result


def read_inventory(product: str, run: str, opener) -> set[str]:
    url = source_directory(product, run)
    with opener.open(Request(url, headers={"User-Agent": "MID-GSP15-shadow/1.0"}),
                     timeout=SOURCE_TIMEOUT) as response:
        _checked_response(response, url)
        raw = response.read(MAX_INDEX_BYTES + 1)
    if not 30 <= len(raw) <= MAX_INDEX_BYTES:
        raise PhaseOriginalError("empty or oversized official GSP product index")
    directory = FileInventory()
    try:
        directory.feed(raw.decode("utf-8", errors="strict"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise PhaseOriginalError("invalid DWD GSP HTML index") from exc
    if not directory.names:
        raise PhaseOriginalError("DWD rate directory has no official original frames")
    return directory.names


def plan_ten(product: str, run: str, first_valid: str, inventory: set[str]) -> list[dict]:
    reference, first = utc(run), utc(first_valid)
    if reference.minute != 0 or int(first.timestamp()) % 900:
        raise PhaseOriginalError("run/first validity not aligned to official UTC clock")
    result = []
    for index in range(FRAME_COUNT):
        valid = first + timedelta(minutes=15 * index)
        lead = int((valid - reference).total_seconds())
        if not 0 <= lead <= 14 * 3600 or lead % 900:
            raise PhaseOriginalError("original lead outside a single ICON-D2-RUC cycle")
        name = f"PT{lead // 3600:03d}H{(lead // 60) % 60:02d}M.grib2"
        if name not in inventory:
            raise PhaseOriginalError(f"official {product} lacks required original {name}")
        url = source_url(product, run, name)
        if source_lead(url, product, run) != lead:
            raise PhaseOriginalError("source URL lead differs from selected validity")
        result.append({"name": name, "sourceUrl": url,
                       "valid": valid.isoformat(timespec="seconds").replace("+00:00", "Z")})
    return result


def read_grib(url: str, opener) -> bytes:
    with opener.open(Request(url, headers={"User-Agent": "MID-GSP15-shadow/1.0"}),
                     timeout=SOURCE_TIMEOUT) as response:
        _checked_response(response, url)
        length = response.headers.get("Content-Length")
        if length is not None:
            try:
                declared = int(length)
            except ValueError as exc:
                raise PhaseOriginalError("invalid official Content-Length") from exc
            if declared > MAX_COMPRESSED_BYTES:
                raise PhaseOriginalError("original GRIB exceeds per-file budget")
        raw = response.read(MAX_COMPRESSED_BYTES + 1)
    if not 80 <= len(raw) <= MAX_COMPRESSED_BYTES:
        raise PhaseOriginalError("original DWD GSP GRIB missing or oversized")
    if length is not None and len(raw) != declared:
        raise PhaseOriginalError("partial original DWD GRIB download")
    if raw[:4] != b"GRIB" or raw[-4:] != b"7777":
        raise PhaseOriginalError("invalid or truncated original GRIB envelope")
    return raw


def stage(run: str, first_valid: str, output: Path, opener=None) -> dict:
    """All three inventories must exist before the first raw GRIB is fetched.

    Every product/time has one immutable source and digest. A failed download
    discards the entire staging directory. Never overwrites an existing proof.
    """
    run_dir(run)
    utc(first_valid)
    if output.is_symlink() or output.exists():
        raise PhaseOriginalError("refuse overwrite or symlink output")
    parent = output.parent
    if not parent.is_dir() or parent.is_symlink():
        raise PhaseOriginalError("staging parent must be an existing real directory")
    opener = opener or build_opener(NoRedirects())
    plans = {}
    for product in RATE_PARAMETERS:
        inventory = read_inventory(product, run, opener)
        plans[product] = plan_ten(product, run, first_valid, inventory)
    temporary = Path(tempfile.mkdtemp(prefix=".mid-gsp15-shadow-", dir=parent))
    total = 0
    try:
        products = {}
        for product, entries in plans.items():
            folder = temporary / "frames" / product
            folder.mkdir(mode=0o700, parents=True)
            records = []
            for frame in entries:
                raw = read_grib(frame["sourceUrl"], opener)
                total += len(raw)
                if total > MAX_TOTAL_BYTES:
                    raise PhaseOriginalError("whole 30-original staging byte budget exceeded")
                (folder / frame["name"]).write_bytes(raw)
                records.append({
                    "name": frame["name"],
                    "sourceUrl": frame["sourceUrl"],
                    "sha256": hashlib.sha256(raw).hexdigest(),
                    "bytes": len(raw),
                })
            products[product] = records
        manifest = {
            "schema": SCHEMA, "run": run, "firstValid": first_valid,
            "products": products,
        }
        (temporary / "manifest.json").write_text(
            json.dumps(manifest, sort_keys=True, indent=2) + "\n",
            encoding="utf-8")
        if output.exists() or output.is_symlink():
            raise PhaseOriginalError("staging output appeared during source fetch")
        os.rename(temporary, output)
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)
    return {
        "schema": SCHEMA, "stagedOriginals": 3 * FRAME_COUNT,
        "products": list(RATE_PARAMETERS), "sourceBytes": total,
        "source": "official DWD ICON-D2-RUC original GRIBs, verified per-file SHA256",
        "originalEcCodesAudited": False, "matchedIRManifest": False,
        "activationAuthorized": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Stage genuine 3x10 DWD GSP originals for SHADOW audit only")
    parser.add_argument("--run", required=True)
    parser.add_argument("--first-valid", required=True)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()
    try:
        print(json.dumps(
            stage(arguments.run, arguments.first_valid, arguments.output),
            sort_keys=True))
    except (PhaseOriginalError, ValueError, OSError, TypeError) as exc:
        print(json.dumps({"schema": SCHEMA, "activationAuthorized": False,
                          "error": str(exc)}, sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
