import {appendFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

function required(name){const value=String(process.env[name]||'').trim();if(!value)throw new Error(`${name} fehlt`);return value}
function truthy(name){return /^(1|true|yes|on)$/i.test(String(process.env[name]||'').trim())}
async function cfGet(accountId,token,workerName,suffix){
 const url=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}${suffix}`;
 const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||payload?.success===false)throw new Error(`Cloudflare ${suffix} HTTP ${response.status}: ${(payload?.errors||[]).map(x=>x?.message).filter(Boolean).join('; ')||'unbekannter Fehler'}`);
 return payload?.result??payload;
}
function mapBindings(bindings){
 const config={};const summary=[];const unsupported=[];
 for(const binding of Array.isArray(bindings)?bindings:[]){
  const name=String(binding?.name||''),type=String(binding?.type||'');if(!name||!type)continue;
  summary.push({name,type});
  if(type==='plain_text'||type==='secret_text'||type==='json')continue;
  if(type==='kv_namespace'){
   const id=String(binding.namespace_id||'');if(!id){unsupported.push(`${name}:${type}:namespace_id fehlt`);continue}
   (config.kv_namespaces??=[]).push({binding:name,id});continue;
  }
  if(type==='r2_bucket'){
   const bucket_name=String(binding.bucket_name||'');if(!bucket_name){unsupported.push(`${name}:${type}:bucket_name fehlt`);continue}
   const row={binding:name,bucket_name};if(binding.jurisdiction)row.jurisdiction=binding.jurisdiction;(config.r2_buckets??=[]).push(row);continue;
  }
  if(type==='d1'){
   const database_id=String(binding.database_id||binding.id||'');if(!database_id){unsupported.push(`${name}:${type}:database_id fehlt`);continue}
   (config.d1_databases??=[]).push({binding:name,database_id});continue;
  }
  if(type==='service'){
   const service=String(binding.service||'');if(!service){unsupported.push(`${name}:${type}:service fehlt`);continue}
   const row={binding:name,service};if(binding.environment)row.environment=binding.environment;if(binding.entrypoint)row.entrypoint=binding.entrypoint;(config.services??=[]).push(row);continue;
  }
  if(type==='analytics_engine'){
   const dataset=String(binding.dataset||'');if(!dataset){unsupported.push(`${name}:${type}:dataset fehlt`);continue}
   (config.analytics_engine_datasets??=[]).push({binding:name,dataset});continue;
  }
  if(type==='vectorize'){
   const index_name=String(binding.index_name||'');if(!index_name){unsupported.push(`${name}:${type}:index_name fehlt`);continue}
   (config.vectorize??=[]).push({binding:name,index_name});continue;
  }
  if(type==='hyperdrive'){
   const id=String(binding.id||'');if(!id){unsupported.push(`${name}:${type}:id fehlt`);continue}
   (config.hyperdrive??=[]).push({binding:name,id});continue;
  }
  unsupported.push(`${name}:${type}`);
 }
 if(unsupported.length)throw new Error(`Unbekannte/noch nicht sicher abgebildete Worker-Bindings: ${unsupported.join(', ')}. Deploy wird fail-closed abgebrochen.`);
 return{config,summary};
}
function normalizePlacement(placement){
 if(!placement||typeof placement!=='object'||Array.isArray(placement))return null;
 const mode=String(placement.mode||'').trim(),region=String(placement.region||'').trim(),host=String(placement.host||'').trim(),hostname=String(placement.hostname||'').trim();
 const targets=[['region',region],['host',host],['hostname',hostname]].filter(([,value])=>value);
 if(targets.length>1)throw new Error('Remote Worker-Placement enthält mehrere konkurrierende Zielhinweise; Deploy wird fail-closed abgebrochen.');
 if(mode&&mode!=='smart'&&mode!=='targeted')throw new Error(`Unbekannter Remote Worker-Placement-Modus: ${mode}`);
 if(mode==='smart'){
  if(targets.length)throw new Error('Remote Worker-Placement kombiniert Smart Placement mit einem Zielhinweis; Deploy wird fail-closed abgebrochen.');
  return{mode:'smart'};
 }
 if(targets.length===1){const [key,value]=targets[0];return{[key]:value}}
 if(mode==='targeted')throw new Error('Remote Worker-Placement meldet targeted ohne region/host/hostname; Deploy wird fail-closed abgebrochen.');
 return null;
}
function activeVersion(deployments){
 const rows=Array.isArray(deployments?.deployments)?deployments.deployments:Array.isArray(deployments)?deployments:[];
 const latest=rows[0];if(!latest)throw new Error('Kein aktives Cloudflare-Worker-Deployment gefunden');
 const versions=Array.isArray(latest.versions)?latest.versions:[];
 if(versions.length!==1||Math.abs(Number(versions[0]?.percentage)-100)>0.001)throw new Error('Aktives Worker-Deployment ist nicht eindeutig 100 % auf genau einer Version; automatischer Rollback wäre mehrdeutig.');
 const versionId=String(versions[0]?.version_id||'');if(!/^[0-9a-f-]{20,}$/i.test(versionId))throw new Error('Aktive Worker-Version konnte nicht sicher bestimmt werden');
 return{deploymentId:String(latest.id||''),versionId};
}

const accountId=required('CLOUDFLARE_ACCOUNT_ID'),token=required('CLOUDFLARE_API_TOKEN'),workerName=required('MID_CLOUDFLARE_WORKER_NAME');
const out=process.argv[2]||'/tmp/mid-wrangler-worker.json',metaOut=process.argv[3]||'/tmp/mid-worker-deploy-meta.json';
const [settings,deployments]=await Promise.all([
 cfGet(accountId,token,workerName,'/settings'),
 cfGet(accountId,token,workerName,'/deployments')
]);
const compatibilityDate=String(settings?.compatibility_date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(compatibilityDate))throw new Error('Remote compatibility_date fehlt oder ist ungültig; kein geratenes Datum wird eingesetzt.');
const mapped=mapBindings(settings?.bindings),current=activeVersion(deployments),placement=normalizePlacement(settings?.placement);
const rucBucket=String(process.env.MID_RUC_R2_BUCKET||'').trim(),rucBinding='MID_DWD_RUC_DATA',r2=mapped.config.r2_buckets??[],existing=r2.find(row=>row.binding===rucBinding);
if(existing&&rucBucket&&existing.bucket_name!==rucBucket)throw new Error(`${rucBinding} zeigt remote auf ${existing.bucket_name}; konfigurierte MID_RUC_R2_BUCKET=${rucBucket}. Automatischer Deploy wird abgebrochen.`);
if(!existing&&rucBucket&&truthy('MID_RUC_BINDING_AUTO_APPROVED')){
 (mapped.config.r2_buckets??=[]).push({binding:rucBinding,bucket_name:rucBucket});mapped.summary.push({name:rucBinding,type:'r2_bucket',planned:true});
}
const config={
 name:workerName,
 main:'worker/metar-proxy.js',
 compatibility_date:compatibilityDate,
 ...(Array.isArray(settings?.compatibility_flags)&&settings.compatibility_flags.length?{compatibility_flags:settings.compatibility_flags}:{}),
 keep_vars:true,
 no_bundle:true,
 minify:false,
 send_metrics:false,
 ...(placement?{placement}:{}),
 ...(settings?.limits&&typeof settings.limits==='object'?{limits:settings.limits}:{}),
 ...mapped.config
};
await mkdir(path.dirname(out),{recursive:true});await writeFile(out,JSON.stringify(config,null,2)+'\n');
const meta={schema:'mid.cloudflare.worker-deploy.v1',workerName,previousVersionId:current.versionId,previousDeploymentId:current.deploymentId,compatibilityDate,bindingSummary:mapped.summary.map(({name,type,planned})=>({name,type,planned:Boolean(planned)})),rucBindingPresent:Boolean((config.r2_buckets||[]).some(row=>row.binding===rucBinding))};
await writeFile(metaOut,JSON.stringify(meta,null,2)+'\n');
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`previous_version_id=${current.versionId}\nworker_name=${workerName}\n`);
console.log(`Worker-Konfiguration sicher vorbereitet: ${workerName}; vorherige Version ${current.versionId}; ${meta.bindingSummary.length} Bindings (Werte/Secrets nicht ausgegeben).`);
