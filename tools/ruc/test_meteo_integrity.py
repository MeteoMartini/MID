"""Offline positive/negative RUC integrity fixtures (no upstream/network)."""
import unittest
from unittest.mock import patch
from datetime import datetime, timezone
import numpy as np
from meteo_integrity import MeteoIntegrityError, validate_grib_origin, validate_accumulation, validate_core_fields, validate_eps_member_coverage


class MeteoIntegrityTests(unittest.TestCase):
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
        interval, actual = collect(messages)
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
        # Authenticated missing border cells stay at the same grid index.
        for array in fields.values():
            array[:, -1] = np.nan
        before = {name: value.copy() for name, value in fields.items()}
        validate_core_fields(fields)
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
        validate_core_fields(fields)
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
                 'wind_direction_10m', 'precipitation', 'cape')
        fields = {name: np.array([[0., 0.]]) for name in names}
        fields['temperature_2m'] = np.array([[63., -90.]])
        fields['dew_point_2m'] = np.array([[62.7, -91.]])
        fields['relative_humidity_2m'] = np.array([[100.4, 0.]])
        fields['cloud_cover'] = np.array([[100., np.nan]])
        validate_core_fields(fields)
        for name, bad in [('relative_humidity_2m', 102.), ('cloud_cover', -3.),
                          ('temperature_2m', 100.), ('wind_speed_10m', -2.), ('cape', -4.)]:
            broken = dict(fields, **{name: np.array([[bad, bad]])})
            with self.subTest(name=name), self.assertRaises(MeteoIntegrityError):
                validate_core_fields(broken)
        with self.assertRaisesRegex(MeteoIntegrityError, 'dew point'):
            validate_core_fields({**fields, 'dew_point_2m': np.array([[65., -89.]])})
        with self.assertRaisesRegex(MeteoIntegrityError, 'no finite'):
            validate_core_fields({**fields, 'cloud_cover_low': np.array([[np.nan, np.nan]])})


if __name__ == '__main__':
    unittest.main()
