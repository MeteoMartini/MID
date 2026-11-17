#!/usr/bin/env python3
"""Prepare a verified dist ZIP and unsigned installer manifest for isolated QA."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

from mid_740_installer_archive_shadow import SHA, Rejected, sha256_of_stream
from mid_740_restore_dist import restore_dist

ARCHIVE = 'MID-dist-release.zip'
MANIFEST = 'MID-release-manifest.json'


def stage_dist(destination, dist_tree, source_sha, version):
    if (not SHA.fullmatch(dist_tree) or not SHA.fullmatch(source_sha) or
            not re.fullmatch(r'0\.[0-9]+\.[0-9]+\.[0-9]+', version)):
        raise Rejected('INVALID_INSTALLER_IDENTITY')
    destination = Path(destination).absolute()
    if destination.parent.resolve(strict=True) != destination.parent:
        raise Rejected('UNSAFE_STAGING_DESTINATION')

    # Source and build-tree association comes from the caller's verified installer
    # snapshot. Object existence alone cannot authenticate a production build.
    for oid, kind in ((source_sha, 'commit'), (dist_tree, 'tree')):
        observed = subprocess.check_output(
            ['git', '--no-replace-objects', 'cat-file', '-t', oid],
            text=True, timeout=30,
        ).strip()
        if observed != kind:
            raise Rejected('INSTALLER_OBJECT_TYPE_MISMATCH')

    with tempfile.TemporaryDirectory(prefix='.mid740-dist-bundle-', dir=destination.parent) as temp:
        staging = Path(temp)
        archive = staging / ARCHIVE
        with archive.open('xb') as output:
            subprocess.run(
                ['git', '--no-replace-objects', 'archive', '--format=zip', '--prefix=dist/',
                 '--mtime=2000-01-01T00:00:00Z', dist_tree],
                stdout=output, check=True, timeout=120,
            )
        with archive.open('rb') as stream:
            digest, _ = sha256_of_stream(stream)

        # Reject archive attributes, unsafe modes and missing/version-drifted
        # content through the same exact-tree verifier used during recovery.
        restored = restore_dist(archive, staging / 'restored', digest, dist_tree, version)
        manifest = {
            'schema': 'mid.740.installer-dist.v1',
            'version': version,
            'sourceSha': source_sha,
            'distTreeSha': dist_tree,
            'distDigest': 'sha256:' + digest,
        }
        (staging / MANIFEST).write_text(
            json.dumps(manifest, sort_keys=True) + '\n', encoding='utf-8',
        )

        # Claim a new private destination only after round-trip verification.
        # The manifest is the last file handed over to the future signer.
        destination.mkdir(mode=0o700)
        archive_published = False
        try:
            (destination / ARCHIVE).hardlink_to(archive)
            archive_published = True
            (destination / MANIFEST).hardlink_to(staging / MANIFEST)
        except OSError:
            if archive_published:
                (destination / ARCHIVE).unlink()
            destination.rmdir()
            raise
    return {
        'status': 'INSTALLER_DIST_BUNDLE_QA_ONLY',
        'version': version,
        'sourceSha': source_sha,
        'distTreeSha': dist_tree,
        'distDigest': 'sha256:' + digest,
        'files': restored['files'],
        'installerAttestationVerified': False,
        'recoveryAuthorized': False,
        'releaseAuthorized': False,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination')
    parser.add_argument('dist_tree')
    parser.add_argument('source_sha')
    parser.add_argument('version')
    args = parser.parse_args()
    try:
        result = stage_dist(args.destination, args.dist_tree, args.source_sha, args.version)
        print(json.dumps(result, sort_keys=True))
    except (OSError, ValueError, subprocess.SubprocessError, zipfile.BadZipFile, Rejected) as error:
        raise SystemExit(f'MID #740 dist staging BLOCKED: {error}')
