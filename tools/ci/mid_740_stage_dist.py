#!/usr/bin/env python3
"""Prepare a verified dist ZIP and unsigned installer manifest for isolated QA."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import tarfile
import zipfile

from mid_740_installer_archive_shadow import (
    DIGEST, SHA, MAX_OUTER, Rejected, sha256_of_stream, verify_file,
)
from mid_740_restore_dist import restore_dist

ARCHIVE = 'MID-dist-release.zip'
MANIFEST = 'MID-release-manifest.json'


def verify_snapshot(directory, snapshot_sha, source_sha, dist_tree, staging):
    """Bind the entire original installer archive to its job-output manifest SHA."""
    directory = Path(directory).absolute()
    if directory.resolve(strict=True) != directory:
        raise Rejected('UNSAFE_SNAPSHOT_DIRECTORY')
    manifest = directory / 'manifest.json'
    archive = directory / 'release.tar.gz'
    if (manifest.is_symlink() or not manifest.is_file() or
            manifest.stat().st_size > 16 * 1024 * 1024 or
            archive.is_symlink() or not archive.is_file() or
            archive.stat().st_size > MAX_OUTER):
        raise Rejected('UNSAFE_SNAPSHOT_FILES')
    manifest_bytes = manifest.read_bytes()
    if hashlib.sha256(manifest_bytes).hexdigest() != snapshot_sha:
        raise Rejected('SNAPSHOT_MANIFEST_DIGEST_MISMATCH')
    # Reuse the original full TAR/manifest/mode verifier. Capture the exact
    # manifest bytes once so a later filesystem mutation cannot change trust.
    envelope = staging / 'snapshot-envelope.zip'
    with zipfile.ZipFile(envelope, 'w', compression=zipfile.ZIP_STORED) as output:
        output.writestr('manifest.json', manifest_bytes)
        output.write(archive, 'release.tar.gz')
    with envelope.open('rb') as stream:
        envelope_sha, _ = sha256_of_stream(stream)
    verified = verify_file(envelope, envelope_sha, source_sha,
                           expected_dist_tree_sha=dist_tree)
    return verified['tarSha256']


def stage_dist(destination, dist_tree, source_sha, version,
               snapshot_directory=None, snapshot_sha=None):
    if (not SHA.fullmatch(dist_tree) or not SHA.fullmatch(source_sha) or
            not re.fullmatch(r'0\.[0-9]+\.[0-9]+\.[0-9]+', version)):
        raise Rejected('INVALID_INSTALLER_IDENTITY')
    if ((snapshot_directory is None) != (snapshot_sha is None) or
            (snapshot_sha is not None and not DIGEST.fullmatch(snapshot_sha))):
        raise Rejected('INVALID_SNAPSHOT_IDENTITY')
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
        snapshot_archive_sha = None
        if snapshot_directory is not None:
            snapshot_archive_sha = verify_snapshot(
                snapshot_directory, snapshot_sha, source_sha, dist_tree, staging,
            )
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
        if snapshot_archive_sha is not None:
            manifest['snapshotManifestSha256'] = snapshot_sha
            manifest['snapshotArchiveSha256'] = snapshot_archive_sha
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
        'snapshotManifestVerified': snapshot_archive_sha is not None,
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
    parser.add_argument('--snapshot-directory')
    parser.add_argument('--snapshot-sha')
    args = parser.parse_args()
    try:
        result = stage_dist(args.destination, args.dist_tree, args.source_sha, args.version,
                            args.snapshot_directory, args.snapshot_sha)
        print(json.dumps(result, sort_keys=True))
    except (OSError, ValueError, TypeError, KeyError, EOFError, subprocess.SubprocessError,
            tarfile.TarError, zipfile.BadZipFile, Rejected) as error:
        raise SystemExit(f'MID #740 dist staging BLOCKED: {error}')
