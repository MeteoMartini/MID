import {describe,it,expect} from 'vitest';
import {collectCssRuleUsage} from '../../scripts/lib/cssRuleUsageDiagnostic.mjs';

const options={viewport:[390,844],theme:'dark',scope:'synthetic CDP fixture',views:['initial','settings']};
function fixture({sources,coverage=[],fail=[],metrics=[]}:{sources:Record<string,string>,coverage?:any[],fail?:string[],metrics?:any[]}){
 const headers=new Map(Object.keys(sources).map(id=>[id,{styleSheetId:id,sourceURL:'https://mid.invalid/assets/'+id+'.css'}]));
 const cdp={async send(method:string,args?:{styleSheetId:string}){
  if(method==='CSS.stopRuleUsageTracking')return{ruleUsage:coverage};
  if(method==='CSS.getStyleSheetText'){
   if(!args||fail.includes(args.styleSheetId))throw Error('Simulated inaccessible CSS');
   return{text:sources[args.styleSheetId]};
  }
  if(method==='Performance.getMetrics')return{metrics};
  throw Error('Unexpected CDP call: '+method);
 }};
 return{headers,cdp};
}

describe('read-only CSS CDP evidence integrity',()=>{
 it('counts overlapping UTF-16 rule offsets exactly once in UTF-8 bytes',async()=>{
  const source='.x{content:"☀️"}.y{color:red}',end=source.indexOf('.y');
  const result=await collectCssRuleUsage(fixture({sources:{a:source},coverage:[
   {styleSheetId:'a',startOffset:0,endOffset:end,used:true},
   {styleSheetId:'a',startOffset:0,endOffset:end,used:true},
   {styleSheetId:'a',startOffset:end,endOffset:source.length,used:false}
  ],metrics:[{name:'RecalcStyleCount',value:2},{name:'unrecognized',value:123}]}),options);
  expect(result.integrity.status).toBe('TRACKED_SHEETS_RECORDED_NO_REMOVAL_APPROVAL');
  expect(result.integrity.cssRemovalAuthorized).toBe(false);
  expect(result.integrity.fullUiStateCoverageProven).toBe(false);
  expect(result.sheets[0].rawBytes).toBe(Buffer.byteLength(source));
  expect(result.sheets[0].usedBytes).toBe(Buffer.byteLength(source.slice(0,end)));
  expect(result.sheets[0].unusedBytes).toBe(Buffer.byteLength(source.slice(end)));
  expect(result.metrics).toEqual({RecalcStyleCount:2});
 });
 it('does not turn an inaccessible stylesheet into measured zero usage',async()=>{
  const result=await collectCssRuleUsage(fixture({sources:{a:'.a{color:red}',b:'.b{color:blue}'},fail:['b']}),options);
  expect(result.integrity.status).toBe('INCOMPLETE_EVIDENCE');
  expect(result.integrity.unreadableStyleSheetIds).toEqual(['b']);
  expect(result.sheets).toHaveLength(1);
 });
 it('reports unknown coverage IDs instead of discarding them',async()=>{
  const result=await collectCssRuleUsage(fixture({sources:{a:'.a{color:red}'},coverage:[
   {styleSheetId:'removed',startOffset:0,endOffset:4,used:true}]}),options);
  expect(result.integrity.status).toBe('INCOMPLETE_EVIDENCE');
  expect(result.integrity.unknownUsageStyleSheetIds).toEqual(['removed']);
 });
 it('flags invalid source offsets instead of clamping them into apparent data',async()=>{
  const source='.a{color:red}';
  const result=await collectCssRuleUsage(fixture({sources:{a:source},coverage:[
   {styleSheetId:'a',startOffset:0,endOffset:source.length+1,used:true}]}),options);
  expect(result.integrity.status).toBe('INCOMPLETE_EVIDENCE');
  expect(result.integrity.invalidRuleRanges).toBe(1);
  expect(result.sheets[0].usedBytes).toBe(0);
 });
 it('does not certify an empty CSS inventory',async()=>{
  const result=await collectCssRuleUsage(fixture({sources:{a:''}}),options);
  expect(result.integrity.status).toBe('INCOMPLETE_EVIDENCE');
  expect(result.integrity.emptyStyleSheetIds).toEqual(['a']);
  expect(result.sheets).toEqual([]);
 });
 it('fails closed on a malformed CDP coverage response',async()=>{
  await expect(collectCssRuleUsage({headers:new Map(),cdp:{send:async()=>({})}},options)).rejects.toThrow('no CDP ruleUsage array');
 });
});
