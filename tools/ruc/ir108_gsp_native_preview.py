"""PRIVATE SHADOW PREVIEW: original IR10.8 PNG + separate GSP phase-ID raster.

This is NOT a new forecast API, WMO WW product, DWD warning or production
renderer. All 40 original GRIBs must pass the existing *real* ecCodes source
gate before any raster is decoded. An existing SHA-bound RUC lookup.bin from
the EXACT model run supplies the sole pixel -> native cell mapping.
No interpolation, synthetic 15-minute fields, extrema smoothing or NoData=0.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import shutil
import stat
import struct
import tempfile
import zlib
from datetime import datetime, timezone
from pathlib import Path

from ir108_original_probe import NATIVE_GRID, MAX_COMPRESSED_BYTES, utc, source_lead_seconds
from original_15min_phase_gate import RATE_PARAMETERS, audit_rate_manifest, phase_cell, source_lead

SCHEMA = "mid.ir108-gsp.original-native-preview.shadow.v1"
NODATA = 0xffffffff
MAX_PIXELS = 2_500_000
MAX_PNG_BYTES = 14 * 1024 * 1024
# Fixed, physically labelled brightness-temperature stretch, NOT a cloud
# fraction or automatic per-frame contrast remapping.
IR_FIXED_MIN_K = 170.0
IR_FIXED_MAX_K = 340.0
# Internal categorical byte contract: 255 = missing, 0 = verified zero GSP signal.
# Missing is NEVER presented as a dry/zero physical precipitation value.
PHASE_IDS = {"NoData": 255, "no_gsp_signal": 0, "rain_gsp": 1,
             "snow_gsp": 2, "graupel_gsp": 3, "mixed_gsp": 4}


class PreviewError(ValueError):
    pass


def canonical_run(value: str) -> datetime:
    try:
        date = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError, AttributeError) as exc:
        raise PreviewError("invalid verified RUC run") from exc
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)
    date = date.astimezone(timezone.utc)
    if date.minute or date.second or date.microsecond:
        raise PreviewError("RUC lookup run not on a full UTC hour")
    return date


def _safe_file(file: Path, *, max_bytes: int) -> bytes:
    if file.is_symlink() or not stat.S_ISREG(file.lstat().st_mode):
        raise PreviewError("missing or unsafe native file")
    size = file.stat().st_size
    if not 1 <= size <= max_bytes:
        raise PreviewError("native file byte budget invalid")
    data = file.read_bytes()
    if len(data) != size:
        raise PreviewError("native file changed during read")
    return data


def verified_ruc_lookup(source: Path, required_run: str, *,
                        points: int = NATIVE_GRID[3]) -> dict:
    """Reuse the canonical source SHA inventory and same-run native lookup.

    Raster cells are south-to-north rows; generated PNGs reverse rows so
    their first row is geographically north. No raster interpolation.
    """
    if source.is_symlink() or not source.is_dir():
        raise PreviewError("untrusted RUC source directory")
    manifest_raw = _safe_file(source/"latest.json", max_bytes=2_000_000)
    try:
        meta = json.loads(manifest_raw)
        if meta.get("schema") != "mid.dwd.ruc.grid.v2":
            raise PreviewError("wrong canonical RUC source schema")
        if canonical_run(meta["run"]) != utc(required_run):
            raise PreviewError("RUC lookup and original IR/GSP runs differ")
        if meta.get("pointCount") != points:
            raise PreviewError("native point count is not the original GRIB grid")
        specification = meta["lookup"]
        if specification["dtype"] != "uint32-le" or specification["nodata"] != NODATA:
            raise PreviewError("wrong RUC native lookup encoding or NoData")
        grid = specification.get("grid", meta["grid"])
        nx, ny = grid["nx"], grid["ny"]
        if type(nx) is not int or type(ny) is not int or not 2 <= nx <= 2000 or not 2 <= ny <= 2000:
            raise PreviewError("invalid verified display grid dimensions")
        if nx * ny > MAX_PIXELS:
            raise PreviewError("original preview exceeds bounded pixel budget")
        west, south, dx, dy = (float(grid[key]) for key in
                               ("lonMin", "latMin", "dx", "dy"))
        if not all(math.isfinite(x) for x in (west, south, dx, dy)):
            raise PreviewError("nonfinite RUC display geometry")
        if not (0 < dx <= 1 and 0 < dy <= 1 and
                -180 <= west-dx/2 < west+(nx-.5)*dx <= 180 and
                -90 <= south-dy/2 < south+(ny-.5)*dy <= 90):
            raise PreviewError("out-of-range native display geometry")
        if not 0 < float(grid["maxNearestKm"]) <= 5:
            raise PreviewError("source nearest-native-cell budget unverified")
        evidence = meta["objects"]["lookup.bin"]
        raw = _safe_file(source/"lookup.bin", max_bytes=MAX_PIXELS*4)
        if (len(raw) != nx*ny*4 or evidence.get("bytes") != len(raw)
                or hashlib.sha256(raw).hexdigest() != evidence.get("sha256")):
            raise PreviewError("canonical lookup bytes/SHA mismatch")
    except (KeyError, TypeError, ValueError, OverflowError) as exc:
        if isinstance(exc, PreviewError):
            raise
        raise PreviewError("invalid RUC lookup source metadata") from exc
    inside = 0
    for (cell,) in struct.iter_unpack("<I", raw):
        if cell == NODATA:
            continue
        if cell >= points:
            raise PreviewError("RUC nearest-native-cell index exceeds source grid")
        inside += 1
    if inside == 0:
        raise PreviewError("empty native RUC spatial coverage")
    # PNG corners enclose source grid cells, NOT their midpoints.
    return {"raw": raw, "width": nx, "height": ny,
            "bounds": [west-dx/2, south-dy/2,
                       west+(nx-.5)*dx, south+(ny-.5)*dy],
            "sourceRun": required_run,
            "lookupSha256": evidence["sha256"],
            "sourceManifestSha256": hashlib.sha256(manifest_raw).hexdigest(),
            "nativePoints": points, "validLookupCells": inside,
            "sampling": "nearest-native-cell"}


def kelvin_gray(value: float) -> int:
    """Fixed monotone Kelvin -> display intensity, without touching data."""
    if not math.isfinite(value) or value < 100 or value > 400:
        raise PreviewError("unphysical IR10.8 original brightness temperature")
    ratio = (IR_FIXED_MAX_K - value) / (IR_FIXED_MAX_K - IR_FIXED_MIN_K)
    return int(round(max(0., min(1., ratio)) * 255))


def sample_native_image(lookup: dict, ir, rain, snow, graupel) -> dict:
    points = lookup["nativePoints"]
    if any(len(field) != points for field in (ir, rain, snow, graupel)):
        raise PreviewError("native source field/lookup dimensions differ")
    nx, ny = lookup["width"], lookup["height"]
    rgba = bytearray(nx*ny*4)
    phase = bytearray([PHASE_IDS['NoData']]) * (nx*ny)
    counts = {name: 0 for name in PHASE_IDS}
    ir_missing = 0
    valid_ir = 0
    # Only the display raster is mapped; original 542040 positions are
    # retained in GRIB originals/QA audit and are never resampled.
    for y in range(ny):
        # Raw lookup rows are southernmost first. PNG's first row is north.
        source_row = ny-y-1
        for x in range(nx):
            offset = (y*nx+x)
            native = struct.unpack_from("<I", lookup["raw"], (source_row*nx+x)*4)[0]
            if native == NODATA:
                ir_missing += 1
                counts["NoData"] += 1
                continue
            k = ir[native]
            if k is None:
                ir_missing += 1
                counts["NoData"] += 1
                continue
            try:
                t = float(k)
            except (TypeError, ValueError) as exc:
                raise PreviewError("nonnumeric original brightness-temperature cell") from exc
            if math.isnan(t):
                ir_missing += 1
                counts["NoData"] += 1
                continue
            intensity = kelvin_gray(t)
            rgba[offset*4:offset*4+4] = bytes((intensity, intensity, intensity, 255))
            valid_ir += 1
            label = phase_cell(rain[native], snow[native], graupel[native])
            index = PHASE_IDS[label]
            phase[offset] = index
            counts[label] += 1
    if valid_ir == 0:
        raise PreviewError("no valid IR10.8 original pixels in verified RUC map")
    return {"rgba": bytes(rgba), "phase": bytes(phase),
            "phaseCounts": counts, "irMissingPixels": ir_missing,
            "validIrPixels": valid_ir}


def _png_chunk(name: bytes, contents: bytes) -> bytes:
    return struct.pack(">I", len(contents))+name+contents+struct.pack(
        ">I", zlib.crc32(name+contents)&0xffffffff)


def png_rgba(width: int, height: int, rgba: bytes) -> bytes:
    if (not 1 <= width <= 2000 or not 1 <= height <= 2000 or
            len(rgba) != width*height*4 or width*height > MAX_PIXELS):
        raise PreviewError("invalid or oversized preview RGBA geometry")
    raw = b"".join(b"\0"+rgba[y*width*4:(y+1)*width*4]
                   for y in range(height))
    encoded = (b"\x89PNG\r\n\x1a\n"
               + _png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height,
                   8, 6, 0, 0, 0))
               + _png_chunk(b"IDAT", zlib.compress(raw, 6))
               + _png_chunk(b"IEND", b""))
    if len(encoded) > MAX_PNG_BYTES:
        raise PreviewError("original IR10.8 PNG exceeds preview budget")
    return encoded


def _staged_frame(manifest: Path, frame: dict, product: str|None) -> Path:
    name, digest = frame["name"], frame["sha256"]
    import re
    if (not re.fullmatch(r"PT\d{3}H(?:00|15|30|45)M\.grib2", name)
            or not re.fullmatch(r"[a-f0-9]{64}", digest)):
        raise PreviewError("unsafe original frame inventory identity")
    directory = manifest.parent/"frames"
    if product is not None:
        directory = directory / product
    if directory.is_symlink() or not directory.is_dir():
        raise PreviewError("missing or redirected original source folder")
    path = directory/name
    actual = _safe_file(path, max_bytes=MAX_COMPRESSED_BYTES)
    if hashlib.sha256(actual).hexdigest() != digest:
        raise PreviewError("original GRIB source SHA changed during preview")
    return path


def _decode_native(path: Path, points: int):
    """Real ecCodes decoding only, preserving the native Section-6 bitmap."""
    try:
        from eccodes import codes_grib_new_from_file, codes_get_long, codes_release
        from grib_bitmap import decode_bitmap_values
    except ImportError as exc:
        raise PreviewError("real ecCodes/native GRIB bitmap decoder not installed") from exc
    with path.open("rb") as source:
        gid = codes_grib_new_from_file(source)
        if gid is None:
            raise PreviewError("invalid original GRIB payload")
        try:
            if int(codes_get_long(gid, "numberOfPoints")) != points:
                raise PreviewError("decoded IR/GSP native grid size drift")
            result = decode_bitmap_values(gid)
        finally:
            codes_release(gid)
        extra = codes_grib_new_from_file(source)
        if extra is not None:
            codes_release(extra)
            raise PreviewError("multiple GRIB messages in original one-field file")
    if len(result) != points:
        raise PreviewError("decoded native value/bitmap length drift")
    return result


def order_original_frame_sources(ir_doc: dict, rate_doc: dict,
                                 run: str, first_valid: str):
    """Order by *verified source lead*, never arbitrary JSON list position.

    The independent ecCodes audit validates each immutable source URL against
    decoded GRIB UTC validity. This pure re-indexing keeps IR and all three
    native instantaneous rate fields on the SAME original UTC target even when
    the source manifest entries arrive in a different order.
    """
    start = int((utc(first_valid)-utc(run)).total_seconds())
    leads = tuple(start+900*i for i in range(10))
    if start < 0 or start % 900 or leads[-1] > 14*3600:
        raise PreviewError("IR/GSP preview outside official RUC 0..14h horizon")
    if not isinstance(ir_doc, dict) or not isinstance(rate_doc, dict):
        raise PreviewError("invalid original source manifests")
    if not isinstance(rate_doc.get("products"), dict) or set(rate_doc["products"]) != set(RATE_PARAMETERS):
        raise PreviewError("missing or foreign original GSP phase product")
    def order(records, product):
        if not isinstance(records, list) or len(records) != 10:
            raise PreviewError("exactly ten native original source frames required")
        seen = {}
        for record in records:
            if not isinstance(record, dict):
                raise PreviewError("invalid original source entry")
            url = record.get("sourceUrl")
            if not isinstance(url, str):
                raise PreviewError("source URL identity missing")
            try:
                lead = (source_lead_seconds(url) if product is None
                        else source_lead(url, product, run))
            except (ValueError, TypeError) as exc:
                raise PreviewError("invalid original lead/official source URL") from exc
            if lead in seen:
                raise PreviewError("duplicated original UTC validity in source list")
            seen[lead] = record
        if set(seen) != set(leads):
            raise PreviewError("IR and GSP source UTC leads are not identical")
        return [seen[lead] for lead in leads]
    ir = order(ir_doc.get("frames"), None)
    rates = {product: order(rate_doc["products"][product], product)
             for product in RATE_PARAMETERS}
    return ir, rates


def create_private_preview(source: Path, ir_manifest: Path,
                           gsp_manifest: Path, output: Path) -> dict:
    """After *independent real* 40-GRIB admission, make ten private frame pairs.

    One monochrome PNG and one category-ID raster per original valid time.
    Category IDs are internal evidence; no uncontracted local UI palette.
    """
    if output.exists() or output.is_symlink() or not output.parent.is_dir():
        raise PreviewError("unsafe or pre-existing private preview destination")
    if output.parent.is_symlink():
        raise PreviewError("unsafe preview parent symlink")
    # The full 40-real-source spectral/bitmap/UTC/SHA gate must pass first.
    admitted = audit_rate_manifest(gsp_manifest, ir_manifest)
    if admitted["sourceIdentityAndNativeValues"] != "AUDITED_WITH_ECCODES":
        raise PreviewError("no real original ecCodes admission")
    run = admitted["run"]
    lookup = verified_ruc_lookup(source, run)
    ir_doc = json.loads(_safe_file(ir_manifest, max_bytes=2_000_000))
    rate_doc = json.loads(_safe_file(gsp_manifest, max_bytes=2_000_000))
    ordered_ir, ordered_rates = order_original_frame_sources(
        ir_doc, rate_doc, run, admitted["firstValid"])
    sources = {str(p): hashlib.sha256(_safe_file(p, max_bytes=2_000_000)).hexdigest()
               for p in (ir_manifest, gsp_manifest)}
    staging = Path(tempfile.mkdtemp(prefix=".mid-ir108-gsp-preview-", dir=output.parent))
    records = []
    try:
        for i in range(10):
            # The source auditor verified the UTC/lead/order; each decoded
            # original is rechecked by its immutable digest here.
            ir_ref = ordered_ir[i]
            ir = _decode_native(_staged_frame(ir_manifest, ir_ref, None), lookup["nativePoints"])
            fields = [_decode_native(_staged_frame(gsp_manifest,
                     ordered_rates[p][i], p), lookup["nativePoints"])
                      for p in RATE_PARAMETERS]
            sampled = sample_native_image(lookup, ir, *fields)
            png = png_rgba(lookup["width"], lookup["height"], sampled["rgba"])
            phase = zlib.compress(sampled["phase"], level=6)
            if len(phase) > MAX_PNG_BYTES:
                raise PreviewError("GSP category preview byte budget exceeded")
            png_name = f"ir108-{i:02d}.png"
            phase_name = f"gsp-phase-{i:02d}.bin"
            (staging/png_name).write_bytes(png)
            (staging/phase_name).write_bytes(phase)
            record = {"validTime": admitted["firstValid"] if i == 0 else
                      (utc(admitted["firstValid"])+__import__("datetime").timedelta(minutes=15*i)).
                      isoformat(timespec="seconds").replace("+00:00", "Z"),
                      "IR": {"file": png_name, "sha256": hashlib.sha256(png).hexdigest(),
                             "bytes": len(png), "encoding": "png-rgba8-north-up"},
                      "GSP": {"file": phase_name, "sha256": hashlib.sha256(phase).hexdigest(),
                              "bytes": len(phase), "encoding": "zlib-uint8-phase-id-north-up"},
                      "phaseCounts": sampled["phaseCounts"],
                      "validIrPixels": sampled["validIrPixels"],
                      "missingIrPixels": sampled["irMissingPixels"]}
            records.append(record)
        if {str(p): hashlib.sha256(_safe_file(p,max_bytes=2_000_000)).hexdigest()
                for p in (ir_manifest,gsp_manifest)} != sources:
            raise PreviewError("original manifest changed during raster rendering")
        if (hashlib.sha256(_safe_file(source/"latest.json",max_bytes=2_000_000)).hexdigest()
                != lookup["sourceManifestSha256"]):
            raise PreviewError("RUC metadata changed during raster rendering")
        if hashlib.sha256(_safe_file(source/"lookup.bin",max_bytes=MAX_PIXELS*4)).hexdigest() != lookup["lookupSha256"]:
            raise PreviewError("RUC lookup source changed during raster rendering")
        index = {"schema": SCHEMA, "run": run, "model": "DWD ICON-D2-RUC",
                 "isObservation": False, "isOfficialWmoWeatherCode": False,
                 "activationAuthorized": False, "productionApproved": False,
                 "nativeCellCount": lookup["nativePoints"],
                 "sourceLookupSha256": lookup["lookupSha256"],
                 "sourceRucManifestSha256": lookup["sourceManifestSha256"],
                 "originalManifestsSha256": sources,
                 "bounds": lookup["bounds"], "size": [lookup["width"],lookup["height"]],
                 "sampling": lookup["sampling"], "times": records,
                 "phaseLegend": PHASE_IDS,
                 "phaseNoDataId": 255, "phaseNoGspSignalId": 0,
                 "fixedIrBrightnessTemperatureKelvin": [IR_FIXED_MIN_K, IR_FIXED_MAX_K],
                 "method": "original IR10.8 Kelvin grayscale, native GSP phase IDs; no temporal/spatial interpolation",
                 "blockers": ["Original 10+30 real ecCodes files must be independently reproducible",
                    "GSP phase IDs are not comprehensive SigWx or WMO WW",
                    "no CSS-token colored phase layer/user-facing legend",
                    "no mobile/GPU/memory/Source/Installer/Worker/Pages/Stable admission"]}
        (staging/"index.json").write_text(json.dumps(index,sort_keys=True,
           allow_nan=False,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
        if output.exists() or output.is_symlink():
            raise PreviewError("private preview destination appeared during rendering")
        os.rename(staging, output)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return index


def main() -> int:
    parser = argparse.ArgumentParser(description="No-publish real IR10.8+GSP native shadow raster")
    for flag in ("ruc-source", "ir-manifest", "gsp-manifest", "output"):
        parser.add_argument("--"+flag, type=Path, required=True)
    args = parser.parse_args()
    try:
        result = create_private_preview(args.ruc_source,args.ir_manifest,
                                        args.gsp_manifest,args.output)
        print(json.dumps({"schema":result["schema"],"activationAuthorized":False,
                          "frames":len(result["times"]),"output":"private-only"},sort_keys=True))
    except (PreviewError, ValueError, OSError, KeyError, TypeError) as exc:
        print(json.dumps({"schema":SCHEMA,"activationAuthorized":False,
                          "error":str(exc)},sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
