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


# Keep this contract aligned with the public original-DWD Fast point reader.
# This verification does not itself make an unpublished model run official.
NATIVE_FIELDS = (
    ('temperature_2m', '°C', .01, 0), ('dew_point_2m', '°C', .01, 0),
    ('relative_humidity_2m', '%', .1, 0), ('pressure_msl', 'hPa', .1, 0),
    ('wind_speed_10m', 'kn', .01, 0), ('wind_direction_10m', '°', .1, 0),
    ('wind_gusts_10m', 'kn', .01, 0), ('precipitation', 'mm', .01, 0),
    ('cloud_cover', '%', .1, 0), ('cloud_cover_low', '%', .1, 0),
    ('cape', 'J/kg', .1, 0), ('convective_inhibition', 'J/kg', .1, 0),
)


def validate_native_reader_contract(document, run):
    if (document.get('sourceSchema') != 'mid.ruc.fast-shadow-pointer.v1'
            or not all(isinstance(document.get(k), str)
                       and re.fullmatch(r'[a-f0-9]{64}', document[k])
                       for k in ('sourceManifestSha256', 'sourceGribSha256'))
            or document.get('sourceNativeBytes') != 253804736):
        raise ValueError('native Fast source provenance/total bytes invalid')
    grid = document.get('grid')
    if (not isinstance(grid, dict) or grid.get('nx') != 964
            or grid.get('ny') != 596 or grid.get('nativePointCount') != 542040):
        raise ValueError('native Fast grid metadata invalid')
    fields = document.get('fields')
    if (not isinstance(fields, list) or len(fields) != len(NATIVE_FIELDS)
            or any(not isinstance(field, dict)
                   or tuple(field.get(k) for k in ('name', 'unit', 'scale', 'offset')) != spec
                   for field, spec in zip(fields, NATIVE_FIELDS))):
        raise ValueError('native Fast field units/scales invalid')
    axes = document.get('timeAxes')
    if not isinstance(axes, dict):
        raise ValueError('native Fast valid-time axes absent')
    for key, minutes, count in (('hourly', 60, 7), ('rapid5', 5, 73),
                                ('rapid15', 15, 25)):
        expected = [(run + timedelta(minutes=minutes * i)).strftime('%Y-%m-%dT%H:%M')
                    for i in range(count)]
        if axes.get(key) != expected:
            raise ValueError('native Fast UTC axes/accumulation invalid')


def preserve_fast_pages(previous_site, next_site, expected_sha, *, now=None):
    """Call under the Pages publication lock with a trusted manifest SHA."""
    previous_site, next_site = map(Path, (previous_site, next_site))
    for site in (previous_site, next_site):
        if not site.is_dir() or site.is_symlink():
            raise ValueError('Pages roots must be local directories')
    old_root, new_root = previous_site.resolve(), next_site.resolve()
    if old_root == new_root or old_root.is_relative_to(new_root) or new_root.is_relative_to(old_root):
        raise ValueError('Pages roots must be distinct and non-nested')
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
            or document.get('chunkCells') != 512
            or any(document.get(key) is not False for key in
                   ('productionEnabled', 'publicationAuthorized', 'realtimeConsumerEnabled'))):
        raise ValueError('unexpected native Fast Pages manifest')
    codec = document.get('storageCodec')
    if 'storageCodec' in document and codec != 'gzip-or-raw-v1':
        raise ValueError('unknown Fast Pages storage codec')
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
        obj = objects[name]
        if (not isinstance(obj, dict) or obj.get('bytesPerCell') != record_bytes
                or obj.get('cellCount') != cells):
            raise ValueError('Fast Pages native object metadata mismatch')
        if not re.fullmatch(r'[a-f0-9]{64}', str(obj.get('sourceSha256') or '')):
            raise ValueError('native Fast original object digest missing')
        parts = obj.get('parts')
        if not isinstance(parts, list) or len(parts) != (cells + 511) // 512:
            raise ValueError('incomplete Fast Pages chunk inventory')
        for index, part in enumerate(parts):
            if (not isinstance(part, dict) or part.get('firstCell') != index * 512
                    or part.get('cells') != min(512, cells - index * 512)):
                raise ValueError('Fast Pages chunk address metadata mismatch')
            relative = Path('pages', run_key, name.removesuffix('.bin'), f'{index:04d}.bin')
            length = min(512, cells - 512 * index) * record_bytes
            checksum = part['sha256']
            if part['bytes'] != length or not re.fullmatch(r'[a-f0-9]{64}', checksum):
                raise ValueError('noncanonical Fast Pages raw chunk')
            if part.get('encoding') == 'gzip':
                stored_bytes = part.get('storedBytes')
                stored_sha = part.get('storedSha256', '')
                if (codec != 'gzip-or-raw-v1' or type(stored_bytes) is not int
                        or not 0 < stored_bytes < length
                        or not re.fullmatch(r'[a-f0-9]{64}', stored_sha)):
                    raise ValueError('noncanonical Fast Pages gzip chunk')
                relative = relative.with_suffix('.gzip.bin')
                length, checksum = stored_bytes, stored_sha
            elif any(field in part for field in ('encoding', 'storedBytes', 'storedSha256')):
                raise ValueError('unexpected Fast Pages transport metadata')
            if part['key'] != 'fast/' + relative.as_posix():
                raise ValueError('noncanonical Fast Pages chunk path')
            files[relative] = (length, checksum)
    validate_native_reader_contract(document, run)
    # New R2-free signed provenance is an immutable, bounded part of the Fast
    # namespace. This checks only its transport shape and exact copied bytes;
    # the MID Worker independently verifies the GitHub issuer RSA signature.
    signed = previous / 'publisher-proof.v2.json'
    if signed.exists():
        if not signed.is_file() or signed.is_symlink() or not 0 < signed.stat().st_size <= 16000:
            raise ValueError('unsafe signed Fast publisher proof')
        receipt = json.loads(signed.read_text(encoding='utf-8'))
        if (receipt.get('schema') != 'mid.ruc.fast-oidc-proof.v1'
                or receipt.get('run') != document['run']
                or receipt.get('manifestSha256') != expected_sha
                or not re.fullmatch(r'[a-f0-9]{40}', str(receipt.get('stableSha') or ''))
                or any(type(receipt.get(key)) is not int or receipt[key] <= 0
                       for key in ('runId', 'runAttempt'))
                or not isinstance(receipt.get('oidcToken'), str)
                or len(receipt['oidcToken']) > 12000
                or len(receipt['oidcToken'].split('.')) != 3):
            raise ValueError('signed Fast publisher proof inconsistent with native manifest')
        files[Path('publisher-proof.v2.json')] = (signed.stat().st_size, sha_file(signed))
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
