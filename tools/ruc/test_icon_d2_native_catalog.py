import unittest
from pilot_icon_d2_native_catalog import (
 FIELDS,LEADS,TOT_PREC_PREVIOUS,Hrefs,catalogue,cycles,select_name,select_coordinate,parse_last_run,pin_original_inventory
)

def html_for(url):
 parts=url.rstrip("/").split("/")
 field=parts[-1];hour=parts[-2]
 # Three consecutive deterministic cycles: 00/03/06.
 stamp={"00":"2026110100","03":"2026110103","06":"2026110106"}[hour]
 prefix="icon-d2_germany_icosahedral_"
 if field in ("clat","clon"):
  names=[prefix+"time-invariant_"+stamp+"_000_0_"+field+".grib2.bz2"]
 else:
  requested=(0,*LEADS,*TOT_PREC_PREVIOUS) if field=="tot_prec" else LEADS
  kind="pressure-level" if field in ("t","relhum") else "single-level"
  level="850" if field in ("t","relhum") else "2d"
  names=[prefix+kind+"_"+stamp+"_"+str(h).zfill(3)+"_"+level+"_"+field+".grib2.bz2" for h in requested]
 return "<html>"+ "".join('<a href="'+name+'">'+name+"</a>" for name in names)+"</html>"

class NativeD2CatalogTests(unittest.TestCase):
 def test_three_consecutive_utc_d2_cycles(self):
  self.assertEqual(cycles("2026110106"),["2026110100","2026110103","2026110106"])
  self.assertEqual(cycles("2026110100"),["2026103118","2026103121","2026110100"])
  for bad in ("2026110101","2026110124","2026110106Z","20261101","2026-11-01T06"):
   with self.subTest(bad=bad),self.assertRaises(ValueError):parse_last_run(bad)

 def test_time_invariant_native_geometry_uses_sha_grid_identity_not_run_filename(self):
  # Official DWD time-invariant CLAT/CLON can be older than forecast cycles.
  old="icon-d2_germany_icosahedral_time-invariant_2026031306_000_0_clat.grib2.bz2"
  self.assertEqual(select_coordinate([old],"clat","2026110106"),old)
  with self.assertRaisesRegex(ValueError,"from future"):
   select_coordinate(["icon-d2_germany_icosahedral_time-invariant_2026120106_000_0_clat.grib2.bz2"],"clat","2026110106")
  with self.assertRaisesRegex(ValueError,"not uniquely"):
   select_coordinate([old,"icon-d2_germany_icosahedral_time-invariant_2026020106_000_0_clat.grib2.bz2"],"clat","2026110106")
  with self.assertRaisesRegex(ValueError,"not uniquely"):
   select_coordinate([old.replace("icosahedral","regular-lat-lon")],"clat","2026110106")
 def test_complete_native_directory_plan_never_silent_germany_regular_fallback(self):
  report=catalogue("2026110106",html_for)
  self.assertFalse(report["productionApproved"])
  self.assertEqual(report["expectedRuns"],["2026110100","2026110103","2026110106"])
  self.assertEqual(len(report["files"]),3*(9*len(FIELDS)+3+len(TOT_PREC_PREVIOUS)))
  self.assertEqual(len({r["sourceUrl"] for r in report["files"]}),len(report["files"]))
  self.assertTrue(all("germany_icosahedral" in r["file"] for r in report["files"]))
  self.assertTrue(all(r["status"].startswith("catalog-only") for r in report["files"]))
  pressure=[r for r in report["files"] if r["parameter"] in ("t","relhum")]
  self.assertTrue(all("_pressure-level_" in r["file"] and "_850_" in r["file"] for r in pressure))
  self.assertEqual(len([r for r in report["files"] if r["parameter"]=="tot_prec"]),3*(len(LEADS)+1+len(TOT_PREC_PREVIOUS)))

 def test_original_dwd_cumulative_total_precipitation_code_is_pinned(self):
  from pilot_icon_d2_native_catalog import WMO
  self.assertEqual(WMO['tot_prec'],([0,1,52],'accum'))
 def test_sha_pinned_three_run_wmo_manifest_matches_original_scope(self):
  catalog=catalogue("2026110106",html_for)
  for item in catalog["files"]:item.update(sha256="a"*64,bytes=1000,status="downloaded-unqualified")
  report=pin_original_inventory(catalog)
  self.assertEqual(report["schema"],"mid.dwd.domain-inventory-input.v1")
  self.assertFalse(report["productionApproved"])
  self.assertEqual(len(report["records"]),282)
  self.assertEqual(sorted({r["run"] for r in report["records"]}),["20261101T0000","20261101T0300","20261101T0600"])
  for row in report["records"]:
   self.assertEqual(row["nativeCoordinates"]["latitude"]["sha256"],"a"*64)
   self.assertEqual(row["nativeCoordinates"]["longitude"]["sha256"],"a"*64)
   self.assertEqual(row["wmoParameter"],__import__("pilot_icon_d2_native_catalog").WMO[row["parameter"]][0])
  catalog["files"][0]["sha256"]="not-a-hash"
  with self.assertRaisesRegex(ValueError,"SHA"):pin_original_inventory(catalog)

 def test_missing_original_file_must_fail_no_regular_fallback(self):
  def no_icosahedral(url):
   return html_for(url).replace("germany_icosahedral","germany_regular-lat-lon")
  with self.assertRaisesRegex(ValueError,"missing/duplicate"):catalogue("2026110106",no_icosahedral)
  with self.assertRaisesRegex(ValueError,"missing/duplicate"):catalogue("2026110106",lambda url:"")
  with self.assertRaisesRegex(ValueError,"original native clat"):catalogue("2026110106",lambda url:"" if url.endswith("/clat/") else html_for(url))

 def test_duplicate_and_mixed_cycle_are_fail_closed(self):
  name="icon-d2_germany_icosahedral_single-level_2026110100_006_2d_t_2m.grib2.bz2"
  with self.assertRaisesRegex(ValueError,"duplicate"):select_name([name,name],"t_2m","2026110100",6)
  with self.assertRaisesRegex(ValueError,"missing"):select_name([name],"t_2m","2026110103",6)
  with self.assertRaises(ValueError):select_name([name],"t_2m","2026110100",11)
  self.assertEqual(TOT_PREC_PREVIOUS,(11,23,47))
  for prior in TOT_PREC_PREVIOUS:
   total=f"icon-d2_germany_icosahedral_single-level_2026110100_{prior:03d}_2d_tot_prec.grib2.bz2"
   self.assertEqual(select_name([total],"tot_prec","2026110100",prior),total)
  with self.assertRaises(ValueError):select_name([name],"__hack__","2026110100",6)
  coordinate="icon-d2_germany_icosahedral_time-invariant_2026110100_000_0_clat.grib2.bz2"
  with self.assertRaisesRegex(ValueError,"not uniquely"):select_coordinate([coordinate,coordinate],"clat","2026110100")

 def test_official_directory_read_retry_only_on_transient_timeouts(self):
  import requests
  from unittest.mock import patch
  from pilot_icon_d2_native_catalog import read_listing,ROOT
  class Response:
   status_code=200
   content=b'<a href="original.grib2.bz2">original</a>'
   text=content.decode()
   def close(self):pass
  class Session:
   def __init__(self,failures=1,status=200):self.calls=0;self.failures=failures;self.status=status
   def get(self,url,**kwargs):
    self.calls+=1
    self.kwargs=kwargs
    if self.calls<=self.failures:raise requests.Timeout('read timeout')
    response=Response();response.status_code=self.status
    return response
  url=ROOT+'12/tot_prec/'
  session=Session()
  with patch('time.sleep') as sleep:
   self.assertIn('original.grib2.bz2',read_listing(url,session))
  self.assertEqual(session.calls,2)
  self.assertEqual(session.kwargs,{'timeout':30,'allow_redirects':False})
  self.assertEqual(sleep.call_count,1)
  with patch('time.sleep'):
   with self.assertRaises(requests.Timeout):read_listing(url,Session(failures=3))
  refused=Session(failures=0,status=503)
  with self.assertRaisesRegex(ValueError,'unavailable'):read_listing(url,refused)
  self.assertEqual(refused.calls,1)
  with self.assertRaisesRegex(ValueError,'official DWD'):read_listing('https://example.invalid/12/tot_prec/',Session(0))

if __name__=="__main__":unittest.main()
