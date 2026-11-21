#!/usr/bin/env python3
"""Adversarial OFFLINE tests for the independent same-original-DWD P3 EPS A/B.

These fixtures are synthetic and can never qualify actual DWD publication.
Only a separate authenticated read-only GitHub GRIB job can prove real parity.
"""
from __future__ import annotations

from pathlib import Path
import hashlib
import json
import sys
import tempfile
import unittest
from unittest.mock import patch

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ruc_p3_real_same_input_ab import (  # noqa: E402
    SCHEMA, canonical_run, compare_same_cube,
    fingerprint_original_files, run_original_shadow,
)


class P3RealInputAbOffline(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="mid-p3-original-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def fixture(self, *, points=97):
        rng = np.random.default_rng(20261108)
        cube = rng.gamma(1.8, 3.1, size=(28, 20, points))
        cube[:, :, :2] = np.nan
        cube[:, 0, 2] = 0.0
        cube[0, 2, 3] = np.inf
        cube[10, 17, 4] = -np.inf
        cube[5, 13, 5] = 1e7
        return cube

    def test_identical_complete_byte_stream_and_missing_zero_preservation(self):
        cube = self.fixture()
        result = compare_same_cube(cube, full_native=False, chunk_points=31)
        self.assertEqual(result["originalDwdSourceTimeTermsVerified"], 28)
        self.assertEqual(result["originalDwdEpsMembersVerified"], 20)
        self.assertEqual(result["originalDwdNativePointsVerified"], 97)
        self.assertEqual(result["chunks"], 4)
        self.assertTrue(result["exactFloatQuantilesAllChunks"])
        self.assertTrue(result["exactPackedEpsSummaryAllChunks"])
        self.assertTrue(result["sameOriginalInputsCompared"])
        self.assertGreater(result["originalDwdNonfiniteMissingCells"], 0)
        self.assertGreater(result["originalDwdFiniteZeroCells"], 0)
        self.assertEqual(len(result["identicalPackedSha256"]), 64)
        self.assertEqual(self.fixture().shape, cube.shape)
        self.assertTrue(np.isnan(cube[:, :, 0]).all())
        self.assertEqual(cube[1, 0, 2], 0.0)

    def test_full_native_proof_must_have_exact_542040_points(self):
        with self.assertRaisesRegex(ValueError, "542040"):
            compare_same_cube(self.fixture())
        with self.assertRaisesRegex(ValueError, "wrong 27h/EPS20"):
            compare_same_cube(self.fixture()[:14], full_native=False)
        with self.assertRaisesRegex(ValueError, "wrong 27h/EPS20"):
            compare_same_cube(self.fixture()[:, :19], full_native=False)
        with self.assertRaisesRegex(ValueError, "unbounded EPS"):
            compare_same_cube(self.fixture(), full_native=False, chunk_points=4097)

    def test_no_silent_drift_on_candidate_tampering(self):
        cube = self.fixture(points=23)
        expected = np.ones((3, 28, 23), dtype=np.float64)
        with patch("ruc_p3_real_same_input_ab.candidate_eps_linear_quantiles", return_value=expected):
            with self.assertRaisesRegex(ValueError, "differs"):
                compare_same_cube(cube, full_native=False)
        with patch("ruc_p3_real_same_input_ab.candidate_eps_linear_quantiles", return_value=expected[:1]):
            with self.assertRaisesRegex(ValueError, "shape"):
                compare_same_cube(cube, full_native=False)

    def test_zero_and_fully_missing_not_conflated(self):
        cube = np.zeros((28, 20, 23), dtype=np.float64)
        cube[:, :, :5] = np.nan
        result = compare_same_cube(cube, full_native=False)
        self.assertEqual(result["originalDwdNonfiniteMissingCells"], 28 * 20 * 5)
        self.assertEqual(result["originalDwdFiniteZeroCells"], 28 * 20 * (23 - 5))

    def test_run_name_cannot_inject_or_alias_timezone(self):
        self.assertEqual(canonical_run("2026-11-08T14:00"), "2026-11-08T14:00")
        for value in ("2026-11-08T14:00Z", "2026-11-08T14:30",
                      "2026-11-08T14:00; rm -rf /", "../2026-11-08T14:00",
                      "2026-02-30T14:00", "2026-11-08T24:00"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                canonical_run(value)

    def test_bounded_file_inventory_sha_and_path_safety(self):
        stage = self.root / "source"
        stage.mkdir()
        files = []
        for i in range(28):
            file = stage / f"file-{i:02d}.grib2"
            file.write_bytes(b"independent test input " + bytes([i]))
            files.append(file)
        proof = fingerprint_original_files(stage, files)
        self.assertEqual(proof["sourceFileCount"], 28)
        self.assertTrue(proof["sourceInventorySha256Verified"])
        self.assertEqual(len(proof["sourceManifestSha256"]), 64)
        files[4].write_bytes(files[4].read_bytes() + b"tampered")
        changed = fingerprint_original_files(stage, files)
        self.assertNotEqual(proof["sourceManifestSha256"], changed["sourceManifestSha256"])
        with self.assertRaisesRegex(ValueError, "inventory"):
            fingerprint_original_files(stage, files[:7])
        outside = self.root / "outside.grib2"
        outside.write_bytes(b"escape")
        with self.assertRaisesRegex(ValueError, "escaped"):
            fingerprint_original_files(stage, files[1:] + [outside])
        files[5].unlink()
        files[5].symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "unsafe"):
            fingerprint_original_files(stage, files)

    def test_output_and_input_cannot_reuse_previous_snapshot(self):
        output = self.root / "report.json"
        output.write_text('{"false":"already-used"}')
        with self.assertRaisesRegex(ValueError, "must be new"):
            run_original_shadow(run="auto", stage=self.root/"stage", output=output)
        output.unlink()
        stage = self.root / "stage"
        stage.mkdir()
        (stage / "unexpected.txt").write_text("old source")
        with self.assertRaisesRegex(ValueError, "start empty"):
            run_original_shadow(run="auto", stage=stage, output=output)
        (stage / "unexpected.txt").unlink()
        with patch("ruc_p3_real_same_input_ab.session") as s, patch(
            "ruc_p3_real_same_input_ab.common_runs", return_value=[]
        ):
            with self.assertRaisesRegex(ValueError, "no DWD"):
                run_original_shadow(run="auto", stage=stage, output=output)
        self.assertFalse(output.exists())

    def test_production_eps_summary_remains_reference_only(self):
        source = Path(__file__).with_name("build_ruc_bundle.py").read_text()
        import ast
        tree = ast.parse(source)
        eps = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "eps_summary"]
        self.assertEqual(len(eps), 1)
        segment = ast.get_source_segment(source, eps[0])
        self.assertIn("np.nanquantile", segment)
        # Only the unmodified reference branch runs in production. The
        # candidate source is explicitly LOCKED OFF, not absent from this
        # SHA-bound, requalified integration source.
        assignments = [
            node for node in tree.body if isinstance(node, ast.Assign)
            and any(isinstance(t, ast.Name) and
                    t.id == "_P3_ACCELERATED_QUANTILE_ENABLED" for t in node.targets)
        ]
        self.assertEqual(len(assignments), 1, "single P3 gate assignment required")
        self.assertIsInstance(assignments[0].value, ast.Constant)
        self.assertIs(assignments[0].value.value, False)
        conditional = [
            node for node in ast.walk(eps[0]) if isinstance(node, ast.If)
            and ast.unparse(node.test) ==
            "globals().get('_P3_ACCELERATED_QUANTILE_ENABLED') is True"
        ]
        self.assertEqual(len(conditional), 1)
        self.assertIn("candidate_eps_linear_quantiles", ast.unparse(conditional[0].body))
        self.assertNotIn("candidate_eps_linear_quantiles", ast.unparse(conditional[0].orelse))
        self.assertIn("np.nanquantile", ast.unparse(conditional[0].orelse))
        workflow = (Path(__file__).parents[2] / "ci/github/workflows/mid-ruc-preprocess.yml").read_text()
        self.assertNotIn("ruc_p3_real_same_input_ab.py", workflow)
        self.assertNotIn("ruc_p3_eps_quantile_candidate.py", workflow)
        self.assertNotIn("_P3_ACCELERATED_QUANTILE_ENABLED", workflow)


if __name__ == "__main__":
    unittest.main()
