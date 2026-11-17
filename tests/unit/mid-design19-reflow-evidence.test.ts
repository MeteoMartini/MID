import {describe,it,expect} from 'vitest';
import {captureDesign19ReflowCase,compareDesign19ReflowCases,inspectDesign19ReflowCase,
 validateDesign19ReflowCase} from '../../scripts/lib/design19ReflowEvidence.mjs';

const sha='a'.repeat(40),sha2='b'.repeat(40),hash='c'.repeat(64),textHash='d'.repeat(64);
const sample=()=>({
 schema:'mid.design19.reflow-case.v1',status:'SELECTED_LAYOUT_OBSERVATION_ONLY',
 releaseAuthorized:false,browserAcceptanceProven:false,wcagCertified:false,
 identity:{sourceGitSha:sha,assetsSha256:hash,version:'0.9.85.486'},
 environment:{caseId:'forecast-320-light',browser:'chromium',browserVersion:'144.0.0',
  fixtureSha256:hash,theme:'light',actualTheme:'light',width:320,height:720,textStress:'normal'},
 document:{scrollWidth:320,clientWidth:320},
 targets:[
  {id:'weather-description',kind:'text',found:1,rect:{x:12,y:100,width:296,height:74},
   scrollWidth:296,clientWidth:296,scrollHeight:74,clientHeight:74,
   display:'block',visibility:'visible',textOverflow:'clip',textSha256:textHash,textLength:120,
   fragmentCount:4,clippedByAncestor:false,clippedFragments:false,
   textNodeCount:2,hiddenTextNodeCount:0},
  {id:'mode-toggle',kind:'control',found:1,rect:{x:12,y:205,width:72,height:44},
   scrollWidth:72,clientWidth:72,scrollHeight:44,clientHeight:44,
   display:'flex',visibility:'visible',textOverflow:'clip',hitTestOk:true}
 ]
});
const copy=()=>structuredClone(sample());

