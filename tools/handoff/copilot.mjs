/** Ref-free Copilot transport. Candidate content is data, never executed here. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const repo='MeteoMartini/MID';
const hex=/^[a-f0-9]{40}$/;
export function requireThat(ok,message){if(!ok)throw new Error('Copilot handoff: '+message);}
export function git(...args){return execFileSync('git',args,{maxBuffer:8*1024*1024});}
export function gh(path,body){return JSON.parse(execFileSync('gh',['api','--method',body===undefined?'GET':'POST','repos/'+repo+'/'+path,...(body===undefined?[]:['--input','-'])],{input:body===undefined?undefined:JSON.stringify(body),encoding:'utf8',maxBuffer:16*1024*1024}));}
export const blobHash=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
export function validateTask(t){
 requireThat(t?.schema===1&&/^[a-z0-9-]{1,60}$/.test(t.task),'invalid task');
 requireThat(hex.test(t.base)&&hex.test(t.expectedTree),'task must pin full base/tree');
 requireThat(Array.isArray(t.paths)&&t.paths.length>0&&t.paths.length<=40&&new Set(t.paths).size===t.paths.length,'invalid paths');
 requireThat(t.paths.every(p=>/^tools\/ruc\/[a-zA-Z0-9_-]+\.py$/.test(p)),'path outside Python QA scope');
 requireThat(Array.isArray(t.submitters)&&t.submitters.length>0&&t.submitters.every(a=>Number.isSafeInteger(a.id)&&a.id>0&&/^[a-zA-Z0-9_[\]-]+$/.test(a.login)),'unverified submitters');
 return t;
}
export function validateBytes(b){
 requireThat(b.length>0&&b.length<=512*1024&&!b.includes(0),'invalid source size/NUL');
 const s=new TextDecoder('utf-8',{fatal:true}).decode(b);
 requireThat(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9_]{30,}/.test(s),'potential secret');
}
export function liveBase(api=gh){const a=api('branches/main').commit.sha,b=api('branches/mid-stable').commit.sha;requireThat(hex.test(a)&&a===b,'main/stable drift');return a;}
export function entries(tree){
 requireThat(tree&&!tree.truncated&&Array.isArray(tree.tree),'incomplete tree');
 const result=new Map();
 for(const e of tree.tree){requireThat(typeof e.path==='string'&&hex.test(e.sha)&&!result.has(e.path),'invalid/duplicate tree entry');result.set(e.path,e);}
 return result;
}
export function validateTrees(base,result,t){
 const a=entries(base),b=entries(result);
 const changed=[...new Set([...a.keys(),...b.keys()])].filter(p=>{
  const x=a.get(p),y=b.get(p);
  if(x?.type==='tree'||y?.type==='tree'){requireThat(!x||!y||x.type===y.type,'tree/file replacement');return false;}
  return x?.sha!==y?.sha||x?.mode!==y?.mode||x?.type!==y?.type;
 }).sort();
 requireThat(JSON.stringify(changed)===JSON.stringify([...t.paths].sort()),'unexpected/missing paths');
 for(const p of changed){const e=b.get(p);requireThat(e?.mode==='100644'&&e.type==='blob','nonregular/deleted file');}
 return changed.map(path=>b.get(path));
}
export function verifyIssue(issue,t,api=gh){
 validateTask(t);
 requireThat(issue?.state==='open'&&!issue.pull_request&&issue.title==='[MID-COPILOT-HANDOFF] '+t.task,'invalid issue');
 requireThat(t.submitters.some(a=>a.id===issue.user?.id&&a.login===issue.user?.login),'unapproved submitter');
 requireThat(typeof issue.body==='string'&&issue.body.length<20000,'invalid body');
 const m=JSON.parse(issue.body);
 requireThat(m.schema===1&&m.repository===repo&&m.task===t.task&&m.base===t.base&&m.tree===t.expectedTree&&hex.test(m.candidate),'task binding mismatch');
 const stable=liveBase(api),c=api('git/commits/'+m.candidate);
 requireThat(c.sha===m.candidate&&c.parents?.length===1&&c.parents[0].sha===t.base&&c.tree?.sha===t.expectedTree,'commit lineage mismatch');
 const base=api('git/commits/'+t.base);
 requireThat(base.sha===t.base&&hex.test(base.tree?.sha),'invalid base object');
 const files=validateTrees(api('git/trees/'+base.tree.sha+'?recursive=1'),api('git/trees/'+m.tree+'?recursive=1'),t);
 let total=0;
 for(const f of files){const raw=api('git/blobs/'+f.sha);requireThat(raw.encoding==='base64'&&raw.sha===f.sha,'invalid blob');const bytes=Buffer.from(raw.content.replace(/\s/g,''),'base64');validateBytes(bytes);total+=bytes.length;requireThat(blobHash(bytes)===f.sha&&raw.size===bytes.length,'blob hash mismatch');}
 requireThat(total<=2*1024*1024,'oversized candidate');
 requireThat(liveBase(api)===stable,'stable moved during verification');
 return {status:'TRANSPORT_VERIFIED',task:t.task,candidate:m.candidate,base:t.base,tree:m.tree,currentStable:stable,requiresFreshIntegration:t.base!==stable,files:files.map(f=>({path:f.path,sha:f.sha})),releaseAuthorized:false,qa:'NOT VERIFIED'};
}

export function listIssues(state='open',api=gh){
 const all=[];
 for(let page=1;page<=20;page++){
  const batch=api(`issues?state=${state}&per_page=100&page=${page}`);
  requireThat(Array.isArray(batch),'invalid issue inventory');all.push(...batch);
  if(batch.length<100)return all;
 }
 throw new Error('Copilot handoff: issue inventory exceeds bounded pagination');
}
