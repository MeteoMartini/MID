#!/usr/bin/env python3
"""Offline regressions: retries, atomic staging and early GRIB coverage."""
import bz2
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import Mock, patch
import requests
import fetch_and_build_ruc as fetch
from test_meteo_integrity import MeteoIntegrityTests  # also collected by the existing CI unittest.main()
from test_grib_bitmap import DwdNativeBitmapTests  # mandatory bitmap/nodata and negative fixtures
from test_grib_metadata import DwdGribMetadataTests  # full ecCodes real-header fixtures in CI


class FetchResilience(unittest.TestCase):
    def test_real_grib_headers_and_builder_with_bzip2(self):
        from eccodes import codes_grib_new_from_samples, codes_set, codes_get_message, codes_release
        from build_ruc_bundle import read_messages, read_first_values
        import numpy as np
        base = datetime(2026, 10, 5, 18, tzinfo=timezone.utc)
        payload = bytearray()
        for hour in range(3):
            gid = codes_grib_new_from_samples('regular_ll_sfc_grib2')
            try:
                codes_set(gid, 'centre', 78)
                codes_set(gid, 'dataDate', 20261005)
                codes_set(gid, 'dataTime', 1800)
                codes_set(gid, 'step', hour)
                payload.extend(codes_get_message(gid))
            finally:
                codes_release(gid)
        expected = [base + timedelta(hours=h) for h in range(3)]
        with tempfile.TemporaryDirectory() as directory:
            plain = Path(directory) / 'fixture.grib2'
            compressed = Path(directory) / 'fixture.grib2.bz2'
            plain.write_bytes(payload)
            compressed.write_bytes(bz2.compress(payload))
            for path in (plain, compressed):
                self.assertEqual(list(fetch.grib_valid_times(path)), expected)
                fetch.validate_hourly_coverage([path], '2026-10-05T18:00', 2, 'T_2M')
                self.assertEqual([row[0] for row in read_messages(path)], expected)
            np.testing.assert_array_equal(read_first_values(plain), read_first_values(compressed))
            plain_rows = list(read_messages(plain, ensemble=True))
            compressed_rows = list(read_messages(compressed, ensemble=True))
            for left, right in zip(plain_rows, compressed_rows):
                self.assertEqual(left[:2], right[:2])
                np.testing.assert_array_equal(left[2], right[2])
            compressed.write_bytes(bz2.compress(payload)[:-12])
            with self.assertRaises((EOFError, OSError)):
                list(fetch.grib_valid_times(compressed))

    def test_transient_errors_retry_then_succeed(self):
        operation = Mock(side_effect=[requests.Timeout(), requests.ConnectionError(), 'ok'])
        with patch.object(fetch.time, 'sleep') as sleep:
            self.assertEqual(fetch.retry_network(operation, 'test'), 'ok')
        self.assertEqual(operation.call_count, 3)
        self.assertEqual(sleep.call_count, 2)

    def test_retry_bound_and_permanent_errors(self):
        operation = Mock(side_effect=requests.Timeout())
        with patch.object(fetch.time, 'sleep'), self.assertRaises(requests.Timeout):
            fetch.retry_network(operation, 'test')
        self.assertEqual(operation.call_count, 4)
        for error in (requests.exceptions.SSLError(), ValueError('invalid data')):
            operation = Mock(side_effect=error)
            with self.assertRaises(type(error)):
                fetch.retry_network(operation, 'test')
            self.assertEqual(operation.call_count, 1)
        for status, calls in ((404, 1), (403, 1), (429, 4), (503, 4)):
            response = requests.Response()
            response.status_code = status
            operation = Mock(side_effect=requests.HTTPError(response=response))
            with patch.object(fetch.time, 'sleep'), self.assertRaises(requests.HTTPError):
                fetch.retry_network(operation, 'test')
            self.assertEqual(operation.call_count, calls)

    def test_directory_retry(self):
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.text = '<a href="2026-10-05T18:00/">run</a>'
        session = Mock()
        session.get.side_effect = [requests.Timeout(), response]
        with patch.object(fetch.time, 'sleep'):
            self.assertEqual(fetch.index(session, 'https://example.invalid/'), ['2026-10-05T18:00/'])

    def test_stream_retry_atomic_and_completed_file_reused(self):
        def response(chunks):
            r = Mock()
            r.__enter__ = Mock(return_value=r)
            r.__exit__ = Mock(return_value=False)
            r.iter_content.return_value = chunks
            return r
        def broken():
            yield b'x' * 90
            raise requests.exceptions.ChunkedEncodingError('truncated')
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'data.grib2'
            with patch.object(fetch.requests, 'get', side_effect=[response(broken()), response([b'y' * 120])]) as get, patch.object(fetch.time, 'sleep'):
                fetch.download_one('https://example.invalid/data', target)
                self.assertEqual(target.read_bytes(), b'y' * 120)
                self.assertFalse(target.with_suffix('.grib2.part').exists())
                fetch.download_one('https://example.invalid/data', target)
                self.assertEqual(get.call_count, 2)

    def test_failed_stream_never_leaves_completed_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'data.grib2'
            with patch.object(fetch.requests, 'get', side_effect=requests.Timeout()), patch.object(fetch.time, 'sleep'), self.assertRaises(requests.Timeout):
                fetch.download_one('https://example.invalid/data', target)
            self.assertFalse(target.exists())
            self.assertFalse(target.with_suffix('.grib2.part').exists())

    def test_coverage_uses_actual_validity_not_filenames(self):
        base = datetime(2026, 10, 5, 18, tzinfo=timezone.utc)
        valid = [base + timedelta(hours=i) for i in range(3)]
        with patch.object(fetch, 'grib_valid_times', return_value=valid):
            fetch.validate_hourly_coverage([Path('fake')], '2026-10-05T18:00', 2, 'T_2M')
        with patch.object(fetch, 'grib_valid_times', return_value=[base]), self.assertRaisesRegex(RuntimeError, 'data-incomplete.*T_2M'):
            fetch.validate_hourly_coverage([Path('fake')], '2026-10-05T18:00', 2, 'T_2M')

    def test_duplicate_core_validity_rejected(self):
        base = datetime(2026, 10, 5, 18, tzinfo=timezone.utc)
        valid = [base, base, base + timedelta(hours=1)]
        with patch.object(fetch, 'grib_valid_times', return_value=valid), self.assertRaisesRegex(RuntimeError, 'duplicate'):
            fetch.validate_hourly_coverage([Path('fixture')], '2026-10-05T18:00', 1, 'T_2M')

    def test_foreign_run_header_rejected_before_full_decode(self):
        from eccodes import codes_grib_new_from_samples, codes_set, codes_get_message, codes_release
        gid = codes_grib_new_from_samples('regular_ll_sfc_grib2')
        try:
            codes_set(gid, 'centre', 78)
            codes_set(gid, 'dataDate', 20261005)
            codes_set(gid, 'dataTime', 1200)
            data = codes_get_message(gid)
        finally:
            codes_release(gid)
        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory) / 'foreign-run.grib2'
            fixture.write_bytes(data)
            with self.assertRaisesRegex(ValueError, 'initialization'):
                fetch.validate_hourly_coverage([fixture], '2026-10-05T18:00', 0, 'T_2M')

    def test_incomplete_core_aborts_before_optional_or_eps(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with patch.object(fetch, 'stage_tree', return_value=['fake.grib2']) as stage, patch.object(fetch, 'validate_hourly_coverage', side_effect=RuntimeError('data-incomplete')), self.assertRaises(RuntimeError):
                fetch.build_candidate(Mock(), '2026-10-05T18:00', root/'stage', root/'output', 14)
            self.assertEqual(stage.call_count, 1)
            self.assertFalse((root/'output').exists())


if __name__ == '__main__':
    unittest.main()
