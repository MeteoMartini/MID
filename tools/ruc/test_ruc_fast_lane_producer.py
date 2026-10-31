#!/usr/bin/env python3
"""Regression and adversarial tests for isolated deterministic short-horizon candidate."""
import copy
from datetime import datetime,timedelta,timezone
from hashlib import sha256
from pathlib import Path
import tempfile
import unittest
from ruc_fast_lane_producer import (
    FIELDS, EXPECTED_LEADS, EXPECTED_RAPID5, EXPECTED_RAPID15,
    canonical_run, lead_inventory, verify_candidate_manifest, safe_quantization, digest)

RUN='2026-10-31T10:00'
T=datetime(2026,10,31,10,tzinfo=timezone.utc)
fmt=lambda dt:dt.strftime('%Y-%m-%dT%H:%M')


def candidate(root):
    objs={}
    for name in ('deterministic.bin','rapid-5m.bin','rapid-15m.bin','lookup.bin'):
        (root/name).write_bytes(b'GRIB-output-'+name.encode())
        objs[name]=digest(root/name)
    return {'schema':'mid.ruc.fast-prepared.v1','run':RUN,'horizonHours':6,
        'eps':{'availability':'unavailable'},'publicationAuthorized':False,
        'dataTimes':[fmt(T+timedelta(hours=i)) for i in range(7)],
        'rapid5Times':[fmt(T+timedelta(minutes=i)) for i in range(0,361,5)],
        'rapid15Times':[fmt(T+timedelta(minutes=i)) for i in range(0,361,15)],
        'objects':objs}


class TestFast(unittest.TestCase):
    def test_run_valid(self):self.assertEqual(canonical_run(RUN),RUN)
    def test_run_invalid_calendar(self):
        for x in ('2026-13-01T09:00','2026-10-31T09:30','2026-10-31T09:00Z','2026-02-30T09:00'):
            with self.subTest(run=x),self.assertRaises(ValueError):canonical_run(x)
    def test_whole_native_forecast_step_missing_rejected(self):
        import numpy as np
        from collections import namedtuple
        Spec=namedtuple('Spec','name offset scale')
        values=np.array([[0.,1.],[np.nan,np.nan],[2.,np.nan]])
        with self.assertRaisesRegex(ValueError,'forecast step entirely missing'):
            safe_quantization({'precipitation':values},(Spec('precipitation',0.,0.01),),np)
    def test_real_dry_zero_remains_finite(self):
        import numpy as np
        from collections import namedtuple
        Spec=namedtuple('Spec','name offset scale')
        values=np.array([[0.,np.nan],[0.,0.],[0.04,np.nan]])
        self.assertTrue(safe_quantization({'precipitation':values},(Spec('precipitation',0.,0.01),),np))
    def test_extreme_cannot_clip_as_normal_data(self):
        import numpy as np
        from collections import namedtuple
        Spec=namedtuple('Spec','name offset scale')
        with self.assertRaisesRegex(ValueError,'native extreme'):
            safe_quantization({'precipitation':np.array([[40000.]])},(Spec('precipitation',0.,0.01),),np)
    def test_native_hourly_exact(self):self.assertEqual(lead_inventory(sorted(EXPECTED_LEADS),lambda x:int(x),EXPECTED_LEADS),7)
    def test_missing_native_hour(self):
        with self.assertRaises(ValueError):lead_inventory([0,60,120,180,240,300],lambda x:int(x),EXPECTED_LEADS)
    def test_duplicate_native_lead(self):
        with self.assertRaises(ValueError):lead_inventory([0,60,120,180,240,300,360,360],lambda x:int(x),EXPECTED_LEADS)
    def test_native_rapid_cadences(self):
        self.assertEqual(lead_inventory(sorted(EXPECTED_RAPID5),lambda x:int(x),EXPECTED_RAPID5),73)
        self.assertEqual(lead_inventory(sorted(EXPECTED_RAPID15),lambda x:int(x),EXPECTED_RAPID15),25)
    def test_valid_local_manifest_never_release(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            self.assertEqual(verify_candidate_manifest(c,root),{'verifiedLocalBytes':True,'publicationAuthorized':False})
    def test_missing_field(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['objects'].pop('lookup.bin')
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_byte_tamper(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);(root/'lookup.bin').write_bytes(b'attack')
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_shifted_data_time(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['dataTimes'][3]='2026-10-31T13:30'
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_missing_rapid_time(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['rapid5Times'].pop()
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_partial_eps_forbidden(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['eps']={'availability':'complete','members':19}
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_invalid_release_claim(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['publicationAuthorized']=True
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_local_symlink_fails(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);(root/'lookup.bin').unlink();(root/'lookup.bin').symlink_to('deterministic.bin')
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)

if __name__=='__main__':unittest.main()
