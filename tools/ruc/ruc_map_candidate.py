"""Offline RUC map candidate from an already verified hourly point bundle.

Produces an explicitly nearest-cell display grid, never interpolated meteorology.
Does not publish or mutate any manifest. A separate admission gate is required.
"""
from __future__ import annotations
import argparse,gzip,hashlib,json,math,os,shutil,tempfile
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np

PARAMETERS={
 'temperature':('temperature_2m','°C',1.,(-100.,70.)),
 'pressure':('pressure_msl','hPa',1.,(800.,1100.)),
 'wind':('wind_speed_10m','km/h',1.852,(0.,600.)),
 'gust':('wind_gusts_10m','km/h',1.852,(0.,600.)),
 'cloud':('cloud_cover','%',1.,(0.,100.1)),
 'precipitation':('precipitation','mm/1 h',1.,(0.,6500.)),
}

def utc_time(value):
 parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
 return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)

def compact(value):
 return (json.dumps(value,ensure_ascii=False,allow_nan=False,separators=(',',':'))+'\n').encode()

def checked_object(root,meta,name):
 """The bundle's local object name is fixed by this caller, not by metadata."""
 path=root/name
 descriptor=meta.get('objects',{}).get(name)
 if not isinstance(descriptor,dict):raise ValueError('missing source object descriptor: '+name)
 data=path.read_bytes()
 if len(data)!=descriptor.get('bytes') or hashlib.sha256(data).hexdigest()!=descriptor.get('sha256'):
  raise ValueError('source object size/SHA mismatch: '+name)
 return data

def recheck_object(root,meta,name):
 """Check the original object still matches its pinned SHA without rereading it into RAM."""
 descriptor=meta.get('objects',{}).get(name)
 if not isinstance(descriptor,dict):raise ValueError('missing source object descriptor: '+name)
 h=hashlib.sha256();size=0
 with (root/name).open('rb') as stream:
  for part in iter(lambda:stream.read(1048576),b''):
   size+=len(part);h.update(part)
 if size!=descriptor.get('bytes') or h.hexdigest()!=descriptor.get('sha256'):
  raise ValueError('source object changed during map generation: '+name)


def decode_display(cube,lookup,field_index,spec,factor,bounds):
 """NoData from either lookup or source stays null, including at grid edges."""
 if cube.ndim!=3 or lookup.ndim!=2 or not all(cube.shape) or not lookup.size:
  raise ValueError('empty or invalid point/time/field/display dimensions')
 valid=lookup!=np.uint32(0xffffffff)
 if np.any(valid & (lookup>=cube.shape[0])):raise ValueError('lookup exceeds native grid')
 indices=np.where(valid,lookup,0)
 raw=cube[indices,:,field_index]
 known=valid[:,:,None] & (raw!=-32768)
 values=(raw.astype(np.float64)*spec['scale']+spec.get('offset',0))*factor
 lo,hi=bounds
 if np.any(known & ((values<lo)|(values>hi))):raise ValueError('map field outside physical contract')
 # Preserve the source precision; display values use at least hundredths.
 scale=min(.01,float(spec['scale'])*factor)
 result=[]
 for time_index in range(cube.shape[1]):
  mask=known[:,:,time_index]
  if not mask.any():raise ValueError('fully missing map time')
  quantized=np.rint(values[:,:,time_index]/scale)
  result.append([int(v) if ok else None for v,ok in zip(quantized.ravel(),mask.ravel())])
 return scale,result

