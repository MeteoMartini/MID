#!/usr/bin/env python3
"""Read-only MID #740 QA: verify an actual installer source artifact envelope.

This explicitly does NOT authenticate a source *producer*, merge review, a
GitHub release attestation, or enable release/installer/deployment privileges.
The caller must fetch run/artifact metadata independently through GitHub and
supply the trusted outer envelope digest and expected installer event SHA.
No archive content is ever extracted or executed.
"""
import argparse
import hashlib
import gzip
import zlib
import json
from pathlib import Path
import re
import tarfile
import zipfile

DIGEST = re.compile(r'^[a-f0-9]{64}$')
SHA = re.compile(r'^[a-f0-9]{40}$')
MAX_OUTER = 900 * 1024 * 1024
MAX_FILES = 100000
MAX_ENTRY_BYTES = 200 * 1024 * 1024
MAX_EXPANDED = 2 * 1024 * 1024 * 1024
# tarfile consumes extended headers before yielding a member. Bound that
# internal parser input as well as the full decompressed stream, not just files.
MAX_METADATA = 64 * 1024
MAX_METADATA_TOTAL = 128 * 1024 * 1024
MAX_TAR_BYTES = MAX_EXPANDED + MAX_METADATA_TOTAL
GIT_SHA = re.compile(r'^[a-f0-9]{40}$')

class Rejected(Exception):
    pass


class BoundedTarInfo(tarfile.TarInfo):
    def _proc_member(self, archive):
        # TarFile(tarinfo=...) is the standard extension point; this guard runs
        # before CPython's PAX/GNU handlers allocate/read their payload. Keep
        # explicit parser regressions when updating the qualified Python line.
        metadata = self.type in (tarfile.XHDTYPE, tarfile.XGLTYPE,
            tarfile.SOLARIS_XHDTYPE, tarfile.GNUTYPE_LONGNAME, tarfile.GNUTYPE_LONGLINK)
        if metadata:
            total = getattr(archive, '_mid_metadata_total', 0) + self.size
            depth = getattr(archive, '_mid_metadata_depth', 0) + 1
            if not 0 <= self.size <= MAX_METADATA or total > MAX_METADATA_TOTAL or depth > 32:
                raise Rejected('EXCESSIVE_TAR_METADATA')
            archive._mid_metadata_total, archive._mid_metadata_depth = total, depth
        else:
            archive._mid_metadata_depth = 0
            if self.size < 0 or self.size > MAX_ENTRY_BYTES:
                raise Rejected('UNSAFE_MEMBER_SIZE')
            if self.type not in (tarfile.REGTYPE, tarfile.AREGTYPE, tarfile.DIRTYPE):
                raise Rejected('UNSAFE_MEMBER_TYPE')
        return super()._proc_member(archive)


class BoundedTarStream:
    def __init__(self, stream):
        self.stream, self.remaining = stream, MAX_TAR_BYTES

    def read(self, size):
        # r| requests bounded blocks. Prevent oversized upstream allocations
        # even if a future parser changes its read strategy.
        if not 0 <= size <= MAX_ENTRY_BYTES:
            raise Rejected('UNSAFE_TAR_READ_SIZE')
        data = self.stream.read(min(size, self.remaining + 1))
        self.remaining -= len(data)
        if self.remaining < 0:
            raise Rejected('EXCESSIVE_DECOMPRESSED_TAR_SIZE')
        return data


def check_path(s):
    if not isinstance(s, str) or not s or s.startswith('/') or '\\' in s or '\0' in s:
        raise Rejected('UNSAFE_ARCHIVE_PATH')
    p = s.split('/')
    if any(k in ('', '.', '..') for k in p):
        raise Rejected('UNSAFE_ARCHIVE_PATH')
    return s


def sha256_of_stream(handle):
    h = hashlib.sha256()
    size = 0
    while True:
        chunk = handle.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > MAX_OUTER:
            raise Rejected('OVERSIZE_COMPRESSED_INPUT')
        h.update(chunk)
    return h.hexdigest(), size


def reject_duplicate_json_keys(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise Rejected('DUPLICATE_MANIFEST_KEY')
        out[key] = value
    return out


def git_blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode('ascii') + b'\0' + data).hexdigest()


