#!/usr/bin/env python3
"""RADOLAN RW: strictly hourly, non-overlapping gauge-adjusted observations.

DWD provides current RW as ODIM-H5 (1200 x 1100, WGS84 stereographic)
and historically as RADOLAN binary BZ2 (900 x 900, spherical stereographic).
Never reinterpret one grid as the other; absent source hours remain absent.
"""
import bz2, hashlib, io, json, re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
import h5py
import numpy as np
import requests
from pyproj import CRS, Transformer

ROOT='https://opendata.dwd.de/weather/radar/radolan/rw/'
WINDOWS=(1,6,12,24,48)
H5_SHAPE=(1200,1100)
# Published ODIM-H5 RW 1-km cell-centre coordinates, wradlib RADOLAN guide.
H5_X0=-543196.835218
H5_Y0=-3622588.861931
H5_GRID_M=1000.0
H5_PROJECTION=CRS.from_proj4('+proj=stere +lat_0=90 +lat_ts=60 +lon_0=10 +datum=WGS84 +units=m +no_defs')
H5_TRANSFORMER=Transformer.from_crs('EPSG:4326',H5_PROJECTION,always_xy=True)

def decode_rw(payload,expected=None):
    """Old, spherical 900x900 RADOLAN packed format; no ODIM reinterpretation."""
    raw=bz2.decompress(payload);offset=raw.index(b'\x03');header=raw[:offset].decode('ascii')
    if not header.startswith('RW') or not re.search(r'INT\s*60(?:\s|GP)',header):raise ValueError('not an hourly RW product')
    geometry=re.search(r'GP\s*(\d+)x\s*(\d+)',header)
    if not geometry or tuple(map(int,geometry.groups()))!=(900,900):raise ValueError('unsupported binary RADOLAN grid')
    precision=re.search(r'PR\s*E([+-]\d+)',header)
    if not precision:raise ValueError('missing RW precision')
    values=np.frombuffer(raw[offset+1:],dtype='<u2')
    if len(values)!=900*900:raise ValueError('incomplete RW binary payload')
    stamp=re.match(r'RW(\d{2})(\d{4})10000(\d{2})(\d{2})',header)
    if not stamp:raise ValueError('missing RW timestamp')
    actual=datetime.strptime(stamp[4]+stamp[3]+stamp[1]+stamp[2],'%y%m%d%H%M').replace(tzinfo=timezone.utc)
    if expected is not None and actual!=expected:raise ValueError('RW timestamp mismatch')
    missing=(values&0xe000)!=0
    result=(values&0xfff).astype(np.float64)*10**int(precision[1])
    result[missing]=np.nan
    return result.reshape(900,900)

def sample_indices(lats,lons):
    """Legacy spherical RADOLAN binary layout; row increases northwards."""
    lat,lon=np.meshgrid(np.radians(lats),np.radians(lons),indexing='ij')
    factor=6370040*(1+np.sin(np.radians(60)))*np.cos(lat)/(1+np.sin(lat))
    x=factor*np.sin(lon-np.radians(10));y=-factor*np.cos(lon-np.radians(10))
    col=np.floor((x+523462.1669218559)/1000).astype(int)
    row=np.floor((y+4658644.724265572)/1000).astype(int)
    valid=(row>=0)&(row<900)&(col>=0)&(col<900)
    return np.clip(row,0,899),np.clip(col,0,899),valid

def hdf5_sample_indices(lats,lons):
    """ODIM-H5 grid rows run from northernmost cell towards the south."""
    lon,lat=np.meshgrid(lons,lats,indexing='xy')
    x,y=H5_TRANSFORMER.transform(lon,lat)
    col=np.rint((x-H5_X0)/H5_GRID_M).astype(np.int32)
    row=np.rint((H5_Y0-y)/H5_GRID_M).astype(np.int32)
    valid=np.isfinite(x)&np.isfinite(y)&(row>=0)&(row<H5_SHAPE[0])&(col>=0)&(col<H5_SHAPE[1])
    return np.clip(row,0,H5_SHAPE[0]-1),np.clip(col,0,H5_SHAPE[1]-1),valid

def _text(value):
    return value.decode('utf-8').strip('\x00') if isinstance(value,bytes) else str(value)

def _date_time(date,time):
    date=_text(date);time=_text(time)
    if not re.fullmatch(r'\d{8}',date) or not re.fullmatch(r'\d{4}(?:\d{2})?',time):raise ValueError('ODIM RW timestamp is not explicit')
    return datetime.strptime(date+time[:4],'%Y%m%d%H%M').replace(tzinfo=timezone.utc)

