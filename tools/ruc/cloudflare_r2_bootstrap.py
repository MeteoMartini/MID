#!/usr/bin/env python3
"""Safely prepare MID's private Cloudflare R2 storage for DWD RUC/RUC-EPS.

This bootstrap deliberately separates one-time account/storage administration from the
hourly object-only data publisher. Default mode is dry-run/read-only. --apply is
accepted only when MID_RUC_COST_APPROVED=true. Public access is *not* required for MID;
a custom domain remains an explicitly gated optional path.

The script intentionally does not rewrite an existing Worker's binding list. Cloudflare's
script settings endpoint can return bindings that cannot be losslessly re-submitted
(e.g. secret bindings without secret material). It therefore verifies an existing
MID_DWD_RUC_DATA binding when a worker name is supplied and otherwise emits the one-time
manual binding requirement rather than risking unrelated Worker settings.
"""
from __future__ import annotations
import argparse,json,os,sys,urllib.error,urllib.request

API='https://api.cloudflare.com/client/v4'
RUC_BINDING='MID_DWD_RUC_DATA'
LIFECYCLE_RULE_ID='mid-ruc-orphan-runs'
DEFAULT_ORPHAN_MAX_AGE_SECONDS=48*3600


def env(name,default=''): return str(os.getenv(name,default)).strip()
def truth(name): return env(name).lower() in {'1','true','yes','on'}

