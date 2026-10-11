"""MID model-derived MSL centres; H/T notation follows DWD, detection is MID's.

20-km smoothing suppresses grid noise, a complete 150-km neighbourhood rejects
edge/missing-data extrema, 1.2 hPa prominence and 250-km separation limit clutter.
Never interpret a centre as an official analysed or named pressure system.
"""
import numpy as np
from scipy.ndimage import gaussian_filter, maximum_filter, minimum_filter


def pressure_centers(values, lats, lons):
    values = np.asarray(values, dtype=float)
    if values.shape != (len(lats), len(lons)) or min(values.shape) < 5:
        return []
    dy = abs(float(lats[1] - lats[0])) * 111.2
    dx = abs(float(lons[1] - lons[0])) * 111.2 * max(.2, np.cos(np.deg2rad(np.mean(lats))))
    ry, rx = max(1, int(np.ceil(150 / dy))), max(1, int(np.ceil(150 / dx)))
    valid = np.isfinite(values) & (values >= 850) & (values <= 1100)
    smooth = gaussian_filter(np.where(valid, values, 0), (20 / dy, 20 / dx))
    weights = gaussian_filter(valid.astype(float), (20 / dy, 20 / dx))
    smooth = smooth / np.maximum(weights, 1e-12)
    size = (2 * ry + 1, 2 * rx + 1)
    complete = minimum_filter(valid.astype(int), size=size, mode='constant', cval=0) == 1
    high = maximum_filter(smooth, size=size, mode='nearest')
    low = minimum_filter(smooth, size=size, mode='nearest')
    candidates = []
    for kind, mask in [('H', smooth == high), ('T', smooth == low)]:
        for y, x in np.argwhere(complete & mask & (high - low >= 1.2)):
            candidates.append({'type': kind, 'lat': float(lats[y]), 'lon': float(lons[x]),
                               'value': round(float(values[y, x]), 1),
                               'prominence': round(float(high[y, x] - low[y, x]), 1)})
    selected = []
    for candidate in sorted(candidates, key=lambda c: (-c['prominence'], c['lat'], c['lon'])):
        def distance(other):
            a, b = np.deg2rad(candidate['lat']), np.deg2rad(other['lat'])
            h = np.sin((a-b)/2)**2 + np.cos(a)*np.cos(b)*np.sin(np.deg2rad(candidate['lon']-other['lon'])/2)**2
            return 12742 * np.arcsin(np.sqrt(np.clip(h, 0, 1)))
        if all(distance(other) >= 250 for other in selected):
            selected.append(candidate)
        if len(selected) == 16:
            break
    return selected
