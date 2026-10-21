import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from contextlib import ExitStack
import numpy as np
import test_ruc_map_candidate as fixtures
import prepare_ruc_map_source as module
from ruc_pack import DEFAULT_FIELDS

class PrepareTests(unittest.TestCase):
 def run_source(self,root,mutate=None):
  core=fixtures.RucMapCandidateTests().fixture(root);m=json.loads((core/'latest.json').read_bytes());cube=np.frombuffer((core/'deterministic.bin').read_bytes(),dtype='<i2').reshape(9,15,12)
  fields={s.name:np.concatenate([np.where(cube[:,:,i].T==-32768,np.nan,cube[:,:,i].T*s.scale+s.offset),np.tile(np.where(cube[:,-1,i]==-32768,np.nan,cube[:,-1,i]*s.scale+s.offset),(13,1))]) for i,s in enumerate(DEFAULT_FIELDS)}
  if mutate:mutate(fields)
  with ExitStack() as stack:
   for name,value in [('session',None),('stage_tree',['file.grib2']),('file_info',{'bytes':1,'sha256':'0'*64}),('collect_parameter',{}),('derive_core_fields',fields)]:stack.enter_context(patch.object(module,name,return_value=value))
   result=module.prepare(core,root/'stage',root/'extension')
  return result,core
 def test_preserves_core_prefix(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);m,core=self.run_source(root);full=np.frombuffer((root/'extension/deterministic.bin').read_bytes(),dtype='<i2').reshape(9,28,12)
   self.assertEqual(full[:,:15].tobytes(),(core/'deterministic.bin').read_bytes());self.assertEqual(len(m['deterministic']['times']),28);self.assertFalse(m['mapOnlyExtension']['epsExtended'])
 def test_changed_core_or_overflow_rejected(self):
  for mutate in [lambda f:f['temperature_2m'].__setitem__((1,1),23.),lambda f:f['cape'].__setitem__((27,1),4000.)]:
   with tempfile.TemporaryDirectory() as t:
    root=Path(t)
    with self.assertRaises(ValueError):self.run_source(root,mutate)
    self.assertFalse((root/'extension').exists());self.assertTrue((root/'source/latest.json').exists())
 def test_overlap_rejected_before_download(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);core=fixtures.RucMapCandidateTests().fixture(root)
   with patch.object(module,'stage_tree') as stage,self.assertRaisesRegex(ValueError,'disjoint'):module.prepare(core,core/'stage',root/'out')
   stage.assert_not_called()
if __name__=='__main__':unittest.main()
