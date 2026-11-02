#!/usr/bin/env python3
"""Fail-closed standalone +0..6h overlay with immutable 27h/20EPS invariants."""
from __future__ import annotations
from datetime import datetime,timedelta,timezone
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from ruc_fast_pages_overlay import assemble_overlay


def prepared(base, *, full_run='2026-11-02T04:00',fast_run='2026-11-02T05:00'):
    site=base/'existing';fast=base/'fast';dest=base/'merged'
    (site/'ruc').mkdir(parents=True);(fast/'ruc'/'fast'/'runs').mkdir(parents=True)
    manifest={
        'schema':'mid.dwd.ruc.grid.v2','storageProfile':'pages-lossless-v1',
        'run':full_run,'pointCount':542040,
        'deterministic':{'times':['t']*28},
        'eps':{'memberCount':20,'times':['t']*28}
    }
    (site/'ruc'/'latest.json').write_text(json.dumps(manifest))
    (site/'index.html').write_text('MID app remains intact')
    (fast/'ruc'/'fast'/'latest.json').write_text('{"original":true,"productionEnabled":false}')
    return site,fast,dest,fast_run


def shadow(run):
    return {'originalNativeObjectsVerified':True,'run':run,
            'productionEnabled':False,'realtimeConsumerEnabled':False}


class FastOverlay(unittest.TestCase):
    def test_combined_local_site_preserves_full_27h_and_newer_fast(self):
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            original=(site/'ruc'/'latest.json').read_bytes()
            with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(run)) as inspect:
                proof=assemble_overlay(site,fast,dest)
            self.assertEqual(inspect.call_count,2)
            self.assertTrue(proof['full27hOriginalBytesIntact'])
            self.assertTrue(proof['fastNativeObjectHashesRechecked'])
            self.assertFalse(proof['productionEnabled'])
            self.assertFalse(proof['publicationAuthorized'])
            self.assertFalse(proof['consumerAdoptionVerified'])
            self.assertEqual((dest/'ruc'/'latest.json').read_bytes(),original)
            self.assertEqual((dest/'index.html').read_text(),'MID app remains intact')
            self.assertTrue((dest/'ruc'/'fast'/'latest.json').is_file())

    def test_older_fast_run_or_six_hour_drift_cannot_overlay(self):
        for source in ('2026-11-02T03:00','2026-11-02T11:00'):
            with self.subTest(source=source),tempfile.TemporaryDirectory() as d:
                site,fast,dest,_=prepared(Path(d),fast_run=source)
                with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(source)):
                    with self.assertRaisesRegex(ValueError,'stale or unrelated'):
                        assemble_overlay(site,fast,dest)
                self.assertFalse(dest.exists())

    def test_no_partial_eps_or_27h_forecast_can_be_silently_replaced(self):
        for name,value in (('pointCount',540000),('storageProfile','raw'),
                           ('eps',{'memberCount':19,'times':['t']*28}),
                           ('deterministic',{'times':['t']*27})):
            with self.subTest(name=name),tempfile.TemporaryDirectory() as d:
                site,fast,dest,run=prepared(Path(d))
                path=site/'ruc'/'latest.json'
                meta=json.loads(path.read_text());meta[name]=value;path.write_text(json.dumps(meta))
                with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(run)):
                    with self.assertRaises(ValueError):assemble_overlay(site,fast,dest)
                self.assertFalse(dest.exists())

    def test_existing_shadow_and_missing_site_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            (site/'ruc'/'fast').mkdir()
            with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(run)):
                with self.assertRaisesRegex(ValueError,'must not be replaced'):
                    assemble_overlay(site,fast,dest)
            self.assertFalse(dest.exists())
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            (site/'ruc'/'latest.json').unlink()
            with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(run)):
                with self.assertRaisesRegex(ValueError,'full 27h'):
                    assemble_overlay(site,fast,dest)

    def test_previously_existing_output_or_input_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            dest.mkdir()
            with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(run)):
                with self.assertRaisesRegex(ValueError,'unused'):
                    assemble_overlay(site,fast,dest)
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            (site/'shortcut').symlink_to('index.html')
            with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(run)):
                with self.assertRaises(ValueError):assemble_overlay(site,fast,dest)
            self.assertFalse(dest.exists())

    def test_cross_site_budget_must_be_immutable_and_strict(self):
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=shadow(run)), \
                 patch('ruc_fast_pages_overlay.strict_budget',side_effect=ValueError('site budget')):
                with self.assertRaisesRegex(ValueError,'site budget'):
                    assemble_overlay(site,fast,dest)
            self.assertFalse(dest.exists())

    def test_absent_original_fast_signature_never_eligible(self):
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            invalid=shadow(run)
            invalid['originalNativeObjectsVerified']=False
            with patch('ruc_fast_pages_overlay.inspect_shadow',return_value=invalid):
                with self.assertRaisesRegex(ValueError,'not verified'):
                    assemble_overlay(site,fast,dest)
            self.assertFalse(dest.exists())

    def test_never_enable_even_if_corrupted_shadow_claims_publication(self):
        with tempfile.TemporaryDirectory() as d:
            site,fast,dest,run=prepared(Path(d))
            initial=shadow(run)
            final={**initial,'productionEnabled':True}
            with patch('ruc_fast_pages_overlay.inspect_shadow',side_effect=[initial,final]):
                with self.assertRaisesRegex(ValueError,'unexpectedly enabled'):
                    assemble_overlay(site,fast,dest)
            self.assertFalse(dest.exists())


if __name__ == '__main__':
    unittest.main()
