#!/usr/bin/env python3
"""Fail-closed guard before a manually initiated bare-dist GitHub Pages deploy.

The old manual deploy publishes ./dist, not the verified existing /ruc tree.
Its shared mid-pages job lock only serializes writers; it cannot prevent this
loss of 27h/20EPS. Therefore forbid the bare-dist operation whenever a public
RUC snapshot exists or is expected, without modifying the canonical publisher.
This script has no write permissions and does NOT create a new deploy path.
"""
import argparse
import json
import urllib.error
import urllib.request

PUBLIC = 'https://midwx.app/ruc/latest.json'
MAX_MANIFEST_BYTES = 10_000_000


def check_manual_bare_dist(*, status, body=b'', pipeline_enabled=None):
    if status == 200:
        try:
            meta=json.loads(body)
        except (ValueError, TypeError) as exc:
            raise ValueError('Public RUC response untrusted; bare dist forbidden') from exc
        if isinstance(meta,dict) and meta.get('schema')=='mid.dwd.ruc.grid.v2':
            raise ValueError('Live 27h/EPS RUC present: bare dist would erase RUC Pages data')
        raise ValueError('Unrecognized public RUC content; bare dist forbidden')
    if status == 404 and pipeline_enabled is False:
        return {'safeBareDistOnly':True,'publicRucAbsent':True,'source':'live-public-404','productionFastAuthorized':False}
    raise ValueError('RUC presence/requirement not safely disproven; bare dist forbidden')


def public_check(*, pipeline_enabled=None):
    request=urllib.request.Request(PUBLIC,headers={
        'Accept':'application/json','Cache-Control':'no-cache',
        'User-Agent':'MID-RUC-manual-deploy-fail-closed/1'})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            body=response.read(MAX_MANIFEST_BYTES+1)
            if len(body)>MAX_MANIFEST_BYTES:
                raise ValueError('RUC manifest beyond safe limit; bare dist forbidden')
            return check_manual_bare_dist(status=response.status,body=body,pipeline_enabled=pipeline_enabled)
    except urllib.error.HTTPError as err:
        if err.code==404:
            return check_manual_bare_dist(status=404,pipeline_enabled=pipeline_enabled)
        raise ValueError('Cannot verify public RUC; bare dist forbidden') from err
    except (urllib.error.URLError,TimeoutError,OSError) as err:
        raise ValueError('Cannot verify public RUC; bare dist forbidden') from err


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ruc-enabled',required=True,choices=['true','false','unset'])
    args=parser.parse_args()
    try:
        proof=public_check(pipeline_enabled={'true':True,'false':False,'unset':None}[args.ruc_enabled])
    except ValueError as error:
        parser.exit(1,'::error::'+str(error)+'\n')
    print(json.dumps(proof,sort_keys=True))
