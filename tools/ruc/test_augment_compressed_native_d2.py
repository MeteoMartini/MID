import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from augment_compressed_native_d2 import attach, file_sha, utc_time


RELEASE = 'a' * 40
CLOCK = datetime(2026, 11, 12, 12, tzinfo=timezone.utc)


class SignedNativeD2CompressedAdmissionTests(unittest.TestCase):
    """Negative gate tests only; real Sigstore approval may NOT be mocked."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.snap = self.root / 'ruc'
        self.snap.mkdir()
        self.approval = self.root / 'protected'
        (self.approval / 'd2-original-approved').mkdir(parents=True)
        self.meta = {
            'schema': 'mid.dwd.ruc.grid.v2',
            'storageProfile': 'pages-lossless-v1',
            'run': '2026-11-12T10:00',
            'pointCount': 542040,
            'pages': {
                'profile': 'pages-lossless-v1',
                'publishedBytes': 1,
                'objects': [{'key': 'runs/original.bin', 'bytes': 1, 'sha256': 'b' * 64}],
            },
        }
        self.save()
    def save(self):
        (self.snap / 'latest.json').write_text(json.dumps(self.meta) + '\n')
    def approved_candidate(self, run='2026-11-12T06:00:00Z'):
        index = {'schema': 'mid.icon-d2.native-fields.v2', 'productionApproved': True,
                 'nativePoints': 542040, 'sourceApprovalCommitSha': RELEASE,
                 'run': run, 'sourceInventorySha256': 'c' * 64}
        index_path = self.approval / 'd2-original-approved' / 'index.json'
        index_path.write_text(json.dumps(index))
        report = {'sourceCommitSha': RELEASE, 'frames': 72, 'signed': False,
                  'published': False, 'indexSha256': file_sha(index_path),
                  'originalInventorySha256': 'c' * 64}
        (self.approval / 'original-dwd-approval-report.json').write_text(json.dumps(report))
        return index_path

    def test_requires_full_canonical_compressed_profile(self):
        self.meta['storageProfile'] = 'pages-free-v1'
        self.save()
        with self.assertRaisesRegex(ValueError, 'published-profile'):
            attach(self.snap, self.approval, RELEASE, now=CLOCK)
        self.assertNotIn('modelFieldsNative', json.loads((self.snap / 'latest.json').read_text()))

    def test_never_promotes_unapproved_or_unproven_source(self):
        self.approved_candidate()
        report = self.approval / 'original-dwd-approval-report.json'
        content = json.loads(report.read_text())
        content['signed'] = True  # self-declared approval is not authority
        report.write_text(json.dumps(content))
        original = (self.snap / 'latest.json').read_bytes()
        with self.assertRaisesRegex(ValueError, 'signed DWD source/report mismatch'):
            attach(self.snap, self.approval, RELEASE, now=CLOCK)
        self.assertEqual(original, (self.snap / 'latest.json').read_bytes())

    def test_index_sha_is_required_and_pointer_remains_unchanged(self):
        index = self.approved_candidate()
        index.write_text(index.read_text().replace('542040', '542041'))
        original = (self.snap / 'latest.json').read_bytes()
        with self.assertRaisesRegex(ValueError, 'signed DWD source/report mismatch'):
            attach(self.snap, self.approval, RELEASE, now=CLOCK)
        self.assertEqual(original, (self.snap / 'latest.json').read_bytes())

    def test_signed_source_is_not_accepted_from_an_expired_run(self):
        self.approved_candidate('2026-11-11T11:00:00Z')
        with self.assertRaisesRegex(ValueError, 'stale'):
            attach(self.snap, self.approval, RELEASE, now=CLOCK)

    def test_current_unsigned_pilot_cannot_enter_pages(self):
        index = self.approved_candidate()
        content = json.loads(index.read_text())
        content['productionApproved'] = False
        index.write_text(json.dumps(content))
        report = self.approval / 'original-dwd-approval-report.json'
        signed_metadata = json.loads(report.read_text())
        signed_metadata['indexSha256'] = file_sha(index)
        report.write_text(json.dumps(signed_metadata))
        with self.assertRaisesRegex(ValueError, 'signed DWD source/report mismatch'):
            attach(self.snap, self.approval, RELEASE, now=CLOCK)

    def test_even_a_matching_unattested_index_requires_real_72_frames_and_slsa(self):
        self.approved_candidate()
        original = (self.snap / 'latest.json').read_bytes()
        with self.assertRaises(ValueError):
            attach(self.snap, self.approval, RELEASE, now=CLOCK)
        self.assertEqual(original, (self.snap / 'latest.json').read_bytes())

    def test_symlinked_approval_root_is_untrusted_even_if_target_files_exist(self):
        redirect = self.root / 'redirect'
        redirect.symlink_to(self.approval, target_is_directory=True)
        original = (self.snap / 'latest.json').read_bytes()
        with self.assertRaisesRegex(ValueError, 'Untrusted'):
            attach(self.snap, redirect, RELEASE, now=CLOCK)
        self.assertEqual(original, (self.snap / 'latest.json').read_bytes())

    def test_utc_and_sha_contracts_fail_closed(self):
        for value in ('2026-11-12T12:00:00', '2026-11-12T13:00:00+01:00', 'garbage', None):
            with self.subTest(value=value), self.assertRaises(ValueError):
                utc_time(value)
        with self.assertRaisesRegex(ValueError, 'SHA absent'):
            attach(self.snap, self.approval, 'not-a-commit', now=CLOCK)


if __name__ == '__main__':
    unittest.main()
