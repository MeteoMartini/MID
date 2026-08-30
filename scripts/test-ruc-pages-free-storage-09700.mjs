import fs from 'node:fs';
import vm from 'node:vm';
import {assertRucWorkflowSyncState} from './ruc-workflow-sync-contract.mjs';
import assert from 'node:assert/strict';
import {versionAtLeast} from './version-regression-helper.mjs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')),baseline=JSON.parse(fs.readFileSync('MID_BASELINE.json','utf8')),test='scripts/test-ruc-pages-free-storage-09700.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.70.0'));assert.equal(baseline.releaseVersion,pkg.version);assert.equal(pkg.scripts?.['test:ruc-pages-free-storage'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} missing from ${key}`);
for(const file of ['tools/ruc/prepare_ruc_pages.py','tools/ruc/restore_ruc_pages_snapshot.py','tools/ruc/test_prepare_ruc_pages.py','MID_IMPLEMENTATION_0.9.70.0.md'])assert.ok(baseline.requiredFiles.includes(file),`${file} missing from baseline`);

const readActive=(path,canonical)=>fs.readFileSync(fs.existsSync(path)?path:canonical,'utf8');const workerSource=fs.readFileSync('worker-src/00-core-observations.js','utf8'),router=fs.readFileSync('worker-src/40-aviation-router.js','utf8'),workflow=fs.readFileSync('ci/github/workflows/mid-ruc-preprocess.yml','utf8'),activeWorkflow=readActive('.github/workflows/mid-ruc-preprocess.yml','ci/github/workflows/mid-ruc-preprocess.yml'),install=fs.readFileSync('ci/github/workflows/install-mid.yml','utf8'),activeInstall=readActive('.github/workflows/install-mid.yml','ci/github/workflows/install-mid.yml');
for(const token of ["const DWD_RUC_STATIC_DEFAULT='https://midwx.app/ruc/'",'dwdRucStaticPointPayload','dwdRucEpsSummaryStaticPayload','dwdRucStorageHealth','pages-free-v1','GitHub Pages',"Accept-Encoding':'identity'"])assert.ok(workerSource.includes(token),`static RUC worker token missing: ${token}`);
assert.ok(router.includes("mode==='ruc-health')return json({...await dwdRucStorageHealth(env)"));
const workflowSyncState=assertRucWorkflowSyncState(activeWorkflow,workflow);
assert.ok(['synced','pending-admin-sync'].includes(workflowSyncState.state),'Aktiver RUC-Workflow darf nur synchron oder exakt im geschützten Legacy-vor-Admin-Sync-Zustand sein.');assert.equal(install,activeInstall);
for(const token of ['prepare_ruc_pages.py','upload-pages-artifact@','deploy-pages@','ref: mid-stable','950000000','MID_RUC_PIPELINE_ENABLED'])assert.ok(workflow.includes(token),`free Pages workflow token missing: ${token}`);
for(const forbidden of ['MID_RUC_R2_ACCESS_KEY_ID','MID_RUC_R2_SECRET_ACCESS_KEY','publish_ruc_r2.sh'])assert.ok(!workflow.includes(forbidden),`free Pages workflow still requires R2: ${forbidden}`);
assert.ok(install.match(/Bereits veröffentlichten kostenfreien RUC-Snapshot erhalten/g)?.length===3,'all three normal Pages release attempts must preserve RUC');
assert.ok(install.includes('restore_ruc_pages_snapshot.py')&&install.includes('MID_RUC_PAGES_BASE_URL'));
const restoreScript=fs.readFileSync('tools/ruc/restore_ruc_pages_snapshot.py','utf8');
assert.ok(restoreScript.includes("if e.code == 404"),'first-run RUC bootstrap 404 must be non-fatal');
assert.ok(restoreScript.includes("if required: raise RuntimeError(f'current RUC snapshot unavailable: HTTP {e.code}')"),'non-404 HTTP failures must remain fail-closed when RUC pipeline is enabled');

const raw=fs.readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
const now=new Date();now.setUTCMinutes(0,0,0);const run=now.toISOString(),runKey=run.replace(/[^0-9A-Za-z_-]/g,''),times=Array.from({length:4},(_,i)=>new Date(now.getTime()+i*3600000).toISOString().slice(0,16));
const detFields=[{name:'temperature_2m',scale:.1,offset:0}],sumFields=[{name:'precipitation_probability',scale:1,offset:0}];
const rapidTimes=Array.from({length:4},(_,i)=>new Date(now.getTime()+i*15*60000).toISOString().slice(0,16)),meta={schema:'mid.dwd.ruc.grid.v2',storageProfile:'pages-free-v1',run,generatedAt:new Date().toISOString(),times,pointCount:1,grid:{latMin:50,lonMin:7,dx:.1,dy:.1,nx:1,ny:1},lookup:{dtype:'uint32-le',pages:{chunkRecords:1,chunkCount:1,recordBytes:4,prefix:`runs/${runKey}/lookup`}},deterministic:{dtype:'int16-le',layout:'point-time-field',recordBytes:8,fields:detFields,pages:{chunkRecords:1,chunkCount:1,recordBytes:8,prefix:`runs/${runKey}/deterministic`}},epsSummary:{dtype:'int16-le',layout:'point-time-field',recordBytes:8,fields:sumFields,pages:{chunkRecords:1,chunkCount:1,recordBytes:8,prefix:`runs/${runKey}/eps-summary`}},rapid:{precip5:{dtype:'int16-le',layout:'point-time-field',times:rapidTimes,recordBytes:8,fields:[{name:'precipitation',scale:.01,offset:0}],pages:{chunkRecords:1,chunkCount:1,recordBytes:8,prefix:`runs/${runKey}/rapid/precip5`}},convection15:{dtype:'int16-le',layout:'point-time-field',times:rapidTimes,recordBytes:24,fields:[{name:'precipitation',scale:.01,offset:0},{name:'cape',scale:1,offset:0},{name:'convective_inhibition',scale:1,offset:0}],pages:{chunkRecords:1,chunkCount:1,recordBytes:24,prefix:`runs/${runKey}/rapid/convection15`}}},rapidExtreme:{key:`runs/${runKey}/rapid-extreme.json`,schema:'mid.dwd.ruc.rapid-extreme.v2'},eps:{memberCount:20,available:false},pages:{profile:'pages-free-v1',nativeEpsMembers:false}};
const i16=values=>{const b=new ArrayBuffer(values.length*2),v=new DataView(b);values.forEach((x,i)=>v.setInt16(i*2,x,true));return new Uint8Array(b)};
const objects=new Map([
 ['https://midwx.app/ruc/latest.json',new TextEncoder().encode(JSON.stringify(meta))],
 [`https://midwx.app/ruc/runs/${runKey}/lookup/0000.bin`,new Uint8Array([0,0,0,0])],
 [`https://midwx.app/ruc/runs/${runKey}/deterministic/0000.bin`,i16([100,110,120,130])],
 [`https://midwx.app/ruc/runs/${runKey}/eps-summary/0000.bin`,i16([10,20,30,40])],
 [`https://midwx.app/ruc/runs/${runKey}/rapid/precip5/0000.bin`,i16([0,1,2,3])],
 [`https://midwx.app/ruc/runs/${runKey}/rapid/convection15/0000.bin`,i16([0,100,50,1,200,40,2,300,30,3,400,20])],
 [`https://midwx.app/ruc/runs/${runKey}/rapid-extreme.json`,new TextEncoder().encode(JSON.stringify({schema:'mid.dwd.ruc.rapid-extreme.v2',run,cells:[]}))]
]);
const requests=[];const fakeFetch=async(input,init={})=>{const url=String(input);requests.push({url,init});const bytes=objects.get(url);if(!bytes)return new Response('not found',{status:404});return new Response(bytes,{status:200,headers:{'content-type':url.endsWith('.json')?'application/json':'application/octet-stream'}})};
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,fetch:fakeFetch});
vm.runInContext(raw,context,{timeout:5000,filename:'worker/metar-proxy.js'});
context.__health=await vm.runInContext('dwdRucStorageHealth({})',context,{timeout:5000});
assert.equal(context.__health.backend,'pages');assert.equal(context.__health.ready,true);assert.equal(context.__health.nativeEpsMembers,false);assert.equal(context.__health.objectsPresent.epsMembers,false);assert.equal(context.__health.objectsPresent.rapidPrecip5,true);assert.equal(context.__health.objectsPresent.rapidConvection15,true);assert.equal(context.__health.objectsPresent.rapidExtreme,true);
context.__point=await vm.runInContext('dwdRucStaticPointPayload(50,7,{})',context,{timeout:5000});assert.deepEqual(Array.from(context.__point.hourly.temperature_2m),[10,11,12,13]);assert.equal(context.__point.mid_ruc.storage,'GitHub Pages');assert.deepEqual(Array.from(context.__point.rapid.precip5.precipitation),[0,.01,.02,.03]);
context.__summary=await vm.runInContext('dwdRucEpsSummaryStaticPayload(50,7,{})',context,{timeout:5000});assert.deepEqual(Array.from(context.__summary.hourly.precipitation_probability),[10,20,30,40]);assert.equal(context.__summary.mid_ruc.member_count,20);
assert.ok(requests.filter(row=>row.url.endsWith('.bin')).every(row=>!new Headers(row.init.headers||{}).has('range')),'Pages backend must not depend on HTTP Range requests');
console.log('RUC free GitHub Pages storage runtime contract OK');
