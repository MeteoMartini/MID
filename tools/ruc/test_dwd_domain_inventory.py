import unittest
import numpy as np
from pilot_dwd_domain_inventory import field_statistics,validate_collection,assert_bitmap_decoding,assert_grib_identity,assert_dwd_native_total_precipitation,validate_dwd_precipitation_extra_headers,assert_run_cadence,assert_grib_valid_time

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
  r=[{'model':'icon-d2','parameter':'pmsl','run':f'20261024T{i*3:02d}00','leadHours':1} for i in range(3)]
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
  r=[{'model':'icon-d2','parameter':'pmsl','run':f'20261024T{i*3:02d}00','leadHours':1} for i in range(3)]
  with self.assertRaisesRegex(ValueError,'Incomplete or unexpected'):
   validate_collection(r,parameters={'icon-d2':['pmsl']},leads={'icon-d2/pmsl':[1,3]})
 def test_cross_parameter_mixed_runs_fail(self):
  a=[{'model':'icon-d2','parameter':'pmsl','run':f'20261024T{i*3:02d}00','leadHours':1} for i in range(3)]
  b=[{'model':'icon-d2','parameter':'t_2m','run':f'20261024T{i*3:02d}00','leadHours':1} for i in (1,2,3)]
  with self.assertRaisesRegex(ValueError,'Mixed model cycles'):
   validate_collection(a+b,parameters={'icon-d2':['pmsl','t_2m']},leads={'icon-d2/pmsl':[1],'icon-d2/t_2m':[1]})
 def test_no_bitmap_cannot_hide_nan(self):
  with self.assertRaisesRegex(ValueError,'Unmasked'):
   assert_bitmap_decoding([0,np.nan],0)
 def test_bitmap_validates_explicit_missing(self):
  assert_bitmap_decoding([0,np.nan,2],1,[1,0,1])
  with self.assertRaisesRegex(ValueError,'differ'):
   assert_bitmap_decoding([0,0,2],1,[1,0,1])
 def test_bad_bitmap_shapes_fails(self):
  with self.assertRaisesRegex(ValueError,'Section-6'):
   assert_bitmap_decoding([0,2],1,[1,0,1])
 def test_original_dwd_tot_prec_bundled_quarter_hours_never_become_hourly_forecasts(self):
  from datetime import datetime,timedelta
  row={'model':'icon-d2','parameter':'tot_prec','run':'20261031T2100','leadHours':0}
  first={'centre':78,'discipline':0,'parameterCategory':1,'parameterNumber':52,
         'dataDate':20261031,'dataTime':2100,'gridType':'unstructured_grid',
         'typeOfLevel':'surface','level':0,'units':'kg m**-2','uuidOfHGrid':'c6b12daa91ad64045b26c1b6452a2a20',
         'numberOfGridUsed':47,'numberOfGridInReference':1,'numberOfPoints':542040,
         'typeOfStatisticalProcessing':1,'numberOfTimeRanges':1,
         'stepUnits':'0','startStep':0,'endStep':0,'stepRange':'0m',
         'indicatorOfUnitForTimeRange':0,'indicatorOfUnitOfTimeRange':0,
         'validityDate':20261031,'validityTime':2100}
  extras=[]
  for minute in (15,30,45):
   dt=datetime(2026,10,31,21)+timedelta(minutes=minute)
   extras.append(dict(first,endStep=minute,stepRange=f'0m-{minute}m',
                      validityDate=int(dt.strftime('%Y%m%d')),validityTime=int(dt.strftime('%H%M'))))
  self.assertEqual(validate_dwd_precipitation_extra_headers(row,first,extras),[15,30,45])
  for key,value in [('endStep',60),('stepRange','0m-1m'),('units','kg m**-2 s**-1'),
                    ('numberOfPoints',1),('typeOfStatisticalProcessing',0),('uuidOfHGrid','invalid'),
                    ('validityTime',2146),('stepUnits','1'),('indicatorOfUnitForTimeRange',1)]:
   changed=[dict(v) for v in extras];changed[1][key]=value
   with self.subTest(key=key),self.assertRaisesRegex(ValueError,'semantics drift'):
    validate_dwd_precipitation_extra_headers(row,first,changed)
  with self.assertRaisesRegex(ValueError,'count drift'):
   validate_dwd_precipitation_extra_headers(row,first,extras[:2])
  with self.assertRaisesRegex(ValueError,'forbidden'):
   validate_dwd_precipitation_extra_headers(dict(row,parameter='pmsl'),first,extras)
  later=dict(row,run='20261101T0000',leadHours=1)
  first2=dict(first,dataDate=20261101,dataTime=0,endStep=60,stepRange='0m-60m',
              validityDate=20261101,validityTime=100)
  extra2=[]
  for minute in (75,90,105):
   dt=datetime(2026,11,1,0)+timedelta(minutes=minute)
   extra2.append(dict(first2,endStep=minute,stepRange=f'0m-{minute}m',
                      validityDate=int(dt.strftime('%Y%m%d')),validityTime=int(dt.strftime('%H%M'))))
  self.assertEqual(validate_dwd_precipitation_extra_headers(later,first2,extra2),[75,90,105])
 def test_dwd_local_total_precipitation_requires_cumulative_mass_not_rate(self):
  row={'model':'icon-d2','parameter':'tot_prec','run':'20261101T0300','leadHours':6,'wmoParameter':[0,1,52]}
  assert_dwd_native_total_precipitation(row,78,'kg m**-2',1,0,6)
  assert_dwd_native_total_precipitation(row,78,'kg m-2',1,0,6)
  for center,unit,stat,start,end in [(7,'kg m**-2',1,0,6),(78,'kg m**-2 s**-1',1,0,6),
                                     (78,'kg m**-2',0,0,6),(78,'kg m**-2',1,3,6),(78,'kg m**-2',1,0,5)]:
   with self.assertRaisesRegex(ValueError,'semantics drift'):
    assert_dwd_native_total_precipitation(row,center,unit,stat,start,end)
  with self.assertRaisesRegex(ValueError,'source/parameter mismatch'):
   assert_dwd_native_total_precipitation(dict(row,wmoParameter=[0,1,8]),78,'kg m**-2',1,0,6)
 def test_wmo_identity_must_match_original(self):
  assert_grib_identity([0,3,1],{'wmoParameter':[0,3,1],'stepType':'instant'},'instant')
  with self.assertRaisesRegex(ValueError,'identity drift'):
   assert_grib_identity([0,3,1],{'wmoParameter':[0,3,1],'stepType':'accum'},'instant')
 def test_missing_wmo_identity_fails(self):
  with self.assertRaisesRegex(ValueError,'pinned WMO'):
   assert_grib_identity([0,3,1],{'stepType':'instant'},'instant')
 def test_all_scope_must_be_present(self):
  a=[{'model':'icon-d2','parameter':'pmsl','run':f'20261024T{i*3:02d}00','leadHours':1} for i in range(3)]
  with self.assertRaisesRegex(ValueError,'Insufficient'):
   validate_collection(a,parameters={'icon-d2':['pmsl','t_2m']},leads={'icon-d2/pmsl':[1],'icon-d2/t_2m':[1]})
