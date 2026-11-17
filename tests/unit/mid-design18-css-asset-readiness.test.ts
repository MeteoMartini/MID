import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
 validateExpectedCssAssets,verifyCssManifestAgainstDist,
 verifyCssLoadReadiness,observeCssResponses,
} from '../../scripts/lib/design18CssAssetReadiness.mjs';

const digest=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
const css='body{color:#112233}',inline='html{font-size:16px}',cssHash=digest(css),inlineHash=digest(inline);
const cssomHash=digest('body { color: rgb(17, 34, 51); }');
const origin='http://127.0.0.1:4100';
const identity={schema:'mid.web-build-identity.v1',version:'0.9.85.486',
 sourceGitSha:'a'.repeat(40),assetsSha256:'b'.repeat(64),assetCount:3};
const manifest=()=>({schema:'mid.design18.css-dist-manifest.v1',
 identity:{sourceGitSha:identity.sourceGitSha,assetsSha256:identity.assetsSha256,version:identity.version},
 assets:[{role:'shell',path:'assets/index.css',sha256:cssHash}],
 inlineStyleSha256:[inlineHash],verified:true});
const response=()=>({path:'assets/index.css',status:200,bodySha256:cssHash});
const dom=()=>({fontsStatus:'loaded',adoptedStyleSheetCount:0,stylesheets:[
 {kind:'inline',sha256:inlineHash,path:null,ruleCount:1,cssomSha256:cssomHash,readable:true,disabled:false},
 {kind:'external',sha256:null,path:'assets/index.css',ruleCount:1,cssomSha256:cssomHash,readable:true,disabled:false},
]});
const valid=()=>({manifest:manifest(),responses:[response()],frames:[dom(),dom()],origin});
describe('MID Design 1.8 – CSS real response/body and applied CSSOM evidence',()=>{
 it('requires complete verified response plus loaded external AND original inline CSS, never permits release',()=>{
  const v=verifyCssLoadReadiness(valid());
  expect(v.status).toBe('DECLARED_CSS_HTTP_AND_CSSOM_OBSERVED_ONLY');
  expect(v.orderedStylesheets).toHaveLength(2);
  expect(v.releaseAuthorized).toBe(false);
  expect(v.cssSplitSafeProven).toBe(false);
  expect(v.performanceGainProven).toBe(false);
 });
 it('rejects missing, duplicate, unsuccessful or forged HTTP CSS responses',()=>{
  expect(()=>verifyCssLoadReadiness({...valid(),responses:[]})).toThrow(/missing expected/);
  expect(()=>verifyCssLoadReadiness({...valid(),responses:[response(),response()]})).toThrow(/duplicate/);
  expect(()=>verifyCssLoadReadiness({...valid(),responses:[{...response(),status:404}]})).toThrow(/status/);
  expect(()=>verifyCssLoadReadiness({...valid(),responses:[{...response(),bodySha256:'f'.repeat(64)}]})).toThrow(/hash/);
  expect(()=>verifyCssLoadReadiness({...valid(),responses:[{...response(),path:'assets/unknown.css'}]})).toThrow(/undeclared/);
 });
 it('rejects absent, missing-origin or unreadable CSSOM and document font failures',()=>{
  const x=valid();x.frames[0].stylesheets.pop();
  expect(()=>verifyCssLoadReadiness(x)).toThrow(/incomplete/);
  const y=valid();y.frames[1].stylesheets[1].readable=false;
  expect(()=>verifyCssLoadReadiness(y)).toThrow(/unreadable/);
  const z=valid();z.frames[0].fontsStatus='loading';
  expect(()=>verifyCssLoadReadiness(z)).toThrow(/fonts/);
  const w=valid();w.frames[0].adoptedStyleSheetCount=1;
  expect(()=>verifyCssLoadReadiness(w)).toThrow(/constructed/);
 });
 it('fails closed on inline HTML CSS digest drift and late sheet reordering',()=>{
  const x=valid();x.frames[0].stylesheets[0].sha256='e'.repeat(64);
  expect(()=>verifyCssLoadReadiness(x)).toThrow(/inline stylesheet/);
  const y=valid();y.frames[1].stylesheets.reverse();
  expect(()=>verifyCssLoadReadiness(y)).toThrow(/order/);
  const z=valid();z.frames[1].stylesheets[0].ruleCount=2;
  expect(()=>verifyCssLoadReadiness(z)).toThrow(/rule count/);
 });
 it('rejects CSSOM rule-content drift despite unchanged selector/rule counts',()=>{
  const a=valid();a.frames[1].stylesheets[0].cssomSha256='f'.repeat(64);
  expect(()=>verifyCssLoadReadiness(a)).toThrow(/stylesheet order\/rule count changed/);
  const b=valid();b.frames[0].stylesheets[1].cssomSha256='';
  expect(()=>verifyCssLoadReadiness(b)).toThrow(/unfingerprinted CSSOM/);
  const c=valid();c.frames[0].stylesheets[0].cssomSha256=null;
  expect(()=>verifyCssLoadReadiness(c)).toThrow(/unfingerprinted CSSOM/);
 });
 it('rejects path traversal, duplicates, remote origin or unverified manifests',()=>{
  for(const path of ['../index.css','assets/../secret.css','https://evil.example/a.css','assets/a.css?x=1'])
   expect(()=>validateExpectedCssAssets([{role:'shell',path,sha256:cssHash}])).toThrow(/invalid/);
  expect(()=>validateExpectedCssAssets([{role:'shell',path:'assets/a.css',sha256:cssHash},
   {role:'shell',path:'assets/b.css',sha256:cssHash}])).toThrow(/duplicate/);
  expect(()=>verifyCssLoadReadiness({...valid(),origin:'https://example.org/a'})).toThrow(/origin/);
  expect(()=>verifyCssLoadReadiness({...valid(),manifest:{...manifest(),verified:false}})).toThrow(/unverified/);
 });
 it('independently verifies every dist file, CSS hash and canonical HTML inline style hash',async()=>{
  const root=await mkdtemp(join(tmpdir(),'mid-design18-'));
  try{
   await mkdir(join(root,'assets'));
   const files={
    'assets/index.css':css,
    'index.html':'<!doctype html><style>'+inline+'</style><main id="root"></main>',
    'version.json':JSON.stringify({version:identity.version}),
   };
   for(const [path,data] of Object.entries(files))await writeFile(join(root,path),data);
   const names=Object.keys(files).sort();
   const fingerprint=digest(names.map(n=>n+'\0'+digest(files[n as keyof typeof files])+'\n').join(''));
   const exact={...identity,assetsSha256:fingerprint};
   await writeFile(join(root,'mid-build-identity.json'),JSON.stringify(exact));
   const result=await verifyCssManifestAgainstDist(root,exact,[{role:'shell',path:'assets/index.css',sha256:cssHash}]);
   expect(result.verified).toBe(true);
   expect(result.inlineStyleSha256).toEqual([inlineHash]);
   await writeFile(join(root,'assets/index.css'),css+' /* altered */');
   await expect(verifyCssManifestAgainstDist(root,exact,[{role:'shell',path:'assets/index.css',sha256:cssHash}]))
    .rejects.toThrow(/fingerprint/);
  }finally{await rm(root,{recursive:true,force:true})}
 });
 function browserHarness(onFrame?: (event:{frame:number,emit:(name:string,data:any)=>void})=>void){
  const handlers=new Map<string,Function>();let frame=0;
  const emit=(name:string,payload:any)=>handlers.get(name)?.(payload);
  const page={
   on:(type:string,fn:Function)=>{handlers.set(type,fn)},
   off:(type:string,fn:Function)=>{if(handlers.get(type)===fn)handlers.delete(type)},
   evaluate:async()=>{frame++;onFrame?.({frame,emit});return dom()},
  };
  const request=(path='assets/index.css')=>({
   url:()=>origin+'/'+path,resourceType:()=> 'stylesheet',
  });
  const responseFor=(req:any,overrides:Record<string,any>={})=>({
   request:()=>req,finished:async()=>null,body:async()=>Buffer.from(css),
   status:()=>200,headers:()=>({'content-type':'text/css'}),
   fromServiceWorker:()=>false,...overrides,
  });
  const complete=(req=request())=>{
   emit('request',req);
   emit('response',responseFor(req));
   emit('requestfinished',req);
   return req;
  };
  return {handlers,page,emit,request,responseFor,complete};
 }
 it('observes complete CSS request lifecycle through the second CSSOM frame',async()=>{
  const h=browserHarness();
  const probe=observeCssResponses(h.page,{manifest:manifest(),origin});
  h.complete();
  const report=await probe.finish();
  expect(report.requiredAssetCount).toBe(1);
  for(const event of ['request','response','requestfinished','requestfailed'])
   expect(h.handlers.has(event)).toBe(false);
  await expect(probe.finish()).rejects.toThrow(/already finalized/);
 });
 it('fails closed if a CSS request has not finished downloading',async()=>{
  const h=browserHarness(),probe=observeCssResponses(h.page,{manifest:manifest(),origin});
  const req=h.request();h.emit('request',req);h.emit('response',h.responseFor(req));
  await expect(probe.finish()).rejects.toThrow(/request lifecycle/);
  expect(h.handlers.size).toBe(0);
 });
 it('detects a CSS request arriving during the final render measurement',async()=>{
  let h:ReturnType<typeof browserHarness>;
  h=browserHarness(({frame,emit})=>{
   if(frame===2){emit('request',h.request('assets/late.css'))}
  });
  const probe=observeCssResponses(h.page,{manifest:manifest(),origin});
  h.complete();
  await expect(probe.finish()).rejects.toThrow(/outside declared original asset/);
  expect(h.handlers.size).toBe(0);
 });
 it('rejects CSS requests with query strings, foreign origins or unexpected resource paths',async()=>{
  for(const path of ['assets/index.css?v=1','assets/unknown.css']){
   const h=browserHarness(),probe=observeCssResponses(h.page,{manifest:manifest(),origin});
   h.complete();h.emit('request',h.request(path));
   await expect(probe.finish()).rejects.toThrow(/outside declared original asset/);
  }
  const h=browserHarness(),probe=observeCssResponses(h.page,{manifest:manifest(),origin});
  h.complete();
  h.emit('request',{url:()=> 'https://example.org/style.css',resourceType:()=> 'stylesheet'});
  await expect(probe.finish()).rejects.toThrow(/outside declared original asset/);
 });
 it('rejects CSS requests blocked before response and duplicate request events',async()=>{
  const h=browserHarness(),probe=observeCssResponses(h.page,{manifest:manifest(),origin});
  h.complete();const second=h.request('assets/extra.css');h.emit('request',second);h.emit('requestfailed',second);
  await expect(probe.finish()).rejects.toThrow(/failed or unmatched/);
  const h2=browserHarness(),probe2=observeCssResponses(h2.page,{manifest:manifest(),origin});
  const req=h2.request();h2.emit('request',req);h2.emit('request',req);
  await expect(probe2.finish()).rejects.toThrow(/duplicated stylesheet request/);
 });
 it('never accepts an untracked CSS response or an altered Service Worker response',async()=>{
  const h=browserHarness(),probe=observeCssResponses(h.page,{manifest:manifest(),origin});
  const req=h.request();h.emit('response',h.responseFor(req));
  await expect(probe.finish()).rejects.toThrow(/untracked or duplicate/);
  const h2=browserHarness(),probe2=observeCssResponses(h2.page,{manifest:manifest(),origin});
  const req2=h2.request();h2.emit('request',req2);
  h2.emit('response',h2.responseFor(req2,{fromServiceWorker:()=>true}));h2.emit('requestfinished',req2);
  await expect(probe2.finish()).rejects.toThrow(/Service Worker response/);
 });
 it('does not treat denied or incomplete browser CSS response bytes as valid CSS',async()=>{
  for(const overrides of [
   {body:async()=>{throw Error('response body unavailable')}},
   {finished:async()=>Error('download failed')},
   {body:async()=> 'not a Buffer'},
  ]){
   const h=browserHarness(),probe=observeCssResponses(h.page,{manifest:manifest(),origin});
   const req=h.request();h.emit('request',req);
   h.emit('response',h.responseFor(req,overrides));h.emit('requestfinished',req);
   await expect(probe.finish()).rejects.toThrow(/inaccessible|failed before|Buffer/);
  }
 });
});
