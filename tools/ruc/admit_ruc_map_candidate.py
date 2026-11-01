"""Atomically admit source-bound RUC maps after full lossless codec activation.

Existing inventory, core/EPS bytes and rollback proof are immutable. Compare the
entire compressed core against the map source prefix before adding any object.
"""
from __future__ import annotations
import argparse,copy,gzip,hashlib,json,shutil
from pathlib import Path
import numpy as np
from ruc_map_candidate import build_candidate,checked_object,recheck_object,compact,utc_time
from audit_model_domain_coverage import inspect as audit_native_map
from lossless_codec_pilot import decode_candidate
from augment_compressed_synoptic import within
from build_model_map_fields import contours
from pressure_centers import pressure_centers
from ruc_pack import DEFAULT_FIELDS
from datetime import timedelta
BUDGET=900_000_000

class SnapshotIntegrityError(ValueError):
 """Existing core snapshot is unsafe; never turn this into an optional skip."""

def sha(data):return hashlib.sha256(data).hexdigest()

def verify_inventory(snapshot,objects):
 for o in objects:
  path=within(snapshot,o['key']);h=hashlib.sha256();size=0
  with path.open('rb') as stream:
   for data in iter(lambda:stream.read(1048576),b''):
    h.update(data);size+=len(data)
  if size!=o['bytes'] or h.hexdigest()!=o['sha256']:raise SnapshotIntegrityError('inventory SHA/size mismatch')

