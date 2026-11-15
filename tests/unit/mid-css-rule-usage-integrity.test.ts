import {describe,it,expect} from 'vitest';
import {startCssRuleUsageTracking,collectCssRuleUsage,assertCssRuleUsageComplete} from '../../scripts/lib/cssRuleUsageDiagnostic.mjs';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

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
 it('admits a valid captured case but never authorizes CSS removal',async()=>{
  const report=await collectCssRuleUsage(fixture({sources:{a:'.a{color:red}'},coverage:[
   {styleSheetId:'a',startOffset:0,endOffset:13,used:true}]}),options);
  expect(assertCssRuleUsageComplete(report,'Fixture')).toBe(report);
  expect(report.integrity.cssRemovalAuthorized).toBe(false);
 });
 it('rejects incomplete reports and missing metadata at the browser admission gate',async()=>{
  const incomplete=await collectCssRuleUsage(fixture({sources:{a:'.a{color:red}',b:'.b{color:blue}'},fail:['b']}),options);
  expect(()=>assertCssRuleUsageComplete(incomplete,'Fixture')).toThrow(/Fixture: incomplete CSS rule usage evidence/);
  expect(()=>assertCssRuleUsageComplete({sheets:incomplete.sheets})).toThrow(/MISSING_INTEGRITY/);
 });
 it('rejects contradictory CSS byte totals even with an apparently complete status',async()=>{
  const report=await collectCssRuleUsage(fixture({sources:{a:'.a{color:red}'}}),options);
  report.sheets[0].unusedBytes=99999;
  expect(()=>assertCssRuleUsageComplete(report)).toThrow(/incomplete CSS rule usage evidence/);
 });
 it('rejects a missing sheet in a report that otherwise claims completeness',async()=>{
  const report=await collectCssRuleUsage(fixture({sources:{a:'.a{color:red}'}}),options);
  report.sheets=[];
  expect(()=>assertCssRuleUsageComplete(report)).toThrow(/incomplete CSS rule usage evidence/);
 });
 it('requires both real Chromium fixtures to enforce CSS evidence integrity',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
  for(const path of ['scripts/verify-module-css-browser-0985170.mjs','scripts/verify-favorites-app-browser-0985242.mjs']){
   const source=readFileSync(resolve(root,path),'utf8');
   expect(source).toContain('assertCssRuleUsageComplete');
   expect(source).toContain('cssCoverage.push(assertCssRuleUsageComplete(');
  }
 });

 it('keeps original CSS bytes from a stylesheet removed after its event-time snapshot',async()=>{
  const source='.removed{color:red}',handlers=new Map<string,(payload:any)=>void>();
  let removed=false;
  const cdp={
   on(event:string,handler:(payload:any)=>void){handlers.set(event,handler)},
   async send(method:string,args?:{styleSheetId?:string}){
    if(method==='CSS.enable'){
     handlers.get('CSS.styleSheetAdded')?.({header:{styleSheetId:'removed',sourceURL:'fixture://removed.css'}});
     return{};
    }
    if(method==='CSS.getStyleSheetText'){
     if(removed)throw Error('the stylesheet is now removed');
     return{text:source};
    }
    if(method==='CSS.stopRuleUsageTracking')return{ruleUsage:[{
     styleSheetId:'removed',startOffset:0,endOffset:source.length,used:true}]};
    if(method==='Performance.getMetrics')return{metrics:[]};
    return{};
   }
  };
  const session=await startCssRuleUsageTracking({newCDPSession:async()=>cdp},{});
  await Promise.allSettled([...session.pendingTextReads]);
  handlers.get('CSS.styleSheetRemoved')?.({styleSheetId:'removed'});
  removed=true;
  const report=await collectCssRuleUsage(session,options);
  expect(report.integrity.status).toBe('TRACKED_SHEETS_RECORDED_NO_REMOVAL_APPROVAL');
  expect(report.integrity.cachedRemovedStyleSheetCount).toBe(1);
  expect(report.integrity.removedStyleSheetCount).toBe(1);
  expect(report.sheets[0].rawBytes).toBe(Buffer.byteLength(source));
  expect(report.sheets[0].usedBytes).toBe(Buffer.byteLength(source));
  expect(assertCssRuleUsageComplete(report)).toBe(report);
 });
 it('refuses removed CSS when no independently captured original is available',async()=>{
  const report=await collectCssRuleUsage({
   ...fixture({sources:{a:'.a{color:red}'},fail:['a']}),
   removedIds:new Set(['a']),textSnapshots:new Map()
  },options);
  expect(report.integrity.status).toBe('INCOMPLETE_EVIDENCE');
  expect(report.integrity.unreadableStyleSheetIds).toEqual(['a']);
  expect(()=>assertCssRuleUsageComplete(report)).toThrow(/incomplete CSS rule usage/);
 });
 it('treats changed CSS source as incomplete despite valid current offsets',async()=>{
  const report=await collectCssRuleUsage({
   ...fixture({sources:{a:'.a{color:red}'},coverage:[{styleSheetId:'a',startOffset:0,endOffset:3,used:true}]}),
   changedIds:new Set(['a'])
  },options);
  expect(report.integrity.changedStyleSheetIds).toEqual(['a']);
  expect(report.integrity.status).toBe('INCOMPLETE_EVIDENCE');
  expect(()=>assertCssRuleUsageComplete(report)).toThrow(/incomplete CSS rule usage/);
 });

});
