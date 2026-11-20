#!/usr/bin/env python3
"""Publication-candidate tests for Fast Lane without a current EPS base."""

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from ruc_fast_independent_pages import FAST, MANIFEST, stage_independent_fast_pages
from ruc_fast_pages_preserve import preserve_fast_pages
from ruc_fast_pages_chunker import SIZES


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
        self.partition_modes = []
        inspect = patch('ruc_fast_independent_pages.inspect_shadow', return_value={'run': self.run})
        stage = patch('ruc_fast_independent_pages.partition_native_fast', side_effect=self.stage_chunks)
        for mock in (inspect, stage):
            mock.start()
            self.addCleanup(mock.stop)

    def stage_chunks(self, source, destination, *, compress=False):
        self.partition_modes.append(compress)
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

    def test_compressed_staging_uses_actual_production_partition_mode(self):
        proof = stage_independent_fast_pages(self.site, self.shadow, self.output,
                                             now=self.now, compress=True)
        self.assertEqual(self.partition_modes, [True])
        self.assertEqual(proof['run'], self.run)
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

    def test_fast_preservation_rejects_activated_shadow_manifest(self):
        folder = self.site / FAST
        folder.mkdir(parents=True)
        manifest = {
            'run': self.run, 'schema': 'mid.ruc.fast-paged-shadow.v1',
            'epsAvailable': False, 'nativePoints': 542040, 'chunkCells': 512,
            'productionEnabled': True, 'publicationAuthorized': False,
            'realtimeConsumerEnabled': False,
        }
        pointer = folder / MANIFEST
        pointer.write_text(json.dumps(manifest), encoding='utf-8')
        sha = hashlib.sha256(pointer.read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError, 'unexpected native Fast Pages manifest'):
            preserve_fast_pages(self.site, self.shadow, sha, now=self.now)

    def test_archive_envelope_allows_metadata_overhead_beyond_physical_site_budget(self):
        from install_fast_pages import ARCHIVE_ENVELOPE_MAX_BYTES, valid_archive_envelope
        self.assertEqual(valid_archive_envelope(900_000_001), 900_000_001)
        self.assertEqual(valid_archive_envelope(ARCHIVE_ENVELOPE_MAX_BYTES - 1),
                         ARCHIVE_ENVELOPE_MAX_BYTES - 1)
        for invalid in (0, -1, None, True, '900000000', ARCHIVE_ENVELOPE_MAX_BYTES):
            with self.assertRaisesRegex(ValueError, 'transport archive envelope'):
                valid_archive_envelope(invalid)

    def test_installer_verify_rejects_post_retention_chunk_corruption(self):
        from install_fast_pages import verify
        clock_run = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        folder = self.site / FAST
        folder.mkdir(parents=True)
        pointer = folder / MANIFEST
        pointer.write_text(json.dumps({'run': clock_run.strftime('%Y-%m-%dT%H:%M')}), encoding='utf-8')
        sha = hashlib.sha256(pointer.read_bytes()).hexdigest()
        baseline = {'run_id': 12, 'stable_sha': 'a' * 40}
        proof = self.root / 'install-proof.json'
        proof.write_text(json.dumps({
            'baseline': baseline,
            'retention': {'carried': True, 'run': clock_run.strftime('%Y-%m-%dT%H:%M'),
                          'fastManifestSha256': sha},
        }), encoding='utf-8')
        with patch('install_fast_pages.active_pages', return_value=baseline), patch(
            'install_fast_pages.preserve_fast_pages',
            side_effect=ValueError('Fast Pages object failed readback: corrupted chunk'),
        ) as validation:
            with self.assertRaisesRegex(ValueError, 'corrupted chunk'):
                verify('a' * 40, self.site, proof)
            self.assertEqual(validation.call_count, 1)

    def test_fast_preservation_rejects_wrong_native_object_metadata(self):
        folder = self.site / FAST
        folder.mkdir(parents=True)
        objects = {}
        for name, width in SIZES.items():
            cells = 964 * 596 if name == 'lookup.bin' else 542040
            objects[name] = {'bytesPerCell': width, 'cellCount': cells, 'parts': []}
        objects['deterministic.bin']['bytesPerCell'] = 1
        manifest = {
            'run': self.run, 'schema': 'mid.ruc.fast-paged-shadow.v1',
            'epsAvailable': False, 'nativePoints': 542040, 'chunkCells': 512,
            'productionEnabled': False, 'publicationAuthorized': False,
            'realtimeConsumerEnabled': False, 'objects': objects,
        }
        pointer = folder / MANIFEST
        pointer.write_text(json.dumps(manifest), encoding='utf-8')
        sha = hashlib.sha256(pointer.read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError, 'native object metadata'):
            preserve_fast_pages(self.site, self.shadow, sha, now=self.now)

    def test_preservation_rejects_nested_output_and_codec_null(self):
        folder = self.site / FAST
        folder.mkdir(parents=True)
        pointer = folder / MANIFEST
        pointer.write_text(self.manifest(self.run), encoding='utf-8')
        sha = hashlib.sha256(pointer.read_bytes()).hexdigest()
        for output in (self.site / 'child', self.site.parent):
            output.mkdir(exist_ok=True)
            with self.assertRaisesRegex(ValueError, 'non-nested'):
                preserve_fast_pages(self.site, output, sha, now=self.now)
        pointer.write_text(json.dumps({
            'schema': 'mid.ruc.fast-paged-shadow.v1', 'run': self.run,
            'epsAvailable': False, 'nativePoints': 542040, 'chunkCells': 512,
            'productionEnabled': False, 'publicationAuthorized': False,
            'realtimeConsumerEnabled': False, 'storageCodec': None,
        }), encoding='utf-8')
        sha = hashlib.sha256(pointer.read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError, 'storage codec'):
            preserve_fast_pages(self.site, self.shadow, sha, now=self.now)

    def test_native_provenance_and_axes_must_match_public_point_reader(self):
        from ruc_fast_pages_preserve import validate_native_reader_contract, NATIVE_FIELDS
        from datetime import timedelta
        clock = datetime.strptime(self.run, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        entry = {
            'sourceSchema': 'mid.ruc.fast-shadow-pointer.v1',
            'sourceManifestSha256': 'a' * 64, 'sourceGribSha256': 'b' * 64,
            'sourceNativeBytes': 253804736,
            'grid': {'nx': 964, 'ny': 596, 'nativePointCount': 542040},
            'fields': [dict(zip(('name','unit','scale','offset'), row)) for row in NATIVE_FIELDS],
            'timeAxes': {name: [(clock+timedelta(minutes=step*i)).strftime('%Y-%m-%dT%H:%M')
                         for i in range(count)]
                         for name,step,count in (('hourly',60,7),('rapid5',5,73),('rapid15',15,25))},
        }
        validate_native_reader_contract(entry, clock)
        for field, change in [('sourceNativeBytes', 0),('sourceGribSha256', 'bad'),
                              ('grid', {'nx': 965, 'ny':596, 'nativePointCount':542040}),
                              ('timeAxes', {}), ('fields', [])]:
            modified = dict(entry, **{field: change})
            with self.assertRaisesRegex(ValueError, 'native Fast'):
                validate_native_reader_contract(modified, clock)

    def test_output_under_either_input_is_rejected(self):
        for parent in (self.site, self.shadow):
            self.output = parent / 'child'
            with self.assertRaisesRegex(ValueError, 'outside both inputs'):
                self.stage()


if __name__ == '__main__':
    unittest.main()
