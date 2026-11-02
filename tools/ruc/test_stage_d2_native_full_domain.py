import gzip,hashlib,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from stage_d2_native_full_domain import (stage_native_site,qualified_one,KINDS,LEADS,NATIVE_POINTS)
class NativeD2TransportTests(unittest.TestCase):
 def fake(self,root,lead,kind,expected_run=None,inventory=None):
  self.assertIn(lead,LEADS);self.assertIn(kind,KINDS)
  lats=[44.1,47.1,50.1,53.1,56.1];lons=[0.1,6.1,12.1,18.1,24.1]
  values=([10000]*25 if kind=='pressure' else [None if i==7 else 0 if i==0 else 100 for i in range(25)])
  uncertain=1 if kind=='precipitation' else 0
  return ('20261102T0300','f'*64,{
   'schema':'mid.dwd.native-eight-field-pilot.v1','productionApproved':False,
   'sourceInventorySha256':'f'*64,'nativePoints':NATIVE_POINTS,'lats':lats,'lons':lons,
   'originalExtrema':{'nativeMin':0,'nativeMax':10},
   'negativePackingUncertainNoDataCells':uncertain,'values':values,
   'time':f'2026-11-02T{(3+lead)%24:02d}:00:00+00:00'
  },{'file':f'{kind}-{lead:03d}.json.gz','bytes':1000,'sha256':'f'*64},'a'*64)
 def test_complete_candidate_site_without_publish_permission(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder)/'sources';root.mkdir()
   dest=Path(folder)/'site'
   with patch('stage_d2_native_full_domain.qualified_one',side_effect=self.fake):
    data=stage_native_site(root,dest)
   self.assertEqual(data['fields'],72)
   index=json.loads((dest/'index.json').read_bytes())
   self.assertFalse(index['productionApproved'])
   self.assertEqual(index['nativePoints'],542040)
   self.assertEqual(set(index['products']),set(KINDS))
   self.assertEqual(len(list(dest.glob('*.bin'))),72)
   frame=index['products']['precipitation']['frames'][0]
   binary=(dest/frame['file']).read_bytes()
   self.assertEqual(hashlib.sha256(binary).hexdigest(),frame['sha256'])
   one=json.loads(gzip.decompress(binary))
   self.assertIsNone(one['values'][7])
   self.assertEqual(one['values'][0],0)
   self.assertEqual(one['negativePackingUncertainNoDataCells'],1)
   self.assertEqual(one['sampling'],'nearest-native-cell')
 def test_incomplete_or_duplicate_frame_is_not_published(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder)/'sources';root.mkdir()
   output=Path(folder)/'site'
   def fail_at(root,lead,kind,*args):
    if lead==3 and kind=='cloud':raise ValueError('Missing original native pilot frame')
    return self.fake(root,lead,kind)
   with patch('stage_d2_native_full_domain.qualified_one',side_effect=fail_at):
    with self.assertRaisesRegex(ValueError,'Missing original'):
     stage_native_site(root,output)
   self.assertFalse(output.exists())
 def test_outside_original_staging_only(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);out=root/'site'
   with self.assertRaisesRegex(ValueError,'Immutable disjoint'):
    stage_native_site(root,out)
if __name__=='__main__':unittest.main()
