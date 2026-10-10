"""Offline positive/negative RUC integrity fixtures (no upstream/network)."""
import unittest
import json
import io
import contextlib
import warnings
from unittest.mock import patch
from datetime import datetime, timezone
import numpy as np
from meteo_integrity import MeteoIntegrityError, validate_grib_origin, validate_accumulation, validate_core_fields, validate_eps_member_coverage, missing_cell_metrics


class MeteoIntegrityTests(unittest.TestCase):
    def test_missing_rolling_rain_is_not_dry_zero(self):
        from build_ruc_bundle import _max_rolling_sum
        # One complete wet window, one completely missing cell, one interrupted
        # window, and one genuinely dry cell. Only complete windows count.
        cube = np.array([[0., np.nan, 0., 0.], [1., np.nan, np.nan, 0.],
                         [2., np.nan, 2., 0.]])
        before = cube.copy()
        np.testing.assert_allclose(_max_rolling_sum(cube, 2),
                                   [3., np.nan, np.nan, 0.], equal_nan=True)
        np.testing.assert_array_equal(cube, before)
        np.testing.assert_allclose(_max_rolling_sum(np.array([[0.], [1.], [2.], [np.nan]]), 2), [3.])

    def test_eps_period_missing_members_do_not_become_dry_votes(self):
        from build_ruc_bundle import rapid_extreme_eps_period_summary
        from datetime import timedelta
        run = datetime(2026, 10, 10, tzinfo=timezone.utc)
        times = [run + timedelta(hours=i) for i in range(7)]
        cube = np.zeros((7, 3, 3))
        cube[1:, 0, 0] = 4.  # valid wet member, 24 mm over 6 h
        cube[1:, 1, 0] = 0.  # valid dry member
        cube[3, 2, 0] = np.nan  # incomplete member must not vote
        cube[:, :, 1] = np.nan  # wholly unavailable cell
        before = cube.copy()
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore', message='All-NaN slice encountered', category=RuntimeWarning)
            row = rapid_extreme_eps_period_summary(cube, times, run.isoformat())['0-6']
        np.testing.assert_array_equal(row['memberCount'], [2., 0., 3.])
        np.testing.assert_allclose(row['wetProbabilityPct'], [50., np.nan, 0.], equal_nan=True)
        np.testing.assert_allclose(row['totalQ75Mm'], [18., np.nan, 0.], equal_nan=True)
        np.testing.assert_array_equal(cube, before)

    def test_missing_metrics_preserve_native_masks_and_distinguish_persistence(self):
        finite = np.array([[True, False, False, True],
                           [True, False, True, True],
                           [True, False, True, False]])
        before = finite.copy()
        report = missing_cell_metrics(finite)
        self.assertEqual(report['pointCount'], 4)
        self.assertEqual(report['timeCount'], 3)
        self.assertEqual(report['persistentMissingCount'], 1)
        self.assertEqual([s['missingCount'] for s in report['steps']], [2, 1, 2])
        self.assertEqual([s['missingFraction'] for s in report['steps']], [.5, .25, .5])
        self.assertEqual([s['additionalMissingCount'] for s in report['steps']], [1, 0, 1])
        np.testing.assert_array_equal(finite, before)
        self.assertEqual(json.loads(json.dumps(report, allow_nan=False)), report)
        self.assertEqual(missing_cell_metrics(np.ones((2, 4), dtype=bool))['steps'][0]['missingFraction'], 0)
        for shape in ((0, 4), (2, 0), (4,)):
            with self.subTest(shape=shape), self.assertRaises(MeteoIntegrityError):
                missing_cell_metrics(np.ones(shape, dtype=bool))

    def test_member_metrics_use_actual_ids_and_reject_empty_time_axis(self):
        cube = np.zeros((3, 2, 4))
        cube[:, 0, -1] = np.nan
        cube[1, 1, 0] = np.inf
        before = cube.copy()
        report = validate_eps_member_coverage(cube, [19, 3])
        self.assertEqual([m['member'] for m in report['members']], [19, 3])
        self.assertEqual(report['members'][0]['persistentMissingCount'], 1)
        self.assertEqual(report['members'][1]['steps'][1]['additionalMissingCount'], 1)
        np.testing.assert_array_equal(cube, before)
        with self.assertRaisesRegex(MeteoIntegrityError, 'dimensions'):
            validate_eps_member_coverage(np.zeros((0, 2, 4)), [19, 3])

    def test_eps_member_native_coverage(self):
        members = [3, 7, 19]
        cube = np.zeros((3, 3, 4))
        cube[:, :, -1] = np.nan
        before = cube.copy()
        validate_eps_member_coverage(cube, members)
        np.testing.assert_array_equal(cube, before)
        for index, member in enumerate(members):
            broken = cube.copy()
            broken[1, index] = np.nan
            with self.subTest(member=member), self.assertRaisesRegex(MeteoIntegrityError, rf'\(1, {member}\)'):
                validate_eps_member_coverage(broken, members)
        with self.assertRaisesRegex(MeteoIntegrityError, 'dimensions'):
            validate_eps_member_coverage(cube, members[:2])
        with self.assertRaisesRegex(MeteoIntegrityError, 'duplicate member'):
            validate_eps_member_coverage(cube, [3, 3, 19])

    def test_eps_collector_preserves_all_members_or_rejects(self):
        import build_ruc_bundle as builder
        targets = [datetime(2026, 10, 9, hour, tzinfo=timezone.utc) for hour in (0, 1, 2)]
        members = list(range(1, 21))
        messages = [(time, member, np.array([float(step), 0., np.nan]), 'mm', {})
                    for step, time in enumerate(targets) for member in reversed(members)]
        def collect(batch):
            with patch.dict('os.environ', {'MID_RUC_EPS_DECODE_WORKERS': '1'}), \
                 patch.object(builder, 'decode_file_batch', return_value=batch), \
                 patch.object(builder, 'assert_same_parameter_signature', return_value={}):
                return builder.collect_eps(['fixture.grib2'], targets, 3)
        with contextlib.redirect_stdout(io.StringIO()) as output:
            interval, actual = collect(messages)
        metrics = json.loads(output.getvalue().split('RUC_MISSING_METRICS ', 1)[1])
        self.assertEqual(metrics['validTimes'], [time.isoformat() for time in targets])
        self.assertEqual([row['member'] for row in metrics['members']], members)
        self.assertEqual(metrics['members'][0]['steps'][1]['missingFraction'], 1/3)
        self.assertEqual(actual, members)
        self.assertEqual(interval.shape, (3, 20, 3))
        np.testing.assert_array_equal(interval[:, :, 0], np.array([[0.]*20, [1.]*20, [1.]*20]))
        self.assertTrue(np.isnan(interval[:, :, 2]).all())
        for step in (0, 1, 2):
            missing = [row for row in messages if not (row[0] == targets[step] and row[1] == 19)]
            with self.subTest(step=step), self.assertRaisesRegex(SystemExit, 'missing members.*19'):
                collect(missing)
        empty = [(time, member, np.full(3, np.nan) if time == targets[1] and member == 19 else vals, units, sig)
                 for time, member, vals, units, sig in messages]
        with self.assertRaisesRegex(MeteoIntegrityError, r'\(1, 19\)'):
            collect(empty)

    def test_step_coverage_and_shared_dimensions(self):
        names = ('temperature_2m', 'dew_point_2m', 'relative_humidity_2m', 'cloud_cover',
                 'cloud_cover_low', 'wind_speed_10m', 'wind_gusts_10m',
                 'wind_direction_10m', 'precipitation', 'cape', 'pressure_msl', 'convective_inhibition')
        fields = {name: np.zeros((3, 4)) for name in names}
        fields['pressure_msl'][:] = 1013.25
        # Authenticated missing border cells stay at the same grid index.
        for array in fields.values():
            array[:, -1] = np.nan
        before = {name: value.copy() for name, value in fields.items()}
        report = validate_core_fields(fields)
        self.assertEqual(set(report['fields']), set(names))
        for row in report['fields'].values():
            self.assertEqual(row['persistentMissingCount'], 1)
            self.assertEqual(row['steps'][0]['missingFraction'], .25)
        for name in names:
            np.testing.assert_array_equal(fields[name], before[name])
            broken = {key: value.copy() for key, value in fields.items()}
            broken[name][1, :] = np.nan
            with self.subTest(field=name), self.assertRaisesRegex(MeteoIntegrityError, r'forecast steps \[1\]'):
                validate_core_fields(broken)
            for shape in ((2, 4), (3, 5)):
                with self.subTest(field=name, shape=shape), self.assertRaisesRegex(MeteoIntegrityError, 'grid/time dimensions'):
                    validate_core_fields({**fields, name: np.zeros(shape)})

    def test_accumulation_step_coverage(self):
        for cube in (np.array([[0., np.nan], [0., np.nan], [1., np.nan]]),
                     np.zeros((3, 2, 4))):
            original = cube.copy()
            validate_accumulation(cube, 'coverage')
            np.testing.assert_array_equal(cube, original)
            missing = cube.copy()
            missing[1] = np.nan
            with self.assertRaisesRegex(MeteoIntegrityError, r'forecast steps \[1\]'):
                validate_accumulation(missing, 'coverage')

    def test_full_native_dimensions_with_masked_border(self):
        names = ('temperature_2m', 'dew_point_2m', 'relative_humidity_2m', 'cloud_cover',
                 'cloud_cover_low', 'wind_speed_10m', 'wind_gusts_10m',
                 'wind_direction_10m', 'precipitation', 'cape', 'pressure_msl', 'convective_inhibition')
        native = np.zeros((15, 542040), dtype=np.float32)
        native[:, -16968:] = np.nan
        fields = {name: native for name in names}
        fields['pressure_msl'] = np.where(np.isfinite(native), 1013.25, np.nan)
        report = validate_core_fields(fields)
        row = report['fields']['cloud_cover']
        self.assertEqual(row['pointCount'], 542040)
        self.assertEqual(row['persistentMissingCount'], 16968)
        self.assertEqual(row['steps'][7]['missingCount'], 16968)
        self.assertAlmostEqual(row['steps'][7]['missingFraction'], 16968/542040)
        self.assertEqual(row['steps'][7]['additionalMissingCount'], 0)
        missing = native.copy()
        missing[7] = np.nan
        with self.assertRaisesRegex(MeteoIntegrityError, r'forecast steps \[7\]'):
            validate_core_fields({**fields, 'cloud_cover': missing})
        self.assertEqual(int(np.count_nonzero(np.isfinite(native[7]))), 525072)

    def test_origin(self):
        run = datetime(2026, 10, 8, 18, tzinfo=timezone.utc)
        validate_grib_origin(20261008, 1800, run)
        for date, time in [(20261008, 1200), (20261007, 1800)]:
            with self.assertRaisesRegex(MeteoIntegrityError, 'initialization'):
                validate_grib_origin(date, time, run)

    def test_precipitation_accumulation(self):
        validate_accumulation(np.array([[0., 0.], [0.2, .4], [0.18, 0.9]]), 'det')
        validate_accumulation(np.array([[[0., 0.]], [[.02, np.nan]]]), 'eps')
        for invalid in (np.array([[0., 0.], [0.2, 1.], [.1, 2.]]), np.array([[0.], [-.2]])):
            with self.assertRaises(MeteoIntegrityError):
                validate_accumulation(invalid, 'test')
        with self.assertRaises(MeteoIntegrityError):
            validate_accumulation(np.full((2, 3), np.nan), 'missing')

    def test_field_ranges_and_dew(self):
        names = ('temperature_2m', 'dew_point_2m', 'relative_humidity_2m', 'cloud_cover',
                 'cloud_cover_low', 'wind_speed_10m', 'wind_gusts_10m',
                 'wind_direction_10m', 'precipitation', 'cape', 'pressure_msl', 'convective_inhibition')
        fields = {name: np.array([[0., 0.]]) for name in names}
        fields['pressure_msl'][:] = 1013.25
        fields['temperature_2m'] = np.array([[63., -90.]])
        fields['dew_point_2m'] = np.array([[62.7, -91.]])
        fields['relative_humidity_2m'] = np.array([[100.4, 0.]])
        fields['cloud_cover'] = np.array([[100., np.nan]])
        validate_core_fields(fields)
        for name in names:
            with self.subTest(missing=name), self.assertRaisesRegex(MeteoIntegrityError, 'missing required'):
                validate_core_fields({key: value for key, value in fields.items() if key != name})
        for name, bad in [('relative_humidity_2m', 102.), ('cloud_cover', -3.),
                          ('temperature_2m', 100.), ('wind_speed_10m', -2.), ('cape', -4.), ('pressure_msl', 0.), ('pressure_msl', -1.), ('convective_inhibition', -1.)]:
            broken = dict(fields, **{name: np.array([[bad, bad]])})
            with self.subTest(name=name), self.assertRaises(MeteoIntegrityError):
                validate_core_fields(broken)
        with self.assertRaisesRegex(MeteoIntegrityError, 'dew point'):
            validate_core_fields({**fields, 'dew_point_2m': np.array([[65., -89.]])})
        with self.assertRaisesRegex(MeteoIntegrityError, 'no finite'):
            validate_core_fields({**fields, 'cloud_cover_low': np.array([[np.nan, np.nan]])})


if __name__ == '__main__':
    unittest.main()
