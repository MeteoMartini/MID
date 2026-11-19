#!/usr/bin/env python3
"""Carry a SHA-authorized Fast Pages namespace into a freshly assembled site."""

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import re
import shutil
import tempfile

from ruc_fast_pages_chunker import SIZES
from ruc_fast_pointer_staging import count_files, sha_file, strict_budget

FAST = Path("ruc/fast")
MANIFEST = "paged-shadow.json"


def preserve_fast_pages(previous_site, next_site, expected_sha, *, now=None):
    """Call under the Pages publication lock with a trusted manifest SHA."""
    previous_site, next_site = map(Path, (previous_site, next_site))
    for site in (previous_site, next_site):
        if not site.is_dir() or site.is_symlink():
            raise ValueError('Pages roots must be local directories')
    if previous_site.resolve() == next_site.resolve():
        raise ValueError('Pages roots must be distinct')
    previous = previous_site / FAST
    target = next_site / FAST
    if not previous.is_dir() or previous.parent.is_symlink() or previous.is_symlink():
        raise ValueError('expected Fast Pages namespace is missing or unsafe')
    if target.exists() or target.is_symlink():
        raise ValueError('the new Pages tree already has a Fast namespace')
    namespace_bytes = count_files(previous)
    next_bytes = count_files(next_site)
    remaining = strict_budget(next_bytes, namespace_bytes)
    pointer = previous / MANIFEST
    if (not re.fullmatch(r'[a-f0-9]{64}', expected_sha)
            or not pointer.is_file() or pointer.stat().st_size > 3_000_000
            or sha_file(pointer) != expected_sha):
        raise ValueError('Fast Pages manifest SHA mismatch')
    document = json.loads(pointer.read_text(encoding='utf-8'))
    if (document.get('schema') != 'mid.ruc.fast-paged-shadow.v1'
            or document.get('epsAvailable') is not False
            or document.get('nativePoints') != 542040
            or document.get('chunkCells') != 512):
        raise ValueError('unexpected native Fast Pages manifest')
    run = datetime.strptime(document['run'], '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    if run.strftime('%Y-%m-%dT%H:%M') != document['run'] or run.minute != 0:
        raise ValueError('noncanonical Fast Pages model run')
    clock = now if now is not None else datetime.now(timezone.utc)
    if clock.tzinfo is None or clock.utcoffset() is None:
        raise ValueError('an aware clock is required')
    if not timedelta(0) <= clock - run <= timedelta(hours=4):
        raise ValueError('cannot carry a stale or future Fast Pages run')

    objects = document.get('objects')
    if not isinstance(objects, dict) or set(objects) != set(SIZES):
        raise ValueError('incomplete Fast Pages object inventory')
    run_key = document['run'].replace('-', '').replace(':', '')
    files = {Path(MANIFEST): (pointer.stat().st_size, expected_sha)}
    for name, record_bytes in SIZES.items():
        cells = 964 * 596 if name == 'lookup.bin' else 542040
        parts = objects[name]['parts']
        if len(parts) != (cells + 511) // 512:
            raise ValueError('incomplete Fast Pages chunk inventory')
        for index, part in enumerate(parts):
            relative = Path('pages', run_key, name.removesuffix('.bin'), f'{index:04d}.bin')
            length = min(512, cells - 512 * index) * record_bytes
            checksum = part['sha256']
            if (part['key'] != 'fast/' + relative.as_posix()
                    or part['bytes'] != length
                    or not re.fullmatch(r'[a-f0-9]{64}', checksum)):
                raise ValueError('noncanonical Fast Pages chunk')
            files[relative] = (length, checksum)
    if {file.relative_to(previous) for file in previous.rglob('*') if file.is_file()} != set(files):
        raise ValueError('unexpected object in Fast Pages namespace')

    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.mid-fast-carry-', dir=target.parent) as scratch:
        copy = Path(scratch) / 'fast'
        for relative, (length, checksum) in files.items():
            output = copy / relative
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(previous / relative, output)
            if output.stat().st_size != length or sha_file(output) != checksum:
                raise ValueError(f'Fast Pages object failed readback: {relative}')
        copy.rename(target)
    return {'run': document['run'], 'fastManifestSha256': expected_sha,
            'fastPagesBytes': namespace_bytes, 'remainingPagesBytes': remaining}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--previous-site', required=True, type=Path)
    parser.add_argument('--next-site', required=True, type=Path)
    parser.add_argument('--expected-sha', required=True)
    args = parser.parse_args()
    print(json.dumps(preserve_fast_pages(args.previous_site, args.next_site, args.expected_sha),
                     sort_keys=True))


if __name__ == '__main__':
    main()
