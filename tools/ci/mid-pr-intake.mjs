#!/usr/bin/env node
// MID Cleaner v1: read-only GitHub intake. It cannot close, merge, approve or release.
import {pathToFileURL} from 'node:url';
const REPOSITORY='MeteoMartini/MID';
const SHA=/^[a-f0-9]{40}$/;
const SAFE_PATH=p=>typeof p==='string'&&p.length>0&&p.length<400&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(s=>!s||s==='.'||s==='..');
const VALID_STATUSES=new Set(['added','modified','removed','renamed']);
const fail=why=>{throw Error('MID_CLEANER_'+why)};
const sha=s=>typeof s==='string'&&SHA.test(s);
const number=n=>Number.isSafeInteger(n)&&n>0;
function validFiles(files,expected){
 if(!Array.isArray(files)||!number(expected)||expected>300||files.length!==expected)return false;
 const seen=new Set();
 for(const f of files){
  if(!f||!SAFE_PATH(f.filename)||!VALID_STATUSES.has(f.status)||
     (f.status==='renamed'&&!SAFE_PATH(f.previous_filename))||
     (f.status!=='removed'&&!sha(f.sha))||seen.has(f.filename))return false;
  seen.add(f.filename);
 }
 return true;
}
const affected=files=>[...new Set(files.flatMap(f=>f.status==='renamed'?[f.filename,f.previous_filename]:[f.filename]))];
export function assessMidCleanerIntake(input){
 const {mainSha,stableSha,checkoutSha,versionMirrors,target,peers,stableBlobs,leadPrNumber=0}=input??{};
 if(!sha(mainSha)||mainSha!==stableSha||mainSha!==checkoutSha)fail('STABLE_DRIFT');
 if(!Array.isArray(versionMirrors)||versionMirrors.length!==3||
    !versionMirrors.every(v=>typeof v==='string'&&/^0\.\d+\.\d+\.\d+$/.test(v))||
    new Set(versionMirrors).size!==1)fail('VERSION_DRIFT');
 if(!target||!number(target.number)||!sha(target.headSha)||!sha(target.baseSha)||
    target.baseRef!=='main'||target.state!=='open'||target.merged!==false||
    target.headRepo!==REPOSITORY||!validFiles(target.files,target.changedFiles))fail('TARGET_INVALID');
 if(!Array.isArray(peers)||peers.length>300||!peers.every(p=>p&&number(p.number)&&sha(p.headSha)&&
     p.number!==target.number&&validFiles(p.files,p.changedFiles)))fail('PEER_INVENTORY_INCOMPLETE');
 if(new Set(peers.map(p=>p.number)).size!==peers.length)fail('PEER_DUPLICATE');
 if(!stableBlobs||typeof stableBlobs!=='object'||Array.isArray(stableBlobs))fail('STABLE_BLOBS_MISSING');
 if(!number(leadPrNumber)&&leadPrNumber!==0)fail('LEAD_PR_INVALID');
 const paths=affected(target.files);
 if(paths.some(p=>!Object.hasOwn(stableBlobs,p)||
      (stableBlobs[p]!==null&&!sha(stableBlobs[p]))))fail('STABLE_BLOB_INCOMPLETE');
 const alreadyInStable=target.files.every(f=>['added','modified'].includes(f.status)&&
     stableBlobs[f.filename]===f.sha);
 const overlaps=[];
 const targetByPath=new Map(target.files.map(f=>[f.filename,f]));
 for(const p of peers){
  const shared=affected(p.files).filter(path=>paths.includes(path));
  if(!shared.length)continue;
  const peerFiles=new Map(p.files.map(f=>[f.filename,f]));
  overlaps.push({pr:p.number,headSha:p.headSha,paths:shared.sort().map(path=>{
   const a=targetByPath.get(path),b=peerFiles.get(path);
   return {path,relation:a&&b&&a.status===b.status&&sha(a.sha)&&a.sha===b.sha?
     'EXACT_SAME_GIT_BLOB':'CONFLICT_OR_RENAME_REVIEW'};
  })});
 }
 overlaps.sort((a,b)=>a.pr-b.pr);
 const lead=leadPrNumber===0?'UNPINNED':leadPrNumber===target.number?'SELF':
   peers.some(p=>p.number===leadPrNumber)?'IN_VERIFIED_PEER_INVENTORY':'NOT_IN_PEERS';
 const checks=[
  ...(target.baseSha!==stableSha?['STALE_PR_BASE']:[]),
  ...(target.draft?['DRAFT_NO_SOURCE_RELEASE']:[]),
  ...(lead==='UNPINNED'?['LEAD_NOT_EXPLICITLY_BOUND']:[]),
  ...(lead==='NOT_IN_PEERS'?['LEAD_NOT_VERIFIED']:[]),
  ...(overlaps.length?['CROSS_PR_PATH_OR_BLOB_OVERLAP']:[])
 ];
 return {schema:'mid.cleaner.intake.v1',repository:REPOSITORY,version:versionMirrors[0],
  stableSha,mainSha,target:{number:target.number,headSha:target.headSha,
    baseSha:target.baseSha,draft:target.draft,changedFiles:target.changedFiles},
  verifiedPeerCount:peers.length,leadPrNumber,leadStatus:lead,overlaps,
  exactStableBlobMatches:target.files.filter(f=>['added','modified'].includes(f.status)&&
     stableBlobs[f.filename]===f.sha).length,
  historicalIntegrationCandidate:alreadyInStable,checksRequired:checks,
  closureAuthorized:false,mergeAuthorized:false,releaseAuthorized:false,
  note:'Evidence for human-controlled cleaner and Lead review only. No PR closure, approval, gate bypass or release.'};
}
const headers=token=>({'Accept':'application/vnd.github+json',
 'X-GitHub-Api-Version':'2022-11-28','User-Agent':'MID-readonly-cleaner',
 ...(token?{'Authorization':'Bearer '+token}:{})});
