import unittest
from pathlib import Path
import tempfile
from d2_native_eight_bundle import checked_source,build_original_eight

class EightOriginalBundleTests(unittest.TestCase):
 def fixture(self):
  return [{'model':'icon-d2','run':'20261101T1200','parameter':'t_2m',
           'leadHours':6,'sha256':'a'*64}]
 def test_qualified_exact_original_record_identity(self):
  rows=self.fixture()
  self.assertEqual(checked_source(rows,'20261101T1200','t_2m',6),rows[0])
  with self.assertRaisesRegex(ValueError,'missing/duplicated'):
   checked_source(rows,'20261101T1200','t_2m',5)
  with self.assertRaisesRegex(ValueError,'missing/duplicated'):
   checked_source(rows,'20261101T0900','t_2m',6)
  with self.assertRaisesRegex(ValueError,'missing/duplicated'):
   checked_source(rows*2,'20261101T1200','t_2m',6)
 def test_unsupported_leads_and_disjoint_sandbox_guard(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);manifest=root/'inventory-input.json'
   manifest.write_text('{}')
   for lead in (-1,0,49,1.5,True):
    with self.subTest(lead=lead),self.assertRaisesRegex(ValueError,'Invalid D2'):
     build_original_eight(root,manifest,root/'outside',lead)
   with self.assertRaisesRegex(ValueError,'immutable disjoint'):
    build_original_eight(root,manifest,root/'output',6)
 def test_missing_original_inventory_fails_closed(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);manifest=root/'inventory-input.json'
   manifest.write_text('{}')
   with self.assertRaisesRegex(ValueError,'Unqualified'):
    build_original_eight(root,manifest,root.parent/'external-do-not-write',6)
 def test_missing_previous_precip_hour_is_never_filled(self):
  rows=self.fixture()
  with self.assertRaisesRegex(ValueError,'missing/duplicated'):
   checked_source(rows,'20261101T1200','tot_prec',5)
if __name__=='__main__':unittest.main()
