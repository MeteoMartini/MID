/**
 * MID Design 1.9: bounded browser reflow/text-integrity evidence.
 * A passing selected-layout observation is NOT WCAG certification, full-browser
 * acceptance, iOS/VoiceOver proof, CSS-split approval or release authorization.
 */
import {createHash} from 'node:crypto';

const SHA40=/^[0-9a-f]{40}$/,SHA64=/^[0-9a-f]{64}$/;
const fail=message=>{throw Error('MID Design19 reflow: '+message)};
const object=(value,name)=>{
 if(!value||typeof value!=='object'||Array.isArray(value))fail(name+' must be an object');
 return value;
};
const label=(value,name)=>{
 if(typeof value!=='string'||!value.trim()||value.length>160)fail(name+' invalid');
 return value;
};
const integer=(value,name,min,max)=>{
 if(!Number.isSafeInteger(value)||value<min||value>max)fail(name+' invalid');
 return value;
};
const number=(value,name)=>{
 if(typeof value!=='number'||!Number.isFinite(value))fail(name+' nonfinite');
 return value;
};
const digest=value=>createHash('sha256').update(value,'utf8').digest('hex');
function validateIdentity(value){
 const v=object(value,'identity');
 if(!SHA40.test(v.sourceGitSha??'')||!SHA64.test(v.assetsSha256??'')||
  !/^\d+\.\d+\.\d+\.\d+$/.test(v.version??''))fail('complete versioned build identity required');
 return v;
}
export function validateDesign19ReflowCase(value){
 const v=object(value,'case');
 if(v.schema!=='mid.design19.reflow-case.v1'||v.status!=='SELECTED_LAYOUT_OBSERVATION_ONLY'||
    v.releaseAuthorized!==false||v.browserAcceptanceProven!==false||v.wcagCertified!==false)
  fail('schema/status/approval flags invalid');
 validateIdentity(v.identity);
 const e=object(v.environment,'environment');
 label(e.caseId,'caseId');label(e.browserVersion,'browserVersion');
 if(e.browser!=='chromium'||!SHA64.test(e.fixtureSha256??'')||
   !['light','dark'].includes(e.theme)||e.actualTheme!==e.theme)
  fail('browser/fixture/actual DOM theme mismatch');
 integer(e.width,'viewport width',240,4096);integer(e.height,'viewport height',240,4096);
 if(e.textStress!=='normal'&&e.textStress!=='synthetic-200pct-root')fail('undeclared text stress');
 const d=object(v.document,'document');
 for(const k of ['scrollWidth','clientWidth'])integer(d[k],k,0,100000);
 if(d.clientWidth<=0||d.clientWidth>e.width||d.scrollWidth<d.clientWidth)fail('document geometry invalid');
 if(!Array.isArray(v.targets)||v.targets.length===0||v.targets.length>32)fail('1–32 declared targets required');
 const ids=new Set();
 for(const t of v.targets){
  object(t,'target');label(t.id,'target id');
  if(ids.has(t.id))fail('duplicate target id');ids.add(t.id);
  if(!['text','control'].includes(t.kind)||t.found!==1)fail('missing or duplicate target');
  const r=object(t.rect,'rect');
  for(const k of ['x','y','width','height'])number(r[k],'rect.'+k);
  if(r.width<=0||r.height<=0)fail('collapsed target');
  for(const k of ['scrollWidth','clientWidth','scrollHeight','clientHeight'])integer(t[k],k,0,100000);
  if(t.clientWidth<=0||t.clientHeight<=0)fail('unmeasurable target');
  if(t.display==='none'||t.visibility==='hidden')fail('hidden target');
  if(t.kind==='text'){
   if(!SHA64.test(t.textSha256??'')||!Number.isSafeInteger(t.textLength)||t.textLength<=0||
      !Number.isSafeInteger(t.fragmentCount)||t.fragmentCount<1||t.fragmentCount>128||
      typeof t.clippedByAncestor!=='boolean'||typeof t.clippedFragments!=='boolean'||
      !Number.isSafeInteger(t.textNodeCount)||t.textNodeCount<1||t.textNodeCount>256||
      !Number.isSafeInteger(t.hiddenTextNodeCount)||t.hiddenTextNodeCount<0||
      t.hiddenTextNodeCount>t.textNodeCount)
    fail('text/fragments/ancestor evidence incomplete');
  }else if(typeof t.hitTestOk!=='boolean')fail('control hit-test evidence incomplete');
 }
 return v;
}
export function inspectDesign19ReflowCase(value){
 const v=validateDesign19ReflowCase(value),issues=[];
 if(v.document.scrollWidth>v.document.clientWidth+2)
  issues.push({target:'document',reason:'horizontal-document-overflow'});
 for(const t of v.targets){
  if(t.kind==='text'){
   if(t.hiddenTextNodeCount>0)
    issues.push({target:t.id,reason:'hidden-original-text-nodes'});
   if(t.scrollWidth>t.clientWidth+2||t.scrollHeight>t.clientHeight+2||
      t.clippedByAncestor||t.clippedFragments||t.textOverflow==='ellipsis')
    issues.push({target:t.id,reason:'clipped-or-ellipsized-text'});
  }else if(t.rect.width<44||t.rect.height<44||!t.hitTestOk)
   issues.push({target:t.id,reason:'undersized-or-occluded-critical-control'});
  if(t.rect.x<-2||t.rect.x+t.rect.width>v.environment.width+2||
     t.rect.y<-2||t.rect.y+t.rect.height>v.environment.height+2)
   issues.push({target:t.id,reason:'selected-target-outside-viewport'});
 }
 return {status:issues.length?'SELECTED_REFLOW_DEFECTS_OBSERVED':'NO_SELECTED_DEFECT_IN_FINITE_SAMPLE',
   issues,releaseAuthorized:false,browserAcceptanceProven:false,wcagCertified:false};
}
export function compareDesign19ReflowCases({stable,candidate}){
 const a=validateDesign19ReflowCase(stable),b=validateDesign19ReflowCase(candidate);
 if(a.identity.sourceGitSha===b.identity.sourceGitSha)fail('identical source SHA is not an A/B comparison');
 for(const key of ['caseId','browser','browserVersion','fixtureSha256','theme','width','height','textStress'])
  if(a.environment[key]!==b.environment[key])fail('environment mismatch: '+key);
 if(a.targets.length!==b.targets.length)fail('target manifest mismatch');
 const changes=[];
 for(let i=0;i<a.targets.length;i++){
  const x=a.targets[i],y=b.targets[i];
  if(x.id!==y.id||x.kind!==y.kind)fail('target manifest mismatch');
  if(x.kind==='text'&&x.textSha256!==y.textSha256)
   changes.push({target:x.id,reason:'text-content-changed'});
 }
 const before=inspectDesign19ReflowCase(a),after=inspectDesign19ReflowCase(b);
 return {schema:'mid.design19.reflow-comparison.v1',status:'SELECTED_AB_DESCRIPTION_ONLY',
  before:before.issues,after:after.issues,changes,
  releaseAuthorized:false,browserAcceptanceProven:false,wcagCertified:false,
  cssSplitSafeProven:false,performanceGainProven:false};
}
/** Capture requires an externally admitted, sandboxed Playwright Page on a
 * verified original MID view; this helper never opens pages or installs tools. */