async function get(path,token,{allow404=false}={}){
 const res=await fetch('https://api.github.com/repos/'+REPOSITORY+'/'+path,
   {headers:headers(token),signal:AbortSignal.timeout(25000)});
 if(allow404&&res.status===404)return null;
 if(!res.ok)fail('GITHUB_HTTP_'+res.status);
 return res.json();
}
async function pages(path,token,cap=3){
 const all=[];
 for(let n=1;n<=cap;n++){
  const batch=await get(path+(path.includes('?')?'&':'?')+'per_page=100&page='+n,token);
  if(!Array.isArray(batch))fail('PAGINATION_INVALID');
  all.push(...batch);
  if(batch.length<100)return all;
 }
 fail('PAGINATION_TRUNCATED');
}
const identity=p=>JSON.stringify([p.number,p.state,p.draft,p.merged,p.head?.sha,
  p.head?.repo?.full_name,p.base?.sha,p.base?.ref,p.changed_files]);
async function onePr(n,token){
 const a=await get('pulls/'+n,token);
 if(a.number!==n||a.state!=='open'||a.merged!==false)fail('PR_CLOSED_OR_DRIFT');
 const files=await pages('pulls/'+n+'/files',token,4);
 const b=await get('pulls/'+n,token);
 if(identity(a)!==identity(b)||!validFiles(files,a.changed_files))fail('PR_FILES_OR_IDENTITY_DRIFT');
 return {number:a.number,state:a.state,draft:a.draft,merged:a.merged,
  headSha:a.head?.sha,headRepo:a.head?.repo?.full_name,baseSha:a.base?.sha,
  baseRef:a.base?.ref,changedFiles:a.changed_files,
  files:files.map(f=>({filename:f.filename,status:f.status,sha:f.sha,
    ...(f.status==='renamed'?{previous_filename:f.previous_filename}:{})}))};
}
async function mapLimit(items,limit,fn){
 const results=new Array(items.length);let next=0;
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
  while(next<items.length){const i=next++;results[i]=await fn(items[i]);}
 }));return results;
}
async function versionAt(stableSha,token){
 const paths=['package.json','MID_BASELINE.json','contracts/index.json'];
 const objs=await Promise.all(paths.map(p=>get('contents/'+p+'?ref='+stableSha,token)));
 return objs.map((o,i)=>{
  if(o?.type!=='file'||o.encoding!=='base64'||!sha(o.sha)||typeof o.content!=='string')fail('VERSION_SOURCE_INVALID');
  const v=JSON.parse(Buffer.from(o.content.replace(/\s/g,''),'base64').toString('utf8'));
  return i===0?v.version:v.releaseVersion;
 });
}
export async function inspectMidCleanerRemote({number:targetNumber,token,checkoutSha,expectedHeadSha='',leadPrNumber=0}){
 if(!number(targetNumber)||!sha(checkoutSha)||expectedHeadSha!==''&&!sha(expectedHeadSha)||
    leadPrNumber!==0&&!number(leadPrNumber))fail('ARGUMENT_INVALID');
 const refs=()=>Promise.all(['main','mid-stable'].map(b=>get('git/ref/heads/'+b,token)));
 const [main,stable]=await refs();
 const mainSha=main.object?.sha,stableSha=stable.object?.sha;
 if(!sha(stableSha)||mainSha!==stableSha||stableSha!==checkoutSha)fail('STABLE_DRIFT');
 const [versionMirrors,target,list]=await Promise.all([
   versionAt(stableSha,token),onePr(targetNumber,token),pages('pulls?state=open',token,3)]);
 if(expectedHeadSha&&target.headSha!==expectedHeadSha)fail('EVENT_HEAD_DRIFT');
 if(list.filter(p=>p.number===targetNumber).length!==1)fail('TARGET_NOT_IN_OPEN_LIST');
 const peers=await mapLimit(list.filter(p=>p.number!==targetNumber),5,async p=>{
   const current=await onePr(p.number,token);
   if(current.headSha!==p.head?.sha||current.baseSha!==p.base?.sha)fail('PEER_LIST_DRIFT');
   return current;
 });
 const allPaths=affected(target.files);
 const stableBlobs={};
 await mapLimit(allPaths,5,async path=>{
  const value=await get('contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+stableSha,
    token,{allow404:true});
  stableBlobs[path]=value===null?null:value?.type==='file'&&sha(value.sha)?value.sha:fail('BLOB_UNAVAILABLE');
 });
 const [lastMain,lastStable]=await refs();
 if(lastMain.object?.sha!==mainSha||lastStable.object?.sha!==stableSha)fail('REF_RACE');
 const finalTarget=await get('pulls/'+targetNumber,token);
 if(identity(finalTarget)!==JSON.stringify([target.number,target.state,target.draft,
      target.merged,target.headSha,target.headRepo,target.baseSha,target.baseRef,target.changedFiles]))
   fail('TARGET_POSTREAD_DRIFT');
 const result=assessMidCleanerIntake({mainSha,stableSha,checkoutSha,
  versionMirrors,target,peers,stableBlobs,leadPrNumber});
 // A review must still recheck peer SHAs before any separate integration decision.
 return {...result,peerReadback:'advisory-snapshot-not-merge-authorization'};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const n=Number(process.env.MID_CLEANER_PR_NUMBER),lead=Number(process.env.MID_CLEANER_LEAD_PR_NUMBER||0);
  const result=await inspectMidCleanerRemote({number:n,leadPrNumber:lead,
   checkoutSha:process.env.MID_CLEANER_CHECKOUT_SHA,expectedHeadSha:process.env.MID_CLEANER_EVENT_HEAD_SHA||'',
   token:process.env.GITHUB_TOKEN});
  console.log(JSON.stringify(result,null,2));
 }catch(e){console.error('MID Cleaner read-only intake blocked:',e.message);process.exitCode=1;}
}
