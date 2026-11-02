"""Read-only contract: original-DWD signer is protected, isolated and SHA mirrored."""
from pathlib import Path
import re
import unittest

from d2_release_attestation import SIGNER_WORKFLOW

ROOT=Path(__file__).resolve().parents[2]
CANON=ROOT/'ci/github/workflows/mid-d2-original-release-approval.yml'
MIRROR=ROOT/'.github/workflows/mid-d2-original-release-approval.yml'


class ProtectedSignerContract(unittest.TestCase):
    def test_no_pr_entrypoint_no_production_rights_and_pinned_actions(self):
        source=CANON.read_text()
        self.assertEqual(source,MIRROR.read_text())
        self.assertEqual(SIGNER_WORKFLOW,'MeteoMartini/MID/.github/workflows/'+CANON.name)
        self.assertIn('  workflow_dispatch:',source)
        self.assertNotIn('pull_request:',source)
        self.assertNotIn('workflow_run:',source)
        self.assertNotIn('pages: write',source)
        self.assertNotIn('contents: write',source)
        self.assertNotIn('deploy-pages@',source)
        self.assertNotIn('wrangler pages deploy',source)
        self.assertNotIn('secrets.',source)
        self.assertIn("github.ref == 'refs/heads/main'",source)
        self.assertIn('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"',source)
        self.assertIn('refs/heads/mid-stable',source)
        self.assertIn("test -s AGENTS.md",source)
        self.assertIn('attestations: write',source)
        self.assertIn('id-token: write',source)
        self.assertIn('Original DWD',source.upper().replace('ORIGINAL DWD','Original DWD'))
        self.assertIn('d2_native_eight_bundle.py',source)
        self.assertIn('approve_d2_originals_protected.py',source)
        self.assertIn('actions/attest@1e69f48acb82d1966a394da916b4c1698aa569d6',source)
        self.assertIn('subject-path: d2-original-approved/index.json',source)
        for use in re.findall(r'uses:\s+([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)@([a-f0-9]+)',source):
            self.assertEqual(len(use[1]),40)
        self.assertEqual(source.count('workflow_dispatch:'),1)


if __name__=='__main__':
    unittest.main()
