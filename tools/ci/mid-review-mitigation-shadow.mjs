#!/usr/bin/env node
// Trusted workflow checkout only. No PR checkout, no model call, no mutation.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {runMidReviewGuard} from './mid-review-premerge-guard.mjs';
import {planReviewMitigation} from './mid-review-mitigation-plan.mjs';
const repo='MeteoMartini/MID';
const get=path=>JSON.parse(execFileSync('gh',['api','--method','GET','repos/'+repo+'/'+path],{encoding:'utf8',timeout:20000,maxBuffer:10000000,stdio:['ignore','pipe','pipe']}));
const file=(path,ref)=>{const f=get('contents/'+path+'?ref='+ref);if(f.encoding!=='base64'||typeof f.content!=='string'||f.size>1000000)throw Error('BAD_FILE');return JSON.parse(Buffer.from(f.content,'base64').toString('utf8'));};
try{
 if(process.env.GITHUB_REPOSITORY!==repo||process.env.GITHUB_EVENT_NAME!=='workflow_run')throw Error('HOST_IDENTITY_INVALID');
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')).workflow_run;
 if(!Number.isSafeInteger(event?.id)||event.id<1)throw Error('EVENT_INVALID');
 const source=get('actions/runs/'+event.id);
 if(source.id!==event.id||source.head_sha!==event.head_sha||source.head_branch!==event.head_branch||source.path!=='.github/workflows/chatgpt-pr-gate.yml'||source.event!=='pull_request'||source.status!=='completed'||source.conclusion!=='success'||source.head_repository?.full_name!==repo||source.pull_requests?.length!==1)throw Error('SOURCE_INVALID');
 const link=source.pull_requests[0],n=link.number,head=source.head_sha,base=link.base?.sha;
 if(!Number.isSafeInteger(n)||n<1||!/^[a-f0-9]{40}$/.test(head??'')||!/^[a-f0-9]{40}$/.test(base??''))throw Error('PR_IDENTITY_INVALID');
 const main=get('branches/main'),stable=get('branches/mid-stable'),pr=get('pulls/'+n);
 if(main.commit?.sha!==base||stable.commit?.sha!==base||pr.head?.sha!==head||pr.state!=='open'||pr.draft!==false)throw Error('DRIFT_OR_ALREADY_MERGED');
 const target=file('MID_RELEASE_TARGET.json',head),fromVersion=file('package.json',base).version;
 if(!Number.isSafeInteger(pr.commits)||pr.commits<1||pr.commits>100)throw Error('COMMIT_HISTORY_LIMIT');
 const commits=get('pulls/'+n+'/commits?per_page=100');
 if(!Array.isArray(commits)||commits.length!==pr.commits)throw Error('COMMIT_HISTORY_INCOMPLETE');
 const guard=await runMidReviewGuard({...process.env,PR_NUMBER:String(n),EXPECTED_HEAD_SHA:head,EXPECTED_BRANCH:source.head_branch,EXPECTED_SOURCE_BASE_SHA:base});
 const final={pr:get('pulls/'+n),main:get('branches/main').commit?.sha,stable:get('branches/mid-stable').commit?.sha};
 const result=planReviewMitigation({repository:repo,source,pr,main,stable,fromVersion,target,commits,guard,final});
 console.log(JSON.stringify(result,null,2));
}catch{
 // Never expose review text, API response bodies, token, or ambiguous zero counts.
 console.log(JSON.stringify({state:'HOLD',reason:'EVIDENCE_UNAVAILABLE_OR_INCONSISTENT',rounds:null,remaining:null,openThreads:null,resolvedThreads:null,activeChangeRequests:null,externalCallsAuthorized:false,writeAuthorized:false,releaseAuthorized:false},null,2));
}