class RunCadenceTests(unittest.TestCase):
 def test_consecutive_ruc_hourly_across_midnight(self):
  assert_run_cadence('icon-d2-ruc',['20261024T2300','20261025T0000','20261025T0100'])
 def test_consecutive_icon_threehourly_across_midnight(self):
  assert_run_cadence('icon-d2',['20261024T2100','20261025T0000','20261025T0300'])
 def test_disconnected_ruc_hours_rejected(self):
  with self.assertRaisesRegex(ValueError,'not consecutive'):
   assert_run_cadence('icon-d2-ruc',['20261024T1200','20261024T1300','20261024T1500'])
 def test_disconnected_icon_cycles_rejected(self):
  with self.assertRaisesRegex(ValueError,'not consecutive'):
   assert_run_cadence('icon-d2',['20261024T0000','20261024T0300','20261024T0900'])
 def test_icon_offcycle_threehour_spacing_rejected(self):
  with self.assertRaisesRegex(ValueError,'misaligned'):
   assert_run_cadence('icon-d2',['20261024T0100','20261024T0400','20261024T0700'])
 def test_ruc_nonzero_minutes_rejected(self):
  with self.assertRaisesRegex(ValueError,'misaligned'):
   assert_run_cadence('icon-d2-ruc',['20261024T1250','20261024T1350','20261024T1450'])
 def test_invalid_format_rejected(self):
  with self.assertRaisesRegex(ValueError,'Invalid original'):
   assert_run_cadence('icon-d2-ruc',['A','B','C'])
 def test_noncanonical_utc_timestamp_rejected(self):
  with self.assertRaisesRegex(ValueError,'Invalid original'):
   assert_run_cadence('icon-d2-ruc',['20261024T900','20261024T1000','20261024T1100'])
 def test_collection_ruc_gap_enforced(self):
  runs=['20261024T1200','20261024T1300','20261024T1500']
  records=[{'model':'icon-d2-ruc','parameter':'pmsl','run':run,'leadHours':0} for run in runs]
  with self.assertRaisesRegex(ValueError,'not consecutive'):
   validate_collection(records,parameters={'icon-d2-ruc':['pmsl']},leads={'icon-d2-ruc/pmsl':[0]})
 def test_duplicate_runs_rejected(self):
  with self.assertRaisesRegex(ValueError,'not consecutive'):
   assert_run_cadence('icon-d2-ruc',['20261024T1300']*3)


