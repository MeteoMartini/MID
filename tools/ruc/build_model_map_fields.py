#!/usr/bin/env python3
"""Immutable, same-run full ICON-D2 regular-grid map fields, not point-API samples."""
import bz2,gzip,hashlib,json,re,tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
import requests
from eccodes import codes_grib_new_from_file,codes_get,codes_get_array,codes_release,codes_set
from build_precipitation_totals import ROOT,read_field as read_total,difference

HOURS=(1,3,6,12,24,48)
FIELDS=('t_2m','pmsl','u_10m','v_10m','vmax_10m','clct','ww','t','relhum','tot_prec')

def read_field(payload,run,hour,field):
    with tempfile.TemporaryFile() as file:
        file.write(bz2.decompress(payload));file.seek(0);gid=codes_grib_new_from_file(file)
        if gid is None:raise ValueError('empty GRIB')
        try:
            codes_set(gid,'stepUnits',1);get=lambda key:codes_get(gid,key)
            if f'{int(get("dataDate")):08d}{int(get("dataTime")):04d}'!=run+'00' or int(get('endStep'))!=hour:raise ValueError('wrong map run/step')
            expected=(datetime.strptime(run,'%Y%m%d%H')+timedelta(hours=hour)).strftime('%Y%m%d%H%M')
            if f'{int(get("validityDate")):08d}{int(get("validityTime")):04d}'!=expected:raise ValueError('wrong validity time')
            if get('gridType')!='regular_ll':raise ValueError('not the DWD regular-grid remapping')
            if field in ('t','relhum') and (str(get('typeOfLevel'))!='isobaricInhPa' or int(get('level'))!=850):raise ValueError('wrong pressure level')
            if field in ('t_2m','u_10m','v_10m','vmax_10m') and (get('typeOfLevel')!='heightAboveGround' or int(get('level'))!=(2 if field=='t_2m' else 10)):raise ValueError('wrong surface height')
            if field!='vmax_10m' and get('stepType')!='instant':raise ValueError('unexpected interval field')
            ni,nj=int(get('Ni')),int(get('Nj'));lat=np.asarray(codes_get_array(gid,'latitudes')).reshape(nj,ni);lon=np.asarray(codes_get_array(gid,'longitudes')).reshape(nj,ni);lon=(lon+180)%360-180
            if not np.allclose(lat,lat[:,0,None]) or not np.allclose(lon,lon[0,None,:]):raise ValueError('nonrectangular map grid')
            rows=np.where((lat[:,0]>=47)&(lat[:,0]<=55.2))[0];cols=np.where((lon[0]>=5.5)&(lon[0]<=15.6))[0];rows=rows[np.argsort(lat[rows,0])];cols=cols[np.argsort(lon[0,cols])]
            values=np.asarray(codes_get_array(gid,'values')).reshape(nj,ni)[np.ix_(rows,cols)]
            if not values.size or not np.isfinite(values).all() or np.any(np.abs(values)>1e8):raise ValueError('incomplete map field')
            unit=str(get('units'))
            if field in ('t','t_2m'):
                if unit!='K':raise ValueError('unexpected temperature units')
            elif field=='pmsl':
                if unit!='Pa':raise ValueError('unexpected pressure units')
            elif field in ('u_10m','v_10m','vmax_10m'):
                if unit not in ('m s**-1','m s-1'):raise ValueError('unexpected wind units')
            elif field in ('clct','relhum'):
                if unit=='1':values=values*100
                elif unit!='%':raise ValueError('unexpected fraction units')
                # Relative humidity may exceed saturation; cloud fraction cannot.
                upper=150 if field=='relhum' else 100.01
                if np.any(values<0) or np.any(values>upper):raise ValueError(f'invalid {field} percentage: {values.min()}..{values.max()}')
            elif field=='ww':
                if np.any(values<0) or np.any(values>99) or not np.allclose(values,np.rint(values)):raise ValueError('invalid weather code')
            if field=='vmax_10m' and (get('stepType')!='max' or int(get('startStep'))>=hour or np.any(values<0)):raise ValueError('invalid gust interval')
            return np.round(lat[rows,0],6),np.round(lon[0,cols],6),values,int(get('startStep'))
        finally:codes_release(gid)

def theta_e(t,rh):
    c=t-273.15;e=np.clip(rh,0.01,150)/100*6.112*np.exp(17.67*c/(c+243.5));mix=.622*e/np.maximum(1,850-e)
    dew=243.5*np.log(e/6.112)/(17.67-np.log(e/6.112))+273.15
    tl=1/(1/(dew-56)+np.log(t/dew)/800)+56
    return t*(1000/(850-e))**(2/7)*(t/tl)**(.28*mix)*np.exp((3036/tl-1.78)*mix*(1+.448*mix))

