#!/usr/bin/env python3
"""Execute the real observer workflow's drift fallback without Stable code or network."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / "ci/github/workflows/mid-ruc-availability-observer.yml"
ACTIVE = ROOT / ".github/workflows/mid-ruc-availability-observer.yml"


def extract_status_shell():
    lines = WORKFLOW.read_text(encoding="utf-8").splitlines()
    start = next(i for i, line in enumerate(lines)
                 if "name: Beobachtungsstatus auch ohne neue Stable-Python-Datei archivieren" in line)
    section = lines[start + 1:]
    block = next(i for i, line in enumerate(section) if line == "        run: |")
    body = []
    for line in section[block + 1:]:
        if line.startswith("      - name: "):
            break
        if line and not line.startswith("          "):
            raise ValueError("invalid status YAML indentation")
        body.append(line[10:] if line else "")
    if not body or "python3 - <<'PY'" not in "\n".join(body):
        raise ValueError("release-window fallback missing")
    return "\n".join(body) + "\n"


class WorkflowReleaseWindow(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.summary = self.root / "summary.md"

    def run_workflow_step(self, *, ready="false", event_id="50001",
                          sha_a="a" * 40, sha_b="b" * 40):
        env = dict(os.environ, LINEAGE_READY=ready,
                   CHECKOUT_SHA=sha_a, MAIN_SHA=sha_b, STABLE_SHA=sha_a,
                   GITHUB_RUN_ID=event_id, GITHUB_RUN_ATTEMPT="1",
                   GITHUB_STEP_SUMMARY=str(self.summary))
        return subprocess.run(["bash", "-e", "-o", "pipefail", "-c", extract_status_shell()],
                              cwd=self.root, env=env, text=True, capture_output=True,
                              timeout=15, check=False)

    def test_successful_drift_skip_without_stable_python_produces_only_negative_sample(self):
        self.assertFalse((self.root / "tools").exists())
        outcome = self.run_workflow_step()
        self.assertEqual(outcome.returncode, 0, outcome.stderr)
        p = self.root / "ruc-observer-status-50001-1.json"
        self.assertTrue(p.is_file())
        data = json.loads(p.read_text())
        self.assertEqual(data["schema"], "mid.ruc.observer-execution.v1")
        self.assertFalse(data["lineageReady"])
        self.assertEqual(data["directorySamples"], 0)
        for field in ("directoryObserved", "pagesObservedValid", "workerObservedValid",
                      "sameRunObserved", "gribHeaderOrValuesVerified",
                      "eps20ValuesVerified", "realClientAdoptionVerified",
                      "firstDwdPublicationInstantVerified",
                      "productionSloAuthorized", "publicationAuthorized"):
            self.assertIs(data[field], False)
        self.assertIn("no-op", self.summary.read_text())

    def test_failed_lineage_guard_still_records_unknown_without_sha_forgery(self):
        outcome = self.run_workflow_step(ready="", sha_b="malformed")
        self.assertEqual(outcome.returncode, 0, outcome.stderr)
        data = json.loads((self.root / "ruc-observer-status-50001-1.json").read_text())
        self.assertIsNone(data["mainSha"])
        self.assertEqual(data["result"], "release-drift-or-unverified-lineage")

    def test_positive_guard_fails_closed_without_stable_module(self):
        outcome = self.run_workflow_step(ready="true", sha_a="a" * 40, sha_b="a" * 40)
        self.assertNotEqual(outcome.returncode, 0)
        self.assertFalse((self.root / "ruc-observer-status-50001-1.json").exists())

    def test_invalid_provenance_does_not_create_evidence(self):
        outcome = self.run_workflow_step(event_id="0")
        self.assertNotEqual(outcome.returncode, 0)
        self.assertFalse((self.root / "ruc-observer-status-0-1.json").exists())

    def test_cannot_silently_overwrite_previous_poll_evidence(self):
        self.assertEqual(self.run_workflow_step().returncode, 0)
        self.assertNotEqual(self.run_workflow_step().returncode, 0)

    def test_active_and_canonical_sources_byte_identical(self):
        self.assertEqual(WORKFLOW.read_bytes(), ACTIVE.read_bytes())


if __name__ == "__main__":
    unittest.main()
