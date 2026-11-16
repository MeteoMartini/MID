"""Private late-horizon real-satellite-simulation *model* raster movement QA.

DWD model-run +24:45..27:00, ten native 15min originals per product.
IR10.8 is synthetic SEVIRI brightness temperature, NOT observed imagery.
GSP phase labels cover rain/snow/graupel signals only, NOT WMO WW or warning.
Only actual original GRIB values, valid bitmap, SHA and same-run CLAT/CLON.
Pixel QA is quantitative, NOT qualitative visual/Browser/WebKit/iOS approval.
No artifact or forecast publication; all temporary PNGs are deleted on exit.
"""
from __future__ import annotations

import hashlib
import json
import tempfile
from datetime import timedelta
from pathlib import Path

import numpy as np

from qa_ruc_original_horizon_inventory import PRODUCTS, discover_recent, canonical_run
from qa_ruc_full_109_originals import full_plan, bounded_download, admit_original
from qa_ruc_same_run_preview import (
    COORDS, read_coordinate_grib, decode_coordinate_original,
    qa_lookup_manifest,
)
from build_ruc_bundle import build_lookup
from ir108_original_probe import NATIVE_GRID
from ir108_gsp_native_preview import (
    verified_ruc_lookup, sample_native_image, png_rgba, _decode_native,
    PHASE_IDS,
)

SCHEMA = "mid.ruc.ir108-gsp-late-same-run-pixel-movement-qa.v1"
LATE_LEADS = tuple(range(1485, 1621, 15))
MAX_BYTES = 40 * 8 * 1024 * 1024

class LatePixelError(ValueError):
    pass

def audit_png_phase(sample: dict, previous: bytes | None = None) -> dict:
    """Validate the *actual* grayscale PNG input and lossless GSP index wire."""
    rgba = sample["rgba"]
    phase = sample["phase"]
    if len(rgba) != len(phase) * 4 or not phase:
        raise LatePixelError("native IR image and GSP categorical dimensions disagree")
    pixels = np.frombuffer(rgba, dtype=np.uint8).reshape(-1, 4)
    values = pixels[:, 0]
    alpha = pixels[:, 3]
    if (not np.array_equal(values, pixels[:, 1])
            or not np.array_equal(values, pixels[:, 2])
            or not np.all((alpha == 0) | (alpha == 255))):
        raise LatePixelError("not a real fixed-stretch grayscale IR10.8 image")
    missing = alpha == 0
    valid = ~missing
    labels = np.frombuffer(phase, dtype=np.uint8)
    if (np.any(np.any(pixels[missing, :3] != 0, axis=1))
            or np.any(labels[missing] != PHASE_IDS["NoData"])
            # A valid IR pixel may have missing *GSP* originals, and its
            # category must then remain NoData rather than a fabricated 0.
            or not np.all(np.isin(labels, list(PHASE_IDS.values())))):
        raise LatePixelError("original IR/GSP missing mask or category value corrupted")
    if (np.count_nonzero(valid) != sample["validIrPixels"]
            or np.count_nonzero(missing) != sample["irMissingPixels"]
            or np.unique(values[valid]).size < 4):
        raise LatePixelError("stale, blank, overquantized or inconsistent real IR pixels")
    movement = None
    if previous is not None:
        old = np.frombuffer(previous, dtype=np.uint8).reshape(-1, 4)
        if old.shape != pixels.shape:
            raise LatePixelError("frame-to-frame display geometry drift")
        mutual = valid & (old[:, 3] == 255)
        if not np.any(mutual):
            raise LatePixelError("no jointly valid original image cells")
        movement = int(np.count_nonzero(values[mutual] != old[mutual, 0]))
    return {
        "validPixels": int(np.count_nonzero(valid)),
        "missingPixels": int(np.count_nonzero(missing)),
        "minimumDisplayedGray": int(np.min(values[valid])),
        "maximumDisplayedGray": int(np.max(values[valid])),
        "distinctDisplayedGrayLevels": int(np.unique(values[valid]).size),
        "changedValidPixelsFromPreviousOriginal": movement,
        "phaseCategoryCounts": {name: int(np.count_nonzero(labels == code))
                                for name, code in PHASE_IDS.items()},
    }

def native_original_values(item: dict) -> tuple[np.ndarray, dict]:
    raw = bounded_download(item)
    record = admit_original(item, raw)
    with tempfile.TemporaryDirectory(prefix="mid-real-late-frame-") as directory:
        file = Path(directory) / item["name"]
        file.write_bytes(raw)
        native = _decode_native(file, NATIVE_GRID[3])
        if hashlib.sha256(file.read_bytes()).hexdigest() != record["sha256"]:
            raise LatePixelError("source GRIB SHA drift between audits")
    return native, record

