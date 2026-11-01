#!/usr/bin/env python3
"""Offline, adversarial checks for GitHub RUC observer evidence collection."""
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from zipfile import ZipFile

sys.path.insert(0, str(Path(__file__).parent))
from ruc_github_observer_collect import (collect, parse_observed_runs, safe_redirect_host,
                                         MAX_PAGES, MAX_ZIP_BYTES)
from test_ruc_observer_artifact_bundle import status, directory, readback

CUTOFF = '2026-11-01T12:00:00Z'
SHA = 'a' * 40


def run(run_id=42, attempt=1, when='2026-11-01T10:20:00Z', **overrides):
    obj={'id':run_id,'run_attempt':attempt,'created_at':when,'head_branch':'main',
         'head_sha':SHA,'event':'schedule','status':'completed','conclusion':'success'}
    obj.update(overrides)
    return obj


def zipped(run_id=42, attempt=1, *, valid=True):
    prefix=f'{run_id}-{attempt}'
    b=io.BytesIO()
    with ZipFile(b,'w') as z:
        s=status(run_id,attempt,True,1,True)
        if not valid: s['mainSha']='b'*40
        z.writestr(f'ruc-observer-status-{prefix}.json',json.dumps(s))
        z.writestr(f'dwd-observation-{prefix}.jsonl',json.dumps(directory())+'\n')
        z.writestr(f'ruc-e2e-{prefix}.json',json.dumps(readback()))
    return b.getvalue()


class Reader:
    def __init__(self, runs=None, artifacts=None, zips=None):
        self.runs = list(runs if runs is not None else [run()])
        self.artifacts=artifacts or {}
        self.zips=zips or {}
    def list_runs(self,page):
        if page==1:return {'workflow_runs':list(self.runs)}
        return {'workflow_runs':[]}
    def list_artifacts(self,run_id):
        rows=self.artifacts.get(run_id,[])
        return {'total_count':len(rows),'artifacts':rows}
    def download_zip(self,artifact_id):return self.zips[artifact_id]


def artifact(id=111, run_id=42, attempt=1, data=None, **extra):
    if data is None:data=zipped(run_id,attempt)
    record={'id':id,'name':f'dwd-ruc-observation-{run_id}-{attempt}',
            'size_in_bytes':len(data),'expired':False,'digest':'sha256:'+hashlib.sha256(data).hexdigest()}
    record.update(extra)
    return record


