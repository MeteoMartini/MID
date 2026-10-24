#!/usr/bin/env python3
"""Offline ODIM-H5 RADOLAN RW contract tests; no live network or production writes."""
from datetime import datetime,timedelta,timezone
import io
import numpy as np
import h5py
from build_observed_precipitation import (catalog_rw,decode_rw_hdf5,hdf5_sample_indices,sum_complete,H5_SHAPE)

stamp=datetime(2026,10,24,5,50,tzinfo=timezone.utc)
base='raa01-rw_10000-2610240550-dwd---bin'
html=f'<a href="{base}.hdf5">H5</a><a href="{base}.bz2">BZ2</a>'
catalog=catalog_rw(html)
assert catalog[stamp]['hdf5']==base+'.hdf5'
assert catalog[stamp]['bz2']==base+'.bz2'
lats=np.array([50.0,50.04]);lons=np.array([10.0,10.04])
rows,cols,valid=hdf5_sample_indices(lats,lons)
assert valid.all() and rows.shape==(2,2) and np.all(np.diff(rows[:,0])<0), 'ODIM rows descend southward'
def odim(*,quantity='ACRR',end='055000',proj='+proj=stere +lat_0=90 +lat_ts=60 +lon_0=10 +datum=WGS84 +units=m',shape=H5_SHAPE):
    target=io.BytesIO()
    with h5py.File(target,'w') as f:
        where=f.create_group('where')
        for key,value in {'xsize':shape[1],'ysize':shape[0],'xscale':1000.0,'yscale':1000.0,'projdef':proj}.items():where.attrs[key]=value
        root=f.create_group('dataset1')
        dw=root.create_group('what')
        for key,value in {'startdate':'20261024','starttime':'045000','enddate':'20261024','endtime':end}.items():dw.attrs[key]=value
        d=root.create_group('data1')
        w=d.create_group('what')
        for key,value in {'quantity':quantity,'gain':.1,'offset':0.0,'nodata':65535,'undetect':0}.items():w.attrs[key]=value
        raw=np.zeros(shape,dtype=np.uint16)
        if shape==H5_SHAPE:
            raw[rows[0,0],cols[0,0]]=250
            raw[rows[0,1],cols[0,1]]=65535
        d.create_dataset('data',data=raw,compression='gzip')
    return target.getvalue()

result=decode_rw_hdf5(odim(),stamp,lats,lons)
assert result.shape==(2,2) and result[0,0]==25.0, 'Real 25-mm event must not be clipped or scaled as legacy binary'
assert np.isnan(result[0,1]) and result[1,0]==0, 'NoData is not a dry cell; undetect is zero'
for payload in [odim(quantity='RATE'),odim(end='054000'),odim(proj='+proj=laea +lat_0=52'),odim(shape=(900,900))]:
    try:decode_rw_hdf5(payload,stamp,lats,lons)
    except ValueError:pass
    else:raise AssertionError('ODIM change must fail closed')
a=np.array([[.21,np.nan],[25.,0.]])
b=np.array([[.34,4.],[17.,0.]])
joined=sum_complete([a,b])
assert joined.tolist()==[[6,-1],[420,0]], 'Non-overlapping totals preserve extremes and unknown cells'
print('ODIM-H5 RADOLAN: catalog migration, projection, provenance, valid time, metric geometry, ACRR, NoData and 1-hour sum OK')
