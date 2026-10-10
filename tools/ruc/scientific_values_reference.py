#!/usr/bin/env python3
"""Bounded real native core/EPS values reference; not a complete production run.

Capture checks the full native grid at +0/+1 h. Only exact decoded values at
fixed stratified indices and three extrema are frozen in the replay fixture.
Raw file hashes identify provenance but are not an archive of raw GRIB inputs.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import tempfile
import numpy as np
from build_ruc_bundle import derive_core_fields, normalize, normalize_coordinate, read_messages
from meteo_integrity import validate_core_fields, validate_accumulation, validate_eps_member_coverage
from ruc_pack import DEFAULT_FIELDS, pack_cell_major, pack_eps_members
from scientific_grib_contract_probe import targets, fetch, inspect


def finite_json(array):
    array=np.asarray(array)
    return np.where(np.isfinite(array),array,None).tolist()


def replay(fixture):
    times=fixture['times']
    series={name:{time:normalize(name,np.asarray(values,dtype=np.float32),fixture['units'][name])
                  for time,values in zip(times,rows,strict=True)}
            for name,rows in fixture['nativeSamples'].items()}
    fields=derive_core_fields(series,times)
    validate_core_fields(fields)
    acc=np.asarray(fixture['epsAccumulationMm'],dtype=np.float32)
    validate_eps_member_coverage(acc,fixture['members']);validate_accumulation(acc,'reference EPS')
    eps=np.maximum(0,np.diff(acc,axis=0,prepend=acc[:1]))
    deterministic=pack_cell_major(fields)
    ensemble=pack_eps_members(eps)
    restored_eps=np.frombuffer(ensemble,dtype='<u2').reshape(len(fixture['indices']),len(times),len(fixture['members'])).transpose(1,2,0)
    finite_eps=np.isfinite(eps)
    if not np.array_equal(restored_eps==65535,~finite_eps):raise ValueError('EPS missing sentinel mismatch')
    unclipped_eps=finite_eps&(eps<=655.34)
    eps_error=float(np.max(np.abs(restored_eps[unclipped_eps]*.01-eps[unclipped_eps]))) if unclipped_eps.any() else None
    if eps_error is not None and eps_error>.005+1e-5:raise ValueError('EPS quantization error')
    errors={}
    packed=np.frombuffer(deterministic,dtype='<i2').reshape(len(fixture['indices']),len(times),len(DEFAULT_FIELDS))
    for index,spec in enumerate(DEFAULT_FIELDS):
        values=fields[spec.name].T.astype(np.float64)
        finite=np.isfinite(values)
        rounded=np.rint((values-spec.offset)/spec.scale)
        unclipped=finite&(rounded>=-32767)&(rounded<=32767)
        restored=packed[:,:,index]*spec.scale+spec.offset
        error=float(np.max(np.abs(restored[unclipped]-values[unclipped]))) if unclipped.any() else None
        if error is not None and error>spec.scale/2+1e-5:
            raise ValueError(f'{spec.name}: quantization error exceeds half a quantization step')
        if not np.array_equal(packed[:,:,index]==-32768,~finite):
            raise ValueError(f'{spec.name}: missing sentinel mismatch')
        errors[spec.name]={'maximumUnclippedError':error,'clippedCount':int(np.count_nonzero(finite&~unclipped))}
    return {'deterministicPackedSha256':hashlib.sha256(deterministic).hexdigest(),
            'epsPackedSha256':hashlib.sha256(ensemble).hexdigest(),
            'deterministicBytes':len(deterministic),'epsBytes':len(ensemble),'packing':errors,
            'epsMaximumUnclippedError':eps_error,'epsClippedCount':int(np.count_nonzero(finite_eps&~unclipped_eps))}


def capture(run_text):
    run=datetime.strptime(run_text,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    times=[run,run+timedelta(hours=1)]
    native={};units={};eps={time:{} for time in times};coordinates={};records=[]
    rows=targets(run_text,hours=1,rapid_hours=0,members=20)
    with tempfile.TemporaryDirectory() as directory,ThreadPoolExecutor(max_workers=4) as pool:
        for row,raw in pool.map(fetch,rows):
            records.append(inspect(row,raw,run))
            path=Path(directory)/'field.grib2';path.write_bytes(raw)
            messages=list(read_messages(path,ensemble=row['member'] is not None,expected_run=run,
                                        expected_parameter=row['logicalField']))
            if len(messages)!=1:raise ValueError('one message per file required')
            valid,member,values,unit=messages[0];name=row['logicalField']
            if row['member'] is not None:
                if member!=row['member']:raise ValueError('member identity mismatch')
                eps[valid][member]=normalize(name,values,unit)
            elif name in ('CLAT','CLON'):
                coordinates[name]=normalize_coordinate(name,values,unit)
            else:
                if name in units and units[name]!=unit:raise ValueError('units change across lead times')
                units[name]=unit;native.setdefault(name,{})[valid]=values
            print(f'Values decoded {len(records)}/{len(rows)}',flush=True)
    series={name:{time:normalize(name,values,units[name]) for time,values in values_by_time.items()}
            for name,values_by_time in native.items()}
    fields=derive_core_fields(series,times);coverage=validate_core_fields(fields)
    count=fields['temperature_2m'].shape[1]
    for name,values in coordinates.items():
        if values.shape!=(count,) or not np.isfinite(values).all():raise ValueError(f'{name}: invalid coordinate grid')
        limit=90 if name=='CLAT' else 180
        if np.max(np.abs(values))>limit:raise ValueError(f'{name}: geographic bounds')
    members=list(range(1,21))
    if any(set(eps[time])!=set(members) for time in times):raise ValueError('complete EPS IDs1..20 required')
    acc=np.stack([np.stack([eps[time][member] for member in members]) for time in times])
    eps_coverage=validate_eps_member_coverage(acc,members);validate_accumulation(acc,'native reference EPS')
    # Conservation tolerates only the existing 0.05-mm accumulation jitter gate.
    det_acc=np.stack([series['precipitation_acc'][time] for time in times])
    conservation=fields['precipitation'].sum(axis=0)-(det_acc[-1]-det_acc[0])
    finite=np.isfinite(conservation)
    maximum=float(np.max(np.abs(conservation[finite])))
    if maximum>0.05+1e-6:raise ValueError('deterministic precipitation conservation failed')
    selected=set(np.linspace(0,count-1,32,dtype=int).tolist())
    for name in ('precipitation','temperature_2m','wind_speed_10m'):
        selected.add(int(np.nanargmax(fields[name][-1])))
    indices=sorted(selected)
    fixture={'schema':'mid.ruc.values-reference.v1','run':run_text,
             'scope':'full native-grid core/QC at +0/+1 h and EPS20; decoded subset replay, not full production E2E',
             'times':[time.isoformat() for time in times],'members':members,'nativePointCount':count,
             'selection':'32 equally spaced native indices plus last-step precipitation/temperature/wind maxima',
             'indices':indices,'coordinates':{name:finite_json(values[indices]) for name,values in coordinates.items()},
             'units':units,'nativeSamples':{name:finite_json(np.stack([values[time][indices] for time in times])) for name,values in native.items()},
             'epsAccumulationMm':finite_json(acc[:,:,indices]),'sourceFiles':records,
             'coverage':coverage,'epsCoverage':eps_coverage,'maximumPrecipitationConservationErrorMm':maximum,
             'fullGridValues':{name:{'min':float(np.nanmin(values)),'max':float(np.nanmax(values)),
                                    'missingCount':int(np.count_nonzero(~np.isfinite(values)))} for name,values in fields.items()},
             'limitations':['Raw GRIBs are identified by hash, not frozen in this fixture.',
                            'Only decoded selected cells can be replayed offline; full-grid QC was checked during capture.',
                            'No +2..14h, rapid products, optional fields, lookup/regridding or production deployment checked.']}
    fixture['golden']=replay(fixture)
    return fixture


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run');parser.add_argument('--output',type=Path);parser.add_argument('--replay',type=Path)
    args=parser.parse_args()
    if args.replay:
        fixture=json.loads(args.replay.read_text());result=replay(fixture)
        if result!=fixture['golden']:raise SystemExit('golden reference mismatch')
        print(json.dumps(result,indent=2))
    elif args.run and args.output:
        args.output.write_text(json.dumps(capture(args.run),indent=2,allow_nan=False)+'\n')
    else:parser.error('provide --replay or --run and --output')
