import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root=new URL('../',import.meta.url);
const source=await readFile(new URL('tools/cloudflare/prepare_worker_deploy.mjs',root),'utf8');
for(const token of [
 "process.argv.slice(2)",
 "mid-wrangler-worker.json",
 "mid-worker-deploy-meta.json",
 "args.length!==2",
 "Legacy-Ausgabepfade sind ausschließlich",
 "legacyOutputMode"
])assert.ok(source.includes(token),`Legacy-Installer-Kompatibilität fehlt: ${token}`);

const legacyConfig=path.resolve(os.tmpdir(),'mid-wrangler-worker.json');
const legacyMeta=path.resolve(os.tmpdir(),'mid-worker-deploy-meta.json');
const scratch=await mkdtemp(path.join(os.tmpdir(),'mid-worker-legacy-contract-'));
const ghOut=path.join(scratch,'github-output.txt');
const originalFetch=globalThis.fetch,originalArgv=[...process.argv],env={...process.env};
try{
 await rm(legacyConfig,{force:true});await rm(legacyMeta,{force:true});await writeFile(ghOut,'');
 process.argv=[process.execPath,'tools/cloudflare/prepare_worker_deploy.mjs',legacyConfig,legacyMeta];
 process.env.CLOUDFLARE_ACCOUNT_ID='abc';process.env.CLOUDFLARE_API_TOKEN='secret-token';process.env.MID_CLOUDFLARE_WORKER_NAME='mid-worker';process.env.GITHUB_OUTPUT=ghOut;
 globalThis.fetch=async url=>new Response(JSON.stringify({success:true,result:String(url).endsWith('/settings')?{compatibility_date:'2026-08-01',bindings:[{name:'MID_PUSH_SUBSCRIPTIONS',type:'kv_namespace',namespace_id:'0123456789abcdef0123456789abcdef'}]}:{deployments:[{id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',versions:[{version_id:'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',percentage:100}]}]}}),{status:200,headers:{'content-type':'application/json'}});
 await import(`../tools/cloudflare/prepare_worker_deploy.mjs?legacy=${Date.now()}`);
 const config=JSON.parse(await readFile(legacyConfig,'utf8')),meta=JSON.parse(await readFile(legacyMeta,'utf8')),outputs=await readFile(ghOut,'utf8');
 assert.equal(config.name,'mid-worker');assert.equal(meta.workerName,'mid-worker');
 assert.match(outputs,new RegExp(`config_path=${legacyConfig.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`));
 assert.match(outputs,new RegExp(`meta_path=${legacyMeta.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`));
}finally{
 globalThis.fetch=originalFetch;process.argv=originalArgv;
 for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);
 await rm(legacyConfig,{force:true});await rm(legacyMeta,{force:true});await rm(scratch,{recursive:true,force:true});
}
console.log('Worker-Auto-Deploy Legacy-Installerpfad: sichere exakte /tmp-Kompatibilität und GITHUB_OUTPUT-Brücke geprüft.');
