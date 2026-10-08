#!/usr/bin/env python3
"""Five same-cycle native GRIB fields through the immutable DWD totals pipeline."""
import bz2,gzip,hashlib,json,re,tempfile,threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
import requests
import contourpy
from scipy.ndimage import gaussian_filter
from eccodes import codes_grib_new_from_file,codes_get,codes_get_array,codes_release,codes_set
from build_model_map_fields import theta_e
HOURS=(0,3,6,9,12,18,24,36,48)
MODELS={'icon-d2':('DWD ICON-D2','icon-d2',2.2,'germany_regular-lat-lon'),'icon-eu':('DWD ICON-EU','icon-eu',7,'europe_regular-lat-lon')}
COMPONENTS=(('t',850),('relhum',850),('fi',500),('pmsl',None),('relhum',700),('u',300),('v',300))
LOCK=threading.Lock();ALGORITHM='bolton-1980-lcl-v2'

def decode(payload,run,hour,field,level):
    with LOCK,tempfile.TemporaryFile() as file:
        file.write(bz2.decompress(payload) if payload[:3]==b'BZh' else payload);file.seek(0);gid=codes_grib_new_from_file(file)
        if gid is None:raise ValueError('empty GRIB')
        try:
            codes_set(gid,'stepUnits',1);get=lambda k:codes_get(gid,k)
            if f'{int(get("dataDate")):08d}{int(get("dataTime")):04d}'!=run+'00' or int(get('endStep'))!=hour or get('stepType')!='instant':raise ValueError('wrong run/step')
            expected=(datetime.strptime(run,'%Y%m%d%H')+timedelta(hours=hour)).strftime('%Y%m%d%H%M')
            if f'{int(get("validityDate")):08d}{int(get("validityTime")):04d}'!=expected:raise ValueError('wrong valid time')
            if level is not None and (get('typeOfLevel')!='isobaricInhPa' or int(get('level'))!=level):raise ValueError('wrong pressure level')
            if level is None and get('typeOfLevel') not in ('meanSea','surface'):raise ValueError('wrong MSL level')
            allowed={'t':('t',),'q':('q',),'relhum':('r','relhum'),'fi':('fi','z','gh'),'pmsl':('msl','prmsl','pmsl'),'u':('u',),'v':('v',)}
            if get('shortName') not in allowed[field] or get('gridType')!='regular_ll':raise ValueError('wrong parameter/grid')
            ni,nj=int(get('Ni')),int(get('Nj'));lat=np.asarray(codes_get_array(gid,'latitudes')).reshape(nj,ni);lon=(np.asarray(codes_get_array(gid,'longitudes')).reshape(nj,ni)+180)%360-180
            if not np.allclose(lat,lat[:,0,None]) or not np.allclose(lon,lon[0,None,:]):raise ValueError('nonrectangular grid')
            rows=np.where((lat[:,0]>=43)&(lat[:,0]<=60))[0];cols=np.where((lon[0]>=-10)&(lon[0]<=30))[0];rows=rows[np.argsort(lat[rows,0])];cols=cols[np.argsort(lon[0,cols])]
            values=np.asarray(codes_get_array(gid,'values')).reshape(nj,ni)[np.ix_(rows,cols)];values[values==get('missingValue')]=np.nan
            if not values.size or np.isfinite(values).mean()<.4:raise ValueError('incomplete field')
            unit=str(get('units'))
            if field=='t' and unit!='K':raise ValueError('temperature unit')
            if field=='q' and unit not in ('kg kg**-1','kg kg-1'):raise ValueError('specific humidity unit')
            if field=='pmsl':
                if unit!='Pa':raise ValueError('pressure unit')
                values=values/100
            if field=='fi':
                if unit in ('m**2 s**-2','m2 s-2'):values=values/9.80665/10
                elif unit in ('m','gpm'):values=values/10
                else:raise ValueError('geopotential unit')
            if field=='relhum':
                if unit=='1':values=values*100
                elif unit!='%':raise ValueError('humidity unit')
            if field in ('u','v') and unit not in ('m s**-1','m s-1'):raise ValueError('wind unit')
            ranges={'t':(170,340),'q':(0,.1),'relhum':(0,150),'fi':(350,650),'pmsl':(850,1100),'u':(-200,200),'v':(-200,200)};low,high=ranges[field]
            if np.any(values<low) or np.any(values>high):raise ValueError('physical range')
            return np.round(lat[rows,0],6),np.round(lon[0,cols],6),values
        finally:codes_release(gid)

def contours(values,lats,lons,interval):
    mask=np.isfinite(values);weight=gaussian_filter(mask.astype(float),.65);smooth=gaussian_filter(np.where(mask,values,0),.65)/np.maximum(weight,1e-9);z=np.ma.array(smooth,mask=~mask)
    cg=contourpy.contour_generator(x=lons,y=lats,z=z,corner_mask=False);features=[]
    for level in np.arange(np.floor(np.nanmin(values)/interval)*interval,np.ceil(np.nanmax(values)/interval)*interval+1,interval):
        for line in cg.lines(level):
            if len(line)>=3:features.append({'type':'Feature','properties':{'level':float(level),'label':str(int(level))},'geometry':{'type':'LineString','coordinates':np.round(line,5).tolist()}})
    return {'type':'FeatureCollection','features':features}

