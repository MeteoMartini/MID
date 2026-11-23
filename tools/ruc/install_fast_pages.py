#!/usr/bin/env python3
"""Retain fresh Fast data from the authenticated active Pages deployment."""

import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from zipfile import ZipFile

from prepare_fast_pages_delivery import carry_fresh_fast_archive
from ruc_fast_pages_preserve import preserve_fast_pages
from resolve_fast_pages_base import gh_api, resolve_installer_pages
from ruc_fast_pointer_staging import sha_file

# ZIP/TAR envelope bytes include metadata; the existing 900 MB Pages budget
# is separately enforced on extracted regular-file bytes.
ARCHIVE_ENVELOPE_MAX_BYTES = 1_073_741_824


def valid_archive_envelope(size):
    if type(size) is not int or size <= 0 or size >= ARCHIVE_ENVELOPE_MAX_BYTES:
        raise ValueError('Pages transport archive envelope exceeds its safety limit')
    return size


def active_pages(release):
    stable = gh_api('git/ref/heads/mid-stable')['object']['sha']
    return resolve_installer_pages(stable, pending_release=release, environment=os.environ)


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
        valid_archive_envelope(archive.stat().st_size)
        if 'sha256:' + sha_file(archive) != identity['artifact_digest']:
            raise ValueError('active Pages archive changed in transit')
        with ZipFile(archive) as zipped:
            entries = zipped.infolist()
            if len(entries) != 1 or entries[0].filename != 'artifact.tar':
                raise ValueError('active Pages zip has an unexpected layout')
            valid_archive_envelope(entries[0].file_size)
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
        clock = datetime.now(timezone.utc)
        if not timedelta(0) <= clock - run <= timedelta(hours=4):
            raise ValueError('carried Fast model run expired before Installer publish')
        # The original archive was SHA-verified at retention, but dist can be
        # modified afterwards. Revalidate every immutable Fast chunk immediately
        # before Pages upload, using the same strict preservation contract.
        with tempfile.TemporaryDirectory(prefix='.mid-installer-fast-verify-', dir=dist.parent) as scratch:
            preserve_fast_pages(dist, Path(scratch), retention['fastManifestSha256'], now=clock)


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
