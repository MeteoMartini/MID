"""Non-publishable raw staging remains distinct from the 900-MB output."""
import json
from pathlib import Path
import tempfile
import unittest
import subprocess
from test_lossless_inventory import fixture
from prepare_lossless_snapshot import prepare_snapshot
from lossless_inventory import verify_inventory
import test_activate_lossless_snapshot as activation_fixture
from activate_lossless_snapshot import activate_snapshot


class StagingTests(unittest.TestCase):
    def test_real_js_proof_and_activation_keep_final_budget_and_profile(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            source, _, _ = activation_fixture.ActivationTests().setup_paths(root)
            meta = json.loads((source / 'latest.json').read_text())
            meta['storageProfile'] = 'pages-codec-staging-v1'
            meta['pages'].update(profile='pages-codec-staging-v1', stagingOnly=True)
            (source / 'latest.json').write_text(json.dumps(meta))
            prepare_snapshot(source, root / 'staging-candidate')
            proof = subprocess.check_output(['node', 'tools/ruc/verify_lossless_migration.mjs', str(source), str(root / 'staging-candidate')], cwd=activation_fixture.ROOT, text=True, timeout=60)
            (root / 'staging-proof.json').write_text(proof)
            report = activate_snapshot(source, root / 'staging-candidate', root / 'staging-proof.json', root / 'active')
            active = json.loads((root / 'active/latest.json').read_text())
            self.assertEqual(active['storageProfile'], 'pages-lossless-v1')
            self.assertNotIn('stagingOnly', active['pages'])
            self.assertEqual(report['budgetBytes'], 900_000_000)
            self.assertLess(report['physicalBytes'], report['budgetBytes'])

    def test_explicit_staging_becomes_normal_candidate_without_staging_flag(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); source = root / 'source'; meta = fixture(source)
            meta['storageProfile'] = 'pages-codec-staging-v1'
            meta['pages'].update(profile='pages-codec-staging-v1', stagingOnly=True)
            (source / 'latest.json').write_text(json.dumps(meta))
            before = (source / 'latest.json').read_bytes()
            report = prepare_snapshot(source, root / 'candidate')
            candidate = json.loads((root / 'candidate/latest.json').read_bytes())
            self.assertEqual(candidate['storageProfile'], 'pages-lossless-candidate-v1')
            self.assertNotIn('stagingOnly', candidate['pages'])
            self.assertIs(candidate['migration']['productionEnabled'], False)
            self.assertEqual(candidate['pages']['budgetBytes'], 900_000_000)
            self.assertLess(report['physicalBytes'], 900_000_000)
            self.assertEqual((source / 'latest.json').read_bytes(), before)

    def test_staging_requires_explicit_boolean_and_profile(self):
        for marker in (None, False, 'true', 1):
            with self.subTest(marker=marker), tempfile.TemporaryDirectory() as td:
                source = Path(td) / 'source'; meta = fixture(source)
                meta['storageProfile'] = 'pages-codec-staging-v1'
                meta['pages'].update(profile='pages-codec-staging-v1', stagingOnly=marker)
                with self.assertRaises(ValueError):
                    verify_inventory(meta, source)

    def test_publication_budget_cannot_be_raised_for_staging(self):
        with tempfile.TemporaryDirectory() as td:
            source = Path(td) / 'source'; meta = fixture(source)
            meta['storageProfile'] = 'pages-codec-staging-v1'
            meta['pages'].update(profile='pages-codec-staging-v1', stagingOnly=True, budgetBytes=901_000_000)
            with self.assertRaisesRegex(ValueError, 'publication budget'):
                verify_inventory(meta, source)


if __name__ == '__main__':
    unittest.main()
