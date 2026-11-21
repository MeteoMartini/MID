#!/usr/bin/env python3
"""One pinned real-DWD-regular-GRIB precipitation batch A/B, science only.

Uses the same decoding and derived frame serialization as the live MID regular
ICON-D2 map builder. Does NOT publish, write product assets or change Workers.
Scoped to TOT_PREC at +1..+6h, NOT full map fields, RUC native or EPS20.
"""
from __future__ import annotations
import bz2
import gzip
import hashlib
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import numpy as np
import requests

from build_precipitation_totals import ROOT, difference, read_field
from dwd_stage_batch_reuse import load_unique_source_jobs

# A pinned public DWD original cycle: no mutable latest-pointer admission.
RUN = "2026110309"
HOURS = (1, 2, 3, 4, 5, 6)
STEPS = tuple(range(7))
MAX_FILE_BYTES = 8_000_000
SRC_BASE = ROOT + "09/tot_prec/"
PREFIX = "icon-d2_germany_regular-lat-lon_single-level_" + RUN + "_"


def source_list():
    r=requests.get(SRC_BASE,timeout=25,allow_redirects=False)
    if r.status_code != 200 or r.url != SRC_BASE:raise ValueError("DWD source directory not reachable")
    found = re.findall(
        r'href="(icon-d2_germany_regular-lat-lon_single-level_' +
        RUN + r'_(\d{3})_2d_tot_prec\.grib2\.bz2)"', r.text)
    files={}
    for name,step in found:
        h=int(step)
        if h in STEPS:
            if h in files:raise ValueError("duplicate original DWD lead in listing")
            files[h]=SRC_BASE+name
    if set(files)!=set(STEPS):
        raise ValueError("original DWD 09Z run incomplete at leads 0..6; stop study")
    return files


def bounded_download(url):
    parsed=urlparse(url)
    if (parsed.scheme != "https" or parsed.netloc != "opendata.dwd.de"
        or parsed.query or parsed.fragment or not url.startswith(SRC_BASE)
        or not url.endswith(".grib2.bz2")):
        raise ValueError("unsafe source GRIB URL")
    r=requests.get(url,timeout=45,stream=True,allow_redirects=False)
    with r:
        if r.status_code!=200 or r.url!=url:raise ValueError("DWD source status or redirect changed")
        limit=int(r.headers.get("Content-Length", "0") or "0")
        if limit>MAX_FILE_BYTES:raise ValueError("oversized original source GRIB")
        payload=bytearray()
        for chunk in r.iter_content(1024*1024):
            payload.extend(chunk)
            if len(payload)>MAX_FILE_BYTES:raise ValueError("original DWD transfer exceeds budget")
    if len(payload)<100:raise ValueError("truncated GRIB")
    # Validate compressed framing before ecCodes admission.
    if not bytes(payload).startswith(b"BZh"):raise ValueError("not original bzip2 GRIB")
    return bytes(payload)


