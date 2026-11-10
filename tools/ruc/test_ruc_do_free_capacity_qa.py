#!/usr/bin/env python3
"""Synthetic transaction tests and measured-size fixture for DO-free QA only."""
from __future__ import annotations
import json
import math
import sqlite3
import tempfile
import unittest
from pathlib import Path

from ruc_do_free_capacity_qa import capacity, prepare_simulated_coordinator, simulated_cas


class DOFreeQATest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="mid-ruc-do-qa-")
        self.addCleanup(self.tmp.cleanup)
        self.db = sqlite3.connect(Path(self.tmp.name) / "coord.db")
        self.addCleanup(self.db.close)
        prepare_simulated_coordinator(self.db)
        # Actual published offline 128-KiB original-DWD range pack byte
        # inventory (archive #13746075942, HEAD 16bf1cb8...). Only measured
        # sizes are mirrored here. SHA/byte parity is separately evidenced;
        # these size fixtures MUST NOT be presented as a live R2/DO upload.
        sizes = [225243676,141719910,28677040,700804,19355840,10199362,
                 36467,6929437,18100909,16950614,32247473,169456500,
                 14724,3157750]
        self.inv = {
            "schema": "mid.ruc.r2.offline-inventory.v1",
            "run": "2026-11-09T14:00",
            "stableSha": "d8852f672a40d26348d214dc85e9a3a1b9d79c1f",
            "horizonHours": 27,
            "timeCount": 28,
            "epsMemberCount": 20,
            "nativeEpsMemberObjectsIncluded": True,
            "objects": [{"key": f"sample-{i:02d}", "bytes": size} for i,size in enumerate(sizes)],
        }
        self.assertEqual(sum(sizes), 672790506)

    def test_4_retained_1_serialized_staging_physical_margins(self):
        report = capacity(self.inv)
        self.assertEqual(report["sourceBytesPerRun"], 672790506)
        self.assertEqual(report["sqliteRowsPerRun"], 177)
        self.assertEqual(report["estimatedRowsWrittenDayAt24RunsTwoAttempts"], 8496)
        self.assertEqual(report["estimatedPhysicalBytesPerRunIncluding15PctReserve"], 773709082)
        self.assertEqual(report["estimatedAccountPeakBytesIncluding15PctReserve"], 3868545410)
        self.assertTrue(report["estimatedWithinInternalPlanningEnvelope"])
        self.assertFalse(report["productionApproved"])
        self.assertFalse(report["activationAuthorized"])
        self.assertFalse(report["zeroExtraCostActivated"])

    def test_two_concurrent_staging_runs_would_exceed_internal_buffer(self):
        r = capacity(self.inv)
        self.assertGreater(r["estimatedPhysicalBytesPerRunIncluding15PctReserve"]*6, 4500000000)
        self.assertEqual(r["simultaneousStagingRuns"], 1)

    def test_native_27h_eps20_is_strict(self):
        self.inv["epsMemberCount"] = 19
        with self.assertRaisesRegex(ValueError, "native EPS20"):
            capacity(self.inv)
        self.inv["epsMemberCount"] = 20
        self.inv["timeCount"] = 15
        with self.assertRaisesRegex(ValueError, "native 27h"):
            capacity(self.inv)

    def test_stale_writer_and_nonmonotonic_run_leave_lastgood(self):
        self.assertEqual(simulated_cas(self.db, expected_generation=0, run="2026-11-09T14:00",
                                       digest="a"*64, original_verified=True,
                                       all_immutable_objects_present=True),1)
        self.assertEqual(simulated_cas(self.db, expected_generation=1, run="2026-11-09T15:00",
                                       digest="b"*64, original_verified=True,
                                       all_immutable_objects_present=True),2)
        with self.assertRaisesRegex(ValueError,"stale writer"):
            simulated_cas(self.db, expected_generation=1, run="2026-11-09T16:00",
                          digest="c"*64, original_verified=True,
                          all_immutable_objects_present=True)
        with self.assertRaisesRegex(ValueError,"non-monotonic"):
            simulated_cas(self.db, expected_generation=2, run="2026-11-09T14:00",
                          digest="c"*64, original_verified=True,
                          all_immutable_objects_present=True)
        self.assertEqual(self.db.execute("SELECT generation,run FROM active WHERE id=1").fetchone(),
                         (2,"2026-11-09T15:00"))

    def test_unverified_and_missing_payload_cannot_change_pointer(self):
        simulated_cas(self.db,expected_generation=0,run="2026-11-09T14:00",
                      digest="d"*64,original_verified=True,all_immutable_objects_present=True)
        for proved,complete in ((False,True),(True,False)):
            with self.assertRaisesRegex(ValueError,"source proof"):
                simulated_cas(self.db,expected_generation=1,run="2026-11-09T15:00",
                              digest="d"*64,original_verified=proved,
                              all_immutable_objects_present=complete)
        self.assertEqual(self.db.execute("SELECT generation,run FROM active WHERE id=1").fetchone(),
                         (1,"2026-11-09T14:00"))

    def test_free_quota_failure_is_not_a_successful_transaction(self):
        conn=sqlite3.connect(Path(self.tmp.name) / "tiny.db")
        self.addCleanup(conn.close)
        conn.execute("PRAGMA page_size=4096")
        conn.execute("PRAGMA max_page_count=8")
        conn.execute("CREATE TABLE marker (id INTEGER PRIMARY KEY, payload BLOB)")
        conn.execute("INSERT INTO marker VALUES(1,?)",(b"last-good",))
        conn.commit()
        with self.assertRaises(sqlite3.DatabaseError):
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("INSERT INTO marker VALUES(2,?)",(b"x"*400000,))
            conn.commit()
        conn.rollback()
        self.assertEqual(conn.execute("SELECT payload FROM marker WHERE id=1").fetchone()[0],
                         b"last-good")
        self.assertIsNone(conn.execute("SELECT payload FROM marker WHERE id=2").fetchone())


if __name__=="__main__":
    unittest.main()
