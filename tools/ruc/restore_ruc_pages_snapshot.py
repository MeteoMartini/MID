#!/usr/bin/env python3
"""Preserve the currently deployed free RUC snapshot across normal MID Pages releases."""
from __future__ import annotations
import argparse,concurrent.futures,hashlib,json,shutil,urllib.error,urllib.parse,urllib.request
from pathlib import Path


def fetch(url:str,timeout=30)->bytes:
    req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','User-Agent':'MID-RUC-pages-preserver/1'})
    with urllib.request.urlopen(req,timeout=timeout) as r:return r.read()

def sha(data:bytes)->str:return hashlib.sha256(data).hexdigest()

def restore(base:str,target:Path,required=False,workers=16):
    base=base.rstrip('/')+'/'
    try:meta_bytes=fetch(urllib.parse.urljoin(base,'latest.json'),15)
    except Exception as e:
        if required: raise RuntimeError(f'current RUC snapshot unavailable: {e}')
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
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,workers)) as pool:list(pool.map(one,objects))
    (tmp/'latest.json').write_bytes(meta_bytes)
    shutil.rmtree(target,ignore_errors=True);tmp.replace(target)
    print(f'Preserved RUC Pages snapshot {meta.get("run")} with {len(objects)} immutable chunks.')
    return True

def main():
    p=argparse.ArgumentParser();p.add_argument('--base',default='https://midwx.app/ruc/');p.add_argument('--target',type=Path,default=Path('dist/ruc'));p.add_argument('--required',action='store_true');p.add_argument('--workers',type=int,default=16);a=p.parse_args();restore(a.base,a.target,a.required,a.workers)
if __name__=='__main__':main()
