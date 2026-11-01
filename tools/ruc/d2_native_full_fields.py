#!/usr/bin/env python3
"""Fail-closed eight-product native ICON-D2 *read-only* scalar derivation.

Inputs must be SHA/WMO/bitmap/CLAT/CLON-qualified original germany_icosahedral
GRIB values from the SAME model cycle, forecast lead and native cell order.
A valid zero is never missing; all NaNs propagate as explicit NoData.
This is a QA/PILOT, not a Pages/Worker/latest.json publisher.
"""
from __future__ import annotations
import math
import numpy as np

NATIVE_POINTS=542040
SOURCE_FIELDS=('t_2m','pmsl','u_10m','v_10m','vmax_10m','clct','ww','t','relhum','tot_prec')
PRODUCT_UNITS={'temperature':'°C','pressure':'hPa','wind':'km/h','gust':'km/h',
               'cloud':'%','thetae':'K','sigwx':'WMO','precipitation':'mm/1 h'}
BOUNDS={'temperature':(-100,70),'pressure':(800,1100),'wind':(0,600),
        'gust':(0,600),'cloud':(0,100.01),'thetae':(150,500),
        'sigwx':(0,99),'precipitation':(0,6500)}

def _field(raw,name,points):
    if name not in raw:raise ValueError('Missing original native source '+name)
    value=np.asarray(raw[name],dtype=np.float64)
    if value.ndim!=1 or len(value)!=points or np.isinf(value).any():
        raise ValueError('Invalid native grid/Infinity for '+name)
    if not np.isfinite(value).any():
        raise ValueError('Entire native source missing: '+name)
    return value

def _unit(units,field,allowed):
    if units.get(field) not in allowed:
        raise ValueError('Original DWD unit/parameter drift for '+field+': '+str(units.get(field)))

def _fraction(values,unit):
    return values*100 if unit=='1' else values

def _theta_e(t,rh):
    """Preserve established MID 850-hPa Bolton-style calculation, with NaN masks.
    
    The 0.01% computational RH floor is for the logarithm only; source 0%
    remains a valid reading and is never substituted for a missing value.
    """
    c=t-273.15
    e=np.maximum(rh,0.01)/100*6.112*np.exp(17.67*c/(c+243.5))
    mix=.622*e/np.maximum(1,850-e)
    dew=243.5*np.log(e/6.112)/(17.67-np.log(e/6.112))+273.15
    tl=1/(1/(dew-56)+np.log(t/dew)/800)+56
    return t*(1000/(850-e))**(2/7)*(t/tl)**(.28*mix)*np.exp((3036/tl-1.78)*mix*(1+.448*mix))

def derive_eight(raw:dict,units:dict,previous_total,previous_unit,*,points=NATIVE_POINTS):
    """Derive all eight already offered D2 map kinds from original native cells.

    previous_total MUST be the original cumulative TOT_PREC at lead-1 hour,
    exactly the same model run, native grid/bitmap and source index order.
    No adjacent-run fallback, precipitation reset, smoothing or interpolation.
    """
    if type(points) is not int or points<2:raise ValueError('Invalid native point count')
    data={name:_field(raw,name,points) for name in SOURCE_FIELDS}
    prev=_field({'previous_tot_prec':previous_total},'previous_tot_prec',points)
    for f in ('t_2m','t'):_unit(units,f,('K',))
    _unit(units,'pmsl',('Pa',))
    for f in ('u_10m','v_10m','vmax_10m'):_unit(units,f,('m s-1','m s**-1'))
    for f in ('clct','relhum'):_unit(units,f,('%','1'))
    _unit(units,'ww',('Numeric','Code table (4.201)','~','1'))
    _unit(units,'tot_prec',('kg m**-2','kg m-2','mm'))
    if previous_unit != units['tot_prec']:raise ValueError('Previous TOT_PREC original units changed')
    cloud=_fraction(data['clct'],units['clct'])
    rh=_fraction(data['relhum'],units['relhum'])
    for field,v,hi in [('clct',cloud,100.01),('relhum',rh,150)]:
        ok=np.isfinite(v)
        if np.any((v[ok]<0)|(v[ok]>hi)):raise ValueError('Unphysical native '+field)
    for f in ('tot_prec',):
        for v in (data[f],prev):
            ok=np.isfinite(v)
            if np.any(v[ok]<0):raise ValueError('Negative original cumulative precipitation')
    delta=data['tot_prec']-prev
    ok=np.isfinite(delta)
    if np.any(delta[ok]<-1e-6):
        raise ValueError('Original cumulative TOT_PREC reset or wrong same-run interval')
    if np.any((delta[ok]<0)):
        raise ValueError('Rounding discrepancy in precipitation accumulation needs original review')
    products={
        'temperature':data['t_2m']-273.15,
        'pressure':data['pmsl']/100,
        'wind':np.hypot(data['u_10m'],data['v_10m'])*3.6,
        'gust':data['vmax_10m']*3.6,
        'cloud':cloud,
        'thetae':_theta_e(data['t'],rh),
        'sigwx':data['ww'].copy(),
        'precipitation':delta,
    }
    for key,arr in products.items():
        if arr.shape!=(points,) or np.isinf(arr).any():raise ValueError('Derived native geometry/nonfinite overflow '+key)
        good=np.isfinite(arr)
        if not good.any():raise ValueError('Empty original native output '+key)
        low,high=BOUNDS[key]
        if np.any((arr[good]<low)|(arr[good]>high)):
            raise ValueError('Unphysical original native '+key+'; no extreme clipping')
        if key=='sigwx' and not np.array_equal(arr[good],np.rint(arr[good])):
            raise ValueError('Native WMO codes must be categorical integers')
    return products

def sample_native(values,lookup,*,limit=12_000_000):
    """Pixel display is nearest SOURCE native cell; NoData never becomes zero."""
    v=np.asarray(values,dtype=np.float64)
    ids=np.asarray(lookup)
    if v.ndim!=1 or ids.ndim!=2 or ids.dtype.kind!='u' or ids.dtype.itemsize!=4:
        raise ValueError('Unverified native lookup geometry')
    inside=ids!=np.uint32(0xffffffff)
    if np.any(inside & (ids>=v.size)):raise ValueError('Lookup exceeds native source index')
    if ids.size*8>limit:raise ValueError('Display-pixel memory budget exceeded')
    pixels=np.full(ids.shape,np.nan,dtype=np.float64)
    pixels[inside]=v[ids[inside]]
    display=np.isfinite(pixels)
    source=np.isfinite(v)
    if not source.any() or not display.any():raise ValueError('No actual full-grid source/display values')
    original=(float(v[source].min()),float(v[source].max()))
    sampled=(float(pixels[display].min()),float(pixels[display].max()))
    return {'values':pixels,'nativeMin':original[0],'nativeMax':original[1],
            'displayMin':sampled[0],'displayMax':sampled[1],
            'nativeExtremeNotSampled':sampled[0]>original[0] or sampled[1]<original[1],
            'nativeMissing':int((~source).sum()),'displayMissing':int((~display).sum()),
            'validZeroNative':int(np.count_nonzero(source & (v==0)))}
