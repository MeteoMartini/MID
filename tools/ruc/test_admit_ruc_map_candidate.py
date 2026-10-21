import copy,gzip,hashlib,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
import admit_ruc_map_candidate as module
from lossless_codec_pilot import encode_candidate
import test_ruc_map_candidate as fixtures
from ruc_map_candidate import compact

class AdmissionTests(unittest.TestCase):
 def fixture(self,root,hours=14):
  source=fixtures.RucMapCandidateTests().fixture(root,hours);s=json.loads((source/'latest.json').read_bytes());m=copy.deepcopy(s);snapshot=root/'snapshot';snapshot.mkdir()
  cube=np.frombuffer((source/'deterministic.bin').read_bytes(),dtype='<i2').reshape(9,hours+1,12);raw=cube[:,:15,:].tobytes();desc,wire=encode_candidate(raw,'byteplanes-gzip');key='runs/test/core.bin';look='runs/test/lookup/0000.bin'
  m['deterministic']['times']=m['deterministic']['times'][:15];m['deterministic']['recordBytes']=360;m['deterministic']['compressedPages']={'schema':'mid.ruc.compressed-pages.v1','recordBytes':360,'records':9,'parts':[{'firstRecord':0,'recordCount':9,'key':key,'manifest':desc}]}
  m['lookup']['pages']={'prefix':'runs/test/lookup','recordBytes':4,'records':9,'chunkCount':1};m['storageProfile']='pages-lossless-v1';m['migration']={'productionEnabled':True,'proof':{'untouched':'original'}}
  assets={key:wire,look:(source/'lookup.bin').read_bytes()};m['pages']={'budgetBytes':900000000,'publishedBytes':sum(map(len,assets.values())),'losslessTransport':{'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False},'objects':[{'key':k,'bytes':len(v),'sha256':hashlib.sha256(v).hexdigest()} for k,v in assets.items()]}
  for k,v in assets.items():p=snapshot/k;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(v)
  (snapshot/'latest.json').write_bytes(compact(m));return snapshot,source
 def test_admits_full_extension_preserves_old_inventory(self):
  for hours in (14,27):
   with self.subTest(hours=hours),tempfile.TemporaryDirectory() as t:
    root=Path(t);snapshot,source=self.fixture(root,hours);before={p.relative_to(snapshot).as_posix():p.read_bytes() for p in snapshot.rglob('*') if p.is_file()};source_before={p.name:p.read_bytes() for p in source.iterdir()}
    proof=module.admit(snapshot,source,root/'candidate');m=json.loads((snapshot/'latest.json').read_bytes());index=json.loads((snapshot/m['rucModelFields']['key']).read_bytes())
    self.assertEqual(proof['coreHours'],14);self.assertEqual(proof['mapHours'],hours);self.assertTrue(proof['codecProofUnchanged']);self.assertEqual(index['schema'],'mid.ruc.map-fields.v1')
    for k,v in before.items():
     if k!='latest.json':self.assertEqual((snapshot/k).read_bytes(),v)
    self.assertEqual(source_before,{p.name:p.read_bytes() for p in source.iterdir()});self.assertLess(proof['finalPhysicalBytes'],900000000)
    pressure=index['products']['pressure']['frames'][0];payload=json.loads(gzip.decompress((snapshot/m['rucModelFields']['key']).parent.joinpath(pressure['file']).read_bytes()));self.assertIsNone(payload['values'][0]);self.assertEqual(payload['schema'],'mid.ruc.map-field.v1')
 def test_corruption_and_prefix_drift_fail_closed(self):
  for source_drift in (False,True):
   with tempfile.TemporaryDirectory() as t:
    root=Path(t);snapshot,source=self.fixture(root,27);original=(snapshot/'latest.json').read_bytes()
    if source_drift:
     p=source/'deterministic.bin';v=bytearray(p.read_bytes());v[26]^=1;p.write_bytes(v);s=json.loads((source/'latest.json').read_bytes());s['objects']['deterministic.bin']['sha256']=hashlib.sha256(v).hexdigest();(source/'latest.json').write_bytes(compact(s))
    else:(snapshot/'runs/test/core.bin').write_bytes(b'corrupt')
    with self.assertRaises(ValueError):module.admit(snapshot,source,root/'candidate')
    self.assertEqual(original,(snapshot/'latest.json').read_bytes());self.assertFalse(list(snapshot.glob('runs/*__rucmaps*')))
 def test_budget_rejects_without_pointer_change(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);snapshot,source=self.fixture(root);m=json.loads((snapshot/'latest.json').read_bytes());m['pages']['budgetBytes']=1000;(snapshot/'latest.json').write_bytes(compact(m));original=(snapshot/'latest.json').read_bytes()
   with patch.object(module,'BUDGET',1000),self.assertRaisesRegex(ValueError,'budget'):module.admit(snapshot,source,root/'candidate')
   self.assertEqual(original,(snapshot/'latest.json').read_bytes());self.assertFalse(list(snapshot.glob('runs/*__rucmaps*')))
 def test_partial_write_rolls_back_new_objects(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);snapshot,source=self.fixture(root);original=(snapshot/'latest.json').read_bytes();write=Path.write_bytes
   def fail(path,data):
    if path.name=='pressure-001.bin' and path.is_relative_to(snapshot):raise OSError('simulated storage failure')
    return write(path,data)
   with patch.object(Path,'write_bytes',fail),self.assertRaisesRegex(OSError,'storage failure'):module.admit(snapshot,source,root/'candidate')
   self.assertEqual(original,(snapshot/'latest.json').read_bytes());self.assertFalse(list(snapshot.glob('runs/*__rucmaps*')));self.assertFalse((snapshot/'latest.json.ruc-map-tmp').exists())
if __name__=='__main__':unittest.main()
