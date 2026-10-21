"""Native RUC same-cycle composites; optional sidecar, never changes core/EPS.

All pressure levels and WW are checked from GRIB headers, bitmap and native grid.
The existing verified lookup supplies one common nearest-cell display geometry.
"""
from __future__ import annotations
import gzip,hashlib,json,re,shutil
from datetime import timedelta
from pathlib import Path
import numpy as np
from eccodes import codes_grib_new_from_file,codes_get,codes_get_long,codes_release
from fetch_and_build_ruc import DET_BASE,session,stage_tree
from grib_stream import open_grib_stream
from grib_metadata import inspect_grib_header,validate_time_window
from grib_bitmap import decode_bitmap_values
from ruc_map_candidate import checked_object,compact,utc_time
from build_synoptic_fields import write_fields
from augment_compressed_synoptic import within
from admit_ruc_map_candidate import verify_snapshot,sha,SnapshotIntegrityError

# WMO GRIB2 discipline/category/number, native first surface, declared units.
COMPONENTS=(('T',850,'t',(0,0,0),('K',)),('RELHUM',850,'relhum',(0,1,1),('%',)),
 ('FI',500,'fi',(0,3,4),('m**2 s**-2',)),('PMSL',None,'pmsl',(0,3,1),('Pa',)),
 ('RELHUM',700,'relhum',(0,1,1),('%',)),('U',300,'u',(0,2,2),('m s**-1',)),
 ('V',300,'v',(0,2,3),('m s**-1',)),('CLCT',None,'clct',(0,6,1),('%',)),
 ('WW',None,'ww',(0,19,25),('Numeric','Code table (4.201)','~')))
BOUNDS={'t':(170,340),'relhum':(0,150),'fi':(350,650),'pmsl':(850,1100),'u':(-200,200),'v':(-200,200),'clct':(0,100.01),'ww':(0,99)}

def decode(path,run,hour,component):
 param,level,field,identity,units=component;found=[]
 with open_grib_stream(path) as stream:
  while (gid:=codes_grib_new_from_file(stream)) is not None:
   try:
    valid,sig=inspect_grib_header(gid,run)
    actual=tuple(int(codes_get_long(gid,k)) for k in ('discipline','parameterCategory','parameterNumber'))
    if actual!=identity or sig[-2]!='unstructured_grid' or sig[8] is None:raise ValueError(f'RUC {param}/{level}: parameter/native grid mismatch {actual}, {sig[8]}')
    first,second=sig[5],sig[6]
    expected=(100,level*100) if level is not None else (101,0) if field=='pmsl' else (1,0)
    if first!=expected or second!=(255,None) or codes_get(gid,'stepType')!='instant':raise ValueError(f'RUC {param}/{level}: level/processing mismatch {first}/{second}')
    validate_time_window(run,valid,codes_get(gid,'startStep'),codes_get(gid,'endStep'),int(codes_get_long(gid,'stepUnits')),'instant')
    if valid!=run+timedelta(hours=hour) or str(codes_get(gid,'units')) not in units:raise ValueError(f'RUC {param}/{level}: valid time/unit mismatch {valid}/{codes_get(gid,"units")}')
    values=decode_bitmap_values(gid).astype(np.float64)
    if field=='fi':values/=98.0665
    if field=='pmsl':values/=100
    low,high=BOUNDS[field];finite=values[np.isfinite(values)]
    if not finite.size or np.any(finite<low) or np.any(finite>high) or field=='ww' and np.any(finite!=np.rint(finite)):raise ValueError('RUC physical/categorical values invalid')
    found.append(values)
   finally:codes_release(gid)
 if len(found)!=1:raise ValueError('RUC source must contain exactly one requested GRIB')
 return found[0]

