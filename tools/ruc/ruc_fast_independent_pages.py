#!/usr/bin/env python3
"""Stage an isolated Pages deployment candidate with an independent Fast Lane."""

from datetime import datetime, timedelta, timezone
import argparse
import json
import os
from pathlib import Path
import shutil
import tempfile

from ruc_fast_consumer_shadow import inspect_shadow
from ruc_fast_pages_chunker import partition_native_fast
from ruc_fast_pages_overlay import run_date
from ruc_fast_pointer_staging import count_files, sha_file, strict_budget

FAST = Path('ruc/fast')
MANIFEST = 'paged-shadow.json'


def stage_independent_fast_pages(site, fast_shadow, output, *, now=None):
    """Keep the primary site intact, even when its full RUC run is stale or absent."""
    site, fast_shadow, output = map(Path, (site, fast_shadow, output))
    if not site.is_dir() or site.is_symlink():
        raise ValueError('existing Pages site must be an isolated local directory')
    if (output.exists() or output.is_symlink() or not output.parent.is_dir()
            or output.resolve().is_relative_to(site.resolve())
            or output.resolve().is_relative_to(fast_shadow.resolve())):
        raise ValueError('output must be a new directory outside both inputs')
    site_bytes = count_files(site)
    clock = now if now is not None else datetime.now(timezone.utc)
    if clock.tzinfo is None or clock.utcoffset() is None:
        raise ValueError('an aware clock is required')
    shadow = inspect_shadow(fast_shadow)
    run = run_date(shadow['run'])
    if not timedelta(0) <= clock - run <= timedelta(hours=4):
        raise ValueError('Fast run is stale or future-dated')

    previous = site / FAST
    previous_bytes = 0
    if previous.exists():
        pointer = previous / MANIFEST
        if not pointer.is_file():
            raise ValueError('existing Fast namespace is not an independent Pages candidate')
        manifest = json.loads(pointer.read_text(encoding='utf-8'))
        if (manifest.get('schema') != 'mid.ruc.fast-paged-shadow.v1'
                or manifest.get('publicationAuthorized') is not False):
            raise ValueError('foreign Fast namespace')
        if run <= run_date(manifest.get('run')):
            raise ValueError('Fast publication must advance the current run')
        previous_bytes = count_files(previous)

    primary = Path('ruc/latest.json')
    primary_sha = sha_file(site / primary) if (site / primary).is_file() else None
    with tempfile.TemporaryDirectory(prefix='.mid-independent-fast-', dir=output.parent) as temp:
        temp = Path(temp)
        package = temp / 'fast-package'
        partition = partition_native_fast(fast_shadow, package)
        if partition['run'] != shadow['run']:
            raise ValueError('Fast run changed during staging')
        package_fast = package / FAST
        fast_bytes = count_files(package_fast)
        remaining = strict_budget(site_bytes - previous_bytes, fast_bytes)

        staged = temp / 'site'
        fast_parent = (site / FAST).parent.resolve()

        def ignore_existing_fast(directory, names):
            return {'fast'} if 'fast' in names and Path(directory).resolve() == fast_parent else set()

        shutil.copytree(site, staged, ignore=ignore_existing_fast)
        target = staged / FAST
        target.parent.mkdir(parents=True, exist_ok=True)
        package_fast.rename(target)
        if count_files(staged) != site_bytes - previous_bytes + fast_bytes:
            raise ValueError('staged site inventory changed during assembly')
        staged_primary = staged / primary
        if (sha_file(staged_primary) if staged_primary.is_file() else None) != primary_sha:
            raise ValueError('primary RUC pointer changed during assembly')
        manifest_sha = sha_file(target / MANIFEST)
        os.rename(staged, output)
    return {
        'run': shadow['run'],
        'fastManifestSha256': manifest_sha,
        'primaryManifestSha256': primary_sha,
        'siteBytes': site_bytes - previous_bytes + fast_bytes,
        'remainingPagesBytes': remaining,
        'publicationAuthorized': False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', required=True, type=Path)
    parser.add_argument('--fast-shadow', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(stage_independent_fast_pages(args.site, args.fast_shadow, args.output), sort_keys=True))


if __name__ == '__main__':
    main()
