#!/usr/bin/env python3
"""Build page-sized immutable Fast RUC binaries, without authorizing publication.

Converts already SHA-admitted cell-major original native objects into *lossless*
chunks for Pages/Worker consumers. Never overwrites canonical /ruc/latest.json,
never claims EPS20 or online adoption. Output is a fresh private directory.
The publisher needs independent producer, SHA, release and consumer gates.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
import re
import shutil
import tempfile

RUN = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:00$')
SHA = re.compile(r'^[a-f0-9]{64}$')
SIZES = {'deterministic.bin':7 * 12 * 2, 'rapid-5m.bin':73 * 2,
         'rapid-15m.bin':25 * 3 * 2, 'lookup.bin':4}


def hexdigest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_root(path):
    path=Path(path)
    if not path.is_dir() or path.is_symlink() or any(x.is_symlink() for x in path.rglob('*')):
        raise ValueError('unsafe original Fast shadow tree')
    return path


def partition_native_fast(source, target, *, chunk_cells=512, expected_points=542040):
    """The only non-production smaller-grid exception is explicit in unit tests."""
    src=safe_root(source)
    dst=Path(target)
    if (dst.exists() or dst.is_symlink() or not dst.parent.is_dir() or
            not isinstance(chunk_cells,int) or chunk_cells<1 or chunk_cells>1024 or
            not isinstance(expected_points,int) or expected_points<1):
        raise ValueError('unsafe output / chunk geometry')
    pointer=json.loads((src/'ruc'/'fast'/'latest.json').read_text(encoding='utf-8'))
    if pointer.get('schema')!='mid.ruc.fast-shadow-pointer.v1' or pointer.get('run') is None:
        raise ValueError('unqualified original fast pointer')
    run=pointer['run']
    if not isinstance(run,str) or not RUN.fullmatch(run):
        raise ValueError('untrusted UTC run')
    try:
        start=datetime.strptime(run,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise ValueError('invalid calendar model run') from exc
    if start.strftime('%Y-%m-%dT%H:%M')!=run:
        raise ValueError('noncanonical model run')
    for field,step,count in (('dataTimes',60,7),('rapid5Times',5,73),('rapid15Times',15,25)):
        expected=[(start+timedelta(minutes=i*step)).strftime('%Y-%m-%dT%H:%M') for i in range(count)]
        if pointer.get(field)!=expected:
            raise ValueError('native UTC valid-time axis mismatch: '+field)
    fields=pointer.get('fields')
    if (not isinstance(fields,list) or len(fields)!=12 or
            any(not isinstance(row,dict) or not isinstance(row.get('name'),str) or
                not isinstance(row.get('scale'),(float,int)) or row['scale']<=0
                for row in fields)):
        raise ValueError('missing native field units/scales')
    if not SHA.fullmatch(str(pointer.get('sourceGribSha256',''))):
        raise ValueError('original GRIB digest absent')
    if pointer.get('nativePoints')!=expected_points or pointer.get('eps')!={'availability':'unavailable'}:
        raise ValueError('Fast native geometry and EPS unverified')
    for name in ('productionEnabled','publicationAuthorized','realtimeConsumerEnabled','consumerAdoptionVerified'):
        if pointer.get(name) is not False:
            raise ValueError('Fast source is already active; refuse repacking')
    objs=pointer.get('objects')
    if not isinstance(objs,dict) or set(objs)!=set(SIZES):
        raise ValueError('incomplete original native inventory')
    root=src/'ruc'
    with tempfile.TemporaryDirectory(prefix='.mid-fast-pages-chunks-',dir=dst.parent) as tmp:
        stage=Path(tmp)
        manifest={'schema':'mid.ruc.fast-paged-shadow.v1','run':run,
                  'sourceSchema':pointer['schema'],'sourceManifestSha256':hexdigest((root/'fast'/'latest.json').read_bytes()),
                  'nativePoints':expected_points,'chunkCells':chunk_cells,'epsAvailable':False,
                  'timeAxes':{'hourly':pointer.get('dataTimes'),'rapid5':pointer.get('rapid5Times'),'rapid15':pointer.get('rapid15Times')},
                  'sourceGribSha256':pointer.get('sourceGribSha256'),
                  'fields':fields,'grid':pointer.get('grid'),
                  'productionEnabled':False,'publicationAuthorized':False,
                  'realtimeConsumerEnabled':False,'objects':{}}
        total=0
        for name,bytes_per_point in SIZES.items():
            obj=objs[name]
            key=obj.get('key')
            if not isinstance(key,str) or key!=f'fast/runs/{run.replace("-", "").replace(":", "")}/{name}':
                raise ValueError('original object key mismatch')
            raw=root/key
            expected_count=(pointer['grid']['nx']*pointer['grid']['ny'] if name=='lookup.bin' else expected_points)
            if (not raw.is_file() or raw.is_symlink() or raw.stat().st_size!=expected_count*bytes_per_point or
                    obj.get('bytes')!=raw.stat().st_size or not SHA.fullmatch(str(obj.get('sha256','')))):
                raise ValueError('original native object geometry invalid')
            chunk_dir=stage/'ruc'/'fast'/'pages'/run.replace('-','').replace(':','')/name.removesuffix('.bin')
            chunk_dir.mkdir(parents=True)
            complete=hashlib.sha256()
            parts=[]
            with raw.open('rb') as fp:
                first=0
                while first<expected_count:
                    cells=min(chunk_cells,expected_count-first)
                    data=fp.read(cells*bytes_per_point)
                    if len(data)!=cells*bytes_per_point:raise ValueError('truncated native source')
                    complete.update(data)
                    part_path=chunk_dir/f'{first//chunk_cells:04d}.bin'
                    with part_path.open('xb') as out:out.write(data)
                    part={'key':part_path.relative_to(stage/'ruc').as_posix(),
                          'firstCell':first,'cells':cells,'bytes':len(data),'sha256':hexdigest(data)}
                    parts.append(part)
                    total+=len(data)
                    first+=cells
                if fp.read(1):raise ValueError('native source has trailing bytes')
            if complete.hexdigest()!=obj['sha256']:
                raise ValueError('original whole native SHA invalid: '+name)
            manifest['objects'][name]={'sourceSha256':obj['sha256'],'bytesPerCell':bytes_per_point,
                                        'cellCount':expected_count,'parts':parts}
        original=sum(obj['bytes'] for obj in objs.values())
        if total!=original:raise ValueError('bit-identical byte count not preserved')
        manifest['sourceNativeBytes']=original
        m=stage/'ruc'/'fast'/'paged-shadow.json'
        m.write_text(json.dumps(manifest,sort_keys=True,allow_nan=False,separators=(',',':'))+'\n',encoding='utf-8')
        # The immutability proof is by reassembly, not just individual chunk digests.
        for name,spec in manifest['objects'].items():
            recomposed=hashlib.sha256();sum_bytes=0
            for part in spec['parts']:
                p=stage/'ruc'/part['key']
                b=p.read_bytes()
                if len(b)!=part['bytes'] or hexdigest(b)!=part['sha256']:raise ValueError('chunk corruption')
                recomposed.update(b);sum_bytes+=len(b)
            if sum_bytes!=spec['bytesPerCell']*spec['cellCount'] or recomposed.hexdigest()!=spec['sourceSha256']:
                raise ValueError('lossless native recomposition failed')
        os.rename(stage,dst)
    return {'run':run,'sourceNativeBytes':original,'actualPartitionBytes':total,
            'chunkFiles':sum(len(x['parts']) for x in manifest['objects'].values()),
            'publicationAuthorized':False,'schema':manifest['schema']}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--shadow',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--chunk-cells',type=int,default=512)
    args=parser.parse_args()
    print(json.dumps(partition_native_fast(args.shadow,args.output,chunk_cells=args.chunk_cells),sort_keys=True))

if __name__=='__main__':main()
