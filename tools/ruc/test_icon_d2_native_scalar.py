import unittest
import numpy as np
from pilot_icon_d2_native_scalar import map_native,NODATA

class NativeIconD2ScalarPilotTests(unittest.TestCase):
 def test_missing_is_not_zero_and_valid_zero_survives(self):
  values=np.array([float("nan"),0,100,50.],dtype=np.float32)
  lookup=np.array([[0,1],[2,NODATA]],dtype="<u4")
  result=map_native(values,lookup,"%","clct")
  self.assertEqual(result["values"],[None,0.,100.,None])
  self.assertEqual(result["originalMissingPoints"],1)
  self.assertEqual(result["displayMissingCells"],2)
  self.assertEqual((result["originalMin"],result["originalMax"]),(0,100))
  self.assertEqual((result["displayMin"],result["displayMax"]),(0,100))

 def test_all_original_extremes_retained_even_if_not_displayed(self):
  values=np.array([273.15,288.15,258.15,330.15],dtype=np.float32)
  lookup=np.array([[0,1],[2,NODATA]],dtype="<u4")
  r=map_native(values,lookup,"K","t_2m")
  self.assertTrue(r["nativeExtremeNotSampled"])
  self.assertGreater(r["originalMax"],r["displayMax"])
  self.assertEqual(r["kind"],"temperature")
  self.assertEqual(r["unit"],"°C")

 def test_original_native_units_and_geometry_fail_closed(self):
  values=np.array([273.15,274.15,275.15],dtype=np.float32)
  lookup=np.array([[0,1],[2,NODATA]],dtype="<u4")
  for unit in ("°C","K/2","",None):
   with self.subTest(unit=unit),self.assertRaises(ValueError):map_native(values,lookup,unit,"t_2m")
  with self.assertRaisesRegex(ValueError,"exceeds"):map_native(values,np.array([[0,4]],dtype="<u4"),"K","t_2m")
  with self.assertRaisesRegex(ValueError,"fully missing"):map_native(np.array([float("nan")]),np.array([[0]],dtype="<u4"),"K","t_2m")
  with self.assertRaises(ValueError):map_native(values,np.array([0,1],dtype="<u4"),"K","t_2m")
  with self.assertRaises(ValueError):map_native(values,lookup,"K","invented_parameter")

 def test_no_silent_extreme_clamp_or_negative_gust(self):
  with self.assertRaisesRegex(ValueError,"physical extremes"):
   map_native(np.array([1000.,270.]),np.array([[0,1]],dtype="<u4"),"K","t_2m")
  with self.assertRaisesRegex(ValueError,"physical extremes"):
   map_native(np.array([-0.1,12.]),np.array([[0,1]],dtype="<u4"),"m s-1","vmax_10m")

if __name__=="__main__":unittest.main()
