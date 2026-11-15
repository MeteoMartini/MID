"""Deterministic negative and positive SHADOW tests; no DWD network or ecCodes.

Only a real, separately staged 10-IR + 30-GSP GRIB ecCodes audit can
establish original-data admission. Fixtures cannot activate MID weather.
"""
import hashlib
import json
import math
import tempfile
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

from ir108_original_probe import NATIVE_GRID, utc
from original_15min_phase_gate import (
    RATE_PARAMETERS, SCHEMA, PhaseOriginalError, audit_rate_manifest,
    audit_rate_values, phase_cell, source_lead, validate_rate_metadata,
)

RUN = "2026-11-15T15:00:00Z"
UUID = NATIVE_GRID[0]


def name(i):
    return f"PT{i//4:03d}H{(i%4)*15:02d}M.grib2"


def valid(i):
    return (utc(RUN) + timedelta(minutes=15*i)).strftime("%Y-%m-%dT%H:%M:%SZ")


def url(p, i):
    return (f"https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/"
            f"p/{p}/r/2026-11-15T15%3A00/s/{name(i)}")


def meta(product, i):
    return {
        "edition": 2, "centre": 78, "discipline": 0, "category": 1,
        "number": RATE_PARAMETERS[product], "uuidOfHGrid": UUID,
        "gridType": "unstructured_grid", "numberOfGridUsed": 47,
        "numberOfGridInReference": 1, "numberOfPoints": NATIVE_GRID[3],
        "bitmapPresent": 1, "stepType": "instant",
        "typeOfFirstFixedSurface": 1, "units": "kg m**-2 s**-1",
        "run": RUN, "valid": valid(i), "startStep": 15*i,
        "endStep": 15*i, "stepUnits": 0,
    }


