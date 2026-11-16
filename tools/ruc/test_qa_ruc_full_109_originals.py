"""Adversarial synthetic tests. NEVER attest to genuine DWD GRIB contents."""
from __future__ import annotations

import copy
import hashlib
import unittest
from datetime import timedelta

import ir108_original_probe as ir
from qa_ruc_original_horizon_inventory import PRODUCTS, expected_names, inspect_inventory
from qa_ruc_full_109_originals import (
    FRAME_COUNT, LAST_LEAD, FullOriginalError, filename_at,
    full_plan, summarize_product, qualify_full_run, MAX_TOTAL_BYTES,
)
from qa_ruc_original_horizon_inventory import canonical_run

RUNS = ("2026-11-16T08:00:00Z", "2026-11-16T07:00:00Z", "2026-11-16T06:00:00Z")

def catalogue():
    cases = {product: inspect_inventory(expected_names()) for product in PRODUCTS}
    return {
        "catalogue27hQualified": True, "qualifiedRunCount": 3,
        "runs": [
            {"run": run, "products": copy.deepcopy(cases),
             "completeFourProduct27hCatalogue": True}
            for run in RUNS
        ],
    }

def decoded_fake(item, raw):
    lead = item["leadMinutes"]
    product = item["product"]
    valid = (canonical_run(item["run"]) + timedelta(minutes=lead)).strftime(
        "%Y-%m-%dT%H:%M:%SZ")
    base = {"run": item["run"], "product": product, "leadMinutes": lead,
            "valid": valid, "bytes": len(raw), "missingCells": 16968,
            "sha256": hashlib.sha256((product+":"+str(lead)).encode()).hexdigest()}
    if product == "SYNMSG_BT_CL_IR10.8":
        base.update({"originalMinimumKelvin": 215.0, "originalMaximumKelvin": 291.0})
    else:
        base["maximumOriginalRateKgM2S"] = 0.003
    return base

class Full109Tests(unittest.TestCase):
    def test_all_109_quarter_hour_originals_and_four_source_fields(self):
        run, product_plan = full_plan(catalogue())
        self.assertEqual(run, RUNS[0])
        self.assertEqual(set(product_plan), set(PRODUCTS))
        self.assertEqual(sum(len(r) for r in product_plan.values()), 436)
        self.assertEqual(len(product_plan["PRR_GSP"]), FRAME_COUNT)
        self.assertEqual(filename_at(0), "PT000H00M.grib2")
        self.assertEqual(filename_at(855), "PT014H15M.grib2")
        self.assertEqual(filename_at(1620), "PT027H00M.grib2")
        self.assertEqual(product_plan["SYNMSG_BT_CL_IR10.8"][-1]["leadMinutes"], LAST_LEAD)
        for invalid in (-15, 1, 1635, True, "1620"):
            with self.subTest(lead=invalid), self.assertRaises(FullOriginalError):
                filename_at(invalid)

    def test_three_catalogue_run_gate_never_accepts_duplicates_or_missing(self):
        for mutator in (
            lambda j: j.update({"qualifiedRunCount": 2}),
            lambda j: j["runs"].pop(),
            lambda j: j["runs"][2].update({"run": RUNS[0]}),
            lambda j: j["runs"][0]["products"]["PRS_GSP"].update({"complete0To27h": False}),
            lambda j: j["runs"][0]["products"].pop("PRG_GSP"),
        ):
            data = catalogue()
            mutator(data)
            with self.assertRaises(FullOriginalError):
                full_plan(data)

    def test_mocked_436_gribs_are_not_real_data_attestation(self):
        def fake_source(item):
            return b"GRIB"+bytes(100)+b"7777"
        result = qualify_full_run(catalogue(), downloader=fake_source, decoder=decoded_fake)
        self.assertEqual(result["originalsDecodedWithEcCodes"], 436)
        self.assertFalse(result["releaseAuthorized"])
        self.assertFalse(result["activationAuthorized"])
        self.assertFalse(result["rendererVerified"])
        self.assertFalse(result["browserOrIosVerified"])
        self.assertFalse(result["otherRunsFullOriginalBytesVerified"])
        self.assertEqual(result["products"]["PRR_GSP"]["unit"], "kg m-2 s-1")
        self.assertEqual(result["products"]["SYNMSG_BT_CL_IR10.8"]["unit"], "K")
        self.assertEqual(result["products"]["PRR_GSP"]["missingNativeCellsPerOriginal"], 16968)
        self.assertTrue(all(report["originalFrames"]==109 for report in result["products"].values()))
        self.assertEqual(ir.MAX_LEAD_SECONDS, 14*3600)

    def test_no_source_forgery_or_synthetic_missing_to_zero(self):
        _, plan = full_plan(catalogue())
        rows = [decoded_fake(item, b"fake") for item in plan["PRR_GSP"]]
        bad = copy.deepcopy(rows)
        bad[21]["leadMinutes"] = 300
        with self.assertRaises(FullOriginalError):
            summarize_product("PRR_GSP", bad)
        bad = copy.deepcopy(rows)
        bad[21]["sha256"] = bad[20]["sha256"]
        with self.assertRaises(FullOriginalError):
            summarize_product("PRR_GSP", bad)
        bad = copy.deepcopy(rows)
        bad[21]["missingCells"] = -1
        with self.assertRaises(FullOriginalError):
            summarize_product("PRR_GSP", bad)
        bad = copy.deepcopy(rows)
        bad[21]["missingCells"] = 0
        with self.assertRaises(FullOriginalError):
            summarize_product("PRR_GSP", bad)
        with self.assertRaises(FullOriginalError):
            summarize_product("PRR_GSP", rows[:-1])

    def test_forged_decoder_identity_is_rejected_in_full_gate(self):
        def fake_source(item):
            return b"GRIB"+bytes(100)+b"7777"
        def forged(item, raw):
            row = decoded_fake(item, raw)
            if item["leadMinutes"]==855 and item["product"]=="PRS_GSP":
                row["run"] = "2026-11-15T08:00:00Z"
            return row
        with self.assertRaisesRegex(FullOriginalError, "source identity"):
            qualify_full_run(catalogue(), downloader=fake_source, decoder=forged)

    def test_no_unbounded_byte_budget_or_false_release(self):
        self.assertEqual(MAX_TOTAL_BYTES, 384*1024*1024)
        self.assertEqual(ir.MAX_LEAD_SECONDS, 14*3600)

if __name__ == "__main__":
    unittest.main()
