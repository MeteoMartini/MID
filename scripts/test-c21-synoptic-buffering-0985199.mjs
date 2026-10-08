import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const temporary=mkdtempSync(path.resolve('.mid-synoptic-199-'));
try{
 await build({entryPoints:['src/nativeSynopticFields.ts'],outfile:path.join(temporary,'native.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const native=await import(pathToFileURL(path.join(temporary,'native.mjs')));
 const ms=kt=>kt/1.9438444924406;
 assert.equal(native.jetWindStyle(ms(59.99),0),null);assert.equal(native.jetWindStyle(0,0),null);assert.equal(native.jetWindStyle(NaN,20),null);
 const threshold=native.jetWindStyle(ms(60.001),0),strong=native.jetWindStyle(ms(120),0),maximum=native.jetWindStyle(ms(250),0);
 assert.ok(threshold&&strong&&maximum);assert.ok(strong.length>threshold.length&&strong.width>threshold.width);assert.equal(maximum.length,38);assert.equal(maximum.width,3.2);assert.equal(native.jetWindStyle(0,-ms(80)).knots,80);
 for(const value of [-18,0,12,24,36,48,60,72]){assert.deepEqual(native.synopticColor(value+.01),native.synopticColor(value+5.99));assert.notDeepEqual(native.synopticColor(value+5.99),native.synopticColor(value+6.01))}
 assert.deepEqual(native.THETAE_BANDS.map(([v])=>v),Array.from({length:19},(_,i)=>-18+i*6));
 const runMs=Math.floor(Date.now()/3600000)*3600000-3600000,run=new Date(runMs).toISOString(),core=[0,3,6,9,12,18,24,36,48],hours=[0,3,6,9,12,15,18,21,24,30,36,42,48];
 const frame=hour=>({hour,time:new Date(runMs+hour*3600000).toISOString(),file:`icon-eu-${String(hour).padStart(3,'0')}.bin`,encoding:'gzip-json',sha256:'a'.repeat(64),bytes:123,decodedBytes:1000});
 const originalFetch=globalThis.fetch;
 async function indexTest(terms){const bytes=Buffer.from(JSON.stringify({schema:'mid.synoptic.fields.v1',models:{'icon-eu':{label:'DWD ICON-EU',run,resolutionKm:14,license:'CC BY 4.0',frames:terms.map(frame)}}})),digest=createHash('sha256').update(bytes).digest('hex').slice(0,16),key=`runs/qa__synoptic_${digest}/synoptic-fields/index.json`;globalThis.fetch=async url=>String(url).startsWith('/ruc/latest')?new Response(JSON.stringify({synopticFields:{key}})):new Response(bytes);return native.loadSynopticIndex(new AbortController().signal)}
 try{assert.equal((await indexTest(core)).index.models['icon-eu'].frames.length,9);assert.equal((await indexTest(hours)).index.models['icon-eu'].frames.length,13);await assert.rejects(indexTest(hours.filter(h=>h!==36)));await assert.rejects(indexTest([...core,15,15]));await assert.rejects(indexTest([...core,1]));}finally{globalThis.fetch=originalFetch}
 const axis=Array.from({length:12},(_,i)=>29.5+i*3.5),lons=Array.from({length:12},(_,i)=>-23.5+i*7.5),fc={type:'FeatureCollection',features:[]},model={run,resolutionKm:14},ref=frame(15),field={schema:'mid.synoptic.field.v1',model:'icon-eu',run,time:ref.time,resolutionKm:14,unit:'°C',scale:.1,lats:axis,lons,thetae:Array(144).fill(360),height:fc,pressure:fc,humidity:fc,thetaContours:fc,wind:[]};
 assert.equal(native.validateSynopticField(field,'icon-eu',model,ref),field);assert.equal(native.synopticAt(field,35,-15),36);assert.throws(()=>native.validateSynopticField({...field,lats:axis.map(v=>v-1)},'icon-eu',model,ref));
 const malformed={type:'FeatureCollection',features:[{type:'Feature',properties:{level:192,label:'192'},geometry:{type:'LineString',coordinates:[[0,40],[1,41],[2,42]]}}]};assert.throws(()=>native.validateSynopticField({...field,thetaContours:malformed},'icon-eu',model,ref));
 const read=p=>readFileSync(p,'utf8');assert.ok(!read('src/OperaRasterOverlay.tsx').includes('setRaster(null)'));assert.ok(!read('src/RadarPanel.tsx').includes('key={`${operaDisplayFrame.fileUrl}:${radarColorTableId}`}'));
 console.log('C21: 60 kt wind threshold, strength scaling, discrete Theta-E bands, expanded native domain, optional complete terms and shared OPERA buffer verified.');
}finally{rmSync(temporary,{recursive:true,force:true})}
