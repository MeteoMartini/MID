"""Read-only, fail-closed native DWD ICON-D2-RUC IR10.8 candidate audit.

NO production publication, network traffic, or image generation. The DWD IR10.8
and WV6.2 fields share GRIB2 discipline/category/number (3/1/14); a correct
numeric signature alone does not prove channel identity. The source directory
and SHA-bound local copy are additional evidence, NOT a final channel attestation.

Usage: python tools/ruc/ir108_original_probe.py --manifest /safe/stage/manifest.json
Manifest: schema, run, firstValid, frames[10] with name, sourceUrl, sha256.
GRIB files must reside within /safe/stage/frames/ and not be symlinks.
"""
from __future__ import annotations

import argparse
import bz2
import hashlib
import json
import math
import re
import stat
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit, unquote

SCHEMA = "mid.dwd.icon-d2-ruc.ir108.shadow.v1"
PRODUCT = "SYNMSG_BT_CL_IR10.8"
NATIVE_GRID = ("c6b12daa91ad64045b26c1b6452a2a20", 47, 1, 542040)
MAX_COMPRESSED_BYTES = 8 * 1024 * 1024
MAX_DECODED_BYTES = 64 * 1024 * 1024
QUARTER_SECONDS = 900
MAX_LEAD_SECONDS = 27 * 3600
NAME_RE = re.compile(r"[A-Za-z0-9_.-]{1,180}\Z")
UTC_RE = re.compile(r"20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:00Z\Z")
STEP_RE = re.compile(r"(\d+(?:\.\d+)?)([smh]?)\Z")


class IR108QualificationError(ValueError):
    pass


def utc(value: str) -> datetime:
    if not isinstance(value, str) or UTC_RE.fullmatch(value) is None:
        raise IR108QualificationError("non-canonical UTC run/valid time")
    try:
        return datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise IR108QualificationError("invalid UTC calendar timestamp") from exc


def step_seconds(value: object, units: int) -> int:
    units_table = {0: ("m", 60), 1: ("h", 3600), 13: ("s", 1)}
    if units not in units_table:
        raise IR108QualificationError("unsupported GRIB step unit")
    match = STEP_RE.fullmatch(str(value))
    if match is None:
        raise IR108QualificationError("invalid step syntax")
    suffix, multiplier = units_table[units]
    if match.group(2) not in ("", suffix):
        raise IR108QualificationError("contradictory step units")
    from decimal import Decimal
    result = Decimal(match.group(1)) * multiplier
    if result != result.to_integral_value():
        raise IR108QualificationError("fractional second in GRIB validity")
    return int(result)


# Reconfirmed on actual official ICON-D2-RUC IR10.8 and WV6.2 GRIB2
# header bytes from 15-Nov-2026 15Z run, forecast 15 minutes, via WMO
# product definition template 4.32. Earlier COSMO/SEVIRI calibration is
# consistent but does not replace individual source-file validation.
IR108_CENTRAL_WAVENUMBER = 92592.0  # m^-1 ~ 10.8 micrometers
WV62_CENTRAL_WAVENUMBER = 161290.0  # m^-1 ~ 6.2 micrometers
EXPECTED_SATELLITE = (333, 72, 207)
SPECTRAL_KEYS = (
    "productDefinitionTemplateNumber", "numberOfContributingSpectralBands",
    "satelliteSeries", "satelliteNumber", "instrumentType",
    "scaleFactorOfCentralWaveNumber", "scaledValueOfCentralWaveNumber",
)


