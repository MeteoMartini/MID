#!/usr/bin/env python3
"""Build compact MID ICON-D2-RUC / RUC-EPS point assets.
GRIB decoding runs only in CI/preprocessing, never in Cloudflare Workers.
The builder is fail-closed: mixed grids, missing hourly targets, missing EPS members,
or spatially implausible lookups abort publication before latest.json exists.
"""
from __future__ import annotations
import argparse,bz2,hashlib,json,math,re
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
from ruc_pack import DEFAULT_FIELDS,EPS_SUMMARY_FIELDS,pack_cell_major,pack_eps_members,write_meta,UINT32_NODATA

PARAM_MAP={'T_2M':'temperature_2m','TD_2M':'dew_point_2m','RELHUM_2M':'relative_humidity_2m','PMSL':'pressure_msl','U_10M':'u10','V_10M':'v10','VMAX_10M':'wind_gusts_10m','TOT_PREC':'precipitation_acc','CLCT':'cloud_cover','CLCL':'cloud_cover_low','CAPE_ML':'cape','CIN_ML':'convective_inhibition'}
RUC_BBOX=(-3.85,43.18,20.22,58.05)

def read_messages(path:Path,ensemble=False,include_grid=True):
    try: from eccodes import codes_grib_new_from_file,codes_get,codes_get_array,codes_release
    except Exception as e: raise SystemExit('eccodes Python package required for production GRIB ingestion') from e
    opener=bz2.open if path.suffix=='.bz2' else open
    grid_pending=include_grid
    with opener(path,'rb') as f:
      while True:
        gid=codes_grib_new_from_file(f)
        if gid is None: break
        try:
          vals=np.asarray(codes_get_array(gid,'values'),dtype=np.float32)
          if grid_pending:
            try:lats=np.asarray(codes_get_array(gid,'latitudes'),dtype=np.float32);lons=np.asarray(codes_get_array(gid,'longitudes'),dtype=np.float32)
            except Exception:lats=lons=None
            grid_pending=False
          else:lats=lons=None
          valid=datetime.strptime(f"{int(codes_get(gid,'validityDate')):08d}{int(codes_get(gid,'validityTime')):04d}",'%Y%m%d%H%M').replace(tzinfo=timezone.utc)
          member=0
          if ensemble:
            for key in ('perturbationNumber','number'):
              try: member=int(codes_get(gid,key));break
              except Exception: pass
          try:units=str(codes_get(gid,'units'))
          except Exception:units=''
          yield valid,member,vals,lats,lons,units
        finally:codes_release(gid)

def normalize(name,values,units):
    v=values.astype(np.float32,copy=True);u=units.lower()
    if name in {'temperature_2m','dew_point_2m'} and (u=='k' or 'kelvin' in u or np.nanmedian(v)>100):v-=273.15
    if name=='pressure_msl' and (u=='pa' or np.nanmedian(v)>2000):v/=100
    if name in {'cloud_cover','cloud_cover_low','relative_humidity_2m'} and np.nanmax(v)<=1.2:v*=100
    if name=='convective_inhibition':v=np.abs(v)
    return v

def run_time(value:str):return datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(timezone.utc)
def hourly_targets(run:str,hours:int):
    base=run_time(run);return [base+timedelta(hours=h) for h in range(hours+1)]

def same_grid(base_lats,base_lons,lats,lons,tolerance=2e-4):
    return lats is not None and lons is not None and len(lats)==len(base_lats) and np.nanmax(np.abs(lats-base_lats))<=tolerance and np.nanmax(np.abs(lons-base_lons))<=tolerance

def collect_parameter(files,name,targets,base_grid=None):
    rows={};grid=None
    for file in files:
      for valid,_member,vals,lats,lons,units in read_messages(file,include_grid=grid is None):
        if valid not in targets:continue
        if grid is None and lats is not None and lons is not None:grid=(lats,lons)
        rows[valid]=normalize(name,vals,units)
    missing=[t for t in targets if t not in rows]
    if missing:raise SystemExit(f'{name}: missing hourly targets: '+','.join(t.isoformat() for t in missing[:4]))
    if grid is None:raise SystemExit(f'{name}: no latitude/longitude grid in GRIB')
    if base_grid and not same_grid(*base_grid,*grid):raise SystemExit(f'{name}: native grid differs from deterministic reference')
    return rows,grid

