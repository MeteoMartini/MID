#!/usr/bin/env python3
"""Real DWD compressed GRIB *whole map builder* A/B on two same-run hours.

Performs the existing 10-field/8-product scientific map calculation twice:
- baseline uses the pre-change ThreadPoolExecutor.map over every source reference
- candidate uses the new exact-original-URL-deduplicated source loader

Input GRIBs are downloaded once and then replayed as identical SHA-pinned bytes;
HTTP timing deliberately excluded. No actual MID production publication.

Scope: 09Z +1/+2h regular ICON-D2 remapping, *not* native RUC, 27h or EPS20.
"""
from __future__ import annotations

import hashlib
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlparse

import requests
import build_model_map_fields as builder
from build_precipitation_totals import ROOT

RUN = "2026110309"
HOURS = (1,2)
BASE = ROOT+"09/"
MAX_GRIB = 8_000_000
FIELD_NAMES = tuple(builder.FIELDS)


def real_dwd_listings_and_sources():
    listings={}
    files={}
    with requests.Session() as session:
        for field in FIELD_NAMES:
            url=BASE+field+"/"
            res=session.get(url,timeout=25,allow_redirects=False)
            if res.status_code!=200 or res.url!=url:raise ValueError("DWD regular field listing not available "+field)
            if len(res.content)>1500000:raise ValueError("DWD listing too large")
            listings[url]=res.text
        for hour in HOURS:
            for field in FIELD_NAMES:
                for step in ([hour,hour-1] if field=="tot_prec" else [hour]):
                    base=BASE+field+"/"
                    found=re.findall(r'href="([^"/]+\.grib2\.bz2)"',listings[base])
                    candidates=[
                        name for name in found if f"_{RUN}_{step:03d}_" in name
                        and "germany_regular-lat-lon" in name
                        and ((f"_850_{field}." in name) if field in ("t","relhum")
                             else "single-level" in name)
                    ]
                    if len(candidates)!=1:
                        raise ValueError(f"original DWD regular source missing/not unique: {field} +{step}h, n={len(candidates)}")
                    url=base+candidates[0]
                    if urlparse(url).netloc!="opendata.dwd.de":
                        raise ValueError("external source")
                    files[url]=None
        for url in files:
            with session.get(url,timeout=45,stream=True,allow_redirects=False) as r:
                if r.status_code!=200 or r.url!=url:
                    raise ValueError("original DWD source unavailable")
                if int(r.headers.get("Content-Length","0") or 0)>MAX_GRIB:
                    raise ValueError("DWD source over budget")
                raw=bytearray()
                for chunk in r.iter_content(1048576):
                    raw.extend(chunk)
                    if len(raw)>MAX_GRIB:raise ValueError("GRIB source stream over budget")
                if not raw.startswith(b"BZh") or len(raw)<100:
                    raise ValueError("not a complete DWD bz2 compressed GRIB")
                files[url]=bytes(raw)
    return listings,files


class SourceResponse:
    def __init__(self, *, text=None, content=None):
        self.text=text if text is not None else ""
        self.content=content if content is not None else self.text.encode("utf-8")
    def raise_for_status(self):
        return None


