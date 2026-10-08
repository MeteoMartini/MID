"""Bounded nearest-native-cell remapping for ICON Global synoptic fields.

No extrapolation: all components share the same SHA-proven coordinate mapping.
The 0.25 degree display grid is coarser than the native ~13 km triangles.
"""
import bz2, hashlib, re, tempfile
import numpy as np
import requests
from scipy.spatial import cKDTree
from eccodes import codes_grib_new_from_file,codes_get,codes_get_array,codes_release

def sphere(lat,lon):
    lat,lon=np.radians(lat),np.radians(lon)
    return np.column_stack((np.cos(lat)*np.cos(lon),np.cos(lat)*np.sin(lon),np.sin(lat)))

def native_mapping(lat,lon,uuid):
    if lat.shape!=lon.shape or lat.ndim!=1 or not uuid or not np.isfinite(lat).all() or not np.isfinite(lon).all() or np.any(abs(lat)>90) or np.any(abs(lon)>180):raise ValueError('invalid ICON coordinate grid')
    lats=np.arange(29.5,70.5+.01,.25);lons=np.arange(-23.5,62.5+.01,.25)
    keep=np.where((lat>=28.5)&(lat<=71.5)&(lon>=-24.5)&(lon<=63.5))[0]
    if len(keep)<10:raise ValueError('ICON grid outside Europe')
    x,y=np.meshgrid(lons,lats);distance,index=cKDTree(sphere(lat[keep],lon[keep])).query(sphere(y.ravel(),x.ravel()))
    valid=distance<=2*np.sin(30/6371/2)
    if valid.mean()<.99:raise ValueError('incomplete ICON coordinate coverage')
    return {'lats':lats,'lons':lons,'indices':keep[index],'valid':valid,'points':len(lat),'uuid':uuid}

def load_icon_grid(root,run):
    coords={};origins=[];identity=None
    for param in ('clat','clon'):
        url=root+param+'/';r=requests.get(url,timeout=25);r.raise_for_status()
        names=re.findall(r'href="([^"/]+\.grib2.bz2)"',r.text)
        names=[n for n in names if n.lower()==f'icon_global_icosahedral_time-invariant_{run}_{param}.grib2.bz2']
        if len(names)!=1:raise ValueError('ICON coordinate identity not unique')
        r=requests.get(url+names[0],timeout=60);r.raise_for_status()
        if len(r.content)>32_000_000:raise ValueError('ICON coordinate budget')
        with tempfile.TemporaryFile() as f:
            f.write(bz2.decompress(r.content));f.seek(0);gid=codes_grib_new_from_file(f)
            if gid is None:raise ValueError('empty ICON coordinate field')
            try:
                uuid=str(codes_get(gid,'uuidOfHGrid'));unit=str(codes_get(gid,'units'))
                if codes_get(gid,'shortName')!=('tlat' if param=='clat' else 'tlon') or codes_get(gid,'gridType')!='unstructured_grid':raise ValueError('ICON coordinate parameter/grid')
                if identity and identity!=uuid:raise ValueError('ICON coordinate grids differ')
                identity=uuid;values=np.asarray(codes_get_array(gid,'values'))
                if unit in ('rad','radian','radians'):values=np.degrees(values)
                elif unit not in ('degree','degrees','deg','Degree N' if param=='clat' else 'Degree E'):raise ValueError('ICON coordinate unit')
                coords[param]=values
            finally:codes_release(gid)
        origins.append({'url':r.url,'sha256':hashlib.sha256(r.content).hexdigest()})
    return native_mapping(coords['clat'],coords['clon'],identity),origins

def remap_native(gid,mapping):
    if str(codes_get(gid,'uuidOfHGrid'))!=mapping['uuid']:raise ValueError('ICON forecast grid identity mismatch')
    values=np.asarray(codes_get_array(gid,'values'))
    if len(values)!=mapping['points']:raise ValueError('ICON forecast grid point count mismatch')
    values=values[mapping['indices']].copy();values[~mapping['valid']]=np.nan;values[values==codes_get(gid,'missingValue')]=np.nan
    return mapping['lats'],mapping['lons'],values.reshape(len(mapping['lats']),len(mapping['lons']))
