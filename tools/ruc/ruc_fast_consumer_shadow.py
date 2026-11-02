#!/usr/bin/env python3
"""Independent, read-only consumer for a strictly inactive native RUC Fast Lane.

Reads original checked binary objects, validates exact wire dimensions, NoData
and future use contract. Never promotes, writes Pages/Worker, or signals
productionEnabled; all observations remain shadow-only.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import re

import numpy as np

from ruc_fast_lane_producer import WIRE_CONTRACT, digest
from ruc_fast_pointer_staging import SCHEMA, KEYS, strict_budget, count_files

RUN = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:00$')
SHA = re.compile(r'^[0-9a-f]{64}$')
MISSING = np.int16(-32768)
NATIVE_POINTS = 542040
MAX_RECORDS = 900_000_000


def axis(run, minutes):
    if not isinstance(run,str) or not RUN.fullmatch(run):
        raise ValueError('invalid native original UTC run')
    reference = datetime.strptime(run,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    return [(reference + timedelta(minutes=m)).strftime('%Y-%m-%dT%H:%M')
            for m in minutes]


def decode_cell(raw, *, spec):
    """Decode one i16 packed native scalar; never reinterpret Missing as 0."""
    if type(raw) is not int or raw < -32768 or raw > 32767:
        raise ValueError('invalid native i16 scalar')
    if raw == -32768:
        return None
    if len(spec) != 4 or not isinstance(spec[2],(int,float)) or spec[2] <= 0:
        raise ValueError('invalid released native scale')
    return raw * spec[2] + spec[3]


def validate_pointer(pointer):
    if not isinstance(pointer,dict) or pointer.get('schema') != SCHEMA:
        raise ValueError('invalid fast native pointer schema')
    for flag in ('productionEnabled','publicationAuthorized',
                 'realtimeConsumerEnabled','consumerAdoptionVerified'):
        if pointer.get(flag) is not False:
            raise ValueError('unverified activation or consumer claim: '+flag)
    if pointer.get('sourceSchema') != 'mid.ruc.fast-prepared.v1':
        raise ValueError('untrusted native producer format')
    if pointer.get('horizonHours') != 6 or pointer.get('eps') != {'availability':'unavailable'}:
        raise ValueError('fast lane must NOT fake EPS20 or extend beyond +6h')
    if pointer.get('nativePoints') != NATIVE_POINTS:
        raise ValueError('original native grid must be exactly 542040 cells')
    grid=pointer.get('grid')
    if not isinstance(grid,dict) or grid.get('nativePointCount')!=NATIVE_POINTS:
        raise ValueError('native fast geography mismatch')
    nx,ny=grid.get('nx'),grid.get('ny')
    if type(nx) is not int or type(ny) is not int or nx<=0 or ny<=0 or nx*ny>10_000_000:
        raise ValueError('invalid index lookup geometry')
    fields=pointer.get('fields')
    if not isinstance(fields,list) or tuple(
        (x.get('name'),x.get('unit'),x.get('scale'),x.get('offset'))
        for x in fields if isinstance(x,dict))!=WIRE_CONTRACT or len(fields)!=len(WIRE_CONTRACT):
        raise ValueError('original 12-field native wire units/scales drift')
    run=pointer.get('run')
    if pointer.get('dataTimes')!=axis(run,range(0,361,60)):
        raise ValueError('shifted +0..6h original UTC hourly axis')
    if pointer.get('rapid5Times')!=axis(run,range(0,361,5)):
        raise ValueError('shifted native 5-min axis')
    if pointer.get('rapid15Times')!=axis(run,range(0,361,15)):
        raise ValueError('shifted native 15-min axis')
    if (not isinstance(pointer.get('sourceGribSha256'),str) or
        not SHA.fullmatch(pointer['sourceGribSha256'])):
        raise ValueError('missing original DWD source evidence digest')
    if not isinstance(pointer.get('sourceRunManifestSha256'),str) or not SHA.fullmatch(pointer['sourceRunManifestSha256']):
        raise ValueError('original local source manifest digest missing')
    objects=pointer.get('objects')
    if not isinstance(objects,dict) or set(objects)!=set(KEYS):
        raise ValueError('incomplete fast objects')
    key_prefix='fast/runs/'+run.replace('-','').replace(':','')+'/'
    exact={
        'deterministic.bin':NATIVE_POINTS*7*12*2,
        'rapid-5m.bin':NATIVE_POINTS*73*2,
        'rapid-15m.bin':NATIVE_POINTS*25*3*2,
        'lookup.bin':nx*ny*4,
    }
    for name in KEYS:
        proof=objects[name]
        if (not isinstance(proof,dict) or proof.get('key')!=key_prefix+name or
            type(proof.get('bytes')) is not int or proof['bytes']!=exact[name] or
            not isinstance(proof.get('sha256'),str) or not SHA.fullmatch(proof['sha256'])):
            raise ValueError('noncanonical immutable native fast object: '+name)
    if (not isinstance(pointer.get('envelope'),dict) or
        pointer['envelope'].get('key')!=key_prefix+'manifest.json' or
        not isinstance(pointer['envelope'].get('sha256'),str) or
        not SHA.fullmatch(pointer['envelope']['sha256'])):
        raise ValueError('untrusted immutable native run envelope')
    return exact


def inspect_shadow(shadow):
    root=Path(shadow)
    if not root.is_dir() or root.is_symlink():
        raise ValueError('missing isolated fast shadow tree')
    fast=root/'ruc'/'fast'
    if fast.is_symlink() or not fast.is_dir():
        raise ValueError('invalid fast shadow namespace')
    p=fast/'latest.json'
    if p.is_symlink() or not p.is_file():
        raise ValueError('missing immutable shadow pointer')
    pointer=json.loads(p.read_text(encoding='utf-8'))
    sizes=validate_pointer(pointer)
    total=count_files(root)
    strict_budget(0,total)
    native={}
    for name in KEYS:
        proof=pointer['objects'][name]
        obj=root/'ruc'/proof['key']
        if obj.is_symlink() or not obj.is_file() or not obj.resolve().is_relative_to(fast.resolve()):
            raise ValueError('unsafe native object path')
        if digest(obj)!={'bytes':proof['bytes'],'sha256':proof['sha256']}:
            raise ValueError('untrusted original native binary SHA')
        native[name]=obj
    env=pointer['envelope']
    env_path=root/'ruc'/env['key']
    if env_path.is_symlink() or digest(env_path)!={
        'bytes':env['bytes'],'sha256':env['sha256']}:
        raise ValueError('tampered native run envelope')
    envelope=json.loads(env_path.read_text(encoding='utf-8'))
    if envelope.get('pointerActivation')!='inactive-only':
        raise ValueError('unexpected live production run pointer')
    for key in ('run','sourceGribSha256','objects','fields','dataTimes','eps'):
        if envelope.get(key)!=pointer.get(key):
            raise ValueError('immutable envelope and pointer drift')
    objects={}
    shapes={
        'deterministic.bin':(NATIVE_POINTS,7,12),
        'rapid-5m.bin':(NATIVE_POINTS,73,1),
        'rapid-15m.bin':(NATIVE_POINTS,25,3),
    }
    total_missing=0
    total_genuine_zero=0
    for name,shape in shapes.items():
        data=np.memmap(native[name],dtype='<i2',mode='r',shape=shape)
        missing=int(np.count_nonzero(data==MISSING))
        zeros=int(np.count_nonzero(data==0))
        total_missing+=missing
        total_genuine_zero+=zeros
        objects[name]={'bytes':sizes[name],'checksumVerified':True,'nativeLayout':list(shape),
                       'missingCells':missing,'trueZeroCells':zeros}
        del data
    lookup=np.memmap(native['lookup.bin'],dtype='<u4',mode='r',shape=(sizes['lookup.bin']//4,))
    known=lookup!=np.uint32(0xFFFFFFFF)
    if np.any(lookup[known]>=NATIVE_POINTS) or np.count_nonzero(known)<.85*len(lookup):
        raise ValueError('invalid native lookup index coverage')
    objects['lookup.bin']={'bytes':sizes['lookup.bin'],'checksumVerified':True,
                           'validNativeReferences':int(np.count_nonzero(known))}
    return {
        'schema':'mid.ruc.fast-native-independent-consumer-shadow.v1',
        'run':pointer['run'],'hours':6,'memberCount':0,
        'originalNativeObjectsVerified':True,'trueNoDataPreserved':True,
        'missingCells':total_missing,'trueZeroCells':total_genuine_zero,
        'localSiteBytes':total,'objects':objects,
        'productionEnabled':False,'publicationAuthorized':False,
        'realtimeConsumerEnabled':False,'consumerAdoptionVerified':False,
        'evidenceLimit':'local original-GRIB shadow only: no public Pages/Worker, app, widget, export, global CAS or P95',
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--shadow',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if args.output.exists() or args.output.is_symlink() or not args.output.parent.is_dir():
        parser.error('shadow readback output must be an unused file in existing directory')
    result=inspect_shadow(args.shadow)
    with args.output.open('x',encoding='utf-8') as dest:
        json.dump(result,dest,sort_keys=True,allow_nan=False)
        dest.write('\n')
    print(json.dumps({'run':result['run'],'nativeObjects':len(result['objects']),
                      'originalNativeObjectsVerified':True,
                      'productionEnabled':False},sort_keys=True))


if __name__=='__main__':
    main()
