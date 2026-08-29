from pathlib import Path
import sys,json
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent))
from ruc_pack import FieldSpec,EPS_SUMMARY_FIELDS,pack_cell_major,pack_eps_members,write_meta
specs=(FieldSpec('temperature_2m','°C',0.01),FieldSpec('precipitation','mm',0.01))
fields={'temperature_2m':np.array([[10.12,20.34],[11.23,np.nan]]),'precipitation':np.array([[0,.2],[1.25,2.5]])}
raw=pack_cell_major(fields,specs);assert len(raw)==2*2*2*2
view=np.frombuffer(raw,dtype='<i2').reshape(2,2,2);assert view[0,0,0]==1012 and view[1,0,0]==2034 and view[1,1,0]==-32768
eps=np.array([[[0,.2],[.1,.3]],[[1.25,2.5],[.5,np.nan]]]) # time,member,point
packed=pack_eps_members(eps,.01);ev=np.frombuffer(packed,dtype='<u2').reshape(2,2,2)
assert ev[0,0,0]==0 and ev[0,0,1]==10 and ev[1,0,0]==20 and ev[1,1,1]==65535
out=Path('/tmp/ruc-meta-test.json')
write_meta(out,run='2026-08-28T18:00',times=['2026-08-28T18:00','2026-08-28T19:00'],point_count=2,specs=specs,grid={'latMin':43,'lonMin':-4,'dx':.02,'dy':.02,'nx':2,'ny':1},deterministic_key='runs/r/det.bin',eps_key='runs/r/eps.bin',eps_summary_key='runs/r/eps-summary.bin',lookup_key='runs/r/lookup.bin',member_count=2,objects={'deterministic.bin':{'bytes':16,'sha256':'a'*64},'eps-summary.bin':{'bytes':48,'sha256':'b'*64},'eps-members.bin':{'bytes':16,'sha256':'c'*64},'lookup.bin':{'bytes':8,'sha256':'d'*64}})
meta=json.loads(out.read_text());assert meta['schema']=='mid.dwd.ruc.grid.v2' and meta['eps']['memberCount']==2 and meta['eps']['layout']=='point-time-member'
assert meta['lookup']['key']=='runs/r/lookup.bin' and meta['epsSummary']['key']=='runs/r/eps-summary.bin' and meta['epsSummary']['layout']=='point-time-field'
assert meta['epsSummary']['thresholdsMm']=={'wet':0.2,'significant':5.0} and len(meta['epsSummary']['fields'])==len(EPS_SUMMARY_FIELDS)
assert meta['objects']['lookup.bin']['bytes']==8
print('RUC pack contract OK')
