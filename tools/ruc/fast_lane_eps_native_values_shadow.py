#!/usr/bin/env python3
"""Read-only full 20-member DWD EPS native precipitation value shadow.

Completeness is tested per UTC validity time and native member ID. No
deterministic value, operational Fast-Lane pointer or production publication
is authorized. The released full +27h pipeline stays authoritative.
"""
from __future__ import annotations

import argparse
from datetime import timedelta
import hashlib
import json
from pathlib import Path

from fast_lane_grib_preflight import _files
from ruc_freshness_shadow_gate import model_time
from fast_lane_native_values_shadow import MAX_SOURCE_BYTES

REQUIRED_MEMBERS = tuple(range(1, 21))


def _read(path, expected_run, field):
    from build_ruc_bundle import read_messages
    return read_messages(path, ensemble=True, expected_run=expected_run,
                         include_signature=True, expected_parameter=field)


def _sha256(path):
    sha=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1<<20),b''):
            sha.update(b)
    return sha.hexdigest()


def qualify(root, run, hours=6, *, reader=_read, expected_points=None):
    import numpy as np
    from build_ruc_bundle import normalize
    from grib_metadata import NATIVE_GRID, assert_same_parameter_signature
    from meteo_integrity import validate_accumulation, validate_eps_member_coverage

    root=Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError('unsafe native EPS staging')
    if type(hours) is not int or hours not in (6,14):
        raise ValueError('only independently qualified +6/+14h permitted')
    if expected_points is not None and reader is _read:
        raise ValueError('real GRIB must use pinned native grid')
    points=NATIVE_GRID[-1] if expected_points is None else expected_points
    if type(points) is not int or not 0 < points <= NATIVE_GRID[-1]:
        raise ValueError('invalid native EPS grid point count')
    base=model_time(run)
    times=tuple(base+timedelta(hours=h) for h in range(hours+1))
    target=set(times)
    files=_files(root,'eps/TOT_PREC')
    if not files:
        raise ValueError('missing native EPS TOT_PREC')
    records={}
    source=[]
    source_bytes=0
    signature_ref=None
    for path in files:
        size=path.stat().st_size
        if size<100:
            raise ValueError('empty/truncated native EPS file')
        source_bytes+=size
        if source_bytes>MAX_SOURCE_BYTES:
            raise ValueError('native EPS source bytes over safety limit')
        original=_sha256(path)
        for valid,member,native,units,signature in reader(path,base,'precipitation_acc'):
            signature_ref=assert_same_parameter_signature('precipitation_acc',signature_ref,signature)
            if valid not in target:
                # Metadata validation is still imposed on *every* GRIB message.
                continue
            if type(member) is not int or member not in REQUIRED_MEMBERS:
                raise ValueError('noncanonical EPS member ID')
            key=(valid,member)
            if key in records:
                raise ValueError('duplicate EPS member at UTC validity time')
            array=np.asarray(native)
            if array.ndim!=1 or len(array)!=points:
                raise ValueError('EPS native grid drift')
            records[key]=normalize('precipitation_acc',array,units)
        if path.stat().st_size!=size or _sha256(path)!=original:
            raise ValueError('EPS GRIB source changed during decoding')
        source.append({'path':path.relative_to(root).as_posix(),
                       'bytes':size,'sha256':original})
    expected={(t,m) for t in times for m in REQUIRED_MEMBERS}
    if set(records)!=expected:
        raise ValueError('EPS missing '+str(len(expected-set(records)))+' native time/member records')
    cube=np.stack([
        np.stack([records[(t,m)] for m in REQUIRED_MEMBERS],axis=0)
        for t in times
    ],axis=0)
    coverage=validate_eps_member_coverage(cube,list(REQUIRED_MEMBERS))
    validate_accumulation(cube, 'RUC-EPS TOT_PREC +0..'+str(hours))
    return {'schema':'mid.ruc.fast-lane-eps-native-values-shadow.v1',
            'run':run,'hours':hours,
            'validTimesUtc':[t.strftime('%Y-%m-%dT%H:%MZ') for t in times],
            'nativePointCount':points,
            'nativeGridUuid':NATIVE_GRID[0] if expected_points is None else None,
            'memberIds':list(REQUIRED_MEMBERS),'recordCount':len(records),
            'eps20NativeHeadersBitmapValuesVerified':True,
            'cumulativePrecipitationValidated':True,
            'nativeEpsMissingCoverage':coverage,
            'sourceGribBytes':source_bytes,'sources':source,
            'deterministicVerified':False,'losslessWirePackingVerified':False,
            'pagesWorkerAppWidgetExportVerified':False,'productionAuthorized':False,
            'note':'independent EPS values shadow only; no full-pipeline or publishing approval'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--staging',type=Path,required=True)
    p.add_argument('--run',required=True)
    p.add_argument('--hours',type=int,default=6,choices=(6,14))
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    if a.output.exists():p.error('will not replace an immutable evidence report')
    code=0
    try: report=qualify(a.staging,a.run,a.hours)
    except Exception as error:
        code=2
        report={'schema':'mid.ruc.fast-lane-eps-native-values-shadow.v1',
                'run':a.run,'hours':a.hours,'state':'unknown-or-invalid',
                'errorClass':type(error).__name__,
                'eps20NativeHeadersBitmapValuesVerified':False,
                'productionAuthorized':False}
    a.output.write_text(json.dumps(report,ensure_ascii=False,allow_nan=False,
                                   sort_keys=True,indent=2)+'\n',encoding='utf-8')
    print('RUC EPS20 value shadow: '+('complete' if code==0 else 'UNKNOWN/INVALID')
          +'; NEVER full RUC publication authority')
    return code
if __name__=='__main__':
    raise SystemExit(main())
