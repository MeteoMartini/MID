"""Realistic, synthetic read-only map audit regression; never network or production."""
from __future__ import annotations
import gzip
import hashlib
import json
import tempfile
import unittest
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np
from audit_model_domain_coverage import inspect, PARAMS, FACTORS

RUN = datetime(2026, 10, 22, 18, tzinfo=timezone.utc)
SOURCE_UNITS = {'temperature':'°C','pressure':'hPa','wind':'kn','gust':'kn','cloud':'%','precipitation':'mm'}
MAP_UNITS = {**SOURCE_UNITS,'wind':'km/h','gust':'km/h','precipitation':'mm/1 h'}


def write_blob(path, raw):
    path.write_bytes(raw)
    return {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def fixture(root, *, cropped=False, tamper=False, missing_outer=False, missing_inner=False, hours=2):
    src = root/'source'; maps = root/'maps'; src.mkdir(); maps.mkdir()
    lookup = np.arange(25, dtype='<u4').reshape(5, 5)
    specs = [{'name': name, 'unit':SOURCE_UNITS[kind], 'scale': .1, 'offset': 0} for kind,name in PARAMS.items()]
    cube = np.full((25, hours, len(specs)), 100, dtype='<i2')
    if missing_outer:
        outer = [i for i in range(25) if i//5 in (0,4) or i%5 in (0,4)]
        cube[outer] = -32768
    if missing_inner:
        cube[12, :, :] = -32768
    cube[6, 0, :] = 0  # A real zero must not turn into missing data.
    # RUC native source uses provider-bound naive UTC; map index uses UTC offset.
    run = RUN.isoformat()
    source_run = RUN.strftime('%Y-%m-%dT%H:%M')
    times = [(RUN+timedelta(hours=h)).isoformat() for h in range(hours)]
    source_times = [(RUN+timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(hours)]
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
        for hour in range(hours):
            if hour == 0 and kind in ('gust','precipitation'):
                continue  # Zero-length initialization is not a 1-h product.
            native = cube[lookup[np.ix_(rows, cols)].astype(np.intp), hour, fi]
            values = [None if n == -32768 else int(np.rint(n*.1*factor/scale)) for n in native.ravel()]
            field = {'schema':'mid.ruc.map-field.v1','modelId':'icon-d2-ruc','sampling':'nearest-native-cell',
                     'run':run,'time':times[hour],'kind':kind,'unit':MAP_UNITS[kind],'scale':scale,
                     'lats':(40+rows).tolist(),'lons':cols.tolist(),'values':values}
            raw = (json.dumps(field, separators=(',',':'))+'\n').encode()
            wire = gzip.compress(raw,mtime=0)
            name = f'{kind}-{hour:03d}.bin'
            desc = write_blob(maps/name, wire)
            refs.append({**desc,'hour':hour,'time':times[hour],'file':name,'encoding':'gzip-json','decodedBytes':len(raw),
                         'decodedSha256':hashlib.sha256(raw).hexdigest(),'intervalHours':1 if kind in ('gust','precipitation') else 0})
        products[kind] = {'unit':MAP_UNITS[kind],'frames': refs}
    index = {'schema':'mid.ruc.map-fields.v1','modelId':'icon-d2-ruc','sampling':'nearest-native-cell',
             'run':run,'sourceManifestSha256':hashlib.sha256(manifest).hexdigest(),
             'sourceLookupSha256':hashlib.sha256(lookup.tobytes()).hexdigest(),
             'sourceDeterministicSha256':meta['objects']['deterministic.bin']['sha256'],'products':products}
    (maps/'index.json').write_text(json.dumps(index))
    if tamper:
        (maps/'temperature-000.bin').write_bytes(b'garbage')
    return src, maps


def change_frame(maps, kind, hour, mutate):
    index = json.loads((maps/'index.json').read_text())
    ref = next(r for r in index['products'][kind]['frames'] if r['hour']==hour)
    path = maps/ref['file']; field = json.loads(gzip.decompress(path.read_bytes()))
    mutate(field)
    raw = (json.dumps(field, separators=(',',':'))+'\n').encode()
    wire = gzip.compress(raw, mtime=0)
    ref.update(write_blob(path, wire));ref['decodedBytes']=len(raw);ref['decodedSha256']=hashlib.sha256(raw).hexdigest()
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
            self.assertEqual(sum(len(p['frames']) for p in result['products']), 10)

    def test_missing_forecast_hour_cannot_pass_coverage(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d))
            index=json.loads((maps/'index.json').read_text())
            index['products']['temperature']['frames'].pop()
            (maps/'index.json').write_text(json.dumps(index))
            with self.assertRaisesRegex(ValueError,'Incomplete map forecast axis'):
                inspect(src,maps)

    def test_required_source_hashes_cannot_be_omitted(self):
        for key in ('sourceManifestSha256','sourceLookupSha256','sourceDeterministicSha256'):
            with self.subTest(key=key),tempfile.TemporaryDirectory() as d:
                src,maps=fixture(Path(d))
                index=json.loads((maps/'index.json').read_text());index.pop(key)
                (maps/'index.json').write_text(json.dumps(index))
                with self.assertRaisesRegex(ValueError,'SHA drift'):
                    inspect(src,maps)

    def test_wrong_frame_identity_even_with_updated_hash_fails(self):
        for key,value in (('schema','unrelated.v1'),('modelId','icon-d2'),('sampling','interpolated'),('unit','Pa')):
            with self.subTest(key=key),tempfile.TemporaryDirectory() as d:
                src,maps=fixture(Path(d))
                change_frame(maps,'pressure',0,lambda f:f.__setitem__(key,value))
                with self.assertRaisesRegex(ValueError,'identity/validity'):
                    inspect(src,maps)

    def test_wrong_source_units_cannot_pass_numeric_roundtrip(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d))
            meta=json.loads((src/'latest.json').read_text());meta['deterministic']['fields'][1]['unit']='Pa'
            raw=json.dumps(meta).encode();(src/'latest.json').write_bytes(raw)
            index=json.loads((maps/'index.json').read_text());index['sourceManifestSha256']=hashlib.sha256(raw).hexdigest()
            (maps/'index.json').write_text(json.dumps(index))
            with self.assertRaisesRegex(ValueError,'source unit'):
                inspect(src,maps)

    def test_wrong_interval_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d))
            index=json.loads((maps/'index.json').read_text());index['products']['precipitation']['frames'][0]['intervalHours']=0
            (maps/'index.json').write_text(json.dumps(index))
            with self.assertRaisesRegex(ValueError,'interval'):
                inspect(src,maps)

    def test_decoded_sha_drift_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            src,maps=fixture(Path(d))
            index=json.loads((maps/'index.json').read_text());index['products']['pressure']['frames'][0]['decodedSha256']='0'*64
            (maps/'index.json').write_text(json.dumps(index))
            with self.assertRaisesRegex(ValueError,'Decoded frame SHA drift'):
                inspect(src,maps)

    def test_real_candidate_builder_contract_roundtrip(self):
        from ruc_map_candidate import build_candidate
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);src,_=fixture(root)
            meta=json.loads((src/'latest.json').read_text())
            meta['lookup'].update(dtype='uint32-le',nodata=0xffffffff)
            meta['lookup']['grid'].update(latMin=47,lonMin=6,maxNearestKm=5)
            meta['deterministic']['recordBytes']=2*len(PARAMS)*2
            cube=np.full((25,2,len(PARAMS)),100,dtype='<i2');cube[:,:,1]=10000
            meta['objects']['deterministic.bin']=write_blob(src/'deterministic.bin',cube.tobytes())
            (src/'latest.json').write_text(json.dumps(meta))
            candidate=root/'actual-candidate'
            build_candidate(src,candidate)
            report=inspect(src,candidate)
            self.assertTrue(report['allFramesCoverKnownNativeLookup'])
            self.assertTrue(report['allSourceForecastHoursPresent'])
            self.assertFalse(report['full27HourSourceAxis'])

    def test_actual_candidate_audits_all_lookup_cells_outside_historical_crop(self):
        from ruc_map_candidate import build_candidate
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);src,_=fixture(root)
            meta=json.loads((src/'latest.json').read_bytes())
            meta['lookup'].update(dtype='uint32-le',nodata=0xffffffff)
            meta['lookup']['grid'].update(latMin=43.2,lonMin=-3.8,maxNearestKm=5)
            meta['deterministic']['recordBytes']=2*len(PARAMS)*2
            cube=np.full((25,2,len(PARAMS)),100,dtype='<i2')
            cube[:,:,1]=10000
            cube[0,:,:]=-32768
            meta['objects']['deterministic.bin']=write_blob(src/'deterministic.bin',cube.tobytes())
            (src/'latest.json').write_text(json.dumps(meta))
            target=root/'actual-full-lookup'
            result=build_candidate(src,target)
            self.assertTrue(result['fullLookupCoverage'])
            audit=inspect(src,target)
            self.assertEqual(audit['nativeLookupCoveredCells'],25)
            self.assertTrue(audit['allFramesCoverKnownNativeLookup'])
            self.assertTrue(audit['allPublishedFrameValuesMatchNativeSource'])
            for p in audit['products']:
                for row in p['frames']:
                    self.assertEqual(row['omittedNativeLookupCells'],0)
                    self.assertEqual(row['omittedKnownParameterNativePoints'],0)
            self.assertEqual(audit['sourceLookupBounds'][0],-3.8)
            self.assertEqual(audit['sourceLookupBounds'][1],43.2)

    def test_cli_distinguishes_complete_short_axis_from_27_hour_acceptance(self):
        for hours,expected in ((2,2),(28,0)):
            with self.subTest(hours=hours),tempfile.TemporaryDirectory() as d:
                src,maps=fixture(Path(d),hours=hours)
                run=subprocess.run([sys.executable,str(Path(__file__).with_name('audit_model_domain_coverage.py')),
                                    '--source',str(src),'--maps',str(maps)],capture_output=True,text=True)
                self.assertEqual(run.returncode,expected,run.stderr)
                report=json.loads(run.stdout)
                self.assertEqual(report['sourceForecastHours'],hours-1)
                self.assertEqual(report['full27HourSourceAxis'],hours==28)

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
