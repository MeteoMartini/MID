"""Realistic, synthetic read-only map audit regression; never network or production."""
from __future__ import annotations
import gzip
import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np
from audit_model_domain_coverage import inspect, PARAMS, FACTORS

RUN = datetime(2026, 10, 22, 18, tzinfo=timezone.utc)


def write_blob(path, raw):
    path.write_bytes(raw)
    return {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def fixture(root, *, cropped=False, tamper=False, missing_outer=False, missing_inner=False):
    src = root/'source'; maps = root/'maps'; src.mkdir(); maps.mkdir()
    lookup = np.arange(25, dtype='<u4').reshape(5, 5)
    specs = [{'name': name, 'scale': .1, 'offset': 0} for name in PARAMS.values()]
    cube = np.full((25, 2, len(specs)), 100, dtype='<i2')
    if missing_outer:
        outer = [i for i in range(25) if i//5 in (0,4) or i%5 in (0,4)]
        cube[outer] = -32768
    if missing_inner:
        cube[12, :, :] = -32768
    cube[6, 0, :] = 0  # A real zero must not turn into missing data.
    # RUC native source uses provider-bound naive UTC; map index uses UTC offset.
    run = RUN.isoformat()
    source_run = RUN.strftime('%Y-%m-%dT%H:%M')
    times = [(RUN+timedelta(hours=h)).isoformat() for h in (0, 1)]
    source_times = [(RUN+timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in (0, 1)]
    meta = {'schema':'mid.dwd.ruc.grid.v2','run':source_run,'pointCount':25,
            'lookup':{'grid':{'nx':5,'ny':5,'lonMin':0,'latMin':40,'dx':1,'dy':1}},
            'deterministic':{'dtype':'int16-le','layout':'point-time-field',
                             'times':source_times,'fields':specs},'objects':{}}
    meta['objects']['lookup.bin'] = write_blob(src/'lookup.bin', lookup.tobytes())
    meta['objects']['deterministic.bin'] = write_blob(src/'deterministic.bin', cube.tobytes())
    manifest = (json.dumps(meta, separators=(',', ':'))+'\n').encode()
    (src/'latest.json').write_bytes(manifest)
    products = {}
    rows = np.array([1,2,3] if cropped else [0,1,2,3,4])
    cols = np.array([1,2,3] if cropped else [0,1,2,3,4])
    for fi, kind in enumerate(PARAMS):
        factor = FACTORS[kind]
        scale = min(.01, float(specs[fi]['scale'])*factor)
        refs = []
        for hour in (0,1):
            native = cube[lookup[np.ix_(rows, cols)].astype(np.intp), hour, fi]
            values = [None if n == -32768 else int(np.rint(n*.1*factor/scale)) for n in native.ravel()]
            field = {'schema':'mid.ruc.map-field.v1','modelId':'icon-d2-ruc','sampling':'nearest-native-cell',
                     'run':run,'time':times[hour],'kind':kind,'scale':scale,
                     'lats':(40+rows).tolist(),'lons':cols.tolist(),'values':values}
            raw = (json.dumps(field, separators=(',',':'))+'\n').encode()
            wire = gzip.compress(raw,mtime=0)
            name = f'{kind}-{hour:03d}.bin'
            desc = write_blob(maps/name, wire)
            refs.append({**desc,'hour':hour,'time':times[hour],'file':name,'encoding':'gzip-json','decodedBytes':len(raw)})
        products[kind] = {'frames': refs}
    index = {'schema':'mid.ruc.map-fields.v1','modelId':'icon-d2-ruc','sampling':'nearest-native-cell',
             'run':run,'sourceManifestSha256':hashlib.sha256(manifest).hexdigest(),
             'sourceLookupSha256':hashlib.sha256(lookup.tobytes()).hexdigest(),'products':products}
    (maps/'index.json').write_text(json.dumps(index))
    if tamper:
        (maps/'temperature-000.bin').write_bytes(b'garbage')
    return src, maps


def change_frame(maps, kind, hour, mutate):
    index = json.loads((maps/'index.json').read_text())
    ref = index['products'][kind]['frames'][hour]
    path = maps/ref['file']; field = json.loads(gzip.decompress(path.read_bytes()))
    mutate(field)
    raw = (json.dumps(field, separators=(',',':'))+'\n').encode()
    wire = gzip.compress(raw, mtime=0)
    ref.update(write_blob(path, wire));ref['decodedBytes']=len(raw)
    (maps/'index.json').write_text(json.dumps(index))


class ModelDomainTest(unittest.TestCase):
    def test_full_source_lookup_and_six_parameter_roundtrips(self):
        with tempfile.TemporaryDirectory() as d:
            src, maps = fixture(Path(d))
            result = inspect(src, maps)
            self.assertTrue(result['allFramesCoverKnownNativeLookup'])
            self.assertTrue(result['allPublishedFrameValuesMatchNativeSource'])
            self.assertEqual(len(result['products']), 6)
            self.assertEqual(result['nativeLookupCoveredCells'], 25)
            self.assertEqual(sum(len(p['frames']) for p in result['products']), 12)

    def test_deliberate_crop_detected_across_every_parameter_and_hour(self):
        with tempfile.TemporaryDirectory() as d:
            src, maps = fixture(Path(d), cropped=True)
            result=inspect(src, maps)
            self.assertFalse(result['allFramesCoverKnownNativeLookup'])
            self.assertEqual({row['omittedNativeLookupCells'] for p in result['products'] for row in p['frames']}, {16})
            self.assertEqual(result['products'][0]['frames'][0]['omittedKnownParameterNativePoints'],16)

    def test_proper_native_missing_outside_is_not_zero(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d),cropped=True,missing_outer=True)
            frame=inspect(src,maps)['products'][0]['frames'][0]
            self.assertEqual(frame['omittedNativeLookupCells'],16)
            self.assertEqual(frame['omittedKnownParameterNativePoints'],0)

    def test_missing_inside_and_true_zero_roundtrip(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d),missing_inner=True)
            self.assertTrue(inspect(src,maps)['allPublishedFrameValuesMatchNativeSource'])

    def test_tampered_wire_sha_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d),tamper=True)
            with self.assertRaisesRegex(ValueError,'SHA/byte drift'):
                inspect(src,maps)

    def test_corrupt_payload_value_even_with_updated_sha_fails(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d))
            change_frame(maps,'wind',1,lambda d:d['values'].__setitem__(4, 500000))
            with self.assertRaisesRegex(ValueError,'Map values differ'):
                inspect(src,maps)

    def test_mask_replaced_with_zero_even_with_valid_sha_fails(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d),missing_inner=True)
            change_frame(maps,'temperature',0,lambda d:d['values'].__setitem__(12,0))
            with self.assertRaisesRegex(ValueError,'Missing/source mask mismatch'):
                inspect(src,maps)

    def test_source_provenance_mismatch_fails(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d))
            index=json.loads((maps/'index.json').read_text());index['sourceManifestSha256']='0'*64
            (maps/'index.json').write_text(json.dumps(index))
            with self.assertRaisesRegex(ValueError,'manifest SHA drift'):
                inspect(src,maps)

    def test_out_of_lookup_grid_frame_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d))
            change_frame(maps,'temperature',0,lambda d:d['lons'].__setitem__(0,-1))
            with self.assertRaisesRegex(ValueError,'grid does not match'):
                inspect(src,maps)

if __name__=='__main__':
    unittest.main()
