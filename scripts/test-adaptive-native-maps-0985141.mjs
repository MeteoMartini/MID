import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {gzipSync} from 'node:zlib';
const temp=mkdtempSync(join(tmpdir(),'mid141-contract-')),read=p=>readFileSync(p,'utf8');
try{
 await build({stdin:{contents:"export * from './src/nativeModelFields';export * from './src/nativeMapCompression';export * from './src/precipitationTotals';export * from './src/ForecastRangeGuide';export * from './src/forecastAmountFormat';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'contract.mjs'),loader:{'.css':'empty'},logLevel:'silent'});
 const {compactPrecipitationAmount,adaptiveForecastRanges,validateTotals,totalsAt,totalsStartAt,validateNativeField,nativeAt,nativeColor,loadNativeField,decodeNativeMapGzip}=await import(pathToFileURL(join(temp,'contract.mjs')));
 assert.equal(compactPrecipitationAmount(0),'0');assert.equal(compactPrecipitationAmount(.01),'<0,1');assert.equal(compactPrecipitationAmount(.001,2),'<0,01');assert.equal(compactPrecipitationAmount(1.2),'1,2');assert.equal(compactPrecipitationAmount(NaN),'–');assert.equal(compactPrecipitationAmount(-1),'–');
 const day={memberCount:12,modelCount:2,maxLow:10,maxQ25:12,maxQ75:16,maxHigh:20,maxMean:15,minLow:0,minQ25:2,minQ75:4,minHigh:6,minMean:3,precipitationLow:0,precipitationQ25:0,precipitationQ75:2,precipitationHigh:4,precipitationMean:1,windLow:2,windQ25:4,windQ75:6,windHigh:8,windMean:5,gustLow:10,gustQ25:12,gustQ75:16,gustHigh:20,gustMean:15};
 assert.equal(adaptiveForecastRanges(day).length,5);assert.equal(adaptiveForecastRanges({...day,windHigh:NaN}).length,4);assert.equal(adaptiveForecastRanges({...day,precipitationQ25:8}).some(r=>r.key==='rain'),false);assert.equal(adaptiveForecastRanges({...day,modelCount:0,memberCount:0}).length,0);
 assert.equal(adaptiveForecastRanges(day).find(r=>r.key==='temperature').point,undefined,'Legacy mean must not masquerade as P50');
 assert.equal(adaptiveForecastRanges({...day,maxMedian:14,maxMean:99}).find(r=>r.key==='temperature').point,14,'True P50 independent of mean');
 const rangesSource=read('src/ForecastRangeGuide.tsx'),cockpitSource=read('src/ForecastCockpit.tsx'),ensembleSource=read('src/weather-src/30-ensemble-climate-hazards.tsfrag');
 assert.ok(rangesSource.includes("adaptiveForecastRanges(day).filter(r=>r.key!=='wind')")&&!rangesSource.includes("(!compact||r.key!=='minimum')"),'Compact and full views retain Tmax, Tmin, rain and gust while suppressing mean wind');
 assert.ok(!rangesSource.includes('point=r.key===\'temperature\'?temperature'),'Best Match must not replace ensemble P50');
 for(const field of ['maxVals','minVals','rainVals','gustVals'])assert.ok(ensembleSource.includes('weightedQuantile('+field+',.5)'));
 assert.ok(!cockpitSource.includes('Kurzfrist: Radarspannen'));
 assert.ok(!cockpitSource.includes('<path className="seven-day-curve-temperature-halo"'));
 assert.ok(cockpitSource.includes('row.epoch===hour.epoch')&&cockpitSource.includes('row.p25<=row.p75')&&cockpitSource.includes('row.memberCount>=6')&&cockpitSource.includes('===HOUR_MS'),'Exact hourly quantiles, evidence and contiguous-only polygons');
 const run=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString(),observed={schema:'mid.radolan.observed.v1',kind:'observed',run,scale:.1,lats:[47,51.1,55.2],lons:[5.5,10.55,15.6],frames:[{hours:1,validFrom:new Date(Date.parse(run)-3600000).toISOString(),validTo:run,maximum:1.2,values:[-1,0,1,2,12,4,5,6,7]}]};
 assert.equal(validateTotals(observed),observed);assert.equal(totalsAt(observed,observed.frames[0],47,5.5),null);assert.equal(totalsAt(observed,observed.frames[0],47,10.55),0);assert.equal(totalsStartAt(observed,observed.frames[0]),observed.frames[0].validFrom);assert.throws(()=>validateTotals({...observed,frames:[{...observed.frames[0],values:Array(9).fill(-1),maximum:0}]}));assert.throws(()=>validateTotals({...observed,frames:[{...observed.frames[0],validTo:new Date(Date.parse(run)+3600000).toISOString()}]}));
 const ref={hour:1,time:new Date(Date.parse(run)+3600000).toISOString(),file:'temperature-001.json',sha256:'',bytes:0,intervalHours:0},index={schema:'mid.icon-d2.fields.v1',run,products:{temperature:{unit:'°C',frames:[ref]}}},field={schema:'mid.icon-d2.field.v1',run,time:ref.time,kind:'temperature',unit:'°C',scale:.1,lats:observed.lats,lons:observed.lons,values:[-100,0,100,120,150,180,200,240,280],isobars:[]};
 assert.equal(validateNativeField(field,index,ref,'temperature'),field);assert.equal(nativeAt(field,47,5.5),-10);assert.equal(nativeAt(field,52,20),null);assert.equal(nativeColor('precipitation',0),'transparent');assert.throws(()=>validateNativeField({...field,kind:'pressure'},index,ref,'temperature'));assert.throws(()=>validateNativeField({...field,values:[1]},index,ref,'temperature'));
 const bytes=new TextEncoder().encode(JSON.stringify(field));ref.bytes=bytes.length;ref.sha256=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');const originalFetch=globalThis.fetch;globalThis.fetch=async()=>new Response(bytes);try{assert.equal((await loadNativeField(index,'/ruc/fields/',ref,'temperature',new AbortController().signal)).values[0],-100);await assert.rejects(()=>loadNativeField(index,'/ruc/fields/',{...ref,sha256:'0'.repeat(64)},'temperature',new AbortController().signal))}finally{globalThis.fetch=originalFetch}
 const zipped=gzipSync(bytes),buffer=zipped.buffer.slice(zipped.byteOffset,zipped.byteOffset+zipped.byteLength),expected=new TextDecoder().decode(bytes),stream=globalThis.DecompressionStream;
 for(const fallback of [false,true]){if(fallback)globalThis.DecompressionStream=undefined;try{assert.equal(await decodeNativeMapGzip(buffer,bytes.length),expected);await assert.rejects(()=>decodeNativeMapGzip(buffer,bytes.length-1));await assert.rejects(()=>decodeNativeMapGzip(buffer,bytes.length+1));await assert.rejects(()=>decodeNativeMapGzip(buffer.slice(0,12),bytes.length));}finally{globalThis.DecompressionStream=stream}}
 globalThis.fetch=async()=>new Response(zipped);try{const compressedRef={...ref,file:'temperature-001.bin',encoding:'gzip-json',decodedBytes:bytes.length,bytes:zipped.length,sha256:Buffer.from(await crypto.subtle.digest('SHA-256',buffer)).toString('hex')};assert.equal((await loadNativeField(index,'/ruc/fields/',compressedRef,'temperature',new AbortController().signal)).values[0],-100)}finally{globalThis.fetch=originalFetch}
 const panel=read('src/WeatherMapsPanel.tsx'),prepare=read('tools/ruc/prepare_ruc_pages.py'),observedBuilder=read('tools/ruc/build_observed_precipitation.py');assert.ok(panel.includes('<NativeModelMap')&&panel.includes("'observed-totals'"));assert.ok(prepare.includes("'modelFields':model_fields")&&prepare.includes("'observedPrecipitation':observed"));assert.ok(observedBuilder.includes('stamp.minute==50')&&observedBuilder.includes('values[~valid]=-1'));assert.ok(read('src/precipitationTotalsExport.ts').includes('totalsStartAt(data,frame)'));
 console.log('MID141: independent parameter ranges, zero/trace amounts, non-overlapping observations, missing-cell semantics, native raster/time integrity and SHA256 verified.');
}finally{rmSync(temp,{recursive:true,force:true})}
await import('./verify-model-map-presentation-0985148.mjs');
await import('./verify-model-map-point-0985149.mjs');
if(process.env.CI==='true'||process.env.MID_BROWSER_QA==='1'){
 await import('./verify-native-model-browser-0985141.mjs');
 await import('./verify-compact-ensemble-browser-0985143.mjs');
 await import('./verify-forecast-views-browser-0985145.mjs');
}
