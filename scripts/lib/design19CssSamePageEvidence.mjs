/**
 * MID Design 1.9 – read-only single-Page CSS evidence bridge.
 *
 * This calls the existing Design18 original-dist CSS HTTP/CSSOM and computed
 * style observers on ONE real Playwright Page. It does not launch a browser,
 * manipulate app/product files, grant CSS-split safety or authorize release.
 * The three helpers are dependencies to avoid duplicating their logic.
 */
import {isDeepStrictEqual} from 'node:util';

const fail=reason=>{throw Error('MID Design19 CSS same-page: '+reason)};
const object=(value,name)=>{
 if(!value||typeof value!=='object'||Array.isArray(value))fail(name+' must be object');
 return value;
};
const sha40=/^[a-f0-9]{40}$/,sha64=/^[a-f0-9]{64}$/;
const nonblank=v=>typeof v==='string'&&v.trim().length>0&&v.length<160;
const identityFields=['sourceGitSha','version','assetsSha256'];

export function validateDesign19Scenario(value){
 const s=object(value,'scenario');
 if(!nonblank(s.caseId)||!sha64.test(s.fixtureSha256??'')||
    !['light','dark'].includes(s.theme))fail('explicit case, fixture and theme required');
 if(!Number.isSafeInteger(s.width)||s.width<240||s.width>4096||
    !Number.isSafeInteger(s.height)||s.height<240||s.height>4096)
  fail('exact responsive dimensions required');
 if(!nonblank(s.readySelector)||!Array.isArray(s.targets)||s.targets.length<1||s.targets.length>64)
  fail('readySelector and bounded CSS targets required');
 const seen=new Set();
 for(const target of s.targets){
  object(target,'target');
  if(!nonblank(target.id)||!nonblank(target.selector)||seen.has(target.id))
   fail('invalid or duplicate CSS target');
  seen.add(target.id);
 }
 const extras=Object.keys(s).filter(key=>!['caseId','fixtureSha256','theme','width','height','readySelector','targets'].includes(key));
 if(extras.length)fail('unexpected scenario fields (no secrets/user profile)');
 return s;
}
function assertExactIdentity(actual,expected,label){
 const x=object(actual,label);
 for(const field of identityFields)if(x[field]!==expected[field])fail(label+' mismatch: '+field);
}
function requireObservedCssom(row,id,scenario,label,validateCase){
 const v=validateCase(row);
 if(v.status!=='READ_ONLY_BROWSER_OBSERVATION'||v.schema!=='mid.design18.cssom-case.v1'||
    v.releaseAuthorized!==false||v.wholeAppParityProven!==false)
  fail(label+' does not contain a bounded unapproved CSSOM observation');
 assertExactIdentity(v.identity,id,label+'.identity');
 const e=object(v.environment,label+'.environment');
 for(const key of ['caseId','fixtureSha256','theme','width','height']){
  if(e[key]!==scenario[key])fail(label+' scenario drift: '+key);
 }
 if(e.browser!=='chromium'||!nonblank(e.browserVersion)||e.actualTheme!==scenario.theme)
  fail(label+' browser/theme unverified');
 return v;
}
function onlySameOrigin(page,origin,label){
 const current=new URL(page.url());
 if(current.origin!==origin)fail(label+' left local verified origin');
 return current;
}
/**
 * The on-page view action is an explicit trusted fixture callback, not an
 * autonomous navigation or an implied assertion of weather-data stability.
 */
