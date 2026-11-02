#!/usr/bin/env python3
"""Create an immutable *inactive* Pages full-site + genuine RUC fast overlay.

Read-only offline assembly: NEVER call GitHub, deploy-pages, R2, Worker,
release, or mutate the existing primary /ruc/latest.json. A standalone,
authenticated single-writer publisher and fresh-site readback are required
before this staging may become user-visible.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile

from ruc_fast_consumer_shadow import inspect_shadow
from ruc_fast_pointer_staging import strict_budget, count_files


def run_date(run):
    if not isinstance(run,str) or len(run)!=16:
        raise ValueError('noncanonical RUC source run')
    value=datetime.strptime(run,'%Y-%m-%dT%H:%M')
    if value.strftime('%Y-%m-%dT%H:%M')!=run:
        raise ValueError('invalid source run')
    return value.replace(tzinfo=timezone.utc)


def file_sha(path):
    hash=hashlib.sha256()
    with path.open('rb') as reader:
        for block in iter(lambda: reader.read(1024*1024),b''):
            hash.update(block)
    return hash.hexdigest()


def assemble_overlay(full_site, fast_shadow, output):
    full=Path(full_site)
    fast=Path(fast_shadow)
    dest=Path(output)
    if not full.is_dir() or full.is_symlink() or not fast.is_dir() or fast.is_symlink():
        raise ValueError('missing immutable full Pages site or Fast candidate')
    if dest.exists() or dest.is_symlink() or not dest.parent.is_dir():
        raise ValueError('overlay output must be an unused normal directory')
    # Both trees have their own strong SHA provenance and are checked again.
    full_bytes=count_files(full)
    fast_bytes=count_files(fast)
    head=full/'ruc'/'latest.json'
    if head.is_symlink() or not head.is_file():
        raise ValueError('full 27h RUC release metadata missing')
    canonical_sha=file_sha(head)
    meta=json.loads(head.read_text(encoding='utf-8'))
    if (meta.get('schema')!='mid.dwd.ruc.grid.v2' or
        meta.get('storageProfile')!='pages-lossless-v1' or
        meta.get('pointCount')!=542040 or
        not isinstance(meta.get('deterministic'),dict) or
        len(meta['deterministic'].get('times',[]))!=28 or
        meta.get('eps',{}).get('memberCount')!=20 or
        len(meta.get('eps',{}).get('times',[]))!=28):
        raise ValueError('original full 27h/20EPS/site admission absent')
    primary_run=run_date(meta.get('run'))
    shadow=inspect_shadow(fast)
    if shadow['originalNativeObjectsVerified'] is not True:
        raise ValueError('shadow original bytes not verified')
    fast_run=run_date(shadow['run'])
    # A fast overlay is useless if older than the complete site, and must not
    # silently mix unrelated forecast cycles.
    diff=(fast_run-primary_run).total_seconds()
    if diff<0 or diff>6*3600:
        raise ValueError('stale or unrelated native fast source run')
    budget=strict_budget(full_bytes,fast_bytes)
    if (full/'ruc'/'fast').exists():
        raise ValueError('existing Fast namespace must not be replaced implicitly')
    with tempfile.TemporaryDirectory(prefix='.mid-fast-inactive-pages-',dir=dest.parent) as scratch:
        root=Path(scratch)/'site'
        shutil.copytree(full,root,symlinks=False)
        target=root/'ruc'/'fast'
        shutil.copytree(fast/'ruc'/'fast',target,symlinks=False)
        if file_sha(root/'ruc'/'latest.json')!=canonical_sha:
            raise ValueError('original 27h full site pointer changed')
        # Re-read every relocated Fast byte/bitmap/axis, not only its pointer.
        checked=inspect_shadow(root)
        if (checked['run']!=shadow['run'] or
            checked['originalNativeObjectsVerified'] is not True or
            checked['productionEnabled'] is not False or
            checked['realtimeConsumerEnabled'] is not False):
            raise ValueError('relocated shadow not byte-identical or unexpectedly enabled')
        if count_files(root)!=full_bytes+fast_bytes:
            raise ValueError('unexpected modification or loss during atomic overlay')
        strict_budget(full_bytes,fast_bytes)
        os.rename(root,dest)
    return {
        'schema':'mid.ruc.fast-overlay-local.v1',
        'primaryRun':meta['run'],'fastRun':shadow['run'],
        'primaryManifestSha256':canonical_sha,
        'fullSiteBytes':full_bytes,'fastShadowBytes':fast_bytes,
        'combinedPagesBytes':full_bytes+fast_bytes,'remainingBytes':budget,
        'full27hOriginalBytesIntact':True,'fastNativeObjectHashesRechecked':True,
        'productionEnabled':False,'publicationAuthorized':False,
        'consumerAdoptionVerified':False,
        'evidenceLimit':'offline immutable inactive site only, not a global CAS or live Pages/Worker client',
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--full-site',required=True,type=Path)
    parser.add_argument('--fast-shadow',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    opts=parser.parse_args()
    proof=assemble_overlay(opts.full_site,opts.fast_shadow,opts.output)
    print(json.dumps(proof,sort_keys=True,allow_nan=False))


if __name__=='__main__':
    main()
