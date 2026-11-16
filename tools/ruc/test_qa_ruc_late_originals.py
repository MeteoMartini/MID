"""Synthetic-only late-lead adversarial tests; never a DWD ecCodes proof."""
import copy
import io
import json
import hashlib
import unittest
from unittest.mock import patch
import ir108_original_probe as ir
from qa_ruc_original_horizon_inventory import PRODUCTS, expected_names, inspect_inventory
from qa_ruc_late_originals import (
    IR_PRODUCT, LateOriginalError, LEADS_MINUTES, SCHEMA,
    diagnostic_ir_27h, fetch_original, filename, make_plan, qualify_late_originals,
    qualify_one, verify_decoded,
)

RUNS = ("2026-11-16T06:00:00Z", "2026-11-16T05:00:00Z", "2026-11-16T04:00:00Z")
def catalogue():
    return {
        "catalogue27hQualified": True, "qualifiedRunCount": 3,
        "activationAuthorized": False,
        "runs": [{"run": run, "completeFourProduct27hCatalogue": True,
                  "products": {p: inspect_inventory(expected_names()) for p in PRODUCTS}}
                 for run in RUNS],
    }

class FakeResponse:
    status = 200
    def __init__(self, url, raw, declared=None):
        self.url, self.raw = url, raw
        self.headers = {"Content-Length": str(len(raw) if declared is None else declared)}
    def geturl(self):
        return self.url
    def read(self, count):
        return self.raw[:count]
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False

class FakeOpener:
    def __init__(self, raw, final=None, declared=None):
        self.raw, self.final, self.declared = raw, final, declared
    def open(self, request, timeout):
        return FakeResponse(self.final or request.full_url, self.raw, self.declared)

def record(item):
    if item["product"] == IR_PRODUCT:
        return {"run": item["run"], "valid": "2026-11-16T20:15:00Z",
                "leadSeconds": 855*60,
                "channelIdentity": "DWD_PDT32_SEVIRI_IR108_SPECTRAL_MATCH",
                "valueAndMissingQuality": "NATIVE_BITMAP_AND_KELVIN_AUDITED",
                "points": ir.NATIVE_GRID[3], "unit": "K",
                "brightnessKelvinAudit": {"nativeCells": ir.NATIVE_GRID[3],
                    "validCells": 540000, "missingCells": 2040,
                    "missingConvertedToZero": False, "extremesSmoothed": False,
                    "rawMinimumKelvin": 180, "rawMaximumKelvin": 332}}
    return {"run": item["run"], "valid": "2026-11-16T20:15:00Z",
            "leadSeconds": 855*60, "nativePoints": ir.NATIVE_GRID[3],
            "unit": "kg m-2 s-1", "stepType": "instant",
            "isOfficialWmoWeatherCode": False,
            "nativeValues": {"validCells": 540000, "missingCells": 2040,
                             "maximumOriginalRateKgM2S": 0.012}}

