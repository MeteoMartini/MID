import json,tempfile,unittest
from inspect import signature
from prepare_ruc_pages import prepare
from pathlib import Path
from admit_d2_native_pages import admit,field_admission,KINDS,LEADS,UNITS,require_detached_native_approval,sha
class PagesNativeD2AdmissionTests(unittest.TestCase):
 def test_canonical_preparer_receives_only_independent_release_attestation(self):
  # The established CLI is deliberately unable to self-approve any D2 input.
  params=signature(prepare).parameters
  self.assertIn('native_d2_trusted_index_sha256',params)
  self.assertIn('native_d2_trusted_inventory_sha256',params)
  self.assertIsNone(params['native_d2_trusted_index_sha256'].default)
  self.assertIsNone(params['native_d2_trusted_inventory_sha256'].default)
  from pathlib import Path
  source=(Path(__file__).parent/'prepare_ruc_pages.py').read_text(encoding='utf8')
  self.assertIn('trusted_index_sha256=native_d2_trusted_index_sha256',source)
  self.assertIn('trusted_inventory_sha256=native_d2_trusted_inventory_sha256',source)
  cli=source.split('def main():',1)[-1]
  self.assertNotIn('--native-d2-trusted',cli)
 def test_detached_release_gate_does_not_trust_self_approved_flags_or_rehashed_bytes(self):
  with tempfile.TemporaryDirectory() as td:
   file=Path(td)/'index.json'
   inventory='a'*64
   file.write_text(json.dumps({'productionApproved':False,'sourceInventorySha256':inventory,'run':'2026-11-02T03:00:00Z'}))
   independently_approved_index_sha=sha(file)
   with self.assertRaisesRegex(ValueError,'Independent release-gate'):
    require_detached_native_approval(file,inventory)
   require_detached_native_approval(file,inventory,independently_approved_index_sha,inventory)
   # Compromised archive flips a status and recomputes all self-contained SHAs:
   # only the original detached digest is admissible.
   file.write_text(json.dumps({'productionApproved':True,'sourceInventorySha256':inventory,'run':'2026-11-02T03:00:00Z'}))
   self.assertNotEqual(sha(file),independently_approved_index_sha)
   with self.assertRaisesRegex(ValueError,'differs from detached'):
    require_detached_native_approval(file,inventory,independently_approved_index_sha,inventory)
   file.write_text(json.dumps({'productionApproved':False,'sourceInventorySha256':inventory,'run':'2026-11-02T03:00:00Z'}))
   with self.assertRaisesRegex(ValueError,'differs from detached'):
    require_detached_native_approval(file,'b'*64,independently_approved_index_sha,inventory)

 def test_qualified_full_native_extent_preserves_real_zero_and_null(self):
  lats=[44+i*.025 for i in range(470)]
  lons=[0+i*.025 for i in range(805)]
  cells=[1]*(len(lats)*len(lons));cells[0]=0;cells[1]=None
  field={'lats':lats,'lons':lons,'values':cells,
         'negativePackingUncertainNoDataCells':1}
  grid=field_admission(field,'precipitation',None)
  self.assertEqual(len(grid[0]),470)
  self.assertEqual(field['values'][0],0)
  self.assertIsNone(field['values'][1])
  with self.assertRaisesRegex(ValueError,'grid/coordinate'):
   field_admission(field,'precipitation',(grid[0],tuple(lon+.025 for lon in lons)))
  with self.assertRaisesRegex(ValueError,'packing uncertainty'):
   field_admission({**field,'negativePackingUncertainNoDataCells':2},'precipitation',None)
  with self.assertRaisesRegex(ValueError,'physical contract'):
   damaged=cells.copy();damaged[2]=-1
   field_admission({**field,'values':damaged},'precipitation',None)
  with self.assertRaisesRegex(ValueError,'Germany crop'):
   field_admission({**field,'lats':[48+i*.025 for i in range(300)]},'precipitation',None)
 def test_absent_source_is_a_noop_for_existing_ruc(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td)/'core';out=Path(td)/'pages'
   root.mkdir();out.mkdir();original=[{'key':'core.bin','bytes':100}]
   self.assertIsNone(admit(root,out,'20261102T0600',original))
   self.assertEqual(original,[{'key':'core.bin','bytes':100}])
 def test_never_promote_pilot_source(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td)/'core';out=Path(td)/'pages'
   root.mkdir();out.mkdir();d=root/'model-fields-native';d.mkdir()
   (d/'index.json').write_text(json.dumps({'schema':'mid.icon-d2.native-fields.v2','productionApproved':False,
      'nativePoints':542040,'sourceInventorySha256':'a'*64,'modelId':'icon-d2','sampling':'nearest-native-cell'}))
   with self.assertRaisesRegex(ValueError,'approved'):
    admit(root,out,'run',[])
   self.assertEqual(list(out.rglob('*.bin')),[])
 def test_rejects_missing_or_duplicate_original_field(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td)/'core';out=Path(td)/'pages'
   root.mkdir();out.mkdir();d=root/'model-fields-native';d.mkdir()
   frames=lambda k:[{'hour':h,'file':f'{k}-{h:03d}.bin','encoding':'gzip-json','sha256':'a'*64,
    'bytes':100,'decodedBytes':200,'intervalHours':1 if k=='precipitation' else 0}
    for h in LEADS]
   products={kind:{'unit':UNITS[kind],'frames':frames(kind)} for kind in KINDS}
   index={'schema':'mid.icon-d2.native-fields.v2','productionApproved':True,'nativePoints':542040,
    'sourceInventorySha256':'a'*64,'run':'2026-11-02T03:00:00+00:00','modelId':'icon-d2',
    'sampling':'nearest-native-cell','products':products}
   (d/'index.json').write_text(json.dumps(index))
   with self.assertRaisesRegex(ValueError,'missing, untrusted'):
    admit(root,out,'20261102T0600',[])
   self.assertFalse(list(out.rglob('*.bin')))
   products['pressure']['frames'][1]['hour']=1
   (d/'index.json').write_text(json.dumps(index))
   with self.assertRaisesRegex(ValueError,'Duplicated'):
    admit(root,out,'20261102T0600',[])
 def test_rejects_unknown_product_matrix_even_when_marked_approved(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td)/'core';out=Path(td)/'pages';root.mkdir();out.mkdir()
   d=root/'model-fields-native';d.mkdir()
   (d/'index.json').write_text(json.dumps({'schema':'mid.icon-d2.native-fields.v2','productionApproved':True,
    'nativePoints':542040,'sourceInventorySha256':'a'*64,'run':'2026-11-02T03:00:00+00:00',
    'modelId':'icon-d2','sampling':'nearest-native-cell','products':{'temperature':{}}}))
   with self.assertRaisesRegex(ValueError,'matrix incomplete'):
    admit(root,out,'20261102T0600',[])
if __name__=='__main__':unittest.main()
