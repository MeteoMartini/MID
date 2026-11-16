import {synopticBrowserFixtureHours} from './lib/synopticBrowserFixtureHours.mjs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {appendFile,writeFile} from 'node:fs/promises';
import {installMapBrowserProbe,snapshotMapBrowserProbe} from './lib/mapBrowserPerformanceProbe.mjs';
import {summarizePhases} from './lib/mapBaselineStatistics.mjs';
import {mapBrowserMemoryProbe,mapBrowserCases,mapBrowserCaseConcurrency} from './map-browser-shards.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {realpathSync,readFileSync} from 'node:fs';
import {profileMapCycles} from './lib/mapMemoryProfile.mjs';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim()),pw=require(join(dirname(dirname(cli)),'playwright'));
const seasonalDraftPilot=process.env.GITHUB_ACTIONS!=='true'&&Boolean(process.env.MID_MAP_QA_PILOT_CASE);
const seasonalDraftKeys=seasonalDraftPilot?process.env.MID_MAP_QA_PILOT_CASE.split(','):[];
const seasonalDraftAllowed=new Map(mapBrowserCases().map(row=>[`${row.width}/${row.theme}/${row.design}`,row]));
if(seasonalDraftPilot&&(seasonalDraftKeys.length<1||seasonalDraftKeys.length>4||
  new Set(seasonalDraftKeys).size!==seasonalDraftKeys.length||
  !seasonalDraftKeys.includes('390/light/next')||
  seasonalDraftKeys.some(key=>!seasonalDraftAllowed.has(key))))
 throw Error('Seasonal read-only Chrome pilot requires 1-4 distinct canonical map cases including 390/light/next');
