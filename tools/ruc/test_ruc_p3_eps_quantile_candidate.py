#!/usr/bin/env python3
"""Adversarial, non-production EPS20 P3 candidate/reference equivalence."""
from __future__ import annotations
import sys
import ast
from pathlib import Path
import unittest
import warnings
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from ruc_p3_eps_quantile_candidate import candidate_eps_linear_quantiles, reference_eps_linear_quantiles


def compare(source):
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)  # all-missing warning
        old = reference_eps_linear_quantiles(source)
    new = candidate_eps_linear_quantiles(source)
    np.testing.assert_array_equal(new, old, strict=True)
    # Every EPS summary parameter is ultimately packed to int16-le in MID.
    # No changed half-centimeter rounding, no NaN mapped to 0.
    for field in range(3):
        was = np.where(np.isfinite(old[field]), np.rint(old[field] * 100), -32768).astype('<i2')
        now = np.where(np.isfinite(new[field]), np.rint(new[field] * 100), -32768).astype('<i2')
        assert now.tobytes() == was.tobytes()
        assert np.array_equal(np.isfinite(old[field]), np.isfinite(new[field]))
    return old, new


class CandidateParity(unittest.TestCase):
    def test_full_eps20_chunk_random_sparse(self):
        a = np.random.default_rng(4096).gamma(1.9, 3.2, (28, 20, 4096))
        a[np.random.default_rng(99).random(a.shape) < 0.16] = np.nan
        a[:, :, :9] = np.nan
        compare(a)

    def test_all_missing_not_zero(self):
        old, new = compare(np.full((28, 20, 12), np.nan))
        self.assertTrue(np.isnan(new).all())
        self.assertTrue(np.isnan(old).all())

    def test_single_valid_member(self):
        a = np.full((4, 20, 7), np.nan)
        a[:, 13, :] = [[1.25, 0, 7.5, 90, .005, .015, .025]] * 4
        old, new = compare(a)
        self.assertTrue(np.array_equal(new[0], new[2]))
        self.assertEqual(new[0, 0, 1], 0)

    def test_threshold_half_quantization(self):
        a = np.tile(np.array([.005, .015, .025, .035, .045, .055, .065, .075, .085, .095,
                              .105, .115, .125, .135, .145, .155, .165, .175, .185, .195]),
                    (28, 4096, 1)).transpose(0, 2, 1)
        compare(a)

    def test_infinite_mask_as_missing(self):
        a = np.ones((5, 20, 16))
        a[0, 1, 1] = np.inf
        a[1, 1, 1] = -np.inf
        a[2, :, 1] = np.inf
        compare(a)

    def test_extreme_not_smoothed(self):
        a = np.full((3, 20, 21), 0.0)
        a[:, 0, 3] = 1e10
        a[:, 5, 4] = -5e10
        compare(a)

    def test_different_valid_member_counts(self):
        rng = np.random.default_rng(171)
        a = rng.uniform(.0, 150.0, (28, 20, 256))
        for column in range(a.shape[2]):
            a[:, :column % 21, column] = np.nan
        compare(a)


    def test_real_production_eps_summary_and_packed_wire_bytes(self):
        """Execute the unchanged production `eps_summary` AST from this checkout.

        Do not import or run the production publisher. A future production
        refactor that changes this method cannot silently inherit parity.
        """
        source = Path(__file__).with_name('build_ruc_bundle.py')
        tree = ast.parse(source.read_text(encoding='utf-8'), filename=str(source))
        matching = [node for node in tree.body if isinstance(node, ast.FunctionDef)
                    and node.name == 'eps_summary']
        self.assertEqual(len(matching), 1, 'Production EPS summary has moved; requalify the candidate')
        fn = matching[0]
        self.assertEqual([arg.arg for arg in fn.args.args], ['interval'])
        namespace = {'np': np}
        exec(compile(ast.Module(body=[fn], type_ignores=[]), str(source), 'exec'), namespace)
        production_summary = namespace['eps_summary']
        from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major

        rng = np.random.default_rng(8057)
        for count in (1, 2, 3, 4, 5, 8, 12, 19, 20):
            arr = rng.uniform(0, 25, (28, 20, 97))
            arr[:, count:, :] = np.nan
            arr[:, :, :2] = np.nan
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', RuntimeWarning)
                production = production_summary(arr)
            optimized = candidate_eps_linear_quantiles(arr)
            alternative = dict(production)
            for i, label in enumerate(('precipitation_q25', 'precipitation_q50', 'precipitation_q75')):
                np.testing.assert_array_equal(production[label], optimized[i], strict=True)
                alternative[label] = optimized[i]
            self.assertEqual(pack_cell_major(production, EPS_SUMMARY_FIELDS),
                             pack_cell_major(alternative, EPS_SUMMARY_FIELDS))
            self.assertEqual(np.isfinite(production['precipitation_mean']).tolist(),
                             np.isfinite(alternative['precipitation_mean']).tolist())

    def test_quantile_member_order_permutations(self):
        rng = np.random.default_rng(2031)
        source = rng.uniform(0, 150, (7, 20, 64))
        source[:, 8:, :7] = np.nan
        for perm in (np.arange(20), np.arange(20)[::-1], rng.permutation(20)):
            compare(source[:, perm, :])

    def test_quantile_boundaries_and_zeros_with_one_to_twenty_members(self):
        source = np.full((3, 20, 21), np.nan)
        for count in range(1, 21):
            source[:, :count, count] = np.array([0., .005, 200.])[..., None]
        compare(source)

    def test_bad_shape(self):
        for x in (np.ones((28, 20)), np.ones((0, 20, 2)),
                  np.ones((28, 21, 2)), np.ones((29, 20, 2)),
                  np.ones((28, 20, 4097))):
            with self.subTest(shape=x.shape), self.assertRaises(ValueError):
                candidate_eps_linear_quantiles(x)

    def test_reject_noncanonical_percentile_methods(self):
        with self.assertRaises(ValueError):
            candidate_eps_linear_quantiles(np.ones((2, 20, 2)), quantiles=(.5, .75, .9))

    def test_deterministic_repeated(self):
        a = np.random.default_rng(3).uniform(0, 50, (28, 20, 512))
        first = candidate_eps_linear_quantiles(a)
        second = candidate_eps_linear_quantiles(a.copy())
        self.assertEqual(first.tobytes(), second.tobytes())


if __name__ == '__main__':
    unittest.main()
