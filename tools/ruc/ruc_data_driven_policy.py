#!/usr/bin/env python3
"""Pure RUC qualification trigger policy (no GitHub, Cloudflare or secret access).

An advertised directory may request a bounded independent qualification, but
may NOT dispatch or authorize production. Both providers must use the same
persisted authoritative single-flight owner before production activation.
"""
from datetime import datetime,timezone,timedelta
import re
from ruc_fast_lane_producer import canonical_run

_SHA=re.compile(r'^[a-f0-9]{40}

def decide_qualification(*, advertised_run, published_run, active_run, main_sha,
                         stable_sha, last_qualification_run=None, now=None,
                         observed_inventory_sha256=None, last_inventory_sha256=None):
    result={'schema':'mid.ruc.qualification-decision.v1','qualify':False,
            'productionDispatchAuthorized':False,'reason':'unknown'}
    if not isinstance(main_sha,str) or not _SHA.fullmatch(main_sha) or not isinstance(stable_sha,str) or not _SHA.fullmatch(stable_sha):
        return {**result,'reason':'unverifiable source identities'}
    if main_sha!=stable_sha:return {**result,'reason':'MID main/stable drift'}
    try:
        if not advertised_run or not published_run:
            raise ValueError('unknown DWD or production state')
        advertised=canonical_run(advertised_run)
        published=canonical_run(published_run)
        if active_run:canonical_run(active_run)
        if last_qualification_run:canonical_run(last_qualification_run)
        t=datetime.strptime(advertised,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        instant=now or datetime.now(timezone.utc)
        if instant.tzinfo is None or instant.utcoffset()!=timedelta(0):
            raise ValueError('invalid UTC clock')
        lag=(instant-t).total_seconds()/60
        if lag<0 or lag>240:raise ValueError('future or expired DWD advertisement')
    except (ValueError,TypeError):return {**result,'reason':'invalid/missing DWD run or clock'}
    if advertised<=published:return {**result,'reason':'already published or stale'}
    if active_run and advertised<=active_run:return {**result,'reason':'same or newer build in flight'}
    if last_qualification_run and advertised<=last_qualification_run:
        # A previously incomplete DWD run may legitimately gain additional
        # fields. Retry only when the independently observed file inventory
        # fingerprint changes; directory timestamps alone are insufficient.
        changed=(advertised==last_qualification_run and
                 isinstance(observed_inventory_sha256,str) and
                 isinstance(last_inventory_sha256,str) and
                 _INVENTORY.fullmatch(observed_inventory_sha256) and
                 _INVENTORY.fullmatch(last_inventory_sha256) and
                 observed_inventory_sha256!=last_inventory_sha256)
        if not changed:
            return {**result,'reason':'already attempted; no independently changed inventory'}
    return {**result,'qualify':True,
            'reason':'candidate may enter independent GRIB/bitmap/units/EPS verification only',
            'needsSignedProducerAndSingleFlight':True})
_INVENTORY=re.compile(r'^[a-f0-9]{64}

def decide_qualification(*, advertised_run, published_run, active_run, main_sha,
                         stable_sha, last_qualification_run=None, now=None):
    result={'schema':'mid.ruc.qualification-decision.v1','qualify':False,
            'productionDispatchAuthorized':False,'reason':'unknown'}
    if not isinstance(main_sha,str) or not _SHA.fullmatch(main_sha) or not isinstance(stable_sha,str) or not _SHA.fullmatch(stable_sha):
        return {**result,'reason':'unverifiable source identities'}
    if main_sha!=stable_sha:return {**result,'reason':'MID main/stable drift'}
    try:
        if not advertised_run or not published_run:
            raise ValueError('unknown DWD or production state')
        advertised=canonical_run(advertised_run)
        published=canonical_run(published_run)
        if active_run:canonical_run(active_run)
        if last_qualification_run:canonical_run(last_qualification_run)
        t=datetime.strptime(advertised,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        instant=now or datetime.now(timezone.utc)
        if instant.tzinfo is None or instant.utcoffset()!=timedelta(0):
            raise ValueError('invalid UTC clock')
        lag=(instant-t).total_seconds()/60
        if lag<0 or lag>240:raise ValueError('future or expired DWD advertisement')
    except (ValueError,TypeError):return {**result,'reason':'invalid/missing DWD run or clock'}
    if advertised<=published:return {**result,'reason':'already published or stale'}
    if active_run and advertised<=active_run:return {**result,'reason':'same or newer build in flight'}
    if last_qualification_run and advertised<=last_qualification_run:
        return {**result,'reason':'already qualified or failed recently; await new proof'}
    return {**result,'qualify':True,
            'reason':'candidate may enter independent GRIB/bitmap/units/EPS verification only',
            'needsSignedProducerAndSingleFlight':True})


def decide_qualification(*, advertised_run, published_run, active_run, main_sha,
                         stable_sha, last_qualification_run=None, now=None):
    result={'schema':'mid.ruc.qualification-decision.v1','qualify':False,
            'productionDispatchAuthorized':False,'reason':'unknown'}
    if not isinstance(main_sha,str) or not _SHA.fullmatch(main_sha) or not isinstance(stable_sha,str) or not _SHA.fullmatch(stable_sha):
        return {**result,'reason':'unverifiable source identities'}
    if main_sha!=stable_sha:return {**result,'reason':'MID main/stable drift'}
    try:
        if not advertised_run or not published_run:
            raise ValueError('unknown DWD or production state')
        advertised=canonical_run(advertised_run)
        published=canonical_run(published_run)
        if active_run:canonical_run(active_run)
        if last_qualification_run:canonical_run(last_qualification_run)
        t=datetime.strptime(advertised,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        instant=now or datetime.now(timezone.utc)
        if instant.tzinfo is None or instant.utcoffset()!=timedelta(0):
            raise ValueError('invalid UTC clock')
        lag=(instant-t).total_seconds()/60
        if lag<0 or lag>240:raise ValueError('future or expired DWD advertisement')
    except (ValueError,TypeError):return {**result,'reason':'invalid/missing DWD run or clock'}
    if advertised<=published:return {**result,'reason':'already published or stale'}
    if active_run and advertised<=active_run:return {**result,'reason':'same or newer build in flight'}
    if last_qualification_run and advertised<=last_qualification_run:
        return {**result,'reason':'already qualified or failed recently; await new proof'}
    return {**result,'qualify':True,
            'reason':'candidate may enter independent GRIB/bitmap/units/EPS verification only',
            'needsSignedProducerAndSingleFlight':True}
