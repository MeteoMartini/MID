"""Offline DWD IR10.8 discovery/staging tests; no network or production side effects."""
from __future__ import annotations

import io
import json
import tempfile
import unittest
from pathlib import Path

from ir108_original_probe import IR108QualificationError, source_lead_seconds, audit_manifest
from ir108_stage_originals import (
    FRAME_COUNT, make_plan, read_index, run_dir, source_dir, source_url, stage,
)

RUN = "2026-11-15T15:00:00Z"
FIRST = RUN


def filename(i):
    return f"PT{i // 4:03d}H{(i % 4) * 15:02d}M.grib2"


def bytes_for(i):
    # Not a real GRIB; only a cheap transport-magic fixture; ecCodes still required.
    return b"GRIB" + bytes([i]) * 192 + b"7777"


class FakeResponse(io.BytesIO):
    def __init__(self, url, payload, redirect=None):
        super().__init__(payload)
        self.url = redirect or url
        self.status = 200
        self.headers = {"Content-Length": str(len(payload))}

    def geturl(self):
        return self.url


class FakeOpener:
    def __init__(self, missing=None, corrupt=None, redirect=None):
        self.missing = missing
        self.corrupt = corrupt
        self.redirect = redirect
        self.urls = []

    def open(self, request, timeout):
        url = request.full_url
        self.urls.append(url)
        if url == source_dir(RUN):
            body = "<html><body>" + "\n".join(
                f'<a href="{filename(i)}">{filename(i)}</a>'
                for i in range(FRAME_COUNT) if i != self.missing
            ) + "</body></html>"
            return FakeResponse(url, body.encode())
        if "/s/PT" not in url:
            raise AssertionError("unexpected URL requested")
        tail = url.rsplit("/", 1)[1]
        index = int(tail[2:5]) * 4 + int(tail[6:8]) // 15
        raw = bytes_for(index)
        if index == self.corrupt:
            raw = b"invalid-transport" + raw
        return FakeResponse(url, raw, self.redirect)


class NativeSourceStageTests(unittest.TestCase):
    def test_real_dwd_run_s_and_lead_naming(self):
        self.assertEqual(run_dir(RUN), "2026-11-15T15:00")
        self.assertEqual(source_lead_seconds(source_url(RUN, "PT000H15M.grib2")), 900)
        self.assertEqual(source_lead_seconds(source_url(RUN, "PT002H15M.grib2")), 8100)
        inventory = read_index(RUN, FakeOpener())
        plan = make_plan(RUN, FIRST, inventory)
        self.assertEqual(len(plan), 10)
        self.assertEqual(plan[0]["name"], "PT000H00M.grib2")
        self.assertEqual(plan[-1]["name"], "PT002H15M.grib2")
        self.assertEqual(plan[-1]["valid"], "2026-11-15T17:15:00Z")

    def test_discover_and_stage_without_product_activation(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "candidate"
            opener = FakeOpener()
            report = stage(RUN, FIRST, dest, opener)
            self.assertEqual(report["stagedFrames"], 10)
            self.assertEqual(len(opener.urls), 11)
            self.assertEqual(report["sourceBytes"], sum(len(bytes_for(i)) for i in range(10)))
            self.assertFalse(report["activationAuthorized"])
            self.assertFalse(report["gribMetadataQualified"])
            self.assertFalse(report["channelIdentityQualified"])
            manifest = json.loads((dest / "manifest.json").read_text())
            self.assertEqual(manifest["schema"], "mid.dwd.icon-d2-ruc.ir108.shadow.v1")
            self.assertEqual(len(manifest["frames"]), 10)
            self.assertEqual(manifest["frames"][-1]["name"], filename(9))
            self.assertEqual((dest / "frames" / filename(9)).read_bytes(), bytes_for(9))
            with self.assertRaises(IR108QualificationError):
                stage(RUN, FIRST, dest, opener)  # no overwrite of existing candidate

    def test_ir108_staging_requires_all_ten_originals_within_14h(self):
        from datetime import datetime, timedelta, timezone
        from ir108_stage_originals import make_plan
        source=datetime(2026,11,15,15,0,tzinfo=timezone.utc)
        def iso(hours,minutes):
            return (source+timedelta(hours=hours,minutes=minutes)).isoformat(
                timespec="seconds").replace("+00:00","Z")
        # 11:45+2:15 = 14:00, the last available 15-minute lead.
        allowed={f"PT{i//4:03d}H{(i%4)*15:02d}M.grib2" for i in range(47,57)}
        self.assertEqual(len(make_plan(RUN,iso(11,45),allowed)),10)
        # 12:00+2:15 = 14:15, even if a foreign directory advertises it.
        extra=allowed|{f"PT{i//4:03d}H{(i%4)*15:02d}M.grib2" for i in range(48,58)}
        with self.assertRaisesRegex(IR108QualificationError,"horizon"):
            make_plan(RUN,iso(12,0),extra)

    def test_missing_native_original_is_no_data_not_interpolation(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "candidate"
            opener = FakeOpener(missing=8)
            with self.assertRaisesRegex(IR108QualificationError, "missing original"):
                stage(RUN, FIRST, dest, opener)
            self.assertFalse(dest.exists())
            self.assertEqual(opener.urls, [source_dir(RUN)])

    def test_corrupt_or_redirected_grib_rejected_atomically(self):
        for candidate in (FakeOpener(corrupt=6), FakeOpener(redirect="https://untrusted.example/GRIB")):
            with self.subTest(candidate=candidate):
                with tempfile.TemporaryDirectory() as tmp:
                    dest = Path(tmp) / "candidate"
                    with self.assertRaises(IR108QualificationError):
                        stage(RUN, FIRST, dest, candidate)
                    self.assertFalse(dest.exists())
                    self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_stale_wrong_run_or_invalid_target_rejected(self):
        with self.assertRaises(IR108QualificationError):
            make_plan(RUN, "2026-11-15T15:04:00Z", set(filename(i) for i in range(10)))
        with self.assertRaises(IR108QualificationError):
            make_plan(RUN, "2026-11-14T23:00:00Z", set(filename(i) for i in range(10)))
        with self.assertRaises(IR108QualificationError):
            run_dir("2026-11-15T15:15:00Z")
        with self.assertRaises(IR108QualificationError):
            source_url(RUN, "PT999H00M.grib2")


if __name__ == "__main__":
    unittest.main()
