#!/usr/bin/env python3
"""Assemble a candidate from an Actions-digest-verified Pages tar and native Fast."""

import argparse
from datetime import datetime
import json
from pathlib import Path, PurePosixPath
import tarfile
import tempfile

from ruc_fast_independent_pages import stage_independent_fast_pages
from ruc_fast_pointer_staging import sha_file, strict_budget


def extract_pages_tar(archive, target):
    """Extract only unique regular files and directories, with a physical byte cap."""
    seen = set()
    size = 0
    with tarfile.open(archive, mode='r:*') as tar:
        for member in tar:
            path = PurePosixPath(member.name)
            if (path.is_absolute() or '..' in path.parts or '\\' in member.name
                    or path in seen or not (member.isdir() or member.isfile())):
                raise ValueError('unsafe or duplicate Pages tar entry')
            seen.add(path)
            size += member.size
            strict_budget(size, 0)
            tar.extract(member, target, filter='data')
    if not (target / 'index.html').is_file() or not (target / 'ruc/latest.json').is_file():
        raise ValueError('Pages release must contain both the app and the full RUC pointer')
    return size


def prepare_delivery(archive, native_shadow, output, *, now=None, skip_current=False):
    output = Path(output)
    if not output.parent.is_dir():
        raise ValueError('Pages candidate output parent must exist')
    with tempfile.TemporaryDirectory(prefix='.mid-fast-delivery-', dir=output.parent) as scratch:
        base = Path(scratch)
        original_size = extract_pages_tar(archive, base)
        previous = base / 'ruc/fast/paged-shadow.json'
        previous_sha = sha_file(previous) if previous.is_file() else None
        if skip_current and previous_sha:
            old_run = json.loads(previous.read_text(encoding='utf-8'))['run']
            new_run = json.loads((Path(native_shadow) / 'ruc/fast/latest.json').read_text(encoding='utf-8'))['run']
            if new_run <= old_run:
                return {'skipped': True, 'run': new_run, 'previousRun': old_run}
        proof = stage_independent_fast_pages(base, native_shadow, output, now=now, compress=True)
    return {'basePagesBytes': original_size, 'previousFastManifestSha256': previous_sha, **proof}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pages-tar', required=True, type=Path)
    parser.add_argument('--native-shadow', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--qualification-time', type=datetime.fromisoformat,
                        help='historical replay only. Omit for live admission.')
    parser.add_argument('--skip-current', action='store_true')
    args = parser.parse_args()
    print(json.dumps(prepare_delivery(args.pages_tar, args.native_shadow, args.output,
                                      now=args.qualification_time, skip_current=args.skip_current), sort_keys=True))


if __name__ == '__main__':
    main()
