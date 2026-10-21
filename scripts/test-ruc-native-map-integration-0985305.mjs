import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
const dir=await mkdtemp(resolve(tmpdir(),'mid-ruc-integration-'));
try{
 const result=await build({stdin:{contents:`export * from './src/rucNativeMapIndex';export * from './src/nativeModelFields';export * from './src/unifiedMapCatalog';export * from './src/nativeModelMapExport';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
 const path=resolve(dir,'test.mjs');await writeFile(path,result.outputFiles[0].text);const m=await import(path);
 const stamp=Date.UTC(2026,9,21,0),run=new Date(stamp).toISOString(),rootRun='2026-10-21T00:00';
 const make=(hours=27)=>({schema:'mid.ruc.map-fields.v1',modelId:'icon-d2-ruc',sampling:'nearest-native-cell',maxNearestKm:5,sourceManifestSha256:'2'.repeat(64),run,products:Object.fromEntries(m.RUC_MAP_KINDS.map(kind=>[kind,{unit:{temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',precipitation:'mm/1 h'}[kind],frames:Array.from({length:hours+1},(_,hour)=>({hour,time:new Date(stamp+hour*3600000).toISOString(),file:`${kind}-${String(hour).padStart(3,'0')}.bin`,sha256:'1'.repeat(64),bytes:100,decodedBytes:1000,encoding:'gzip-json',intervalHours:['gust','precipitation'].includes(kind)?1:0})).filter(f=>!['gust','precipitation'].includes(kind)||f.hour>0)}]))});
 for(const tz of ['UTC','Europe/Berlin','Asia/Kathmandu','America/St_Johns']){process.env.TZ=tz;for(const hours of [14,27])assert.equal(m.validateRucMapIndex(make(hours),rootRun,stamp+3600000).products.temperature.frames.length,hours+1)}
 for(const mutate of [i=>i.schema='mid.ruc.map-candidate.v1',i=>i.modelId='icon-d2',i=>i.products.wind.frames.pop(),i=>i.products.gust.frames[0].intervalHours=0,i=>i.products.temperature.unit='K',i=>i.products.temperature.frames[0].time=rootRun,i=>i.products.temperature.frames[0].file='../bad.bin']){const index=make();mutate(index);assert.throws(()=>m.validateRucMapIndex(index,rootRun,stamp))}
 assert.throws(()=>m.validateRucMapIndex(make(),rootRun,stamp+5*3600000));
 const index=make(),ref=index.products.temperature.frames[0],field={schema:'mid.ruc.map-field.v1',modelId:'icon-d2-ruc',sampling:'nearest-native-cell',run,time:ref.time,kind:'temperature',unit:'°C',scale:.01,lats:[47,51.1,55.2],lons:[5.5,10.55,15.6],values:[null,0,1234,100,200,300,400,500,600],isobars:[]};
 const d=m.validateNativeField(field,index,ref,'temperature');assert.equal(field.values[0],null);assert.equal(m.nativeAt(d,47,5.5),null);assert.equal(m.nativeAt(d,47,10.55),0);assert.equal(m.nativeAt(d,47,15.6),12.34);assert.equal(m.nativeFieldModel(d),'icon-d2-ruc');
 for(const bad of [{...field,schema:'mid.ruc.map-field-candidate.v1'},{...field,modelId:'icon-d2'},{...field,values:field.values.map(()=>null)}])assert.throws(()=>m.validateNativeField(bad,index,ref,'temperature'));
 for(const kind of m.RUC_MAP_KINDS)assert(m.unifiedSources(kind,null,false,false,index).some(s=>s.id==='icon-d2-ruc'));
 for(const kind of ['sigwx','thetae','totals','observed'])assert(!m.unifiedSources(kind,null,false,false,index).some(s=>s.id==='icon-d2-ruc'));
 globalThis.localStorage={getItem:()=>JSON.stringify({modelId:'icon-d2-ruc'})};assert.equal(m.readUnifiedMapSettings().modelId,'icon-d2-ruc');
 assert(m.nativeFieldSvg(d,'Temperatur','data:image/png;base64,',[],0).includes('ICON-D2-RUC · Lauf'));
 // Index is separately byte/SHA-verified before its capabilities become visible.
 const encoded=new TextEncoder().encode(JSON.stringify(index)),digest=Buffer.from(await crypto.subtle.digest('SHA-256',encoded)).toString('hex'),key='runs/test__rucmaps_1234567890123456/ruc-model-fields/index.json';
 const originalNow=Date.now,originalFetch=globalThis.fetch;Date.now=()=>stamp+3600000;
 try{
  for(const corrupt of [false,true]){
   globalThis.fetch=async url=>String(url).includes('latest.json')?new Response(JSON.stringify({schema:'mid.dwd.ruc.grid.v2',storageProfile:'pages-lossless-v1',run:rootRun,rucModelFields:{key,bytes:encoded.length,sha256:corrupt?'0'.repeat(64):digest}})):new Response(encoded);
   if(corrupt)await assert.rejects(m.loadRucNativeIndex(new AbortController().signal));else assert.equal((await m.loadRucNativeIndex(new AbortController().signal)).index.modelId,'icon-d2-ruc');
  }
 }finally{Date.now=originalNow;globalThis.fetch=originalFetch}
 console.log('RUC integration: UTC/freshness/complete axes/SHA/units/NoData/dry zero/catalog/persistence/export passed');
}finally{await rm(dir,{recursive:true,force:true})}