// The Draft-only browser probe runs on ubuntu-latest (currently Ubuntu 26.04):
// pinned Playwright 1.56.1 cannot install its bundled Chromium there.
// Use the GitHub runner's already-installed stable Chrome for this narrow probe.
// The mandatory Source-Gate retains its pinned Chromium installation on ubuntu-24.04.
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
process.env.VITE_WORKER_SAME_ORIGIN_PATH='/__qa-worker';
const server=await createServer({cacheDir:join(process.cwd(),'node_modules/.vite-mid-map-qa'),server:{host:'127.0.0.1',port:0,watch:null,hmr:false},plugins:[{name:'mid-real-map-qa',configureServer(vite){vite.middlewares.use('/__map-qa',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml('/__map-qa',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;font:14px system-ui;background:#edf2f5;color:#152b40}button,select,input{font:inherit}*{box-sizing:border-box}#root{max-width:1400px;margin:auto}</style></head><body><div id="root"></div><script type="module" src="/scripts/fixtures/unified-map-browser.tsx"></script></body></html>`))})}}]});await server.listen();
const address=server.httpServer.address(),base=`http://127.0.0.1:${address.port}`,browser=await pw.chromium.launch({...(seasonalDraftPilot?{channel:'chrome'}:process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const hour=3600000,runMs=Math.floor(Date.now()/hour)*hour-hour,run=new Date(runMs).toISOString(),observedTime=new Date(runMs+hour-17*60000).toISOString(),lats=[47,49.05,51.1,53.15,55.2],lons=[5.5,8.025,10.55,13.075,15.6],products={},objects=new Map(),units={temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',thetae:'K',sigwx:'WMO',precipitation:'mm/1 h'};
for(const [kind,unit]of Object.entries(units)){products[kind]={unit,frames:[]};for(const h of [1,2,3,4,5,6,12,24,48]){const value=kind==='pressure'?10150:kind==='thetae'?3100:kind==='sigwx'?610:kind==='precipitation'?10:150,payload=JSON.stringify({schema:'mid.icon-d2.field.v1',run,time:new Date(runMs+h*hour).toISOString(),kind,unit,scale:.1,lats,lons,values:Array(25).fill(value),centers:kind==='pressure'?[{type:'H',lat:51,lon:10,value:1024,prominence:4}]:[],isobars:kind==='pressure'?[{level:1016,paths:[[[49,6],[51,10]],[[51,10],[53,15]]]}]:[]}),file=`${kind}-${String(h).padStart(3,'0')}.json`;objects.set(file,payload);products[kind].frames.push({hour:h,time:new Date(runMs+h*hour).toISOString(),file,bytes:Buffer.byteLength(payload),sha256:createHash('sha256').update(payload).digest('hex'),intervalHours:kind==='gust'||kind==='precipitation'?1:0})}}
const rucProducts={},rucObjects=new Map();
for(const kind of ['temperature','pressure','wind','gust','cloud','precipitation']){rucProducts[kind]={unit:units[kind],frames:[]};for(let h=kind==='gust'||kind==='precipitation'?1:0;h<=27;h++){
 const time=new Date(runMs+h*hour).toISOString(),payload=Buffer.from(JSON.stringify({schema:'mid.ruc.map-field.v1',modelId:'icon-d2-ruc',sampling:'nearest-native-cell',run,time,kind,unit:units[kind],scale:.01,lats,lons,values:Array(25).fill(kind==='pressure'?101500:kind==='precipitation'?0:kind==='temperature'?2345:2500).map((v,i)=>i===0?null:v),centers:kind==='pressure'?[{type:'H',lat:51,lon:10,value:1024,prominence:4}]:[],isobars:kind==='pressure'?[{level:1016,paths:[[[49,6],[51,10]],[[51,10],[53,15]]]}]:[]})),wire=gzipSync(payload),file=`${kind}-${String(h).padStart(3,'0')}.bin`;
 rucObjects.set(file,wire);rucProducts[kind].frames.push({hour:h,time,file,bytes:wire.length,sha256:createHash('sha256').update(wire).digest('hex'),decodedBytes:payload.length,encoding:'gzip-json',intervalHours:kind==='gust'||kind==='precipitation'?1:0});
}}
const rucIndex=Buffer.from(JSON.stringify({schema:'mid.ruc.map-fields.v1',modelId:'icon-d2-ruc',sampling:'nearest-native-cell',maxNearestKm:5,sourceManifestSha256:'2'.repeat(64),run,products:rucProducts})),rucKey='runs/qa__rucmaps_1234567890123456/ruc-model-fields/index.json';
const sums=observed=>({schema:observed?'mid.radolan.observed.v1':'mid.icon-d2.totals.v1',...(observed?{kind:'observed'}:{}),run:new Date(observed?runMs+hour:runMs).toISOString(),generatedAt:new Date().toISOString(),source:'DWD',license:'CC BY 4.0',attribution:'DWD',grid:'QA full-grid fixture',scale:.1,lats,lons,frames:(observed?[1,6,12,24,48]:[6,12,24,48]).map(h=>({hours:h,validTo:new Date(observed?runMs+hour:runMs+h*hour).toISOString(),...(observed?{validFrom:new Date(runMs+hour-h*hour).toISOString()}:{}),maximum:2,values:Array(25).fill(20)}))});
const synopticModels={},synopticObjects=new Map(),synLats=Array.from({length:12},(_,i)=>47+i*.5),synLons=Array.from({length:12},(_,i)=>6+i*.5);
const fc=(level,coordinates)=>({type:'FeatureCollection',features:[{type:'Feature',properties:{level,label:String(level),spacingKm:level===1007?10:100},geometry:{type:'LineString',coordinates}}]});
for(const [id,label,resolutionKm] of [['icon-d2','DWD ICON-D2',2.2],['icon-eu','DWD ICON-EU',14],['icon','DWD ICON Global',28],['gfs','NOAA GFS',28],['ifs','ECMWF IFS',28]]){const frames=[];for(const h of synopticBrowserFixtureHours(id,runMs)){const time=new Date(runMs+h*hour).toISOString(),raw=Buffer.from(JSON.stringify({schema:'mid.synoptic.field.v1',model:id,run,time,resolutionKm,unit:'°C',scale:.1,lats:synLats,lons:synLons,thetae:Array(144).fill(360+Math.min(h*5,800)),centers:[{type:'H',lat:51,lon:10,value:1024,prominence:4}],height:fc(560,[[6,49],[8,50],[11,51]]),pressure:{type:'FeatureCollection',features:[1000,1005,1006,1007,1008,1010,1012,1016,1024].flatMap(p=>fc(p,[[6,50],[8,51],[11,52]]).features)},humidity:{type:'FeatureCollection',features:[...fc(60,[[7,49],[9,50],[11,51]]).features,...fc(80,[[7,50],[9,51],[11,52]]).features]},thetaContours:fc(36,[[7,49],[9,50],[11,51]]),wind:[[8,50,30,10],[8.5,50,20,0],[9,50,60,0]],...(id==='icon-eu'&&[0,3,6,12,24,48].includes(h)?{cloudWeather:{cloudUnit:'%',weatherUnit:'WMO 4677',cloudScale:.1,cloud:Array(144).fill(750),weather:Array(144).fill(61)}}:{})})),bytes=gzipSync(raw),file=`${id}-${String(h).padStart(3,'0')}.bin`;synopticObjects.set(file,bytes);frames.push({hour:h,time,file,encoding:'gzip-json',...(id==='icon-eu'&&[0,3,6,12,24,48].includes(h)?{cloudWeather:true}:{}),decodedBytes:raw.length,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})}synopticModels[id]={label,run,resolutionKm,license:'CC BY 4.0',frames}}
for(const id of ['icon-d2','icon-eu','icon']){const model=synopticModels[id];model.cloudWeatherFrames=[];for(const h of [...Array.from({length:13},(_,i)=>i),...(id==='icon-d2'?[13,14,16,17]:[]),15,18,21,24,30,36,42,48]){const time=new Date(runMs+h*hour).toISOString(),raw=Buffer.from(JSON.stringify({schema:'mid.cloud-weather.field.v1',model:id,run,time,resolutionKm:model.resolutionKm,lats:synLats,lons:synLons,cloudUnit:'%',weatherUnit:'WMO 4677',cloudScale:.1,cloud:Array(144).fill(id==='icon-d2'?150:750),weather:Array(144).fill(61)})),bytes=gzipSync(raw),file=`${id}-cw-${String(h).padStart(3,'0')}.bin`;synopticObjects.set(file,bytes);model.cloudWeatherFrames.push({hour:h,time,file,encoding:'gzip-json',decodedBytes:raw.length,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}
const synopticIndex=Buffer.from(JSON.stringify({schema:'mid.synoptic.fields.v1',models:synopticModels})),synopticKey=`runs/qa__synoptic_${createHash('sha256').update(synopticIndex).digest('hex').slice(0,16)}/synoptic-fields/index.json`;
// Separate immutable RUC sidecar, including all five synoptic and both cloud/WW components.
const rucCompositeFrames=[];
for(let h=0;h<=27;h++){
 const template=JSON.parse(gunzipSync(synopticObjects.get('icon-d2-000.bin'))),file=`icon-d2-ruc-${String(h).padStart(3,'0')}.bin`;
 const raw=Buffer.from(JSON.stringify({...template,model:'icon-d2-ruc',sampling:'nearest-native-cell',time:new Date(runMs+h*hour).toISOString(),cloudWeather:{cloudUnit:'%',weatherUnit:'WMO 4677',cloudScale:.1,cloud:Array(144).fill(750),weather:Array(144).fill(95)}})),bytes=gzipSync(raw);
 synopticObjects.set(file,bytes);rucCompositeFrames.push({hour:h,time:new Date(runMs+h*hour).toISOString(),file,encoding:'gzip-json',cloudWeather:true,bytes:bytes.length,decodedBytes:raw.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const rucCompositeIndex=Buffer.from(JSON.stringify({schema:'mid.ruc.synoptic-fields.v1',modelId:'icon-d2-ruc',run,sampling:'nearest-native-cell',maxNearestKm:5,model:{label:'DWD ICON-D2-RUC',run,resolutionKm:2.2,license:'CC BY 4.0',frames:rucCompositeFrames}})),rucCompositeKey=`runs/qa__ruc_synoptic_${createHash('sha256').update(rucCompositeIndex).digest('hex').slice(0,16)}/ruc-synoptic-fields/index.json`;
const missingIconIndex=Buffer.from(JSON.stringify({schema:'mid.synoptic.fields.v1',models:Object.fromEntries(Object.entries(synopticModels).filter(([id])=>id!=='icon'))})),missingIconKey=`runs/qa__synoptic_${createHash('sha256').update(missingIconIndex).digest('hex').slice(0,16)}/synoptic-fields/index.json`;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
let cases=0;
const perfRows=[];
const perfEnabled=process.env.GITHUB_ACTIONS==='true'||process.env.MID_MAP_PROFILE==='1';
async function chooseMapModel(page,id){
 const button=page.getByRole('button',{name:'Modell für Parameter',exact:true});
 await button.click();
 // MID UI contract: dropdown must be a body portal, never clipped by a MapLibre container.
 const portal=page.locator('body > .mid-map-model-picker-menu.app-portal-popover[role="dialog"]');
 await portal.waitFor({state:'visible'});
 assert.equal(await button.getAttribute('aria-haspopup'),'dialog','model picker declares its portal as a dialog');
 const rect=await portal.boundingBox(),view=page.viewportSize();
 assert.ok(rect&&view&&rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=view.width+1,
  'portal menu remains inside the horizontal viewport');
 await portal.locator('.mid-map-model-picker-option[data-model-id="'+id+'"]').click();
 await page.waitForFunction(expected=>document.querySelector('.mid-map-model-picker-trigger')?.getAttribute('data-model-id')===expected,id);
}
async function mapModelOptions(page){
 const button=page.getByRole('button',{name:'Modell für Parameter',exact:true});
 await button.click();
 const ids=await page.locator('.mid-map-model-picker-option').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-model-id')));
 await page.keyboard.press('Escape');
 return ids;
}
async function mapModelOptionLabel(page,id){
 const button=page.getByRole('button',{name:'Modell für Parameter',exact:true});
 await button.click();
 const text=await page.locator('.mid-map-model-picker-option[data-model-id="'+id+'"]').innerText();
 await page.keyboard.press('Escape');
 return text;
}

async function verifyGroupedSelectors(page){
 const modelTrigger=page.getByRole('button',{name:'Modell für Parameter',exact:true});
 await modelTrigger.click();
 const lists=await page.evaluate(()=>({
  modelFirst:document.querySelector('.unified-selection-mode button:last-child[aria-pressed="true"]')!==null,
  modelGroups:[...document.querySelectorAll('.mid-map-model-picker-group')].map(g=>({
   label:g.querySelector('.mid-map-model-picker-heading')?.textContent,
   models:[...g.querySelectorAll('.mid-map-model-picker-option')].map(o=>({
    id:o.getAttribute('data-model-id'),text:(o.textContent||'').trim(),hasSvg:!!o.querySelector('svg.mid-map-model-flag')
   }))
  })),
  groups:[...document.querySelectorAll('select[aria-label="Parameter-Layer"] optgroup')].map(g=>({
   label:g.label,options:[...g.querySelectorAll('option')].map(o=>o.textContent),
  })),
 }));
 await page.keyboard.press('Escape');
 const compare=new Intl.Collator('de-DE',{usage:'sort',sensitivity:'base',numeric:true}).compare;
 for(const group of lists.groups)assert.deepEqual(group.options,[...group.options].sort(compare),'parameters within '+group.label+' remain alphabetic');
 const knownFamily=['DWD · ICON','DWD · AICON','ECMWF · IFS','NOAA · GFS','ECCC · GDPS','DWD · Messdaten','DWD · Nowcasting','Weitere Modelle'];
 const ranks=lists.modelGroups.map(g=>knownFamily.indexOf(g.label));
 assert.ok(ranks.every(n=>n>=0),'every visible model grouped by a known family or explicit unknown');
 assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b),'visible model groups ordered by family, not by label');
 const flags={'icon-d2-ruc':'🇩🇪','icon-d2':'🇩🇪','icon-eu':'🇩🇪','icon':'🇩🇪','icon-eps':'🇩🇪',
  'aicon':'🇩🇪','radolan':'🇩🇪','observations':'🇩🇪','nowcastmix':'🇩🇪','ifs':'🇪🇺','gfs':'🇺🇸','gdps':'🇨🇦'};
 const seen=new Set();
 for(const group of lists.modelGroups){
  if(group.label==='DWD · ICON'){
   const spacing={'icon-d2-ruc':2.2,'icon-d2':2.2,'icon-eu':7,icon:28,'icon-eps':28};
   const sourceRanks=group.models.map(x=>spacing[x.id]);
   assert.ok(sourceRanks.every(Number.isFinite),'DWD ICON family has verified model identities');
   assert.deepEqual(sourceRanks,[...sourceRanks].sort((a,b)=>a-b),'ICON models are ordered from fine to coarse');
  }
  for(const model of group.models){
   assert.ok(!seen.has(model.id),'map selector does not duplicate source IDs');
   seen.add(model.id);
   if(flags[model.id])assert.ok(model.hasSvg&&model.text&&!model.text.includes(flags[model.id]),'country/EU flag is real inline SVG instead of platform-dependent option emoji');
   if(lists.modelFirst){
    assert.doesNotMatch(model.text,/\d+(?:,\d+)?\s*(?:km Raster|° Kartenraster)/,'model-first multi-source choice must not claim one product grid');
   }else{
    if(model.id==='icon-eu')assert.ok(model.text.includes('0,0625° Kartenraster')||model.text.includes('km Raster'),'known ICON-EU parameter grid is explicitly identified');
    if(model.id==='icon'||model.id==='icon-eps')assert.ok(model.text.includes('0,25° Kartenraster')||model.text.includes('km Raster'),'known ICON field grid is distinguished from native resolution');
   }
  }
 }
}

async function waitForHeldSynoptic(pending){
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Synoptic successor never reached the held fixture request')),30000);pending.then(()=>{clearTimeout(timer);resolve()},error=>{clearTimeout(timer);reject(error)})});
}
async function verifyCase(width,theme,design='next',profileMemory=false){
 let memoryProfile=null,failGdps=false;
 const caseStarted=performance.now(),perfPhases=[];let readyMs=null;
 console.log(`Map case start · ${width}px ${theme} ${design}`);let omitIcon=false,synopticMissing=false,heldSynoptic=null,releaseSynoptic=null,synopticReached=null,failSynoptic=false,holdCatalog=false,releaseCatalog=null,catalogBlocked=null;
 const context=await browser.newContext({viewport:{width,height:920},colorScheme:theme}),page=await context.newPage(),errors=[],requests=[];page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(45000);page.on('pageerror',e=>errors.push(e.message));page.on('console',async m=>{if(m.type()==='error'){if(m.text().includes('status of 502')&&m.location().url.includes('layers=GDPS_15km_PrecipType-Instant'))return;errors.push(m.text());console.error('Browser console',width,theme,m.location(),m.text());for(const arg of m.args())console.error(await arg.evaluate(value=>value instanceof Error?value.stack:String(value)).catch(()=>''))}});context.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')console.error('Browser request failed',width,theme,r.url(),r.failure())});page.on('request',r=>requests.push(r.url()));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin===base&&!url.pathname.startsWith('/ruc/')&&!url.pathname.startsWith('/__qa-worker')&&!url.pathname.endsWith('.pbf'))return route.continue();if(url.pathname==='/ruc/latest.json')return route.fulfill({json:{schema:'mid.dwd.ruc.grid.v2',storageProfile:'pages-lossless-v1',run:run.slice(0,16),rucModelFields:{key:rucKey,bytes:rucIndex.length,sha256:createHash('sha256').update(rucIndex).digest('hex')},...(!synopticMissing?{synopticFields:{key:omitIcon?missingIconKey:synopticKey},rucSynopticFields:{key:rucCompositeKey,bytes:rucCompositeIndex.length,sha256:createHash('sha256').update(rucCompositeIndex).digest('hex')}}:{}),modelFields:{key:'runs/qa/model-fields/index.json'},precipitationTotals:{key:'runs/qa/precipitation-totals.json'},observedPrecipitation:{key:'runs/qa/observed-precipitation.json'}}});if(url.pathname===`/ruc/${rucCompositeKey}`)return route.fulfill({body:rucCompositeIndex,contentType:'application/json'});if(url.pathname===`/ruc/${rucKey}`)return route.fulfill({body:rucIndex,contentType:'application/json'});if(url.pathname.includes('/ruc-model-fields/')&&rucObjects.has(url.pathname.split('/').at(-1)))return route.fulfill({body:rucObjects.get(url.pathname.split('/').at(-1)),contentType:'application/octet-stream'});if(url.pathname===`/ruc/${omitIcon?missingIconKey:synopticKey}`){if(holdCatalog)await new Promise(resolve=>{releaseCatalog=resolve;catalogBlocked?.()});return route.fulfill({body:omitIcon?missingIconIndex:synopticIndex,contentType:'application/json'})}if(synopticObjects.has(url.pathname.split('/').at(-1))){if(url.pathname.endsWith(heldSynoptic)){await new Promise(resolve=>{releaseSynoptic=resolve;synopticReached?.()});if(failSynoptic)return route.fulfill({body:Buffer.from('corrupt successor fixture'),contentType:'application/octet-stream'})}return route.fulfill({body:synopticObjects.get(url.pathname.split('/').at(-1)),contentType:'application/octet-stream'})}if(url.pathname.endsWith('/index.json'))return route.fulfill({json:{schema:'mid.icon-d2.fields.v1',run,products}});if(objects.has(url.pathname.split('/').at(-1)))return route.fulfill({body:objects.get(url.pathname.split('/').at(-1)),contentType:'application/json'});if(url.pathname.endsWith('precipitation-totals.json'))return route.fulfill({json:sums(false)});if(url.pathname.endsWith('observed-precipitation.json'))return route.fulfill({json:sums(true)});if(url.pathname.includes('/__qa-worker')){const mode=url.searchParams.get('mode');if(mode==='basemap-vector-tile'||mode==='basemap-glyph')return route.fulfill({body:Buffer.alloc(0),contentType:'application/x-protobuf'});if(mode==='weather-map-wms'&&failGdps&&url.searchParams.get('request')?.toLowerCase()==='getmap'&&url.searchParams.get('layers')==='GDPS_15km_PrecipType-Instant')return route.fulfill({status:502,body:'GDPS fixture unavailable'});if(mode==='composite-wms'||mode==='weather-map-wms')return route.fulfill({body:png,contentType:'image/png'});if(mode==='weather-map-point')return route.fulfill({json:{available:true,value:12.4,unit:'°C',layer:url.searchParams.get('layer'),latitude:Number(url.searchParams.get('lat')),longitude:Number(url.searchParams.get('lon')),time:url.searchParams.get('time'),referenceTime:url.searchParams.get('reference_time'),...(url.searchParams.has('elevation')?{elevation:Number(url.searchParams.get('elevation'))}:{})}});if(mode==='weather-map-metadata')return route.fulfill({json:{layer:url.searchParams.get('layer'),times:[new Date(runMs+hour).toISOString(),new Date(runMs+3*hour).toISOString()],referenceTimes:[run],elevations:[1000,850,500,300],...(url.searchParams.get('layer')?.startsWith('GDPS_')?{}:{pointUnit:'°C'}),styles:[{name:'qa_isoarea',title:'Field'},{name:'qa_isoline_label',title:'Lines'},{name:'CLOUD',title:'Cloud',rendering:'fill'},{name:'INSTPRECIPITATIONTYPE',title:'Instant precipitation type',rendering:'fill'}]}});if(mode==='composite-times')return route.fulfill({json:{serverTime:new Date().toISOString(),dwdRadar:[observedTime],satelliteDayProduct:{provider:'eumetsat',layer:'mtg_fd:vis06_hrfi',label:'MTG FCI',resolutionKm:.5,times:[new Date(runMs+hour).toISOString()]}}});return route.fulfill({json:{available:false,points:[],frames:[],nativeResolutionM:250}})}if(url.pathname.endsWith('/planet'))return route.fulfill({json:{tilejson:'3.0.0',tiles:[base+'/__qa-empty/{z}/{x}/{y}.pbf'],minzoom:0,maxzoom:14,attribution:'OpenStreetMap'}});if(url.pathname.endsWith('.pbf'))return route.fulfill({body:Buffer.alloc(0),contentType:'application/x-protobuf'});return route.fulfill({body:png,contentType:'image/png'})});
 if(perfEnabled)await installMapBrowserProbe(page);
 await page.addInitScript(()=>{const originalError=console.error;console.error=(...args)=>originalError(...args,...args.map(value=>value?.stack||''),new Error('Browser console callsite').stack);const fetchImage=window.fetch;window.__qaDataImageFetches=0;window.fetch=function(input,...args){if(String(input instanceof Request?input.url:input).startsWith('data:image/'))window.__qaDataImageFetches++;return fetchImage.call(this,input,...args)};const original=HTMLCanvasElement.prototype.toDataURL;window.__qaRasterEncodes=0;HTMLCanvasElement.prototype.toDataURL=function(...args){window.__qaRasterEncodes++;return original.apply(this,args)}});
 async function openMapLayers(){
  const panel=page.locator('.composite-primary-layers');
  await panel.waitFor();
  if(await panel.getAttribute('open')===null){
   await panel.locator(':scope > summary').click();
   await page.waitForFunction(()=>document.querySelector('.composite-primary-layers')?.open===true);
  }
  assert.equal(await panel.getAttribute('open'),'','Modell- und Beobachtungslayer sind nach dem ersten Tap zugänglich');
  // MID .402: Presentation controls moved into a deliberate, keyboard-accessible disclosure.
  // Preserve all subsequent controls, portal, layering and screenshot checks; do not skip them.
  const advanced=page.locator('details.unified-model-advanced');
  for(let index=0,count=await advanced.count();index<count;index++){
   const disclosure=advanced.nth(index);
   if(await disclosure.getAttribute('open')===null)await disclosure.locator(':scope > summary').click();
   assert.equal(await disclosure.getAttribute('open'),'','All advanced model controls remain accessible via explicit disclosure interactions');
  }
 }
 async function measuredReload(){
  if(perfEnabled){const phase=await snapshotMapBrowserProbe(page,'before-reload');if(phase)perfPhases.push(phase);}
  await page.reload();
  await openMapLayers();
 }
 await page.goto(base+'/__map-qa?design='+design);
 await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Isobaren desselben Modelltermins')).catch(async e=>{console.error(await page.locator('body').innerText());console.error(errors);throw e});
 if(perfEnabled)readyMs=await page.evaluate(()=>performance.now());
 if(width<=850)assert.equal(await page.locator('.composite-primary-layers').getAttribute('open'),null,'Schmale Kartenansicht beginnt ohne großes Bedienelement');
 await openMapLayers();
 assert.equal(await page.getByRole('button',{name:'Automatisch',exact:true}).getAttribute('aria-pressed'),'true');
 const direct=page.getByLabel('Kartentermin auswählen');
 const timelineRange=page.locator('.composite-timeline-range input[type="range"]');
 const compactTimeline=width<=850&&design==='next';
 assert.equal(await direct.isVisible(),!compactTimeline,'The duplicate date dropdown must be hidden on narrow next-design maps');
 assert.equal(await timelineRange.isVisible(),true,'The interactive timeline slider remains visible');
 // Use the actually visible time input, keeping exact product-time metadata checks intact.
 async function chooseTerm(choice){
  const value=typeof choice==='string'?choice:
   await direct.locator('option').evaluateAll((options,label)=>options.find(option=>option.label===label)?.value??null,choice.label);
  assert.match(value??'',/^\d+$/,'Term must exist in the real product timeline');
  if(compactTimeline){
   // Exercise the accessible native range control like a real user; Playwright's
   // value-only fill can lose the React input/change sequence after model rerenders.
   const max=Number(await timelineRange.getAttribute('max'));
   const target=Number(value);
   await page.evaluate(()=>{
    const input=document.querySelector('.composite-timeline-range input[type="range"]');
    window.__qaTimelineInputEvents=[];
    for(const type of ['keydown','input','change','keyup']){
     input?.addEventListener(type,event=>window.__qaTimelineInputEvents.push({type,key:event.key||'',raw:event.target.value,time:Math.round(performance.now())}),true);
    }
   });
   await timelineRange.focus();
   if(target===0)await timelineRange.press('Home');
   else if(target===max)await timelineRange.press('End');
   else await timelineRange.fill(value);
  }else await direct.selectOption(value);
  await page.waitForFunction(expected=>document.querySelector('select[aria-label="Kartentermin auswählen"]')?.value===expected,value).catch(async error=>{
   const detail=await page.evaluate(()=>({
    timeline:{rangeCount:document.querySelectorAll('.composite-timeline-range input[type="range"]').length,rangeDisabled:document.querySelector('.composite-timeline-range input[type="range"]')?.disabled,rangeMin:document.querySelector('.composite-timeline-range input[type="range"]')?.min,rangeAria:document.querySelector('.composite-timeline-range input[type="range"]')?.getAttribute('aria-label'),selectDisabled:document.querySelector('select[aria-label="Kartentermin auswählen"]')?.disabled,options:[...document.querySelectorAll('select[aria-label="Kartentermin auswählen"] option')].map(option=>({value:option.value,validTime:option.dataset.validTime,disabled:option.disabled})).slice(0,12),focused:document.activeElement?.outerHTML?.slice(0,320)},
    model:document.querySelector('.mid-map-model-picker-trigger')?.getAttribute('data-model-id'),
    select:document.querySelector('select[aria-label="Kartentermin auswählen"]')?.value,
    range:document.querySelector('.composite-timeline-range input[type="range"]')?.value,
    max:document.querySelector('.composite-timeline-range input[type="range"]')?.max,
    status:document.querySelector('.unified-layer-status')?.textContent?.slice(0,400),
    busy:document.querySelector('.unified-layer-status')?.getAttribute('aria-busy'),
    timelineEvents:JSON.stringify(window.__qaTimelineInputEvents||[]),
    liveButton:document.querySelector('.composite-live-button')?.className,
    chosenTime:document.querySelector('select[aria-label="Kartentermin auswählen"] option:checked')?.getAttribute('data-valid-time')
   }));
   console.error('Selected source term did not commit',{expected:value,detail});
   throw error;
  });
  assert.equal(await timelineRange.inputValue(),value,'Visible range and exact source term stay synchronized');
 }
 await chooseTerm('0');
 // Selecting a native <select> changes its DOM value before React necessarily
 // commits the prev-button disabled state. The contract remains strict:
 // verify selected value AND disabled state, then repeat the original assertion.
 const firstTermPreviousLabel=compactTimeline?'Vorheriger verfügbarer Zeitschritt':'Vorheriger Kartentermin';
 await page.waitForFunction(label=>{
  const button=[...document.querySelectorAll('button[aria-label]')].find(node=>node.getAttribute('aria-label')===label);
  const select=document.querySelector('select[aria-label="Kartentermin auswählen"]');
  return button?.disabled===true&&select?.value==='0';
 },firstTermPreviousLabel,{timeout:5000}).catch(async error=>{
  console.error('First term state did not settle',await page.evaluate(label=>{
   const button=[...document.querySelectorAll('button[aria-label]')].find(node=>node.getAttribute('aria-label')===label);
   return {label,prevDisabled:button?.disabled,select:document.querySelector('select[aria-label="Kartentermin auswählen"]')?.value,range:document.querySelector('.composite-timeline-range input[type="range"]')?.value};
  },firstTermPreviousLabel));
  throw error;
 });
 assert.equal(await page.getByRole('button',{name:firstTermPreviousLabel,exact:true}).isDisabled(),true);
 const nextTerm=page.getByRole('button',{name:compactTimeline?'Nächster verfügbarer Zeitschritt':'Nächster Kartentermin',exact:true});
 await nextTerm.evaluate(button=>button.addEventListener('click',()=>{
  const select=document.querySelector('select[aria-label="Kartentermin auswählen"]');
  button.dataset.qaNextValidTime=select?.options[select.selectedIndex+1]?.dataset.validTime??'';
 },{capture:true,once:true}));
 await nextTerm.click();
 const expectedValidTime=await nextTerm.getAttribute('data-qa-next-valid-time');
 assert.ok(expectedValidTime,'A next confirmed term exists when the button is clicked');
 assert.equal(await direct.locator('option:checked').getAttribute('data-valid-time'),expectedValidTime,
  'One click selects the next valid time even if metadata inserts earlier entries');
 await page.getByRole('button',{name:compactTimeline?'Jetzt':'Aktuell',exact:true}).click();
 if(compactTimeline){
  assert.equal(await page.locator('.composite-direct-time').isVisible(),false,'No redundant dropdown on the small-screen map');
  const visibleTime=page.locator('.composite-timeline-controls .composite-timeline-time');
  assert.equal(await visibleTime.isVisible(),true,'The relative/absolute time remains visible');
  assert.match(await visibleTime.innerText(),/\d{2}\.\d{2}\./,'Full valid date must remain readable');
  assert.match((await timelineRange.getAttribute('aria-label'))??'',/Kartenzeitschritt wählen.*\d{2}\.\d{2}\./,'Accessible range includes absolute date');
 }else{
  for(const box of await page.locator('.composite-direct-time button,.composite-direct-time select').evaluateAll(nodes=>nodes.map(el=>({height:el.getBoundingClientRect().height,overflow:el.scrollWidth>el.clientWidth+1})))){
   assert.ok(box.height>=44);assert.equal(box.overflow,false);
  }
 }
 // Regression .212: actual rendered theme contrast, not just static CSS tokens.
 // Verify native <select>, action buttons and disabled controls on every
 // already-supported real MapLibre viewport × theme × design permutation.
 const timeControls=await page.locator('.composite-direct-time button,.composite-direct-time select').evaluateAll(nodes=>{
  const parse=value=>{const m=value.match(/rgba?\(([^)]+)\)/);return m?m[1].split(',').slice(0,3).map(Number):[NaN,NaN,NaN]};
  const luminance=rgb=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return nodes.filter(el=>el.getClientRects().length>0).map(el=>{const style=getComputedStyle(el),background=parse(style.backgroundColor),foreground=parse(style.color),ratio=(Math.max(luminance(background),luminance(foreground))+.05)/(Math.min(luminance(background),luminance(foreground))+.05);
   return{tag:el.tagName,disabled:el.disabled,bg:background,fg:foreground,ratio,brightness:background.reduce((a,b)=>a+b,0)/3,scheme:style.colorScheme};
  });
 });
 assert.equal(timeControls.length,compactTimeline?0:4,'Only visible direct time controls are checked for contrast');
 for(const control of timeControls){
  assert.ok(control.bg.every(Number.isFinite)&&control.fg.every(Number.isFinite),'Fully themed background and foreground required');
  assert.ok(theme==='dark'?control.brightness<100:control.brightness>210,'Control background must respect '+theme+' theme');
  if(!control.disabled)assert.ok(control.ratio>=4.5,'WCAG AA foreground contrast on direct map time control: '+JSON.stringify(control));
 }


 async function verifyPresentationHint(text){const trigger=page.getByRole('button',{name:'Karteninhalt und Darstellung erklären',exact:true});await trigger.click();const dialog=page.getByRole('dialog',{name:'Karteninhalt und Darstellung erklären',exact:true});await dialog.waitFor();await page.waitForFunction(expected=>[...document.querySelectorAll('[role="dialog"]')].some(node=>node.getAttribute('aria-label')==='Karteninhalt und Darstellung erklären'&&node.textContent.includes(expected)),text);const bounds=await trigger.boundingBox();assert.ok(bounds.width>=44&&bounds.height>=44,'Map Info touch target');await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Karteninhalt und Darstellung erklären')}
 await verifyPresentationHint('Linien empfohlen');
 assert.ok(!requests.some(u=>u.includes('qa_isoarea')),'Observation selection never implicitly overlays a model area');
 assert.equal(await page.evaluate(()=>window.__qaRasterEncodes),0,'Native lines render without producing a filled model image');
 const radarSwitch=page.locator('.composite-layer-switches button').nth(0),satelliteSwitch=page.locator('.composite-layer-switches button').nth(1);
 for(const toggle of [radarSwitch,satelliteSwitch])if(await toggle.getAttribute('aria-pressed')==='true')await toggle.click();
 await verifyPresentationHint('Ohne Radar / Satellit');
 await measuredReload();assert.equal(await radarSwitch.getAttribute('aria-pressed'),'false');assert.equal(await satelliteSwitch.getAttribute('aria-pressed'),'false','Both observation layers stay disabled after reload');
 const observationMaster=page.getByRole('button',{name:/Beobachtungen (an|aus)/});await satelliteSwitch.click();await observationMaster.click();
 const savedMaster=await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:composite-layers:v3')));assert.equal(savedMaster.observationsEnabled,false);assert.equal(savedMaster.showSatellite,true,'Master preserves selected observations');
 await measuredReload();assert.equal(await observationMaster.getAttribute('aria-pressed'),'false');assert.equal(await satelliteSwitch.getAttribute('aria-pressed'),'false');await observationMaster.click();assert.equal(await satelliteSwitch.getAttribute('aria-pressed'),'true','Master restores the saved satellite selection');assert.equal(await radarSwitch.getAttribute('aria-pressed'),'false');await satelliteSwitch.click();

 await satelliteSwitch.click();await verifyPresentationHint('Linien empfohlen');
 await radarSwitch.click();await satelliteSwitch.click();assert.equal(await radarSwitch.getAttribute('aria-pressed'),'true');assert.equal(await satelliteSwitch.getAttribute('aria-pressed'),'false');
 await page.waitForFunction(()=>window.__qaMap?.getLayer('model-pressure-centers-labels'));
 await chooseMapModel(page,'icon-eu');
 // The old model can also have a +3h option. An attached DOM option does not
 // prove the newly selected model's times and status have finished updating.
 await page.waitForFunction(()=>{
  const status=document.querySelector('.unified-layer-status');
  const active=document.querySelector('.mid-map-model-picker-trigger');
  return active?.getAttribute('data-model-id')==='icon-eu'&&status?.textContent?.includes('ICON-EU')&&
   status?.getAttribute('aria-busy')==='false'&&!status.textContent.includes('Rohdaten laden');
 });
 const exactPressure=direct.locator(`option[data-valid-time="${Math.floor((runMs+3*hour)/1000)}"]`);
 await exactPressure.waitFor({state:'attached'});
 await chooseTerm(await exactPressure.getAttribute('value'));await page.waitForFunction(()=>window.__qaMap?.getLayer('unified-wms-pressure-isobars-line-dashed')).catch(async e=>{console.error('Pressure frame',{width,theme,design,status:await page.locator('.unified-layer-status').innerText(),fieldRequests:requests.filter(u=>u.endsWith('.bin')),errors,visibleLayers:await page.evaluate(()=>window.__qaMap?.getStyle()?.layers?.filter(l=>/pressure|isobar/.test(l.id)).map(l=>l.id)??[]).catch(()=>[])});throw e});
 assert.equal(await page.evaluate(()=>window.__qaMap.getStyle().layers.some(l=>l.id.startsWith('unified-dwd-'))),false,'Pure numerical pressure lines replace the fixed WMS line image');
 await chooseMapModel(page,'icon-d2');await page.waitForFunction(()=>window.__qaMap?.getLayer('model-pressure-centers-labels'));
 await measuredReload();assert.equal(await radarSwitch.getAttribute('aria-pressed'),'true');assert.equal(await satelliteSwitch.getAttribute('aria-pressed'),'false');
 await page.getByRole('button',{name:'Flächen',exact:true}).click();await page.getByLabel('Parameter-Layer').selectOption('temperature');await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Rastertermin'));
 const layerGrid=await page.locator('.composite-layer-switches').evaluate(el=>({display:getComputedStyle(el).display,overflow:el.scrollWidth>el.clientWidth+1}));
 const contrast=await page.locator('.composite-layer-switches button,.unified-model-toggle').evaluateAll(nodes=>nodes.map(el=>{const s=getComputedStyle(el);return{fg:s.color,bg:s.backgroundColor,font:parseFloat(s.fontSize),height:el.getBoundingClientRect().height}}));
 for(const c of contrast){assert.notEqual(c.fg,c.bg,'Layer foreground and background differ');assert.ok(c.height<200,'Layer buttons do not expand into giant cards');}
 const iconColors=await page.locator('.composite-switch-icon svg').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).color));assert.ok(iconColors.every(c=>!['rgb(255, 255, 255)','rgba(0, 0, 0, 0)'].includes(c)),'Icons retain theme foreground');
 assert.equal(layerGrid.display,'grid','Layer controls override the legacy mobile horizontal scroller');assert.equal(layerGrid.overflow,false,'No horizontally clipped layer switches');
 for(const box of await page.locator('.composite-layer-switches button').evaluateAll(nodes=>nodes.map(el=>({height:el.getBoundingClientRect().height,overflow:el.scrollWidth>el.clientWidth+1})))){assert.ok(box.height>=44);assert.equal(box.overflow,false)}
 // Pointer input must not leave a bright frame; keyboard focus stays explicit.
 const mapCanvas=page.locator('canvas.maplibregl-canvas');await page.getByRole('heading',{name:'Wetterkarte',exact:true}).click();await mapCanvas.focus();
 assert.equal(await mapCanvas.evaluate(el=>getComputedStyle(el).outlineStyle),'none','Pointer focus must not frame the radar image');
 await page.keyboard.press('Tab');await mapCanvas.focus();assert.equal(await mapCanvas.evaluate(el=>getComputedStyle(el).outlineWidth),'2px','Keyboard map focus remains visible');
 assert.equal(await page.locator('.maplibregl-map').count(),1,'All layer combinations share one map');assert.equal(await page.locator('.map-workspace-tabs').count(),0);assert.equal(await page.locator('.composite-view-tabs').count(),0);
 assert.ok(!requests.some(u=>/precipitation-totals.json|observed-precipitation.json/.test(u)),'Heavy totals are only loaded on demand');
 assert.equal(await page.locator('canvas.model-map-context').count(),0,'No second schematic geography');
 await page.locator('.composite-advanced summary').first().click();assert.equal(await page.getByRole('group',{name:'Kartendetails'}).locator('input[type=checkbox]').count(),5);await page.getByLabel('Ländergrenzen',{exact:true}).uncheck();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:map-reference:v1')).countries),false);await page.getByLabel('Ländergrenzen',{exact:true}).check();

 if(width===844||width===1024)await page.setViewportSize({width,height:width===844?390:768});
 await chooseMapModel(page,'icon-d2-ruc');
 await page.waitForFunction(()=>{const t=document.querySelector('.unified-layer-status')?.textContent||'';return t.includes('ICON-D2-RUC')&&t.includes('Rastertermin')&&!t.includes('lädt')}).catch(async error=>{try{console.error('RUC ready failure',{width,theme,design,viewport:page.viewportSize(),errors,status:await page.locator('.unified-layer-status').allTextContents(),sources:await page.locator('.unified-source-info').allTextContents(),model:await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),parameter:await page.getByLabel('Parameter-Layer').inputValue(),rucPaths:requests.filter(u=>u.includes('/ruc/')).slice(-30).map(u=>{try{return new URL(u).pathname}catch{return '[invalid URL]'}}),map:await page.evaluate(()=>({loaded:window.__qaMap?.loaded(),layers:window.__qaMap?.getStyle()?.layers?.map(l=>l.id)}))})}catch(diagnosticError){console.error('RUC diagnostics unavailable',String(diagnosticError))}throw error});
 await page.waitForFunction(()=>window.__qaMap?.getStyle().layers.some(l=>l.id.startsWith('unified-model-field')&&l.type==='raster'&&window.__qaMap.getPaintProperty(l.id,'raster-resampling')==='nearest'));
 await page.getByRole('button',{name:'Modell zuerst',exact:true}).click();
 const rucParameters=await page.getByLabel('Parameter-Layer').locator('option').evaluateAll(rows=>rows.map(o=>o.value));assert.deepEqual([...rucParameters].sort(),['temperature','pressure','wind','gust','cloud','precipitation','synoptic','thetae','geopotential','sigwx'].sort(),'RUC advertises its verified native and composite products');
 const rucEnd=Math.floor((runMs+27*hour)/1000);await page.waitForFunction(t=>Boolean(document.querySelector('[aria-label="Kartentermin auswählen"] option[data-valid-time="'+t+'"]')),rucEnd);
 const rucLast=direct.locator(`option[data-valid-time="${rucEnd}"]`);await chooseTerm(await rucLast.getAttribute('value'));await page.waitForFunction(ms=>{const expected=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(ms));return document.querySelector('.unified-layer-status')?.textContent.includes('Rastertermin '+expected)},runMs+27*hour);
 if(width===390&&theme==='light'&&design==='next'){
  await page.locator('.unified-favorites summary').click();await page.waitForFunction(()=>document.querySelector('.unified-favorites tbody')?.textContent.includes('23,5'));
  for(const type of ['SVG','PNG']){
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Raster + Ortswerte · '+type,exact:true}).click();const download=await pending;assert.match(download.suggestedFilename(),/^MID-ICON-D2-RUC-temperature-/);const bytes=readFileSync(await download.path());
   if(type==='SVG'){assert.ok(bytes.toString().includes('ICON-D2-RUC · Lauf'));assert.ok(bytes.toString().includes('23,5'))}else{assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),1200);assert.ok(bytes.readUInt32BE(20)>=1130)}
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'RUC has no horizontal overflow');await page.screenshot({path:'/tmp/mid-c38-ruc-390.png',fullPage:true});
 }
 if(width===390&&design==='next'){
  await page.setViewportSize({width:430,height:932});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'RUC430px iPhone contract has no overflow');assert.equal(await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),'icon-d2-ruc');await page.screenshot({path:`/tmp/mid-c38-ruc-430-${theme}.png`,fullPage:true});await page.setViewportSize({width:390,height:920});
 }
 // Full RUC composite and categorical/pseudo display at the actual endpoint.
 await page.getByLabel('Parameter-Layer').selectOption('synoptic');
 await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('ICON-D2-RUC')&&!document.querySelector('.unified-layer-status')?.textContent.includes('Rohdaten laden'));
 await page.waitForFunction(()=>window.__qaMap?.getStyle().layers.some(l=>l.id.startsWith('synoptic-thetae-layer-')&&window.__qaMap.getPaintProperty(l.id,'raster-resampling')==='nearest'));
 const rucFinal=direct.locator(`option[data-valid-time="${rucEnd}"]`);await chooseTerm(await rucFinal.getAttribute('value'));
 await page.waitForFunction(()=>document.querySelector('.unified-forecast-time strong')?.textContent==='Angezeigt +27 h');
 assert.match(await page.locator('.unified-forecast-time').innerText(),/Verfügbar \+0 h bis \+27 h/);
 await page.getByLabel('Parameter-Layer').selectOption('sigwx');
 await page.waitForFunction(()=>window.__qaMap?.getStyle().layers.some(l=>l.id.startsWith('cloud-weather-icon-d2-ruc')&&l.type==='raster'));
 assert.equal(await page.getByRole('button',{name:'Modell-Wolkenbild',exact:true}).count(),0,'Sole pseudo mode has no obsolete selector');
 await page.waitForFunction(()=>window.__qaMap?.getStyle().layers.some(l=>l.id.includes('cloud-weather-icon-d2-ruc')&&l.id.includes('pseudo')));
 await page.getByLabel(/Isobaren · DWD ICON-D2-RUC · gleicher Lauf/).check();
 await page.getByLabel('Isohypsen · gleicher Lauf und Termin').check();
 await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Isohypsen 500 hPa'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'RUC composite/pseudo time labels wrap on every viewport');
 await page.getByLabel(/Isobaren · DWD ICON-D2-RUC · gleicher Lauf/).uncheck();
 await page.getByLabel('Isohypsen · gleicher Lauf und Termin').uncheck();
 assert.equal(await page.getByRole('button',{name:'Standard',exact:true}).count(),0,'No alternate standard weather rendering remains');
 await page.getByLabel('Parameter-Layer').selectOption('temperature');
 await measuredReload();assert.equal(await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),'icon-d2-ruc','RUC source persists across reload');
 await page.getByLabel('Parameter-Layer').selectOption('pressure');await page.waitForFunction(()=>window.__qaMap?.getLayer('model-pressure-centers-labels'));
 if(width===844||width===1024)await page.setViewportSize({width,height:920});
 await chooseMapModel(page,'icon-d2');await page.getByRole('button',{name:'Parameter zuerst',exact:true}).click();await page.getByLabel('Parameter-Layer').selectOption('temperature');
 await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Rastertermin'));
 // The established 24-case MapLibre matrix checks both seasonal products for
 // exact pairing, nearest resampling, two point values and no mobile overflow.
 // File downloads remain in the bounded single-view Chrome pilot.
 {
  const seasonalExportPilot=width===390&&theme==='light'&&design==='next';
  const initialMaps=await page.locator('.maplibregl-map').count();
  for(const [id,secondary,caption] of [['winter-berge','Temperatur · 2 m','keine Aussage zur Niederschlagsphase'],['sommer-gewitter','Böen · 10 m','1-h-Intervall']]){
   await page.getByLabel('Parameter-Layer').selectOption(id);
   await page.waitForFunction(()=>{const text=document.querySelector('.unified-layer-status')?.textContent||'';return text.includes('Rastertermin')&&text.includes('ICON-D2')&&!text.includes('lädt')});
   await page.waitForFunction(()=>Boolean(window.__qaMap?.getStyle()?.layers?.some(l=>l.id.startsWith('unified-model-field')&&l.type==='raster'&&window.__qaMap.getPaintProperty(l.id,'raster-resampling')==='nearest')));
   const fav=page.locator('.unified-favorites');
   if(seasonalExportPilot&&await fav.getAttribute('open')===null)await fav.locator(':scope > summary').click();
   assert.ok((await fav.locator('thead').textContent()||'').includes(secondary),'Original companion appears as second numeric field');
   assert.equal(await fav.locator('thead th').count(),3,'Seasonal native pair has both variable columns');
   // Real Chrome verifies the shared map dialog, not merely the 2-column
   // point-value table. Check each assigned device/theme for one focusable
   // dialog and two separately sourced original values at one coordinate.
   const centerProbe=page.getByRole('button',{name:'Wert am Kartenmittelpunkt anzeigen',exact:true});
   await centerProbe.waitFor();
   assert.equal(await page.locator('.mid-model-map-probe-center').count(),1,'One map center probe for both model layers');
   // DOM hit-testing is viewport-relative; verify actual overlap only after
   // the control is scrolled into the visible browser viewport.
   await centerProbe.scrollIntoViewIfNeeded();
   const hit=await centerProbe.evaluate(button=>{
    const rect=button.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const element=document.elementFromPoint(x,y);
    const badge=button.closest('.radarmap')?.querySelector('.composite-map-status');
    const bounds=badge?.getBoundingClientRect();
    return {ok:element===button||button.contains(element),at:{x,y},
     button:{top:rect.top,bottom:rect.bottom},badge:bounds?{top:bounds.top,bottom:bounds.bottom}:null,
     interceptedBy:element?.className?.toString().slice(0,100)};
   });
   assert.ok(hit.ok,'Map probe hit-target must not be covered in '+width+'px '+theme+' '+design+': '+JSON.stringify(hit));
   await centerProbe.focus();
   assert.equal(await centerProbe.evaluate(el=>document.activeElement===el),true,'Active map point button retains keyboard focus');
   await centerProbe.click();
   const groupedProbe=page.getByRole('dialog',{name:/^Kartenwerte ·/});
   await groupedProbe.waitFor();
   const probeRows=groupedProbe.locator('.mid-model-map-probe__row');
   assert.equal(await probeRows.count(),2,'Seasonal overlay exposes both original fields in one popup');
   const probeLabels=await groupedProbe.locator('.mid-model-map-probe__row-label').allTextContents();
   assert.deepEqual(probeLabels.map(x=>x.trim()),['Niederschlag · 1 h',secondary],'Neither precipitation nor companion may be dropped');
   assert.equal(await groupedProbe.locator('.mid-model-map-probe__source').count()>=2,true,'Each field retains visible provenance');
   // Synthetic original ICON-D2 seasonal fields: 1-h precipitation = 1 mm;
   // paired 2-m temperature or 10-m gust = 15 °C / 15 km/h at every cell.
   await page.waitForFunction(()=>{
    const rows=[...document.querySelectorAll('.mid-model-map-probe__row')];
    return rows.length===2&&rows.every(row=>row.querySelector('.mid-model-map-probe__value')?.getAttribute('aria-busy')==='false');
   });
   const probeValues=(await groupedProbe.locator('.mid-model-map-probe__value').allTextContents()).map(x=>x.replace(/\s+/g,' ').trim());
   assert.match(probeValues[0],/(?:^|\s)1(?:[,.]0+)?\s*mm\b/,'The first original value is the 1-h fixture precipitation, not pending or NoData');
   assert.match(probeValues[1],id==='winter-berge'?/(?:^|\s)15(?:[,.]0+)?\s*°C\b/:/(?:^|\s)15(?:[,.]0+)?\s*km\/h\b/,'The paired original value retains its numerical reading and displayed unit');
   const probeBounds=await groupedProbe.boundingBox(),probeViewport=page.viewportSize();
   assert.ok(probeBounds&&probeBounds.x>=-1&&probeBounds.x+probeBounds.width<=probeViewport.width+1&&
    probeBounds.y>=-1&&probeBounds.y+probeBounds.height<=probeViewport.height+1,
    'Combined popup must fit horizontally and vertically on mobile and landscape');
   await page.keyboard.press('Escape');
   await groupedProbe.waitFor({state:'hidden'});

   if(seasonalExportPilot){
   // A real installed Chrome may expose native Web Share. Explicitly test the
   // ordinary fallback-download path; native iOS sharing needs a device check.
   await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
   // Exercise both downloadable export formats in a real browser. SVG alone
   // does not prove the SVG-to-Canvas PNG route or PNG decoding.
   for(const format of ['SVG','PNG']){
    const pending=page.waitForEvent('download',{timeout:25000}).catch(async e=>{
     const status=await page.locator('.unified-layer-status').allTextContents();
     const alerts=await page.locator('[role="alert"]').allTextContents();
     throw new Error('Seasonal '+format+' fallback-download missing: '+id+' | map='+JSON.stringify(status)+
      ' | alerts='+JSON.stringify(alerts)+' | browser='+JSON.stringify(errors.slice(-5))+' | '+String(e));
    });
    await page.getByRole('button',{name:'Komposit + Ortswerte · '+format,exact:true}).click();
    const downloaded=await pending,bytes=readFileSync(await downloaded.path());
    assert.match(downloaded.suggestedFilename(),new RegExp('^MID-ICON-D2-'+id+'-.*\\.'+format.toLowerCase()+'$'));
    if(format==='SVG'){
     const svg=bytes.toString('utf8');
     assert.ok(svg.includes('image-rendering:crisp-edges'),'Native NoData edges must not be smoothed in SVG');
     assert.ok(svg.includes('data:image/png;base64,'),'SVG retains the native raster data URI');
     assert.ok(svg.includes(caption),'Export must not fabricate precipitation phase or gust interval');
    }else{
     assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],'Real PNG signature');
     assert.equal(bytes.subarray(12,16).toString('ascii'),'IHDR','PNG image header');
     assert.equal(bytes.readUInt32BE(16),1200,'Native export PNG width');
     assert.ok(bytes.readUInt32BE(20)>=1130,'Native export PNG height');
     assert.ok(bytes.length>10000,'PNG contains a nontrivial rendered payload');
     // Decode the downloaded PNG with Chrome itself. This synthetic data
     // test is not a claim of Safari or native iOS pixel parity.
     const png=await page.evaluate(async encoded=>{
      const data=Uint8Array.from(atob(encoded),ch=>ch.charCodeAt(0));
      const bitmap=await createImageBitmap(new Blob([data],{type:'image/png'}));
      try{
       const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
       const context=canvas.getContext('2d',{willReadFrequently:true});
       if(!context)throw new Error('Downloaded PNG cannot be painted to browser canvas');
       context.drawImage(bitmap,0,0);
       const pixels=context.getImageData(0,0,bitmap.width,bitmap.height).data;
       const colors=new Set();
       for(let y=180;y<Math.min(bitmap.height,900);y+=30)for(let x=60;x<Math.min(bitmap.width,690);x+=30){
        const offset=(y*bitmap.width+x)*4;
        if(pixels[offset+3]>0)colors.add(pixels[offset]+','+pixels[offset+1]+','+pixels[offset+2]);
       }
       return {width:bitmap.width,height:bitmap.height,colorCount:colors.size};
      }finally{bitmap.close()}
     },bytes.toString('base64'));
     assert.equal(png.width,1200,'Browser-decoded PNG retains SVG canvas width');
     assert.ok(png.height>=1130,'Browser-decoded PNG retains SVG canvas height');
     assert.ok(png.colorCount>=2,'Downloaded PNG contains visible pixels, not a blank image');
    }
   }
   }
   assert.equal(await page.locator('.maplibregl-map').count(),initialMaps,'One retained MapLibre instance');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Seasonal map fits viewport without horizontal page overflow');
  }
  await page.getByLabel('Parameter-Layer').selectOption('temperature');
  await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Rastertermin'));
 }
 await verifyGroupedSelectors(page);
 const mapIdentity=await page.locator('.maplibregl-map').evaluate(el=>{el.dataset.qaIdentity='original';return true});assert.ok(mapIdentity);
 if(width===390&&theme==='light')await page.screenshot({path:'/tmp/mid-unified-model-390.png',fullPage:true});
 await page.evaluate(()=>performance.clearResourceTimings());
 await timelineRange.fill('0');
 await chooseMapModel(page,'icon');await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('ICON Global'));
 await page.getByRole('button',{name:'Linien',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('DWD-Originaleinheit'));
 await page.waitForFunction(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('styles=qa_isoline_label'))).catch(async error=>{console.error('WMS line request failure',{width,theme,design,status:await page.locator('.unified-layer-status').innerText(),requests:requests.filter(u=>u.includes('weather-map-wms')).slice(-12),resourceCount:await page.evaluate(()=>performance.getEntriesByType('resource').length)});throw error});
 const favoriteWmsPanel=page.locator('.unified-favorites');if(await favoriteWmsPanel.getAttribute('open')===null)await favoriteWmsPanel.locator(':scope > summary').click();await page.waitForFunction(()=>document.querySelector('.unified-favorites tbody')?.textContent.includes('12,4'));assert.equal(await page.locator('.unified-favorites thead th').count(),2,'Compact selected-layer point table');
 await page.getByRole('button',{name:'Flächen',exact:true}).click();
 assert.equal(await page.locator('.maplibregl-map').getAttribute('data-qa-identity'),'original','Changing model must not remount map');
 await page.getByRole('button',{name:'Modell zuerst',exact:true}).click();await chooseMapModel(page,'icon-eps');
 const epsParameters=await page.getByLabel('Parameter-Layer').locator('option').evaluateAll(options=>options.map(o=>o.value));assert.ok(epsParameters.includes('gust-probability')&&!epsParameters.includes('gust')&&!epsParameters.includes('temperature'),'Model-first filters incompatible parameters');await verifyGroupedSelectors(page);
 await page.getByRole('button',{name:'Parameter zuerst',exact:true}).click();await page.getByLabel('Parameter-Layer').selectOption('synoptic');
 await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('INIT')).catch(async error=>{console.error('Synoptic selection',width,theme,design,{parameter:await page.getByLabel('Parameter-Layer').inputValue(),model:await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),status:await page.locator('.unified-layer-status').innerText()},requests.filter(u=>u.includes('/ruc/')).slice(-12));throw error});
 await page.waitForFunction(()=>{const text=document.querySelector('.unified-layer-status')?.textContent||'';return text.includes('INIT')&&!text.includes('Rohdaten laden')}).catch(async error=>{console.error('Synoptic state',await page.locator('.unified-layer-status').innerText(),requests.filter(u=>u.includes('weather-map-wms')).slice(-10));throw error});await verifyPresentationHint('MSL-Isobaren');
 const synopticChoices=await mapModelOptions(page);for(const id of ['icon-d2','icon-eu','icon','gfs','ifs'])assert.ok(synopticChoices.includes(id),'Published optional D2 hours must preserve every synoptic model choice: '+id);
 assert.equal(await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),'icon-d2');assert.ok(await page.getByLabel('Parameter-Layer').locator('optgroup').count()>=5);
 const keyboardMap=page.getByLabel('Wetterkarte mit Zeitsteuerung',{exact:true});await chooseTerm('0');await keyboardMap.focus();await page.keyboard.press('ArrowRight');assert.equal(await direct.inputValue(),'1');await page.keyboard.press('ArrowLeft');assert.equal(await direct.inputValue(),'0');await page.keyboard.press('ArrowLeft');assert.equal(await direct.inputValue(),'0','Timeline clamps at its first real term');await page.keyboard.press('Control+ArrowRight');assert.equal(await direct.inputValue(),'0','Modified shortcuts remain untouched');
 const opacityRange=page.getByLabel('Modell-Deckkraft'),originalOpacity=await opacityRange.inputValue();await opacityRange.fill('43');await opacityRange.press('ArrowRight');assert.ok(Number(await opacityRange.inputValue())>43,'Range key must adjust the native opacity slider');const focusInfo=await opacityRange.evaluate(el=>({focused:document.activeElement===el,activeTag:document.activeElement?.tagName,activeLabel:document.activeElement?.getAttribute('aria-label'),activeRole:document.activeElement?.getAttribute('role'),value:el.value,connected:el.isConnected}));assert.equal(focusInfo.focused,true,'Range retains keyboard focus: '+JSON.stringify(focusInfo));assert.equal(await direct.inputValue(),'0','Range control must not advance the map timeline');await opacityRange.fill(originalOpacity);if(width===390&&theme==='light'&&design==='classic'){const info=page.getByRole('button',{name:'Karteninhalt und Darstellung erklären',exact:true}),pop=page.getByRole('dialog',{name:'Karteninhalt und Darstellung erklären',exact:true});await info.click();await pop.waitFor();await page.keyboard.press('Escape');await pop.waitFor({state:'hidden'});await opacityRange.focus();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await opacityRange.evaluate(el=>document.activeElement===el),true,'Info-dialog return focus must not steal a newly focused slider')}
 await page.waitForFunction(()=>window.__qaMap.getStyle().layers.some(l=>l.id.includes('synoptic-theta-contours')&&l.type==='line'));
 assert.ok(await page.evaluate(()=>{const layers=window.__qaMap.getStyle().layers;return !layers.some(l=>l.id.includes('synoptic-humidity')&&l.type==='symbol')&&layers.filter(l=>l.id.includes('synoptic-theta-contours')&&l.type==='line').every(l=>window.__qaMap.getPaintProperty(l.id,'line-color')==='#666666')}),'RH700 has no labels; Theta-E uses neutral grey contours');

 assert.equal(await page.evaluate(()=>window.__qaMap.getStyle().layers.some(l=>l.id.includes('pressure-centers'))),false,'Composite excludes T/H even when producer supplies centres');
 const density=await page.evaluate(()=>{const m=window.__qaMap,dash=m.getPaintProperty('synoptic-pressure-line-dashed','line-dasharray');m.jumpTo({zoom:4});const low=m.getZoom();m.jumpTo({zoom:7});return {dash,low,high:m.getZoom(),fine:m.getStyle().layers.find(l=>l.id==='synoptic-pressure-line-dashed'),coarse:m.getStyle().layers.find(l=>l.id==='synoptic-pressure-line-dashed-coarse')};});assert.deepEqual(density.dash,[3,2]);assert.deepEqual(density.fine.filter[2],['<',['get','level'],1013]);assert.equal(density.fine.minzoom,7);assert.equal(density.coarse.maxzoom,5);assert.equal(density.low,4);assert.equal(density.high,7);
 for(const [zoom,expected] of [[4,[1000,1005,1010]],[7,[1000,1005,1006,1007,1008,1010,1012,1016,1024]],[9,[1000,1005,1006,1007,1008,1010,1012,1016,1024]]]){await page.evaluate(z=>window.__qaMap.jumpTo({zoom:z,center:[8,51]}),zoom);await page.waitForFunction(levels=>{const m=window.__qaMap,ids=m.getStyle().layers.filter(l=>l.id.startsWith('synoptic-pressure-line')).map(l=>l.id);return JSON.stringify([...new Set(m.queryRenderedFeatures({layers:ids}).map(f=>f.properties.level))].sort((a,b)=>a-b))===JSON.stringify(levels)},expected);}
 assert.ok(requests.some(u=>u.endsWith('icon-d2-000.bin')||u.endsWith('icon-d2-003.bin')),'Integrity-bound five-component object loaded');
 assert.ok(!requests.some(u=>u.includes('layers=dwd%3AIcon_reg025_fd_pl_T')),'No T850 substitution for Theta-E');
 await page.getByLabel('Modell-Deckkraft').fill('100');
 // A delayed next term must retain the previous rendered image and its valid time.
 await page.waitForFunction(()=>window.__qaMap?.getStyle().layers.some(l=>l.id.startsWith('synoptic-thetae-layer-')&&window.__qaMap.getPaintProperty(l.id,'raster-opacity')>.99));
 const oldSynopticStatus=await page.locator('.unified-layer-status').innerText(),lastTerm=String(await direct.locator('option').count()-1);heldSynoptic='icon-d2-048.bin';releaseSynoptic=null;const firstSynopticPending=new Promise(resolve=>{synopticReached=resolve});await chooseTerm(lastTerm);await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Neuer Termin lädt'));
 assert.ok((await page.locator('.unified-layer-status').innerText()).includes(oldSynopticStatus.split(' · ')[1]),'Old frame valid time remains truthful while requesting a successor');
 assert.ok(await page.evaluate(()=>window.__qaMap.getStyle().layers.some(l=>l.id.startsWith('synoptic-thetae-layer-')&&window.__qaMap.getPaintProperty(l.id,'raster-opacity')>.99)),'Old image stays fully visible during deferred fetch');
 await waitForHeldSynoptic(firstSynopticPending);assert.ok(releaseSynoptic,'Deferred request is actually pending');releaseSynoptic();heldSynoptic=null;await page.waitForFunction(()=>!document.querySelector('.unified-layer-status')?.textContent.includes('Neuer Termin lädt'));
 await page.waitForFunction(()=>window.__qaMap.getStyle().layers.filter(l=>l.id.startsWith('synoptic-thetae-layer-')).length===1);await chooseTerm('0');await page.waitForFunction(()=>!document.querySelector('.unified-layer-status')?.textContent.includes('Neuer Termin lädt'));
 heldSynoptic='icon-d2-042.bin';releaseSynoptic=null;const failedSynopticPending=new Promise(resolve=>{synopticReached=resolve});failSynoptic=true;await chooseTerm(String(Number(lastTerm)-1));await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Neuer Termin lädt'));await waitForHeldSynoptic(failedSynopticPending);assert.ok(releaseSynoptic);releaseSynoptic();heldSynoptic=null;await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('Prüfsumme ungültig'));assert.ok(await page.evaluate(()=>window.__qaMap.getStyle().layers.some(l=>l.id.startsWith('synoptic-thetae-layer-'))),'Failed successor does not clear the prior frame');failSynoptic=false;await chooseTerm('0');
 synopticMissing=true;await page.locator('.unified-source-info').last().locator('summary').click();await page.getByRole('button',{name:'Rasterkatalog aktualisieren',exact:true}).click();await page.getByRole('button',{name:'Synoptik erneut laden',exact:true}).waitFor();assert.ok((await page.locator('.unified-layer-status').innerText()).includes('noch nicht veröffentlicht'));synopticMissing=false;await page.getByRole('button',{name:'Synoptik erneut laden',exact:true}).click();await page.waitForFunction(()=>{const t=document.querySelector('.unified-layer-status')?.textContent||'';return t.includes('INIT')&&!t.includes('Rohdaten laden')});await verifyPresentationHint('MSL-Isobaren');

 await chooseMapModel(page,'icon-eu');await page.waitForFunction(ms=>document.querySelector('[aria-label="Kartentermin auswählen"] option:last-child')?.textContent.includes(new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'Europe/Berlin'}).format(new Date(ms))),runMs+72*hour);const horizonTime=Math.floor((runMs+72*hour)/1000),horizonOption=direct.locator(`option[data-valid-time="${horizonTime}"]`);await chooseTerm({label:await horizonOption.innerText()});await keyboardMap.focus();await page.keyboard.press('ArrowRight');assert.equal(Number(await direct.locator('option:checked').getAttribute('data-valid-time')),horizonTime,'Keyboard clamps at the published horizon');await page.waitForFunction(expected=>{
   const status=document.querySelector('.unified-layer-status')?.textContent||'';
   const time=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(expected));
   return status.includes('ICON-EU')&&status.includes(time)&&!status.includes('Rohdaten laden')&&!status.includes('Neuer Termin lädt');
  },runMs+72*hour,{timeout:30000}).catch(async error=>{
   console.error('Exact +72h source field did not become ready',{width,theme,design,model:await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),term:await direct.inputValue(),selectedTime:await direct.locator('option:checked').getAttribute('data-valid-time'),status:await page.locator('.unified-layer-status').innerText(),recentBinaryRequests:requests.filter(url=>url.endsWith('.bin')).slice(-15)});
   throw error;
  });assert.ok(requests.some(u=>u.endsWith('icon-eu-072.bin')),'The real +72h SHA-verified original object reaches the common map before the status becomes ready');const selectedValidTime=await direct.locator('option:checked').getAttribute('data-valid-time');assert.equal(Number(selectedValidTime),Math.floor((runMs+72*hour)/1000));holdCatalog=true;releaseCatalog=null;const cataloguePending=new Promise(resolve=>{catalogBlocked=resolve});await page.getByRole('button',{name:'Rasterkatalog aktualisieren',exact:true}).click();await Promise.race([cataloguePending,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Catalogue refresh never reached the held fixture request')),30000);cataloguePending.then(()=>clearTimeout(timer))})]);await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.getAttribute('aria-busy')==='true');assert.ok(releaseCatalog,'The refresh request is held at the actual catalogue boundary');assert.equal(await direct.locator('option:checked').getAttribute('data-valid-time'),selectedValidTime,'Selected valid time remains visible during a delayed catalogue refresh');assert.equal(await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),'icon-eu');holdCatalog=false;releaseCatalog();await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.getAttribute('aria-busy')==='false');assert.equal(await direct.locator('option:checked').getAttribute('data-valid-time'),selectedValidTime,'Selected valid time survives the completed catalogue refresh');await chooseMapModel(page,'icon-d2');await page.waitForFunction(expected=>Number(document.querySelector('[aria-label="Kartentermin auswählen"] option:checked')?.getAttribute('data-valid-time'))===expected,Math.floor((runMs+48*hour)/1000));assert.ok(await direct.locator('option').count()>=13,'The shorter model retains its real forecast terms when switching from +72h');
 for(const [modelId,end] of [['gfs',384],['ifs',360]]){await chooseMapModel(page,modelId);const endTime=Math.floor((runMs+end*hour)/1000);await page.waitForFunction(ms=>Boolean(document.querySelector('[aria-label="Kartentermin auswählen"] option[data-valid-time="'+ms+'"]')),endTime);const option=direct.locator(`option[data-valid-time="${endTime}"]`),endLabel=await option.innerText();assert.match(endLabel,/\b(?:Mo|Di|Mi|Do|Fr|Sa|So)\b/,'Long-range dropdown includes two-letter weekday');await chooseTerm({label:endLabel});await page.waitForFunction(ms=>{const text=document.querySelector('.unified-layer-status')?.textContent||'',date=new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'Europe/Berlin'}).format(new Date(ms));return text.includes(date)&&!text.includes('Neuer Termin lädt')&&!text.includes('Rohdaten laden')},endTime*1000);await keyboardMap.focus();await page.keyboard.press('ArrowRight');assert.equal(Number(await direct.locator('option:checked').getAttribute('data-valid-time')),endTime,'Keyboard reaches and clamps at complete model horizon');assert.ok(requests.some(u=>u.endsWith(`${modelId}-${end}.bin`)),'Published endpoint reaches the common map');}await chooseMapModel(page,'icon-d2');await page.waitForFunction(ms=>Number(document.querySelector('[aria-label="Kartentermin auswählen"] option:checked')?.getAttribute('data-valid-time'))===ms,Math.floor((runMs+48*hour)/1000));
 if(profileMemory){
  const session=await context.newCDPSession(page),tracePath=process.env.MID_MAP_TRACE==='1'?'/tmp/mid-map-cycles-390-light-next.json':null;
  let tracing=false;
  try{
   if(tracePath){await browser.startTracing(page,{path:tracePath,screenshots:false,categories:['devtools.timeline','v8','blink.user_timing']});tracing=true;}
   memoryProfile=await profileMapCycles(session,async()=>{
    for(const [id,label] of [['icon-eu','DWD ICON-EU'],['icon-d2','DWD ICON-D2']]){
     await chooseMapModel(page,id);
     await page.waitForFunction(label=>{const el=document.querySelector('.unified-layer-status'),text=el?.textContent||'';return el?.getAttribute('aria-busy')==='false'&&text.includes(label)&&text.includes('INIT')&&!text.includes('Rohdaten laden')&&!text.includes('Neuer Termin lädt')},label);
     await page.waitForFunction(()=>window.__qaMap.getStyle().layers.filter(l=>l.id.startsWith('synoptic-thetae-layer-')).length===1);
    }
    assert.equal(await page.locator('.maplibregl-map').count(),1,'Cycle returns to one map');
    assert.equal(await page.locator('.maplibregl-map').getAttribute('data-qa-identity'),'original','No map reconstruction during stress cycles');
   });
   memoryProfile.tracePath=tracePath;
  }finally{try{if(tracing)await browser.stopTracing();}finally{await session.detach();}}
 }
 assert.equal(await page.locator('.maplibregl-map').getAttribute('data-qa-identity'),'original');
 await page.getByRole('button',{name:'Parameter zuerst',exact:true}).click();await page.getByLabel('Parameter-Layer').selectOption('thetae');assert.deepEqual(await mapModelOptions(page),['icon-d2-ruc','icon-d2','icon-eu','icon','ifs','gfs'],'ThetaE offers only qualified native provider IDs, grouped by family and fine-to-coarse raster resolution');await verifyGroupedSelectors(page);
 await page.getByLabel('Parameter-Layer').selectOption('geopotential');await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('INIT')&&!document.querySelector('.unified-layer-status')?.textContent.includes('Rohdaten laden')&&window.__qaMap.getStyle().layers.some(layer=>layer.id.startsWith('synoptic-height')));await verifyPresentationHint('Höhenlinien');assert.equal(await page.getByRole('button',{name:'Flächen',exact:true}).isDisabled(),true);assert.ok(!requests.some(u=>u.includes('layers=dwd%3AIcon_reg025_fd_pl_GH')),'500hPa uses native contours, never stepped WMS');
 const timeline=timelineRange;await timeline.fill(await timeline.getAttribute('max'));await timeline.dispatchEvent('change');await page.waitForFunction(()=>document.querySelector('.composite-map-status')?.textContent.includes('Modellprognose'));
 await page.getByRole('button',{name:'Jetzt',exact:true}).click();
 await page.getByLabel('Parameter-Layer').selectOption('cloud');await page.getByRole('button',{name:'Flächen',exact:true}).click();await chooseMapModel(page,'gdps');
 await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('ECCC-Originaldarstellung'));
 await page.waitForFunction(()=>{const text=document.querySelector('.unified-layer-status')?.textContent||'';return text.includes('ECCC-Originaldarstellung')&&!text.includes('Kacheln laden')});
 assert.ok(requests.some(u=>u.includes('provider=geomet')&&u.includes('layers=GDPS_15km_TotalCloudCover')),'GDPS uses only the approved GeoMet provider');
 failGdps=true;await page.getByLabel('Parameter-Layer').selectOption('sigwx');
 await page.waitForFunction(()=>{
  const button=[...document.querySelectorAll('button')].find(element=>element.textContent==='Zum Modelltermin');
  if(button){button.click();return true}
  return window.__qaMap.getStyle().layers.some(layer=>layer.id.startsWith('cloud-weather-'));
 });
 await page.getByRole('button',{name:'Wolken und Wetter erneut laden'}).waitFor().catch(async error=>{
  // Exact in-browser evidence for a failed injected GDPS tile. Never turn a missing
  // 502 error/visible retry into a synthetic PASS, a blind extra retry or a NoData=0.
  const diagnostics=await page.evaluate(()=>{
   const map=window.__qaMap,style=map?.getStyle(),ids=(style?.layers??[]).filter(l=>l.id.startsWith('cloud-weather-')).map(l=>({id:l.id,source:l.source}));
   return {parameter:document.querySelector('[aria-label="Parameter-Layer"]')?.value,
    model:document.querySelector('.mid-map-model-picker-trigger')?.getAttribute('data-model-id'),
    status:document.querySelector('.unified-layer-status')?.textContent,
    map:map?{zoom:map.getZoom(),center:map.getCenter().toArray(),isMoving:map.isMoving(),tiles:ids.map(row=>({...row,sourceLoaded:row.source?map.isSourceLoaded(row.source):null}))}:null,
    retryButtons:[...document.querySelectorAll('button')].map(b=>b.textContent?.trim()).filter(t=>t?.includes('erneut laden'))};
  }).catch(e=>({diagnosticError:String(e)}));
  const gdpsRequests=requests.filter(u=>u.includes('layers=GDPS_15km_PrecipType-Instant'));
  console.error('GDPS injected-502 retry visibility MISSING (must fail)',JSON.stringify({width,theme,design,failedWmsArmed:failGdps,gdpsRequestCount:gdpsRequests.length,gdpsRequests:gdpsRequests.slice(-4),diagnostics}));
  throw error;
 });
 const gdpsWeatherGetMaps=()=>requests.filter(value=>{const url=new URL(value);return url.searchParams.get('layers')==='GDPS_15km_PrecipType-Instant'&&url.searchParams.get('request')?.toLowerCase()==='getmap'});
 assert.ok(gdpsWeatherGetMaps().length>0,'Visible retry follows an actual GDPS weather GetMap');
 failGdps=false;const beforeRetry=gdpsWeatherGetMaps().length;await page.getByRole('button',{name:'Wolken und Wetter erneut laden'}).click();await page.waitForFunction(()=>{const text=document.querySelector('.unified-layer-status')?.textContent||'';return text.includes('INIT')&&!text.includes('wird geprüft')&&!text.includes('laden')});assert.ok(gdpsWeatherGetMaps().length>beforeRetry,'Retry requests a fresh failed GDPS source');assert.equal(await page.getByRole('button',{name:'Linien',exact:true}).isDisabled(),true);assert.ok(requests.some(u=>u.includes('layers=GDPS_15km_PrecipType-Instant')&&u.includes('dim_reference_time=')),'Combined GDPS uses instant precipitation type with explicit init');await page.locator('.cloud-weather-legend summary').click();assert.match(await page.locator('.cloud-weather-legend').innerText(),/Keine vollständige Nebel/);
 await chooseMapModel(page,'icon-d2');await page.getByRole('button',{name:'Raster + Ortswerte · SVG'}).waitFor();await page.waitForFunction(()=>document.querySelector('.unified-favorites tbody')?.textContent.includes('15 % Wolken'));assert.match(await page.locator('.cloud-weather-legend').innerText(),/Modell-Wolkenbild/);assert.equal(await page.locator('.maplibregl-map').getAttribute('data-qa-identity'),'original');await verifyGroupedSelectors(page);
 await chooseMapModel(page,'icon-eu');await page.waitForFunction(()=>document.querySelector('.unified-favorites tbody')?.textContent.includes('75 % Wolken'));const euCloudLabel=await mapModelOptionLabel(page,'icon-eu');assert.match(euCloudLabel,/DWD ICON-EU · 14 km Raster/,'ICON-EU cloud/WW selector uses verified native 14 km grid, never WMS 0,0625°');if(width===390&&theme==='light'&&design==='next')await page.screenshot({path:'/tmp/mid-cloud-weather-390.png',fullPage:true});
 // .437: phase markers require radar echoes; non-radar model/cloud views must have none.
 assert.equal(await page.locator('.mid-synop-symbol-button,.radar-phase-symbol').count(),0,'No unbacked phase marker on a cloud/model map');

 await page.getByLabel('Parameter-Layer').selectOption('observed');await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('RADOLAN'));assert.equal(await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),'radolan');
 assert.ok(await page.evaluate(()=>window.__qaRasterEncodes>0),'Native filled rasters were actually generated');assert.equal(await page.evaluate(()=>window.__qaDataImageFetches),0,'Native image decode avoids fetch before navigation resets the counter');
 await page.getByLabel('Modell-Deckkraft').fill('43');await measuredReload();await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('RADOLAN'));assert.equal(await page.getByLabel('Modell-Deckkraft').inputValue(),'43','Immediate reload preserves layer settings');
 await page.getByRole('button',{name:'Modell / Messraster'}).click();await measuredReload();await page.getByRole('button',{name:'Modell / Messraster'}).waitFor();assert.equal(await page.getByRole('button',{name:'Modell / Messraster'}).getAttribute('aria-pressed'),'false');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No page overflow');assert.equal(await page.evaluate(()=>window.__qaDataImageFetches),0,'Decoded native images never cause a fetch that can race layer removal');assert.deepEqual(errors,[],'No browser runtime errors');assert.ok(!requests.some(u=>/mode=model-contours|mode=synoptic-analysis/.test(u)),'No obsolete synoptic/map fetch');assert.ok(!requests.some(u=>/https?:\/\/[^/]*rainviewer\.com/.test(u)),'RainViewer fallback must use the existing worker proxy, not external browser requests');
 omitIcon=true;await page.evaluate(()=>{const key='mid:unified-map:v1',d=JSON.parse(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify({...d,enabled:true,parameter:'synoptic',modelId:'icon'}))});await measuredReload();await page.getByLabel('Modell für Parameter').waitFor();await page.waitForFunction(()=>document.querySelector('.unified-layer-status')?.textContent.includes('nicht verfügbar'));assert.equal(await page.getByRole('button',{name:'Modell für Parameter',exact:true}).getAttribute('data-model-id'),'icon');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:unified-map:v1')).modelId),'icon','Unavailable model preference survives reopen');
 // .368: exercise the actual RadarPanel, not a synthetic checkbox. PX metadata
 // in this fixture is deliberately unavailable; the saved choice must survive it.
 await page.evaluate(async()=>{const store=await import('/src/compositeSettings.ts');store.patchCompositeSettings({observationsEnabled:true,showRadar:true,highResolution:true})});
 async function openAdvanced(){const details=page.locator('.composite-advanced').first();await details.waitFor();if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();return details}
 let advanced=await openAdvanced();
 const pxToggle=()=>advanced.getByRole('button',{name:/Radar · 250 m/});
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Radar · 250 m')&&b.getAttribute('aria-pressed')==='true'&&b.textContent.includes('Daten nicht verfügbar')));
 assert.equal(await pxToggle().isDisabled(),false,'A retained unavailable PX choice can be switched off');
 await page.waitForFunction(()=>{const map=window.__qaMap,ids=Object.entries(map.getStyle().sources).filter(([,s])=>s.type==='vector').map(([id])=>id);return ids.length>0&&ids.every(id=>map.isSourceLoaded(id))});
 await page.evaluate(()=>{window.__qaReferenceSources=Object.entries(window.__qaMap.getStyle().sources).filter(([,s])=>s.type==='vector').map(([id])=>[id,window.__qaMap.getSource(id)])});
 await advanced.getByLabel('Ländergrenzen',{exact:true}).uncheck();await advanced.getByLabel('Straßen',{exact:true}).check();
 assert.equal(await page.evaluate(()=>window.__qaReferenceSources.every(([id,source])=>window.__qaMap.getSource(id)===source)),true,'Checkboxes retain the same live vector source and pending requests');
 await measuredReload();advanced=await openAdvanced();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Radar · 250 m')&&b.getAttribute('aria-pressed')==='true'&&b.textContent.includes('Daten nicht verfügbar')));
 assert.equal(await advanced.getByLabel('Ländergrenzen',{exact:true}).isChecked(),false);assert.equal(await advanced.getByLabel('Straßen',{exact:true}).isChecked(),true);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:composite-settings:v3')).highResolution),true,'Unavailable metadata/reload must not erase the request');
 await pxToggle().click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:composite-settings:v3')).highResolution),false,'First click persists explicit off immediately');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Saved-state fallback text stays within the viewport');
 assert.deepEqual(errors,[],'No runtime errors during availability/reload/checkbox interaction');
 if(focusedCases)await page.screenshot({path:`/tmp/mid-map-focused-${width}-${theme}.png`,fullPage:true});else if(width===390&&theme==='light')await page.screenshot({path:'/tmp/mid-unified-map-390.png',fullPage:true});if(perfEnabled){
   const last=await snapshotMapBrowserProbe(page,'end-case');if(last)perfPhases.push(last);
   perfRows.push({width,theme,design,caseKind:profileMemory?'isolated-memory-cycles':'functional-matrix',memoryProfile,readyMs:readyMs===null?null:Math.round(readyMs*100)/100,...summarizePhases(perfPhases)});
  }cases++;console.log(`Map case ${cases}: ${width}px ${theme} ${design} passed · ${((performance.now()-caseStarted)/1000).toFixed(1)} s`);await context.close();
}
/** #853: read back actual GPU pixels from a synthetic opaque WMS original.
 * Distinguish a real filled image on every canvas edge from a correctly
 * positioned but transparent or narrow ImageQuad. This does NOT certify
 * DWD/EUMETSAT/OPERA source validity or real iOS rendering.
 */
