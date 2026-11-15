"""Fail-closed, read-only DWD ICON-D2-RUC 15-minute phase-rate admission.

SHADOW QA ONLY. Does not publish, interpolate, produce WMO WW codes, or
trigger network I/O. It audits separate instantaneous GSP precipitation-rate
originals, NOT cumulative RAIN_GSP/SNOW_GSP/GRAU_GSP. Real ecCodes and the
verified IR10.8 original manifest are mandatory for actual source admission.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import stat
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit

from ir108_original_probe import (
    NATIVE_GRID, MAX_COMPRESSED_BYTES, IR108QualificationError,
    audit_manifest, utc, step_seconds,
)

SCHEMA = "mid.dwd.icon-d2-ruc.gsp-phase-15min.shadow.v1"
RATE_PARAMETERS = {"PRR_GSP": 77, "PRS_GSP": 56, "PRG_GSP": 75}
POINTS = NATIVE_GRID[3]
FILENAME = re.compile(r"PT(\d{3})H(00|15|30|45)M\.grib2\Z")
SHA = re.compile(r"[0-9a-f]{64}\Z")
RATE_UNITS = frozenset(("kgm**-2s**-1", "kgm-2s-1", "kgm^-2s^-1"))


class PhaseOriginalError(ValueError):
    pass


def source_lead(url: str, product: str, run: str) -> int:
    """Bind a decoded rate to the exact DWD product/run/lead, never a lookalike."""
    if product not in RATE_PARAMETERS or not isinstance(url, str):
        raise PhaseOriginalError("unknown DWD instantaneous rate product or URL")
    parsed = urlsplit(url)
    path = parsed.path.split("/")
    expected = ["", "weather", "nwp", "v1", "m", "icon-d2-ruc",
                "p", product, "r"]
    if (parsed.scheme != "https" or parsed.netloc != "opendata.dwd.de"
            or parsed.username or parsed.password or parsed.query or parsed.fragment
            or len(path) != 12 or path[:9] != expected or path[10] != "s"
            or unquote(path[9]) != utc(run).strftime("%Y-%m-%dT%H:%M")):
        raise PhaseOriginalError("source URI not bound to official DWD rate/run")
    match = FILENAME.fullmatch(path[11])
    if match is None:
        raise PhaseOriginalError("rate filename not a canonical 15-minute DWD GRIB")
    lead = (int(match[1]) * 60 + int(match[2])) * 60
    if lead > 27 * 3600:
        raise PhaseOriginalError("rate source lead exceeds ICON-D2-RUC horizon")
    return lead


def validate_rate_metadata(meta: dict, product: str, run: str) -> dict:
    """Only real ecCodes decoding can attest metadata to original source bytes."""
    if product not in RATE_PARAMETERS or not isinstance(meta, dict):
        raise PhaseOriginalError("rate field identity or metadata missing")
    try:
        signature = (int(meta["edition"]), int(meta["centre"]),
                     int(meta["discipline"]), int(meta["category"]),
                     int(meta["number"]))
        grid = (str(meta["uuidOfHGrid"]).lower(), int(meta["numberOfGridUsed"]),
                int(meta["numberOfGridInReference"]), int(meta["numberOfPoints"]))
        bitmap = int(meta["bitmapPresent"])
        start = step_seconds(meta["startStep"], int(meta["stepUnits"]))
        end = step_seconds(meta["endStep"], int(meta["stepUnits"]))
        valid = utc(meta["valid"])
    except (KeyError, ValueError, TypeError, IR108QualificationError) as exc:
        raise PhaseOriginalError("incomplete or invalid original GRIB identity") from exc
    if signature != (2, 78, 0, 1, RATE_PARAMETERS[product]):
        raise PhaseOriginalError("foreign or wrong original precipitation-rate GRIB")
    if meta.get("gridType") != "unstructured_grid" or grid != NATIVE_GRID or bitmap not in (0, 1):
        raise PhaseOriginalError("wrong grid or unresolved native bitmap")
    if (meta.get("stepType") != "instant"
            or str(meta.get("units", "")).replace(" ", "") not in RATE_UNITS
            or int(meta.get("typeOfFirstFixedSurface", -1)) != 1):
        raise PhaseOriginalError("instantaneous surface mass flux in kg m-2 s-1 required")
    if (meta.get("run") != run or start != end or end < 0 or end > 27 * 3600
            or end % 900 or utc(run) + timedelta(seconds=end) != valid):
        raise PhaseOriginalError("run/instantaneous UTC validity/quarter-hour mismatch")
    return {"product": product, "run": run, "valid": meta["valid"],
            "leadSeconds": end, "gridUuid": grid[0], "nativePoints": grid[3],
            "unit": "kg m-2 s-1", "stepType": "instant",
            "bitmapPresent": bitmap,
            "parameter": f"0/1/{RATE_PARAMETERS[product]}",
            "isOfficialWmoWeatherCode": False}


def audit_rate_values(values, *, points: int = POINTS) -> dict:
    """Preserve native bitmap holes, original extrema and genuinely zero rates."""
    if len(values) != points:
        raise PhaseOriginalError("rate values do not match native grid")
    known = missing = zero = 0
    maximum = 0.0
    for value in values:
        if value is None:
            missing += 1
            continue
        if isinstance(value, bool):
            raise PhaseOriginalError("boolean precipitation-rate cell")
        try:
            numeric = float(value)
        except (TypeError, ValueError) as exc:
            raise PhaseOriginalError("invalid precipitation-rate cell") from exc
        if math.isnan(numeric):
            missing += 1
            continue
        # 1 kg/m2/s = 3600 mm/h is an extremely broad engineering sanity
        # bound, NOT an official DWD threshold; never clip or smooth extremes.
        if not math.isfinite(numeric) or numeric < 0.0 or numeric > 1.0:
            raise PhaseOriginalError("negative/implausible/nonfinite native precipitation rate")
        known += 1
        zero += numeric == 0.0
        maximum = max(maximum, numeric)
    if not known:
        raise PhaseOriginalError("no native precipitation-rate coverage")
    return {"validCells": known, "missingCells": missing, "exactZeroCells": zero,
            "maximumOriginalRateKgM2S": maximum, "extremesSmoothed": False,
            "missingConvertedToZero": False}


def phase_cell(rain, snow, graupel):
    """Original GSP component signature; not a WMO WW code or full SigWx.

    Three zeros mean no GSP signal, NOT dry weather: convective precipitation
    and other phenomena are outside this three-field original inventory.
    """
    values = (rain, snow, graupel)
    if any(value is None or isinstance(value, bool) for value in values):
        return "NoData"
    try:
        numbers = tuple(float(v) for v in values)
    except (TypeError, ValueError):
        return "NoData"
    if any(not math.isfinite(v) or v < 0 or v > 1 for v in numbers):
        return "NoData"
    active = [name for name, rate in
              zip(("rain", "snow", "graupel"), numbers) if rate > 0]
    if not active:
        return "no_gsp_signal"
    return "mixed_gsp" if len(active) > 1 else active[0] + "_gsp"


def _checked_local(name: str, root: Path) -> Path:
    if FILENAME.fullmatch(name) is None or root.is_symlink() or not root.is_dir():
        raise PhaseOriginalError("unsafe original filename/source directory")
    file = root / name
    mode = file.lstat().st_mode
    if (not stat.S_ISREG(mode) or file.is_symlink()
            or not 80 <= file.stat().st_size <= MAX_COMPRESSED_BYTES):
        raise PhaseOriginalError("unsafe original GRIB file")
    return file


def inspect_rate_grib(path: Path, product: str, run: str) -> dict:
    """Decode a real one-message GRIB using the existing MID RUC native bitmap."""
    try:
        from eccodes import codes_grib_new_from_file, codes_get, codes_get_long, codes_release
        from grib_bitmap import decode_bitmap_values
    except ImportError as exc:
        raise PhaseOriginalError("ecCodes/native bitmap decoder unavailable") from exc
    with path.open("rb") as source:
        gid = codes_grib_new_from_file(source)
        if gid is None:
            raise PhaseOriginalError("not a decodable rate GRIB")
        try:
            number = lambda key: int(codes_get_long(gid, key))
            stamp = lambda prefix: datetime.strptime(
                f"{number(prefix+'Date'):08d}{number(prefix+'Time'):04d}",
                "%Y%m%d%H%M").replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            metadata = {
                "edition": number("edition"), "centre": number("centre"),
                "discipline": number("discipline"), "category": number("parameterCategory"),
                "number": number("parameterNumber"), "gridType": str(codes_get(gid, "gridType")),
                "uuidOfHGrid": str(codes_get(gid, "uuidOfHGrid")),
                "numberOfGridUsed": number("numberOfGridUsed"),
                "numberOfGridInReference": number("numberOfGridInReference"),
                "numberOfPoints": number("numberOfPoints"),
                "bitmapPresent": number("bitmapPresent"),
                "startStep": codes_get(gid, "startStep"),
                "endStep": codes_get(gid, "endStep"),
                "stepUnits": number("stepUnits"),
                "typeOfFirstFixedSurface": number("typeOfFirstFixedSurface"),
                "units": str(codes_get(gid, "units")),
                "stepType": str(codes_get(gid, "stepType")),
                "run": stamp("data"), "valid": stamp("validity"),
            }
            report = validate_rate_metadata(metadata, product, run)
            report["nativeValues"] = audit_rate_values(decode_bitmap_values(gid))
        finally:
            codes_release(gid)
        second = codes_grib_new_from_file(source)
        if second is not None:
            codes_release(second)
            raise PhaseOriginalError("multiple GRIB messages in one rate file")
    return report


def audit_rate_manifest(rate_manifest: Path, ir_manifest: Path) -> dict:
    """Real-source ecCodes admission, NOT renderer or production approval.

    Rate files are staged outside the repository under frames/<PRODUCT>/
    PTxxxHyyM.grib2 with SHA-bound metadata, never downloaded by this tool.
    """
    ir = audit_manifest(ir_manifest, audit_values=True)
    if (ir.get("spectralMatches") != 10 or ir.get("fullBitmapValueAudits") != 10
            or ir.get("headerAndCadenceAudit") != "PASS"):
        raise PhaseOriginalError("IR10.8 ten-frame original qualification incomplete")
    info = json.loads(rate_manifest.read_text(encoding="utf8"))
    if not isinstance(info, dict) or info.get("schema") != SCHEMA:
        raise PhaseOriginalError("wrong phase rate manifest schema")
    run, first = info.get("run"), info.get("firstValid")
    if run != ir["run"] or first != ir["firstValid"]:
        raise PhaseOriginalError("IR and phase products do not share model run/first validity")
    products = info.get("products")
    if not isinstance(products, dict) or set(products) != set(RATE_PARAMETERS):
        raise PhaseOriginalError("exact PRR/PRS/PRG GSP inventory required")
    required = [entry["valid"] for entry in ir["records"]]
    if len(required) != 10 or len(set(required)) != 10:
        raise PhaseOriginalError("IR has no unique ten original times")
    seen_hashes = set()
    counts = {}
    for product in RATE_PARAMETERS:
        entries = products[product]
        if not isinstance(entries, list) or len(entries) != 10:
            raise PhaseOriginalError("ten genuine rate frames per product required")
        records = {}
        root = rate_manifest.parent / "frames" / product
        for entry in entries:
            if not isinstance(entry, dict):
                raise PhaseOriginalError("invalid rate source entry")
            name, url, digest = entry.get("name"), entry.get("sourceUrl"), entry.get("sha256")
            if (not isinstance(name, str) or not isinstance(digest, str)
                    or not SHA.fullmatch(digest)):
                raise PhaseOriginalError("invalid source filename or digest")
            lead = source_lead(url, product, run)
            if name != urlsplit(url).path.split("/")[-1] or digest in seen_hashes:
                raise PhaseOriginalError("source URL/file/hash mismatch or duplicate")
            seen_hashes.add(digest)
            file = _checked_local(name, root)
            hasher = hashlib.sha256()
            with file.open("rb") as src:
                for part in iter(lambda: src.read(1024 * 1024), b""):
                    hasher.update(part)
            if hasher.hexdigest() != digest:
                raise PhaseOriginalError("source GRIB SHA256 mismatch")
            record = inspect_rate_grib(file, product, run)
            if record["leadSeconds"] != lead or record["valid"] in records:
                raise PhaseOriginalError("original lead/time duplicated or differs from GRIB")
            records[record["valid"]] = record
        if set(records) != set(required):
            raise PhaseOriginalError("missing, shifted or spliced original IR/phase timestamps")
        counts[product] = {
            "originals": len(records),
            "missingCells": sum(r["nativeValues"]["missingCells"] for r in records.values()),
            "maximumOriginalRateKgM2S": max(
                r["nativeValues"]["maximumOriginalRateKgM2S"] for r in records.values()),
        }
    return {"schema": SCHEMA, "run": run, "firstValid": first,
            "originalIRFrames": 10, "originalRateFrames": 30,
            "products": counts, "sourceIdentityAndNativeValues": "AUDITED_WITH_ECCODES",
            "activationAuthorized": False,
            "blockers": [
                "native CLAT/CLON/georeferenced renderer unverified",
                "GSP phase subset is not full SigWx or WMO 4677 WW",
                "no combined published artifact or full release/mobile/worker gates",
            ]}


def main():
    cli = argparse.ArgumentParser(description="Offline DWD IR10.8/GSP original rate shadow QA")
    cli.add_argument("--ir-manifest", type=Path, required=True)
    cli.add_argument("--rates-manifest", type=Path, required=True)
    args = cli.parse_args()
    try:
        print(json.dumps(audit_rate_manifest(args.rates_manifest, args.ir_manifest),
                         sort_keys=True))
    except (OSError, ValueError, TypeError, KeyError, IR108QualificationError) as exc:
        print(json.dumps({"schema": SCHEMA, "activationAuthorized": False,
                          "error": str(exc)}, sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
