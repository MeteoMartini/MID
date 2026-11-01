#!/usr/bin/env python3
"""Read-only DWD ICON-D2 native source collector for the full-domain pilot.

This inventories *original* germany_icosahedral products, never regular-grid
Germany subsets. Catalog presence is NOT an ecCodes/bitmap/field admission.
Only the separate SHA-pinned pilot_dwd_domain_inventory.py may inspect GRIB.
No MID manifest, Worker, Pages or production pointer is ever written.
"""
from __future__ import annotations
import argparse, hashlib, json, re
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote

ROOT="https://opendata.dwd.de/weather/nwp/icon-d2/grib/"
FIELDS=("t_2m","pmsl","u_10m","v_10m","vmax_10m","clct","ww","t","relhum","tot_prec")
LEADS=(1,2,3,4,5,6,12,24,48)
MAX_GRIB_BYTES=80_000_000
CYCLE_HOURS=3

class Hrefs(HTMLParser):
 def __init__(self):
  super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=="a":
   self.links.extend(value for key,value in attrs if key=="href" and isinstance(value,str))

def parse_last_run(value):
 if not re.fullmatch(r"[0-9]{10}",value):raise ValueError("exact YYYYMMDDHH UTC required")
 try:dt=datetime.strptime(value,"%Y%m%d%H").replace(tzinfo=timezone.utc)
 except ValueError as exc:raise ValueError("invalid model cycle") from exc
 if dt.hour%CYCLE_HOURS:raise ValueError("D2 init must be 3h aligned")
 return dt

def cycles(last):
 dt=parse_last_run(last)
 return [(dt-timedelta(hours=3*i)).strftime("%Y%m%d%H") for i in (2,1,0)]

def select_name(links,field,stamp,lead):
 if field not in FIELDS or not re.fullmatch(r"[0-9]{10}",stamp) or type(lead) is not int or lead not in LEADS and not (field=="tot_prec" and lead==0):
  raise ValueError("unqualified native source request")
 prefix="icon-d2_germany_icosahedral_"
 pressure=field in ("t","relhum")
 stem="850_"+field if pressure else "2d_"+field
 level_kind="pressure-level" if pressure else "single-level"
 expected=prefix+level_kind+"_"+stamp+"_"+str(lead).zfill(3)+"_"+stem+".grib2.bz2"
 matches=[n for n in links if n==expected]
 if len(matches)!=1:raise ValueError("missing/duplicate original native D2 "+field+" "+stamp+" +"+str(lead))
 return expected

def select_coordinate(links,field,stamp):
 if field not in ("clat","clon"):raise ValueError("invalid native coordinate")
 # CLAT/CLON are time-invariant: their file date need NOT equal the current
 # forecast cycle. Binding is via the exact original source SHA plus the GRIB
 # UUID/numberOfGridUsed/numberOfGridInReference/numberOfPoints identity.
 parse_last_run(stamp)
 pattern=re.compile(r"^icon-d2_germany_icosahedral_time-invariant_([0-9]{10})_000_0_"+field+r"\.grib2\.bz2$")
 matches=[(name,pattern.fullmatch(name)) for name in links]
 matches=[(name,match) for name,match in matches if match is not None]
 if len(matches)!=1:raise ValueError("original native "+field+" not uniquely available for "+stamp)
 try:
  source_stamp=datetime.strptime(matches[0][1].group(1),"%Y%m%d%H").replace(tzinfo=timezone.utc)
 except ValueError as exc:raise ValueError("invalid original native coordinate date") from exc
 if source_stamp>parse_last_run(stamp):raise ValueError("native grid coordinate file from future cycle")
 return matches[0][0]

def catalogue(last,fetch_listing):
 planned=[];runs=cycles(last)
 for stamp in runs:
  for field in (*FIELDS,"clat","clon"):
   url=ROOT+stamp[-2:]+"/"+field+"/"
   links=Hrefs();links.feed(fetch_listing(url))
   wanted=(0,) if field in ("clat","clon") else (0,*LEADS) if field=="tot_prec" else LEADS
   for lead in wanted:
    name=select_coordinate(links.links,field,stamp) if field in ("clat","clon") else select_name(links.links,field,stamp,lead)
    planned.append({"model":"icon-d2","run":stamp+"00","parameter":field,"leadHours":lead,
                    "sourceUrl":url+quote(name,safe="._-"),"file":name,"grid":"icosahedral",
                    "status":"catalog-only; GRIB not verified"})
 return {"schema":"mid.dwd.native-source-catalog.v1","productionApproved":False,
         "basis":"DWD original germany_icosahedral; no regular-grid fallback",
         "expectedRuns":runs,"requiredFields":list(FIELDS),"offeredLeads":list(LEADS),"files":planned}

def read_listing(url,session):
 response=session.get(url,timeout=30,allow_redirects=False)
 if response.status_code!=200 or len(response.content)>4_000_000:
  raise ValueError("DWD original directory unavailable or over budget: "+url)
 return response.text

