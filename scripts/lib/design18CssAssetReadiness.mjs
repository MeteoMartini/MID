/**
 * Design 1.8: independent production CSS load/readiness evidence.
 * An observed CSS link alone is not proof that the CSS bytes match the source build.
 * No mutation of app CSS, network interception, browser policy or release gates.
 */
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {verifyStartupBuildIdentity} from './verifyStartupBuildIdentity.mjs';

const sha40=/^[0-9a-f]{40}$/, sha64=/^[0-9a-f]{64}$/;
const fail=reason=>{throw Error('MID CSS load evidence: '+reason)};
const obj=(v,desc)=>{if(!v||typeof v!=='object'||Array.isArray(v))fail(desc+' not an object');return v};
const validId=v=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(v);
const validPath=v=>typeof v==='string'&&/^assets\/[a-zA-Z0-9._/-]+\.css$/.test(v)&&
 !v.includes('..')&&!v.includes('//')&&!v.includes('/./');
const digest=b=>createHash('sha256').update(b).digest('hex');

export function validateExpectedCssAssets(assets){
 if(!Array.isArray(assets)||assets.length<1||assets.length>64)fail('expected CSS list must contain 1–64 assets');
 const ids=new Set(),paths=new Set();
 return assets.map(value=>{
  const v=obj(value,'expected asset');
  if(!validId(v.role)||!validPath(v.path)||!sha64.test(v.sha256??''))
   fail('invalid CSS asset role/path/hash');
  if(ids.has(v.role)||paths.has(v.path))fail('duplicate CSS role or path');
  ids.add(v.role);paths.add(v.path);
  if(Object.keys(v).some(key=>!['role','path','sha256'].includes(key)))
   fail('unexpected CSS manifest field');
  return {role:v.role,path:v.path,sha256:v.sha256};
 });
}
export async function verifyCssManifestAgainstDist(root,identity,assets){
 const id=obj(identity,'identity'),expected=validateExpectedCssAssets(assets);
 if(id.schema!=='mid.web-build-identity.v1'||!sha40.test(id.sourceGitSha??'')||!sha64.test(id.assetsSha256??''))
  fail('exact production build identity required');
 await verifyStartupBuildIdentity(resolve(root),id);
 const version=JSON.parse(await readFile(join(resolve(root),'version.json'),'utf8'));
 if(version.version!==id.version)fail('version.json identity drift');
 const html=await readFile(join(resolve(root),'index.html'),'utf8');
 const inlineStyleSha256=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)]
  .map(match=>digest(Buffer.from(match[1],'utf8')));
 if(inlineStyleSha256.length>32||new Set(inlineStyleSha256).size!==inlineStyleSha256.length)
  fail('unbounded or ambiguous inline HTML CSS inventory');
 for(const asset of expected){
  let data;
  try{data=await readFile(join(resolve(root),asset.path))}catch{fail('missing declared dist CSS: '+asset.role)}
  if(digest(data)!==asset.sha256)fail('declared CSS hash differs from verified dist: '+asset.role);
 }
 return {schema:'mid.design18.css-dist-manifest.v1',identity:{
  sourceGitSha:id.sourceGitSha,version:id.version,assetsSha256:id.assetsSha256,
 },assets:expected,inlineStyleSha256,verified:true};
}
function normalizedBrowserPath(url,origin){
 try{
  const u=new URL(url,origin);
  if(u.origin!==origin||u.search||u.hash)return null;
  const path=decodeURIComponent(u.pathname).replace(/^\/+/,'');
  return validPath(path)?path:null;
 }catch{return null}
}
export function verifyCssLoadReadiness({manifest,responses,frames,origin}){
 const m=obj(manifest,'manifest'),id=obj(m.identity,'manifest identity');
 if(m.schema!=='mid.design18.css-dist-manifest.v1'||m.verified!==true||
    !sha40.test(id.sourceGitSha??'')||!sha64.test(id.assetsSha256??'')||
    !/^\d+\.\d+\.\d+\.\d+$/.test(id.version??''))
  fail('unverified production CSS manifest');
 const assets=validateExpectedCssAssets(m.assets);
 if(!Array.isArray(m.inlineStyleSha256)||m.inlineStyleSha256.length>32||
    m.inlineStyleSha256.some(hash=>!sha64.test(hash))||
    new Set(m.inlineStyleSha256).size!==m.inlineStyleSha256.length)
  fail('incomplete or duplicate fingerprinted HTML inline CSS inventory');
 const u=new URL(origin);
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash||
    u.pathname!=='/'||u.origin!==origin)fail('exact local test origin required');
 if(!Array.isArray(responses)||!Array.isArray(frames)||frames.length!==2)fail('two DOM observations and network evidence required');
 const expected=new Map(assets.map(a=>[a.path,a]));
 const network=new Map();
 for(const response of responses){
  const r=obj(response,'response');
  if(!validPath(r.path)||!expected.has(r.path))fail('undeclared stylesheet response');
  if(network.has(r.path))fail('duplicate/ambiguous stylesheet response');
  if(r.status!==200||!sha64.test(r.bodySha256??'')||r.bodySha256!==expected.get(r.path).sha256)
   fail('HTTP status, body or hash mismatch for '+r.path);
  network.set(r.path,r);
 }
 if(network.size!==expected.size)fail('missing expected CSS HTTP response');
 const comparable=[];
 for(const [i,frame] of frames.entries()){
  const v=obj(frame,'DOM snapshot');
  if(v.fontsStatus!=='loaded'||!Array.isArray(v.stylesheets)||v.stylesheets.length!==assets.length+m.inlineStyleSha256.length)
   fail('fonts not loaded or incomplete CSSOM inventory');
  if(v.adoptedStyleSheetCount!==0)fail('constructed CSS sheets not covered');
  const matches=new Map(),inlines=new Set(),rows=[];
  for(const sheet of v.stylesheets){
   const x=obj(sheet,'DOM stylesheet');
   if(!Number.isSafeInteger(x.ruleCount)||x.ruleCount<1||
      x.disabled!==false||x.readable!==true)
    fail('unreadable, disabled or empty CSSOM sheet');
   if(x.kind==='inline'){
    if(!sha64.test(x.sha256??'')||!m.inlineStyleSha256.includes(x.sha256)||
       inlines.has(x.sha256))fail('unverified or duplicate inline stylesheet');
    inlines.add(x.sha256);rows.push({inlineSha256:x.sha256,ruleCount:x.ruleCount});
   }else if(x.kind==='external'){
    if(!validPath(x.path)||!expected.has(x.path)||matches.has(x.path))
     fail('undeclared or duplicate external CSSOM sheet');
    matches.set(x.path,x);rows.push({path:x.path,ruleCount:x.ruleCount});
   }else fail('unrecognized CSS stylesheet origin');
  }
  if(matches.size!==expected.size||inlines.size!==m.inlineStyleSha256.length)
   fail('missing expected external or inline CSSOM sheet');
  comparable.push(rows);
 }
 if(JSON.stringify(comparable[0])!==JSON.stringify(comparable[1]))
  fail('stylesheet order/rule count changed during two-frame sample');
 return {
  schema:'mid.design18.css-load-readiness.v1',
  status:'DECLARED_CSS_HTTP_AND_CSSOM_OBSERVED_ONLY',
  releaseAuthorized:false,cssSplitSafeProven:false,performanceGainProven:false,
  identity:m.identity,requiredAssetCount:assets.length,
  roles:assets.map(a=>a.role),orderedStylesheets:comparable[0],
  caveat:'Only declared CSS, exact captured HTTP bodies, and two DOM observations are verified. No future async style, pixels, provider, WebKit, or release proof.',
 };
}
/**
 * Attach BEFORE the first app navigation; finish AFTER the target view is visible.
 * Missing body, cached response, cross-origin CSS or new late sheets aborts the proof.
 * Never call browser networkidle or bypass browser sandboxing.
 */
