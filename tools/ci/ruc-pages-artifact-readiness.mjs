// MID: bounded, read-only GitHub Pages artifact visibility preflight.
// Does not deploy, upload, change branch rules, or authorize a release.
import {execFileSync} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {pathToFileURL} from 'node:url';

const DIGEST=/^sha256:[0-9a-f]{64}$/;
const POSITIVE=/^[1-9][0-9]*$/;
export function inspectRucPagesArtifact(payload,name){
 if(!payload||!Number.isSafeInteger(payload.total_count)||payload.total_count<0||
    payload.total_count>100||!Array.isArray(payload.artifacts))throw Error('INCOMPLETE_ARTIFACT_INDEX');
 const hits=payload.artifacts.filter(item=>item?.name===name);
 if(!hits.length)return null;
 if(hits.length!==1)throw Error('DUPLICATE_PAGES_ARTIFACT');
 const item=hits[0];
 if(!Number.isSafeInteger(item.id)||item.id<1||!Number.isSafeInteger(item.size_in_bytes)||
    item.size_in_bytes<1||item.expired!==false||!DIGEST.test(item.digest??''))
  throw Error('INVALID_PAGES_ARTIFACT_METADATA');
 return {id:item.id,size:item.size_in_bytes,digest:item.digest};
}
export async function waitForRucPagesArtifact({read,pauseBetween,name,maxReads=8}){
 if(typeof read!=='function'||typeof pauseBetween!=='function'||
    !/^mid-ruc-pages-(?:rollback-)?[1-9][0-9]*-[1-9][0-9]*$/.test(name??'')||
    !Number.isInteger(maxReads)||maxReads<2||maxReads>8)throw Error('INVALID_PAGES_PREFLIGHT');
 let previous=null;
 for(let count=0;count<maxReads;count++){
  const found=inspectRucPagesArtifact(await read(),name);
  if(previous){
   if(!found||previous.id!==found.id||previous.digest!==found.digest||
      previous.size!==found.size)throw Error('PAGES_ARTIFACT_VISIBILITY_DRIFT');
   return found;
  }
  if(found)previous=found;
  if(count<maxReads-1)await pauseBetween();
 }
 throw Error('PAGES_ARTIFACT_NOT_VISIBLE');
}
async function run(){
 const run=process.env.GITHUB_RUN_ID,attempt=process.env.GITHUB_RUN_ATTEMPT;
 if(process.env.GITHUB_REPOSITORY!=='MeteoMartini/MID'||!POSITIVE.test(run??'')||
    !POSITIVE.test(attempt??'')||!(process.env.GH_TOKEN?.length>10))throw Error('UNVERIFIED_GITHUB_CONTEXT');
 const mode=process.argv[2];
 if(!['normal','rollback'].includes(mode))throw Error('INVALID_ARTIFACT_MODE');
 const name='mid-ruc-pages-'+(mode==='rollback'?'rollback-':'')+run+'-'+attempt;
 const read=()=>{
  // This is the exact current workflow run; no cross-run artifact search/reuse.
  const output=execFileSync('gh',['api','--method','GET',
   'repos/MeteoMartini/MID/actions/runs/'+run+'/artifacts?per_page=100'],
   {encoding:'utf8',timeout:20000,maxBuffer:5_000_000,stdio:['ignore','pipe','pipe']});
  return JSON.parse(output);
 };
 const found=await waitForRucPagesArtifact({read,pauseBetween:()=>pause(4000),name});
 process.stdout.write('Verified current-run Pages artifact '+name+
  ' id='+found.id+' bytes='+found.size+' '+found.digest+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{await run()}catch(error){
  console.error('RUC Pages artifact readiness BLOCKED: '+(error?.message??'UNKNOWN'));
  process.exitCode=1;
 }
}