def decode_rw_hdf5(payload,expected,lats,lons):
    """Decode only verified ODIM-H5 ACRR fields, preserving NoData and extremes."""
    with h5py.File(io.BytesIO(payload),'r') as f:
        if not all(path in f for path in ['where','dataset1/what','dataset1/data1/what','dataset1/data1/data']):raise ValueError('ODIM RW metadata or field missing')
        where=f['where'].attrs;dwhat=f['dataset1/what'].attrs;what=f['dataset1/data1/what'].attrs
        data=f['dataset1/data1/data']
        if data.shape!=H5_SHAPE:raise ValueError(f'ODIM RW native geometry changed: {data.shape}')
        if int(where.get('xsize',0))!=1100 or int(where.get('ysize',0))!=1200:raise ValueError('ODIM RW axis metadata mismatch')
        if abs(float(where.get('xscale',0))-1000)>.001 or abs(float(where.get('yscale',0))-1000)>.001:raise ValueError('ODIM RW metric resolution mismatch')
        projdef=_text(where.get('projdef',''))
        if not re.search(r'\+proj=stere\b',projdef) or not re.search(r'\+lat_ts=60(?:\.0+)?(?:\s|$)',projdef) or not re.search(r'\+lon_0=10(?:\.0+)?(?:\s|$)',projdef):raise ValueError('ODIM RW projection is not verified polar stereographic')
        if _text(what.get('quantity','')).upper()!='ACRR':raise ValueError('ODIM product is not accumulated precipitation')
        stamp=_date_time(dwhat.get('enddate',''),dwhat.get('endtime',''))
        if stamp!=expected:raise ValueError('ODIM RW validity differs from filename')
        if 'startdate' in dwhat and 'starttime' in dwhat:
            start=_date_time(dwhat['startdate'],dwhat['starttime'])
            if stamp-start!=timedelta(hours=1):raise ValueError('ODIM RW accumulation is not 60 minutes')
        for key in ['gain','offset','nodata','undetect']:
            if key not in what:raise ValueError(f'ODIM RW {key} missing')
        gain=float(what['gain']);offset=float(what['offset']);nodata=float(what['nodata']);undetect=float(what['undetect'])
        if not np.isfinite([gain,offset,nodata,undetect]).all() or not 0<gain<10 or abs(offset)>10 or nodata==undetect:raise ValueError('ODIM RW scaling or masks invalid')
        raw=data[()]
        rows,cols,valid=hdf5_sample_indices(lats,lons)
        samples=raw[rows,cols].astype(np.float64)
        missing=(samples==nodata)|(~valid)
        result=samples*gain+offset
        result[samples==undetect]=0.0
        result[missing|(result<0)|(~np.isfinite(result))]=np.nan
        return result

def sum_complete(fields):
    stack=np.stack(fields);valid=np.isfinite(stack).all(axis=0)
    values=np.rint(np.nansum(stack,axis=0)*10).astype(np.int32)
    values[~valid]=-1
    if np.any(values[valid]>65000):raise ValueError('RW accumulation exceeds current verified publication range')
    return values

def catalog_rw(html):
    names=re.findall(r'href="(raa01-rw_10000-(\d{10})-dwd---bin\.(bz2|hdf5))"',html,re.I)
    records={}
    for name,stamp,fmt in names:
        at=datetime.strptime(stamp,'%y%m%d%H%M').replace(tzinfo=timezone.utc)
        # Prefer new supported ODIM-H5 when the same timestamp has both formats.
        choices=records.setdefault(at,{})
        choices[fmt.lower()]=name
    return records

def build(output,now=None):
    now=now or datetime.now(timezone.utc)
    response=requests.get(ROOT,timeout=25);response.raise_for_status()
    files=catalog_rw(response.text)
    candidates=sorted((stamp for stamp in files if stamp.minute==50 and stamp<=now and now-stamp<timedelta(hours=3)),reverse=True)
    if not candidates:raise RuntimeError('no fresh aligned RW hour (check DWD ODIM-H5 catalog)')
    end=candidates[0]
    lats=np.round(np.arange(47,55.201,.04),6);lons=np.round(np.arange(5.5,15.601,.04),6)
    legacy_rows,legacy_cols,legacy_covered=sample_indices(lats,lons)
    stamps=[end-timedelta(hours=i) for i in range(48)]
    def load(stamp):
        choices=files.get(stamp)
        if not choices:return stamp,None,None
        # Never substitute a different valid time or a rolling ten-minute window.
        for fmt in ('hdf5','bz2'):
            if fmt not in choices:continue
            url=ROOT+choices[fmt]
            try:
                resp=requests.get(url,timeout=25);resp.raise_for_status()
                if fmt=='hdf5':sampled=decode_rw_hdf5(resp.content,stamp,lats,lons)
                else:
                    field=decode_rw(resp.content,stamp)
                    sampled=field[legacy_rows,legacy_cols].copy();sampled[~legacy_covered]=np.nan
                return stamp,sampled,{'url':url,'format':fmt,'sha256':hashlib.sha256(resp.content).hexdigest()}
            except (requests.RequestException,ValueError,OSError,KeyError):
                continue
        return stamp,None,None
    with ThreadPoolExecutor(max_workers=4) as pool:loaded=list(pool.map(load,stamps))
    by_time={stamp:field for stamp,field,_ in loaded if field is not None}
    frames=[]
    for hours in WINDOWS:
        required=stamps[:hours]
        if any(stamp not in by_time for stamp in required):continue
        values=sum_complete([by_time[stamp] for stamp in required]);good=values[values>=0]
        if not good.size:continue
        frames.append({'hours':hours,'validFrom':(end-timedelta(hours=hours)).isoformat(),'validTo':end.isoformat(),'maximum':float(good.max())/10,'values':values.ravel().tolist()})
    if not frames:raise RuntimeError('no complete RW accumulation window (ODIM-H5/schema/geometry/source hours require investigation)')
    data={'schema':'mid.radolan.observed.v1','kind':'observed','run':end.isoformat(),'generatedAt':now.isoformat(),'source':'DWD RADOLAN RW · stationsangeeichte Radaranalyse','license':'CC BY 4.0','attribution':'Daten: Deutscher Wetterdienst, bearbeitet durch MID','grid':'RADOLAN 1 km, Darstellung auf 0,04° Lat/Lon-Raster','scale':.1,'lats':lats.tolist(),'lons':lons.tolist(),'frames':frames,'origins':[origin for _,_,origin in loaded if origin]}
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False)+'\n')
    return data

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);build(p.parse_args().output)