async function assertSurroundingsViewportPixels(page,requests,width,theme){
 await page.waitForFunction(()=>{
  const map=window.__qaMap;
  return Boolean(map?.getStyle()?.layers?.some(layer=>layer.id.startsWith('surroundings-radar-layer-')&&
   map.getPaintProperty(layer.id,'raster-opacity')>.98));
 },null,{timeout:30000});
 const footprint=await page.evaluate(()=>{
  const map=window.__qaMap;
  const bounds=map.getBounds();
  const images=Object.entries(map.getStyle().sources).filter(([id,s])=>id.startsWith('surroundings-radar-source-')&&s.type==='image');
  const [id]=images.at(-1)||[];
  const source=id?map.getSource(id):null;
  const corners=source?.serialize()?.coordinates;
  const canvas=map.getCanvas();
  return {
   visible:{west:bounds.getWest(),south:bounds.getSouth(),east:bounds.getEast(),north:bounds.getNorth()},
   corners,canvas:{width:canvas.width,height:canvas.height}
  };
 });
 assert.equal(footprint.corners?.length,4,'Actual MapLibre ImageSource quad must be installed');
 const [[west,north],[east,north2],[east2,south],[west2,south2]]=footprint.corners;
 assert.ok([west,north,east,north2,east2,south,west2,south2].every(Number.isFinite));
 assert.ok(Math.abs(north-north2)<1e-6&&Math.abs(east-east2)<1e-6&&Math.abs(west-west2)<1e-6&&Math.abs(south-south2)<1e-6,
  'Image source corners preserve a georeferenced rectangle');
 for(const edge of ['west','south']){
  assert.ok(footprint.corners&&({west,south})[edge]<footprint.visible[edge],
   `Image quad must extend beyond visible ${edge} canvas boundary`);
 }
 for(const edge of ['east','north']){
  assert.ok(({east,north})[edge]>footprint.visible[edge],
   `Image quad must extend beyond visible ${edge} canvas boundary`);
 }
 const radarWms=requests.map(value=>new URL(value))
  .filter(url=>url.searchParams.get('mode')==='composite-wms'&&url.searchParams.get('layers')==='dwd:Radar_rv_product_1x1km_ger');
 assert.ok(radarWms.length>0,'Actual browser requested original DWD radar WMS through worker proxy');
 const latest=radarWms.at(-1),bbox=latest.searchParams.get('bbox')?.split(',').map(Number),w=Number(latest.searchParams.get('width')),h=Number(latest.searchParams.get('height'));
 assert.equal(bbox?.length,4,'WMS request must contain four BBOX degrees');
 assert.ok(w>=16&&w<=512&&h>=16&&h<=256&&w*h<=131072,'Existing bounded WMS pixel request budget');
 for(const [actual,expected]of bbox.map((v,i)=>[v,[west,south,east,north][i]]))
  assert.ok(Math.abs(actual-expected)<.000002,'WMS and MapLibre quad must have identical geographic edges');
 const geoRatio=(east-west)/(north-south);
 assert.ok(Math.abs(w/h-geoRatio)/geoRatio<.015,'WMS pixel aspect follows the EPSG:4326 BBOX');
 const edgeColors=await page.evaluate(async()=>{
  const map=window.__qaMap,canvas=map.getCanvas(),gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
  if(!gl)return {error:'WebGL canvas context unavailable'};
  const points={
   left:[[.07,.23],[.07,.5],[.07,.77]],
   right:[[.93,.23],[.93,.5],[.93,.77]],
   top:[[.23,.07],[.5,.07],[.77,.07]],
   bottom:[[.23,.93],[.5,.93],[.77,.93]],
   center:[[.5,.5]]
  };
  return await new Promise((resolve,reject)=>{
   let settled=false;
   const timeout=setTimeout(()=>{if(!settled){settled=true;map.off('render',capture);reject(Error('No WebGL render event for radar pixels'))}},5000);
   const capture=()=>{
    if(settled)return;
    settled=true;clearTimeout(timeout);
    const result={};
    for(const [edge,coordinates] of Object.entries(points)){
     result[edge]=coordinates.map(([u,v])=>{
      const rgba=new Uint8Array(4);
      gl.readPixels(Math.round(u*(canvas.width-1)),Math.round((1-v)*(canvas.height-1)),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
      return Array.from(rgba);
     });
    }
    resolve(result);
   };
   map.once('render',capture);map.triggerRepaint();
  });
 });
 assert.equal(edgeColors?.error,undefined,JSON.stringify(edgeColors));
 // Reference roads/labels can tint the sentinel, so check its distinctive
 // magenta dominance rather than demanding exact RGB from a composited GPU pixel.
 // Pale basemap pixels have no red/blue dominance over green and remain rejected.
 const opaqueMagenta=p=>p[3]>=200&&p[0]>=170&&p[2]>=170&&p[0]-p[1]>=110&&p[2]-p[1]>=110;
 for(const edge of ['left','right','top','bottom','center'])
  assert.ok(edgeColors[edge].some(opaqueMagenta),
   `Real WebGL readPixels: opaque synthetic WMS image must reach ${edge} canvas zone at ${width}px/${theme}; ${JSON.stringify(edgeColors[edge])}`);
 console.log(`Surroundings #853: live WMS BBOX and GPU edge-pixels at ${width}px/${theme} passed`);
}

async function verifySurroundings(width,theme){
 const context=await browser.newContext({viewport:{width,height:780},colorScheme:theme});
 try{
  const page=await context.newPage();
  const now=Date.now(),observed=new Date(now-5*60000).toISOString(),future=new Date(now+15*60000).toISOString();
  // Visually unambiguous full-opacity data sentinel, not a weather observation.
  const magentaWms=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z/D/PwMDAwMTAxQAAC4IAwEDGOY5AAAAAElFTkSuQmCC','base64');
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(request.url().includes('__qa-worker'))requests.push(request.url().slice(0,450))});
  await page.route('**/__qa-worker?**',async route=>{
   const url=new URL(route.request().url()),mode=url.searchParams.get('mode');
   if(mode==='composite-times')return route.fulfill({json:{dwdRadar:[observed],dwdRadarNowcast:[future],
    satelliteRgbProduct:{provider:'eumetsat',layer:'mtg_fd:rgb_geocolour',label:'MTG GeoColour',times:[new Date(now-30*60000).toISOString()],timeVerified:true,fresh:true},
    satelliteIrProduct:{provider:'eumetsat',layer:'mtg_fd:ir105_hrfi',label:'MTG IR 10,5',times:[observed],timeVerified:true,fresh:true}
   }});
   if(mode==='composite-wms')return route.fulfill({body:magentaWms,contentType:'image/png'});
   return route.fulfill({json:{error:'Unavailable in surroundings fixture'}});
  });
  // A real published-looking, SHA-checked model catalogue is served only
  // inside this browser fixture. The selected 15-minute slot deliberately
  // lacks an original; the preceding H0 hourly field is a distinct reference.
  await page.route('**/ruc/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/ruc/latest.json')return route.fulfill({json:{
    schema:'mid.dwd.ruc.grid.v2',run:run.slice(0,16),
    synopticFields:{key:synopticKey}
   }});
   if(path===`/ruc/${synopticKey}`)
    return route.fulfill({body:synopticIndex,contentType:'application/json'});
   const filename=path.split('/').at(-1);
   if(synopticObjects.has(filename))
    return route.fulfill({body:synopticObjects.get(filename),contentType:'application/octet-stream'});
   return route.abort();
  });
  await page.goto(base+'/__map-qa?surroundings');
  // v.480: the SHA-validated clouds/SigWx view starts without expensive radar.
  // This fixture intentionally lacks a real cloud original: NoData is correct.
  const cloudMode=page.getByRole('button',{name:'Wolken + Wetter',exact:true});
  await cloudMode.waitFor({timeout:30000});
  assert.equal(await cloudMode.getAttribute('aria-pressed'),'true','The initial surroundings mode is verified cloud weather');
  await page.locator('.current-surroundings-maplibre canvas').first().waitFor({timeout:30000});
  await page.locator('.current-surroundings-center-dot').waitFor({timeout:30000});
  assert.equal(requests.some(value=>new URL(value).searchParams.get('mode')==='composite-times'),false,'No eager DWD radar on initial cloud preview');
  // .481: real mobile cloud scrubber, source-time truthful even when original data unavailable.
  const cloudTimeline=page.locator('.current-surroundings-cloud-timeline'),quarter=cloudTimeline.locator('input[type="range"]');
  await quarter.waitFor();
  assert.equal(await quarter.inputValue(),'0','Cloud starts at the current time');
  const cloudPrev=page.getByRole('button',{name:'Wolkenprognose 15 Minuten zurück',exact:true});
  const cloudNext=page.getByRole('button',{name:'Wolkenprognose 15 Minuten vor',exact:true});
  assert.equal(await cloudPrev.isDisabled(),true);
  // UTC validity slots are 15 min apart, but the truthful relative readout is
  // measured from the actual wall-clock now, not the last completed quarter-hour.
  for(let step=1;step<=9;step++){
   await cloudNext.click();
   assert.equal(await quarter.inputValue(),String(step),'Each click advances exactly one 15-minute model-validity slot');
   const readoutText=await cloudTimeline.locator('output').innerText();
   const relative=readoutText.match(/\bin (\d+) min\b/);
   assert.ok(relative,'The single visible time readout must contain a real relative time');
   const remaining=Number(relative[1]);
   assert.ok(remaining>(step-1)*15&&remaining<=step*15,
    'Relative minutes must be consistent with a UTC quarter-hour target and the elapsed fraction of the current slot');
   assert.match(readoutText,/\d{2}\.\d{2}\./,'The same readout must show its absolute date');
   assert.ok((await quarter.getAttribute('aria-label'))?.includes('in '+remaining+' Minuten'),
    'Range accessibility label must agree with the visible relative minutes');
  }
  assert.equal(await cloudNext.isDisabled(),true,'The cloud forecast must stop at the ninth step, which guarantees at least +120 min');
  const readout=cloudTimeline.locator('output');
  assert.equal(await readout.isVisible(),true);
  assert.match(await readout.innerText(),/\d{2}\.\d{2}\./,'The same time band shows the absolute date');
  const bounds=await cloudTimeline.evaluate(el=>({
   buttons:[...el.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height),
   range:el.querySelector('input[type="range"]')?.getBoundingClientRect().height,
   overflow:el.scrollWidth>el.clientWidth+1
  }));
  assert.ok(bounds.buttons.every(v=>v>=44)&&bounds.range>=44,'Minimum 44px touch targets');
  assert.equal(bounds.overflow,false,'No mobile time scrubber overflow');
  await cloudPrev.click();
  assert.equal(await quarter.inputValue(),'8','Backwards is exactly one 15-min validity step');
  await quarter.fill('0');
  assert.equal(await quarter.inputValue(),'0','Slider returns to live');

  // Reproduce the real P1: only source-verified hourly cloud+WW data exist,
  // while the visible target is a native 15-minute position. The UI must
  // show the older original as a clearly labelled REFERENCE, not a value at
  // the selected time. No interpolation and no alleged satellite observation.
  const initialTimeText=await cloudTimeline.locator('output').innerText();
  const quarterMinuteMatch=initialTimeText.match(/(\d{2}):(\d{2}) Uhr/);
  assert.ok(quarterMinuteMatch,'The cloud target has a visible absolute clock');
  const minute=Number(quarterMinuteMatch[2]);
  assert.ok([0,15,30,45].includes(minute),'The selected target is a UTC quarter-hour');
  const referenceStep=minute===45?2:1;
  await quarter.fill(String(referenceStep));
  const cloudStatus=page.locator('.current-surroundings-data-status');
  await page.waitForFunction(()=>document.querySelector('.current-surroundings-data-status')?.textContent?.includes('Referenzbild'),null,{timeout:25000}).catch(async error=>{
   console.error('Original cloud reference diagnostics',{status:await cloudStatus.innerText(),requests:requests.slice(-15),map:await page.evaluate(()=>window.__qaMap?.getStyle()?.layers?.map(x=>x.id))});
   throw error;
  });
  assert.match(await cloudStatus.innerText(),/Referenzbild.*Original gültig.*Gewählt:/s,'Original source and unserved target are separately stated');
  assert.match(await cloudStatus.innerText(),/NICHT für den gewählten 15-Minuten-Termin/,'A reference must not claim a native 15min SigWx forecast');
  await page.waitForFunction(()=>window.__qaMap?.getStyle()?.layers?.some(layer=>layer.id.includes('surroundings-original-reference-cloud-weather')),
   null,{timeout:10000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Cloud source diagnostics do not cause mobile overflow');
  await quarter.fill('0');
  assert.equal(requests.some(v=>new URL(v).searchParams.get('mode')==='composite-times'),false,'No eager radar network even while browsing future cloud frames');
  await page.getByRole('button',{name:'Radar / Satellit',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Radar / Satellit',exact:true}).getAttribute('aria-pressed'),'true','Explicit radar selection activated');
  const radarObserved=page.getByRole('status').filter({hasText:'DWD-Radar · Beobachtung'});
  try{await radarObserved.waitFor({timeout:60000})}catch(error){
   const state=await page.evaluate(()=>({
    heading:document.querySelector('.current-surroundings h2')?.textContent,
    status:[...document.querySelectorAll('.current-surroundings [role="status"]')].map(node=>node.textContent?.slice(0,220)),
    mapCanvas:!!document.querySelector('.current-surroundings-maplibre canvas'),
    marker:!!document.querySelector('.current-surroundings-center-dot'),
    mapText:document.querySelector('.current-surroundings')?.textContent?.slice(0,1000)
   })).catch(e=>({inspectionError:String(e)}));
   throw new Error('Umfeld-Radar-Fixturnier (echte Bilddaten erforderlich): '+JSON.stringify({state,requests:requests.slice(-16),pageErrors:errors})+'; Ursache: '+String(error));
  }
  // #853: catalog RGB is stale, so the genuine time-matching IR original must be used.
  await page.waitForFunction(()=>document.querySelector('.current-surroundings-sources')?.textContent?.includes('Infrarot (IR)'),null,{timeout:30000});
  const originalSatelliteRequests=requests.map(value=>new URL(value)).filter(url=>url.searchParams.get('mode')==='composite-wms'&&url.searchParams.get('layers')?.startsWith('mtg_fd:'));
  assert.ok(originalSatelliteRequests.some(url=>url.searchParams.get('layers')==='mtg_fd:ir105_hrfi'),'Real Chromium requests the time-matching IR source');
  assert.equal(originalSatelliteRequests.some(url=>url.searchParams.get('layers')==='mtg_fd:rgb_geocolour'),false,'A stale RGB catalog entry cannot suppress the valid IR original');
  // #853: actual Chrome GPU readback and real WMS source/quad geometry, not a CSS-only assertion.
  await assertSurroundingsViewportPixels(page,requests,width,theme);
  // #795/.478 replaces the old approximate SVG borders with the real MapLibre vector basemap.
  // The independent radar admission still requires a real rendered frame after explicit selection.
  await page.locator('.current-surroundings-maplibre canvas').first().waitFor({timeout:30000});
  await page.locator('.current-surroundings-center-dot').waitFor({timeout:30000});
  assert.equal(await page.locator('.current-surroundings-orientation').count(),0,'Obsolete hand-drawn borders must not return');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);

  const radarTimeline=page.locator('.current-surroundings-cloud-timeline');
  const radarRange=radarTimeline.locator('input[type="range"]');
  const radarPrev=page.getByRole('button',{name:'Radar und Satellit 15 Minuten zurück',exact:true});
  const radarNext=page.getByRole('button',{name:'Radar und Satellit 15 Minuten vor',exact:true});
  await radarRange.waitFor();
  assert.equal(await radarRange.inputValue(),'0','Radar/Sat starts at current observed target');
  for(const control of [radarRange,radarPrev,radarNext,page.getByRole('button',{name:'Jetzt',exact:true}),page.getByRole('button',{name:'Karte öffnen',exact:true})]){
   assert.ok((await control.boundingBox())?.height>=44,'Radar 15-minute controls require 44px touch targets');
  }
  const radarBounds=await radarTimeline.evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1}));
  assert.equal(radarBounds.overflow,false,'Radar timeline must not overflow small screens');
  const map=page.locator('.current-surroundings-map');
  const before=await map.boundingBox();
  await radarNext.click();
  assert.equal(await radarRange.inputValue(),'1','Exactly +15 min radar step');
  assert.match(await radarTimeline.locator('output').innerText(),/in 15 min/);
  await page.getByRole('status').filter({hasText:'DWD-Radar · Nowcast'}).waitFor();
  assert.deepEqual(await map.boundingBox(),before,'Nowcast preserves surroundings map extent');
  await page.getByRole('button',{name:'Karte öffnen',exact:true}).click();
  const handoff=await page.evaluate(()=>JSON.parse(document.body.dataset.surroundingsHandoff));
  assert.equal(handoff.time,Date.parse(future),'Main map receives true NOWCAST source timestamp');
  assert.equal(handoff.bounds.west,7.14-1.4);
  assert.equal(handoff.bounds.south,50.82-.65);
  await radarPrev.click();
  assert.equal(await radarRange.inputValue(),'0','Back to the current observed source');
  await page.getByRole('status').filter({hasText:'DWD-Radar · Beobachtung'}).waitFor();
  await radarPrev.click();
  assert.equal(await radarRange.inputValue(),'-1','Historical radar target exactly −15 min');
  assert.match(await radarTimeline.locator('output').innerText(),/vor 15 min/);
  await radarNext.click();
  assert.equal(await radarRange.inputValue(),'0');
  await page.getByRole('button',{name:'Jetzt',exact:true}).click();
  assert.deepEqual(errors,[]);
  console.log(`Surroundings: ${width}px ${theme} passed`);
 }finally{await context.close()}
}


