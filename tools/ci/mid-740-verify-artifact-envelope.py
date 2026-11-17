#!/usr/bin/env python3
"""MID #740: locally validate downloaded GitHub Actions artifact ZIP envelope.

QA only. The expected digest is caller-supplied and MUST originate from a
trusted, independently authenticated GitHub REST readback. No release rights.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
from zipfile import ZipFile, BadZipFile, ZIP_DEFLATED, ZIP_STORED

SHA = re.compile(r"^[a-f0-9]{40}$")
SHA256 = re.compile(r"^[a-f0-9]{64}$")
FILES = {"MID-professional-replacement.zip", "MID-source-zip-evidence.json"}
LEGACY_ZIP = "MID-professional-replacement.zip"
LEGACY_RECEIPT = "provenance.json"
MAX_BYTES = 900 * 1024 * 1024
MAX_MANIFEST_BYTES = 65536


def _trusted_file(path: Path) -> Path:
    path = path.absolute()
    info = path.lstat()
    if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or
        not 0 < info.st_size <= MAX_BYTES or
        path.resolve(strict=True) != path):
        raise ValueError("Untrusted artifact envelope path/type/size")
    return path


def _extract_verified_members(envelope: Path, staging: Path, filenames: set[str]) -> None:
    with ZipFile(envelope, "r") as archive:
        entries = archive.infolist()
        if len(entries) != 2 or {e.filename for e in entries} != filenames:
            raise ValueError("Missing, extra, duplicate or unsafe envelope entries")
        for entry in entries:
            mode = entry.external_attr >> 16
            bound = (MAX_MANIFEST_BYTES if entry.filename.endswith(".json")
                     else MAX_BYTES)
            if (stat.S_IFMT(mode) not in (0, stat.S_IFREG) or
                entry.is_dir() or entry.flag_bits & 0x1 or
                entry.compress_type not in (ZIP_STORED, ZIP_DEFLATED) or
                not 0 < entry.file_size <= bound or
                entry.compress_size > MAX_BYTES):
                raise ValueError("Invalid artifact member type, size or encoding")
            count = 0
            # ZipInfo.open verifies CRC. Never use extractall() or trust
            # filenames beyond the exact two-item allowlist.
            with archive.open(entry, "r") as inp, (staging / entry.filename).open("xb") as out:
                while block := inp.read(1024 * 1024):
                    count += len(block)
                    if count > bound:
                        raise ValueError("Inflated artifact exceeds allowed bytes")
                    out.write(block)
            if count != entry.file_size:
                raise ValueError("Incomplete artifact member")
            (staging / entry.filename).chmod(0o600)


def _unique_object(pairs: list[tuple]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate evidence key")
        result[key] = value
    return result


def verify_legacy_shadow(envelope: Path, expected_sha256: str,
                         repository: Path, receipt: dict,
                         installer_zip_sha256: str) -> dict:
    """Compare captured ZIP bytes against the Git package and installer report.

    Expected values must be supplied from independent readbacks. This offline
    check does not authenticate the producer, installer or release decision.
    """
    if not expected_sha256 or not SHA256.fullmatch(expected_sha256):
        raise ValueError("Invalid envelope digest")
    if not installer_zip_sha256 or not SHA256.fullmatch(installer_zip_sha256):
        raise ValueError("Invalid installer digest")
    ids = ("producerRunId", "producerRunAttempt", "sourceGateRunId", "sourceGateRunAttempt")
    shas = ("packageCommitSha", "sourceMergeSha", "workflowSha")
    if (not isinstance(receipt, dict) or set(receipt) != {*ids, *shas} or
        any(type(receipt[name]) is not int or receipt[name] < 1 for name in ids) or
        any(not isinstance(receipt[name], str) or not SHA.fullmatch(receipt[name]) for name in shas)):
        raise ValueError("Invalid expected producer identity")
    expected_receipt = {**receipt, "schema": "mid.740.legacy-producer-shadow.v1",
                        "zipSha256": installer_zip_sha256, "installerAuthorized": False,
                        "releaseAuthorized": False}
    repository = Path(repository).resolve(strict=True)
    package, source = (receipt[name] for name in ("packageCommitSha", "sourceMergeSha"))

    def git(*args: str) -> str:
        return subprocess.check_output(["git", *args], cwd=repository, text=True, timeout=30).strip()

    if (git("rev-list", "--parents", "-n", "1", package) != f"{package} {source}" or
        git("diff-tree", "--no-commit-id", "--name-only", "-r", package) != LEGACY_ZIP):
        raise ValueError("Unexpected Git package parent or changed paths")
    entry = git("ls-tree", package, "--", LEGACY_ZIP)
    blob = re.fullmatch(r"100644 blob ([a-f0-9]{40})\t" + re.escape(LEGACY_ZIP), entry)
    if not blob:
        raise ValueError("Expected a regular ZIP blob in the package commit")
    envelope = _trusted_file(envelope)
    with envelope.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != expected_sha256:
            raise ValueError("Downloaded shadow envelope SHA256 mismatch")
    with tempfile.TemporaryDirectory(prefix="mid-740-legacy-proof-") as directory:
        staging = Path(directory)
        _extract_verified_members(envelope, staging, {LEGACY_ZIP, LEGACY_RECEIPT})
        actual_receipt = json.loads((staging / LEGACY_RECEIPT).read_text(), object_pairs_hook=_unique_object)
        if json.dumps(actual_receipt, sort_keys=True) != json.dumps(expected_receipt, sort_keys=True):
            raise ValueError("Shadow receipt differs from independent evidence")
        zip_path = staging / LEGACY_ZIP
        with zip_path.open("rb") as stream:
            actual_sha = hashlib.file_digest(stream, "sha256").hexdigest()
        if actual_sha != installer_zip_sha256 or git("hash-object", "--no-filters", str(zip_path)) != blob[1]:
            raise ValueError("ZIP differs from Git package or installer input")
    return {
        "schema": "mid.740.legacy-shadow-parity.v1",
        "packageCommitSha": package, "sourceMergeSha": source,
        "envelopeSha256": expected_sha256, "innerZipSha256": actual_sha,
        "packageAndInstallerDigestMatch": True,
        "authenticatedGitHubProducer": False, "installerAuthorized": False,
        "releaseAuthorized": False,
    }


def verify_downloaded_envelope(envelope: Path, expected_sha256: str,
                                destination: Path, source_sha: str,
                                repository: Path, local_verifier: Path,
                                source_verifier: Path) -> dict:
    if not (isinstance(expected_sha256, str) and
            SHA256.fullmatch(expected_sha256) and
            isinstance(source_sha, str) and SHA.fullmatch(source_sha)):
        raise ValueError("Invalid source or envelope identity")
    envelope = _trusted_file(Path(envelope))
    repository = Path(repository).absolute()
    local_verifier = Path(local_verifier).absolute()
    source_verifier = Path(source_verifier).absolute()
    destination = Path(destination).absolute()
    parent = destination.parent
    if (not repository.is_dir() or repository.is_symlink() or
        repository.resolve(strict=True) != repository or
        any(not v.is_file() or v.is_symlink() or
            v.resolve(strict=True) != v
            for v in (local_verifier, source_verifier)) or
        not parent.is_dir() or parent.is_symlink() or
        parent.resolve(strict=True) != parent or
        destination.exists() or destination.is_symlink()):
        raise ValueError("Untrusted checkout, verifier or target")
    with envelope.open("rb") as stream:
        actual_sha = hashlib.file_digest(stream, "sha256").hexdigest()
    if actual_sha != expected_sha256:
        raise ValueError("Downloaded artifact envelope SHA256 mismatch")
    staging = Path(tempfile.mkdtemp(prefix=".mid-740-envelope-", dir=parent))
    try:
        _extract_verified_members(envelope, staging, FILES)
        # Independent verifier is loaded from the trusted SHA-bound checkout.
        child = subprocess.run(
            ["python3", str(local_verifier),
             "--artifact-dir", str(staging),
             "--source-sha", source_sha,
             "--repository", str(repository),
             "--verifier", str(source_verifier)],
            cwd=repository, capture_output=True, text=True, timeout=120
        )
        if child.returncode != 0:
            raise ValueError("Local source ZIP/tree verification rejected")
        proof = json.loads(child.stdout)
        if (not isinstance(proof, dict) or
            proof.get("verifiedLocalGitTree") is not True or
            proof.get("sourceMergeSha") != source_sha or
            proof.get("releaseAuthorized") is not False or
            proof.get("installerAuthorized") is not False):
            raise ValueError("Incomplete independent Git-tree verification")
        if destination.exists() or destination.is_symlink():
            raise ValueError("Artifact output path appeared during verification")
        os.rename(staging, destination)
        return {
            "schema": "mid.740.download-envelope-verification.v1",
            "sourceMergeSha": source_sha,
            "envelopeSha256": actual_sha,
            "innerZipSha256": proof["zipSha256"],
            "envelopeBytesVerified": True,
            "sourceGitTreeVerified": True,
            "authenticatedGitHubProducer": False,
            "nativeMergeReviewVerified": False,
            "installerAuthorized": False,
            "releaseAuthorized": False
        }
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--envelope", required=True)
    ap.add_argument("--expected-envelope-sha256", required=True)
    ap.add_argument("--source-sha")
    ap.add_argument("--destination")
    ap.add_argument("--repository", default=".")
    ap.add_argument("--local-verifier")
    ap.add_argument("--source-verifier")
    ap.add_argument("--expected-legacy-receipt", type=Path)
    ap.add_argument("--installer-zip-sha256")
    cfg = ap.parse_args()
    try:
        source_options = (cfg.destination, cfg.source_sha, cfg.local_verifier, cfg.source_verifier)
        if cfg.expected_legacy_receipt:
            if any(source_options) or cfg.expected_legacy_receipt.stat().st_size > MAX_MANIFEST_BYTES:
                raise ValueError("Unexpected legacy verifier options or evidence size")
            receipt = json.loads(cfg.expected_legacy_receipt.read_text(), object_pairs_hook=_unique_object)
            report = verify_legacy_shadow(Path(cfg.envelope), cfg.expected_envelope_sha256,
                                          Path(cfg.repository), receipt, cfg.installer_zip_sha256)
        else:
            if not all(source_options) or cfg.installer_zip_sha256:
                raise ValueError("Incomplete source verifier options")
            report = verify_downloaded_envelope(
                Path(cfg.envelope), cfg.expected_envelope_sha256,
                Path(cfg.destination), cfg.source_sha, Path(cfg.repository),
                Path(cfg.local_verifier), Path(cfg.source_verifier))
        print(json.dumps(report, sort_keys=True))
    except (ValueError, OSError, BadZipFile, subprocess.SubprocessError,
            json.JSONDecodeError) as exc:
        raise SystemExit("MID #740 artifact envelope BLOCKED: " + str(exc))
