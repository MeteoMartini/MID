import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).parent))
from dwd_availability_report import summarize, nearest_rank

START = datetime(2026, 10, 24, 12, tzinfo=timezone.utc)


def row(hour, delay=45, first=True, short=True):
    run = START + timedelta(hours=hour)
    when = run + timedelta(minutes=delay)
    return {'schema': 'mid.ruc.dwd-directory-observation.v1',
            'run': run.strftime('%Y-%m-%dT%H:%M'),
            'observedAtUtc': when.isoformat().replace('+00:00','Z'),
            'firstAdvertisedField': first,
            'stages': {'0-6h': {'directoryComplete': short},
                       '0-14h': {'directoryComplete': None},
                       '0-27h': {'directoryComplete': False}},
            'eps': {'headerVerified': False, 'membersComplete': None}}


class ReportTest(unittest.TestCase):
    def test_no_false_eps_or_full_horizon_claims(self):
        rows = [row(i) for i in range(168)]
        report = summarize(rows, ending_at=START + timedelta(hours=167, minutes=50))
        self.assertEqual(report['runSlots'], 168)
        self.assertTrue(report['stages']['0-6h']['sevenDayComplete'])
        self.assertEqual(report['stages']['0-6h']['firstSeenUpperBoundMinutes'],
                         {'p50':45.0, 'p90':45.0, 'p95':45.0})
        self.assertIsNone(report['stages']['epsMembers20']['firstSeenUpperBoundMinutes']['p95'])
        self.assertFalse(report['stages']['0-27h']['sevenDayComplete'])
        self.assertFalse(report['sloVerified'])

    def test_incomplete_window_and_missing_are_not_zero(self):
        report = summarize([row(167)], ending_at=START + timedelta(hours=167, minutes=50))
        short = report['stages']['0-6h']
        self.assertEqual(short['observedRunCount'], 1)
        self.assertEqual(short['unknownOrUnobservedRunCount'], 167)
        self.assertFalse(short['sevenDayComplete'])
        self.assertEqual(short['firstSeenUpperBoundMinutes']['p95'], 45.0)

    def test_error_only_observation_is_not_completed(self):
        report = summarize([row(167, short=None)], ending_at=START + timedelta(hours=167, minutes=50))
        self.assertIsNone(report['stages']['0-6h']['firstSeenUpperBoundMinutes']['p90'])
        self.assertEqual(report['stages']['0-6h']['unknownOrUnobservedRunCount'], 168)

    def test_first_seen_negative_bracket_and_distinct_runs(self):
        rows = [row(167, delay=10, short=False), row(167, delay=25, short=True), row(167,delay=50,short=True)]
        result = summarize(rows, ending_at=START + timedelta(hours=167, minutes=55))
        short = result['stages']['0-6h']
        self.assertEqual(short['observedRunCount'], 1)
        self.assertEqual(short['observedWithEarlierNegativeSample'], 1)
        self.assertEqual(short['firstSeenUpperBoundMinutes']['p95'], 25.0)

    def test_invalid_stats_rejected(self):
        self.assertIsNone(nearest_rank([], .9))
        for value in (-1, float('nan'), float('inf')):
            with self.assertRaises(ValueError):
                nearest_rank([10, value], .95)
        with self.assertRaises(ValueError):
            nearest_rank([10], 1.1)
        with self.assertRaises(ValueError):
            summarize([dict(row(167), schema='fake')])


if __name__ == '__main__':
    unittest.main()
