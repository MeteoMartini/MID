"""Small, reproducible semantic fixtures for the unpublished RUC map pilot."""
from __future__ import annotations
import gzip
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import numpy as np
from build_native_map_pilot import build, digest


class NativeRucMapPilotTest(unittest.TestCase):
    def source(self, root, *, corrupt=False, runs=3, grid_indices=None):
        source = root / 'original'; source.mkdir()
        timestamps = [f'2026-10-20T{hour:02d}:00' for hour in range(runs)]
        fields = [
            {'name': 'temperature_2m', 'unit': '°C', 'scale': 0.01, 'offset': 0.0},
            {'name': 'pressure_msl', 'unit': 'hPa', 'scale': 0.1, 'offset': 0.0}
        ]
        # Four native (unstructured) points, with a real missing temperature.
        core = np.array([
            [[100, 10100], [200, 10110], [300, 10120]],
            [[-32768, 9900], [-32768, 9910], [-32768, 9920]],
            [[-1234, 9700], [-1200, 9710], [-1188, 9720]],
            [[1200, 10500], [1280, 10510], [1300, 10520]]
        ], dtype='<i2')[:, :runs, :]
        (source / 'deterministic.bin').write_bytes(core.tobytes())
        idx = np.array(grid_indices if grid_indices is not None else
                       [[0, 1, 0], [2, 3, 0], [0xffffffff, 0, 3]], dtype='<u4')
        (source / 'lookup.bin').write_bytes(idx.tobytes())
        meta = {'schema': 'mid.dwd.ruc.grid.v2', 'run': '2026-10-20T00:00',
                'pointCount': 4, 'deterministic': {
                    'times': timestamps, 'fields': fields, 'recordBytes': runs * 2 * 2
                }, 'lookup': {'dtype': 'uint32-le', 'nodata': 0xffffffff},
                'grid': {'lonMin': 5.5, 'latMin': 47.0, 'dx': 0.025, 'dy': 0.025,
                         'nx': 3, 'ny': 3, 'maxNearestKm': 5.0}}
        if corrupt: meta['deterministic']['recordBytes'] += 2
        meta['objects'] = {name: {'bytes': (source/name).stat().st_size,
                                  'sha256': digest((source/name).read_bytes())}
                           for name in ('deterministic.bin', 'lookup.bin')}
        (source / 'latest.json').write_text(json.dumps(meta))
        return source

    def test_missing_roundtrip_and_provenance(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); source = self.source(root)
            initial = (source / 'latest.json').read_bytes()
            out = root / 'pilot'
            idx = build(source, out, bbox=(5.5, 47.0, 5.55, 47.05))
            self.assertEqual(idx['status'], 'unpublished_readonly_pilot')
            self.assertFalse(idx['productionApproved'])
            self.assertEqual(idx['nativePointLookup']['maskedOutsideCoverage'], 1)
            self.assertEqual(idx['provenance']['sourceManifestSha256'], digest(initial))
            self.assertEqual(len(idx['products']['temperature']['frames']), 3)
            frame = idx['products']['temperature']['frames'][0]
            wire = (out / frame['file']).read_bytes()
            self.assertEqual(digest(wire), frame['sha256'])
            raw = gzip.decompress(wire)
            self.assertEqual(digest(raw), frame['decodedSha256'])
            payload = json.loads(raw)
            self.assertEqual(payload['validTime'], '2026-10-20T00:00:00+00:00')
            self.assertIn(None, payload['values'])
            self.assertEqual(frame['sampledMissingCount'], 2)
            self.assertEqual(frame['packedCoreExtrema'], [-12.34, 12.0])
            self.assertEqual((source / 'latest.json').read_bytes(), initial)
            with self.assertRaises(ValueError): build(source, out)

    def test_true_zero_not_missing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); source = self.source(root)
            data = np.fromfile(source / 'deterministic.bin', dtype='<i2')
            data[0] = 0
            data.tofile(source / 'deterministic.bin')
            meta = json.loads((source/'latest.json').read_text())
            meta['objects']['deterministic.bin']['sha256'] = digest((source/'deterministic.bin').read_bytes())
            (source/'latest.json').write_text(json.dumps(meta))
            out = root / 'pilot'
            frames = build(source, out, bbox=(5.5,47.0,5.55,47.05))['products']['temperature']['frames']
            payload = json.loads(gzip.decompress((out / frames[0]['file']).read_bytes()))
            self.assertIn(0, payload['values'])
            self.assertIn(None, payload['values'])

    def test_bad_model_schema_missing_and_lookup_fail_closed(self):
        for scenario in ('geometry', 'missing-everywhere', 'bad-index', 'missing-times', 'bad-unit', 'corrupt-sha'):
            with self.subTest(scenario=scenario), tempfile.TemporaryDirectory() as temp:
                root = Path(temp); source = self.source(root)
                meta = json.loads((source / 'latest.json').read_text())
                if scenario == 'geometry': meta['deterministic']['recordBytes'] += 1
                if scenario == 'missing-times': meta['deterministic']['times'][2] = '2026-10-20T04:00'
                if scenario == 'bad-unit': meta['deterministic']['fields'][0]['unit'] = 'K'
                if scenario == 'bad-index': (source / 'lookup.bin').write_bytes(np.full((3, 3), 8, dtype='<u4').tobytes())
                if scenario == 'missing-everywhere': (source / 'deterministic.bin').write_bytes(np.full((4,3,2),-32768,dtype='<i2').tobytes())
                for name in ('deterministic.bin', 'lookup.bin'):
                    meta['objects'][name] = {'bytes': (source/name).stat().st_size,
                                             'sha256': digest((source/name).read_bytes())}
                if scenario=='corrupt-sha': meta['objects']['deterministic.bin']['sha256']='0'*64
                (source / 'latest.json').write_text(json.dumps(meta))
                with self.assertRaises(ValueError): build(source, root / 'pilot', bbox=(5.5,47.0,5.55,47.05))
                self.assertFalse((root / 'pilot').exists())

if __name__ == '__main__': unittest.main()
