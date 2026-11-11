#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {MID_WORKFLOW_PILOT_NAMES,collectWorkflowPilot,makeWorkflowToolPlan,runWorkflowQualityPilot} from '../tools/ci/mid-workflow-quality-pilot.mjs';
const root=mkdtempSync(path.join(tmpdir(),'mid-workflow-pilot-'));
let checks=0;
try{
  for(const prefix of ['.github/workflows','ci/github/workflows'])mkdirSync(path.join(root,prefix),{recursive:true});
  for(const name of MID_WORKFLOW_PILOT_NAMES)
    for(const prefix of ['.github/workflows','ci/github/workflows'])
      writeFileSync(path.join(root,prefix,name),'name: valid\n');
  const inv=collectWorkflowPilot(root);assert.equal(inv.status,'INVENTORY_OK');checks++;
  const plan=makeWorkflowToolPlan(inv.files);
  assert.deepEqual(plan.map(x=>x.name),['actionlint','zizmor']);
  assert.ok(plan[1].args.includes('--offline')&&plan[1].args.includes('--strict-collection'));
  assert.equal(plan[0].args.filter(x=>x.endsWith('.yml')).length,MID_WORKFLOW_PILOT_NAMES.length);checks++;
  const calls=[];
  const good=runWorkflowQualityPilot({root,env:{PATH:'/test',HOME:'/safe',GITHUB_TOKEN:'SHOULD_NOT_PASS',MID_SECRET:'SHOULD_NOT_PASS'},invoke:(name,args,opts)=>{
    calls.push({name,args,opts});return {status:0,stdout:'ok',stderr:''};}});
  assert.equal(good.status,'PILOT_PASS');assert.equal(good.releaseAuthorized,false);assert.equal(good.mergeAuthorized,false);
  assert.equal(calls.length,2);assert.equal(calls[0].opts.env.GITHUB_TOKEN,undefined);
  assert.equal(calls[1].opts.env.MID_SECRET,undefined);assert.equal(calls[1].opts.env.ZIZMOR_OFFLINE,'true');
  assert.equal(calls[1].opts.env.ZIZMOR_NO_ONLINE_AUDITS,'true');checks++;
  const failed=runWorkflowQualityPilot({root,invoke:(name)=>name==='actionlint'?{status:1,stderr:'invalid workflow'}:{status:0}});
  assert.equal(failed.status,'PILOT_FINDINGS_OR_FAILURE');assert.equal(failed.results[0].verdict,'FINDINGS_OR_ERROR');checks++;
  const missing=runWorkflowQualityPilot({root,invoke:()=>({status:null,error:{code:'ENOENT'}})});
  assert.equal(missing.status,'PILOT_FINDINGS_OR_FAILURE');assert.ok(missing.results.every(x=>x.verdict==='SCANNER_UNAVAILABLE'));checks++;
  const active=path.join(root,'.github/workflows',MID_WORKFLOW_PILOT_NAMES[0]);
  writeFileSync(active,'name: drift\n');
  assert.equal(collectWorkflowPilot(root).reason,'MIRROR_DRIFT');
  let invoked=false;const drift=runWorkflowQualityPilot({root,invoke:()=>{invoked=true;return {status:0}}});
  assert.equal(invoked,false);assert.equal(drift.status,'BLOCKED');checks++;
  writeFileSync(active,'name: valid\n');
  const bad=path.join(root,'ci/github/workflows',MID_WORKFLOW_PILOT_NAMES[0]);
  rmSync(bad);assert.equal(collectWorkflowPilot(root).reason,'MIRROR_MISSING');checks++;
  assert.throws(()=>makeWorkflowToolPlan(['./untrusted.yml']));checks++;
  console.log('MID workflow quality pilot: '+checks+' deterministic safety groups PASS (offline, no scanner invocation).');
}finally{rmSync(root,{recursive:true,force:true});}
