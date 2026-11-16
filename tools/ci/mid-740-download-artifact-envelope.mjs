#!/usr/bin/env node
/** MID #740: bounded, read-only download of the original Actions ZIP envelope.
 * Input artifact MUST come from separately authenticated GitHub API readback.
 * Never accepts an arbitrary URL, forwards GitHub tokens to redirects, or
 * authorizes merge/installer/release.
 */
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,mkdtempSync,openSync,closeSync,readFileSync,realpathSync,renameSync,rmSync,writeSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectMid740GitHubReadback} from './mid-740-github-artifact-readback.mjs';
import {execFileSync} from 'node:child_process';

const REPO='MeteoMartini/MID',MAX_BYTES=900*1024*1024;
const API='https://api.github.com/repos/'+REPO+'/actions/artifacts/';
const SHA256=/^sha256:[a-f0-9]{64}$/;
const reject=code=>{throw Error('MID_740_'+code)};
function safeRedirect(raw){
 let url;
 try{url=new URL(raw)}catch{reject('BAD_REDIRECT_URL')}
 const h=url.hostname.toLowerCase();
 // GitHub Actions signed artifact URLs currently use GitHub-owned hosts
 // or Microsoft Azure blob storage. Unknown hosts block until a verified
 // provider migration is explicitly reviewed.
 const allowed=h.endsWith('.blob.core.windows.net')||
  h.endsWith('.actions.githubusercontent.com')||
  h.endsWith('.githubusercontent.com');
 if(url.protocol!=='https:'||url.username||url.password||url.port||!allowed||
    url.hash)reject('UNTRUSTED_REDIRECT');
 return url.href;
}
function safeOutput(p){
 const output=resolve(p),parent=dirname(output);
 if(!parent||!existsSync(parent)||lstatSync(parent).isSymbolicLink()||
   realpathSync(parent)!==parent||existsSync(output))reject('UNSAFE_OUTPUT_PATH');
 return {output,parent};
}
export async function downloadMid740Envelope({artifact,output,token}={},
 fetcher=fetch){
 if(!Number.isSafeInteger(artifact?.id)||artifact.id<=0||
    artifact.url!==API+artifact.id||
    artifact.archive_download_url!==API+artifact.id+'/zip'||
    !SHA256.test(artifact.digest??'')||
    !Number.isSafeInteger(artifact.size_in_bytes)||artifact.size_in_bytes<=0||
    artifact.size_in_bytes>MAX_BYTES||artifact.expired!==false||
    typeof token!=='string'||token.length<8||typeof fetcher!=='function')
  reject('UNTRUSTED_ARTIFACT_INPUT');
 const {output:out,parent}=safeOutput(output);
 const staging=mkdtempSync(join(parent,'.mid740-download-'));
 const temp=join(staging,'original-actions-envelope.zip');
 let fd=null;
 try{
  const apiResponse=await fetcher(API+artifact.id+'/zip',{
   method:'GET',redirect:'manual',headers:{
    Accept:'application/vnd.github+json',
    Authorization:'Bearer '+token
   },signal:AbortSignal.timeout(120000)
  });
  if(apiResponse?.status!==302)reject('EXPECTED_GITHUB_302');
  const signed=safeRedirect(apiResponse.headers?.get('location'));
  let target=signed,response;
  for(let attempt=0;attempt<3;attempt++){
   response=await fetcher(target,{
    method:'GET',redirect:'manual',
    // No Authorization header is ever forwarded to an artifact CDN host.
    signal:AbortSignal.timeout(120000)
   });
   if(response?.status===200)break;
   if(response?.status!==302||attempt===2)reject('UNEXPECTED_CDN_RESPONSE');
   target=safeRedirect(response.headers?.get('location'));
  }
  if(response?.status!==200||!response.body)reject('MISSING_DOWNLOAD_BODY');
  const claimed=Number(response.headers?.get('content-length'));
  if(Number.isFinite(claimed)&&claimed>0&&claimed!==artifact.size_in_bytes)
   reject('CDN_LENGTH_MISMATCH');
  const hasher=createHash('sha256');
  fd=openSync(temp,'wx',0o600);
  let bytes=0;
  for await(const chunk of response.body){
   if(!(chunk instanceof Uint8Array))reject('UNEXPECTED_DOWNLOAD_CHUNK');
   bytes+=chunk.byteLength;
   if(bytes>MAX_BYTES||bytes>artifact.size_in_bytes)reject('OVERSIZED_DOWNLOAD');
   hasher.update(chunk);
   writeSync(fd,chunk);
  }
  closeSync(fd);fd=null;
  const digest=hasher.digest('hex');
  if(bytes!==artifact.size_in_bytes||digest!==artifact.digest.slice(7))
   reject('DOWNLOAD_ENVELOPE_SHA256_MISMATCH');
  if(existsSync(out))reject('OUTPUT_PATH_RACE');
  renameSync(temp,out);
  return Object.freeze({schema:'mid.740.download-envelope.v1',
   artifactId:artifact.id,envelopeSha256:digest,bytes,
   downloadedEnvelopeBytesVerified:true,authenticatedGitHubProducer:false,
   installerAuthorized:false,releaseAuthorized:false});
 }finally{
  if(fd!==null)closeSync(fd);
  rmSync(staging,{recursive:true,force:true});
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [r,a,source,workflow,output,...extra]=process.argv.slice(2);
  if(extra.length||!/^[1-9][0-9]*$/.test(r??'')||!/^[1-9][0-9]*$/.test(a??''))
   reject('BAD_CLI_ARGS');
  const get=path=>{
   try{return JSON.parse(execFileSync('gh',['api','--method','GET',path],{
    encoding:'utf8',timeout:25000,maxBuffer:3*1024*1024,
    stdio:['ignore','pipe','ignore']
   }));}catch{reject('TRUSTED_GITHUB_API_FAILED')}
  };
  const result=await collectMid740GitHubReadback({
   runId:Number(r),artifactId:Number(a),
   sourceMergeSha:source,trustedWorkflowSha:workflow
  },get);
  const downloaded=await downloadMid740Envelope({
   artifact:result.artifact,output,
   token:process.env.GH_TOKEN
  });
  // The separate trusted Python verifier must still check the ZIP envelope
  // and Git-tree byte/mode identity before any installer may use these bytes.
  process.stdout.write(JSON.stringify({
   artifactId:downloaded.artifactId,sha256:downloaded.envelopeSha256,
   bytes:downloaded.bytes,installerAuthorized:false,releaseAuthorized:false
  })+'\n');
 }catch(e){
  process.stderr.write((e?.message?.startsWith('MID_740_')?e.message:
   'MID_740_DOWNLOAD_REJECTED')+'\n');
  process.exitCode=1;
 }
}