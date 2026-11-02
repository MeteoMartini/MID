import hashlib,json,tempfile,unittest
from datetime import datetime,timedelta,timezone
from pathlib import Path
from ruc_fast_pages_chunker import partition_native_fast

SIZES={'deterministic.bin':168,'rapid-5m.bin':146,'rapid-15m.bin':150,'lookup.bin':4}
RUN='2026-11-02T08:00'
SHA=lambda x:hashlib.sha256(x).hexdigest()

def site(root):
    base=root/'original'/'ruc'/'fast'
    files=base/'runs'/'20261102T0800';files.mkdir(parents=True)
    objects={}
    for name,size in SIZES.items():
        buf=bytes([0,255,1,17])*(size if name!='lookup.bin' else 4)
        buf=buf[:size*(4 if name!='lookup.bin' else 4)]
        (files/name).write_bytes(buf)
        objects[name]={'key':f'fast/runs/20261102T0800/{name}','bytes':len(buf),'sha256':SHA(buf)}
    start=datetime.strptime(RUN,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    times=lambda minutes,count:[(start+timedelta(minutes=i*minutes)).strftime('%Y-%m-%dT%H:%M') for i in range(count)]
    fields=[{'name':x,'scale':.01,'offset':0,'unit':'native'} for x in
      ('temperature_2m','dew_point_2m','relative_humidity_2m','pressure_msl','wind_speed_10m',
       'wind_direction_10m','wind_gusts_10m','precipitation','cloud_cover','cloud_cover_low',
       'cape','convective_inhibition')]
    ptr={'schema':'mid.ruc.fast-shadow-pointer.v1','run':RUN,'nativePoints':4,
         'dataTimes':times(60,7),'rapid5Times':times(5,73),'rapid15Times':times(15,25),
         'fields':fields,
         'grid':{'nx':2,'ny':2},'sourceGribSha256':'a'*64,
         'eps':{'availability':'unavailable'},'objects':objects}
    for key in ('productionEnabled','publicationAuthorized','realtimeConsumerEnabled','consumerAdoptionVerified'):ptr[key]=False
    (base/'latest.json').write_text(json.dumps(ptr))
    return root/'original',root/'partitioned'

class NativeChunk(unittest.TestCase):
    def test_same_sha_all_four_original_objects(self):
        with tempfile.TemporaryDirectory() as t:
            inp,out=site(Path(t))
            proof=partition_native_fast(inp,out,expected_points=4,chunk_cells=2)
            self.assertEqual(proof['chunkFiles'],8)
            self.assertFalse(proof['publicationAuthorized'])
            m=json.loads((out/'ruc/fast/paged-shadow.json').read_text())
            for name,row in m['objects'].items():
                data=b''.join((out/'ruc'/part['key']).read_bytes() for part in row['parts'])
                self.assertEqual(SHA(data),row['sourceSha256'])
            self.assertEqual(proof['actualPartitionBytes'],proof['sourceNativeBytes'])
    def test_tampered_original_full_sha_fails_closed(self):
        with tempfile.TemporaryDirectory() as t:
            inp,out=site(Path(t));p=inp/'ruc/fast/latest.json';v=json.loads(p.read_text());v['objects']['deterministic.bin']['sha256']='b'*64;p.write_text(json.dumps(v))
            with self.assertRaisesRegex(ValueError,'SHA'):partition_native_fast(inp,out,expected_points=4)
            self.assertFalse(out.exists())
    def test_unsafe_symlink_fails(self):
        with tempfile.TemporaryDirectory() as t:
            inp,out=site(Path(t));(inp/'shortcut').symlink_to('ruc')
            with self.assertRaises(ValueError):partition_native_fast(inp,out,expected_points=4)
    def test_false_production_activation_fails(self):
        with tempfile.TemporaryDirectory() as t:
            inp,out=site(Path(t));p=inp/'ruc/fast/latest.json';v=json.loads(p.read_text());v['productionEnabled']=True;p.write_text(json.dumps(v))
            with self.assertRaises(ValueError):partition_native_fast(inp,out,expected_points=4)
    def test_invalid_utc_axis_or_units_fails(self):
        with tempfile.TemporaryDirectory() as t:
            inp,out=site(Path(t));p=inp/'ruc/fast/latest.json';v=json.loads(p.read_text());v['rapid5Times']=v['rapid5Times'][1:];p.write_text(json.dumps(v))
            with self.assertRaisesRegex(ValueError,'UTC valid-time'):partition_native_fast(inp,out,expected_points=4)
            v['rapid5Times']=[(datetime.strptime(RUN,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)+timedelta(minutes=5*i)).strftime('%Y-%m-%dT%H:%M') for i in range(73)]
            v['fields'][0]['scale']=0
            p.write_text(json.dumps(v))
            with self.assertRaisesRegex(ValueError,'field units'):partition_native_fast(inp,out,expected_points=4)
    def test_no_output_overwrite(self):
        with tempfile.TemporaryDirectory() as t:
            inp,out=site(Path(t));out.mkdir()
            with self.assertRaises(ValueError):partition_native_fast(inp,out,expected_points=4)
if __name__=='__main__':unittest.main()
