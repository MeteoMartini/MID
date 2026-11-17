#!/usr/bin/env python3
"""Restore a dist ZIP into an isolated QA directory and prove Git-tree parity."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import stat
import tempfile
import zipfile

from mid_740_installer_archive_shadow import (
    DIGEST, SHA, MAX_OUTER, MAX_ENTRY_BYTES, MAX_EXPANDED, MAX_FILES,
    Rejected, check_path, git_tree_sha, reject_duplicate_json_keys, sha256_of_stream,
)


def restore_dist(archive_path, destination, expected_digest, expected_tree, version):
    if (not DIGEST.fullmatch(expected_digest) or not SHA.fullmatch(expected_tree) or
            not re.fullmatch(r'0\.[0-9]+\.[0-9]+\.[0-9]+', version)):
        raise Rejected('INVALID_EXPECTED_IDENTITY')
    archive_path = Path(archive_path).absolute()
    destination = Path(destination).absolute()
    if (archive_path.is_symlink() or not archive_path.is_file() or
            archive_path.stat().st_size > MAX_OUTER or
            destination.parent.resolve(strict=True) != destination.parent):
        raise Rejected('UNSAFE_ARCHIVE_OR_DESTINATION')

    # Claim a new directory atomically. Never overwrite an existing deployment
    # or leave partially restored files at the caller's requested path.
    with tempfile.TemporaryDirectory(prefix='.mid740-restore-', dir=destination.parent) as temp:
        staging = Path(temp)
        files = {}
        directories = set()
        expanded = 0
        with archive_path.open('rb') as stream:
            if sha256_of_stream(stream)[0] != expected_digest:
                raise Rejected('DIST_ARCHIVE_DIGEST_MISMATCH')
            stream.seek(0)
            with zipfile.ZipFile(stream) as archive:
                entries = archive.infolist()
                if not 0 < len(entries) <= MAX_FILES:
                    raise Rejected('INVALID_DIST_INVENTORY')
                for entry in entries:
                    name = check_path(entry.filename.removesuffix('/'))
                    mode = entry.external_attr >> 16
                    # git archive omits Unix metadata for plain files and directories.
                    portable_mode = 0x10 if entry.is_dir() else 0
                    if (entry.flag_bits & 1 or name in directories or name in files or
                            (entry.create_system != 3 and
                             (entry.create_system != 0 or entry.external_attr != portable_mode))):
                        raise Rejected('UNSAFE_DIST_ENTRY')
                    if name == 'dist' or name.startswith('dist/'):
                        target = staging / name
                    else:
                        raise Rejected('OUTSIDE_DIST')
                    if entry.is_dir():
                        if (entry.create_system == 3 and not stat.S_ISDIR(mode)) or entry.file_size:
                            raise Rejected('UNSAFE_DIST_DIRECTORY')
                        target.mkdir(parents=True, exist_ok=True)
                        directories.add(name)
                        continue
                    if (name == 'dist' or (entry.create_system == 3 and not stat.S_ISREG(mode)) or
                            entry.file_size > MAX_ENTRY_BYTES or
                            entry.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)):
                        raise Rejected('UNSAFE_DIST_FILE')
                    expanded += entry.file_size
                    if expanded > MAX_EXPANDED:
                        raise Rejected('DIST_SIZE_LIMIT')
                    target.parent.mkdir(parents=True, exist_ok=True)
                    oid = hashlib.sha1(f'blob {entry.file_size}\0'.encode('ascii'))
                    length = 0
                    with archive.open(entry) as source, target.open('xb') as output:
                        while chunk := source.read(1024 * 1024):
                            length += len(chunk)
                            if length > entry.file_size:
                                raise Rejected('DIST_ENTRY_SIZE_MISMATCH')
                            oid.update(chunk)
                            output.write(chunk)
                    if length != entry.file_size:
                        raise Rejected('DIST_ENTRY_SIZE_MISMATCH')
                    executable = bool(mode & 0o111)
                    target.chmod(0o755 if executable else 0o644)
                    files[name.removeprefix('dist/')] = ('100755' if executable else '100644', oid.hexdigest())
        required = {'index.html', 'version.json', 'sw.js'}
        if not required.issubset(files) or git_tree_sha(files) != expected_tree:
            raise Rejected('DIST_TREE_MISMATCH')
        metadata = json.loads((staging / 'dist/version.json').read_text(),
                              object_pairs_hook=reject_duplicate_json_keys)
        if not isinstance(metadata, dict) or metadata.get('version') != version:
            raise Rejected('DIST_VERSION_MISMATCH')
        destination.mkdir(mode=0o700)
        try:
            (staging / 'dist').rename(destination / 'dist')
        except OSError:
            destination.rmdir()
            raise
    return {'status': 'DIST_RESTORED_QA_ONLY', 'version': version, 'distTreeSha': expected_tree,
            'files': len(files), 'recoveryAuthorized': False, 'releaseAuthorized': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive')
    parser.add_argument('destination')
    parser.add_argument('digest')
    parser.add_argument('dist_tree')
    parser.add_argument('version')
    args = parser.parse_args()
    try:
        print(json.dumps(restore_dist(args.archive, args.destination, args.digest,
                                      args.dist_tree, args.version), sort_keys=True))
    except (OSError, ValueError, zipfile.BadZipFile, Rejected) as error:
        raise SystemExit(f'MID #740 dist restore BLOCKED: {error}')
