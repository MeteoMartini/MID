#!/usr/bin/env python3
"""P4: authenticated, *negative-only* RUC contract pre-download filter.

The trusted prepare job seals a complete immutable snapshot before exporting
its compatibility hash through GitHub's protected job-output channel. The
publisher compares that hash under the existing mid-pages concurrency lock.
Only a proven mismatch may skip a large download. A match is NEVER admission:
the exact artifact IDs/digests, original bytes, current Stable lineage,
27h/EPS/NoData/codec checks and final Pages/Worker guards remain mandatory.
Explicit legacy reuse lacks a trustworthy pre-download hash and must proceed
through the existing complete admit() path.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re

from prepared_snapshot import SCHEMA, RECEIPT, SHA, compatibility, identity

SHA256 = re.compile(r"^[0-9a-f]{64}$")
POSITIVE = re.compile(r"^[1-9][0-9]*$")


def export_sealed_fingerprint(snapshot: Path, repo: Path, *, output: Path) -> str:
    """Export only a freshly sealed, locally reverified *trusted job* receipt."""
    root = Path(snapshot)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("unsafe/missing prepared snapshot root")
    path = root / RECEIPT
    if path.is_symlink() or not path.is_file():
        raise ValueError("missing/unsafe immutable prepared receipt")
    receipt = json.loads(path.read_bytes())
    expected_producer = identity(repo)
    if receipt.get("schema") != SCHEMA or receipt.get("producer") != expected_producer:
        raise ValueError("prepared receipt does not match authenticated producer")
    sealed = receipt.get("compatibilitySha256")
    if not isinstance(sealed, str) or not SHA256.fullmatch(sealed):
        raise ValueError("prepared compatibility hash malformed")
    actual = compatibility(repo)
    if not hashlib.compare_digest(sealed, actual):
        raise ValueError("prepared compatibility source changed after sealing")
    if not output:
        raise ValueError("protected GitHub output file required")
    with Path(output).open("a", encoding="utf-8") as stream:
        stream.write("compatibility_sha=" + actual + "\n")
    return actual


def check_authenticated_fingerprint(
    repo: Path,
    *,
    supplied_hash: str,
    producer_source_sha: str,
    producer_event_sha: str,
    producer_run_id: str,
    producer_attempt: str,
    current_run_id: str,
    current_attempt: str,
    current_event_sha: str,
    reuse_run_id: str = "",
) -> dict[str, str]:
    """Compare only a same-run authenticated output, never a self-declared URL/receipt."""
    if reuse_run_id:
        if not POSITIVE.fullmatch(reuse_run_id):
            raise ValueError("invalid immutable producer reuse run ID")
        if supplied_hash:
            raise ValueError("reuse may not claim a fresh trusted pre-download proof")
        return {"allowed": "true", "reason": "legacy-reuse-full-admit-required"}
    if not isinstance(supplied_hash, str) or not SHA256.fullmatch(supplied_hash):
        raise ValueError("fresh snapshot missing authenticated compatibility output")
    if not all(
        isinstance(x, str) and SHA.fullmatch(x)
        for x in (producer_source_sha, producer_event_sha, current_event_sha)
    ):
        raise ValueError("missing/malformed source or event SHA")
    if not all(
        isinstance(x, str) and POSITIVE.fullmatch(x)
        for x in (producer_run_id, producer_attempt, current_run_id, current_attempt)
    ):
        raise ValueError("invalid producer run/attempt lineage")
    if (
        producer_run_id != current_run_id
        or producer_attempt != current_attempt
        or producer_event_sha != current_event_sha
    ):
        raise ValueError("prepared fingerprint from unauthenticated producer attempt/event")
    # Do NOT require producer_source_sha == consumer HEAD (or event SHA).
    # A version-only release can remain byte-compatible across different commits.
    # The existing full admit() checks source ancestry AFTER the download.
    consumer = compatibility(repo)
    if not SHA256.fullmatch(consumer):
        raise ValueError("invalid current compatibility digest")
    if not hashlib.compare_digest(supplied_hash, consumer):
        return {"allowed": "false", "reason": "superseded-contract"}
    return {"allowed": "true", "reason": "hash-match-full-admit-required"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("export", "check"))
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--snapshot", type=Path)
    args = parser.parse_args()
    output_name = os.environ.get("GITHUB_OUTPUT")
    if not output_name:
        parser.error("GITHUB_OUTPUT is required")
    if args.mode == "export":
        if not args.snapshot:
            parser.error("export requires --snapshot")
        exported = export_sealed_fingerprint(args.snapshot, args.repo, output=Path(output_name))
        print("Authenticated sealed RUC compatibility fingerprint exported: " + exported)
        return
    result = check_authenticated_fingerprint(
        args.repo,
        supplied_hash=os.environ.get("RUC_PREPARED_COMPAT_SHA", ""),
        producer_source_sha=os.environ.get("RUC_PREPARED_STABLE_SHA", ""),
        producer_event_sha=os.environ.get("RUC_PREPARED_EVENT_SHA", ""),
        producer_run_id=os.environ.get("RUC_PREPARED_RUN_ID", ""),
        producer_attempt=os.environ.get("RUC_PREPARED_ATTEMPT", ""),
        current_run_id=os.environ.get("GITHUB_RUN_ID", ""),
        current_attempt=os.environ.get("GITHUB_RUN_ATTEMPT", ""),
        current_event_sha=os.environ.get("GITHUB_SHA", ""),
        reuse_run_id=os.environ.get("RUC_REUSE_RUN_ID", ""),
    )
    with Path(output_name).open("a", encoding="utf-8") as stream:
        stream.write("allowed=" + result["allowed"] + "\n")
        stream.write("reason=" + result["reason"] + "\n")
    if result["allowed"] == "false":
        message = (
            "RUC-P4: authentifizierter Prepare-Contract != aktueller Stable-"
            "Contract. Übersprungener Download, letzter gültiger Pages-Snapshot "
            "bleibt unverändert. Keine meteorologische QA-/SLO-Freigabe."
        )
        print("::notice::" + message)
        summary_name = os.environ.get("GITHUB_STEP_SUMMARY")
        if summary_name:
            with Path(summary_name).open("a", encoding="utf-8") as summary:
                summary.write("### RUC snapshot superseded-contract\n\n" + message + "\n")
    else:
        print("RUC-P4: " + result["reason"] + "; complete byte-level admission is still mandatory")


if __name__ == "__main__":
    main()
