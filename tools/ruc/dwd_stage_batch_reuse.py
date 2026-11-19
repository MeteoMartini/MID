"""Deduplicate identical, already-resolved DWD ICON-D2 GRIB requests in one batch.

The caller's ecCodes decoder and same-run/geometry/interval checks are unchanged.
Never reuse one URL under different field or forecast-step semantics.
This module has no persistent cache, no network access and no side effects
apart from invoking its supplied loader for each *unique* source URL.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

DWD_ICON_D2_ROOT = 'https://opendata.dwd.de/weather/nwp/icon-d2/grib/'


def load_unique_source_jobs(jobs, loader, max_workers=4):
    """Return original ordered job/results with one load per exact URL.

    The caller's loader must return (hour, field, step, decoded_data, origin);
    origin must identify the fetched URL and actual compressed input SHA256.
    Duplicate caller jobs get the *same decoded_data object*, intentionally
    only for the exact same field/step URL. The underlying map builder reads
    input arrays without modifying them.
    """
    if not isinstance(jobs, (tuple, list)) or not jobs or len(jobs) > 512:
        raise ValueError('invalid DWD source batch job inventory')
    if not callable(loader) or type(max_workers) is not int or not 1 <= max_workers <= 8:
        raise ValueError('invalid DWD batch loader or bounded parallelism')

    unique = {}
    for job in jobs:
        if not isinstance(job, tuple) or len(job) != 4:
            raise ValueError('invalid DWD source job shape')
        hour, field, step, url = job
        if (type(hour) is not int or hour < 0 or hour > 120 or
            type(step) is not int or step < 0 or step > hour or
            not isinstance(field, str) or not field or
            not isinstance(url, str) or not url.startswith(DWD_ICON_D2_ROOT) or
            any(char in url for char in ('?', '#', '\\', '\n', '\r'))):
            raise ValueError('unsafe or incompatible DWD source job')
        original = unique.get(url)
        if original is None:
            unique[url] = job
        elif (original[1], original[2]) != (field, step):
            raise ValueError('cross-parameter/step source-URL collision')

    unique_jobs = list(unique.values())
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        decoded = list(pool.map(loader, unique_jobs))

    by_url = {}
    for job, result in zip(unique_jobs, decoded, strict=True):
        hour, field, step, url = job
        if (not isinstance(result, tuple) or len(result) != 5 or
            result[0:3] != (hour, field, step)):
            raise ValueError('loader returned incorrect DWD source job identity')
        _, _, _, data, origin = result
        if (not isinstance(origin, dict) or origin.get('url') != url or
            not isinstance(origin.get('sha256'), str) or
            len(origin['sha256']) != 64 or
            any(c not in '0123456789abcdef' for c in origin['sha256'])):
            raise ValueError('loader returned unverified source identity metadata')
        by_url[url] = (data, origin)

    return [(hour, field, step, by_url[url][0], dict(by_url[url][1]))
            for hour, field, step, url in jobs]
