import {describe,it,expect} from 'vitest';
import {STYLE_PROPERTIES,WEATHER_TOKENS,validateCssomCase,compareCssomCases,captureCssomCase}
 from '../../scripts/lib/design18CssComputedEvidence.mjs';
const shaA='a'.repeat(40),shaB='b'.repeat(40),digestA='1'.repeat(64),digestB='2'.repeat(64);
const ids=['current-390-light','map-390-dark'];
const baseStyles=()=>Object.fromEntries(STYLE_PROPERTIES.map(p=>[p,
 p==='display'?'block':p==='visibility'?'visible':'initial']));
const tokens=()=>Object.fromEntries(WEATHER_TOKENS.map(p=>[p,'rgb(1, 2, 3)']));
const entry=(id,sha=shaA,hash=digestA)=>({
 schema:'mid.design18.cssom-case.v1',status:'READ_ONLY_BROWSER_OBSERVATION',
 releaseAuthorized:false,wholeAppParityProven:false,
 identity:{sourceGitSha:sha,version:'0.9.85.487',assetsSha256:hash},
 environment:{caseId:id,browser:'chromium',browserVersion:'144.0.0',fixtureSha256:'f'.repeat(64),
  theme:id.endsWith('dark')?'dark':'light',actualTheme:id.endsWith('dark')?'dark':'light',
  width:390,height:844,devicePixelRatio:1},
 readiness:{readySelectorMatched:1,fontsStatus:'loaded',styleSheetCount:3},
 rootTokens:tokens(),elements:[{id:'navigation',rect:{x:0,y:790,width:390,height:54},computed:baseStyles()}],
});
const pair=()=>({stable:ids.map(id=>entry(id)),candidate:ids.map(id=>entry(id,shaB,digestB)),requiredCaseIds:ids});
describe('MID Design18 CSSOM parity QA is evidence-only and fail closed',()=>{
 it('accepts exact visible computed cases but never claims global parity',()=>{
  const input=pair();const result=compareCssomCases(input);
  expect(result.status).toBe('SELECTED_CSSOM_VALUES_MATCH_ONLY');
  expect(result.differenceCount).toBe(0);
  expect(result.releaseAuthorized).toBe(false);
  expect(result.cssSplitSafeProven).toBe(false);
  expect(result.wholeAppParityProven).toBe(false);
 });
 it('detects a cross-selector color drift and precise geometry regression',()=>{
  const input=pair();input.candidate[1].elements[0].computed.color='rgb(9, 9, 9)';
  input.candidate[0].elements[0].rect.height=39;
  const result=compareCssomCases(input);
  expect(result.differenceCount).toBe(2);
  expect(result.differences).toEqual(expect.arrayContaining([
   expect.objectContaining({caseId:'map-390-dark',property:'color'}),
   expect.objectContaining({caseId:'current-390-light',property:'rect.height'}),
  ]));
  expect(result.status).toBe('CSSOM_DIFFERENCES_OBSERVED');
 });
 it('detects meteorological parameter color token drift independently of DOM styles',()=>{
  const input=pair();input.candidate[0].rootTokens['--param-temperature']='rgb(99, 0, 0)';
  expect(compareCssomCases(input).differences[0].property).toBe('--param-temperature');
 });
 it('rejects missing style/NoData values rather than treating them as zero',()=>{
  const v=entry(ids[0]);delete v.elements[0].computed['font-size'];
  expect(()=>validateCssomCase(v)).toThrow(/incomplete/);
  const invalid=entry(ids[0]);invalid.elements[0].rect.width=NaN;
  expect(()=>validateCssomCase(invalid)).toThrow(/nonfinite/);
  const missing=entry(ids[0]);missing.rootTokens['--param-wind']='';
  expect(()=>validateCssomCase(missing)).toThrow(/missing weather token/);
 });
 it('rejects missing or duplicate cases and incomparable browsers, fixtures or themes',()=>{
  const input=pair();input.candidate.pop();
  expect(()=>compareCssomCases(input)).toThrow(/case-count/);
  const x=pair();x.candidate[0].environment.browserVersion='145.0.0';
  expect(()=>compareCssomCases(x)).toThrow(/environment mismatch/);
  const y=pair();y.candidate[0].environment.fixtureSha256='e'.repeat(64);
  expect(()=>compareCssomCases(y)).toThrow(/environment mismatch/);
  const z=pair();z.candidate[1].environment.theme='light';
  expect(()=>compareCssomCases(z)).toThrow(/environment mismatch/);
 });
 it('rejects duplicate, invisible or unmatched selectors and incomplete font/CSS readiness',()=>{
  const v=entry(ids[0]);v.elements.push(v.elements[0]);
  expect(()=>validateCssomCase(v)).toThrow(/duplicate element id/);
  const a=entry(ids[0]);a.readiness.styleSheetCount=0;
  expect(()=>validateCssomCase(a)).toThrow(/not proven ready/);
  const b=entry(ids[0]);b.elements[0].computed.display='none';
  expect(()=>validateCssomCase(b)).toThrow(/hidden target/);
  const c=entry(ids[0]);c.readiness.readySelectorMatched=0;
  expect(()=>validateCssomCase(c)).toThrow(/not proven ready/);
 });
 it('refuses mislabeled actual DOM theme and offscreen invisible geometry',()=>{
  const x=entry(ids[0]);x.environment.actualTheme='dark';
  expect(()=>validateCssomCase(x)).toThrow(/actual DOM theme/);
  const y=entry(ids[0]);y.elements[0].rect.y=900;
  expect(()=>validateCssomCase(y)).toThrow(/outside visible viewport/);
  const z=entry(ids[0]);z.elements[0].rect.x=-401;
  expect(()=>validateCssomCase(z)).toThrow(/outside visible viewport/);
 });
 it('requires a real view-ready Page and bounded selector contracts before capture',async()=>{
  await expect(captureCssomCase(null,{
   buildIdentity:entry(ids[0]).identity,caseId:ids[0],fixtureSha256:'f'.repeat(64),
   theme:'light',readySelector:'#root',targets:[{id:'root',selector:'#root'}],
  })).rejects.toThrow(/real Playwright/);
  await expect(captureCssomCase(null,{
   buildIdentity:entry(ids[0]).identity,caseId:ids[0],fixtureSha256:'f'.repeat(64),
   theme:'light',readySelector:'#root',targets:[{id:'x',selector:'nav'},{id:'x',selector:'#root'}],
  })).rejects.toThrow(/duplicate declared target/);
 });
 it('rejects cross-case source, asset and version drift even when each case is valid',()=>{
  const a=pair();a.stable[1].identity.assetsSha256='c'.repeat(64);
  expect(()=>compareCssomCases(a)).toThrow(/cross-case build identity drift/);
  const b=pair();b.candidate[1].identity.sourceGitSha='d'.repeat(40);
  expect(()=>compareCssomCases(b)).toThrow(/cross-case build identity drift/);
  const c=pair();c.stable[1].identity.version='0.9.85.488';
  expect(()=>compareCssomCases(c)).toThrow(/cross-case build identity drift/);
 });
 it('reports full responsive cases only when explicitly listed, never from zero matches',()=>{
  expect(()=>compareCssomCases({...pair(),requiredCaseIds:[ids[0]]})).toThrow(/manifest/);
  const invalid=pair();invalid.candidate[0].elements[0].rect.height=0;
  expect(()=>compareCssomCases(invalid)).toThrow(/collapsed/);
  const same=pair();same.candidate[0].identity.sourceGitSha=shaA;
  expect(()=>compareCssomCases(same)).toThrow(/identical source SHA/);
 });
});
