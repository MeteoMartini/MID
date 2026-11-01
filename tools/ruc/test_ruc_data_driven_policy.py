#!/usr/bin/env python3
"""Fail-closed P4 advisory policy tests; no GitHub dispatch or publisher lock."""
from datetime import datetime, timedelta, timezone
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).parent))
from ruc_data_driven_policy import decide_qualification

SHA = "a" * 40
RUN = "2026-11-01T09:00"
OLD = "2026-11-01T08:00"
NEW = "2026-11-01T10:00"
NOW = datetime(2026, 11, 1, 10, 5, tzinfo=timezone.utc)
HASH = "b" * 64
OTHER_HASH = "c" * 64


def decision(**kwargs):
    p = dict(advertised_run=RUN, published_run=OLD, active_run=None,
             main_sha=SHA, stable_sha=SHA, now=NOW,
             last_qualification_run=None)
    p.update(kwargs)
    return decide_qualification(**p)


class RaceAndSingleFlightAdvisory(unittest.TestCase):
    def test_new_candidate_can_only_enter_independent_qualification(self):
        x = decision()
        self.assertTrue(x["qualify"])
        self.assertFalse(x["productionDispatchAuthorized"])
        self.assertTrue(x["needsSignedProducerAndSingleFlight"])

    def test_stable_main_drift_fail_closed(self):
        x = decision(main_sha="d" * 40)
        self.assertFalse(x["qualify"])
        self.assertEqual(x["reason"], "MID main/stable drift")

    def test_missing_or_invalid_source_hash_blocks(self):
        for bad in ("", None, "abc", "f" * 39):
            with self.subTest(bad=bad):
                self.assertFalse(decision(main_sha=bad)["qualify"])

    def test_active_equal_and_newer_runs_block_duplicate_build(self):
        for active in (RUN, NEW):
            with self.subTest(active=active):
                self.assertFalse(decision(active_run=active)["qualify"])

    def test_newer_advertisement_cannot_bypass_older_active_producer(self):
        # The previous policy accepted NEW while OLD was still active.
        x = decision(advertised_run=NEW, active_run=OLD,
                     now=NOW + timedelta(minutes=10))
        self.assertFalse(x["qualify"])
        self.assertFalse(x["productionDispatchAuthorized"])
        self.assertIn("in flight", x["reason"])

    def test_invalid_inventory_cannot_qualify_new_run(self):
        for invalid in ("abc", "", "g" * 64, 18, False):
            with self.subTest(value=invalid):
                x = decision(observed_inventory_sha256=invalid)
                self.assertFalse(x["qualify"])
                self.assertFalse(x["productionDispatchAuthorized"])

    def test_published_same_or_newer_run_blocked(self):
        self.assertFalse(decision(published_run=RUN)["qualify"])
        self.assertFalse(decision(published_run=NEW)["qualify"])

    def test_no_requalification_without_changed_inventory(self):
        self.assertFalse(decision(last_qualification_run=RUN)["qualify"])
        self.assertFalse(decision(last_qualification_run=RUN,
                                  observed_inventory_sha256=HASH,
                                  last_inventory_sha256=HASH)["qualify"])

    def test_requalification_for_same_run_only_if_sha_inventory_changes(self):
        x = decision(last_qualification_run=RUN,
                     observed_inventory_sha256=OTHER_HASH,
                     last_inventory_sha256=HASH)
        self.assertTrue(x["qualify"])
        self.assertFalse(x["productionDispatchAuthorized"])

    def test_requalification_newer_attempt_cannot_override_newer_last(self):
        self.assertFalse(decision(last_qualification_run=NEW,
                                  observed_inventory_sha256=OTHER_HASH,
                                  last_inventory_sha256=HASH)["qualify"])

    def test_invalid_changed_hash_does_not_rearm(self):
        self.assertFalse(decision(last_qualification_run=RUN,
                                  observed_inventory_sha256="x" * 64,
                                  last_inventory_sha256=HASH)["qualify"])

    def test_invalid_utc_and_future_candidate_fail_closed(self):
        self.assertFalse(decision(now=datetime(2026, 11, 1, 10, 5))["qualify"])
        self.assertFalse(decision(now=datetime(2026, 11, 1, 8, 30,
                                              tzinfo=timezone.utc))["qualify"])
        self.assertFalse(decision(now=NOW + timedelta(hours=5))["qualify"])

    def test_missing_production_or_provider_state_cannot_dispatch(self):
        self.assertFalse(decision(published_run=None)["qualify"])
        self.assertFalse(decision(advertised_run=None)["qualify"])

    def test_invalid_calendar_rejected(self):
        self.assertFalse(decision(advertised_run="2026-02-31T09:00")["qualify"])


if __name__ == "__main__":
    unittest.main()
