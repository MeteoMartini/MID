"""Fail-closed RUC activation tests using the real Python/JavaScript fixture."""
from __future__ import annotations
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from test_prepare_lossless_snapshot import create_fixture
from activate_lossless_snapshot import activate_snapshot, ACTIVE_PROFILE

ROOT=Path(__file__).resolve().parents[2]
class ActivationTests(unittest.TestCase):
    def setup_paths(self,root):
        create_fixture(root)
        source=root/'source';candidate=root/'candidate'
        result=subprocess.check_output(['node','tools/ruc/verify_lossless_migration.mjs',str(source),str(candidate)],
                                       cwd=ROOT,text=True,timeout=60)
        proof=root/'proof.json';proof.write_text(result)
        return source,candidate,proof

    def test_real_proof_activation_and_byte_identical_sources(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);source,candidate,proof=self.setup_paths(root)
            before=(source/'latest.json').read_bytes();other=(candidate/'latest.json').read_bytes()
            result=activate_snapshot(source,candidate,proof,root/'active')
            meta=json.loads((root/'active/latest.json').read_bytes())
            self.assertEqual(meta['storageProfile'],ACTIVE_PROFILE)
            self.assertTrue(meta['migration']['productionEnabled'])
            self.assertEqual(meta['pages']['losslessTransport']['mode'],'replacement')
            self.assertFalse(meta['pages']['losslessTransport']['rawRetained'])
            self.assertEqual(result['fullDecodedParts'],sum(len(spec['compressedPages']['parts']) for spec in
                (meta['deterministic'],meta['epsSummary'])))
            self.assertLess(result['physicalBytes'],900_000_000)
            self.assertEqual((source/'latest.json').read_bytes(),before)
            self.assertEqual((candidate/'latest.json').read_bytes(),other)
            self.assertTrue((source/'runs/test/deterministic/0000.bin').exists())
            self.assertFalse((root/'active/runs/test/deterministic/0000.bin').exists())
            with self.assertRaises(ValueError):activate_snapshot(source,candidate,proof,root/'active')

    def test_corruption_proof_or_profile_never_publishes(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);source,candidate,proof=self.setup_paths(root)
            original=proof.read_text()
            for patch in [{'fullDecodedParts':0},{'productionEnabled':True},{'sourceManifestSha256':'0'*64},
                          {'recordComparisons':-1}]:
                data=json.loads(original);data.update(patch);proof.write_text(json.dumps(data))
                with self.assertRaises(ValueError):activate_snapshot(source,candidate,proof,root/'active')
                self.assertFalse((root/'active').exists())
            proof.write_text(original)
            meta_path=candidate/'latest.json';meta=json.loads(meta_path.read_text());meta['storageProfile']='invalid'
            meta_path.write_text(json.dumps(meta))
            with self.assertRaises(ValueError):activate_snapshot(source,candidate,proof,root/'active')
            self.assertFalse((root/'active').exists())

if __name__=='__main__':unittest.main()