def audit_native_frame(cube,lookup,field_index,time_index,spec,factor,bounds):
 """Audit the entire quantized native field, not only the selected map crop.

 GRIB-original extrema may be different after the source's lossless transport
 and intentional int16 quantization. Missing sentinel is never a dry zero.
 """
 native=cube[:,time_index,field_index]
 native_ok=native!=-32768
 if not np.any(native_ok):raise ValueError('fully missing native map time')
 physical=(native[native_ok].astype(np.float64)*spec['scale']+spec.get('offset',0))*factor
 lo,hi=bounds
 if np.any(~np.isfinite(physical)|(physical<lo)|(physical>hi)):
  raise ValueError('native map field outside physical contract')
 inside=lookup!=np.uint32(0xffffffff)
 sampled=native[lookup[inside].astype(np.intp)]
 sampled_ok=sampled!=-32768
 if not np.any(sampled_ok):raise ValueError('fully missing sampled map time')
 shown=(sampled[sampled_ok].astype(np.float64)*spec['scale']+spec.get('offset',0))*factor
 core_min,core_max=float(physical.min()),float(physical.max())
 shown_min,shown_max=float(shown.min()),float(shown.max())
 return {'packedCoreExtrema':[core_min,core_max],
         'sampledExtrema':[shown_min,shown_max],
         'nativeMissingCount':int(native.size-np.count_nonzero(native_ok)),
         'sampledMissingCount':int(lookup.size-np.count_nonzero(sampled_ok)),
         'nativeExtremeNotSampled':bool(core_min<shown_min-1e-9 or core_max>shown_max+1e-9),
         'packedCoreExtremaMayDifferFromOriginalGrib':True}


