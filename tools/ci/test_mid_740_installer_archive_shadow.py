#!/usr/bin/env python3
"""Deterministic, offline negative tests: no production artifacts or networking."""
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile, ZIP_DEFLATED

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mid_740_installer_archive_shadow import verify_file, Rejected

EVENT='a'*40

def digest(data):return hashlib.sha256(data).hexdigest()
def gitsha(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()

class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp=TemporaryDirectory(prefix='mid740-offline-')
        self.addCleanup(self.temp.cleanup)
        self.files={'package.json':b'{"version":"0.9.85.485"}\n','src/ok.js':b'console.log("ok");\n'}

    def fixture(self, *, mutate=None, add_symlink=False, extra_file=False, corrupt_tar=False, duplicate_json=False):
        data=io.BytesIO()
        with tarfile.open(fileobj=data,mode='w:gz') as tf:
            root=tarfile.TarInfo('.'); root.type=tarfile.DIRTYPE;root.mode=0o755;tf.addfile(root)
            folder=tarfile.TarInfo('./src');folder.type=tarfile.DIRTYPE;folder.mode=0o755;tf.addfile(folder)
            for path,blob in self.files.items():
                member=tarfile.TarInfo('./'+path);member.mode=0o644;member.size=len(blob)
                tf.addfile(member, io.BytesIO(blob))
            if extra_file:
                member=tarfile.TarInfo('./unexpected.js');member.mode=0o644;member.size=1
                tf.addfile(member,io.BytesIO(b'X'))
            if add_symlink:
                member=tarfile.TarInfo('./symlink');member.type=tarfile.SYMTYPE
                member.linkname='../outside';tf.addfile(member)
        tar=data.getvalue()
        m={'schema':1,'event':EVENT,'archiveSha256':digest(tar),
            'files':{k:digest(v) for k,v in self.files.items()}}
        if mutate:mutate(m)
        if corrupt_tar:
            t=bytearray(tar);t[len(t)//2]^=1;tar=bytes(t)
        mbytes=json.dumps(m).encode()
        if duplicate_json:
            mbytes=mbytes[:-1]+b',"schema":1}'
        name=Path(self.temp.name)/'sample.zip'
        with ZipFile(name,'w',compression=ZIP_DEFLATED) as z:
            z.writestr('manifest.json',mbytes)
            z.writestr('release.tar.gz',tar)
        return name,digest(name.read_bytes())

    def test_verified_small_archive_and_git_blob(self):
        path,sha=self.fixture()
        proof=verify_file(path,sha,EVENT,{'package.json':gitsha(self.files['package.json'])})
        self.assertEqual(proof['status'],'BYTE_INTEGRITY_CONFIRMED')
        self.assertEqual(proof['verifiedFiles'],2)
        self.assertEqual(proof['independentGitBlobMatches'],1)
        self.assertFalse(proof['fullGitTreeVerified'])
        for k in ('releaseAuthorized','installerAuthorized','producerVerified','recoveryAuthorized'):
            self.assertFalse(proof[k])

    def test_wrong_outer_digest(self):
        path,_=self.fixture()
        with self.assertRaisesRegex(Rejected,'ENVELOPE_SHA_MISMATCH'):
            verify_file(path,'0'*64,EVENT)

    def test_wrong_event_sha(self):
        path,sha=self.fixture()
        with self.assertRaisesRegex(Rejected,'EVENT_SHA_DRIFT'):
            verify_file(path,sha,'b'*40)

    def test_manifest_file_sha_tamper(self):
        def bad(m):m['files']['package.json']='0'*64
        path,sha=self.fixture(mutate=bad)
        with self.assertRaisesRegex(Rejected,'MANIFEST_FILE_DIGEST_MISMATCH'):
            verify_file(path,sha,EVENT)

    def test_tar_bytes_tamper(self):
        path,sha=self.fixture(corrupt_tar=True)
        with self.assertRaisesRegex(Rejected,'TAR_SHA_MISMATCH'):
            verify_file(path,sha,EVENT)

    def test_manifest_path_traversal(self):
        def bad(m):m['files']['../outside']=m['files'].pop('package.json')
        path,sha=self.fixture(mutate=bad)
        with self.assertRaisesRegex(Rejected,'UNSAFE_ARCHIVE_PATH'):
            verify_file(path,sha,EVENT)

    def test_duplicate_manifest_key(self):
        path,sha=self.fixture(duplicate_json=True)
        with self.assertRaisesRegex(Rejected,'DUPLICATE_MANIFEST_KEY'):
            verify_file(path,sha,EVENT)

    def test_unexpected_tar_file(self):
        path,sha=self.fixture(extra_file=True)
        with self.assertRaisesRegex(Rejected,'UNEXPECTED_OR_DUPLICATE_MEMBER'):
            verify_file(path,sha,EVENT)

    def test_tar_symlink(self):
        path,sha=self.fixture(add_symlink=True)
        with self.assertRaisesRegex(Rejected,'UNSAFE_MEMBER_TYPE'):
            verify_file(path,sha,EVENT)

    def test_wrong_git_blob(self):
        path,sha=self.fixture()
        with self.assertRaisesRegex(Rejected,'GIT_BLOB_SHA_MISMATCH'):
            verify_file(path,sha,EVENT,{'package.json':'0'*40})

    def test_missing_required_git_blob(self):
        path,sha=self.fixture()
        with self.assertRaisesRegex(Rejected,'GIT_BLOB_REQUIRED_MISSING'):
            verify_file(path,sha,EVENT,{'missing.json':'0'*40})

if __name__=='__main__':unittest.main(verbosity=2)
