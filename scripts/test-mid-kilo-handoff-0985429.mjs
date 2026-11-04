#!/usr/bin/env node
/** MID Kilo handoff contract tests: local bare Git origin + fake gh only.
 * Never calls GitHub or mutates the actual MID repository. */
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const root=mkdtempSync(join(tmpdir(),'mid-kilo-handoff-'));
const remote=join(root,'remote.git'),work=join(root,'work'),bin=join(root,'bin');
const helper=resolve('scripts/mid-kilo-handoff.mjs');
const mock=resolve('scripts/fixtures/mock-mid-kilo-gh.mjs');
const env={...process.env,PATH:bin+':'+process.env.PATH};
function exec(cmd,...args){return execFileSync(cmd,args,{cwd:work,env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
function request(label,expectedOk=true,extraEnv={}){
 const r=spawnSync(process.execPath,['scripts/mid-kilo-handoff.mjs','--title',label,'--dry-run'],{cwd:work,env:{...env,...extraEnv},encoding:'utf8'});
 assert.equal(r.status===0,expectedOk,label+': '+r.stderr);return r;
}
function expectFailure(label,reason){assert.match(request(label,false).stderr,reason);}
try{
 mkdirSync(work);mkdirSync(bin);
 execFileSync('git',['init','--bare','-q',remote]);execFileSync('git',['init','-q',work]);
 exec('git','config','user.name','MID QA');exec('git','config','user.email','qa@example.invalid');
 exec('git','remote','add','origin',remote);
 mkdirSync(join(work,'scripts'));mkdirSync(join(work,'src'));
 copyFileSync(helper,join(work,'scripts','mid-kilo-handoff.mjs'));
 writeFileSync(join(work,'src','App.tsx'),'export const ok = true;\n');
 exec('git','add','.');exec('git','commit','-qm','initial stable');exec('git','branch','-M','main');
 exec('git','push','-q','origin','HEAD:refs/heads/main');exec('git','push','-q','origin','HEAD:refs/heads/mid-stable');
 exec('git','fetch','-q','origin','refs/heads/mid-stable:refs/remotes/origin/mid-stable');
 exec('git','checkout','-qb','kilo/local-work');
 writeFileSync(join(work,'src','App.tsx'),'export const ok = false;\n');
 exec('git','add','.');exec('git','commit','-qm','safe feature');
 copyFileSync(mock,join(bin,'gh'));chmodSync(join(bin,'gh'),0o755);
 const dry=JSON.parse(request('dry run').stdout);
 assert.equal(dry.status,'DRY_RUN_ONLY');assert.deepEqual(dry.files.map(x=>x.path),['src/App.tsx']);
 let result=spawnSync(process.execPath,['scripts/mid-kilo-handoff.mjs','--title','mock issue'],{cwd:work,env,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const handoff=JSON.parse(result.stdout);assert.equal(handoff.status,'HANDOFF_SUBMITTED');
 assert.match(handoff.candidate_sha,/^[a-f0-9]{40}$/);
 result=spawnSync(process.execPath,['scripts/mid-kilo-handoff.mjs','--title','no permissions'],{cwd:work,env:{...env,FAKE_GH_DENY:'1'},encoding:'utf8'});
 assert.notEqual(result.status,0,'API permission denial must fail closed');
 writeFileSync(join(work,'src','App.tsx'),'\n',{flag:'a'});
 expectFailure('dirty tree',/dirty worktree/);exec('git','checkout','--','src/App.tsx');
 mkdirSync(join(work,'.github','workflows'),{recursive:true});
 writeFileSync(join(work,'.github','workflows','bad.yml'),'name: bad\n');
 exec('git','add','.github');exec('git','commit','-qm','forbidden path');
 expectFailure('forbidden path',/disallowed change/);exec('git','reset','--hard','HEAD~1');
 writeFileSync(join(work,'src','bad.json'),Buffer.from([0,255]));
 exec('git','add','src/bad.json');exec('git','commit','-qm','binary data');
 expectFailure('binary',/binary NUL/);exec('git','reset','--hard','HEAD~1');
 exec('git','checkout','-qb','new-stable','main');
 writeFileSync(join(work,'src','new.ts'),'export {}\n');
 exec('git','add','src/new.ts');exec('git','commit','-qm','advance stable');
 exec('git','push','-q','origin','HEAD:refs/heads/main');
 exec('git','push','-q','origin','HEAD:refs/heads/mid-stable');
 exec('git','checkout','-q','kilo/local-work');
 expectFailure('stale base',/HEAD not based on current stable/);
 console.log('MID Kilo transport: 7 isolated positive/negative checks passed; no external API calls.');
}finally{rmSync(root,{recursive:true,force:true});}