def validate_spectral_channel(meta: dict) -> dict:
    """Inspect WMO spectral-band metadata; a missing field is NOT approval."""
    if any(meta.get(key) is None for key in SPECTRAL_KEYS):
        return {"channelIdentity": "AMBIGUOUS_IR_OR_WV",
                "spectralEvidence": "MISSING_GRIB_SPECTRAL_KEYS"}
    template = int(meta["productDefinitionTemplateNumber"])
    count = int(meta["numberOfContributingSpectralBands"])
    sat = tuple(int(meta[key]) for key in ("satelliteSeries", "satelliteNumber", "instrumentType"))
    if template != 32 or count != 1:
        raise IR108QualificationError("unsupported satellite GRIB template/band count")
    if sat != EXPECTED_SATELLITE:
        raise IR108QualificationError("uncalibrated satellite series/id/instrument")
    scale = int(meta["scaleFactorOfCentralWaveNumber"])
    value = int(meta["scaledValueOfCentralWaveNumber"])
    if not 0 <= scale <= 9 or not 0 < value < 1000000000:
        raise IR108QualificationError("invalid central-wave-number scaling")
    wave_number = value * (10.0 ** -scale)
    if abs(wave_number - WV62_CENTRAL_WAVENUMBER) < 100:
        raise IR108QualificationError("WV6.2 is not an IR10.8 source field")
    if abs(wave_number - IR108_CENTRAL_WAVENUMBER) > 150:
        raise IR108QualificationError("unverified satellite channel central wave number")
    return {"channelIdentity": "DWD_PDT32_SEVIRI_IR108_SPECTRAL_MATCH",
            "spectralEvidence": "GRIB2_SATELLITE_BAND_METADATA",
            "centralWaveNumberPerMetre": wave_number,
            "wavelengthMicrometres": 1e6 / wave_number,
            "satelliteSeries": sat[0], "satelliteNumber": sat[1],
            "instrumentType": sat[2], "productDefinitionTemplateNumber": template}


def validate_header(meta: dict, run: str) -> dict:
    """Only metadata and cadence; does not attest IR-vs-WV channel identity."""
    if not isinstance(meta, dict):
        raise IR108QualificationError("header must be an object")
    expected = utc(run)
    if int(meta["edition"]) != 2 or int(meta["centre"]) != 78:
        raise IR108QualificationError("foreign GRIB edition/centre")
    signature = (int(meta["discipline"]), int(meta["category"]), int(meta["number"]))
    if signature != (3, 1, 14):
        raise IR108QualificationError("not the documented synthetic MSG brightness parameter")
    if meta["units"] != "K" or meta["stepType"] != "instant":
        raise IR108QualificationError("not instantaneous Kelvin brightness temperature")
    grid = (str(meta["uuidOfHGrid"]).lower(), int(meta["numberOfGridUsed"]),
            int(meta["numberOfGridInReference"]), int(meta["numberOfPoints"]))
    if meta["gridType"] != "unstructured_grid" or grid != NATIVE_GRID:
        raise IR108QualificationError("native ICON-D2-RUC grid identity differs")
    bitmap = int(meta["bitmapPresent"])
    if bitmap not in (0, 1):
        raise IR108QualificationError("unresolved inherited/invalid GRIB bitmap")
    if utc(meta["run"]) != expected:
        raise IR108QualificationError("GRIB run does not match manifest")
    valid = utc(meta["valid"])
    start = step_seconds(meta["startStep"], int(meta["stepUnits"]))
    end = step_seconds(meta["endStep"], int(meta["stepUnits"]))
    if start != end or end < 0 or end > MAX_LEAD_SECONDS or end % QUARTER_SECONDS:
        raise IR108QualificationError("not a genuine instantaneous quarter-hour lead")
    if expected + timedelta(seconds=end) != valid:
        raise IR108QualificationError("GRIB initialization + step != validity")
    spectral = validate_spectral_channel(meta)
    return {"run": run, "valid": meta["valid"], "leadSeconds": end,
            "points": grid[-1], "gribParameter": "3/1/14", "unit": "K",
            "bitmapPresent": bitmap, **spectral,
            "valueAndMissingQuality": "NOT_EVALUATED"}


