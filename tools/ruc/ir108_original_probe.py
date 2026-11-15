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
import re
import stat
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

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
    return {"run": run, "valid": meta["valid"], "leadSeconds": end,
            "points": grid[-1], "gribParameter": "3/1/14", "unit": "K",
            "bitmapPresent": bitmap, "channelIdentity": "AMBIGUOUS_IR_OR_WV",
            "valueAndMissingQuality": "NOT_EVALUATED"}


def check_source_url(url: str) -> None:
    try:
        parts = urlsplit(url)
    except (ValueError, TypeError) as exc:
        raise IR108QualificationError("invalid source URL") from exc
    segments = parts.path.split("/")
    expected = ["", "weather", "nwp", "v1", "m", "icon-d2-ruc",
                "p", PRODUCT, "r"]
    if (parts.scheme != "https" or parts.netloc != "opendata.dwd.de"
            or parts.username or parts.password or parts.query or parts.fragment
            or segments[:len(expected)] != expected or len(segments) != len(expected) + 2
            or any(part in ("", ".", "..") for part in segments[len(expected):])
            or re.fullmatch(r"[A-Za-z0-9_.-]+\.gr(?:ib|b)2(?:\.bz2)?", segments[-1]) is None):
        raise IR108QualificationError("source URL not bound to an official DWD IR10.8 GRIB file")


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


def inspect_local_grib(path: Path, run: str) -> dict:
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
            record = validate_header(meta, run)
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


def audit_manifest(path: Path) -> dict:
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
        if urlsplit(url).path.split("/")[9] != utc(run).strftime("%Y-%m-%dT%H:%M"):
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
        record = inspect_local_grib(local, run)
        record["sha256"] = digest
        output.append(record)
    ordered = validate_frame_sequence(output, run, first_valid)
    # Parameter 3/1/14 and source-directory provenance alone cannot distinguish
    # IR10.8 from WV6.2. Also missing bitmap/data/min-max/spatial proof.
    return {"schema": SCHEMA, "run": run, "firstValid": first_valid,
            "candidateFrames": len(ordered), "records": ordered,
            "headerAndCadenceAudit": "PASS",
            "activationAuthorized": False,
            "blockers": [
                "independent calibrated IR10.8-versus-WV6.2 identity",
                "native value/bitmap/range and CLAT-CLON geographic verification",
                "bounded georeferenced raster renderer and cache budget",
                "source/installer/browser/production gates on an unchanged SHA",
            ]}


def main() -> int:
    cli = argparse.ArgumentParser(description="Offline DWD native IR10.8 GRIB source auditor (never publishes)")
    cli.add_argument("--manifest", type=Path, required=True)
    args = cli.parse_args()
    try:
        result = audit_manifest(args.manifest)
        print(json.dumps(result, sort_keys=True))
    except (IR108QualificationError, OSError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({"schema": SCHEMA, "activationAuthorized": False,
                          "headerAndCadenceAudit": "FAIL", "error": str(exc)}, sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
