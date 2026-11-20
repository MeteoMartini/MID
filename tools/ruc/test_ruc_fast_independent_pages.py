#!/usr/bin/env python3
"""Publication-candidate tests for Fast Lane without a current EPS base."""

from datetime import datetime, timezone
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from ruc_fast_independent_pages import FAST, MANIFEST, stage_independent_fast_pages


class IndependentFastPages(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.site = self.root / 'site'
        self.site.mkdir()
        (self.site / 'ruc').mkdir()
        (self.site / 'ruc/latest.json').write_bytes(b'{"run":"2026-11-17T07:00"}')
        self.shadow = self.root / 'shadow'
        self.shadow.mkdir()
        self.output = self.root / 'output'
        self.now = datetime(2026, 11, 19, 5, 30, tzinfo=timezone.utc)
        self.run = '2026-11-19T04:00'
        inspect = patch('ruc_fast_independent_pages.inspect_shadow', return_value={'run': self.run})
        stage = patch('ruc_fast_independent_pages.partition_native_fast', side_effect=self.stage_chunks)
        for mock in (inspect, stage):
            mock.start()
            self.addCleanup(mock.stop)

    def stage_chunks(self, source, destination):
        fast = destination / FAST
        fast.mkdir(parents=True)
        (fast / MANIFEST).write_text(self.manifest(self.run), encoding='utf-8')
        return {'run': self.run}

    def manifest(self, run):
        return json.dumps({'run': run, 'schema': 'mid.ruc.fast-paged-shadow.v1',
                           'publicationAuthorized': False})

    def stage(self):
        return stage_independent_fast_pages(self.site, self.shadow, self.output, now=self.now)

    def test_stale_primary_and_app_bytes_remain_intact(self):
        (self.site / 'index.html').write_bytes(b'MID')
        result = self.stage()
        self.assertEqual(result['run'], self.run)
        self.assertFalse(result['publicationAuthorized'])
        self.assertEqual((self.output / 'ruc/latest.json').read_bytes(),
                         (self.site / 'ruc/latest.json').read_bytes())
        self.assertEqual((self.output / 'index.html').read_bytes(), b'MID')
        self.assertTrue((self.output / FAST / MANIFEST).is_file())

    def test_missing_original_primary_cannot_mint_a_publishable_receipt(self):
        (self.site / 'ruc/latest.json').unlink()
        with self.assertRaisesRegex(ValueError, 'primary RUC pointer'):
            self.stage()
        self.assertFalse(self.output.exists())

    def test_freshness_rejects_future_and_stale_without_output(self):
        for hour in (3, 9):
            self.now = self.now.replace(hour=hour)
            with self.assertRaisesRegex(ValueError, 'stale or future'):
                self.stage()
            self.assertFalse(self.output.exists())

    def test_rotation_keeps_previous_deployable_tree(self):
        old_fast = self.site / FAST
        old_fast.mkdir(parents=True)
        (old_fast / MANIFEST).write_text(self.manifest('2026-11-19T03:00'), encoding='utf-8')
        (old_fast / 'old.bin').write_bytes(b'old')
        self.stage()
        self.assertFalse((self.output / FAST / 'old.bin').exists())
        self.assertTrue((old_fast / 'old.bin').is_file())

    def test_replay_and_unknown_namespace_are_rejected(self):
        old_fast = self.site / FAST
        old_fast.mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, 'existing Fast namespace'):
            self.stage()
        (old_fast / MANIFEST).write_text(self.manifest(self.run), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'advance'):
            self.stage()
        self.assertFalse(self.output.exists())

    def test_output_under_either_input_is_rejected(self):
        for parent in (self.site, self.shadow):
            self.output = parent / 'child'
            with self.assertRaisesRegex(ValueError, 'outside both inputs'):
                self.stage()


if __name__ == '__main__':
    unittest.main()