def write_fields(output,model,stamp,resolution,fields,lats,lons,hours=HOURS):
    output.mkdir(parents=True,exist_ok=True);frames=[]
    for hour in hours:
        get=lambda f,level=None:fields[(hour,f,level)];theta=theta_e(get('t',850),get('relhum',850))-273.15
        values=[int(round(v*10)) if np.isfinite(v) else None for v in theta.ravel()];stride=max(1,round(.65/(lats[1]-lats[0])));wind=[]
        for y in range(0,len(lats),stride):
            for x in range(0,len(lons),stride):
                u,v=get('u',300)[y,x],get('v',300)[y,x]
                if np.isfinite(u) and np.isfinite(v):wind.append([float(lons[x]),float(lats[y]),round(float(u),2),round(float(v),2)])
        time=(stamp+timedelta(hours=hour)).isoformat();payload={'schema':'mid.synoptic.field.v1','model':model,'run':stamp.isoformat(),'time':time,'resolutionKm':resolution,'unit':'°C','scale':.1,'lats':lats.tolist(),'lons':lons.tolist(),'thetae':values,'height':contours(get('fi',500),lats,lons,4),'pressure':contours(get('pmsl'),lats,lons,4),'humidity':contours(get('relhum',700),lats,lons,20),'wind':wind}
        raw=json.dumps(payload,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode();name=f'{model}-{hour:03d}.bin';data=gzip.compress(raw,mtime=0)
        if len(raw)>12_000_000:raise ValueError('decoded field budget')
        (output/name).write_bytes(data);frames.append({'hour':hour,'time':time,'file':name,'encoding':'gzip-json','decodedBytes':len(raw),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    return frames

def model_product(model,output,now=None,hours=HOURS,cached=None):
    now=now or datetime.now(timezone.utc);latest=now.replace(hour=now.hour//6*6,minute=0,second=0,microsecond=0);label,folder,resolution,grid=MODELS[model];failures=[]
    for offset in range(4):
        stamp=latest-timedelta(hours=6*offset);run=stamp.strftime('%Y%m%d%H');root=f'https://opendata.dwd.de/weather/nwp/{folder}/grib/{stamp:%H}/';jobs=[]
        try:
            if cached and cached['run']==stamp.isoformat():return cached
            for field in {f for f,_ in COMPONENTS}:
                r=requests.get(root+field+'/',timeout=25);r.raise_for_status();names=re.findall(r'href="([^"/]+\.grib2.bz2)"',r.text)
                for hour in hours:
                    for f,level in COMPONENTS:
                        if f!=field:continue
                        candidates=[n for n in names if grid in n and f'_{run}_{hour:03d}_' in n and (f'_{level}_{field}.' in n if level is not None else 'single-level' in n)]
                        if len(candidates)!=1:raise ValueError(f'incomplete {model} {field}/{level}/{hour}')
                        jobs.append((hour,field,level,root+field+'/'+candidates[0]))
            def load(job):
                hour,field,level,url=job;r=requests.get(url,timeout=60);r.raise_for_status();return hour,field,level,decode(r.content,run,hour,field,level),{'url':url,'sha256':hashlib.sha256(r.content).hexdigest()}
            with ThreadPoolExecutor(max_workers=4) as pool:loaded=list(pool.map(load,jobs))
            fields={};origins=[];lats=lons=None
            for hour,field,level,(lat,lon,values),origin in loaded:
                if lats is not None and (not np.array_equal(lats,lat) or not np.array_equal(lons,lon)):raise ValueError('grid mismatch')
                lats,lons=lat,lon;fields[(hour,field,level)]=values;origins.append(origin)
            return {'label':label,'run':stamp.isoformat(),'resolutionKm':resolution,'license':'CC BY 4.0','frames':write_fields(output,model,stamp,resolution,fields,lats,lons,hours),'origins':origins}
        except (requests.RequestException,ValueError,RuntimeError) as error:failures.append(str(error))
    raise RuntimeError('; '.join(failures))

def select_message(payload,field,level):
    allowed={'t':('t',),'relhum':('r','relhum'),'fi':('gh','z','fi'),'pmsl':('prmsl','msl'),'u':('u',),'v':('v',)};found=[]
    from eccodes import codes_get_message
    with LOCK,tempfile.TemporaryFile() as file:
        file.write(payload);file.seek(0)
        while (gid:=codes_grib_new_from_file(file)) is not None:
            try:
                if codes_get(gid,'shortName') in allowed[field] and (codes_get(gid,'typeOfLevel') in ('meanSea','surface') if level is None else codes_get(gid,'typeOfLevel')=='isobaricInhPa' and codes_get(gid,'level')==level):found.append(codes_get_message(gid))
            finally:codes_release(gid)
    if len(found)!=1:raise ValueError('no unique GRIB message')
    return found[0]

def global_product(model,output,now=None,hours=HOURS,cached=None):
    now=now or datetime.now(timezone.utc);cycle=12 if model=='ifs' else 6;latest=now.replace(hour=now.hour//cycle*cycle,minute=0,second=0,microsecond=0);failures=[]
    for offset in range(3):
        stamp=latest-timedelta(hours=cycle*offset);run=stamp.strftime('%Y%m%d%H');fields={};origins=[];lats=lons=None
        try:
            if cached and cached['run']==stamp.isoformat():return cached
            for hour in hours:
                if model=='gfs':
                    url='https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl';params={'file':f'gfs.t{stamp:%H}z.pgrb2.0p25.f{hour:03d}','dir':f'/gfs.{stamp:%Y%m%d}/{stamp:%H}/atmos','subregion':'','leftlon':-10,'rightlon':30,'toplat':60,'bottomlat':43}
                    params.update({'var_'+v:'on' for v in ('TMP','RH','HGT','UGRD','VGRD','PRMSL')});params.update({f'lev_{v}_mb':'on' for v in (850,700,500,300)});params['lev_mean_sea_level']='on';r=requests.get(url,params=params,timeout=60);r.raise_for_status()
                    if len(r.content)>16_000_000:raise ValueError('GFS subset budget')
                    bundles=[(f,l,select_message(r.content,f,l)) for f,l in COMPONENTS];origins.append({'url':r.url,'sha256':hashlib.sha256(r.content).hexdigest()})
                else:
                    base=f'https://data.ecmwf.int/forecasts/{stamp:%Y%m%d}/{stamp:%H}z/ifs/0p25/oper/{stamp:%Y%m%d%H}0000-{hour}h-oper-fc';r=requests.get(base+'.index',timeout=25);r.raise_for_status();index=[json.loads(line) for line in r.text.splitlines()]
                    def load_range(wanted):
                        param,level,field=wanted;matches=[e for e in index if e.get('param')==param and (e.get('levtype')=='sfc' if level is None else e.get('levtype')=='pl' and str(e.get('levelist'))==str(level))]
                        if len(matches)!=1:raise ValueError('IFS component not indexed')
                        e=matches[0];start,length=int(e['_offset']),int(e['_length']);end=start+length-1
                        if not 0<length<=16_000_000:raise ValueError('IFS range budget')
                        r=requests.get(base+'.grib2',headers={'Range':f'bytes={start}-{end}'},timeout=60);r.raise_for_status()
                        if r.status_code!=206 or len(r.content)!=length or not r.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/'):raise ValueError('IFS range mismatch')
                        return (field,level,r.content),{'url':base+'.grib2','range':[start,end],'sha256':hashlib.sha256(r.content).hexdigest()}
                    wanted=(('t',850,'t'),('q',850,'q'),('gh',500,'fi'),('msl',None,'pmsl'),('t',700,'t'),('q',700,'q'),('u',300,'u'),('v',300,'v'))
                    with ThreadPoolExecutor(max_workers=4) as pool:ranges=list(pool.map(load_range,wanted))
                    bundles=[b for b,_ in ranges];origins.extend(o for _,o in ranges)
                for field,level,payload in bundles:
                    lat,lon,values=decode(payload,run,hour,field,level)
                    if lats is not None and (not np.array_equal(lats,lat) or not np.array_equal(lons,lon)):raise ValueError('global grid mismatch')
                    lats,lons=lat,lon;fields[(hour,field,level)]=values
                if model=='ifs':
                    for level in (850,700):
                        q,t=fields[(hour,'q',level)],fields[(hour,'t',level)];c=t-273.15;e=q*level/(.622+.378*q);fields[(hour,'relhum',level)]=100*e/(6.112*np.exp(17.67*c/(c+243.5)))
            return {'label':'NOAA GFS' if model=='gfs' else 'ECMWF IFS','run':stamp.isoformat(),'resolutionKm':28,'license':'Public Domain' if model=='gfs' else 'CC BY 4.0','frames':write_fields(output,model,stamp,28,fields,lats,lons,hours),'origins':origins}
        except (requests.RequestException,ValueError,RuntimeError) as error:failures.append(str(error))
    raise RuntimeError('; '.join(failures))

def build(output):
    products={};errors={}
    for model in (*MODELS,'gfs','ifs'):
        try:products[model]=(model_product if model in MODELS else global_product)(model,output);print(f'{model}: {len(products[model]["frames"])} complete terms',flush=True)
        except (requests.RequestException,ValueError,RuntimeError) as e:errors[model]=str(e);print(f'::warning::{model} synoptic unavailable: {e}',flush=True)
    if not products:raise RuntimeError('no complete synoptic model')
    payload={'schema':'mid.synoptic.fields.v1','generatedAt':datetime.now(timezone.utc).isoformat(),'algorithm':ALGORITHM,'models':products,'unavailable':errors};(output/'index.json').write_text(json.dumps(payload,separators=(',',':'),ensure_ascii=False)+'\n');return payload
if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();build(a.output)
