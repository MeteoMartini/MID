"""Exact 1-hPa pressure contours from the qualified full native lookup grid.
This is the isolated numerical twin of build_model_map_fields.contours.
No DWD requests/ecCodes, no remote sources, no smoothing of extremes.
"""
import numpy as np
import contourpy
from pressure_contour_spacing import pressure_spacing,line_spacing

def contours(values,lats,lons):
    v=np.asarray(values,dtype=np.float64)
    lat=np.asarray(lats,dtype=np.float64)
    lon=np.asarray(lons,dtype=np.float64)
    result=[]
    if v.ndim!=2 or v.shape!=(len(lat),len(lon)):
        raise ValueError('pressure contour geometry differs from field grid')
    finite=np.isfinite(v)
    if len(lat)<2 or len(lon)<2 or not finite.any():return result
    cg=contourpy.contour_generator(x=lon,y=lat,z=np.ma.array(v,mask=~finite),corner_mask=False)
    gradient=pressure_spacing(v,lat,lon)
    for level in range(int(np.floor(np.nanmin(v))),int(np.ceil(np.nanmax(v)))+1):
        paths=[];spacing=[]
        for line in cg.lines(level):
            if len(line)<2:continue
            spacing.append(line_spacing(gradient,lat,lon,line))
            points=np.round(line[:,::-1],5).tolist()
            paths.extend([[a,b] for a,b in zip(points,points[1:])])
        if paths:result.append({'level':level,'paths':paths,'spacingKm':min(spacing)})
    return result