class GribValidityTests(unittest.TestCase):
 def test_original_valid_zero_lead(self):
  assert_grib_valid_time('20261024T1200',0,20261024,1200)
 def test_original_valid_day_rollover(self):
  assert_grib_valid_time('20261024T2300',2,20261025,100)
 def test_original_wrong_validity_rejected(self):
  with self.assertRaisesRegex(ValueError,'differs'):
   assert_grib_valid_time('20261024T1200',3,20261024,1800)
 def test_invalid_original_valid_date_rejected(self):
  with self.assertRaisesRegex(ValueError,'Invalid original GRIB'):
   assert_grib_valid_time('20261024T1200',3,20261324,1500)


class NativeCoordinateTests(unittest.TestCase):
 def exercise(self, *, bad_sha=False, drift=False, units='rad', point_count=3, extra=False):
  import hashlib,sys,tempfile,types
  from pathlib import Path
  from unittest.mock import patch
  from pilot_dwd_domain_inventory import native_coordinates
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);bindings={}
   for name in ('latitude','longitude'):
    p=root/name;p.write_bytes(name.encode())
    bindings[name]={'path':name,'sha256':'0'*64 if bad_sha else hashlib.sha256(p.read_bytes()).hexdigest()}
   identities={'uuidOfHGrid':'abc','numberOfGridUsed':47,'numberOfGridInReference':1,'numberOfPoints':3}
   def get(handle,key):
    if key in identities:return 'wrong' if drift and handle and key=='uuidOfHGrid' else identities[key]
    return {'gridType':'unstructured_grid','edition':2,'centre':78,'discipline':0,'parameterCategory':191,'parameterNumber':handle,'units':({'latitude':'Degree N','longitude':'Degree E'}['latitude' if handle==1 else 'longitude'] if units=='dwd-degrees' else units)}[key]
   handles=iter([1,99] if extra else [1,None,2,None])
   fake=types.SimpleNamespace(codes_get=get,codes_get_long=get,codes_get_array=lambda h,k: np.array([.1,.2,.3])[:point_count],codes_grib_new_from_file=lambda f:next(handles),codes_release=lambda h:None)
   with patch.dict(sys.modules,{'eccodes':fake}):
    return native_coordinates({'nativeCoordinates':bindings},root,0)
 def test_native_index_order_and_radians_are_preserved(self):
  lat,lon,origin=self.exercise()
  np.testing.assert_allclose(lat,np.rad2deg([.1,.2,.3]));np.testing.assert_array_equal(lat,lon)
  self.assertEqual(set(origin),{'latitude','longitude'})
 def test_original_dwd_coordinate_units_preserve_degrees(self):
  lat,lon,_=self.exercise(units='dwd-degrees')
  np.testing.assert_array_equal(lat,[.1,.2,.3]);np.testing.assert_array_equal(lon,lat)
 def test_hash_drift_rejected_before_decode(self):
  with self.assertRaisesRegex(ValueError,'SHA drift'):self.exercise(bad_sha=True)
 def test_same_length_wrong_uuid_is_rejected(self):
  with self.assertRaisesRegex(ValueError,'identity mismatch'):self.exercise(drift=True)
 def test_unverified_units_rejected(self):
  with self.assertRaisesRegex(ValueError,'units'):self.exercise(units='metres')
 def test_missing_coordinate_cell_rejected(self):
  with self.assertRaisesRegex(ValueError,'Incomplete'):self.exercise(point_count=2)
 def test_multiple_coordinate_messages_rejected(self):
  with self.assertRaisesRegex(ValueError,'Ambiguous'):self.exercise(extra=True)
 def test_absent_binding_never_invents_coordinates(self):
  import sys,types,tempfile
  from pathlib import Path
  from unittest.mock import patch
  from pilot_dwd_domain_inventory import native_coordinates
  fake=types.SimpleNamespace(**{k:None for k in ['codes_grib_new_from_file','codes_get','codes_get_array','codes_get_long','codes_release']})
  with patch.dict(sys.modules,{'eccodes':fake}),tempfile.TemporaryDirectory() as td:
   with self.assertRaisesRegex(ValueError,'SHA-pinned CLAT/CLON'):native_coordinates({},Path(td),0)

if __name__=='__main__': unittest.main()
