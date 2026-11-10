#!/usr/bin/env python3
"""QA-only regression of offline 27h/EPS20 lossless range packing."""
import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from ruc_r2_lossless_pack_qa import build, source_check, verify_file


class LosslessRangeQA(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="ruc-r2-range-test-")
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.src = root / "original"
        self.out = root / "packed"
        self.src.mkdir()
        start = datetime(2026, 11, 9, 14, tzinfo=timezone.utc)
        self.run = "2026-11-09T14:00"
        times = [(start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M") for i in range(28)]
        # Little-endian native data, including real zero and the exact uint16
        # EPS missing sentinel 65535. No numerical conversions are permitted.
        self.files = {
            "deterministic.bin": (b"\x00\x00\xff\x7f" * 336),
            "eps-summary.bin": (b"\xff\x7f\x00\x00" * 168),
            "eps-members.bin": (b"\xff\xff\x00\x00\x01\x00\x00\x00" * 280),
            "lookup.bin": b"\x00\x00\x00\x00\xff\xff\xff\xff",
            "specialist-hourly.bin": (b"\x00" * 65535 + b"\xff") + (b"\x01" * 65535 + b"\xff")
        }
        for name, data in self.files.items():
            (self.src / name).write_bytes(data)
        self.meta = {
            "schema": "mid.dwd.ruc.grid.v2", "run": self.run,
            "pointCount": 2, "times": times,
            "deterministic": {"times": times, "recordBytes": 672},
            "epsSummary": {"times": times, "recordBytes": 336},
            "eps": {"times": times, "recordBytes": 1120,
                    "layout": "point-time-member", "memberCount": 20},
            "sourceGribContract": {
                "forecastReferenceTime": start.isoformat(), "epsMemberIds": list(range(1,21)),
                "nativeGrid": {"pointCount": 2}
            },
            "objects": {
                name: {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
                for name, data in self.files.items()
            }
        }
        self.store_meta()

    def store_meta(self):
        (self.src / "latest.json").write_text(json.dumps(self.meta), encoding="utf-8")

    def pack(self, **kw):
        return build(self.src, self.out, run=self.run, stable_sha="a"*40,
                     original_artifact_sha256="b"*64, chunk_bytes=65536, **kw)

    def test_byte_for_byte_roundtrip_with_nan_sentinel_real_zero_and_ranges(self):
        before = {name: hashlib.sha256(data).hexdigest() for name,data in self.files.items()}
        report = self.pack()
        self.assertTrue(report["postDecodeAllSourceSHAsMatch"])
        self.assertFalse(report["productionApproved"])
        self.assertFalse(report["r2ActivationAuthorized"])
        self.assertLess(report["packedBytes"], report["originalBytes"])
        self.assertEqual(report["sourceObjects"], 5)
        index = json.loads((self.out / "range-index.json").read_text())
        self.assertEqual(index["epsMemberCount"], 20)
        self.assertEqual(index["timeCount"], 28)
        for desc in index["entries"]:
            verify_file(self.out / desc["compressedKey"], desc)
            self.assertEqual(before[desc["name"]], desc["sourceSha256"])
            self.assertEqual((self.src / desc["name"]).read_bytes(), self.files[desc["name"]])
        self.assertEqual(index["codec"], "zlib-independent-chunks-v1")
        self.assertEqual(len(next(e for e in index["entries"] if e["name"] == "specialist-hourly.bin")["chunks"]), 2)
        cost = json.loads((self.out / "report.json").read_text())["cost"]
        self.assertFalse(cost["activationAuthorized"])
        self.assertIn("R2 metered billing has no verified hard 0-USD cap", cost["blockers"])

    def test_source_byte_swap_with_identical_file_size_rejected(self):
        b = bytearray((self.src / "eps-members.bin").read_bytes())
        b[7] ^= 1
        (self.src / "eps-members.bin").write_bytes(b)
        with self.assertRaisesRegex(ValueError, "authentic source byte digest mismatch"):
            self.pack()
        self.assertFalse(self.out.exists())

    def test_tampered_packed_byte_rejected(self):
        self.pack()
        index = json.loads((self.out / "range-index.json").read_text())
        row = index["entries"][0]
        p = self.out / row["compressedKey"]
        blob = bytearray(p.read_bytes())
        blob[2] ^= 1
        p.write_bytes(blob)
        with self.assertRaisesRegex(ValueError, "packed chunk bytes/SHA mismatch"):
            verify_file(p, row)

    def test_missing_eps_member_object_rejected(self):
        (self.src / "eps-members.bin").unlink()
        with self.assertRaisesRegex(ValueError, "source object missing"):
            self.pack()

    def test_incomplete_native_27h_rejected(self):
        self.meta["eps"]["times"] = self.meta["eps"]["times"][:-1]
        self.store_meta()
        with self.assertRaisesRegex(ValueError, "native UTC hours"):
            self.pack()

    def test_wrong_member_geometry_rejected(self):
        self.meta["objects"]["eps-members.bin"]["bytes"] -= 2
        self.store_meta()
        with self.assertRaisesRegex(ValueError, "point-record geometry|member-cube byte count"):
            self.pack()

    def test_missing_grib_member_provenance_rejected(self):
        self.meta["sourceGribContract"]["epsMemberIds"].pop()
        self.store_meta()
        with self.assertRaisesRegex(ValueError, "original-DWD source"):
            self.pack()

    def test_symlink_source_rejected(self):
        (self.src / "lookup.bin").unlink()
        (self.src / "lookup.bin").symlink_to(self.src / "deterministic.bin")
        with self.assertRaisesRegex(ValueError, "linked|wrong size"):
            self.pack()

    def test_output_must_not_clobber_existing(self):
        self.out.mkdir()
        (self.out / "important").write_text("must persist")
        with self.assertRaisesRegex(ValueError, "output must be NEW"):
            self.pack()
        self.assertEqual((self.out / "important").read_text(), "must persist")

    def test_uncanonical_model_run_rejected(self):
        with self.assertRaisesRegex(ValueError, "run or schema mismatch"):
            build(self.src, self.out, run="2026-11-09T15:00",
                  stable_sha="a"*40, original_artifact_sha256="b"*64)

    def test_invalid_original_artifact_reference_rejected(self):
        with self.assertRaisesRegex(ValueError, "artifact SHA256"):
            build(self.src, self.out, run=self.run, stable_sha="a"*40,
                  original_artifact_sha256="not-a-valid-sha")

    def test_refuses_insecure_chunk_configuration(self):
        with self.assertRaisesRegex(ValueError, "unbounded chunk length"):
            build(self.src, self.out, run=self.run, stable_sha="a"*40,
                  original_artifact_sha256="b"*64, chunk_bytes=0)


if __name__ == "__main__":
    unittest.main()
