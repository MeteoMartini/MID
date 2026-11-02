"""Adversarial identity/subject tests; no attestation is fabricated for release."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from d2_release_attestation import (
    verify_signed_release_index, REPOSITORY, SIGNER_WORKFLOW, PREDICATE
)

COMMIT = 'a'*40


def signed_result(index):
    return [{'verificationResult': {
        'statement': {'predicateType': PREDICATE,
                      'subject': [{'name': index.name,
                                   'digest': {'sha256': hashlib.sha256(index.read_bytes()).hexdigest()}}]},
        'signature': {'certificate': {'sourceRepository': REPOSITORY}},
    }}]


class OriginalD2SignedGrantTests(unittest.TestCase):
    def test_exact_trusted_workflow_commit_and_subject_required(self):
        with tempfile.TemporaryDirectory() as directory:
            index = Path(directory)/'index.json'
            index.write_text('{"productionApproved":false}')
            commands = []
            def verified_command(cmd, **kwargs):
                commands.append((cmd, kwargs))
                return subprocess.CompletedProcess(cmd, 0, stdout=json.dumps(signed_result(index)))
            digest = verify_signed_release_index(index, COMMIT, runner=verified_command)
            self.assertEqual(digest, hashlib.sha256(index.read_bytes()).hexdigest())
            cmd, params = commands[0]
            self.assertEqual(cmd[:3], ['gh', 'attestation', 'verify'])
            for flag, value in [('--repo', REPOSITORY), ('--signer-workflow', SIGNER_WORKFLOW),
                                ('--source-ref', 'refs/heads/main'), ('--source-digest', COMMIT),
                                ('--predicate-type', PREDICATE)]:
                self.assertEqual(cmd[cmd.index(flag)+1], value)
            self.assertIn('--deny-self-hosted-runners', cmd)
            self.assertNotIn('--bundle', cmd)
            self.assertEqual(params['timeout'], 60)
            self.assertTrue(params['check'])

    def test_candidate_hashes_do_not_substitute_for_protected_signature(self):
        with tempfile.TemporaryDirectory() as directory:
            index = Path(directory)/'index.json'
            index.write_text('{"productionApproved":true}')
            for result in ([], [{'verificationResult': {'statement': {
                    'predicateType': PREDICATE, 'subject': [
                        {'digest': {'sha256': 'b'*64}}]}}}]):
                with self.subTest(result=result), self.assertRaises(ValueError):
                    verify_signed_release_index(
                        index, COMMIT,
                        runner=lambda *_args, **_kwargs: subprocess.CompletedProcess(
                            _args, 0, stdout=json.dumps(result)))
            with self.assertRaisesRegex(ValueError, 'verification failed'):
                verify_signed_release_index(index, COMMIT, runner=lambda *_a, **_k:
                    (_ for _ in ()).throw(subprocess.CalledProcessError(1, 'gh')))
            with self.assertRaisesRegex(ValueError, 'verification failed'):
                verify_signed_release_index(index, COMMIT, runner=lambda *_a, **_k:
                    subprocess.CompletedProcess(_a, 0, stdout='not JSON'))
            with self.assertRaisesRegex(ValueError, 'release source commit absent'):
                verify_signed_release_index(index, 'not-a-protected-sha')
            symlink = Path(directory)/'link.json'
            symlink.symlink_to(index)
            with self.assertRaisesRegex(ValueError, 'symlink'):
                verify_signed_release_index(symlink, COMMIT)


if __name__ == '__main__':
    unittest.main()
