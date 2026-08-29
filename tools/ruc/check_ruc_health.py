#!/usr/bin/env python3
"""Verify that the deployed MID Worker can read the just-published RUC run."""
from __future__ import annotations
import argparse,json,sys,urllib.parse,urllib.request
from pathlib import Path


def health_url(raw:str)->str:
    url=urllib.parse.urlsplit(raw.strip())
    if url.scheme not in {'https','http'} or not url.netloc:
        raise ValueError('MID_RUC_WORKER_HEALTH_URL must be an absolute http(s) URL')
    query=urllib.parse.parse_qsl(url.query,keep_blank_values=True)
    query=[(k,v) for k,v in query if k!='mode']+[('mode','ruc-health')]
    return urllib.parse.urlunsplit((url.scheme,url.netloc,url.path or '/',urllib.parse.urlencode(query),url.fragment))


def expected_run(meta_path:str)->str:
    data=json.loads(Path(meta_path).read_text(encoding='utf-8'))
    if data.get('schema')!='mid.dwd.ruc.grid.v2' or not data.get('run'):
        raise ValueError('local RUC metadata is invalid')
    return str(data['run'])


def check(payload:dict,run:str)->None:
    required={'configured':True,'ready':True,'fresh':True,'schemaValid':True}
    for key,value in required.items():
        if payload.get(key) is not value:
            raise RuntimeError(f'worker RUC health {key}={payload.get(key)!r}, expected {value!r}; reason={payload.get("reason")!r}')
    if str(payload.get('run',''))!=run:
        raise RuntimeError(f'worker RUC run {payload.get("run")!r} does not match published run {run!r}')
    objects=payload.get('objectsPresent') or {}
    for key in ('lookup','deterministic','epsSummary'):
        if objects.get(key) is not True:
            raise RuntimeError(f'worker RUC object {key} is not present')
    backend=str(payload.get('backend') or '')
    if backend=='r2' and objects.get('epsMembers') is not True:
        raise RuntimeError('worker RUC native EPS object is not present for R2 backend')
    if backend=='pages' and payload.get('nativeEpsMembers') is not False:
        raise RuntimeError('GitHub Pages free profile must explicitly omit native EPS members')
    if int(payload.get('timeCount') or 0)<4 or int(payload.get('pointCount') or 0)<1 or int(payload.get('epsMemberCount') or 0)<2:
        raise RuntimeError('worker RUC metadata counts are incomplete')


def main()->int:
    p=argparse.ArgumentParser()
    p.add_argument('--url',required=True)
    p.add_argument('--meta',default='.ruc-out/latest.json')
    p.add_argument('--timeout',type=float,default=15)
    a=p.parse_args()
    run=expected_run(a.meta); url=health_url(a.url)
    req=urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':'MID-RUC-health-check/1'})
    with urllib.request.urlopen(req,timeout=a.timeout) as response:
        if response.status!=200: raise RuntimeError(f'worker RUC health HTTP {response.status}')
        payload=json.loads(response.read().decode())
    check(payload,run)
    print(f'MID RUC health OK: backend={payload.get("backend")}, run={run}, ageHours={payload.get("ageHours")}, points={payload.get("pointCount")}, epsMembers={payload.get("epsMemberCount")}')
    return 0

if __name__=='__main__':
    try: raise SystemExit(main())
    except Exception as error:
        print(f'MID RUC health FAILED: {error}',file=sys.stderr)
        raise SystemExit(2)
