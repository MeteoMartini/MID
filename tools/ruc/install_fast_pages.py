#!/usr/bin/env python3
"""Retain fresh Fast data from the authenticated active Pages deployment."""

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
from zipfile import ZipFile

from prepare_fast_pages_delivery import carry_fresh_fast_archive
from resolve_fast_pages_base import gh_api, resolve_installer_pages
from ruc_fast_pointer_staging import sha_file, strict_budget


def active_pages(release):
    stable = gh_api('git/ref/heads/mid-stable')['object']['sha']
    return resolve_installer_pages(stable, pending_release=release)


def retain(release, dist, proof):
    identity = active_pages(release)
    with tempfile.TemporaryDirectory(prefix='.mid-installer-fast-', dir=dist.parent) as scratch:
        scratch = Path(scratch)
        archive = scratch / 'pages.zip'
        with archive.open('xb') as output:
            subprocess.run([
                'gh', 'api', '--method', 'GET',
                f"repos/MeteoMartini/MID/actions/artifacts/{identity['artifact_id']}/zip",
            ], check=True, stdout=output, timeout=240)
        strict_budget(archive.stat().st_size, 0)
        if 'sha256:' + sha_file(archive) != identity['artifact_digest']:
            raise ValueError('active Pages archive changed in transit')
        with ZipFile(archive) as zipped:
            entries = zipped.infolist()
            if len(entries) != 1 or entries[0].filename != 'artifact.tar':
                raise ValueError('active Pages zip has an unexpected layout')
            strict_budget(entries[0].file_size, 0)
            tar = scratch / 'artifact.tar'
            with zipped.open(entries[0]) as source, tar.open('xb') as dest:
                shutil.copyfileobj(source, dest)
        result = carry_fresh_fast_archive(tar, dist)
    if identity != active_pages(release):
        raise ValueError('active Pages changed during Fast restore')
    proof.write_text(json.dumps({'baseline': identity, 'retention': result}), encoding='utf-8')


def verify(release, dist, proof):
    document = json.loads(proof.read_text(encoding='utf-8'))
    if document['baseline'] != active_pages(release):
        raise ValueError('active Pages deployment changed before Installer publish')
    retention = document['retention']
    file = dist / 'ruc/fast/paged-shadow.json'
    if not retention['carried'] and file.parent.exists():
        raise ValueError('unverified Fast namespace in Installer candidate')
    if retention['carried']:
        if sha_file(file) != retention['fastManifestSha256']:
            raise ValueError('Installer Fast manifest differs from retention proof')
        run = datetime.strptime(retention['run'], '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        if not timedelta(0) <= datetime.now(timezone.utc) - run <= timedelta(hours=4):
            raise ValueError('carried Fast model run expired before Installer publish')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('retain', 'verify'))
    parser.add_argument('--release-sha', required=True)
    parser.add_argument('--dist', required=True, type=Path)
    parser.add_argument('--proof', required=True, type=Path)
    args = parser.parse_args()
    (retain if args.command == 'retain' else verify)(args.release_sha, args.dist, args.proof)


if __name__ == '__main__':
    main()