/** Real React+Chrome behaviour, not a source-string test. The first seek is
 * intentionally not acknowledged by the parent: a stale last-dispatched ref
 * must not swallow the second, still-legitimate Home request. Then switch the
 * controlled model frame and verify End -> Home after acknowledgement. */
async function verifyHomeEndControlledSeek(){
 const probe=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await probe.goto(base+'/__map-qa?design=next&timeline-probe');
  const slider=probe.getByRole('slider',{name:'QA-Zeitschritt wählen'});
  const requests=probe.getByTestId('qa-timeline-requests');
  const index=probe.getByTestId('qa-timeline-index');
  await slider.waitFor();
  assert.equal(await slider.inputValue(),'3','QA harness starts at model frame 3');
  await slider.press('Home');
  await probe.waitForFunction(()=>document.querySelector('[data-testid="qa-timeline-requests"]')?.textContent==='0');
  assert.equal(await slider.inputValue(),'3','Unacknowledged model seek must not fake the controlled frame');
  await slider.press('Home');
  await probe.waitForFunction(()=>document.querySelector('[data-testid="qa-timeline-requests"]')?.textContent==='0,0',null,{timeout:5000});
  assert.equal(await requests.textContent(),'0,0','Two valid Home presses must both reach an unacknowledged async parent');
  await probe.getByRole('button',{name:'Modelllauf wechseln'}).click();
  await probe.waitForFunction(()=>document.querySelector('[data-testid="qa-timeline-index"]')?.textContent==='2');
  await slider.press('End');
  await probe.waitForFunction(()=>document.querySelector('[data-testid="qa-timeline-index"]')?.textContent==='4');
  assert.equal(await slider.inputValue(),'4','End after a new controlled model frame reaches the last original term');
  await slider.press('Home');
  await probe.waitForFunction(()=>document.querySelector('[data-testid="qa-timeline-index"]')?.textContent==='0');
  assert.equal(await slider.getAttribute('aria-valuetext'),'Modellgültigkeit 0');
  assert.equal(await requests.textContent(),'0,0,4,0','Model switch and both keyboard endpoints dispatch exactly once');
  assert.equal(await index.textContent(),'0');
  console.log('QA React controlled map timeline Home/End: two pending seeks and acknowledged model switch passed');
 }finally{await probe.close()}
}



