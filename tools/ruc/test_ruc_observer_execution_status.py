#!/usr/bin/env python3
"""Adversarial MID observer-run evidence tests; no live DWD/Pages access."""
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).parent))
from ruc_observer_execution_status import classify

SHA = "a" * 40
OTHER = "b" * 40
RUN = "2026-10-24T12:00"
AT = "2026-10-24T12:45:00Z"


def directory():
    return {"schema": "mid.ruc.dwd-directory-observation.v1",
            "observedAtUtc": AT, "run": RUN,
            "stages": {"0-6h": {"directoryComplete": True}},
            "eps": {"headerVerified": False, "membersComplete": None}}


def readback(worker=True):
    return {"schema": "mid.ruc.e2e-readback-shadow.v1", "observedAtUtc": AT,
            "pagesRun": RUN, "workerRun": RUN, "pagesValid": True,
            "workerValid": worker, "sameRun": worker,
            "productionSloAuthorized": True, "appAdopted": True}


class TestExecutionStatus(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.dir = self.root / "directory.jsonl"
        self.rb = self.root / "readback.json"

    def classify(self, **kwargs):
        k = {"event_id": 13579, "attempt": 1, "lineage_ready": "true",
             "checkout_sha": SHA, "main_sha": SHA, "stable_sha": SHA,
             "directory": self.dir, "readback": self.rb}
        k.update(kwargs)
        return classify(**k)

    def write(self, rows=None, rb=None):
        if rows is not None:
            self.dir.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
        if rb is not None:
            self.rb.write_text(json.dumps(rb), encoding="utf-8")

    def test_drift_success_is_no_measurement(self):
        x = self.classify(lineage_ready="false", main_sha=OTHER)
        self.assertFalse(x["directoryObserved"])
        self.assertEqual(x["result"], "release-drift-or-unverified-lineage")
        self.assertEqual(x["directorySamples"], 0)
        self.assertFalse(x["productionSloAuthorized"])

    def test_unverified_lineage_not_counted_as_success(self):
        x = self.classify(lineage_ready="", main_sha="")
        self.assertFalse(x["directoryObserved"])
        self.assertEqual(x["result"], "release-drift-or-unverified-lineage")
        with self.assertRaises(ValueError):
            self.classify(lineage_ready="true", stable_sha=OTHER)

    def test_no_files_yields_no_sample(self):
        self.assertEqual(self.classify()["result"], "missing-directory-evidence")
        self.assertFalse(self.classify()["publicReadbackCaptured"])

    def test_directory_only_is_separate(self):
        self.write([directory()])
        x = self.classify()
        self.assertEqual(x["result"], "directory-only-no-public-readback")
        self.assertTrue(x["directoryObserved"])
        self.assertFalse(x["pagesObservedValid"])
        self.assertFalse(x["sameRunObserved"])
        self.assertFalse(x["eps20ValuesVerified"])

    def test_confirmed_worker_remains_observation_not_client_adoption(self):
        self.write([directory()], readback())
        x = self.classify()
        self.assertEqual(x["result"], "directory-and-pages-worker-observed")
        self.assertTrue(x["sameRunObserved"])
        self.assertTrue(x["publicReadbackCaptured"])
        self.assertFalse(x["realClientAdoptionVerified"])
        self.assertFalse(x["productionSloAuthorized"])
        self.assertFalse(x["gribHeaderOrValuesVerified"])

    def test_partial_worker_never_counts_as_complete(self):
        self.write([directory()], readback(False))
        x = self.classify()
        self.assertEqual(x["result"], "directory-with-partial-public-readback")
        self.assertTrue(x["pagesObservedValid"])
        self.assertFalse(x["workerObservedValid"])
        self.assertFalse(x["sameRunObserved"])

    def test_drift_but_files_exist_fails_closed(self):
        self.write([directory()])
        with self.assertRaisesRegex(ValueError, "release-lineage"):
            self.classify(lineage_ready="false", main_sha=OTHER)

    def test_invalid_directory_schema_and_duplicate_run_fail(self):
        self.write([dict(directory(), schema="invented")])
        with self.assertRaises(ValueError):
            self.classify()
        self.write([directory(), directory()])
        with self.assertRaises(ValueError):
            self.classify()

    def test_invalid_directory_time_and_run_fail(self):
        self.write([dict(directory(), observedAtUtc="2026-10-24T11:40:00Z")])
        with self.assertRaises(ValueError):
            self.classify()
        self.write([dict(directory(), run="2026-02-31T12:00")])
        with self.assertRaises(ValueError):
            self.classify()
        self.write([dict(directory(), run="2026-10-24T12:30")])
        with self.assertRaises(ValueError):
            self.classify()

    def test_invalid_readback_claims_rejected(self):
        self.write([directory()], dict(readback(), pagesRun="2026-10-24T11:00"))
        with self.assertRaises(ValueError):
            self.classify()
        self.write([directory()], dict(readback(), sameRun=1))
        with self.assertRaises(ValueError):
            self.classify()
        self.write([directory()], dict(readback(), schema="other"))
        with self.assertRaises(ValueError):
            self.classify()

    def test_missing_and_broken_sha_never_look_ready(self):
        for invalid in ("xyz", "abc" * 20, "0" * 39):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                self.classify(stable_sha=invalid)

    def test_event_provenance_and_clock_rejected(self):
        for key, val in (("event_id", 0), ("event_id", True), ("attempt", 0),
                         ("lineage_ready", "maybe")):
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.classify(**{key: val})
        self.write([directory()], dict(readback(), observedAtUtc="2026-10-24T13:45:00+01:00"))
        with self.assertRaises(ValueError):
            self.classify()


if __name__ == "__main__":
    unittest.main()
