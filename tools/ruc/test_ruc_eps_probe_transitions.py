#!/usr/bin/env python3
"""Offline transition QA for transient real DWD member indexes and Pages.

All HTTP original-directory and Pages calls are mocked; this test never
confuses real historical negative evidence with a later completed run.
"""
from __future__ import annotations

import datetime as dt
import re
from unittest import mock

import probe_ruc_eps_advertised_live as probe

guard=probe.guard
RUN='2026-11-07T22:00'
PRIOR='2026-11-07T21:00'


def original_directory(full: bool):
    def fetch(url: str, timeout: int=4) -> str:
        assert timeout==4, 'unexpected I/O budget'
        if url.endswith('/e/'):
            return ''.join(f'<a href="{n:02d}/">{n:02d}/</a>'
                           for n in range(1,21))
        m=re.search(r'/e/(\d{2})/s/$',url)
        assert m, 'unexpected DWD member path'
        hours=range(28) if full else range(4)
        names=[f'PT{h:03d}H00M.grib2' for h in hours]
        names.append('PT000H05M.grib2')  # synthetic known-format extra
        return ''.join(f'<a href="{name}">{name}</a>' for name in names)
    return fetch


with mock.patch.object(guard,'fetch_text',side_effect=original_directory(False)):
    partial=probe.probe(RUN,expected_partial=None)
    assert partial['classification'] is False and partial['errors']==[]
    assert len(partial['members'])==20
    assert sum(r['hourly'] for r in partial['members'])==80
    forced_full=probe.probe(RUN,expected_partial=False)
    assert forced_full['errors'] and forced_full['classification'] is False

with mock.patch.object(guard,'fetch_text',side_effect=original_directory(True)):
    complete=probe.probe(RUN,expected_partial=None)
    assert complete['classification'] is True and complete['errors']==[]
    assert sum(r['hourly'] for r in complete['members'])==560
    false_negative=probe.probe(RUN,expected_partial=True)
    assert false_negative['errors'] and false_negative['classification'] is True

# The same physical run can become complete, so a later QA MUST NOT
# attempt to re-create a negative outcome from a historical timestamp.
with mock.patch.object(guard,'published_meta',
                       side_effect=AssertionError('completed index must not request Pages')):
    done=probe.verify_live_pages_defer(RUN,complete)
    assert done['errors']==[] and done['wouldDefer'] is False
    assert done['freshNegativeProof'] is False

class FrozenClock(dt.datetime):
    @classmethod
    def now(cls,tz=None):
        return cls(2026,11,7,22,39,15,tzinfo=dt.timezone.utc)

# Only metadata-shape admission is mocked here. The actual deferral
# function, UTC calculations and one-run freshness constraints are real.
def evaluate(published):
    meta={'run':published,'storageProfile':guard.FULL_STORAGE_PROFILE}
    with mock.patch.object(guard,'published_meta',return_value=meta):
        with mock.patch.object(guard,'valid_pages_meta',return_value=True):
            with mock.patch.object(probe.dt,'datetime',FrozenClock):
                return probe.verify_live_pages_defer(RUN,partial)

eligible=evaluate(PRIOR)
assert eligible['errors']==[] and eligible['wouldDefer'] is True
assert eligible['expectedDefer'] is True and eligible['runGapHours']==1
caught_up=evaluate(RUN)
assert caught_up['errors']==[] and caught_up['wouldDefer'] is False
assert caught_up['expectedDefer'] is False and caught_up['runGapHours']==0
too_far_behind=evaluate('2026-11-07T20:00')
assert too_far_behind['errors']==[] and too_far_behind['wouldDefer'] is False
assert too_far_behind['expectedDefer'] is False and too_far_behind['runGapHours']==2
print('RUC EPS 22Z partial -> complete and Pages 21Z -> 22Z offline transition QA PASS')