def source_lead_seconds(url: str) -> int:
    """Strictly bind the published DWD r/<run>/s/PTxxxHyyM.grib2 layout."""
    try:
        parts = urlsplit(url)
    except (ValueError, TypeError) as exc:
        raise IR108QualificationError("invalid source URL") from exc
    segments = parts.path.split("/")
    prefix = ["", "weather", "nwp", "v1", "m", "icon-d2-ruc",
              "p", PRODUCT, "r"]
    if (parts.scheme != "https" or parts.netloc != "opendata.dwd.de"
            or parts.username or parts.password or parts.query or parts.fragment
            or segments[:len(prefix)] != prefix or len(segments) != len(prefix) + 3
            or segments[len(prefix) + 1] != "s"):
        raise IR108QualificationError("source URL not bound to DWD IR10.8 r/<run>/s directory")
    run_directory = unquote(segments[len(prefix)])
    if not re.fullmatch(r"20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}", run_directory):
        raise IR108QualificationError("invalid DWD source run directory")
    utc(run_directory + ":00Z")
    filename = segments[-1]
    match = re.fullmatch(r"PT(\d{3})H(00|15|30|45)M\.grib2", filename)
    if match is None:
        raise IR108QualificationError("DWD IR10.8 file must use native PTxxxHyyM.grib2 naming")
    lead = (int(match[1]) * 60 + int(match[2])) * 60
    if lead > MAX_LEAD_SECONDS:
        raise IR108QualificationError("DWD IR10.8 lead exceeds current verified bound")
    return lead


def check_source_url(url: str) -> None:
    source_lead_seconds(url)


def validate_frame_sequence(records: list[dict], run: str, first_valid: str) -> list[dict]:
    if len(records) != 10:
        raise IR108QualificationError("a guaranteed 0..+135-min quarter-hour axis needs ten originals")
    initial = utc(first_valid)
    if int(initial.timestamp()) % QUARTER_SECONDS:
        raise IR108QualificationError("first valid timestamp not on the UTC quarter-hour grid")
    if len({item["valid"] for item in records}) != 10:
        raise IR108QualificationError("duplicate original validity timestamp")
    actual = sorted(records, key=lambda item: item["valid"])
    targets = [(initial + timedelta(seconds=i * QUARTER_SECONDS)).isoformat()
               .replace("+00:00", "Z") for i in range(10)]
    if [item["valid"] for item in actual] != targets:
        raise IR108QualificationError("missing or non-contiguous native 15-minute frames")
    if any(item["run"] != run for item in actual):
        raise IR108QualificationError("different DWD model runs in one source sequence")
    return actual


def _checked_file(root: Path, name: str) -> Path:
    if not isinstance(name, str) or NAME_RE.fullmatch(name) is None:
        raise IR108QualificationError("unsafe/non-flat candidate filename")
    path = root / name
    if path.is_symlink():
        raise IR108QualificationError("symlink candidate GRIB refused")
    file_stat = path.stat()
    if not stat.S_ISREG(file_stat.st_mode) or not 80 <= file_stat.st_size <= MAX_COMPRESSED_BYTES:
        raise IR108QualificationError("candidate GRIB exceeds bounded source size or is empty")
    return path


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _decode_path(path: Path, scratch) -> None:
    if path.name.lower().endswith(".bz2"):
        with bz2.open(path, "rb") as source:
            total = 0
            while piece := source.read(1024 * 1024):
                total += len(piece)
                if total > MAX_DECODED_BYTES:
                    raise IR108QualificationError("compressed GRIB expands beyond safety budget")
                scratch.write(piece)
    else:
        with path.open("rb") as source:
            while piece := source.read(1024 * 1024):
                scratch.write(piece)
    scratch.seek(0)


