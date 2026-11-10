#!/usr/bin/env python3
"""Offline regression tests for the 0-USD RUC R2 QA (no network and no writes)."""
from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from ruc_r2_zero_cost_qa import load_inventory, verify_local_bytes, evaluate, projected_class_a_for_object, project_class_b_from_consumer


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



    def test_historical_original_dwd_full_raw_storage_hard_block(self):
        """A historic SHA-labeled DWD proof is not a deployed R2-byte proof."""
        proof_path = Path(__file__).resolve().parents[2] / 'docs/implementation/MID_C46_RUC27_BUILD_PROOF.json'
        proof = json.loads(proof_path.read_text(encoding='utf-8'))
        self.assertEqual(proof['schema'], 'mid.ruc.extended-core-build-proof.v1')
        self.assertEqual(proof['runId'], 40321851403)
        self.assertEqual(proof['headSha'], '01563be16d42a476188f048394ef0edf481c8e6d')
        self.assertFalse(proof['productionApproved'])
        self.assertEqual((proof['pointCount'], proof['deterministicTimes'],
                          proof['epsTimes'], proof['epsSummaryTimes'], proof['memberCount']),
                         (542040, 28, 28, 28, 20))
        objects = proof['objects']
        self.assertEqual(len(objects), 12)
        self.assertEqual(objects['eps-members.bin']['bytes'], 607084800)
        self.assertEqual(sum(obj['bytes'] for obj in objects.values()), 1999625598)
        inv = {'schema':'mid.ruc.r2.offline-inventory.v1',
               'stableSha':proof['headSha'], 'run':proof['run'],
               'horizonHours':27, 'timeCount':28, 'epsMemberCount':20,
               'nativeEpsMemberObjectsIncluded':True,
               'originalSourceProofSha256':proof['artifactSha256'],
               'objects':[{'key':name, **descriptor} for name,descriptor in objects.items()]}
        report = evaluate(inv, projected_reads=100000, projected_worker_requests_per_day=1000)
        self.assertEqual(report['offlineInventoryBytes'], 1999625598)
        self.assertEqual(report['projectedPeakStorageBytes'], 11997753588)
        self.assertGreater(report['projectedPeakStorageBytes'], 10000000000)
        self.assertIn('RUC internal storage planning ceiling exceeded',report['blockers'])
        self.assertFalse(report['productionApproved'])
        self.assertFalse(report['activationAuthorized'])
        # This uses original proof DESCRIPTORS, not local byte verification.
        # Real R2 pack SHA parity/codec/clients/account-wide cost remain unapproved.


    def offline_consumer_trace(self):
        return {
            "schema": "mid.ruc.r2.offline-consumer-parity.v1",
            "run": self.inv["run"],
            "sourceSha": self.inv["stableSha"],
            "sampledNativeCells": [0, 1, 7, 47, 1704, 271020, 542039],
            "checkedNativeProductRecords": 70,
            "simulatedR2RangeReads": 70,
            "maxR2ReadsForOneCell": 10,
            "allPointBytesMatchOriginal": True,
            "productionApproved": False,
            "r2ActivationAuthorized": False,
        }

    def test_measured_consumer_class_b_exhaustion(self):
        """Uncached ten-product point reads must not pass the 0-USD margin."""
        inv = self.inventory()
        trace = self.offline_consumer_trace()
        low = project_class_b_from_consumer(inv, trace, forecast_requests_per_day=5000)
        high = project_class_b_from_consumer(inv, trace, forecast_requests_per_day=6000)
        self.assertEqual(low["projectedClassBPerMonth"], 1860000)
        self.assertEqual(high["projectedClassBPerMonth"], 2232000)
        self.assertEqual(low["totalClassBReadsPerFullPoint"], 12)
        self.assertEqual(low["maxFullPointRequestsPerDayWithinInternalClassBBudget"], 5376)
        self.assertFalse(low["productionApproved"])
        self.assertFalse(high["r2ActivationAuthorized"])
        report = evaluate(inv, projected_reads=high["projectedClassBPerMonth"],
                          projected_worker_requests_per_day=6000)
        self.assertIn("RUC internal Class B planning ceiling exceeded", report["blockers"])

    def test_consumer_projection_rejects_cross_run_trace(self):
        inv = self.inventory()
        trace = self.offline_consumer_trace()
        trace["run"] = "2026-11-10T03:00"
        with self.assertRaisesRegex(ValueError, "source/run/byte proof mismatch"):
            project_class_b_from_consumer(inv, trace, forecast_requests_per_day=1000)

    def test_consumer_projection_rejects_false_or_missing_original_parity(self):
        inv = self.inventory()
        trace = self.offline_consumer_trace()
        trace["allPointBytesMatchOriginal"] = False
        with self.assertRaisesRegex(ValueError, "source/run/byte proof mismatch"):
            project_class_b_from_consumer(inv, trace, forecast_requests_per_day=1000)
        trace = self.offline_consumer_trace()
        trace["sampledNativeCells"] = [0]
        with self.assertRaisesRegex(ValueError, "incomplete/untrusted"):
            project_class_b_from_consumer(inv, trace, forecast_requests_per_day=1000)

    def test_consumer_projection_refuses_unmeasured_cache_savings(self):
        inv = self.inventory()
        trace = self.offline_consumer_trace()
        with self.assertRaisesRegex(ValueError, "noncanonical conservative"):
            project_class_b_from_consumer(inv, trace, forecast_requests_per_day=1000,
                                          uncached_metadata_reads=0)
        with self.assertRaisesRegex(ValueError, "invalid forecast demand"):
            project_class_b_from_consumer(inv, trace, forecast_requests_per_day=-1)
        measured = project_class_b_from_consumer(inv, trace, forecast_requests_per_day=0)
        self.assertTrue(measured["assumedNoCache"])
        self.assertFalse(measured["productionApproved"])


if __name__ == "__main__":
    unittest.main()