def compare():
    files=source_list()
    original_sources={h:bounded_download(files[h]) for h in STEPS}
    original_sha={h:hashlib.sha256(original_sources[h]).hexdigest() for h in STEPS}
    jobs=[]
    for hour in HOURS:
        jobs.extend([(hour,"tot_prec",hour,files[hour]),(hour,"tot_prec",hour-1,files[hour-1])])
    if len(jobs)!=12 or len(set(j[3] for j in jobs))!=7:
        raise ValueError("actual original schedule / duplicate count differs")
    def loader(job):
        hour, field, step, url=job
        if field!="tot_prec" or files[step]!=url:raise ValueError("mixed source selection")
        lat,lon,value=read_field(original_sources[step],RUN,step)
        return (hour,field,step,(lat,lon,value,0),
                {"url":url,"sha256":original_sha[step]})

    started=time.perf_counter()
    with ThreadPoolExecutor(max_workers=4) as pool:
        previous=list(pool.map(loader,jobs))
    old_seconds=time.perf_counter()-started
    started=time.perf_counter()
    optimized=load_unique_source_jobs(jobs,loader,max_workers=4)
    new_seconds=time.perf_counter()-started

    if len(previous)!=len(optimized):raise ValueError("optimized stage missing frames")
    for x,y in zip(previous,optimized,strict=True):
        if x[:3]!=y[:3] or x[4]!=y[4]:
            raise ValueError("source job identity/sha provenance changed")
        for left,right in zip(x[3],y[3],strict=True):
            if isinstance(left,np.ndarray):
                if left.dtype!=right.dtype or left.shape!=right.shape or left.tobytes()!=right.tobytes():
                    raise ValueError("source GRID or value bytes changed")
            elif left!=right:raise ValueError("GRIB startStep provenance changed")
    if len({r[4]["sha256"] for r in previous})!=7:raise ValueError("source SHA collision")
    def product(rows):
        indexed={(h,step):data for h,f,step,data,source in rows}
        frames={}
        for h in HOURS:
            la,lo,start,_=indexed[(h,h-1)]
            la2,lo2,end,_=indexed[(h,h)]
            if not np.array_equal(la,la2) or not np.array_equal(lo,lo2):
                raise ValueError("original precipitation grids differed")
            values=difference(start,end)/10
            packed=np.rint(values*10).astype(np.int32)
            run_time=datetime.strptime(RUN,"%Y%m%d%H").replace(tzinfo=timezone.utc)
            payload={
                "schema":"mid.icon-d2.field.v1","run":run_time.isoformat(),
                "time":(run_time+timedelta(hours=h)).isoformat(),
                "kind":"precipitation","unit":"mm/1 h","scale":.1,
                "lats":la.tolist(),"lons":lo.tolist(),"values":packed.ravel().tolist(),
                "centers":[],"isobars":[]
            }
            raw=(json.dumps(payload,separators=(",",":"),ensure_ascii=False)+"\n").encode()
            z=gzip.compress(raw,compresslevel=6,mtime=0)
            frames[h]={"sha256":hashlib.sha256(z).hexdigest(),
                       "gzipBytes":len(z),"decodedBytes":len(raw),
                       "positiveCells":int(np.count_nonzero(packed>0)),
                       "maxStoredTenthsMm":int(packed.max())}
        return frames
    old_frames=product(previous)
    new_frames=product(optimized)
    if old_frames!=new_frames:raise ValueError("original-vs-dedup FRAME gzip bytes or weather values changed")

    evidence={
        "schema":"mid.dwd.real-original-regular-precip-batch-ab.shadow.v1",
        "model":"icon-d2 regular-lat-lon remapping from original DWD GRIB2",
        "sourceRun":datetime.strptime(RUN,"%Y%m%d%H").replace(tzinfo=timezone.utc).isoformat(),
        "hours":list(HOURS),
        "sourceCompressedBytes":{str(h):len(original_sources[h]) for h in STEPS},
        "originalSourceSha256":{str(h):original_sha[h] for h in STEPS},
        "requestedReferenceCount":len(jobs),
        "uniqueDwdGribDownloadsInOptimizedBatch":len(original_sources),
        "baselineDecodeCalls":len(previous),
        "optimizedDecodeCalls":len(set(j[3] for j in jobs)),
        "oldDecodeTimeSeconds":round(old_seconds,3),
        "newDecodeTimeSeconds":round(new_seconds,3),
        "actualNetworkDownloadTimeExcludedFromTiming":True,
        "identicalOriginalDecodedArrayBytes":True,
        "identicalOriginalSourceProvenance":True,
        "identicalSixGzippedPrecipitationFrames":True,
        "frameHashesAndExtrema":old_frames,
        "comparedOnlyPrecipitationField":True,
        "pressureContoursAndOtherEightMapKindsChecked":False,
        "fullProductionMapBuildProven":False,
        "productionEligible":False
    }
    print(json.dumps(evidence,indent=2,allow_nan=False))


if __name__=="__main__":
    compare()
