#!/usr/bin/env python3
"""Small permanent regression for the historical original-source receipt."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from ruc_do_persisted_origin_receipt_qa import read_retained_receipt

RECEIPT = Path(__file__).resolve().parents[2] / "docs/ruc/MID_RUC_DO_ORIGINAL_PROOF_RECEIPT_453_QA.json"


class RetainedOriginReceiptQA(unittest.TestCase):
    def test_exact_pinned_historical_receipt_never_approves_production(self):
        record = read_retained_receipt(RECEIPT)
        self.assertEqual(record["nativeLeadHours"], 27)
        self.assertEqual(record["nativeEPSMembers"], 20)
        self.assertFalse(record["productionApproved"])
        self.assertFalse(record["activationAuthorized"])
        self.assertFalse(record["actualOriginalDwdBytesSignedHere"])
        self.assertFalse(record["historicalProofMetadataPinnedAndCheckedNow"])

    def tempcopy(self):
        t = tempfile.TemporaryDirectory(prefix="mid-historical-ruc-source-")
        self.addCleanup(t.cleanup)
        target = Path(t.name) / "receipt.json"
        shutil.copyfile(RECEIPT, target)
        return target

    def test_same_size_producer_sha_tamper_fails(self):
        f = self.tempcopy()
        old = f.read_bytes()
        self.assertIn(b"d8852f672a40d26348d214dc85e9a3a1b9d79c1f", old)
        f.write_bytes(old.replace(b"d8852f672a40d26348d214dc85e9a3a1b9d79c1f",
                                  b"f" * 40, 1))
        self.assertEqual(len(old), f.stat().st_size)
        with self.assertRaisesRegex(ValueError, "Git blob SHA"):
            read_retained_receipt(f)

    def test_false_current_original_verification_fails(self):
        f = self.tempcopy()
        a = json.loads(f.read_text())
        a["sourceChecksRecomputedFromOriginalBytesNow"] = True
        f.write_text(json.dumps(a))
        with self.assertRaisesRegex(ValueError, "Git blob SHA"):
            read_retained_receipt(f)

    def test_missing_or_symlink_receipt_fails(self):
        f = self.tempcopy()
        f.unlink()
        with self.assertRaisesRegex(ValueError, "missing/unsafe"):
            read_retained_receipt(f)
        f.symlink_to(RECEIPT)
        with self.assertRaisesRegex(ValueError, "missing/unsafe"):
            read_retained_receipt(f)


if __name__ == "__main__":
    unittest.main()
