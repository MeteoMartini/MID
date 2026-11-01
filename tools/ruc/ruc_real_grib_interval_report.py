#!/usr/bin/env python3
"""168h read-only DWD GRIB single-field witness summary. NEVER SLO authority.

First valid ecCodes witness is an upper bound on observed availability. Unknown
polls do not establish unavailability, and one field never proves EPS20 or 6h.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone, timedelta
import json
import math
import re
from pathlib import Path
from urllib.parse import urlsplit, unquote

SCHEMA = 'mid.ruc.real-grib-first-field-shadow.v1'
RUN = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:00$')
HEX = re.compile(r'^[a-f0-9]{64}$')
POINTS = 542040

def utc(s):
    if not isinstance(s,str) or not s.endswith('Z'):
        raise ValueError('noncanonical UTC timestamp')
    d=datetime.fromisoformat(s[:-1]+'+00:00')
    if d.utcoffset()!=timedelta():
        raise ValueError('non-UTC timestamp')
    return d

def model_run(s):
    if not isinstance(s,str) or not RUN.fullmatch(s):
        raise ValueError('noncanonical run')
    d=datetime.strptime(s,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    if d.strftime('%Y-%m-%dT%H:%M')!=s:
        raise ValueError('invalid run')
    return d

def classify(row):
    """(run, observed timestamp, start-of-valid-probe or None)."""
    if not isinstance(row,dict) or row.get('schema')!=SCHEMA:
        raise ValueError('unknown witness schema')
    if row.get('productionAuthorized') is not False or row.get('fullRunVerified') is not False:
        raise ValueError('single GRIB cannot be publication authority')
    run=model_run(row['run'])
    if row.get('observationStatus')=='unknown':
        seen=utc(row['observedAtUtc'])
        if seen<run:raise ValueError('negative latency')
        return run,seen,None
    if row.get('origin')!='DWD ICON-D2-RUC actual GRIB2/ecCodes':
        raise ValueError('source provenance not declared')
    if row.get('sourceField')!='T_2M' or type(row.get('leadMinutes')) is not int or row['leadMinutes'] not in (0,60):
        raise ValueError('unsupported pilot parameter or lead')
    if row.get('eps20Verified') is not False or row.get('dwdFirstPublishedTimeVerified') is not False:
        raise ValueError('unsubstantiated EPS/first-publication claim')
    after,before=utc(row['observedAfterUtc']),utc(row['observedBeforeUtc'])
    if after<run or before<after or before-after>timedelta(minutes=8):
        raise ValueError('invalid bounded observation interval')
    url=urlsplit(row.get('sourceUrl',''))
    prefix='/weather/nwp/v1/m/icon-d2-ruc/p/T_2M/r/'+row['run']+'/'
    if (url.scheme!='https' or url.netloc!='opendata.dwd.de' or
        not url.path.startswith(prefix) or
        url.query or url.fragment or url.username or url.password or
        '..' in unquote(url.path).split('/')):
        raise ValueError('untrusted DWD witness URL')
    wire=row.get('wire')
    if not isinstance(wire,dict) or not HEX.fullmatch(str(wire.get('sha256'))) or type(wire.get('bytes')) is not int or not 100<=wire['bytes']<=16000000:
        raise ValueError('missing source SHA/size evidence')
    w=row.get('witness')
    if not isinstance(w,dict):raise ValueError('missing decoded witness')
    p,good,missing=(w.get(k) for k in ('pointCount','finitePointCount','missingPointCount'))
    if any(type(x) is not int for x in (p,good,missing)) or p!=POINTS or not 0<good<=p or good+missing!=p:
        raise ValueError('native bitmap/point-count mismatch')
    if utc(w.get('validTimeUtc'))!=run+timedelta(minutes=row['leadMinutes']):
        raise ValueError('validity/run/lead mismatch')
    lo,hi=w.get('minimumC'),w.get('maximumC')
    if any(type(x) not in (int,float) or not math.isfinite(x) for x in (lo,hi)) or lo>hi or lo < -105 or hi > 75:
        raise ValueError('nonfinite/implausible actual values')
    return run,before,after

def nearest(values,q):
    if not values:return None
    if any(not math.isfinite(v) or v<0 for v in values):
        raise ValueError('invalid latency')
    return round(sorted(values)[math.ceil(q*len(values))-1],3)

def summarize(rows,*,ending_at=None):
    observations=[classify(r) for r in rows]
    if ending_at is None:
        if not observations:raise ValueError('no samples')
        ending_at=max(x[1] for x in observations)
    if ending_at.tzinfo is None or ending_at.utcoffset()!=timedelta():
        raise ValueError('cutoff not UTC')
    if any(obs[1]>ending_at for obs in observations):
        raise ValueError('future evidence in report')
    end=ending_at.replace(minute=0,second=0,microsecond=0)
    start=end-timedelta(hours=167)
    by_run={}
    for run,seen,after in observations:
        if start<=run<=end:
            by_run.setdefault(run,[]).append((seen,after))
    upper,poll=[],[]
    verified=unknown=unseen=0
    for h in range(168):
        run=start+timedelta(hours=h)
        current=by_run.get(run,[])
        positive=sorted((seen,after) for seen,after in current if after is not None)
        if positive:
            seen,after=positive[0]
            upper.append((seen-run).total_seconds()/60)
            poll.append((seen-after).total_seconds()/60)
            verified+=1
        elif current:unknown+=1
        else:unseen+=1
    return {'schema':'mid.ruc.real-grib-168h-intervals.v1',
            'windowStartRunUtc':start.strftime('%Y-%m-%dT%H:%MZ'),
            'windowEndRunUtc':end.strftime('%Y-%m-%dT%H:%MZ'),
            'runSlots':168,'verifiedSingleFieldRuns':verified,
            'unknownSampledRuns':unknown,'unobservedRuns':unseen,
            'rightCensoredOrUnknownRuns':unknown+unseen,
            'firstVerifiedFieldUpperBoundMinutes':
                {'p50':nearest(upper,.5),'p90':nearest(upper,.9),'p95':nearest(upper,.95)},
            'sampleDurationMinutesP95':nearest(poll,.95),
            'everyRunHasSingleFieldWitness':verified==168,
            'sourceHashesProvidedButNotAuthenticated':True,
            'officialDwdPublicationTimeVerified':False,
            'fullHorizonAndEps20Verified':False,
            'appWorkerPagesAdoptionVerified':False,
            'productionSloAuthorized':False,
            'note':'First valid real-field poll is a latency upper bound; failed/unknown polls never mean missing weather'}
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('samples',nargs='+',type=Path)
    p.add_argument('--output',required=True,type=Path)
    p.add_argument('--ending-at')
    a=p.parse_args()
    if a.output.exists():p.error('refuse report overwrite')
    data=[json.loads(f.read_text(encoding='utf-8')) for f in a.samples]
    result=summarize(data,ending_at=utc(a.ending_at) if a.ending_at else None)
    a.output.write_text(json.dumps(result,ensure_ascii=False,allow_nan=False,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    print(f'Real GRIB first-field 168h shadow: {result["verifiedSingleFieldRuns"]}/168; no SLO authority')
if __name__=='__main__':main()