/** Real Chromium at desktop width: SVG flags must be visible both in the
 * selected model and in ALL choices, with keyboard and mobile containment.
 */
async function verifyDesktopModelFlags(){
 const page=await browser.newPage({viewport:{width:1440,height:900},colorScheme:'light'});
 try{
  await page.goto(base+'/__map-qa?flag-probe');
  const trigger=page.getByRole('button',{name:'Modell für Parameter',exact:true});
  await trigger.waitFor({timeout:15000});
  assert.equal(await trigger.getAttribute('data-model-id'),'icon-d2');
  assert.equal(await trigger.locator('svg.mid-map-model-flag').count(),1,
   'Desktop selected model shows a real SVG German flag, no Windows emoji dependency');
  await trigger.click();
  const options=page.locator('.mid-map-model-picker-option');
  assert.equal(await options.count(),4,'All four known flag identities available in the desktop model popup');
  assert.equal(await options.locator('svg.mid-map-model-flag').count(),4,
   'German, EU, US, Canadian flags render as SVG in the actual open dropdown');
  assert.ok(await options.evaluateAll(nodes=>nodes.every(node=>node.getBoundingClientRect().height>=44)),
   'All graphical model options satisfy 44px touch/keyboard targets');
  await page.locator('.mid-map-model-picker-option[data-model-id="ifs"]').click();
  assert.equal(await trigger.getAttribute('data-model-id'),'ifs',
   'Clicking the EU-flag option retains original model ID');
  assert.equal(await page.getByTestId('qa-model-choice').textContent(),'ifs');
  await trigger.press('ArrowDown');
  await page.locator('.mid-map-model-picker-option').first().waitFor();
  await page.keyboard.press('End');
  assert.equal(await options.last().evaluate(node=>document.activeElement===node),true,
   'Keyboard End focuses last listed source without changing selected model');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await options.last().evaluate(node=>document.activeElement===node),true,
   'Keyboard focus survives deferred portal autofocus after End');
  assert.equal(await trigger.getAttribute('data-model-id'),'ifs','End never selects a different weather model');
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'),'false',
   'Escape closes menu; selected value stays unchanged');
  assert.equal(await trigger.evaluate(node=>document.activeElement===node),true,
   'Escape restores keyboard focus to model trigger');
  await page.setViewportSize({width:320,height:640});
  await trigger.click();
  const geometry=await page.locator('.mid-map-model-picker-menu').evaluate(node=>({
   box:node.getBoundingClientRect().toJSON(),
   pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1
  }));
  assert.equal(geometry.pageOverflow,false,'Small mobile screens never overflow because of graphical popup');
  assert.ok(geometry.box.width>200&&geometry.box.right<=321,'Popup stays within 320px viewport');
  console.log('QA desktop 1440px SVG model flags and keyboard/mobile picker passed');
 }finally{await page.close()}
}

