#!/usr/bin/env python3
"""Adversarial offline P4 qualification; never downloads, publishes or dispatches."""
from __future__ import annotations

import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools/ruc"))
from predownload_contract import (  # noqa: E402
    check_authenticated_fingerprint,
    export_sealed_fingerprint,
)
from prepared_snapshot import RECEIPT, SCHEMA  # noqa: E402

ORIGIN = "a" * 40
EVENT = "b" * 40
CURRENT = "c" * 40
FINGERPRINT = "1" * 64
INCOMPATIBLE = "2" * 64


class PredownloadP4(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="mid-p4-")
        self.addCleanup(self.temp.cleanup)
        self.dir = Path(self.temp.name)
        self.snapshot = self.dir / "snapshot"
        self.snapshot.mkdir()
        self.output = self.dir / "github_output.txt"
        self.producer = {
            "repository": "MeteoMartini/MID",
            "sourceSha": ORIGIN,
            "eventSha": EVENT,
            "runId": 42,
            "runAttempt": 2,
        }
        (self.snapshot / RECEIPT).write_text(
            json.dumps(
                {"schema": SCHEMA, "producer": self.producer,
                 "compatibilitySha256": FINGERPRINT, "snapshot": {"verified": True}}
            ),
            encoding="utf-8",
        )
        self.auth = {
            "repo": self.dir,
            "supplied_hash": FINGERPRINT,
            "producer_source_sha": ORIGIN,
            "producer_event_sha": EVENT,
            "producer_run_id": "42",
            "producer_attempt": "2",
            "current_run_id": "42",
            "current_attempt": "2",
            "current_event_sha": EVENT,
        }

    def assert_blocked(self, **changed):
        args = {**self.auth, **changed}
        with patch("predownload_contract.compatibility", return_value=FINGERPRINT):
            with self.assertRaises(ValueError):
                check_authenticated_fingerprint(**args)

    def test_export_from_actual_seal_only_and_exact_producer(self):
        with patch("predownload_contract.identity", return_value=self.producer), patch(
            "predownload_contract.compatibility", return_value=FINGERPRINT
        ):
            got = export_sealed_fingerprint(
                self.snapshot, self.dir, output=self.output
            )
        self.assertEqual(got, FINGERPRINT)
        self.assertEqual(self.output.read_text(), "compatibility_sha=" + FINGERPRINT + "\n")

    def test_tampered_receipt_and_runtime_drift_cannot_be_exported(self):
        with patch("predownload_contract.identity", return_value=self.producer), patch(
            "predownload_contract.compatibility", return_value=INCOMPATIBLE
        ):
            with self.assertRaisesRegex(ValueError, "source changed"):
                export_sealed_fingerprint(self.snapshot, self.dir, output=self.output)
        self.assertFalse(self.output.exists())
        receipt = self.snapshot / RECEIPT
        value = json.loads(receipt.read_text())
        value["producer"]["sourceSha"] = CURRENT
        receipt.write_text(json.dumps(value))
        with patch("predownload_contract.identity", return_value=self.producer):
            with self.assertRaisesRegex(ValueError, "authenticated producer"):
                export_sealed_fingerprint(self.snapshot, self.dir, output=self.output)
        self.assertFalse(self.output.exists())

    def test_authentic_matching_fingerprint_is_not_a_publish_approval(self):
        with patch("predownload_contract.compatibility", return_value=FINGERPRINT):
            outcome = check_authenticated_fingerprint(**self.auth)
        self.assertEqual(outcome, {"allowed": "true", "reason": "hash-match-full-admit-required"})
        self.assertNotEqual(ORIGIN, EVENT)  # Producer Stable is NOT github event SHA.

    def test_true_runtime_change_skips_563mb_download_without_writes(self):
        with patch("predownload_contract.compatibility", return_value=INCOMPATIBLE):
            outcome = check_authenticated_fingerprint(**self.auth)
        self.assertEqual(outcome, {"allowed": "false", "reason": "superseded-contract"})
        self.assertFalse(self.output.exists())

    def test_release_only_different_commit_hash_is_accepted(self):
        args = {**self.auth, "producer_source_sha": CURRENT}
        with patch("predownload_contract.compatibility", return_value=FINGERPRINT):
            self.assertEqual(check_authenticated_fingerprint(**args)["allowed"], "true")

    def test_missing_malformed_and_replayed_output_fail_closed(self):
        for val in ("", "0" * 40, "X" * 64, " " + FINGERPRINT, FINGERPRINT + "\n"):
            with self.subTest(value=val[:8]):
                self.assert_blocked(supplied_hash=val)
        for changed in (
            {"producer_source_sha": ""},
            {"producer_event_sha": ORIGIN},
            {"producer_run_id": "41"},
            {"producer_attempt": "1"},
            {"current_run_id": "0"},
            {"current_attempt": "0"},
            {"current_event_sha": "not-a-sha"},
        ):
            with self.subTest(changed=changed):
                self.assert_blocked(**changed)
        self.assert_blocked(reuse_run_id="42")

    def test_verified_reuse_uses_existing_full_admission_without_early_claim(self):
        args = {**self.auth, "supplied_hash": "", "reuse_run_id": "987"}
        with patch("predownload_contract.compatibility") as c:
            result = check_authenticated_fingerprint(**args)
        self.assertEqual(result, {"allowed": "true", "reason": "legacy-reuse-full-admit-required"})
        c.assert_not_called()
        self.assert_blocked(supplied_hash="", reuse_run_id="unsafe;run")

    def test_mirrored_workflows_gate_all_download_and_publication_steps(self):
        canonical = (ROOT / "ci/github/workflows/mid-ruc-preprocess.yml").read_text()
        mirror = (ROOT / ".github/workflows/mid-ruc-preprocess.yml").read_text()
        self.assertEqual(canonical, mirror)
        prefix, publisher = canonical.split("\n  publish:\n", 1)
        publisher = publisher.split("\n  diagnostics:\n", 1)[0]
        seal = prefix.index("prepared_snapshot.py seal --snapshot")
        exported = prefix.index("id: snapshot_fingerprint")
        upload = prefix.index("name: Vorbereiteten RUC-Snapshot als unveränderliches Übergabeartefakt sichern")
        self.assertLess(seal, exported)
        self.assertLess(exported, upload)
        self.assertIn("compatibility_sha: ${{ steps.snapshot_fingerprint.outputs.compatibility_sha }}", prefix)
        lock = publisher.index("group: mid-pages")
        stable = publisher.index("id: stable_guard")
        artifact_id = publisher.index("name: Exakte Producer-Artefakt-ID prüfen")
        early = publisher.index("id: predownload_guard")
        download = publisher.index("name: Vorbereiteten RUC-Snapshot laden")
        admission = publisher.index("prepared_snapshot.py admit --snapshot")
        decoder = publisher.index("verify_prepared_snapshot.mjs")
        guard = publisher.index("id: publish_guard")
        deploy = publisher.index("uses: actions/deploy-pages@")
        self.assertTrue(lock < stable < artifact_id < early < download < admission < decoder < guard < deploy)
        publish_steps = publisher[download:]
        self.assertGreaterEqual(publish_steps.count("steps.predownload_guard.outputs.allowed == 'true'"), 8)
        self.assertNotIn("steps.stable_guard.outputs.allowed == 'true'", publish_steps)
        self.assertIn("digest-mismatch: error", publish_steps)
        self.assertIn("MID-Stable und Releasefenster unmittelbar vor dem Pages-Publish", publisher)
        self.assertIn("PRE_DOWNLOAD_ALLOWED: ${{ steps.predownload_guard.outputs.allowed }}", publisher)
        self.assertIn("superseded-contract", (ROOT / "tools/ruc/predownload_contract.py").read_text())

    def test_early_guard_cannot_be_downgraded_to_positive_admission(self):
        canonical = (ROOT / "ci/github/workflows/mid-ruc-preprocess.yml").read_text()
        self.assertEqual(canonical.count("prepared_snapshot.py admit --snapshot"), 2)
        self.assertIn("verify_prepared_snapshot.mjs .ruc-pages/ruc", canonical)
        self.assertIn("group: mid-dwd-ruc-preprocess", canonical)
        self.assertIn("group: mid-pages", canonical)


if __name__ == "__main__":
    unittest.main()
