#!/usr/bin/env python3
"""Read-only native header-axis probe; NOT a values/E2E or skill-score benchmark.

All required hourly core/EPS and 5/15-minute precipitation/convection headers
are checked. Downloads are bounded; ecCodes decoding stays in the main thread.
The resulting JSON archives URLs/hashes/time bounds/grid identity, not raw inputs.
"""
from __future__ import annotations
import argparse
import bz2
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import time
import requests
import numpy as np
from eccodes import codes_new_from_message, codes_get, codes_get_long, codes_get_message, codes_release
from build_ruc_bundle import PARAM_MAP, normalize, normalize_coordinate
from grib_metadata import inspect_grib_header, validate_time_window


def targets(run, hours=14, rapid_hours=6, members=20):
    base='https://opendata.dwd.de/weather/nwp/v1/m/'
    rows={}
    def add(model,param,name,minute,member=None):
        lead=f'PT{minute//60:03d}H{minute%60:02d}M'
        suffix=f'e/{member:02d}/' if member is not None else ''
        url=f'{base}{model}/p/{param}/r/{run}/{suffix}s/{lead}.grib2'
        rows[url]={'parameter':param,'logicalField':name,'member':member,'url':url}
    for param,name in PARAM_MAP.items():
        for hour in range(hours+1):add('icon-d2-ruc',param,name,hour*60)
    for param in ('CLAT','CLON'):add('icon-d2-ruc',param,param,0)
    for param,name,step in [('TOT_PREC','precipitation_acc',5),('CAPE_ML','cape',15),('CIN_ML','convective_inhibition',15)]:
        for minute in range(0,rapid_hours*60+1,step):add('icon-d2-ruc',param,name,minute)
    for member in range(1,members+1):
        for hour in range(hours+1):add('icon-d2-ruc-eps','TOT_PREC','precipitation_acc',hour*60,member)
    return list(rows.values())


def fetch(row):
    response=requests.get(row['url'],timeout=60)
    response.raise_for_status()
    return row,response.content


def inspect(row,raw,run):
    decoded=bz2.decompress(raw) if raw.startswith(b'BZh') else raw
    gid=codes_new_from_message(decoded)
    if gid is None:raise ValueError('empty GRIB response')
    try:
        if len(codes_get_message(gid))!=len(decoded):
            raise ValueError('expected exactly one GRIB message per native field/member/lead file')
        valid,signature=inspect_grib_header(gid,run,row['logicalField'])
        units=str(codes_get(gid,'units'))
        normalizer=normalize_coordinate if row['parameter'] in {'CLAT','CLON'} else normalize
        normalizer(row['logicalField'],np.zeros(1),units)
        if row['member'] is not None and int(codes_get_long(gid,'perturbationNumber'))!=row['member']:
            raise ValueError('EPS header member does not match requested member')
        bounds=validate_time_window(run,valid,codes_get(gid,'startStep'),codes_get(gid,'endStep'),
                                    int(codes_get_long(gid,'stepUnits')),str(codes_get(gid,'stepType')))
        return {**row,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),
                'units':units,'gridIdentity':list(signature[-3]),**bounds}
    finally:codes_release(gid)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run',required=True,help='UTC initialization YYYY-MM-DDTHH:MM')
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--hours',type=int,default=14)
    parser.add_argument('--rapid-hours',type=int,default=6)
    parser.add_argument('--members',type=int,default=20)
    parser.add_argument('--workers',type=int,default=4)
    args=parser.parse_args()
    if not 0<=args.hours<=14 or not 0<=args.rapid_hours<=6 or not 1<=args.members<=20 or not 1<=args.workers<=8:
        parser.error('probe bounds: hours0..14, rapid0..6, members1..20, workers1..8')
    run=datetime.strptime(args.run,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    started=time.perf_counter();rows=targets(args.run,args.hours,args.rapid_hours,args.members)
    remaining=iter(rows);results=[]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        pending={pool.submit(fetch,row) for row in [next(remaining,None) for _ in range(args.workers)] if row is not None}
        while pending:
            done,pending=wait(pending,return_when=FIRST_COMPLETED)
            for future in done:
                row,raw=future.result();results.append(inspect(row,raw,run))
                next_row=next(remaining,None)
                if next_row is not None:pending.add(pool.submit(fetch,next_row))
                if len(results)%50==0:print(f'Validated {len(results)}/{len(rows)} native headers',flush=True)
    report={'schema':'mid.ruc.grib-contract-probe.v1','run':args.run,
            'scope':'complete requested header axes; not full values/QC/packing/E2E/reference benchmark',
            'hours':args.hours,'rapidHours':args.rapid_hours,'members':args.members,
            'observedAt':datetime.now(timezone.utc).isoformat(),'wallSeconds':time.perf_counter()-started,
            'records':sorted(results,key=lambda row:row['url'])}
    args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'validated':len(results),'wallSeconds':report['wallSeconds']}),flush=True)


if __name__=='__main__':main()
