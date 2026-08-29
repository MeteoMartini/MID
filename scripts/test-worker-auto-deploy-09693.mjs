import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';import http from 'node:http';
const root=new URL('../',import.meta.url),workflow=await readFile(new URL('ci/github/workflows/install-mid.yml',root),'utf8'),mirror=await readFile(new URL('.github/workflows/install-mid.yml',root),'utf8'),prepare=await readFile(new URL('tools/cloudflare/prepare_worker_deploy.mjs',root),'utf8');
assert.equal(workflow,mirror,'Kanonischer und aktiver install-mid-Workflow müssen bytegleich sein.');
for(const token of [
 'deploy_worker:','worker_changed: ${{ steps.worker_diff.outputs.changed }}','MID_WORKER_DEPLOY_ENABLED','MID_CLOUDFLARE_WORKER_NAME','CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID',
 'cloudflare/wrangler-action@ebbaa1584979971c8614a24965b4405ff95890e0 # v4.0.0',"wranglerVersion: '4.125.0'",'--strict','--keep-vars','--experimental-provision=false','--experimental-auto-create=false',
 '@0%','@100%','Cloudflare-Versionsoverride','check_worker_health.mjs','Automatischer MID-Rollback','needs.deploy_worker.result == \'success\''
])assert.ok(workflow.includes(token),`Auto-Worker-Deploy-Vertrag fehlt: ${token}`);
for(const token of ['keep_vars:true','no_bundle:true','compatibility_date','kv_namespaces','r2_buckets','MID_RUC_BINDING_AUTO_APPROVED','Unbekannte/noch nicht sicher abgebildete Worker-Bindings','normalizePlacement','versions'])assert.ok(prepare.includes(token),`Dynamische Wrangler-Konfiguration fehlt: ${token}`);
assert.ok(!workflow.includes('wrangler deploy\n'),'Direkter wrangler deploy darf den 0%-Smoke-Vertrag nicht umgehen.');

const temp=await mkdtemp(path.join(os.tmpdir(),'mid-worker-deploy-'));
try{
 const oldFile=path.join(temp,'old.js'),newFile=path.join(temp,'new.js'),outFile=path.join(temp,'out.txt');
 await writeFile(oldFile,"const WORKER_VERSION='1.0.0';\nexport default {fetch(){return 1}}\n");
 await writeFile(newFile,"const WORKER_VERSION='1.0.1';\nexport default {fetch(){return 1}}\n");
 let result=await run(process.execPath,['tools/cloudflare/worker_semantic_diff.mjs',oldFile,newFile],{GITHUB_OUTPUT:outFile});assert.equal(result.code,0);assert.match(await readFile(outFile,'utf8'),/changed=false/);
 await writeFile(newFile,"const WORKER_VERSION='1.0.1';\nexport default {fetch(){return 2}}\n");await writeFile(outFile,'');
 result=await run(process.execPath,['tools/cloudflare/worker_semantic_diff.mjs',oldFile,newFile],{GITHUB_OUTPUT:outFile});assert.equal(result.code,0);assert.match(await readFile(outFile,'utf8'),/changed=true/);
 const wrOut=path.join(temp,'wrangler.jsonl'),ghOut=path.join(temp,'gh.txt'),vid='11111111-2222-3333-4444-555555555555';await writeFile(wrOut,JSON.stringify({type:'version-upload',version_id:vid})+'\n');
 result=await run(process.execPath,['tools/cloudflare/parse_wrangler_output.mjs',wrOut],{GITHUB_OUTPUT:ghOut});assert.equal(result.code,0);assert.match(await readFile(ghOut,'utf8'),new RegExp(vid));

 const originalFetch=globalThis.fetch,argv=process.argv,env={...process.env};
 const configPath=path.join(temp,'wrangler.json'),metaPath=path.join(temp,'meta.json');
 process.env.CLOUDFLARE_ACCOUNT_ID='abc';process.env.CLOUDFLARE_API_TOKEN='secret-token';process.env.MID_CLOUDFLARE_WORKER_NAME='mid-worker';process.env.MID_RUC_R2_BUCKET='mid-ruc-data';process.env.MID_RUC_BINDING_AUTO_APPROVED='true';delete process.env.GITHUB_OUTPUT;
 process.argv=[process.execPath,'prepare_worker_deploy.mjs',configPath,metaPath];
 globalThis.fetch=async url=>new Response(JSON.stringify({success:true,result:String(url).endsWith('/settings')?{compatibility_date:'2026-08-01',compatibility_flags:['nodejs_compat'],placement:{},bindings:[{name:'MID_PUSH_SUBSCRIPTIONS',type:'kv_namespace',namespace_id:'0123456789abcdef0123456789abcdef'},{name:'SECRET',type:'secret_text',text:'must-not-leak'},{name:'VISIBLE',type:'plain_text',text:'must-not-leak'}]}:{deployments:[{id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',versions:[{version_id:'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',percentage:100}]}]}}),{status:200,headers:{'content-type':'application/json'}});
 await import(`../tools/cloudflare/prepare_worker_deploy.mjs?test=${Date.now()}`);
 const config=JSON.parse(await readFile(configPath,'utf8')),meta=JSON.parse(await readFile(metaPath,'utf8')),serialized=JSON.stringify({config,meta});
 assert.equal(config.keep_vars,true);assert.equal(config.no_bundle,true);assert.equal('placement' in config,false,'Leeres Remote-Placement darf nicht als placement:{} an Wrangler gehen.');assert.equal(config.kv_namespaces[0].binding,'MID_PUSH_SUBSCRIPTIONS');assert.equal(config.r2_buckets[0].binding,'MID_DWD_RUC_DATA');assert.ok(!serialized.includes('must-not-leak'),'Plaintext-/Secretwerte dürfen nie in generierte Dateien gelangen.');
 globalThis.fetch=originalFetch;process.argv=argv;for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);

 const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json');const url=new URL(req.url,'http://localhost');if(url.searchParams.get('mode')==='ruc-health')res.end(JSON.stringify({configured:true,ready:true,fresh:true,version:'0.9.69.4'}));else res.end(JSON.stringify({ok:true,version:'0.9.69.4'}));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;result=await run(process.execPath,['tools/cloudflare/check_worker_health.mjs','--url',`http://127.0.0.1:${port}/`,'--expected-version','0.9.69.4','--worker','mid-worker','--version-id',vid,'--require-ruc-ready','--retries','1']);server.close();assert.equal(result.code,0,result.stderr);
}finally{await rm(temp,{recursive:true,force:true})}
console.log('Automatischer Worker-Deploy: 0%-Smoke, Promotion, Rollback, Remote-Binding-Spiegel und Health-Vertrag geprüft.');

function run(command,args,extraEnv={}){return new Promise(resolve=>{const child=spawn(command,args,{cwd:new URL('../',import.meta.url),env:{...process.env,...extraEnv},stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);child.on('close',code=>resolve({code,stdout,stderr}))})}
