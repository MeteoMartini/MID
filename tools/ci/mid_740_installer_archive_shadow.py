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
GIT_SHA = re.compile(r'^[a-f0-9]{40}$')

class Rejected(Exception):
    pass


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


def verify_file(path, envelope_digest, event_sha, git_blobs=None):
    if not DIGEST.fullmatch(envelope_digest) or not SHA.fullmatch(event_sha):
        raise Rejected('BAD_EXPECTED_IDENTITY')
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
        seen=set(); n=0; dirs=0; total_size=0; verified_blobs=0
        with outer.open('release.tar.gz') as gz:
            with tarfile.open(fileobj=gz,mode='r|gz') as tf:
                for member in tf:
                    n += 1
                    if n > MAX_FILES + 30000:
                        raise Rejected('EXCESSIVE_MEMBER_COUNT')
                    name = member.name.removeprefix('./').rstrip('/')
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
                    gitsha = hashlib.sha1() if name in required_blobs else None
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
                    if gitsha is not None:
                        if gitsha.hexdigest() != git_blobs[name]:
                            raise Rejected('GIT_BLOB_SHA_MISMATCH')
                        verified_blobs += 1
                    if sha.hexdigest() != files[name]:
                        raise Rejected('MANIFEST_FILE_DIGEST_MISMATCH')
                    seen.add(name)
        if seen != expected:
            raise Rejected('MISSING_FILES')
        return {'schema':'mid.740.real-installer-artifact-shadow.v1',
                'status':'BYTE_INTEGRITY_CONFIRMED','localEnvelopeSha256':observed,
                'envelopeBytes':count,'tarSha256':tarhash,'tarBytes':tarsize,
                'eventSha':event_sha,'verifiedFiles':len(seen),
                'verifiedDirectories':dirs,'totalExpandedFileBytes':total_size,
                'independentGitBlobMatches':verified_blobs,'fullGitTreeVerified':False,
                'producerVerified':False,'nativeReviewVerified':False,
                'releaseAuthorized':False,'installerAuthorized':False,
                'recoveryAuthorized':False}

if __name__ == '__main__':
    p=argparse.ArgumentParser()
    p.add_argument('file')
    p.add_argument('--expected-envelope-sha256',required=True)
    p.add_argument('--event-sha',required=True)
    p.add_argument('--git-blobs-json',default=None)
    a=p.parse_args()
    try:
        blobs = {} if a.git_blobs_json is None else json.loads(Path(a.git_blobs_json).read_text())
        print(json.dumps(verify_file(a.file,a.expected_envelope_sha256,a.event_sha,blobs),sort_keys=True))
    except (Rejected,zipfile.BadZipFile,tarfile.TarError,ValueError,OSError,KeyError,TypeError,EOFError) as exc:
        print(json.dumps({'schema':'mid.740.real-installer-artifact-shadow.v1',
                          'status':'BLOCKED','reason':str(exc),
                          'producerVerified':False,'nativeReviewVerified':False,
                          'releaseAuthorized':False,'installerAuthorized':False,'recoveryAuthorized':False},sort_keys=True))
        raise SystemExit(1)
