#!/usr/bin/env python3
"""Adversarial offline tests: ZIP, provenance, missing status, no synthetic data."""
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from zipfile import ZipFile, ZipInfo

sys.path.insert(0, str(Path(__file__).parent))
from ruc_observer_artifact_bundle import bundle, json_strict, read_artifact

SHA = 'a' * 40
TIME = '2026-10-31T10:20:00Z'
RUN = '2026-10-31T10:00'


def status(run_id=42, attempt=1, ready=True, count=1, has_readback=True,
           same_run=True):
    return {
        'schema': 'mid.ruc.observer-execution.v1',
        'runId': run_id, 'runAttempt': attempt,
        'checkoutSha': SHA, 'mainSha': SHA, 'stableSha': SHA,
        'lineageReady': ready,
        'result': ('directory-and-pages-worker-observed' if ready and has_readback and same_run
                   else 'directory-with-partial-public-readback' if ready and has_readback
                   else 'directory-only-no-public-readback' if ready and count
                   else 'missing-directory-evidence' if ready else 'release-drift-or-unverified-lineage'),
        'directorySamples': count if ready else 0,
        'directoryObserved': bool(count) if ready else False,
        'pagesObservedValid': ready and has_readback,
        'workerObservedValid': ready and has_readback,
        'sameRunObserved': ready and has_readback and same_run,
        'publicReadbackCaptured': ready and has_readback,
    }


def directory():
    return {
        'schema': 'mid.ruc.dwd-directory-observation.v1',
        'run': RUN, 'observedAtUtc': TIME,
        'firstAdvertisedField': True,
        'stages': {'0-6h': {'directoryComplete': True}},
        'eps': {'headerVerified': False, 'membersComplete': None},
    }


def readback():
    return {'schema': 'mid.ruc.e2e-readback-shadow.v1',
            'observedAtUtc': TIME, 'pagesValid': True, 'workerValid': True,
            'sameRun': True, 'pagesRun': RUN, 'workerRun': RUN}


def artifact(root, run_id=42, attempt=1, *, with_status=True, ready=True,
             with_directory=True, with_readback=True, edits=None):
    p = Path(root) / f'dwd-ruc-observation-{run_id}-{attempt}.zip'
    obj = status(run_id, attempt, ready, 1 if with_directory else 0, with_readback)
    if edits:
        obj.update(edits)
    with ZipFile(p, 'w') as z:
        prefix = f'{run_id}-{attempt}'
        if with_status:
            z.writestr(f'ruc-observer-status-{prefix}.json', json.dumps(obj))
        if with_directory:
            z.writestr(f'dwd-observation-{prefix}.jsonl', json.dumps(directory())+'\n')
        if with_readback:
            z.writestr(f'ruc-e2e-{prefix}.json', json.dumps(readback()))
    return p


class BundleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def test_real_status_and_matching_samples_are_retained_not_slo(self):
        path = artifact(self.root)
        manifest, dirs, reads = bundle([path], TIME, [{'runId': 42, 'runAttempt': 1}])
        self.assertEqual(len(dirs), 1)
        self.assertEqual(len(reads), 1)
        self.assertEqual(manifest['directorySamples'], 1)
        self.assertEqual(manifest['expectedGitHubRunAttempts'], 1)
        self.assertEqual(manifest['missingGitHubRunAttemptArtifacts'], 0)
        self.assertFalse(manifest['productionSloAuthorized'])
        self.assertFalse(manifest['originalDwdGribVerified'])

    def test_skipped_release_drift_is_no_data(self):
        p = artifact(self.root, ready=False, with_directory=False, with_readback=False)
        manifest, dirs, reads = bundle([p], TIME)
        self.assertEqual((dirs, reads), ([], []))
        self.assertEqual(manifest['releaseDriftOrUnmeasuredRuns'], 1)
        self.assertIsNone(manifest['missingGitHubRunAttemptArtifacts'])
        self.assertFalse(manifest['githubRunManifestProvided'])

    def test_older_success_without_status_is_not_counted(self):
        p = artifact(self.root, with_status=False, with_readback=False)
        manifest, dirs, reads = bundle([p], TIME)
        self.assertEqual((dirs, reads), ([], []))
        self.assertEqual(manifest['releaseDriftOrUnmeasuredRuns'], 1)

    def test_missing_artifact_is_explicit_not_zero(self):
        manifest, dirs, reads = bundle([], TIME, [{'runId': 77, 'runAttempt': 1}])
        self.assertEqual(manifest['missingGitHubRunAttemptArtifacts'], 1)
        self.assertEqual(manifest['directorySamples'], 0)
        self.assertFalse(manifest['productionSloAuthorized'])

    def test_sha_drift_false_claim_fails(self):
        p = artifact(self.root, edits={'mainSha': 'b'*40})
        with self.assertRaisesRegex(ValueError, 'SHA consensus'):
            read_artifact(p)

    def test_status_vs_raw_mismatch_fails(self):
        p = artifact(self.root, edits={'directorySamples': 2})
        with self.assertRaisesRegex(ValueError, 'directory count'):
            read_artifact(p)

    def test_release_skip_with_directory_fails(self):
        p = artifact(self.root, ready=False, with_directory=True, with_readback=False)
        with self.assertRaisesRegex(ValueError, 'release drift'):
            read_artifact(p)

    def test_run_attempt_tampering_fails(self):
        p = artifact(self.root, edits={'runId': 43})
        with self.assertRaisesRegex(ValueError, 'run/attempt mismatch'):
            read_artifact(p)

    def test_noncanonical_and_traversal_members_fail(self):
        p = self.root/'dwd-ruc-observation-42-1.zip'
        with ZipFile(p, 'w') as z:
            z.writestr('../ruc-observer-status-42-1.json', '{}')
        with self.assertRaisesRegex(ValueError, 'unsafe'):
            read_artifact(p)

    def test_zip_duplicate_entry_fails(self):
        p = self.root/'dwd-ruc-observation-42-1.zip'
        with ZipFile(p, 'w') as z:
            with __import__('warnings').catch_warnings():
                __import__('warnings').simplefilter('ignore', UserWarning)
                z.writestr('ruc-observer-status-42-1.json', '{}')
                z.writestr('ruc-observer-status-42-1.json', '{}')
        with self.assertRaisesRegex(ValueError, 'unsafe'):
            read_artifact(p)

    def test_oversize_zip_member_fails_before_decompression(self):
        p = self.root/'dwd-ruc-observation-42-1.zip'
        with ZipFile(p, 'w') as z:
            z.writestr('ruc-observer-status-42-1.json', 'a'*129_000)
        with self.assertRaisesRegex(ValueError, 'unsafe'):
            read_artifact(p)

    def test_strict_json_rejects_duplicates_and_nonfinite(self):
        with self.assertRaisesRegex(ValueError, 'duplicate JSON key'):
            json_strict(b'{"a":1,"a":2}')
        with self.assertRaisesRegex(ValueError, 'nonfinite'):
            json_strict(b'{"a":NaN}')

    def test_manifest_rejects_unknown_artifact(self):
        p = artifact(self.root)
        with self.assertRaisesRegex(ValueError, 'non-manifest'):
            bundle([p], TIME, [{'runId': 99, 'runAttempt': 1}])

    def test_later_attempt_supersedes_old_not_double_counts(self):
        # Later attempt has no data; deliberately must NOT silently fall back.
        first = artifact(self.root, attempt=1)
        second = artifact(self.root, attempt=2, ready=False,
                          with_directory=False, with_readback=False)
        manifest, dirs, reads = bundle([first, second], TIME)
        self.assertEqual((dirs, reads), ([], []))
        self.assertEqual(manifest['supersededAttemptCount'], 1)
        self.assertEqual(manifest['releaseDriftOrUnmeasuredRuns'], 1)

    def test_duplicate_observed_timestamp_is_rejected(self):
        a = artifact(self.root, run_id=42)
        b = artifact(self.root, run_id=43)
        with self.assertRaisesRegex(ValueError, 'duplicate DWD'):
            bundle([a,b], TIME)

    def test_future_observation_rejected(self):
        path = artifact(self.root)
        with self.assertRaisesRegex(ValueError, 'after chosen'):
            bundle([path], '2026-10-31T09:00:00Z')

    def test_invalid_source_manifest_rejected(self):
        with self.assertRaisesRegex(ValueError, 'manifest row'):
            bundle([], TIME, [{'runId': True, 'runAttempt': 1}])


if __name__ == '__main__':
    unittest.main()
