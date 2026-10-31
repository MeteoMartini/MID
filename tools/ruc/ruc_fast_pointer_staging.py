#!/usr/bin/env python3
"""Atomically stage an *inactive* RUC fast candidate as isolated Pages layout.

Does not contact GitHub/Pages/R2/Worker, promote or toggle any consumer.
Only the existing SHA-bound MID release pipeline can authorize a live pointer.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile

from ruc_fast_lane_producer import verify_candidate_manifest, digest

SCHEMA = 'mid.ruc.fast-shadow-pointer.v1'
RUN = re.compile(r'^20\d{2}-\d{2}-\d{2}T\d{2}:00$')
KEYS = ('deterministic.bin', 'rapid-5m.bin', 'rapid-15m.bin', 'lookup.bin')
BUDGET = 900_000_000


def count_files(root):
    if not isinstance(root, Path) or root.is_symlink():
        raise ValueError('invalid physical site root')
    size = 0
    for p in root.rglob('*'):
        if p.is_symlink():
            raise ValueError('unsafe symlink in site layout')
        if p.is_file():
            size += p.stat().st_size
    return size


def strict_budget(existing_bytes, fast_bytes, budget=BUDGET):
    if any(type(v) is not int or v < 0 for v in (existing_bytes, fast_bytes, budget)):
        raise ValueError('unproven or negative site budget')
    if budget != BUDGET or existing_bytes + fast_bytes >= budget:
        raise ValueError('fast plus existing site exceeds the MID RUC physical budget')
    return budget - (existing_bytes + fast_bytes)


def sha_file(path):
    h = hashlib.sha256()
    with path.open('rb') as r:
        for block in iter(lambda: r.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()


def stage_fast_candidate(candidate_dir, target_dir):
    src = Path(candidate_dir)
    dst = Path(target_dir)
    if dst.exists() or not dst.parent.is_dir() or dst.is_symlink():
        raise ValueError('inactive fast staging output must be a fresh isolated directory')
    meta = json.loads((src / 'fast-candidate.json').read_text(encoding='utf-8'))
    if verify_candidate_manifest(meta, src) != {'verifiedLocalBytes': True, 'publicationAuthorized': False}:
        raise ValueError('unverified fast candidate source')
    run = meta['run']
    if not RUN.fullmatch(run):
        raise ValueError('invalid run namespace')
    name = run.replace('-', '').replace(':', '').replace('T', 'T')
    if not re.fullmatch(r'\d{8}T\d{4}', name):
        raise ValueError('invalid immutable run directory')
    pointer = {
        'schema': SCHEMA,
        'run': run,
        'horizonHours': 6,
        'sourceSchema': meta['schema'],
        'eps': {'availability': 'unavailable'},
        'nativePoints': meta['pointCount'],
        'dataTimes': list(meta['dataTimes']),
        'rapid5Times': list(meta['rapid5Times']),
        'rapid15Times': list(meta['rapid15Times']),
        'sourceGribSha256': hashlib.sha256(json.dumps(meta.get('sourceGrib'), sort_keys=True,
                                                       separators=(',', ':')).encode()).hexdigest(),
        'objects': {},
        'productionEnabled': False,
        'publicationAuthorized': False,
        'realtimeConsumerEnabled': False,
        'consumerAdoptionVerified': False,
        'sourceRunManifestSha256': sha_file(src / 'fast-candidate.json'),
        'evidenceLimit': 'local inactive site staging; no live Pages/Worker/app readback'
    }
    with tempfile.TemporaryDirectory(prefix='.mid-ruc-fast-staging-', dir=dst.parent) as scratch:
        staged = Path(scratch)
        run_root = staged / 'ruc' / 'fast' / 'runs' / name
        run_root.mkdir(parents=True)
        for file in KEYS:
            copy = run_root / file
            if (src / file).is_symlink():
                raise ValueError('source symlink forbidden')
            shutil.copyfile(src / file, copy)
            if digest(copy) != meta['objects'][file]:
                raise ValueError('copied immutable fast object differs from source')
            pointer['objects'][file] = {
                'key': f'fast/runs/{name}/{file}',
                **digest(copy)
            }
        root = staged / 'ruc' / 'fast'
        # Immutable envelope precedes the pointer, in a local temp directory.
        envelope = dict(pointer, pointerActivation='inactive-only')
        (run_root / 'manifest.json').write_text(json.dumps(envelope, sort_keys=True,
            ensure_ascii=False, allow_nan=False, separators=(',', ':')) + '\n', encoding='utf-8')
        pointer['envelope'] = {
            'key': f'fast/runs/{name}/manifest.json',
            **digest(run_root / 'manifest.json')
        }
        temp_pointer = root / '.latest.json.tmp'
        temp_pointer.write_text(json.dumps(pointer, sort_keys=True, ensure_ascii=False,
            allow_nan=False, separators=(',', ':')) + '\n', encoding='utf-8')
        os.replace(temp_pointer, root / 'latest.json')
        # Production admission is impossible from this staged pointer.
        assert pointer['productionEnabled'] is False
        assert pointer['realtimeConsumerEnabled'] is False
        assert pointer['publicationAuthorized'] is False
        staged_bytes = count_files(staged)
        strict_budget(0, staged_bytes)
        # After all integrity gates, atomically move a fresh local directory.
        os.rename(staged, dst)
    return {'run': run, 'fastLocalBytes': count_files(dst),
            'pointer': pointer, 'productionAuthorized': False}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--candidate', required=True)
    p.add_argument('--output', required=True)
    a = p.parse_args()
    result = stage_fast_candidate(a.candidate, a.output)
    print(json.dumps({'run': result['run'], 'fastLocalBytes': result['fastLocalBytes'],
                      'productionAuthorized': False, 'scope': 'inactive-local-only'},
                     sort_keys=True, separators=(',', ':')))

if __name__ == '__main__':
    main()
