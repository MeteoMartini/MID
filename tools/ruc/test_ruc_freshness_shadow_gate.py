#!/usr/bin/env python3
"""Offline negative proofs; no DWD or production calls."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from datetime import datetime, timedelta, timezone
from ruc_freshness_shadow_gate import (
    FIELDS, first_availability_interval, inspect_fast_metadata, grib_cache_identity,
    verify_cached_grib, dispatch_shadow, evaluate_client_freshness)

RUN = '2026-10-31T09:00'
SHA = 'a' * 64
SOURCE = '1ade69f46b9bf77e9adaa360353ffacc7a0b967c'
BASE = datetime(2026,10,31,9,tzinfo=timezone.utc)
fmt = lambda t: t.isoformat().replace('+00:00', 'Z')


def candidate():
    times = [(BASE+timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M') for i in range(7)]
    return dict(schema='mid.ruc.fast-candidate.v1',sourceSha=SOURCE,run=RUN,hours=6,
                times=times,pointCount=5,grid=dict(nativePointCount=5,sha256=SHA),
                fields={f:dict(times=times,nativeGridSha256=SHA,sha256=SHA) for f in FIELDS},
                eps=dict(status='unavailable'))


def e2e(i):
    t=datetime(2026,10,24,tzinfo=timezone.utc)+timedelta(hours=i)
    return dict(run=t.strftime('%Y-%m-%dT%H:%M'),gribValidated=True,pagesReadback=True,
                workerReadback=True,appAdopted=True,pagesUtc=fmt(t+timedelta(minutes=22)),
                workerUtc=fmt(t+timedelta(minutes=35)),appUtc=fmt(t+timedelta(minutes=45)))


class Tests(unittest.TestCase):
    def test_metadata_never_authorizes(self):
        self.assertFalse(inspect_fast_metadata(candidate())['publicationAuthorized'])
    def test_missing_field(self):
        c=candidate();del c['fields']['T_2M'];self.assertRaises(ValueError,inspect_fast_metadata,c)
    def test_bad_time_axis(self):
        c=candidate();c['times'].pop();self.assertRaises(ValueError,inspect_fast_metadata,c)
    def test_bad_grid(self):
        c=candidate();c['fields']['PMSL']['nativeGridSha256']='b'*64
        self.assertRaises(ValueError,inspect_fast_metadata,c)
    def test_bad_member_set(self):
        c=candidate();c['eps']=dict(status='complete-metadata',memberIdsByTime={t:list(range(1,20)) for t in c['times']})
        self.assertRaises(ValueError,inspect_fast_metadata,c)
    def test_full_member_set_still_not_authorization(self):
        c=candidate();c['eps']=dict(status='complete-metadata',memberIdsByTime={t:list(range(1,21)) for t in c['times']})
        self.assertFalse(inspect_fast_metadata(c)['actualGribVerified'])
    def test_unknown_eps_member_claim(self):
        c=candidate();c['eps']['memberIdsByTime']={};self.assertRaises(ValueError,inspect_fast_metadata,c)
    def test_fast_horizon_not_27(self):
        c=candidate();c['hours']=27;self.assertRaises(ValueError,inspect_fast_metadata,c)
    def test_interval_censored(self):
        self.assertEqual(first_availability_interval([
            dict(observedAtUtc=fmt(BASE+timedelta(minutes=12)),available=False),
            dict(observedAtUtc=fmt(BASE+timedelta(minutes=24)),available=True)])['status'],'interval-censored')
    def test_no_negative_left_censored(self):
        self.assertEqual(first_availability_interval([dict(observedAtUtc=fmt(BASE),available=True)])['status'],'left-censored')
    def test_unknown_not_zero(self):
        self.assertEqual(first_availability_interval([dict(observedAtUtc=fmt(BASE),available=None)])['status'],'unknown')
    def test_conflicting_observation(self):
        self.assertRaises(ValueError,first_availability_interval,[
            dict(observedAtUtc=fmt(BASE),available=True),
            dict(observedAtUtc=fmt(BASE+timedelta(minutes=10)),available=False)])
    def test_cache_binds_run_field_grid_and_bytes(self):
        args=dict(run=RUN,field='T_2M',lead_minutes=60,grid_sha=SHA,byte_sha=SHA,codec='grib2-v1')
        h=grib_cache_identity(**args)
        for k,v in [('run','2026-10-31T10:00'),('field','PMSL'),('lead_minutes',0),('grid_sha','b'*64),('byte_sha','b'*64),('codec','grib2-bz2-v1')]:
            self.assertNotEqual(h,grib_cache_identity(**{**args,k:v}))
    def test_cache_byte_readback_and_tamper(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/'a.grib2';p.write_bytes(b'GRIB')
            h=hashlib.sha256(b'GRIB').hexdigest()
            self.assertTrue(verify_cached_grib(root,'a.grib2',h));p.write_bytes(b'EVIL')
            self.assertRaises(ValueError,verify_cached_grib,root,'a.grib2',h)
    def test_cache_path_escape_and_symlink(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/'a';p.write_bytes(b'x');(Path(root)/'b').symlink_to('a')
            for name in ('../a','/etc/passwd','b'):
                self.assertRaises(ValueError,verify_cached_grib,root,name,SHA)
    def test_no_live_dispatch_even_if_new(self):
        got=dispatch_shadow(candidate(),'2026-10-31T08:00',None,SOURCE)
        self.assertFalse(got['dispatch']);self.assertTrue(got['needsIndependentProof'])
    def test_duplicate_dispatch_stopped(self):
        self.assertIn('duplicate',dispatch_shadow(candidate(),RUN,None,SOURCE)['reason'])
    def test_wrong_sha_stopped(self):
        self.assertFalse(dispatch_shadow(candidate(),'2026-10-31T08:00',None,'b'*40)['dispatch'])
    def test_no_synthetic_slo(self):
        report=evaluate_client_freshness([e2e(i) for i in range(168)])
        self.assertTrue(report['indicativeGoal60mMet']);self.assertFalse(report['productionSloAuthorized'])
    def test_missing_app_blocks(self):
        rows=[e2e(i) for i in range(168)];rows[0]['appAdopted']=False
        report=evaluate_client_freshness(rows);self.assertFalse(report['indicativeGoal60mMet']);self.assertEqual(report['unknownOrInvalid'],1)
    def test_incomplete_week_blocks(self):
        self.assertFalse(evaluate_client_freshness([e2e(i) for i in range(10)])['indicativeGoal60mMet'])
    def test_p95_outliers_block(self):
        rows=[e2e(i) for i in range(168)]
        for i in range(10):
            t=datetime(2026,10,24,tzinfo=timezone.utc)+timedelta(hours=i)
            rows[i]['appUtc']=fmt(t+timedelta(minutes=105))
        self.assertFalse(evaluate_client_freshness(rows)['indicativeGoal60mMet'])

if __name__=='__main__': unittest.main()
