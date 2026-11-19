#!/usr/bin/env python3
"""Real DWD original GRIB full nine-lead regular map builder A/B (science-only).

Performs the existing 10-field/8-product scientific map calculation twice:
- baseline uses the pre-change ThreadPoolExecutor.map over every source reference
- candidate uses the new exact-original-URL-deduplicated source loader

Input GRIBs are downloaded once and then replayed as identical SHA-pinned bytes;
HTTP timing deliberately excluded. No actual MID production publication.

Scope: 09Z +1/+2/+3/+4/+5/+6/+12/+24/+48h regular ICON-D2 remapping; NOT native RUC, 27h or EPS20.
"""
from __future__ import annotations

import hashlib
import json
import re
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlparse

import requests
import build_model_map_fields as builder
from build_precipitation_totals import ROOT

RUN = "2026110309"
HOURS = (1,2,3,4,5,6,12,24,48)
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
                if len(originals)!=99 or len(set(originals))!=94:
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
                    "listingCalls":sum(u in listings for u in observed),
                    "originalCompressedBytesReplayed":sum(len(files[url]) for url in observed if url in files)
                }
    finally:
        builder.requests.get=actual_get
        builder.load_unique_source_jobs=actual_load_unique
        builder.HOURS=actual_hours
    return outputs


