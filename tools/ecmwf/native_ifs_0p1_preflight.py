#!/usr/bin/env python3
"""MID read-only ECMWF IFS Open Data 0.1 degree field-level preflight."""
from __future__ import annotations
import argparse,json,math,tempfile
from datetime import datetime,timezone,timedelta
from pathlib import Path

SPECS=[
 {"id":"t2m","param":"2t","levtype":"sfc","level":2,"typeOfLevel":"heightAboveGround","units":"K","min":170,"max":345},
 {"id":"msl","param":"msl","levtype":"sfc","level":0,"typeOfLevel":"meanSea","units":"Pa","min":79000,"max":116000},
 {"id":"z500","param":"z","levtype":"pl","level":500,"typeOfLevel":"isobaricInhPa","units":"m**2 s**-2","min":0,"max":85000},
]
MAX_FILE_BYTES=64*1024*1024
MAX_TOTAL_BYTES=110*1024*1024

def parse_run(run):
 if not isinstance(run,datetime):raise ValueError("ECMWF run must be a datetime")
 if run.tzinfo is None:run=run.replace(tzinfo=timezone.utc)
 run=run.astimezone(timezone.utc)
 if run.hour not in (0,6,12,18) or run.minute or run.second:raise ValueError("Invalid UTC IFS reference cycle")
 return run

def validate(meta,run,spec,values,lead_hours=0):
 if lead_hours not in (0,24):raise ValueError('unapproved forecast lead')
 valid=run+timedelta(hours=lead_hours)
 checks={
  "GRIB2":meta.get("edition")==2,
  "centre":meta.get("centre") in ("ecmf",98,"98"),
  "run":meta.get("dataDate")==int(run.strftime("%Y%m%d")) and meta.get("dataTime")==int(run.strftime("%H%M")),
  "validity":meta.get("validityDate")==int(valid.strftime("%Y%m%d")) and meta.get("validityTime")==int(valid.strftime("%H%M")),
  "instant":meta.get("stepType") in ("instant","instantaneous"),
  "parameter":meta.get("shortName")==spec["param"],
  "level":meta.get("typeOfLevel")==spec["typeOfLevel"] and meta.get("level")==spec["level"],
  "unit":meta.get("units")==spec["units"],
  "regular_0p1":meta.get("gridType")=="regular_ll" and meta.get("Ni")==3600 and meta.get("Nj")==1801 and meta.get("numberOfPoints")==6483600,
  "grid_step":all(isinstance(meta.get(key),(int,float)) and abs(meta[key]-.1)<1e-6 for key in ("iDirectionIncrementInDegrees","jDirectionIncrementInDegrees")),
  "bitmap":meta.get("bitmapPresent") in (0,1),
  "packing":type(meta.get("bitsPerValue")) is int and 0<meta["bitsPerValue"]<=32,
 }
 finite=[v for v in values if type(v) in (int,float) and math.isfinite(v)]
 checks["numeric"]=len(values)==7 and len(finite)>=3 and all(spec["min"]<=v<=spec["max"] for v in finite)
 return {"passed":all(checks.values()),"checks":checks,
   "samples":{"count":len(values),"finite":len(finite),"missing":len(values)-len(finite),
              "min":min(finite) if finite else None,"max":max(finite) if finite else None}}

def inspect(path,run,spec,lead_hours):
 from eccodes import codes_grib_new_from_file,codes_get,codes_get_double_elements,codes_release
 size=path.stat().st_size
 if not 100<=size<=MAX_FILE_BYTES:raise ValueError("Single GRIB file exceeds bounded size or is empty")
 keys=("edition","centre","dataDate","dataTime","validityDate","validityTime","stepType","shortName","typeOfLevel","level","units","gridType","Ni","Nj","numberOfPoints","iDirectionIncrementInDegrees","jDirectionIncrementInDegrees","bitmapPresent","bitsPerValue")
 with path.open("rb") as stream:
  handle=codes_grib_new_from_file(stream)
  if handle is None:raise ValueError("Missing GRIB message")
  try:
   meta={}
   for key in keys:
    try:meta[key]=codes_get(handle,key)
    except Exception:meta[key]=None
   points=int(meta.get("numberOfPoints") or 0)
   if points<7:raise ValueError("Too few grid cells")
   offsets=[round((points-1)*i/6) for i in range(7)]
   raw=codes_get_double_elements(handle,"values",offsets)
   missing=float(codes_get(handle,"missingValue"))
   values=[None if not math.isfinite(float(x)) or math.isclose(float(x),missing,rel_tol=0,abs_tol=1e-6) else float(x) for x in raw]
  finally:codes_release(handle)
  extra=codes_grib_new_from_file(stream,headers_only=True)
  if extra is not None:
   codes_release(extra)
   raise ValueError("Unexpected extra GRIB field")
 report=validate(meta,run,spec,values,lead_hours)
 return {"field":spec["id"],"leadHours":lead_hours,"bytes":size,"nativeMetadata":meta,**report,"fullSpatialValidation":False}

def live_report(path):
 from ecmwf.opendata import Client
 path.parent.mkdir(parents=True,exist_ok=True)
 result={"schema":"mid.ecmwf.ifs-0p1.readonly.v1","source":"ECMWF Free Open Data",
         "model":"ifs","resolution":"0p1","license":"CC BY 4.0 / ECMWF Terms of Use",
         "files":[],"errors":[],"pilotPassed":False,"readyForProduction":False,
         "fusionEnabled":False,"mapsEnabled":False,"published":False}
 try:
  client=Client(source="ecmwf",model="ifs",resol="0p1",infer_stream_keyword=False,
                maximum_retries=1,retry_after=1)
  run=parse_run(client.latest(stream="oper",type="fc",levtype="sfc",param="2t",step=0))
  result["runUtc"]=run.isoformat()
  result["checkedUtc"]=datetime.now(timezone.utc).isoformat()
  with tempfile.TemporaryDirectory(prefix="mid-ecmwf-canary-") as tmp:
   size=0
   for lead in (0,24):
    for spec in SPECS:
     file=Path(tmp)/(spec["id"]+"_"+str(lead)+"h.grib2")
     query={"date":run.strftime("%Y%m%d"),"time":run.hour,"stream":"oper","type":"fc",
            "step":lead,"levtype":spec["levtype"],"param":spec["param"],"target":str(file)}
     if spec["levtype"]=="pl":query["levelist"]=spec["level"]
     item=client.retrieve(**query)
     if parse_run(item.datetime)!=run:raise ValueError("Mixed ECMWF initialization times")
     size+=file.stat().st_size
     if size>MAX_TOTAL_BYTES:raise ValueError("Read-only transfer budget exceeded")
     result["files"].append(inspect(file,run,spec,lead))
  result["bytesDownloaded"]=size
  result["pilotPassed"]=len(result["files"])==len(SPECS)*2 and all(f["passed"] for f in result["files"])
 except Exception as exc:result["errors"].append({"type":type(exc).__name__,"description":str(exc)[:240]})
 path.write_text(json.dumps(result,ensure_ascii=False,indent=2,default=str)+"\n",encoding="utf8")
 print("ECMWF IFS 0p1 pilot", "PASS" if result["pilotPassed"] else "BLOCKED",
       "- never authorizes MID deployment",path)
 return 0 if result["pilotPassed"] else 2

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument("--report",type=Path,required=True)
 args=parser.parse_args()
 raise SystemExit(live_report(args.report))
