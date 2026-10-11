"""Numerical one-hPa spacing estimate; never infer gradients from map pixels."""
import numpy as np

def pressure_spacing(values, lats, lons):
    # hPa/km on the exact contour grid. Missing cells do not invent a gradient.
    dy, dx = np.gradient(values)
    gy = dy / (abs(lats[1]-lats[0])*111.2)
    gx = dx / (abs(lons[1]-lons[0])*111.2*np.cos(np.deg2rad(lats))[:,None])
    return np.hypot(gx,gy)

def line_spacing(gradient, lats, lons, line):
    y=np.clip(np.rint((line[:,1]-lats[0])/(lats[1]-lats[0])).astype(int),0,len(lats)-1)
    x=np.clip(np.rint((line[:,0]-lons[0])/(lons[1]-lons[0])).astype(int),0,len(lons)-1)
    sampled=gradient[y,x];sampled=sampled[np.isfinite(sampled)]
    return round(min(5000.,1/max(float(sampled.max()),.0002)),3) if sampled.size else 0.
