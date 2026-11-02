#!/usr/bin/env python3
"""Read-only deterministic ICON-D2 native triangular -> nearest-native display pilot.

Only SHA-pinned *original* DWD GRIBs previously qualified by the 3-run
WMO/bitmap/geocoordinate inventory are accepted. The 0.025 degree pixels are
DISPLAY sampling of the verified 542040 native triangles, never new model
points. No interpolation, clipping, missing-to-zero, Pages or MID latest.json.
"""
from __future__ import annotations
import argparse,bz2,gzip,hashlib,json,math,os,tempfile,shutil
from pathlib import Path
import numpy as np
from pilot_dwd_domain_inventory import inventory_record,validate_collection,native_coordinates
from grib_bitmap import decode_bitmap_values
from build_ruc_bundle import build_lookup

NATIVE_POINTS=542040
NODATA=np.uint32(0xffffffff)
DISPLAY_LIMIT=12_000_000
SUPPORTED={"t_2m":("temperature","K","°C"),"pmsl":("pressure","Pa","hPa"),
           "clct":("cloud","%","%"),"vmax_10m":("gust","m s-1","km/h")}

def map_native(values,lookup,unit,field):
 """Preserve native exact (ecCodes decoded) values and an explicit null mask."""
 if field not in SUPPORTED or not isinstance(values,np.ndarray) or values.ndim!=1:
  raise ValueError("unsupported native scalar shape")
 if not isinstance(lookup,np.ndarray) or lookup.ndim!=2 or lookup.dtype.kind!="u":
  raise ValueError("invalid native lookup shape")
 known=lookup!=NODATA
 if np.any(known & (lookup>=len(values))):raise ValueError("lookup index exceeds verified native source")
 valid=np.isfinite(values)
 if not valid.any():raise ValueError("fully missing original D2 field")
 kind,required,target=SUPPORTED[field]
 if field=="vmax_10m":
  if unit not in ("m s-1","m s**-1"):raise ValueError("unexpected DWD wind units")
 elif unit!=required and not (field=="clct" and unit=="1"):raise ValueError("unexpected original DWD field units")
 physical=values.astype(np.float64,copy=True)
 if field=="t_2m":physical-=273.15
 elif field=="pmsl":physical/=100
 elif field=="vmax_10m":physical*=3.6
 elif field=="clct" and unit=="1":physical*=100
 lo,hi={"t_2m":(-100,70),"pmsl":(800,1100),"clct":(0,100.01),"vmax_10m":(0,600)}[field]
 if np.any(physical[valid]<lo) or np.any(physical[valid]>hi):
  raise ValueError("original native physical extremes outside field contract")
 original_min=float(physical[valid].min());original_max=float(physical[valid].max())
 indices=lookup[known].astype(np.intp)
 sampled_mask=np.zeros(lookup.shape,dtype=bool);sampled_mask[known]=valid[indices]
 pixels=np.full(lookup.shape,np.nan,dtype=np.float64)
 pixels[sampled_mask]=physical[lookup[sampled_mask].astype(np.intp)]
 available=np.isfinite(pixels)
 if not available.any():raise ValueError("display lookup has no valid native source point")
 displayed=pixels[available]
 return {"kind":kind,"unit":target,"values":[None if not math.isfinite(v) else float(v) for v in pixels.ravel()],
         "originalMin":original_min,"originalMax":original_max,
         "displayMin":float(displayed.min()),"displayMax":float(displayed.max()),
         "originalMissingPoints":int((~valid).sum()),"displayMissingCells":int((~available).sum()),
         "nativeExtremeNotSampled":original_min<float(displayed.min()) or original_max>float(displayed.max())}

def read_original(record,root):
 """Recheck GRIB/source/bitmap/CLAT/CLON after 3-cycle collection admission."""
 from eccodes import codes_grib_new_from_file,codes_get,codes_release
 path=(root/record["path"]).resolve(strict=True)
 if not path.is_relative_to(root.resolve()):raise ValueError("original path escapes source root")
 with tempfile.TemporaryFile() as stream:
  original_digest=hashlib.sha256()
  with path.open("rb") as compressed:
   for chunk in iter(lambda:compressed.read(1048576),b""):
    original_digest.update(chunk)
  if original_digest.hexdigest()!=record["sha256"]:raise ValueError("original GRIB SHA changed since inventory")
  with (bz2.BZ2File(path) if path.name.endswith(".bz2") else path.open("rb")) as original:
   size=0
   for chunk in iter(lambda:original.read(1048576),b""):
    size+=len(chunk)
    if size>640_000_000:raise ValueError("decoded original GRIB over budget")
    stream.write(chunk)
  stream.seek(0);gid=codes_grib_new_from_file(stream)
  if gid is None:raise ValueError("no original GRIB")
  try:
   unit=str(codes_get(gid,"units"))
   values=decode_bitmap_values(gid)
   lat,lon,_=native_coordinates(record,root,gid)
   if values.size!=NATIVE_POINTS or lat.size!=NATIVE_POINTS or lon.size!=NATIVE_POINTS:
    raise ValueError("original ICON-D2 full-grid 542040 geometry not met")
   return values,lat,lon,unit
  finally:codes_release(gid)

