#!/usr/bin/env python3
"""Add verified optional ICON-D2/EU/Global CLCT/WW terms after lossless RUC compression.

RUC raw rollback and all core codec bytes stay untouched. A new immutable index namespace
contains copied, SHA-verified existing synoptic assets plus strictly sourced optional terms.
No DWD downloads, model synthesis, interpolation, silent missing-as-zero or new cost.
"""
from __future__ import annotations
import argparse
import copy
import gzip
import hashlib
import io
import json
import math
import re
import shutil
from datetime import datetime, timedelta
from pathlib import Path

ADDITIONAL_HOURS=frozenset({13,14,16,17,19,20,22,23,27,33,39,45})
ADDITIONAL_MODEL_HOURS={'icon-d2':ADDITIONAL_HOURS,
    'icon-eu':frozenset((54,66,78,90,102,114)),
    'icon':frozenset((54,66,78,90,102,114,126,138,150,162,174))}
MAX_DECODED=12_000_000
RUC_BUDGET=900_000_000
ISO_RE=re.compile(r'^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$')
SHA_RE=re.compile(r'^[0-9a-f]{64}$')
FILENAME_RE=re.compile(r'^(icon-d2|icon-eu|icon|gfs|ifs)-(cw-)?\d{3}\.bin$')

def sha(data:bytes)->str:
    return hashlib.sha256(data).hexdigest()

def compact(value)->bytes:
    return (json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()

def read_index(path:Path)->dict:
    return json.loads(path.read_text(encoding='utf-8'),parse_constant=lambda _: (_ for _ in ()).throw(ValueError('NaN index')))

def within(root:Path,key:str)->Path:
    if not isinstance(key,str) or key.startswith('/') or '\\' in key or '%' in key or '?' in key or '#' in key:
        raise ValueError('unsafe synoptic key')
    if any(x in ('','.','..') for x in key.split('/')):raise ValueError('synoptic traversal')
    path=root/key
    if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):raise ValueError('synoptic symlink/escape')
    return path

def check_asset(path:Path,descriptor:dict):
    if not path.is_file() or path.is_symlink() or type(descriptor.get('bytes')) is not int or not 0<descriptor['bytes']<=MAX_DECODED:
        raise ValueError('missing/oversize synoptic object')
    data=path.read_bytes()
    if len(data)!=descriptor['bytes'] or not SHA_RE.fullmatch(str(descriptor.get('sha256'))) or sha(data)!=descriptor['sha256']:
        raise ValueError('synoptic bytes/SHA mismatch')
    return data