class Collector(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
    def check(self,client):return collect(client,cutoff_utc=CUTOFF,output_dir=self.root/'report')

    def test_real_zip_is_verified_preserved_and_not_slo(self):
        raw=zipped(); client=Reader(artifacts={42:[artifact(data=raw)]}, zips={111:raw})
        summary=self.check(client)
        self.assertEqual(summary['directorySamples'],1)
        self.assertEqual(summary['publicReadbacks'],1)
        self.assertEqual(summary['missingGitHubRunAttemptArtifacts'],0)
        self.assertTrue(summary['observerRunRecords'][0]['archiveDigestVerified'])
        self.assertFalse(summary['productionSloAuthorized'])
        self.assertEqual((self.root/'report'/'directory.jsonl').read_text().count('\n'),1)
        self.assertEqual((self.root/'report'/'artifacts'/'dwd-ruc-observation-42-1.zip').read_bytes(),raw)

    def test_missing_zip_is_gap_not_zero(self):
        report=self.check(Reader())
        self.assertEqual(report['missingGitHubRunAttemptArtifacts'],1)
        self.assertEqual(report['directorySamples'],0)
        self.assertEqual(report['publicReadbacks'],0)
        self.assertEqual(report['observerRunRecords'][0]['artifactState'],'missing-or-unavailable')

    def test_api_tampered_digest_rejects_atomically(self):
        raw=zipped(); bad=artifact(data=raw,digest='sha256:'+'f'*64)
        with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):
            self.check(Reader(artifacts={42:[bad]},zips={111:raw}))
        self.assertFalse((self.root/'report').exists())

    def test_invalid_zip_identity_rejects(self):
        raw=zipped(77)
        with self.assertRaisesRegex(ValueError,'unsafe|mismatch'):
            self.check(Reader(artifacts={42:[artifact(data=raw)]},zips={111:raw}))
        self.assertFalse((self.root/'report').exists())

    def test_invalid_original_source_sha_rejects(self):
        raw=zipped(valid=False)
        with self.assertRaisesRegex(ValueError,'SHA consensus'):
            self.check(Reader(artifacts={42:[artifact(data=raw)]},zips={111:raw}))

    def test_expired_zip_is_gap(self):
        report=self.check(Reader(artifacts={42:[artifact(expired=True)]}))
        self.assertEqual(report['missingGitHubRunAttemptArtifacts'],1)
        self.assertEqual(report['observerRunRecords'][0]['artifactState'],'expired')

    def test_incomplete_run_is_no_download(self):
        client=Reader(runs=[run(status='in_progress',conclusion=None)],artifacts={42:[artifact()]})
        report=self.check(client)
        self.assertEqual(report['observerRunRecords'][0]['artifactState'],'incomplete-run')
        self.assertEqual(report['directorySamples'],0)

    def test_failed_github_run_never_claims_positive_observation(self):
        raw=zipped()
        client=Reader(runs=[run(conclusion='failure')],artifacts={42:[artifact(data=raw)]},zips={111:raw})
        result=self.check(client)
        self.assertEqual(result['observerRunRecords'][0]['artifactState'],'non-success-run')
        self.assertEqual(result['directorySamples'],0)

    def test_github_artifact_wrong_run_identity_rejected(self):
        raw=zipped()
        x=artifact(data=raw,workflow_run={'id':100})
        with self.assertRaisesRegex(ValueError,'identity mismatch'):
            self.check(Reader(artifacts={42:[x]},zips={111:raw}))

    def test_untrusted_sha_or_event_rejected(self):
        for value in (run(head_sha='a'),run(event='pull_request'),run(head_branch='other'),run(id=True)):
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_observed_runs(Reader(runs=[value]), __import__('datetime').datetime(2026,11,1,12,tzinfo=__import__('datetime').timezone.utc))

    def test_duplicate_api_run_rejected(self):
        with self.assertRaisesRegex(ValueError,'duplicate'):
            self.check(Reader(runs=[run(),run()]))

    def test_duplicate_api_artifacts_rejected(self):
        with self.assertRaisesRegex(ValueError,'duplicate'):
            self.check(Reader(artifacts={42:[artifact(),artifact(id=112)]}))

    def test_reject_unbounded_artifact_listing(self):
        class Bad(Reader):
            def list_artifacts(self,run_id):return {'total_count':101,'artifacts':[]}
        with self.assertRaisesRegex(ValueError,'unbounded'):
            self.check(Bad())

    def test_reject_size_budget_before_download(self):
        with self.assertRaisesRegex(ValueError,'size'):
            self.check(Reader(artifacts={42:[artifact(size_in_bytes=MAX_ZIP_BYTES+1)]}))

    def test_reject_incomplete_pagination(self):
        class Infinite(Reader):
            def list_runs(self,p):
                return {'workflow_runs':[run(run_id=p*100+i) for i in range(100)]}
        with self.assertRaisesRegex(ValueError,'unbounded|pagination'):
            parse_observed_runs(Infinite(),__import__('datetime').datetime(2026,11,1,12,tzinfo=__import__('datetime').timezone.utc))

    def test_old_records_outside_window_not_counted(self):
        result=self.check(Reader(runs=[run(when='2026-10-01T09:00:00Z')]))
        self.assertEqual(result['expectedGitHubRunAttempts'],0)
        self.assertEqual(result['distinctGitHubRunsSelected'],0)

    def test_redirect_host_security(self):
        self.assertTrue(safe_redirect_host('https://productionresultssa0.blob.core.windows.net/token'))
        self.assertTrue(safe_redirect_host('https://api.github.com/repos/MeteoMartini/MID/actions/runs'))
        for s in ['http://evil.githubusercontent.com/foo','https://github.com.evil.com/foo',
                  'https://user:pass@github.com/','https://evil.com/','https://github.com/x#fragment']:
            self.assertFalse(safe_redirect_host(s),s)

    def test_existing_output_not_overwritten(self):
        (self.root/'report').mkdir()
        with self.assertRaisesRegex(ValueError,'output'):
            self.check(Reader())

    def test_two_runs_same_original_sample_refused(self):
        raw=zipped(); second=zipped(43)
        client=Reader(runs=[run(),run(43)],artifacts={42:[artifact(data=raw)],43:[artifact(112,43,data=second)]},zips={111:raw,112:second})
        with self.assertRaisesRegex(ValueError,'duplicate'):
            self.check(client)


if __name__=='__main__':unittest.main()
