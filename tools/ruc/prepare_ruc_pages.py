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
import argparse,hashlib,json,re,shutil
from pathlib import Path
import numpy as np

SCHEMA='mid.dwd.ruc.grid.v2'
PROFILE='pages-free-v1'
DEFAULT_DATA_CHUNK_POINTS=4096
DEFAULT_LOOKUP_CHUNK_ENTRIES=65536
# Keep the free Pages payload comfortably below the 950 MB combined site guard.
# The app itself currently adds ~13 MB, therefore the RUC profile gets a stricter
# 900 MB ceiling and should normally stay well below it.
PAGES_RUC_BUDGET_BYTES=900_000_000
PAGES_OMIT_RAPID_PRODUCTS={'solar15','state15'}
PAGES_STATE15_FIELDS={'visibility','ceiling'}
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

def state_pages_projection(spec:dict):
    """Keep only rapid state fields whose sub-hourly cadence is operationally valuable."""
    if spec.get('dtype')!='int16-le' or spec.get('layout')!='point-time-field': return None
    fields=list(spec.get('fields') or [])
    names=[str(field.get('name') or '') for field in fields]
    if not fields or not all(names): return None
    keep=[index for index,name in enumerate(names) if name in PAGES_STATE15_FIELDS]
    drop=[name for name in names if name not in PAGES_STATE15_FIELDS]
    if not keep:
        return 'omit',[],drop
    if not drop:
        return None
    return keep,[fields[index] for index in keep],drop


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


def fit_synoptic_budget(payload,available):
    core_hours={0,3,6,9,12,18,24,36,48}
    def synoptic_size():
        return len((json.dumps(payload,separators=(',',':'),ensure_ascii=False)+'\n').encode())+sum(frame['bytes'] for product in payload['models'].values() for frame in product['frames'])
    # Protect extended endpoints before optional near-term density, then trim by bytes.
    candidates=sorted(((frame['hour']<=48,frame['bytes'],model,frame['hour']) for model,product in payload['models'].items() for frame in product['frames'] if frame['hour'] not in core_hours),reverse=True)
    while synoptic_size()>available and candidates:
        _,_,model,hour=candidates.pop(0)
        payload['models'][model]['frames']=[frame for frame in payload['models'][model]['frames'] if frame['hour']!=hour]
    if synoptic_size()>available:raise ValueError('complete synoptic core exceeds remaining Pages budget')
    return payload