describe('MID Design19 – original visible reflow/text and critical-touch QA (selected only)',()=>{
 it('a valid finite sample reports no selected defect but never grants approval',()=>{
  const observed=inspectDesign19ReflowCase(sample());
  expect(observed.status).toBe('NO_SELECTED_DEFECT_IN_FINITE_SAMPLE');
  expect(observed.issues).toEqual([]);
  expect(observed.wcagCertified).toBe(false);
  expect(observed.browserAcceptanceProven).toBe(false);
  expect(observed.releaseAuthorized).toBe(false);
 });
 it('rejects invisible nested original weather text even when text digest and outer range are unchanged',()=>{
  const value:any=copy();value.targets[0].hiddenTextNodeCount=1;
  const result=inspectDesign19ReflowCase(value);
  expect(result.status).toBe('SELECTED_REFLOW_DEFECTS_OBSERVED');
  expect(result.issues).toContainEqual({target:'weather-description',reason:'hidden-original-text-nodes'});
  expect(result.releaseAuthorized).toBe(false);
 });
 it('flags a candidate that hides a leaf without changing the original text digest',()=>{
  const stable:any=copy(),candidate:any=copy();
  candidate.identity.sourceGitSha=sha2;
  candidate.targets[0].hiddenTextNodeCount=1;
  const result=compareDesign19ReflowCases({stable,candidate});
  expect(result.changes).toEqual([]);
  expect(result.after).toContainEqual({target:'weather-description',reason:'hidden-original-text-nodes'});
  expect(result.before).toEqual([]);
  expect(result.cssSplitSafeProven).toBe(false);
 });
 it('fails closed when text-leaf census is missing, impossible or exceeds the bounded limit',()=>{
  const absent:any=copy();delete absent.targets[0].textNodeCount;
  expect(()=>validateDesign19ReflowCase(absent)).toThrow(/text\/fragments/);
  const excessive:any=copy();excessive.targets[0].textNodeCount=257;
  expect(()=>validateDesign19ReflowCase(excessive)).toThrow(/text\/fragments/);
  const impossible:any=copy();impossible.targets[0].hiddenTextNodeCount=3;
  expect(()=>validateDesign19ReflowCase(impossible)).toThrow(/text\/fragments/);
  const none:any=copy();none.targets[0].textNodeCount=0;
  expect(()=>validateDesign19ReflowCase(none)).toThrow(/text\/fragments/);
 });
 it('detects document overflow without mistaking it for an allowed nested scroll region',()=>{
  const value=copy();value.document.scrollWidth=342;
  expect(inspectDesign19ReflowCase(value).issues).toContainEqual({target:'document',reason:'horizontal-document-overflow'});
 });
 it('detects clipped lines, ellipsis, vertical truncation and clipping ancestors',()=>{
  for(const mutation of [
   (x:any)=>{x.targets[0].scrollHeight=130},
   (x:any)=>{x.targets[0].textOverflow='ellipsis'},
   (x:any)=>{x.targets[0].clippedFragments=true},
   (x:any)=>{x.targets[0].clippedByAncestor=true},
  ]){
   const value:any=copy();mutation(value);
   expect(inspectDesign19ReflowCase(value).issues).toContainEqual({target:'weather-description',reason:'clipped-or-ellipsized-text'});
  }
 });
 it('detects a visually occluded or undersized 44px critical first-touch target',()=>{
  const value:any=copy();value.targets[1].hitTestOk=false;value.targets[1].rect.height=29;
  expect(inspectDesign19ReflowCase(value).issues).toContainEqual({target:'mode-toggle',reason:'undersized-or-occluded-critical-control'});
 });
 it('identifies selected controls or text outside viewport instead of classifying them as visible',()=>{
  const value:any=copy();value.targets[1].rect.x=380;
  expect(inspectDesign19ReflowCase(value).issues).toContainEqual({target:'mode-toggle',reason:'selected-target-outside-viewport'});
 });
 it('fails closed on missing/duplicate targets, unmeasurable text, nonfinite geometry and mismatched theme',()=>{
  const a:any=copy();a.targets[0].found=0;expect(()=>validateDesign19ReflowCase(a)).toThrow(/missing or duplicate/);
  const b:any=copy();b.targets.push(b.targets[0]);expect(()=>validateDesign19ReflowCase(b)).toThrow(/duplicate/);
  const c:any=copy();c.targets[0].textSha256='';expect(()=>validateDesign19ReflowCase(c)).toThrow(/text\/fragments/);
  const d:any=copy();d.targets[0].rect.width=NaN;expect(()=>validateDesign19ReflowCase(d)).toThrow(/nonfinite/);
  const e:any=copy();e.environment.actualTheme='dark';expect(()=>validateDesign19ReflowCase(e)).toThrow(/theme mismatch/);
 });
 it('A/B compares identical text fixture and environment only, never asserts performance or CSS release',()=>{
  const stable:any=copy(),candidate:any=copy();candidate.identity.sourceGitSha=sha2;
  const result=compareDesign19ReflowCases({stable,candidate});
  expect(result.status).toBe('SELECTED_AB_DESCRIPTION_ONLY');
  expect(result.changes).toEqual([]);expect(result.cssSplitSafeProven).toBe(false);
  expect(result.performanceGainProven).toBe(false);
  candidate.targets[0].textSha256='e'.repeat(64);
  expect(compareDesign19ReflowCases({stable,candidate}).changes).toContainEqual({target:'weather-description',reason:'text-content-changed'});
 });
 it('rejects A/B viewport/fixture/browser drift and attempts to compare the same source twice',()=>{
  const stable:any=copy(),candidate:any=copy();
  expect(()=>compareDesign19ReflowCases({stable,candidate})).toThrow(/identical source SHA/);
  candidate.identity.sourceGitSha=sha2;candidate.environment.width=390;
  expect(()=>compareDesign19ReflowCases({stable,candidate})).toThrow(/environment mismatch/);
  candidate.environment.width=320;candidate.environment.fixtureSha256='f'.repeat(64);
  expect(()=>compareDesign19ReflowCases({stable,candidate})).toThrow(/environment mismatch/);
 });
 it('takes real-Page-shaped observations and hashes text instead of retaining location/weather strings',async()=>{
  let calls=0;
  const observed:any=copy();
  const page={
   locator:(_:string)=>({waitFor:async()=>undefined}),viewportSize:()=>({width:320,height:720}),
   context:()=>({browser:()=>({version:()=> '144.0.0',browserType:()=>({name:()=> 'chromium'})})}),
   evaluate:async (_fn:unknown)=>{
    calls++;
    if(calls===1)return undefined;
    return {environment:{width:320,height:720,actualTheme:'light'},document:observed.document,
     targets:observed.targets.map((t:any)=>t.kind==='text'?{
      ...t,text:'Zunächst länger anhaltender Niederschlag in Niederkassel',
     }:t)};
   }
  };
  const result=await captureDesign19ReflowCase(page,{identity:observed.identity,
   caseId:observed.environment.caseId,fixtureSha256:hash,theme:'light',
   readySelector:'main',targets:[{id:'weather-description',kind:'text',selector:'.weather'},
    {id:'mode-toggle',kind:'control',selector:'button.mode'}]});
  expect(calls).toBe(2);
  expect(result.targets[0].textLength).toBeGreaterThan(0);
  expect(result.targets[0].textSha256).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.stringify(result)).not.toContain('Niederkassel');
  expect(result.diagnostic.releaseAuthorized).toBe(false);
 });
 it('refuses a spoofed non-Chromium / mismatched browser viewport',async()=>{
  const p={locator:(_:string)=>({waitFor:async()=>undefined}),evaluate:async()=>undefined,
   viewportSize:()=>({width:390,height:720}),
   context:()=>({browser:()=>({version:()=> '144.0.0',browserType:()=>({name:()=> 'firefox'})})})};
  await expect(captureDesign19ReflowCase(p,{identity:sample().identity,caseId:'test',
   fixtureSha256:hash,theme:'light',readySelector:'#root',targets:[{id:'a',kind:'text',selector:'.a'}]}))
   .rejects.toThrow();
 });
});
