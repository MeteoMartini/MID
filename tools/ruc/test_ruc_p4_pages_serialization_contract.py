#!/usr/bin/env python3
"""Read-only, negative P4 proof of established GitHub Pages single-flight gates.

This is not a claim of global CAS/fencing across optional R2 writers or a
second provider's direct API. It prevents accidental disabling of the actual
shared MID install + RUC GitHub Pages lock, immutable readmission and drift
guards. The only publisher is the unchanged, privileged GitHub release path.
"""
from __future__ import annotations
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
INSTALL = "ci/github/workflows/install-mid.yml"
RUC = "ci/github/workflows/mid-ruc-preprocess.yml"
WATCHDOG = "ci/github/workflows/mid-ruc-schedule-watchdog.yml"


def job_blocks(source: str) -> dict[str, str]:
    if not isinstance(source, str) or len(source) > 500_000:
        raise ValueError("invalid/unbounded workflow source")
    tail = source.split("\njobs:\n", 1)
    if len(tail) != 2:
        raise ValueError("missing jobs map")
    found = list(re.finditer(r"(?m)^  ([A-Za-z][A-Za-z0-9_-]*):\s*$", tail[1]))
    if not found:
        raise ValueError("no jobs")
    result = {}
    for index, match in enumerate(found):
        name = match.group(1)
        if name in result:
            raise ValueError("duplicate workflow job")
        until = found[index + 1].start() if index + 1 < len(found) else len(tail[1])
        result[name] = tail[1][match.end():until]
    return result


def assert_serialized_pages(job: str, label: str) -> None:
    if not re.search(r"(?m)^    concurrency:\s*\n      group: mid-pages\s*\n      queue: max\s*\n      cancel-in-progress: false\s*$", job):
        raise ValueError(label + ": missing uncancelled shared Pages lease")
    if "pages: write" not in job or "id-token: write" not in job:
        raise ValueError(label + ": missing established Pages auth scope")


def check_contract(install: str, ruc: str, watchdog: str) -> dict:
    if not all(isinstance(s, str) for s in (install, ruc, watchdog)):
        raise ValueError("invalid workflow document")
    main = job_blocks(install)
    ruc_jobs = job_blocks(ruc)
    recovery = job_blocks(watchdog)
    if not {"deploy_pages_1", "deploy_pages_2", "deploy_pages_3", "finalize_release"} <= set(main):
        raise ValueError("MID Pages retries/finalize not all present")
    if "publish" not in ruc_jobs or "verify-and-recover" not in recovery:
        raise ValueError("RUC publisher or upstream watchdog missing")
    for name in ("deploy_pages_1", "deploy_pages_2", "deploy_pages_3"):
        job = main[name]
        assert_serialized_pages(job, "MID " + name)
        if "actions/deploy-pages@" not in job:
            raise ValueError("expected MID deployment action missing in " + name)
    # Keep the release finalizer serialized against a new RUC Pages deployment,
    # even though it no longer needs pages:write itself.
    final = main["finalize_release"]
    if not re.search(r"(?m)^    concurrency:\s*\n      group: mid-pages\s*\n      queue: max\s*\n      cancel-in-progress: false\s*$", final):
        raise ValueError("MID finalize no longer shares Pages serialization")
    publisher = ruc_jobs["publish"]
    assert_serialized_pages(publisher, "RUC publish")
    if publisher.count("actions/deploy-pages@") != 2:
        raise ValueError("RUC normal and rollback publishers must stay under same lock")
    if "digest-mismatch: error" not in publisher:
        raise ValueError("RUC immutable downloaded artifact digest gate absent")
    admission = publisher.find("prepared_snapshot.py admit --snapshot")
    decoder = publisher.find("verify_prepared_snapshot.mjs")
    publish_guard = publisher.find("id: publish_guard")
    actual_deploy = publisher.find("uses: actions/deploy-pages@")
    if min(admission, decoder, publish_guard, actual_deploy) < 0 or not (
        admission < decoder < publish_guard < actual_deploy
    ):
        raise ValueError("RUC re-admission or final source guard not before publishing")
    if publisher.count("steps.publish_guard.outputs.allowed == 'true'") < 3:
        raise ValueError("RUC final source SHA guard no longer gates publication")
    if ("run_time(published['run'])>run_time(report['run'])" not in
            (ROOT/"tools/ruc/prepared_snapshot.py").read_text(encoding="utf-8")):
        raise ValueError("RUC published-run non-regression proof missing")
    top = ruc.split("\njobs:\n", 1)[0]
    if "group: mid-dwd-ruc-preprocess" not in top or "cancel-in-progress: false" not in top:
        raise ValueError("whole RUC producer single-flight guard missing")
    wd = recovery["verify-and-recover"]
    if ('gh workflow run "$RUC_WORKFLOW"' not in wd or
            'main_sha' not in wd or 'stable_sha' not in wd or
            'recovery suppressed' not in wd.lower()):
        raise ValueError("watchdog no longer uses verified guarded RUC dispatch")
    if "actions/deploy-pages@" in watchdog or "aws s3 cp" in watchdog:
        raise ValueError("watchdog gained uncoordinated direct publication authority")
    return {
        "schema": "mid.ruc.p4-shared-pages-serialization-qa.v1",
        "sharedGitHubPagesLease": True,
        "immutableReAdmission": True,
        "staleRunAndSourceGuards": True,
        "watchdogDispatchesThroughSameRucWorkflow": True,
        "globalCrossProviderCasFencingVerified": False,
        "workerAndAppClientRefreshVerified": False,
        "productionFastLaneAuthorized": False,
    }


