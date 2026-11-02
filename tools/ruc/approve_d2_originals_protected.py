#!/usr/bin/env python3
"""Protected-main-only original ICON-D2 index preparation, never a deploy.

After independent 3-cycle DWD original GRIB and 72-field qualification,
rebuilds *all* 72 immutable gzip JSON objects with a non-authoritative
productionApproved candidate bit. Only a separately cryptographically signed
GitHub Actions provenance attestation from the protected signer grants real
admission. This script cannot sign, activate, or publish by itself.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone, timedelta
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile

from admit_d2_native_pages import KINDS, LEADS, UNITS, field_admission

SHA = re.compile(r'^[a-f0-9]{40}$')
MAX_INDEX = 3_000_000
MAX_DECODED = 12_000_000
BUDGET = 350_000_000


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def prepare(original: Path, inventory_file: Path, output: Path, commit: str) -> dict:
    if (not SHA.fullmatch(commit or '') or
        os.environ.get('GITHUB_EVENT_NAME') != 'workflow_dispatch' or
        os.environ.get('GITHUB_REF') != 'refs/heads/main' or
        os.environ.get('GITHUB_SHA') != commit or
        os.environ.get('GITHUB_REPOSITORY') != 'MeteoMartini/MID'):
        raise ValueError('Protected main workflow and exact source SHA are mandatory')
    source = Path(original).resolve(strict=True)
    inventory = Path(inventory_file).resolve(strict=True)
    destination = Path(output)
    if (not source.is_dir() or not inventory.is_file() or
        destination.exists() or destination.is_symlink() or
        not destination.parent.is_dir() or destination.parent.is_symlink() or
        destination.resolve().is_relative_to(source)):
        raise ValueError('Original D2 source or fresh protected output invalid')
    index_file = source/'index.json'
    if index_file.is_symlink() or not index_file.is_file() or index_file.stat().st_size > MAX_INDEX:
        raise ValueError('Immutable native D2 original index unavailable')
    raw = index_file.read_bytes()
    index = json.loads(raw)
    inventory_sha = digest(inventory.read_bytes())
    if (index.get('schema')!='mid.icon-d2.native-fields.v2' or
        index.get('productionApproved') is not False or
        index.get('nativePoints') != 542040 or
        index.get('modelId')!='icon-d2' or
        index.get('sourceInventorySha256') != inventory_sha or
        set(index.get('products',{}))!=set(KINDS)):
        raise ValueError('Original three-cycle DWD inventory/72-field source invalid')
    run = datetime.fromisoformat(index.get('run',''))
    if run.tzinfo is None or run.utcoffset() != timedelta(0):
        raise ValueError('Original DWD source UTC run invalid')
    age = (datetime.now(timezone.utc)-run).total_seconds()
    if age < -1800 or age > 12*3600:
        raise ValueError('Original DWD source expired or future run')
    if any(source.glob('*.tmp')) or any(p.is_symlink() for p in source.rglob('*')):
        raise ValueError('Untrusted native D2 source files')
    expected = {'index.json'} | {
        f'{k}-{h:03d}.bin' for k in KINDS for h in LEADS
    }
    if {p.name for p in source.iterdir()} != expected:
        raise ValueError('Original native D2 source has missing or unexpected members')
    prepared = {**index, 'productionApproved': True, 'sourceApprovalCommitSha': commit}
    prepared['products'] = {}
    grid = None
    total = 0
    with tempfile.TemporaryDirectory(prefix='.mid-d2-protected-',dir=destination.parent) as work:
        stage = Path(work)/'approved'
        stage.mkdir()
        for kind in KINDS:
            product=index['products'][kind]
            frames=product.get('frames',[]) if isinstance(product,dict) else []
            if product.get('unit')!=UNITS[kind] or len(frames)!=len(LEADS) or \
                    {f.get('hour') for f in frames}!=set(LEADS):
                raise ValueError('Original native D2 source field axis incomplete')
            approved=[]
            for frame in frames:
                hour=frame['hour']
                name=f'{kind}-{hour:03d}.bin'
                origin=source/name
                wire=origin.read_bytes()
                if (frame.get('file')!=name or frame.get('encoding')!='gzip-json' or
                    len(wire)!=frame.get('bytes') or digest(wire)!=frame.get('sha256') or
                    type(frame.get('decodedBytes')) is not int or
                    not 0 < frame['decodedBytes']<=MAX_DECODED):
                    raise ValueError('Original native D2 immutable frame checksum mismatch')
                with gzip.open(origin,'rb') as reader:
                    original_bytes=reader.read(frame['decodedBytes']+1)
                if len(original_bytes)!=frame['decodedBytes']:
                    raise ValueError('Original D2 decoded size invalid')
                data=json.loads(original_bytes)
                if (data.get('schema')!='mid.icon-d2.native-field.v2' or
                    data.get('productionApproved') is not False or
                    data.get('run')!=index['run'] or
                    data.get('sourceInventorySha256')!=inventory_sha or
                    data.get('kind')!=kind or data.get('leadHours')!=hour or
                    data.get('unit')!=UNITS[kind] or data.get('scale')!=.1 or
                    data.get('nativePoints')!=542040 or
                    datetime.fromisoformat(data.get('time',''))!=run+timedelta(hours=hour)):
                    raise ValueError('Original DWD field identity/valid time altered')
                grid = field_admission(data,kind,grid)
                if kind=='pressure' and not data.get('isobars'):
                    raise ValueError('Native pressure contours absent')
                approved_data={**data,'productionApproved':True}
                encoded=(json.dumps(approved_data,separators=(',',':'),ensure_ascii=False,allow_nan=False)+'\n').encode()
                if len(encoded)>MAX_DECODED:
                    raise ValueError('Protected native D2 decoded field exceeds limit')
                compressed=gzip.compress(encoded,compresslevel=6,mtime=0)
                total+=len(compressed)
                (stage/name).write_bytes(compressed)
                approved.append({**frame,'bytes':len(compressed),'decodedBytes':len(encoded),
                                 'sha256':digest(compressed)})
            prepared['products'][kind]={**product,'frames':approved}
        if total>=BUDGET:
            raise ValueError('Native D2 approved candidate exceeds 350 MB')
        prepared['nativeFullDomainBytes']=total
        (stage/'index.json').write_text(json.dumps(prepared,separators=(',',':'),
                                  ensure_ascii=False,allow_nan=False)+'\n',encoding='utf-8')
        os.rename(stage,destination)
    return {'indexSha256':digest((destination/'index.json').read_bytes()),
            'originalInventorySha256':inventory_sha,'sourceCommitSha':commit,
            'frames':72,'bytes':total,'signed':False,'published':False,
            'status':'requires protected GitHub SLSA attestation of index.json'}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original',required=True,type=Path)
    parser.add_argument('--inventory',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--commit',required=True)
    opts=parser.parse_args()
    print(json.dumps(prepare(opts.original,opts.inventory,opts.output,opts.commit),sort_keys=True))
