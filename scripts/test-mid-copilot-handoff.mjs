import assert from 'node:assert/strict';
import {validateTask,validateTrees,validateBytes,verifyIssue,blobHash,listIssues} from '../tools/handoff/copilot.mjs';
const sha=n=>String(n).repeat(40),bytes=Buffer.from('print("QA only")\n'),blob=blobHash(bytes);
const task={schema:1,task:'ap1b-p1-probe',base:sha(1),expectedTree:sha(2),paths:['tools/ruc/probe.py'],submitters:[{login:'MeteoMartini',id:75040651}]};
const entry={path:task.paths[0],mode:'100644',type:'blob',sha:blob};
function fixture(change=()=>{}){
 const issue={state:'open',title:'[MID-COPILOT-HANDOFF] '+task.task,user:task.submitters[0],body:JSON.stringify({schema:1,repository:'MeteoMartini/MID',task:task.task,base:task.base,tree:task.expectedTree,candidate:sha(3)})};
 const objects={
  'branches/main':{commit:{sha:sha(1)}},'branches/mid-stable':{commit:{sha:sha(1)}},
  ['git/commits/'+sha(3)]:{sha:sha(3),tree:{sha:sha(2)},parents:[{sha:sha(1)}]},
  ['git/commits/'+sha(1)]:{sha:sha(1),tree:{sha:sha(4)}},
  ['git/trees/'+sha(4)+'?recursive=1']:{tree:[],truncated:false},
  ['git/trees/'+sha(2)+'?recursive=1']:{tree:[structuredClone(entry)],truncated:false},
  ['git/blobs/'+blob]:{sha:blob,encoding:'base64',size:bytes.length,content:bytes.toString('base64')}
 };
 change(issue,objects);
 return ()=>verifyIssue(issue,task,p=>{assert.ok(objects[p],p);return objects[p];});
}
let cases=0;
function test(name,fn){fn();cases++;}
test('full verified receipt is never release approval',()=>{const r=fixture()();assert.equal(r.status,'TRANSPORT_VERIFIED');assert.equal(r.releaseAuthorized,false);assert.equal(r.qa,'NOT VERIFIED');});
for(const [name,change] of [
 ['forged identity',i=>{i.user={login:'MeteoMartini',id:9};}],
 ['wrong login',i=>{i.user={login:'attacker',id:75040651};}],
 ['closed issue',i=>{i.state='closed';}],
 ['PR masquerading as issue',i=>{i.pull_request={};}],
 ['wrong task',i=>{i.body=i.body.replace('"task":"ap1b-p1-probe"','"task":"other"');}],
 ['malformed JSON',i=>{i.body='not json';}],
 ['main/stable drift',(_,o)=>{o['branches/main'].commit.sha=sha(9);}],
 ['wrong parent',(_,o)=>{o['git/commits/'+sha(3)].parents=[{sha:sha(9)}];}],
 ['merge candidate',(_,o)=>{o['git/commits/'+sha(3)].parents.push({sha:sha(9)});}],
 ['wrong tree',(_,o)=>{o['git/commits/'+sha(3)].tree.sha=sha(9);}],
 ['truncated tree',(_,o)=>{o['git/trees/'+sha(2)+'?recursive=1'].truncated=true;}],
 ['extra workflow',(_,o)=>{o['git/trees/'+sha(2)+'?recursive=1'].tree.push({...entry,path:'.github/workflows/bad.yml'});}],
 ['symlink',(_,o)=>{o['git/trees/'+sha(2)+'?recursive=1'].tree[0].mode='120000';}],
 ['executable file',(_,o)=>{o['git/trees/'+sha(2)+'?recursive=1'].tree[0].mode='100755';}],
 ['duplicate path',(_,o)=>{o['git/trees/'+sha(2)+'?recursive=1'].tree.push(entry);}],
 ['tampered bytes',(_,o)=>{o['git/blobs/'+blob].content=Buffer.from('BAD').toString('base64');}],
 ['wrong size',(_,o)=>{o['git/blobs/'+blob].size++;}]
])test(name,()=>assert.throws(fixture(change)));
test('old immutable candidate remains transport only',()=>{const r=fixture((_,o)=>{o['branches/main'].commit.sha=sha(8);o['branches/mid-stable'].commit.sha=sha(8);})();assert.equal(r.requiresFreshIntegration,true);});
test('delete rejected',()=>assert.throws(()=>validateTrees({tree:[entry]},{tree:[]},task)));
for(const path of ['../bad.py','tools/ruc/../../bad.py','scripts/bad.mjs','tools/ruc/probe.py/child'])test('disallowed '+path,()=>assert.throws(()=>validateTask({...task,paths:[path]})));
for(const b of [Buffer.alloc(0),Buffer.from([0]),Buffer.alloc(524289,65),Buffer.from([255]),Buffer.from('-----BEGIN PRIVATE KEY-----')])test('invalid source',()=>assert.throws(()=>validateBytes(b)));
test('complete pagination',()=>{let n=0;const r=listIssues('all',()=>++n===1?Array.from({length:100},(_,i)=>({number:i})):[]);assert.equal(r.length,100);assert.equal(n,2);});
test('pagination limit fails closed',()=>assert.throws(()=>listIssues('all',()=>Array(100).fill({}))));
console.log(`Copilot transport: ${cases} isolated adversarial checks passed; zero network requests.`);