def build_lookup(lats,lons,output:Path,step=.025,max_distance_km=5.0):
    try: from scipy.spatial import cKDTree
    except Exception as e: raise SystemExit('scipy required to build verified geographic lookup') from e
    lon_min,lat_min,lon_max,lat_max=RUC_BBOX
    xs=np.arange(lon_min,lon_max+step*.5,step,dtype=np.float64);ys=np.arange(lat_min,lat_max+step*.5,step,dtype=np.float64)
    def xyz(lat,lon):
      p=np.radians(lat);l=np.radians(lon);c=np.cos(p);return np.column_stack((c*np.cos(l),c*np.sin(l),np.sin(p)))
    native=xyz(np.asarray(lats,dtype=np.float64),np.asarray(lons,dtype=np.float64));tree=cKDTree(native)
    out=np.full((len(ys),len(xs)),UINT32_NODATA,dtype='<u4')
    batch=32
    for start in range(0,len(ys),batch):
      yb=ys[start:start+batch];lon_grid,lat_grid=np.meshgrid(xs,yb);query=xyz(lat_grid.ravel(),lon_grid.ravel());distance,index=tree.query(query,k=1,workers=-1)
      # chord distance on unit sphere -> great-circle km
      km=2*6371.0088*np.arcsin(np.minimum(1,distance/2));indices=index.astype(np.uint32);indices[km>max_distance_km]=UINT32_NODATA
      out[start:start+len(yb)]=indices.reshape(len(yb),len(xs))
    if np.count_nonzero(out!=UINT32_NODATA)<out.size*.85:raise SystemExit('lookup coverage unexpectedly low')
    (output/'lookup.bin').write_bytes(out.tobytes(order='C'))
    return {'lonMin':float(xs[0]),'latMin':float(ys[0]),'dx':float(step),'dy':float(step),'nx':int(len(xs)),'ny':int(len(ys)),'maxNearestKm':float(max_distance_km),'nativePointCount':int(len(lats)),'bbox':list(RUC_BBOX)}

def collect_eps(files,targets,base_grid):
    rows={t:{} for t in targets};eps_grid=None
    for file in files:
      for valid,member,vals,lats,lons,units in read_messages(file,ensemble=True,include_grid=eps_grid is None):
        if valid not in rows:continue
        if eps_grid is None and lats is not None and lons is not None:eps_grid=(lats,lons)
        rows[valid][member]=normalize('precipitation_acc',vals,units)
    if eps_grid is None or not same_grid(*base_grid,*eps_grid):raise SystemExit('RUC-EPS native grid differs from deterministic RUC grid')
    members=sorted(set.intersection(*(set(rows[t]) for t in targets))) if targets else []
    if len(members)<10:raise SystemExit(f'RUC-EPS has only {len(members)} common members')
    # Keep all common members, deterministic member/control included only if DWD marks it as a member in this product.
    cube=np.stack([np.stack([rows[t][m] for m in members],axis=0) for t in targets],axis=0)
    interval=np.maximum(0,np.diff(cube,axis=0,prepend=cube[:1]))
    return interval,members


def eps_summary(interval):
    valid=np.isfinite(interval)
    member_count=np.sum(valid,axis=1)
    safe=np.where(valid,interval,np.nan)
    with np.errstate(invalid='ignore'):
      mean=np.nanmean(safe,axis=1)
      q25=np.nanquantile(safe,.25,axis=1)
      q50=np.nanquantile(safe,.50,axis=1)
      q75=np.nanquantile(safe,.75,axis=1)
    wet=np.where(member_count>0,100*np.sum(valid&(interval>.2),axis=1)/np.maximum(member_count,1),np.nan)
    significant=np.where(member_count>0,100*np.sum(valid&(interval>5.0),axis=1)/np.maximum(member_count,1),np.nan)
    return {
      'precipitation_probability':wet,
      'precipitation_probability_significant':significant,
      'precipitation_mean':mean,
      'precipitation_q25':q25,
      'precipitation_q50':q50,
      'precipitation_q75':q75,
    }

