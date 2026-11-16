#!/usr/bin/env python3
"""MID #740: build immutable, byte-identical source release ZIP for Actions artifact handoff.

Pilot ONLY. The archive is generated from Git blobs of an exact trusted
source-merge commit, not from mutable checkout files. This tool does not
merge, push, dispatch workflows, or approve publication.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import tempfile
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

SHA = re.compile(r"^[0-9a-f]{40}$")
EXCLUDED_ROOTS = {".github", ".git", "node_modules", "dist"}
ZIP_NAME = "MID-professional-replacement.zip"
MAX_SOURCE_BYTES = 900 * 1024 * 1024


def _git(*args: str, cwd: Path) -> bytes:
    return subprocess.check_output(["git", *args], cwd=cwd, timeout=60)


def git_entries(cwd: Path, commit: str):
    if not SHA.fullmatch(commit):
        raise ValueError("Expected immutable Git SHA-1 commit")
    _git("cat-file", "-e", commit + "^{commit}", cwd=cwd)
    entries = _git("ls-tree", "-rz", commit, cwd=cwd)
    count = 0
    for raw in entries.split(b"\0"):
        if not raw:
            continue
        metadata, path_raw = raw.split(b"\t", 1)
        mode, kind, oid = metadata.decode("ascii").split()
        path = path_raw.decode("utf-8", "strict")
        # Reject ambiguous archive entries before any ZIP output is written.
        components = path.split("/")
        if (not path or path.startswith("/") or "\\" in path or
            any(p in ("", ".", "..") or any(ord(c) < 32 for c in p)
                for p in components)):
            raise ValueError("Unsafe source archive path")
        name = PurePosixPath(path)
        if name.parts[0] in EXCLUDED_ROOTS or name.name == ZIP_NAME:
            continue
        if mode not in ("100644", "100755") or kind != "blob" or not SHA.fullmatch(oid):
            raise ValueError("Unsupported symlink, mode or Git tree object")
        count += 1
        yield path, mode, oid
    if count == 0:
        raise ValueError("Empty Git source release inventory")


def make_archive(cwd: Path, commit: str, destination: Path) -> dict:
    cwd = cwd.resolve(strict=True)
    parent = destination.parent
    if (not parent.is_dir() or parent.is_symlink() or
        parent.resolve(strict=True) != parent or
        destination.exists() or destination.is_symlink()):
        raise ValueError("Unsafe or pre-existing archive destination")
    staging = Path(tempfile.mkdtemp(prefix=".mid-source-zip-", dir=parent))
    archive = staging / ZIP_NAME
    count, source_bytes = 0, 0
    try:
        # Do not allow a stale worktree, untracked file or TOCTOU edit to
        # modify the package contents: every payload comes from Git's OID.
        with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9,
                     allowZip64=True) as zipfile:
            for name, mode, oid in git_entries(cwd, commit):
                info = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.compress_type = ZIP_DEFLATED
                info.external_attr = (stat.S_IFREG | int(mode[-3:], 8)) << 16
                with subprocess.Popen(
                    ["git", "cat-file", "blob", oid], cwd=cwd, stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                ) as process:
                    with zipfile.open(info, "w", force_zip64=True) as entry:
                        while chunk := process.stdout.read(1024 * 1024):
                            source_bytes += len(chunk)
                            if source_bytes > MAX_SOURCE_BYTES:
                                raise ValueError("Source ZIP exceeds original MID 900 MiB budget")
                            entry.write(chunk)
                    if process.wait(timeout=60) != 0:
                        raise ValueError("Git source blob was not fully readable")
                count += 1
        with archive.open("rb") as stream:
            sha256 = hashlib.file_digest(stream, "sha256").hexdigest()
        archive.chmod(0o600)
        manifest = {
            "schema": "mid.740.git-source-release-artifact.v1",
            "sourceMergeSha": commit, "zipName": ZIP_NAME,
            "zipSha256": sha256, "zipBytes": archive.stat().st_size,
            "sourcePayloadBytes": source_bytes, "gitSourceFiles": count,
            "releaseAuthorized": False, "productionApproved": False,
        }
        evidence = staging / "MID-source-zip-evidence.json"
        evidence.write_text(json.dumps(manifest, sort_keys=True, indent=2) + "\n",
                            encoding="utf-8")
        evidence.chmod(0o600)
        os.replace(staging, destination)
        return manifest
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--source-sha", required=True)
    cli.add_argument("--destination", required=True)
    cli.add_argument("--repository", default=".")
    options = cli.parse_args()
    report = make_archive(Path(options.repository), options.source_sha,
                          Path(options.destination).absolute())
    print(json.dumps(report, sort_keys=True))
