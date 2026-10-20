import gzip,hashlib,json,tempfile,unittest
from unittest.mock import patch
import ruc_map_candidate as module
from pathlib import Path
import numpy as np
from ruc_pack import DEFAULT_FIELDS,pack_cell_major,write_meta
from ruc_map_candidate import build_candidate,decode_display,PARAMETERS,audit_native_frame

class RucMapCandidateTests(unittest.TestCase):
 def fixture(self,root,hours=14):
  source=root/'source';source.mkdir();points=9
  values={'temperature_2m':12.34,'dew_point_2m':5.,'relative_humidity_2m':70.,'pressure_msl':1012.3,'wind_speed_10m':10.,'wind_direction_10m':180.,'wind_gusts_10m':20.,'precipitation':.23,'cloud_cover':60.,'cloud_cover_low':30.,'cape':100.,'convective_inhibition':10.}
  fields={s.name:np.full((hours+1,points),values[s.name]) for s in DEFAULT_FIELDS}
  for f in fields.values():f[:,0]=np.nan
  (source/'deterministic.bin').write_bytes(pack_cell_major(fields))
  lookup=np.arange(points,dtype='<u4').reshape(3,3);lookup[0,1]=0xffffffff
  (source/'lookup.bin').write_bytes(lookup.tobytes())
  objects={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in source.iterdir()}
  times=[f'2026-10-20T{h:02d}:00' if h<24 else f'2026-10-21T{h-24:02d}:00' for h in range(hours+1)]
  write_meta(source/'latest.json',run='2026-10-20T00:00',times=times,point_count=points,specs=DEFAULT_FIELDS,grid={'nx':3,'ny':3,'lonMin':6.,'latMin':48.,'dx':.025,'dy':.025,'maxNearestKm':5.},deterministic_key='runs/test/deterministic.bin',eps_key=None,lookup_key='runs/test/lookup.bin',objects=objects)
  return source
 def test_full_core_and_extended_axes_preserve_source(self):
  for hours in (14,27):
   with self.subTest(hours=hours),tempfile.TemporaryDirectory() as t:
    root=Path(t);source=self.fixture(root,hours);before={p.name:p.read_bytes() for p in source.iterdir()}
    out=root/'maps';index=build_candidate(source,out)
    self.assertEqual(index['sourceManifestSha256'],hashlib.sha256(before['latest.json']).hexdigest())
    self.assertEqual(index['sourceDeterministicSha256'],hashlib.sha256(before['deterministic.bin']).hexdigest())
    self.assertEqual(index['sourceLookupSha256'],hashlib.sha256(before['lookup.bin']).hexdigest())
    self.assertEqual(index['modelId'],'icon-d2-ruc');self.assertEqual(index['sampling'],'nearest-native-cell')
    for kind in PARAMETERS:
     frames=index['products'][kind]['frames'];self.assertEqual(len(frames),hours if kind in ('gust','precipitation') else hours+1)
     for frame in frames:
      wire=(out/frame['file']).read_bytes();self.assertEqual(hashlib.sha256(wire).hexdigest(),frame['sha256'])
      decoded=gzip.decompress(wire)
      self.assertEqual(hashlib.sha256(decoded).hexdigest(),frame['decodedSha256'])
      payload=json.loads(decoded);self.assertEqual(len(decoded),frame['decodedBytes'])
      self.assertIsNone(payload['values'][0]);self.assertIsNone(payload['values'][1])
      self.assertEqual(payload['time'],frame['time']);self.assertEqual(payload['run'],index['run'])
    rain=json.loads(gzip.decompress((out/'precipitation-001.bin').read_bytes()))
    self.assertAlmostEqual(rain['values'][2]*rain['scale'],.23)
    wind=json.loads(gzip.decompress((out/'wind-001.bin').read_bytes()))
    self.assertAlmostEqual(wind['values'][2]*wind['scale'],18.52)
    self.assertEqual(before,{p.name:p.read_bytes() for p in source.iterdir()})
 def test_corrupt_source_rejected_before_output(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);source=self.fixture(root);(source/'deterministic.bin').write_bytes(b'broken')
   with self.assertRaisesRegex(ValueError,'SHA'):build_candidate(source,root/'maps')
   self.assertFalse((root/'maps').exists())
 def test_gap_or_duplicate_rejected(self):
  for stamp in ('2026-10-20T03:00','2026-10-20T00:00'):
   with tempfile.TemporaryDirectory() as t:
    root=Path(t);source=self.fixture(root);meta=json.loads((source/'latest.json').read_text());meta['deterministic']['times'][1]=stamp;(source/'latest.json').write_text(json.dumps(meta))
    with self.assertRaisesRegex(ValueError,'hourly'):build_candidate(source,root/'maps')
 def test_missing_dry_extreme_and_lookup(self):
  cube=np.array([[[0],[100]], [[-32768],[-32768]]],dtype='<i2');lookup=np.array([[0,1,0xffffffff]],dtype='<u4')
  scale,frames=decode_display(cube,lookup,0,{'scale':.01},1,(0,6500))
  self.assertEqual(frames,[[0,None,None],[100,None,None]])
  extreme=np.array([[[32500]]],dtype='<i2')
  precision,extreme_frames=decode_display(extreme,np.array([[0]],dtype='<u4'),0,{'scale':.2},1,(0,6500))
  self.assertEqual(extreme_frames[0][0]*precision,6500.)
  with self.assertRaisesRegex(ValueError,'physical'):decode_display(extreme,np.array([[0]],dtype='<u4'),0,{'scale':.201},1,(0,6500))
  with self.assertRaisesRegex(ValueError,'lookup'):decode_display(cube,np.array([[2]],dtype='<u4'),0,{'scale':.01},1,(0,6500))
  with self.assertRaisesRegex(ValueError,'fully missing'):decode_display(cube,np.array([[1]],dtype='<u4'),0,{'scale':.01},1,(0,6500))
 def test_source_overlap_is_rejected(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);source=self.fixture(root)
   for output in (source,source/'maps',root):
    with self.assertRaisesRegex(ValueError,'outside'):build_candidate(source,output)
 def test_deterministic_wire_and_explicit_utc_offsets(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);source=self.fixture(root);a=build_candidate(source,root/'a')
   meta=json.loads((source/'latest.json').read_text());meta['run']='2026-10-20T02:00+02:00'
   (source/'latest.json').write_text(json.dumps(meta));b=build_candidate(source,root/'b')
   self.assertEqual(a['run'],b['run'])
   for kind in PARAMETERS:self.assertEqual(a['products'][kind],b['products'][kind])
 def test_invalid_lookup_geometry_is_rejected(self):
  for key,value in [('dx',0),('maxNearestKm',50),('nx',3.5)]:
   with tempfile.TemporaryDirectory() as t:
    root=Path(t);source=self.fixture(root);meta=json.loads((source/'latest.json').read_text());meta['grid'][key]=value
    (source/'latest.json').write_text(json.dumps(meta))
    with self.assertRaisesRegex(ValueError,'geometry'):build_candidate(source,root/'maps')
 def test_invalid_unit_and_reused_output(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);source=self.fixture(root);out=root/'maps';out.mkdir()
   with self.assertRaisesRegex(ValueError,'new'):build_candidate(source,out)
   meta=json.loads((source/'latest.json').read_text());meta['deterministic']['fields'][0]['unit']='K';(source/'latest.json').write_text(json.dumps(meta))
   with self.assertRaisesRegex(ValueError,'unit'):build_candidate(source,root/'bad')
 def test_native_extreme_outside_crop_and_native_missing_audit(self):
  # The unstructured source can contain extremes outside the map crop.
  # They must remain visible as provenance, even if sampling omits them.
  cube=np.array([[[0]],[[4000]],[[5000]],[[-32768]]],dtype='<i2')
  lookup=np.array([[0,1,3,0xffffffff]],dtype='<u4')
  audit=audit_native_frame(cube,lookup,0,0,{'scale':.01},1,(-100.,70.))
  self.assertEqual(audit['packedCoreExtrema'],[0.,50.])
  self.assertEqual(audit['sampledExtrema'],[0.,40.])
  self.assertEqual(audit['nativeMissingCount'],1)
  self.assertEqual(audit['sampledMissingCount'],2)
  self.assertTrue(audit['nativeExtremeNotSampled'])
  self.assertTrue(audit['packedCoreExtremaMayDifferFromOriginalGrib'])
  self.assertEqual(decode_display(cube,lookup,0,{'scale':.01},1,(-100.,70.))[1][0],[0,4000,None,None])
  cube[2,0,0]=15000  # Outside preview; 150 °C must nevertheless fail.
  with self.assertRaisesRegex(ValueError,'native map field outside physical contract'):
   audit_native_frame(cube,lookup,0,0,{'scale':.01},1,(-100.,70.))
  cube[2,0,0]=5000
  with self.assertRaisesRegex(ValueError,'fully missing native'):
   audit_native_frame(np.full_like(cube,-32768),lookup,0,0,{'scale':.01},1,(-100.,70.))

 def test_source_changed_before_atomic_output_rejected(self):
  for changed in ('latest.json','deterministic.bin','lookup.bin'):
   with self.subTest(changed=changed),tempfile.TemporaryDirectory() as t:
    root=Path(t);source=self.fixture(root);out=root/'maps'
    original_compact=module.compact
    def swap_at_index(payload):
     if payload.get('schema')=='mid.ruc.map-candidate.v1':
      target=source/changed
      with target.open('ab') as fp:fp.write(b'X')
     return original_compact(payload)
    with patch.object(module,'compact',side_effect=swap_at_index):
     with self.assertRaisesRegex(ValueError,'source (manifest|object) changed during map generation'):
      build_candidate(source,out)
    self.assertFalse(out.exists())

 def test_lookup_declared_dtype_and_missing_sentinel(self):
  for key,value in (('dtype','uint16-le'),('nodata',0),('nodata',-1),('nodata',None)):
   with self.subTest(field=key,value=value),tempfile.TemporaryDirectory() as t:
    root=Path(t);source=self.fixture(root)
    meta=json.loads((source/'latest.json').read_text())
    meta['lookup'][key]=value
    (source/'latest.json').write_text(json.dumps(meta))
    with self.assertRaisesRegex(ValueError,'lookup dtype/nodata'):
     build_candidate(source,root/'maps')
    self.assertFalse((root/'maps').exists())

if __name__=='__main__':unittest.main()
