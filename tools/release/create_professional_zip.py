#!/usr/bin/env python3
"""Create the unversioned MID Professional transport archive.

The GitHub web uploader accepts files only up to 25 MB. Generated Capacitor web
assets are intentionally not transported: install-mid.yml rebuilds the verified
Vite dist and runs `cap copy ios` before committing the release. Active .github
workflows are also excluded because the installer intentionally cannot self-edit
them; their canonical copies remain under ci/github and are synchronized only by
an explicit administrative workflow sync.
"""
from __future__ import annotations

import os
import stat
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "MID-professional-replacement.zip"
MAX_UPLOAD_BYTES = 24_000_000  # safety margin below GitHub browser's 25 MB limit
EXCLUDED_DIRS = {
    ".git",
    ".github",
    "node_modules",
    "dist",
    "ios/App/App/public",
}
EXCLUDED_FILES = {
    "MID-professional-replacement.zip",
    "MID-worker.zip",
    ".DS_Store",
}


def excluded(relative: Path) -> bool:
    posix = relative.as_posix()
    if posix in EXCLUDED_FILES:
        return True
    if "__pycache__" in relative.parts or relative.suffix.lower() in {".pyc", ".pyo"}:
        return True
    return any(posix == d or posix.startswith(d + "/") for d in EXCLUDED_DIRS)


def iter_files():
    for path in sorted(ROOT.rglob("*")):
        relative = path.relative_to(ROOT)
        if excluded(relative):
            continue
        if path.is_symlink():
            raise SystemExit(f"Symlink ist im Professional-Release nicht zulässig: {relative}")
        if path.is_file():
            yield path, relative


def main() -> int:
    out = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_OUT
    if not out.is_absolute():
        out = ROOT / out
    out = out.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()

    with ZipFile(out, "w", compression=ZIP_DEFLATED, compresslevel=9, allowZip64=True) as zf:
        for path, relative in iter_files():
            info = ZipInfo(relative.as_posix())
            # Stable timestamp accepted by ZIP; avoids non-deterministic local mtimes.
            info.date_time = (2026, 8, 30, 0, 0, 0)
            mode = stat.S_IMODE(path.stat().st_mode)
            info.external_attr = (mode & 0xFFFF) << 16
            info.compress_type = ZIP_DEFLATED
            zf.writestr(info, path.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)

    size = out.stat().st_size
    print(f"Professional-Release: {out} · {size} Byte")
    print("Transport-Ausschlüsse: .github, dist, node_modules, ios/App/App/public (wird nach Build via cap copy ios regeneriert)")
    if size >= MAX_UPLOAD_BYTES:
        out.unlink(missing_ok=True)
        raise SystemExit(f"Professional-Release überschreitet Browser-Uploadbudget: {size} >= {MAX_UPLOAD_BYTES} Byte")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