def create_late_pixel_evidence(root: Path, catalogue: dict) -> dict:
    if root.exists() and (root.is_symlink() or not root.is_dir()):
        raise LatePixelError("unsafe private QA location")
    run, planned = full_plan(catalogue)
    geography = {}
    for p in COORDS:
        raw, url = read_coordinate_grib(p, run)
        geography[p] = {
            "nativeValues": decode_coordinate_original(raw, p, run),
            "url": url, "sha256": hashlib.sha256(raw).hexdigest(),
            "bytes": len(raw),
        }
    grid_source = root / "grid"
    grid_source.mkdir(mode=0o700)
    grid = build_lookup(geography["CLAT"]["nativeValues"],
                        geography["CLON"]["nativeValues"], grid_source)
    coordinate_origin = {p: {"sha256": geography[p]["sha256"],
                              "sourceUrl": geography[p]["url"],
                              "bytes": geography[p]["bytes"]} for p in COORDS}
    manifest = qa_lookup_manifest(grid_source, run, grid, coordinate_origin)
    (grid_source/"latest.json").write_text(
        json.dumps(manifest, sort_keys=True, separators=(",", ":")),encoding="utf8")
    lookup = verified_ruc_lookup(grid_source, run)
    if lookup["nativePoints"] != 542040:
        raise LatePixelError("native DWD RUC CLAT/CLON grid drift")
    summary, past, total, original_digests = [], None, 0, []
    for lead in LATE_LEADS:
        values = {}
        stamps = set()
        for product in PRODUCTS:
            item = planned[product][lead // 15]
            if item["leadMinutes"] != lead:
                raise LatePixelError("DWD original lead-time shift")
            native, evidence = native_original_values(item)
            total += evidence["bytes"]
            if total > MAX_BYTES:
                raise LatePixelError("bounded private late-frame source transfer exceeded")
            values[product] = native
            stamps.add(evidence["valid"])
            original_digests.append(f'{product}:{lead}:{evidence["sha256"]}')
        expected = (canonical_run(run)+timedelta(minutes=lead)).strftime(
            "%Y-%m-%dT%H:%M:%SZ")
        if stamps != {expected}:
            raise LatePixelError("non-simultaneous original IR/GSP validity")
        sampled = sample_native_image(
            lookup,values["SYNMSG_BT_CL_IR10.8"],
            values["PRR_GSP"],values["PRS_GSP"],values["PRG_GSP"])
        image = png_rgba(lookup["width"], lookup["height"], sampled["rgba"])
        output = audit_png_phase(sampled, past)
        past = sampled["rgba"]
        # Private single-use PNG, no artifact upload or public image.
        name = f'ir108-late-{lead:04d}.png'
        (root/name).write_bytes(image)
        if hashlib.sha256((root/name).read_bytes()).hexdigest() != hashlib.sha256(image).hexdigest():
            raise LatePixelError("private raster bytes changed after generation")
        summary.append({"validTime": expected,"leadMinutes": lead,
                        "imageSha256": hashlib.sha256(image).hexdigest(),
                        "imageBytes":len(image),**output})
        print(f'MID actual late IR+GSP+CLAT/CLON {run}: {len(summary)}/10 '
              f'original frames, +{lead//60:02d}:{lead%60:02d}, '
              f'changed={output["changedValidPixelsFromPreviousOriginal"]}',
              flush=True)
    if (len(summary) != 10
            or any(x["changedValidPixelsFromPreviousOriginal"] is None
                   for x in summary[1:])
            or any(x["changedValidPixelsFromPreviousOriginal"] == 0
                   for x in summary[1:])
            or len({x["imageSha256"] for x in summary}) != 10):
        raise LatePixelError("real 15min model frames did not move in private raster")
    return {
        "schema": SCHEMA, "run": run,
        "firstLeadMinutes":LATE_LEADS[0],
        "lastLeadMinutes":LATE_LEADS[-1],
        "realOriginalFramesPerProduct":10,
        "realOriginalGribsDecoded":40,
        "modelOriginalSha256Sequence":hashlib.sha256(
            "\n".join(original_digests).encode("ascii")).hexdigest(),
        "nativeCoordinateSha256":coordinate_origin,
        "lookupSha256":lookup["lookupSha256"],
        "nativePointCount":lookup["nativePoints"],
        "totalRealDwdOriginalBytes":total,
        "generatedPrivateIrPngs":len(summary),
        "everyAdjacentOriginalChangesPixels":True,
        "realOriginalValidTimeAndNativeGridQualified":True,
        "imageFrameMetrics":summary,
        "quantitativePixelQaOnly":True,
        "humanVisualReview":False,
        "mobileOrWebkitApproved":False,
        "isObservedSatelliteImage":False,
        "isOfficialWmoWeatherCode":False,
        "activationAuthorized":False,
        "releaseAuthorized":False,
    }

def main():
    try:
        inventory=discover_recent(10)
        if inventory["catalogue27hQualified"] is not True:
            raise LatePixelError("missing three official complete source-run inventories")
        with tempfile.TemporaryDirectory(prefix="mid-ir108-late-real-pixel-qa-") as folder:
            report=create_late_pixel_evidence(Path(folder),inventory)
        print(json.dumps(report,sort_keys=True,separators=(",",":")))
        print("REAL_LATE_10_ORIGINAL_MODEL_FRAMES_NATIVE_PIXEL_MOVEMENT_PASS; NO VISUAL/IOS/RELEASE APPROVAL")
    except (LatePixelError, ValueError, TypeError, KeyError, OSError, RuntimeError) as exc:
        print(json.dumps({"schema":SCHEMA,"result":"BLOCKED","error":str(exc),
                          "activationAuthorized":False,"releaseAuthorized":False},
                         sort_keys=True))
        raise SystemExit(1) from None

if __name__ == "__main__":
    main()
