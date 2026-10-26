import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from datetime import datetime, timedelta
import numpy as np
from compare_core_prefix import compare


class PrefixTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.roots = [Path(self.temp.name) / name for name in ('short', 'long')]
        for root, count in zip(self.roots, (15, 28)):
            root.mkdir()
            times = [(datetime(2026, 10, 21) + timedelta(hours=i)).isoformat(timespec='minutes') for i in range(count)]
            meta = {'schema': 'mid.dwd.ruc.grid.v2', 'run': times[0], 'pointCount': 3, 'times': times, 'grid': {'name': 'fixture'}, 'lookup': {'key': 'lookup.bin'}, 'objects': {}}
            for section, name in (('deterministic', 'deterministic.bin'), ('epsSummary', 'eps-summary.bin'), ('eps', 'eps-members.bin')):
                width = 20 if section == 'eps' else 2
                values = np.arange(3 * 28 * width, dtype='<u2').reshape(3, 28, width)
                values[:, 1, 0] = 65535 if section == 'eps' else 32768  # Missing sentinel, distinct from dry zero.
                values[:, 2, 0] = 32767  # Unsmoothed extreme.
                (root / name).write_bytes(values[:, :count].tobytes())
                meta[section] = {'key': name, 'times': times, 'recordBytes': count * width * 2, 'dtype': 'uint16-le' if section == 'eps' else 'int16-le', 'layout': 'point-time-member' if section == 'eps' else 'point-time-field', **({'memberCount': width, 'scale': .01, 'nodata': 65535} if section == 'eps' else {'fields': [{'name': 'a'}, {'name': 'b'}]})}
            (root / 'lookup.bin').write_bytes(b'lookup')
            for name in ('lookup.bin', 'deterministic.bin', 'eps-summary.bin', 'eps-members.bin'):
                data = (root / name).read_bytes()
                meta['objects'][name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
            (root / 'latest.json').write_text(json.dumps(meta))

    def mutate_meta(self, change):
        path = self.roots[1] / 'latest.json'
        data = json.loads(path.read_text())
        change(data)
        path.write_text(json.dumps(data))

    def test_full_prefix_preserves_missing_zero_extreme_and_members(self):
        self.assertEqual(len(compare(*self.roots)['sections']), 3)

    def test_different_run_rejected(self):
        self.mutate_meta(lambda x: x.update(run='2026-10-21T01:00'))
        with self.assertRaisesRegex(ValueError, 'source contract'):
            compare(*self.roots)

    def test_shifted_tail_rejected(self):
        self.mutate_meta(lambda x: x['eps']['times'].__setitem__(27, '2026-10-22T04:00'))
        with self.assertRaisesRegex(ValueError, 'axis'):
            compare(*self.roots)

    def test_root_axis_drift_rejected(self):
        self.mutate_meta(lambda x: x.update(times=x['times'][1:]))
        with self.assertRaisesRegex(ValueError, 'root time axis'):
            compare(*self.roots)

    def test_encoding_drift_rejected(self):
        self.mutate_meta(lambda x: x['eps'].update(scale=.1))
        with self.assertRaisesRegex(ValueError, 'encoding'):
            compare(*self.roots)

    def test_changed_member_with_valid_hash_rejected(self):
        path = self.roots[1] / 'eps-members.bin'
        data = bytearray(path.read_bytes()); data[40] ^= 1; path.write_bytes(data)
        self.mutate_meta(lambda x: x['objects']['eps-members.bin'].update(sha256=hashlib.sha256(data).hexdigest()))
        with self.assertRaisesRegex(ValueError, 'prefix bytes'):
            compare(*self.roots)

    def test_matching_but_unsupported_layout_is_not_a_valid_prefix_proof(self):
        for root in self.roots:
            p=root/'latest.json'; m=json.loads(p.read_text());m['deterministic']['layout']='time-point-field';p.write_text(json.dumps(m))
        with self.assertRaisesRegex(ValueError, 'unsupported record encoding'):
            compare(*self.roots)

    def test_external_symlink_with_identical_bytes_rejected(self):
        path = self.roots[1] / 'deterministic.bin'
        outside = self.roots[1].parent / 'outside.bin'
        outside.write_bytes(path.read_bytes()); path.unlink(); path.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, 'object path'):
            compare(*self.roots)

    def test_corrupt_object_rejected(self):
        (self.roots[1] / 'deterministic.bin').write_bytes(b'bad')
        with self.assertRaisesRegex(ValueError, 'integrity'):
            compare(*self.roots)


if __name__ == '__main__':
    unittest.main()
