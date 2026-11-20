import unittest

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
            'deployments?environment=github-pages&per_page=1': [
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

    def no_op_fixture(self):
        self.manifest['git/commits/' + STABLE]['message'] = 'Prepare MID agent release from PR #948'
        self.manifest['commits/' + STABLE] = {
            'sha': STABLE,
            'author': {'login': 'mid-release-bot-meteomartini[bot]'},
            'committer': {'login': 'mid-release-bot-meteomartini[bot]'},
            'parents': [{'sha': SOURCE}],
            'files': [{'filename': 'MID-professional-replacement.zip', 'status': 'added'}],
        }
        self.manifest['deployments?environment=github-pages&per_page=1'][0]['sha'] = STABLE
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

    def test_noop_style_commit_without_verified_zip_lineage_is_rejected(self):
        self.manifest['git/commits/' + STABLE]['message'] = 'Prepare MID agent release from PR #948'
        with self.assertRaisesRegex(KeyError, 'commits/'):
            self.resolve()

    def test_main_drift_is_rejected(self):
        self.manifest['git/ref/heads/main']['object']['sha'] = SOURCE
        with self.assertRaisesRegex(ValueError, 'lineage'):
            self.resolve()

    def test_superseded_deployment_is_rejected(self):
        self.manifest['deployments/1/statuses?per_page=1'][0]['state'] = 'inactive'
        with self.assertRaisesRegex(ValueError, 'not successful'):
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
        self.manifest['deployments?environment=github-pages&per_page=1'][0]['sha'] = STABLE
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
        self.assertEqual(self.resolve()['source_sha'], STABLE)

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
