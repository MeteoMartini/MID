import assert from 'node:assert/strict';
import {build,transformSync} from 'esbuild';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const dir=mkdtempSync(join(process.cwd(),'.mid428-'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const saved={fetch:globalThis.fetch,caches:globalThis.caches,location:globalThis.location};
let denyEviction=false,deniedDeletes=0,droppedCaches=0;const entries=new Map(),key=r=>typeof r==='string'?r:r.url;
// CacheStorage stores bytes, not live one-shot Response streams.
async function putEntry(r,v){entries.set(key(r),{bytes:new Uint8Array(await v.arrayBuffer()),headers:new Headers(v.headers)})}
globalThis.location=new URL('https://www.midwx.app/');
globalThis.caches={open:async()=>({match:async r=>{const row=entries.get(key(r));return row?new Response(row.bytes.slice(),{headers:row.headers}):undefined},put:putEntry,delete:async r=>{if(denyEviction){deniedDeletes++;return false}return entries.delete(key(r))},keys:async()=>[...entries.keys()].map(r=>new Request(r))}),delete:async()=>{droppedCaches++;entries.clear();return true}};
let cases=0;const check=()=>cases++;
try{
 const originalRoot='docs/handoffs/MID_18_2_73_originals/',manifest=JSON.parse(readFileSync(originalRoot+'manifest.json','utf8'));
 for(const file of manifest.files){const bytes=readFileSync(originalRoot+file.path);assert.equal(bytes.length,file.sizeBytes);assert.equal(sha(bytes),file.sha256,'Secured original changed: '+file.path)}check();
 for(const name of ['verifiedMapFrameCache','nativeModelFields','cloudWeatherIsobars','synopModelPlot','cloudWeatherExport','precipitationTypeSymbols'])await build({entryPoints:[`src/${name}.ts`],outfile:join(dir,name+'.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const load=(name,tag='')=>import(pathToFileURL(join(dir,name+'.mjs')).href+'?'+tag);
 const c=await load('verifiedMapFrameCache'),p='/ruc/runs/2026110406/model-fields/temperature-001.json';
 let calls=0,body=Buffer.from('{"values":[0,null,12]}');
 globalThis.fetch=async()=>{calls++;return new Response(body,{headers:{'content-length':String(body.length)}})};
 const a=await c.fetchVerifiedMapFrameBytes(p,sha(body),body.length);
 assert.deepEqual(JSON.parse(Buffer.from(a).toString()).values,[0,null,12]);check();
 new Uint8Array(a)[0]=0;assert.equal(new Uint8Array(await c.fetchVerifiedMapFrameBytes(p,sha(body),body.length))[0],123);assert.equal(calls,1);check();
 const reopened=await load('verifiedMapFrameCache','reopen');await reopened.fetchVerifiedMapFrameBytes(p,sha(body),body.length);assert.equal(calls,1);check();
 const id=[...entries.keys()][0];await putEntry(id,new Response(Buffer.alloc(body.length),{headers:{'content-length':String(body.length),'x-mid-verified-cached-at':String(Date.now())}}));
 await(await load('verifiedMapFrameCache','poison')).fetchVerifiedMapFrameBytes(p,sha(body),body.length);assert.equal(calls,2);check();
 await putEntry(id,new Response(body,{headers:{'content-length':String(body.length),'x-mid-verified-cached-at':String(Date.now()+86400000)}}));
 await(await load('verifiedMapFrameCache','future')).fetchVerifiedMapFrameBytes(p,sha(body),body.length);assert.equal(calls,3);check();
 await putEntry(id,new Response(body,{headers:{'content-length':String(body.length),'x-mid-verified-cached-at':String(Date.now()-c.MID_MAP_CACHE_TTL_MS-1)}}));
 await(await load('verifiedMapFrameCache','expired')).fetchVerifiedMapFrameBytes(p,sha(body),body.length);assert.equal(calls,4);check();
 for(const bad of ['/ruc/latest.json','https://evil.test/ruc/runs/x/model-fields/a.json','/ruc/runs/x/model-fields/a.json?x=1','/ruc/runs/x/model-fields/../../latest.json'])await assert.rejects(c.fetchVerifiedMapFrameBytes(bad,sha(body),body.length));check();
 await c.clearVerifiedMapFrameCache();calls=0;
 const large=Buffer.alloc(8*1024*1024,61);globalThis.fetch=async()=>{calls++;return new Response(large,{headers:{'content-length':String(large.length)}})};
 for(let i=0;i<4;i++)await c.fetchVerifiedMapFrameBytes(`/ruc/runs/2026110406/model-fields/t-${i}.bin`,sha(large),large.length);
 assert.ok([...entries.values()].reduce((sum,r)=>sum+Number(r.headers.get('content-length')),0)<=c.MID_MAP_CACHE_MAX_BYTES);
 await c.fetchVerifiedMapFrameBytes('/ruc/runs/2026110406/model-fields/t-0.bin',sha(large),large.length);assert.equal(calls,5,'Both RAM and disk must evict beyond the 24 MiB byte budget');check();
 await c.clearVerifiedMapFrameCache();calls=0;denyEviction=true;deniedDeletes=0;droppedCaches=0;
 for(let i=0;i<4;i++)await c.fetchVerifiedMapFrameBytes(`/ruc/runs/2026110406/model-fields/deny-${i}.bin`,sha(large),large.length);
 assert.equal(deniedDeletes,1,'Force the actual overbudget delete-failure path');assert.equal(droppedCaches,1,'Drop exactly the isolated field cache');assert.equal(entries.size,0,'If eviction is denied, drop only the verified persistent field cache instead of retaining overbudget bytes');denyEviction=false;check();
 await c.clearVerifiedMapFrameCache();calls=0;
 let complete;globalThis.fetch=async()=>{calls++;await new Promise(resolve=>{complete=resolve});return new Response(body)};
 const cancel=new AbortController(),first=c.fetchVerifiedMapFrameBytes(p,sha(body),body.length,cancel.signal),second=c.fetchVerifiedMapFrameBytes(p,sha(body),body.length);
 const cancelled=assert.rejects(first,/cancelled/);cancel.abort(new Error('cancelled'));
 while(!complete)await new Promise(r=>setTimeout(r,0));complete();await cancelled;assert.deepEqual(Buffer.from(await second),body);assert.equal(calls,1,'Concurrent callers share one network request; one abort must not cancel another');check();
 await c.clearVerifiedMapFrameCache();globalThis.fetch=async()=>new Response(new ReadableStream({start(controller){controller.enqueue(Buffer.alloc(body.length+1));controller.close()}}));
 await assert.rejects(c.fetchVerifiedMapFrameBytes(p,sha(body),body.length),/überschreitet die geprüfte Größe/);check();
 await c.clearVerifiedMapFrameCache();
 const fieldLoader=await load('nativeModelFields'),run=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString();let pointerCalls=0,fieldCalls=0;
 const field={schema:'mid.icon-d2.field.v1',run,time:new Date(Date.parse(run)+3600000).toISOString(),kind:'temperature',unit:'°C',scale:.1,lats:[47,55.2],lons:[5.5,15.6],values:[0,10,20,30],isobars:[]};
 const bytes=Buffer.from(JSON.stringify(field)),ref={hour:1,time:field.time,file:'temperature-001.json',sha256:sha(bytes),bytes:bytes.length,intervalHours:0};
 const index={schema:'mid.icon-d2.fields.v1',run,products:{temperature:{unit:'°C',frames:[ref]}}};
 globalThis.fetch=async url=>{if(String(url).includes('latest.json')){pointerCalls++;return Response.json({modelFields:{key:'runs/2026110406/model-fields/index.json'}})}if(String(url).includes('index.json'))return Response.json(index);fieldCalls++;return new Response(bytes)};
 for(let i=0;i<2;i++){const admitted=await fieldLoader.loadNativeIndex(new AbortController().signal);const f=await fieldLoader.loadNativeField(admitted.index,admitted.base,ref,'temperature',new AbortController().signal);assert.equal(f.values[0],0)}
 assert.equal(pointerCalls,2);assert.equal(fieldCalls,1,'Warm reopening checks current pointer but reuses verified bytes');check();
 await assert.rejects(fieldLoader.loadNativeField({...index,run:'wrong'},'/ruc/runs/2026110406/model-fields/',ref,'temperature',new AbortController().signal),/Gültigkeitszeit/);check();
 globalThis.fetch=async()=>{throw Error('offline')};await assert.rejects(fieldLoader.loadNativeIndex(new AbortController().signal),/offline/);check();
 const glyph=await load('synopModelPlot'),codes=[51,53,55,56,57,61,63,65,66,67,68,69,71,73,75,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,96,97,99];
 for(const code of codes)assert.equal(glyph.verifiedModelPrecipGlyph(code)?.ww,code);
 for(const bad of [null,undefined,NaN,Infinity,0,3,45,71.5,'71',false])assert.equal(glyph.verifiedModelPrecipGlyph(bad),null);check();
 const solidCodes=[56,57,66,67,68,69,71,73,75,77,78,79,83,84,85,86,87,88,89,90,96,99];
 for(const code of solidCodes){const rendered=glyph.modelPrecipGlyphSvg(glyph.verifiedModelPrecipGlyph(code));assert.match(rendered,/<rect[^>]+fill="#fff"/);assert.match(rendered,new RegExp(`Modellcode ww ${code}`));assert.doesNotMatch(rendered,/fill-opacity=/)}
 const phases=await load('precipitationTypeSymbols'),phaseNames=['snow','snow-grains','snow-stars','ice-crystals','ice-pellets','mixed','freezing','graupel','hail','graupel-hail'];assert.equal(new Set(phaseNames.map(phase=>phases.precipitationTypeSymbolSvg(phase))).size,phaseNames.length,'Every phase has a distinct original contour');
 for(const code of [51,53,55,61,63,65,80,81,82,95,97])assert.equal(glyph.modelPrecipGlyphSvg(glyph.verifiedModelPrecipGlyph(code)),'','Liquid/unknown thunder phase has no phase plate');
 for(const code of [51,61,80,95])assert.equal(glyph.sparseModelWeatherGlyphs({lats:[50,51],lons:[7,8],weather:[code,code,code,code]},(lat,lon)=>({x:lon*10,y:lat-40}),{width:500,height:500}).length,0);check();
 const weather=Array(160*160).fill(null);weather[73*160+75]=99;
 assert.ok(glyph.sparseModelWeatherGlyphs({lats:Array.from({length:160},(_,i)=>i),lons:Array.from({length:160},(_,i)=>i),weather},(lat,lon)=>({x:lon*3,y:lat*3}),{width:500,height:500}).some(x=>x.glyph.ww===99));check();
 const contours=await load('cloudWeatherIsobars'),cloud={model:'icon-d2',run,time:field.time,lats:[47,55.2],lons:[5.5,15.6],cloud:[0,50,100,null],weather:[77,78,99,null]},pressure={...field,kind:'pressure',modelId:'icon-d2',unit:'hPa',isobars:[{level:1010,paths:[[[48,7],[49,8]]]}]};
 assert.ok(contours.nativeCloudIsobars(cloud,pressure));for(const patch of [{modelId:'icon-d2-ruc'},{run:'wrong'},{time:'wrong'},{unit:'Pa'}])assert.equal(contours.nativeCloudIsobars(cloud,{...pressure,...patch}),null);check();
 const exporter=await load('cloudWeatherExport'),svg=exporter.cloudWeatherSvg(cloud,'data:image/png;base64,AA==',[]);
 assert.doesNotMatch(svg.slice(svg.indexOf('<g clip-path="url(#map)">'),svg.indexOf('</g><text x="50" y=')),/Modellcode ww/,'No phase glyphs on a non-radar export');assert.match(svg,/Modellcode ww 96/);assert.match(svg,/kein Satellitenbild/);assert.doesNotMatch(svg,/SYNOP-Beobachtung/);check();
 const overlay=readFileSync('src/RadarModelPrecipTypeOverlay.tsx','utf8');
 assert.ok(readFileSync('src/RadarPanel.tsx','utf8').includes('radarModelPhaseRenderable=showRadar&&showPrecipitationType&&'),'Phase marks require visible radar');
 for(const source of ['src/UnifiedWeatherMap.tsx','src/NativeModelMap.tsx'])assert.doesNotMatch(readFileSync(source,'utf8'),/<CloudWwMarkers/,'No phase marks from cloud/model map without echo support');
 assert.ok(overlay.includes("'ice-pellets','freezing','hail','graupel','graupel-hail'].includes(phase)"),'Whitelist includes freezing precipitation, with the existing cold/echo checks');

 for(const gate of ['if(!echo.covered||!Number.isFinite(echo.maxDbz))continue','if(echo.maxDbz<phaseMinimumDbz(typed))continue','OPERA-CIRRUS-Echomaske fehlt; die Niederschlagsart bleibt aus.'])assert.ok(overlay.includes(gate),'Retain unique historical OPERA gate '+gate);check();
 { // Exercise the real image-layer lifecycle with deterministic image/network/RAF delays.
 const core=readFileSync('src/MapLibreCore.tsx','utf8'),start=core.indexOf('export function ImageQuadLayer('),end=core.indexOf('\n}',start)+2;
 const compiled=transformSync(core.slice(start,end).replace('export function','function'),{loader:'tsx',target:'es2022'}).code;
 let now=0,hook=0,serial=0,reduced=false;const refs=[],effects=[],pending=[],rafs=new Map(),timers=new Map(),images=[],layers=new Map(),sources=new Map();
 const listeners=new Map(),loadedSources=new Set(),emit=(event,data={})=>{for(const cb of [...(listeners.get(event)??[])])cb(data)};
 const map={addSource:(id,source)=>sources.set(id,{...source,updateImage(){}}),getSource:id=>sources.get(id),removeSource:id=>{sources.delete(id);loadedSources.delete(id)},addLayer:layer=>layers.set(layer.id,layer),getLayer:id=>layers.get(id),removeLayer:id=>layers.delete(id),setPaintProperty:(id,key,value)=>{assert.ok(layers.has(id));layers.get(id).paint[key]=value},on:(event,cb)=>{if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event).add(cb)},off:(event,cb)=>listeners.get(event)?.delete(cb),isSourceLoaded:id=>loadedSources.has(id),triggerRepaint:()=>{}};
 const useRef=value=>{const index=hook++;return refs[index]??= {current:value}},useEffect=(fn,deps)=>{const index=hook++,old=effects[index];if(!old||deps.some((value,i)=>value!==old.deps[i]))pending.push(()=>{old?.cleanup?.();effects[index]={deps,cleanup:fn()}})};
 class FakeImage{constructor(){images.push(this)}removeAttribute(){}}
 const env={useMidMap:()=>map,useRef,useEffect,safeId:id=>id,registerMapLayerOrder(){},unregisterMapLayerOrder(){},Image:FakeImage,performance:{now:()=>now},requestAnimationFrame:fn=>{const id=++serial;rafs.set(id,fn);return id},cancelAnimationFrame:id=>rafs.delete(id),window:{matchMedia:()=>({matches:reduced}),setTimeout:(fn,delay)=>{const id=++serial;timers.set(id,{fn,time:now+delay});return id},clearTimeout:id=>timers.delete(id)}};
 const Layer=new Function(...Object.keys(env),compiled+';return ImageQuadLayer')(...Object.values(env));
 let errors=0,displayed=[];const render=(url,frameKey=url)=>{hook=0;Layer({id:'test',url,frameKey,bounds:[[47,5],[55,15]],onReady:()=>displayed.push(url),onError:()=>errors++});pending.splice(0).forEach(fn=>fn())},tick=ms=>{now+=ms;const jobs=[...rafs.values()];rafs.clear();jobs.forEach(fn=>fn(now));for(const [id,timer] of [...timers])if(timer.time<=now){timers.delete(id);timer.fn()}};
 const ready=()=>{loadedSources.add([...sources.keys()].at(-1));emit('render')};
 render('a');assert.equal(layers.size,0,'Initial cloud frame must not be opaque while it has not loaded');images.at(-1).onload();assert.equal(layers.size,1);assert.equal([...layers.values()][0].paint['raster-opacity'],.001,'A decoded but not MapLibre-render-ready image must stay translucent');tick(250);assert.equal([...layers.values()][0].paint['raster-opacity'],.001,'Never fade ahead of GPU readiness');assert.deepEqual(displayed,[],'A loading image must not replace the displayed time');ready();tick(400);assert.equal([...layers.values()][0].paint['raster-opacity'],1);assert.deepEqual(displayed,['a']);
 const old=[...layers.keys()][0];render('b');assert.equal(layers.get(old).paint['raster-opacity'],1,'Old image stays fully visible while next URL is pending');images.at(-1).onerror();assert.equal(errors,1);assert.ok(layers.has(old),'Failed image never erases displayed source');
 render('c');images.at(-1).onload();tick(175);assert.equal(layers.get(old).paint['raster-opacity'],1,'Keep the previous image until the successor has rendered');ready();tick(175);assert.equal(layers.size,2);assert.deepEqual(displayed,['a'],'Forecast time remains tied to old fully visible frame until crossfade ends');assert.ok(layers.get(old).paint['raster-opacity']>0,'Previous image survives the transition');
 render('d');images.at(-1).onload();assert.equal(layers.size,2,'Rapid selection does not allocate a third raster');tick(200);tick(25);assert.equal(layers.size,2,'Next decoded frame starts after the preceding transition');ready();tick(400);assert.equal(layers.size,1);assert.equal(sources.size,1);assert.deepEqual(displayed,['a','c','d'],'Only fully displayed model frames may advance visible run/time');
 render('stage-error');images.at(-1).onload();const bad=[...sources.keys()].at(-1);emit('error',{sourceId:bad});assert.equal(errors,2);assert.deepEqual(displayed,['a','c','d'],'Failed source must never update displayed model time');assert.equal(layers.size,1,'Failed MapLibre upload retains the last complete image');assert.ok(!sources.has(bad));
 render('cancelled');const cancelled=images.at(-1);render('latest');assert.equal(cancelled.onload,null,'Superseded image cannot install a stale term');images.at(-1).onload();ready();tick(400);assert.equal(layers.size,1);
 const sameUrlCount=displayed.length;render('same-raster','run-1');images.at(-1).onload();ready();tick(400);assert.equal(displayed.length,sameUrlCount+1);
 render('same-raster','run-2');images.at(-1).onload();assert.equal(displayed.length,sameUrlCount+1,'Same image bytes but a new forecast validity must wait for GPU-ready paint');ready();tick(400);assert.equal(displayed.length,sameUrlCount+2,'Distinct run/time must be acknowledged even when PNG bytes are identical');
 reduced=true;render('reduced');images.at(-1).onload();ready();tick(1);assert.equal(displayed.at(-1),'reduced');assert.equal(layers.size,1,'Reduced motion still requires an actually renderable successor');effects.forEach(effect=>effect?.cleanup?.());assert.equal(layers.size,0);assert.equal(sources.size,0);assert.equal(rafs.size,0);assert.equal(timers.size,0);assert.equal(listeners.get('render')?.size??0,0);assert.equal(listeners.get('error')?.size??0,0);check();
 }
 for(const [path,expected] of Object.entries({'src/synopPrecipitationSymbols.ts':'a6cf1869f801dd03209aba5d6fafc24a4456e035','src/RadarModelPrecipTypeOverlay.tsx':'51c7b3a463ed963b0c0706e857bd4a7bb5e63060','scripts/test-synop-precipitation-symbols-0985337.mjs':'bcd620bb09734c606fee9478d8d3d8ef3ea728b1'})){const bytes=readFileSync('docs/handoffs/PR480_originals/'+path);assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex'),expected,'Historic PR480 original changed: '+path)}check();
 console.log(`MID .428: ${cases} cache/pointer/run/NoData/glyph/contour/export cases passed. No native data activation or physical-device proof.`);
}finally{Object.assign(globalThis,saved);rmSync(dir,{recursive:true,force:true})}
