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
 for(const asset of expected){
  let data;
  try{data=await readFile(join(resolve(root),asset.path))}catch{fail('missing declared dist CSS: '+asset.role)}
  if(digest(data)!==asset.sha256)fail('declared CSS hash differs from verified dist: '+asset.role);
 }
 return {schema:'mid.design18.css-dist-manifest.v1',identity:{
  sourceGitSha:id.sourceGitSha,version:id.version,assetsSha256:id.assetsSha256,
 },assets:expected,verified:true};
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
  if(v.fontsStatus!=='loaded'||!Array.isArray(v.stylesheets)||v.stylesheets.length<assets.length)
   fail('fonts not loaded or incomplete CSSOM inventory');
  if(v.adoptedStyleSheetCount!==0)fail('constructed CSS sheets not covered');
  const matches=new Map(),rows=[];
  for(const sheet of v.stylesheets){
   const s=obj(sheet,'DOM stylesheet');
   if(!validPath(s.path)||!expected.has(s.path))fail('undeclared, missing-origin or inline CSS sheet');
   if(matches.has(s.path)||!Number.isSafeInteger(s.ruleCount)||s.ruleCount<1||
      s.disabled!==false||s.readable!==true)
    fail('duplicate, unreadable, disabled or empty CSSOM sheet');
   matches.set(s.path,s);rows.push({path:s.path,ruleCount:s.ruleCount});
  }
  if(matches.size!==expected.size)fail('missing expected CSSOM sheet');
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
 const allowed=new Set(expected.map(a=>a.path));
 let listening=true;
 const handler=response=>{
  if(!listening)return;
  const path=normalizedBrowserPath(response.url(),origin);
  if(!path)return;
  // All CSS assets in this scope must be declared, not just the passing subset.
  tasks.push((async()=>{
   if(!allowed.has(path)){invalid.push('undeclared CSS request');return}
   const status=response.status();
   let bytes;
   try{bytes=await response.body()}catch{invalid.push('CSS response body inaccessible');return}
   responses.push({path,status,bodySha256:digest(bytes)});
  })().catch(()=>invalid.push('unreadable CSS HTTP response')));
 };
 page.on('response',handler);
 return {
  async finish(){
   if(!listening)fail('CSS observer already finalized');
   listening=false;page.off('response',handler);
   await Promise.all(tasks);
   if(invalid.length)fail(invalid.join('; '));
   const frames=[];
   for(let i=0;i<2;i++){
    const state=await page.evaluate(async ({origin})=>{
     await document.fonts.ready;
     await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
     const stylesheets=[];
     for(const sheet of document.styleSheets){
      let path=null,readable=false,ruleCount=null;
      try{
       const u=new URL(sheet.href||'',location.href);
       if(u.origin===origin&&!u.search&&!u.hash)
        path=decodeURIComponent(u.pathname).replace(/^\/+/,'');
       ruleCount=sheet.cssRules.length;readable=true;
      }catch{}
      stylesheets.push({path,readable,ruleCount,disabled:sheet.disabled===true});
     }
     return {fontsStatus:document.fonts.status,adoptedStyleSheetCount:document.adoptedStyleSheets.length,stylesheets};
    },{origin});
    frames.push(state);
   }
   return verifyCssLoadReadiness({manifest:m,responses,frames,origin});
  },
  cancel(){if(listening){listening=false;page.off('response',handler)}},
 };
}