// Exercise the actual sender on an isolated staged tree and an offline Git-backed API.
const {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,rmSync,chmodSync}=await import('node:fs');
const {tmpdir}=await import('node:os');
const {join,resolve}=await import('node:path');
const {execFileSync,spawnSync}=await import('node:child_process');
const root=mkdtempSync(join(tmpdir(),'mid-copilot-test-'));
try{
 const work=join(root,'work'),installed=join(root,'installed'),bin=join(root,'bin');
 for(const p of [work,bin,join(installed,'scripts'),join(installed,'tools/handoff'),join(work,'tools/ruc')])mkdirSync(p,{recursive:true});
 const run=(...a)=>execFileSync('git',a,{cwd:work,encoding:'utf8'}).trim();
 run('init','-q');run('config','user.name','QA');run('config','user.email','qa@example.invalid');
 writeFileSync(join(work,'base.txt'),'unchanged\n');run('add','.');run('commit','-qm','base');
 const base=run('rev-parse','HEAD');
 writeFileSync(join(work,'tools/ruc/probe.py'),'print("one")\n');run('add','.');
 const tree=run('write-tree');
 const t={...task,base,expectedTree:tree};
 const config=join(installed,'tools/handoff/ap1b.json'),state=join(root,'state.json');
 writeFileSync(config,JSON.stringify(t));
 for(const p of ['scripts/mid-copilot-handoff.mjs','tools/handoff/copilot.mjs'])copyFileSync(resolve(p),join(installed,p));
 copyFileSync(resolve('scripts/fixtures/mock-mid-copilot-gh.mjs'),join(bin,'gh'));chmodSync(join(bin,'gh'),0o755);
 const env={...process.env,PATH:bin+':'+process.env.PATH,MID_TEST_TASK:config,MID_TEST_STATE:state};
 const invoke=(...a)=>spawnSync(process.execPath,[join(installed,'scripts/mid-copilot-handoff.mjs'),...a],{cwd:work,env,encoding:'utf8'});
 const before=readFileSync(join(work,'.git/index'));
 let r=invoke();assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).status,'DRY_RUN_ONLY');assert.equal(JSON.parse(readFileSync(state)).writes,0);
 r=invoke('--submit');assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).status,'TRANSPORT_VERIFIED');
 const writes=JSON.parse(readFileSync(state)).writes;
 r=invoke('--submit');assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(readFileSync(state)).writes,writes,'idempotent retry must write nothing');
 assert.deepEqual(readFileSync(join(work,'.git/index')),before,'original index unchanged');
 assert.equal(run('rev-parse','HEAD'),base,'HEAD unchanged');
 assert.equal(run('for-each-ref','--format=%(objectname)').split('\n').length,1,'no new refs');
 writeFileSync(join(work,'tools/ruc/probe.py'),'unstaged alteration\n');r=invoke();assert.notEqual(r.status,0);assert.match(r.stderr,/unstaged/);
 console.log('Copilot sender: offline dry-run/upload/readback/idempotence/index/ref preservation and unstaged-change rejection passed.');
}finally{rmSync(root,{recursive:true,force:true});}

const workflow=readFileSync('ci/github/workflows/mid-copilot-intake.yml','utf8');
assert.equal(workflow,readFileSync('.github/workflows/mid-copilot-intake.yml','utf8'));
assert.match(workflow,/contents: read/);assert.match(workflow,/issues: read/);
assert.doesNotMatch(workflow,/secrets\.|write|pull_request_target|workflow_run/);
assert.match(workflow,/ref: mid-stable/);assert.match(workflow,/persist-credentials: false/);
console.log('Copilot receipt: canonical/mirror equality, trusted Stable checkout and read-only permission checks passed.');