class Native15MinGspPhaseTests(unittest.TestCase):
    def test_original_instantaneous_surface_flux_identity(self):
        for product, number in RATE_PARAMETERS.items():
            with self.subTest(product=product):
                record = validate_rate_metadata(meta(product, 1), product, RUN)
                self.assertEqual(record["parameter"], f"0/1/{number}")
                self.assertEqual(record["stepType"], "instant")
                self.assertEqual(record["unit"], "kg m-2 s-1")
                self.assertFalse(record["isOfficialWmoWeatherCode"])
                self.assertEqual(record["leadSeconds"], 900)
        self.assertEqual(source_lead(url("PRR_GSP", 9), "PRR_GSP", RUN), 8100)

    def test_wrong_run_time_field_units_grid_wmo_or_accumulation_refused(self):
        product = "PRS_GSP"
        for change in (
            {"run": "2026-11-15T14:00:00Z"},
            {"valid": valid(2)}, {"startStep": 0},
            {"stepType": "accum"}, {"units": "kg m**-2"},
            {"number": 77}, {"uuidOfHGrid": "0"*32},
            {"bitmapPresent": 254}, {"numberOfGridUsed": 48},
            {"typeOfFirstFixedSurface": 103},
            {"numberOfPoints": 542039}, {"stepUnits": 1},
        ):
            with self.subTest(change=change):
                with self.assertRaises(PhaseOriginalError):
                    validate_rate_metadata({**meta(product, 1), **change},
                                           product, RUN)
        for forged in (
            url(product, 1).replace("/PRS_GSP/", "/SNOW_GSP/"),
            url(product, 1).replace("opendata.dwd.de", "opendata.dwd.de.evil.test"),
            url(product, 1)+"?token=a",
            url(product, 1).replace("/s/", "/"),
            url(product, 1).replace("PT000H15M", "PT000H18M"),
            url(product, 1).replace("https://", "http://"),
        ):
            with self.subTest(url=forged):
                with self.assertRaises(PhaseOriginalError):
                    source_lead(forged, product, RUN)

    def test_original_bitmap_missing_extremes_and_genuine_zero(self):
        result = audit_rate_values([0., None, float("nan"), .00004, .15],
                                   points=5)
        self.assertEqual(result["validCells"], 3)
        self.assertEqual(result["missingCells"], 2)
        self.assertEqual(result["exactZeroCells"], 1)
        self.assertEqual(result["maximumOriginalRateKgM2S"], .15)
        self.assertFalse(result["extremesSmoothed"])
        self.assertFalse(result["missingConvertedToZero"])
        for field in (
            [0., -.001], [0., math.inf], [0., 1.001], [0., True],
            [None, math.nan], [0., 9999], [0., "bad"],
        ):
            with self.subTest(field=field):
                with self.assertRaises(PhaseOriginalError):
                    audit_rate_values(field, points=2)

    def test_partial_diagnostic_never_fabricates_wmo_ww_or_dry_weather(self):
        self.assertEqual(phase_cell(0, 0, 0), "no_gsp_signal")
        self.assertEqual(phase_cell(1e-7, 0, 0), "rain_gsp")
        self.assertEqual(phase_cell(0, 1e-7, 0), "snow_gsp")
        self.assertEqual(phase_cell(0, 0, 1e-7), "graupel_gsp")
        self.assertEqual(phase_cell(1e-7, 1e-7, 0), "mixed_gsp")
        for values in (
            (None, 0, 0), (math.nan, 0, 0), (0, -1, 0),
            (math.inf, 0, 0), (0, 0, True),
        ):
            self.assertEqual(phase_cell(*values), "NoData")

    def make_candidate(self, root):
        rates = Path(root)/"rates"
        rates.mkdir()
        products = {}
        for product in RATE_PARAMETERS:
            frames = rates/"frames"/product
            frames.mkdir(parents=True)
            entries = []
            for i in range(10):
                raw = b"GRIB"+product.encode()+bytes([i])*128+b"7777"
                (frames/name(i)).write_bytes(raw)
                entries.append({"name": name(i), "sourceUrl": url(product, i),
                                "sha256": hashlib.sha256(raw).hexdigest()})
            products[product] = entries
        manifest = rates/"manifest.json"
        manifest.write_text(json.dumps({
            "schema": SCHEMA, "run": RUN, "firstValid": RUN, "products": products,
        }))
        ir = Path(root)/"ir.json"
        ir.write_text("{}")
        ir_report = {
            "headerAndCadenceAudit": "PASS", "spectralMatches": 10,
            "fullBitmapValueAudits": 10, "run": RUN, "firstValid": RUN,
            "records": [{"valid": valid(i)} for i in range(10)],
        }
        return manifest, ir, ir_report

    def test_sha_bound_30_frame_same_run_co_admission_stays_shadown_only(self):
        with tempfile.TemporaryDirectory() as root:
            rates, ir, ir_report = self.make_candidate(root)

            def fake_inspect(file, product, run):
                i = int(file.stem[2:5])*4+int(file.stem[6:8])//15
                record = validate_rate_metadata(meta(product, i), product, run)
                record["nativeValues"] = {
                    "missingCells": 0, "maximumOriginalRateKgM2S": .0001,
                }
                return record

            with patch("original_15min_phase_gate.audit_manifest",
                       return_value=ir_report), patch(
                           "original_15min_phase_gate.inspect_rate_grib",
                           side_effect=fake_inspect):
                report = audit_rate_manifest(rates, ir)
                self.assertEqual(report["originalIRFrames"], 10)
                self.assertEqual(report["originalRateFrames"], 30)
                self.assertFalse(report["activationAuthorized"])
                for product in RATE_PARAMETERS:
                    self.assertEqual(report["products"][product]["originals"], 10)
                # No mock ecCodes read is trusted to hide altered source bytes.
                (rates.parent/"frames"/"PRG_GSP"/name(4)).write_bytes(b"TAMPERED")
                with self.assertRaisesRegex(PhaseOriginalError, "SHA256"):
                    audit_rate_manifest(rates, ir)

    def test_spliced_time_rejected_even_when_all_sha_checks_pass(self):
        with tempfile.TemporaryDirectory() as root:
            rates, ir, ir_report = self.make_candidate(root)

            def wrong_valid(file, product, run):
                i = int(file.stem[2:5])*4+int(file.stem[6:8])//15
                record = validate_rate_metadata(meta(product, i), product, run)
                if product == "PRS_GSP" and i == 2:
                    record["valid"] = valid(3)
                record["nativeValues"] = {
                    "missingCells": 0, "maximumOriginalRateKgM2S": .01,
                }
                return record

            with patch("original_15min_phase_gate.audit_manifest",
                       return_value=ir_report), patch(
                           "original_15min_phase_gate.inspect_rate_grib",
                           side_effect=wrong_valid):
                with self.assertRaises(PhaseOriginalError):
                    audit_rate_manifest(rates, ir)

    def test_foreign_source_and_missing_rates_refused_before_decode(self):
        with tempfile.TemporaryDirectory() as root:
            rates, ir, ir_report = self.make_candidate(root)
            original = json.loads(rates.read_text())
            variants = []
            foreign = json.loads(json.dumps(original))
            foreign["run"] = "2026-11-15T16:00:00Z"
            variants.append(foreign)
            short = json.loads(json.dumps(original))
            short["products"]["PRR_GSP"].pop()
            variants.append(short)
            missing = json.loads(json.dumps(original))
            missing["products"].pop("PRS_GSP")
            variants.append(missing)
            wrong_url = json.loads(json.dumps(original))
            wrong_url["products"]["PRS_GSP"][0]["sourceUrl"] = url("PRR_GSP", 0)
            variants.append(wrong_url)
            with patch("original_15min_phase_gate.audit_manifest",
                       return_value=ir_report):
                for variant in variants:
                    rates.write_text(json.dumps(variant))
                    with self.subTest(variant=variant.get("run")), self.assertRaises(
                            PhaseOriginalError):
                        audit_rate_manifest(rates, ir)


if __name__ == "__main__":
    unittest.main()
