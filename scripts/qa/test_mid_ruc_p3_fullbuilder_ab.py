#!/usr/bin/env python3
"""Scientific negative controls for read-only native DWD full-builder P3 A/B."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import mid_ruc_p3_fullbuilder_ab as qa


class P3FullOriginalBuilderQa(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory(prefix="mid-ruc-p3-native-full-")
        self.addCleanup(folder.cleanup)
        self.root = Path(folder.name)


    def test_bounded_eps_decode_preserves_original_units_member_axes_missing_and_extremes(self):
        """Small authentic-shape semantics, not a substitute for original DWD GRIB."""
        from datetime import datetime, timedelta, timezone
        np = qa.production.np
        t0 = datetime(2026, 11, 8, 21, tzinfo=timezone.utc)
        targets = [t0, t0 + timedelta(hours=1)]
        original_files = []
        records = {}
        for ti, t in enumerate(targets):
            for member in range(1, 11):
                path = self.root / f"eps-{ti}-{member}.grib2"
                original_files.append(path)
                values = np.array([ti * 2 + member * .125, 0, np.nan,
                                   75 + 20 * ti], dtype=np.float64)
                records[str(path)] = (t, member, values, 'mm', 'test-signature')
        # Input order must not affect member ordering or native UTC/point wires.
        original_files.reverse()
        def decode(task):
            return [records[task[0]]]
        def signature(_name, prev, incoming):
            if prev is not None and prev != incoming:
                raise ValueError('original GRIB signature mismatch')
            return incoming
        with patch.dict(qa.production.os.environ, {'MID_RUC_EPS_DECODE_WORKERS': '1'}), \
             patch.object(qa.production, 'decode_file_batch', side_effect=decode), \
             patch.object(qa.production, 'assert_same_parameter_signature', side_effect=signature):
            original, baseline_members = qa.production.collect_eps(
                original_files, targets, 4, expected_members=range(1, 11))
            bounded, members = qa.production.collect_eps_preallocated(
                original_files, targets, 4, expected_members=range(1, 11))
            self.assertEqual(members, baseline_members)
            np.testing.assert_array_equal(bounded, original)
            self.assertTrue(np.isnan(bounded[:, :, 2]).all())
            self.assertEqual(float(bounded[0, 0, 1]), 0.0)
            self.assertEqual(float(bounded[1, 0, 3]), 20.0)
            # Suppressed original EPS records must never be silently filled.
            missing_file = original_files[:-1]
            with self.assertRaisesRegex(SystemExit, 'missing members'):
                qa.production.collect_eps_preallocated(
                    missing_file, targets, 4, expected_members=range(1, 11))
            # A true duplicate in a single original message is an error.
            with patch.object(qa.production, 'decode_file_batch',
                              side_effect=lambda task: decode(task) * 2):
                with self.assertRaisesRegex(SystemExit, 'duplicate member'):
                    qa.production.collect_eps_preallocated(
                        original_files, targets, 4, expected_members=range(1, 11))
            # Different original member identity must never be accepted.
            bad_record = (targets[0], 99, np.ones(4), 'mm', 'test-signature')
            with patch.object(qa.production, 'decode_file_batch',
                              side_effect=lambda task: [bad_record] if task[0] == str(original_files[0]) else decode(task)):
                with self.assertRaisesRegex(qa.production.MeteoIntegrityError, 'unexpected member'):
                    qa.production.collect_eps_preallocated(
                        original_files, targets, 4, expected_members=range(1, 11))


    def test_no_source_activation_in_production(self):
        qa.unaltered_source_gate()
        self.assertIs(getattr(qa.production, qa.FLAG), False)
        self.assertFalse(hasattr(qa.production, "RUC_P3_RUN_ACTIVATION"))
        self.assertEqual(qa.SCHEMA, "mid.ruc.p3-full-native-same-stage-ab.v1")

    def test_utc_model_run_strict(self):
        self.assertEqual(qa.clean_run("2026-11-08T19:00"), "2026-11-08T19:00")
        for bad in ("../foo", "2026-11-08T19:00Z", "2026-11-08T19:10",
                    "2026-11-08T24:00", "2026-02-30T19:00", "", "2026-11-08T19:00 "):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                qa.clean_run(bad)

    def test_full_stage_requires_exact_original_eps20_and_rejects_tampering(self):
        stage = self.root / "stage"
        folder = stage / "eps" / "TOT_PREC"
        folder.mkdir(parents=True)
        for number in range(560):
            (folder / f"original-{number:03}.grib2").write_bytes(
                b"offline-test-not-a-real-GRIB" + bytes([number % 256])
            )
        result = qa.stage_inventory(stage)
        self.assertEqual(result["epsFileCount"], 560)
        self.assertEqual(result["fileCount"], 560)
        self.assertEqual(len(result["sha256"]), 64)
        f = folder / "original-300.grib2"
        f.write_bytes(f.read_bytes() + b"x")
        self.assertNotEqual(result["sha256"], qa.stage_inventory(stage)["sha256"])
        f.unlink()
        with self.assertRaisesRegex(ValueError, "EPS20 inventory"):
            qa.stage_inventory(stage)
        f.symlink_to(folder / "original-000.grib2")
        with self.assertRaisesRegex(ValueError, "symlink"):
            qa.stage_inventory(stage)

    def test_profile_denies_missing_duplicate_and_unbounded_qa_measurement(self):
        f = self.root / "profile.txt"
        f.write_text("P3_AB_PROFILE 95.500 5600000\n")
        self.assertEqual(qa.profile(f), {"wallSeconds": 95.5, "peakRssKiB": 5600000})
        for invalid in ("", "P3_AB_PROFILE 3.0 700\n",
                        "P3_AB_PROFILE 3600.0 5600000\n",
                        "P3_AB_PROFILE 3.0 7600000\n",
                        "P3_AB_PROFILE 95.0 5600000\nP3_AB_PROFILE 96.0 5600000\n"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                f.write_text(invalid)
                qa.profile(f)


    def test_over_budget_measurement_is_visible_but_remains_rejected(self):
        f = self.root / "over-budget.txt"
        f.write_text("P3_AB_PROFILE 48.5 8300000\n")
        self.assertEqual(qa.diagnostic_profile(f),
                         {"wallSeconds": 48.5, "peakRssKiB": 8300000})
        with self.assertRaisesRegex(ValueError, "resource profile"):
            qa.profile(f)
        f.write_text("P3_AB_PROFILE 55.0 5000000\nP3_AB_PROFILE 52.0 4000000\n")
        self.assertIsNone(qa.diagnostic_profile(f))

    def test_verify_failure_persists_blocked_report_and_raises(self):
        ref = self.root / "reference-profile.txt"
        cand = self.root / "candidate-profile.txt"
        ref.write_text("P3_AB_PROFILE 900.0 8300000\n")
        cand.write_text("P3_AB_PROFILE 100.0 7600000\n")
        report = self.root / "qa-evidence.json"
        argv = ["mid_ruc_p3_fullbuilder_ab.py", "verify",
                "--stage", str(self.root / "original"), "--run", "2026-11-08T20:00",
                "--output", str(self.root / "candidate"),
                "--reference", str(self.root / "reference"),
                "--reference-log", str(self.root / "reference.log"),
                "--reference-profile", str(ref), "--candidate-profile", str(cand),
                "--head", "f" * 40, "--report", str(report)]
        with patch.object(sys, "argv", argv), patch.object(
                qa, "verify", side_effect=ValueError(
                    "invalid or unbounded actual builder resource profile")):
            with self.assertRaisesRegex(ValueError, "resource profile"):
                qa.main()
        blocked = json.loads(report.read_text())
        self.assertEqual(blocked["qualificationStatus"], "BLOCKED")
        self.assertEqual(blocked["observedReferenceProfile"]["peakRssKiB"], 8300000)
        self.assertEqual(blocked["observedCandidateProfile"]["peakRssKiB"], 7600000)
        self.assertFalse(blocked["realOriginalGribFullBuilderE2eCompared"])
        self.assertFalse(blocked["nativeOutputsFullyVerified"])
        self.assertFalse(blocked["releaseAuthorized"])
        with patch.object(sys, "argv", argv):
            with self.assertRaisesRegex(ValueError, "never replace"):
                qa.main()


    def test_original_builder_timing_cannot_be_claimed_without_exact_phase_line(self):
        f = self.root / "reference.log"
        f.write_text("RUC_P3_PHASES run=2026-11-08T19:00 "
                     "download_stage_seconds=72.7 native_builder_seconds=810.25\n")
        self.assertEqual(qa.baseline_builder_seconds(
            f, "2026-11-08T19:00"), 810.25)
        with self.assertRaisesRegex(ValueError, "authentic baseline"):
            qa.baseline_builder_seconds(f, "2026-11-08T20:00")
        with self.assertRaises(ValueError):
            f.write_text(f.read_text() * 2)
            qa.baseline_builder_seconds(f, "2026-11-08T19:00")

    def test_full_source_contract_denies_fake_geometry(self):
        root = self.root / "output"
        root.mkdir()
        model = {"schema": "mid.dwd.ruc.grid.v2",
                 "run": "2026-11-08T19:00", "pointCount": 542040,
                 "eps": {"memberCount": 20, "scale": 0.01, "nodata": 65535},
                 "objects": {name: {"bytes": 3} for name in qa.NEEDED}}
        t0 = __import__("datetime").datetime(2026, 11, 8, 19, 0)
        ts = [(t0 + __import__("datetime").timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M")
              for i in range(28)]
        for key in ("deterministic", "eps", "epsSummary"):
            model[key] = dict(model.get(key, {}), times=ts)
        (root / "latest.json").write_text(json.dumps(model))
        with self.assertRaisesRegex(ValueError, "native packed record geometry"):
            qa.read_meta(root, model["run"])

    def test_full_native_objects_must_be_sha_identical_not_just_matching_names(self):
        ref = self.root / "reference"
        fast = self.root / "fast"
        ref.mkdir()
        fast.mkdir()
        inventory = {}
        for name in qa.NEEDED:
            data = (name + "\0").encode("utf-8")
            (ref / name).write_bytes(data)
            (fast / name).write_bytes(data)
            inventory[name] = {"bytes": len(data),
                               "sha256": hashlib.sha256(data).hexdigest()}
        meta = {"schema": "offline-test", "run": "2026-11-08T19:00",
                "objects": inventory, "generatedAt": "2026-11-08T19:05:00Z"}
        with patch.object(qa, "read_meta", return_value=meta):
            x = qa.verify_outputs(ref, fast, meta["run"])
            self.assertEqual(x["byteIdenticalObjects"], len(qa.NEEDED))
            self.assertGreater(x["byteIdenticalTotalBytes"], 0)
            (fast / "eps-summary.bin").write_bytes(b"altered")
            with self.assertRaisesRegex(ValueError, "mismatch"):
                qa.verify_outputs(ref, fast, meta["run"])

    def test_full_reference_peak_is_observable_without_relaxing_candidate_budget(self):
        f = self.root / "profile-observation.txt"
        f.write_text("P3_AB_PROFILE 778.81 8072836\n")
        self.assertEqual(qa.profile(f, reference=True)["peakRssKiB"], 8072836)
        with self.assertRaisesRegex(ValueError, "resource profile"):
            qa.profile(f)
        f.write_text("P3_AB_PROFILE 120.0 6799999\n")
        self.assertEqual(qa.profile(f)["peakRssKiB"], 6799999)
        f.write_text("P3_AB_PROFILE 120.0 6800000\n")
        with self.assertRaisesRegex(ValueError, "resource profile"):
            qa.profile(f)
        f.write_text("P3_AB_PROFILE 120.0 10000000\n")
        with self.assertRaisesRegex(ValueError, "resource profile"):
            qa.profile(f, reference=True)

    def test_p3_memory_candidate_compiles_only_in_qa_and_restores_source(self):
        original_main = qa.production.main
        source_path = Path(qa.production.__file__)
        before = source_path.read_bytes()
        try:
            compiled = qa.install_qa_only_memory_main(qa.production)
            self.assertIs(compiled, qa.production.main)
            self.assertIsNot(compiled, original_main)
            self.assertIn("_p3_qa_attach_eps", compiled.__code__.co_names)
            self.assertIn("collect_eps", compiled.__code__.co_names)
            self.assertEqual(source_path.read_bytes(), before)
        finally:
            qa.production.main = original_main
            qa.production.__dict__.pop("_p3_qa_attach_eps", None)
        self.assertIs(qa.production.main, original_main)
        self.assertIs(getattr(qa.production, qa.FLAG), False)

    def test_regional_eps_memory_shadow_is_byte_identical_to_real_production(self):
        from datetime import datetime, timedelta, timezone
        import numpy as np
        from ruc_p3_memory_shadow import attach_eps
        base = datetime(2026, 11, 9, 7, tzinfo=timezone.utc)
        run = base.isoformat()
        rows, cols = 13, 23
        south, west, north, east = 43.45, -3.5, 57.75, 19.9
        coordinates = [(south + (north - south) * r / (rows - 1),
                        west + (east - west) * c / (cols - 1))
                       for r in range(rows) for c in range(cols)]
        lats = np.array([x[0] for x in coordinates], dtype=np.float32)
        lons = np.array([x[1] for x in coordinates], dtype=np.float32)
        points = lats.size
        hourly = [base + timedelta(hours=h) for h in range(28)]
        quarter = [base + timedelta(minutes=15 * h) for h in range(25)]
        rapid15 = np.zeros((25, points), dtype=np.float32)
        rapid5 = np.zeros((73, points), dtype=np.float32)
        deterministic_fields = {
            "precipitation": np.broadcast_to(np.array([.125]), (28, points)),
            "temperature_2m": np.broadcast_to(np.array([-3.]), (28, points)),
            "wind_speed_10m": np.broadcast_to(np.array([14.]), (28, points)),
        }
        eps = {}
        for step, pid in enumerate(("0-6", "6-12", "12-14")):
            values = np.arange(points, dtype=np.float64) + step
            zero = np.zeros(points, dtype=np.float64)
            missing = np.full(points, np.nan, dtype=np.float64)
            row = {
                "memberCount": np.full(points, 20., dtype=np.float64),
                "wetProbabilityPct": np.where(values % 2 == 0, 50., np.nan),
                "significantProbabilityPct": zero,
                "max1hQ75Mm": values / 7,
                "totalQ75Mm": missing.copy(),
                "rain1hProbabilityPct": np.stack([values, zero, missing, values * .2]),
            }
            if pid != "12-14":
                row["rain6hProbabilityPct"] = np.stack([values * 2, zero, missing, values * .3])
            eps[pid] = row
        def build(regional_eps):
            return qa.production.build_rapid_extreme_summary(
                lats, lons, run, quarter, rapid15, rapid15, rapid15, rapid5,
                severe_fields={}, deterministic_times=hourly,
                deterministic_fields=deterministic_fields, specialist_fields={},
                phase_fields={}, eps_period_summary=regional_eps)
        original = build(eps)
        candidate = attach_eps(build({}), eps, (lats, lons))
        wire = lambda result: json.dumps(result, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")
        self.assertEqual(wire(candidate), wire(original),
                         "regional DWD EPS JSON source bytes changed")
        self.assertEqual(len(candidate["cells"]), rows * cols)
        self.assertNotIn("epsTotalQ75Mm", candidate["cells"][0]["periods"]["0-6"])
        self.assertNotIn("epsRain6hProbabilityPct", candidate["cells"][0]["periods"]["12-14"])
        for mutation in ("schema", "length", "location"):
            broken = build({})
            if mutation == "schema":
                broken["schema"] = "untrusted"
            elif mutation == "length":
                broken["cells"].pop()
            else:
                broken["cells"][0]["longitude"] = -90
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                attach_eps(broken, eps, (lats, lons))

    def test_qa_cannot_override_existing_artifacts_or_global_flag(self):
        stage = self.root / "stage"
        stage.mkdir()
        output = self.root / "existing-output"
        output.mkdir()
        with self.assertRaisesRegex(ValueError, "completely new"):
            qa.run_candidate(stage, output, "2026-11-08T19:00")
        self.assertIs(getattr(qa.production, qa.FLAG), False)


if __name__ == "__main__":
    unittest.main()
