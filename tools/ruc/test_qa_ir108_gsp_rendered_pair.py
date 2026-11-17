"""Deterministic negative/positive offline tests; synthetic pixels are NOT DWD data."""
from __future__ import annotations
import copy
from datetime import datetime, timedelta, timezone
import hashlib
import json
import struct
import tempfile
import unittest
from pathlib import Path
import zlib
from qa_ir108_gsp_rendered_pair import integrity, PairIntegrityError, PHASE

RUN = '2026-11-16T08:00:00Z'


def make_png(rgba: bytes, *, bad_crc=False, malformed_filter=False) -> bytes:
    def chunk(t: bytes, data: bytes) -> bytes:
        crc = (zlib.crc32(t + data) & 0xffffffff) ^ (1 if bad_crc and t == b'IDAT' else 0)
        return struct.pack('>I', len(data)) + t + data + struct.pack('>I', crc)
    scan = bytes([1 if malformed_filter else 0]) + rgba[:8] + b'\x00' + rgba[8:]
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 2, 2, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(scan)) + chunk(b'IEND', b'')


def fixture(root: Path) -> dict:
    # 2 x 2 north-up, two genuine values, two explicit NoData cells.
    rgba = bytes([40,40,40,255,0,0,0,0,200,200,200,255,0,0,0,0])
    phase = bytes([PHASE['rain_gsp'], 255, PHASE['no_gsp_signal'], 255])
    counts = {key: phase.count(val) for key, val in PHASE.items()}
    records = []
    for i in range(10):
        ir, gsp = make_png(rgba), zlib.compress(phase)
        name_ir, name_gsp = f'ir108-{i:02d}.png', f'gsp-phase-{i:02d}.bin'
        (root / name_ir).write_bytes(ir)
        (root / name_gsp).write_bytes(gsp)
        stamp = (datetime(2026, 11, 16, 8, tzinfo=timezone.utc) + timedelta(minutes=15*i)).strftime('%Y-%m-%dT%H:%M:%SZ')
        records.append({'validTime': stamp,
                        'IR': {'file': name_ir, 'sha256': hashlib.sha256(ir).hexdigest(),
                               'bytes': len(ir), 'encoding': 'png-rgba8-north-up'},
                        'GSP': {'file': name_gsp, 'sha256': hashlib.sha256(gsp).hexdigest(),
                                'bytes': len(gsp), 'encoding': 'zlib-uint8-phase-id-north-up'},
                        'phaseCounts': counts.copy(), 'validIrPixels': 2, 'missingIrPixels': 2})
    meta = {'schema': 'mid.ir108-gsp.original-native-preview.shadow.v1',
            'run': RUN, 'model': 'DWD ICON-D2-RUC', 'isObservation': False,
            'isOfficialWmoWeatherCode': False, 'activationAuthorized': False,
            'productionApproved': False, 'nativeCellCount': 542040,
            'sourceLookupSha256': 'a'*64, 'sourceRucManifestSha256': 'b'*64,
            'originalManifestsSha256': {'ir': 'c'*64, 'gsp': 'd'*64},
            'bounds': [5.0, 47.0, 15.0, 55.0], 'size': [2, 2],
            'sampling': 'nearest-native-cell', 'times': records,
            'phaseLegend': PHASE, 'phaseNoDataId': 255,
            'phaseNoGspSignalId': 0, 'fixedIrBrightnessTemperatureKelvin': [170., 340.]}
    write_meta(root, meta)
    return meta


def write_meta(root: Path, meta: dict) -> None:
    (root / 'index.json').write_text(json.dumps(meta, allow_nan=False), encoding='utf-8')


class PairIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.meta = fixture(self.root)

    def assert_bad(self):
        with self.assertRaises(PairIntegrityError):
            integrity(self.root)

    def test_valid_ten_pairs_and_no_publish(self):
        result = integrity(self.root)
        self.assertEqual(result['assetPairs'], 10)
        self.assertEqual(result['frames'], 10)
        self.assertTrue(result['allPixelMasksChecked'])
        self.assertFalse(result['activationAuthorized'])
        self.assertFalse(result['releaseAuthorized'])

    def test_missing_asset_rejected(self):
        (self.root / 'gsp-phase-04.bin').unlink()
        self.assert_bad()

    def test_uncontracted_or_stale_asset_rejected(self):
        (self.root / 'extra-old-run.png').write_bytes(b'foreign')
        self.assert_bad()

    def test_wrong_asset_hash_rejected(self):
        (self.root / 'ir108-04.png').write_bytes(b'corrupted')
        self.assert_bad()

    def test_cross_frame_or_horizon_mismatch_rejected(self):
        self.meta['times'][5]['validTime'] = self.meta['times'][6]['validTime']
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_wrong_model_run_rejected(self):
        self.meta['run'] = '2026-11-16T06:00:00Z'
        self.meta['times'][0]['validTime'] = '2026-11-17T01:00:00Z'
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_missing_zero_signal_id_rejected(self):
        self.meta['phaseNoGspSignalId'] = 255
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_pretend_observation_or_release_rejected(self):
        for flag in ('isObservation','isOfficialWmoWeatherCode','activationAuthorized','productionApproved'):
            m = copy.deepcopy(self.meta)
            m[flag] = True
            write_meta(self.root, m)
            self.assert_bad()
        write_meta(self.root, self.meta)

    def test_forged_phase_inventory_rejected(self):
        self.meta['times'][0]['phaseCounts']['no_gsp_signal'] += 1
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_missing_pixel_must_not_be_zero_signal(self):
        raw = bytes([PHASE['rain_gsp'], 0, 0, 255])
        file = self.root / 'gsp-phase-00.bin'
        data = zlib.compress(raw)
        file.write_bytes(data)
        self.meta['times'][0]['GSP'].update(sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))
        self.meta['times'][0]['phaseCounts'] = {k: raw.count(v) for k,v in PHASE.items()}
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_png_crc_rejected_even_with_rehashed_manifest(self):
        rgba = bytes([40,40,40,255,0,0,0,0,200,200,200,255,0,0,0,0])
        raw = make_png(rgba, bad_crc=True)
        f = self.root / 'ir108-00.png'
        f.write_bytes(raw)
        self.meta['times'][0]['IR'].update(sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw))
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_png_filter_rejected_even_with_correct_hash(self):
        rgba = bytes([40,40,40,255,0,0,0,0,200,200,200,255,0,0,0,0])
        raw = make_png(rgba, malformed_filter=True)
        f = self.root / 'ir108-00.png'
        f.write_bytes(raw)
        self.meta['times'][0]['IR'].update(sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw))
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_asset_path_escape_rejected(self):
        self.meta['times'][3]['IR']['file'] = '../ir108-00.png'
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_symlink_asset_rejected(self):
        p = self.root / 'ir108-02.png'
        p.rename(self.root / 'real-file.png')
        p.symlink_to(self.root / 'real-file.png')
        self.assert_bad()

    def test_original_sha_guard_rejected(self):
        self.meta['sourceLookupSha256'] = None
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_wrong_pixel_geometry_rejected(self):
        self.meta['size'] = [3, 2]
        write_meta(self.root, self.meta)
        self.assert_bad()

    def test_uncompressed_bomb_and_appended_data_rejected(self):
        blob = zlib.compress(bytes([0]) * 99999)
        file = self.root / 'gsp-phase-00.bin'
        file.write_bytes(blob)
        self.meta['times'][0]['GSP'].update(sha256=hashlib.sha256(blob).hexdigest(), bytes=len(blob))
        write_meta(self.root, self.meta)
        self.assert_bad()
        self.meta = fixture(self.root)
        blob = (self.root / 'gsp-phase-00.bin').read_bytes() + b'trailing'
        file.write_bytes(blob)
        self.meta['times'][0]['GSP'].update(sha256=hashlib.sha256(blob).hexdigest(), bytes=len(blob))
        write_meta(self.root, self.meta)
        self.assert_bad()


if __name__ == '__main__':
    unittest.main()
