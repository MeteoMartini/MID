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
from ruc_pack import DEFAULT_FIELDS,EPS_SUMMARY_FIELDS,RAPID_5M_FIELDS,RAPID_15M_FIELDS,REFLECTIVITY_15M_FIELDS,SEVERE_15M_FIELDS,SOLAR_15M_FIELDS,SPECIALIST_HOURLY_FIELDS,PHASE_15M_FIELDS,pack_cell_major,pack_eps_members,write_meta,UINT32_NODATA

PARAM_MAP={'T_2M':'temperature_2m','TD_2M':'dew_point_2m','RELHUM_2M':'relative_humidity_2m','PMSL':'pressure_msl','U_10M':'u10','V_10M':'v10','VMAX_10M':'wind_gusts_10m','TOT_PREC':'precipitation_acc','CLCT':'cloud_cover','CLCL':'cloud_cover_low','CAPE_ML':'cape','CIN_ML':'convective_inhibition'}
SEVERE_PARAM_MAP={'CAPE_MU':'cape_mu','CIN_MU':'cin_mu','LPI':'lpi','LPI_MAX':'lpi_max','UH_MAX':'uh_max','UH_MAX_LOW':'uh_max_low','UH_MAX_MED':'uh_max_med','ECHOTOPinM':'echo_top_m','HAIL_GSP':'hail_gsp','LAPSE_RATE':'lapse_rate','W_CTMAX':'w_ctmax','VORW_CTMAX':'vorw_ctmax'}
SOLAR_PARAM_MAP={'ASOB_S':'asob_s','ASWDIR_S':'aswdir_s','ASWDIFD_S':'aswdifd_s'}
SPECIALIST_PARAM_MAP={'VIS':'visibility','CEILING':'ceiling','HZEROCL':'freezing_level_height','SNOWLMT':'snowline_height','CLCM':'cloud_cover_mid','CLCH':'cloud_cover_high','T_G':'surface_temperature','H_SNOW':'snow_depth'}
RUC_BBOX=(-3.85,43.18,20.22,58.05)

def read_messages(path:Path,ensemble=False):
    try: from eccodes import codes_grib_new_from_file,codes_get,codes_get_array,codes_release
    except Exception as e: raise SystemExit('eccodes Python package required for production GRIB ingestion') from e
    opener=bz2.open if path.suffix=='.bz2' else open
    with opener(path,'rb') as f:
      while True:
        gid=codes_grib_new_from_file(f)
        if gid is None: break
        try:
          vals=np.asarray(codes_get_array(gid,'values'),dtype=np.float32)
          valid=datetime.strptime(f"{int(codes_get(gid,'validityDate')):08d}{int(codes_get(gid,'validityTime')):04d}",'%Y%m%d%H%M').replace(tzinfo=timezone.utc)
          member=0
          if ensemble:
            for key in ('perturbationNumber','number'):
              try: member=int(codes_get(gid,key));break
              except Exception: pass
          try:units=str(codes_get(gid,'units'))
          except Exception:units=''
          yield valid,member,vals,units
        finally:codes_release(gid)

def read_first_values(path:Path):
    try: from eccodes import codes_grib_new_from_file,codes_get_array,codes_release
    except Exception as e: raise SystemExit('eccodes Python package required for production GRIB ingestion') from e
    opener=bz2.open if path.suffix=='.bz2' else open
    with opener(path,'rb') as f:
      gid=codes_grib_new_from_file(f)
      if gid is None:raise SystemExit(f'empty coordinate GRIB: {path}')
      try:return np.asarray(codes_get_array(gid,'values'),dtype=np.float32)
      finally:codes_release(gid)

