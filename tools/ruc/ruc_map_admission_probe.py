"""Read-only integration fixture using real native data, never production proof.

Constructs a temporary codec inventory from the first15 decoded native terms;
checks admission of the complete28-term map source against that exact prefix.
Does not claim that this fixture has production EPS/rapid/rollback coverage.
"""
import copy,json,tempfile
from pathlib import Path
import numpy as np
from ruc_map_candidate import checked_object,compact
from lossless_codec_pilot import encode_candidate
from admit_ruc_map_candidate import admit,sha

def probe_admission(source,work):
 source=Path(source);work=Path(work);m=json.loads((source/'latest.json').read_bytes());cube=np.frombuffer(checked_object(source,m,'deterministic.bin'),dtype='<i2').reshape(m['pointCount'],len(m['deterministic']['times']),len(m['deterministic']['fields']))
 snapshot=work/'admission-snapshot';snapshot.mkdir();assets={};parts=[];record_bytes=15*cube.shape[2]*2;chunk_records=524288//record_bytes
 for first in range(0,m['pointCount'],chunk_records):
  count=min(chunk_records,m['pointCount']-first);raw=cube[first:first+count,:15].tobytes();descriptor,wire=encode_candidate(raw,'byteplanes-gzip');key=f'runs/probe/core/{first:07d}.bin';assets[key]=wire;parts.append({'firstRecord':first,'recordCount':count,'key':key,'manifest':descriptor})
 lookup=checked_object(source,m,'lookup.bin');lookup_prefix='runs/probe/lookup';lookup_parts=[lookup[i:i+524288] for i in range(0,len(lookup),524288)]
 for i,data in enumerate(lookup_parts):assets[lookup_prefix+'/'+str(i).zfill(4)+'.bin']=data
 root=copy.deepcopy(m);root['storageProfile']='pages-lossless-v1';root['deterministic']['times']=root['deterministic']['times'][:15];root['deterministic']['recordBytes']=record_bytes
 root['deterministic']['compressedPages']={'schema':'mid.ruc.compressed-pages.v1','recordBytes':record_bytes,'records':m['pointCount'],'parts':parts}
 root['lookup']['pages']={'prefix':lookup_prefix,'recordBytes':4,'records':len(lookup)//4,'chunkCount':len(lookup_parts)}
 root['migration']={'schema':'mid.ruc.migration-active.v1','productionEnabled':True,'probeFixture':True,'proof':{'scope':'read-only real-core codec fixture, excludes EPS and rapid'}}
 root['pages']={'profile':'pages-lossless-v1','budgetBytes':900000000,'publishedBytes':sum(map(len,assets.values())),'losslessTransport':{'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False},'objects':[{'key':k,'bytes':len(v),'sha256':sha(v)} for k,v in assets.items()]}
 for key,data in assets.items():
  p=snapshot/key;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 (snapshot/'latest.json').write_bytes(compact(root));proof=admit(snapshot,source,work/'admission-candidate')
 return {'scope':'read-only real-native 14h-core/27h-map integration fixture, not production EPS/rapid/rollback proof',**proof}
