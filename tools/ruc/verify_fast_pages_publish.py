#!/usr/bin/env python3
"""Verify a sealed candidate against the rollback-ready Pages tree."""

import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory

from resolve_fast_pages_base import gh_api, resolve_installer_pages
from ruc_fast_pages_preserve import preserve_fast_pages
from ruc_fast_pointer_staging import count_files, sha_file, strict_budget


def verify_delivery(candidate_bundle, rollback_site, stable_sha, *, api=gh_api, now=None):
    candidate = candidate_bundle / 'candidate-site'
    recorded_base = json.loads((candidate_bundle / 'pages-base.json').read_text(encoding='utf-8'))
    active_base = resolve_installer_pages(stable_sha, api, environment=os.environ)
    if active_base != recorded_base:
        raise ValueError('active Pages baseline changed since Fast assembly')
    proof = json.loads((candidate_bundle / 'fast-delivery-proof.json').read_text(encoding='utf-8'))
    now = now if now is not None else datetime.now(timezone.utc)
    timestamp = datetime.strptime(proof['run'], '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    if (timestamp.strftime('%Y-%m-%dT%H:%M') != proof['run'] or timestamp.minute != 0
            or not timedelta(0) <= now - timestamp <= timedelta(hours=4)):
        raise ValueError('Fast run invalid or no longer fresh')
    if not candidate.is_dir() or not rollback_site.is_dir():
        raise ValueError('candidate or rollback tree absent')
    size = count_files(candidate)
    if (proof['siteBytes'] != size or proof['basePagesBytes'] != count_files(rollback_site)
            or proof['remainingPagesBytes'] != strict_budget(size, 0)
            or proof['publicationAuthorized'] is not False):
        raise ValueError('candidate size or seal does not match its proof')

    # Only the independent namespace may differ on a rolling update.
    prefix = Path('ruc/fast')
    old_pointer = rollback_site / prefix / 'paged-shadow.json'
    old_sha = sha_file(old_pointer) if old_pointer.is_file() else None
    if old_sha != proof.get('previousFastManifestSha256'):
        raise ValueError('rollback Fast pointer SHA changed')
    if old_pointer.is_file():
        old_run = json.loads(old_pointer.read_text(encoding='utf-8'))['run']
        if old_run >= proof['run']:
            raise ValueError('Fast candidate must advance the previous Fast run')
    original = {p.relative_to(rollback_site) for p in rollback_site.rglob('*') if p.is_file()
                and not p.relative_to(rollback_site).is_relative_to(prefix)}
    actual = {p.relative_to(candidate) for p in candidate.rglob('*') if p.is_file()
              and not p.relative_to(candidate).is_relative_to(prefix)}
    if original != actual or any(sha_file(rollback_site / p) != sha_file(candidate / p)
                                 for p in original):
        raise ValueError('a file outside the Fast namespace changed')
    if sha_file(rollback_site / 'ruc/latest.json') != proof['primaryManifestSha256']:
        raise ValueError('full RUC pointer SHA changed')
    with TemporaryDirectory(prefix='.mid-fast-seal-', dir=rollback_site.parent) as scratch:
        preserved = preserve_fast_pages(candidate, Path(scratch), proof['fastManifestSha256'], now=now)
    if preserved['run'] != proof['run']:
        raise ValueError('candidate Fast run differs from proof')
    return proof


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', required=True, type=Path)
    parser.add_argument('--rollback-site', required=True, type=Path)
    parser.add_argument('--stable-sha', required=True)
    args = parser.parse_args()
    print(json.dumps(verify_delivery(args.bundle, args.rollback_site, args.stable_sha),
                     sort_keys=True))


if __name__ == '__main__':
    main()
