#!/usr/bin/env python3
from __future__ import annotations
import contextlib,importlib.util,io,os,subprocess,sys
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/'tools/ruc/cloudflare_r2_bootstrap.py'
spec=importlib.util.spec_from_file_location('mid_ruc_cf_bootstrap',SCRIPT)
mod=importlib.util.module_from_spec(spec);assert spec.loader;spec.loader.exec_module(mod)


def main():
    existing={'rules':[{'id':'unrelated','enabled':True,'conditions':{'prefix':'other/'}}]}
    merged=mod.merged_lifecycle(existing,172800)
    assert merged['rules'][0]['id']=='unrelated'
    ours=[row for row in merged['rules'] if row['id']==mod.LIFECYCLE_RULE_ID]
    assert len(ours)==1 and ours[0]['conditions']['prefix']=='runs/'
    assert ours[0]['deleteObjectsTransition']['condition']=={'type':'Age','maxAge':172800}
    merged2=mod.merged_lifecycle(merged,21600)
    ours2=[row for row in merged2['rules'] if row['id']==mod.LIFECYCLE_RULE_ID]
    assert len(ours2)==1 and ours2[0]['deleteObjectsTransition']['condition']['maxAge']==21600

    assert mod.binding_state({},'mid-ruc-data')=='missing'
    assert mod.binding_state({'bindings':[{'name':mod.RUC_BINDING,'type':'r2_bucket','bucket_name':'mid-ruc-data'}]},'mid-ruc-data')=='configured'
    assert mod.binding_state({'bindings':[{'name':mod.RUC_BINDING,'type':'r2_bucket','bucket_name':'wrong'}]},'mid-ruc-data').startswith('conflict:bucket=')
    assert mod.binding_state({'bindings':[{'name':mod.RUC_BINDING,'type':'secret_text'}]},'mid-ruc-data').startswith('conflict:type=')

    denied=subprocess.run([sys.executable,str(SCRIPT),'--apply'],cwd=ROOT,env={k:v for k,v in os.environ.items() if k not in {'MID_RUC_COST_APPROVED','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_TOKEN'}},text=True,capture_output=True)
    assert denied.returncode!=0 and 'REFUSED: --apply requires MID_RUC_COST_APPROVED=true' in (denied.stdout+denied.stderr)

    calls=[]
    def fake_request(method,url,token,body=None):
        calls.append((method,url,body))
        if url.endswith('/lifecycle') and method=='GET':return existing
        if '/workers/scripts/' in url and url.endswith('/settings') and method=='GET':
            return {'bindings':[{'name':mod.RUC_BINDING,'type':'r2_bucket','bucket_name':'mid-ruc-data'}]}
        return {'ok':True}
    fake_env={
      'MID_RUC_COST_APPROVED':'true','CLOUDFLARE_ACCOUNT_ID':'acct','CLOUDFLARE_API_TOKEN':'token',
      'MID_RUC_R2_BUCKET':'mid-ruc-data','MID_CLOUDFLARE_WORKER_NAME':'mid-worker'
    }
    old_argv=sys.argv[:]
    try:
        sys.argv=[str(SCRIPT),'--apply']
        with patch.dict(os.environ,fake_env,clear=False),patch.object(mod,'bucket_exists',return_value=False),patch.object(mod,'request',side_effect=fake_request):
            buf=io.StringIO()
            with contextlib.redirect_stdout(buf):rc=mod.main()
        assert rc==0
    finally:sys.argv=old_argv
    assert any(method=='POST' and url.endswith('/r2/buckets') for method,url,_ in calls),calls
    assert any(method=='PUT' and url.endswith('/domains/managed') and body=={'enabled':False} for method,url,body in calls),calls
    assert any(method=='PUT' and url.endswith('/lifecycle') for method,url,_ in calls),calls
    assert any(method=='GET' and '/workers/scripts/mid-worker/settings' in url for method,url,_ in calls),calls
    assert not any(method=='PATCH' and '/workers/scripts/' in url for method,url,_ in calls),'bootstrap must not rewrite full Worker bindings'
    print('RUC Cloudflare bootstrap contract OK')

if __name__=='__main__':main()

source=Path(__file__).with_name('cloudflare_r2_bootstrap.py').read_text(encoding='utf-8')
assert "MID_RUC_R2_LOCATION','weur" in source
assert "a.location=str(a.location or '').strip().lower()" in source
