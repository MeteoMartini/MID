#!/usr/bin/env python3
"""Adversarial tests for observed readback percentiles; no mock release authorization."""
from datetime import datetime, timedelta, timezone
import unittest
from ruc_weekly_e2e_observations import summarize

RUN = datetime(2026, 10, 24, tzinfo=timezone.utc)
def sample(index, lag=40):
    run = RUN + timedelta(hours=index)
    return dict(observedAtUtc=(run + timedelta(minutes=lag)).isoformat().replace('+00:00','Z'),
                pagesRun=run.strftime('%Y-%m-%dT%H:%M'),
                workerRun=run.strftime('%Y-%m-%dT%H:%M'),
                pagesValid=True, workerValid=True, sameRun=True,
                appAdopted=None, productionSloAuthorized=False)


class WeekTests(unittest.TestCase):
    def test_synthetic_full_week_is_never_slo(self):
        result=summarize([sample(i) for i in range(168)])
        self.assertTrue(result['completeSevenDayHourlyRuns'])
        self.assertEqual(result['firstObservedRunAgeMinutes']['p95'],40)
        self.assertFalse(result['productionSloAuthorized'])
    def test_missing_hour_is_not_imputed(self):
        result=summarize([sample(i) for i in range(168) if i!=33])
        self.assertFalse(result['completeSevenDayHourlyRuns'])
        self.assertEqual(result['independentlyObservedRuns'],167)
    def test_repeated_same_run_is_not_unique(self):
        rows=[sample(i) for i in range(167)]
        duplicate=sample(0,lag=50)
        rows.append(duplicate)
        result=summarize(rows)
        self.assertEqual(result['independentlyObservedRuns'],167)
        self.assertFalse(result['completeSevenDayHourlyRuns'])
    def test_worker_missing_does_not_become_zero(self):
        rows=[sample(i) for i in range(168)]
        rows[0]['workerValid']=False
        result=summarize(rows)
        self.assertEqual(result['invalidOrUnknownSamples'],1)
        self.assertEqual(result['independentlyObservedRuns'],167)
    def test_zero_samples_are_null_not_zero(self):
        result=summarize([])
        self.assertIsNone(result['firstObservedRunAgeMinutes']['p95'])
        self.assertFalse(result['completeSevenDayHourlyRuns'])
    def test_future_run_is_rejected(self):
        self.assertRaises(ValueError, summarize,[sample(0,lag=-10)])
    def test_mismatched_run_is_rejected(self):
        row=sample(0);row['workerRun']='2026-10-24T01:00'
        self.assertRaises(ValueError,summarize,[row])
    def test_duplicate_timestamp_is_rejected(self):
        self.assertRaises(ValueError,summarize,[sample(0),sample(0)])
    def test_weak_min_hours_rejected(self):
        self.assertRaises(ValueError,summarize,[sample(0)],min_hours=7)
    def test_observation_without_seven_days_rejected(self):
        self.assertFalse(summarize([sample(i) for i in range(167)])['completeSevenDayHourlyRuns'])

if __name__=='__main__':unittest.main()
