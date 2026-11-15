"""Offline-staged, read-only DWD IR10.8 originals — never a MID publication.

Bounded opt-in fetch of exactly TEN forecast frames from ONE advertised DWD run,
from an official directory inventory. Emits sha256 manifest for independent
ir108_original_probe.py (ecCodes) approval. Does not modify RUC/Pages/Worker,
does not upload or claim a qualified channel or build a weather image.

Usage:
python tools/ruc/ir108_stage_originals.py \
  --run 2026-11-15T15:00:00Z --first-valid 2026-11-15T15:30:00Z \
  --output /safe/private/ir108_candidate
"""
from __future__ import annotations

import argparse
import hashlib
import html.parser
import json
import os
import re
import shutil
import tempfile
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from ir108_original_probe import (
    SCHEMA, MAX_COMPRESSED_BYTES, MAX_LEAD_SECONDS, IR108QualificationError,
    source_lead_seconds, utc,
)

SOURCE_ROOT = ("https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/"
               "p/SYNMSG_BT_CL_IR10.8/r/")
NAME = re.compile(r"PT(\d{3})H(00|15|30|45)M\.grib2\Z")
MAX_INDEX_BYTES = 1024 * 1024
FRAME_COUNT = 10


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        raise IR108QualificationError("redirect during DWD source fetch is forbidden")


