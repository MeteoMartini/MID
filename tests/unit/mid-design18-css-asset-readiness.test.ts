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
const origin='http://127.0.0.1:4100';
const identity={schema:'mid.web-build-identity.v1',version:'0.9.85.486',
 sourceGitSha:'a'.repeat(40),assetsSha256:'b'.repeat(64),assetCount:3};
const manifest=()=>({schema:'mid.design18.css-dist-manifest.v1',
 identity:{sourceGitSha:identity.sourceGitSha,assetsSha256:identity.assetsSha256,version:identity.version},
 assets:[{role:'shell',path:'assets/index.css',sha256:cssHash}],
 inlineStyleSha256:[inlineHash],verified:true});
const response=()=>({path:'assets/index.css',status:200,bodySha256:cssHash});
const dom=()=>({fontsStatus:'loaded',adoptedStyleSheetCount:0,stylesheets:[
 {kind:'inline',sha256:inlineHash,path:null,ruleCount:1,readable:true,disabled:false},
 {kind:'external',sha256:null,path:'assets/index.css',ruleCount:1,readable:true,disabled:false},
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
 it('observes real-page response bodies and two CSSOM frames through the Playwright API',async()=>{
  const handlers=new Map<string,Function>();
  const page={
   on:(type:string,fn:Function)=>{handlers.set(type,fn)},
   off:(type:string,fn:Function)=>{if(handlers.get(type)===fn)handlers.delete(type)},
   evaluate:async()=>dom(),
  };
  const probe=observeCssResponses(page,{manifest:manifest(),origin});
  const callback=handlers.get('response');
  expect(callback).toBeDefined();
  callback!({
   url:()=>origin+'/assets/index.css',status:()=>200,body:async()=>Buffer.from(css),
  });
  const report=await probe.finish();
  expect(report.requiredAssetCount).toBe(1);
  expect(handlers.has('response')).toBe(false);
  await expect(probe.finish()).rejects.toThrow(/already finalized/);
 });
 it('does not treat denied browser resource bytes as valid CSS',async()=>{
  const handlers=new Map<string,Function>();
  const page={
   on:(type:string,fn:Function)=>handlers.set(type,fn),
   off:(type:string)=>handlers.delete(type),
   evaluate:async()=>dom(),
  };
  const probe=observeCssResponses(page,{manifest:manifest(),origin});
  handlers.get('response')!({
   url:()=>origin+'/assets/index.css',status:()=>200,
   body:async()=>{throw Error('response body unavailable')},
  });
  await expect(probe.finish()).rejects.toThrow(/inaccessible/);
 });
});
