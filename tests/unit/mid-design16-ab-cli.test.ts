import {describe,it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {startupAssetEvidence} from '../../scripts/lib/startupAssetEvidence.mjs';

const sha=(value:string)=>value.repeat(40);
async function fixture(root:string,gitSha:string,revision:number){
 const dist=join(root,'dist');await mkdir(join(dist,'assets'),{recursive:true});
 const assetMap={
  'index-test.js':'export const startup='+revision+';',
  'index-test.css':'html{color:var(--text)}',
  'MapWorkspacePanel-test.js':'export const map=1;',
  'RadarPanel-test.js':'export const radar=2;',
  'UnifiedWeatherMap-test.js':'export const unified=3;',
  'MapLibreCore-test.js':'export const core=4;',
  'MapWorkspacePanel-test.css':'.map{display:block}',
 };
 for(const [file,data] of Object.entries(assetMap))await writeFile(join(dist,'assets',file),data);
 const version=revision===0?'0.9.85.486':'0.9.85.487';
 await writeFile(join(dist,'version.json'),JSON.stringify({version}));
 const html='<!doctype html><link rel="stylesheet" href="/assets/index-test.css"><script type="module" src="/assets/index-test.js"></script>';
 await writeFile(join(dist,'index.html'),html);
 const all=['index.html','version.json',...Object.keys(assetMap).map(name=>'assets/'+name)].sort();
 const fingerprint=createHash('sha256');
 for(const file of all){const data=await readFile(join(dist,file));fingerprint.update(file+'\u0000'+createHash('sha256').update(data).digest('hex')+'\n')}
 const identity={schema:'mid.web-build-identity.v1',sourceGitSha:gitSha,version,assetsSha256:fingerprint.digest('hex'),assetCount:all.length};
 await writeFile(join(dist,'mid-build-identity.json'),JSON.stringify(identity));
 const assets=[];
 for(const [name,data] of Object.entries(assetMap)){
  const bytes=Buffer.from(data),extension=extname(name);
  assets.push({file:'assets/'+name,extension,bytes:bytes.length,gzipBytes:gzipSync(bytes,{level:9}).length,
   brotliBytes:extension==='.css'?brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length:undefined});
 }
 const startup={...startupAssetEvidence(html,assets),provenance:{version,buildIdentity:identity}};
 const mapJs=['MapWorkspacePanel-test.js','RadarPanel-test.js','UnifiedWeatherMap-test.js','MapLibreCore-test.js'];
 const files=mapJs.map(name=>({name,rawBytes:Buffer.byteLength(assetMap[name as keyof typeof assetMap]),
  gzipBodyBytes:gzipSync(Buffer.from(assetMap[name as keyof typeof assetMap]),{level:9}).length}));
 const cssFiles=[{name:'MapWorkspacePanel-test.css',rawBytes:Buffer.byteLength(assetMap['MapWorkspacePanel-test.css']),
  gzipBodyBytes:gzipSync(Buffer.from(assetMap['MapWorkspacePanel-test.css']),{level:9}).length}];
 const mapModule={schema:'mid.prefetch.chrome-module-evidence.v1',identity,method:'Identical local synthetic module-import probe (NOT actual browser)',
  noImport:{waitMs:2800,productionMapJsRequests:0},
  warmImport:{requestCount:files.length,gzipBodyBytes:files.reduce((a,b)=>a+b.gzipBodyBytes,0),
   cssRequestCount:cssFiles.length,cssGzipBodyBytes:cssFiles[0].gzipBodyBytes,importElapsedMs:400,
   postGcHeapDelta:1_000_000,files,cssFiles}};
 const startupPath=join(root,'startup.json'),mapPath=join(root,'map.json');
 await writeFile(startupPath,JSON.stringify(startup));await writeFile(mapPath,JSON.stringify(mapModule));
 return {dist,startupPath,mapPath};
}

describe('MID Design 1.6 — exact-dist A/B CLI negative integration',()=>{
 it('runs the real repository CLI on two synthetic full asset identities and rejects tampered evidence',async()=>{
  const work=await mkdtemp(join(tmpdir(),'mid-design16-ab-cli-'));
  try{
   const one=await fixture(join(work,'stable'),sha('a'),0);
   const two=await fixture(join(work,'candidate'),sha('b'),1);
   const script=new URL('../../scripts/compare-design16-ab-evidence.mjs',import.meta.url).pathname;
   const args=[one.dist,sha('a'),one.startupPath,one.mapPath,two.dist,sha('b'),two.startupPath,two.mapPath];
   const run=()=>execFileSync(process.execPath,[script,...args],{cwd:work,encoding:'utf8'});
   const expectFailure=(message:string)=>{let error:unknown;try{run()}catch(e){error=e}
    expect(error).toBeTruthy();expect(String((error as {stderr?:string}).stderr??error)).toContain(message)};
   expect(run()).toContain('DESCRIPTIVE_ONLY_FULL_APP_AB_MISSING');
   const report=JSON.parse(await readFile(join(work,'artifacts/design16-ab-evidence.json'),'utf8'));
   expect(report.releaseAuthorized).toBe(false);
   expect(report.performanceGainProven).toBe(false);
   const broken=JSON.parse(await readFile(two.mapPath,'utf8'));
   broken.warmImport.files[0].gzipBodyBytes+=1;
   await writeFile(two.mapPath,JSON.stringify(broken));
   expectFailure('map module files data differs from exact dist bytes');
   await writeFile(join(two.dist,'assets/index-test.js'),'tampered');
   expectFailure('MID build asset fingerprint mismatch');
  }finally{await rm(work,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
 });
});
