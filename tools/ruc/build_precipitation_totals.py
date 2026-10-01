#!/usr/bin/env python3
"""Decode genuine ICON-D2 cumulative GRIBs, without point-API interpolation.

The regular lat/lon product is the DWD's own remapping of ICON-D2. Only four
same-run cumulative end fields plus T+0 are needed: TOT_PREC is accumulated
since initialization, so intervening hourly downloads are unnecessary.
"""
import argparse,bz2,hashlib,json,re,tempfile
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
import requests
from eccodes import codes_grib_new_from_file,codes_get,codes_get_array,codes_release,codes_set
ROOT='https://opendata.dwd.de/weather/nwp/icon-d2/grib/'
HOURS=(0,6,12,24,48)

def read_field(payload,run,hour):
    with tempfile.TemporaryFile() as file:
        file.write(bz2.decompress(payload));file.seek(0)
        gid=codes_grib_new_from_file(file)
        if gid is None:raise ValueError('empty GRIB')
        try:
            codes_set(gid,'stepUnits',1)
            get=lambda key:codes_get(gid,key)
            init=f'{int(get("dataDate")):08d}{int(get("dataTime")):04d}'
            if init!=run+'00' or int(get('endStep'))!=hour or int(get('startStep'))!=0:raise ValueError('wrong cumulative run/step')
            expected=(datetime.strptime(run,'%Y%m%d%H')+timedelta(hours=hour)).strftime('%Y%m%d%H%M')
            valid=f'{int(get("validityDate")):08d}{int(get("validityTime")):04d}'
            if valid!=expected:raise ValueError('wrong valid time')
            if get('gridType')!='regular_ll' or get('stepType')!='accum':raise ValueError('wrong grid or accumulation')
            if str(get('units')) not in ('kg m**-2','kg m-2','mm'):raise ValueError('unexpected water-equivalent units')
            if int(get('paramId'))!=228228:raise ValueError('not total precipitation')
            ni,nj=int(get('Ni')),int(get('Nj'))
            values=np.asarray(codes_get_array(gid,'values')).reshape(nj,ni)
            lats=np.asarray(codes_get_array(gid,'latitudes')).reshape(nj,ni)
            lons=np.asarray(codes_get_array(gid,'longitudes')).reshape(nj,ni);lons=(lons+180)%360-180
            if not np.allclose(lats,lats[:,0,None]) or not np.allclose(lons,lons[0,None,:]):raise ValueError('nonrectangular grid')
            rows=np.where((lats[:,0]>=47)&(lats[:,0]<=55.2))[0];cols=np.where((lons[0]>=5.5)&(lons[0]<=15.6))[0]
            rows=rows[np.argsort(lats[rows,0])];cols=cols[np.argsort(lons[0,cols])]
            subset=values[np.ix_(rows,cols)]
            if not len(rows) or not len(cols) or not np.isfinite(subset).all() or np.any(subset<-.01) or np.any(subset>6500):raise ValueError('incomplete/invalid Germany field')
            return np.round(lats[rows,0],6),np.round(lons[0,cols],6),subset
        finally:codes_release(gid)

def difference(start,end):
    delta=end-start
    if not np.isfinite(delta).all() or np.any(delta<-.05):raise ValueError('accumulation reset or invalid value')
    return np.rint(np.maximum(delta,0)*10).astype(np.uint16)

def build(output,now=None):
    now=now or datetime.now(timezone.utc);errors=[]
    # Newest complete regular-grid cycle, never splice different cycles.
    latest=now.replace(hour=(now.hour//3)*3,minute=0,second=0,microsecond=0)
    for offset in range(8):
        stamp=latest-timedelta(hours=3*offset);run=stamp.strftime('%Y%m%d%H');directory=ROOT+stamp.strftime('%H')+'/tot_prec/'
        try:
            listing=requests.get(directory,timeout=30);listing.raise_for_status()
            names={int(h):name for name,h in re.findall(r'href="(icon-d2_germany_regular-lat-lon_single-level_'+run+r'_(\d{3})_2d_tot_prec.grib2.bz2)"',listing.text)}
            if not all(h in names for h in HOURS):continue
            fields={};origins=[]
            for hour in HOURS:
                url=directory+names[hour];response=requests.get(url,timeout=90);response.raise_for_status()
                lat,lon,field=read_field(response.content,run,hour)
                if fields and (not np.array_equal(lat,lats) or not np.array_equal(lon,lons)):raise ValueError('grid changed within cycle')
                lats,lons=lat,lon;fields[hour]=field
                origins.append({'url':url,'sha256':hashlib.sha256(response.content).hexdigest()})
            frames=[]
            for hour in HOURS[1:]:
                delta=difference(fields[0],fields[hour]);frames.append({'hours':hour,'validTo':(stamp+timedelta(hours=hour)).isoformat(),'maximum':float(delta.max())/10,'values':delta.ravel().tolist()})
            data={'schema':'mid.icon-d2.totals.v1','run':stamp.isoformat(),'generatedAt':now.isoformat(),'source':'DWD Open Data · ICON-D2 TOT_PREC','license':'CC BY 4.0','attribution':'Daten: Deutscher Wetterdienst (DWD), bearbeitet durch MID','grid':'DWD regular lat/lon remapping','scale':0.1,'lats':lats.tolist(),'lons':lons.tolist(),'frames':frames,'origins':origins}
            output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False)+'\n')
            print(f'ICON-D2 {run}: {len(lats)}×{len(lons)}, 6/12/24/48 h, {output.stat().st_size} bytes');return data
        except (requests.RequestException,ValueError,RuntimeError) as error:errors.append(f'{run}: {error}')
    raise RuntimeError('no complete ICON-D2 totals cycle: '+'; '.join(errors))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=Path('.ruc-out/precipitation-totals.json'));build(p.parse_args().output)
