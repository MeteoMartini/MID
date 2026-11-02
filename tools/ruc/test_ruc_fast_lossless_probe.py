#!/usr/bin/env python3
"""Fail-closed, read-only Fast compression metrics and exact binary tests."""
from __future__ import annotations
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ruc_fast_lossless_probe import audit, SCHEMA
from test_ruc_fast_consumer_shadow import setup_site, NATIVE


class FastOriginalCompressionQA(unittest.TestCase):
    def test_same_original_and_decoded_sha_in_all_four_native_objects(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original, _ = setup_site(root)
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS', NATIVE):
                proof = audit(root, root/'compression-qa.json')
            self.assertEqual(proof['schema'], SCHEMA)
            self.assertTrue(proof['bitIdentical'])
            self.assertEqual(proof['missingCells'], 3)
            self.assertGreater(proof['genuineZeroCells'], 0)
            self.assertFalse(proof['productionEnabled'])
            self.assertFalse(proof['consumerAdoptionVerified'])
            self.assertFalse(proof['attestedRelease'])
            self.assertEqual(len(proof['objects']), 4)
            self.assertEqual(proof['originalBytes'], sum(v['rawBytes'] for v in proof['objects'].values()))
            for record in proof['objects'].values():
                self.assertEqual(record['rawSha256'], record['decodedSha256'])
                self.assertGreater(record['chunks'], 0)
            self.assertEqual(json.loads((root/'compression-qa.json').read_text())['objects'], proof['objects'])
            self.assertEqual(original['run'], proof['run'])

    def test_tampered_fast_original_blocks_compression_qa_without_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, files = setup_site(root)
            data = files/'rapid-15m.bin'
            raw = bytearray(data.read_bytes())
            raw[-2] ^= 0x7F
            data.write_bytes(raw)
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS', NATIVE), self.assertRaises(ValueError):
                audit(root, root/'report.json')
            self.assertFalse((root/'report.json').exists())

    def test_never_overwrite_existing_report_or_follow_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            setup_site(root)
            output = root/'existing.json'
            output.write_text('retain')
            with self.assertRaisesRegex(ValueError, 'new file'):
                audit(root, output)
            self.assertEqual(output.read_text(), 'retain')
            output.unlink()
            output.symlink_to('does-not-exist')
            with self.assertRaisesRegex(ValueError, 'new file'):
                audit(root, output)


if __name__ == '__main__':
    unittest.main()
