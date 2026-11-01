#!/usr/bin/env python3
"""Fail-closed original-formatter P3 timing log accounting tests (no network)."""
import json
import math
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ruc_p3_native_log_audit import assess

RUN = "2026-11-01T14:00"
SHA = "e908b767a9db09df6f07afef86e471978807b5bb"


def fixture(*, run=RUN, download="284.092", build="940.418", **eps_overrides):
    eps = {"schema": "mid.ruc.p3-eps-timings.v1", "chunks": 133,
           "points": 542040, "validTimes": 28, "members": 20,
           "memberPackWriteSeconds": 72.2, "epsSummarySeconds": 500.1,
           "summaryPackWriteSeconds": 33.6}
    eps.update(eps_overrides)
    return (f"2026-11-01T16:32:41Z RUC_P3_PHASES run={run} "
            f"download_stage_seconds={download} native_builder_seconds={build}\n"
            "2026-11-01T16:32:42Z RUC_P3_EPS_TIMINGS " + json.dumps(eps) + "\n")


def check(log):
    return assess(log, workflow_run_id=41332344121, head_sha=SHA, model_run=RUN)


class NativeP3TimingEvidenceTests(unittest.TestCase):
    def test_real_format_accounting_is_descriptive_only(self):
        row = check(fixture())
        self.assertEqual(row["eps"]["chunks"], math.ceil(542040 / 4096))
        self.assertAlmostEqual(row["eps"]["timedTotalSeconds"], 605.9)
        self.assertAlmostEqual(row["nativeBuilderSeconds"], 940.418)
        self.assertAlmostEqual(row["downloadStageSeconds"], 284.092)
        self.assertFalse(row["githubRunShaIndependentlyVerified"])
        self.assertFalse(row["originalGribInputsShaIdentical"])
        self.assertFalse(row["sameInputReferenceVsCandidateAbVerified"])
        self.assertFalse(row["productionSpeedupOrFreshnessSloAuthorized"])

    def test_no_duplicate_or_missing_original_markers(self):
        for log in ("", fixture() + fixture(), fixture().splitlines()[0],
                    fixture().splitlines()[1], "RUC_P3_PHASES incomplete"):
            with self.subTest(log=log[:40]), self.assertRaises(ValueError):
                check(log)

    def test_missing_eps_or_wrong_members_not_treated_as_zero(self):
        for overrides in ({"members": 19}, {"points": 1000}, {"validTimes": 27},
                          {"chunks": 132}, {"epsSummarySeconds": float("nan")},
                          {"epsSummarySeconds": -1}, {"members": True}):
            with self.subTest(overrides=overrides), self.assertRaises(ValueError):
                check(fixture(**overrides))

    def test_nested_times_cannot_exceed_builder(self):
        with self.assertRaises(ValueError):
            check(fixture(epsSummarySeconds=950.0))

    def test_provenance_run_mismatch_and_noncanonical_dates(self):
        with self.assertRaises(ValueError):
            check(fixture(run="2026-11-01T13:00"))
        for run in ("2026-11-01T14:30", "2026-11-01T25:00", "n/a"):
            with self.subTest(run=run), self.assertRaises(ValueError):
                assess(fixture(), workflow_run_id=41332344121, head_sha=SHA, model_run=run)

    def test_invalid_claims_and_durations_are_rejected(self):
        with self.assertRaises(ValueError):
            assess(fixture(), workflow_run_id=True, head_sha=SHA, model_run=RUN)
        with self.assertRaises(ValueError):
            assess(fixture(), workflow_run_id=1, head_sha="0" * 39, model_run=RUN)
        for bad in ("-1", "nan", "inf", "hi"):
            with self.subTest(duration=bad), self.assertRaises(ValueError):
                check(fixture(build=bad))

    def test_full_marker_schema_exact_not_silent(self):
        with self.assertRaises(ValueError):
            check(fixture(unexpectedNewField=1))
        with self.assertRaises(ValueError):
            check(fixture(schema="not-the-original-builder"))

    def test_disallow_oversized_or_non_text(self):
        with self.assertRaises(ValueError):
            check("x" * 25_000_001)
        with self.assertRaises(ValueError):
            assess(None, workflow_run_id=1, head_sha=SHA, model_run=RUN)


if __name__ == "__main__":
    unittest.main()