class BoundaryTests(unittest.TestCase):
    def test_exact_48_genuine_source_plan_and_27h_bounds(self):
        planned = make_plan(catalogue())
        self.assertEqual(len(planned), 48)
        self.assertEqual(len({(x["run"],x["product"],x["leadMinutes"]) for x in planned}), 48)
        self.assertEqual(LEADS_MINUTES, (840,855,1605,1620))
        self.assertEqual(filename(1620),"PT027H00M.grib2")
        self.assertEqual(filename(855),"PT014H15M.grib2")
        with self.assertRaises(LateOriginalError):
            filename(1635)
        self.assertTrue(all(x["url"].startswith("https://opendata.dwd.de/") for x in planned))
        self.assertTrue(all(x["name"] in x["url"] for x in planned))
    def test_corrupt_inventories_source_mismatch_and_duplicate_runs_rejected(self):
        source=catalogue()
        for mutate in (
            lambda c: c.update({"catalogue27hQualified":False}),
            lambda c: c["runs"].append(c["runs"][0]),
            lambda c: c["runs"][0].update({"run":c["runs"][1]["run"]}),
            lambda c: c["runs"][0]["products"].pop("PRS_GSP"),
            lambda c: c["runs"][0]["products"]["PRG_GSP"].update({"complete0To27h":False}),
            lambda c: c["runs"][0]["products"]["PRG_GSP"].update({"term27h15Present":True}),
        ):
            modified=copy.deepcopy(source)
            mutate(modified)
            with self.subTest(case=str(mutate)), self.assertRaises((LateOriginalError,KeyError)):
                make_plan(modified)
    def test_redirect_short_raw_and_invalid_envelope_not_dwd_grib(self):
        item=make_plan(catalogue())[0]
        raw=b"GRIB"+b"x"*100+b"7777"
        self.assertEqual(fetch_original(item,FakeOpener(raw)),raw)
        other=copy.deepcopy(item);other["url"]="https://example.com/file.grib2"
        with self.assertRaises(LateOriginalError):
            fetch_original(other,FakeOpener(raw))
        for opener in (
            FakeOpener(raw,final="https://example.com/redirect"),
            FakeOpener(raw,declared=len(raw)+1),
            FakeOpener(b"GRIB"),
            FakeOpener(b"no-grib"*25),
        ):
            with self.assertRaises(LateOriginalError):
                fetch_original(item,opener)
    def test_isolated_27h_context_does_not_permanently_relax_native_admission(self):
        self.assertEqual(ir.MAX_LEAD_SECONDS,14*3600)
        with diagnostic_ir_27h():
            self.assertEqual(ir.MAX_LEAD_SECONDS,27*3600)
        self.assertEqual(ir.MAX_LEAD_SECONDS,14*3600)
        with self.assertRaises(RuntimeError):
            with diagnostic_ir_27h():
                raise RuntimeError("restore even on failure")
        self.assertEqual(ir.MAX_LEAD_SECONDS,14*3600)
    def test_original_date_spectrum_bitmap_and_extrema_fail_closed(self):
        item=next(x for x in make_plan(catalogue()) if x["run"]==RUNS[0]
                  and x["product"]==IR_PRODUCT and x["leadMinutes"]==855)
        valid=record(item)
        self.assertEqual(verify_decoded(item,valid)["originalMaximumKelvin"],332)
        for key,value in (
            ("channelIdentity","AMBIGUOUS_IR_OR_WV"),
            ("points",500000),
            ("valueAndMissingQuality","NOT_EVALUATED"),
            ("valid","2026-11-16T20:00:00Z"),
        ):
            bad=copy.deepcopy(valid);bad[key]=value
            with self.subTest(key=key),self.assertRaises(LateOriginalError):
                verify_decoded(item,bad)
        bad=copy.deepcopy(valid);bad["brightnessKelvinAudit"]["missingConvertedToZero"]=True
        with self.assertRaises(LateOriginalError):
            verify_decoded(item,bad)
        rate=next(x for x in make_plan(catalogue()) if x["run"]==RUNS[0]
                  and x["product"]=="PRR_GSP" and x["leadMinutes"]==855)
        self.assertEqual(verify_decoded(rate,record(rate))["missingCells"],2040)
        foreign=record(rate);foreign["isOfficialWmoWeatherCode"]=True
        with self.assertRaises(LateOriginalError):
            verify_decoded(rate,foreign)
    def test_fake_grib_can_only_pass_with_explicit_mocked_decoder(self):
        ir_item=next(x for x in make_plan(catalogue()) if x["run"]==RUNS[0]
                      and x["product"]==IR_PRODUCT and x["leadMinutes"]==855)
        fake=b"GRIB"+b"unit-test-only"*10+b"7777"
        with patch("qa_ruc_late_originals.ir.inspect_local_grib",
                   return_value=record(ir_item)) as inspect:
            got=qualify_one(ir_item,opener=FakeOpener(fake))
        self.assertEqual(got["rawSha256"],hashlib.sha256(fake).hexdigest())
        inspect.assert_called_once()
        self.assertEqual(ir.MAX_LEAD_SECONDS,14*3600)
    def test_all_48_required_even_when_pure_fixture_stubs_success(self):
        def mocked(item, opener=None):
            return {"run":item["run"],"product":item["product"],
                    "leadMinutes":item["leadMinutes"],"rawBytes":100,
                    "rawSha256":"a"*64}
        with patch("qa_ruc_late_originals.qualify_one",side_effect=mocked):
            report=qualify_late_originals(catalogue())
        self.assertEqual(report["actualOriginalGribFilesAudited"],48)
        self.assertFalse(report["activationAuthorized"])
        self.assertFalse(report["releaseAuthorized"])
        self.assertFalse(report["nativeLookupVerified"])
        self.assertFalse(report["rendererVerified"])
        self.assertEqual(report["qualificationScope"],
                         "FOUR_BOUNDARY_LEADS_ONLY_NOT_COMPLETE_27H_GRID")
if __name__=="__main__":
    unittest.main()