def contours(values,lats,lons):
    # Render contours on a decimated grid; underlying sampled values stay native.
    v=values[::6,::6];lat=lats[::6];lon=lons[::6];result=[]
    for level in range(int(np.floor(v.min()/4))*4,int(np.ceil(v.max()/4))*4+1,4):
        paths=[]
        for row in range(v.shape[0]-1):
            for col in range(v.shape[1]-1):
                corners=[(v[row,col],lat[row],lon[col]),(v[row,col+1],lat[row],lon[col+1]),(v[row+1,col+1],lat[row+1],lon[col+1]),(v[row+1,col],lat[row+1],lon[col])];cross=[]
                for a,b in zip(corners,corners[1:]+corners[:1]):
                    if (a[0]<level)==(b[0]<level):continue
                    fraction=(level-a[0])/(b[0]-a[0]);cross.append([round(a[1]+fraction*(b[1]-a[1]),5),round(a[2]+fraction*(b[2]-a[2]),5)])
                for i in range(0,len(cross)-1,2):paths.append([cross[i],cross[i+1]])
        if paths:result.append({'level':level,'paths':paths})
    return result

def build(output,totals):
    run_time=datetime.fromisoformat(totals['run']);run=run_time.strftime('%Y%m%d%H');root=ROOT+run_time.strftime('%H')+'/';listings={}
    for field in FIELDS:
        r=requests.get(root+field+'/',timeout=25);r.raise_for_status();listings[field]=re.findall(r'href="([^"/]+\.grib2.bz2)"',r.text)
    jobs=[]
    for hour in HOURS:
        for field in FIELDS:
            for step in ([hour,hour-1] if field=='tot_prec' else [hour]):
                candidates=[name for name in listings[field] if f'_{run}_{step:03d}_' in name and 'germany_regular-lat-lon' in name and (f'_850_{field}.' in name if field in ('t','relhum') else 'single-level' in name)]
                if len(candidates)!=1:raise RuntimeError(f'no unique native {field} T+{step} file')
                jobs.append((hour,field,step,root+field+'/'+candidates[0]))
    def load(job):
        hour,field,step,url=job;r=requests.get(url,timeout=40);r.raise_for_status()
        data=(*read_total(r.content,run,step),0) if field=='tot_prec' else read_field(r.content,run,step,field)
        return hour,field,step,data,{'url':url,'sha256':hashlib.sha256(r.content).hexdigest()}
    with ThreadPoolExecutor(max_workers=4) as pool:loaded=list(pool.map(load,jobs))
    data={};origins=[]
    for hour,field,step,(lat,lon,values,start),origin in loaded:
        if data and (not np.array_equal(lat,lats) or not np.array_equal(lon,lons)):raise ValueError('map grid mismatch')
        lats,lons=lat,lon;data[(hour,field,step)]=(values,start);origins.append(origin)
    output.mkdir(parents=True,exist_ok=True);products={key:{'unit':unit,'frames':[]} for key,unit in [('temperature','°C'),('pressure','hPa'),('wind','km/h'),('gust','km/h'),('cloud','%'),('thetae','K'),('sigwx','WMO'),('precipitation','mm/1 h')]}
    for hour in HOURS:
        get=lambda field,step=hour:data[(hour,field,step)][0]
        pressure=get('pmsl')/100;isobars=contours(pressure,lats,lons)
        fields={'temperature':get('t_2m')-273.15,'pressure':pressure,'wind':np.hypot(get('u_10m'),get('v_10m'))*3.6,'gust':get('vmax_10m')*3.6,'cloud':get('clct'),'thetae':theta_e(get('t'),get('relhum')),'sigwx':get('ww'),'precipitation':difference(get('tot_prec',hour-1),get('tot_prec'))/10}
        for key,values in fields.items():
            values=np.rint(values*10).astype(np.int32);name=f'{key}-{hour:03d}.bin';time=(run_time+timedelta(hours=hour)).isoformat()
            payload={'schema':'mid.icon-d2.field.v1','run':run_time.isoformat(),'time':time,'kind':key,'unit':products[key]['unit'],'scale':.1,'lats':lats.tolist(),'lons':lons.tolist(),'values':values.ravel().tolist(),'isobars':isobars if key in ('pressure','thetae','sigwx','precipitation') else []}
            raw=(json.dumps(payload,separators=(',',':'),ensure_ascii=False)+'\n').encode('utf-8')
            file=output/name;file.write_bytes(gzip.compress(raw,compresslevel=6,mtime=0));digest=hashlib.sha256(file.read_bytes()).hexdigest()
            products[key]['frames'].append({'hour':hour,'time':time,'file':name,'encoding':'gzip-json','decodedBytes':len(raw),'sha256':digest,'bytes':file.stat().st_size,'intervalHours':hour-data[(hour,'vmax_10m',hour)][1] if key=='gust' else 1 if key=='precipitation' else 0})
    manifest={'schema':'mid.icon-d2.fields.v1','run':run_time.isoformat(),'generatedAt':datetime.now(timezone.utc).isoformat(),'source':'DWD ICON-D2 · direkte GRIB2-Raster','license':'CC BY 4.0','grid':'DWD regular lat/lon remapping · kein Punkt-API-Raster','products':products,'origins':origins}
    (output/'index.json').write_text(json.dumps(manifest,separators=(',',':'),ensure_ascii=False)+'\n')
    return manifest
