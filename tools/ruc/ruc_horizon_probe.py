"""Bounded read-only native DWD +27h numerical/map preflight; never publishes.

Uses the same GRIB header, bitmap, unit, accumulation and core integrity readers
as the released preprocessor. EPS and production fusion are explicitly excluded.
"""
from __future__ import annotations
import argparse,hashlib,json,re,tempfile,time
from datetime import datetime,timezone
from pathlib import Path
import numpy as np
from fetch_and_build_ruc import (DET_BASE,FORECAST_REQUIRED,GRID_REQUIRED,session,runs,crawl_files,select_requested_files,forecast_lead_minutes,stage_tree,stage_coordinate)
from build_ruc_bundle import (PARAM_MAP,collect_parameter,hourly_targets,load_native_grid,derive_core_fields,build_lookup,file_info)
from meteo_integrity import validate_core_fields
from ruc_pack import DEFAULT_FIELDS,pack_cell_major,write_meta
from ruc_map_candidate import build_candidate


def verify_hourly_listing(files,hours):
 selected=select_requested_files(files,hours,mode='hourly')
 leads=[forecast_lead_minutes(f) for f in selected]
 if any(v is None for v in leads) or len(leads)!=len(set(leads)) or set(leads)!={h*60 for h in range(hours+1)}:
  raise ValueError('not exactly one native file per required hourly target')
 return len(leads)


def probe_run(run,work,output,hours=27,admission=False):
 start=time.monotonic();s=session();stage=work/'stage';source=work/'source';source.mkdir()
 # Validate availability before large transfers. A newly advertised directory
 # alone is not a complete run; incomplete candidates are reported separately.
 inventory={}
 for param in FORECAST_REQUIRED:
  url=f'{DET_BASE}/{param}/r/{run}/'
  inventory[param]=verify_hourly_listing(crawl_files(s,url),hours)
 targets=hourly_targets(run,hours)['deterministic'];series={};point_count=None;origins=[]
 for param,name in PARAM_MAP.items():
  folder=stage/'deterministic'/param
  rows=stage_tree(s,f'{DET_BASE}/{param}/r/{run}/',folder,hours,f'probe {run} {param}',mode='hourly')
  files=[folder/row for row in rows]
  decoded=collect_parameter(files,name,targets,point_count)
  if point_count is None:point_count=len(decoded[targets[0]])
  series[name]=decoded
  origins.extend({'field':param,'file':row,**file_info(folder/row)} for row in rows)
 for param in GRID_REQUIRED:
  stage_coordinate(s,f'{DET_BASE}/{param}/r/{run}/',stage/'grid'/param,f'probe {run} {param}')
  origins.extend({'field':param,'file':p.name,**file_info(p)} for p in (stage/'grid'/param).glob('**/*.grib2*'))
 lats,lons=load_native_grid(stage,point_count)
 fields=derive_core_fields(series,targets);coverage=validate_core_fields(fields)
 # Preserve existing int16 representability: a probe must not silently claim
 # validation of extrema which the established packer would clip.
 for spec in DEFAULT_FIELDS:
  finite=fields[spec.name][np.isfinite(fields[spec.name])]
  q=np.rint((finite-spec.offset)/spec.scale)
  if np.any(np.abs(q)>32767):raise ValueError('unrepresentable int16 native values: '+spec.name)
 (source/'deterministic.bin').write_bytes(pack_cell_major(fields,DEFAULT_FIELDS))
 grid=build_lookup(lats,lons,source)
 objects={name:file_info(source/name) for name in ('deterministic.bin','lookup.bin')}
 write_meta(source/'latest.json',run=run,times=[t.strftime('%Y-%m-%dT%H:%M') for t in targets],point_count=point_count,specs=DEFAULT_FIELDS,grid=grid,deterministic_key='runs/probe/deterministic.bin',eps_key=None,lookup_key='runs/probe/lookup.bin',objects=objects)
 # The three-run existing preflight also proves all nine new real components.
 from build_ruc_synoptic_fields import build as build_composites
 composites=build_composites(source,stage,output/'composites',hours)
 candidate=build_candidate(source,output/'maps')
 admission_proof=None
 if admission:
  from ruc_map_admission_probe import probe_admission
  admission_proof=probe_admission(source,work)
 metrics={name:{'min':float(np.nanmin(values)),'max':float(np.nanmax(values))} for name,values in fields.items()}
 return {'run':run,'hours':hours,'rucCompositeFrames':len(composites['model']['frames']),'rucCompositeSources':len(composites['origins']),'nativePointCount':point_count,'hourlyInventory':inventory,'sourceGribFiles':origins,'coverage':coverage,'extrema':metrics,'deterministicBytes':objects['deterministic.bin']['bytes'],'additionalCoreBytesVs14':point_count*max(0,hours-14)*len(DEFAULT_FIELDS)*2,'mapCandidateBytes':candidate['candidateBytes'],'mapIndexSha256':file_info(output/'maps'/'index.json')['sha256'],'sourceManifestSha256':candidate['sourceManifestSha256'],'durationSeconds':round(time.monotonic()-start,2),'mapAdmissionFixture':admission_proof,'nativeHourlyVerified':True,'epsVerified':False,'readyForProduction':False}


def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);p.add_argument('--runs',type=int,default=3);p.add_argument('--candidate-count',type=int,default=6);p.add_argument('--admission',action='store_true');a=p.parse_args()
 if not 1<=a.runs<=3 or not a.runs<=a.candidate_count<=6:raise SystemExit('probe bounds: 1..3 runs, at most six candidates')
 if a.output.exists():raise SystemExit('probe output must be new')
 a.output.mkdir(parents=True);report={'schema':'mid.ruc.horizon-probe.v1','generatedAtUtc':datetime.now(timezone.utc).isoformat(),'hours':27,'runs':[],'excludedCandidates':[],'readyForProduction':False,'productionEnabled':False,'epsVerified':False}
 def save():(a.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,allow_nan=False,indent=2)+'\n')
 try:
  candidates=sorted(runs(session(),DET_BASE,'T_2M'),reverse=True)[:a.candidate_count]
  for run in candidates:
   output=a.output/re.sub('[^A-Za-z0-9_-]','',run);output.mkdir()
   try:
    with tempfile.TemporaryDirectory(prefix='mid-ruc-horizon-') as tmp:
     result=probe_run(run,Path(tmp),output,admission=a.admission)
    report['runs'].append(result)
   except (Exception,SystemExit) as e:
    report['excludedCandidates'].append({'run':run,'reason':type(e).__name__+': '+str(e)[:500]})
   save()
   if len(report['runs'])==a.runs:break
  report['pilotVerified']=len(report['runs'])==a.runs;save()
  return 0 if report['pilotVerified'] else 2
 except (Exception,SystemExit) as e:
  report['error']=type(e).__name__+': '+str(e)[:500];report['pilotVerified']=False;save();return 2
if __name__=='__main__':raise SystemExit(main())
