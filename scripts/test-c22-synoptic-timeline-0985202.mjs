import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const temporary=mkdtempSync(path.resolve('.mid-c22-synoptic-'));
try{
 await build({entryPoints:['src/nativeSynopticFields.ts'],outfile:path.join(temporary,'native.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const native=await import(pathToFileURL(path.join(temporary,'native.mjs')));
 const runMs=Math.floor(Date.now()/3600000)*3600000-3600000,run=new Date(runMs).toISOString(),core=[0,3,6,9,12,18,24,36,48],hours=[0,3,6,9,12,15,18,21,24,30,36,42,48,60,72];
 const frame=hour=>({hour,time:new Date(runMs+hour*3600000).toISOString(),file:`icon-eu-${String(hour).padStart(3,'0')}.bin`,encoding:'gzip-json',sha256:'a'.repeat(64),bytes:123,decodedBytes:1000});
 const originalFetch=globalThis.fetch;
 async function indexTest(terms,id='icon-eu'){const bytes=Buffer.from(JSON.stringify({schema:'mid.synoptic.fields.v1',models:{[id]:{label:'DWD ICON-EU',run,resolutionKm:14,license:'CC BY 4.0',frames:terms.map(h=>({...frame(h),file:`${id}-${String(h).padStart(3,'0')}.bin`}))}}})),digest=createHash('sha256').update(bytes).digest('hex').slice(0,16),key=`runs/qa__synoptic_${digest}/synoptic-fields/index.json`;globalThis.fetch=async url=>String(url).startsWith('/ruc/latest')?new Response(JSON.stringify({synopticFields:{key}})):new Response(bytes);return native.loadSynopticIndex(new AbortController().signal)}
 try{assert.equal((await indexTest(core)).index.models['icon-eu'].frames.length,9);assert.equal((await indexTest(hours)).index.models['icon-eu'].frames.length,15);assert.equal((await indexTest(hours,'gfs')).index.models.gfs.frames.length,15);assert.equal((await indexTest(hours,'ifs')).index.models.ifs.frames.length,15);await assert.rejects(indexTest(hours,'icon-d2'));await assert.rejects(indexTest(hours.filter(h=>h!==36)));await assert.rejects(indexTest([...core,15,15]));await assert.rejects(indexTest([...core,1]));}finally{globalThis.fetch=originalFetch}

 await build({entryPoints:['src/CompositeTimeline.ts'],outfile:path.join(temporary,'timeline.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const timeline=await import(pathToFileURL(path.join(temporary,'timeline.mjs')));
 const t0=Math.floor(Date.now()/3600000)*3600,activeFrames=timeline.buildAvailableCompositeTimeline(t0,{source:'test',observations:[t0],forecasts:[t0-3*3600,t0+3*3600]},180,180);
 assert.equal(timeline.preferForecastFrameIndex(activeFrames,[t0-3*3600,t0+3*3600],t0),activeFrames.findIndex(f=>f.time===t0+3*3600),'Model maps must choose a published forecast timestamp even when live radar observations exist');
 assert.equal(timeline.preferForecastFrameIndex(activeFrames,[],t0),activeFrames.findIndex(f=>f.live),'Observation view remains live when no model forecast is active');
 assert.equal(timeline.preferForecastFrameIndex(activeFrames,[NaN],t0),activeFrames.findIndex(f=>f.live),'Invalid times cannot synthesize a model frame');
 const radar=readFileSync('src/RadarPanel.tsx','utf8');
 assert.match(radar,/modelNeedsHistory\?180:90/,'Sparse six-hour core forecasts must retain genuine prior available terms');
 assert.match(radar,/preferForecastFrameIndex\(frames,modelForecastTimes,referenceSeconds\)/,'Model map live-follow must seek actual forecast times');
 console.log('C22: SHA-bound optional +60/+72h catalog accepted; required core, term identity and unique frames remain enforced.');
}finally{rmSync(temporary,{recursive:true,force:true})}