def load_native_grid(staging:Path,expected_points:int):
    coord={}
    for param in ('CLAT','CLON'):
      files=sorted((staging/'grid'/param).glob('**/*.grib2*'))
      if not files:raise SystemExit(f'missing staged native-grid coordinate {param}')
      coord[param]=read_first_values(files[0])
      if len(coord[param])!=expected_points:raise SystemExit(f'{param}: coordinate point count differs from forecast grid')
    lats=coord['CLAT'].astype(np.float64);lons=coord['CLON'].astype(np.float64)
    # ICON CLAT/CLON are commonly encoded in radians; accept degrees as a future-safe form.
    if np.nanmax(np.abs(lats))<=math.pi/2+.05 and np.nanmax(np.abs(lons))<=math.pi+.05:
      lats=np.degrees(lats);lons=np.degrees(lons)
    if not np.all(np.isfinite(lats)) or not np.all(np.isfinite(lons)):raise SystemExit('CLAT/CLON contain non-finite native-grid coordinates')
    if np.nanmin(lats)<-90 or np.nanmax(lats)>90 or np.nanmin(lons)<-180 or np.nanmax(lons)>180:raise SystemExit('CLAT/CLON outside geographic coordinate bounds')
    return lats.astype(np.float32),lons.astype(np.float32)

def normalize(name,values,units):
    v=values.astype(np.float32,copy=True);u=units.lower()
    if name in {'temperature_2m','dew_point_2m','surface_temperature'} and (u=='k' or 'kelvin' in u or np.nanmedian(v)>100):v-=273.15
    if name=='pressure_msl' and (u=='pa' or np.nanmedian(v)>2000):v/=100
    if name in {'cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','relative_humidity_2m'} and np.nanmax(v)<=1.2:v*=100
    if name in {'convective_inhibition','cin_mu'}:v=np.abs(v)
    return v

def run_time(value:str):return datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(timezone.utc)
def hourly_targets(run:str,hours:int):
    base=run_time(run)
    targets=[base+timedelta(hours=h) for h in range(max(0,int(hours))+1)]
    return {'deterministic':targets,'eps':list(targets)}

def rapid_targets(run:str,minutes:int,hours:int):
    base=run_time(run);return [base+timedelta(minutes=lead) for lead in range(0,max(0,int(hours))*60+1,minutes)]

def collect_optional_parameter(files,name,targets,expected_points=None):
    if not files:return None
    rows={}
    for file in files:
      for valid,_member,vals,units in read_messages(file):
        if valid not in targets:continue
        if expected_points is not None and len(vals)!=expected_points:return None
        rows[valid]=normalize(name,vals,units)
    return rows if all(t in rows for t in targets) else None

def collect_optional_fields(staging_root:Path,param_map,targets,expected_points,specs):
    spec_by_name={spec.name:spec for spec in specs};fields={};selected_specs=[]
    for param,name in param_map.items():
      files=sorted((staging_root/param).glob('**/*.grib2*'))
      rows=collect_optional_parameter(files,name,targets,expected_points)
      if not rows:continue
      fields[name]=np.stack([rows[t] for t in targets]);selected_specs.append(spec_by_name[name])
    return fields,tuple(selected_specs)

def accumulation_intervals(rows,targets):
    cube=np.stack([rows[t] for t in targets]);return np.maximum(0,np.diff(cube,axis=0,prepend=cube[:1]))