def build(source,staging,output,hours=27):
 source=Path(source).resolve(strict=True);output=Path(output).resolve();staging=Path(staging).resolve()
 if output.exists() or output.is_relative_to(source) or source.is_relative_to(output):raise ValueError('new disjoint RUC sidecar required')
 original=(source/'latest.json').read_bytes();meta=json.loads(original);run=utc_time(meta['run'])
 lookup_raw=checked_object(source,meta,'lookup.bin');g=meta.get('lookup',{}).get('grid',meta.get('grid'))
 nx,ny=g['nx'],g['ny'];xs=g['lonMin']+np.arange(nx)*g['dx'];ys=g['latMin']+np.arange(ny)*g['dy']
 rows=np.flatnonzero((ys>=47)&(ys<=55.2));cols=np.flatnonzero((xs>=5.5)&(xs<=15.6))
 lookup=np.frombuffer(lookup_raw,dtype='<u4').reshape(ny,nx)[np.ix_(rows,cols)];known=lookup!=0xffffffff
 if rows.size<10 or cols.size<10 or np.any(lookup[known]>=meta['pointCount']) or not 0<g['maxNearestKm']<=5:raise ValueError('RUC lookup geometry invalid')
 fields={};origins=[];s=session();stamp=meta['run'];n=hours+1
 for component in COMPONENTS:
  param,level,field,_,_=component
  root=f'{DET_BASE}/{param}'+(f'/lvt1/100/lv1/{level*100}' if level is not None else '')+f'/r/{stamp}/'
  folder=staging/'ruc-synoptic'/param/str(level or 'surface')
  if level is None and param in ('PMSL','CLCT'):
   core_stage=staging/re.sub(r'[^0-9A-Za-z_-]','',stamp)/'deterministic'/param
   probe_stage=staging/'deterministic'/param
   if core_stage.is_dir():folder=core_stage
   elif probe_stage.is_dir():folder=probe_stage
  files=stage_tree(s,root,folder,hours,f'RUC composite {param}/{level}',mode='hourly')
  from fetch_and_build_ruc import forecast_lead_minutes
  seen=set()
  for rel in files:
   path=folder/rel;lead=forecast_lead_minutes(path.as_posix())
   if lead is None or lead%60 or not 0<=lead//60<=hours or lead in seen:raise ValueError('RUC composite hourly inventory invalid')
   seen.add(lead);hour=lead//60;native=decode(path,run,hour,component)
   if native.size!=meta['pointCount']:raise ValueError('RUC grid dimension drift')
   values=np.full(lookup.shape,np.nan);values[known]=native[lookup[known]]
   if np.isfinite(values).mean()<.4:raise ValueError('RUC insufficient displayed coverage')
   fields[(hour,field,level)]=values
   origins.append({'parameter':param,'levelHpa':level,'hour':hour,'url':root+rel,'bytes':path.stat().st_size,'sha256':sha(path.read_bytes())})
  if seen!={h*60 for h in range(n)}:raise ValueError('RUC composite incomplete hourly axis')
 output.mkdir(parents=True)
 try:
  frames=write_fields(output,'icon-d2-ruc',run,2.2,fields,ys[rows].round(6),xs[cols].round(6),range(n))
  for ref in frames:
   p=output/ref['file'];data=json.loads(gzip.decompress(p.read_bytes()));h=ref['hour']
   if np.count_nonzero(np.isfinite(fields[(h,'clct',None)]) & np.isfinite(fields[(h,'ww',None)]))/lookup.size<.4:raise ValueError('RUC insufficient paired cloud/WW coverage')
   data['sampling']='nearest-native-cell'
   data['cloudWeather']={'cloudUnit':'%','weatherUnit':'WMO 4677','cloudScale':.1,
    'cloud':[int(round(v*10)) if np.isfinite(v) else None for v in fields[(h,'clct',None)].ravel()],
    'weather':[int(v) if np.isfinite(v) else None for v in fields[(h,'ww',None)].ravel()]}
   raw=compact(data)
   if len(raw)>12_000_000:raise ValueError('RUC composite decode budget')
   wire=gzip.compress(raw,mtime=0);p.write_bytes(wire);ref.update(bytes=len(wire),decodedBytes=len(raw),sha256=sha(wire),cloudWeather=True)
  index={'schema':'mid.ruc.synoptic-fields.v1','modelId':'icon-d2-ruc','run':run.isoformat(),'sampling':'nearest-native-cell','maxNearestKm':g['maxNearestKm'],
   'sourceManifestSha256':sha(original),'sourceLookupSha256':sha(lookup_raw),'origins':origins,
   'model':{'label':'DWD ICON-D2-RUC','run':run.isoformat(),'resolutionKm':2.2,'license':'CC BY 4.0','frames':frames}}
  (output/'index.json').write_bytes(compact(index))
  if (source/'latest.json').read_bytes()!=original or checked_object(source,meta,'lookup.bin')!=lookup_raw:raise ValueError('RUC source drift')
  return index
 except BaseException:
  shutil.rmtree(output,ignore_errors=True);raise

