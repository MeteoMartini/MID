#!/usr/bin/env python3
"""Attach a separately SLSA-attested native DWD ICON-D2 map bundle to an
already verified, losslessly compressed MID RUC Pages staging snapshot.

Only the protected main approval workflow may generate the approved 73 objects.
This script never signs, downloads, dispatches, deploys or changes a live pointer.
It updates only the local *unpublished* snapshot, with latest.json last.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile

from admit_d2_native_pages import admit
from prepare_ruc_pages import PAGES_RUC_BUDGET_BYTES, safe_run

FIELDS = 72
NATIVE = 542040
MAX_AGE = timedelta(hours=12)


class ExpiredOriginalD2Run(ValueError):
    """Authentic but too-old optional native DWD model source."""



def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def utc_time(value: object) -> datetime:
    if not isinstance(value, str):
        raise ValueError('Native ICON-D2 run is not a UTC timestamp')
    try:
        instant = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise ValueError('Native ICON-D2 run timestamp invalid') from exc
    if instant.tzinfo is None or instant.utcoffset() != timedelta(0):
        raise ValueError('Native ICON-D2 run must have explicit UTC')
    return instant


def attach(snapshot: Path, approval: Path, source_commit_sha: str,
           *, now: datetime | None = None) -> dict:
    """Admit a real signed artifact via the established native D2 Pages gate.

    The workflow independently binds source_commit_sha to a successful
    protected, signer-specific GitHub Actions run on main == mid-stable;
    admit() rechecks that identity cryptographically against the actual index.
    """
    if snapshot.is_symlink() or approval.is_symlink():
        raise ValueError('Untrusted or missing approved RUC staging directories')
    snapshot = snapshot.resolve(strict=True)
    approval = approval.resolve(strict=True)
    if any(p.is_symlink() for p in approval.rglob('*')):
        raise ValueError('Untrusted signer artifact contains a symlink')
    if not snapshot.is_dir() or not approval.is_dir():
        raise ValueError('Untrusted or missing approved RUC staging directories')
    if not isinstance(source_commit_sha, str) or len(source_commit_sha) != 40 or any(c not in '0123456789abcdef' for c in source_commit_sha):
        raise ValueError('Authenticated protected main release SHA absent')
    root_file = snapshot / 'latest.json'
    if root_file.is_symlink() or not root_file.is_file():
        raise ValueError('Immutable compressed RUC latest.json missing')
    initial_bytes = root_file.read_bytes()
    meta = json.loads(initial_bytes)
    pages = meta.get('pages', {})
    objects = pages.get('objects')
    if (meta.get('schema') != 'mid.dwd.ruc.grid.v2'
        or meta.get('storageProfile') != 'pages-lossless-v1'
        or pages.get('stagingOnly') is True
        or not isinstance(objects, list) or not objects
        or meta.get('modelFieldsNative') is not None
        or meta.get('pointCount') != NATIVE):
        raise ValueError('Only a published-profile native-complete RUC candidate can be augmented')
    if (not isinstance(pages.get('publishedBytes'), int)
        or sum(row['bytes'] for row in objects) != pages['publishedBytes']
        or any(not isinstance(row.get('sha256'), str) or len(row['sha256']) != 64 for row in objects)):
        raise ValueError('Original compressed RUC object inventory is invalid')
    old_fingerprints = [(row['key'], row['sha256'], row['bytes']) for row in objects]
    approved = approval / 'd2-original-approved'
    index_path = approved / 'index.json'
    report_path = approval / 'original-dwd-approval-report.json'
    if (approved.is_symlink() or index_path.is_symlink() or report_path.is_symlink()
        or not index_path.is_file() or not report_path.is_file()):
        raise ValueError('Protected signer index or detached audit report absent')
    source = json.loads(index_path.read_bytes())
    report = json.loads(report_path.read_bytes())
    if (source.get('schema') != 'mid.icon-d2.native-fields.v2'
        or source.get('productionApproved') is not True
        or source.get('sourceApprovalCommitSha') != source_commit_sha
        or source.get('nativePoints') != NATIVE
        or report.get('sourceCommitSha') != source_commit_sha
        or report.get('frames') != FIELDS
        or report.get('signed') is not False
        or report.get('published') is not False
        or report.get('indexSha256') != file_sha(index_path)
        or report.get('originalInventorySha256') != source.get('sourceInventorySha256')):
        raise ValueError('Independently built signed DWD source/report mismatch')
    instant = utc_time(source.get('run'))
    clock = now or datetime.now(timezone.utc)
    if clock.tzinfo is None or clock.utcoffset() != timedelta(0):
        raise ValueError('Admission clock must be UTC')
    age = clock - instant
    if age < -timedelta(minutes=30):
        raise ValueError('Attested ICON-D2 model run is future-dated')
    if age > MAX_AGE:
        raise ExpiredOriginalD2Run('Attested ICON-D2 model run is stale')
    # The signed verifier accepts only the exact immutable original index, not
    # an untrusted candidate that flips productionApproved and rehashes itself.
    with tempfile.TemporaryDirectory(prefix='.mid-native-d2-admission-', dir=snapshot.parent) as temp:
        temporary_root = Path(temp)
        shutil.copytree(approved, temporary_root / 'model-fields-native', symlinks=False)
        # admit() validates every native grid, UTC time, NoData, contour, SHA,
        # decoded size, full 8x9 matrix, detached SHA and official SLSA signer.
        result = admit(
            temporary_root, snapshot, safe_run(meta['run']), objects,
            PAGES_RUC_BUDGET_BYTES,
            trusted_index_sha256=report['indexSha256'],
            trusted_inventory_sha256=report['originalInventorySha256'],
            trusted_release_sha=source_commit_sha,
        )
    if (result is None or result.get('productionApproved') is not True
        or result.get('nativePoints') != NATIVE
        or result.get('frameCount') != FIELDS
        or result.get('run') != source.get('run')):
        raise ValueError('Original-DWD admission did not approve the complete full domain')
    if old_fingerprints != [(row['key'], row['sha256'], row['bytes']) for row in objects[:len(old_fingerprints)]]:
        raise ValueError('Existing RUC object inventory changed during native D2 admission')
    new_total = sum(row['bytes'] for row in objects)
    if new_total != pages['publishedBytes'] + result['bytes'] or new_total >= PAGES_RUC_BUDGET_BYTES:
        raise ValueError('Full D2 + existing RUC physical budget exceeded')
    modified = {**meta, 'modelFieldsNative': result, 'pages': {**pages, 'objects': objects, 'publishedBytes': new_total}}
    raw = (json.dumps(modified, ensure_ascii=False, allow_nan=False, separators=(',', ':')) + '\n').encode('utf-8')
    if new_total + len(raw) >= PAGES_RUC_BUDGET_BYTES:
        raise ValueError('Full D2 and latest.json exceed 900MB Pages budget')
    # Pointer-last local commit. It cannot affect the public Pages environment
    # until the normal independent source/producer/publish/Worker gates pass.
    staging = root_file.with_name('.latest-native-d2-pending')
    if staging.exists() or staging.is_symlink():
        raise ValueError('Native DWD candidate pointer collision')
    try:
        with staging.open('xb') as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
        if root_file.read_bytes() != initial_bytes:
            raise ValueError('RUC root changed before native DWD pointer commit')
        os.replace(staging, root_file)
    finally:
        if staging.exists():
            staging.unlink()
    return {
        'schema': 'mid.d2.native-publisher-admission.v1',
        'sourceReleaseSha': source_commit_sha,
        'run': result['run'],
        'nativePoints': result['nativePoints'],
        'frames': result['frameCount'],
        'sha256': result['indexSha256'],
        'nativeBytes': result['bytes'],
        'totalRucBytes': new_total,
        'rucOriginalObjectCount': len(old_fingerprints),
        'nativeObjectCount': len(objects)-len(old_fingerprints),
        'status': 'locally-augmented-unsigned-site-not-deployed',
    }


def attach_or_skip_stale(snapshot: Path, approval: Path, source_commit_sha: str,
                         *, skip_stale: bool = False,
                         now: datetime | None = None) -> dict:
    """Fail-closed except a verified optional DWD model that is simply expired."""
    try:
        return attach(snapshot, approval, source_commit_sha, now=now)
    except ExpiredOriginalD2Run:
        if not skip_stale:
            raise
        return {
            'schema': 'mid.d2.native-publisher-admission.v1',
            'sourceReleaseSha': source_commit_sha,
            'status': 'skipped-stale-attestation',
            'nativeAdmitted': False,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--approval', type=Path, required=True)
    parser.add_argument('--source-commit-sha', required=True)
    parser.add_argument('--skip-stale', action='store_true', help='Optional scheduled native D2 admission only')
    args = parser.parse_args()
    print(json.dumps(attach_or_skip_stale(args.snapshot, args.approval, args.source_commit_sha,
                                    skip_stale=args.skip_stale), sort_keys=True))


if __name__ == '__main__':
    main()
