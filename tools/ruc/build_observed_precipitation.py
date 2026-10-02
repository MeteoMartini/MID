#!/usr/bin/env python3
"""Non-overlapping, gauge-adjusted RADOLAN RW hours; missing cells stay missing."""
import bz2,hashlib,json,re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
import requests

ROOT='https://opendata.dwd.de/weather/radar/radolan/rw/'
WINDOWS=(1,6,12,24,48)

def decode_rw(payload,expected=None):
    raw=bz2.decompress(payload);offset=raw.index(b'\x03');header=raw[:offset].decode('ascii')
    if not header.startswith('RW') or not re.search(r'INT\s*60(?:\s|GP)',header):raise ValueError('not an hourly RW product')
    geometry=re.search(r'GP\s*(\d+)x\s*(\d+)',header)
    if not geometry or tuple(map(int,geometry.groups()))!=(900,900):raise ValueError('unsupported RADOLAN grid')
    precision=re.search(r'PR\s*E([+-]\d+)',header)
    if not precision:raise ValueError('missing precision')
    values=np.frombuffer(raw[offset+1:],dtype='<u2')
    if len(values)!=900*900:raise ValueError('incomplete RADOLAN payload')
    stamp=re.match(r'RW(\d{2})(\d{4})10000(\d{2})(\d{2})',header)
    if not stamp:raise ValueError('missing RW timestamp')
    actual=datetime.strptime(stamp[4]+stamp[3]+stamp[1]+stamp[2],'%y%m%d%H%M').replace(tzinfo=timezone.utc)
    if expected is not None and actual!=expected:raise ValueError('RW timestamp mismatch')
    missing=(values&0xe000)!=0
    result=(values&0xfff).astype(np.float64)*10**int(precision[1])
    result[missing]=np.nan
    return result.reshape(900,900)

def sample_indices(lats,lons):
    # Official spherical RADOLAN stereographic grid: 1 km, southwest origin.
    lat,lon=np.meshgrid(np.radians(lats),np.radians(lons),indexing='ij')
    factor=6370040*(1+np.sin(np.radians(60)))*np.cos(lat)/(1+np.sin(lat))
    x=factor*np.sin(lon-np.radians(10));y=-factor*np.cos(lon-np.radians(10))
    col=np.floor((x+523462.1669218559)/1000).astype(int)
    row=np.floor((y+4658644.724265572)/1000).astype(int)
    valid=(row>=0)&(row<900)&(col>=0)&(col<900)
    return np.clip(row,0,899),np.clip(col,0,899),valid

def sum_complete(fields):
    stack=np.stack(fields);valid=np.isfinite(stack).all(axis=0)
    values=np.rint(np.nansum(stack,axis=0)*10).astype(np.int32)
    values[~valid]=-1
    return values

def build(output,now=None):
    now=now or datetime.now(timezone.utc)
    response=requests.get(ROOT,timeout=25);response.raise_for_status()
    names=re.findall(r'href="(raa01-rw_10000-(\d{10})-dwd---bin.bz2)"',response.text)
    files={datetime.strptime(stamp,'%y%m%d%H%M').replace(tzinfo=timezone.utc):name for name,stamp in names}
    candidates=sorted((stamp for stamp in files if stamp.minute==50 and stamp<=now and now-stamp<timedelta(hours=3)),reverse=True)
    if not candidates:raise RuntimeError('no fresh aligned RW hour')
    end=candidates[0]
    lats=np.round(np.arange(47,55.201,.04),6);lons=np.round(np.arange(5.5,15.601,.04),6)
    rows,cols,covered=sample_indices(lats,lons)
    stamps=[end-timedelta(hours=i) for i in range(48)]
    def load(stamp):
        if stamp not in files:return stamp,None,None
        url=ROOT+files[stamp]
        try:
            r=requests.get(url,timeout=25);r.raise_for_status();field=decode_rw(r.content,stamp)
            sampled=field[rows,cols];sampled[~covered]=np.nan
            return stamp,sampled,{'url':url,'sha256':hashlib.sha256(r.content).hexdigest()}
        except (requests.RequestException,ValueError,OSError):return stamp,None,None
    with ThreadPoolExecutor(max_workers=4) as pool:loaded=list(pool.map(load,stamps))
    by_time={stamp:field for stamp,field,_ in loaded if field is not None};frames=[]
    for hours in WINDOWS:
        required=stamps[:hours]
        if any(stamp not in by_time for stamp in required):continue
        values=sum_complete([by_time[stamp] for stamp in required]);good=values[values>=0]
        if not good.size:continue
        frames.append({'hours':hours,'validFrom':(end-timedelta(hours=hours)).isoformat(),'validTo':end.isoformat(),'maximum':float(good.max())/10,'values':values.ravel().tolist()})
    if not frames:raise RuntimeError('no complete RW accumulation window')
    data={'schema':'mid.radolan.observed.v1','kind':'observed','run':end.isoformat(),'generatedAt':now.isoformat(),'source':'DWD RADOLAN RW · stationsangeeichte Radaranalyse','license':'CC BY 4.0','attribution':'Daten: Deutscher Wetterdienst, bearbeitet durch MID','grid':'RADOLAN 1 km, Darstellung auf 0,04° Lat/Lon-Raster','scale':.1,'lats':lats.tolist(),'lons':lons.tolist(),'frames':frames,'origins':[origin for _,_,origin in loaded if origin]}
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False)+'\n')
    return data

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);build(p.parse_args().output)
