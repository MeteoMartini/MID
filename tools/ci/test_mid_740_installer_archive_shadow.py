#!/usr/bin/env python3
"""Deterministic, offline negative tests: no production artifacts or networking."""
import hashlib
import gzip
import subprocess
from unittest.mock import patch
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

    def fixture(self, *, mutate=None, add_symlink=False, extra_file=False, corrupt_tar=False, duplicate_json=False, member_mutate=None, tar_mutate=None):
        data=io.BytesIO()
        with tarfile.open(fileobj=data,mode='w:gz') as tf:
            root=tarfile.TarInfo('.'); root.type=tarfile.DIRTYPE;root.mode=0o755;tf.addfile(root)
            folder=tarfile.TarInfo('./src');folder.type=tarfile.DIRTYPE;folder.mode=0o755;tf.addfile(folder)
            for path,blob in self.files.items():
                member=tarfile.TarInfo('./'+path);member.mode=0o644;member.size=len(blob)
                if member_mutate: member_mutate(member)
                tf.addfile(member, io.BytesIO(blob))
            if extra_file:
                member=tarfile.TarInfo('./unexpected.js');member.mode=0o644;member.size=1
                tf.addfile(member,io.BytesIO(b'X'))
            if add_symlink:
                member=tarfile.TarInfo('./symlink');member.type=tarfile.SYMTYPE
                member.linkname='../outside';tf.addfile(member)
        tar=data.getvalue()
        if tar_mutate: tar=tar_mutate(tar)
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

    def test_entire_dist_git_tree_parity_and_tamper(self):
        # Independent fixed Git-tree expectation, no call into the verifier's
        # Git-tree implementation for the expected value.
        self.files={
            'dist/index.html':b'<html>ok</html>\n',
            'dist/sw.js':b'// offline\n',
            'dist/version.json':b'{"version":"0.9.85.485"}\n',
        }
        raw=b''
        for name in ('index.html','sw.js','version.json'):
            data=self.files['dist/'+name]
            sha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).digest()
            raw+=b'100644 '+name.encode()+b'\0'+sha
        expected=hashlib.sha1(b'tree '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        path,sha=self.fixture()
        report=verify_file(path,sha,EVENT,expected_dist_tree_sha=expected)
        self.assertTrue(report['distGitTreeVerified'])
        self.assertEqual(report['distGitTreeFiles'],3)
        self.assertFalse(report['releaseAuthorized'])
        with self.assertRaisesRegex(Rejected,'DIST_GIT_TREE_SHA_MISMATCH'):
            verify_file(path,sha,EVENT,expected_dist_tree_sha='0'*40)

    def test_nested_dist_modes_against_real_git_index(self):
        self.files = {'dist/index.html': b'html', 'dist/sw.js': b'worker',
            'dist/version.json': b'{}', 'dist/assets/z.js': b'z',
            'dist/assets.js': b'before directory', 'dist/assets0.js': b'after directory',
            'dist/bin/run': b'executable', 'dist/group-only': b'not Git executable'}
        modes = {'./dist/bin/run': 0o744, './dist/group-only': 0o654}
        root = Path(self.temp.name) / 'git'; root.mkdir()
        subprocess.run(['git', 'init', '-q', str(root)], check=True)
        for name, data in self.files.items():
            file = root / name; file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(data); file.chmod(modes.get('./' + name, 0o644))
        subprocess.run(['git', '-C', str(root), 'add', 'dist'], check=True)
        expected = subprocess.check_output(['git', '-C', str(root), 'write-tree',
            '--prefix=dist/'], text=True).strip()
        def mode(member): member.mode = modes.get(member.name, member.mode)
        path, sha = self.fixture(member_mutate=mode)
        report = verify_file(path, sha, EVENT, expected_dist_tree_sha=expected)
        self.assertEqual(report['distGitTreeFiles'], len(self.files))

    def test_regular_file_trailing_slash_rejected(self):
        def bad(member): member.name += '/'
        path, sha = self.fixture(member_mutate=bad)
        with self.assertRaisesRegex(Rejected, 'UNSAFE_ARCHIVE_PATH'):
            verify_file(path, sha, EVENT)

    def test_extended_header_rejected_before_payload_allocation(self):
        import mid_740_installer_archive_shadow as module
        for kind in (tarfile.XHDTYPE, tarfile.XGLTYPE, tarfile.GNUTYPE_LONGNAME,
                     tarfile.GNUTYPE_LONGLINK):
            with self.subTest(kind=kind):
                header = tarfile.TarInfo('metadata'); header.type = kind
                header.size = module.MAX_METADATA + 1
                # No declared payload is present: validation must reject the
                # size before tarfile tries to read/decode the malicious body.
                path, sha = self.fixture(tar_mutate=lambda _: gzip.compress(
                    header.tobuf(format=tarfile.USTAR_FORMAT)))
                with self.assertRaisesRegex(Rejected, 'EXCESSIVE_TAR_METADATA'):
                    verify_file(path, sha, EVENT)

    def test_extended_header_chain_and_total_decompression_bound(self):
        metadata = tarfile.TarInfo('pax'); metadata.type = tarfile.XHDTYPE
        metadata.size = 0
        prefix = metadata.tobuf(format=tarfile.USTAR_FORMAT) * 33
        path, sha = self.fixture(tar_mutate=lambda tar: gzip.compress(prefix + gzip.decompress(tar)))
        with self.assertRaisesRegex(Rejected, 'EXCESSIVE_TAR_METADATA'):
            verify_file(path, sha, EVENT)
        path, sha = self.fixture()
        with patch('mid_740_installer_archive_shadow.MAX_TAR_BYTES', 1024):
            with self.assertRaisesRegex(Rejected, 'EXCESSIVE_DECOMPRESSED_TAR_SIZE'):
                verify_file(path, sha, EVENT)

    def test_corrupt_deflate_cli_reports_blocked_json(self):
        def bad_deflate(_):
            # Correct gzip magic followed by an invalid DEFLATE block.
            return b'\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x07' + b'\x00' * 8
        path, sha = self.fixture(tar_mutate=bad_deflate)
        run = subprocess.run([sys.executable, str(Path(__file__).with_name(
            'mid_740_installer_archive_shadow.py')), str(path),
            '--expected-envelope-sha256', sha, '--event-sha', EVENT],
            text=True, capture_output=True)
        self.assertEqual(run.returncode, 1)
        self.assertEqual(json.loads(run.stdout)['status'], 'BLOCKED')
        self.assertNotIn('Traceback', run.stderr)

    def test_normal_pax_metadata_still_supported(self):
        def with_pax(member): member.pax_headers = {'comment': 'original snapshot'}
        path, sha = self.fixture(member_mutate=with_pax)
        self.assertEqual(verify_file(path, sha, EVENT)['verifiedFiles'], 2)

    def test_missing_core_dist_file_blocks_recovery_tree(self):
        self.files={'dist/index.html':b'<html>ok</html>\n'}
        path,sha=self.fixture()
        with self.assertRaisesRegex(Rejected,'MISSING_CORE_DIST_RECOVERY_FILES'):
            verify_file(path,sha,EVENT,expected_dist_tree_sha='0'*40)

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
