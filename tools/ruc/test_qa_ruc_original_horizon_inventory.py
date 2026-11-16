"""Synthetic adversarial catalogue tests. NEVER evidence of actual DWD files."""
import unittest
from datetime import datetime, timezone
from qa_ruc_original_horizon_inventory import (
    PRODUCTS, HorizonInventoryError, canonical_run, discover_recent,
    expected_names, fetch_inventory, inspect_inventory, source_url,
)

class Response:
    status = 200
    def __init__(self, url, body):
        self.url, self.body = url, body
    def geturl(self):
        return self.url
    def read(self, size):
        return self.body[:size]
    def __enter__(self):
        return self
    def __exit__(self, *args):
        pass

class Opener:
    def __init__(self, contents, url_override=None):
        self.contents = contents
        self.url_override = url_override
    def open(self, req, timeout):
        return Response(self.url_override or req.full_url, self.contents)

def catalogue(names):
    return ('<html><a href="../">../</a>' + ''.join(
        f'<a href="{n}">{n}</a>' for n in sorted(names)) + '</html>').encode()

class HorizonTests(unittest.TestCase):
    def test_canonical_source_and_109_distinct_original_steps(self):
        run = '2026-11-16T06:00:00Z'
        self.assertEqual(canonical_run(run).hour, 6)
        self.assertEqual(len(expected_names()), 109)
        self.assertEqual(len(expected_names(14*60)), 57)
        self.assertIn('PT027H00M.grib2', expected_names())
        self.assertNotIn('PT027H15M.grib2', expected_names())
        for product in PRODUCTS:
            self.assertEqual(source_url(product, run),
                f'https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/{product}/r/2026-11-16T06%3A00/s/')
        for invalid in ('2026-11-16T06:15:00Z', '2026-11-16T06:00',
                        '2026-02-30T06:00:00Z'):
            with self.assertRaises(HorizonInventoryError):
                canonical_run(invalid)

    def test_complete_27_and_documented_14h_are_not_equivalent(self):
        full = inspect_inventory(expected_names())
        self.assertTrue(full['complete0To14h'])
        self.assertTrue(full['complete0To27h'])
        self.assertTrue(full['term14h15Present'])
        self.assertTrue(full['term27h00Present'])
        self.assertFalse(full['term27h15Present'])
        old = inspect_inventory(expected_names(14*60))
        self.assertTrue(old['complete0To14h'])
        self.assertFalse(old['complete0To27h'])
        self.assertFalse(old['term14h15Present'])
        missing = inspect_inventory(expected_names()-{'PT014H15M.grib2'})
        self.assertFalse(missing['complete0To27h'])
        self.assertEqual(missing['missingUntil27h'], ['PT014H15M.grib2'])
        with self.assertRaises(HorizonInventoryError):
            inspect_inventory({'PT00H00M.grib2'})

    def test_exact_source_redirect_empty_duplicate_and_untrusted_links(self):
        run = '2026-11-16T06:00:00Z'
        self.assertEqual(fetch_inventory('PRR_GSP', run,
                         opener=Opener(catalogue(expected_names()))), expected_names())
        with self.assertRaises(HorizonInventoryError):
            fetch_inventory('PRR_GSP', run, opener=Opener(catalogue(expected_names()),
                url_override='https://example.com/other'))
        for raw in (b'', b'<html><a href="https://other.test/PT027H00M.grib2">bad</a></html>',
                    b'<a href="PT000H00M.grib2">a</a><a href="PT000H00M.grib2">b</a>'):
            with self.assertRaises(HorizonInventoryError):
                fetch_inventory('PRR_GSP', run, opener=Opener(raw))
        with self.assertRaises(HorizonInventoryError):
            source_url('SYNMSG_BT_CL_WV6.2', run)

    def test_exact_three_runs_are_catalogue_only_and_fail_closed(self):
        now = datetime(2026, 11, 16, 9, 36, tzinfo=timezone.utc)
        full = expected_names()
        def complete(product, run):
            self.assertIn(product, PRODUCTS)
            return full
        report = discover_recent(5, getter=complete, now=now)
        self.assertTrue(report['catalogue27hQualified'])
        self.assertEqual([v['run'] for v in report['runs']],
            ['2026-11-16T07:00:00Z','2026-11-16T06:00:00Z','2026-11-16T05:00:00Z'])
        self.assertFalse(report['activationAuthorized'])
        self.assertFalse(report['releaseAuthorized'])
        self.assertFalse(report['runs'][0]['sourceBytesDecoded'])
        def one_gap(product, run):
            return full - {'PT027H00M.grib2'} if product=='PRS_GSP' else full
        blocked = discover_recent(5, getter=one_gap, now=now)
        self.assertFalse(blocked['catalogue27hQualified'])
        self.assertEqual(blocked['qualifiedRunCount'], 0)
        self.assertTrue(blocked['rejected'])
        with self.assertRaises(HorizonInventoryError):
            discover_recent(2, getter=complete, now=now)

if __name__ == '__main__':
    unittest.main()