def admit(snapshot,source,staging,candidate):
 snapshot=Path(snapshot).resolve(strict=True);meta,original=verify_snapshot(snapshot)
 old_objects=list(meta['pages']['objects'])
 source=Path(source).resolve(strict=True);source_meta=json.loads((source/'latest.json').read_bytes())
 if utc_time(meta['run'])!=utc_time(source_meta['run']):raise SnapshotIntegrityError('RUC sidecar run differs from published core')
 if source_meta['pointCount']!=meta['pointCount'] or source_meta.get('lookup',{}).get('grid',source_meta.get('grid'))!=meta.get('lookup',{}).get('grid',meta.get('grid')):raise ValueError('RUC sidecar lookup metadata differs from core')
 lookup=checked_object(source,source_meta,'lookup.bin');lp=meta['lookup']['pages'];digest=hashlib.sha256();size=0
 if lp['recordBytes']!=4 or not 1<=lp['chunkCount']<=8192:raise SnapshotIntegrityError('RUC lookup page geometry invalid')
 for i in range(lp['chunkCount']):
  data=within(snapshot,lp['prefix']+'/'+str(i).zfill(4)+'.bin').read_bytes();digest.update(data);size+=len(data)
 if digest.hexdigest()!=sha(lookup) or size!=len(lookup) or size!=lp['records']*4:raise ValueError('RUC sidecar lookup differs from published core')
 candidate=Path(candidate);index=build(source,staging,candidate)
 raw=(candidate/'index.json').read_bytes()
 for ref in index['model']['frames']:
  wire=(candidate/ref['file']).read_bytes()
  if len(wire)!=ref['bytes'] or sha(wire)!=ref['sha256']:raise ValueError('RUC candidate frame size/SHA drift')
 if {p.name for p in candidate.iterdir()}!={'index.json',*(r['file'] for r in index['model']['frames'])}:raise ValueError('undeclared RUC candidate file')
 _,rechecked=verify_snapshot(snapshot)
 if rechecked!=original:raise SnapshotIntegrityError('RUC snapshot drift during preparation')
 prefix='runs/'+meta['run'].replace(':','').replace('.','')+'__ruc_synoptic_'+sha(raw)[:16]+'/ruc-synoptic-fields'
 destination=within(snapshot,prefix)
 if destination.exists():raise ValueError('immutable RUC sidecar destination exists')
 objects=[{'key':prefix+'/'+p.name,'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(candidate.iterdir())]
 meta['pages']['objects'].extend(objects);meta['pages']['publishedBytes']+=sum(o['bytes'] for o in objects)
 meta['rucSynopticFields']={'key':prefix+'/index.json','bytes':len(raw),'sha256':sha(raw)}
 encoded=compact(meta)
 if meta['pages']['publishedBytes']+len(encoded)>=900_000_000:raise ValueError('RUC snapshot budget exceeded')
 if (snapshot/'latest.json').read_bytes()!=original:raise SnapshotIntegrityError('RUC snapshot drift')
 temporary=snapshot/'latest.json.ruc-synoptic-tmp';created_temporary=False
 if temporary.exists():raise SnapshotIntegrityError('pending RUC snapshot transaction')
 try:
  shutil.copytree(candidate,destination)
  for o in objects:
   if sha(within(snapshot,o['key']).read_bytes())!=o['sha256']:raise ValueError('RUC copied asset checksum')
  from admit_ruc_map_candidate import verify_inventory
  verify_inventory(snapshot,old_objects)
  if (snapshot/'latest.json').read_bytes()!=original:raise SnapshotIntegrityError('RUC snapshot drift during copy')
  created_temporary=True;temporary.write_bytes(encoded);temporary.replace(snapshot/'latest.json')
 except BaseException:
  # A signal after atomic promotion must never remove its now-live objects.
  if (snapshot/'latest.json').read_bytes()==original:
   shutil.rmtree(destination,ignore_errors=True)
   try:destination.parent.rmdir()
   except OSError:pass
   if created_temporary:temporary.unlink(missing_ok=True)
  raise
 return {'admitted':True,'run':index['run'],'hours':27,'frames':len(index['model']['frames']),'origins':len(index['origins']),'finalPhysicalBytes':meta['pages']['publishedBytes']+len(encoded),'coreAndEpsUnchanged':True}

if __name__=='__main__':
 import argparse,signal,sys
 def interrupted(*_):raise TimeoutError('bounded RUC composite preparation interrupted')
 signal.signal(signal.SIGTERM,interrupted)
 p=argparse.ArgumentParser(description=__doc__)
 for key in ('snapshot','source','staging','candidate'):p.add_argument('--'+key,type=Path,required=True)
 p.add_argument('--report',type=Path)
 a=p.parse_args()
 try:
  proof=admit(a.snapshot,a.source,a.staging,a.candidate)
  if a.report:a.report.write_bytes(compact(proof))
  print(json.dumps(proof))
 except SnapshotIntegrityError as error:
  print('RUC snapshot integrity: '+str(error),file=sys.stderr);sys.exit(3)
