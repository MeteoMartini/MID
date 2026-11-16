"""Synthetic adversarial pixel tests. Not real DWD/visual test evidence."""
from __future__ import annotations

import copy
import hashlib
import unittest

import numpy as np

from qa_ruc_original_horizon_inventory import PRODUCTS, expected_names, inspect_inventory
from qa_ruc_full_109_originals import full_plan
from qa_ruc_late_pixel_preview import LATE_LEADS, LatePixelError, audit_png_phase
from ir108_gsp_native_preview import PHASE_IDS

def sample():
    # Five valid IR pixels, one intentionally transparent source pixel;
    # one valid IR pixel has missing GSP data, correctly not dry/zero.
    brightness=(60,85,120,140,180,0)
    alpha=(255,255,255,255,255,0)
    rgba=b''.join(bytes((g,g,g,a)) for g,a in zip(brightness,alpha))
    phase=bytes((
        PHASE_IDS["rain_gsp"],PHASE_IDS["snow_gsp"],
        PHASE_IDS["no_gsp_signal"],PHASE_IDS["NoData"],
        PHASE_IDS["mixed_gsp"],PHASE_IDS["NoData"]))
    return {"rgba":rgba,"phase":phase,"validIrPixels":5,"irMissingPixels":1}

def catalogue():
    return {"catalogue27hQualified":True,"qualifiedRunCount":3,
            "runs":[{"run":f"2026-11-16T{hour:02d}:00:00Z",
                     "completeFourProduct27hCatalogue":True,
                     "products":{p:inspect_inventory(expected_names()) for p in PRODUCTS}}
                    for hour in (8,7,6)]}

class LatePixelQaTests(unittest.TestCase):
    def test_10_consecutive_end_of_27h_original_source_leads(self):
        self.assertEqual(LATE_LEADS,tuple(range(1485,1621,15)))
        self.assertEqual(len(LATE_LEADS),10)
        _, plan=full_plan(catalogue())
        self.assertEqual(sum(1 for p in PRODUCTS for item in plan[p]
                             if item["leadMinutes"] in LATE_LEADS),40)
        self.assertEqual(LATE_LEADS[-1],1620)
        self.assertEqual(LATE_LEADS[0],1485)
    def test_native_missing_ir_and_missing_gsp_are_not_dry_zero(self):
        s=sample()
        metrics=audit_png_phase(s)
        self.assertEqual(metrics["validPixels"],5)
        self.assertEqual(metrics["missingPixels"],1)
        self.assertEqual(metrics["minimumDisplayedGray"],60)
        self.assertEqual(metrics["maximumDisplayedGray"],180)
        self.assertEqual(metrics["distinctDisplayedGrayLevels"],5)
        self.assertIsNone(metrics["changedValidPixelsFromPreviousOriginal"])
        self.assertEqual(metrics["phaseCategoryCounts"]["NoData"],2)
        self.assertEqual(metrics["phaseCategoryCounts"]["no_gsp_signal"],1)
        self.assertEqual(metrics["phaseCategoryCounts"]["rain_gsp"],1)
    def test_pixel_changes_are_reported_only_for_jointly_valid_originals(self):
        first=sample()
        second=copy.deepcopy(first)
        rgb=bytearray(second["rgba"])
        rgb[:3]=bytes((61,61,61))
        second["rgba"]=bytes(rgb)
        result=audit_png_phase(second, first["rgba"])
        self.assertEqual(result["changedValidPixelsFromPreviousOriginal"],1)
        self.assertEqual(audit_png_phase(first,first["rgba"])[
            "changedValidPixelsFromPreviousOriginal"],0)
    def test_foreign_masks_categories_and_grayscale_fail_closed(self):
        original=sample()
        for edit in ("rgb","mask","phase","length","counts","blank"):
            case=copy.deepcopy(original)
            pixels=bytearray(case["rgba"]);phase=bytearray(case["phase"])
            if edit=="rgb":
                pixels[1]=201
            elif edit=="mask":
                pixels[-1]=128
            elif edit=="phase":
                phase[-1]=0  # masked IR may never become true dry GSP
            elif edit=="length":
                phase.pop()
            elif edit=="counts":
                case["validIrPixels"]=4
            elif edit=="blank":
                for index in range(0,len(pixels),4):
                    if pixels[index+3]==255:
                        pixels[index:index+3]=bytes((80,80,80))
            case["rgba"]=bytes(pixels);case["phase"]=bytes(phase)
            with self.subTest(edit=edit), self.assertRaises(LatePixelError):
                audit_png_phase(case)
    def test_real_source_is_never_pretended_in_test(self):
        # Synthetic fixture tests only; no network calls or status flags.
        self.assertEqual(len(PRODUCTS),4)
        self.assertEqual(PHASE_IDS["NoData"],255)
        self.assertEqual(PHASE_IDS["no_gsp_signal"],0)
if __name__=="__main__":
    unittest.main()
