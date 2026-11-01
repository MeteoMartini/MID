#!/usr/bin/env python3
"""Adversarial offline EPS-independent RUC Fast Lane discovery tests."""
import json
import tempfile
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch
from ruc_fast_run_selector import (
    HOURLY_FIELDS,NATIVE_GRID,RAPID15,RAPID5,canonical_run,
    select_run_from_inventory,main
)

NOW=datetime(2026,11,1,10,tzinfo=timezone.utc)
RUN='2026-11-01T09:00'
OLDER='2026-11-01T08:00'


def fixtures(*, candidate=RUN, override=None, run_sets=None):
    calls=[]
    complete={
        'hourly':list(range(0,361,60)),
        'grid':[0],
        'rapid-precip':list(range(0,361,5)),
        'rapid15':list(range(0,361,15)),
    }
    override=override or {}
    def list_runs(field):
        calls.append(('run',field))
        return (run_sets or {candidate}).copy()
    def listing(field,run,cadence):
        calls.append((field,run,cadence))
        return override.get((field,run,cadence),complete[cadence])
    return list_runs,listing,calls


class IndependentFastRunSelection(unittest.TestCase):
    def select(self,*,run=RUN,override=None,run_sets=None,now=NOW):
        one,two,calls=fixtures(candidate=run,override=override,run_sets=run_sets)
        result=select_run_from_inventory(one,two,now=now)
        self.assertNotIn('TOT_PREC_EPS',[call[1] for call in calls if call[0]=='run'])
        self.assertEqual({call[1] for call in calls if call[0]=='run'},set(HOURLY_FIELDS+NATIVE_GRID))
        return result

    def test_complete_new_run_selected_without_eps(self):
        self.assertEqual(self.select(),RUN)

    def test_directory_cannot_admit_publication(self):
        one,two,calls=fixtures()
        self.assertEqual(select_run_from_inventory(one,two,now=NOW),RUN)
        self.assertFalse(any('eps' in str(call).lower() for call in calls))

    def test_incomplete_hourly_field_rejected(self):
        o={('CLCT',RUN,'hourly'):[0,60,120,180,240,300]}
        self.assertIsNone(self.select(override=o))

    def test_missing_native_grid_rejected(self):
        self.assertIsNone(self.select(override={('CLON',RUN,'grid'):[]}))

    def test_missing_5min_precip_rejected(self):
        self.assertIsNone(self.select(override={(RAPID5,RUN,'rapid-precip'):list(range(0,355,5))}))

    def test_missing_15min_cape_rejected(self):
        self.assertIsNone(self.select(override={('CAPE_ML',RUN,'rapid15'):list(range(0,346,15))}))

    def test_duplicate_leads_rejected(self):
        hourly=list(range(0,361,60))
        self.assertIsNone(self.select(override={('T_2M',RUN,'hourly'):hourly+[360]}))

    def test_future_run_rejected(self):
        self.assertIsNone(self.select(run='2026-11-01T12:00'))

    def test_old_run_rejected(self):
        self.assertIsNone(self.select(run='2026-11-01T01:00'))

    def test_fallback_to_second_complete_run(self):
        o={('CLCL',RUN,'hourly'):list(range(0,360,60))}
        self.assertEqual(self.select(override=o,run_sets={RUN,OLDER}),OLDER)

    def test_no_complete_directory_intersection(self):
        one,two,_=fixtures(run_sets=set())
        # Empty set must produce no candidate; default fixture call uses
        # nonempty fallback, so build the empty discovery explicitly.
        self.assertIsNone(select_run_from_inventory(lambda field:set(),two,now=NOW))

    def test_never_censor_unknown_as_zero_or_guess_missing(self):
        one,two,_=fixtures(override={('PMSL',RUN,'hourly'):[]})
        self.assertIsNone(select_run_from_inventory(one,two,now=NOW))

    def test_invalid_horizon_params_rejected(self):
        one,two,_=fixtures()
        for age in (0,13,1.0,True):
            with self.subTest(age=age),self.assertRaises(ValueError):
                select_run_from_inventory(one,two,now=NOW,max_age_hours=age)
        for count in (0,7,1.0,True):
            with self.subTest(count=count),self.assertRaises(ValueError):
                select_run_from_inventory(one,two,now=NOW,max_examined=count)

    def test_clock_must_be_timezone_aware(self):
        one,two,_=fixtures()
        with self.assertRaises(ValueError):
            select_run_from_inventory(one,two,now=datetime(2026,11,1,10))

    def test_invalid_calendar_and_minute_rejected(self):
        for run in ('2026-02-31T10:00','2026-11-01T10:30','2026-11-01T10:00Z','2026-11-01T1:00',''):
            with self.subTest(run=run),self.assertRaises(ValueError):
                canonical_run(run)

    def test_candidate_index_failure_does_not_fake_validity(self):
        one,two,_=fixtures()
        def broken(field,run,mode):
            if field=='CAPE_ML':raise RuntimeError('transient DWD index error')
            return two(field,run,mode)
        self.assertIsNone(select_run_from_inventory(one,broken,now=NOW))

    def test_truncated_candidate_search_does_not_use_old_false_positive(self):
        times={'2026-11-01T09:00','2026-11-01T08:00','2026-11-01T07:00','2026-11-01T06:00','2026-11-01T05:00'}
        one,two,_=fixtures(run_sets=times)
        def broken(field,run,mode):
            if run!='2026-11-01T05:00' and field=='PMSL':return []
            return two(field,run,mode)
        self.assertIsNone(select_run_from_inventory(one,broken,now=NOW,max_examined=4))


if __name__=='__main__':
    unittest.main()