export function observeCssResponses(page,{manifest,origin}){
 if(typeof page?.on!=='function'||typeof page?.off!=='function'||
    typeof page?.evaluate!=='function')fail('Playwright Page event/evaluate API required');
 const m=obj(manifest,'manifest');
 const expected=validateExpectedCssAssets(m.assets),tasks=[],responses=[],invalid=[];
 const allowed=new Set(expected.map(a=>a.path)),requests=new Map();
 let listening=true,finalizing=false;
 const resourceIsCss=request=>{
  if(!request)return false;
  let type='',url='';
  try{type=request.resourceType?.()??'';url=request.url()}catch{return false}
  return type==='stylesheet'||/\.css(?:[?#]|$)/i.test(url);
 };
 const handleRequest=request=>{
  if(!listening||!resourceIsCss(request))return;
  if(requests.has(request)){invalid.push('duplicated stylesheet request event');return}
  const path=normalizedBrowserPath(request.url(),origin);
  if(!path||!allowed.has(path))invalid.push('CSS request outside declared original asset inventory');
  requests.set(request,{path,responded:false,finished:false,failed:false});
 };
 const handleResponse=response=>{
  if(!listening)return;
  let request,header='';
  try{
   request=response.request();
   header=response.headers?.()['content-type']??'';
  }catch{invalid.push('CSS response has unreadable request identity');return}
  if(!resourceIsCss(request)&&!/^text\/css(?:;|$)/i.test(header.trim()))return;
  const state=requests.get(request);
  if(!state||state.responded){invalid.push('untracked or duplicate CSS response');return}
  state.responded=true;
  tasks.push((async()=>{
   if(!state.path||!allowed.has(state.path))return;
   if(typeof response.finished!=='function'||typeof response.body!=='function')
    {invalid.push('CSS response completion/body API unavailable');return}
   if(response.fromServiceWorker?.()===true)
    {invalid.push('Service Worker response is not proven original HTTP');return}
   const completion=await response.finished();
   if(completion){invalid.push('CSS response failed before download completion');return}
   const body=await response.body();
   if(!Buffer.isBuffer(body)){invalid.push('CSS response must supply original Buffer');return}
   responses.push({path:state.path,status:response.status(),bodySha256:digest(body)});
  })().catch(()=>invalid.push('CSS HTTP response body inaccessible')));
 };
 const handleFinished=request=>{
  if(!listening||!resourceIsCss(request))return;
  const state=requests.get(request);
  if(!state||state.finished){invalid.push('untracked or duplicated CSS request completion');return}
  state.finished=true;
 };
 const handleFailed=request=>{
  if(!listening||!resourceIsCss(request))return;
  const state=requests.get(request);
  if(state)state.failed=true;
  invalid.push('failed or unmatched original CSS request');
 };
 const handlers={
  request:handleRequest,response:handleResponse,requestfinished:handleFinished,requestfailed:handleFailed,
 };
 for(const [name,fn] of Object.entries(handlers))page.on(name,fn);
 const cleanup=()=>{
  if(listening){listening=false;for(const [name,fn] of Object.entries(handlers))page.off(name,fn)}
 };
 return {
  async finish(){
   if(!listening||finalizing)fail('CSS observer already finalized');
   finalizing=true;
   try{
    const frames=[];
    for(let i=0;i<2;i++){
     // Bounded settling interval, not networkidle and never evidence of future requests.
     if(i===1)await new Promise(ok=>setTimeout(ok,200));
     const state=await page.evaluate(async ({origin})=>{
      await document.fonts.ready;
      await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
      const stylesheets=[];
      for(const sheet of document.styleSheets){
       let path=null,inlineHash=null,kind=null,readable=false,ruleCount=null;
       try{
        if(sheet.href){
         const u=new URL(sheet.href,location.href);
         if(u.origin===origin&&!u.search&&!u.hash){
          path=decodeURIComponent(u.pathname).replace(/^\/+/, '');
          kind='external';
         }
        }else if(sheet.ownerNode?.tagName==='STYLE'){
         const data=new TextEncoder().encode(sheet.ownerNode.textContent??'');
         const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
         inlineHash=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
         kind='inline';
        }
        ruleCount=sheet.cssRules.length;readable=true;
       }catch{}
       stylesheets.push({kind,path,sha256:inlineHash,readable,ruleCount,disabled:sheet.disabled===true});
      }
      return {fontsStatus:document.fonts.status,adoptedStyleSheetCount:document.adoptedStyleSheets.length,stylesheets};
     },{origin});
     frames.push(state);
    }
    let cursor=0;
    while(cursor<tasks.length){
     const next=tasks.slice(cursor);cursor=tasks.length;
     await Promise.all(next);
    }
    if(invalid.length)fail(invalid.join('; '));
    if(requests.size!==allowed.size)fail('CSS request inventory does not match declared assets');
    const paths=new Set();
    for(const state of requests.values()){
     if(!state.path||!allowed.has(state.path)||paths.has(state.path)||
       !state.responded||!state.finished||state.failed)
      fail('incomplete, duplicated or failed CSS request lifecycle');
     paths.add(state.path);
    }
    return verifyCssLoadReadiness({manifest:m,responses,frames,origin});
   }finally{cleanup()}
  },
  cancel(){cleanup()},
 };
}
