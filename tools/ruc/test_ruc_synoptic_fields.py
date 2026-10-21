"""Real ecCodes native messages: metadata, levels, units, Missing and axes."""
import tempfile,unittest
from pathlib import Path
from datetime import datetime,timezone
from eccodes import codes_set,codes_set_values,codes_get_message,codes_release
import numpy as np
from test_grib_metadata import native_fixture
from build_ruc_synoptic_fields import COMPONENTS,QV_COMPONENTS,T700,decode,relative_humidity_from_specific

class RucCompositeTests(unittest.TestCase):
 def source(self,component,mutate=None):
  _,level,field,identity,_=component
  gid=native_fixture('temperature_2m',3)
  try:
   for key,value in zip(('discipline','parameterCategory','parameterNumber'),identity):codes_set(gid,key,value)
   codes_set(gid,'typeOfFirstFixedSurface',100 if level else 101 if field=='pmsl' else 1)
   codes_set(gid,'scaleFactorOfFirstFixedSurface',0)
   codes_set(gid,'scaledValueOfFirstFixedSurface',level*100 if level else 0)
   value={'t':280,'relhum':80,'fi':550*98.0665,'pmsl':100000,'u':35,'v':-15,'clct':90,'ww':95,'q':.005}[field]
   codes_set_values(gid,np.full(542040,value))
   if mutate:mutate(gid)
   return codes_get_message(gid)
  finally:codes_release(gid)
 def read(self,raw,component,hour=3):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'field.grib2';p.write_bytes(raw)
   return decode(p,datetime(2026,10,10,6,tzinfo=timezone.utc),hour,component)
 def test_all_nine_components_native_grib_and_normalization(self):
  for c in COMPONENTS:
   with self.subTest(component=c[:3]):
    values=self.read(self.source(c),c);self.assertEqual(values.size,542040)
    if c[2]=='fi':self.assertAlmostEqual(values[0],550,places=3)
    if c[2]=='pmsl':self.assertEqual(values[0],1000)
    if c[2]=='ww':self.assertEqual(values[0],95)
 def test_specific_humidity_and_700_temperature_use_native_pressure_headers(self):
  for c in (*QV_COMPONENTS.values(),T700):
   values=self.read(self.source(c),c)
   self.assertAlmostEqual(values[0],.005 if c[2]=='q' else 280,places=6)
 def test_native_humidity_derivation_water_saturation_and_missing(self):
  saturated=.622*6.112/(850-.378*6.112)
  q=np.array([0.,saturated,np.nan,saturated]);t=np.array([273.15,273.15,273.15,np.nan])
  rh=relative_humidity_from_specific(q,t,850)
  np.testing.assert_allclose(rh[:2],[0,100],rtol=1e-12);self.assertTrue(np.isnan(rh[2:]).all());np.testing.assert_equal(q,[0.,saturated,np.nan,saturated])
  with self.assertRaises(ValueError):relative_humidity_from_specific(np.array([.1]),np.array([273.15]),850)
 def test_wrong_run_step_level_grid_parameter_and_centre_rejected(self):
  c=COMPONENTS[0]
  for key,value in [('dataTime',700),('endStep',4),('scaledValueOfFirstFixedSurface',70000),('numberOfGridUsed',48),('parameterNumber',6),('centre',98)]:
   with self.subTest(key=key),self.assertRaises(ValueError):self.read(self.source(c,lambda gid:codes_set(gid,key,value)),c)
 def test_fractional_weather_not_rounded_to_category(self):
  c=COMPONENTS[-1]
  with self.assertRaises(ValueError):self.read(self.source(c,lambda gid:codes_set_values(gid,np.full(542040,95.5))),c)
 def test_missing_bitmap_stays_unknown(self):
  c=COMPONENTS[0]
  def mask(gid):
   codes_set(gid,'bitmapPresent',1);codes_set(gid,'missingValue',9999)
   values=np.full(542040,280.);values[0]=9999;codes_set_values(gid,values)
  values=self.read(self.source(c,mask),c);self.assertTrue(np.isnan(values[0]));self.assertEqual(values[1],280)
 def test_duplicate_message_rejected(self):
  c=COMPONENTS[0];raw=self.source(c)
  with self.assertRaises(ValueError):self.read(raw+raw,c)

