"""Deterministic negative/positive tests for read-only native IR10.8 source qualification.

No DWD downloads and no ecCodes dependency in this unit suite. Real GRIB decode,
independent channel disambiguation and browser/render checks remain separate.
"""
import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from ir108_original_probe import (
    SCHEMA, IR108QualificationError, NATIVE_GRID, audit_manifest,
    check_source_url, source_lead_seconds, step_seconds, validate_frame_sequence, validate_header,
)

RUN = "2026-11-15T00:00:00Z"
FIRST = "2026-11-15T00:00:00Z"
URL_BASE = ("https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/"
            "SYNMSG_BT_CL_IR10.8/r/2026-11-15T00%3A00/s/")
URL = URL_BASE + "PT000H15M.grib2"


def grib_filename(index):
    return f"PT{index//4:03d}H{(index%4)*15:02d}M.grib2"



def fixture(index=1):
    valid = datetime(2026, 11, 15, tzinfo=timezone.utc) + timedelta(minutes=15 * index)
    return {
        "edition": 2, "centre": 78, "discipline": 3, "category": 1,
        "number": 14, "units": "K", "stepType": "instant",
        "gridType": "unstructured_grid", "uuidOfHGrid": NATIVE_GRID[0],
        "numberOfGridUsed": NATIVE_GRID[1],
        "numberOfGridInReference": NATIVE_GRID[2],
        "numberOfPoints": NATIVE_GRID[3],
        "bitmapPresent": 1, "run": RUN, "valid": valid.strftime("%Y-%m-%dT%H:%M:00Z"),
        "startStep": index * 15, "endStep": index * 15, "stepUnits": 0,
        "shortName": "unknown",
    }


def records():
    return [validate_header(fixture(i), RUN) for i in range(10)]