def file_info(path:Path):
    digest=hashlib.sha256()
    with path.open('rb') as handle:
      for chunk in iter(lambda:handle.read(1024*1024),b''):digest.update(chunk)
    return {'bytes':path.stat().st_size,'sha256':digest.hexdigest()}

def main():
 p=argparse.ArgumentParser();p.add_argument('--staging',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--run',required=True);p.add_argument('--hours',type=int,default=14);p.add_argument('--lookup-step',type=float,default=.025);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
 targets=hourly_targets(a.run,a.hours);series={};base_grid=None
 for param,name in PARAM_MAP.items():
  files=sorted((a.staging/'deterministic'/param).glob('**/*.grib2*'))
  if not files:raise SystemExit(f'missing staged parameter {param}')
  rows,grid=collect_parameter(files,name,targets,base_grid)
  if base_grid is None:base_grid=grid
  series[name]=rows
 times=targets;point_count=len(series['temperature_2m'][times[0]])
 acc=np.stack([series['precipitation_acc'][t] for t in times]);prec=np.maximum(0,np.diff(acc,axis=0,prepend=acc[:1]))
 u=np.stack([series['u10'][t] for t in times]);v=np.stack([series['v10'][t] for t in times]);speed=np.hypot(u,v)*1.94384449;direction=(np.degrees(np.arctan2(-u,-v))+360)%360
 fields={}
 for spec in DEFAULT_FIELDS:
  n=spec.name
  if n=='wind_speed_10m':fields[n]=speed
  elif n=='wind_direction_10m':fields[n]=direction
  elif n=='wind_gusts_10m':fields[n]=np.stack([series[n][t] for t in times])*1.94384449
  elif n=='precipitation':fields[n]=prec
  else:fields[n]=np.stack([series[n][t] for t in times])
 det=a.output/'deterministic.bin';det.write_bytes(pack_cell_major(fields,DEFAULT_FIELDS))
 grid=build_lookup(base_grid[0],base_grid[1],a.output,a.lookup_step)
 eps_files=sorted((a.staging/'eps'/'TOT_PREC').glob('**/*.grib2*'))
 if not eps_files:raise SystemExit('missing staged RUC-EPS TOT_PREC')
 eps,members=collect_eps(eps_files,targets,base_grid);eps_path=a.output/'eps-members.bin';eps_path.write_bytes(pack_eps_members(eps,.01))
 summary_path=a.output/'eps-summary.bin';summary_path.write_bytes(pack_cell_major(eps_summary(eps),EPS_SUMMARY_FIELDS))
 run_key=re.sub(r'[^0-9A-Za-z_-]','',a.run);lookup_path=a.output/'lookup.bin'
 object_paths={'deterministic.bin':det,'eps-summary.bin':summary_path,'eps-members.bin':eps_path,'lookup.bin':lookup_path}
 objects={name:file_info(path) for name,path in object_paths.items()}
 write_meta(a.output/'latest.json',run=a.run,times=[t.strftime('%Y-%m-%dT%H:%M') for t in times],point_count=point_count,specs=DEFAULT_FIELDS,grid=grid,deterministic_key=f'runs/{run_key}/deterministic.bin',eps_key=f'runs/{run_key}/eps-members.bin',eps_summary_key=f'runs/{run_key}/eps-summary.bin',lookup_key=f'runs/{run_key}/lookup.bin',member_count=len(members),eps_scale=.01,objects=objects)
 print(json.dumps({'run':a.run,'times':len(times),'points':point_count,'members':len(members),'detBytes':det.stat().st_size,'epsSummaryBytes':summary_path.stat().st_size,'epsBytes':eps_path.stat().st_size,'lookupBytes':lookup_path.stat().st_size}))
if __name__=='__main__':main()
