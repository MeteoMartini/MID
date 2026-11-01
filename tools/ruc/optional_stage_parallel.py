"""Bounded optional RUC source staging, without changing required GRIB contracts.

The caller supplies *independent* jobs and handles each error as an omitted
optional product. No job can mark an incomplete mandatory source valid.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor


def run_optional_downloads(specifications, worker, *, max_concurrent=2):
    """Execute independent optional jobs, return input-ordered (spec,result,error).

    Always join all submitted jobs. A failed optional job must not silently leave
    partially staged files; the caller is responsible for removing its own path.
    """
    if type(max_concurrent) is not int or not 1 <= max_concurrent <= 2:
        raise ValueError('optional parameter concurrency must be 1 or 2')
    items = list(specifications)
    if len(items) != len({str(item) for item in items}):
        raise ValueError('duplicate optional stage specification')
    if not items:
        return []
    with ThreadPoolExecutor(max_workers=max_concurrent, thread_name_prefix='ruc-optional') as pool:
        futures = [pool.submit(worker, spec) for spec in items]
        output = []
        for spec, future in zip(items, futures):
            try:
                value = future.result()
            except Exception as error:
                output.append((spec, None, error))
            else:
                output.append((spec, value, None))
    return output
