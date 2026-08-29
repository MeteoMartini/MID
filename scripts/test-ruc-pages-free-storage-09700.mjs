import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {versionAtLeast} from './version-regression-helper.mjs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')),baseline=JSON.parse(fs.readFileSync('MID_BASELINE.json','utf8')),test='scripts/test-ruc-pages-free-storage-09700.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.70.0'));assert.equal(baseline.releaseVersion,pkg.version);assert.equal(pkg.scripts?.['test:ruc-pages-free-storage'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} missing from ${key}`);
for(const file of ['tools/ruc/prepare_ruc_pages.py','tools/ruc/restore_ruc_pages_snapshot.py','tools/ruc/test_prepare_ruc_pages.py','MID_IMPLEMENTATION_0.9.70.0.md'])assert.ok(baseline.requiredFiles.includes(file),`${file} missing from baseline`);

const workerSource=fs.readFileSync('worker-src/00-core-observations.js','utf8'),router=fs.readFileSync('worker-src/40-aviation-router.js','utf8'),workflow=fs.readFileSync('ci/github/workflows/mid-ruc-preprocess.yml','utf8'),activeWorkflow=fs.readFileSync('.github/workflows/mid-ruc-preprocess.yml','utf8'),install=fs.readFileSync('ci/github/workflows/install-mid.yml','utf8'),activeInstall=fs.readFileSync('.github/workflows/install-mid.yml','utf8');
for(const token of ["const DWD_RUC_STATIC_DEFAULT='https://midwx.app/ruc/'",'dwdRucStaticPointPayload','dwdRucEpsSummaryStaticPayload','dwdRucStorageHealth','pages-free-v1','GitHub Pages',"Accept-Encoding':'identity'"])assert.ok(workerSource.includes(token),`static RUC worker token missing: ${token}`);
assert.ok(router.includes("mode==='ruc-health')return json({...await dwdRucStorageHealth(env)"));
assert.equal(workflow,activeWorkflow);assert.equal(install,activeInstall);
for(const token of ['prepare_ruc_pages.py','upload-pages-artifact@','deploy-pages@','ref: mid-stable','950000000','MID_RUC_PIPELINE_ENABLED'])assert.ok(workflow.includes(token),`free Pages workflow token missing: ${token}`);
for(const forbidden of ['MID_RUC_R2_ACCESS_KEY_ID','MID_RUC_R2_SECRET_ACCESS_KEY','publish_ruc_r2.sh'])assert.ok(!workflow.includes(forbidden),`free Pages workflow still requires R2: ${forbidden}`);
assert.ok(install.match(/Bereits veröffentlichten kostenfreien RUC-Snapshot erhalten/g)?.length===3,'all three normal Pages release attempts must preserve RUC');
assert.ok(install.includes('restore_ruc_pages_snapshot.py')&&install.includes('MID_RUC_PAGES_BASE_URL'));

const raw=fs.readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
const now=new Date();now.setUTCMinutes(0,0,0);const run=now.toISOString(),runKey=run.replace(/[^0-9A-Za-z_-]/g,''),times=Array.from({length:4},(_,i)=>new Date(now.getTime()+i*3600000).toISOString().slice(0,16));
const detFields=[{name:'temperature_2m',scale:.1,offset:0}],sumFields=[{name:'precipitation_probability',scale:1,offset:0}];
const meta={schema:'mid.dwd.ruc.grid.v2',storageProfile:'pages-free-v1',run,generatedAt:new Date().toISOString(),times,pointCount:1,grid:{latMin:50,lonMin:7,dx:.1,dy:.1,nx:1,ny:1},lookup:{dtype:'uint32-le',pages:{chunkRecords:1,chunkCount:1,recordBytes:4,prefix:`runs/${runKey}/lookup`}},deterministic:{dtype:'int16-le',layout:'point-time-field',recordBytes:8,fields:detFields,pages:{chunkRecords:1,chunkCount:1,recordBytes:8,prefix:`runs/${runKey}/deterministic`}},epsSummary:{dtype:'int16-le',layout:'point-time-field',recordBytes:8,fields:sumFields,pages:{chunkRecords:1,chunkCount:1,recordBytes:8,prefix:`runs/${runKey}/eps-summary`}},eps:{memberCount:20,available:false},pages:{profile:'pages-free-v1',nativeEpsMembers:false}};
const i16=values=>{const b=new ArrayBuffer(values.length*2),v=new DataView(b);values.forEach((x,i)=>v.setInt16(i*2,x,true));return new Uint8Array(b)};
const objects=new Map([
 ['https://midwx.app/ruc/latest.json',new TextEncoder().encode(JSON.stringify(meta))],
 [`https://midwx.app/ruc/runs/${runKey}/lookup/0000.bin`,new Uint8Array([0,0,0,0])],
 [`https://midwx.app/ruc/runs/${runKey}/deterministic/0000.bin`,i16([100,110,120,130])],
 [`https://midwx.app/ruc/runs/${runKey}/eps-summary/0000.bin`,i16([10,20,30,40])]
]);
const requests=[];const fakeFetch=async(input,init={})=>{const url=String(input);requests.push({url,init});const bytes=objects.get(url);if(!bytes)return new Response('not found',{status:404});return new Response(bytes,{status:200,headers:{'content-type':url.endsWith('.json')?'application/json':'application/octet-stream'}})};
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,fetch:fakeFetch});
vm.runInContext(raw,context,{timeout:5000,filename:'worker/metar-proxy.js'});
context.__health=await vm.runInContext('dwdRucStorageHealth({})',context,{timeout:5000});
assert.equal(context.__health.backend,'pages');assert.equal(context.__health.ready,true);assert.equal(context.__health.nativeEpsMembers,false);assert.equal(context.__health.objectsPresent.epsMembers,false);
context.__point=await vm.runInContext('dwdRucStaticPointPayload(50,7,{})',context,{timeout:5000});assert.deepEqual(Array.from(context.__point.hourly.temperature_2m),[10,11,12,13]);assert.equal(context.__point.mid_ruc.storage,'GitHub Pages');
context.__summary=await vm.runInContext('dwdRucEpsSummaryStaticPayload(50,7,{})',context,{timeout:5000});assert.deepEqual(Array.from(context.__summary.hourly.precipitation_probability),[10,20,30,40]);assert.equal(context.__summary.mid_ruc.member_count,20);
assert.ok(requests.filter(row=>row.url.endsWith('.bin')).every(row=>!new Headers(row.init.headers||{}).has('range')),'Pages backend must not depend on HTTP Range requests');
console.log('RUC free GitHub Pages storage runtime contract OK');
