#!/usr/bin/env python3
"""Adversarial offline QA for original native P1 GRIB values sampler."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from ruc_p1_original_native_values_probe import (
    NATIVE_POINTS, assert_requested_lead, describe_values, examine, probe,
)

RUN = datetime(2026, 11, 1, 18, tzinfo=timezone.utc)
URL = 'https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc-eps/p/TOT_PREC/r/2026-11-01T18:00/e/01/s/PT006H00M.grib2'
ROW = {'url': URL, 'logicalField': 'precipitation_acc',
       'parameter': 'TOT_PREC', 'member': 1}


def sample():
    a = np.ones(NATIVE_POINTS, dtype=np.float32)
    a[0] = 0.0
    a[1] = np.nan
    a[2] = 5000.0  # Preserve extreme; do not smooth/cap or relabel as Missing.
    return a


class RealNativeP1Test(unittest.TestCase):
    def test_native_true_zero_masked_cell_and_extreme_are_distinct(self):
        row = describe_values(sample())
        self.assertEqual(row['pointCount'], NATIVE_POINTS)
        self.assertEqual(row['missingCount'], 1)
        self.assertEqual(row['trueZeroCount'], 1)
        self.assertEqual(row['maximumInNormalizedUnit'], 5000)
        self.assertFalse(row['missingAsZero'])
        self.assertFalse(row['extremesSmoothed'])

    def test_entirely_missing_or_inf_never_accepted(self):
        for value in (np.nan, np.inf, -np.inf):
            with self.subTest(value=value), self.assertRaises(ValueError):
                describe_values(np.full(NATIVE_POINTS, value, dtype=np.float32))

    def test_rehashed_reduced_grid_not_accepted(self):
        with self.assertRaisesRegex(ValueError, 'grid mismatch'):
            describe_values(np.ones(NATIVE_POINTS - 1))
        with self.assertRaisesRegex(ValueError, 'grid mismatch'):
            describe_values(np.ones((1, NATIVE_POINTS)))

    def test_file_validity_must_equal_actual_requested_lead(self):
        self.assertEqual(assert_requested_lead(ROW, {'lead_seconds': 6*3600}), 21600)
        with self.assertRaisesRegex(ValueError, 'validity differs'):
            assert_requested_lead(ROW, {'lead_seconds': 7*3600})
        with self.assertRaisesRegex(ValueError, 'unverified'):
            assert_requested_lead({**ROW, 'url': URL.replace('PT006H00M', '../evil')},
                                  {'lead_seconds': 21600})

    def test_real_production_decoder_is_called_with_exact_dwd_contract(self):
        seen = []
        def decoder(path, *, ensemble, expected_run, expected_parameter):
            seen.append((ensemble, expected_run, expected_parameter, path.suffix))
            return [(RUN+timedelta(hours=6), 1, sample(), 'kg m**-2')]
        result = examine(ROW, b'GRIBfake-original', RUN.isoformat(), RUN.isoformat(), RUN,
                         decoder=decoder,
                         header=lambda _row, raw, _run: {'lead_seconds': 21600, 'sha256':__import__('hashlib').sha256(raw).hexdigest()})
        self.assertEqual(result['missingCount'], 1)
        self.assertEqual(result['trueZeroCount'], 1)
        self.assertEqual(result['memberId'], 1)
        self.assertTrue(result['actualOriginalSection6BitmapAppliedByProductionDecoder'])
        self.assertEqual(seen[0], (True, RUN, 'precipitation_acc', '.grib2'))
        self.assertFalse(result['firstDwdPublicationInstantVerified'])

    def test_foreign_ensemble_member_or_shifted_validity_rejected(self):
        for actual_member,valid in ((2, RUN+timedelta(hours=6)),
                                    (1, RUN+timedelta(hours=7))):
            with self.subTest(member=actual_member,valid=valid),self.assertRaises(ValueError):
                examine(ROW,b'GRIBsource',RUN.isoformat(),RUN.isoformat(),RUN,
                        decoder=lambda *a,**k:[(valid,actual_member,sample(),'kg m**-2')],
                        header=lambda _row,raw,_run:{'lead_seconds':21600,'sha256':__import__('hashlib').sha256(raw).hexdigest()})

    def test_more_than_one_grib_message_is_fail_closed(self):
        with self.assertRaisesRegex(ValueError,'exactly one'):
            examine(ROW,b'GRIBsource',RUN.isoformat(),RUN.isoformat(),RUN,
                    decoder=lambda *a,**k:[(RUN,1,sample(),'kg m**-2'),
                                            (RUN,1,sample(),'kg m**-2')],
                    header=lambda _row,raw,_run:{'lead_seconds':21600,'sha256':__import__('hashlib').sha256(raw).hexdigest()})

    def test_negative_original_accumulation_is_not_rounded_to_dry_zero(self):
        negative = sample()
        negative[4] = -1
        with self.assertRaisesRegex(ValueError, 'physically negative'):
            examine(ROW, b'GRIBsource', RUN.isoformat(), RUN.isoformat(), RUN,
                    decoder=lambda *a, **k: [(RUN+timedelta(hours=6), 1, negative, 'kg m**-2')],
                    header=lambda _row, raw, _run: {'lead_seconds': 21600, 'sha256':__import__('hashlib').sha256(raw).hexdigest()})

    def test_original_sha_tamper_rejected_before_value_decode(self):
        with self.assertRaisesRegex(ValueError,'input SHA differ'):
            examine(ROW, b'GRIBsource', RUN.isoformat(), RUN.isoformat(), RUN,
                    decoder=lambda *a, **k: [(RUN+timedelta(hours=6), 1, sample(), 'kg m**-2')],
                    header=lambda _row, raw, _run: {'lead_seconds': 21600,'sha256':'0'*64})

    def test_scope_cannot_claim_168h_or_production_fast_lane(self):
        # Patch ONLY examine, keep actual URL/member inventory generation.
        def fake(row, _data, _before, _after, _run):
            match = __import__('re').search(r'PT(\d{3})H(\d{2})M',row['url'])
            return {'memberId':row['member'],'logicalField':row['logicalField'],
                    'validTimeUtc':RUN.isoformat(),
                    'requestedLeadSeconds':int(match[1])*3600+int(match[2])*60}
        with patch('ruc_p1_original_native_values_probe.examine',side_effect=fake):
            data = probe('2026-11-01T18:00',hours=6,rapid_hours=0,workers=2,
                         getter=lambda row:(row,b'GRIB','t1','t2'))
        self.assertTrue(data['everyRequestedEps20MemberAndLeadVerified'])
        self.assertFalse(data['full27hOriginalScopeVerified'])
        self.assertFalse(data['full168hObserved'])
        self.assertFalse(data['clientAdoptionVerified'])
        self.assertFalse(data['productionSloAuthorized'])
        self.assertFalse(data['publicationAuthorized'])

    def test_incomplete_or_double_member_inventory_rejected(self):
        def fake(row,*args):
            match=__import__('re').search(r'PT(\d{3})H(\d{2})M',row['url'])
            member=row['member']
            return {'memberId':1 if member==2 else member,
                    'logicalField':row['logicalField'],'validTimeUtc':RUN.isoformat(),
                    'requestedLeadSeconds':int(match[1])*3600+int(match[2])*60}
        with patch('ruc_p1_original_native_values_probe.examine',side_effect=fake):
            with self.assertRaisesRegex(ValueError,'duplicate original EPS'):
                probe('2026-11-01T18:00',hours=6,rapid_hours=0,workers=1,
                      getter=lambda row:(row,b'GRIB','t1','t2'))

    def test_reject_unrealistic_future_run_and_incomplete_scopes(self):
        future=(datetime.now(timezone.utc)+timedelta(days=2)).strftime('%Y-%m-%dT%H:00')
        for run, hours, rapid in ((future,6,6),('2026-11-01T18:30',6,6),
                                  ('2026-11-01T18:00',7,6),
                                  ('2026-11-01T18:00',6,7)):
            with self.subTest(run=run,hours=hours,rapid=rapid),self.assertRaises(ValueError):
                probe(run,hours=hours,rapid_hours=rapid)


if __name__ == '__main__':
    unittest.main()
