"""Standalone unit fixtures for the post-compression-only native ICON-D2 terms."""
from __future__ import annotations
import copy,gzip,hashlib,json,tempfile,unittest
from pathlib import Path
from augment_compressed_synoptic import augment,compact,sha

RUC='2026-10-16T04:00'
MODEL='2026-10-16T00:00:00+00:00'
PREFIX='runs/20261016T0400__synoptic_old/synoptic-fields'
def payload(hour):
    from datetime import datetime,timedelta
    t=(datetime.fromisoformat(MODEL)+timedelta(hours=hour)).isoformat()
    data={'schema':'mid.cloud-weather.field.v1','model':'icon-d2','run':MODEL,'time':t,'cloudUnit':'%',
          'weatherUnit':'WMO 4677','cloudScale':.1,'lats':[50.,51.],'lons':[7.,8.],
          'cloud':[0,300,550,None],'weather':[0,3,61,None],
          'origins':[{'url':'https://opendata.dwd.de/weather/nwp/icon-d2/'+str(hour),'sha256':'a'*64}]}
    raw=json.dumps(data,separators=(',',':')).encode()
    wire=gzip.compress(raw,mtime=0)
    return ({'hour':hour,'time':t,'file':f'icon-d2-cw-{hour:03d}.bin',
            'encoding':'gzip-json','decodedBytes':len(raw),'bytes':len(wire),'sha256':sha(wire)},wire)
