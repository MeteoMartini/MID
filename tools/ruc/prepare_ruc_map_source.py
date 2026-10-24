"""Prepare separate +27h map-only source; prove the released core prefix unchanged."""
from __future__ import annotations
import argparse,copy,json,re,shutil
from pathlib import Path
import numpy as np
from fetch_and_build_ruc import DET_BASE,session,stage_tree
from build_ruc_bundle import PARAM_MAP,collect_parameter,hourly_targets,file_info
from meteo_integrity import validate_core_fields
from ruc_pack import DEFAULT_FIELDS,pack_cell_major
from ruc_map_candidate import checked_object,compact
from build_ruc_bundle import derive_core_fields

def prepare(core,staging,output):
 core=Path(core).resolve(strict=True);staging=Path(staging).resolve();output=Path(output).resolve()
 roots=(core,staging,output)
 if output.exists() or any(a.is_relative_to(b) or b.is_relative_to(a) for i,a in enumerate(roots) for b in roots[i+1:]):raise ValueError('map source directories must be new and disjoint')
 original=(core/'latest.json').read_bytes();meta=json.loads(original)
 if meta.get('schema')!='mid.dwd.ruc.grid.v2':raise ValueError('unsupported core schema')
 raw=checked_object(core,meta,'deterministic.bin');lookup=checked_object(core,meta,'lookup.bin')
 if meta['deterministic']['fields']!=[vars(s) for s in DEFAULT_FIELDS]:raise ValueError('core field contract drift')
 run=meta['run'];stage=staging/re.sub(r'[^0-9A-Za-z_-]','',run);targets=hourly_targets(run,27)['deterministic'];series={};origins=[];s=session()
 for param,name in PARAM_MAP.items():
  folder=stage/'deterministic'/param
  rows=stage_tree(s,f'{DET_BASE}/{param}/r/{run}/',folder,27,f'map-only {run} {param}',mode='hourly')
  series[name]=collect_parameter([folder/row for row in rows],name,targets,meta['pointCount'])
  origins.extend({'field':param,'file':row,**file_info(folder/row)} for row in rows)
 fields=derive_core_fields(series,targets);coverage=validate_core_fields(fields)
 for spec in DEFAULT_FIELDS:
  q=np.rint((fields[spec.name][np.isfinite(fields[spec.name])]-spec.offset)/spec.scale)
  if np.any(np.abs(q)>32767):raise ValueError('unrepresentable native map source: '+spec.name)
 wire=pack_cell_major(fields,DEFAULT_FIELDS);cube=np.frombuffer(wire,dtype='<i2').reshape(meta['pointCount'],28,len(DEFAULT_FIELDS));n=len(meta['deterministic']['times'])
 if cube[:,:n,:].tobytes()!=raw:raise ValueError('extended map source changed original core prefix')
 if (core/'latest.json').read_bytes()!=original:raise ValueError('core manifest changed')
 # Revalidate original files after the transfers/packing, as for the map builder.
 if checked_object(core,meta,'deterministic.bin')!=raw or checked_object(core,meta,'lookup.bin')!=lookup:raise ValueError('source drift')
 output.mkdir(parents=True)
 try:
  (output/'deterministic.bin').write_bytes(wire);(output/'lookup.bin').write_bytes(lookup)
  extended=copy.deepcopy(meta);extended['deterministic']['times']=[t.strftime('%Y-%m-%dT%H:%M') for t in targets];extended['deterministic']['recordBytes']=28*len(DEFAULT_FIELDS)*2
  extended['objects']={name:file_info(output/name) for name in ('deterministic.bin','lookup.bin')}
  extended['mapOnlyExtension']={'coreManifestSha256':__import__('hashlib').sha256(original).hexdigest(),'sourceGribFiles':origins,'coverage':coverage,'epsExtended':False,'forecastFusionExtended':False}
  (output/'latest.json').write_bytes(compact(extended))
 except BaseException:
  shutil.rmtree(output);raise
 return extended
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--core',type=Path,required=True);p.add_argument('--staging',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();m=prepare(a.core,a.staging,a.output);print(json.dumps({'run':m['run'],'mapHours':27,'coreUnchanged':True}))