def audit_brightness_kelvin(values, expected_points: int = NATIVE_GRID[3]) -> dict:
    """Strict original-value validation. No interpolation, smoothing, or NoData -> 0.

    NaN/None represent missing positions (as preserved by the existing DWD
    GRIB Section-6 bitmap decoder). Infinite, zero, impossible or foreign
    values are errors, never quietly clipped into display colors.
    """
    if type(expected_points) is not int or expected_points <= 0 or len(values) != expected_points:
        raise IR108QualificationError("IR10.8 native value count differs from audited grid")
    known, missing, low, high = 0, 0, math.inf, -math.inf
    for item in values:
        if item is None:
            missing += 1
            continue
        if isinstance(item, bool):
            raise IR108QualificationError("boolean is not a brightness temperature")
        try:
            v = float(item)
        except (TypeError, ValueError) as exc:
            raise IR108QualificationError("non-numeric brightness-temperature cell") from exc
        if math.isnan(v):
            missing += 1
            continue
        if not math.isfinite(v) or v < 100.0 or v > 400.0:
            raise IR108QualificationError("IR10.8 Kelvin value outside conservative physical bound")
        known += 1
        low, high = min(low, v), max(high, v)
    if not known or known + missing != expected_points:
        raise IR108QualificationError("IR10.8 all-missing or incomplete native bitmap")
    return {
        "valueUnits": "K", "validCells": known, "missingCells": missing,
        "nativeCells": expected_points, "rawMinimumKelvin": low,
        "rawMaximumKelvin": high, "extremesSmoothed": False,
        "missingConvertedToZero": False, "method": "unaltered native GRIB bitmap and decoded values",
    }


def inspect_local_grib(path: Path, run: str, *, audit_values: bool = False) -> dict:
    """ecCodes is intentionally needed only for a real local GRIB inspection."""
    try:
        from eccodes import codes_grib_new_from_file, codes_get, codes_get_long, codes_release
    except ImportError as exc:
        raise IR108QualificationError("ecCodes unavailable; real GRIB audit NOT performed") from exc
    with tempfile.TemporaryFile(mode="w+b") as scratch:
        _decode_path(path, scratch)
        gid = codes_grib_new_from_file(scratch)
        if gid is None:
            raise IR108QualificationError("not a valid GRIB2 message")
        try:
            get = lambda key: codes_get(gid, key)
            get_int = lambda key: int(codes_get_long(gid, key))
            data_date, data_time = get_int("dataDate"), get_int("dataTime")
            valid_date, valid_time = get_int("validityDate"), get_int("validityTime")
            actual_run = datetime.strptime(f"{data_date:08d}{data_time:04d}",
                                           "%Y%m%d%H%M").replace(tzinfo=timezone.utc)
            actual_valid = datetime.strptime(f"{valid_date:08d}{valid_time:04d}",
                                             "%Y%m%d%H%M").replace(tzinfo=timezone.utc)
            iso = lambda date: date.isoformat(timespec="seconds").replace("+00:00", "Z")
            meta = {
                "edition": get_int("edition"), "centre": get_int("centre"),
                "discipline": get_int("discipline"),
                "category": get_int("parameterCategory"),
                "number": get_int("parameterNumber"),
                "units": str(get("units")), "stepType": str(get("stepType")),
                "gridType": str(get("gridType")), "numberOfPoints": get_int("numberOfPoints"),
                "uuidOfHGrid": str(get("uuidOfHGrid")),
                "numberOfGridUsed": get_int("numberOfGridUsed"),
                "numberOfGridInReference": get_int("numberOfGridInReference"),
                "bitmapPresent": get_int("bitmapPresent"),
                "startStep": get("startStep"), "endStep": get("endStep"),
                "stepUnits": get_int("stepUnits"), "run": iso(actual_run),
                "valid": iso(actual_valid),
                "shortName": str(get("shortName")),
                "name": str(get("name")),
            }
            # Keep all spectral header values for audit, without treating a
            # historically matching signature as current-product admission.
            for key in SPECTRAL_KEYS:
                try:
                    meta[key] = int(codes_get_long(gid, key))
                except (KeyError, ValueError, RuntimeError):
                    meta[key] = None
            record = validate_header(meta, run)
            if audit_values:
                # Existing MID RUC bitmap routine preserves all 542040 native
                # positions and turns only explicit GRIB bitmap holes into NaN.
                # Do not treat ecCodes' numeric missing sentinel as dry/clear.
                from grib_bitmap import decode_bitmap_values
                record["brightnessKelvinAudit"] = audit_brightness_kelvin(
                    decode_bitmap_values(gid), expected_points=NATIVE_GRID[3]
                )
                record["valueAndMissingQuality"] = "NATIVE_BITMAP_AND_KELVIN_AUDITED"
            record["rawParameterIdentifiers"] = {"shortName": meta["shortName"],
                                                 "name": meta["name"]}
        finally:
            codes_release(gid)
        # One native field per referenced candidate; no silent acceptance of mixed GRIB.
        second = codes_grib_new_from_file(scratch)
        if second is not None:
            codes_release(second)
            raise IR108QualificationError("multiple GRIB messages in a single candidate")
        return record


