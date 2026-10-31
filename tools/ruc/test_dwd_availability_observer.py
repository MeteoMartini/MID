#!/usr/bin/env python3
"""Offline adversarial read-only DWD directory tests; no network requests."""
import sys
from datetime import datetime, timezone
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).parent))
from dwd_availability_observer import (DET, EPS, FIELDS, assert_dwd_url,
                                       directory_grib_leads, discovered_runs, observe, valid_run)

RUN = '2026-10-31T12:00'
AT = datetime(2026, 10, 31, 13, tzinfo=timezone.utc)


def fixture_index(url):
    if url == DET + 'T_2M/r/':
        return ['../', RUN + '/', '2026-10-31T11:00/', '2026-02-30T12:00/', 'bogus/']
    if '/r/' + RUN + '/' in url:
        return ['../', 'nested/', 'icon_PT000H00M.grib2'] if url.endswith('/r/' + RUN + '/') else [
            'icon_PT001H00M.grib2', 'icon_PT002H00M.grib2', 'icon_PT003H00M.grib2',
            'icon_PT004H00M.grib2', 'icon_PT005H00M.grib2', 'icon_PT006H00M.grib2']
    return []


class AvailabilityObserverTest(unittest.TestCase):
    def test_valid_run_requires_real_utc_calendar(self):
        self.assertTrue(valid_run(RUN))
        for bad in ('2026-02-30T12:00', '2026-10-31T12:30', '../foo',
                    '2026-10-31T25:00', '2026-10-31T12:00/../'):
            self.assertFalse(valid_run(bad), bad)

    def test_source_origin_strict_and_no_traversal(self):
        assert_dwd_url(DET + 'T_2M/r/' + RUN + '/')
        for unsafe in ('http://opendata.dwd.de/weather/nwp/v1/m/',
                       'https://elsewhere.example/weather/nwp/v1/m/',
                       'https://opendata.dwd.de.evil.example/weather/nwp/v1/m/',
                       DET + '../secret/', 'https://opendata.dwd.de@evil.example/weather/nwp/v1/m/'):
            with self.assertRaises(ValueError):
                assert_dwd_url(unsafe)

    def test_newest_directories_exclude_invalid_entries(self):
        self.assertEqual(discovered_runs(fixture_index), [RUN, '2026-10-31T11:00'])

    def test_nested_grib_discovery_and_expected_hourly_leads(self):
        seen = directory_grib_leads(DET + 'T_2M/r/' + RUN + '/', fixture_index)
        self.assertEqual(seen, set(range(0, 361, 60)))

    def test_directory_success_is_never_header_or_eps_permission(self):
        data = observe(RUN, fixture_index, AT)
        self.assertTrue(data['stages']['0-6h']['directoryComplete'])
        self.assertFalse(data['stages']['0-14h']['directoryComplete'])
        self.assertFalse(data['stages']['0-27h']['directoryComplete'])
        self.assertFalse(data['stages']['0-6h']['publicationAuthorized'])
        self.assertFalse(data['stages']['0-6h']['gribHeaderVerified'])
        self.assertIsNone(data['eps']['memberCount'])
        self.assertIsNone(data['eps']['membersComplete'])
        self.assertFalse(data['productionEnabled'])
        self.assertEqual(data['observedAtUtc'], '2026-10-31T13:00:00Z')
        self.assertEqual(set(data['directories']), {'eps/TOT_PREC'} | {'deterministic/' + p for p in FIELDS})

    def test_fetch_failure_is_unknown_not_zero_or_incomplete(self):
        def damaged(url):
            if url.startswith(DET + 'CLCT/r/' + RUN + '/'):
                raise OSError('temporary provider failure')
            return fixture_index(url)
        data = observe(RUN, damaged, AT)
        self.assertIsNone(data['stages']['0-6h']['directoryComplete'])
        self.assertIn('CLCT', data['stages']['0-6h']['unknownFields'])
        self.assertIsNotNone(data['directories']['deterministic/CLCT']['error'])
        self.assertFalse(data['stages']['0-6h']['publicationAuthorized'])

    def test_invalid_grib_link_cannot_escape_provider(self):
        def hostile(url):
            return ['//attacker.example/steal.grib2']
        self.assertEqual(directory_grib_leads(DET + 'T_2M/r/' + RUN + '/', hostile), set())
        def traversal(url):
            return ['https://opendata.dwd.de/weather/nwp/v1/m/../secret/PT000H00M.grib2']
        with self.assertRaises(ValueError):
            directory_grib_leads(DET + 'T_2M/r/' + RUN + '/', traversal)

    def test_cannot_observe_future_run_or_naive_time(self):
        with self.assertRaises(ValueError):
            observe(RUN, fixture_index, datetime(2026, 10, 31, 11, tzinfo=timezone.utc))
        with self.assertRaises(ValueError):
            observe(RUN, fixture_index, datetime(2026, 10, 31, 13))


if __name__ == '__main__':
    unittest.main()
