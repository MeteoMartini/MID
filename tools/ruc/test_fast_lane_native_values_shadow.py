#!/usr/bin/env python3
"""Adversarial native deterministic full-value shadow tests; no DWD or publish."""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path
import tempfile
import unittest
import numpy as np

from fast_lane_native_values_shadow import qualify
from fast_lane_grib_preflight import CORE_FIELDS
from ruc_freshness_shadow_gate import model_time

RUN = '2026-10-31T18:00'
BASE = model_time(RUN)
MAP = dict(zip(CORE_FIELDS,(
    'temperature_2m','dew_point_2m','relative_humidity_2m','pressure_msl',
    'u10','v10','wind_gusts_10m','precipitation_acc',
    'cloud_cover','cloud_cover_low','cape','convective_inhibition')))

def seed(root):
    for field in CORE_FIELDS:
        path=root/'deterministic'/field/'native.grib2'
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(b'GRIB'+bytes(144))
    for axis in ('CLAT','CLON'):
        path=root/'grid'/axis/'native.grib2'
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(b'GRIB'+bytes(144))

def original(path, base, parameter, ensemble=False):
    if 'grid' in path.parts:
        vals = np.array([50.,51.,52.]) if parameter=='CLAT' else np.array([7.,8.,9.])
        units = 'degree n' if parameter=='CLAT' else 'degree e'
        return [(base,0,vals,units,(0,parameter,'native'))]
    native={
       'temperature_2m': (np.array([283.,285.,280.]), 'K'),
       'dew_point_2m': (np.array([281.,282.,278.]), 'K'),
       'relative_humidity_2m': (np.array([60.,70.,75.]), '%'),
       'pressure_msl': (np.array([100000.,100100.,101000.]), 'Pa'),
       'u10': (np.array([2.,3.,4.]), 'm/s'),
       'v10': (np.array([1.,3.,4.]), 'm/s'),
       'wind_gusts_10m': (np.array([10.,10.,12.]), 'm/s'),
       'precipitation_acc': (np.array([0.,0.,0.]), 'mm'),
       'cloud_cover': (np.array([60.,50.,20.]), '%'),
       'cloud_cover_low': (np.array([30.,20.,5.]), '%'),
       'cape': (np.array([300.,50.,0.]), 'J/kg'),
       'convective_inhibition': (np.array([-50.,-10.,0.]), 'J/kg')
    }
    vals, units=native[parameter]
    rows=[]
    for h in range(7):
        cell=vals.copy()
        if parameter=='precipitation_acc':
            cell=np.array([h*0.5,h*2,0.])
        rows.append((base+timedelta(hours=h),0,cell,units,(0,parameter,'native')))
    return rows


class NativeValueShadow(unittest.TestCase):
    def runcheck(self,reader=original,hours=6,mutate=None):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);seed(root)
            if mutate:mutate(root)
            return qualify(root,RUN,hours,reader=reader,grid_reader=reader,
                           parameters=MAP,expected_points=3)

    def test_complete_values_not_authorized_for_any_production_client(self):
        out=self.runcheck()
        self.assertTrue(out['allTwelveDeterministicNativeValuesVerified'])
        self.assertTrue(out['deterministicBitmapAndPhysicalChecksPassed'])
        self.assertTrue(out['cumulativePrecipitationValidated'])
        self.assertEqual(out['timeCount'],7)
        self.assertEqual(out['nativePointCount'],3)
        self.assertEqual(len(out['sources']),14)
        self.assertTrue(all(len(x['sha256'])==64 for x in out['sources']))
        self.assertEqual(out['finitePointsByFieldAndLead']['precipitation_acc'],[3]*7)
        for field in ('eps20Verified','losslessWirePackingVerified',
                      'pagesWorkerAppWidgetExportVerified','productionAuthorized'):
            self.assertFalse(out[field])

    def test_short_run_never_grants_14h(self):
        with self.assertRaises(ValueError):
            self.runcheck(hours=14)

    def test_missing_source_and_cross_run_duplicate_rejected(self):
        with self.assertRaises(ValueError):
            self.runcheck(mutate=lambda root:(root/'deterministic'/'PMSL'/'native.grib2').unlink())
        def duplicate(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='temperature_2m':
                return rows+[rows[0]]
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=duplicate)

    def test_missing_native_cell_is_not_zero_dry_weather(self):
        def missing(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='precipitation_acc':
                return [(t,m,np.array([np.nan,values[1],values[2]]),u,signature)
                        for t,m,values,u,signature in rows]
            return rows
        out=self.runcheck(reader=missing)
        self.assertTrue(out['cumulativePrecipitationValidated'])
        self.assertEqual(out['finitePointsByFieldAndLead']['precipitation_acc'],[2]*7)
        self.assertEqual(out['missingCoverage']['fields']['precipitation_acc']['steps'][0]['missingCount'],1)

    def test_all_missing_precip_step_rejected(self):
        def missing(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='precipitation_acc':
                t,m,values,u,sign=rows[3]
                rows[3]=(t,m,np.full(3,np.nan),u,sign)
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=missing)

    def test_real_precip_backward_accumulation_rejected(self):
        def backward(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='precipitation_acc':
                t,m,values,u,sign=rows[4]
                rows[4]=(t,m,values-100,u,sign)
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=backward)

    def test_dew_point_exceedance_and_units_rejected(self):
        def dew(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='dew_point_2m':
                return [(t,m,values+20,u,sign) for t,m,values,u,sign in rows]
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=dew)
        def units(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='temperature_2m':
                return [(t,m,values,'unknown',sign) for t,m,values,u,sign in rows]
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=units)

    def test_grid_and_field_mismatches_fail_closed(self):
        def badgrid(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='CLAT':
                return [(base,0,np.array([95.,51.,52.]),'degree n',('grid',))]
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=badgrid)
        def bad_member(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='u10':
                t,m,vals,u,sign=rows[0];rows[0]=(t,20,vals,u,sign)
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=bad_member)
        def mixedsign(path,base,parameter,ensemble=False):
            rows=original(path,base,parameter,ensemble)
            if parameter=='v10':
                t,m,vals,u,sign=rows[1];rows[1]=(t,m,vals,u,('alien','grid'))
            return rows
        with self.assertRaises(ValueError):
            self.runcheck(reader=mixedsign)

    def test_mutation_during_decode_detected(self):
        def modify(path,base,parameter,ensemble=False):
            if parameter=='temperature_2m':
                path.write_bytes(b'GRIB'+bytes(143)+b'X')
            return original(path,base,parameter,ensemble)
        with self.assertRaises(ValueError):
            self.runcheck(reader=modify)

if __name__=='__main__':
    unittest.main()
