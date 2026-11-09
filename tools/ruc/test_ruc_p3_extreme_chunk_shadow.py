#!/usr/bin/env python3
"""Independent production-function A/B on synthetic native EPS20: NO DWD release proof."""
from __future__ import annotations
import ast
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
import unittest
import warnings
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from ruc_p3_extreme_chunk_shadow import candidate_eps_period_summary


def release_source_function():
    """Execute *only* unchanged released function from current repository.

    Extract original AST rather than copying/rewriting the target's logic.
    Drift of source function or signature fails closed.
    """
    source = HERE / 'build_ruc_bundle.py'
    tree = ast.parse(source.read_text(encoding='utf-8'), filename=str(source))
    nodes = [x for x in tree.body if isinstance(x, ast.FunctionDef)
             and x.name == 'rapid_extreme_eps_period_summary']
    if len(nodes) != 1:
        raise AssertionError('Missing/duplicate original regional EPS period function')
    node = nodes[0]
    if [x.arg for x in node.args.args] != ['interval', 'eps_times', 'run']:
        raise AssertionError('Original regional EPS signature drifted')
    from datetime import datetime, timezone
    namespace = {'np': np, 'datetime': datetime, 'timezone': timezone}
    exec(compile(ast.Module(body=[node], type_ignores=[]), str(source), 'exec'), namespace)
    return namespace['rapid_extreme_eps_period_summary']


class P3RegionalExtremeShadow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = staticmethod(release_source_function())
        cls.base = datetime(2026, 11, 9, 4, tzinfo=timezone.utc)
        cls.times = [cls.base + timedelta(hours=i) for i in range(28)]
        cls.model_run = '2026-11-09T04:00Z'

    def compare(self, cube, times=None, chunk_points=(1, 3, 17, 4096)):
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            original = self.original(cube, times or self.times, self.model_run)
        for width in chunk_points:
            with self.subTest(chunk_points=width):
                with warnings.catch_warnings():
                    warnings.simplefilter('ignore', RuntimeWarning)
                    candidate = candidate_eps_period_summary(cube, times or self.times,
                                                              self.model_run, chunk_points=width)
                self.assertEqual(original.keys(), candidate.keys())
                for period, ref in original.items():
                    self.assertEqual(ref.keys(), candidate[period].keys())
                    for key, value in ref.items():
                        other = candidate[period][key]
                        if isinstance(value, np.ndarray):
                            self.assertEqual(value.dtype, other.dtype)
                            self.assertEqual(value.shape, other.shape)
                            # includes equality of real zeros, nan masks, all
                            # thresholds and quantile floating-point values
                            self.assertTrue(np.array_equal(value, other, equal_nan=True),
                                            (period, key, width))
                        else:
                            self.assertEqual(value, other)

    def test_original_eps20_random_and_extremes(self):
        rng = np.random.default_rng(20261109)
        cube = np.round(rng.uniform(0, 100, size=(28, 20, 97)), 2)
        cube[:, :, 0] = np.nan
        cube[:, :, 1] = 0.
        cube[0, :, 2] = np.nan
        cube[:, 0, 3] = np.nan
        for member, t in enumerate((.2, 5., 15., 20., 25., 35., 40., 60., 90.)):
            cube[:, member, 4 + member] = t
        cube[8, 8, 95] = np.nan
        self.compare(cube)

    def test_sparse_utc_hours_never_fill_missing_periods(self):
        rng = np.random.default_rng(58)
        cube = rng.uniform(0, 80, size=(28, 20, 53))
        # A 28-entry forecast axis with noncontiguous UTC times: the candidate
        # cannot turn advanced indexing into a broad contiguous slice.
        times = [self.base + timedelta(hours=i * 2) for i in range(28)]
        cube[:, :, 7] = np.nan
        self.compare(cube, times)

    def test_all_missing_and_true_zero(self):
        cube = np.full((28, 20, 3), np.nan)
        cube[:, :, 1] = 0.
        cube[:, :, 2] = 0.2
        self.compare(cube)

    def test_non_3d_returns_empty_and_invalid_chunks_fail_closed(self):
        self.assertEqual(candidate_eps_period_summary(np.empty((2, 3)), self.times,
                                                      self.model_run), {})
        cube = np.zeros((28, 20, 10))
        for invalid in (0, -1, True, 1.2, '10'):
            with self.subTest(invalid=invalid):
                with self.assertRaises(ValueError):
                    candidate_eps_period_summary(cube, self.times, self.model_run, invalid)

    def test_no_production_switch_from_helper(self):
        # The shadow is a separate import with no flags, env/CLI wiring or
        # production main() import, and no mutation of the original function.
        source = (HERE / 'ruc_p3_extreme_chunk_shadow.py').read_text(encoding='utf-8')
        self.assertNotIn('os.environ', source)
        self.assertNotIn('sys.argv', source)
        released = (HERE / 'build_ruc_bundle.py').read_text(encoding='utf-8')
        self.assertNotIn('from ruc_p3_extreme_chunk_shadow', released)


if __name__ == '__main__':
    unittest.main()
