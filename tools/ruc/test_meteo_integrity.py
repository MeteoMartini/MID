"""Offline positive/negative RUC integrity fixtures (no upstream/network)."""
import unittest
from datetime import datetime, timezone
import numpy as np
from meteo_integrity import MeteoIntegrityError, validate_grib_origin, validate_accumulation, validate_core_fields


class MeteoIntegrityTests(unittest.TestCase):
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
