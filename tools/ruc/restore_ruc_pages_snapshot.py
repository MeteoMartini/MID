#!/usr/bin/env python3
"""Preserve the currently deployed free RUC snapshot across normal MID Pages releases."""
from __future__ import annotations
import argparse,concurrent.futures,hashlib,json,shutil,time,urllib.error,urllib.parse,urllib.request
from pathlib import Path

TRANSIENT_HTTP_CODES={429,500,502,503,504}
MAX_RESTORE_WORKERS=8
DEFAULT_FETCH_RETRIES=4

def _retry_delay(url:str,attempt:int,retry_after:str|None=None)->float:
    if retry_after:
        try:return max(.25,min(15.0,float(retry_after)))
        except (TypeError,ValueError):pass
    jitter=(int(hashlib.sha256(url.encode()).hexdigest()[:4],16)%250)/1000
    return min(8.0,.5*(2**attempt))+jitter

def fetch(url:str,timeout=30,retries=DEFAULT_FETCH_RETRIES)->bytes:
    req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'MID-RUC-pages-preserver/2'})
    for attempt in range(max(0,retries)+1):
        try:
            with urllib.request.urlopen(req,timeout=timeout) as r:return r.read()
        except urllib.error.HTTPError as e:
            if e.code not in TRANSIENT_HTTP_CODES or attempt>=retries:raise
            delay=_retry_delay(url,attempt,e.headers.get('Retry-After') if e.headers else None)
            print(f'Transient RUC HTTP {e.code}; retry {attempt+2}/{retries+1} in {delay:.2f}s: {url}',flush=True)
        except (urllib.error.URLError,TimeoutError) as e:
            if attempt>=retries:raise
            delay=_retry_delay(url,attempt)
            print(f'Transient RUC network error; retry {attempt+2}/{retries+1} in {delay:.2f}s: {url} ({e})',flush=True)
        time.sleep(delay)
    raise RuntimeError(f'unreachable retry state for {url}')

def sha(data:bytes)->str:return hashlib.sha256(data).hexdigest()

def restore(base:str,target:Path,required=False,workers=16):
    base=base.rstrip('/')+'/'
    try:meta_bytes=fetch(urllib.parse.urljoin(base,'latest.json'),15)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print('No deployed RUC snapshot yet (HTTP 404); continuing with bootstrap release without ruc/.')
            return False
        if required: raise RuntimeError(f'current RUC snapshot unavailable: HTTP {e.code}') from e
        print(f'RUC snapshot unavailable (HTTP {e.code}); continuing without ruc/.');return False
    except Exception as e:
        if required: raise RuntimeError(f'current RUC snapshot unavailable: {e}') from e
        print('No deployed RUC snapshot to preserve; continuing without ruc/.');return False
    meta=json.loads(meta_bytes.decode())
    if meta.get('storageProfile')!='pages-free-v1':
        if required: raise RuntimeError('deployed RUC snapshot is not pages-free-v1')
        return False
    objects=meta.get('pages',{}).get('objects') or []
    if not objects:
        if required: raise RuntimeError('deployed RUC snapshot has no object manifest')
        return False
    tmp=target.with_name(target.name+'.tmp');shutil.rmtree(tmp,ignore_errors=True);tmp.mkdir(parents=True)
    def one(row):
        key=str(row.get('key') or '')
        if not key.startswith('runs/') or '..' in key.split('/'): raise RuntimeError(f'unsafe RUC object key: {key}')
        data=fetch(urllib.parse.urljoin(base,key),45)
        if len(data)!=int(row.get('bytes') or -1) or sha(data)!=row.get('sha256'): raise RuntimeError(f'RUC object verification failed: {key}')
        path=tmp/key;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    effective_workers=min(MAX_RESTORE_WORKERS,max(1,workers))
    if effective_workers!=workers:print(f'RUC restore concurrency capped at {effective_workers} workers (requested {workers}) to reduce transient Pages/CDN overload.',flush=True)
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=effective_workers) as pool:list(pool.map(one,objects))
        (tmp/'latest.json').write_bytes(meta_bytes)
        shutil.rmtree(target,ignore_errors=True);tmp.replace(target)
    except Exception:
        shutil.rmtree(tmp,ignore_errors=True)
        raise
    print(f'Preserved RUC Pages snapshot {meta.get("run")} with {len(objects)} immutable chunks.')
    return True

def main():
    p=argparse.ArgumentParser();p.add_argument('--base',default='https://midwx.app/ruc/');p.add_argument('--target',type=Path,default=Path('dist/ruc'));p.add_argument('--required',action='store_true');p.add_argument('--workers',type=int,default=16);a=p.parse_args();restore(a.base,a.target,a.required,a.workers)
if __name__=='__main__':main()
