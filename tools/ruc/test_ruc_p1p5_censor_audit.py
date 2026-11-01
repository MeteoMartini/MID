#!/usr/bin/env python3
"""Negative and positive tests for sampled, censored RUC P1/P5 evidence."""
from datetime import datetime, timedelta, timezone
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).parent))
from ruc_p1p5_censor_audit import analyze, percentile_set

START = datetime(2026, 10, 24, tzinfo=timezone.utc)
END = (START + timedelta(hours=167, minutes=59)).isoformat().replace('+00:00', 'Z')


def date(value):
    return value.isoformat().replace('+00:00', 'Z')


def directory(hour, delay, state=True):
    run = START + timedelta(hours=hour)
    return {
        'schema': 'mid.ruc.dwd-directory-observation.v1',
        'run': run.strftime('%Y-%m-%dT%H:%M'),
        'observedAtUtc': date(run + timedelta(minutes=delay)),
        'firstAdvertisedField': state,
        'stages': {'0-6h': {'directoryComplete': state},
                   '0-14h': {'directoryComplete': None},
                   '0-27h': {'directoryComplete': None}},
        'eps': {'headerVerified': False, 'membersComplete': None},
    }


def public(hour, delay=40, worker_valid=True):
    run = START + timedelta(hours=hour)
    label = run.strftime('%Y-%m-%dT%H:%M')
    return {
        'schema': 'mid.ruc.e2e-readback-shadow.v1',
        'observedAtUtc': date(run + timedelta(minutes=delay)),
        'pagesRun': label, 'workerRun': label,
        'pagesValid': True, 'workerValid': worker_valid,
        'sameRun': worker_valid, 'appAdopted': True,
        'productionSloAuthorized': True,
    }


class P1P5Evidence(unittest.TestCase):
    def audit(self, rows=None, readbacks=None, **kwargs):
        return analyze(rows or [], readbacks or [], ending_at_utc=END, **kwargs)

    def test_168_interval_censored_directory_and_public_not_slo(self):
        rows = [row for hour in range(168) for row in
                (directory(hour, 10, False), directory(hour, 20, True))]
        report = self.audit(rows, [public(hour) for hour in range(168)])
        short = report['directory']['0-6h']
        self.assertEqual(short['intervalCensoredRunSlots'], 168)
        self.assertEqual(short['leftCensoredRunSlots'], 0)
        self.assertEqual(short['firstSeenUpperBoundMinutes']['p95'], 20)
        self.assertEqual(short['lastNegativeLowerBoundMinutes']['p95'], 10)
        self.assertEqual(short['intervalBracketWidthMinutes']['p95'], 10)
        self.assertEqual(report['publicPagesWorker']['firstObservedRunAgeUpperBoundMinutes']['p95'], 40)
        self.assertEqual(report['publicPagesWorker']['pairedPublicMinusDirectoryFirstSeenMinutes']['p95'], 20)
        self.assertFalse(report['classification']['sixtyMinuteProductionP95Authorized'])
        self.assertFalse(report['classification']['nativeEps20GribValuesVerified'])
        self.assertFalse(report['publicPagesWorker']['clientAdoptionAuthenticated'])

    def test_left_right_and_unobserved_are_distinct(self):
        report = self.audit([directory(165, 25, True), directory(166, 25, False),
                             directory(167, 25, None)])
        short = report['directory']['0-6h']
        self.assertEqual(short['leftCensoredRunSlots'], 1)
        self.assertEqual(short['rightCensoredRunSlots'], 1)
        self.assertEqual(short['unobservedOrUnknownRunSlots'], 166)
        self.assertEqual(short['unknownPollSamples'], 1)
        self.assertIsNone(short['lastNegativeLowerBoundMinutes']['p95'])
        self.assertEqual(short['firstSeenUpperBoundMinutes']['p95'], 25)
        self.assertFalse(short['advertisedInAll168Runs'])

    def test_no_samples_never_zero(self):
        result = self.audit()
        self.assertIsNone(result['directory']['0-6h']['firstSeenUpperBoundMinutes']['p95'])
        self.assertIsNone(result['publicPagesWorker']['firstObservedRunAgeUpperBoundMinutes']['p95'])
        self.assertEqual(result['publicPagesWorker']['unobservedRunSlots'], 168)

    def test_poll_gap_is_reported_not_silently_interpolated(self):
        # Two samples for the same run, separated by a 60-minute polling gap.
        run = directory(166, 10, False)
        second = directory(166, 70, True)
        result = self.audit([run, second], expected_poll_minutes=15)
        short = result['directory']['0-6h']
        self.assertEqual(short['latePollGapsOver2xCadence'], 1)
        self.assertEqual(short['maxWithinRunPollGapMinutes'], 60)
        self.assertEqual(short['intervalBracketWidthMinutes']['p95'], 60)

    def test_conflicting_directory_visibility_rejected(self):
        with self.assertRaisesRegex(ValueError, 'contradictory'):
            self.audit([directory(167, 20, True), directory(167, 40, False)])

    def test_duplicate_directory_poll_rejected(self):
        row = directory(167, 20)
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            self.audit([row, dict(row)])

    def test_unsafe_schema_time_and_poll_config_rejected(self):
        for value in (0, 61, 1.5, True):
            with self.assertRaises(ValueError):
                self.audit(expected_poll_minutes=value)
        with self.assertRaises(ValueError):
            self.audit([dict(directory(167, 20), schema='other')])
        with self.assertRaises(ValueError):
            self.audit([directory(167, -10)])
        with self.assertRaises(ValueError):
            self.audit(ending_at_utc='2026-10-31T12:00+01:00')

    def test_invalid_worker_cannot_be_counted_as_run(self):
        report = self.audit([], [public(167, worker_valid=False)])
        self.assertEqual(report['publicPagesWorker']['invalidOrUnknownReadbackSamples'], 1)
        self.assertEqual(report['publicPagesWorker']['firstReadbackRunSlots'], 0)
        self.assertIsNone(report['publicPagesWorker']['firstObservedRunAgeUpperBoundMinutes']['p95'])

    def test_duplicate_readback_timestamp_rejected(self):
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            self.audit([], [public(167), public(167)])

    def test_future_public_run_rejected(self):
        with self.assertRaisesRegex(ValueError, 'predates'):
            self.audit([], [public(167, -1)])

    def test_public_mismatch_claiming_valid_rejected(self):
        bad = public(167)
        bad['workerRun'] = '2026-10-24T00:00'
        with self.assertRaisesRegex(ValueError, 'contradictory'):
            self.audit([], [bad])

    def test_infinite_quantile_rejected(self):
        for bad in (float('nan'), float('inf'), -float('inf')):
            with self.assertRaises(ValueError):
                percentile_set([10, bad])
        self.assertIsNone(percentile_set([])['p95'])

    def test_no_slo_even_with_client_adopted_claims(self):
        result = self.audit([directory(i, 10) for i in range(168)],
                            [public(i, 15) for i in range(168)])
        self.assertEqual(result['publicPagesWorker']['firstReadbackRunSlots'], 168)
        self.assertFalse(result['classification']['liveClientOrWidgetOrExportRefreshVerified'])
        self.assertFalse(result['classification']['sixtyMinuteProductionP95Authorized'])


if __name__ == '__main__':
    unittest.main()
