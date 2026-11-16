/**
 * MID Design 1.8: read-only CSSOM computed-style comparison evidence.
 * A matching snapshot is NEVER a source/release, WebKit or whole-app parity pass.
 */
const SHA40=/^[a-f0-9]{40}$/, SHA64=/^[a-f0-9]{64}$/;
export const STYLE_PROPERTIES=Object.freeze([
 'display','visibility','position','color','background-color','border-color',
 'font-family','font-size','font-weight','line-height','letter-spacing',
 'width','height','min-width','min-height','max-width','max-height',
 'margin-left','margin-right','padding-left','padding-right',
 'overflow-x','overflow-y','white-space','grid-template-columns',
 'flex-direction','opacity','transform','z-index',
]);
export const WEATHER_TOKENS=Object.freeze([
 '--param-temperature','--param-temperature-min','--param-temperature-max',
 '--param-precipitation','--param-pressure','--param-wind','--param-gust',
 '--param-cloud','--param-sunshine',
]);
const fail=message=>{throw Error('MID Design18 CSSOM: '+message)};
const object=(value,label)=>{if(!value||typeof value!=='object'||Array.isArray(value))fail(label+' must be an object');return value};
const finite=(v,label)=>{if(typeof v!=='number'||!Number.isFinite(v))fail(label+' is missing or nonfinite');return v};
const positive=(v,label)=>{if(finite(v,label)<=0)fail(label+' must be positive');return v};
const label=(v,name)=>{if(typeof v!=='string'||!v.trim()||v.length>160)fail(name+' invalid');return v};
function identity(value){
 const v=object(value,'identity');
 if(!SHA40.test(v.sourceGitSha??'')||!SHA64.test(v.assetsSha256??'')||
    !/^\d+\.\d+\.\d+\.\d+$/.test(v.version??''))fail('complete build identity required');
 return v;
}
export function validateCssomCase(value){
 const v=object(value,'case');
 if(v.schema!=='mid.design18.cssom-case.v1'||v.status!=='READ_ONLY_BROWSER_OBSERVATION')
  fail('unrecognized case schema/status');
 identity(v.identity);
 const e=object(v.environment,'environment');
 for(const key of ['caseId','browserVersion'])label(e[key],key);
 if(e.browser!=='chromium'||!SHA64.test(e.fixtureSha256??'')||
    (e.theme!=='light'&&e.theme!=='dark'))fail('browser, fixture or theme invalid');
 if(!Number.isSafeInteger(e.width)||e.width<240||e.width>4096||
    !Number.isSafeInteger(e.height)||e.height<240||e.height>4096)
   fail('viewport dimensions invalid');
 positive(e.devicePixelRatio,'devicePixelRatio');
 const ready=object(v.readiness,'readiness');
 if(ready.readySelectorMatched!==1||ready.fontsStatus!=='loaded'||
    !Number.isSafeInteger(ready.styleSheetCount)||ready.styleSheetCount<1)
   fail('view, fonts or stylesheets not proven ready');
 const root=object(v.rootTokens,'rootTokens');
 for(const p of WEATHER_TOKENS)if(typeof root[p]!=='string'||!root[p].trim())fail('missing weather token: '+p);
 if(!Array.isArray(v.elements)||v.elements.length<1||v.elements.length>64)
  fail('bounded target list required');
 const seen=new Set();
 for(const el of v.elements){
  object(el,'element');label(el.id,'element id');
  if(seen.has(el.id))fail('duplicate element id');seen.add(el.id);
  const rect=object(el.rect,'rect');
  for(const p of ['x','y','width','height'])finite(rect[p],'rect.'+p);
  if(rect.width<=0||rect.height<=0)fail('invisible or collapsed target: '+el.id);
  const styles=object(el.computed,'computed style');
  if(Object.keys(styles).length!==STYLE_PROPERTIES.length)fail('incomplete computed-style inventory');
  for(const p of STYLE_PROPERTIES)if(typeof styles[p]!=='string'||!styles[p].trim())
   fail('missing computed property '+el.id+':'+p);
  if(styles.display==='none'||styles.visibility==='hidden')fail('hidden target: '+el.id);
 }
 return v;
}
export async function captureCssomCase(page,{buildIdentity,caseId,fixtureSha256,theme,readySelector,targets}){
 identity(buildIdentity);label(caseId,'caseId');label(readySelector,'readySelector');
 if(!SHA64.test(fixtureSha256??'')||(theme!=='light'&&theme!=='dark'))
  fail('explicit fixture fingerprint and light/dark required');
 if(!Array.isArray(targets)||targets.length<1||targets.length>64)
  fail('1-64 declared visible element targets required');
 const ids=new Set();
 for(const target of targets){
  object(target,'target');label(target.id,'target id');label(target.selector,'target selector');
  if(ids.has(target.id))fail('duplicate declared target');ids.add(target.id);
 }
 if(typeof page?.evaluate!=='function'||typeof page?.locator!=='function')fail('real Playwright Page required');
 await page.locator(readySelector).waitFor({state:'visible',timeout:30000});
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
 });
 const measured=await page.evaluate(({readySelector,targets,properties,tokens})=>{
  const rectOf=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
  const match=document.querySelectorAll(readySelector);
  return {
   environment:{width:window.innerWidth,height:window.innerHeight,devicePixelRatio:window.devicePixelRatio},
   readiness:{readySelectorMatched:match.length,fontsStatus:document.fonts.status,styleSheetCount:document.styleSheets.length},
   rootTokens:Object.fromEntries(tokens.map(p=>[p,getComputedStyle(document.documentElement).getPropertyValue(p).trim()])),
   elements:targets.map(({id,selector})=>{
    const found=document.querySelectorAll(selector);
    if(found.length!==1)return {id,found:found.length};
    const el=found[0],style=getComputedStyle(el);
    return {id,rect:rectOf(el),computed:Object.fromEntries(properties.map(p=>[p,style.getPropertyValue(p).trim()]))};
   }),
  };
 },{readySelector,targets,properties:STYLE_PROPERTIES,tokens:WEATHER_TOKENS});
 const size=page.viewportSize?.(),browser=page.context?.().browser?.();
 if(!size||!browser||size.width!==measured.environment.width||size.height!==measured.environment.height)
  fail('real browser or exact responsive viewport mismatch');
 const snapshot={
  schema:'mid.design18.cssom-case.v1',status:'READ_ONLY_BROWSER_OBSERVATION',
  releaseAuthorized:false,wholeAppParityProven:false,
  identity:{sourceGitSha:buildIdentity.sourceGitSha,version:buildIdentity.version,assetsSha256:buildIdentity.assetsSha256},
  environment:{...measured.environment,browser:'chromium',browserVersion:browser.version(),caseId,fixtureSha256,theme},
  readiness:measured.readiness,rootTokens:measured.rootTokens,elements:measured.elements,
 };
 return validateCssomCase(snapshot);
}
export function compareCssomCases({stable,candidate,requiredCaseIds}){
 if(!Array.isArray(requiredCaseIds)||requiredCaseIds.length<2||
    requiredCaseIds.some(x=>typeof x!=='string'||!x.trim())||
    new Set(requiredCaseIds).size!==requiredCaseIds.length)fail('explicit unique >=2-case manifest required');
 const a=new Map(),b=new Map();
 for(const [rows,map,name] of [[stable,a,'stable'],[candidate,b,'candidate']]){
  if(!Array.isArray(rows)||rows.length!==requiredCaseIds.length)fail(name+' case-count mismatch');
  for(const item of rows){
   const v=validateCssomCase(item),k=v.environment.caseId;
   if(map.has(k)||!requiredCaseIds.includes(k))fail(name+' duplicate or unexpected case '+k);
   map.set(k,v);
  }
  if(requiredCaseIds.some(id=>!map.has(id)))fail(name+' missing required responsive/theme/view case');
 }
 const first=requiredCaseIds[0],stableIdentity=a.get(first).identity,candidateIdentity=b.get(first).identity;
 if(stableIdentity.sourceGitSha===candidateIdentity.sourceGitSha)fail('identical source SHA cannot be A/B');
 for(const caseId of requiredCaseIds){
  for(const [item,expected,name] of [[a.get(caseId),stableIdentity,'stable'],[b.get(caseId),candidateIdentity,'candidate']]){
   for(const field of ['sourceGitSha','assetsSha256','version'])
    if(item.identity[field]!==expected[field])fail(name+' cross-case build identity drift: '+caseId+'/'+field);
  }
 }
 const differences=[];let differenceCount=0;
 function different(caseId,target,property,oldValue,newValue){
  differenceCount++;
  if(differences.length<150)differences.push({caseId,target,property,stable:oldValue,candidate:newValue});
 }
 const envKeys=['browser','browserVersion','caseId','fixtureSha256','theme','width','height','devicePixelRatio'];
 for(const caseId of requiredCaseIds){
  const left=a.get(caseId),right=b.get(caseId);
  if(left.identity.sourceGitSha===right.identity.sourceGitSha)fail('identical source SHA cannot be A/B');
  for(const key of envKeys)if(left.environment[key]!==right.environment[key])
   fail(caseId+' environment mismatch: '+key);
  if(left.elements.length!==right.elements.length)fail(caseId+' target inventory mismatch');
  for(const token of WEATHER_TOKENS)
   if(left.rootTokens[token]!==right.rootTokens[token])
    different(caseId,':root',token,left.rootTokens[token],right.rootTokens[token]);
  for(let i=0;i<left.elements.length;i++){
   const x=left.elements[i],y=right.elements[i];
   if(x.id!==y.id)fail(caseId+' selector inventory/order mismatch');
   for(const p of STYLE_PROPERTIES)if(x.computed[p]!==y.computed[p])
    different(caseId,x.id,p,x.computed[p],y.computed[p]);
   for(const p of ['x','y','width','height'])if(x.rect[p]!==y.rect[p])
    different(caseId,x.id,'rect.'+p,x.rect[p],y.rect[p]);
  }
 }
 return {
  schema:'mid.design18.cssom-pair.v1',
  status:differenceCount?'CSSOM_DIFFERENCES_OBSERVED':'SELECTED_CSSOM_VALUES_MATCH_ONLY',
  releaseAuthorized:false,cssSplitSafeProven:false,wholeAppParityProven:false,
  stableSha:a.get(requiredCaseIds[0]).identity.sourceGitSha,
  candidateSha:b.get(requiredCaseIds[0]).identity.sourceGitSha,
  requiredCaseIds,differenceCount,differences,truncated:differenceCount>differences.length,
  limitations:['Only explicitly selected visible DOM elements, properties and responsive cases are compared.',
   'Capture provenance, original provider responses, full pixels/SVG/exports and CSS load timing need independent review.',
   'No WebKit/iOS/VoiceOver, performance, memory or release-gate qualification.'],
 };
}
