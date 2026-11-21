#!/usr/bin/env python3
"""Fail-closed P3 source scaffold: reference is the only production path.

All candidate activation below occurs in a separate in-memory AST namespace;
the real module/CLI/production workflow can never turn it on in this revision.
No DWD download, R2/Pages write, or claimed production performance proof.
"""
from __future__ import annotations

import ast
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import time
import unittest
import warnings

import numpy as np

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))
from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major, pack_eps_members

FLAG = '_P3_ACCELERATED_QUANTILE_ENABLED'
SRC = ROOT / 'build_ruc_bundle.py'


def source_functions():
    tree = ast.parse(SRC.read_text(encoding='utf-8'), filename=str(SRC))
    functions = {node.name: node for node in tree.body if isinstance(node, ast.FunctionDef)}
    return tree, functions


def isolated_subject(*, experimental=False):
    """Execute only the two original production AST functions, never main()."""
    _, funcs = source_functions()
    space = {
        'np': np, 'time': time, 'json': json,
        'pack_eps_members': pack_eps_members,
        'pack_cell_major': pack_cell_major, 'EPS_SUMMARY_FIELDS': EPS_SUMMARY_FIELDS,
    }
    if experimental:
        space[FLAG] = True
    nodes = [funcs['eps_summary'], funcs['write_eps_products']]
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(SRC), 'exec'), space)
    return space['eps_summary'], space['write_eps_products']


class P3ProductionDefaultOff(unittest.TestCase):
    def test_static_gate_is_exact_false_and_cannot_be_set_by_production(self):
        tree, funcs = source_functions()
        flags = [
            node for node in ast.walk(tree) if isinstance(node, ast.Assign)
            and any(isinstance(target, ast.Name) and target.id == FLAG
                    for target in node.targets)
        ]
        self.assertEqual(len(flags), 1, 'P3 flag must have exactly one assignment')
        self.assertIn(flags[0], tree.body, 'the single assignment must be module-level')
        self.assertIsInstance(flags[0].value, ast.Constant)
        self.assertIs(flags[0].value.value, False)
        for name, func in funcs.items():
            if name != 'eps_summary':
                self.assertNotIn(FLAG, ast.unparse(func),
                                 'P3 test-only flag must not be toggled by source functions')
        self.assertEqual([arg.arg for arg in funcs['eps_summary'].args.args],
                         ['interval'])
        self.assertEqual([arg.arg for arg in funcs['write_eps_products'].args.args],
                         ['interval', 'members_path', 'summary_path', 'chunk_points'])

        candidate_guards = [
            node for node in ast.walk(funcs['eps_summary'])
            if isinstance(node, ast.If)
            and ast.unparse(node.test) == "globals().get('_P3_ACCELERATED_QUANTILE_ENABLED') is True"
        ]
        self.assertEqual(len(candidate_guards), 1)
        self.assertIn('candidate_eps_linear_quantiles',
                      ast.unparse(candidate_guards[0].body))
        self.assertIn('np.nanquantile', ast.unparse(candidate_guards[0].orelse))
        self.assertNotIn('np.nanquantile', ast.unparse(candidate_guards[0].body))

        for rel in ('ci/github/workflows/mid-ruc-preprocess.yml',
                    '.github/workflows/mid-ruc-preprocess.yml'):
            self.assertNotIn(FLAG, (ROOT.parent.parent / rel).read_text(encoding='utf-8'))
        a = (ROOT.parent.parent / 'ci/github/workflows/mid-ruc-p3-eps-quantile-qa.yml')
        b = (ROOT.parent.parent / '.github/workflows/mid-ruc-p3-eps-quantile-qa.yml')
        self.assertEqual(a.read_bytes(), b.read_bytes(), 'canonical/active workflow drift')

    def test_opt_in_must_be_true_boolean_in_isolated_namespace(self):
        _, funcs = source_functions()
        interval = np.arange(28 * 20 * 2, dtype=np.float64).reshape(28, 20, 2)
        interval[:, :, 0] = np.nan
        for value in (None, False, 'true', 1, 0):
            ns = {'np': np, FLAG: value}
            exec(compile(ast.Module(body=[funcs['eps_summary']], type_ignores=[]),
                         str(SRC), 'exec'), ns)
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', RuntimeWarning)
                result = ns['eps_summary'](interval)
            self.assertTrue(np.isnan(result['precipitation_q25'][:, 0]).all())
            self.assertEqual(result['precipitation_q50'].shape, (28, 2))

    def test_isolated_true_matches_reference_float_and_all_six_wire_fields(self):
        reference, _ = isolated_subject(experimental=False)
        optimized, _ = isolated_subject(experimental=True)
        rng = np.random.default_rng(20261108)
        for count in (1, 2, 3, 4, 5, 8, 12, 19, 20):
            data = rng.gamma(2.1, 3.5, size=(28, 20, 97))
            data[:, count:, :] = np.nan
            data[:, :, 0] = np.nan
            data[:, :, 1] = 0.0
            data[12, 0, 2] = np.inf
            data[13, 0, 3] = -np.inf
            data[14, 0, 4] = 1e10
            data[15, 0, 5] = .005
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', RuntimeWarning)
                was = reference(data)
                now = optimized(data)
            self.assertEqual(set(was), set(now))
            for key in was:
                np.testing.assert_array_equal(was[key], now[key], strict=True)
            self.assertEqual(pack_cell_major(was, EPS_SUMMARY_FIELDS),
                             pack_cell_major(now, EPS_SUMMARY_FIELDS))

    def test_original_production_writer_bytes_with_test_only_opt_in(self):
        _, original_writer = isolated_subject(experimental=False)
        _, experimental_writer = isolated_subject(experimental=True)
        points = 4096 + 37
        cube = np.random.default_rng(20261109).gamma(1.9, 4.3, (28, 20, points))
        cube[:, :, 0] = np.nan
        cube[:, :, 1] = 0.0
        cube[0, 1, 2] = np.inf
        cube[0, 2, 3] = -np.inf
        cube[0, 3, 4] = 1e10
        with tempfile.TemporaryDirectory() as td:
            output = Path(td)
            files = []
            for name, writer in (('reference', original_writer),
                                 ('test-only-candidate', experimental_writer)):
                members = output / (name + '.members.bin')
                summary = output / (name + '.summary.bin')
                with warnings.catch_warnings(), contextlib.redirect_stdout(io.StringIO()) as out:
                    warnings.simplefilter('ignore', RuntimeWarning)
                    writer(cube, members, summary, 4096)
                markers = [line for line in out.getvalue().splitlines()
                           if line.startswith('RUC_P3_EPS_TIMINGS ')]
                self.assertEqual(len(markers), 1)
                fields = json.loads(markers[0].split(' ', 1)[1])
                self.assertEqual((fields['chunks'], fields['points'],
                                  fields['validTimes'], fields['members']),
                                 (2, points, 28, 20))
                files.append((members.read_bytes(), summary.read_bytes()))
            self.assertEqual(files[0], files[1], 'both genuine production wires must match')
            self.assertEqual(len(files[0][0]), points * 28 * 20 * 2)
            self.assertEqual(len(files[0][1]), points * 28 * 6 * 2)
            member = np.frombuffer(files[0][0], dtype='<u2').reshape(points, 28, 20)
            summary = np.frombuffer(files[0][1], dtype='<i2').reshape(points, 28, 6)
            self.assertTrue(np.all(member[0] == 65535))
            self.assertTrue(np.all(summary[0] == -32768))
            self.assertTrue(np.all(member[1] == 0))
            self.assertTrue(np.all(summary[1] == 0))


if __name__ == '__main__':
    unittest.main()
