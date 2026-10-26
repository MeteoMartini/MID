import unittest
from ruc_horizon_probe import verify_hourly_listing,select_probes
class HorizonListingTests(unittest.TestCase):
 def files(self,hours=27):return [f'https://opendata.dwd.de/PT{h:03d}H00M.grib2' for h in range(hours+1)]
 def test_complete_native_hours(self):self.assertEqual(verify_hourly_listing(self.files(),27),28)
 def test_newest_partial_run_rejected(self):
  with self.assertRaises(ValueError):verify_hourly_listing(self.files(26),27)
 def test_duplicate_hour_rejected(self):
  with self.assertRaises(ValueError):verify_hourly_listing(self.files()+['https://opendata.dwd.de/other/PT027H00M.grib2'],27)
 def test_unparseable_file_rejected(self):
  with self.assertRaises(ValueError):verify_hourly_listing(self.files()+['https://opendata.dwd.de/unknown.grib2'],27)
 def test_native_subhourly_and_later_leads_not_relabelled(self):
  self.assertEqual(verify_hourly_listing(self.files()+['https://opendata.dwd.de/PT026H55M.grib2','https://opendata.dwd.de/PT028H00M.grib2'],27),28)
class HorizonParallelAdmissionTests(unittest.TestCase):
 def execute(self,decisions,needed=3):
  batches=[];events=[]
  def runner(batch):
   batches.append(list(batch))
   return [{'run':name,'result':{'run':name,'hours':27}} if decisions[name]
           else {'run':name,'error':'incomplete source'} for name in batch]
  ok=select_probes(list(decisions),needed,runner,events.append)
  return ok,batches,events
 def test_three_complete_runs_two_then_one(self):
  ok,batches,events=self.execute({'a':True,'b':True,'c':True,'d':True})
  self.assertTrue(ok);self.assertEqual(batches,[['a','b'],['c']])
  self.assertEqual([row['run'] for row in events],['a','b','c'])
 def test_incomplete_middle_run_replaced_in_priority_order(self):
  ok,batches,events=self.execute({'a':True,'b':False,'c':True,'d':True})
  self.assertTrue(ok);self.assertEqual(batches,[['a','b'],['c','d']])
  self.assertEqual([x['run'] for x in events if 'result' in x],['a','c','d'])
 def test_missing_three_complete_runs_blocks(self):
  ok,batches,_=self.execute({'a':True,'b':False,'c':False})
  self.assertFalse(ok);self.assertEqual(batches,[['a','b'],['c']])
 def test_reject_swapped_or_missing_worker_results(self):
  for rows in ([{'run':'b','result':{'run':'b','hours':27}},
                {'run':'a','result':{'run':'a','hours':27}}],
               [{'run':'a','result':{'run':'a','hours':27}}]):
   with self.assertRaisesRegex(ValueError,'identity/order/count'):
    select_probes(['a','b'],2,lambda group:rows,lambda row:None)
 def test_reject_bad_utc_horizon_or_mixed_status(self):
  for row in ({'run':'a','result':{'run':'a','hours':14}},
              {'run':'a','result':{'run':'other','hours':27}},
              {'run':'a','result':{'run':'a','hours':27},'error':'bad'}):
   with self.assertRaises(ValueError):
    select_probes(['a'],1,lambda group:[row],lambda row:None)
 def test_reject_duplicate_candidates(self):
  with self.assertRaisesRegex(ValueError,'duplicate'):
   select_probes(['a','a','b'],3,lambda batch:[],lambda row:None)

if __name__=='__main__':unittest.main()