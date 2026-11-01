#!/usr/bin/env python3
"""P3 wall-time vs step-time ambiguity regression."""
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).parent))
from ruc_p3_timing_audit import summarize


def report(run=41286412886, wall=4755, core=1074):
    return {
        'schema': 'mid.ruc.workflow-timings.v1', 'runId': run,
        'jobs': [{
            'name': 'calculate', 'conclusion': 'success',
            'elapsedSeconds': wall,
            'steps': [
                {'number': 1, 'name': 'Neuesten vollständigen RUC/RUC-EPS-Lauf laden und dekodieren',
                 'elapsedSeconds': core},
                {'number': 2, 'name': 'Andere erlaubte Prüfungen', 'elapsedSeconds': 78}
            ]
        }, {'name': 'prepare', 'conclusion': 'skipped',
            'elapsedSeconds': -1, 'steps': []}]
    }


class P3TimingAuditTests(unittest.TestCase):
    def test_unaccounted_hour_not_called_decoder_time(self):
        result = summarize([report()])
        entry = result['runs'][0]
        self.assertEqual(entry['jobs']['calculate']['combinedCoreDownloadDecodeSeconds'], 1074)
        self.assertEqual(entry['jobs']['calculate']['unaccountedSeconds'], 3603)
        self.assertTrue(entry['timingGapOver60Seconds'])
        self.assertFalse(result['matchedABSpeedupAuthorized'])
        self.assertFalse(result['splitDownloadVsDecodeMeasured'])
        self.assertFalse(result['cpuRamAndPeak900MBBudgetMeasuredHere'])

    def test_multi_run_not_a_controlled_ab_even_with_faster_core(self):
        result = summarize([report(), report(run=41281807000, wall=1317, core=1228)])
        self.assertEqual(result['runCount'], 2)
        self.assertFalse(result['sameRawGribShaInputsVerified'])
        self.assertFalse(result['matchedABSpeedupAuthorized'])

    def test_no_gap_for_accounted_steps(self):
        result = summarize([report(wall=1152)])
        self.assertEqual(result['runs'][0]['unaccountedJobSeconds'], 0)
        self.assertFalse(result['runs'][0]['timingGapOver60Seconds'])

    def test_skipped_job_not_a_negative_duration(self):
        result = summarize([report()])
        self.assertNotIn('prepare', result['runs'][0]['jobs'])

    def test_invalid_times_fail_closed(self):
        for invalid in (-1, float('nan'), float('inf'), None, '100', True):
            row = report()
            row['jobs'][0]['elapsedSeconds'] = invalid
            with self.assertRaises(ValueError):
                summarize([row])

    def test_duplicate_runs_fail_closed(self):
        with self.assertRaises(ValueError):
            summarize([report(), report()])

    def test_missing_and_duplicate_steps_rejected(self):
        row = report()
        row['jobs'][0]['steps'] = []
        with self.assertRaises(ValueError):
            summarize([row])
        row = report()
        row['jobs'][0]['steps'][1]['number'] = 1
        with self.assertRaises(ValueError):
            summarize([row])

    def test_step_sum_larger_than_wall_rejected(self):
        with self.assertRaises(ValueError):
            summarize([report(wall=1000, core=1100)])

    def test_success_contract_and_id_rejected(self):
        for mutation in ({'schema':'unknown'}, {'runId':0}):
            row = report()
            row.update(mutation)
            with self.assertRaises(ValueError):
                summarize([row])
        row = report()
        row['jobs'][0]['conclusion']='failure'
        with self.assertRaises(ValueError):
            summarize([row])


if __name__ == '__main__':
    unittest.main()