def build_rapid_extreme_summary(lats,lons,run,rapid15_times,rapid15_precip,rapid15_cape,rapid15_cin,rapid5_precip,severe_fields=None):
    try: from scipy.spatial import cKDTree
    except Exception as e: raise SystemExit('scipy required for rapid extreme summary') from e
    rows,cols=13,23;south,west,north,east=43.45,-3.5,57.75,19.9
    def xyz(lat,lon):
      p=np.radians(lat);l=np.radians(lon);c=np.cos(p);return np.column_stack((c*np.cos(l),c*np.sin(l),np.sin(p)))
    tree=cKDTree(xyz(np.asarray(lats,dtype=np.float64),np.asarray(lons,dtype=np.float64)));cells=[]
    severe_fields=severe_fields or {};total6=np.nansum(rapid15_precip[1:],axis=0);max15=np.nanmax(rapid15_precip,axis=0);peak5=np.nanmax(rapid5_precip*12,axis=0);maxcape=np.nanmax(rapid15_cape,axis=0);mincin=np.nanmin(rapid15_cin,axis=0);maxdbz=np.nanmax(severe_fields['dbz_cmax'],axis=0) if 'dbz_cmax' in severe_fields else None;maxuh=np.nanmax(severe_fields['uh_max'],axis=0) if 'uh_max' in severe_fields else None;maxlpi=np.nanmax(severe_fields['lpi_max'],axis=0) if 'lpi_max' in severe_fields else (np.nanmax(severe_fields['lpi'],axis=0) if 'lpi' in severe_fields else None);maxecho=np.nanmax(severe_fields['echo_top_m'],axis=0) if 'echo_top_m' in severe_fields else None;maxhail=np.nanmax(severe_fields['hail_gsp'],axis=0) if 'hail_gsp' in severe_fields else None;maxcape_mu=np.nanmax(severe_fields['cape_mu'],axis=0) if 'cape_mu' in severe_fields else None;mincin_mu=np.nanmin(severe_fields['cin_mu'],axis=0) if 'cin_mu' in severe_fields else None
    for r in range(rows):
      lat=south+(north-south)*r/(rows-1)
      for c in range(cols):
        lon=west+(east-west)*c/(cols-1);distance,index=tree.query(xyz(np.array([lat]),np.array([lon]))[0],k=1);km=2*6371.0088*np.arcsin(min(1,float(distance)/2))
        if km>8:continue
        cell={'latitude':round(lat,4),'longitude':round(lon,4),'precipitation6h':round(float(total6[index]),2),'max15m':round(float(max15[index]),2),'peak5mRate':round(float(peak5[index]),1),'cape':round(float(maxcape[index]),0),'cin':round(float(mincin[index]),0)}
        if maxdbz is not None and np.isfinite(maxdbz[index]):cell['dbzCmax']=round(float(maxdbz[index]),1)
        if maxuh is not None and np.isfinite(maxuh[index]):cell['uhMax']=round(float(maxuh[index]),1)
        if maxlpi is not None and np.isfinite(maxlpi[index]):cell['lpiMax']=round(float(maxlpi[index]),1)
        if maxecho is not None and np.isfinite(maxecho[index]):cell['echoTopM']=round(float(maxecho[index]),0)
        if maxhail is not None and np.isfinite(maxhail[index]):cell['hailGspMax']=round(float(maxhail[index]),3)
        if maxcape_mu is not None and np.isfinite(maxcape_mu[index]):cell['capeMu']=round(float(maxcape_mu[index]),0)
        if mincin_mu is not None and np.isfinite(mincin_mu[index]):cell['cinMu']=round(float(mincin_mu[index]),0)
        cells.append(cell)
    return {'schema':'mid.dwd.ruc.rapid-extreme.v2','run':run,'windowHours':6,'nativePrecipitationSeconds':300,'convectiveSeconds':900,'grid':{'rows':rows,'cols':cols,'bounds':{'south':south,'west':west,'north':north,'east':east}},'cells':cells}

def collect_parameter(files,name,targets,expected_points=None):
    rows={}
    for file in files:
      for valid,_member,vals,units in read_messages(file):
        if valid not in targets:continue
        if expected_points is not None and len(vals)!=expected_points:raise SystemExit(f'{name}: native point count differs from deterministic reference')
        rows[valid]=normalize(name,vals,units)
    missing=[t for t in targets if t not in rows]
    if missing:raise SystemExit(f'{name}: missing hourly targets: '+','.join(t.isoformat() for t in missing[:4]))
    return rows

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

