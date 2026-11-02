"""Original DWD promotion must be impossible outside protected main actor."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from approve_d2_originals_protected import prepare

REPO='MeteoMartini/MID'
SHA='a'*40


class OriginalD2TrustedSignerTests(unittest.TestCase):
    def test_non_protected_event_and_wrong_sha_fail_before_writes(self):
        with tempfile.TemporaryDirectory() as dirname:
            folder=Path(dirname)
            original=folder/'candidate';original.mkdir()
            inventory=folder/'inventory.json';inventory.write_text('{}')
            environment={'GITHUB_EVENT_NAME':'workflow_dispatch',
                         'GITHUB_REF':'refs/heads/main',
                         'GITHUB_SHA':SHA,'GITHUB_REPOSITORY':REPO}
            variants=[
                {'GITHUB_EVENT_NAME':'pull_request'},
                {'GITHUB_REF':'refs/heads/chatgpt/attacker'},
                {'GITHUB_SHA':'b'*40},
                {'GITHUB_REPOSITORY':'attacker/MID'},
            ]
            for changes in variants:
                with self.subTest(changes=changes),patch.dict('os.environ',{**environment,**changes},clear=True):
                    output=folder/'approved'
                    with self.assertRaisesRegex(ValueError,'Protected main'):
                        prepare(original,inventory,output,SHA)
                    self.assertFalse(output.exists())
            with patch.dict('os.environ',environment,clear=True):
                with self.assertRaisesRegex(ValueError,'source SHA'):
                    prepare(original,inventory,folder/'approved','invalid')
                self.assertFalse((folder/'approved').exists())

    def test_unsourced_pilot_cannot_be_signed_even_on_protected_main(self):
        with tempfile.TemporaryDirectory() as dirname:
            folder=Path(dirname)
            original=folder/'candidate';original.mkdir()
            inventory=folder/'inventory.json';inventory.write_text('{}')
            env={'GITHUB_EVENT_NAME':'workflow_dispatch',
                 'GITHUB_REF':'refs/heads/main',
                 'GITHUB_SHA':SHA,'GITHUB_REPOSITORY':REPO}
            with patch.dict('os.environ',env,clear=True):
                with self.assertRaises(ValueError):
                    prepare(original,inventory,folder/'approved',SHA)
            self.assertFalse((folder/'approved').exists())


if __name__=='__main__':
    unittest.main()
