#!/usr/bin/env python3
"""Read-only original RUC Fast lossless compression trial, never deploy.

Quantifies deterministic byteplanes-gzip with strict whole-original SHA,
per-chunk decoded SHA, native Missing/zero semantics and a bounded decoder.
No Pages, R2, Worker, original +27h/EPS20 or release writes are possible.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from lossless_codec_pilot import encode_candidate, decode_candidate
from ruc_fast_consumer_shadow import inspect_shadow
from ruc_fast_pointer_staging import KEYS

SCHEMA = 'mid.ruc.fast-lossless-qa.v1'
BLOCK = 1_000_000


def audit(shadow: Path, output: Path) -> dict:
    root, target = Path(shadow), Path(output)
    if target.exists() or target.is_symlink() or not target.parent.is_dir():
        raise ValueError('Compression QA output must be a new file')
    admitted = inspect_shadow(root)
    if not admitted['originalNativeObjectsVerified'] or admitted['productionEnabled']:
        raise ValueError('Original native Fast source not admitted')
    pointer = json.loads((root/'ruc/fast/latest.json').read_text())
    results = {}
    raw_total = encoded_total = 0
    for name in KEYS:
        original = pointer['objects'][name]
        src = root/'ruc'/original['key']
        if src.is_symlink() or not src.is_file() or not src.resolve().is_relative_to(root.resolve()):
            raise ValueError('Unsafe source object')
        source_sha = hashlib.sha256()
        decoded_sha = hashlib.sha256()
        raw_size = encoded_size = blocks = 0
        with src.open('rb') as stream:
            while block := stream.read(BLOCK):
                header, compressed = encode_candidate(block, 'byteplanes-gzip')
                recovered = decode_candidate(header, compressed)
                if recovered != block:
                    raise ValueError('Fast codec changed binary values')
                source_sha.update(block)
                decoded_sha.update(recovered)
                raw_size += len(block)
                encoded_size += len(compressed)
                blocks += 1
        if (not blocks or raw_size != original['bytes'] or
            source_sha.hexdigest() != original['sha256'] or
            decoded_sha.hexdigest() != original['sha256']):
            raise ValueError('Fast original or decoded SHA mismatch')
        results[name] = {'rawSha256': original['sha256'],
                         'decodedSha256': decoded_sha.hexdigest(),
                         'rawBytes': raw_size, 'encodedBytes': encoded_size,
                         'chunks': blocks, 'lossless': True}
        raw_total += raw_size
        encoded_total += encoded_size
    report = {
        'schema': SCHEMA, 'run': admitted['run'], 'codec': 'byteplanes-gzip',
        'originalBytes': raw_total, 'candidateWireBytes': encoded_total,
        'wireRatio': round(encoded_total/raw_total, 6),
        'potentialSavingsBytes': max(0, raw_total-encoded_total),
        'missingCells': admitted['missingCells'],
        'genuineZeroCells': admitted['trueZeroCells'],
        'objects': results, 'bitIdentical': True,
        'productionEnabled': False, 'publicationAuthorized': False,
        'consumerAdoptionVerified': False, 'attestedRelease': False,
        'evidenceLimit': 'Original Fast read-only pilot; production transport not enabled',
    }
    with target.open('x', encoding='utf-8') as f:
        json.dump(report, f, sort_keys=True, allow_nan=False)
        f.write('\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--shadow', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    report = audit(args.shadow, args.output)
    print(json.dumps({k: report[k] for k in (
        'run', 'codec', 'originalBytes', 'candidateWireBytes', 'potentialSavingsBytes',
        'productionEnabled')}, sort_keys=True))