def main():
    source_start=time.perf_counter()
    listings,files=real_dwd_listings_and_sources()
    download_wall_seconds=time.perf_counter()-source_start
    if len(files)!=94:
        raise ValueError(f'expected exactly 94 real independent original DWD source GRIBs, got {len(files)}')
    unique_input_bytes=sum(len(payload) for payload in files.values())
    if unique_input_bytes<=0 or unique_input_bytes>600_000_000:
        raise ValueError('original DWD source byte budget exceeded')
    expected_frames={f'{product}-{hour:03d}.bin' for product in
        ('temperature','pressure','wind','gust','cloud','thetae','sigwx','precipitation') for hour in HOURS}
    if len(expected_frames)!=72:
        raise ValueError('wrong 9-lead / 8-field frame inventory')
    trials=[]
    baseline_reference_hashes=None
    baseline_reference_manifest=None
    for attempt in range(3):
        results=run_pair(listings,files)
        original=results['original']
        optimized=results['deduplicated']
        a,b=original['files'],optimized['files']
        if set(a)!=set(b) or not expected_frames.issubset(a):
            raise ValueError('original-vs-optimized output inventory drift')
        if {n for n in a if n.endswith('.bin')}!=expected_frames:
            raise ValueError('incomplete or unexpected field-hour frames')
        if any(a[name]!=b[name] for name in expected_frames):
            raise ValueError('non-identical original compressed forecast output')
        if original['manifest']!=optimized['manifest']:
            raise ValueError('source/run/validity/provenance/field manifest drift (generatedAt excluded)')
        if original['sourceReferences']!=99 or optimized['sourceReferences']!=99:
            raise ValueError('unexpected same-run source reference count')
        if original['originalGribCalls']!=99 or optimized['originalGribCalls']!=94:
            raise ValueError('deduplication changes actual original-input identity')
        if original['listingCalls']!=10 or optimized['listingCalls']!=10:
            raise ValueError('source listing drift')
        if sorted(original['manifest']['origins'],key=lambda x:x['url'])!=sorted(optimized['manifest']['origins'],key=lambda x:x['url']):
            raise ValueError('original compressed source origin SHA drift')
        origins=original['manifest']['origins']
        if [x['sha256'] for x in origins]!=[hashlib.sha256(files[x['url']]).hexdigest() for x in origins]:
            raise ValueError('original DWD compressed source mismatch')
        if original['originalCompressedBytesReplayed']<=optimized['originalCompressedBytesReplayed']:
            raise ValueError('no measured source-body byte saving from exact original')
        expected_unique_bytes=sum(len(v) for v in files.values())
        if optimized['originalCompressedBytesReplayed']!=expected_unique_bytes:
            raise ValueError('optimized original source bytes are not exactly one per unique GRIB')
        expected_saved=sum(len(files[origins[k]['url']]) for k in range(len(origins))
                          if origins[k]['url'] in {x['url'] for x in origins[:k]})
        if original['originalCompressedBytesReplayed']-optimized['originalCompressedBytesReplayed']!=expected_saved:
            raise ValueError('measured original body byte saving differs from exact duplicate payloads')
        hashes={name:hashlib.sha256(a[name]).hexdigest() for name in sorted(expected_frames)}
        if baseline_reference_hashes is None:
            baseline_reference_hashes=hashes
            baseline_reference_manifest=original['manifest']
        elif hashes!=baseline_reference_hashes or original['manifest']!=baseline_reference_manifest:
            raise ValueError('non-deterministic same-original-run frame or manifest across repetitions')
        trials.append({
          'run':attempt+1,
          'baselineSecondsExcludeInputDownload':original['seconds'],
          'optimizedSecondsExcludeInputDownload':optimized['seconds'],
          'baselineSourceRequestsReplayed':original['originalGribCalls'],
          'optimizedSourceRequestsReplayed':optimized['originalGribCalls'],
          'baselineOriginalCompressedPayloadBytesReplayed':original['originalCompressedBytesReplayed'],
          'optimizedOriginalCompressedPayloadBytesReplayed':optimized['originalCompressedBytesReplayed'],
          'all72FramesByteIdentical':True
        })
    durations_original=[x['baselineSecondsExcludeInputDownload'] for x in trials]
    durations_optimized=[x['optimizedSecondsExcludeInputDownload'] for x in trials]
    original_med=statistics.median(durations_original)
    optimized_med=statistics.median(durations_optimized)
    saved_bytes=trials[0]['baselineOriginalCompressedPayloadBytesReplayed']-unique_input_bytes
    result={
      'schema':'mid.dwd.actual-original-nine-lead-full-map-batch-ab.shadow.v1',
      'sourceRun':'2026-11-03T09:00:00Z',
      'actualOriginalDwdRun':True,
      'sourceGrid':'DWD ICON-D2 germany_regular-lat-lon remapped GRIB, not native RUC',
      'forecastHours':list(HOURS),
      'parameters':list(FIELD_NAMES),
      'sources':{'uniqueCompressedGribCount':len(files),
                 'sourceBodySha256':{u:hashlib.sha256(b).hexdigest() for u,b in sorted(files.items())},
                 'actualUniqueCompressedBytesFetchedOnce':unique_input_bytes,
                 'actualOriginalUniqueInputDownloadSeconds':round(download_wall_seconds,3),
                 'baselineGribSourceReferences':99,
                 'optimizedGribSourceReferences':94,
                 'exactDuplicateCompressedBodyBytesSavedOnEveryUncachedFullBuilderRun':saved_bytes,
                 'uncachedHttpPayloadReductionIsInferredFromAuthenticSourceBytes':True,
                 'repeatedHttpNetworkTransferBenchmarkRun':False},
      'outputs':{'frames':72,'gzipFrameSha256':baseline_reference_hashes,
                 'all72FramesByteIdenticalAllThreePairs':True,
                 'sourceManifestIdenticalExceptGenerationTimestamp':True,
                 'runValidUnitsAndMissingChecksKeptInOriginalDecoder':True},
      'performance':{'trials':trials,
                     'medianBaselineSecondsExcludingOriginalSourceFetch':original_med,
                     'medianOptimizedSecondsExcludingOriginalSourceFetch':optimized_med,
                     'medianDifferenceSeconds':round(original_med-optimized_med,3),
                     'singleMachineSampleNotEndToEndSlo':True},
      'ruc27hOr20EpsOrRapid5mOrFastValidated':False,
      'completeNativeDwdDomainValidated':False,
      'clientWebIosWidgetsExportsValidated':False,
      'endClientFreshness168hP95Validated':False,
      'productionEligible':False,
    }
    print(json.dumps(result,indent=2,allow_nan=False))


if __name__=='__main__':
    main()
