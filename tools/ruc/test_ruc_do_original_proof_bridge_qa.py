#!/usr/bin/env python3
"""Negative testing of SHA-pinned original-DWD metadata evidence only."""
from __future__ import annotations
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from ruc_do_original_proof_bridge_qa import EXPECTED, PRODUCER_SHA, read_proof


class PinnedProofBridgeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = Path(os.environ["MID_RUC_PROOF_DIR"]).resolve(strict=True)

    def test_original_source_metadata_and_70_point_read_proof(self):
        result = read_proof(self.source)
        self.assertEqual(result["nativeLeadHours"], 27)
        self.assertEqual(result["nativeEPSMembers"], 20)
        self.assertEqual(result["originalObjectCount"], 12)
        self.assertEqual(result["originalBytesPreviouslyVerified"], 1999624596)
        self.assertEqual(result["independentOriginalPointRecordsPreviouslyCompared"], 70)
        self.assertTrue(result["historicalProofMetadataPinnedAndCheckedNow"])
        self.assertFalse(result["sourceChecksRecomputedFromOriginalBytesNow"])
        self.assertFalse(result["dwdOfficialSignatureVerified"])
        self.assertFalse(result["midCiTrustedIssuerKeyConfigured"])
        self.assertFalse(result["productionApproved"])
        self.assertFalse(result["activationAuthorized"])

    def copy(self):
        directory = tempfile.TemporaryDirectory(prefix="mid-do-provenance-test-")
        self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        for name in EXPECTED:
            shutil.copyfile(self.source / name, root / name)
        return root

    def test_same_length_bit_flip_in_index_rejected(self):
        directory = self.copy()
        path = directory / "range-index.json"
        content = bytearray(path.read_bytes())
        content[-3] ^= 1
        path.write_bytes(content)
        with self.assertRaisesRegex(ValueError, "pinned SHA mismatch"):
            read_proof(directory)

    def test_forged_run_or_source_sha_rejected(self):
        directory = self.copy()
        path = directory / "inventory.json"
        orig = path.read_bytes()
        canonical = PRODUCER_SHA.encode("ascii")
        self.assertGreaterEqual(orig.count(canonical), 1)
        path.write_bytes(orig.replace(canonical, b"f" * 40, 1))
        self.assertEqual(path.stat().st_size, len(orig))  # genuine same-size tamper
        with self.assertRaisesRegex(ValueError, "pinned SHA mismatch"):
            read_proof(directory)

    def test_missing_evidence_is_fail_closed(self):
        directory = self.copy()
        (directory / "consumer-parity.json").unlink()
        with self.assertRaisesRegex(ValueError, "missing/wrong-sized"):
            read_proof(directory)

    def test_untrusted_symlink_is_fail_closed(self):
        directory = self.copy()
        path = directory / "report.json"
        path.unlink()
        path.symlink_to(self.source / "report.json")
        with self.assertRaisesRegex(ValueError, "symlinked"):
            read_proof(directory)


if __name__ == "__main__":
    unittest.main()
