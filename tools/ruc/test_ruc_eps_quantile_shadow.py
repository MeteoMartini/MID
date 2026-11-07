#!/usr/bin/env python3
"""Adversarial offline proof; no DWD fetch, release, workflow or producer changes."""
from __future__ import annotations
import unittest
import warnings
import numpy as np
from ruc_eps_quantile_shadow import shadow_eps20_quartiles


def reference(data):
    valid = np.isfinite(data)
    safe = np.where(valid, data, np.nan)
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)
        return np.nanquantile(safe, (0.25, 0.50, 0.75), axis=1)


def exact_finite_and_missing(a, b):
    if a.shape != b.shape or not np.array_equal(np.isnan(a), np.isnan(b)):
        return False
    mask = np.isfinite(a)
    return bool(np.array_equal(a[mask].view(np.uint64), b[mask].view(np.uint64)))


class ShadowEPS20QuantileTests(unittest.TestCase):
    def test_full_missing_and_true_dry_zero_separate(self):
        data = np.full((2, 20, 3), np.nan)
        data[0, :, 0] = 0.0
        data[0, :6, 1] = 1.25
        out = shadow_eps20_quartiles(data)
        self.assertEqual(out.shape, (3, 2, 3))
        self.assertTrue(np.isnan(out[:, 0, 2]).all())
        self.assertTrue(np.isnan(out[:, 1, :]).all())
        self.assertTrue(np.array_equal(out[:, 0, 0], np.zeros(3)))
        self.assertTrue(exact_finite_and_missing(out, reference(data)))

    def test_every_valid_member_count_from_zero_through_twenty(self):
        rng = np.random.default_rng(916)
        for n in range(21):
            data = np.full((2, 20, 129), np.nan)
            if n:
                data[:, :n, :] = rng.integers(0, 50000, size=(2, n, 129)) * 0.01
            with self.subTest(members=n):
                self.assertTrue(exact_finite_and_missing(shadow_eps20_quartiles(data), reference(data)))

    def test_continuous_random_member_masks_extremes_and_ties(self):
        rng = np.random.default_rng(20261107)
        for data_type in (np.float64,):
            data = rng.gamma(0.63, 4.1, size=(8, 20, 1024)).astype(data_type)
            data[rng.random(data.shape) < 0.25] = np.nan
            data[rng.random(data.shape) < 0.11] = 0
            data[:, :, 0] = 0.0
            data[:, :, 1] = 20000.0
            data[:, :, 2] = np.nan
            before = data.copy()
            with self.subTest(dtype=data_type):
                out = shadow_eps20_quartiles(data)
                self.assertTrue(exact_finite_and_missing(out, reference(data)))
                self.assertTrue(np.array_equal(data, before, equal_nan=True))

    def test_nonfinite_float_values_are_missing_not_zero(self):
        data = np.full((1, 20, 9), 1.0)
        data[:, 0, 0] = np.inf
        data[:, 0, 1] = -np.inf
        data[:, :, 2] = np.inf
        self.assertTrue(exact_finite_and_missing(shadow_eps20_quartiles(data), reference(data)))
        self.assertTrue(np.isnan(shadow_eps20_quartiles(data)[:, 0, 2]).all())

    def test_quantized_wire_values_identical(self):
        rng = np.random.default_rng(311)
        data = rng.integers(0, 12000, size=(3, 20, 499)).astype(np.float64) / 100
        data[rng.random(data.shape) < 0.38] = np.nan
        for value in (reference(data), shadow_eps20_quartiles(data)):
            self.assertTrue((value[np.isfinite(value)] >= 0).all())
        expected = np.where(np.isfinite(reference(data)), np.rint(reference(data)*100), -32768).astype('<i2').tobytes()
        actual = np.where(np.isfinite(shadow_eps20_quartiles(data)), np.rint(shadow_eps20_quartiles(data)*100), -32768).astype('<i2').tobytes()
        self.assertEqual(actual, expected)

    def test_bad_shape_or_input_types_fail_closed(self):
        for bad in (np.zeros((1, 19, 3)), np.zeros((1, 21, 3)),
                    np.zeros((20, 3)), np.zeros((0, 20, 3)),
                    np.zeros((1, 20, 0)), np.zeros((1, 20, 3), dtype=int),
                    np.zeros((1, 20, 3), dtype=np.float32)):
            with self.subTest(shape=bad.shape, dtype=bad.dtype), self.assertRaises(ValueError):
                shadow_eps20_quartiles(bad)


if __name__ == '__main__':
    unittest.main()