def build_candidate(root,manifest,out,field="t_2m",lead=6):
 if field not in SUPPORTED or type(lead) is not int or lead<0 or lead>48:raise ValueError("unsupported native pilot request")
 root=root.resolve(strict=True);out=out.resolve()
 if out.exists() or out.is_relative_to(root) or root.is_relative_to(out):
  raise ValueError("immutable disjoint pilot output required")
 source=json.loads(manifest.read_bytes())
 if source.get("schema")!="mid.dwd.domain-inventory-input.v1":
  raise ValueError("unverified 3-run original manifest")
 records=source["records"]
 if set(source["expectedParameters"])!={"icon-d2"} or field not in source["expectedParameters"]["icon-d2"]:
  raise ValueError("native deterministic source scope incomplete")
 if "icon-d2/"+field not in source["expectedLeads"] or lead not in source["expectedLeads"]["icon-d2/"+field]:
  raise ValueError("requested term outside complete three-run scope")
 verified=[inventory_record(record,root) for record in records]
 qualification=validate_collection(verified,parameters=source["expectedParameters"],
                                   leads=source["expectedLeads"],required_runs=3)
 run=max(q["run"] for q in verified)
 candidates=[r for r in records if r["model"]=="icon-d2" and r["run"]==run and r["parameter"]==field and r["leadHours"]==lead]
 if len(candidates)!=1:raise ValueError("native scalar field/run not uniquely qualified")
 record=candidates[0]
 values,lats,lons,unit=read_original(record,root)
 temp=Path(tempfile.mkdtemp(prefix=".d2-native-pilot-",dir=out.parent))
 try:
  g=build_lookup(lats,lons,temp,step=.025,max_distance_km=5)
  lookup=np.fromfile(temp/"lookup.bin",dtype="<u4").reshape(g["ny"],g["nx"])
  scalar=map_native(values,lookup,unit,field)
  field_data={"schema":"mid.dwd.native-scalar-pilot.v1","productionApproved":False,
              "modelId":"icon-d2","sampling":"nearest-native-cell","maxNearestKm":5,
              "originalGrid":"unstructured_grid","nativePoints":NATIVE_POINTS,
              "run":run,"leadHours":lead,"kind":scalar["kind"],"unit":scalar["unit"],
              "lats":(g["latMin"]+np.arange(g["ny"])*g["dy"]).round(6).tolist(),
              "lons":(g["lonMin"]+np.arange(g["nx"])*g["dx"]).round(6).tolist(),
              "sourceSha256":record["sha256"],"sourceInventorySha256":hashlib.sha256(manifest.read_bytes()).hexdigest(),
              **{k:v for k,v in scalar.items() if k not in ("kind","unit")}}
  raw=json.dumps(field_data,separators=(",",":"),allow_nan=False).encode()
  if len(raw)>DISPLAY_LIMIT:raise ValueError("native pilot decoded display budget exceeded")
  wire=gzip.compress(raw,mtime=0)
  (temp/"field.bin").write_bytes(wire)
  (temp/"readme.json").write_text(json.dumps({"schema":"mid.dwd.native-pilot-artifacts.v1","productionApproved":False,
   "sourceSha256":record["sha256"],"fieldSha256":hashlib.sha256(wire).hexdigest(),
   "decodedBytes":len(raw),"encodedBytes":len(wire),"nativeExtremeNotSampled":scalar["nativeExtremeNotSampled"],
   "originalQualifiedRuns":qualification["runCounts"].get("icon-d2/"+field)},separators=(",",":"))+"\n")
  (temp/"lookup.bin").unlink()
  os.rename(temp,out)
 finally:
  if temp.exists():shutil.rmtree(temp)
 return {"output":str(out),"sourceRun":run,"sourceSha256":record["sha256"],"productionApproved":False}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("--root",required=True,type=Path)
 p.add_argument("--manifest",required=True,type=Path)
 p.add_argument("--output",required=True,type=Path)
 p.add_argument("--field",choices=sorted(SUPPORTED),default="t_2m")
 p.add_argument("--lead",type=int,default=6)
 a=p.parse_args()
 print(json.dumps(build_candidate(a.root,a.manifest,a.output,a.field,a.lead)))
if __name__=="__main__":main()