def verify_snapshot(snapshot):
 snapshot=Path(snapshot).resolve(strict=True);original=(snapshot/'latest.json').read_bytes()
 try:
  m=json.loads(original)
  if m.get('schema')!='mid.dwd.ruc.grid.v2' or m.get('storageProfile')!='pages-lossless-v1' or m.get('migration',{}).get('schema')!='mid.ruc.migration-active.v1' or m['migration'].get('productionEnabled') is not True or m.get('pages',{}).get('profile')!='pages-lossless-v1' or m['pages'].get('losslessTransport')!={'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False} or m['pages'].get('budgetBytes')!=BUDGET:raise SnapshotIntegrityError('requires complete activated codec snapshot')
  core=m['deterministic'];times=core['times'];run=utc_time(m['run'])
  if type(m['pointCount']) is not int or not 0<m['pointCount']<=1000000 or len(times) not in (15,28) or core['fields']!=[vars(spec) for spec in DEFAULT_FIELDS] or core.get('dtype')!='int16-le' or core.get('layout')!='point-time-field' or core['recordBytes']!=len(times)*len(core['fields'])*2 or any(utc_time(t)!=run+timedelta(hours=i) for i,t in enumerate(times)):raise SnapshotIntegrityError('existing core geometry/time contract invalid')
  pages=core['compressedPages']
  if pages['recordBytes']!=core['recordBytes'] or pages['records']!=m['pointCount']:raise SnapshotIntegrityError('existing compressed geometry invalid')
  objects=m['pages']['objects'];bykey={o['key']:o for o in objects}
  if len(bykey)!=len(objects) or sum(o['bytes'] for o in objects)!=m['pages']['publishedBytes']:raise SnapshotIntegrityError('inventory duplicates/size mismatch')
  if m['pages']['publishedBytes']+len(original)>=BUDGET:raise SnapshotIntegrityError('existing snapshot budget exceeded')
  verify_inventory(snapshot,objects)
  actual={p.relative_to(snapshot).as_posix() for p in snapshot.rglob('*') if p.is_file()}
  if actual!=set(bykey)|{'latest.json'}:raise SnapshotIntegrityError('undeclared snapshot objects')
 except SnapshotIntegrityError:raise
 except (ValueError,KeyError,TypeError,OSError) as error:raise SnapshotIntegrityError('existing snapshot invalid: '+str(error)) from error
 return m,original

def admit(snapshot,source,candidate):
 snapshot=Path(snapshot).resolve(strict=True);source=Path(source).resolve(strict=True);candidate=Path(candidate).resolve()
 roots=(snapshot,source,candidate)
 if candidate.exists() or any(a.is_relative_to(b) or b.is_relative_to(a) for i,a in enumerate(roots) for b in roots[i+1:]):raise ValueError('admission directories overlap or candidate exists')
 manifest=snapshot/'latest.json';m,original=verify_snapshot(snapshot);source_bytes=(source/'latest.json').read_bytes();s=json.loads(source_bytes)
 if 'rucModelFields' in m:raise ValueError('snapshot already has RUC maps')
 if s.get('schema')!=m['schema'] or utc_time(s['run'])!=utc_time(m['run']) or s.get('grid')!=m.get('grid') or s.get('pointCount')!=m['pointCount']:raise ValueError('source run/grid mismatch')
 if {k:v for k,v in s['lookup'].items() if k not in ('pages','key')}!={k:v for k,v in m['lookup'].items() if k not in ('pages','key')}:raise ValueError('lookup contract drift')
 core=m['deterministic'];det=s['deterministic'];n=len(core['times']);nt=len(det['times']);nf=len(core['fields'])
 if not 2<=n<=nt<=28 or det['times'][:n]!=core['times'] or any(det.get(k)!=core.get(k) for k in ('fields','dtype','layout')) or core['recordBytes']!=n*nf*2 or det['recordBytes']!=nt*nf*2:raise ValueError('source/core geometry mismatch')
 raw=checked_object(source,s,'deterministic.bin');lookup=checked_object(source,s,'lookup.bin');cube=np.frombuffer(raw,dtype='<i2').reshape(m['pointCount'],nt,nf)
 objects=m['pages']['objects'];bykey={o['key']:o for o in objects}

 pages=core['compressedPages'];cursor=0
 if pages['recordBytes']!=core['recordBytes'] or pages['records']!=m['pointCount']:raise SnapshotIntegrityError('compressed geometry mismatch')
 for part in pages['parts']:
  count=part['recordCount'];descriptor=part['manifest'];key=part['key']
  if type(count) is not int or count<=0 or part['firstRecord']!=cursor or descriptor['decodedBytes']!=count*core['recordBytes'] or descriptor['decodedBytes']>524288 or key not in bykey:raise SnapshotIntegrityError('compressed record coverage')
  try:decoded=decode_candidate(descriptor,within(snapshot,key).read_bytes())
  except ValueError as error:raise SnapshotIntegrityError('existing core codec invalid') from error
  if decoded!=cube[cursor:cursor+count,:n,:].tobytes():raise ValueError('map source differs from decoded original core')
  cursor+=count
 if cursor!=m['pointCount']:raise SnapshotIntegrityError('core point coverage mismatch')
 lp=m['lookup']['pages'];h=hashlib.sha256();lookup_bytes=0
 if lp['recordBytes']!=4 or not 1<=lp['chunkCount']<=8192:raise SnapshotIntegrityError('lookup geometry')
 for i in range(lp['chunkCount']):
  key=lp['prefix']+'/'+str(i).zfill(4)+'.bin'
  if key not in bykey:raise SnapshotIntegrityError('lookup not inventoried')
  data=within(snapshot,key).read_bytes();h.update(data);lookup_bytes+=len(data)
 if h.hexdigest()!=sha(lookup) or lookup_bytes!=len(lookup) or lookup_bytes!=lp['records']*4:raise ValueError('lookup/source mismatch')
 index=build_candidate(source,candidate)
 # Compare each native parameter / valid lead and explicit NoData mask against
 # the SHA-pinned original lookup before writing a production map object.
 coverage=audit_native_map(source,candidate)
 if not coverage['allFramesCoverKnownNativeLookup'] or not coverage['allPublishedFrameValuesMatchNativeSource']:
  raise ValueError('RUC full-native-domain coverage/source parity not qualified')
 pending={}
 for kind,product in index['products'].items():
  for ref in product['frames']:
   wire=(candidate/ref['file']).read_bytes()
   if sha(wire)!=ref['sha256']:raise ValueError('candidate frame drift')
   payload=json.loads(gzip.decompress(wire));payload['schema']='mid.ruc.map-field.v1'
   if kind=='pressure':
    values=np.array([np.nan if v is None else v*payload['scale'] for v in payload['values']]).reshape(len(payload['lats']),len(payload['lons']))
    payload['isobars']=contours(values,np.array(payload['lats']),np.array(payload['lons']));payload['centers']=pressure_centers(values,np.array(payload['lats']),np.array(payload['lons']))
   encoded=compact(payload);wire=gzip.compress(encoded,mtime=0)
   if len(encoded)>12_000_000 or len(wire)>12_000_000:raise ValueError('published field budget')
   ref.update(bytes=len(wire),sha256=sha(wire),decodedBytes=len(encoded),decodedSha256=sha(encoded));pending[ref['file']]=wire
 index['schema']='mid.ruc.map-fields.v1';index.pop('productionEnabled');index.pop('readyForProduction');index.pop('candidateBytes')
 encoded_index=compact(index)
 if len(encoded_index)>200_000:raise ValueError('published index budget')
 prefix='runs/'+''.join(c for c in m['run'] if c.isalnum() or c in '_-')+'__rucmaps_'+sha(encoded_index)[:16]+'/ruc-model-fields'
 pending['index.json']=encoded_index;new=[{'key':prefix+'/'+name,'bytes':len(data),'sha256':sha(data)} for name,data in pending.items()]
 if any(o['key'] in bykey for o in new):raise ValueError('immutable namespace collision')
 updated=copy.deepcopy(m);updated['pages']['objects'].extend(new);updated['pages']['publishedBytes']+=sum(o['bytes'] for o in new)
 updated['rucModelFields']={'key':prefix+'/index.json','bytes':len(encoded_index),'sha256':sha(encoded_index),'run':index['run'],'sourceManifestSha256':sha(source_bytes)}
 encoded=compact(updated);physical=updated['pages']['publishedBytes']+len(encoded)
 if physical>=BUDGET:raise ValueError('RUC maps exceed unchanged snapshot budget')
 directory=within(snapshot,prefix);temporary=snapshot/'latest.json.ruc-map-tmp'
 if directory.parent.exists() or temporary.exists():raise ValueError('pending map publication exists')
 directory.mkdir(parents=True)
 try:
  for name,data in pending.items():
   target=directory/name;target.write_bytes(data)
   if target.read_bytes()!=data:raise ValueError('new object write corruption')
  if manifest.read_bytes()!=original:raise SnapshotIntegrityError('existing manifest drift during admission')
  if (source/'latest.json').read_bytes()!=source_bytes:raise ValueError('source manifest drift during admission')
  for name in ('deterministic.bin','lookup.bin'):recheck_object(source,s,name)
  verify_inventory(snapshot,objects)
  temporary.write_bytes(encoded);temporary.replace(manifest)
 except BaseException:
  shutil.rmtree(directory.parent,ignore_errors=True);temporary.unlink(missing_ok=True);raise
 return {'schema':'mid.ruc.map-admission.v1','run':index['run'],'mapHours':nt-1,'coreHours':n-1,'finalPhysicalBytes':physical,'addedPhysicalBytes':physical-m['pages']['publishedBytes']-len(original),'previousManifestSha256':sha(original),'newManifestSha256':sha(encoded),'sourceRawUnchanged':True,'codecProofUnchanged':updated['migration']==m['migration']}
def admit_optional(snapshot,source,candidate):
 """Map failure cannot block a verified core; existing corruption stays fatal."""
 snapshot=Path(snapshot).resolve(strict=True);_,original=verify_snapshot(snapshot)
 try:return {'admitted':True,**admit(snapshot,source,candidate)}
 except SnapshotIntegrityError:raise
 except (Exception,SystemExit) as error:
  # No broad catch may hide an unexpected mutation of the existing snapshot.
  if (snapshot/'latest.json').read_bytes()!=original:raise SnapshotIntegrityError('existing manifest changed after optional failure') from error
  verify_snapshot(snapshot)
  return {'schema':'mid.ruc.map-admission.v1','admitted':False,'coreRetained':True,'reason':type(error).__name__+': '+str(error)[:500]}

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('snapshot',type=Path);p.add_argument('source',type=Path);p.add_argument('candidate',type=Path);a=p.parse_args();print(json.dumps(admit(a.snapshot,a.source,a.candidate)))