def setup(root):
    source=root/'full-synoptic';source.mkdir()
    snapshot=root/'snapshot';(snapshot/PREFIX).mkdir(parents=True)
    specs={hour:payload(hour) for hour in (1,13,14,16,17)}
    for hour,(frame,data) in specs.items():(source/frame['file']).write_bytes(data)
    model={'run':MODEL,'resolutionKm':2.2,'license':'CC BY 4.0',
           'frames':[], 'cloudWeatherFrames':[specs[1][0]], 'origins':[]}
    core={'schema':'mid.synoptic.fields.v1','generatedAt':'2026-10-16T04:09:00+00:00',
          'algorithm':'test-source','models':{'icon-d2':copy.deepcopy(model)}}
    full=copy.deepcopy(core)
    full['models']['icon-d2']['cloudWeatherFrames']=[specs[h][0] for h in (1,13,14,16,17)]
    core['cloudWeatherBudget']={'optionalD2':{'attemptedHours':[13,14,16,17],
           'omittedHours':[13,14,16,17],'admittedHours':[]}}
    (snapshot/PREFIX/'index.json').write_bytes(compact(core))
    (snapshot/PREFIX/specs[1][0]['file']).write_bytes(specs[1][1])
    raw_index=source/'full-index.json';raw_index.write_bytes(compact(full))
    rows=[]
    for name in ('index.json',specs[1][0]['file']):
        b=(snapshot/PREFIX/name).read_bytes();rows.append({'key':f'{PREFIX}/{name}','bytes':len(b),'sha256':sha(b)})
    meta={'schema':'mid.dwd.ruc.grid.v2','run':RUC,'storageProfile':'pages-lossless-v1',
          'migration':{'productionEnabled':True},'synopticFields':{'key':f'{PREFIX}/index.json','schema':'mid.synoptic.fields.v1'},
          'pages':{'budgetBytes':900_000_000,'publishedBytes':sum(row['bytes'] for row in rows),
                   'losslessTransport':{'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False},
                   'objects':rows}}
    (snapshot/'latest.json').write_bytes(compact(meta))
    return snapshot,raw_index,source,specs
class OptionalSynoptic(unittest.TestCase):
    def test_correct_source_and_all_five_frames_in_new_immutable_namespace(self):
        with tempfile.TemporaryDirectory() as td:
            snapshot,index,source,specs=setup(Path(td))
            old=(snapshot/'latest.json').read_bytes();old_index=(snapshot/PREFIX/'index.json').read_bytes()
            result=augment(snapshot,index,source)
            self.assertEqual(result['admittedHours'],[13,14,16,17])
            self.assertLess(result['finalPhysicalBytes'],900_000_000)
            latest=json.loads((snapshot/'latest.json').read_bytes())
            name=latest['synopticFields']['key'];idx=json.loads((snapshot/name).read_bytes())
            # This exact index-address contract is consumed by both
            # src/nativeSynopticFields.ts and build_synoptic_fields.restore_cache.
            import re
            match=re.fullmatch(r'runs/[a-zA-Z0-9_-]+__synoptic_([a-f0-9]{16})/synoptic-fields/index.json',name)
            self.assertIsNotNone(match,'browser/cache cannot load optional D2 index')
            self.assertEqual(match.group(1),sha((snapshot/name).read_bytes())[:16])
            self.assertEqual([f['hour'] for f in idx['models']['icon-d2']['cloudWeatherFrames']],[1,13,14,16,17])
            self.assertEqual(idx['cloudWeatherBudget']['optionalD2']['omittedHours'],[])
            self.assertEqual((snapshot/PREFIX/'index.json').read_bytes(),old_index)
            self.assertEqual(json.loads(old)['pages']['objects'],latest['pages']['objects'][:2])
            self.assertEqual(sum(x['bytes'] for x in latest['pages']['objects']),latest['pages']['publishedBytes'])
            for frame in idx['models']['icon-d2']['cloudWeatherFrames']:
                data=(snapshot/Path(name).parent/frame['file']).read_bytes()
                self.assertEqual(sha(data),frame['sha256'])
            stable=(snapshot/'latest.json').read_bytes()
            self.assertEqual(augment(snapshot,index,source)['reason'],'no-verified-extra-terms')
            self.assertEqual((snapshot/'latest.json').read_bytes(),stable,'Rerun must not mutate an already augmented manifest')

    def test_bad_source_never_changes_pointer(self):
        for mode in ('wrong-hash','wrong-hour','wrong-model','wrong-units','nonfinite','wrong-run'):
            with self.subTest(mode=mode),tempfile.TemporaryDirectory() as td:
                snap,index,source,frames=setup(Path(td))
                pointer=(snap/'latest.json').read_bytes()
                spec=frames[13][0]
                wire_path=source/spec['file']
                if mode=='wrong-hash':wire_path.write_bytes(b'bad')
                else:
                    data=json.loads(gzip.decompress(wire_path.read_bytes()))
                    if mode=='wrong-hour':data['time']='2026-10-16T19:00:00+00:00'
                    if mode=='wrong-model':data['model']='icon-eu'
                    if mode=='wrong-units':data['weatherUnit']='not WMO'
                    if mode=='nonfinite':data['cloud'][0]=float('nan')
                    if mode=='wrong-run':data['run']='2026-10-15T00:00:00+00:00'
                    b=gzip.compress(json.dumps(data).encode(),mtime=0);wire_path.write_bytes(b)
                    full=json.loads(index.read_bytes())
                    f=next(f for f in full['models']['icon-d2']['cloudWeatherFrames'] if f['hour']==13)
                    f['sha256']=sha(b);f['bytes']=len(b);f['decodedBytes']=len(gzip.decompress(b))
                    index.write_bytes(compact(full))
                with self.assertRaises((ValueError,TypeError)):
                    augment(snap,index,source)
                self.assertEqual((snap/'latest.json').read_bytes(),pointer)

    def test_explicit_rectangular_meshgrid_still_accepted(self):
        with tempfile.TemporaryDirectory() as td:
            snap,index,source,frames=setup(Path(td))
            for hour in (13,14,16,17):
                f=frames[hour][0];file=source/f['file']
                data=json.loads(gzip.decompress(file.read_bytes()))
                data['lats']=[[50.,50.],[51.,51.]]
                data['lons']=[[7.,8.],[7.,8.]]
                wire=gzip.compress(json.dumps(data).encode(),mtime=0)
                file.write_bytes(wire)
                full=json.loads(index.read_bytes())
                row=next(x for x in full['models']['icon-d2']['cloudWeatherFrames'] if x['hour']==hour)
                row.update(bytes=len(wire),sha256=sha(wire),decodedBytes=len(gzip.decompress(wire)))
                index.write_bytes(compact(full))
            result=augment(snap,index,source)
            self.assertEqual(result['admittedHours'],[13,14,16,17])
    def test_bad_real_one_dimensional_axes_are_rejected(self):
        for mode in ('lat-length','lon-length','lat-nonmonotonic','lat-out-of-range','lon-nan','mixed-dimension'):
            with self.subTest(mode=mode),tempfile.TemporaryDirectory() as td:
                snap,index,source,frames=setup(Path(td))
                original=(snap/'latest.json').read_bytes()
                f=frames[13][0];file=source/f['file']
                data=json.loads(gzip.decompress(file.read_bytes()))
                if mode=='lat-length':data['lats']=[50.]
                if mode=='lon-length':data['lons']=[7.,8.,9.]
                if mode=='lat-nonmonotonic':data['lats']=[51.,50.]
                if mode=='lat-out-of-range':data['lats']=[50.,91.]
                if mode=='lon-nan':data['lons']=[7.,float('nan')]
                if mode=='mixed-dimension':data['lons']=[[7.,8.],[7.,8.]]
                raw=json.dumps(data).encode()
                wire=gzip.compress(raw,mtime=0);file.write_bytes(wire)
                full=json.loads(index.read_bytes())
                row=next(x for x in full['models']['icon-d2']['cloudWeatherFrames'] if x['hour']==13)
                row.update(bytes=len(wire),sha256=sha(wire),decodedBytes=len(raw))
                index.write_bytes(compact(full))
                with self.assertRaises((ValueError,TypeError)):
                    augment(snap,index,source)
                self.assertEqual((snap/'latest.json').read_bytes(),original)
    def test_optional_absent_does_not_edit_valid_codec(self):
        with tempfile.TemporaryDirectory() as td:
            snap,index,source,_=setup(Path(td));before=(snap/'latest.json').read_bytes()
            index.unlink()
            result=augment(snap,index,source)
            self.assertEqual(result['reason'],'unavailable-original-index')
            self.assertEqual((snap/'latest.json').read_bytes(),before)

if __name__=='__main__':unittest.main()
