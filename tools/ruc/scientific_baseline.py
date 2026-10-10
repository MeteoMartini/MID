"""Offline semantic reference run and provenance inventory; not a live GRIB audit."""
from __future__ import annotations

import hashlib
import json
import platform
import resource
import subprocess
import sys
import time
from pathlib import Path
from datetime import datetime, timezone
from importlib import metadata

import numpy as np
from meteo_integrity import validate_accumulation, validate_core_fields, validate_eps_member_coverage

ROOT = Path(__file__).resolve().parents[2]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reference_run() -> dict:
    """Small fixed time/point fixture, with an explicitly missing border cell."""
    values = {
        'temperature_2m': 10., 'dew_point_2m': 5.,
        'relative_humidity_2m': 70., 'pressure_msl': 1013.25,
        'cloud_cover': 1., 'cloud_cover_low': 0.,
        'wind_speed_10m': 5., 'wind_gusts_10m': 8.,
        'wind_direction_10m': 359., 'precipitation': 0.,
        'cape': 0., 'convective_inhibition': 0.,
    }
    fields = {key: np.full((3, 4), value, dtype=np.float32) for key, value in values.items()}
    for field in fields.values():
        field[:, -1] = np.nan
    accumulated = np.array([[0., 0., 0., np.nan], [1., 0., 2., np.nan],
                            [3., 0., 2., np.nan]], dtype=np.float32)
    validate_accumulation(accumulated, 'offline-reference')
    intervals = np.diff(accumulated, axis=0)
    # Exact fixture invariants: dry zero is data; the missing border stays missing.
    expected = np.array([[1., 0., 2.], [2., 0., 0.]], dtype=np.float32)
    np.testing.assert_array_equal(intervals[:, :3], expected)
    np.testing.assert_array_equal(np.isnan(intervals[:, -1]), [True, True])
    np.testing.assert_array_equal(intervals[:, :3].sum(axis=0), accumulated[-1, :3])
    members = [3, 7, 19]
    eps = np.repeat(accumulated[:, None, :], len(members), axis=1)
    result = {
        'fixture': 'mid.science.synthetic.v1',
        'scope': 'offline synthetic core/missing/member/accumulation semantics only',
        'dimensions': {'times': 3, 'points': 4, 'members': members},
        'core': validate_core_fields(fields),
        'eps': validate_eps_member_coverage(eps, members),
        'precipitationIntervalMm': intervals[:, :3].tolist(),
        'precipitationEventMm': intervals[:, :3].sum(axis=0).tolist(),
    }
    # Semantic JSON only; measurements and machine metadata are deliberately excluded.
    payload = json.dumps(result, sort_keys=True, separators=(',', ':'), allow_nan=False)
    return {**result, 'semanticSha256': hashlib.sha256(payload.encode()).hexdigest()}


def manifest() -> dict:
    before = resource.getrusage(resource.RUSAGE_SELF)
    started = time.perf_counter()
    science = reference_run()
    wall = time.perf_counter() - started
    after = resource.getrusage(resource.RUSAGE_SELF)
    paths = ['package.json', 'package-lock.json', 'MID_BASELINE.json',
             'tools/ruc/requirements.txt', 'tools/ruc/requirements-pages.txt',
             'tools/ruc/meteo_integrity.py', 'tools/ruc/grib_metadata.py',
             'tools/ruc/scientific_baseline.py']
    paths += sorted(str(path.relative_to(ROOT)) for path in ROOT.glob('MID_*CONTRACT*.md'))
    dependencies = {}
    for name in ('numpy', 'scipy', 'eccodes', 'requests', 'contourpy'):
        try:
            dependencies[name] = metadata.version(name)
        except metadata.PackageNotFoundError:
            dependencies[name] = None
    return {
        'schema': 'mid.science.baseline.v1',
        'observedAt': datetime.now(timezone.utc).isoformat(),
        'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'worktreeStatus': subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).splitlines(),
        'releaseVersion': json.loads((ROOT / 'package.json').read_text())['version'],
        'inputs': {name: digest(ROOT / name) for name in paths},
        'environment': {'python': sys.version, 'platform': platform.platform(),
                        'dependencies': dependencies},
        'reference': science,
        'measurements': {'wallSeconds': wall,
                         'cpuSeconds': after.ru_utime + after.ru_stime - before.ru_utime - before.ru_stime,
                         'processPeakRssBytes': after.ru_maxrss * (1 if sys.platform == 'darwin' else 1024),
                         'cacheMode': 'in-memory synthetic fixture; no source I/O',
                         'readBytes': None, 'writeBytes': None},
        'limitations': ['Not a real DWD GRIB decode or full native-grid benchmark.',
                        'Peak RSS covers the process, including imports; timings cover reference_run only.',
                        'Requirements ranges are inventoried, not converted to a validated native lockfile.',
                        'No CF compliance, spatial regridding, calibration, leakage or device acceptance claimed.'],
    }


if __name__ == '__main__':
    print(json.dumps(manifest(), indent=2, sort_keys=True, allow_nan=False))