class FileInventory(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.names: set[str] = set()

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        href = next((v for k, v in attrs if k == "href"), None)
        if isinstance(href, str) and NAME.fullmatch(href):
            self.names.add(href)


def run_dir(run: str) -> str:
    stamp = utc(run)
    if stamp.minute != 0:
        raise IR108QualificationError("ICON-D2-RUC source run is not on the native UTC hour")
    return stamp.strftime("%Y-%m-%dT%H:%M")


def source_dir(run: str) -> str:
    return SOURCE_ROOT + quote(run_dir(run), safe="") + "/s/"


def source_url(run: str, name: str) -> str:
    if NAME.fullmatch(name) is None:
        raise IR108QualificationError("invalid DWD IR10.8 filename")
    url = source_dir(run) + name
    source_lead_seconds(url)
    return url


def _checked_response(response, requested: str) -> None:
    # Disable redirects at the opener as well: checking after a redirect is too late.
    final_url = response.geturl()
    a, b = urlsplit(final_url), urlsplit(requested)
    if (a.scheme != "https" or a.hostname != "opendata.dwd.de"
            or a.username or a.password or a.query or a.fragment
            or unquote(a.path) != unquote(b.path)):
        raise IR108QualificationError("DWD source unexpectedly redirected/changed")
    if getattr(response, "status", 200) != 200:
        raise IR108QualificationError("DWD source returned non-200 HTTP response")


def read_index(run: str, opener) -> set[str]:
    url = source_dir(run)
    with opener.open(Request(url, headers={"User-Agent": "MID-IR108-shadow-qa/1.0"}),
                     timeout=20) as result:
        _checked_response(result, url)
        data = result.read(MAX_INDEX_BYTES + 1)
    if not 30 <= len(data) <= MAX_INDEX_BYTES:
        raise IR108QualificationError("empty/oversized DWD index")
    catalog = FileInventory()
    try:
        catalog.feed(data.decode("utf-8", errors="strict"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise IR108QualificationError("invalid official DWD index HTML") from exc
    if not catalog.names:
        raise IR108QualificationError("no advertised native IR10.8 GRIB frames")
    return catalog.names


def make_plan(run: str, first_valid: str, inventory: set[str]) -> list[dict]:
    reference = utc(run)
    first = utc(first_valid)
    if int(first.timestamp()) % 900:
        raise IR108QualificationError("requested first validity is not a UTC quarter-hour")
    plan = []
    for i in range(FRAME_COUNT):
        valid = first + timedelta(minutes=15 * i)
        lead = int((valid - reference).total_seconds())
        if lead < 0 or lead > MAX_LEAD_SECONDS or lead % 900:
            raise IR108QualificationError("first validity/run cannot yield a valid 10-frame horizon")
        name = f"PT{lead // 3600:03d}H{(lead // 60) % 60:02d}M.grib2"
        if name not in inventory:
            raise IR108QualificationError(f"DWD index missing original forecast lead: {name}")
        url = source_url(run, name)
        if source_lead_seconds(url) != lead:
            raise IR108QualificationError("DWD URL lead differs from absolute validity")
        plan.append({"name": name, "sourceUrl": url, "valid": valid.isoformat(timespec="seconds").replace("+00:00", "Z")})
    return plan


def _read_grib(url: str, opener) -> bytes:
    with opener.open(Request(url, headers={"User-Agent": "MID-IR108-shadow-qa/1.0"}),
                     timeout=25) as result:
        _checked_response(result, url)
        header_size = result.headers.get("Content-Length")
        if header_size is not None and int(header_size) > MAX_COMPRESSED_BYTES:
            raise IR108QualificationError("DWD IR10.8 source file exceeds allowed size")
        data = result.read(MAX_COMPRESSED_BYTES + 1)
    if not 80 <= len(data) <= MAX_COMPRESSED_BYTES:
        raise IR108QualificationError("missing/oversized native GRIB source")
    if header_size is not None and len(data) != int(header_size):
        raise IR108QualificationError("incomplete DWD download")
    # A cheap corruption guard only; full ecCodes/bitmap/header validation is required later.
    if data[:4] != b"GRIB" or data[-4:] != b"7777":
        raise IR108QualificationError("source is not a complete raw GRIB payload")
    return data


def stage(run: str, first_valid: str, destination: Path, opener=None) -> dict:
    run_dir(run)
    if destination.is_symlink() or destination.exists():
        raise IR108QualificationError("refuse to overwrite existing candidate or follow a symlink")
    parent = destination.parent
    if not parent.is_dir() or parent.is_symlink():
        raise IR108QualificationError("staging parent must be an existing ordinary directory")
    opener = opener or build_opener(NoRedirects())
    catalog = read_index(run, opener)
    plan = make_plan(run, first_valid, catalog)
    temp = Path(tempfile.mkdtemp(prefix=".mid-ir108-qa-", dir=parent))
    transferred = 0
    try:
        frames_dir = temp / "frames"
        frames_dir.mkdir(mode=0o700)
        entries = []
        for item in plan:
            raw = _read_grib(item["sourceUrl"], opener)
            transferred += len(raw)
            digest = hashlib.sha256(raw).hexdigest()
            (frames_dir / item["name"]).write_bytes(raw)
            entries.append({"name": item["name"], "sourceUrl": item["sourceUrl"],
                            "sha256": digest, "bytes": len(raw)})
        manifest = {"schema": SCHEMA, "run": run, "firstValid": first_valid,
                    "frames": entries}
        (temp / "manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2) + "\n")
        # This is a private candidate directory; no public DWD image or GRIB release.
        if destination.exists() or destination.is_symlink():
            raise IR108QualificationError("staging destination appeared during download")
        os.rename(temp, destination)
    finally:
        if temp.exists():
            shutil.rmtree(temp)
    return {"candidatePath": str(destination), "catalogFrames": len(catalog),
            "stagedFrames": len(entries), "sourceBytes": transferred,
            "source": "DWD ICON-D2-RUC IR10.8 official index and GRIB byte blobs",
            "gribMetadataQualified": False, "channelIdentityQualified": False,
            "activationAuthorized": False}


def main() -> int:
    cli = argparse.ArgumentParser(description="DWD IR10.8 ten-frame SHA-bound staging; NO PUBLISH")
    cli.add_argument("--run", required=True)
    cli.add_argument("--first-valid", required=True)
    cli.add_argument("--output", type=Path, required=True)
    opts = cli.parse_args()
    try:
        print(json.dumps(stage(opts.run, opts.first_valid, opts.output), sort_keys=True))
    except (IR108QualificationError, OSError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({"activationAuthorized": False, "stagedFrames": 0,
                          "error": str(exc)}, sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
