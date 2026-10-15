"""Offline full-inventory proof. Never a publisher or a production format switch.

Every declared object is verified, including JSON and already compressed maps.
Only declared int16 record products are candidates. Parts end on whole records
and remain within the existing pilot's decoded bound. Input bytes never change.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import tempfile
from lossless_codec_pilot import encode_candidate, decode_candidate
from lossless_dual_read import MAX_PILOT_BYTES


def packed(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':'))+'\n').encode()


def safe_file(root, key):
    if not isinstance(key, str) or not key.startswith('runs/') or '\\' in key or any(p in ('', '.', '..') for p in key.split('/')) or PurePosixPath(key).is_absolute():
        raise ValueError('unsafe inventory key')
    path=(root/key).resolve()
    if not path.is_relative_to(root):
        raise ValueError('inventory path escapes root')
    return path


def digest_file(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1_048_576), b''):
            h.update(block)
    return h.hexdigest()


def verify_inventory(meta, root):
    root=Path(root).resolve()
    if meta.get('schema')!='mid.dwd.ruc.grid.v2' or meta.get('storageProfile')!='pages-free-v1':
        raise ValueError('unsupported source inventory')
    pages=meta.get('pages', {})
    rows=pages.get('objects')
    if not isinstance(rows,list) or not rows:
        raise ValueError('empty source inventory')
    by_key={}
    for row in rows:
        key=row.get('key')
        path=safe_file(root,key)
        if key in by_key or type(row.get('bytes')) is not int or row['bytes']<=0 or not re.fullmatch('[a-f0-9]{64}', str(row.get('sha256',''))):
            raise ValueError('invalid or duplicate inventory row')
        if path.stat().st_size!=row['bytes'] or digest_file(path)!=row['sha256']:
            raise ValueError('inventory size/SHA mismatch: '+key)
        by_key[key]=row
    if type(pages.get('publishedBytes')) is not int or sum(r['bytes'] for r in rows)!=pages['publishedBytes']:
        raise ValueError('inventory total mismatch')
    if type(pages.get('budgetBytes')) is not int or pages['budgetBytes']!=900_000_000:
        raise ValueError('unexpected publication budget')
    return by_key


def record_geometry(meta, rows):
    specs=[meta.get('deterministic',{}),meta.get('epsSummary',{}),*meta.get('rapid',{}).values()]
    geometry={}
    for spec in specs:
        if not isinstance(spec,dict) or spec.get('dtype')!='int16-le':
            continue
        page=spec.get('pages',{})
        record=page.get('recordBytes')
        count=page.get('chunkCount')
        records=page.get('records')
        chunk_records=page.get('chunkRecords')
        if any(type(n) is not int or n<=0 for n in (record,count,records,chunk_records)) or record%2 or record>MAX_PILOT_BYTES or count!=(records+chunk_records-1)//chunk_records or spec.get('recordBytes')!=record:
            raise ValueError('invalid int16 product geometry')
        keys=page.get('chunkKeys')
        if keys is not None and (not isinstance(keys,list) or len(keys)!=count):
            raise ValueError('invalid chunk keys')
        for index in range(count):
            key=keys[index] if keys is not None else f"{page.get('prefix')}/{index:04d}.bin"
            expected=min(chunk_records, records-index*chunk_records)*record
            if key not in rows or rows[key]['bytes']!=expected or (key in geometry and geometry[key]!=record):
                raise ValueError('int16 object geometry mismatch')
            geometry[key]=record
    if not geometry:
        raise ValueError('no declared int16 products')
    return geometry


def build_inventory_proof(root, output):
    root=Path(root).resolve(strict=True)
    output=Path(output).resolve()
    if output.is_relative_to(root) or root.is_relative_to(output) or output.exists():
        raise ValueError('output must be a new directory outside source snapshot')
    source=(root/'latest.json').read_bytes()
    meta=json.loads(source)
    rows=verify_inventory(meta,root)
    geometry=record_geometry(meta,rows)
    output.parent.mkdir(parents=True,exist_ok=True)
    tmp=Path(tempfile.mkdtemp(prefix=output.name+'.partial-',dir=output.parent))
    try:
        wires={}; staged=set(); entries=[]; converted=0; covered=0
        for key,record in sorted(geometry.items()):
            row=rows[key]
            width=(MAX_PILOT_BYTES//record)*record
            parts=[]; candidates={}
            original=hashlib.sha256(); offset=0
            with safe_file(root,key).open('rb') as stream:
                while block:=stream.read(width):
                    original.update(block)
                    manifest,wire=encode_candidate(block,'byteplanes-gzip')
                    if decode_candidate(manifest,wire)!=block:
                        raise ValueError('Python part roundtrip mismatch')
                    wire_key='wire/'+manifest['encodedSha256']+'.bin'
                    parts.append({'offset':offset,'key':wire_key,'manifest':manifest})
                    offset+=len(block)
                    candidates[wire_key]=len(wire)
                    if wire_key not in staged:
                        path=tmp/wire_key;path.parent.mkdir(exist_ok=True);path.write_bytes(wire)
                        staged.add(wire_key)
            if offset!=row['bytes'] or original.hexdigest()!=row['sha256']:
                raise ValueError('source changed while building proof')
            # Keep an entire incompressible original, not a misleading negative saving.
            if sum(candidates.values())>=row['bytes']:
                continue
            wires.update(candidates)
            entries.append({'rawKey':key,'rawBytes':row['bytes'],'rawSha256':row['sha256'],'recordBytes':record,'parts':parts})
            converted+=row['bytes'];covered+=len(parts)
        for orphan in staged-wires.keys():
            (tmp/orphan).unlink()
        verify_inventory(meta,root)
        if (root/'latest.json').read_bytes()!=source:
            raise ValueError('source manifest changed while building proof')
        plan={'schema':'mid.ruc.offline-inventory-plan.v1','productionEnabled':False,'run':meta['run'],
              'sourceManifestSha256':hashlib.sha256(source).hexdigest(),'maxDecodedPartBytes':MAX_PILOT_BYTES,'entries':entries}
        plan_bytes=packed(plan)
        (tmp/'source-manifest.json').write_bytes(source)
        (tmp/'plan.json').write_bytes(plan_bytes)
        retained=meta['pages']['publishedBytes']-converted
        wire_bytes=sum(wires.values())
        descriptor_bytes=len(source)+len(plan_bytes)
        replacement=retained+wire_bytes+descriptor_bytes
        dual=meta['pages']['publishedBytes']+wire_bytes+descriptor_bytes
        budget=meta['pages']['budgetBytes']
        report={'schema':'mid.ruc.offline-inventory-proof.v1','run':meta['run'],'sourceManifestSha256':plan['sourceManifestSha256'],
                'verifiedObjects':len(rows),'sourcePayloadBytes':meta['pages']['publishedBytes'],'sourceManifestBytes':len(source),
                'eligibleInt16Objects':len(geometry),'convertedObjects':len(entries),'decodedParts':covered,'maxDecodedPartBytes':MAX_PILOT_BYTES,
                'convertedOriginalBytes':converted,'retainedOriginalBytes':retained,'uniqueWireObjects':len(wires),'wireBytes':wire_bytes,
                'descriptorBytes':descriptor_bytes,'offlineReplacementLayoutBytes':replacement,'rawRetainingLayoutBytes':dual,'budgetBytes':budget,
                'replacementLayoutFits':replacement<budget,'rawRetainingLayoutFits':dual<budget,'productionEnabled':False,
                'scope':'Exact offline layout only; report.json excluded. Retained originals must come from source. Not a publishable manifest or rollout/CPU/RAM approval.'}
        (tmp/'report.json').write_bytes(packed(report))
        tmp.rename(output)
        return report
    except BaseException:
        shutil.rmtree(tmp)
        raise


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot',type=Path)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    print(json.dumps(build_inventory_proof(args.snapshot,args.output),indent=2))
