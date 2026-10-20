import unittest
from datetime import datetime,timezone
from native_ifs_0p1_preflight import SPECS,validate,parse_run
RUN=datetime(2026,10,20,6,tzinfo=timezone.utc)
def fixture(spec):
 return dict(edition=2,centre="ecmf",dataDate=20261020,dataTime=600,
 validityDate=20261020,validityTime=600,stepType="instant",shortName=spec["param"],
 typeOfLevel=spec["typeOfLevel"],level=spec["level"],units=spec["units"],
 gridType="regular_ll",Ni=3600,Nj=1801,numberOfPoints=6483600,
 iDirectionIncrementInDegrees=.1,jDirectionIncrementInDegrees=.1,bitmapPresent=0,bitsPerValue=12)
class PilotTests(unittest.TestCase):
 def test_cycle_utc(self):
  self.assertEqual(parse_run(RUN),RUN)
  self.assertRaises(ValueError,parse_run,datetime(2026,10,20,7))
 def test_three_native_fields(self):
  for s in SPECS:
   self.assertTrue(validate(fixture(s),RUN,s,[max(s["min"],1)]*7)["passed"],s["id"])
 def test_wrong_source(self):
  x=fixture(SPECS[0]);x["centre"]="kwbc"
  self.assertFalse(validate(x,RUN,SPECS[0],[280]*7)["passed"])
 def test_wrong_grid(self):
  for key,val in (("Ni",1440),("gridType","reduced_gg"),("iDirectionIncrementInDegrees",.25)):
   x=fixture(SPECS[0]);x[key]=val
   self.assertFalse(validate(x,RUN,SPECS[0],[280]*7)["passed"],key)
 def test_valid_time(self):
  x=fixture(SPECS[0]);x["validityTime"]=1200
  self.assertFalse(validate(x,RUN,SPECS[0],[280]*7)["passed"])
 def test_vertical_and_units(self):
  for key,val in (("level",850),("units","C"),("stepType","accum")):
   x=fixture(SPECS[0]);x[key]=val
   self.assertFalse(validate(x,RUN,SPECS[0],[280]*7)["passed"])
 def test_missing_not_zero(self):
  y=validate(fixture(SPECS[0]),RUN,SPECS[0],[280,None,281,282,283,284,285])
  self.assertTrue(y["passed"]);self.assertEqual(y["samples"]["missing"],1)
  self.assertFalse(validate(fixture(SPECS[0]),RUN,SPECS[0],[0]*7)["passed"])
 def test_24_hour_validity_and_boundary(self):
  x=fixture(SPECS[0])
  x["validityDate"]=20261021
  self.assertTrue(validate(x,RUN,SPECS[0],[280]*7,lead_hours=24)["passed"])
  self.assertFalse(validate(x,RUN,SPECS[0],[280]*7,lead_hours=0)["passed"])
  self.assertRaises(ValueError,validate,x,RUN,SPECS[0],[280]*7,lead_hours=23)
 def test_outliers_fail_not_smoothed(self):
  self.assertFalse(validate(fixture(SPECS[0]),RUN,SPECS[0],[400]*7)["passed"])
if __name__=="__main__":unittest.main()
