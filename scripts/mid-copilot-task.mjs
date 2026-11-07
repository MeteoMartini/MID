#!/usr/bin/env node
/** MID: bounded Copilot cloud task dispatch. Never grants release or branch rights. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const REPO='MeteoMartini/MID';
const OWNER='MeteoMartini', USER_ID=75040651;
const HEX=/^[a-f0-9]{40}$/;
const RECEIPT='MID-COPILOT-RECEIPT-V1';

export function check(ok,reason){if(!ok)throw new Error('MID Copilot bridge: '+reason);}
export function api(path,payload){
 const args=['api','-H','Accept: application/vnd.github+json','-H','X-GitHub-Api-Version: 2026-03-10','--method',payload===undefined?'GET':'POST',path];
 if(payload!==undefined)args.push('--input','-');
 return JSON.parse(execFileSync('gh',args,{input:payload===undefined?undefined:JSON.stringify(payload),encoding:'utf8',maxBuffer:8*1024*1024}));
}
export function parseIssue(issue,{allowClosed=false}={}){
 check((issue?.state==='open'||(allowClosed&&issue?.state==='closed'))&&!issue.pull_request,'GitHub issue state invalid');
 check(issue.user?.login===OWNER&&issue.user?.id===USER_ID,'untrusted issue author');
 check(/^\[MID-COPILOT-TASK\] /.test(issue.title||''),'invalid task title');
 const body=issue.body||'';
 check(body.length>0&&body.length<16000,'body size invalid');
 const matches=[...body.matchAll(/<!-- MID-COPILOT-TASK-V1\n([\s\S]*?)\n-->/g)];
 check(matches.length===1,'exactly one task manifest required');
 let t;
 try{t=JSON.parse(matches[0][1]);}catch{throw new Error('MID Copilot bridge: invalid JSON manifest');}
 check(t?.schema==='mid.copilot-task.v1'&&t.repository===REPO,'wrong schema/repository');
 check(HEX.test(t.baseSha)&&/^0\.\d+\.\d+\.\d+$/.test(t.version),'invalid SHA/version');
 check(t.approvedByUser===true&&['audit','implementation'].includes(t.mode),'missing authorization or mode');
 check(typeof t.goal==='string'&&t.goal.length>=12&&t.goal.length<4000,'invalid goal');
 check(Array.isArray(t.acceptance)&&t.acceptance.length>0&&t.acceptance.length<=20&&t.acceptance.every(v=>typeof v==='string'&&v.length>5&&v.length<500),'invalid acceptance');
 check(Array.isArray(t.paths)&&t.paths.length>0&&t.paths.length<=40&&new Set(t.paths).size===t.paths.length,'invalid path set');
 check(t.paths.every(p=>typeof p==='string'&&/^(?:src|worker-src|scripts|tools|tests)\/[a-zA-Z0-9_./-]+$/.test(p)&&!p.includes('..')&&!p.includes('//')&&!/\.(env|pem|key)$/.test(p)),'disallowed path');
 return t;
}
export function digest(t){return createHash('sha256').update(JSON.stringify(t)).digest('hex');}
export function liveBase(client,t){
 const a=client('repos/'+REPO+'/branches/main')?.commit?.sha;
 const b=client('repos/'+REPO+'/branches/mid-stable')?.commit?.sha;
 check(HEX.test(a)&&a===b&&a===t.baseSha,'main/stable/task SHA drift');
 for(const [path,field] of [['package.json','version'],['MID_BASELINE.json','releaseVersion']]){
  const data=client('repos/'+REPO+'/contents/'+path+'?ref=mid-stable');
  check(data?.encoding==='base64','version source missing');
  const parsed=JSON.parse(Buffer.from(data.content.replace(/\s/g,''),'base64').toString('utf8'));
  check(parsed[field]===t.version,'version mirror mismatch: '+path);
 }
 return a;
}
export function receiptFrom(comments){
 const items=comments.filter(c=>typeof c.body==='string'&&c.body.startsWith(RECEIPT+'\n'));
 check(items.length<=1,'multiple receipts: manual reconciliation');
 if(!items.length)return null;
 check(items[0].user?.login===OWNER&&items[0].user?.id===USER_ID,'untrusted receipt author');
 let r;
 try{r=JSON.parse(items[0].body.slice(RECEIPT.length+1));}catch{throw new Error('MID Copilot bridge: invalid receipt');}
 check(r?.schema===1&&/^[a-zA-Z0-9-]{8,100}$/.test(r.id)&&Number.isSafeInteger(r.issue)&&r.issue>0&&HEX.test(r.base)&&/^[a-f0-9]{64}$/.test(r.taskDigest)&&r.noAutoPR===true&&r.releaseAuthorized===false,'invalid receipt fields');
 return r;
}
export function comments(client,num){
 const result=[];
 for(let page=1;page<=5;page++){
  const part=client('repos/'+REPO+'/issues/'+num+'/comments?per_page=100&page='+page);
  check(Array.isArray(part),'invalid comments result');
  result.push(...part);
  if(part.length<100)return result;
 }
 throw new Error('MID Copilot bridge: comment pagination exceeds limit');
}
export function preflight(client,num){
 check(Number.isSafeInteger(num)&&num>0,'positive issue number required');
 const user=client('user');
 check(user?.login===OWNER&&user?.id===USER_ID,'user-authenticated owner required; no App installation token');
 const issue=client('repos/'+REPO+'/issues/'+num);
 const task=parseIssue(issue),sha=liveBase(client,task);
 return {issue,task,sha,digest:digest(task),receipt:receiptFrom(comments(client,num))};
}
export function promptFor(num,t){
 return [
 'MID user-assigned task in GitHub Issue #'+num+'. Mode: '+t.mode+'.',
 'Read AGENTS.md, MID_SOURCE_OF_TRUTH.md, MID_BASELINE.json, contracts/index.json and .github/copilot-instructions.md.',
 'Verify full current main and mid-stable SHA equals '+t.baseSha+'; released version '+t.version+'. Stop on any drift, scope or PR conflict.',
 'Goal: '+t.goal,
 'Allowed paths only: '+t.paths.join(', '),
 'Acceptance: '+t.acceptance.join(' | '),
 t.mode==='audit'?'READ ONLY. No modifications.':'Only isolated untrusted copilot/* candidate; no protected/agent-integration refs, CI, governance, credentials or release changes.',
 'Do NOT create any pull request, merge, publish, deploy, expand rights or buy services.',
 'Report task status and exact base/head/tree/changed-path/QA evidence as a GitHub comment on the original Issue #'+num+' if allowed, with no secrets; if unavailable report the blocker instead.',
 'Provide exact original and candidate SHA/tree, changed files, focused tests, unverified gates, overlap analysis and safe handoff. Preserve work if transport is unavailable.',
 'NOT RELEASE AUTHORIZED.'
 ].join('\n\n');
}
export function start(client,num,submit=false){
 const s=preflight(client,num);
 check(!s.receipt,'already dispatched; check prior task');
 if(!submit)return {status:'DRY_RUN',issue:num,base:s.sha,taskDigest:s.digest,noAutoPR:true,releaseAuthorized:false};
 liveBase(client,s.task);
 check(digest(parseIssue(client('repos/'+REPO+'/issues/'+num)))===s.digest,'issue changed during preflight');
 check(!receiptFrom(comments(client,num)),'concurrent receipt appeared');
 let t;
 try{t=client('agents/repos/'+REPO+'/tasks',{prompt:promptFor(num,s.task),base_ref:'mid-stable',create_pull_request:false});}
 catch(e){throw new Error('MID Copilot bridge: cloud task outcome UNKNOWN; inspect GitHub Agents before any retry. '+String(e.message||e));}
 check(typeof t?.id==='string'&&/^[a-zA-Z0-9-]{8,100}$/.test(t.id),'cloud response uncertain; do not retry blindly');
 const receipt={schema:1,id:t.id,issue:num,base:s.sha,taskDigest:s.digest,noAutoPR:true,releaseAuthorized:false};
 try{
  const body=RECEIPT+'\n'+JSON.stringify(receipt);
  const written=client('repos/'+REPO+'/issues/'+num+'/comments',{body});
  check(Number.isSafeInteger(written?.id)&&written.body===body&&written.user?.login===OWNER&&written.user?.id===USER_ID,'receipt write readback mismatch');
 }catch(e){throw new Error('MID Copilot bridge: TASK ALREADY STARTED '+t.id+'; receipt unverified; inspect before any retry. '+String(e.message||e));}
 return {status:'STARTED',...receipt,url:t.html_url||null};
}
export function status(client,num){
 check(Number.isSafeInteger(num)&&num>0,'positive issue number required');
 const user=client('user');
 check(user?.login===OWNER&&user?.id===USER_ID,'user-authenticated owner required');
 const task=parseIssue(client('repos/'+REPO+'/issues/'+num),{allowClosed:true});
 const r=receiptFrom(comments(client,num));
 check(r&&r.issue===num&&r.taskDigest===digest(task)&&r.base===task.baseSha,'missing/mismatched task receipt');
 // Historical task status remains readable after a later, valid Stable promotion.
 const main=client('repos/'+REPO+'/branches/main')?.commit?.sha;
 const stable=client('repos/'+REPO+'/branches/mid-stable')?.commit?.sha;
 check(HEX.test(main)&&main===stable,'main/stable drift');
 const t=client('agents/repos/'+REPO+'/tasks/'+r.id);
 check(t?.id===r.id,'task ID mismatch');
 return {status:t.state||'UNKNOWN',task:t.id,issue:num,url:t.html_url||null,artifacts:t.artifacts||[],currentStable:stable,requiresFreshIntegration:stable!==r.base,releaseAuthorized:false};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const [mode,arg,...more]=process.argv.slice(2);
  const num=Number(arg);
  check(['--dry-run','--submit','--status'].includes(mode)&&more.length===0&&Number.isSafeInteger(num)&&num>0,'usage: node scripts/mid-copilot-task.mjs --dry-run|--submit|--status ISSUE_NUMBER');
  console.log(JSON.stringify(mode==='--status'?status(api,num):start(api,num,mode==='--submit'),null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
