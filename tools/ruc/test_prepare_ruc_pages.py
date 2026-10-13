#!/usr/bin/env python3
from pathlib import Path
import json,tempfile
import numpy as np
from test_lossless_codec_pilot import verify_candidate_codec
verify_candidate_codec()
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
 state_fields=[{'name':name} for name in ('visibility','ceiling','freezing_level_height','snowline_height')]
 state_times=['a','b']
 state=np.arange(points*len(state_times)*len(state_fields),dtype='<i2').reshape(points,len(state_times),len(state_fields))
 (src/'rapid-state-15m.bin').write_bytes(state.tobytes(order='C'))
 solar_fields=[{'name':name} for name in ('asob_s','aswdir_s','aswdifd_s')]
 solar_times=['a','b']
 solar=np.arange(points*len(solar_times)*len(solar_fields),dtype='<i2').reshape(points,len(solar_times),len(solar_fields))
 (src/'rapid-solar15.bin').write_bytes(solar.tobytes(order='C'))
 (src/'rapid-extreme.json').write_text(json.dumps({'schema':'mid.dwd.ruc.rapid-extreme.v2','run':run,'cells':[]}))
 meta={'schema':'mid.dwd.ruc.grid.v2','run':run,'times':times,'pointCount':points,'grid':{'latMin':43,'lonMin':-4,'dx':.1,'dy':.1,'nx':4,'ny':3},'lookup':{'key':f'runs/{run}/lookup.bin','dtype':'uint32-le'},'deterministic':{'key':f'runs/{run}/deterministic.bin','recordBytes':det_record,'fields':[]},'epsSummary':{'key':f'runs/{run}/eps-summary.bin','recordBytes':sum_record,'fields':[]},'eps':{'key':f'runs/{run}/eps-members.bin','recordBytes':40,'memberCount':10,'scale':.01},'rapid':{'precip5':{'key':f'runs/{run}/rapid-5m.bin','recordBytes':6,'times':['a','b','c'],'fields':[]},'convection15':{'key':f'runs/{run}/rapid-15m.bin','recordBytes':12,'times':['a','b'],'fields':[]},'severe15':{'key':f'runs/{run}/rapid-severe15.bin','recordBytes':len(severe_times)*len(severe_fields)*2,'times':severe_times,'fields':severe_fields,'dtype':'int16-le','layout':'point-time-field'},'state15':{'key':f'runs/{run}/rapid-state-15m.bin','recordBytes':len(state_times)*len(state_fields)*2,'times':state_times,'fields':state_fields,'dtype':'int16-le','layout':'point-time-field'},'solar15':{'key':f'runs/{run}/rapid-solar15.bin','recordBytes':len(solar_times)*len(solar_fields)*2,'times':solar_times,'fields':solar_fields,'dtype':'int16-le','layout':'point-time-field'}},'rapidExtreme':{'key':f'runs/{run}/rapid-extreme.json','schema':'mid.dwd.ruc.rapid-extreme.v2'}}
 (src/'latest.json').write_text(json.dumps(meta))
 (src/'precipitation-totals.json').write_text(json.dumps({'schema':'mid.icon-d2.totals.v1','run':'2026-10-01T09:00:00+00:00'}))
 result=prepare(src,out,data_chunk_points=4,lookup_chunk_entries=5)
 assert result['storageProfile']=='pages-free-v1' and result['pages']['nativeEpsMembers'] is False
 from storage_audit import audit_storage
 audit=audit_storage(result,out/'ruc')
 assert audit['publishedBytes']==result['pages']['publishedBytes']
 assert sum(v['declaredBytes'] for v in audit['products'].values())==audit['publishedBytes']
 assert audit==audit_storage(result,out/'ruc'), 'compression samples must be deterministic'
 assert all(s['shuffledGzipBytes']>0 for s in audit['products']['deterministic']['compressionSamples'])
 assert all('shuffledGzipBytes' not in s for s in audit['products']['lookup']['compressionSamples'])
 full=audit_storage(result,out/'ruc',full_compression=True)
 assert full['exactCandidateBytes']['byteplanesGzip']<=full['exactCandidateBytes']['gzip']<=full['publishedBytes']
 assert all(full['exactCandidateBytes'][c]==sum(p['exactCandidateBytes'][c] for p in full['products'].values()) for c in ('gzip','byteplanesGzip'))
 assert full==audit_storage(result,out/'ruc',full_compression=True)
 assert 'deltaByteplanesGzip' not in full['exactCandidateBytes'], 'no extra compression work in hourly production'
 delta=audit_storage(result,out/'ruc',full_compression=True,delta_compression=True)
 assert delta['exactCandidateBytes']['deltaByteplanesGzip']<=delta['exactCandidateBytes']['byteplanesGzip']
 assert any('deltaByteplanesGzipBytes' in s for p in delta['products'].values() for s in p['compressionSamples'])
 assert not (out/'ruc'/'storage-audit.json').exists(), 'audit must not add published objects'
 try:audit_storage({**result,'pages':{**result['pages'],'publishedBytes':1}},out/'ruc')
 except ValueError:pass
 else:raise AssertionError('incorrect declared totals accepted')
 first=result['pages']['objects'][0];sample=out/'ruc'/first['key'];original=sample.read_bytes();sample.write_bytes(b'x'*len(original))
 try:audit_storage(result,out/'ruc')
 except ValueError:pass
 else:raise AssertionError('corrupted compression sample accepted')
 finally:sample.write_bytes(original)
 assert result['deterministic']['pages']['chunkCount']==3 and result['epsSummary']['pages']['chunkCount']==3 and result['lookup']['pages']['chunkCount']==3
 assert 'key' not in result['eps'] and result['eps']['available'] is False
 assert result['rapid']['precip5']['pages']['chunkCount']==3 and result['rapid']['convection15']['pages']['chunkCount']==3
 assert result['rapidExtreme']['key']==f'runs/{run}/rapid-extreme.json'
 assert not list((out/'ruc').rglob('eps-members.bin'))
 severe_result=result['rapid']['severe15']
 assert [field['name'] for field in severe_result['fields']]==['lpi_max','uh_max','cape_ml']
 assert severe_result['recordBytes']==len(severe_times)*3*2
 assert set(result['pages']['prunedRedundantFields'])=={'lpi','uh_max_low','uh_max_med'}
 assert result['pages']['prunedRapidProducts']==['state15','solar15']
 assert result['pages']['budgetBytes']==900_000_000 and result['pages']['publishedBytes']<result['pages']['budgetBytes']
 severe_saved=points*len(severe_times)*3*2
 state_saved=state.nbytes
 solar_saved=solar.nbytes
 assert result['pages']['savedBytes']==severe_saved+state_saved+solar_saved
 chunks=sorted((out/'ruc'/'runs'/run/'rapid'/'severe15').glob('*.bin'))
 projected=np.frombuffer(b''.join(path.read_bytes() for path in chunks),dtype='<i2').reshape(points,len(severe_times),3)
 np.testing.assert_array_equal(projected,severe[:,:,[1,4,5]])
 assert 'state15' not in result['rapid'] and not list((out/'ruc').rglob('*state15*'))
 assert 'solar15' not in result['rapid'] and not list((out/'ruc').rglob('*solar15*'))
 totals_key=result['precipitationTotals']['key']
 assert (out/'ruc'/totals_key).is_file()
 assert any(row['key']==totals_key for row in result['pages']['objects'])
 previous_key=totals_key
 (src/'precipitation-totals.json').write_text(json.dumps({'schema':'mid.icon-d2.totals.v1','run':'2026-10-01T12:00:00+00:00'}))
 next_result=prepare(src,out,data_chunk_points=4,lookup_chunk_entries=4)
 assert next_result['precipitationTotals']['key']!=previous_key, 'independent ICON cycle must receive a new immutable URL even with identical RUC run'
 # C21 products share the existing immutable object manifest and unchanged budget.
 import hashlib
 syn=src/'synoptic-fields';syn.mkdir();data=b'checked-five-component-field';(syn/'icon-eu-003.bin').write_bytes(data)
 index={'schema':'mid.synoptic.fields.v1','generatedAt':'2026-10-07T12:00:00Z','models':{'icon-eu':{'frames':[{'hour':3,'file':'icon-eu-003.bin','sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}]}}}
 cloud_data=b'checked-independent-cloud-weather';cloud_name='icon-eu-cw-001.bin';(syn/cloud_name).write_bytes(cloud_data)
 index['models']['icon-eu']['cloudWeatherFrames']=[{'hour':1,'file':cloud_name,'sha256':hashlib.sha256(cloud_data).hexdigest(),'bytes':len(cloud_data)}]
 (syn/'index.json').write_text(json.dumps(index));published=prepare(src,out,4,4);key=published['synopticFields']['key'];assert (out/'ruc'/key).is_file();assert any(o['key'].endswith('/synoptic-fields/icon-eu-003.bin') for o in published['pages']['objects']);assert published['pages']['budgetBytes']==900_000_000
 cloud_object=next(o for o in published['pages']['objects'] if o['key'].endswith('/synoptic-fields/'+cloud_name))
 assert (out/'ruc'/cloud_object['key']).read_bytes()==cloud_data and cloud_object['sha256']==hashlib.sha256(cloud_data).hexdigest()
 (syn/cloud_name).write_bytes(b'tampered')
 try:prepare(src,out,4,4);raise AssertionError('corrupt independent cloud/weather field accepted')
 except ValueError as error:assert 'synoptic digest mismatch' in str(error)
 (syn/cloud_name).write_bytes(cloud_data)
 (syn/'icon-eu-003.bin').write_bytes(b'tampered')
 try:prepare(src,out,4,4);raise AssertionError('corrupt field accepted')
 except ValueError as error:assert 'synoptic digest mismatch' in str(error)
 print('RUC GitHub Pages free-profile budget + science-prioritized projection contract OK')

import unittest
from test_native_map_products import MapProductsTest
suite=unittest.defaultTestLoader.loadTestsFromTestCase(MapProductsTest)
if not unittest.TextTestRunner().run(suite).wasSuccessful():raise SystemExit(1)

from test_synoptic_fields import SynopticTest
suite=unittest.defaultTestLoader.loadTestsFromTestCase(SynopticTest)
if not unittest.TextTestRunner().run(suite).wasSuccessful():raise SystemExit(1)

# Byte-identical aliasing must preserve complete records, tails, Missing and zeros.
from prepare_ruc_pages import write_chunks,deduplicate_chunks,fit_synoptic_budget
with tempfile.TemporaryDirectory() as td:
 root=Path(td);source=root/'source.bin';raw=b'\x00\x80\x00\x00'*4+b'\xff\x7f';source.write_bytes(raw)
 a,rows_a=write_chunks(source,root/'runs/r/a',2,4,'runs/r/a')
 b,rows_b=write_chunks(source,root/'runs/r/b',2,4,'runs/r/b')
 independent=root/'runs/r/model-fields/same.bin';independent.parent.mkdir();independent.write_bytes((root/rows_a[0]['key']).read_bytes())
 independent_row={'key':'runs/r/model-fields/same.bin','bytes':independent.stat().st_size,'sha256':hashlib.sha256(independent.read_bytes()).hexdigest()}
 objects,saved=deduplicate_chunks(root,rows_a+rows_b+[independent_row],[{'pages':a},{'pages':b}])
 assert saved==26 and len(objects)==3 and independent.is_file()
 for page in (a,b):
  keys=page.get('chunkKeys',[f"{page['prefix']}/{i:04d}.bin" for i in range(page['chunkCount'])])
  assert b''.join((root/key).read_bytes() for key in keys)==raw
 assert sum(o['bytes'] for o in objects)==sum(p.stat().st_size for p in (root/'runs').rglob('*.bin'))
 assert source.read_bytes()==raw
 # Evidence-driven remaining budget retains optional model and hourly CW terms.
 def inventory():return {'models':{m:{'frames':[{'hour':h,'bytes':100} for h in (0,3,6,9,12,18,24,36,48,72)],'cloudWeatherFrames':[{'hour':h,'bytes':100} for h in range(1,13)]} for m in ('icon-d2','icon-eu','icon')}}
 # Newly attempted ICON-D2 cloud/weather pairs must never displace any existing
 # RUC, synoptic or cloud/weather terms, and use a nonzero reserve.
 def d2_optional_inventory():
  result=inventory()
  result['models']['icon-d2']['cloudWeatherFrames'].extend([{'hour':13,'bytes':100},{'hour':14,'bytes':100},{'hour':16,'bytes':100},{'hour':17,'bytes':100}])
  return result
 reserve=fit_synoptic_budget(d2_optional_inventory(),20000)
 assert reserve['cloudWeatherBudget']['optionalD2']['admittedHours']==[]
 assert reserve['cloudWeatherBudget']['optionalD2']['omittedHours']==[13,14,16,17]
 assert reserve['models']==fit_synoptic_budget(inventory(),20000)['models'], 'Optional D2 cannot displace any older map'
 ample=fit_synoptic_budget(d2_optional_inventory(),500000)
 assert ample['cloudWeatherBudget']['optionalD2']['admittedHours']==[13,14,16,17]
 assert ample['cloudWeatherBudget']['optionalD2']['omittedHours']==[]
 assert ample['models']['icon-d2']['cloudWeatherFrames'][-4:]==[{'hour':h,'bytes':100} for h in (13,14,16,17)] or sorted(f['hour'] for f in ample['models']['icon-d2']['cloudWeatherFrames'])==list(range(1,15))+[16,17], 'All new pair times must remain correctly ordered'
 small=fit_synoptic_budget(inventory(),8000);large=fit_synoptic_budget(inventory(),20000)
 assert len(large['models'])==3 and all(len(p['cloudWeatherFrames'])==12 and len(p['frames'])==10 for p in large['models'].values())
 assert large['cloudWeatherBudget']['pruned']==[] and large['cloudWeatherBudget']['prunedSynoptic']==[]
 assert sum(len(p['cloudWeatherFrames'])+len(p['frames']) for p in large['models'].values())>sum(len(p['cloudWeatherFrames'])+len(p['frames']) for p in small['models'].values())
 print('RUC byte-identical physical deduplication and expanded budget retention OK')
