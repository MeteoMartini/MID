"""Verify a release ZIP against an independently trusted Git source commit."""

import argparse
import hashlib
from pathlib import PurePosixPath
import re
import stat
import subprocess
from zipfile import ZipFile


def verify_release_zip(archive, source_sha):
    if not re.fullmatch(r"[0-9a-f]{40}", source_sha):
        raise ValueError("Expected a full source commit SHA")
    subprocess.run(["git", "cat-file", "-e", f"{source_sha}^{{commit}}"], check=True)
    tree = subprocess.check_output(["git", "ls-tree", "-rz", source_sha])
    expected = {}
    for record in tree.split(b"\0")[:-1]:
        metadata, raw_path = record.split(b"\t", 1)
        mode, kind, oid = metadata.decode("ascii").split()
        path = PurePosixPath(raw_path.decode("utf-8"))
        if path.parts[0] in {".github", ".git", "node_modules", "dist"}:
            continue
        if path.name == "MID-professional-replacement.zip":
            continue
        if kind != "blob" or mode not in {"100644", "100755"}:
            raise ValueError(f"Unsupported Git entry: {path}")
        expected[str(path)] = (mode, oid)

    with ZipFile(archive) as release:
        entries = release.infolist()
        names = {entry.orig_filename for entry in entries}
        if len(names) != len(entries) or names != expected.keys():
            raise ValueError("ZIP inventory differs from the source commit")
        for entry in entries:
            name = entry.orig_filename
            mode, oid = expected[name]
            permissions = entry.external_attr >> 16
            if stat.S_IFMT(permissions) != stat.S_IFREG or bool(permissions & 0o111) != (mode == "100755"):
                raise ValueError(f"ZIP file mode differs from source: {name}")
            digest = hashlib.sha1(usedforsecurity=False)
            digest.update(f"blob {entry.file_size}\0".encode("ascii"))
            with release.open(entry) as payload:
                for block in iter(lambda: payload.read(1024 * 1024), b""):
                    digest.update(block)
            if digest.hexdigest() != oid:
                raise ValueError(f"ZIP file content differs from source: {name}")
    return len(expected)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive")
    parser.add_argument("source_sha")
    args = parser.parse_args()
    count = verify_release_zip(args.archive, args.source_sha)
    print(f"Verified {count} ZIP files against {args.source_sha}")
