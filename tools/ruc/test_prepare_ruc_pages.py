#!/usr/bin/env python3
from pathlib import Path
import json,tempfile
import numpy as np
from prepare_ruc_pages import prepare
with tempfile.TemporaryDirectory() as td:
 root=Path(td);src=root/'src';src.mkdir();out=root/'out';run='2026082906';points=10;times=['2026-08-29T06:00','2026-08-29T07:00'];det_record=8;sum_record=4
 (src/'deterministic.bin').write_bytes(bytes(range(points*det_record)))
 (src/'eps-summary.bin').write_bytes(bytes(range(points*sum_record)))
 (src/'lookup.bin').write_bytes(b''.join(i.to_bytes(4,'little') for i in range(12)))
 (src/'eps-members.bin').write_bytes(b'x'*200)
 (src/'rapid-5m.bin').write_bytes(bytes((i%256 for i in range(points*6))))
 (src/'rapid-15m.bin').write_bytes(bytes((i%256 for i in range(points*12))))
 severe_fields=[{'name':name} for name in ('lpi','lpi_max','uh_max_low','uh_max_med','uh_max','cape_ml')]
 severe_times=['a','b']
 severe=np.arange(points*len(severe_times)*len(severe_fields),dtype='<i2').reshape(points,len(severe_times),len(severe_fields))
 (src/'rapid-severe15.bin').write_bytes(severe.tobytes(order='C'))
 (src/'rapid-extreme.json').write_text(json.dumps({'schema':'mid.dwd.ruc.rapid-extreme.v2','run':run,'cells':[]}))
 meta={'schema':'mid.dwd.ruc.grid.v2','run':run,'times':times,'pointCount':points,'grid':{'latMin':43,'lonMin':-4,'dx':.1,'dy':.1,'nx':4,'ny':3},'lookup':{'key':f'runs/{run}/lookup.bin','dtype':'uint32-le'},'deterministic':{'key':f'runs/{run}/deterministic.bin','recordBytes':det_record,'fields':[]},'epsSummary':{'key':f'runs/{run}/eps-summary.bin','recordBytes':sum_record,'fields':[]},'eps':{'key':f'runs/{run}/eps-members.bin','recordBytes':40,'memberCount':10,'scale':.01},'rapid':{'precip5':{'key':f'runs/{run}/rapid-5m.bin','recordBytes':6,'times':['a','b','c'],'fields':[]},'convection15':{'key':f'runs/{run}/rapid-15m.bin','recordBytes':12,'times':['a','b'],'fields':[]},'severe15':{'key':f'runs/{run}/rapid-severe15.bin','recordBytes':len(severe_times)*len(severe_fields)*2,'times':severe_times,'fields':severe_fields,'dtype':'int16-le','layout':'point-time-field'}},'rapidExtreme':{'key':f'runs/{run}/rapid-extreme.json','schema':'mid.dwd.ruc.rapid-extreme.v2'}}
 (src/'latest.json').write_text(json.dumps(meta))
 result=prepare(src,out,data_chunk_points=4,lookup_chunk_entries=5)
 assert result['storageProfile']=='pages-free-v1' and result['pages']['nativeEpsMembers'] is False
 assert result['deterministic']['pages']['chunkCount']==3 and result['epsSummary']['pages']['chunkCount']==3 and result['lookup']['pages']['chunkCount']==3
 assert 'key' not in result['eps'] and result['eps']['available'] is False
 assert result['rapid']['precip5']['pages']['chunkCount']==3 and result['rapid']['convection15']['pages']['chunkCount']==3
 assert result['rapidExtreme']['key']==f'runs/{run}/rapid-extreme.json'
 assert not list((out/'ruc').rglob('eps-members.bin'))
 severe_result=result['rapid']['severe15']
 assert [field['name'] for field in severe_result['fields']]==['lpi_max','uh_max','cape_ml']
 assert severe_result['recordBytes']==len(severe_times)*3*2
 assert set(result['pages']['prunedRedundantFields'])=={'lpi','uh_max_low','uh_max_med'}
 assert result['pages']['savedBytes']==points*len(severe_times)*3*2
 chunks=sorted((out/'ruc'/'runs'/run/'rapid'/'severe15').glob('*.bin'))
 projected=np.frombuffer(b''.join(path.read_bytes() for path in chunks),dtype='<i2').reshape(points,len(severe_times),3)
 np.testing.assert_array_equal(projected,severe[:,:,[1,4,5]])
 print('RUC GitHub Pages free-profile chunking + severe projection contract OK')
