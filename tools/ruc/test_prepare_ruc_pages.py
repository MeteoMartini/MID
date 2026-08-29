#!/usr/bin/env python3
from pathlib import Path
import json,tempfile
from prepare_ruc_pages import prepare
with tempfile.TemporaryDirectory() as td:
 root=Path(td);src=root/'src';src.mkdir();out=root/'out';run='2026082906';points=10;times=['2026-08-29T06:00','2026-08-29T07:00'];det_record=8;sum_record=4
 (src/'deterministic.bin').write_bytes(bytes(range(points*det_record)))
 (src/'eps-summary.bin').write_bytes(bytes(range(points*sum_record)))
 (src/'lookup.bin').write_bytes(b''.join(i.to_bytes(4,'little') for i in range(12)))
 (src/'eps-members.bin').write_bytes(b'x'*200)
 meta={'schema':'mid.dwd.ruc.grid.v2','run':run,'times':times,'pointCount':points,'grid':{'latMin':43,'lonMin':-4,'dx':.1,'dy':.1,'nx':4,'ny':3},'lookup':{'key':f'runs/{run}/lookup.bin','dtype':'uint32-le'},'deterministic':{'key':f'runs/{run}/deterministic.bin','recordBytes':det_record,'fields':[]},'epsSummary':{'key':f'runs/{run}/eps-summary.bin','recordBytes':sum_record,'fields':[]},'eps':{'key':f'runs/{run}/eps-members.bin','recordBytes':40,'memberCount':10,'scale':.01}}
 (src/'latest.json').write_text(json.dumps(meta))
 result=prepare(src,out,data_chunk_points=4,lookup_chunk_entries=5)
 assert result['storageProfile']=='pages-free-v1' and result['pages']['nativeEpsMembers'] is False
 assert result['deterministic']['pages']['chunkCount']==3 and result['epsSummary']['pages']['chunkCount']==3 and result['lookup']['pages']['chunkCount']==3
 assert 'key' not in result['eps'] and result['eps']['available'] is False
 assert not list((out/'ruc').rglob('eps-members.bin'))
 assert len(result['pages']['objects'])==9
 print('RUC GitHub Pages free-profile chunking contract OK')
