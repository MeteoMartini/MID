import unittest
from pilot_icon_d2_native_catalog import (
 FIELDS,LEADS,Hrefs,catalogue,cycles,select_name,select_coordinate,parse_last_run
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
  requested=(0,*LEADS) if field=="tot_prec" else LEADS
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

 def test_complete_native_directory_plan_never_silent_germany_regular_fallback(self):
  report=catalogue("2026110106",html_for)
  self.assertFalse(report["productionApproved"])
  self.assertEqual(report["expectedRuns"],["2026110100","2026110103","2026110106"])
  self.assertEqual(len(report["files"]),3*(9*len(FIELDS)+3))
  self.assertEqual(len({r["sourceUrl"] for r in report["files"]}),len(report["files"]))
  self.assertTrue(all("germany_icosahedral" in r["file"] for r in report["files"]))
  self.assertTrue(all(r["status"].startswith("catalog-only") for r in report["files"]))
  pressure=[r for r in report["files"] if r["parameter"] in ("t","relhum")]
  self.assertTrue(all("_pressure-level_" in r["file"] and "_850_" in r["file"] for r in pressure))
  self.assertEqual(len([r for r in report["files"] if r["parameter"]=="tot_prec"]),3*(len(LEADS)+1))

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
  with self.assertRaises(ValueError):select_name([name],"__hack__","2026110100",6)
  coordinate="icon-d2_germany_icosahedral_time-invariant_2026110100_000_0_clat.grib2.bz2"
  with self.assertRaisesRegex(ValueError,"not uniquely"):select_coordinate([coordinate,coordinate],"clat","2026110100")

if __name__=="__main__":unittest.main()
