import unittest
from ruc_horizon_probe import verify_hourly_listing
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
if __name__=='__main__':unittest.main()
