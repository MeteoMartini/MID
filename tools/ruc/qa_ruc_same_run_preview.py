"""Private, same-model-run DWD native CLAT/CLON + IR10.8/GSP pixel QA.

Uses existing MID native coordinate/nearest-cell builder and 40-original ecCodes
gate. Does NOT publish images, save GRIBs as an artifact, create WMO weather
codes, change a worker, infer satellite observations, or permit an app release.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, build_opener

import numpy as np

from qa_ruc_original_horizon_inventory import (
    ORIGIN, DenyRedirect, LinkInventory, MAX_INDEX_BYTES,
    canonical_run, discover_recent,
)
from ir108_original_probe import NATIVE_GRID, MAX_COMPRESSED_BYTES
from ir108_stage_originals import stage as stage_ir
from stage_original_15min_gsp import stage as stage_gsp
from ir108_gsp_native_preview import (
    create_private_preview, verified_ruc_lookup, NODATA, PHASE_IDS,
)
from build_ruc_bundle import build_lookup, normalize_coordinate
from grib_metadata import inspect_grib_header
from grib_bitmap import decode_bitmap_values

SCHEMA = "mid.ruc.ir108-gsp-same-run-private-map-qa.v1"
COORDS = ("CLAT", "CLON")
GRID_FILENAME = "PT000H00M.grib2"

class GeoPreviewError(ValueError):
    pass

def coordinate_source(param: str, run: str) -> tuple[str, str]:
    if param not in COORDS:
        raise GeoPreviewError("only official CLAT/CLON coordinate fields admissible")
    stamp = canonical_run(run).strftime("%Y-%m-%dT%H:%M")
    base = f"{ORIGIN}{param}/r/{quote(stamp, safe='')}/s/"
    return base, base + GRID_FILENAME

def read_coordinate_grib(param: str, run: str, opener=None) -> tuple[bytes, str]:
    """Select and download only the unredirected official lead-zero source."""
    base, exact = coordinate_source(param, run)
    opener = opener or build_opener(DenyRedirect())
    with opener.open(Request(base, headers={"User-Agent": "MID-private-grid-qa/1.0"}),
                     timeout=20) as response:
        if response.geturl() != base or getattr(response, "status", 200) != 200:
            raise GeoPreviewError("foreign/redirected DWD native coordinate index")
        raw_index = response.read(MAX_INDEX_BYTES + 1)
    if not 30 <= len(raw_index) <= MAX_INDEX_BYTES:
        raise GeoPreviewError("missing or oversized coordinate inventory")
    inventory = LinkInventory()
    try:
        inventory.feed(raw_index.decode("utf-8", errors="strict"))
    except UnicodeDecodeError as exc:
        raise GeoPreviewError("invalid coordinate inventory encoding") from exc
    if GRID_FILENAME not in inventory.names or inventory.duplicates:
        raise GeoPreviewError("no unique official CLAT/CLON lead-zero file")
    with opener.open(Request(exact, headers={"User-Agent": "MID-private-grid-qa/1.0"}),
                     timeout=25) as response:
        if response.geturl() != exact or getattr(response, "status", 200) != 200:
            raise GeoPreviewError("foreign/redirected coordinate GRIB source")
        declared = response.headers.get("Content-Length")
        try:
            length = int(declared) if declared is not None else None
        except ValueError as exc:
            raise GeoPreviewError("invalid source length metadata") from exc
        if length is not None and not 80 <= length <= MAX_COMPRESSED_BYTES:
            raise GeoPreviewError("source length outside coordinate GRIB budget")
        data = response.read(MAX_COMPRESSED_BYTES + 1)
    if (not 80 <= len(data) <= MAX_COMPRESSED_BYTES
            or length is not None and len(data) != length
            or data[:4] != b"GRIB" or data[-4:] != b"7777"):
        raise GeoPreviewError("invalid or truncated original coordinate GRIB")
    return data, exact

def decode_coordinate_original(raw: bytes, param: str, run: str) -> np.ndarray:
    from eccodes import codes_grib_new_from_file, codes_get, codes_release
    import io
    with io.BytesIO(raw) as source:
        gid = codes_grib_new_from_file(source)
        if gid is None:
            raise GeoPreviewError("no decodable native coordinate GRIB")
        try:
            valid, signature = inspect_grib_header(
                gid, expected_run=canonical_run(run), expected_parameter=param)
            if valid != canonical_run(run) or signature[-1] != NATIVE_GRID[3]:
                raise GeoPreviewError("coordinate original model initialization/validity/grid mismatch")
            value = decode_bitmap_values(gid)
            units = str(codes_get(gid, "units"))
            native = normalize_coordinate(param, value, units)
        finally:
            codes_release(gid)
        second = codes_grib_new_from_file(source)
        if second is not None:
            codes_release(second)
            raise GeoPreviewError("multiple coordinate GRIB messages")
    if (len(native) != NATIVE_GRID[3] or
            not np.all(np.isfinite(native)) or
            (param == "CLAT" and (float(np.min(native)) < -90 or float(np.max(native)) > 90)) or
            (param == "CLON" and (float(np.min(native)) < -180 or float(np.max(native)) > 180))):
        raise GeoPreviewError("invalid native coordinate count/extrema/NoData")
    return native

def qa_lookup_manifest(source: Path, run: str, grid: dict, origins: dict) -> dict:
    """Create a private, explicitly unpublishable same-run grid manifest.

    Existing verified_ruc_lookup rechecks this actual SHA-bound lookup.bin.
    It is NOT an assertion that the complete production RUC core was built.
    """
    if set(origins) != set(COORDS) or any(
            not isinstance(origins[p], dict)
            or not re.fullmatch(r"[a-f0-9]{64}", str(origins[p].get("sha256")))
            or origins[p].get("sourceUrl") != coordinate_source(p, run)[1]
            for p in COORDS):
        raise GeoPreviewError("coordinate original identity/sha provenance absent")
    lookup_file = source/"lookup.bin"
    if lookup_file.is_symlink() or not lookup_file.is_file():
        raise GeoPreviewError("missing or unsafe native lookup")
    raw = lookup_file.read_bytes()
    if (grid.get("nativePointCount") != NATIVE_GRID[3]
            or len(raw) != grid["nx"]*grid["ny"]*4):
        raise GeoPreviewError("native lookup geometry disagrees with original grid")
    return {
        "schema": "mid.dwd.ruc.grid.v2", "run": run,
        "pointCount": NATIVE_GRID[3],
        "grid": grid, "lookup": {"dtype": "uint32-le", "nodata": NODATA},
        "objects": {"lookup.bin": {"sha256": hashlib.sha256(raw).hexdigest(),
                                   "bytes": len(raw)}},
        "qaOnly": True, "productionApproved": False,
        "coordinateOriginals": origins,
        "provenance": "real DWD CLAT/CLON same-run ORIGINAL GRIB, private shadow",
    }

def create_same_run_preview(root: Path, run: str, opener=None) -> dict:
    if root.is_symlink() or not root.is_dir():
        raise GeoPreviewError("private QA root must be existing regular directory")
    canonical_run(run)
    coordinate_origin, coordinate_fields = {}, {}
    for product in COORDS:
        raw, url = read_coordinate_grib(product, run, opener)
        coordinate_origin[product] = {
            "sha256": hashlib.sha256(raw).hexdigest(),
            "sourceUrl": url, "bytes": len(raw)}
        coordinate_fields[product] = decode_coordinate_original(raw, product, run)
    # Product code builds the same full-domain nearest-native-cell grid,
    # but the output remains inside a temporary, private QA source folder.
    grid_source = root/"geo"
    grid_source.mkdir(mode=0o700)
    grid = build_lookup(coordinate_fields["CLAT"],coordinate_fields["CLON"],grid_source)
    manifest = qa_lookup_manifest(grid_source,run,grid,coordinate_origin)
    (grid_source/"latest.json").write_text(
        json.dumps(manifest,sort_keys=True,separators=(",",":")),encoding="utf8")
    identity = verified_ruc_lookup(grid_source,run)
    if (identity["nativePoints"] != NATIVE_GRID[3]
            or identity["lookupSha256"] != manifest["objects"]["lookup.bin"]["sha256"]):
        raise GeoPreviewError("same-run native lookup SHA/points failed")
    ir_root, gsp_root = root/"ir",root/"gsp"
    stage_ir(run,run,ir_root,opener)
    stage_gsp(run,run,gsp_root,opener)
    result = create_private_preview(grid_source,ir_root/"manifest.json",
                                    gsp_root/"manifest.json",root/"preview")
    if (result.get("activationAuthorized") is not False
            or result.get("productionApproved") is not False
            or len(result.get("times",[])) != 10):
        raise GeoPreviewError("unsafe or incomplete private IR+GSP original previews")
    output = root/"preview"
    files = list(output.iterdir())
    if len([f for f in files if f.suffix==".png"]) != 10:
        raise GeoPreviewError("actual grayscale original preview PNG files missing")
    if len([f for f in files if f.suffix==".bin"]) != 10:
        raise GeoPreviewError("actual original phase-ID rasters missing")
    return {
        "schema": SCHEMA, "run": run,
        "nativePoints": identity["nativePoints"],
        "geographicBounds": identity["bounds"],
        "lookupSha256": identity["lookupSha256"],
        "coordinateOriginals": coordinate_origin,
        "frames": len(result["times"]),
        "sampledOriginalValidPixels": sum(x["validIrPixels"] for x in result["times"]),
        "sampledMissingPixels": sum(x["missingIrPixels"] for x in result["times"]),
        "previewFrameSha256": [x["IR"]["sha256"] for x in result["times"]],
        "phaseFrameSha256": [x["GSP"]["sha256"] for x in result["times"]],
        "realNativeDwdCoordinatesDecoded": True,
        "sameRunOriginalSources": True,
        "userVisiblePixelOrWebkitQa": False,
        "activationAuthorized": False, "releaseAuthorized": False,
        "productionApproved": False,
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lookback-hours",type=int,default=10)
    args = parser.parse_args()
    try:
        inventory = discover_recent(args.lookback_hours)
        if not inventory["catalogue27hQualified"] or inventory["qualifiedRunCount"] != 3:
            raise GeoPreviewError("no complete source run in official DWD 27h catalogue")
        run = inventory["runs"][0]["run"]
        with tempfile.TemporaryDirectory(prefix="mid-real-native-preview-no-publish-") as folder:
            report = create_same_run_preview(Path(folder),run)
        print(json.dumps(report,sort_keys=True,separators=(",",":")))
        print("REAL_DWD_SAME_RUN_NATIVE_PRIVATE_IR_GSP_RASTER_PASS; NO PRODUCT OR MOBILE RELEASE")
    except (OSError, ValueError, RuntimeError, TypeError, KeyError) as exc:
        print(json.dumps({"schema":SCHEMA,"activationAuthorized":False,
                          "releaseAuthorized":False,"result":"BLOCKED",
                          "error":str(exc)},sort_keys=True))
        raise SystemExit(1) from None

if __name__=="__main__":
    main()
