#!/usr/bin/env python3
"""Read-only public Pages/Worker RUC deployment freshness evidence.

Records polling time, NOT the actual publication instant or app adoption.
Never changes endpoints, dispatches jobs, publishes data, or authorizes SLO.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import urllib.parse
import urllib.request
from ruc_freshness_shadow_gate import model_time

MAX_BYTES = 3000000


def safe_https(url):
    parsed=urllib.parse.urlsplit(url)
    if parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise ValueError('trusted public URL must use HTTPS without credentials or fragment')
    return url


def get_json(url):
    safe_https(url)
    request=urllib.request.Request(url,headers={'Accept':'application/json',
       'Cache-Control':'no-store','Pragma':'no-cache','User-Agent':'MID-RUC-E2E-readback/1'})
    with urllib.request.urlopen(request,timeout=15) as response:
        safe_https(response.geturl())
        if response.status != 200:raise RuntimeError('readback not HTTP 200')
        raw=response.read(MAX_BYTES+1)
    if not raw or len(raw)>MAX_BYTES:raise ValueError('empty or over-budget readback')
    payload=json.loads(raw)
    if not isinstance(payload,dict):raise ValueError('RUC readback is not an object')
    return payload


def _health_url(endpoint):
    safe_https(endpoint)
    parsed=urllib.parse.urlsplit(endpoint)
    pairs=[(k,v) for k,v in urllib.parse.parse_qsl(parsed.query,keep_blank_values=True) if k!='mode']
    pairs.append(('mode','ruc-health'))
    return urllib.parse.urlunsplit((parsed.scheme,parsed.netloc,parsed.path or '/',urllib.parse.urlencode(pairs),''))


def _released_contract_readonly(pages):
    """Strict observational counterpart of MID check_ruc_health.py dimensions.

    It does not check source SHA or decode data. Independent production readback
    remains authoritative and may reject additional semantically bad metadata.
    """
    from datetime import timedelta
    if not isinstance(pages, dict) or pages.get('schema') != 'mid.dwd.ruc.grid.v2':
        raise ValueError('invalid RUC schema')
    run = pages.get('run'); base = model_time(run)
    expected = [(base + timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M') for i in range(28)]
    if pages.get('times') != expected:
        raise ValueError('incomplete model forecast axis')
    for item in ('deterministic', 'epsSummary', 'eps'):
        entry = pages.get(item)
        if not isinstance(entry, dict) or entry.get('times') != expected:
            raise ValueError('incomplete component axis: ' + item)
    points, members, grid = pages.get('pointCount'), pages['eps'].get('memberCount'), pages.get('grid')
    if type(points) is not int or points <= 0 or type(members) is not int or members != 20:
        raise ValueError('invalid point or EPS member count')
    if not isinstance(grid, dict) or type(grid.get('nativePointCount')) is not int or grid['nativePointCount'] != points:
        raise ValueError('invalid native grid')
    return {'run': run, 'timeCount':28, 'pointCount':points, 'epsMemberCount':20}


def _worker_readonly(worker, expected):
    if not isinstance(worker,dict):raise ValueError('worker unavailable')
    if any(worker.get(k) is not True for k in ('configured','ready','fresh','schemaValid')):
        raise ValueError('worker not validated')
    if worker.get('run') != expected['run']:
        raise ValueError('worker run drift')
    for name in ('timeCount', 'pointCount', 'epsMemberCount'):
        if type(worker.get(name)) is not int or worker[name] != expected[name]:
            raise ValueError('worker dimension drift: ' + name)
    objs=worker.get('objectsPresent')
    if not isinstance(objs,dict) or any(objs.get(k) is not True for k in ('lookup','deterministic','epsSummary')):
        raise ValueError('worker objects missing')
    backend = worker.get('backend')
    if backend == 'pages' and worker.get('nativeEpsMembers') is not False:
        raise ValueError('Pages cannot declare native EPS members')
    if backend == 'r2' and objs.get('epsMembers') is not True:
        raise ValueError('R2 native EPS object missing')
    if backend not in ('pages','r2'):
        raise ValueError('unknown RUC backend')
    return True


def inspect_readback(pages, worker, observed_at):
    """Structural public comparison only; exact SHA/bitmap checks are producer gates."""
    when=datetime.fromisoformat(observed_at.replace('Z','+00:00'))
    if when.tzinfo is None or when.utcoffset().total_seconds()!=0:
        raise ValueError('observation timestamp not UTC')
    result={'schema':'mid.ruc.e2e-readback-shadow.v1','observedAtUtc':observed_at,
            'pagesRun':None,'workerRun':None,'pagesValid':False,'workerValid':False,
            'sameRun':False,'runAgeMinutes':None,'appAdopted':None,
            'productionSloAuthorized':False}
    # Reuse the released MID production structural checks. This is still ONLY an
    # observational readback: no uploaded byte-SHA or App adoption is proven.
    try:
        contract=_released_contract_readonly(pages)
        result['pagesRun']=contract['run']
        result['pagesValid']=True
        result['runAgeMinutes']=round((when-model_time(contract['run'])).total_seconds()/60,3)
    except (RuntimeError, ValueError, TypeError, KeyError, AttributeError):
        contract=None
    if contract is not None and isinstance(worker,dict):
        try:
            _worker_readonly(worker,contract)
            result['workerRun']=worker['run']
            result['workerValid']=True
        except (RuntimeError, ValueError, TypeError, KeyError, AttributeError):
            result['workerRun']=worker.get('run')
    result['sameRun']=bool(result['pagesValid'] and result['workerValid'] and
                           result['pagesRun']==result['workerRun'])
    return result


def capture(pages_base,worker_url=None,fetcher=get_json,clock=None):
    utcnow=clock or datetime.now(timezone.utc)
    if utcnow.tzinfo is None or utcnow.utcoffset().total_seconds()!=0:
        raise ValueError('non UTC clock')
    base=safe_https(pages_base).rstrip('/')+'/'
    pages_url=urllib.parse.urljoin(base,'latest.json')
    # Pages and Worker failures are individual unknowns, not proof that the
    # model did not exist or synthetic zeros.
    errors=[];pages=None;worker=None
    try:pages=fetcher(pages_url)
    except Exception as exc:errors.append('pages:'+type(exc).__name__)
    if worker_url:
        try:worker=fetcher(_health_url(worker_url))
        except Exception as exc:errors.append('worker:'+type(exc).__name__)
    else:errors.append('worker:not-configured')
    result=inspect_readback(pages,worker,utcnow.isoformat().replace('+00:00','Z'))
    result['errors']=errors
    result['workerWasQueried']=bool(worker_url)
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pages-base',default='https://midwx.app/ruc/')
    parser.add_argument('--worker-url',default=None)
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    if args.output.exists():parser.error('append/overwrite prohibited: use unique run/attempt filename')
    report=capture(args.pages_base,args.worker_url)
    args.output.write_text(json.dumps(report,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n',encoding='utf-8')
    print('MID RUC readback observation: '+json.dumps(report,sort_keys=True,separators=(',',':')))

if __name__=='__main__':main()