def run_pair(listings,files):
    actual_get=builder.requests.get
    actual_load_unique=builder.load_unique_source_jobs
    actual_hours=builder.HOURS
    if actual_hours != (1,2,3,4,5,6,12,24,48):
        raise ValueError("unexpected stable builder frame schedule")
    lookups={}
    lookups.update({url:SourceResponse(text=txt) for url,txt in listings.items()})
    lookups.update({url:SourceResponse(content=payload) for url,payload in files.items()})
    observed=[]
    def stub_get(url, *, timeout=None, **kwargs):
        if kwargs:raise ValueError("unexpected request options in deterministic map replay")
        if url not in lookups:raise ValueError("map builder requested unverified DWD URL")
        observed.append(url)
        return lookups[url]
    def baseline(jobs,loader,max_workers=4):
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            return list(pool.map(loader,jobs))
    outputs={}
    try:
        builder.HOURS=HOURS
        builder.requests.get=stub_get
        with TemporaryDirectory(prefix="mid-real-dwd-map-batch-") as work:
            for variant in ("original","deduplicated"):
                observed.clear()
                builder.load_unique_source_jobs=baseline if variant=="original" else actual_load_unique
                path=Path(work)/variant
                start=time.perf_counter()
                manifest=builder.build(path,{"run":"2026-11-03T09:00:00+00:00"})
                duration=time.perf_counter()-start
                actual_files={p.name:p.read_bytes() for p in path.glob("*") if p.is_file()}
                if not actual_files or "index.json" not in actual_files:
                    raise ValueError("map builder did not produce source manifest")
                originals=[origin["url"] for origin in manifest["origins"]]
                if len(originals)!=len(set(originals))+1:
                    raise ValueError("wrong expected duplicated source reference count")
                if any(u not in files for u in originals):
                    raise ValueError("manifest references non-matched source GRIB")
                if [origin["sha256"] for origin in manifest["origins"]] != [
                    hashlib.sha256(files[u]).hexdigest() for u in originals]:
                    raise ValueError("compressed original source origin hash drift")
                manifest.pop("generatedAt",None)   # only variable non-weather field
                outputs[variant]={
                    "manifest":manifest,"files":actual_files,"seconds":round(duration,3),
                    "sourceReferences":len(originals),
                    "originalGribCalls":sum(u in files for u in observed),
                    "listingCalls":sum(u in listings for u in observed)
                }
    finally:
        builder.requests.get=actual_get
        builder.load_unique_source_jobs=actual_load_unique
        builder.HOURS=actual_hours
    return outputs


def main():
    listings,files=real_dwd_listings_and_sources()
    if len(files)!=21:
        raise ValueError(f"expected 21 real original unique DWD source GRIBs, got {len(files)}")
    results=run_pair(listings,files)
    old=results["original"]
    new=results["deduplicated"]
    old_files=old["files"]
    new_files=new["files"]
    if old_files.keys()!=new_files.keys():
        raise ValueError("file inventory difference")
    frames=sorted(k for k in old_files if k.endswith(".bin"))
    if len(frames)!=16:
        raise ValueError("expected eight map fields x two hours")
    if any(old_files[name]!=new_files[name] for name in frames):
        raise ValueError("non-identical compressed map source frame")
    m1=old["manifest"]
    m2=new["manifest"]
    if m1!=m2:
        raise ValueError("non-weather manifest/header/source SHA differs")
    expected=22
    if old["originalGribCalls"]!=expected or new["originalGribCalls"]!=21:
        raise ValueError("unexpected original vs optimized download counts")
    report={
        "schema":"mid.dwd.actual-regular-full-map-two-hour-batch-ab.shadow.v1",
        "run":"2026-11-03T09:00:00Z",
        "fieldNames":list(FIELD_NAMES),
        "hourlyLeads":[1,2],
        "nativeRucOrEPS20":False,
        "originalUniqueGribSources":len(files),
        "originalSourceSha256":{url:hashlib.sha256(payload).hexdigest() for url,payload in files.items()},
        "baselineGribLoads":old["originalGribCalls"],
        "deduplicatedGribLoads":new["originalGribCalls"],
        "baselineWallSecondsExcludingOriginalDownload":old["seconds"],
        "optimizedWallSecondsExcludingOriginalDownload":new["seconds"],
        "frameCount":len(frames),
        "gzipFrameSha256":{name:hashlib.sha256(old_files[name]).hexdigest() for name in frames},
        "framesByteIdentical":True,
        "manifestIdenticalAfterGeneratedAtRemoval":True,
        "validatedByFullMapBuilder":True,
        "actualTransferTimeMeasured":False,
        "notAllNineLeadHours":True,
        "notClientBrowserIOSExportVerified":True,
        "productionEligible":False
    }
    print(json.dumps(report,indent=2,allow_nan=False))


if __name__=="__main__":
    main()
