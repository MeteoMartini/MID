import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {sourceUsesExactHttpsUrl} from './source-url-contract.mjs';
const root=new URL('../',import.meta.url),read=name=>fs.readFile(new URL(name,root),'utf8');
import {writeFirstDiagnostic,writeRegressionTimings} from './lib/secure-diagnostics.mjs';
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'mid-security-test-'));
try{
 const output=path.join(temporary,'widget.png'),report=path.join(temporary,'diagnostics/widget.png.first-failure.json'),image=path.join(temporary,'diagnostics/widget.png.first-failure.png');
 await fs.mkdir(path.dirname(report),{recursive:true});
 const attempt=id=>writeFirstDiagnostic(report,async()=>{let screenshotAvailable=false;try{await fs.writeFile(image,String(id),{flag:'wx',mode:0o600});screenshotAvailable=true}catch{}return {state:{id},screenshotAvailable}});
 await Promise.all(Array.from({length:32},(_,id)=>attempt(id)));
 const original=await fs.readFile(report,'utf8'),parsed=JSON.parse(original);
 assert.equal(await fs.readFile(image,'utf8'),String(parsed.state.id));
 assert.equal(parsed.screenshotAvailable,true);
 assert.equal((await fs.stat(report)).mode&0o777,0o600);
 await attempt(99);assert.equal(await fs.readFile(report,'utf8'),original);
 await fs.rm(report);await fs.rm(image);
 const victim=path.join(temporary,'victim');await fs.writeFile(victim,'unchanged');await fs.symlink(victim,report);
 await attempt(100);assert.equal(await fs.readFile(victim,'utf8'),'unchanged');
 await fs.rm(report);await fs.symlink(victim,image);await attempt(101);
 assert.equal(await fs.readFile(victim,'utf8'),'unchanged');assert.equal(JSON.parse(await fs.readFile(report,'utf8')).screenshotAvailable,false);
 await Promise.all(Array.from({length:12},(_,id)=>writeRegressionTimings({id},temporary)));
 const dirs=(await fs.readdir(temporary)).filter(name=>name.startsWith('mid-regression-'));assert.equal(dirs.length,12);
 const ids=[];for(const dir of dirs){assert.equal((await fs.stat(path.join(temporary,dir))).mode&0o777,0o700);const file=path.join(temporary,dir,'timings.json');ids.push(JSON.parse(await fs.readFile(file,'utf8')).id);assert.equal((await fs.stat(file)).mode&0o777,0o600)}assert.equal(new Set(ids).size,12);
 const canonical=await read('ci/github/workflows/install-mid.yml');for(const name of ['.github/workflows/install-mid.yml','workflow-patches/install-mid.yml'])assert.equal(await read(name),canonical);
 const timingPath='path: ${{ runner.temp }}/mid-regression-*/timings.json';
 const sections={
  core:canonical.split('  verify_core:')[1]?.split('  verify_core_shards:')[0],
  coreShards:canonical.split('  verify_core_shards:')[1]?.split('  verify_heavy:')[0],
  heavy:canonical.split('  verify_heavy:')[1]?.split('  install_build:')[0],
 };
 assert.equal(canonical.split(timingPath).length-1,3,'Exact three private timing producers required.');
 for(const [name,block] of Object.entries(sections)){
  assert.ok(block,'Missing independent timed verification group: '+name);
  assert.equal(block.split(timingPath).length-1,1,'Each timed group must write a private timing file exactly once: '+name);
  assert.ok(block.includes('if: always()')&&block.includes('retention-days: 7'),
    'Timing diagnostics must preserve bounded, non-authorizing retention: '+name);
 }
 assert.ok(sections.coreShards.includes('name: mid-timings-core-shard-'),
   'Core-shard diagnostics must not collide with existing Core/Heavy artifacts.');
 assert.ok(sections.heavy.includes('name: mid-timings-${{ strategy.job-index }}-'),
   'Heavy diagnostic artifact naming must stay unchanged.');
 const expected='https://www.midwx.app/api/mid-worker';assert.ok(sourceUsesExactHttpsUrl(`--url "${expected}"`,expected));for(const suffix of ['.evil.example','/extra','?evil=1'])assert.equal(sourceUsesExactHttpsUrl(`--url "${expected}${suffix}"`,expected),false);
 // Incomplete or non-serializable collectors must still publish a valid
 // first-failure report, never a zero-byte file or leaked error text.
 for(const bad of [
  async()=>{throw new Error('SECRET_URL_HTTPS_credential_should_not_be_logged')},
  async()=>{const cycle={schema:1};cycle.self=cycle;return cycle},
  async()=>undefined,
  async()=>[]
 ]){
  await fs.rm(report,{force:true});
  assert.equal(await writeFirstDiagnostic(report,bad),true);
  assert.deepEqual(JSON.parse(await fs.readFile(report,'utf8')),{schema:1,collectionFailed:true,screenshotAvailable:false});
  assert.equal((await fs.stat(report)).mode&0o777,0o600);
  assert.equal(await writeFirstDiagnostic(report,async()=>({schema:1,secret:'later-attempt'})),false);
  assert.ok(!(await fs.readFile(report,'utf8')).includes('SECRET_URL_HTTPS'));
  assert.ok(!(await fs.readFile(report,'utf8')).includes('later-attempt'));
 }
 await fs.rm(report,{force:true});
 let releaseCollector,startedCollector;
 const collectorGate=new Promise(resolve=>{releaseCollector=resolve});
 const startedGate=new Promise(resolve=>{startedCollector=resolve});
 const first=writeFirstDiagnostic(report,async()=>{startedCollector();await collectorGate;return{schema:1,first:true,screenshotAvailable:false}});
 await startedGate;
 assert.deepEqual(JSON.parse(await fs.readFile(report,'utf8')),{schema:1,collectionState:'capturing',screenshotAvailable:false});
 assert.equal(await writeFirstDiagnostic(report,async()=>({schema:1,first:false})),false);
 releaseCollector();
 assert.equal(await first,true);
 assert.deepEqual(JSON.parse(await fs.readFile(report,'utf8')),{schema:1,first:true,screenshotAvailable:false});
 assert.deepEqual((await fs.readdir(path.dirname(report))).filter(name=>name.startsWith('.mid-diagnostic-stage-')),[]);
 console.log('Security diagnostics: 32 concurrent writers, safe rejected/circular collectors, valid in-flight JSON, atomic report, retries, symlinks, paired image/report, 12 private timing artifacts, workflow mirrors and URL negatives passed.');
}finally{await fs.rm(temporary,{recursive:true,force:true})}
