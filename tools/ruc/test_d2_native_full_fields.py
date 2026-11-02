import unittest
import numpy as np
from d2_native_full_fields import derive_eight,sample_native,PRODUCT_UNITS,NATIVE_POINTS,strict_hourly_precipitation

class EightNativeFieldsTests(unittest.TestCase):
 def fixture(self):
  raw={
   't_2m':[273.15,290,float('nan'),300],
   'pmsl':[101000,100000,float('nan'),99000],
   'u_10m':[0,3,float('nan'),-2],
   'v_10m':[0,4,float('nan'),5],
   'vmax_10m':[0,10,float('nan'),30],
   'clct':[0,.5,float('nan'),1],
   'ww':[0,60,float('nan'),95],
   't':[285,290,float('nan'),295],
   'relhum':[0,.5,float('nan'),.85],
   'tot_prec':[1,2,float('nan'),4],
  }
  unit={**{f:'m s-1' for f in ('u_10m','v_10m','vmax_10m')},
        't_2m':'K','t':'K','pmsl':'Pa','clct':'1','relhum':'1',
        'ww':'Numeric','tot_prec':'kg m**-2'}
  return raw,unit,[1,1,float('nan'),2]
 def test_eight_computed_products_and_true_zero(self):
  raw,unit,prior=self.fixture()
  p=derive_eight(raw,unit,prior,'kg m**-2',points=4)
  self.assertEqual(set(p),set(PRODUCT_UNITS))
  self.assertAlmostEqual(p['temperature'][0],0,places=8)
  self.assertEqual(p['precipitation'][0],0)
  self.assertEqual(p['wind'][0],0)
  self.assertEqual(p['gust'][0],0)
  self.assertEqual(p['cloud'][0],0)
  self.assertEqual(p['sigwx'][0],0)
  self.assertAlmostEqual(p['pressure'][1],1000)
  self.assertAlmostEqual(p['wind'][1],18)
  self.assertAlmostEqual(p['gust'][1],36)
  self.assertAlmostEqual(p['cloud'][1],50)
  self.assertEqual(p['precipitation'][1],1)
  self.assertEqual(p['sigwx'][3],95)
  self.assertTrue(all(np.isnan(p[key][2]) for key in p))
  self.assertTrue(np.isfinite(p['thetae'][0]))
 def test_no_missing_to_zero_or_interpolation_at_mask_and_edges(self):
  values=np.array([0.,float('nan'),3.,5.])
  ids=np.array([[0,1],[2,4294967295]],dtype=np.uint32)
  s=sample_native(values,ids)
  self.assertEqual(s['values'][0,0],0)
  self.assertTrue(np.isnan(s['values'][0,1]))
  self.assertEqual(s['values'][1,0],3)
  self.assertTrue(np.isnan(s['values'][1,1]))
  self.assertEqual(s['validZeroNative'],1)
  self.assertEqual(s['nativeMissing'],1)
  self.assertEqual(s['displayMissing'],2)
  self.assertTrue(s['nativeExtremeNotSampled'])
 def test_precipitation_reset_fails_closed(self):
  raw,unit,prev=self.fixture()
  prev[1]=4
  with self.assertRaisesRegex(ValueError,r'reset.*negativeCells=1.*minDeltaMm=-2'):derive_eight(raw,unit,prev,unit['tot_prec'],points=4)
 def test_previous_precipitation_unit_drift_fails(self):
  raw,unit,prev=self.fixture()
  with self.assertRaisesRegex(ValueError,'Previous TOT_PREC'):derive_eight(raw,unit,prev,'mm',points=4)
 def test_wmo_code_is_categorical_not_smoothed(self):
  raw,unit,prev=self.fixture()
  raw['ww'][1]=60.4
  with self.assertRaisesRegex(ValueError,'categorical integers'):derive_eight(raw,unit,prev,unit['tot_prec'],points=4)
 def test_missing_source_component_fails_not_synthetic(self):
  raw,unit,prev=self.fixture()
  del raw['u_10m']
  with self.assertRaisesRegex(ValueError,'Missing original native source'):derive_eight(raw,unit,prev,unit['tot_prec'],points=4)
 def test_native_coordinate_point_count_and_invalid_values(self):
  raw,unit,prev=self.fixture()
  with self.assertRaisesRegex(ValueError,'geometry|grid'):derive_eight(raw,unit,prev,unit['tot_prec'],points=NATIVE_POINTS)
  raw,unit,prev=self.fixture()
  raw['vmax_10m'][0]=float('inf')
  with self.assertRaisesRegex(ValueError,'Infinity'):derive_eight(raw,unit,prev,unit['tot_prec'],points=4)
 def test_outlier_is_not_clipped(self):
  raw,unit,prev=self.fixture()
  raw['t_2m'][1]=900
  with self.assertRaisesRegex(ValueError,'Unphysical original native temperature'):derive_eight(raw,unit,prev,unit['tot_prec'],points=4)
 def test_no_fictitious_valid_pixel_from_bad_lookup(self):
  with self.assertRaisesRegex(ValueError,'index'):sample_native(np.array([1.,2.]),np.array([[0,2]],dtype=np.uint32))
  with self.assertRaisesRegex(ValueError,'budget'):sample_native(np.array([1.,2.]),np.zeros((3,3),dtype=np.uint32),limit=4)
 def test_source_domain_mathematics_matches_contract(self):
  raw,unit,prev=self.fixture()
  p=derive_eight(raw,unit,prev,unit['tot_prec'],points=4)
  for key,values in p.items():
   v=values[np.isfinite(values)]
   self.assertTrue((v>=dict(temperature=-100,pressure=800,wind=0,gust=0,cloud=0,thetae=150,sigwx=0,precipitation=0)[key]).all())
   self.assertTrue(np.isfinite(v).all())

 def test_exact_original_ccsds_quantisation_is_unknown_not_zero(self):
  previous=np.ones(40);current=previous.copy()
  previous[7]=1/4096;current[7]=0
  fine={'packingType':'grid_ccsds','binaryScaleFactor':-12,'decimalScaleFactor':0,'bitsPerValue':16,'bitmapPresent':1,'referenceValue':0.0}
  coarse={**fine,'binaryScaleFactor':-11}
  delta,n=strict_hourly_precipitation(current,previous,current_packing=coarse,previous_packing=fine)
  self.assertEqual(n,1);self.assertTrue(np.isnan(delta[7]));self.assertEqual(delta[0],0)
  raw,unit,_=self.fixture()
  raw={k:list(v)*10 for k,v in raw.items()}
  raw['tot_prec']=current
  products=derive_eight(raw,unit,previous,unit['tot_prec'],points=40,current_packing=coarse,previous_packing=fine)
  self.assertTrue(np.isnan(products['precipitation'][7]))
  self.assertEqual(products['precipitation'][0],0)
 def test_true_reset_missing_packing_and_widespread_ambiguity_fail(self):
  previous=np.ones(40);current=previous.copy()
  fine={'packingType':'grid_ccsds','binaryScaleFactor':-12,'decimalScaleFactor':0,'bitsPerValue':16,'bitmapPresent':1,'referenceValue':0.0}
  coarse={**fine,'binaryScaleFactor':-11}
  current[5]=.9
  with self.assertRaisesRegex(ValueError,'reset beyond packing'):
   strict_hourly_precipitation(current,previous,current_packing=coarse,previous_packing=fine)
  current[5]=1-1/4096
  with self.assertRaisesRegex(ValueError,'incompatible packing'):
   strict_hourly_precipitation(current,previous)
  with self.assertRaisesRegex(ValueError,'incompatible packing'):
   strict_hourly_precipitation(current,previous,current_packing={**coarse,'referenceValue':100},previous_packing=fine)
  current[:8]=1-1/4096
  with self.assertRaisesRegex(ValueError,'ambiguity >10%'):
   strict_hourly_precipitation(current,previous,current_packing=coarse,previous_packing=fine)
if __name__=='__main__':unittest.main()