def download_native(item,destination,session):
 """Optional staging of immutable raw source bytes for separate ecCodes inventory."""
 if not item["sourceUrl"].startswith(ROOT) or not item["sourceUrl"].endswith("/"+quote(item["file"],safe="._-")):
  raise ValueError("invalid official DWD source address")
 response=session.get(item["sourceUrl"],timeout=90,stream=True,allow_redirects=False)
 if response.status_code!=200:raise ValueError("native original unavailable: "+item["file"])
 name=item["file"];path=destination/name
 if path.exists():raise ValueError("immutable original file already exists")
 temp=destination/("."+name+".part")
 size=0;digest=hashlib.sha256()
 try:
  with temp.open("xb") as target:
   for chunk in response.iter_content(chunk_size=1048576):
    if not chunk:continue
    size+=len(chunk)
    if size>MAX_GRIB_BYTES:raise ValueError("original file exceeds byte limit")
    digest.update(chunk);target.write(chunk)
  if size==0:raise ValueError("empty original file")
  temp.rename(path)
 finally:
  temp.unlink(missing_ok=True);response.close()
 return {"sha256":digest.hexdigest(),"bytes":size,"relativeFile":name,"status":"downloaded-unqualified"}

# DWD/WMO GRIB2 identities are rechecked from each immutable original file.
WMO={"t_2m":([0,0,0],"instant"),"pmsl":([0,3,1],"instant"),
 "u_10m":([0,2,2],"instant"),"v_10m":([0,2,3],"instant"),
 "vmax_10m":([0,2,22],"max"),"clct":([0,6,1],"instant"),
 "ww":([0,19,25],"instant"),"t":([0,0,0],"instant"),
 "relhum":([0,1,1],"instant"),"tot_prec":([0,1,52],"accum")}
def pin_original_inventory(catalog):
 if catalog.get("schema")!="mid.dwd.native-source-catalog.v1" or catalog.get("productionApproved") is not False:
  raise ValueError("not an original DWD pilot catalog")
 runs=catalog.get("expectedRuns",[])
 if len(runs)!=3 or runs!=cycles(runs[-1]):raise ValueError("not three consecutive native D2 cycles")
 bykey={}
 for item in catalog.get("files",[]):
  key=(item.get("run"),item.get("parameter"),item.get("leadHours"))
  if key in bykey:raise ValueError("duplicate native request")
  if not re.fullmatch("[a-f0-9]{64}",str(item.get("sha256"))) or not 0<int(item.get("bytes",0))<=MAX_GRIB_BYTES or item.get("status")!="downloaded-unqualified":
   raise ValueError("original file lacks SHA/bytes")
  if not isinstance(item.get("file"),str) or "/" in item["file"] or "\\" in item["file"]:
   raise ValueError("unsafe original filename")
  bykey[key]=item
 rows=[]
 for stamp in runs:
  run=stamp+"00";lat=bykey.get((run,"clat",0));lon=bykey.get((run,"clon",0))
  if not lat or not lon:raise ValueError("native CLAT/CLON missing")
  coordinates={"latitude":{"path":lat["file"],"sha256":lat["sha256"]},
               "longitude":{"path":lon["file"],"sha256":lon["sha256"]}}
  for field in FIELDS:
   for lead in ((0,*LEADS) if field=="tot_prec" else LEADS):
    item=bykey.get((run,field,lead))
    if not item:raise ValueError("native DWD parameter/lead missing")
    identity,step=WMO[field]
    rows.append({"model":"icon-d2","parameter":field,"run":stamp[:8]+"T"+stamp[8:]+"00",
                 "leadHours":lead,"path":item["file"],"sha256":item["sha256"],
                 "wmoParameter":identity,"stepType":step,"nativeCoordinates":coordinates})
 if len(rows)+6!=len(bykey):raise ValueError("unknown catalog entries")
 return {"schema":"mid.dwd.domain-inventory-input.v1","productionApproved":False,
         "expectedParameters":{"icon-d2":list(FIELDS)},
         "expectedLeads":{"icon-d2/"+f:list((0,*LEADS) if f=="tot_prec" else LEADS) for f in FIELDS},
         "records":rows}

def main():
 import requests
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument("--last-run",required=True,help="Last complete DWD ICON-D2 UTC cycle YYYYMMDDHH")
 parser.add_argument("--output",required=True,type=Path)
 parser.add_argument("--download",action="store_true",help="Download all scoped native files for subsequent separate WMO/ecCodes inventory")
 args=parser.parse_args()
 if args.output.exists():raise ValueError("immutable pilot output directory already exists")
 session=requests.Session();session.headers.update({"User-Agent":"MID-DWD-original-native-audit/1.0"})
 report=catalogue(args.last_run,lambda url:read_listing(url,session))
 args.output.mkdir(parents=True)
 try:
  if args.download:
   for item in report["files"]:item.update(download_native(item,args.output,session))
   (args.output/"inventory-input.json").write_text(json.dumps(pin_original_inventory(report),separators=(",",":"))+"\n")
  (args.output/"catalog.json").write_text(json.dumps(report,ensure_ascii=False,separators=(",",":"))+"\n")
  print(json.dumps({"catalog":str(args.output/"catalog.json"),"runs":report["expectedRuns"],
                    "files":len(report["files"]),"rawDownloaded":args.download,
                    "productionApproved":False},ensure_ascii=False))
 except BaseException:
  import shutil
  shutil.rmtree(args.output,ignore_errors=True)
  raise
 finally:session.close()
if __name__=="__main__":main()