class IR108Tests(unittest.TestCase):
    def expect_fail(self, values, fragment=""):
        with self.assertRaises(IR108QualificationError) as caught:
            validate_header(values, RUN)
        if fragment:
            self.assertIn(fragment, str(caught.exception))

    def test_valid_native_quarter_metadata_keeps_ir_wv_ambiguity(self):
        a = validate_header(fixture(1), RUN)
        self.assertEqual(a["leadSeconds"], 900)
        self.assertEqual(a["unit"], "K")
        self.assertEqual(a["gribParameter"], "3/1/14")
        self.assertEqual(a["points"], 542040)
        self.assertEqual(a["channelIdentity"], "AMBIGUOUS_IR_OR_WV")
        self.assertEqual(a["valueAndMissingQuality"], "NOT_EVALUATED")

    def test_wrong_centre_and_edition_fail_closed(self):
        for key, value in [("centre", 98), ("edition", 1)]:
            with self.subTest(key=key):
                a = fixture()
                a[key] = value
                self.expect_fail(a, "foreign")

    def test_wrong_parameter_unit_processing_grid(self):
        for key, value in [
            ("discipline", 0), ("category", 2), ("number", 15),
            ("units", "°C"), ("stepType", "accum"), ("gridType", "regular_ll"),
            ("uuidOfHGrid", "a" * 32), ("numberOfPoints", 100),
        ]:
            with self.subTest(key=key):
                a = fixture()
                a[key] = value
                self.expect_fail(a)

    def test_utc_run_validity_and_native_cadence(self):
        for key, value in [
            ("run", "2026-11-15T01:00:00Z"),
            ("valid", "2026-11-15T00:19:00Z"),
            ("valid", "2026-11-15T00:15:00+00:00"),
            ("startStep", 0), ("endStep", 14),
            ("stepUnits", 2), ("bitmapPresent", 2),
        ]:
            with self.subTest(key=key, value=value):
                a = fixture()
                a[key] = value
                self.expect_fail(a)
        self.assertEqual(step_seconds("0.25h", 1), 900)
        for value, unit in [("1.2s", 13), ("15m", 1), ("3m", 13)]:
            with self.assertRaises(IR108QualificationError):
                step_seconds(value, unit)

    def test_full_ten_original_frame_sequence(self):
        v = validate_frame_sequence(records(), RUN, FIRST)
        self.assertEqual(len(v), 10)
        self.assertEqual(v[0]["valid"], FIRST)
        self.assertEqual(v[-1]["valid"], "2026-11-15T02:15:00Z")
        with self.assertRaises(IR108QualificationError):
            validate_frame_sequence(v[:-1], RUN, FIRST)
        dup = list(v)
        dup[-1] = dict(dup[-2])
        with self.assertRaises(IR108QualificationError):
            validate_frame_sequence(dup, RUN, FIRST)
        wrong = list(v)
        wrong[1] = {**wrong[1], "run": "2026-11-15T01:00:00Z"}
        with self.assertRaises(IR108QualificationError):
            validate_frame_sequence(wrong, RUN, FIRST)
        with self.assertRaises(IR108QualificationError):
            validate_frame_sequence(v, RUN, "2026-11-15T00:04:00Z")

    def test_source_directory_is_channel_claim_not_header_proof(self):
        check_source_url(URL)
        self.assertEqual(source_lead_seconds(URL), 900)
        self.assertEqual(source_lead_seconds(URL_BASE + "PT002H15M.grib2"), 8100)
        for url in [
            URL.replace("SYNMSG_BT_CL_IR10.8", "SYNMSG_BT_CL_WV6.2"),
            URL.replace("opendata.dwd.de", "opendata.dwd.de.evil.example"),
            URL.replace("https://", "http://"),
            URL + "?token=opaque",
            URL.replace("/s/", "/"),
            URL.replace("PT000H15M.grib2", "PT000H15M.grib2.bz2"),
            URL.replace("PT000H15M.grib2", "PT000H17M.grib2"),
            URL.replace("PT000H15M.grib2", "PT028H00M.grib2"),
            "https://opendata.dwd.de/weather/nwp/icon-d2/grib/00/synmsg_bt_cl_ir10.8/",
        ]:
            with self.subTest(url=url):
                with self.assertRaises(IR108QualificationError):
                    check_source_url(url)

    def test_manifest_checks_hash_all_ten_but_never_authorizes(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            folder = base / "frames"
            folder.mkdir()
            frames = []
            for i in range(10):
                name = grib_filename(i)
                raw = b"not-a-real-grib-unit-test-" + bytes([i]) * 120
                (folder / name).write_bytes(raw)
                frames.append({"name": name, "sourceUrl": URL_BASE + grib_filename(i),
                               "sha256": hashlib.sha256(raw).hexdigest()})
            manifest = base / "manifest.json"
            manifest.write_text(json.dumps({"schema": SCHEMA, "run": RUN,
                                            "firstValid": FIRST, "frames": frames}))
            def fake_grib(path, run):
                stem = path.name.split(".")[0]
                n = int(stem[2:5]) * 4 + int(stem[6:8]) // 15
                return validate_header(fixture(n), run)
            with patch("ir108_original_probe.inspect_local_grib", side_effect=fake_grib):
                report = audit_manifest(manifest)
            self.assertEqual(report["candidateFrames"], 10)
            self.assertEqual(report["headerAndCadenceAudit"], "PASS")
            self.assertFalse(report["activationAuthorized"])
            self.assertIn("independent calibrated", " ".join(report["blockers"]))
            duplicated = list(frames)
            duplicated[8] = {**duplicated[8], "sourceUrl": duplicated[7]["sourceUrl"]}
            manifest.write_text(json.dumps({"schema": SCHEMA, "run": RUN,
                                            "firstValid": FIRST, "frames": duplicated}))
            with self.assertRaises(IR108QualificationError):
                audit_manifest(manifest)
            bad_run = list(frames)
            bad_run[8] = {**bad_run[8], "sourceUrl": bad_run[8]["sourceUrl"]
                          .replace("2026-11-15T00%3A00", "2026-11-15T01%3A00")}
            manifest.write_text(json.dumps({"schema": SCHEMA, "run": RUN,
                                            "firstValid": FIRST, "frames": bad_run}))
            with self.assertRaises(IR108QualificationError):
                audit_manifest(manifest)
            manifest.write_text(json.dumps({"schema": SCHEMA, "run": RUN,
                                            "firstValid": FIRST, "frames": frames}))
            wrong_filename_lead = list(frames)
            wrong_filename_lead[8] = {**wrong_filename_lead[8],
                                      "sourceUrl": URL_BASE + "PT003H00M.grib2"}
            manifest.write_text(json.dumps({"schema": SCHEMA, "run": RUN,
                                            "firstValid": FIRST, "frames": wrong_filename_lead}))
            with self.assertRaises(IR108QualificationError):
                audit_manifest(manifest)
            manifest.write_text(json.dumps({"schema": SCHEMA, "run": RUN,
                                            "firstValid": FIRST, "frames": frames}))
            frames[1]["sha256"] = "0" * 64
            manifest.write_text(json.dumps({"schema": SCHEMA, "run": RUN,
                                            "firstValid": FIRST, "frames": frames}))
            with self.assertRaises(IR108QualificationError):
                audit_manifest(manifest)
            frames[1]["sha256"] = hashlib.sha256((folder / frames[1]["name"]).read_bytes()).hexdigest()
            (folder / frames[2]["name"]).unlink()
            (folder / frames[2]["name"]).symlink_to(folder / frames[1]["name"])
            with self.assertRaises(IR108QualificationError):
                audit_manifest(manifest)


if __name__ == "__main__":
    unittest.main()