def verify_optional_payload(data:bytes,desc:dict,model_run:str,model_id:str='icon-d2'):
    if desc.get('encoding')!='gzip-json' or type(desc.get('decodedBytes')) is not int or not 0<desc['decodedBytes']<=MAX_DECODED:
        raise ValueError('optional encoding/decode budget')
    with gzip.GzipFile(fileobj=io.BytesIO(data)) as stream:
        raw=stream.read(MAX_DECODED+1)
    if len(raw)!=desc['decodedBytes']:raise ValueError('decoded length mismatch')
    payload=json.loads(raw,parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite weather payload')))
    hour=desc['hour']
    t0=datetime.fromisoformat(model_run)
    expected=(t0+timedelta(hours=hour)).isoformat()
    if any((payload.get('schema')!='mid.cloud-weather.field.v1',payload.get('model')!=model_id,
            payload.get('run')!=model_run,payload.get('time')!=expected,desc.get('time')!=expected,
            payload.get('cloudUnit')!='%',payload.get('weatherUnit')!='WMO 4677',
            payload.get('cloudScale')!=.1)):
        raise ValueError('model cycle, valid time, unit, or schema mismatch')
    cloud,weather=payload.get('cloud'),payload.get('weather')
    lats,lons=payload.get('lats'),payload.get('lons')
    if not isinstance(cloud,list) or not isinstance(weather,list) or len(cloud)!=len(weather):
        raise ValueError('cloud/weather vector mismatch')
    # build_synoptic_fields.decode() emits regular_ll *1-D independent axes*;
    # some legacy fixtures use full 2-D meshgrid coordinates. Validate the
    # source geometry explicitly without inventing or flattening positions.
    # A malformed grid is a hard source-validation error, never zero-filled.
    def scalar(value,minimum,maximum):
        return type(value) in (float,int) and math.isfinite(value) and minimum<=value<=maximum
    def axis(vector,minimum,maximum):
        if not isinstance(vector,list) or len(vector)<2 or any(not scalar(v,minimum,maximum) for v in vector):
            raise ValueError('invalid native grid axis')
        if any(vector[k+1]<=vector[k] for k in range(len(vector)-1)):
            raise ValueError('non-increasing regular_ll coordinate axis')
    if not isinstance(lats,list) or not isinstance(lons,list) or not lats or not lons:
        raise ValueError('missing native grid coordinates')
    if not isinstance(lats[0],list) and not isinstance(lons[0],list):
        axis(lats,-90,90);axis(lons,-180,360)
        expected_cells=len(lats)*len(lons)
    elif isinstance(lats[0],list) and isinstance(lons[0],list):
        if len(lats)<2 or len(lats)!=len(lons):
            raise ValueError('invalid meshgrid row count')
        width=len(lats[0])
        if width<2 or any(not isinstance(row,list) or len(row)!=width for row in lats+lons):
            raise ValueError('inconsistent meshgrid rows')
        lat_axis=[row[0] for row in lats]
        lon_axis=lons[0]
        axis(lat_axis,-90,90);axis(lon_axis,-180,360)
        if any(any(v!=lat_axis[j] for v in row) for j,row in enumerate(lats)):
            raise ValueError('latitude meshgrid is not rectangular')
        if any(row!=lon_axis for row in lons):
            raise ValueError('longitude meshgrid is not rectangular')
        expected_cells=len(lats)*width
    else:
        raise ValueError('mixed coordinate dimensions')
    if len(cloud)!=expected_cells:
        raise ValueError('cloud/weather cells do not match native grid dimensions')
    valid=0
    for c,w in zip(cloud,weather):
        if c is not None and (type(c) is not int or not 0<=c<=1000):raise ValueError('invalid CLCT percent')
        if w is not None and (type(w) is not int or not 0<=w<=99):raise ValueError('invalid WMO 4677')
        if c is not None and w is not None:valid+=1
    if valid/len(cloud)<.4:raise ValueError('insufficient paired CLCT/WW coverage')

def augment(snapshot:Path,full_index_path:Path,source_dir:Path)->dict:
    snapshot=Path(snapshot).resolve(strict=True)
    source_dir=Path(source_dir).resolve(strict=True)
    full_index_path=Path(full_index_path)
    if not full_index_path.is_file():
        return {'schema':'mid.ruc.optional-synoptic.v1','admittedHours':[],'reason':'unavailable-original-index'}
    manifest_path=snapshot/'latest.json'
    original=manifest_path.read_bytes()
    meta=json.loads(original)
    if (meta.get('schema')!='mid.dwd.ruc.grid.v2' or meta.get('storageProfile')!='pages-lossless-v1'
        or meta.get('migration',{}).get('productionEnabled') is not True
        or meta.get('pages',{}).get('losslessTransport')!={'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False}
        or meta.get('pages',{}).get('budgetBytes')!=RUC_BUDGET
        or not ISO_RE.fullmatch(str(meta.get('run','')))):
        raise ValueError('only complete activated RUC snapshots may be extended')
    old_key=meta.get('synopticFields',{}).get('key')
    if not old_key:return {'schema':'mid.ruc.optional-synoptic.v1','admittedHours':[],'reason':'no-synoptic-source'}
    current=read_index(within(snapshot,old_key))
    full=read_index(full_index_path)
    if (full.get('schema')!='mid.synoptic.fields.v1' or
        current.get('schema')!=full['schema'] or
        current.get('generatedAt')!=full.get('generatedAt') or
        current.get('algorithm')!=full.get('algorithm')):
        raise ValueError('index generation/provenance drift')
    proposals={}
    for model_id,allowed in ADDITIONAL_MODEL_HOURS.items():
        existing=current.get('models',{}).get(model_id)
        source=full.get('models',{}).get(model_id)
        if not existing or not source:
            continue
        if any(existing.get(k)!=source.get(k) for k in ('run','resolutionKm','license')):
            raise ValueError('optional model run/grid/license drift: '+model_id)
        baseline={int(f['hour']) for f in existing.get('cloudWeatherFrames',[])}
        proposed=[]
        for frame in source.get('cloudWeatherFrames',[]):
            hour=frame.get('hour')
            if type(hour) is not int or hour not in allowed or hour in baseline:
                continue
            if frame.get('file')!=f'{model_id}-cw-{hour:03d}.bin':
                raise ValueError('optional filename mismatch: '+model_id)
            proposed.append(frame)
        if len({f['hour'] for f in proposed})!=len(proposed):
            raise ValueError('duplicate optional terms: '+model_id)
        if proposed:
            proposals[model_id]=proposed
    if not proposals:
        return {'schema':'mid.ruc.optional-synoptic.v1','admittedHours':[],'admittedByModel':{},'reason':'no-verified-extra-terms'}
    new_index=copy.deepcopy(current)
    for model_id,proposed in proposals.items():
        frames=new_index['models'][model_id]['cloudWeatherFrames']
        frames.extend(copy.deepcopy(proposed))
        frames.sort(key=lambda f:f['hour'])
        budget=new_index.get('cloudWeatherBudget',{})
        target=budget.get('optionalD2') if model_id=='icon-d2' else budget.get('optionalLong',{}).get(model_id)
        if isinstance(target,dict):
            admitted={f['hour'] for f in proposed}
            target['admittedHours']=sorted(set(target.get('admittedHours',[]))|admitted)
            target['omittedHours']=[h for h in target.get('omittedHours',[]) if h not in admitted]
    index_bytes=compact(new_index)
    clean_run=re.sub(r'[^a-zA-Z0-9_-]','',meta['run'])
    prefix=f'runs/{clean_run}__synoptic_{sha(index_bytes)[:16]}/synoptic-fields'
    source_prefix=old_key.rsplit('/',1)[0]
    if not source_prefix.startswith('runs/') or source_prefix==prefix:raise ValueError('synoptic prefix')
    declared={x['key']:x for x in meta['pages']['objects']}
    new_objects=[]
    pending={}
    source_keys={(model_id,f['file']) for model_id,frames in proposals.items() for f in frames}
    names=set()
    for model_id,model in new_index['models'].items():
        for frame in model.get('frames',[])+model.get('cloudWeatherFrames',[]):
            name=frame.get('file')
            if not isinstance(name,str) or not FILENAME_RE.fullmatch(name) or name in names:
                raise ValueError('duplicated/unsafe synoptic filename')
            names.add(name)
            if (model_id,name) in source_keys:
                data=check_asset(within(source_dir,name),frame)
                verify_optional_payload(data,frame,full['models'][model_id]['run'],model_id)
            else:
                key=source_prefix+'/'+name
                descriptor=declared.get(key)
                if descriptor is None or descriptor['sha256']!=frame.get('sha256') or descriptor['bytes']!=frame.get('bytes'):
                    raise ValueError('original synoptic frame not in checked inventory')
                data=check_asset(within(snapshot,key),descriptor)
            key=prefix+'/'+name
            pending[key]=data
            new_objects.append({'key':key,'bytes':len(data),'sha256':sha(data)})
    new_index_key=prefix+'/index.json'
    # The browser loader and the DWD cache reader both require the
    # content-addressed '__synoptic_<first 16 SHA-256 hex>' wire contract.
    # Never publish an optional index that either consumer cannot address.
    pointer_match=re.fullmatch(r'runs/[a-zA-Z0-9_-]+__synoptic_([a-f0-9]{16})/synoptic-fields/index.json',new_index_key)
    if pointer_match is None or pointer_match.group(1)!=sha(index_bytes)[:16]:
        raise ValueError('optional synoptic index pointer incompatible with browser/cache')
    pending[new_index_key]=index_bytes
    new_objects.append({'key':new_index_key,'bytes':len(index_bytes),'sha256':sha(index_bytes)})
    if len(declared)!=len(meta['pages']['objects']) or any(row['key'] in declared for row in new_objects):
        raise ValueError('duplicate original or destination')
    updated=copy.deepcopy(meta)
    updated['pages']['objects'].extend(new_objects)
    updated['pages']['publishedBytes']+=sum(row['bytes'] for row in new_objects)
    updated['synopticFields']['key']=new_index_key
    admitted_by_model={m:sorted(f['hour'] for f in frames) for m,frames in proposals.items()}
    evidence={'schema':'mid.ruc.optional-synoptic.v1','admittedByModel':admitted_by_model,
        'originalIndexSha256':sha(within(snapshot,old_key).read_bytes()),
        'fullIndexSha256':sha(full_index_path.read_bytes()),
        'newIndexSha256':sha(index_bytes),'objectCount':len(new_objects)}
    updated['synopticFields']['optionalModelProof']=evidence
    if 'icon-d2' in proposals:
        updated['synopticFields']['optionalD2Proof']={'schema':'mid.ruc.optional-synoptic.v1',
            'hours':admitted_by_model['icon-d2'],
            'originalIndexSha256':evidence['originalIndexSha256'],
            'fullIndexSha256':evidence['fullIndexSha256'],
            'newIndexSha256':evidence['newIndexSha256'],
            'objectCount':evidence['objectCount']}
    encoded=compact(updated)
    if updated['pages']['publishedBytes']+len(encoded)>=RUC_BUDGET:raise ValueError('RUC full codec + optional model maps exceeds budget')
    # All checks first. None of the old bytes or original manifest are overwritten on failure.
    directory=within(snapshot,prefix)
    if directory.exists():raise ValueError('immutable destination exists')
    directory.mkdir(parents=True)
    try:
        for key,data in pending.items():
            target=within(snapshot,key);target.write_bytes(data)
            if sha(target.read_bytes())!=sha(data):raise ValueError('new object corruption')
        if manifest_path.read_bytes()!=original:raise ValueError('RUC pointer drift during optional creation')
        temporary=manifest_path.with_name('latest.json.optional-tmp')
        if temporary.exists():raise ValueError('pending manifest exists')
        temporary.write_bytes(encoded)
        temporary.replace(manifest_path)
    except BaseException:
        shutil.rmtree(directory,ignore_errors=True)
        raise
    return {'schema':'mid.ruc.optional-synoptic.v1','admittedHours':admitted_by_model.get('icon-d2',[]),'admittedByModel':admitted_by_model,
        'run':meta['run'],'addedPhysicalBytes':sum(row['bytes'] for row in new_objects)+len(encoded)-len(original),
        'finalPhysicalBytes':updated['pages']['publishedBytes']+len(encoded),'sourceRawUnchanged':True,
        'previousManifestSha256':sha(original),'newManifestSha256':sha(encoded)}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('snapshot',type=Path);p.add_argument('full_index',type=Path);p.add_argument('synoptic_source',type=Path)
    args=p.parse_args()
    print(json.dumps(augment(args.snapshot,args.full_index,args.synoptic_source),sort_keys=True))
if __name__=='__main__':main()