def prepare(source:Path,target:Path,data_chunk_points:int=DEFAULT_DATA_CHUNK_POINTS,lookup_chunk_entries:int=DEFAULT_LOOKUP_CHUNK_ENTRIES):
    meta=json.loads((source/'latest.json').read_text(encoding='utf-8'))
    if meta.get('schema')!=SCHEMA or not meta.get('run'): raise ValueError('invalid RUC metadata')
    run=safe_run(meta['run'])
    if not run: raise ValueError('invalid RUC run')
    for name in ('deterministic.bin','eps-summary.bin','lookup.bin','rapid-5m.bin','rapid-15m.bin','rapid-extreme.json'):
        if not (source/name).is_file(): raise ValueError(f'missing {name}')
    out=target/'ruc'; shutil.rmtree(out,ignore_errors=True); (out/'runs'/run).mkdir(parents=True,exist_ok=True)
    objects=[]; pruned_fields=[]; pruned_products=[]; saved_bytes=0

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
        source_path=source/source_name
        if product_id in PAGES_OMIT_RAPID_PRODUCTS:
            saved_bytes+=source_path.stat().st_size;pruned_products.append(product_id)
            continue
        prefix=f'runs/{run}/rapid/{product_id}'; target_dir=out/'runs'/run/'rapid'/product_id
        projection=severe_pages_projection(spec) if product_id=='severe15' else state_pages_projection(spec) if product_id=='state15' else None
        if projection and projection[0]=='omit':
            saved_bytes+=source_path.stat().st_size;pruned_products.append(product_id);pruned_fields+=projection[2]
            continue
        if projection:
            keep,projected_fields,dropped=projection
            before=source_path.stat().st_size
            pages,rows=write_projected_i16_chunks(source_path,target_dir,spec,data_chunk_points,prefix,keep,projected_fields)
            after=sum(row['bytes'] for row in rows)
            saved_bytes+=before-after; pruned_fields+=dropped
            spec['fields']=projected_fields; spec['recordBytes']=pages['recordBytes']
        else:
            record=int(spec.get('recordBytes') or 0)
            pages,rows=write_chunks(source_path,target_dir,record,data_chunk_points,prefix)
        objects+=rows;spec.pop('key',None);spec['pages']=pages;rapid[product_id]=spec

    rapid_extreme=dict(meta.get('rapidExtreme') or {})
    rapid_extreme_source=source/Path(str(rapid_extreme.get('key') or '')).name
    if rapid_extreme and rapid_extreme_source.is_file():
        target_extreme=out/'runs'/run/'rapid-extreme.json';shutil.copy2(rapid_extreme_source,target_extreme)
        rapid_extreme['key']=f'runs/{run}/rapid-extreme.json';objects.append({'key':rapid_extreme['key'],'bytes':target_extreme.stat().st_size,'sha256':digest(target_extreme)})

    eps=dict(meta.get('eps') or {})
    eps.pop('key',None);eps['available']=False;eps['storageReason']='native EPS members omitted from free GitHub Pages profile; canonical forecast uses epsSummary'

    # Optional independent 48-hour ICON-D2 product shares the existing immutable
    # object manifest, so installer restores and periodic RUC publishes preserve it.
    totals=None
    totals_source=source/'precipitation-totals.json'
    if totals_source.is_file():
        totals_payload=json.loads(totals_source.read_text())
        if totals_payload.get('schema')!='mid.icon-d2.totals.v1':raise ValueError('invalid ICON-D2 totals schema')
        # ICON-D2 and RUC have independent cycles. Include the actual object
        # digest so a rerun/new ICON cycle cannot mutate an already cached URL.
        totals_key=f'runs/{run}__totals_{digest(totals_source)[:16]}/precipitation-totals.json'
        totals_target=out/totals_key;totals_target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(totals_source,totals_target)
        objects.append({'key':totals_key,'bytes':totals_target.stat().st_size,'sha256':digest(totals_target)})
        totals={'key':totals_key,'run':totals_payload['run'],'schema':totals_payload['schema']}
    observed=None
    observed_source=source/'observed-precipitation.json'
    if observed_source.is_file():
        payload=json.loads(observed_source.read_text())
        if payload.get('schema')!='mid.radolan.observed.v1' or payload.get('kind')!='observed':raise ValueError('invalid observed precipitation schema')
        key=f'runs/{run}__observed_{digest(observed_source)[:16]}/observed-precipitation.json'
        target_file=out/key;target_file.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(observed_source,target_file)
        objects.append({'key':key,'bytes':target_file.stat().st_size,'sha256':digest(target_file)})
        observed={'key':key,'run':payload['run'],'schema':payload['schema']}
    model_fields=None
    fields_dir=source/'model-fields';fields_index=fields_dir/'index.json'
    if fields_index.is_file():
        payload=json.loads(fields_index.read_text())
        if payload.get('schema')!='mid.icon-d2.fields.v1':raise ValueError('invalid native map index')
        prefix=f'runs/{run}__fields_{digest(fields_index)[:16]}/model-fields/'
        files=[fields_index]
        for kind,product in payload['products'].items():
            for frame in product['frames']:
                name=frame['file']
                if not re.fullmatch(r'[a-z]+-\d{3}\.(json|bin)',name):raise ValueError('unsafe native map filename')
                file=fields_dir/name
                if digest(file)!=frame['sha256'] or file.stat().st_size!=frame['bytes']:raise ValueError('native map digest mismatch')
                files.append(file)
        for file in files:
            key=prefix+file.name;destination=out/key;destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,destination)
            objects.append({'key':key,'bytes':destination.stat().st_size,'sha256':digest(destination)})
        model_fields={'key':prefix+'index.json','run':payload['run'],'schema':payload['schema']}
    synoptic_fields=None
    fields_dir=source/'synoptic-fields';fields_index=fields_dir/'index.json'
    if fields_index.is_file():
        payload=json.loads(fields_index.read_text())
        if payload.get('schema')!='mid.synoptic.fields.v1':raise ValueError('invalid synoptic index')
        # Retain all nine established five-field terms. Extra terms are optional
        # when the unchanged free-Pages envelope is otherwise exhausted.
        fit_synoptic_budget(payload,PAGES_RUC_BUDGET_BYTES-1-sum(row['bytes'] for row in objects))
        fields_index.write_text(json.dumps(payload,separators=(',',':'),ensure_ascii=False)+'\n')
        prefix=f'runs/{run}__synoptic_{digest(fields_index)[:16]}/synoptic-fields/'
        files=[fields_index]
        for model,product in payload['models'].items():
            if model not in ('icon-d2','icon-eu','gfs','ifs'):raise ValueError('unknown synoptic model')
            for frame in product['frames']:
                name=frame['file']
                if not re.fullmatch(re.escape(model)+r'-\d{3}\.bin',name):raise ValueError('unsafe synoptic file')
                file=fields_dir/name
                if digest(file)!=frame['sha256'] or file.stat().st_size!=frame['bytes']:raise ValueError('synoptic digest mismatch')
                files.append(file)
        for file in files:
            key=prefix+file.name;destination=out/key;destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,destination)
            objects.append({'key':key,'bytes':destination.stat().st_size,'sha256':digest(destination)})
        synoptic_fields={'key':prefix+'index.json','schema':payload['schema'],'generatedAt':payload['generatedAt']}
    total=sum(row['bytes'] for row in objects)
    if total>=PAGES_RUC_BUDGET_BYTES:
        raise ValueError(f'Pages-free RUC payload {total} bytes exceeds {PAGES_RUC_BUDGET_BYTES} byte budget')
    result={**meta,'deterministic':det,'epsSummary':summary,'lookup':lookup,'rapid':rapid,'rapidExtreme':rapid_extreme or None,'eps':eps,'storageProfile':PROFILE,'precipitationTotals':totals,'observedPrecipitation':observed,'modelFields':model_fields,'synopticFields':synoptic_fields,
            'pages':{'profile':PROFILE,'nativeEpsMembers':False,'publishedBytes':total,'budgetBytes':PAGES_RUC_BUDGET_BYTES,'objects':objects,'prunedRedundantFields':pruned_fields,'prunedRapidProducts':pruned_products,'savedBytes':saved_bytes}}
    (out/'latest.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    return result


def main():
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=Path('.ruc-out'));p.add_argument('--output',type=Path,default=Path('.ruc-pages'))
    p.add_argument('--data-chunk-points',type=int,default=DEFAULT_DATA_CHUNK_POINTS);p.add_argument('--lookup-chunk-entries',type=int,default=DEFAULT_LOOKUP_CHUNK_ENTRIES)
    a=p.parse_args()
    # The established workflow (including recovery reruns) already invokes this
    # CLI. Keep totals orchestration here instead of adding another paid service
    # or an additional workflow/permission surface.
    from build_precipitation_totals import build as build_totals
    try:build_totals(a.source/'precipitation-totals.json')
    except RuntimeError as error:
        # A missing independent 48-hour product must not block the canonical
        # short-range RUC forecast. The map then stays explicitly unavailable.
        (a.source/'precipitation-totals.json').unlink(missing_ok=True)
        print(f'::warning::ICON-D2 totals unavailable: {error}',flush=True)
    from build_observed_precipitation import build as build_observed
    try:build_observed(a.source/'observed-precipitation.json')
    except (RuntimeError,ValueError,OSError) as error:
        (a.source/'observed-precipitation.json').unlink(missing_ok=True)
        print(f'::warning::RADOLAN sums unavailable: {error}',flush=True)
    from build_model_map_fields import build as build_fields
    fields_dir=a.source/'model-fields'
    if fields_dir.exists():shutil.rmtree(fields_dir)
    try:
        totals_path=a.source/'precipitation-totals.json'
        if totals_path.is_file():build_fields(fields_dir,json.loads(totals_path.read_text()))
    except (RuntimeError,ValueError,OSError) as error:
        if fields_dir.exists():shutil.rmtree(fields_dir)
        print(f'::warning::ICON-D2 native maps unavailable: {error}',flush=True)
    from build_synoptic_fields import build as build_synoptic
    synoptic_dir=a.source/'synoptic-fields'
    if synoptic_dir.exists():shutil.rmtree(synoptic_dir)
    try:build_synoptic(synoptic_dir)
    except Exception as error:
        shutil.rmtree(synoptic_dir,ignore_errors=True)
        print(f'::warning::Synoptic fields unavailable: {error}',flush=True)
    meta=prepare(a.source,a.output,a.data_chunk_points,a.lookup_chunk_entries)
    print(json.dumps({'run':meta['run'],'profile':meta['storageProfile'],'publishedBytes':meta['pages']['publishedBytes'],'budgetBytes':meta['pages']['budgetBytes'],'objects':len(meta['pages']['objects']),'nativeEpsMembers':False,'prunedRedundantFields':meta['pages']['prunedRedundantFields'],'prunedRapidProducts':meta['pages']['prunedRapidProducts'],'savedBytes':meta['pages']['savedBytes']}))
if __name__=='__main__':main()
