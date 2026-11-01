#!/usr/bin/env python3
"""Fail-closed cross-run and cross-horizon native deterministic/EPS20 tests."""
from copy import deepcopy
from datetime import timedelta
import unittest

from fast_lane_dual_native_shadow import combine
from ruc_freshness_shadow_gate import model_time

RUN='2026-10-31T18:00'
GRID='c6b12daa91ad64045b26c1b6452a2a20'
FIELDS=('temperature_2m','dew_point_2m','relative_humidity_2m','pressure_msl',
        'u10','v10','wind_gusts_10m','precipitation_acc','cloud_cover',
        'cloud_cover_low','cape','convective_inhibition')

def reports():
    base=model_time(RUN)
    times=[(base+timedelta(hours=h)).strftime('%Y-%m-%dT%H:%MZ') for h in range(7)]
    d={'schema':'mid.ruc.fast-lane-native-values-shadow.v1','run':RUN,'hours':6,
       'validTimesUtc':times,'nativePointCount':542040,'sourceContractGridUuid':GRID,
       'allTwelveDeterministicNativeValuesVerified':True,
       'deterministicBitmapAndPhysicalChecksPassed':True,
       'cumulativePrecipitationValidated':True,'eps20Verified':False,
       'finitePointsByFieldAndLead':{name:[542030]*7 for name in FIELDS},
       'sources':[{'path':f'deterministic/{field}/native.grib2','bytes':300,'sha256':'a'*64}
                  for field in ('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M',
                                'VMAX_10M','TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML')]
                 + [{'path':f'grid/{axis}/native.grib2','bytes':300,'sha256':'b'*64}
                    for axis in ('CLAT','CLON')],
       'losslessWirePackingVerified':False,'pagesWorkerAppWidgetExportVerified':False,
       'productionAuthorized':False}
    e={'schema':'mid.ruc.fast-lane-eps-native-values-shadow.v1','run':RUN,'hours':6,
       'validTimesUtc':times,'nativePointCount':542040,'nativeGridUuid':GRID,
       'eps20NativeHeadersBitmapValuesVerified':True,'cumulativePrecipitationValidated':True,
       'memberIds':list(range(1,21)),'recordCount':140,'deterministicVerified':False,
       'sources':[{'path':'eps/TOT_PREC/native.grib2','bytes':400,'sha256':'c'*64}],
       'losslessWirePackingVerified':False,'pagesWorkerAppWidgetExportVerified':False,
       'productionAuthorized':False}
    return d,e

class Dual(unittest.TestCase):
    def test_complete_reports_still_never_authorize_production(self):
        result=combine(*reports())
        self.assertTrue(result['nativeDeterministicAndEPS20ValueReportsStructurallyConsistent'])
        for key in ('originalDwdSourceAuthenticated','immutableReleaseObjectsSealed',
                    'losslessWirePackingVerified','pagesWorkerAppWidgetExportVerified',
                    'publicationAuthorized'):
            self.assertFalse(result[key])

    def test_cross_run_cross_horizon_and_timestamp_drift(self):
        for field,val in [('run','2026-10-31T17:00'),('hours',14),
                          ('validTimesUtc',['invalid'])]:
            d,e=reports();e[field]=val
            with self.subTest(field=field),self.assertRaises(ValueError):
                combine(d,e)

    def test_invalid_missing_members_and_cross_domain_claims(self):
        for field,val in [('memberIds',list(range(1,20))),
                          ('recordCount',139),('eps20NativeHeadersBitmapValuesVerified',False),
                          ('deterministicVerified',True),('productionAuthorized',True)]:
            d,e=reports();e[field]=val
            with self.subTest(field=field),self.assertRaises(ValueError):
                combine(d,e)
        for field,val in [('allTwelveDeterministicNativeValuesVerified',False),
                          ('eps20Verified',True),('productionAuthorized',True)]:
            d,e=reports();d[field]=val
            with self.subTest(field=field),self.assertRaises(ValueError):
                combine(d,e)

    def test_source_overlap_invalid_hash_and_grid_mismatch(self):
        d,e=reports();e['sources']=deepcopy(d['sources'])
        self.assertRaises(ValueError,combine,d,e)
        d,e=reports();e['sources'][0]['sha256']='not-sha'
        self.assertRaises(ValueError,combine,d,e)
        d,e=reports();e['nativeGridUuid']='wrong'
        self.assertRaises(ValueError,combine,d,e)
        d,e=reports();e['sources'][0]['path']='eps/TOT_PREC/../../escape'
        self.assertRaises(ValueError,combine,d,e)

    def test_missing_cells_and_incomplete_time_coverage(self):
        d,e=reports();d['finitePointsByFieldAndLead'][FIELDS[0]][3]=0
        self.assertRaises(ValueError,combine,d,e)
        d,e=reports();d['finitePointsByFieldAndLead'].pop(FIELDS[1])
        self.assertRaises(ValueError,combine,d,e)
        d,e=reports();d['sources']=[record for record in d['sources']
                                   if 'grid/CLON' not in record['path']]
        self.assertRaises(ValueError,combine,d,e)
        d,e=reports();d['sources']=[record for record in d['sources']
                                   if 'deterministic/CLCL/' not in record['path']]
        self.assertRaises(ValueError,combine,d,e)
        d,e=reports();e['validTimesUtc']=e['validTimesUtc'][:-1]
        self.assertRaises(ValueError,combine,d,e)

if __name__=='__main__':
    unittest.main()
