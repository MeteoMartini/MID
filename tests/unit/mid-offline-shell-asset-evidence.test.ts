import {describe,it,expect} from 'vitest';
import {offlineShellAssetEvidence} from '../../scripts/lib/offlineShellAssetEvidence.mjs';
import {mkdtemp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const assets=[
 {file:'assets/main.js',extension:'.js',bytes:100,gzipBytes:40},
 {file:'assets/shared.js',extension:'.js',bytes:200,gzipBytes:60},
 {file:'assets/deferred.js',extension:'.js',bytes:300,gzipBytes:80},
 {file:'assets/shared.css',extension:'.css',bytes:40,gzipBytes:20,brotliBytes:15},
 {file:'assets/deferred.css',extension:'.css',bytes:80,gzipBytes:25,brotliBytes:18},
 {file:'assets/unrelated.js',extension:'.js',bytes:900,gzipBytes:300},
];
const startup={
 js:{entries:[{file:'assets/main.js'},{file:'assets/shared.js'}]},
 css:{entries:[{file:'assets/shared.css'}]},
};
const link=(href:string)=>`<link rel="mid-offline" href="${href}">`;
const html='<link rel="stylesheet" href="./assets/shared.css"><script type="module" src="./assets/main.js"></script>'+
 link('./assets/shared.js')+link('./assets/deferred.js')+link('./assets/deferred.css')+
 link('./assets/shared.css')+link('./assets/deferred.js');

describe('MID offline shell: SHA-built static asset accounting',()=>{
 it('deduplicates links and keeps startup overlap separate from offline-only',()=>{
  const result=offlineShellAssetEvidence(html,assets,startup);
  expect(result.schema).toBe('mid.offline-shell-asset-evidence.v1');
  expect(result.declarations).toBe(5);
  expect(result.total).toMatchObject({fileCount:4,bytes:620,gzipBytes:185,jsFiles:2,cssFiles:2,cssBrotliBytes:33});
  expect(result.sharedWithHtmlStartup).toMatchObject({fileCount:2,bytes:240,gzipBytes:80});
  expect(result.offlineOnly).toMatchObject({fileCount:2,bytes:380,gzipBytes:105});
  expect(result.offlineOnly.entries.map((a:{file:string})=>a.file)).toEqual(['assets/deferred.css','assets/deferred.js']);
  expect(result.scope).toContain('not startup requests');
 });
 it('accepts safe local URLs with cache-busting queries',()=>{
  expect(offlineShellAssetEvidence(link('./assets/shared.js?hash=abc'),assets,startup).total.fileCount).toBe(1);
  expect(offlineShellAssetEvidence('<link href="./assets/shared.js" rel="MID-OFFLINE">',assets,startup).total.bytes).toBe(200);
 });
 it.each([
  './%2e%2e/assets/shared.js',
  './assets/../shared.js',
  './assets/%2e%2e/shared.js',
  './assets/%2e/shared.js',
  '../assets/shared.js',
  '/assets/shared.js',
  'https://untrusted.example/assets/shared.js',
  './assets%2fshared.js',
  './assets\\\\shared.js',
  './assets/missing.js',
  './assets/deferred.png',
  './assets/%zz.js',
 ])('fails closed for unsafe or unavailable link %s',(href)=>{
  expect(()=>offlineShellAssetEvidence(link(href),assets,startup)).toThrow();
 });
 it.each(['preload','modulepreload','prefetch','stylesheet'])('rejects mixed browser-loading rel=%s with mid-offline',(hint)=>{
  expect(()=>offlineShellAssetEvidence('<link rel="mid-offline '+hint+'" href="./assets/deferred.js">',assets,startup)).toThrow(/Ambiguous offline-shell/);
 });
 it('fails on absent, malformed or unverifiable declarations instead of reporting 0',()=>{
  expect(()=>offlineShellAssetEvidence('<div>No offline assets</div>',assets,startup)).toThrow(/No offline-shell/);
  expect(()=>offlineShellAssetEvidence('<link rel="mid-offline">',assets,startup)).toThrow(/safe local href/);
  expect(()=>offlineShellAssetEvidence(link('./assets/deferred.js'),assets,null)).toThrow(/verified startup/);
  expect(()=>offlineShellAssetEvidence(link('./assets/deferred.css'),assets.map(x=>x.file==='assets/deferred.css'?{...x,brotliBytes:undefined}:x),startup)).toThrow(/Malformed/);
  expect(()=>offlineShellAssetEvidence(link('./assets/shared.js'),[...assets,assets[1]],startup)).toThrow(/duplicated/);
 });
});


const syntheticCommit='c9fadfcd0969e949a92f414b321627dd3d4fb0cc';
const syntheticMeasureScript=fileURLToPath(new URL('../../scripts/measure-startup-assets-0985482.mjs',import.meta.url));
const syntheticHtml=[
 '<link rel="stylesheet" href="./assets/main.css">',
 '<link rel="modulepreload" href="./assets/shared.js">',
 '<script type="module" src="./assets/index.js"></script>',
 '<link rel="mid-offline" href="./assets/shared.js">',
 '<link rel="mid-offline" href="./assets/lazy.js">',
 '<link rel="mid-offline" href="./assets/lazy.css">',
 '<link rel="mid-offline" href="./assets/main.css">',
].join('');
const syntheticAssets=new Map<string,string>([
 ['assets/index.js','export const main = 1;'],
 ['assets/shared.js','export const shared = true;'],
 ['assets/lazy.js','export const deferred = "only offline";'],
 ['assets/main.css','body { color: navy; }'],
 ['assets/lazy.css','.lazy { display: block; }'],
]);
async function createSyntheticShaBoundDist(root:string,indexHtml=syntheticHtml){
 await mkdir(join(root,'assets'),{recursive:true});
 const files=new Map(syntheticAssets);
 files.set('index.html',indexHtml);
 files.set('version.json',JSON.stringify({version:'0.9.85.483'}));
 for(const [name,contents] of files)await writeFile(join(root,name),contents);
 const sha=createHash('sha256');
 for(const name of [...files.keys()].sort()){
  const digest=createHash('sha256').update(await readFile(join(root,name))).digest('hex');
  sha.update(name+'\u0000'+digest+'\n');
 }
 await writeFile(join(root,'mid-build-identity.json'),JSON.stringify({
  schema:'mid.web-build-identity.v1',version:'0.9.85.483',sourceGitSha:syntheticCommit,
  assetsSha256:sha.digest('hex'),assetCount:files.size,
 }));
}
const executeSyntheticMeasure=(cwd:string,dist:string)=>execFileSync(process.execPath,[syntheticMeasureScript,dist],{
 cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],
});
describe('MID offline-shell full reporter path: synthetic SHA-bound dist',()=>{
 it('checks complete build provenance and writes additive, non-overlapping startup/offline figures',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'mid-offline-reporter-positive-'));
  try{
   const dist=join(temp,'dist');
   await createSyntheticShaBoundDist(dist);
   const stdout=JSON.parse(executeSyntheticMeasure(temp,dist));
   const report=JSON.parse(await readFile(join(temp,'artifacts','startup-assets-0985482.json'),'utf8'));
   expect(report.provenance).toMatchObject({version:'0.9.85.483',buildIdentity:{
    schema:'mid.web-build-identity.v1',sourceGitSha:syntheticCommit,assetCount:7,
   }});
   expect(report.js.entries).toHaveLength(2);
   expect(report.css.entries).toHaveLength(1);
   expect(report.offlineShell).toMatchObject({schema:'mid.offline-shell-asset-evidence.v1',declarations:4});
   expect(report.offlineShell.sharedWithHtmlStartup.entries.map((entry:{file:string})=>entry.file))
    .toEqual(['assets/main.css','assets/shared.js']);
   expect(report.offlineShell.offlineOnly.entries.map((entry:{file:string})=>entry.file))
    .toEqual(['assets/lazy.css','assets/lazy.js']);
   const lazyBytes=Buffer.byteLength(syntheticAssets.get('assets/lazy.css')!)+
    Buffer.byteLength(syntheticAssets.get('assets/lazy.js')!);
   expect(report.offlineShell.offlineOnly.bytes).toBe(lazyBytes);
   expect(report.offlineShell.offlineOnly.gzipBytes).toBeGreaterThan(0);
   expect(stdout.offlineShellOnlyGzip).toBe(report.offlineShell.offlineOnly.gzipBytes);
   expect(stdout.htmlReferencedJsRaw).toBe(report.js.bytes);
  }finally{await rm(temp,{recursive:true,force:true});}
 });
 it('refuses a tampered dist fingerprint and never writes a certified report',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'mid-offline-reporter-tamper-'));
  try{
   const dist=join(temp,'dist');
   await createSyntheticShaBoundDist(dist);
   await writeFile(join(dist,'assets','lazy.js'),'tampered after fingerprint');
   expect(()=>executeSyntheticMeasure(temp,dist)).toThrow();
   await expect(readFile(join(temp,'artifacts','startup-assets-0985482.json'))).rejects.toThrow();
  }finally{await rm(temp,{recursive:true,force:true});}
 });
 it('refuses a missing offline chunk even if the remaining dist has a valid fingerprint',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'mid-offline-reporter-missing-'));
  try{
   const dist=join(temp,'dist');
   await createSyntheticShaBoundDist(dist,syntheticHtml.replace('href="./assets/lazy.js"','href="./assets/absent.js"'));
   expect(()=>executeSyntheticMeasure(temp,dist)).toThrow();
   await expect(readFile(join(temp,'artifacts','startup-assets-0985482.json'))).rejects.toThrow();
  }finally{await rm(temp,{recursive:true,force:true});}
 });
});

