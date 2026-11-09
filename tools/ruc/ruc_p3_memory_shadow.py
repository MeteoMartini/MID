"""QA-only P3 full-builder lifetime experiment; never imported by the MID producer.

Do not activate independently of strict original DWD wire-byte, RSS and
scientific-valid-time A/B verification. Unmodified production source is
read, compared against one known code block and compiled IN MEMORY ONLY.
"""
from __future__ import annotations

import ast
from pathlib import Path
import numpy as np

OLD = ''' eps,members=collect_eps(eps_files,eps_times,point_count,expected_members=range(1,21))
 eps_period_summary=rapid_extreme_eps_period_summary(eps,eps_times,a.run)
 extreme=build_rapid_extreme_summary(base_grid[0],base_grid[1],a.run,rapid15_times,rapid_precip15,np.stack([rapid_cape[t] for t in rapid15_times]),np.stack([rapid_cin[t] for t in rapid15_times]),rapid_precip5,severe_for_extreme,deterministic_times=det_times,deterministic_fields=fields,specialist_fields=specialist_fields,phase_fields=phase_for_extreme,eps_period_summary=eps_period_summary)
'''
NEW = ''' # QA-only: seal all deterministic/native-rapid regional fields before EPS20.
 # The original builder's wire/output contract is checked independently.
 extreme=build_rapid_extreme_summary(base_grid[0],base_grid[1],a.run,rapid15_times,rapid_precip15,np.stack([rapid_cape[t] for t in rapid15_times]),np.stack([rapid_cin[t] for t in rapid15_times]),rapid_precip5,severe_for_extreme,deterministic_times=det_times,deterministic_fields=fields,specialist_fields=specialist_fields,phase_fields=phase_for_extreme,eps_period_summary={})
 # All these native arrays have been written to the sealed object files.
 # Keep only tiny regional scalars while decoding the 20-member full cube.
 del fields,specialist_fields,severe_fields,severe_for_extreme,phase_for_extreme,dbz_cube,rapid_precip15,rapid_precip5,rapid_cape,rapid_cin
 eps,members=collect_eps(eps_files,eps_times,point_count,expected_members=range(1,21))
 eps_period_summary=rapid_extreme_eps_period_summary(eps,eps_times,a.run)
 _p3_qa_attach_eps(extreme,eps_period_summary,base_grid)
'''
EPS_SCALARS = (
    ('epsMemberCount', 'memberCount', 0),
    ('epsWetProbabilityPct', 'wetProbabilityPct', 0),
    ('epsSignificantProbabilityPct', 'significantProbabilityPct', 0),
    ('epsMax1hQ75Mm', 'max1hQ75Mm', 2),
    ('epsTotalQ75Mm', 'totalQ75Mm', 2),
)
EPS_SERIES = (
    ('epsRain1hProbabilityPct', 'rain1hProbabilityPct'),
    ('epsRain6hProbabilityPct', 'rain6hProbabilityPct'),
)


def _xyz(lat, lon):
    p = np.radians(lat)
    l = np.radians(lon)
    c = np.cos(p)
    return np.column_stack((c * np.cos(l), c * np.sin(l), np.sin(p)))


def attach_eps(extreme, eps_period_summary, base_grid):
    """Append original EPS scalars in original order, without regridding.

    Position is reconstructed from the original regional 13x23 cell axis,
    never from rounded coordinates; use the original nearest-point KD-tree.
    """
    from scipy.spatial import cKDTree
    if extreme.get('schema') != 'mid.dwd.ruc.rapid-extreme.v4':
        raise ValueError('P3 regional source schema changed')
    grid = extreme['grid']
    rows, cols = grid['rows'], grid['cols']
    bounds = grid['bounds']
    if rows != 13 or cols != 23 or not all(k in bounds for k in ('south', 'west', 'north', 'east')):
        raise ValueError('P3 native regional sampling contract changed')
    south, west, north, east = (bounds[k] for k in ('south', 'west', 'north', 'east'))
    lats, lons = base_grid
    if not isinstance(lats, np.ndarray) or not isinstance(lons, np.ndarray) or lats.shape != lons.shape:
        raise ValueError('P3 original native grid mismatch')
    tree = cKDTree(_xyz(np.asarray(lats, dtype=np.float64), np.asarray(lons, dtype=np.float64)))

    expected_positions = []
    for r in range(rows):
        lat = south + (north - south) * r / (rows - 1)
        for c in range(cols):
            lon = west + (east - west) * c / (cols - 1)
            distance, index = tree.query(_xyz(np.array([lat]), np.array([lon]))[0], k=1)
            km = 2 * 6371.0088 * np.arcsin(min(1, float(distance) / 2))
            if km <= 8:
                expected_positions.append((round(lat, 4), round(lon, 4), int(index)))
    cells = extreme['cells']
    if len(cells) != len(expected_positions):
        raise ValueError('P3 regional cell count changed')

    def value_at(values, index, digits=1):
        if values is None:
            return None
        value = float(values[index])
        return round(value, digits) if np.isfinite(value) else None

    for cell, (lat, lon, index) in zip(cells, expected_positions, strict=True):
        if cell['latitude'] != lat or cell['longitude'] != lon:
            raise ValueError('P3 regional cell order changed')
        if tuple(cell['periods']) != ('0-6', '6-12', '12-14'):
            raise ValueError('P3 extreme window ordering changed')
        for pid, row in cell['periods'].items():
            src = eps_period_summary.get(pid) or {}
            for out_key, source_key, digits in EPS_SCALARS:
                value = value_at(src.get(source_key), index, digits)
                if value is not None:
                    row[out_key] = value
            for out_key, source_key in EPS_SERIES:
                values = src.get(source_key)
                if values is not None:
                    series = []
                    for level_values in np.asarray(values):
                        value = value_at(level_values, index, 0)
                        series.append(int(value) if value is not None else None)
                    if any(value is not None for value in series):
                        row[out_key] = series
    return extreme


def install_qa_only_memory_main(production):
    """Replace only QA interpreter's in-memory main(), fail on source drift."""
    source = Path(production.__file__).read_text(encoding='utf-8')
    parsed = ast.parse(source)
    matches = [n for n in parsed.body if isinstance(n, ast.FunctionDef) and n.name == 'main']
    if len(matches) != 1:
        raise ValueError('P3 main() source signature changed')
    function = ast.get_source_segment(source, matches[0])
    if function is None or function.count(OLD) != 1:
        raise ValueError('P3 expected exact default builder block absent')
    changed = function.replace(OLD, NEW)
    if changed == function or changed.count('_p3_qa_attach_eps(extreme,eps_period_summary,base_grid)') != 1:
        raise ValueError('P3 QA reorder did not preserve expected single transformation')
    compiled = compile(changed, str(production.__file__) + ':qa-memory-only', 'exec')
    production.__dict__['_p3_qa_attach_eps'] = attach_eps
    exec(compiled, production.__dict__)
    return production.main
