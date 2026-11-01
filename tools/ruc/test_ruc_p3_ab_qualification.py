#!/usr/bin/env python3
"""Adversarial offline P3 receipt comparisons, no DWD network or publisher."""
import copy
import math
import unittest
from datetime import datetime, timezone, timedelta
from ruc_p3_ab_qualification import compare, inspect, report, REQUIRED, STAGES


def fixture(variant='baseline', hour=0):
    return {
        'schema':'mid.ruc.p3-ab-trial.v1', 'variant':variant,
        'run':(datetime(2026,11,1,tzinfo=timezone.utc)+timedelta(hours=hour)).strftime('%Y-%m-%dT%H:%MZ'),
        'sourceTreeSha256':'a'*64, 'inputInventorySha256':'b'*64,
        'contractSha256':'c'*64, 'outputInventorySha256':'d'*64,
        'gridSha256':'e'*64, 'epsMembers':20, 'hourlyLeadCount':28,
        'physicalBytes':490_000_000, 'gates':dict.fromkeys(REQUIRED,True),
        'stageSeconds':{k:float(i+1) for i,k in enumerate(STAGES)}
    }


class RucP3ABTests(unittest.TestCase):
    def test_identical_pair_and_non_authorization(self):
        a,b=fixture(),fixture('candidate')
        self.assertEqual(compare(a,b)['ratio'],1.0)
        x=report([b,a])
        self.assertEqual(x['pairedRuns'],1)
        self.assertFalse(x['publicationAuthorized'])
        self.assertFalse(x['productionSloAuthorized'])
        self.assertFalse(x['sourceReceiptsIndependentlyVerified'])
    def test_verified_speedup_only_for_identical_output(self):
        a,b=fixture(),fixture('candidate')
        b['stageSeconds']['decode']=.5
        self.assertLess(compare(a,b)['ratio'],1)
        b['outputInventorySha256']='f'*64
        with self.assertRaisesRegex(ValueError,'different input'):compare(a,b)
    def test_mixed_inputs_or_scientific_contracts(self):
        for field in ('run','sourceTreeSha256','inputInventorySha256','contractSha256','gridSha256','physicalBytes','epsMembers','hourlyLeadCount'):
            a,b=fixture(),fixture('candidate')
            b[field]=a[field]+'0' if type(a[field]) is str else a[field]+1
            with self.subTest(field=field),self.assertRaises(ValueError):compare(a,b)
    def test_missing_never_zero_and_no_duplicate_runs(self):
        for rows in ([], [fixture()], [fixture(),fixture()], [fixture(),fixture('candidate'),fixture('candidate')]):
            with self.subTest(count=len(rows)),self.assertRaises(ValueError):report(rows)
    def test_timing_nan_infinity_bool_and_negative(self):
        for duration in (None,0,-1,True,float('nan'),float('inf'),'1'):
            r=fixture();r['stageSeconds']['decode']=duration
            with self.subTest(duration=str(duration)),self.assertRaises(ValueError):inspect(r)
    def test_false_or_missing_gates_rejected(self):
        for name in REQUIRED:
            r=fixture();r['gates'][name]=False
            with self.subTest(name=name),self.assertRaises(ValueError):inspect(r)
            del r['gates'][name]
            with self.assertRaises(ValueError):inspect(r)
    def test_strict_grid_and_budget(self):
        for value in (900_000_000,0,-1,True,1.5):
            r=fixture();r['physicalBytes']=value
            with self.subTest(value=value),self.assertRaises(ValueError):inspect(r)
        for key in ('sourceTreeSha256','inputInventorySha256','contractSha256','outputInventorySha256','gridSha256'):
            r=fixture();r[key]='a'*63
            with self.assertRaises(ValueError):inspect(r)
    def test_run_time_utc_and_invalid(self):
        for run in ('2026-11-01T01:00+01:00','2026-11-01T01:00','bad','2026-11-01T01:00:01Z'):
            r=fixture();r['run']=run
            with self.subTest(run=run),self.assertRaises(ValueError):inspect(r)
    def test_aggregate_nearest_rank(self):
        rows=[]
        for h in range(4):
            a,b=fixture(hour=h),fixture('candidate',hour=h)
            b['stageSeconds']={k:v*(1+h/10) for k,v in a['stageSeconds'].items()}
            rows.extend((a,b))
        result=report(rows)
        self.assertEqual(result['pairedRuns'],4)
        self.assertEqual(result['runCoverageHours'],4)
        self.assertEqual(result['medianCandidateToBaselineRatio'],1.1)
        self.assertEqual(result['p95CandidateToBaselineRatio'],1.3)


if __name__=='__main__':
    unittest.main()
