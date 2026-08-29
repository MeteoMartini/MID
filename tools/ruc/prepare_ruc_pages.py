#!/usr/bin/env python3
"""Prepare a GitHub-Pages-safe MID RUC snapshot.

The free Pages profile deliberately publishes the deterministic RUC field,
pre-aggregated RUC-EPS probabilities/quantiles and lookup only. Large native
EPS member cubes remain optional (R2 / dedicated adapter) and are not needed by
canonical 0-14 h probability fusion.

Files are split into immutable chunks so the Worker never depends on HTTP Range
support from GitHub Pages. The Pages profile additionally removes only
redundant high-frequency severe-diagnostic variants when their canonical
maximum field is present. The complete preprocessing bundle remains untouched.
"""
from __future__ import annotations
import argparse,hashlib,json,shutil
from pathlib import Path
import numpy as np

SCHEMA='mid.dwd.ruc.grid.v2'
PROFILE='pages-free-v1'
DEFAULT_DATA_CHUNK_POINTS=4096
DEFAULT_LOOKUP_CHUNK_ENTRIES=65536
PAGES_REDUNDANT_SEVERE_FIELDS={
    'lpi_max':('lpi',),
    'uh_max':('uh_max_low','uh_max_med'),
}


def digest(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()


def safe_run(value:str)->str:
    return ''.join(ch for ch in str(value) if ch.isalnum() or ch in '_-')


def write_chunks(source:Path,target_dir:Path,record_bytes:int,chunk_records:int,prefix:str):
    if record_bytes<=0 or chunk_records<=0: raise ValueError('invalid chunk geometry')
    size=source.stat().st_size
    if size%record_bytes: raise ValueError(f'{source.name}: size is not a multiple of recordBytes')
    records=size//record_bytes
    target_dir.mkdir(parents=True,exist_ok=True)
    objects=[]
    chunk_bytes=record_bytes*chunk_records
    with source.open('rb') as src:
        index=0
        while True:
            payload=src.read(chunk_bytes)
            if not payload: break
            name=f'{index:04d}.bin'; path=target_dir/name; path.write_bytes(payload)
            objects.append({'key':f'{prefix}/{name}','bytes':len(payload),'sha256':digest(path)})
            index+=1
    if not objects: raise ValueError(f'{source.name}: no chunks written')
    return {'chunkRecords':chunk_records,'chunkCount':len(objects),'recordBytes':record_bytes,'prefix':prefix,'records':records},objects


def severe_pages_projection(spec:dict):
    if spec.get('dtype')!='int16-le' or spec.get('layout')!='point-time-field': return None
    fields=list(spec.get('fields') or [])
    names=[str(field.get('name') or '') for field in fields]
    if not fields or not all(names): return None
    drop=set()
    for canonical,redundant in PAGES_REDUNDANT_SEVERE_FIELDS.items():
        if canonical in names:
            drop.update(name for name in redundant if name in names)
    if not drop: return None
    keep=[index for index,name in enumerate(names) if name not in drop]
    return keep,[fields[index] for index in keep],[name for name in names if name in drop]


def write_projected_i16_chunks(source:Path,target_dir:Path,spec:dict,chunk_records:int,prefix:str,keep:list[int],fields:list[dict]):
    times=list(spec.get('times') or [])
    source_fields=list(spec.get('fields') or [])
    source_record=int(spec.get('recordBytes') or 0)
    if not times or not source_fields or source_record!=len(times)*len(source_fields)*2:
        raise ValueError(f'{source.name}: incompatible point-time-field record geometry')
    size=source.stat().st_size
    if size%source_record: raise ValueError(f'{source.name}: size is not a multiple of recordBytes')
    records=size//source_record
    target_dir.mkdir(parents=True,exist_ok=True)
    objects=[]; index=0
    with source.open('rb') as src:
        while True:
            payload=src.read(source_record*chunk_records)
            if not payload: break
            rows=len(payload)//source_record
            cube=np.frombuffer(payload,dtype='<i2').reshape(rows,len(times),len(source_fields))
            projected=np.ascontiguousarray(cube[:,:,keep],dtype='<i2').tobytes(order='C')
            name=f'{index:04d}.bin'; path=target_dir/name; path.write_bytes(projected)
            objects.append({'key':f'{prefix}/{name}','bytes':len(projected),'sha256':digest(path)})
            index+=1
    if not objects: raise ValueError(f'{source.name}: no projected chunks written')
    record_bytes=len(times)*len(fields)*2
    return {'chunkRecords':chunk_records,'chunkCount':len(objects),'recordBytes':record_bytes,'prefix':prefix,'records':records},objects


def prepare(source:Path,target:Path,data_chunk_points:int=DEFAULT_DATA_CHUNK_POINTS,lookup_chunk_entries:int=DEFAULT_LOOKUP_CHUNK_ENTRIES):
    meta=json.loads((source/'latest.json').read_text(encoding='utf-8'))
    if meta.get('schema')!=SCHEMA or not meta.get('run'): raise ValueError('invalid RUC metadata')
    run=safe_run(meta['run'])
    if not run: raise ValueError('invalid RUC run')
    for name in ('deterministic.bin','eps-summary.bin','lookup.bin','rapid-5m.bin','rapid-15m.bin','rapid-extreme.json'):
        if not (source/name).is_file(): raise ValueError(f'missing {name}')
    out=target/'ruc'; shutil.rmtree(out,ignore_errors=True); (out/'runs'/run).mkdir(parents=True,exist_ok=True)
    objects=[]; pruned_fields=[]; saved_bytes=0

    det=dict(meta.get('deterministic') or {}); det_record=int(det.get('recordBytes') or 0)
    det_pages,rows=write_chunks(source/'deterministic.bin',out/'runs'/run/'deterministic',det_record,data_chunk_points,f'runs/{run}/deterministic');objects+=rows
    det.pop('key',None);det['pages']=det_pages

    summary=dict(meta.get('epsSummary') or {}); summary_record=int(summary.get('recordBytes') or 0)
    sum_pages,rows=write_chunks(source/'eps-summary.bin',out/'runs'/run/'eps-summary',summary_record,data_chunk_points,f'runs/{run}/eps-summary');objects+=rows
    summary.pop('key',None);summary['pages']=sum_pages

    lookup=dict(meta.get('lookup') or {}); lookup_record=4
    lookup_pages,rows=write_chunks(source/'lookup.bin',out/'runs'/run/'lookup',lookup_record,lookup_chunk_entries,f'runs/{run}/lookup');objects+=rows
    lookup.pop('key',None);lookup['pages']=lookup_pages

    rapid={}
    for product_id,raw_spec in (meta.get('rapid') or {}).items():
        spec=dict(raw_spec or {});source_name=Path(str(spec.get('key') or '')).name
        if not source_name or not (source/source_name).is_file():
            continue
        prefix=f'runs/{run}/rapid/{product_id}'; target_dir=out/'runs'/run/'rapid'/product_id
        projection=severe_pages_projection(spec) if product_id=='severe15' else None
        if projection:
            keep,projected_fields,dropped=projection
            before=(source/source_name).stat().st_size
            pages,rows=write_projected_i16_chunks(source/source_name,target_dir,spec,data_chunk_points,prefix,keep,projected_fields)
            after=sum(row['bytes'] for row in rows)
            saved_bytes+=before-after; pruned_fields+=dropped
            spec['fields']=projected_fields; spec['recordBytes']=pages['recordBytes']
        else:
            record=int(spec.get('recordBytes') or 0)
            pages,rows=write_chunks(source/source_name,target_dir,record,data_chunk_points,prefix)
        objects+=rows;spec.pop('key',None);spec['pages']=pages;rapid[product_id]=spec

    rapid_extreme=dict(meta.get('rapidExtreme') or {})
    rapid_extreme_source=source/Path(str(rapid_extreme.get('key') or '')).name
    if rapid_extreme and rapid_extreme_source.is_file():
        target_extreme=out/'runs'/run/'rapid-extreme.json';shutil.copy2(rapid_extreme_source,target_extreme)
        rapid_extreme['key']=f'runs/{run}/rapid-extreme.json';objects.append({'key':rapid_extreme['key'],'bytes':target_extreme.stat().st_size,'sha256':digest(target_extreme)})

    eps=dict(meta.get('eps') or {})
    eps.pop('key',None);eps['available']=False;eps['storageReason']='native EPS members omitted from free GitHub Pages profile; canonical forecast uses epsSummary'

    total=sum(row['bytes'] for row in objects)
    result={**meta,'deterministic':det,'epsSummary':summary,'lookup':lookup,'rapid':rapid,'rapidExtreme':rapid_extreme or None,'eps':eps,'storageProfile':PROFILE,
            'pages':{'profile':PROFILE,'nativeEpsMembers':False,'publishedBytes':total,'objects':objects,'prunedRedundantFields':pruned_fields,'savedBytes':saved_bytes}}
    (out/'latest.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    return result


def main():
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=Path('.ruc-out'));p.add_argument('--output',type=Path,default=Path('.ruc-pages'))
    p.add_argument('--data-chunk-points',type=int,default=DEFAULT_DATA_CHUNK_POINTS);p.add_argument('--lookup-chunk-entries',type=int,default=DEFAULT_LOOKUP_CHUNK_ENTRIES)
    a=p.parse_args();meta=prepare(a.source,a.output,a.data_chunk_points,a.lookup_chunk_entries)
    print(json.dumps({'run':meta['run'],'profile':meta['storageProfile'],'publishedBytes':meta['pages']['publishedBytes'],'objects':len(meta['pages']['objects']),'nativeEpsMembers':False,'prunedRedundantFields':meta['pages']['prunedRedundantFields'],'savedBytes':meta['pages']['savedBytes']}))
if __name__=='__main__':main()
