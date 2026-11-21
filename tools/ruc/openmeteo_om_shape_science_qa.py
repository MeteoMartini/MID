#!/usr/bin/env python3
"""Experiment ONLY: inspect exact published Open-Meteo .om array shapes.

Run in an isolated GitHub QA environment with externally pinned omfiles=1.2.0.
The GPL-2.0 reader is NOT packaged, installed, linked or called by MID.
No weather values are integrated, no DWD-original admission or publication.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import math
import os
import pathlib
import tempfile
import urllib.parse
import urllib.request

HOST = 'openmeteo.s3.amazonaws.com'
BASE = 'https://' + HOST + '/data_spatial/'
MAX_OM_BYTES = 20_000_000
SOURCES = (
    ('dwd_icon_d2_ruc_native','temperature_2m',60),
    ('dwd_icon_d2_ruc_native_15min','precipitation',15),
    ('dwd_icon_d2_ruc_native_model_level','temperature_80m',60),
)


def utc(value):
    if not isinstance(value,str) or not value.endswith('Z'):
        raise ValueError('not UTC Z')
    stamp=dt.datetime.fromisoformat(value.replace('Z','+00:00'))
    if stamp.tzinfo is None or stamp.utcoffset()!=dt.timedelta(0) or stamp.second!=0 or stamp.microsecond:
        raise ValueError('invalid exact UTC minute')
    return stamp


def fetch_json(domain):
    url=BASE+domain+'/latest.json'
    with urllib.request.urlopen(url, timeout=20) as response:
        if response.geturl()!=url or response.status!=200:
            raise ValueError('unexpected manifest redirect/status')
        payload=response.read(250001)
    if len(payload)>250000:
        raise ValueError('manifest too large')
    doc=json.loads(payload)
    if doc.get('completed') is not True or not isinstance(doc.get('valid_times'),list):
        raise ValueError('not a completed source run')
    return doc,hashlib.sha256(payload).hexdigest()


def pinned_url(domain,doc,cadence):
    run=utc(doc['reference_time'])
    valid=[utc(x) for x in doc['valid_times']]
    if (not valid or valid[0]!=run or len(valid)<3 or
        valid[-1]-run!=dt.timedelta(hours=27) or
        any(b-a!=dt.timedelta(minutes=cadence) for a,b in zip(valid,valid[1:]))):
        raise ValueError('invalid published source time axis')
    chosen=valid[1]  # T+0 backward accumulations are intentionally excluded.
    folder=run.strftime('%Y/%m/%d/%H%MZ')
    key=chosen.strftime('%Y-%m-%dT%H%M.om')
    return BASE+domain+'/'+folder+'/'+key,chosen.isoformat().replace('+00:00','Z')


def download_bounded(url,output):
    parsed=urllib.parse.urlparse(url)
    if parsed.scheme!='https' or parsed.hostname!=HOST or parsed.query or parsed.fragment:
        raise ValueError('unsafe OM source URL')
    digest=hashlib.sha256()
    total=0
    req=urllib.request.Request(url,headers={'Accept':'application/octet-stream'})
    with urllib.request.urlopen(req,timeout=30) as response:
        if response.status!=200 or urllib.parse.urlparse(response.geturl()).hostname!=HOST:
            raise ValueError('redirect or unexpected OM HTTP status')
        reported=int(response.headers.get('Content-Length','0') or 0)
        if reported>MAX_OM_BYTES:
            raise ValueError('oversize OM file')
        with open(output,'wb') as stream:
            while True:
                chunk=response.read(min(1048576,MAX_OM_BYTES-total+1))
                if not chunk:
                    break
                total+=len(chunk)
                if total>MAX_OM_BYTES:raise ValueError('oversize live OM stream')
                digest.update(chunk);stream.write(chunk)
    if total<64 or (reported and total!=reported):
        raise ValueError('truncated OM source')
    return total,digest.hexdigest()


def inspect_array(filepath,variable):
    from omfiles import OmFileReader
    with OmFileReader(str(filepath)) as root:
        if not root.is_group:
            raise ValueError('expected hierarchical OM root')
        child=root.get_child_by_name(variable)
        if not child.is_array:
            raise ValueError('expected OM numeric array')
        shape=tuple(int(x) for x in child.shape)
        if not 1<=len(shape)<=4 or not all(1<=x<=5000000 for x in shape):
            raise ValueError('invalid OM shape')
        return shape,math.prod(shape)


def main():
    rows=[];run_ids=[]
    with tempfile.TemporaryDirectory(prefix='mid-om-science-') as work:
        for domain,field,cadence in SOURCES:
            manifest,manifest_sha=fetch_json(domain)
            url,valid=pinned_url(domain,manifest,cadence)
            run_ids.append(manifest['reference_time'])
            filepath=pathlib.Path(work)/(domain+'.om')
            size,digest=download_bounded(url,filepath)
            shape,cells=inspect_array(filepath,field)
            rows.append({'domain':domain,'variable':field,'sourceRun':manifest['reference_time'],
               'validTime':valid,'sourceUrl':url,'publishedAxisStepMinutes':cadence,
               'shape':shape,'arrayElements':cells,'matchesDwdNativeCellCount':cells==542040,
               'compressedBytes':size,'fullObjectSha256':digest,
               'metadataSha256':manifest_sha,'nativeCoordinatesProven':False,
               'DwdOriginalValuesProven':False,'productionEligible':False})
    if len(set(run_ids))!=1:raise ValueError('cross-domain cycle mismatch')
    print(json.dumps({'schema':'mid.openmeteo.om-shape-science.v1',
        'readOnly':True,'GPLReaderShippedWithMID':False,
        'commonSourceRun':run_ids[0],'observedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
        'results':rows,'nativeDwdGeometryProven':False,
        'DwdOriginalValuesProven':False,'productionEligible':False},indent=2))


if __name__=='__main__':
    main()
