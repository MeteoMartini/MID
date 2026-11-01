#!/usr/bin/env python3
"""Offline read-only test of EPS20 phase-timing instrumentation in source AST.

Executes the real production writer from this checkout against controlled
in-memory packer doubles; never downloads GRIB or publishes anything.
"""
from __future__ import annotations
import ast
import contextlib
import io
import json
from pathlib import Path
import tempfile
import time
import unittest
import warnings
import numpy as np

ROOT = Path(__file__).parent

def load_subject(member_pack, summarize, pack_summary):
    source = ROOT / 'build_ruc_bundle.py'
    tree = ast.parse(source.read_text(encoding='utf-8'), filename=str(source))
    matching = [n for n in tree.body if isinstance(n, ast.FunctionDef)
                and n.name == 'write_eps_products']
    if len(matching) != 1:
        raise AssertionError('production EPS writer changed; requalify the timing contract')
    node = matching[0]
    if [a.arg for a in node.args.args] != ['interval', 'members_path', 'summary_path', 'chunk_points']:
        raise AssertionError('EPS production writer signature changed')
    namespace = {
        'time': time, 'json': json,
        'pack_eps_members': member_pack, 'eps_summary': summarize,
        'pack_cell_major': pack_summary,
        'EPS_SUMMARY_FIELDS': ('precipitation_mean',),
    }
    exec(compile(ast.Module(body=[node], type_ignores=[]), str(source), 'exec'), namespace)
    return namespace['write_eps_products']


class RucEpsP3Timing(unittest.TestCase):
    def test_wire_bytes_and_missing_zero_unchanged(self):
        stages = []
        def members(block, scale):
            self.assertEqual(scale, .01)
            stages.append('members')
            return np.asarray(block, dtype='<f8').tobytes()
        def summary(block):
            stages.append('summary')
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', RuntimeWarning)
                return {'precipitation_mean': np.nanmean(block, axis=1)}
        def packed(fields, specs):
            stages.append('summary_pack')
            self.assertEqual(specs, ('precipitation_mean',))
            return np.asarray(fields['precipitation_mean'], dtype='<f8').tobytes()
        writer = load_subject(members, summary, packed)
        source = np.arange(28 * 20 * 5, dtype=np.float64).reshape(28, 20, 5)
        source[0, 0, 0] = 0.0
        source[:, :, 3] = np.nan
        expected_member = b''.join(
            np.asarray(source[:, :, i:i+2], dtype='<f8').tobytes()
            for i in range(0, 5, 2)
        )
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            expected_summary = b''.join(
                np.asarray(np.nanmean(source[:, :, i:i+2], axis=1), dtype='<f8').tobytes()
                for i in range(0, 5, 2)
            )
        with tempfile.TemporaryDirectory() as td, contextlib.redirect_stdout(io.StringIO()) as stdout:
            member_path = Path(td) / 'members.bin'
            summary_path = Path(td) / 'summary.bin'
            writer(source, member_path, summary_path, 2)
            self.assertEqual(member_path.read_bytes(), expected_member)
            self.assertEqual(summary_path.read_bytes(), expected_summary)
            output = stdout.getvalue().splitlines()
        self.assertEqual(stages, ['members', 'summary', 'summary_pack'] * 3)
        timing = [line for line in output if line.startswith('RUC_P3_EPS_TIMINGS ')]
        self.assertEqual(len(timing), 1)
        report = json.loads(timing[0].split(' ', 1)[1])
        self.assertEqual(report['schema'], 'mid.ruc.p3-eps-timings.v1')
        self.assertEqual((report['chunks'], report['points'], report['validTimes'], report['members']),
                         (3, 5, 28, 20))
        for field in ('memberPackWriteSeconds', 'epsSummarySeconds', 'summaryPackWriteSeconds'):
            self.assertIsInstance(report[field], float)
            self.assertGreaterEqual(report[field], 0)
            self.assertLess(report[field], 60)
        self.assertEqual(float(source[0, 0, 0]), 0.0)
        self.assertTrue(np.isnan(source[:, :, 3]).all())

    def test_reject_invalid_chunk_without_files(self):
        writer = load_subject(lambda *a: b'', lambda *a: {}, lambda *a: b'')
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(ValueError, 'chunk_points must be positive'):
                writer(np.ones((2, 20, 3)), Path(td)/'m', Path(td)/'s', 0)
            self.assertFalse((Path(td)/'m').exists())
            self.assertFalse((Path(td)/'s').exists())


if __name__ == '__main__':
    unittest.main()
