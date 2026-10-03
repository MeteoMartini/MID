import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const source=await readFile(new URL('../src/precipitationTotals.ts',import.meta.url),'utf8');
// The production module now imports the shared map scale. Bundle dependencies
// instead of single-file transpiling into an unresolvable data: URL.
const compiled=(await build({entryPoints:['src/precipitationTotals.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'})).outputFiles[0].text;
const {validateTotals,totalsAt,totalsColor,loadTotals}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
function fixture(){const run=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString();return {schema:'mid.icon-d2.totals.v1',run,scale:.1,lats:[47,51.1,55.2],lons:[5.5,10.55,15.6],frames:[{hours:24,validTo:new Date(Date.parse(run)+86400000).toISOString(),maximum:12,values:[0,1,10,20,120,40,50,60,70]}]}}
const data=validateTotals(fixture());assert.equal(totalsAt(data,data.frames[0],51.11,10.56),12);assert.equal(totalsAt(data,data.frames[0],60,10),null);assert.equal(totalsColor(12),'#145a91');assert.equal(totalsColor(0),'transparent');assert.ok(source.includes('mid_totals=${Date.now()}')&&source.includes("cache:'no-store'"),'Manifest refresh must avoid stale browser/CDN selection.');assert.equal(data.frames.find(f=>f.hours===48),undefined);
for(const mutate of [d=>{d.frames[0].validTo=d.run},d=>{d.frames[0].values.pop()},d=>{d.frames[0].values[0]=-1},d=>{d.frames[0].maximum=120},d=>{d.run='2000-01-01T00:00:00Z'}]){const broken=fixture();mutate(broken);assert.throws(()=>validateTotals(broken))}
const original=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({precipitationTotals:{key:'runs/../secrets'}})});try{await assert.rejects(()=>loadTotals(new AbortController().signal))}finally{globalThis.fetch=original}
const [workflow,prepare]=await Promise.all([readFile(new URL('../ci/github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8'),readFile(new URL('../tools/ruc/prepare_ruc_pages.py',import.meta.url),'utf8')]);assert.ok(workflow.includes('python tools/ruc/prepare_ruc_pages.py'));assert.ok(prepare.includes("build_totals(a.source/'precipitation-totals.json')"));assert.ok(prepare.includes("objects.append({'key':totals_key"));assert.ok(prepare.includes("__totals_{digest(totals_source)[:16]}"),'Independent ICON-D2 cycles require content-addressed objects.');
console.log('ICON-D2 same-run time, nearest raster, coverage, stale-data rejection, manifest path and free pipeline verified.');