def request(method,url,token,body=None):
    data=None if body is None else json.dumps(body,separators=(',',':')).encode()
    req=urllib.request.Request(url,data=data,method=method,headers={
        'Authorization':f'Bearer {token}','Content-Type':'application/json','Accept':'application/json','User-Agent':'MID-RUC-bootstrap/2'
    })
    try:
        with urllib.request.urlopen(req,timeout=20) as r: payload=json.loads(r.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        text=e.read().decode(errors='replace')
        raise RuntimeError(f'Cloudflare HTTP {e.code}: {text[:600]}') from e
    if not payload.get('success',False):
        raise RuntimeError('Cloudflare API error: '+json.dumps(payload.get('errors') or payload,ensure_ascii=False)[:800])
    return payload.get('result')

def bucket_exists(account,bucket,token):
    try: request('GET',f'{API}/accounts/{account}/r2/buckets/{bucket}',token); return True
    except RuntimeError as e:
        if '404' in str(e): return False
        raise

def lifecycle_rule(max_age_seconds):
    return {
        'id':LIFECYCLE_RULE_ID,
        'enabled':True,
        'conditions':{'prefix':'runs/'},
        'deleteObjectsTransition':{'condition':{'type':'Age','maxAge':int(max_age_seconds)}}
    }

def merged_lifecycle(existing,max_age_seconds):
    rules=list((existing or {}).get('rules') or [])
    desired=lifecycle_rule(max_age_seconds)
    kept=[row for row in rules if str(row.get('id',''))!=LIFECYCLE_RULE_ID]
    return {'rules':kept+[desired]}

def binding_state(settings,bucket):
    bindings=list((settings or {}).get('bindings') or [])
    matches=[row for row in bindings if str(row.get('name',''))==RUC_BINDING]
    if not matches:return 'missing'
    row=matches[0]
    if row.get('type')!='r2_bucket':return f"conflict:type={row.get('type')}"
    if str(row.get('bucket_name',''))!=bucket:return f"conflict:bucket={row.get('bucket_name')}"
    return 'configured'

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--apply',action='store_true')
    p.add_argument('--bucket',default=env('MID_RUC_R2_BUCKET','mid-ruc-data'))
    p.add_argument('--location',default=env('MID_RUC_R2_LOCATION','weur'))
    p.add_argument('--worker',default=env('MID_CLOUDFLARE_WORKER_NAME'))
    p.add_argument('--custom-domain',default=env('MID_RUC_CUSTOM_DOMAIN'))
    p.add_argument('--zone-id',default=env('CLOUDFLARE_ZONE_ID'))
    p.add_argument('--orphan-max-age-seconds',type=int,default=int(env('MID_RUC_ORPHAN_MAX_AGE_SECONDS',str(DEFAULT_ORPHAN_MAX_AGE_SECONDS))))
    a=p.parse_args()
    a.location=str(a.location or '').strip().lower()
    if a.location not in {'','apac','eeur','enam','weur','wnam','oc'}:
        raise SystemExit('MID_RUC_R2_LOCATION must be one of apac, eeur, enam, weur, wnam, oc or empty for automatic placement.')
    if not 12*3600<=a.orphan_max_age_seconds<=30*86400:
        raise SystemExit('MID_RUC_ORPHAN_MAX_AGE_SECONDS must be between 12 hours and 30 days.')
    account=env('CLOUDFLARE_ACCOUNT_ID');token=env('CLOUDFLARE_API_TOKEN')
    plan={
      'accountIdConfigured':bool(account),'apiTokenConfigured':bool(token),'bucket':a.bucket,
      'storageClass':'Standard','locationHint':a.location,'publicAccess':'disabled-by-default',
      'orphanRunLifecycleSeconds':a.orphan_max_age_seconds,'worker':a.worker or None,
      'binding':RUC_BINDING,'customDomain':a.custom_domain or None,'zoneIdConfigured':bool(a.zone_id),
      'apply':a.apply,'costApproved':truth('MID_RUC_COST_APPROVED'),
      'publicDomainApproved':truth('MID_RUC_PUBLIC_DOMAIN_APPROVED'),
      'bootstrapPermissions':['Workers R2 Storage Write','Workers Scripts Read (only if --worker is supplied)'],
      'hourlyPublisherPermission':'Workers R2 Storage Bucket Item Write scoped to this bucket'
    }
    print(json.dumps({'plan':plan},ensure_ascii=False,indent=2))
    if not a.apply:
        print('DRY RUN: no Cloudflare resource was created or modified.')
        return 0
    if not truth('MID_RUC_COST_APPROVED'):
        raise SystemExit('REFUSED: --apply requires MID_RUC_COST_APPROVED=true after explicit user approval of R2 subscription/overage risk.')
    if not account or not token:
        raise SystemExit('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for --apply.')

    exists=bucket_exists(account,a.bucket,token)
    if not exists:
        body={'name':a.bucket,'storageClass':'Standard'}
        if a.location:body['locationHint']=a.location
        request('POST',f'{API}/accounts/{account}/r2/buckets',token,body)
        print(f'Created Standard R2 bucket: {a.bucket}')
    else:
        print(f'R2 bucket already exists: {a.bucket}')

    # MID reads through a private Worker binding; r2.dev is never required. Force the
    # managed public development domain off so the bucket cannot become public by accident.
    request('PUT',f'{API}/accounts/{account}/r2/buckets/{a.bucket}/domains/managed',token,{'enabled':False})
    print('Verified private-by-default R2 access: r2.dev disabled.')

    # Secondary leak guard. The publisher itself keeps four complete runs and cleans
    # orphan prefixes before/after publication; this lifecycle catches abandoned uploads
    # if the publishing job is interrupted before its own cleanup can run.
    current=request('GET',f'{API}/accounts/{account}/r2/buckets/{a.bucket}/lifecycle',token) or {}
    desired=merged_lifecycle(current,a.orphan_max_age_seconds)
    if desired!=current:
        request('PUT',f'{API}/accounts/{account}/r2/buckets/{a.bucket}/lifecycle',token,desired)
        print(f'Applied orphan-run lifecycle: runs/ expires after {a.orphan_max_age_seconds}s.')
    else:
        print('RUC orphan-run lifecycle already configured.')

    binding='not-checked'
    if a.worker:
        settings=request('GET',f'{API}/accounts/{account}/workers/scripts/{a.worker}/settings',token) or {}
        binding=binding_state(settings,a.bucket)
        if binding=='configured':
            print(f'Worker binding verified: {RUC_BINDING} -> {a.bucket}')
        elif binding=='missing':
            print(f'MANUAL GATE: Worker {a.worker} still needs the one-time R2 binding {RUC_BINDING} -> {a.bucket}.')
            print('The bootstrap will not rewrite the full Worker binding list because existing secret bindings cannot be losslessly reconstructed from read-only settings metadata.')
        else:
            raise SystemExit(f'REFUSED: existing Worker binding {RUC_BINDING} conflicts with the MID RUC contract ({binding}).')

    if a.custom_domain:
        if not truth('MID_RUC_PUBLIC_DOMAIN_APPROVED'):
            raise SystemExit('Bucket is ready, but custom-domain attachment was REFUSED: set MID_RUC_PUBLIC_DOMAIN_APPROVED=true only after explicit approval that this exposes bucket objects publicly through the domain.')
        if not a.zone_id:raise SystemExit('CLOUDFLARE_ZONE_ID required for custom-domain attachment.')
        body={'domain':a.custom_domain,'enabled':True,'zoneId':a.zone_id}
        try:
            request('POST',f'{API}/accounts/{account}/r2/buckets/{a.bucket}/domains/custom',token,body)
            print(f'Attached R2 custom domain: {a.custom_domain}')
        except RuntimeError as e:
            if 'already' in str(e).lower() or 'exists' in str(e).lower():print(f'Custom domain appears already attached: {a.custom_domain}')
            else:raise
        request('PUT',f'{API}/accounts/{account}/r2/buckets/{a.bucket}/domains/custom/{a.custom_domain}',token,{'enabled':True,'minTLS':'1.2'})
        print('Custom-domain TLS minimum set to 1.2.')
    else:
        print('No custom domain requested; MID remains on the private R2 Worker binding path.')

    print(json.dumps({'complete':True,'bucket':a.bucket,'bindingState':binding,'publicR2Dev':False},ensure_ascii=False))
    return 0
if __name__=='__main__':raise SystemExit(main())
