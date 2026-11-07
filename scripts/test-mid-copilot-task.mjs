#!/usr/bin/env node
/** No network required: adversarial tests for the bounded MID cloud task relay. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIssue,receiptFrom,start,status,promptFor} from './mid-copilot-task.mjs';
const base='b6526e7c5c24035bd1a75b87b77e7bb8e821c334';
const original={schema:'mid.copilot-task.v1',repository:'MeteoMartini/MID',baseSha:base,version:'0.9.85.445',mode:'implementation',goal:'Implement a focused reproducible source regression.',paths:['scripts/test-example.mjs'],acceptance:['The focused Node regression should pass.'],approvedByUser:true};
function mock(o={}){
 const task={...original,...o.task};
 const issue={state:'open',title:'[MID-COPILOT-TASK] scoped test',user:{login:'MeteoMartini',id:75040651},body:'<!-- MID-COPILOT-TASK-V1\n'+JSON.stringify(task)+'\n-->',...o.issue};
 const calls=[],list=(o.comments||[]).map(c=>c.user?c:{...c,user:{login:'MeteoMartini',id:75040651}});
 const b64=x=>({encoding:'base64',content:Buffer.from(JSON.stringify(x)).toString('base64')});
 const client=(path,body)=>{
  calls.push({path,body});
  if(path==='user')return o.actor||{login:'MeteoMartini',id:75040651};
  if(path.endsWith('/branches/main')||path.endsWith('/branches/mid-stable'))return {commit:{sha:o.sha||base}};
  if(path.includes('/contents/package.json'))return b64({version:o.version||task.version});
  if(path.includes('/contents/MID_BASELINE.json'))return b64({releaseVersion:o.version||task.version});
  if(path.includes('/issues/4/comments?'))return list;
  if(path.endsWith('/issues/4/comments')&&body){if(o.failReceipt)throw Error('receipt denied');return {id:2,body:o.tamperReceipt?'tampered':body.body,user:{login:'MeteoMartini',id:75040651}};}
  if(path.endsWith('/issues/4'))return issue;
  if(path==='agents/repos/MeteoMartini/MID/tasks'&&body){if(o.ambiguousTask)throw Error('network timeout');return {id:'01234567-aaaa-bbbb-cccc-1234567890ab',html_url:'https://github.com/agents/task'};}
  if(path.startsWith('agents/repos/MeteoMartini/MID/tasks/'))return {id:'01234567-aaaa-bbbb-cccc-1234567890ab',state:'completed',artifacts:[]};
  throw Error('unexpected path '+path);
 };
 return {client,calls,issue};
}
test('valid manifest and owner',()=>{assert.equal(parseIssue(mock().issue).mode,'implementation');assert.throws(()=>parseIssue(mock({issue:{user:{login:'outsider',id:99}}}).issue),/author/);});
test('path traversal, CI governance and credentials rejected',()=>{
 for(const paths of [['.github/workflows/release.yml'],['src/../.github/config'],['src/.env'],['src/a.mjs','src/a.mjs']]){
  assert.throws(()=>parseIssue(mock({task:{paths}}).issue));
 }
});
test('requires genuine explicit task flag',()=>{assert.throws(()=>parseIssue(mock({task:{approvedByUser:false}}).issue),/authorization/);});
test('requires full pinned SHA',()=>{assert.throws(()=>parseIssue(mock({task:{baseSha:'main'}}).issue),/SHA/);});
test('requires owner account authentication',()=>{const m=mock({actor:{login:'some-bot',id:3}});assert.throws(()=>start(m.client,4),/owner/);});
test('dry run performs read-only API calls',()=>{const m=mock();const r=start(m.client,4);assert.equal(r.status,'DRY_RUN');assert.equal(r.noAutoPR,true);assert(m.calls.every(c=>c.body===undefined));});
test('dispatch explicitly forbids PR and posts one verifiable receipt',()=>{
 const m=mock();const r=start(m.client,4,true);assert.equal(r.status,'STARTED');
 const req=m.calls.find(c=>c.path==='agents/repos/MeteoMartini/MID/tasks');
 assert.equal(req.body.create_pull_request,false);assert.equal(req.body.base_ref,'mid-stable');assert.match(req.body.prompt,/Do NOT create any pull request/);
 assert.equal(m.calls.filter(c=>c.path==='agents/repos/MeteoMartini/MID/tasks').length,1);
 assert(m.calls.some(c=>c.path.endsWith('/issues/4/comments')&&c.body.body.startsWith('MID-COPILOT-RECEIPT-V1\n')));
});
test('duplicate recorded receipt blocks second dispatch',()=>{
 const m=mock();start(m.client,4,true);const receipt=m.calls.find(c=>c.path.endsWith('/issues/4/comments')&&c.body).body.body;
 const x=mock({comments:[{body:receipt}]});assert.throws(()=>start(x.client,4,true),/already dispatched/);
 assert.equal(x.calls.filter(c=>c.path==='agents/repos/MeteoMartini/MID/tasks').length,0);
});
test('base or version drift fails closed',()=>{
 assert.throws(()=>start(mock({sha:'a'.repeat(40)}).client,4,true),/drift/);
 assert.throws(()=>start(mock({version:'0.9.85.444'}).client,4,true),/version mirror/);
});
test('partial write failure prints task ID and disallows blind retry',()=>{
 const m=mock({failReceipt:true});assert.throws(()=>start(m.client,4,true),/TASK ALREADY STARTED.*inspect before any retry/);
 assert.equal(m.calls.filter(c=>c.path==='agents/repos/MeteoMartini/MID/tasks').length,1);
});
test('status is read-only and cannot confer release approval',()=>{
 const m=mock();start(m.client,4,true);
 const receipt=m.calls.find(c=>c.path.endsWith('/issues/4/comments')&&c.body).body.body;
 const x=mock({comments:[{body:receipt}]});const s=status(x.client,4);
 assert.equal(s.status,'completed');assert.equal(s.releaseAuthorized,false);
 assert(x.calls.every(c=>c.body===undefined));
});
test('bad or repeated receipts fail closed',()=>{
 assert.throws(()=>receiptFrom([{body:'MID-COPILOT-RECEIPT-V1\n{}',user:{login:'MeteoMartini',id:75040651}}]),/receipt fields/);
 assert.throws(()=>receiptFrom([{body:'MID-COPILOT-RECEIPT-V1\n{}'},{body:'MID-COPILOT-RECEIPT-V1\n{}'}]),/multiple/);
});
test('audit mode explicitly read-only',()=>{assert.match(promptFor(4,{...original,mode:'audit'}),/READ ONLY/);assert.match(promptFor(4,original),/NOT RELEASE AUTHORIZED/);});

test('historical task remains queryable after independent stable promotion',()=>{
 const m=mock();start(m.client,4,true);
 const receipt=m.calls.find(c=>c.path.endsWith('/issues/4/comments')&&c.body).body.body;
 const s=mock({comments:[{body:receipt}],sha:'a'.repeat(40)});
 const result=status(s.client,4);
 assert.equal(result.status,'completed');
 assert.equal(result.requiresFreshIntegration,true);
 assert.equal(result.releaseAuthorized,false);
 assert(s.calls.every(c=>c.body===undefined));
});

test('untrusted public issue receipt cannot spoof cloud execution',()=>{
 const m=mock();start(m.client,4,true);
 const body=m.calls.find(c=>c.path.endsWith('/issues/4/comments')&&c.body).body.body;
 const forged=mock({comments:[{body,user:{login:'outside-attacker',id:42}}]});
 assert.throws(()=>start(forged.client,4,true),/untrusted receipt author/);
 assert.equal(forged.calls.filter(c=>c.path==='agents/repos/MeteoMartini/MID/tasks').length,0);
});
test('receipt cannot claim release authorization or a different issue',()=>{
 const m=mock();start(m.client,4,true);
 const text=m.calls.find(c=>c.path.endsWith('/issues/4/comments')&&c.body).body.body;
 for(const override of [{releaseAuthorized:true},{noAutoPR:false},{issue:5}]){
  const record=JSON.parse(text.split('\n').slice(1).join('\n'));
  const body='MID-COPILOT-RECEIPT-V1\n'+JSON.stringify({...record,...override});
  const x=mock({comments:[{body}]});
  assert.throws(()=>status(x.client,4),/receipt fields|mismatched task receipt/);
 }
});
test('receipt write must be independently confirmed and must not auto-retry',()=>{
 const m=mock({tamperReceipt:true});
 assert.throws(()=>start(m.client,4,true),/TASK ALREADY STARTED.*receipt unverified/);
 assert.equal(m.calls.filter(c=>c.path==='agents/repos/MeteoMartini/MID/tasks').length,1);
});

test('closed historical issue remains readable, but cannot start a new task',()=>{
 const m=mock();start(m.client,4,true);
 const receipt=m.calls.find(c=>c.path.endsWith('/issues/4/comments')&&c.body).body.body;
 const closed=mock({comments:[{body:receipt}],issue:{state:'closed'}});
 assert.equal(status(closed.client,4).status,'completed');
 assert.throws(()=>start(closed.client,4,true),/issue state invalid/);
});

test('ambiguous post/transport timeout is not assumed to be safe to retry',()=>{
 const m=mock({ambiguousTask:true});
 assert.throws(()=>start(m.client,4,true),/cloud task outcome UNKNOWN; inspect GitHub Agents before any retry/);
 assert.equal(m.calls.filter(c=>c.path==='agents/repos/MeteoMartini/MID/tasks').length,1);
 assert.equal(m.calls.filter(c=>c.path.endsWith('/issues/4/comments')&&c.body).length,0);
});
