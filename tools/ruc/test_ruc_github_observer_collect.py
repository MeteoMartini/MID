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
                                         MAX_PAGES, MAX_ZIP_BYTES, select_bounded_polls, index_repository_artifacts)
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
        self.repository_artifact_calls = 0
    def list_runs(self,page):
        if page==1:return {'workflow_runs':list(self.runs)}
        return {'workflow_runs':[]}
    def list_repository_artifacts(self,page):
        self.repository_artifact_calls += 1
        rows=[row for group in self.artifacts.values() for row in group]
        return {'total_count':len(rows),'artifacts':rows if page == 1 else []}
    def download_zip(self,artifact_id):return self.zips[artifact_id]


def artifact(id=111, run_id=42, attempt=1, data=None, **extra):
    if data is None:data=zipped(run_id,attempt)
    record={'id':id,'name':f'dwd-ruc-observation-{run_id}-{attempt}',
            'size_in_bytes':len(data),'expired':False,'digest':'sha256:'+hashlib.sha256(data).hexdigest(),
            'workflow_run':{'id':run_id,'head_sha':SHA,'head_branch':'main'}}
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

    def test_github_run_head_and_zip_release_source_must_agree(self):
        raw=zipped()
        client=Reader(runs=[run(head_sha='f'*40)],artifacts={42:[artifact(data=raw)]},zips={111:raw})
        with self.assertRaisesRegex(ValueError,'observer status SHA differs'):
            self.check(client)
        self.assertFalse((self.root/'report').exists())

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

    def test_trusted_watchdog_completed_workflow_run_may_be_observed(self):
        # The workflow itself gates the upstream source, event and branch.
        result=self.check(Reader(runs=[run(event='workflow_run')]))
        self.assertEqual(result['expectedGitHubRunAttempts'],1)
        self.assertEqual(result['directorySamples'],0)
        self.assertFalse(result['productionSloAuthorized'])

    def test_duplicate_api_run_rejected(self):
        with self.assertRaisesRegex(ValueError,'duplicate'):
            self.check(Reader(runs=[run(),run()]))

    def test_duplicate_api_artifacts_rejected(self):
        with self.assertRaisesRegex(ValueError,'duplicate'):
            self.check(Reader(artifacts={42:[artifact(),artifact(id=112)]}))

    def test_reject_unbounded_artifact_listing(self):
        class Bad(Reader):
            def list_repository_artifacts(self,page):return {'total_count':101,'artifacts':[]}
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

    def test_schedule_and_fallback_same_quarter_are_not_independent(self):
        source=[run(42, when='2026-11-01T10:18:00Z'),
                run(43, when='2026-11-01T10:23:00Z', event='workflow_run')]
        chosen, suppressed=select_bounded_polls([
            {'runId':x['id'], 'runAttempt':1,'createdAtUtc':x['created_at'],
             'event':x['event'],'status':'completed','conclusion':x['conclusion']} for x in source])
        self.assertEqual([x['runId'] for x in chosen],[42])
        self.assertEqual([x['runId'] for x in suppressed],[43])
        out=self.check(Reader(runs=source))
        self.assertEqual(out['expectedGitHubRunAttempts'],1)
        self.assertEqual(out['supersededSameSlotRuns'],1)
        self.assertEqual(out['originalGithubObserverRunsInWindow'],2)
        self.assertEqual(out['directorySamples'],0)
        self.assertFalse(out['productionSloAuthorized'])

    def test_successful_fallback_wins_over_failed_schedule(self):
        rows=[run(42,when='2026-11-01T10:18:00Z',conclusion='failure'),
              run(43,when='2026-11-01T10:23:00Z',event='workflow_run')]
        src=[{'runId':x['id'],'runAttempt':1,'createdAtUtc':x['created_at'],
              'event':x['event'],'status':x['status'],'conclusion':x['conclusion']} for x in rows]
        chosen,suppressed=select_bounded_polls(src)
        self.assertEqual([x['runId'] for x in chosen],[43])
        self.assertEqual([x['runId'] for x in suppressed],[42])

    def test_fallback_is_selected_when_schedule_is_missing(self):
        result=self.check(Reader(runs=[run(event='workflow_run',when='2026-11-01T10:23:00Z')]))
        self.assertEqual(result['expectedGitHubRunAttempts'],1)
        self.assertEqual(result['supersededSameSlotRuns'],0)

    def test_bulk_repository_inventory_replaces_per_run_calls(self):
        client=Reader(runs=[run(42,when='2026-11-01T10:18:00Z'),
                            run(43,when='2026-11-01T10:48:00Z')])
        report=self.check(client)
        self.assertEqual(report['expectedGitHubRunAttempts'],2)
        self.assertEqual(client.repository_artifact_calls,1)
        self.assertEqual(report['missingGitHubRunAttemptArtifacts'],2)
        self.assertEqual(report['artifactInventoryFetchMode'],'bounded-repository-pagination')

    def test_bulk_inventory_requires_full_pages_and_consistent_total(self):
        class MissingPage(Reader):
            def list_repository_artifacts(self,page):
                return {'total_count':101,'artifacts':[]}
        with self.assertRaisesRegex(ValueError,'pagination'):
            self.check(MissingPage())
        class CountChanges(Reader):
            def list_repository_artifacts(self,page):
                if page==1:
                    return {'total_count':101,'artifacts':[{'id':i,'name':'other'} for i in range(100)]}
                return {'total_count':102,'artifacts':[{'id':101,'name':'other'}]}
        with self.assertRaisesRegex(ValueError,'pagination changed'):
            self.check(CountChanges())

    def test_bulk_duplicate_ids_and_foreign_parent_are_rejected(self):
        class DuplicateIDs(Reader):
            def list_repository_artifacts(self,page):
                return {'total_count':2,'artifacts':[{'id':7,'name':'other'},{'id':7,'name':'other'}]}
        with self.assertRaisesRegex(ValueError,'duplicate GitHub artifact ID'):
            self.check(DuplicateIDs())
        wrong=artifact(workflow_run={'id':99})
        with self.assertRaisesRegex(ValueError,'identity mismatch'):
            self.check(Reader(artifacts={42:[wrong]}))

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