export async function captureDesign19ReflowCase(page,{identity,caseId,fixtureSha256,theme,textStress='normal',readySelector,targets}){
 validateIdentity(identity);label(caseId,'caseId');label(readySelector,'readySelector');
 if(!SHA64.test(fixtureSha256??'')||!['light','dark'].includes(theme)||
    !['normal','synthetic-200pct-root'].includes(textStress))fail('scenario invalid');
 if(!Array.isArray(targets)||targets.length<1||targets.length>32)fail('1–32 declared targets required');
 const ids=new Set();
 for(const t of targets){
  object(t,'target');label(t.id,'id');label(t.selector,'selector');
  if(!['text','control'].includes(t.kind)||ids.has(t.id))fail('target manifest invalid');
  ids.add(t.id);
 }
 if(typeof page?.evaluate!=='function'||typeof page?.locator!=='function'||
    typeof page?.viewportSize!=='function'||typeof page?.context!=='function')fail('real Playwright Page API required');
 await page.locator(readySelector).waitFor({state:'visible',timeout:30000});
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));});
 const observed=await page.evaluate(items=>{
  const bound=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
  const textInfo=el=>{
   const range=document.createRange();range.selectNodeContents(el);
   const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
   const clips=rects.some(r=>{const b=el.getBoundingClientRect();return r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2});
   let ancestorClip=false;
   for(let p=el;p&&p!==document.documentElement;p=p.parentElement){
    const s=getComputedStyle(p);
    if(!/(hidden|clip)/.test(s.overflowX+' '+s.overflowY))continue;
    const b=p.getBoundingClientRect();
    if(rects.some(r=>r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2)){ancestorClip=true;break}
   }
   // Range on the entire element can still produce rects while nested text
   // is display:none/visibility:hidden/opacity:0. Count the real text leaves
   // instead; ignore whitespace-only leaves and bound the audit to 256 nodes.
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   let node,textNodeCount=0,hiddenTextNodeCount=0;
   while((node=walker.nextNode())){
    if(!node.textContent?.trim())continue;
    textNodeCount++;
    if(textNodeCount>256)break; // validator fails closed, never scans unbounded DOM.
    const leaf=document.createRange();leaf.selectNodeContents(node);
    const hasRenderedRect=[...leaf.getClientRects()].some(r=>r.width>0&&r.height>0);
    let visiblyStyled=true;
    for(let p=node.parentElement;p;p=p.parentElement){
     const css=getComputedStyle(p);
     if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0){
      visiblyStyled=false;break;
     }
    }
    if(!hasRenderedRect||!visiblyStyled)hiddenTextNodeCount++;
   }
   return {text:el.textContent?.trim()??'',fragmentCount:rects.length,
    clippedFragments:clips,clippedByAncestor:ancestorClip,textNodeCount,hiddenTextNodeCount};
  };
  return {environment:{width:innerWidth,height:innerHeight,actualTheme:document.documentElement.dataset.theme??null},
   document:{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth},
   targets:items.map(t=>{
    const found=document.querySelectorAll(t.selector);
    if(found.length!==1)return {id:t.id,kind:t.kind,found:found.length};
    const el=found[0],r=el.getBoundingClientRect(),s=getComputedStyle(el);
    const base={id:t.id,kind:t.kind,found:1,rect:bound(r),display:s.display,visibility:s.visibility,
     scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,
     clientHeight:el.clientHeight,textOverflow:s.textOverflow};
    if(t.kind==='text')return {...base,...textInfo(el)};
    const x=Math.max(0,Math.min(innerWidth-1,r.x+r.width/2));
    const y=Math.max(0,Math.min(innerHeight-1,r.y+r.height/2));
    const top=document.elementFromPoint(x,y);
    return {...base,hitTestOk:!!top&&(top===el||el.contains(top))};
   })};
 },targets);
 const viewport=page.viewportSize(),browser=page.context()?.browser();
 if(!viewport||observed.environment.width!==viewport.width||observed.environment.height!==viewport.height||
    typeof browser?.version!=='function'||browser.browserType?.().name?.()!=='chromium')
  fail('viewport or actual Chromium browser identity unverified');
 const value={schema:'mid.design19.reflow-case.v1',status:'SELECTED_LAYOUT_OBSERVATION_ONLY',
  releaseAuthorized:false,browserAcceptanceProven:false,wcagCertified:false,identity,
  environment:{...observed.environment,caseId,browser:'chromium',browserVersion:browser.version(),
   fixtureSha256,theme,textStress},document:observed.document,
  targets:observed.targets.map(({text,...t})=>t.kind==='text'?{
   ...t,textLength:typeof text==='string'?text.length:0,
   textSha256:typeof text==='string'?digest(text):null}:t)};
 validateDesign19ReflowCase(value);
 return {...value,diagnostic:inspectDesign19ReflowCase(value)};
}
