import json,tempfile,unittest
from pathlib import Path
from admit_d2_native_pages import admit,KINDS,LEADS,UNITS
class PagesNativeD2AdmissionTests(unittest.TestCase):
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