class RucCompositePublicationTests(unittest.TestCase):
 def candidate(self,source,stage,output):
  import json,gzip
  from build_ruc_synoptic_fields import compact,sha
  run='2026-10-20T00:00:00+00:00';output=Path(output);output.mkdir();frames=[]
  for h in range(28):
   file=f'icon-d2-ruc-{h:03d}.bin';raw=compact({'model':'icon-d2-ruc','hour':h});wire=gzip.compress(raw,mtime=0);(output/file).write_bytes(wire)
   frames.append({'file':file,'hour':h,'bytes':len(wire),'decodedBytes':len(raw),'sha256':sha(wire)})
  index={'run':run,'model':{'frames':frames},'origins':list(range(252))};(output/'index.json').write_bytes(compact(index));return index
 def fixture(self,root):
  from test_admit_ruc_map_candidate import AdmissionTests
  return AdmissionTests().fixture(root,27)
 def test_atomic_admission_preserves_all_core_objects(self):
  import json
  from unittest.mock import patch
  import build_ruc_synoptic_fields as m
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);snapshot,source=self.fixture(root);before={p.relative_to(snapshot):p.read_bytes() for p in snapshot.rglob('*') if p.is_file()}
   with patch.object(m,'build',self.candidate):proof=m.admit(snapshot,source,root/'stage',root/'candidate')
   self.assertEqual(proof['frames'],28);self.assertTrue(proof['coreAndEpsUnchanged']);meta=json.loads((snapshot/'latest.json').read_bytes())
   for p,data in before.items():
    if str(p)!='latest.json':self.assertEqual((snapshot/p).read_bytes(),data)
   self.assertTrue((snapshot/meta['rucSynopticFields']['key']).is_file());m.verify_snapshot(snapshot)
 def test_source_failure_partial_copy_and_corrupt_core_never_publish(self):
  from unittest.mock import patch
  import build_ruc_synoptic_fields as m
  for failure in ('source','copy','core','during-build','candidate'):
   with self.subTest(failure=failure),tempfile.TemporaryDirectory() as t:
    root=Path(t);snapshot,source=self.fixture(root);original=(snapshot/'latest.json').read_bytes()
    def builder(*args):
     if failure=='source':raise ValueError('incomplete WW')
     result=self.candidate(*args)
     if failure=='during-build':(snapshot/'runs/test/core.bin').write_bytes(b'corrupted during build')
     if failure=='candidate':(Path(args[2])/result['model']['frames'][0]['file']).write_bytes(b'corrupt')
     return result
    if failure=='core':(snapshot/'runs/test/core.bin').write_bytes(b'bad')
    def failed_copy(src,dst):
     Path(dst).mkdir(parents=True);(Path(dst)/'partial').write_bytes(b'x');raise OSError('disk full')
    with patch.object(m,'build',builder):
     if failure=='copy':
      with patch.object(m.shutil,'copytree',failed_copy),self.assertRaises(OSError):m.admit(snapshot,source,root/'stage',root/'candidate')
     else:
      with self.assertRaises(ValueError):m.admit(snapshot,source,root/'stage',root/'candidate')
    self.assertEqual((snapshot/'latest.json').read_bytes(),original)
    self.assertFalse(list(snapshot.glob('runs/*__ruc_synoptic_*')))
    self.assertFalse((snapshot/'latest.json.ruc-synoptic-tmp').exists())
 def test_distinct_run_rejected_before_network(self):
  import json
  from unittest.mock import patch
  import build_ruc_synoptic_fields as m
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);snapshot,source=self.fixture(root);p=source/'latest.json';meta=json.loads(p.read_bytes());meta['run']='2026-10-20T01:00';p.write_text(json.dumps(meta))
   with patch.object(m,'build') as build,self.assertRaises(m.SnapshotIntegrityError):m.admit(snapshot,source,root/'stage',root/'candidate')
   build.assert_not_called()

if __name__=='__main__':unittest.main()
