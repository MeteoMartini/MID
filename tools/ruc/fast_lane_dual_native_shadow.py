#!/usr/bin/env python3
"""Read-only AND of independently validated short-range native DWD value reports.

Source receipts are self-reported SHA observations, not signed provider
attestation. This object is deliberately NOT a production manifest or pointer.
"""
from __future__ import annotations
import argparse
from datetime import timedelta
import json
import re
from pathlib import Path

from ruc_freshness_shadow_gate import model_time

SHA=re.compile(r'^[0-9a-f]{64}$')
NATIVE='c6b12daa91ad64045b26c1b6452a2a20'
POINTS=542040


def source_inventory(report):
    sources=report.get('sources')
    if not isinstance(sources,list) or not sources:
        raise ValueError('missing native original-source bytes')
    paths=set()
    for item in sources:
        if not isinstance(item,dict):
            raise ValueError('bad native source object')
        name=item.get('path')
        if (not isinstance(name,str) or name.startswith('/') or '\\' in name or
                any(x in ('','.','..') for x in name.split('/')) or name in paths):
            raise ValueError('unsafe or duplicated native source path')
        paths.add(name)
        if type(item.get('bytes')) is not int or item['bytes']<100 or not SHA.fullmatch(str(item.get('sha256'))):
            raise ValueError('unverified source bytes/hash')
    return paths


def combine(det,eps):
    if not isinstance(det,dict) or not isinstance(eps,dict):
        raise ValueError('non-object input reports')
    if det.get('schema')!='mid.ruc.fast-lane-native-values-shadow.v1' or eps.get('schema')!='mid.ruc.fast-lane-eps-native-values-shadow.v1':
        raise ValueError('unexpected native shadow schema')
    run=det.get('run')
    init=model_time(run)
    if eps.get('run')!=run:
        raise ValueError('mixed RUC model initialization')
    hours=det.get('hours')
    if type(hours) is not int or hours not in (6,14) or eps.get('hours')!=hours:
        raise ValueError('cross-horizon RUC data reuse forbidden')
    expected=[(init+timedelta(hours=i)).strftime('%Y-%m-%dT%H:%MZ') for i in range(hours+1)]
    if det.get('validTimesUtc')!=expected or eps.get('validTimesUtc')!=expected:
        raise ValueError('deterministic/EPS validity-axis mismatch')
    if any(report.get('productionAuthorized') is not False for report in (det,eps)):
        raise ValueError('untrusted producer approval in observation')
    if (det.get('nativePointCount')!=POINTS or eps.get('nativePointCount')!=POINTS or
        det.get('sourceContractGridUuid')!=NATIVE or eps.get('nativeGridUuid')!=NATIVE):
        raise ValueError('pinned DWD native grid not demonstrated')
    if (det.get('allTwelveDeterministicNativeValuesVerified') is not True or
        det.get('deterministicBitmapAndPhysicalChecksPassed') is not True or
        det.get('cumulativePrecipitationValidated') is not True or
        eps.get('eps20NativeHeadersBitmapValuesVerified') is not True or
        eps.get('cumulativePrecipitationValidated') is not True or
        eps.get('memberIds')!=list(range(1,21)) or
        type(eps.get('recordCount')) is not int or eps['recordCount']!=(hours+1)*20):
        raise ValueError('not independently complete native deterministic and EPS20 values')
    if det.get('eps20Verified') is not False or eps.get('deterministicVerified') is not False:
        raise ValueError('independent data domain reports must not assert other domain')
    def field_leads():
        fields=det.get('finitePointsByFieldAndLead')
        if not isinstance(fields,dict) or len(fields)!=12:
            raise ValueError('twelve original native deterministic fields required')
        for counts in fields.values():
            if (not isinstance(counts,list) or len(counts)!=hours+1 or
                    any(type(n) is not int or not 0<n<=POINTS for n in counts)):
                raise ValueError('missing/invalid native deterministic bitmap cells')
    field_leads()
    left=source_inventory(det);right=source_inventory(eps)
    if left & right or not all(s.startswith('deterministic/') or s.startswith('grid/') for s in left) or not all(s.startswith('eps/TOT_PREC/') for s in right):
        raise ValueError('source group overlap/mismatch')
    if not all(det.get(k) is False for k in ('losslessWirePackingVerified','pagesWorkerAppWidgetExportVerified')):
        raise ValueError('deterministic shadow claimed publish/codec authority')
    if not all(eps.get(k) is False for k in ('losslessWirePackingVerified','pagesWorkerAppWidgetExportVerified')):
        raise ValueError('EPS shadow claimed publish/codec authority')
    return {'schema':'mid.ruc.short-range-dual-native-shadow.v1',
            'run':run,'hours':hours,'timeCount':len(expected),'nativePointCount':POINTS,
            'nativeDeterministicAndEPS20ValueReportsStructurallyConsistent':True,
            'originalDwdSourceAuthenticated':False,
            'immutableReleaseObjectsSealed':False,
            'losslessWirePackingVerified':False,'pagesWorkerAppWidgetExportVerified':False,
            'publicationAuthorized':False,
            'note':'cross-validated read-only reports; actual input bytes and producer/consumer release gates remain required'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--deterministic',required=True,type=Path)
    p.add_argument('--eps',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path)
    a=p.parse_args()
    if a.output.exists():
        p.error('immutable native qualification may not be overwritten')
    try:
        result=combine(json.loads(a.deterministic.read_text()),json.loads(a.eps.read_text()))
        code=0
    except Exception as exc:
        code=2
        result={'schema':'mid.ruc.short-range-dual-native-shadow.v1',
                'state':'unknown-or-invalid','errorClass':type(exc).__name__,
                'nativeDeterministicAndEPS20ValueReportsStructurallyConsistent':False,
                'publicationAuthorized':False}
    a.output.write_text(json.dumps(result,sort_keys=True,allow_nan=False,indent=2)+'\n',encoding='utf-8')
    print('Native DWD dual report: '+('structurally-consistent' if not code else 'unknown')
          +', release authority FALSE')
    return code

if __name__=='__main__':
    raise SystemExit(main())