def git_tree_sha(files):
    """Git SHA-1 tree OID from verified file bytes and Git file modes."""
    root = {}
    for path, (mode, oid) in files.items():
        parts = check_path(path).split('/')
        cursor = root
        for part in parts[:-1]:
            cursor = cursor.setdefault(part, {})
            if not isinstance(cursor, dict):
                raise Rejected('DIST_TREE_FILE_DIRECTORY_CONFLICT')
        if parts[-1] in cursor:
            raise Rejected('DUPLICATE_DIST_TREE_ENTRY')
        cursor[parts[-1]] = (mode, oid)

    def oid(node):
        buffer = bytearray()
        for name, value in sorted(node.items(), key=lambda item:
                (item[0] + ('/' if isinstance(item[1], dict) else '')).encode('utf8')):
            if isinstance(value, dict):
                mode, item_sha = '40000', oid(value)
            else:
                mode, item_sha = value
            buffer.extend(mode.encode('ascii') + b' ' + name.encode('utf8') +
                          b'\0' + bytes.fromhex(item_sha))
        return hashlib.sha1(b'tree ' + str(len(buffer)).encode('ascii') +
                            b'\0' + buffer).hexdigest()
    return oid(root)


def verify_file(path, envelope_digest, event_sha, git_blobs=None, expected_dist_tree_sha=None):
    if not DIGEST.fullmatch(envelope_digest) or not SHA.fullmatch(event_sha):
        raise Rejected('BAD_EXPECTED_IDENTITY')
    if expected_dist_tree_sha is not None and not GIT_SHA.fullmatch(expected_dist_tree_sha):
        raise Rejected('INVALID_DIST_TREE_SHA')
    git_blobs = {} if git_blobs is None else git_blobs
    if not isinstance(git_blobs, dict) or len(git_blobs) > 256 or any(
        not isinstance(path_name, str) or not GIT_SHA.fullmatch(git_sha)
        for path_name, git_sha in git_blobs.items()
    ):
        raise Rejected('INVALID_GIT_BLOB_INVENTORY')
    required_blobs = {check_path(name) for name in git_blobs}
    path = Path(path)
    if not path.is_file() or path.is_symlink() or path.stat().st_size > MAX_OUTER:
        raise Rejected('BAD_LOCAL_FILE')
    with path.open('rb') as f:
        observed, count = sha256_of_stream(f)
    if observed != envelope_digest:
        raise Rejected('ENVELOPE_SHA_MISMATCH')
    with zipfile.ZipFile(path, 'r') as outer:
        infos = outer.infolist()
        if len(infos) != 2 or {x.filename for x in infos} != {'manifest.json', 'release.tar.gz'}:
            raise Rejected('UNEXPECTED_ENVELOPE_ENTRIES')
        if len({x.filename for x in infos}) != 2 or any(x.is_dir() for x in infos):
            raise Rejected('DUPLICATE_OR_BAD_ENVELOPE_ENTRIES')
        for x in infos:
            if x.file_size > MAX_OUTER or x.compress_size > MAX_OUTER:
                raise Rejected('OVERSIZE_ENTRY')
        m = outer.getinfo('manifest.json')
        if m.file_size > 16*1024*1024:
            raise Rejected('MANIFEST_TOO_LARGE')
        manifest = json.loads(outer.read('manifest.json'), object_pairs_hook=reject_duplicate_json_keys)
        if set(manifest) != {'schema', 'event', 'archiveSha256', 'files'} or manifest['schema'] != 1:
            raise Rejected('UNKNOWN_MANIFEST_SCHEMA')
        if manifest['event'] != event_sha:
            raise Rejected('EVENT_SHA_DRIFT')
        if not DIGEST.fullmatch(manifest['archiveSha256']):
            raise Rejected('BAD_TAR_DIGEST')
        files = manifest['files']
        if not isinstance(files, dict) or not files or len(files) > MAX_FILES:
            raise Rejected('BAD_MANIFEST_FILES')
        if any(not DIGEST.fullmatch(digest) for digest in files.values()):
            raise Rejected('BAD_MANIFEST_FILE_DIGEST')
        expected = {check_path(name) for name in files}
        if not required_blobs.issubset(expected):
            raise Rejected('GIT_BLOB_REQUIRED_MISSING')
        if len(expected) != len(files):
            raise Rejected('DUPLICATE_MANIFEST_PATH')
        with outer.open('release.tar.gz') as gz:
            tarhash, tarsize = sha256_of_stream(gz)
        if tarhash != manifest['archiveSha256']:
            raise Rejected('TAR_SHA_MISMATCH')
        seen=set(); n=0; dirs=0; total_size=0; verified_blobs=0; dist_files={}
        with outer.open('release.tar.gz') as gz, gzip.GzipFile(fileobj=gz) as expanded:
            with tarfile.open(fileobj=BoundedTarStream(expanded),mode='r|',tarinfo=BoundedTarInfo) as tf:
                for member in tf:
                    n += 1
                    if n > MAX_FILES + 30000:
                        raise Rejected('EXCESSIVE_MEMBER_COUNT')
                    name = member.name.removeprefix('./')
                    if member.isdir():
                        name = name.rstrip('/')
                    if name in ('', '.') and member.isdir():
                        dirs += 1
                        continue
                    check_path(name)
                    if member.issym() or member.islnk() or member.isdev() or member.isfifo():
                        raise Rejected('UNSAFE_MEMBER_TYPE')
                    if member.mode & 0o6000:
                        raise Rejected('UNSAFE_MEMBER_MODE')
                    if member.isdir():
                        dirs += 1
                        continue
                    if not member.isfile() or name not in files or name in seen:
                        raise Rejected('UNEXPECTED_OR_DUPLICATE_MEMBER')
                    if member.size < 0 or member.size > MAX_ENTRY_BYTES:
                        raise Rejected('UNSAFE_MEMBER_SIZE')
                    total_size += member.size
                    if total_size > MAX_EXPANDED:
                        raise Rejected('EXCESSIVE_TOTAL_SIZE')
                    reader = tf.extractfile(member)
                    if reader is None:
                        raise Rejected('UNREADABLE_MEMBER')
                    sha = hashlib.sha256()
                    gitsha = hashlib.sha1() if name in required_blobs or (expected_dist_tree_sha is not None and name.startswith('dist/')) else None
                    if gitsha is not None:
                        gitsha.update(b'blob '+str(member.size).encode('ascii')+b'\0')
                    read_bytes = 0
                    while True:
                        chunk = reader.read(1024*1024)
                        if not chunk:
                            break
                        sha.update(chunk)
                        read_bytes += len(chunk)
                        if gitsha is not None:
                            gitsha.update(chunk)
                    if read_bytes != member.size:
                        raise Rejected('INCOMPLETE_FILE_STREAM')
                    if name in required_blobs:
                        if gitsha is None or gitsha.hexdigest() != git_blobs[name]:
                            raise Rejected('GIT_BLOB_SHA_MISMATCH')
                        verified_blobs += 1
                    if expected_dist_tree_sha is not None and name.startswith('dist/'):
                        dist_files[name[len('dist/'):]] = (
                            '100755' if member.mode & 0o100 else '100644',
                            gitsha.hexdigest())
                    if sha.hexdigest() != files[name]:
                        raise Rejected('MANIFEST_FILE_DIGEST_MISMATCH')
                    seen.add(name)
        if seen != expected:
            raise Rejected('MISSING_FILES')
        dist_verified = False
        if expected_dist_tree_sha is not None:
            if not {'dist/index.html','dist/version.json','dist/sw.js'}.issubset(seen):
                raise Rejected('MISSING_CORE_DIST_RECOVERY_FILES')
            if git_tree_sha(dist_files) != expected_dist_tree_sha:
                raise Rejected('DIST_GIT_TREE_SHA_MISMATCH')
            dist_verified = True
        return {'schema':'mid.740.real-installer-artifact-shadow.v1',
                'status':'BYTE_INTEGRITY_CONFIRMED','localEnvelopeSha256':observed,
                'envelopeBytes':count,'tarSha256':tarhash,'tarBytes':tarsize,
                'eventSha':event_sha,'verifiedFiles':len(seen),
                'verifiedDirectories':dirs,'totalExpandedFileBytes':total_size,
                'independentGitBlobMatches':verified_blobs,'fullGitTreeVerified':False,
                'distGitTreeVerified':dist_verified,'distGitTreeFiles':len(dist_files),
                'producerVerified':False,'nativeReviewVerified':False,
                'releaseAuthorized':False,'installerAuthorized':False,
                'recoveryAuthorized':False}

if __name__ == '__main__':
    p=argparse.ArgumentParser()
    p.add_argument('file')
    p.add_argument('--expected-envelope-sha256',required=True)
    p.add_argument('--event-sha',required=True)
    p.add_argument('--git-blobs-json',default=None)
    p.add_argument('--expected-dist-tree-sha',default=None)
    a=p.parse_args()
    try:
        blobs = {} if a.git_blobs_json is None else json.loads(Path(a.git_blobs_json).read_text())
        print(json.dumps(verify_file(a.file,a.expected_envelope_sha256,a.event_sha,blobs,a.expected_dist_tree_sha),sort_keys=True))
    except (Rejected,zipfile.BadZipFile,tarfile.TarError,ValueError,OSError,KeyError,TypeError,EOFError,zlib.error,RecursionError,OverflowError) as exc:
        print(json.dumps({'schema':'mid.740.real-installer-artifact-shadow.v1',
                          'status':'BLOCKED','reason':str(exc),
                          'producerVerified':False,'nativeReviewVerified':False,
                          'releaseAuthorized':False,'installerAuthorized':False,'recoveryAuthorized':False},sort_keys=True))
        raise SystemExit(1)
