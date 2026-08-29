from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Mapping, Sequence
import json
import numpy as np

NODATA_I16 = np.int16(-32768)
NODATA_U16 = np.uint16(65535)
UINT32_NODATA = np.uint32(0xFFFFFFFF)

@dataclass(frozen=True)
class FieldSpec:
    name: str
    unit: str
    scale: float
    offset: float = 0.0

DEFAULT_FIELDS: tuple[FieldSpec, ...] = (
    FieldSpec('temperature_2m', '°C', 0.01),
    FieldSpec('dew_point_2m', '°C', 0.01),
    FieldSpec('relative_humidity_2m', '%', 0.1),
    FieldSpec('pressure_msl', 'hPa', 0.1),
    FieldSpec('wind_speed_10m', 'kn', 0.01),
    FieldSpec('wind_direction_10m', '°', 0.1),
    FieldSpec('wind_gusts_10m', 'kn', 0.01),
    FieldSpec('precipitation', 'mm', 0.01),
    FieldSpec('cloud_cover', '%', 0.1),
    FieldSpec('cloud_cover_low', '%', 0.1),
    FieldSpec('cape', 'J/kg', 0.1),
    FieldSpec('convective_inhibition', 'J/kg', 0.1),
)


EPS_SUMMARY_FIELDS: tuple[FieldSpec, ...] = (
    FieldSpec('precipitation_probability', '%', 0.1),
    FieldSpec('precipitation_probability_significant', '%', 0.1),
    FieldSpec('precipitation_mean', 'mm', 0.01),
    FieldSpec('precipitation_q25', 'mm', 0.01),
    FieldSpec('precipitation_q50', 'mm', 0.01),
    FieldSpec('precipitation_q75', 'mm', 0.01),
)

def quantize(values: np.ndarray, spec: FieldSpec) -> np.ndarray:
    arr=np.asarray(values,dtype=np.float64);out=np.full(arr.shape,NODATA_I16,dtype='<i2');mask=np.isfinite(arr)
    q=np.rint((arr[mask]-spec.offset)/spec.scale);q=np.clip(q,-32767,32767).astype(np.int16);out[mask]=q;return out

def pack_cell_major(fields: Mapping[str,np.ndarray], specs: Sequence[FieldSpec]=DEFAULT_FIELDS) -> bytes:
    if not specs: raise ValueError('no fields configured')
    first=np.asarray(fields[specs[0].name]);
    if first.ndim!=2: raise ValueError('field arrays must be [time, point]')
    time_count,point_count=first.shape;cube=np.full((point_count,time_count,len(specs)),NODATA_I16,dtype='<i2')
    for fi,spec in enumerate(specs):
        arr=np.asarray(fields[spec.name]);
        if arr.shape!=(time_count,point_count): raise ValueError(f'{spec.name}: shape {arr.shape}, expected {(time_count,point_count)}')
        cube[:,:,fi]=quantize(arr,spec).T
    return cube.tobytes(order='C')

def pack_eps_members(values: np.ndarray, scale: float=.01) -> bytes:
    """Pack [time, member, point] accumulated-to-interval precipitation as point-time-member uint16."""
    arr=np.asarray(values,dtype=np.float64)
    if arr.ndim!=3: raise ValueError('EPS precipitation must be [time, member, point]')
    out=np.full(arr.shape,NODATA_U16,dtype='<u2');mask=np.isfinite(arr)
    out[mask]=np.rint(np.clip(arr[mask]/scale,0,65534)).astype(np.uint16)
    return out.transpose(2,0,1).copy(order='C').tobytes(order='C')

def write_meta(path:Path,*,run:str,times:Sequence[str],point_count:int,specs:Sequence[FieldSpec],grid:Mapping[str,object],deterministic_key:str,eps_key:str|None,lookup_key:str,member_count:int=0,eps_scale:float=.01,eps_summary_key:str|None=None,eps_summary_specs:Sequence[FieldSpec]=EPS_SUMMARY_FIELDS,objects:Mapping[str,object]|None=None) -> None:
    payload={
      'schema':'mid.dwd.ruc.grid.v2','run':run,'generatedAt':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat().replace('+00:00','Z'),
      'times':list(times),'pointCount':int(point_count),'grid':dict(grid),'lookup':{'key':lookup_key,'dtype':'uint32-le','nodata':int(UINT32_NODATA)},
      'deterministic':{'key':deterministic_key,'dtype':'int16-le','layout':'point-time-field','fields':[asdict(s) for s in specs],'recordBytes':len(times)*len(specs)*2},
      'epsSummary':None if not eps_summary_key else {'key':eps_summary_key,'dtype':'int16-le','layout':'point-time-field','fields':[asdict(s) for s in eps_summary_specs],'recordBytes':len(times)*len(eps_summary_specs)*2,'thresholdsMm':{'wet':0.2,'significant':5.0}},
      'eps':None if not eps_key else {'key':eps_key,'dtype':'uint16-le','layout':'point-time-member','nodata':65535,'scale':eps_scale,'unit':'mm','memberCount':int(member_count),'recordBytes':len(times)*int(member_count)*2},
      'objects':dict(objects or {})
    }
    path.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
