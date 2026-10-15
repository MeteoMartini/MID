"""Activate a separately proven, byte-identical complete RUC replacement snapshot.

Never alters either source/rollback or isolated candidate. Called ONLY after the
independent complete Python/JS/source-Worker proof, and before artifact upload.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import re
import shutil
import tempfile
from pathlib import Path
from lossless_inventory import verify_inventory, safe_file, packed, record_geometry
from prepare_lossless_snapshot import PROFILE as CANDIDATE_PROFILE, PAGE_SCHEMA, product_specs

ACTIVE_PROFILE='pages-lossless-v1'
PROOF_SCHEMA='mid.ruc.migration-record-proof.v1'
ACTIVE_SCHEMA='mid.ruc.migration-active.v1'
RUN_RE=re.compile(r'^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$')
HASH=re.compile(r'^[0-9a-f]{64}$')


def sha(data:bytes)->str:
    return hashlib.sha256(data).hexdigest()


def activate_snapshot(source:Path,candidate:Path,proof_path:Path,target:Path):
    source=Path(source).resolve(strict=True)
    candidate=Path(candidate).resolve(strict=True)
    proof_path=Path(proof_path).resolve(strict=True)
    target=Path(target).resolve()
    if target.exists() or source==candidate or any(
        target.is_relative_to(root) or root.is_relative_to(target)
        for root in (source,candidate)
    ):
        raise ValueError('activation output must be new and outside both snapshots')
    source_bytes=(source/'latest.json').read_bytes()
    candidate_bytes=(candidate/'latest.json').read_bytes()
    original=json.loads(source_bytes);staged=json.loads(candidate_bytes)
    proof=json.loads(proof_path.read_text(encoding='utf-8'))
    source_rows=verify_inventory(original,source)
    record_geometry(original,source_rows)
    if not RUN_RE.fullmatch(str(original.get('run',''))) or staged.get('run')!=original['run']:
        raise ValueError('candidate must have the identical valid DWD run')
    if (staged.get('schema')!='mid.dwd.ruc.grid.v2' or
        staged.get('storageProfile')!=CANDIDATE_PROFILE or
        staged.get('pages',{}).get('profile')!=CANDIDATE_PROFILE or
        staged.get('pages',{}).get('budgetBytes')!=900_000_000 or
        staged.get('pages',{}).get('losslessTransport')!={'profile':PAGE_SCHEMA,'mode':'replacement-candidate','rawRetained':False} or
        staged.get('migration',{}).get('schema')!='mid.ruc.migration-candidate.v1' or
        staged.get('migration',{}).get('productionEnabled') is not False or
        staged['migration'].get('sourceManifestSha256')!=sha(source_bytes)):
        raise ValueError('unsupported candidate profile/provenance')
    pages=staged['pages'];objects=pages.get('objects')
    if not isinstance(objects,list) or not objects:raise ValueError('empty candidate')
    seen=set();total=0
    for row in objects:
        key=row.get('key') if isinstance(row,dict) else None
        if key in seen or type(row.get('bytes')) is not int or row['bytes']<1 or not HASH.fullmatch(str(row.get('sha256',''))):
            raise ValueError('candidate object duplicate/size/hash')
        seen.add(key)
        path=safe_file(candidate,key)
        if path.is_symlink() or not path.is_file() or path.stat().st_size!=row['bytes']:
            raise ValueError('candidate object path/size')
        if sha(path.read_bytes())!=row['sha256']:
            raise ValueError('candidate object SHA')
        total+=row['bytes']
    if type(pages.get('publishedBytes')) is not int or pages['publishedBytes']!=total:
        raise ValueError('candidate accounting')
    specs=[sp for sp in product_specs(staged) if sp.get('dtype')=='int16-le']
    parts=0
    for spec in specs:
        page=spec.get('compressedPages')
        if spec.get('pages') is not None or not isinstance(page,dict) or page.get('schema')!=PAGE_SCHEMA:
            raise ValueError('missing compressed product')
        cursor=0
        if not isinstance(page.get('parts'),list) or not page['parts']:raise ValueError('missing compressed part')
        for part in page['parts']:
            m=part.get('manifest',{})
            if part.get('firstRecord')!=cursor or type(part.get('recordCount')) is not int or part['recordCount']<1 or part.get('key') not in seen:
                raise ValueError('noncontiguous compressed records')
            if m.get('encodedSha256')!=next(row['sha256'] for row in objects if row['key']==part['key']):
                raise ValueError('part manifest/source mismatch')
            cursor+=part['recordCount'];parts+=1
        if cursor!=page.get('records'):raise ValueError('truncated compressed product')
    if not specs or not parts:raise ValueError('no compressed products')
    required={'schema':PROOF_SCHEMA,'run':original['run'],'candidateProfile':CANDIDATE_PROFILE,
              'sourceManifestSha256':sha(source_bytes),'candidateManifestSha256':sha(candidate_bytes),
              'sourceObjectsVerified':len(source_rows),'candidateObjectsVerified':len(objects),
              'fullDecodedParts':parts,'products':len(specs),'productionEnabled':False,
              'originalRollbackSnapshotIntact':True}
    if any(proof.get(k)!=v or type(proof.get(k))!=type(v) for k,v in required.items()):
        raise ValueError('independent complete JS proof absent/mismatched')
    if type(proof.get('recordComparisons')) is not int or proof['recordComparisons']<parts:
        raise ValueError('insufficient meteorological record comparisons')
    activated=copy.deepcopy(staged)
    activated['storageProfile']=ACTIVE_PROFILE
    activated['pages']['profile']=ACTIVE_PROFILE
    activated['pages']['losslessTransport']['mode']='replacement'
    activated['migration']['schema']=ACTIVE_SCHEMA
    activated['migration']['productionEnabled']=True
    activated['migration']['proof']={'schema':PROOF_SCHEMA,'sourceManifestSha256':sha(source_bytes),
                                      'candidateManifestSha256':sha(candidate_bytes),
                                      'fullyDecodedParts':parts,'recordComparisons':proof['recordComparisons']}
    active_bytes=packed(activated)
    physical=total+len(active_bytes)
    if physical>=900_000_000:raise ValueError('active RUC snapshot exceeds fixed 900MB limit')
    target.parent.mkdir(parents=True,exist_ok=True)
    tmp=Path(tempfile.mkdtemp(prefix=target.name+'.partial-',dir=target.parent))
    try:
        for row in objects:
            key=row['key'];dest=safe_file(tmp,key);dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(safe_file(candidate,key),dest)
            if dest.stat().st_size!=row['bytes'] or sha(dest.read_bytes())!=row['sha256']:
                raise ValueError('staged active object verification failed')
        if (source/'latest.json').read_bytes()!=source_bytes or (candidate/'latest.json').read_bytes()!=candidate_bytes:
            raise ValueError('source or candidate changed')
        (tmp/'latest.json').write_bytes(active_bytes)
        tmp.rename(target)
    except BaseException:
        shutil.rmtree(tmp,ignore_errors=True)
        raise
    return {'schema':'mid.ruc.activation-proof.v1','run':original['run'],'profile':ACTIVE_PROFILE,
            'sourceManifestSha256':sha(source_bytes),'candidateManifestSha256':sha(candidate_bytes),
            'activeManifestSha256':sha(active_bytes),'sourceObjectsVerified':len(source_rows),
            'activeObjectsVerified':len(objects),'fullDecodedParts':parts,
            'recordComparisons':proof['recordComparisons'],'physicalBytes':physical,
            'budgetBytes':900_000_000,'sourceRollbackIntact':True}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path);parser.add_argument('candidate',type=Path)
    parser.add_argument('proof',type=Path);parser.add_argument('target',type=Path)
    args=parser.parse_args()
    print(json.dumps(activate_snapshot(args.source,args.candidate,args.proof,args.target),indent=2))
