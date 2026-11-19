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
            'actions/jobs/3': {'id': 3, 'run_id': 2, 'head_sha': SOURCE, 'run_attempt': 1, 'conclusion': 'success',
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


if __name__ == '__main__':
    unittest.main()