def audit_manifest(path: Path, *, audit_values: bool = False) -> dict:
    document = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema") != SCHEMA:
        raise IR108QualificationError("unsupported candidate manifest schema")
    run, first_valid, items = document.get("run"), document.get("firstValid"), document.get("frames")
    utc(run)
    utc(first_valid)
    if not isinstance(items, list) or len(items) != 10:
        raise IR108QualificationError("manifest requires ten candidate frame entries")
    # A repeated local filename, URL, or digest is not a ten-frame original series.
    # The source URL must be in the exact declared DWD initialization directory.
    names, urls, digests = set(), set(), set()
    output = []
    for frame in items:
        if not isinstance(frame, dict):
            raise IR108QualificationError("invalid manifest frame")
        url = frame.get("sourceUrl")
        check_source_url(url)
        if unquote(urlsplit(url).path.split("/")[9]) != utc(run).strftime("%Y-%m-%dT%H:%M"):
            raise IR108QualificationError("DWD source URL initialization does not match the manifest")
        if frame.get("name") in names or url in urls or frame.get("sha256") in digests:
            raise IR108QualificationError("duplicate source URL, hash or local frame name")
        names.add(frame.get("name"))
        urls.add(url)
        digests.add(frame.get("sha256"))
        local = _checked_file(path.parent / "frames", frame.get("name"))
        digest = frame.get("sha256")
        if not isinstance(digest, str) or re.fullmatch(r"[a-f0-9]{64}", digest) is None:
            raise IR108QualificationError("invalid or missing expected file digest")
        if _sha256(local) != digest:
            raise IR108QualificationError("source SHA-256 differs from manifest")
        record = inspect_local_grib(local, run, audit_values=True) if audit_values else inspect_local_grib(local, run)
        if record["leadSeconds"] != source_lead_seconds(url):
            raise IR108QualificationError("DWD source filename lead differs from decoded GRIB validity")
        record["sha256"] = digest
        output.append(record)
    ordered = validate_frame_sequence(output, run, first_valid)
    # Parameter 3/1/14 and source-directory provenance alone cannot distinguish
    # IR10.8 from WV6.2. Also missing bitmap/data/min-max/spatial proof.
    return {"schema": SCHEMA, "run": run, "firstValid": first_valid,
            "candidateFrames": len(ordered), "records": ordered,
            "headerAndCadenceAudit": "PASS",
            "fullBitmapValueAudits": sum(
                item["valueAndMissingQuality"] == "NATIVE_BITMAP_AND_KELVIN_AUDITED"
                for item in ordered
            ),
            "spectralMatches": sum(
                item["channelIdentity"] == "DWD_PDT32_SEVIRI_IR108_SPECTRAL_MATCH"
                for item in ordered
            ),
            "activationAuthorized": False,
            "blockers": [
                "all ten current-run IR10.8 files require actual spectrally decoded GRIB and value audit",
                "native value/bitmap/range and CLAT-CLON geographic verification",
                "bounded georeferenced raster renderer and cache budget",
                "source/installer/browser/production gates on an unchanged SHA",
            ]}


def main() -> int:
    cli = argparse.ArgumentParser(description="Offline DWD native IR10.8 GRIB source auditor (never publishes)")
    cli.add_argument("--manifest", type=Path, required=True)
    cli.add_argument("--audit-values", action="store_true",
                     help="Decode true ecCodes + native bitmap + Kelvin extrema; never publishes")
    args = cli.parse_args()
    try:
        result = audit_manifest(args.manifest, audit_values=args.audit_values)
        print(json.dumps(result, sort_keys=True))
    except (IR108QualificationError, OSError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({"schema": SCHEMA, "activationAuthorized": False,
                          "headerAndCadenceAudit": "FAIL", "error": str(exc)}, sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
