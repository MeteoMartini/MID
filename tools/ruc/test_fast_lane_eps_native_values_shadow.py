#!/usr/bin/env python3
"""EPS20 native values, bitmap, cumulative precipitation: adversarial offline tests."""
from __future__ import annotations
from datetime import timedelta
from pathlib import Path
import tempfile
import unittest
import numpy as np
from fast_lane_eps_native_values_shadow import qualify
from ruc_freshness_shadow_gate import model_time

RUN='2026-10-31T18:00'
BASE=model_time(RUN)

def seed(root):
    file=root/'eps'/'TOT_PREC'/'native.grib2'
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_bytes(b'GRIB'+bytes(240))
    return file

def real_shape(path,base,field):
    return [(base+timedelta(hours=h),member,
             np.array([h*0.5,h*0.25,0.],dtype=np.float32),
             'mm',(0,'precipitation_acc','native-grid'))
            for h in range(7) for member in range(1,21)]

class EPSShadow(unittest.TestCase):
    def check(self,reader=real_shape,hours=6,mutate=None):
        with tempfile.TemporaryDirectory() as d:
            path=seed(Path(d))
            if mutate:mutate(path)
            return qualify(Path(d),RUN,hours,reader=reader,expected_points=3)

    def test_full_eps_native_is_not_publish_permission(self):
        out=self.check()
        self.assertEqual(out['recordCount'],140)
        self.assertEqual(out['memberIds'],list(range(1,21)))
        self.assertTrue(out['eps20NativeHeadersBitmapValuesVerified'])
        self.assertTrue(out['cumulativePrecipitationValidated'])
        self.assertEqual(out['nativePointCount'],3)
        self.assertEqual(len(out['sources']),1)
        self.assertEqual(len(out['sources'][0]['sha256']),64)
        for key in ('deterministicVerified','losslessWirePackingVerified',
                    'pagesWorkerAppWidgetExportVerified','productionAuthorized'):
            self.assertFalse(out[key])

    def test_missing_member_or_14hour_horizon_not_claimed_complete(self):
        def missing(path,base,field):
            return [r for r in real_shape(path,base,field) if not (
                r[0]==base+timedelta(hours=3) and r[1]==17)]
        with self.assertRaises(ValueError):
            self.check(reader=missing)
        with self.assertRaises(ValueError):
            self.check(hours=14)

    def test_duplicate_and_invalid_member_rejected(self):
        def duplicate(path,base,field):
            rows=real_shape(path,base,field)
            return rows+[rows[0]]
        with self.assertRaises(ValueError):
            self.check(reader=duplicate)
        def invalid(path,base,field):
            rows=real_shape(path,base,field)
            t,_,v,u,sig=rows[0]
            rows[0]=(t,0,v,u,sig)
            return rows
        with self.assertRaises(ValueError):
            self.check(reader=invalid)

    def test_missing_cells_are_not_false_zeros(self):
        def partial(path,base,field):
            rows=real_shape(path,base,field)
            return [(t,m,np.array([np.nan,v[1],v[2]]),u,s)
                    for t,m,v,u,s in rows]
        out=self.check(reader=partial)
        coverage=out['nativeEpsMissingCoverage']
        self.assertEqual(len(coverage['members']),20)
        self.assertEqual(coverage['members'][0]['steps'][0]['missingCount'],1)
        self.assertTrue(out['eps20NativeHeadersBitmapValuesVerified'])

    def test_whole_member_validity_missing_rejected(self):
        def all_missing(path,base,field):
            rows=real_shape(path,base,field)
            t,m,v,u,s=rows[40]
            rows[40]=(t,m,np.full(3,np.nan),u,s)
            return rows
        with self.assertRaises(ValueError):
            self.check(reader=all_missing)

    def test_backward_native_precipitation_rejected(self):
        def decreases(path,base,field):
            rows=real_shape(path,base,field)
            i=next(i for i,r in enumerate(rows) if r[0]==base+timedelta(hours=4) and r[1]==7)
            t,m,v,u,s=rows[i]
            rows[i]=(t,m,np.array([-5.,-1.,0.]),u,s)
            return rows
        with self.assertRaises(ValueError):
            self.check(reader=decreases)

    def test_invalid_units_and_native_grid_rejected(self):
        def units(path,base,field):
            rows=real_shape(path,base,field)
            t,m,v,u,s=rows[0];rows[0]=(t,m,v,'kilo-unknown',s)
            return rows
        with self.assertRaises(ValueError):
            self.check(reader=units)
        def grid(path,base,field):
            rows=real_shape(path,base,field)
            t,m,v,u,s=rows[0];rows[0]=(t,m,np.zeros(2),u,s)
            return rows
        with self.assertRaises(ValueError):
            self.check(reader=grid)
        def signature(path,base,field):
            rows=real_shape(path,base,field)
            t,m,v,u,s=rows[0];rows[0]=(t,m,v,u,('alien','grid'))
            return rows
        with self.assertRaises(ValueError):
            self.check(reader=signature)

    def test_source_race_and_symlinks_rejected(self):
        def race(path,base,field):
            path.write_bytes(b'GRIB'+bytes(239)+b'X')
            return real_shape(path,base,field)
        with self.assertRaises(ValueError):
            self.check(reader=race)
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);file=seed(root);file.unlink()
            file.symlink_to(root/'some-other-file')
            with self.assertRaises(ValueError):
                qualify(root,RUN,reader=real_shape,expected_points=3)

if __name__=='__main__':
    unittest.main()