def build_candidate(source:Path,output:Path):
 source=Path(source).resolve(strict=True);output=Path(output).resolve()
 if source==output or source.is_relative_to(output) or output.is_relative_to(source):
  raise ValueError('map candidate must be outside source and its parents')
 if output.exists():raise ValueError('map candidate output must be new')
 manifest_bytes=(source/'latest.json').read_bytes()
 if len(manifest_bytes)>8_000_000:raise ValueError('source manifest exceeds size budget')
 meta=json.loads(manifest_bytes)
 if meta.get('schema')!='mid.dwd.ruc.grid.v2':raise ValueError('unsupported RUC source schema')
 run=utc_time(meta['run'])
 if run.minute or run.second or run.microsecond:raise ValueError('RUC initialization is not a full UTC hour')
 det=meta['deterministic'];times=det['times'];specs=det['fields'];points=meta['pointCount']
 if type(points) is not int or not 1<=points<=1_000_000 or not isinstance(specs,list) or not 1<=len(specs)<=32:
  raise ValueError('invalid source dimensions')
 if not 2<=len(times)<=28 or any(utc_time(t)!=run+timedelta(hours=i) for i,t in enumerate(times)):
  raise ValueError('non-contiguous absolute hourly RUC axis')
 if det['dtype']!='int16-le' or det['layout']!='point-time-field' or det['recordBytes']!=len(times)*len(specs)*2:
  raise ValueError('unsupported deterministic geometry')
 raw=checked_object(source,meta,'deterministic.bin')
 if len(raw)!=points*det['recordBytes']:raise ValueError('source deterministic dimensions')
 cube=np.frombuffer(raw,dtype='<i2').reshape(points,len(times),len(specs))
 grid=meta['lookup']['grid'] if 'grid' in meta['lookup'] else meta['grid']
 # The existing verified lookup is used as-is. Crop only, never regrid values.
 nx,ny=grid['nx'],grid['ny']
 if any(type(n) is not int or not 2<=n<=2000 for n in (nx,ny)) or any(not isinstance(grid[k],(int,float)) or not math.isfinite(grid[k]) for k in ('lonMin','latMin','dx','dy','maxNearestKm')) or not (0<grid['dx']<=1 and 0<grid['dy']<=1 and 0<grid['maxNearestKm']<=5):
  raise ValueError('invalid source lookup geometry')
 lookup_raw=checked_object(source,meta,'lookup.bin')
 if len(lookup_raw)!=nx*ny*4:raise ValueError('source lookup dimensions')
 xs=grid['lonMin']+np.arange(nx)*grid['dx'];ys=grid['latMin']+np.arange(ny)*grid['dy']
 rows=np.flatnonzero((ys>=47)&(ys<=55.2));cols=np.flatnonzero((xs>=5.5)&(xs<=15.6))
 if len(rows)<2 or len(cols)<2:raise ValueError('display crop not covered')
 lookup=np.frombuffer(lookup_raw,dtype='<u4').reshape(ny,nx)[np.ix_(rows,cols)]
 index={'schema':'mid.ruc.map-candidate.v1','modelId':'icon-d2-ruc','productionEnabled':False,'readyForProduction':False,'run':run.isoformat(),'sourceManifestSha256':hashlib.sha256(manifest_bytes).hexdigest(),'sourceDeterministicSha256':meta['objects']['deterministic.bin']['sha256'],'sourceLookupSha256':meta['objects']['lookup.bin']['sha256'],'sampling':'nearest-native-cell','maxNearestKm':grid['maxNearestKm'],'products':{}}
 files={}
 for kind,(name,unit,factor,bounds) in PARAMETERS.items():
  matches=[(i,s) for i,s in enumerate(specs) if s.get('name')==name]
  if len(matches)!=1:raise ValueError('missing or duplicate source field: '+name)
  fi,spec=matches[0]
  expected={'temperature':'°C','pressure':'hPa','wind':'kn','gust':'kn','cloud':'%','precipitation':'mm'}[kind]
  if spec.get('unit')!=expected or not isinstance(spec.get('scale'),(int,float)) or not math.isfinite(spec['scale']) or spec['scale']<=0:
   raise ValueError('source field unit/scale')
  scale,frames=decode_display(cube,lookup,fi,spec,factor,bounds)
  refs=[]
  for hour,values in enumerate(frames):
   # Initial precipitation/gust is a zero-length initialization, not a 1-h forecast.
   if hour==0 and kind in ('precipitation','gust'):continue
   payload={'schema':'mid.ruc.map-field-candidate.v1','modelId':'icon-d2-ruc','run':index['run'],'time':(run+timedelta(hours=hour)).isoformat(),'kind':kind,'unit':unit,'scale':scale,'lats':ys[rows].round(6).tolist(),'lons':xs[cols].round(6).tolist(),'values':values,'isobars':[],'sampling':'nearest-native-cell'}
   encoded=compact(payload);wire=gzip.compress(encoded,mtime=0)
   if len(encoded)>12_000_000:raise ValueError('map decoded budget')
   key=f'{kind}-{hour:03d}.bin';files[key]=wire
   frame_audit=audit_native_frame(cube,lookup,fi,hour,spec,factor,bounds)
   refs.append({'hour':hour,'time':payload['time'],'file':key,'sha256':hashlib.sha256(wire).hexdigest(),'bytes':len(wire),'decodedBytes':len(encoded),'decodedSha256':hashlib.sha256(encoded).hexdigest(),'encoding':'gzip-json','intervalHours':1 if kind in ('precipitation','gust') else 0,**frame_audit})
  index['products'][kind]={'unit':unit,'frames':refs}
 index['candidateBytes']=sum(len(data) for data in files.values())
 if index['candidateBytes']>100_000_000:raise ValueError('offline map candidate budget')
 output.parent.mkdir(parents=True,exist_ok=True)
 temporary=Path(tempfile.mkdtemp(prefix='.ruc-maps-',dir=output.parent))
 try:
  for key,data in files.items():(temporary/key).write_bytes(data)
  (temporary/'index.json').write_bytes(compact(index))
  # The input was SHA-checked before processing; repeat at the atomic handoff
  # so an upstream replacement cannot label output with a stale source SHA.
  if (source/'latest.json').read_bytes()!=manifest_bytes:
   raise ValueError('source manifest changed during map generation')
  for name in ('deterministic.bin','lookup.bin'):recheck_object(source,meta,name)
  if output.exists():raise ValueError('map output appeared during generation')
  os.rename(temporary,output)
 finally:
  if temporary.exists():shutil.rmtree(temporary)
 return index

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source',type=Path,required=True)
 parser.add_argument('--output',type=Path,required=True)
 args=parser.parse_args()
 result=build_candidate(args.source,args.output)
 print(json.dumps({'schema':result['schema'],'run':result['run'],'candidateBytes':result['candidateBytes'],'productionEnabled':False}))
