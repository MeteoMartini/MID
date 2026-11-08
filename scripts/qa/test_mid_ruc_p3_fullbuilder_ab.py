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
                        "P3_AB_PROFILE 3500.0 5600000\n",
                        "P3_AB_PROFILE 3.0 7600000\n",
                        "P3_AB_PROFILE 95.0 5600000\nP3_AB_PROFILE 96.0 5600000\n"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                f.write_text(invalid)
                qa.profile(f)

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