class P4PagesSerialization(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.install = (ROOT / INSTALL).read_text(encoding="utf-8")
        cls.ruc = (ROOT / RUC).read_text(encoding="utf-8")
        cls.watchdog = (ROOT / WATCHDOG).read_text(encoding="utf-8")

    def test_real_canonical_workflows_share_uncancelled_pages_lock(self):
        verdict = check_contract(self.install, self.ruc, self.watchdog)
        self.assertTrue(verdict["sharedGitHubPagesLease"])
        self.assertFalse(verdict["globalCrossProviderCasFencingVerified"])

    def test_losing_ruc_shared_lock_fails(self):
        source = self.ruc.replace("group: mid-pages", "group: other-pages", 1)
        with self.assertRaisesRegex(ValueError, "shared Pages lease"):
            check_contract(self.install, source, self.watchdog)

    def test_cancel_in_progress_or_stale_release_gates_fail(self):
        for before, after in (
            ("group: mid-pages\n      queue: max\n      cancel-in-progress: false",
             "group: mid-pages\n      queue: max\n      cancel-in-progress: true"),
            ("prepared_snapshot.py admit --snapshot", "prepared_snapshot.py no-admission --snapshot"),
            ("id: publish_guard", "id: removed_guard"),
            ("digest-mismatch: error", "digest-mismatch: warn"),
        ):
            with self.subTest(before=before):
                self.assertIn(before, self.ruc)
                with self.assertRaises(ValueError):
                    check_contract(self.install, self.ruc.replace(before, after, 1), self.watchdog)

    def test_install_retry_or_finalize_without_shared_lock_fails(self):
        for label in ("deploy_pages_1", "deploy_pages_2", "deploy_pages_3", "finalize_release"):
            with self.subTest(job=label):
                anchor = "  " + label + ":"
                self.assertIn(anchor, self.install)
                before, tail = self.install.split(anchor, 1)
                first = tail.find("group: mid-pages")
                self.assertGreaterEqual(first, 0)
                modified = before + anchor + tail[:first] + "group: unsafe-pages" + tail[first+len("group: mid-pages"):]
                with self.assertRaises(ValueError):
                    check_contract(modified, self.ruc, self.watchdog)

    def test_unverified_direct_watchdog_pages_writer_fails(self):
        with self.assertRaisesRegex(ValueError, "uncoordinated direct publication"):
            check_contract(self.install, self.ruc, self.watchdog + "\n# actions/deploy-pages@unsafe\n")

    def test_bad_workflow_structure_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "missing jobs map"):
            job_blocks("name: x\nnot-jobs: value\n")


if __name__ == "__main__":
    unittest.main()
