#!/usr/bin/env python3
"""MID #740: verify unpacked release-artifact against an exact local Git source.

This verifies only LOCAL archive bytes, inventory, modes and evidence JSON.
It does not authenticate the GitHub Actions producer, download-envelope digest,
native approvals, or any Installer/Pages/Stable release gate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess

SHA = re.compile(r"^[a-f0-9]{40}$")
SHA256 = re.compile(r"^[a-f0-9]{64}$")
FILES = {"MID-professional-replacement.zip", "MID-source-zip-evidence.json"}
SCHEMA = "mid.740.git-source-release-artifact.v1"
MAX_BYTES = 900 * 1024 * 1024


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate artifact manifest property")
        result[key] = value
    return result


def verify_local_artifact(directory: Path, source_sha: str,
                          repository: Path, verifier: Path) -> dict:
    if not isinstance(source_sha, str) or not SHA.fullmatch(source_sha):
        raise ValueError("Invalid immutable source merge SHA")
    directory = Path(directory).absolute()
    repository = Path(repository).absolute()
    verifier = Path(verifier).absolute()
    if (not directory.is_dir() or directory.is_symlink() or
        directory.resolve(strict=True) != directory or
        not repository.is_dir() or not verifier.is_file() or verifier.is_symlink()):
        raise ValueError("Untrusted artifact/repository/verifier path")
    inventory = {item.name for item in directory.iterdir()}
    if inventory != FILES:
        raise ValueError("Artifact inventory has missing or unexpected files")
    for filename in FILES:
        obj = directory / filename
        statinfo = obj.lstat()
        if (not stat.S_ISREG(statinfo.st_mode) or statinfo.st_nlink != 1 or
            not (0 < statinfo.st_size <= MAX_BYTES)):
            raise ValueError("Unsafe artifact member")
    manifest_path = directory / "MID-source-zip-evidence.json"
    if manifest_path.stat().st_size > 65536:
        raise ValueError("Artifact manifest too large")
    evidence = json.loads(manifest_path.read_text(encoding="utf-8"),
                          object_pairs_hook=_unique_object,
                          parse_constant=lambda _: (_ for _ in ()).throw(
                              ValueError("Invalid JSON numeric constant")))
    required = {"schema", "sourceMergeSha", "zipName", "zipSha256",
                "zipBytes", "sourcePayloadBytes", "gitSourceFiles",
                "releaseAuthorized", "productionApproved"}
    if not isinstance(evidence, dict) or set(evidence) != required:
        raise ValueError("Artifact manifest schema drift")
    archive = directory / "MID-professional-replacement.zip"
    if (evidence["schema"] != SCHEMA or evidence["sourceMergeSha"] != source_sha or
        evidence["zipName"] != archive.name or
        type(evidence["zipBytes"]) is not int or
        evidence["zipBytes"] != archive.stat().st_size or
        type(evidence["sourcePayloadBytes"]) is not int or
        not 0 < evidence["sourcePayloadBytes"] <= MAX_BYTES or
        type(evidence["gitSourceFiles"]) is not int or
        evidence["gitSourceFiles"] <= 0 or
        evidence["releaseAuthorized"] is not False or
        evidence["productionApproved"] is not False or
        not isinstance(evidence["zipSha256"], str) or
        not SHA256.fullmatch(evidence["zipSha256"])):
        raise ValueError("Untrusted source-release manifest")
    with archive.open("rb") as stream:
        actual = hashlib.file_digest(stream, "sha256").hexdigest()
    if actual != evidence["zipSha256"]:
        raise ValueError("Release ZIP SHA256 does not match manifest")
    head = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=repository, timeout=20
    ).decode("ascii").strip()
    if head != source_sha:
        raise ValueError("Checkout HEAD no longer matches source merge SHA")
    # The verifier must originate from trusted, SHA-bound checkout code;
    # never run a validator extracted from an untrusted artifact.
    result = subprocess.run(
        ["python3", str(verifier), str(archive), source_sha],
        cwd=repository, capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0 or "Verified " not in result.stdout:
        raise ValueError("ZIP bytes, mode or complete source tree differ")
    return {"schema": "mid.740.local-archive-verification.v1",
            "sourceMergeSha": source_sha, "zipSha256": actual,
            "verifiedLocalGitTree": True,
            "artifactEnvelopeDigestVerified": False,
            "authenticatedGitHubProducer": False,
            "nativeMergeReviewVerified": False,
            "installerAuthorized": False, "releaseAuthorized": False}


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--source-sha", required=True)
    cli.add_argument("--artifact-dir", required=True)
    cli.add_argument("--repository", default=".")
    cli.add_argument("--verifier", required=True)
    args = cli.parse_args()
    proof = verify_local_artifact(Path(args.artifact_dir), args.source_sha,
                                  Path(args.repository), Path(args.verifier))
    print(json.dumps(proof, sort_keys=True))
