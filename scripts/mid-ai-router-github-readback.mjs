/**
 * MID AI Router: fixed-origin GitHub source-of-truth readback.
 * Server-side only; no credentials, model calls, writes or releases.
 * The protected executor MUST use this helper, not an untrusted
 * caller-supplied snapshot, for trustedSourceReadback.
 *
 * Every ref must be live; every version mirror is pinned to the same
 * immutable Git commit. Missing/invalid GitHub evidence fails closed.
 */
import {MidAiRouterBlocked} from './mid-ai-router.mjs';

const SHA=/^[a-f0-9]{40}$/;
const VERSION=/^0\.\d+\.\d+\.\d+$/;
const API='https://api.github.com/repos/MeteoMartini/MID/git/ref/heads/';
const RAW='https://raw.githubusercontent.com/MeteoMartini/MID/';
const DOCS=Object.freeze(['package.json','MID_BASELINE.json','contracts/index.json']);
const deny=reason=>{throw new MidAiRouterBlocked(reason);};

async function boundedText(response,limit){
  if(!response||response.ok!==true)deny('SOURCE_READBACK_HTTP_ERROR');
  const claimed=response.headers?.get?.('content-length');
  if(claimed!=null && claimed!==''){
    const n=Number(claimed);
    if(!Number.isSafeInteger(n)||n<0||n>limit)deny('SOURCE_READBACK_SIZE');
  }
  if(!response.body||typeof response.body.getReader!=='function')
    deny('SOURCE_READBACK_UNSTREAMED');
  const reader=response.body.getReader();
  const decoder=new TextDecoder('utf-8',{fatal:true});
  let len=0,body='';
  try{
    while(true){
      const part=await reader.read();
      if(part.done)break;
      if(!(part.value instanceof Uint8Array))deny('SOURCE_READBACK_INVALID_CHUNK');
      len+=part.value.byteLength;
      if(len>limit)deny('SOURCE_READBACK_SIZE');
      body+=decoder.decode(part.value,{stream:true});
    }
    body+=decoder.decode();
  }catch(e){
    try{await reader.cancel();}catch{/**/}
    if(e instanceof MidAiRouterBlocked)throw e;
    deny('SOURCE_READBACK_INVALID_BODY');
  }finally{reader.releaseLock();}
  return body;
}

async function readJson(fetchImpl,url,limit,accept){
  let response;
  try{
    response=await fetchImpl(url,{
      method:'GET',redirect:'error',cache:'no-store',credentials:'omit',
      headers:{accept,'user-agent':'MID-AI-Router-Source-Readback/1'},
      signal:AbortSignal.timeout(8000)
    });
  }catch{deny('SOURCE_READBACK_UNAVAILABLE');}
  const payload=await boundedText(response,limit);
  try{return JSON.parse(payload);}catch{deny('SOURCE_READBACK_INVALID_JSON');}
}

export async function readMidGithubSourceSnapshot({fetchImpl}={}){
  if(typeof fetchImpl!=='function')deny('SOURCE_READBACK_TRANSPORT_REQUIRED');
  const start=Date.now();
  const [main,stable]=await Promise.all([
    readJson(fetchImpl,API+'main',8192,'application/vnd.github+json'),
    readJson(fetchImpl,API+'mid-stable',8192,'application/vnd.github+json')
  ]);
  const mainSha=main?.object?.sha,stableSha=stable?.object?.sha;
  if(!SHA.test(mainSha||'')||!SHA.test(stableSha||'')||
      mainSha!==stableSha)deny('SOURCE_DRIFT');
  // Never fetch version mirrors by mutable branch name after the ref check.
  const [pkg,baseline,contracts]=await Promise.all(DOCS.map(path=>
    readJson(fetchImpl,RAW+stableSha+'/'+path,1024*1024,'application/json')));
  if(!VERSION.test(pkg?.version||'')||
      pkg.version!==baseline?.releaseVersion||
      pkg.version!==contracts?.releaseVersion)deny('VERSION_MIRROR_DRIFT');
  // Recheck both mutable refs after reading immutable version mirrors.
  // A promotion or in-progress source merge during the HTTP round trip must
  // not produce a seemingly current snapshot, even if versions still match.
  const [finalMain,finalStable]=await Promise.all([
    readJson(fetchImpl,API+'main',8192,'application/vnd.github+json'),
    readJson(fetchImpl,API+'mid-stable',8192,'application/vnd.github+json')
  ]);
  if(finalMain?.object?.sha!==mainSha||finalStable?.object?.sha!==stableSha)
    deny('SOURCE_DRIFT_DURING_READBACK');
  const end=Date.now();
  if(end-start>30000)deny('SOURCE_READBACK_STALE');
  return Object.freeze({
    mainSha,stableSha,version:pkg.version,
    versionMirrors:Object.freeze({
      package:pkg.version,
      baseline:baseline.releaseVersion,
      registry:contracts.releaseVersion
    }),
    checkedAt:new Date(end).toISOString()
  });
}