export async function runDesign19CssSamePage({
 page,distRoot,buildIdentity,expectedCssAssets,origin,scenario,openView,
 helpers,
}){
 const s=validateDesign19Scenario(scenario),id=object(buildIdentity,'buildIdentity');
 if(id.schema!=='mid.web-build-identity.v1'||!sha40.test(id.sourceGitSha??'')||
    !sha64.test(id.assetsSha256??'')||!/^\d+\.\d+\.\d+\.\d+$/.test(id.version??''))
  fail('exact source and build fingerprints required');
 const url=new URL(origin);
 if(url.origin!==origin||url.pathname!=='/'||url.search||url.hash||
    url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname))
  fail('browser exercise restricted to explicit local server origin');
 if(typeof distRoot!=='string'||!distRoot.trim()||
    !Array.isArray(expectedCssAssets)||typeof openView!=='function')
  fail('dist, expected CSS and explicit view action required');
 if(!page||typeof page.goto!=='function'||typeof page.addInitScript!=='function'||
    typeof page.url!=='function'||typeof page.viewportSize!=='function'||
    typeof page.context!=='function')fail('real Playwright Page API required');
 const dimensions=page.viewportSize();
 if(dimensions?.width!==s.width||dimensions?.height!==s.height)
  fail('actual browser viewport does not match scenario');
 const h=object(helpers,'versioned Design18 helpers');
 for(const key of ['verifyCssManifestAgainstDist','observeCssResponses','captureCssomCase','validateCssomCase'])
  if(typeof h[key]!=='function')fail('required Design18 helper unavailable: '+key);
 const manifest=await h.verifyCssManifestAgainstDist(distRoot,id,expectedCssAssets);
 if(manifest?.schema!=='mid.design18.css-dist-manifest.v1'||manifest.verified!==true)
  fail('whole dist and CSS manifest not verified');
 assertExactIdentity(manifest.identity,id,'dist.manifest.identity');
 let observer;
 try{
  // Do not navigate until the CSS listener exists. The same Page is passed to
  // both independent Design18 observers to preclude mixed-session results.
  observer=h.observeCssResponses(page,{manifest,origin});
  if(typeof observer?.finish!=='function'||typeof observer?.cancel!=='function')
   fail('CSS response observer does not expose finish/cancel');
  await page.addInitScript(({theme})=>localStorage.setItem('theme',theme),{theme:s.theme});
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  onlySameOrigin(page,origin,'app navigation');
  await openView(page,Object.freeze({caseId:s.caseId,theme:s.theme,fixtureSha256:s.fixtureSha256}));
  onlySameOrigin(page,origin,'view fixture');
  const captureOptions={
   buildIdentity:id,caseId:s.caseId,fixtureSha256:s.fixtureSha256,theme:s.theme,
   readySelector:s.readySelector,targets:s.targets,
  };
  const before=requireObservedCssom(await h.captureCssomCase(page,captureOptions),id,s,'before',h.validateCssomCase);
  const css=await observer.finish();
  if(css?.schema!=='mid.design18.css-load-readiness.v1'||
     css.status!=='DECLARED_CSS_HTTP_AND_CSSOM_OBSERVED_ONLY'||
     css.releaseAuthorized!==false||css.cssSplitSafeProven!==false||
     css.performanceGainProven!==false)
   fail('unverified or over-permissive CSS load result');
  assertExactIdentity(css.identity,id,'CSS HTTP/CSSOM evidence identity');
  if(!Array.isArray(css.orderedStylesheets)||
     css.orderedStylesheets.length!==before.readiness.styleSheetCount)
   fail('captured stylesheet count differs from fully observed applied sheets');
  const after=requireObservedCssom(await h.captureCssomCase(page,captureOptions),id,s,'after',h.validateCssomCase);
  onlySameOrigin(page,origin,'final CSSOM capture');
  if(after.readiness.styleSheetCount!==css.orderedStylesheets.length)
   fail('stylesheet inventory drift after CSS loading evidence');
  if(!isDeepStrictEqual(before.environment,after.environment)||
     !isDeepStrictEqual(before.readiness,after.readiness)||
     !isDeepStrictEqual(before.rootTokens,after.rootTokens)||
     !isDeepStrictEqual(before.elements,after.elements))
   fail('computed style or geometry drift between CSS load completion and final capture');
  return {
   schema:'mid.design19.linked-css-page-observation.v1',
   status:'ONE_PAGE_ONE_WINDOW_DESCRIPTIVE_ONLY',
   releaseAuthorized:false,cssSplitSafeProven:false,performanceGainProven:false,
   browserAcceptanceProven:false, // Real runner still must externally attest browser and frozen provider fixtures.
   caseId:s.caseId,identity:{sourceGitSha:id.sourceGitSha,version:id.version,assetsSha256:id.assetsSha256},
   environment:after.environment,cssLoad:css,cssom:after,
   caveat:'Same Page and bounded CSS time window only. No provider-frozen, cross-browser, GPU, memory, release or future-style proof.',
  };
 }finally{
  // Always shut down listeners, including on failure or navigation block.
  observer?.cancel?.();
 }
}
