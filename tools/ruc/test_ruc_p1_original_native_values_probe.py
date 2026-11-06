#!/usr/bin/env python3
"""Adversarial offline QA for original native P1 GRIB values sampling."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from ruc_p1_original_native_values_probe import (
    NATIVE_POINTS,
    accumulation_key,
    bitmap_evidence,
    check_accumulation_pair,
    describe_values,
    examine,
    probe,
)
from scientific_grib_contract_probe import targets

RUN = datetime(2026, 11, 1, 18, tzinfo=timezone.utc)
URL = 'https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc-eps/p/TOT_PREC/r/2026-11-01T18:00/e/01/s/PT006H00M.grib2'
ROW = {
    'url': URL,
    'logicalField': 'precipitation_acc',
    'parameter': 'TOT_PREC',
    'member': 1,
}


def sample():
    values = np.ones(NATIVE_POINTS, dtype=np.float32)
    values[0] = 0.0
    values[1] = np.nan
    values[2] = 5000.0
    return values


def structure(*, bitmap_present=1, bitmap=None, start=0, end=21600, step_type='accum'):
    if bitmap is None and bitmap_present == 1:
        bitmap = np.ones(NATIVE_POINTS, dtype=np.int8)
        bitmap[1] = 0
    return {
        'bitmapPresent': bitmap_present,
        'bitmap': bitmap,
        'valueCount': NATIVE_POINTS,
        'forecastReferenceUtc': RUN.isoformat(),
        'startStep': str(start // 3600),
        'endStep': str(end // 3600),
        'stepUnits': 1,
        'startStepSeconds': start,
        'endStepSeconds': end,
        'startTimeUtc': (RUN + timedelta(seconds=start)).isoformat(),
        'endTimeUtc': (RUN + timedelta(seconds=end)).isoformat(),
        'stepType': step_type,
    }


class OriginalNativeP1Test(unittest.TestCase):
    def test_bitmapless_valid_field_is_accepted_and_reported_as_bitmapless(self):
        values = np.ones(NATIVE_POINTS, dtype=np.float32)
        evidence = bitmap_evidence(values, 0, None)
        self.assertFalse(evidence['bitmapPresent'])
        self.assertEqual(evidence['bitmapLength'], 0)
        self.assertEqual(evidence['bitmapMissingCount'], 0)
        self.assertEqual(evidence['decodedValueCount'], NATIVE_POINTS)
        self.assertTrue(evidence['missingMaskConsistent'])

    def test_bitmap_mask_must_match_decoded_missing_values_exactly(self):
        bits = np.ones(NATIVE_POINTS, dtype=np.int8)
        bits[1] = 0
        evidence = bitmap_evidence(sample(), 1, bits)
        self.assertEqual(evidence['bitmapLength'], NATIVE_POINTS)
        self.assertEqual(evidence['bitmapMissingCount'], 1)
        self.assertEqual(evidence['decodedMissingCount'], 1)
        with self.assertRaisesRegex(ValueError, 'missing mask disagrees'):
            bitmap_evidence(np.ones(NATIVE_POINTS), 1, bits)
        with self.assertRaisesRegex(ValueError, 'missing mask disagrees'):
            bitmap_evidence(sample(), 0, None)

    def test_inconsistent_bitmap_shape_bits_and_grid_fail_closed(self):
        values = np.ones(NATIVE_POINTS, dtype=np.float32)
        for present, bits, expected in (
            (1, None, 'declares a missing bitmap'),
            (1, np.ones(NATIVE_POINTS - 1, dtype=np.int8), 'bitmap length'),
            (1, np.full(NATIVE_POINTS, 2, dtype=np.int8), 'bitmap length'),
            (255, None, 'unsupported original GRIB bitmap'),
        ):
            with self.subTest(present=present, expected=expected), self.assertRaisesRegex(ValueError, expected):
                bitmap_evidence(values, present, bits)
        with self.assertRaisesRegex(ValueError, 'grid/value count'):
            bitmap_evidence(values[:-1], 0, None)

    def test_missing_values_are_not_zero_and_extremes_remain_visible(self):
        stats = describe_values(sample())
        self.assertEqual(stats['missingCount'], 1)
        self.assertEqual(stats['trueZeroCount'], 1)
        self.assertEqual(stats['maximumInNormalizedUnit'], 5000)
        with self.assertRaisesRegex(ValueError, 'entire original'):
            describe_values(np.full(NATIVE_POINTS, np.nan))

    def test_examine_reports_source_sha_bitmap_and_actual_step_bounds(self):
        bits = np.ones(NATIVE_POINTS, dtype=np.int8)
        bits[1] = 0
        payload = b'GRIB-original'
        result = examine(
            ROW, payload, 'before', 'after', RUN,
            decoder=lambda *args, **kwargs: [
                (RUN + timedelta(hours=6), 1, sample(), 'kg m**-2')
            ],
            header=lambda _row, raw, _run: {
                'sha256': __import__('hashlib').sha256(raw).hexdigest(),
                'lead_seconds': 21600,
                'forecast_reference_time': RUN.isoformat(),
                'valid_time': (RUN + timedelta(hours=6)).isoformat(),
                'time_bounds': [RUN.isoformat(), (RUN + timedelta(hours=6)).isoformat()],
                'processing': 'accum',
            },
            structure_reader=lambda _path: structure(bitmap=bits),
        )
        self.assertEqual(result['sourceUrl'], URL)
        self.assertEqual(result['sha256OriginalDownload'], __import__('hashlib').sha256(payload).hexdigest())
        self.assertEqual(result['bitmapMissingCount'], 1)
        self.assertTrue(result['missingMaskConsistent'])
        self.assertEqual(result['startStepSeconds'], 0)
        self.assertEqual(result['endStepSeconds'], 21600)
        self.assertEqual(result['stepType'], 'accum')
        self.assertFalse(result['firstDwdPublicationInstantVerified'])
        self.assertNotIn('actualOriginalSection6BitmapAppliedByProductionDecoder', result)

    def test_examine_rejects_rehashed_false_bitmap_success_and_wrong_window(self):
        payload = b'GRIB-original'
        common = {
            'decoder': lambda *args, **kwargs: [
                (RUN + timedelta(hours=6), 1, np.ones(NATIVE_POINTS), 'kg m**-2')
            ],
            'header': lambda _row, raw, _run: {
                'sha256': __import__('hashlib').sha256(raw).hexdigest(),
                'lead_seconds': 21600,
                'forecast_reference_time': RUN.isoformat(),
                'valid_time': (RUN + timedelta(hours=6)).isoformat(),
                'time_bounds': [RUN.isoformat(), (RUN + timedelta(hours=6)).isoformat()],
                'processing': 'accum',
            },
        }
        bits = np.ones(NATIVE_POINTS, dtype=np.int8)
        bits[0] = 0
        with self.assertRaisesRegex(ValueError, 'missing mask disagrees'):
            examine(ROW, payload, 'before', 'after', RUN,
                    structure_reader=lambda _path: structure(bitmap=bits), **common)
        with self.assertRaisesRegex(ValueError, 'step bounds disagree'):
            examine(ROW, payload, 'before', 'after', RUN,
                    structure_reader=lambda _path: structure(start=3600), **common)

    def test_cumulative_precipitation_checks_only_matching_start_and_provenance(self):
        base = {
            'forecastReferenceUtc': RUN.isoformat(),
            'memberId': 7,
            'logicalField': 'precipitation_acc',
            'originalUnits': 'kg m**-2',
            'startTimeUtc': RUN.isoformat(),
            'startStepSeconds': 0,
            'stepUnits': 1,
            'stepType': 'accum',
            'endStepSeconds': 3600,
        }
        next_record = {**base, 'endStepSeconds': 7200}
        before = np.ones(8, dtype=np.float32)
        after = np.full(8, 2.0, dtype=np.float32)
        self.assertTrue(check_accumulation_pair(base, before, next_record, after))
        with self.assertRaisesRegex(ValueError, 'decreases'):
            check_accumulation_pair(base, after, next_record, before)
        for field, value in (
            ('forecastReferenceUtc', '2026-11-02T18:00:00+00:00'),
            ('memberId', 8),
            ('originalUnits', 'kg m-2'),
            ('startTimeUtc', (RUN + timedelta(hours=1)).isoformat()),
        ):
            with self.subTest(field=field), self.assertRaisesRegex(
                ValueError, 'different run/member/field/unit/start/type'
            ):
                check_accumulation_pair(
                    base, before, {**next_record, field: value}, after
                )
        self.assertFalse(check_accumulation_pair(
            base, before, {**next_record, 'logicalField': 'temperature_2m'}, after
        ))
        self.assertFalse(check_accumulation_pair(
            base, before, {**next_record, 'stepType': 'avg'}, after
        ))
        with self.assertRaisesRegex(ValueError, 'strictly increasing'):
            check_accumulation_pair(
                base, before, {**base, 'endStepSeconds': 3600}, after
            )

    def test_interval_precipitation_with_different_starts_is_not_compared_as_cumulative(self):
        first = {
            'forecastReferenceUtc': RUN.isoformat(),
            'memberId': None,
            'logicalField': 'precipitation_acc',
            'originalUnits': 'mm',
            'startTimeUtc': RUN.isoformat(),
            'startStepSeconds': 0,
            'stepUnits': 1,
            'stepType': 'accum',
            'endStepSeconds': 3600,
        }
        second = {
            **first,
            'startTimeUtc': (RUN + timedelta(hours=1)).isoformat(),
            'startStepSeconds': 3600,
            'endStepSeconds': 7200,
        }
        self.assertNotEqual(accumulation_key(first), accumulation_key(second))
        with self.assertRaisesRegex(ValueError, 'different run/member/field/unit/start/type'):
            check_accumulation_pair(first, np.ones(8), second, np.zeros(8))

    def test_partial_missing_mask_is_not_filled_during_accumulation_check(self):
        first = np.array([1.0, np.nan, 3.0], dtype=np.float32)
        second = np.array([2.0, np.nan, 4.0], dtype=np.float32)
        record = {
            'forecastReferenceUtc': RUN.isoformat(),
            'memberId': 1,
            'logicalField': 'precipitation_acc',
            'originalUnits': 'mm',
            'startTimeUtc': RUN.isoformat(),
            'startStepSeconds': 0,
            'stepUnits': 1,
            'stepType': 'accum',
            'endStepSeconds': 3600,
        }
        self.assertTrue(check_accumulation_pair(
            record, first, {**record, 'endStepSeconds': 7200}, second
        ))

    def test_full_scope_inventory_is_exactly_1000_with_ordered_eps_leads(self):
        requests = targets('2026-11-01T18:00', hours=27, rapid_hours=6, members=20)
        self.assertEqual(len(requests), 1000)
        self.assertEqual(len({row['url'] for row in requests}), 1000)

        def fake_examine(row, _payload, _before, _after, run):
            lead = __import__('re').search(r'PT(\d{3})H(\d{2})M', row['url'])
            seconds = int(lead[1]) * 3600 + int(lead[2]) * 60
            valid = run + timedelta(seconds=seconds)
            accumulating = row['logicalField'] == 'precipitation_acc'
            values = np.full(
                NATIVE_POINTS,
                seconds / 3600 if accumulating else 1,
                dtype=np.float32,
            )
            return {
                'sourceUrl': row['url'],
                'logicalField': row['logicalField'],
                'memberId': row['member'],
                'requestedLeadSeconds': seconds,
                'forecastReferenceUtc': run.isoformat(),
                'validTimeUtc': valid.isoformat(),
                'originalUnits': 'mm',
                'startStepSeconds': 0,
                'endStepSeconds': seconds,
                'startTimeUtc': run.isoformat(),
                'stepUnits': 1,
                'stepType': 'accum' if accumulating else 'instant',
                'missingMaskConsistent': True,
                '_normalizedValues': values,
            }

        with patch(
            'ruc_p1_original_native_values_probe.examine',
            side_effect=fake_examine,
        ):
            report = probe(
                '2026-11-01T18:00',
                hours=27,
                rapid_hours=6,
                workers=4,
                getter=lambda row: (row, b'GRIB-test', 'before', 'after'),
            )
        eps = [record for record in report['records'] if record['memberId'] is not None]
        self.assertEqual(report['requestedFiles'], 1000)
        self.assertEqual(report['originalFilesVerified'], 1000)
        self.assertTrue(report['full27hOriginalScopeVerified'])
        self.assertEqual({record['memberId'] for record in eps}, set(range(1, 21)))
        for member in range(1, 21):
            leads = {
                record['requestedLeadSeconds']
                for record in eps
                if record['memberId'] == member
            }
            self.assertEqual(leads, {hour * 3600 for hour in range(28)})


if __name__ == '__main__':
    unittest.main()
