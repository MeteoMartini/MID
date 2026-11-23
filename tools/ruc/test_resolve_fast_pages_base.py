import json
import os
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import install_fast_pages
from verify_fast_pages_publish import verify_delivery

from resolve_fast_pages_base import REPOSITORY, resolve_installer_pages

STABLE = 'a' * 40
SOURCE = 'b' * 40
DIGEST = 'sha256:' + 'c' * 64


class InstallerPagesResolverTest(unittest.TestCase):
    def setUp(self):
        self.manifest = {
            'git/ref/heads/main': {'object': {'sha': STABLE}},
            'git/ref/heads/mid-stable': {'object': {'sha': STABLE}},
            'git/commits/' + STABLE: {
                'sha': STABLE, 'message': 'Install MID v0.9.85.496', 'parents': [{'sha': SOURCE}],
            },
            'deployments?environment=github-pages&per_page=30': [
                {'id': 1, 'environment': 'github-pages', 'sha': SOURCE},
            ],
            'deployments/1/statuses?per_page=1': [
                {'state': 'success', 'log_url': f'https://github.com/{REPOSITORY}/actions/runs/2/job/3'},
            ],
            'actions/runs/2': {'id': 2, 'conclusion': 'success', 'path': '.github/workflows/install-mid.yml',
                               'head_sha': SOURCE, 'head_branch': 'main', 'run_attempt': 1,
                               'head_repository': {'full_name': REPOSITORY}},
            'actions/jobs/3': {'name': 'MID auf GitHub Pages veröffentlichen · Versuch 1', 'id': 3, 'run_id': 2, 'head_sha': SOURCE, 'run_attempt': 1, 'conclusion': 'success',
                               'steps': [{'name': 'GitHub-Pages-Deployment · Versuch 1', 'conclusion': 'success'}]},
            'actions/runs/2/artifacts?per_page=100': {'total_count': 1, 'artifacts': [
                {'id': 4, 'name': 'github-pages-2-1', 'digest': DIGEST, 'expired': False},
            ]},
        }

    def resolve(self):
        return resolve_installer_pages(STABLE, self.manifest.__getitem__)

    def test_selects_only_the_deployed_archive(self):
        proof = self.resolve()
        self.assertEqual(proof['artifact_id'], 4)
        self.assertEqual(proof['artifact_digest'], DIGEST)

    def running_job_fixture(self, job_key, path, job_name):
        self.manifest['deployments?environment=github-pages&per_page=30'].insert(
            0, {'id': 5, 'environment': 'github-pages', 'sha': STABLE})
        self.manifest['deployments/5/statuses?per_page=1'] = [{
            'state': 'in_progress',
            'log_url': f'https://github.com/{REPOSITORY}/actions/runs/6/job/7',
        }]
        self.manifest['actions/runs/6'] = {
            'id': 6, 'path': path, 'head_branch': 'main', 'head_sha': STABLE,
            'head_repository': {'full_name': REPOSITORY}, 'run_attempt': 2,
            'status': 'in_progress',
        }
        self.manifest['actions/runs/6/attempts/2/jobs?per_page=100'] = {
            'total_count': 1, 'jobs': [{
                'id': 7, 'name': job_name, 'run_id': 6, 'run_attempt': 2,
                'head_sha': STABLE, 'status': 'in_progress',
            }],
        }
        return {
            'GITHUB_ACTIONS': 'true', 'GITHUB_REPOSITORY': REPOSITORY,
            'GITHUB_WORKFLOW_REF': f'{REPOSITORY}/{path}@refs/heads/main',
            'GITHUB_JOB': job_key, 'GITHUB_RUN_ID': '6', 'GITHUB_RUN_ATTEMPT': '2',
            'GITHUB_SHA': STABLE,
        }

    def test_running_installer_and_ruc_publishers_resolve_previous_artifact(self):
        installer = '.github/workflows/install-mid.yml'
        ruc = '.github/workflows/mid-ruc-preprocess.yml'
        for key, path, name in (
            ('deploy_pages_2', installer, 'MID auf GitHub Pages veröffentlichen · Versuch 2'),
            ('deploy_pages_3', installer, 'MID auf GitHub Pages veröffentlichen · Versuch 3'),
            ('publish', ruc, 'MID + RUC kostenfrei auf GitHub Pages veröffentlichen'),
            ('publish_fast', ruc, 'Unabhängige Fast Lane geschützt auf Pages veröffentlichen'),
        ):
            with self.subTest(job=key):
                self.setUp()
                env = self.running_job_fixture(key, path, name)
                proof = resolve_installer_pages(STABLE, self.manifest.__getitem__, environment=env)
                self.assertEqual(proof['artifact_id'], 4)

    def test_installer_entry_point_passes_running_job_context(self):
        env = self.running_job_fixture('deploy_pages_2', '.github/workflows/install-mid.yml',
                                       'MID auf GitHub Pages veröffentlichen · Versuch 2')
        with (patch.dict(os.environ, env, clear=True),
              patch.object(install_fast_pages, 'gh_api', self.manifest.__getitem__),
              patch('resolve_fast_pages_base.subprocess.run') as gh):
            gh.side_effect = lambda args, **kwargs: type('Result', (), {
                'stdout': install_fast_pages.json.dumps(self.manifest[args[-1].split(REPOSITORY + '/', 1)[1]])
            })()
            self.assertEqual(install_fast_pages.active_pages(STABLE)['artifact_id'], 4)

    def test_fast_seal_verifier_resolves_baseline_in_publisher_environment(self):
        env = self.running_job_fixture('publish_fast', '.github/workflows/mid-ruc-preprocess.yml',
                                       'Unabhängige Fast Lane geschützt auf Pages veröffentlichen')
        baseline = resolve_installer_pages(STABLE, self.manifest.__getitem__, environment=env)
        with TemporaryDirectory() as temp, patch.dict(os.environ, env, clear=True):
            bundle = Path(temp)
            (bundle / 'pages-base.json').write_text(json.dumps(baseline), encoding='utf-8')
            with self.assertRaisesRegex(FileNotFoundError, 'fast-delivery-proof.json'):
                verify_delivery(bundle, bundle, STABLE, api=self.manifest.__getitem__)

    def test_running_publisher_does_not_ignore_foreign_or_ambiguous_deployment(self):
        for url in ('runs/6', 'runs/6/job/8', 'runs/9/job/7'):
            with self.subTest(url=url):
                self.setUp()
                env = self.running_job_fixture('deploy_pages_2', '.github/workflows/install-mid.yml',
                                               'MID auf GitHub Pages veröffentlichen · Versuch 2')
                self.manifest['deployments/5/statuses?per_page=1'][0]['log_url'] = (
                    f'https://github.com/{REPOSITORY}/actions/{url}')
                with self.assertRaisesRegex(ValueError, 'safe terminal state'):
                    resolve_installer_pages(STABLE, self.manifest.__getitem__, environment=env)

    def test_prepare_job_does_not_ignore_pending_deployment(self):
        env = self.running_job_fixture('prepare_fast', '.github/workflows/mid-ruc-preprocess.yml',
                                       'Aktuelle Stable-Site und geprüfte Fast Lane für Pages vorbereiten')
        with self.assertRaisesRegex(ValueError, 'safe terminal state'):
            resolve_installer_pages(STABLE, self.manifest.__getitem__, environment=env)

    def test_running_publisher_rejects_stale_attempt_and_duplicate_job(self):
        env = self.running_job_fixture('deploy_pages_2', '.github/workflows/install-mid.yml',
                                       'MID auf GitHub Pages veröffentlichen · Versuch 2')
        inv = self.manifest['actions/runs/6/attempts/2/jobs?per_page=100']
        inv['jobs'][0]['run_attempt'] = 1
        with self.assertRaisesRegex(ValueError, 'untrusted running Pages job'):
            resolve_installer_pages(STABLE, self.manifest.__getitem__, environment=env)
        inv['jobs'][0]['run_attempt'] = 2
        inv['jobs'].append({**inv['jobs'][0], 'id': 8})
        inv['total_count'] = 2
        with self.assertRaisesRegex(ValueError, 'missing or ambiguous running Pages job'):
            resolve_installer_pages(STABLE, self.manifest.__getitem__, environment=env)

    def test_full_history_page_accepts_newest_success(self):
        history = self.manifest['deployments?environment=github-pages&per_page=30']
        history.extend({'id': i, 'environment': 'github-pages', 'sha': SOURCE}
                       for i in range(2, 31))
        self.assertEqual(self.resolve()['artifact_id'], 4)

    def test_full_history_page_without_success_fails_closed(self):
        history = self.manifest['deployments?environment=github-pages&per_page=30']
        history.extend({'id': i, 'environment': 'github-pages', 'sha': SOURCE}
                       for i in range(2, 31))
        for deployment in history:
            self.manifest[f"deployments/{deployment['id']}/statuses?per_page=1"] = [
                {'state': 'failure'}]
        with self.assertRaisesRegex(ValueError, 'latest Pages deployment is not successful'):
            self.resolve()

    def no_op_fixture(self):
        self.manifest['git/commits/' + STABLE]['message'] = 'Prepare MID agent release from PR #948'
        self.manifest['commits/' + STABLE] = {
            'sha': STABLE,
            'author': {'login': 'mid-release-bot-meteomartini[bot]'},
            'committer': {'login': 'mid-release-bot-meteomartini[bot]'},
            'parents': [{'sha': SOURCE}],
            'files': [{'filename': 'MID-professional-replacement.zip', 'status': 'added'}],
        }
        self.manifest['deployments?environment=github-pages&per_page=30'][0]['sha'] = STABLE
        self.manifest['actions/runs/2']['head_sha'] = STABLE
        self.manifest['actions/jobs/3']['head_sha'] = STABLE

    def test_authenticated_bot_zip_noop_installer_resolves_deployed_site(self):
        self.no_op_fixture()
        proof = self.resolve()
        self.assertEqual(proof['source_sha'], STABLE)
        self.assertEqual(proof['stable_sha'], STABLE)
        self.assertEqual(proof['artifact_id'], 4)

    def test_noop_must_be_bot_authored_only_zip_not_a_synthetic_promotion(self):
        self.no_op_fixture()
        commit = self.manifest['commits/' + STABLE]
        commit['author']['login'] = 'untrusted-author'
        with self.assertRaisesRegex(ValueError, 'untrusted installer no-op'):
            self.resolve()
        commit['author']['login'] = 'mid-release-bot-meteomartini[bot]'
        commit['files'][0]['filename'] = 'worker.js'
        with self.assertRaisesRegex(ValueError, 'untrusted installer no-op'):
            self.resolve()

    def test_bot_zip_noop_still_requires_real_successful_installer_pages_job(self):
        self.no_op_fixture()
        self.manifest['actions/runs/2']['conclusion'] = 'failure'
        with self.assertRaisesRegex(ValueError, 'Pages deployment job'):
            self.resolve()
        self.manifest['actions/runs/2']['conclusion'] = 'success'
        self.manifest['actions/jobs/3']['head_sha'] = SOURCE
        with self.assertRaisesRegex(ValueError, 'untrusted Pages workflow'):
            self.resolve()

    def test_noop_null_actor_and_null_file_inventory_rejected_without_traceback(self):
        self.no_op_fixture()
        commit = self.manifest['commits/' + STABLE]
        commit['author'] = None
        with self.assertRaisesRegex(ValueError, 'untrusted installer no-op'):
            self.resolve()
        commit['author'] = {'login': 'mid-release-bot-meteomartini[bot]'}
        commit['files'] = None
        with self.assertRaisesRegex(ValueError, 'untrusted installer no-op'):
            self.resolve()

    def test_verified_noop_zip_can_underpin_later_fast_publication(self):
        self.no_op_fixture()
        self.fast_fixture()
        result = self.resolve()
        self.assertEqual(result['source_sha'], STABLE)
        self.assertEqual(result['artifact_digest'], DIGEST)

    def test_noop_style_commit_without_verified_zip_lineage_is_rejected(self):
        self.no_op_fixture()
        self.manifest['commits/' + STABLE]['files'] = [
            {'filename': 'worker.js', 'status': 'modified'}]
        with self.assertRaisesRegex(ValueError, 'untrusted installer no-op ZIP identity'):
            self.resolve()

    def run_level_fixture(self):
        self.manifest['deployments/1/statuses?per_page=1'][0]['log_url'] = (
            f'https://github.com/{REPOSITORY}/actions/runs/2')
        self.manifest['actions/runs/2/jobs?per_page=100'] = {
            'total_count': 1, 'jobs': [self.manifest['actions/jobs/3']]}

    def test_run_level_pages_deployment_is_accepted_with_one_verified_job(self):
        self.run_level_fixture()
        proof = self.resolve()
        self.assertEqual(proof['artifact_id'], 4)
        self.assertEqual(proof['artifact_digest'], DIGEST)

    def test_run_level_job_must_have_original_sha_and_deploy_step(self):
        self.run_level_fixture()
        job = self.manifest['actions/jobs/3']
        job['head_sha'] = STABLE
        with self.assertRaisesRegex(ValueError, 'missing or ambiguous Pages deployment job'):
            self.resolve()
        job['head_sha'] = SOURCE
        job['steps'] = [{'name': 'GitHub-Pages-Deployment · Versuch 1', 'conclusion': 'failure'}]
        with self.assertRaisesRegex(ValueError, 'missing or ambiguous Pages deployment job'):
            self.resolve()

    def test_run_level_ambiguous_and_incomplete_inventory_fail_closed(self):
        self.run_level_fixture()
        jobs = self.manifest['actions/runs/2/jobs?per_page=100']
        jobs['jobs'].append({**self.manifest['actions/jobs/3'], 'id': 7})
        jobs['total_count'] = 2
        with self.assertRaisesRegex(ValueError, 'ambiguous Pages deployment job'):
            self.resolve()
        jobs['total_count'] = 3
        with self.assertRaisesRegex(ValueError, 'incomplete Pages job inventory'):
            self.resolve()

    def test_run_level_unknown_origin_and_run_attempt_rejected(self):
        self.run_level_fixture()
        self.manifest['deployments/1/statuses?per_page=1'][0]['log_url'] = (
            'https://attacker.example/actions/runs/2')
        with self.assertRaisesRegex(ValueError, 'untrusted Pages deployment run link'):
            self.resolve()
        self.run_level_fixture()
        self.manifest['actions/jobs/3']['run_attempt'] = 2
        with self.assertRaisesRegex(ValueError, 'missing or ambiguous Pages deployment job'):
            self.resolve()

    def test_main_drift_is_rejected(self):
        self.manifest['git/ref/heads/main']['object']['sha'] = SOURCE
        with self.assertRaisesRegex(ValueError, 'lineage'):
            self.resolve()

    def test_failed_latest_pages_attempt_keeps_verified_previous_site(self):
        older = self.manifest['deployments?environment=github-pages&per_page=30'][0]
        self.manifest['deployments?environment=github-pages&per_page=30'] = [
            {'id': 19, 'sha': SOURCE, 'environment': 'github-pages'}, older]
        self.manifest['deployments/19/statuses?per_page=1'] = [
            {'state': 'failure', 'log_url': f'https://github.com/{REPOSITORY}/actions/runs/19'}]
        self.assertEqual(self.resolve()['deployment_id'], 1)
        self.assertEqual(self.resolve()['artifact_digest'], DIGEST)

    def test_newer_success_from_unrelated_source_fails_closed(self):
        older = self.manifest['deployments?environment=github-pages&per_page=30'][0]
        self.manifest['deployments?environment=github-pages&per_page=30'] = [
            {'id': 19, 'sha': 'f' * 40, 'environment': 'github-pages'}, older]
        self.manifest['deployments/19/statuses?per_page=1'] = [
            {'state': 'success', 'log_url': f'https://github.com/{REPOSITORY}/actions/runs/19'}]
        with self.assertRaisesRegex(
                ValueError,
                r'not on Stable source \(deployment_id=19, deployment_sha=f{40}\)'):
            self.resolve()

    def test_foreign_pages_diagnostic_never_echoes_untrusted_fields(self):
        older = self.manifest['deployments?environment=github-pages&per_page=30'][0]
        self.manifest['deployments?environment=github-pages&per_page=30'] = [
            {'id': 'malicious\nSECRET=do-not-log', 'sha': 'bad\nSECRET=do-not-log',
             'environment': 'github-pages'}, older]
        self.manifest['deployments/malicious\nSECRET=do-not-log/statuses?per_page=1'] = [
            {'state': 'success', 'log_url': 'https://evil.invalid/?token=do-not-log'}]
        with self.assertRaisesRegex(ValueError, 'not on Stable source') as caught:
            self.resolve()
        self.assertNotIn('do-not-log', str(caught.exception))
        self.assertIn('deployment_id=INVALID', str(caught.exception))
        self.assertIn('deployment_sha=INVALID', str(caught.exception))

    def nonpublishing_fixture(self, *, event_sha=None):
        pending = 'd' * 40
        event_sha = event_sha or pending
        self.manifest['git/ref/heads/main']['object']['sha'] = pending
        self.manifest[f'compare/{STABLE}...{pending}'] = {
            'status': 'ahead', 'merge_base_commit': {'sha': STABLE},
            'base_commit': {'sha': STABLE},
        }
        if event_sha != pending:
            self.manifest[f'compare/{event_sha}...{pending}'] = {
                'status': 'ahead', 'merge_base_commit': {'sha': event_sha},
                'base_commit': {'sha': event_sha},
            }
        original = self.manifest['deployments?environment=github-pages&per_page=30'][0]
        self.manifest['deployments?environment=github-pages&per_page=30'] = [
            {'id': 19, 'sha': event_sha, 'environment': 'github-pages'}, original]
        self.manifest['deployments/19/statuses?per_page=1'] = [{
            'state': 'success', 'log_url': f'https://github.com/{REPOSITORY}/actions/runs/19/job/20'}]
        self.manifest['actions/runs/19'] = {
            'id': 19, 'path': '.github/workflows/mid-ruc-preprocess.yml',
            'head_sha': event_sha, 'head_branch': 'main',
            'head_repository': {'full_name': REPOSITORY},
            'run_attempt': 1, 'status': 'completed', 'conclusion': 'success',
        }
        required = [
            ('RUC-Basis und laufendes Release gegen aktuellen MID-Stable-Stand prüfen', 'success'),
            ('Vor dem großen Snapshot-Download authentifizierten Contract-Hash prüfen', 'skipped'),
            ('Vorbereiteten RUC-Snapshot laden', 'skipped'),
            ('GitHub-Pages-Artefakt hochladen', 'skipped'),
            ('MID + RUC kostenfrei auf GitHub Pages veröffentlichen', 'skipped'),
            ('Nach fehlgeschlagenem Codec-Healthcheck RUC-Rohsnapshot zurückveröffentlichen', 'skipped'),
            ('Rollback-Rohdaten als GitHub-Pages-Artefakt hochladen', 'skipped'),
            ('RUC-Ergebnis eindeutig zusammenfassen', 'success'),
        ]
        self.manifest['actions/jobs/20'] = {
            'id': 20, 'run_id': 19, 'head_sha': event_sha,
            'run_attempt': 1, 'status': 'completed', 'conclusion': 'success',
            'name': 'MID + RUC kostenfrei auf GitHub Pages veröffentlichen',
            'steps': [{'name': name, 'conclusion': outcome} for name, outcome in required],
        }
        self.manifest[f'contents/.github/workflows/mid-ruc-preprocess.yml?ref={event_sha}'] = {
            'sha': 'f43d49a53a86bf41c3797a0c8c7e047a32f22863'}
        return pending

    def test_verified_nonpublishing_ruc_environment_never_hides_real_stable_artifact(self):
        for event_sha in ('d' * 40, 'e' * 40, STABLE):
            with self.subTest(event_sha=event_sha):
                self.setUp()
                pending = self.nonpublishing_fixture(event_sha=event_sha)
                proof = resolve_installer_pages(STABLE, self.manifest.__getitem__,
                                                pending_release=pending)
                self.assertEqual(proof['deployment_id'], 1)
                self.assertEqual(proof['artifact_id'], 4)
                self.assertEqual(proof['artifact_digest'], DIGEST)

    def test_nonpublication_rejects_changed_source_and_real_pages_deploy(self):
        for mutation in ('wrong_workflow_blob', 'actual_pages_deployed',
                         'bad_run_origin', 'bad_job_attempt', 'wrong_guard',
                         'unrelated_ancestor', 'wrong_log_url', 'wrong_repo'):
            with self.subTest(mutation=mutation):
                self.setUp()
                pending = self.nonpublishing_fixture()
                job = self.manifest['actions/jobs/20']
                run = self.manifest['actions/runs/19']
                if mutation == 'wrong_workflow_blob':
                    self.manifest['contents/.github/workflows/mid-ruc-preprocess.yml?ref=' + pending]['sha'] = '9' * 40
                elif mutation == 'actual_pages_deployed':
                    job['steps'][4]['conclusion'] = 'success'
                elif mutation == 'bad_run_origin':
                    run['path'] = '.github/workflows/surprise.yml'
                elif mutation == 'bad_job_attempt':
                    job['run_attempt'] = 2
                elif mutation == 'wrong_guard':
                    job['steps'][0]['conclusion'] = 'failure'
                elif mutation == 'unrelated_ancestor':
                    older = 'e' * 40
                    self.setUp()
                    pending = self.nonpublishing_fixture(event_sha=older)
                    self.manifest[f'compare/{older}...{pending}']['merge_base_commit']['sha'] = SOURCE
                elif mutation == 'wrong_log_url':
                    self.manifest['deployments/19/statuses?per_page=1'][0]['log_url'] = (
                        'https://github.com/MeteoMartini/MID/actions/runs/19')
                else:
                    run['head_repository']['full_name'] = 'Untrusted/MID'
                with self.assertRaisesRegex(ValueError, 'not on Stable source'):
                    resolve_installer_pages(STABLE, self.manifest.__getitem__,
                                            pending_release=pending)

    def test_nonpublication_does_not_skip_real_stable_ruc_publisher(self):
        self.fast_fixture()
        self.manifest['actions/runs/2']['status'] = 'completed'
        self.manifest['actions/jobs/3']['status'] = 'completed'
        self.assertEqual(self.resolve()['artifact_id'], 4)

    def test_superseded_deployment_is_rejected(self):
        self.manifest['deployments/1/statuses?per_page=1'][0]['state'] = 'inactive'
        with self.assertRaisesRegex(ValueError, 'not in a safe terminal state'):
            self.resolve()

    def test_retried_action_cannot_supply_another_attempt(self):
        self.manifest['actions/jobs/3']['run_attempt'] = 2
        with self.assertRaisesRegex(ValueError, 'attempt'):
            self.resolve()

    def test_duplicate_artifacts_fail_closed(self):
        listing = self.manifest['actions/runs/2/artifacts?per_page=100']
        listing['total_count'] += 1
        listing['artifacts'].append({**listing['artifacts'][0], 'id': 5})
        with self.assertRaisesRegex(ValueError, 'ambiguous'):
            self.resolve()

    def fast_fixture(self, *, rollback=False):
        self.manifest['deployments?environment=github-pages&per_page=30'][0]['sha'] = STABLE
        run = self.manifest['actions/runs/2']
        job = self.manifest['actions/jobs/3']
        run.update(path='.github/workflows/mid-ruc-preprocess.yml', head_sha=STABLE)
        job.update(name='Unabhängige Fast Lane geschützt auf Pages veröffentlichen', head_sha=STABLE)
        names = ('Fast-Pages-Rückfall veröffentlichen', 'Rückkehr des originalen Vollpointers prüfen') if rollback else (
            'Fast-Pages-Kandidat veröffentlichen', 'Exakten Fast-Punkt und unveränderten Vollpointer öffentlich abfragen')
        job['steps'] = [{'name': name, 'conclusion': 'success'} for name in names]
        run['conclusion'] = job['conclusion'] = 'failure' if rollback else 'success'
        artifact = self.manifest['actions/runs/2/artifacts?per_page=100']['artifacts'][0]
        artifact['name'] = 'mid-fast-rollback-2-1' if rollback else 'mid-fast-pages-2-1'

    def test_repeated_fast_uses_exact_verified_archive(self):
        self.fast_fixture()
        proof = self.resolve()
        self.assertEqual(proof['source_sha'], STABLE)
        self.assertEqual(proof['artifact_id'], 4)
        self.assertEqual(proof['artifact_digest'], DIGEST)

    def test_verified_rollback_can_be_the_next_baseline(self):
        self.fast_fixture(rollback=True)
        self.assertEqual(self.resolve()['artifact_id'], 4)
        self.manifest['actions/jobs/3']['steps'][1]['conclusion'] = 'failure'
        with self.assertRaisesRegex(ValueError, 'readback'):
            self.resolve()

    def test_fast_attempt_without_public_readback_rejected(self):
        self.fast_fixture()
        self.manifest['actions/jobs/3']['steps'].pop()
        with self.assertRaisesRegex(ValueError, 'readback'):
            self.resolve()

    def test_pending_installer_must_descend_from_actual_stable(self):
        pending = 'f' * 40
        self.manifest['git/ref/heads/main']['object']['sha'] = pending
        lineage = {'status': 'ahead', 'merge_base_commit': {'sha': STABLE},
                   'base_commit': {'sha': STABLE}}
        self.manifest[f'compare/{STABLE}...{pending}'] = lineage
        proof = resolve_installer_pages(STABLE, self.manifest.__getitem__, pending_release=pending)
        self.assertEqual(proof['artifact_id'], 4)
        lineage['merge_base_commit']['sha'] = SOURCE
        with self.assertRaisesRegex(ValueError, 'descend'):
            resolve_installer_pages(STABLE, self.manifest.__getitem__, pending_release=pending)

    def test_installer_second_slot_requires_its_own_successful_upload(self):
        job = self.manifest['actions/jobs/3']
        job['name'] = 'MID auf GitHub Pages veröffentlichen · Versuch 2'
        job['steps'] = [{'name': 'GitHub-Pages-Deployment · Versuch 2', 'conclusion': 'success'}]
        with self.assertRaisesRegex(ValueError, 'ambiguous'):
            self.resolve()
        job['steps'].append({'name': 'Pages-Artefakt nur bei Bedarf hochladen · Versuch 2',
                             'conclusion': 'success'})
        self.manifest['actions/runs/2/artifacts?per_page=100']['artifacts'][0]['name'] = 'github-pages-2-2'
        self.assertEqual(self.resolve()['artifact_id'], 4)


if __name__ == '__main__':
    unittest.main()
