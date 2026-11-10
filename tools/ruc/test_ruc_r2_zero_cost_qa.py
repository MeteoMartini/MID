#!/usr/bin/env python3
"""Offline regression tests for the 0-USD RUC R2 QA (no network and no writes)."""
from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from ruc_r2_zero_cost_qa import load_inventory, verify_local_bytes, evaluate, projected_class_a_for_object


class CostQA(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.data = b"real zero \x00 and missing sentinel \x80 are distinct\n"
        (self.root/"core.bin").write_bytes(self.data)
        self.inv = {
            "schema": "mid.ruc.r2.offline-inventory.v1",
            "stableSha": "a"*40,
            "run": "2026-11-10T02:00",
            "horizonHours": 27,
            "timeCount": 28,
            "epsMemberCount": 20,
            "nativeEpsMemberObjectsIncluded": True,
            "originalSourceProofSha256": "b"*64,
            "objects": [{"key":"core.bin","bytes":len(self.data),
                         "sha256":hashlib.sha256(self.data).hexdigest()}],
        }

    def inventory(self):
        path = self.root/"inventory.json"
        path.write_text(json.dumps(self.inv))
        return load_inventory(path)

    def test_valid_fixture_never_approves_billable_subscription(self):
        inventory = self.inventory()
        verify_local_bytes(inventory,self.root)
        report = evaluate(inventory,projected_reads=10,projected_worker_requests_per_day=10)
        self.assertFalse(report["productionApproved"])
        self.assertFalse(report["activationAuthorized"])
        self.assertIn("R2 metered billing has no verified hard 0-USD cap",report["blockers"])

    def test_same_size_tampering_is_rejected_by_sha(self):
        inventory = self.inventory()
        (self.root/"core.bin").write_bytes(b"x"*len(self.data))
        with self.assertRaisesRegex(ValueError, "SHA mismatch"):
            verify_local_bytes(inventory,self.root)

    def test_missing_original_eps_is_rejected(self):
        self.inv["nativeEpsMemberObjectsIncluded"] = False
        with self.assertRaisesRegex(ValueError, "native EPS20"):
            self.inventory()

    def test_missing_provenance_is_rejected(self):
        self.inv.pop("originalSourceProofSha256")
        with self.assertRaisesRegex(ValueError, "source attestation"):
            self.inventory()

    def test_missing_run_hours_rejected(self):
        self.inv["timeCount"] = 15
        with self.assertRaisesRegex(ValueError, "0..27h"):
            self.inventory()

    def test_invalid_model_run_rejected(self):
        self.inv["run"] = "2026-11-90T02:00"
        with self.assertRaisesRegex(ValueError, "UTC"):
            self.inventory()

    def test_path_traversal_rejected(self):
        self.inv["objects"][0]["key"] = "../core.bin"
        with self.assertRaisesRegex(ValueError, "object key"):
            self.inventory()

    def test_missing_read_and_worker_demand_blocks_qa(self):
        report = evaluate(self.inventory())
        self.assertIn("Class B demand not measured",report["blockers"])
        self.assertIn("Worker demand not measured",report["blockers"])

    def test_monthly_multipart_count_and_storage_peak(self):
        self.inv["objects"][0]["bytes"] = 586_920_708
        # Estimate only: not local-byte-qualified since fixture bytes differ.
        estimate = evaluate(self.inv,projected_reads=1,projected_worker_requests_per_day=1)
        self.assertEqual(estimate["projectedPeakStorageBytes"], 586_920_708*6)
        self.assertGreater(projected_class_a_for_object(586_920_708), 2)
        self.assertFalse(estimate["productionApproved"])

    def test_class_a_overload_blocks(self):
        self.inv["objects"][0]["bytes"] = 10_000_000_000
        report = evaluate(self.inv,projected_reads=1,projected_worker_requests_per_day=1)
        self.assertIn("RUC internal Class A planning ceiling exceeded",report["blockers"])
        self.assertIn("RUC internal storage planning ceiling exceeded",report["blockers"])

    def test_unverified_account_share_blocks_even_if_self_declared(self):
        report = evaluate(self.inventory(), projected_reads=1,
                          projected_worker_requests_per_day=1, account_usage_verified=True)
        self.assertFalse(report["productionApproved"])
        self.assertIn("R2 metered billing has no verified hard 0-USD cap", report["blockers"])


if __name__ == "__main__":
    unittest.main()