def collect_eps(files,targets,expected_points):
    rows={t:{} for t in targets}
    for file in files:
      for valid,member,vals,units in read_messages(file,ensemble=True):
        if valid not in rows:continue
        if len(vals)!=expected_points:raise SystemExit('RUC-EPS native point count differs from deterministic RUC grid')
        rows[valid][member]=normalize('precipitation_acc',vals,units)
    members=sorted(set.intersection(*(set(rows[t]) for t in targets))) if targets else []
    if len(members)<10:raise SystemExit(f'RUC-EPS has only {len(members)} common members')
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
 schedule=hourly_targets(a.run,a.hours)
 det_times=schedule['deterministic'];eps_times=schedule['eps'];series={};point_count=None
 for param,name in PARAM_MAP.items():
  files=sorted((a.staging/'deterministic'/param).glob('**/*.grib2*'))
  if not files:raise SystemExit(f'missing staged parameter {param}')
  rows=collect_parameter(files,name,det_times,point_count)
  if point_count is None:point_count=len(rows[det_times[0]])
  series[name]=rows
 base_grid=load_native_grid(a.staging,point_count)
 det_acc=np.stack([series['precipitation_acc'][t] for t in det_times]);prec=np.maximum(0,np.diff(det_acc,axis=0,prepend=det_acc[:1]))
 u=np.stack([series['u10'][t] for t in det_times]);v=np.stack([series['v10'][t] for t in det_times]);speed=np.hypot(u,v)*1.94384449;direction=(np.degrees(np.arctan2(-u,-v))+360)%360
 fields={}
 for spec in DEFAULT_FIELDS:
  n=spec.name
  if n=='wind_speed_10m':fields[n]=speed
  elif n=='wind_direction_10m':fields[n]=direction
  elif n=='wind_gusts_10m':fields[n]=np.stack([series[n][t] for t in det_times])*1.94384449
  elif n=='precipitation':fields[n]=prec
  else:fields[n]=np.stack([series[n][t] for t in det_times])
 det=a.output/'deterministic.bin';det.write_bytes(pack_cell_major(fields,DEFAULT_FIELDS))
 # Parameter-native rapid supplements. The shared state vector stays hourly;
 # rapid products preserve only cadences that DWD actually publishes.
 rapid5_times=rapid_targets(a.run,5,6);rapid15_times=rapid_targets(a.run,15,6)
 rapid_precip_files=sorted((a.staging/'rapid'/'TOT_PREC').glob('**/*.grib2*'))
 rapid_cape_files=sorted((a.staging/'rapid'/'CAPE_ML').glob('**/*.grib2*'));rapid_cin_files=sorted((a.staging/'rapid'/'CIN_ML').glob('**/*.grib2*'))
 rapid_acc5=collect_parameter(rapid_precip_files,'precipitation_acc',rapid5_times,point_count);rapid_acc15=collect_parameter(rapid_precip_files,'precipitation_acc',rapid15_times,point_count)
 rapid_cape=collect_parameter(rapid_cape_files,'cape',rapid15_times,point_count);rapid_cin=collect_parameter(rapid_cin_files,'convective_inhibition',rapid15_times,point_count)
 rapid_precip5=accumulation_intervals(rapid_acc5,rapid5_times);rapid_precip15=accumulation_intervals(rapid_acc15,rapid15_times)
 rapid5_path=a.output/'rapid-5m.bin';rapid5_path.write_bytes(pack_cell_major({'precipitation':rapid_precip5},RAPID_5M_FIELDS))
 rapid15_path=a.output/'rapid-15m.bin';rapid15_path.write_bytes(pack_cell_major({'precipitation':rapid_precip15,'cape':np.stack([rapid_cape[t] for t in rapid15_times]),'convective_inhibition':np.stack([rapid_cin[t] for t in rapid15_times])},RAPID_15M_FIELDS))

 # Reflectivity is intentionally fixed to the advertised DBZ_CMAX 15-minute path.
 dbz_files=sorted((a.staging/'rapid-optional'/'DBZ_CMAX').glob('**/*.grib2*'));dbz_path=None;dbz_cube=None
 dbz_rows=collect_optional_parameter(dbz_files,'dbz_cmax',rapid15_times,point_count)
 if dbz_rows:
  dbz_cube=np.stack([dbz_rows[t] for t in rapid15_times]);dbz_path=a.output/'rapid-reflectivity-15m.bin';dbz_path.write_bytes(pack_cell_major({'dbz_cmax':dbz_cube},REFLECTIVITY_15M_FIELDS))

 severe_fields,severe_specs=collect_optional_fields(a.staging/'rapid-optional',SEVERE_PARAM_MAP,rapid15_times,point_count,SEVERE_15M_FIELDS)
 if dbz_cube is not None:
  severe_fields={'dbz_cmax':dbz_cube,**severe_fields}
 severe_path=None
 if severe_specs:
  severe_path=a.output/'rapid-severe-15m.bin';severe_path.write_bytes(pack_cell_major(severe_fields,severe_specs))
 solar_fields,solar_specs=collect_optional_fields(a.staging/'rapid-optional',SOLAR_PARAM_MAP,rapid15_times,point_count,SOLAR_15M_FIELDS)
 solar_path=None
 if solar_specs:
  solar_path=a.output/'rapid-solar-15m.bin';solar_path.write_bytes(pack_cell_major(solar_fields,solar_specs))
 specialist_fields,specialist_specs=collect_optional_fields(a.staging/'specialist-hourly',SPECIALIST_PARAM_MAP,det_times,point_count,SPECIALIST_HOURLY_FIELDS)
 specialist_path=None
 if specialist_specs:
  specialist_path=a.output/'specialist-hourly.bin';specialist_path.write_bytes(pack_cell_major(specialist_fields,specialist_specs))

 phase_path=None
 rain_files=sorted((a.staging/'rapid-optional'/'RAIN_GSP').glob('**/*.grib2*'));snow_files=sorted((a.staging/'rapid-optional'/'SNOW_GSP').glob('**/*.grib2*'));graupel_files=sorted((a.staging/'rapid-optional'/'GRAU_GSP').glob('**/*.grib2*'))
 rain_rows=collect_optional_parameter(rain_files,'rain_acc',rapid15_times,point_count);snow_rows=collect_optional_parameter(snow_files,'snow_acc',rapid15_times,point_count);graupel_rows=collect_optional_parameter(graupel_files,'graupel_acc',rapid15_times,point_count)
 if rain_rows and snow_rows:
  rain15=accumulation_intervals(rain_rows,rapid15_times);snow15=accumulation_intervals(snow_rows,rapid15_times);graupel15=accumulation_intervals(graupel_rows,rapid15_times) if graupel_rows else np.zeros_like(rain15);phase_path=a.output/'rapid-phase-15m.bin';phase_path.write_bytes(pack_cell_major({'rain':rain15,'snowfall_water_equivalent':snow15,'graupel_water_equivalent':graupel15},PHASE_15M_FIELDS))
 grid=build_lookup(base_grid[0],base_grid[1],a.output,a.lookup_step)
 severe_for_extreme=dict(severe_fields)
 if dbz_cube is not None:severe_for_extreme['dbz_cmax']=dbz_cube
 extreme=build_rapid_extreme_summary(base_grid[0],base_grid[1],a.run,rapid15_times,rapid_precip15,np.stack([rapid_cape[t] for t in rapid15_times]),np.stack([rapid_cin[t] for t in rapid15_times]),rapid_precip5,severe_for_extreme)
 extreme_path=a.output/'rapid-extreme.json';extreme_path.write_text(json.dumps(extreme,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 eps_files=sorted((a.staging/'eps'/'TOT_PREC').glob('**/*.grib2*'))
 if not eps_files:raise SystemExit('missing staged RUC-EPS TOT_PREC')
 eps,members=collect_eps(eps_files,eps_times,point_count);eps_path=a.output/'eps-members.bin';eps_path.write_bytes(pack_eps_members(eps,.01))
 summary_path=a.output/'eps-summary.bin';summary_path.write_bytes(pack_cell_major(eps_summary(eps),EPS_SUMMARY_FIELDS))
 run_key=re.sub(r'[^0-9A-Za-z_-]','',a.run);lookup_path=a.output/'lookup.bin'
 object_paths={'deterministic.bin':det,'eps-summary.bin':summary_path,'eps-members.bin':eps_path,'lookup.bin':lookup_path,'rapid-5m.bin':rapid5_path,'rapid-15m.bin':rapid15_path,'rapid-extreme.json':extreme_path}
 for optional_path in (dbz_path,severe_path,solar_path,specialist_path,phase_path):
  if optional_path:object_paths[optional_path.name]=optional_path
 objects={name:file_info(path) for name,path in object_paths.items()}
 det_serialized=[t.strftime('%Y-%m-%dT%H:%M') for t in det_times];eps_serialized=[t.strftime('%Y-%m-%dT%H:%M') for t in eps_times];rapid5_serialized=[t.strftime('%Y-%m-%dT%H:%M') for t in rapid5_times];rapid15_serialized=[t.strftime('%Y-%m-%dT%H:%M') for t in rapid15_times]
 def rapid_spec(path,times,specs,resolution,horizon):return {'key':f'runs/{run_key}/{path.name}','dtype':'int16-le','layout':'point-time-field','times':times,'fields':[{'name':x.name,'unit':x.unit,'scale':x.scale,'offset':x.offset} for x in specs],'recordBytes':len(times)*len(specs)*2,'nativeResolutionSeconds':resolution,'horizonHours':horizon}
 rapid={'precip5':rapid_spec(rapid5_path,rapid5_serialized,RAPID_5M_FIELDS,300,6),'convection15':rapid_spec(rapid15_path,rapid15_serialized,RAPID_15M_FIELDS,900,6)}
 if dbz_path:rapid['reflectivity15']=rapid_spec(dbz_path,rapid15_serialized,REFLECTIVITY_15M_FIELDS,900,6)
 if severe_path:rapid['severe15']=rapid_spec(severe_path,rapid15_serialized,severe_specs,900,6)
 if solar_path:rapid['solar15']=rapid_spec(solar_path,rapid15_serialized,solar_specs,900,6)
 if phase_path:rapid['phase15']=rapid_spec(phase_path,rapid15_serialized,PHASE_15M_FIELDS,900,6)
 if specialist_path:rapid['specialistHourly']=rapid_spec(specialist_path,det_serialized,specialist_specs,3600,14)
 rapid_extreme={'key':f'runs/{run_key}/rapid-extreme.json','schema':'mid.dwd.ruc.rapid-extreme.v2','windowHours':6}
 write_meta(a.output/'latest.json',run=a.run,times=det_serialized,point_count=point_count,specs=DEFAULT_FIELDS,grid=grid,deterministic_key=f'runs/{run_key}/deterministic.bin',eps_key=f'runs/{run_key}/eps-members.bin',eps_summary_key=f'runs/{run_key}/eps-summary.bin',lookup_key=f'runs/{run_key}/lookup.bin',member_count=len(members),eps_scale=.01,objects=objects,deterministic_times=det_serialized,eps_summary_times=eps_serialized,eps_times=eps_serialized,rapid=rapid,rapid_extreme=rapid_extreme)
 print(json.dumps({'run':a.run,'deterministicTimes':len(det_times),'rapid5Times':len(rapid5_times),'rapid15Times':len(rapid15_times),'epsTimes':len(eps_times),'points':point_count,'members':len(members),'reflectivity15':bool(dbz_path),'severe15Fields':[x.name for x in severe_specs],'solar15Fields':[x.name for x in solar_specs],'specialistHourlyFields':[x.name for x in specialist_specs],'phase15':bool(phase_path),'detBytes':det.stat().st_size,'rapid5Bytes':rapid5_path.stat().st_size,'rapid15Bytes':rapid15_path.stat().st_size,'epsSummaryBytes':summary_path.stat().st_size,'epsBytes':eps_path.stat().st_size,'lookupBytes':lookup_path.stat().st_size}))
if __name__=='__main__':main()
