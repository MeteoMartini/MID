import unittest
import numpy as np
from pilot_dwd_domain_inventory import field_statistics,validate_collection

class DomainInventoryTests(unittest.TestCase):
 def test_valid_zero_and_missing_preserved(self):
  x=field_statistics([43,44,45],[5,6,7],[0,float('nan'),12],'regular_ll',bitmap_present=1,number_of_points=3)
  self.assertEqual((x['validPoints'],x['missingPoints'],x['realZeroPoints']),(2,1,1))
  self.assertEqual(x['validLatitudeRange'],[43,45])
 def test_missing_coordinate_fails(self):
  with self.assertRaisesRegex(ValueError,'coordinates'):
   field_statistics([43,float('nan')],[5,6],[1,2],'unstructured_grid',bitmap_present=1,number_of_points=2)
 def test_unsupported_grid_fails(self):
  with self.assertRaisesRegex(ValueError,'grid type'):
   field_statistics([43,44],[5,6],[1,2],'arbitrary',bitmap_present=0,number_of_points=2)
 def test_invalid_number_of_points_fails(self):
  with self.assertRaisesRegex(ValueError,'point count'):
   field_statistics([43,44],[5,6],[1,2],'rotated_ll',bitmap_present=0,number_of_points=3)
 def test_whole_field_missing_fails(self):
  with self.assertRaisesRegex(ValueError,'No covered'):
   field_statistics([43,44],[5,6],[np.nan,np.nan],'regular_ll',bitmap_present=1,number_of_points=2)
 def test_three_distinct_runs_required(self):
  r=[{'model':'icon-d2','parameter':'pmsl','run':str(i),'leadHours':1} for i in range(3)]
  a=validate_collection(r,parameters={'icon-d2':['pmsl']},leads={'icon-d2/pmsl':[1]})
  self.assertFalse(a['fullDomainProductionApproved'])
  self.assertEqual(a['runCounts']['icon-d2/pmsl'],3)
 def test_duplicate_cannot_substitute_run(self):
  r=[{'model':'icon-d2','parameter':'pmsl','run':'1','leadHours':1}]*3
  with self.assertRaisesRegex(ValueError,'duplicate'):
   validate_collection(r,parameters={'icon-d2':['pmsl']},leads={'icon-d2/pmsl':[1]})
 def test_just_one_run_fails(self):
  with self.assertRaisesRegex(ValueError,'Insufficient'):
   validate_collection([{'model':'icon-d2-ruc','parameter':'clct','run':'A','leadHours':3}],parameters={'icon-d2-ruc':['clct']},leads={'icon-d2-ruc/clct':[3]})
 def test_mismatched_leads_fail_closed(self):
  r=[{'model':'icon-d2','parameter':'pmsl','run':str(i),'leadHours':1} for i in range(3)]
  with self.assertRaisesRegex(ValueError,'Incomplete or unexpected'):
   validate_collection(r,parameters={'icon-d2':['pmsl']},leads={'icon-d2/pmsl':[1,3]})
 def test_cross_parameter_mixed_runs_fail(self):
  a=[{'model':'icon-d2','parameter':'pmsl','run':str(i),'leadHours':1} for i in range(3)]
  b=[{'model':'icon-d2','parameter':'t_2m','run':str(i),'leadHours':1} for i in (1,2,3)]
  with self.assertRaisesRegex(ValueError,'Mixed model cycles'):
   validate_collection(a+b,parameters={'icon-d2':['pmsl','t_2m']},leads={'icon-d2/pmsl':[1],'icon-d2/t_2m':[1]})
 def test_all_scope_must_be_present(self):
  a=[{'model':'icon-d2','parameter':'pmsl','run':str(i),'leadHours':1} for i in range(3)]
  with self.assertRaisesRegex(ValueError,'Insufficient'):
   validate_collection(a,parameters={'icon-d2':['pmsl','t_2m']},leads={'icon-d2/pmsl':[1],'icon-d2/t_2m':[1]})
if __name__=='__main__': unittest.main()