/** Actual CurrentSurroundings -> full MapWorkspacePanel -> RadarPanel handoff.
 * Exercises both MapLibre lifecycles and forwards the original geographic
 * bounds/time. This was previously completely untested by the map pilot.
 */
async function verifySurroundingsOpenMap(){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const pageErrors=[],consoleErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'&&!/favicon|ERR_CONNECTION_REFUSED/.test(message.text()))consoleErrors.push(message.text())});
 try{
  await page.route('**/__qa-worker?**',route=>route.fulfill({json:{error:'unavailable in deterministic QA'}}));
  await page.goto(base+'/__map-qa?surroundings-handoff');
  const open=page.getByRole('button',{name:'Karte öffnen'});
  await open.waitFor({timeout:30000});
  await page.locator('.current-surroundings-maplibre canvas').first().waitFor({timeout:30000});
  await open.click();
  await page.locator('.unified-weather-map').waitFor({timeout:30000});
  await page.locator('.composite-maplibre canvas').first().waitFor({timeout:30000});
  await page.waitForFunction(()=>{
   const map=window.__qaMap;
   if(!map||!map.getStyle())return false;
   const center=map.getCenter(),zoom=map.getZoom();
   return Number.isFinite(center.lat)&&Number.isFinite(center.lng)&&
    Number.isFinite(zoom)&&zoom>=0&&zoom<=14;
  },null,{timeout:20000});
  const request=await page.evaluate(()=>JSON.parse(document.body.dataset.surroundingsHandoff||'null'));
  assert.ok(request&&Number.isFinite(request.time)&&
   request.bounds.west<request.bounds.east&&request.bounds.south<request.bounds.north,
   'Open map handoff preserves finite original target and bounding rectangle');
  assert.deepEqual(pageErrors,[],'Current → Karten navigation must never throw in React/MapLibre');
  assert.equal(await page.locator('body').count(),1,'Navigation did not hard-reload or crash the app shell');
  console.log('QA real surroundings → unified map navigation passed (two independent MapLibre mounts)');
 }finally{await page.close()}
}

