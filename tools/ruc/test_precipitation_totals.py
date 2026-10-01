import unittest
import numpy as np
from build_precipitation_totals import difference
class TotalsTests(unittest.TestCase):
 def test_cumulative_same_run_difference_and_rounding(self):
  np.testing.assert_array_equal(difference(np.array([2.,0.,0.]),np.array([5.2,.06,-.01])),[32,1,0])
 def test_reset_missing_and_invalid_are_rejected(self):
  for end in (np.array([-1.]),np.array([np.nan]),np.array([np.inf])):
   with self.assertRaises(ValueError):difference(np.array([0.]),end)
if __name__=='__main__':unittest.main()
