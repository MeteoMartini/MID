import unittest
from unittest.mock import patch

from select_protected_d2_approval import (
    approved_artifact, approved_run, select, PATH, ARTIFACT,
)

SHA = 'a' * 40
WORKFLOW = 123
RUN = {
    'workflow_id': WORKFLOW, 'head_sha': SHA, 'head_branch': 'main',
    'status': 'completed', 'conclusion': 'success',
    'event': 'workflow_dispatch', 'path': PATH + '@refs/heads/main',
    'id': 100,
}
ART = {
    'id': 200, 'name': ARTIFACT, 'expired': False, 'digest': 'sha256:' + 'b' * 64,
    'workflow_run': {'id': 100, 'head_sha': SHA},
}


class ProtectedD2ApprovalReadbackTests(unittest.TestCase):
    def test_requires_exact_github_workflow_and_sha(self):
        self.assertTrue(approved_run(RUN, WORKFLOW, SHA))
        for override in (
            {'workflow_id': 999}, {'head_sha': 'c' * 40},
            {'head_branch': 'chatgpt/forged'}, {'status': 'in_progress'},
            {'conclusion': 'failure'}, {'event': 'pull_request'},
            {'path': '.github/workflows/untrusted.yml@refs/heads/main'},
        ):
            with self.subTest(override=override):
                self.assertFalse(approved_run({**RUN, **override}, WORKFLOW, SHA))

    def test_github_schedule_is_trusted_only_with_exact_protected_identity(self):
        self.assertTrue(approved_run({**RUN, 'event': 'schedule'}, WORKFLOW, SHA))
        self.assertFalse(approved_run({**RUN, 'head_branch': 'mid-stable'}, WORKFLOW, SHA))

    def test_no_untrusted_or_expired_artifact_can_be_promoted(self):
        self.assertTrue(approved_artifact(ART, 100, SHA))
        for override in (
            {'expired': True}, {'digest': 'sha256:bad'},
            {'name': 'other'}, {'id': 0},
            {'workflow_run': {'id': 100, 'head_sha': 'c' * 40}},
            {'workflow_run': {'id': 101, 'head_sha': SHA}},
        ):
            with self.subTest(override=override):
                self.assertFalse(approved_artifact({**ART, **override}, 100, SHA))

    def test_no_new_native_approval_before_protected_stable_convergence(self):
        with patch('select_protected_d2_approval.gh', side_effect=[
            {'object': {'sha': SHA}},
            {'object': {'sha': 'c' * 40}},
        ]):
            self.assertEqual(select(SHA)['available'], False)

    def test_explicit_requested_approval_must_not_survive_sha_drift(self):
        with patch('select_protected_d2_approval.gh', side_effect=[
            {'object': {'sha': SHA}},
            {'object': {'sha': 'c' * 40}},
        ]):
            with self.assertRaisesRegex(ValueError, 'SHA drift'):
                select(SHA, '100')

    def test_exact_run_and_artifact_binding_returns_only_signed_workflow_result(self):
        responses = [
            {'object': {'sha': SHA}}, {'object': {'sha': SHA}},
            {'id': WORKFLOW, 'path': PATH}, RUN,
            {'artifacts': [ART]},
        ]
        with patch('select_protected_d2_approval.gh', side_effect=responses) as fetch:
            selection = select(SHA, '100')
        self.assertTrue(selection['available'])
        self.assertEqual(selection['artifactId'], 200)
        self.assertEqual(selection['sourceSha'], SHA)
        self.assertEqual(fetch.call_count, 5)

    def test_rejects_untrusted_workflow_and_expired_bundle(self):
        with patch('select_protected_d2_approval.gh', side_effect=[
            {'object': {'sha': SHA}}, {'object': {'sha': SHA}},
            {'id': WORKFLOW, 'path': PATH}, RUN,
            {'artifacts': [{**ART, 'expired': True}]},
        ]):
            with self.assertRaisesRegex(ValueError, 'absent, ambiguous or expired'):
                select(SHA, '100')

    def test_ineligible_id_cannot_be_used_to_dispatch_any_workflow(self):
        for value in ('../1', '-10', '0', '1;rm -rf .', 'bad'):
            with self.subTest(value=value), self.assertRaisesRegex(ValueError, 'Unsafe explicit'):
                select(SHA, value)


if __name__ == '__main__':
    unittest.main()