const focusedCases=process.env.GITHUB_ACTIONS!=='true'&&process.env.MID_MAP_QA_FOCUSED==='1'?[320,390,430,1024,1440].flatMap(width=>['light','dark'].map(theme=>({width,theme,design:'next'}))):null;
const assignedCases=seasonalDraftPilot?seasonalDraftKeys.map(key=>seasonalDraftAllowed.get(key)):focusedCases??mapBrowserCases(process.env.MID_MAP_QA_SHARD);
try{await verifyDesktopModelFlags();await verifySurroundingsOpenMap();await verifyHomeEndControlledSeek();for(const {width,theme,design} of assignedCases)if(design==='next'&&[320,390,430,834,844,1024,1440].includes(width))await verifySurroundings(width,theme);for(const width of [...new Set(assignedCases.map(row=>row.width))]){const variants=assignedCases.filter(row=>row.width===width),concurrency=mapBrowserCaseConcurrency(width);/* Bound synthetic MapLibre software-GPU contention; all cases and all assertions remain mandatory. */for(let offset=0;offset<variants.length;offset+=concurrency){const results=await Promise.allSettled(variants.slice(offset,offset+concurrency).map(({theme,design})=>verifyCase(width,theme,design)));for(const result of results)if(result.status==='rejected')throw result.reason;}}assert.equal(cases,assignedCases.length,'Complete assigned viewport/theme/design coverage');if(perfEnabled&&mapBrowserMemoryProbe(process.env.MID_MAP_QA_SHARD))await verifyCase(390,'light','next',true);if(perfRows.length){
 const rows=perfRows.sort((a,b)=>a.width-b.width||a.theme.localeCompare(b.theme)||a.design.localeCompare(b.design));
 const report={schema:'mid.map.runtime.fixture.v2',version:JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version,commit:process.env.GITHUB_SHA||null,shard:process.env.MID_MAP_QA_SHARD||'all',kind:'synthetic-Vite-MapLibre-fixture-not-user-CWV',cases:rows};
 const serialized=JSON.stringify(report),safeShard=String(report.shard).replace(/[^A-Za-z0-9_-]/g,'_');
 await writeFile('/tmp/mid-map-runtime-baseline-'+safeShard+'.json',serialized+'\n');
 console.log('MID_MAP_RUNTIME_BASELINE '+serialized);
 if(process.env.GITHUB_STEP_SUMMARY){
  for(const row of rows.filter(x=>x.memoryProfile)){const m=row.memoryProfile;await appendFile(process.env.GITHUB_STEP_SUMMARY,'\n### Isolierte Karten-Speicherprobe (kein Leak-Urteil)\n\n20 Modell-Rundwechsel nach zwei Warmups; GC vor H0/H5/H10/H15/H20. Heap-Delta '+m.heapDeltaBytes+' Bytes, DOM-Delta '+m.nodeDelta+', Listener-Delta '+m.listenerDelta+', Cycle-p95 '+m.cycleP95Ms+' ms. '+(m.tracePath?'Trace: '+m.tracePath:'Trace optional via MID_MAP_TRACE=1')+'\n');}
  const cols=rows.map(x=>'| '+x.caseKind+' | '+x.width+' | '+x.theme+' | '+x.design+' | '+x.readyMs+' | '+(x.frameP95Ms??'n/a')+' | '+x.longTasksOver200Ms+' | '+x.sampleFrames+' |').join('\n');
  await appendFile(process.env.GITHUB_STEP_SUMMARY,'\n### MID Map-Laufzeitprofil – synthetische Browser-Fixture (keine Nutzer-CWV)\n\n| Szenario | Breite | Theme | Design | Ready ms | Frame p95 ms | Long Tasks >200 ms | Frames |\n|---|---:|---|---|---:|---:|---:|---:|\n'+cols+'\n');
 }
}console.log(`${cases} real-map viewport/theme cases passed: one map, native raster validation, filtered model matrix, totals, reload persistence and no legacy fallback requests.`)}finally{await browser.close();await server.close()}
