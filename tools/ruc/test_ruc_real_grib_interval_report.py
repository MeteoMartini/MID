#!/usr/bin/env python3
"""Adversarial read-only 168-hour real-GRIB P1 provenance/NoData/censoring tests."""
import unittest
from datetime import datetime,timedelta,timezone
from copy import deepcopy
from ruc_real_grib_interval_report import summarize,classify,utc
START=datetime(2026,10,25,0,tzinfo=timezone.utc)

def sample(h,delay=46,positive=True):
    run=START+timedelta(hours=h)
    name=run.strftime('%Y-%m-%dT%H:%M')
    seen=run+timedelta(minutes=delay)
    base={'schema':'mid.ruc.real-grib-first-field-shadow.v1','run':name,
          'productionAuthorized':False,'fullRunVerified':False}
    if not positive:
        return {**base,'observationStatus':'unknown',
                'observedAtUtc':seen.isoformat().replace('+00:00','Z')}
    return {**base,'sourceField':'T_2M','leadMinutes':0,
            'origin':'DWD ICON-D2-RUC actual GRIB2/ecCodes',
            'observedAfterUtc':(seen-timedelta(seconds=20)).isoformat().replace('+00:00','Z'),
            'observedBeforeUtc':seen.isoformat().replace('+00:00','Z'),
            'sourceUrl':'https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/T_2M/r/'+name+'/T_2M_PT000H00M.grib2.bz2',
            'wire':{'sha256':'a'*64,'bytes':1200000},
            'witness':{'validTimeUtc':run.strftime('%Y-%m-%dT%H:%MZ'),
                       'pointCount':542040,'finitePointCount':542000,
                       'missingPointCount':40,'minimumC':-25.3,'maximumC':42.5},
            'eps20Verified':False,'dwdFirstPublishedTimeVerified':False}

class Test168h(unittest.TestCase):
    def test_one_field_proves_no_e2e_slo(self):
        result=summarize([sample(167)],ending_at=START+timedelta(hours=167,minutes=50))
        self.assertEqual((result['verifiedSingleFieldRuns'],result['unobservedRuns']),(1,167))
        self.assertEqual(result['firstVerifiedFieldUpperBoundMinutes']['p95'],46)
        for flag in ('officialDwdPublicationTimeVerified','fullHorizonAndEps20Verified',
                     'appWorkerPagesAdoptionVerified','productionSloAuthorized'):
            self.assertFalse(result[flag])

    def test_168_successes_still_not_publish_authorized(self):
        result=summarize([sample(h) for h in range(168)],
                         ending_at=START+timedelta(hours=167,minutes=50))
        self.assertTrue(result['everyRunHasSingleFieldWitness'])
        self.assertEqual(result['firstVerifiedFieldUpperBoundMinutes'],
                         {'p50':46.0,'p90':46.0,'p95':46.0})
        self.assertFalse(result['productionSloAuthorized'])

    def test_failed_polls_not_misread_as_zero_or_negative(self):
        result=summarize([sample(165,positive=False),sample(166,positive=False),sample(167)],
                         ending_at=START+timedelta(hours=167,minutes=50))
        self.assertEqual((result['unknownSampledRuns'],result['unobservedRuns']),(2,165))
        self.assertEqual(result['rightCensoredOrUnknownRuns'],167)
        no_positive=summarize([sample(167,positive=False)],
                              ending_at=START+timedelta(hours=167,minutes=50))
        self.assertIsNone(no_positive['firstVerifiedFieldUpperBoundMinutes']['p95'])

    def test_repeated_poll_is_only_one_independent_run(self):
        result=summarize([sample(167,52),sample(167,42),sample(167,48)],
                         ending_at=START+timedelta(hours=167,minutes=55))
        self.assertEqual(result['verifiedSingleFieldRuns'],1)
        self.assertEqual(result['firstVerifiedFieldUpperBoundMinutes']['p95'],42.0)

    def test_adversarial_metadata_is_rejected(self):
        good=sample(167)
        for key,value in [('sourceField','TOT_PREC'),('leadMinutes',-1),
                          ('origin','third party'),('eps20Verified',True),
                          ('productionAuthorized',True),('fullRunVerified',True),
                          ('dwdFirstPublishedTimeVerified',True),
                          ('sourceUrl','https://attacker.example/other.grib2')]:
            bad=deepcopy(good);bad[key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):
                classify(bad)
        for field,value in [('missingPointCount',0),('finitePointCount',542041),
                            ('validTimeUtc','2026-10-30T00:00Z'),
                            ('minimumC',float('nan'))]:
            bad=deepcopy(good);bad['witness'][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):
                classify(bad)
        bad=deepcopy(good);bad['wire']['sha256']='bad'
        self.assertRaises(ValueError,classify,bad)
        bad=deepcopy(good);bad['observedBeforeUtc']='2026-10-01T00:00Z'
        self.assertRaises(ValueError,classify,bad)

    def test_utc_invalid_future_and_dwd_path_traversal(self):
        self.assertRaises(ValueError,utc,'2026-11-01T02:00:00+01:00')
        bad=sample(167,positive=False);bad['observedAtUtc']='2026-10-21T00:00Z'
        self.assertRaises(ValueError,classify,bad)
        bad=sample(167);bad['sourceUrl']+='?foo=bar'
        self.assertRaises(ValueError,classify,bad)
        bad=sample(167);bad['sourceUrl']+='/../other'
        self.assertRaises(ValueError,classify,bad)
        self.assertRaises(ValueError,summarize,[sample(167)],
                          ending_at=START+timedelta(hours=167,minutes=5))
if __name__=='__main__':unittest.main()
