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
        with ZipFile(envelope, "r") as archive:
            entries = archive.infolist()
            if len(entries) != 2 or {e.filename for e in entries} != FILES:
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
    ap.add_argument("--source-sha", required=True)
    ap.add_argument("--destination", required=True)
    ap.add_argument("--repository", default=".")
    ap.add_argument("--local-verifier", required=True)
    ap.add_argument("--source-verifier", required=True)
    cfg = ap.parse_args()
    try:
        report = verify_downloaded_envelope(
            Path(cfg.envelope), cfg.expected_envelope_sha256,
            Path(cfg.destination), cfg.source_sha, Path(cfg.repository),
            Path(cfg.local_verifier), Path(cfg.source_verifier))
        print(json.dumps(report, sort_keys=True))
    except (ValueError, OSError, BadZipFile, subprocess.SubprocessError,
            json.JSONDecodeError) as exc:
        raise SystemExit("MID #740 artifact envelope BLOCKED: " + str(exc))
