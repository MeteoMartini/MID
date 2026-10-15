"""Build an isolated complete replacement candidate. Never invoked by the publisher.

The candidate profile is deliberately unsupported by deployed legacy readers.
Input/rollback bytes remain untouched; a successful build is not rollout approval.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import re
from pathlib import Path
import shutil
import tempfile
from lossless_inventory import verify_inventory, record_geometry, safe_file, packed
from lossless_codec_pilot import encode_candidate, decode_candidate
from lossless_dual_read import MAX_PILOT_BYTES

PROFILE='pages-lossless-candidate-v1'
PAGE_SCHEMA='mid.ruc.compressed-pages.v1'


def product_specs(meta):
    return [meta.get('deterministic',{}),meta.get('epsSummary',{}),*meta.get('rapid',{}).values()]


def prepare_snapshot(source, target):
    source=Path(source).resolve(strict=True);target=Path(target).resolve()
    if target.exists() or target.is_relative_to(source) or source.is_relative_to(target):
        raise ValueError('candidate must be new and outside original/rollback snapshot')
    source_bytes=(source/'latest.json').read_bytes();meta=json.loads(source_bytes)
    rows=verify_inventory(meta,source);geometry=record_geometry(meta,rows)
    if meta['pages']['publishedBytes']+len(source_bytes)>=meta['pages']['budgetBytes']:
        raise ValueError('original snapshot including manifest exceeds budget')
    candidate=copy.deepcopy(meta);new_rows={};physical_parts={}
    target.parent.mkdir(parents=True,exist_ok=True)
    tmp=Path(tempfile.mkdtemp(prefix=target.name+'.partial-',dir=target.parent))
    try:
        for key,record in sorted(geometry.items()):
            row=rows[key];root='/'.join(key.split('/')[:2]);width=MAX_PILOT_BYTES//record*record
            parts=[];offset=0;original=hashlib.sha256()
            with safe_file(source,key).open('rb') as stream:
                while block:=stream.read(width):
                    manifest,wire=encode_candidate(block,'byteplanes-gzip')
                    if decode_candidate(manifest,wire)!=block:
                        raise ValueError('candidate Python roundtrip mismatch')
                    if len(wire)>524800:
                        raise ValueError('candidate wire exceeds prepared reader bound')
                    wire_key=root+'/lossless-v2/'+manifest['encodedSha256']+'.bin'
                    if wire_key not in new_rows:
                        path=safe_file(tmp,wire_key);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(wire)
                        new_rows[wire_key]={'key':wire_key,'bytes':len(wire),'sha256':manifest['encodedSha256']}
                    parts.append({'recordOffset':offset//record,'recordCount':len(block)//record,'key':wire_key,'manifest':manifest})
                    original.update(block);offset+=len(block)
            if offset!=row['bytes'] or original.hexdigest()!=row['sha256']:
                raise ValueError('original changed during candidate build')
            physical_parts[key]=parts
        for spec in product_specs(candidate):
            if spec.get('dtype')!='int16-le':continue
            page=spec.pop('pages');parts=[]
            for index in range(page['chunkCount']):
                key=page['chunkKeys'][index] if 'chunkKeys' in page else f"{page['prefix']}/{index:04d}.bin"
                for part in physical_parts[key]:
                    parts.append({'firstRecord':index*page['chunkRecords']+part['recordOffset'],'recordCount':part['recordCount'],'key':part['key'],'manifest':part['manifest']})
            spec['compressedPages']={'schema':PAGE_SCHEMA,'records':page['records'],'recordBytes':page['recordBytes'],
                                     'prefix':'/'.join(page['prefix'].split('/')[:2]),'parts':parts}
            if page['records']>10_000_000 or len(parts)>8192 or not re.fullmatch(r'runs/[A-Za-z0-9_-]+',spec['compressedPages']['prefix']):
                raise ValueError('candidate page exceeds prepared reader geometry')
        for key,row in rows.items():
            if key in geometry:continue
            path=safe_file(tmp,key);path.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(safe_file(source,key),path)
            new_rows[key]=row
        candidate['storageProfile']=PROFILE;candidate.pop('objects',None)
        candidate['pages'].update({'profile':PROFILE,'objects':sorted(new_rows.values(),key=lambda r:r['key']),
                                  'publishedBytes':sum(row['bytes'] for row in new_rows.values()),
                                  'losslessTransport':{'profile':PAGE_SCHEMA,'mode':'replacement-candidate','rawRetained':False}})
        candidate['migration']={'schema':'mid.ruc.migration-candidate.v1','productionEnabled':False,
                                'sourceManifestSha256':hashlib.sha256(source_bytes).hexdigest(),'maxDecodedPartBytes':MAX_PILOT_BYTES,
                                'sourceAccounting':{k:candidate['pages'].pop(k) for k in ('savedBytes','deduplicatedBytes') if k in candidate['pages']}}
        manifest_bytes=packed(candidate)
        size=candidate['pages']['publishedBytes']+len(manifest_bytes)
        if size>=candidate['pages']['budgetBytes']:
            raise ValueError('complete replacement candidate exceeds unchanged publication budget')
        # Verify all retained objects and every wire, not merely int16 candidates.
        for row in new_rows.values():
            path=safe_file(tmp,row['key'])
            if path.stat().st_size!=row['bytes'] or hashlib.sha256(path.read_bytes()).hexdigest()!=row['sha256']:
                raise ValueError('candidate object integrity mismatch')
        verify_inventory(meta,source)
        if (source/'latest.json').read_bytes()!=source_bytes:
            raise ValueError('original manifest changed')
        (tmp/'latest.json').write_bytes(manifest_bytes)
        tmp.rename(target)
        return {'schema':'mid.ruc.migration-build-proof.v1','run':meta['run'],'profile':PROFILE,'productionEnabled':False,
                'sourceManifestSha256':hashlib.sha256(source_bytes).hexdigest(),'candidateManifestSha256':hashlib.sha256(manifest_bytes).hexdigest(),
                'verifiedSourceObjects':len(rows),'candidateObjects':len(new_rows),'convertedOriginalObjects':len(geometry),
                'payloadBytes':candidate['pages']['publishedBytes'],'manifestBytes':len(manifest_bytes),'physicalBytes':size,
                'budgetBytes':candidate['pages']['budgetBytes'],'originalRollbackSnapshotIntact':True,
                'scope':'Isolated complete candidate; legacy deployed readers reject this profile. No production publisher or rollout mutation.'}
    except BaseException:
        shutil.rmtree(tmp)
        raise


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source',type=Path);parser.add_argument('target',type=Path)
    args=parser.parse_args();print(json.dumps(prepare_snapshot(args.source,args.target),indent=2))
