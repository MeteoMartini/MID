// Only for an owner-approved, released GitHub workflow. No upload, no promotion.
import {pathToFileURL} from 'node:url';
const worker='mid-logicc-write';
const oldId='c92c57f2-e52e-48b0-a790-0a47a8e43566';
const newId='c23678a6-04ab-4396-af80-0fbca0d867a9';
const oldDeployment='39d373f2-f1c5-4e53-b64d-31e8c05dbe4c';
const accidental='0da4bc08-ce80-4457-9805-5bf9fce5434b';
const hashes=['d08678abe4f70531080db2065e966916279098543c9a2dc7668cb886599c3135','2d8544bc4298f3445884e46151f41176b87e80348c9ff9ce439e215bf1cdacd4'];
const single=id=>[{version_id:id,percentage:100}];
const staged=[{version_id:oldId,percentage:100},{version_id:newId,percentage:0}];
const names=['MID_GITHUB_APP_PRIVATE_KEY','MID_WRITE_GATEWAY_KEY'];
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
class SafeError extends Error {}
function requireOk(ok,message){if(!ok)throw new SafeError(message);}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function matches(d,versions){return Array.isArray(d?.versions)&&d.versions.length===versions.length&&versions.every(v=>d.versions.some(x=>x.version_id===v.version_id&&x.percentage===v.percentage));}
function verifySettings(s,version=false){
  requireOk(s?.compatibility_date==='2026-11-24'&&s.usage_model==='standard'&&
    ((version&&!Object.hasOwn(s,'compatibility_flags'))||equal(s.compatibility_flags,[]))&&
    Array.isArray(s.bindings)&&s.bindings.length===2&&s.bindings.every(b=>b?.type==='secret_text')&&
    equal(s.bindings.map(b=>b.name).sort(),names),'Settings or bindings drift');
}
async function verifyVersion(v,id,index){
  verifySettings(v,true);
  const m=v.modules?.[0];
  requireOk(v.id===id&&v.main_module==='worker.mjs'&&v.modules?.length===1&&m?.name==='worker.mjs'&&m.content_type==='application/javascript+module'&&typeof m.content_base64==='string','Missing version provenance');
  const b=Uint8Array.from(atob(m.content_base64),c=>c.charCodeAt(0));
  requireOk(b.length===[9119,9545][index]&&btoa(String.fromCharCode(...b))===m.content_base64,'Module length or encoding drift');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
  requireOk(digest===hashes[index],'Version source hash mismatch');
}
export async function stage({env=process.env,fetcher=globalThis.fetch}={}){
  const {LOGICC_CF_ACCOUNT_ID:account,LOGICC_CF_VERSION_TOKEN:token,GH_TOKEN:gh,GITHUB_SHA:sha,LOGICC_TRAFFIC_ACTION:action}=env;
  requireOk(/^[a-f0-9]{32}$/i.test(account??'')&&token&&gh&&/^[a-f0-9]{40}$/.test(sha??'')&&['stage','rollback'].includes(action),'Protected workflow context missing');
  const api='https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/';
  const script='scripts/'+worker;
  const versionPath='workers/'+worker+'/versions/';
  async function cf(path,body){
    const method=body===undefined?'GET':'POST';
    const r=await fetcher(api+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(25000)});
    requireOk(r.ok,method+' Cloudflare HTTP '+r.status);
    const j=await r.json();requireOk(j.success===true&&j.result,'Cloudflare API failure');return j.result;
  }
  async function refs(){for(const branch of ['main','mid-stable']){
    const r=await fetcher('https://api.github.com/repos/MeteoMartini/MID/git/ref/heads/'+branch,{headers:{Authorization:'Bearer '+gh,Accept:'application/vnd.github+json'},redirect:'error',signal:AbortSignal.timeout(15000)});
    requireOk(r.ok,'GitHub ref read failed');const j=await r.json();requireOk(j.ref==='refs/heads/'+branch&&j.object?.type==='commit'&&j.object.sha===sha,'Released SHA drift');
  }}
  async function current(){const r=await cf(script+'/deployments');const d=r.deployments?.[0];requireOk(uuid.test(d?.id??''),'Active deployment missing');return d;}
  async function settings(){verifySettings(await cf(script+'/settings'));const s=await cf(script+'/subdomain');requireOk(s.enabled===true&&s.previews_enabled===false,'Subdomain configuration drift');}
  await refs();await settings();
  const before=await current();
  const target=action==='stage'?staged:single(oldId);
  await verifyVersion(await cf(versionPath+oldId+'?include=modules'),oldId,0);
  await verifyVersion(await cf(versionPath+newId+'?include=modules'),newId,1);
  if(matches(before,target))return {status:'already_target',deployment_id:before.id,versions:target};
  requireOk((before.id===accidental&&matches(before,single(newId)))||
    (before.id===oldDeployment&&matches(before,single(oldId)))||
    (action==='rollback'&&matches(before,staged))||
    (action==='stage'&&matches(before,single(oldId))),'Unexpected allocation; reconcile manually');
  await settings();await refs();
  const last=await current();requireOk(last.id===before.id&&matches(last,before.versions),'Concurrent deployment drift');
  // At most one mutation; no automatic retry even if the response is lost.
  const posted=await cf(script+'/deployments',{strategy:'percentage',versions:target,annotations:{'workers/message':'MID Logicc '+action+' '+sha}});
  requireOk(uuid.test(posted.id??'')&&posted.id!==before.id&&matches(posted,target),'Deployment response ambiguous; reconcile, do not retry');
  const after=await current();requireOk(after.id===posted.id&&matches(after,target),'Deployment readback mismatch; reconcile, do not retry');
  await settings();await refs();
  return {status:'verified_allocation',deployment_id:after.id,versions:target};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)stage().then(x=>console.log(JSON.stringify(x))).catch(e=>{
  if(e instanceof SafeError)console.error(e.message);
  console.error('Logicc allocation stopped. Read live deployment before any further action. No automatic retry.');
  process.exitCode=1;
});
