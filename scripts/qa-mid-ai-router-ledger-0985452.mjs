#!/usr/bin/env node
/** MID AI Router local durable-ledger QA. No network, no credentials. */
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,chmod,lstat,readdir,readFile,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {makeMidAiLocalDurableClaim} from './mid-ai-router-ledger.mjs';

const root=await mkdtemp(join(tmpdir(),'mid-ai-claim-'));
const plan={
 status:'PLAN_ONLY',provider:'groq',model:'openai/gpt-oss-20b',
 requestId:'mid-ledger-0001',expectedStableSha:'a'.repeat(40),
 taskFingerprint:'b'.repeat(64),proofCheckedAt:'2026-11-09T09:00:00.000Z'
};
let scenarios=0;
const test=async(name,fn)=>{await fn();scenarios++;};
const blocked=async(fn,reason)=>assert.rejects(fn,err=>err?.reason===reason);
const claim=(p=plan,dir=root)=>makeMidAiLocalDurableClaim({directory:dir,plan:p});
const call=(fn,p=plan)=>fn(p.requestId,p.provider,p.model);
try {
 await test('first reservation persists',async()=>{assert.equal(await call(claim()),true);});
 await test('same runner denies a retry',async()=>{assert.equal(await call(claim()),false);});
 await test('new ledger instance still denies retry',async()=>{assert.equal(await call(claim({...plan})),false);});
 await test('different provider cannot reissue same request ID',async()=>{
   const p={...plan,provider:'gemini',model:'gemini-2.5-flash'};
   assert.equal(await call(claim(p),p),false);
 });
 await test('different request can be reserved exactly once',async()=>{
   const p={...plan,requestId:'mid-ledger-0002'};
   assert.equal(await call(claim(p),p),true);
 });
 await test('24 concurrent callers yield exactly one exclusive success',async()=>{
   const p={...plan,requestId:'mid-ledger-race'};
   const results=await Promise.all(Array.from({length:24},()=>call(claim(p),p)));
   assert.equal(results.filter(Boolean).length,1);
   assert.equal(results.filter(x=>x===false).length,23);
 });
 await test('different plan args fail before filesystem mutation',async()=>{
   await blocked(()=>claim()('different-id','groq',plan.model),'CLAIM_PLAN_MISMATCH');
 });
 await test('malicious request IDs fail plan validation',async()=>{
   assert.throws(()=>claim({...plan,requestId:'../../secrets'}),{reason:'INVALID_LEDGER_PLAN'});
 });
 await test('relative directory is forbidden',async()=>{
   assert.throws(()=>claim(plan,'./relative'),{reason:'LEDGER_ABSOLUTE_DIRECTORY_REQUIRED'});
 });
 await test('directory ownership/mode must remain private',async()=>{
   const dir=join(root,'insecure');await mkdir(dir,{mode:0o700});await chmod(dir,0o755);
   const p={...plan,requestId:'mid-ledger-mode1'};
   await blocked(()=>call(claim(p,dir),p),'UNSAFE_LEDGER_DIRECTORY');
   await chmod(dir,0o700);
 });
 await test('symlink directory is forbidden',async()=>{
   const dir=join(root,'linked');await symlink(root,dir);
   const p={...plan,requestId:'mid-ledger-link1'};
   await blocked(()=>call(claim(p,dir),p),'UNSAFE_LEDGER_DIRECTORY');
 });
 await test('nonexistent directory cannot be silently provisioned',async()=>{
   const p={...plan,requestId:'mid-ledger-none1'};
   await blocked(()=>call(claim(p,join(root,'not-created')),p),'LEDGER_DIRECTORY_UNAVAILABLE');
 });
 await test('persisted record never contains prompt, key or secret',async()=>{
   const items=(await readdir(root)).filter(x=>x.endsWith('.json'));
   assert.equal(items.length,3);
   const record=JSON.parse(await readFile(join(root,items[0]),'utf8'));
   assert.equal(record.schema,'mid-ai-router-claim.v1');
   assert.equal(record.expectedStableSha,plan.expectedStableSha);
   for(const x of ['prompt','credential','authorization','password','secret','userId'])
     assert.equal(JSON.stringify(record).includes(x),false);
 });
 await test('pre-existing truncated claim never gets reset or retried',async()=>{
   const p={...plan,requestId:'mid-ledger-crash'};
   const filename=createHash('sha256').update('mid-ai-router-request-v1\0'+p.requestId).digest('hex')+'.json';
   await writeFile(join(root,filename),'',{flag:'wx',mode:0o600});
   assert.equal(await call(claim(p),p),false);
   assert.equal((await lstat(join(root,filename))).size,0);
 });
 await test('fresh Node process independently denies duplicate ID',async()=>{
   const location=fileURLToPath(new URL('./mid-ai-router-ledger.mjs',import.meta.url));
   const code='import {makeMidAiLocalDurableClaim} from '+JSON.stringify(location)+';\n'+
     'const fn=makeMidAiLocalDurableClaim({directory:'+JSON.stringify(root)+',plan:'+JSON.stringify(plan)+'});\n'+
     'const ok=await fn('+JSON.stringify(plan.requestId)+','+JSON.stringify(plan.provider)+','+JSON.stringify(plan.model)+');\n'+
     'if(ok!==false) process.exit(5);\n';
   const child=spawnSync(process.execPath,['--input-type=module','-e',code],{
     encoding:'utf8',timeout:10000,env:{PATH:process.env.PATH||''},stdio:['ignore','pipe','pipe']
   });
   assert.equal(child.error,undefined);
   assert.equal(child.status,0,child.stderr);
   assert.equal(child.stdout,'');
 });
 console.log('MID AI Router local ledger QA OK; scenarios='+scenarios+'; no network or secrets.');
} finally {
 await rm(root,{recursive:true,force:true});
}
