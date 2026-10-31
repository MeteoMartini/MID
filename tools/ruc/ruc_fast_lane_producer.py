#!/usr/bin/env python3
"""Prepare authentic standalone DWD ICON-D2-RUC deterministic 0-6h candidate.

Uses the production ecCodes readers, grid, accumulation and native pack contracts.
Never writes /ruc/latest.json, Pages, R2, Worker, GitHub or production metadata.
This output is not a deployment artifact until independent bytes/consumer gates pass.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile

FIELDS = ('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M',
          'TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML')
RUN = re.compile(r'^20\d{2}-\d{2}-\d{2}T\d{2}:00$')
EXPECTED_LEADS = frozenset(range(0,361,60))
EXPECTED_RAPID5 = frozenset(range(0,361,5))
EXPECTED_RAPID15 = frozenset(range(0,361,15))


def canonical_run(value):
    if not isinstance(value,str) or not RUN.fullmatch(value):
        raise ValueError('noncanonical RUC model run')
    stamp=datetime.strptime(value,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    if stamp.strftime('%Y-%m-%dT%H:%M')!=value:
        raise ValueError('invalid model run')
    return value


def lead_inventory(files, extractor, expected):
    leads=[extractor(str(path)) for path in files]
    if len(leads)!=len(set(leads)) or set(leads)!=set(expected):
        raise ValueError('native lead completeness/duplicate violation')
    return len(leads)


def safe_quantization(fields, specs, np):
    if set(fields)!={s.name for s in specs}:
        raise ValueError('core output fields do not match native format')
    shapes={tuple(getattr(v,'shape',())) for v in fields.values()}
    if len(shapes)!=1 or len(next(iter(shapes)))!=2:
        raise ValueError('native fields have inconsistent shapes')
    for spec in specs:
        arr=np.asarray(fields[spec.name],dtype=np.float64)
        available=np.isfinite(arr)
        # Authentic masked cells remain missing. A completely missing forecast
        # lead must not be packed as an apparently valid short-range field.
        if not np.all(np.any(available,axis=1)):
            raise ValueError('native forecast step entirely missing: '+spec.name)
        finite=arr[available]
        scaled=np.rint((finite-spec.offset)/spec.scale)
        if np.any(~np.isfinite(scaled)) or np.any(scaled<-32767) or np.any(scaled>32767):
            raise ValueError('native extreme would clip int16: '+spec.name)
    return True


def digest(path):
    sha=hashlib.sha256();size=0
    with Path(path).open('rb') as source:
        for block in iter(lambda: source.read(1024*1024),b''):
            sha.update(block);size+=len(block)
    if size==0:raise ValueError('zero-byte artifact cannot be published')
    return {'bytes':size,'sha256':sha.hexdigest()}


def verify_candidate_manifest(candidate, root):
    """Locally independent byte readback only. No production authorization."""
    if (not isinstance(candidate,dict) or candidate.get('schema')!='mid.ruc.fast-prepared.v1'
            or candidate.get('horizonHours')!=6 or candidate.get('eps')!={'availability':'unavailable'}
            or candidate.get('publicationAuthorized') is not False):
        raise ValueError('invalid immutable fast candidate contract')
    canonical_run(candidate.get('run'))
    files=candidate.get('objects')
    if not isinstance(files,dict) or set(files)!={'deterministic.bin','rapid-5m.bin','rapid-15m.bin','lookup.bin'}:
        raise ValueError('required objects missing')
    base=Path(root).resolve(strict=True)
    for name,proof in files.items():
        path=base/name
        if path.is_symlink() or not path.is_file() or path.resolve().parent!=base:
            raise ValueError('unsafe candidate path')
        if digest(path)!=proof:raise ValueError('candidate bytes do not match SHA/length')
    run=datetime.strptime(candidate['run'],'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    from datetime import timedelta
    expected=[(run+timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M') for i in range(7)]
    if candidate.get('dataTimes')!=expected:
        raise ValueError('incomplete or shifted fast native data axis')
    for field,step in (('rapid5Times',5),('rapid15Times',15)):
        native=[(run+timedelta(minutes=i)).strftime('%Y-%m-%dT%H:%M') for i in range(0,361,step)]
        if candidate.get(field)!=native:raise ValueError('incomplete rapid time axis')
    return {'verifiedLocalBytes':True,'publicationAuthorized':False}


def build(run, output, staging):
    """Build into a new directory; never overwrite an existing candidate."""
    canonical_run(run)
    output=Path(output)
    if output.exists() or not output.parent.is_dir():raise ValueError('candidate output must be new under an existing directory')
    # Lazy imports keep the schema/negative tests executable without ecCodes.
    import numpy as np
    from fetch_and_build_ruc import (DET_BASE, FORECAST_REQUIRED, GRID_REQUIRED,
        stage_tree, stage_coordinate, session, crawl_files, select_requested_files,
        forecast_lead_minutes)
    from build_ruc_bundle import (PARAM_MAP, collect_parameter, load_native_grid,
        hourly_targets, rapid_targets, derive_core_fields, build_lookup,
        accumulation_intervals)
    from meteo_integrity import validate_core_fields
    from ruc_pack import (DEFAULT_FIELDS, RAPID_5M_FIELDS, RAPID_15M_FIELDS,
        pack_cell_major)
    if set(FORECAST_REQUIRED)!=set(FIELDS):raise ValueError('production field contract drift')
    s=session()
    # Directory listings are only a preflight; the original ecCodes reader
    # independently validates every downloaded GRIB header, units and bitmap.
    for field in FIELDS:
        folder=f'{DET_BASE}/{field}/r/{run}/'
        inventory=select_requested_files(crawl_files(s,folder),6,mode='hourly')
        lead_inventory(inventory,forecast_lead_minutes,EXPECTED_LEADS)
    stage=Path(staging)
    if stage.exists():raise ValueError('GRIB staging must be a fresh isolated path')
    source=[]
    try:
        with tempfile.TemporaryDirectory(prefix='.mid-fast-candidate-',dir=output.parent) as scratch:
            out=Path(scratch);targets=hourly_targets(run,6)['deterministic'];series={};points=None
            for code,name in PARAM_MAP.items():
                folder=stage/'deterministic'/code
                rows=stage_tree(s,f'{DET_BASE}/{code}/r/{run}/',folder,6,run+' '+code,mode='hourly')
                files=[folder/x for x in rows]
                lead_inventory(files,forecast_lead_minutes,EXPECTED_LEADS)
                decoded=collect_parameter(files,name,targets,points)
                if points is None:points=len(decoded[targets[0]])
                series[name]=decoded
                source.extend({'field':code,'leadMinutes':forecast_lead_minutes(str(path)),
                               'sourceSha256':digest(path)['sha256']} for path in files)
            for code in GRID_REQUIRED:
                folder=stage/'grid'/code
                rows=stage_coordinate(s,f'{DET_BASE}/{code}/r/{run}/',folder,run+' '+code)
                for x in rows:source.append({'field':code,'leadMinutes':0,'sourceSha256':digest(folder/x)['sha256']})
            lats,lons=load_native_grid(stage,points)
            fields=derive_core_fields(series,targets)
            coverage=validate_core_fields(fields)
            safe_quantization(fields,DEFAULT_FIELDS,np)
            (out/'deterministic.bin').write_bytes(pack_cell_major(fields,DEFAULT_FIELDS))
            # The 5-/15-min products use their actual native DWD cadence. No
            # hourly interpolation or guessed zeros may fill missing data.
            acc_path=stage/'rapid'/'TOT_PREC'
            acc_rows=stage_tree(s,f'{DET_BASE}/TOT_PREC/r/{run}/',acc_path,6,
                                run+' rapid precipitation',mode='rapid-precip')
            acc_files=[acc_path/x for x in acc_rows]
            lead_inventory(acc_files,forecast_lead_minutes,EXPECTED_RAPID5)
            t5=rapid_targets(run,5,6);t15=rapid_targets(run,15,6)
            acc5=collect_parameter(acc_files,'precipitation_acc',t5,points)
            acc15=collect_parameter(acc_files,'precipitation_acc',t15,points)
            p5=accumulation_intervals(acc5,t5);p15=accumulation_intervals(acc15,t15)
            safe_quantization({'precipitation':p5},RAPID_5M_FIELDS,np)
            (out/'rapid-5m.bin').write_bytes(pack_cell_major({'precipitation':p5},RAPID_5M_FIELDS))
            for path in acc_files:source.append({'field':'TOT_PREC_5M','leadMinutes':forecast_lead_minutes(str(path)),
                                                  'sourceSha256':digest(path)['sha256']})
            rapid={'precipitation':p15}
            for code,name in [('CAPE_ML','cape'),('CIN_ML','convective_inhibition')]:
                folder=stage/'rapid'/code
                rows=stage_tree(s,f'{DET_BASE}/{code}/r/{run}/',folder,6,run+' '+code+' rapid',mode='rapid15')
                files=[folder/x for x in rows]
                lead_inventory(files,forecast_lead_minutes,EXPECTED_RAPID15)
                decoded=collect_parameter(files,name,t15,points)
                rapid[name]=np.stack([decoded[t] for t in t15])
                source.extend({'field':code+'_15M','leadMinutes':forecast_lead_minutes(str(path)),
                               'sourceSha256':digest(path)['sha256']} for path in files)
            safe_quantization(rapid,RAPID_15M_FIELDS,np)
            (out/'rapid-15m.bin').write_bytes(pack_cell_major(rapid,RAPID_15M_FIELDS))
            grid=build_lookup(lats,lons,out)
            times=[t.strftime('%Y-%m-%dT%H:%M') for t in targets]
            manifest={'schema':'mid.ruc.fast-prepared.v1','run':run,'horizonHours':6,
                      'pointCount':points,'dataTimes':times,'rapid5Times':[x.strftime('%Y-%m-%dT%H:%M') for x in t5],
                      'rapid15Times':[x.strftime('%Y-%m-%dT%H:%M') for x in t15],
                      'fields':[{'name':s.name,'scale':s.scale,'offset':s.offset,'unit':s.unit} for s in DEFAULT_FIELDS],
                      'grid':grid,'objects':{p.name:digest(p) for p in out.glob('*.bin')},
                      'sourceGrib':sorted(source,key=lambda x:(x['field'],x['leadMinutes'],x['sourceSha256'])),
                      'coverage':coverage,'eps':{'availability':'unavailable'},
                      'realtimeConsumerEnabled':False,'publicationAuthorized':False}
            verify_candidate_manifest(manifest,out)
            (out/'fast-candidate.json').write_text(json.dumps(manifest,ensure_ascii=False,allow_nan=False,
                    sort_keys=True,separators=(',',':'))+'\n',encoding='utf-8')
            # Single producer commit to an initially nonexistent output path.
            # Final stage is local only; no remote pointer or release mutation.
            os.rename(out,output)
            return manifest
    finally:
        shutil.rmtree(stage,ignore_errors=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run',required=True)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--stage',required=True,type=Path)
    options=parser.parse_args()
    value=build(options.run,options.output,options.stage)
    print(json.dumps({'run':value['run'],'nativeTimes':len(value['dataTimes']),
          'eps':'unavailable','publicationAuthorized':False},separators=(',',':')))


if __name__=='__main__':main()
