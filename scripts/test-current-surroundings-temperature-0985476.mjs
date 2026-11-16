// #795: deterministic multi-place model temperatures independent of radar and phase.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import ts from 'typescript-strada';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [helper,component,css]=await Promise.all([read('src/currentSurroundingsTemperature.ts'),read('src/CurrentSurroundings.tsx'),read('src/CurrentSurroundings.css')]);
const compiled=ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(compiled.diagnostics?.length??0,0);
const exports={};
runInNewContext(compiled.outputText,{exports,Date,Math,Number,Array,Object,String,URL,fetch:()=>{throw Error('never invoked')}});
const {extractSurroundingsTemperatures:extract,surroundingsTemperatureUrl:makeUrl}=exports;
const at=Date.parse('2026-11-14T12:04:00Z'),valid=Date.parse('2026-11-14T12:00:00Z')/1000;
const places=[{id:'Dorf:50.0:7.0',lat:50,lon:7},{id:'Dorf:50.1:7.1',lat:50.1,lon:7.1},{id:'Dorf:50.2:7.2',lat:50.2,lon:7.2},{id:'Dorf:50.3:7.3',lat:50.3,lon:7.3}];
const row=(i,t)=>({latitude:places[i].lat,longitude:places[i].lon,utc_offset_seconds:0,hourly_units:{temperature_2m:'°C'},hourly:{time:[valid,valid+3600],temperature_2m:[t,t===null?null:t+1]}});
const rows=[row(0,0),row(1,-3.5),row(2,4.3),row(3,12.8)];
const u=new URL(makeUrl(places));
assert.equal(u.hostname,'api.open-meteo.com');
assert.equal(u.searchParams.get('hourly'),'temperature_2m');
assert.equal(u.searchParams.get('timeformat'),'unixtime');
assert.equal(u.searchParams.get('timezone'),'GMT');
assert.equal(u.searchParams.get('latitude')?.split(',').length,4);
assert.ok(Number(u.searchParams.get('forecast_hours'))<=4,'Bounded source horizon');
assert.ok(Number(u.searchParams.get('past_hours'))<=2,'Bounded retrospective horizon');
assert.equal(u.searchParams.has('models'),false,'Best Match is automatic, not a fabricated model');
const result=extract(rows,places,at,at);
assert.ok(result,'All four real neighboring locations must be admitted without any phase data');
assert.deepEqual(JSON.parse(JSON.stringify(result.values)),{'Dorf:50.0:7.0':0,'Dorf:50.1:7.1':-3.5,'Dorf:50.2:7.2':4.3,'Dorf:50.3:7.3':12.8});
assert.equal(result.available,4);
assert.equal(result.validTime,valid*1000);
assert.equal(result.modelLabel,'Best Match');
assert.equal(result.source,'Open-Meteo');
assert.ok(!Object.hasOwn(result,'runTime'),'Unknown per-cell model run must remain unasserted');
const missing=rows.map((r,i)=>i===1?row(i,null):r);
assert.equal(extract(missing,places,at)?.available,3,'Null is missing, not 0');
const outside=rows.map((r,i)=>i===1?{...r,latitude:55}:r);
assert.equal(extract(outside,places,at)?.available,3,'Foreign grid point must be excluded');
const stale=rows.map((r,i)=>i===1?{...r,hourly:{time:[valid-7200],temperature_2m:[3]}}:r);
assert.equal(extract(stale,places,at)?.available,3,'Stale time must not mix with fresh values');
assert.equal(extract(rows.slice(0,3),places,at),undefined,'Partial multi-point response is not a valid inventory');
assert.equal(extract(rows.map(r=>({...r,utc_offset_seconds:3600})),places,at),undefined,'Mismatched timezone is not UTC');
assert.equal(extract(rows.map(r=>({...r,hourly_units:{temperature_2m:'°F'}})),places,at),undefined,'Wrong unit is not Celsius');
assert.equal(extract(rows.map(r=>({...r,hourly:{time:[valid],temperature_2m:[null]}})),places,at),undefined,'All missing remains NoData');
assert.equal(extract(rows.map(r=>({...r,hourly:{time:[valid],temperature_2m:[NaN]}})),places,at),undefined,'NaN is missing');
assert.equal(extract(rows.map(r=>({...r,hourly:{time:[valid],temperature_2m:[300]}})),places,at),undefined,'Physically impossible Celsius value rejected');
assert.equal(makeUrl([]),undefined,'No zero-coordinate request');
assert.equal(makeUrl([...places,...places]),undefined,'Max five request coordinates');
assert.ok(!component.includes('grid.phaseSourceByCell')&&!component.includes('grid.phaseValidTimeByCell'),'Temperature must never rely on precipitation-phase provenance');
assert.ok(component.includes('loadSurroundingsTemperatures(temperaturePlaces')&&component.includes('...nearbyCities,{id:siteId,lat,lon}'),'Only real neighboring cities and the actual selected place receive independent temperature requests');
assert.ok(component.includes('chooseSurroundingsCities'),'Named cities are chosen by geographic priority');
assert.ok(!component.includes('temperaturePoints=['),'No synthetic four-corner sampling');
assert.ok(!component.includes('current-surroundings-orientation')&&!component.includes('orientation.paths'),'Simplified separate boundaries removed');
assert.ok(component.includes('<UnifiedVectorBasemap dark={darkMap}'),'Use exact MID vector land and water');
assert.ok(component.includes('<MidMapLibre center={[lat,lon]}')&&component.includes('interactive={false} navigationControl={false}'),'The neighborhood map is a compact static preview without misleading zoom controls');
assert.ok(component.includes('<VectorReferenceLayer url={referenceTileUrl}')&&component.includes('glyphsUrl={referenceGlyphsUrl}'),'Use MID border, city, waterway and road styling');
assert.ok(component.includes('referenceTileUrl=openFreeMapVectorTileProxy()')&&component.includes('referenceGlyphsUrl=openFreeMapGlyphProxy()'),'Reference layers must use the same proxied vector/glyph source as the MID basemap');
assert.ok(component.includes("directVectorAllowed?DIRECT_VECTOR_TILES:''")&&component.includes("directVectorAllowed?DIRECT_VECTOR_GLYPHS:''"),'No direct external basemap requests when browser fallback is disallowed');
assert.ok(component.includes('ResizeObserver(update)')&&component.includes('mapViewport?chooseSurroundingsCities'),'Selection must use measured viewport dimensions, not a hardcoded desktop raster');
assert.ok(component.includes('<ImageQuadLayer id="surroundings-radar"'),'Radar stays georeferenced');
assert.ok(component.includes('nearbyCities.map((place,index)=>'),'Temperatures bind to ranked named settlements');
assert.ok(component.includes('current-surroundings-city-marker'),'Use MapLibre HTML markers');
assert.ok(css.includes('.current-surroundings-city-value'),'Readable city labels');
assert.ok(!component.includes('<b>${mapSafe(place.name)}</b>')&&!css.includes('.current-surroundings-city-value b{'),'City names are rendered ONCE by the vector basemap, never duplicated by value markers');
assert.ok(!css.includes('.current-surroundings-orientation'),'No parallel SVG border renderer');
assert.ok(component.includes("useSurroundingsCloudImage(mode==='cloud'"),'Verifiziertes Modellbild ist Standard ohne teuren Radardaten-Kaltstart.');
assert.ok(component.includes("if(mode!=='radar')return")&&component.includes("mode==='radar'&&radarAtNow"),'DWD-/Satelliten-/OPERA-Beobachtungen nur nach Nutzerwahl laden.');
assert.ok(component.includes('id="surroundings-model-cloud-weather"')&&component.includes('cloudForecast.image.bounds'),'Wolken/SigWx müssen das geprüfte Modellraster georeferenziert nutzen.');
assert.ok(component.includes("ecmwfTemperatureColor(value)")&&component.includes("ecmwfTemperatureColor(displaySiteTemperature!)"),'Temperaturzahlen und Standort verwenden dieselbe ECMWF-MID-Skala.');
assert.ok(css.includes('background:transparent!important;box-shadow:none!important')&&css.includes('.current-surroundings-center-dot>strong')&&css.includes('-webkit-text-stroke:1.15px'),'High-contrast ECMWF-colored temperature numerals require no opaque background plates.');
const cloudSource=await read('src/currentSurroundingsCloudImage.ts');
assert.ok(cloudSource.includes('loadEstablishedSynopticIndex(signal)')&&cloudSource.includes('loadNativeIndex(signal)')&&cloudSource.includes('nativeCloudWeatherPair('),'Nur die originalen, SHA-validierten MID-Wolken-/SigWx-Daten verwenden.');
assert.ok(cloudSource.includes("cloudWeatherRaster(data,'pseudo')")&&cloudSource.includes('admissibleSurroundingsCloudTime'),'Kein Fake-Satellitenbild und keine ungebundene Modellzeit.');
assert.ok(cloudSource.includes('setResult(previous=>previous.image&&Date.parse(previous.image.validTime)===target&&admissibleSurroundingsCloudTime('),'Still-valid model images must remain visible until replacement or expiry.');
assert.ok(component.includes("cloudForecast.unavailable&&<small>"),'Failed model update must be visibly declared.');
assert.ok(component.includes("(mode==='cloud'||radarAtNow)&&Number.isFinite(temperature)")&&component.includes('forecastSiteTemperature'),'Present observed/MID site value cannot masquerade as a future model value');
const compiledCloud=ts.transpileModule(cloudSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(compiledCloud.diagnostics?.length??0,0);
const cloudExports={};
runInNewContext(compiledCloud.outputText,{exports:cloudExports,require:()=>({}),Date,Number,Math,Array,Object,String,JSON,Set},{timeout:1000});
const {admissibleSurroundingsCloudTime:validCloudTime,chooseSurroundingsCloudFrame:chooseCloud}=cloudExports;
const modelNow=Date.parse('2026-11-14T20:00:00Z'),modelRun=new Date(modelNow-3600000).toISOString(),modelTime=new Date(modelNow).toISOString();
const modelRef={hour:1,time:modelTime,file:'icon-d2-cw-001.bin',sha256:'a'.repeat(64),bytes:123,decodedBytes:321,encoding:'gzip-json'};
const modelCatalog={'icon-d2':{label:'DWD ICON-D2',run:modelRun,frames:[],cloudWeatherFrames:[modelRef]}};
assert.equal(validCloudTime(modelTime,modelRun,modelNow),true);
assert.equal(chooseCloud(modelCatalog,modelNow)?.modelId,'icon-d2');
assert.equal(chooseCloud(modelCatalog,modelNow)?.ref.time,modelTime);
assert.equal(validCloudTime(new Date(modelNow+4*3600000).toISOString(),modelRun,modelNow),false,'Future SigWx may not masquerade as current weather.');
assert.equal(validCloudTime(modelTime,new Date(modelNow-25*3600000).toISOString(),modelNow),false,'Retired model run is not current.');
assert.equal(validCloudTime('not-a-date',modelRun,modelNow),false);
assert.equal(chooseCloud({},modelNow),null,'No proven model frame is unknown, never clear sky.');

const {chooseSurroundingsCloudFrames:chooseCloudFrames}=cloudExports;
const euCatalog={...modelCatalog,'icon-eu':{...modelCatalog['icon-d2'],label:'DWD ICON-EU',cloudWeatherFrames:[{...modelRef,file:'icon-eu-cw-001.bin'}]}};
assert.equal(chooseCloudFrames(euCatalog,modelNow).map(item=>item.modelId).join(','),'icon-d2,icon-eu','A valid second model must remain available, not be discarded by priority');
assert.ok(cloudSource.includes('for(const selected of chooseSurroundingsCloudFrames(index.models,now))'),'After invalid regional coverage the loader must try the next verified model');
const accessedModels=[];
let attemptedNativeFallback=0;
const mockedModule={};
const outsideD2={model:'icon-d2',run:modelRun,time:modelTime,lats:[48,49],lons:[5,6],cloud:[50,50,50,50],weather:[null,null,null,null]};
const insideEu={model:'icon-eu',run:modelRun,time:modelTime,lats:[40,50],lons:[10,30],cloud:[50,50,50,50],weather:[null,null,null,null]};
runInNewContext(compiledCloud.outputText,{
 exports:mockedModule,
 require:(id)=>{
  if(id==='./cloudWeatherData')return {
   loadCloudWeatherField:async(_base,modelId)=>{accessedModels.push(modelId);return modelId==='icon-d2'?outsideD2:insideEu},
   cloudWeatherRaster:()=> 'data:image/png;base64,verified-mock'
  };
  if(id==='./nativeSynopticFields')return {loadEstablishedSynopticIndex:async()=>({index:{models:euCatalog},base:'https://example.invalid/'})};
  if(id==='./nativeModelFields')return {loadNativeIndex:async()=>{attemptedNativeFallback++;throw Error('Unnecessary native fallback')}};
  return {};
 },
 Date,Number,Math,Array,Object,String,JSON,Set,Error,Promise
},{timeout:1000});
const euImage=await mockedModule.loadVerifiedSurroundingsCloud(45,20,modelNow,{aborted:false});
assert.equal(euImage.model,'DWD ICON-EU','The out-of-ICON-D2 location must use the valid EU field');
assert.equal(accessedModels.join(','),'icon-d2,icon-eu','Only confirmed SHA-bound fields may be retried in declared priority order');
assert.equal(attemptedNativeFallback,0,'Do not discard an available EU field in favor of a D2-only fallback');

// MID Karten 1.7: the 15-minute selector snaps to real UTC validity slots.
const quarterModule={};
const quarterSource=await read('src/surroundingsQuarterHour.ts');
const quarterTranspiled=ts.transpileModule(quarterSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(quarterTranspiled.diagnostics?.length??0,0);
runInNewContext(quarterTranspiled.outputText,{exports:quarterModule,Math,Number});
const targetQuarter=quarterModule.surroundingsQuarterHourTarget;
const utcAt=Date.parse('2026-11-14T12:04:43.721Z');
assert.equal(targetQuarter(utcAt,0),Date.parse('2026-11-14T12:00:00Z'));
assert.equal(targetQuarter(utcAt,1),Date.parse('2026-11-14T12:15:00Z'));
assert.equal(targetQuarter(utcAt,8),Date.parse('2026-11-14T14:00:00Z'));
assert.equal(targetQuarter(utcAt,9),Date.parse('2026-11-14T14:15:00Z'));
const justBeforeQuarter=Date.parse('2026-11-14T12:14:59.999Z');
assert.ok(targetQuarter(justBeforeQuarter,9)-justBeforeQuarter>=120*60000,
 'The last 15-minute model target must cover at least two hours from now, even seconds before a slot boundary');
assert.equal(targetQuarter(Date.parse('2026-10-25T01:59:30Z'),1),Date.parse('2026-10-25T02:00:00Z'),'DST cannot produce a local-only model slot');
assert.ok(Number.isNaN(targetQuarter(NaN,1))&&Number.isNaN(targetQuarter(utcAt,-1))&&Number.isNaN(targetQuarter(utcAt,10)));
assert.ok(component.includes('const cloudTarget=surroundingsQuarterHourTarget(now,cloudStep)')&&component.includes("const temperatureTarget=mode==='cloud'?cloudTarget"),
 'Map, temperatures and clouds share one quarter-hour target');
assert.ok(component.includes("mode==='cloud'?cloudTarget:mode==='radar'?displayTime:undefined"),
 'Main-map handoff uses the exact selected forecast time, even at step 0');
assert.ok(!component.includes('const cloudTarget=now+cloudStep*15*60000'),'No invented 12:19 model target');
assert.ok(!makeUrl(places).includes('minutely_15'),'ICON-D2 T2M must not be mislabeled as native when Open-Meteo interpolates');
const exactHourly=extract(rows,places,valid*1000,at,true);
assert.equal(exactHourly?.temporalMethod,'original','Exact hourly originals always win over computed subhourly values');
assert.ok(!Object.hasOwn(exactHourly??{},'sourceTimes'),'No interpolation provenance on an original');

const originalReads=[];
const makeCloudOriginalTester=(models,reads)=>{
 const mock={};
 runInNewContext(compiledCloud.outputText,{
  exports:mock,
  require:id=>{
   if(id==='./cloudWeatherData')return {
    loadCloudWeatherField:async(_base,modelId,_model,ref)=>{
     reads.push(`${modelId}:${ref.time}`);
     return {...insideEu,model:modelId,run:modelRun,time:ref.time};
    },
    cloudWeatherRaster:()=> 'data:image/png;base64,verified-original'
   };
   if(id==='./nativeSynopticFields')return {loadEstablishedSynopticIndex:async()=>({index:{models},base:'https://example.invalid/'})};
   if(id==='./nativeModelFields')return {loadNativeIndex:async()=>{throw Error('Valid exact field must not fall back')}};
   return {};
  },Date,Number,Math,Array,Object,String,JSON,Set,Error,Promise
 },{timeout:1000});
 return mock;
};
const prevRef={...modelRef,time:new Date(modelNow-3600000).toISOString()};
const nextRef={...modelRef,time:new Date(modelNow+3600000).toISOString()};
const exactCatalog={'icon-d2':{...modelCatalog['icon-d2'],cloudWeatherFrames:[prevRef,modelRef,nextRef]}};
const exactSource=makeCloudOriginalTester(exactCatalog,originalReads);
const exactImage=await exactSource.loadVerifiedSurroundingsCloud(45,20,modelNow,{aborted:false});
assert.equal(exactImage.temporalMethod,'original');
assert.equal(exactImage.validTime,modelTime);
assert.equal(originalReads.join(','),`icon-d2:${modelTime}`,'Exact original reads only one frame, not its neighbors');
const secondaryReads=[];
const secondaryCatalog={
 'icon-d2':{...modelCatalog['icon-d2'],cloudWeatherFrames:[prevRef,nextRef]},
 'icon-eu':{...modelCatalog['icon-d2'],label:'DWD ICON-EU',cloudWeatherFrames:[modelRef]}
};
assert.equal(chooseCloudFrames(secondaryCatalog,modelNow)[0]?.modelId,'icon-eu','Exact original in a second verified model outranks a D2 interpolation');
const secondarySource=makeCloudOriginalTester(secondaryCatalog,secondaryReads);
const secondaryImage=await secondarySource.loadVerifiedSurroundingsCloud(45,20,modelNow,{aborted:false});
assert.equal(secondaryImage.model,'DWD ICON-EU');
assert.equal(secondaryImage.temporalMethod,'original');
assert.equal(secondaryReads.join(','),`icon-eu:${modelTime}`,'Do not download two D2 hours when exact EU exists');


assert.equal(chooseCloud({'icon-d2':{...modelCatalog['icon-d2'],cloudWeatherFrames:[{...modelRef,time:new Date(modelNow+5*3600000).toISOString()}]}},modelNow),null,'Wrong forecast validity never renders as actual weather.');

// .481: Nine reachable 15-minute targets, genuine source-time labeling, no eager radar.
// Dates are derived from one absolute target; no unverified 15-minute WMO observations.
assert.ok(component.includes('const [cloudStep,setCloudStep]=useState(0)')&&component.includes('const cloudTarget=surroundingsQuarterHourTarget(now,cloudStep)'),'Cloud timeline has bounded 15-minute positions');
assert.ok(component.includes('min={0} max={9} step={1}')&&component.includes('Wolkenprognose 15 Minuten vor')&&component.includes('Wolkenprognose 15 Minuten zurück'),'Real accessible quarter-hour control covering at least +120 min');
assert.ok(component.includes('Original-Modelltermin ohne zeitliche Interpolation')&&
 component.includes('cloudForecast.image.validTime')&&
 component.includes('Kein gültiges Wolken-/SigWx-Modellbild für Ort und Termin')&&
 cloudSource.includes('Date.parse(ref.time)===now&&weatherRefs.some'),
 'Original-only cloud/SigWx display must label exact source validity and leave unmatched quarter-hours NoData');
assert.ok(component.includes("useDisplayPreference('CurrentSurroundings.mode','cloud',displayChoice('cloud','radar'))")&&
 component.includes("aria-pressed={mode==='cloud'}")&&component.includes("aria-pressed={mode==='radar'}")&&
 component.includes('radarOriginalForStep(catalog,now,radarStep,dwdArea)')&&
 component.includes('onChange={event=>setRadarStep(')&&component.includes("if(mode!=='radar')return"),
 'Persist cloud/radar mode; native radar 15-minute slider must not start observations while cloud mode is selected');
assert.ok(css.includes('current-surroundings-cloud-timeline')&&css.includes('min-height:44px')&&css.includes('grid-column:1/-1'),'Mobile timeline keeps the clock readable and touch targets accessible');
const quarter=valid*1000+15*60000;
const interpolated=extract(rows,places,quarter,at,true);
assert.ok(interpolated&&interpolated.temporalMethod==='linear');
assert.equal(interpolated.validTime,quarter);
assert.deepEqual(JSON.parse(JSON.stringify(interpolated.values)),{'Dorf:50.0:7.0':0.3,'Dorf:50.1:7.1':-3.2,'Dorf:50.2:7.2':4.6,'Dorf:50.3:7.3':13.1});
assert.deepEqual(JSON.parse(JSON.stringify(interpolated.sourceTimes)),[valid*1000,(valid+3600)*1000]);
assert.equal(extract(rows.map((r,i)=>i===0?{...r,hourly:{time:[valid,valid+3600],temperature_2m:[null,1]}}:r),places,quarter,at,true)?.available,3,'Absent original cloud/temperature endpoint is never silently 0');
const jumpRows=rows.map((r,i)=>i===0?{...r,hourly:{time:[valid,valid+3600],temperature_2m:[-5,20]}}:r);
assert.equal(extract(jumpRows,places,quarter,at,true)?.available,3,'A 25 C/h jump is not smoothed into a manufactured quarter-hour value');

// Legacy standalone interpolation utility is tested for other supported workflows, but the surroundings loader must never call it.
const blendCloud=cloudExports.interpolateVerifiedSurroundingsCloud;
const mkCloud=(time,cloud,weather,run=modelRun,model='icon-d2')=>({model,run,time,lats:[49,50],lons:[7,8],cloud,weather});
const originalA=mkCloud(new Date(modelNow).toISOString(),[20,null,10,90],[61,61,95,null]);
const originalB=mkCloud(new Date(modelNow+3600000).toISOString(),[40,80,90,10],[61,61,0,null]);
const quarterCloud=blendCloud(originalA,originalB,modelNow+15*60000);
assert.ok(quarterCloud&&quarterCloud.time===new Date(modelNow+15*60000).toISOString());
assert.equal(quarterCloud.cloud[0],25,'Gradual cloud coverage may be interpolated');
assert.equal(quarterCloud.cloud[1],null,'Unknown cloud stays unknown');
assert.equal(quarterCloud.cloud[2],10,'80 percentage-point abrupt cloud boundary stays on original, never smoothed');
assert.equal(quarterCloud.cloud[3],90,'Abrupt change without WMO code is not smoothed');
assert.equal(quarterCloud.weather[2],95,'Discrete thunderstorm WMO 4677 code remains from the nearest original');
assert.equal(blendCloud(originalA,{...originalB,run:new Date(modelNow+7200000).toISOString()},modelNow+15*60000),null,'Different run is not a blend');
assert.equal(blendCloud(originalA,{...originalB,model:'icon-eu'},modelNow+15*60000),null,'Different source model is not a blend');
assert.equal(blendCloud(originalA,{...originalB,lats:[49,50.1]},modelNow+15*60000),null,'Different grids are not blended');
assert.equal(blendCloud(originalA,{...originalB,time:new Date(modelNow+2*3600000).toISOString()},modelNow+15*60000),null,'No interpolation over a >1h gap');

const citySource=await read('src/surroundingsCitySelection.ts');
const cityJs=ts.transpileModule(citySource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(cityJs.diagnostics?.length??0,0);
const cityExports={};
runInNewContext(cityJs.outputText,{exports:cityExports,Math,Number,Array,Object,String,Set,JSON},{timeout:1000});
const choose=cityExports.chooseSurroundingsCities,fromTiles=cityExports.citiesFromMapFeatures;
const bounds={west:5.66,east:8.46,south:50.15,north:51.45},center={lat:50.8,lon:7.06};
const cities=[
 {name:'Köln',lat:50.932,lon:6.948,population:1004000,origin:'natural-earth'},
 {name:'Bonn',lat:50.7205,lon:7.08,population:680543,origin:'natural-earth'},
 {name:'Düsseldorf',lat:51.2204,lon:6.78,population:1220000,origin:'natural-earth'},
 {name:'Koblenz',lat:50.3505,lon:7.6,population:312633,origin:'natural-earth'},
 {name:'Off-grid',lat:10,lon:10,population:1}
];
const chosen=choose(cities,center,bounds);
assert.ok(chosen.length>=2&&chosen.length<=4,'Selected named region should retain several genuine cities');
assert.ok(chosen.every(item=>cities.some(original=>original.name===item.name&&original.lat===item.lat&&original.lon===item.lon)));
assert.equal(choose([],center,bounds).length,0,'Missing cities are never reconstructed from raster corners');
assert.equal(choose(cities,center,{west:8,east:5,south:50,north:51}).length,0,'Invalid bounds fail closed');
const compact=choose(cities,center,bounds,4,{width:280,height:220});
assert.ok(compact.length>=1&&compact.length<=chosen.length,'Mobile layout reduces colliding labels without fabricating extra cities');
assert.equal(choose(cities,center,bounds,4,{width:150,height:120}).length,0,'Too narrow for a legible city plate is NoData rather than overlapping labels');
// Deterministic layout QA complements (but does not replace) real browser screenshot checks.
const mercator=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI;
for(const [width,height] of [[320,220],[390,235],[430,260],[834,285]]){
 const selected=choose(cities,center,bounds,4,{width,height});
 const top=mercator(bounds.north),bottom=mercator(bounds.south);
 const scale=Math.min((width-16)/(bounds.east-bounds.west),(height-16)/(top-bottom));
 const offsetX=(width-(bounds.east-bounds.west)*scale)/2,offsetY=(height-(top-bottom)*scale)/2;
 const projected=selected.map(city=>({
  x:offsetX+(city.lon-bounds.west)*scale,
  y:offsetY+(top-mercator(city.lat))*scale
 }));
 assert.ok(projected.length>=1&&projected.length<=4,`Georeferenced cities available at ${width}px`);
 for(const point of projected){
  assert.ok(point.x>=Math.min(70,width*.25)&&point.x<=width-Math.min(70,width*.25),`Label clipping horizontally at ${width}px`);
  assert.ok(point.y>=24&&point.y<=height-24,`Label clipping vertically at ${width}px`);
 }
 for(let i=0;i<projected.length;i++)for(let j=i+1;j<projected.length;j++){
  assert.ok(Math.abs(projected[i].x-projected[j].x)>=140||Math.abs(projected[i].y-projected[j].y)>=52,`Colliding city labels at ${width}px`);
 }
}
const nearDuplicates=[
 {name:'A',lat:50.97,lon:6.80,population:450000,origin:'natural-earth'},
 {name:'B',lat:50.972,lon:6.81,population:400000,origin:'natural-earth'}
];
assert.equal(choose(nearDuplicates,center,bounds,4,{width:280,height:200}).length,1,'Nearly coincident city labels cannot overlap on phones');
const vector=fromTiles([
 {geometry:{type:'Point',coordinates:[11,47.1]},properties:{class:'town',name:'Ötztal',rank:7}},
 {geometry:{type:'Point',coordinates:[11,47.1]},properties:{class:'town',name:'Ötztal',rank:7}},
 {geometry:{type:'Point',coordinates:[11.1,47.1]},properties:{class:'hamlet',name:'Not a city'}}
]);
assert.equal(vector.length,1,'Duplicated vector tile features cannot become duplicate map labels');
assert.equal(choose(vector,{lat:46.97,lon:11},{west:9.6,east:12.4,south:46.32,north:47.62})[0]?.name,'Ötztal');
assert.ok(component.includes('<MapFitBounds south={south} west={west} north={north} east={east} padding={8} maxZoom={7}/>'),'MapLibre fitBounds must provide a finite maxZoom to prevent an invalid NaN camera');

// MID-Karten 1.7: same PseudoSat/SigWx canvas as the canonical map, compact source truth and 15-min fallback.
const sharedMapCloud=await read('src/CloudSignificantWeather.tsx');
assert.ok(sharedMapCloud.includes('cloudWeatherRaster(data,mode)')&&cloudSource.includes("cloudWeatherRaster(data,'pseudo')"),
 'Detail map and surroundings must consume the same canonical cloud/SigWx renderer.');
assert.ok(sharedMapCloud.includes('resampling="nearest"')&&component.includes('resampling="nearest" zIndex={270}'),
 'No visually different interpolation filter between model map and surroundings image.');
const statusStart=component.indexOf('<div role="status" aria-live="polite" className="current-surroundings-data-status">');
const statusEnd=component.indexOf('<details className="current-surroundings-sources">',statusStart);
assert.ok(statusStart>=0&&statusEnd>statusStart,'One compact, live-annotated weather-image status must exist.');
const shortStatus=component.slice(statusStart,statusEnd);
assert.ok(shortStatus.includes('PseudoSat + SigWx')&&shortStatus.includes('Gültig ')&&shortStatus.includes('INIT ')&&shortStatus.includes('keine Beobachtung'),
 'Compact status identifies model image, source validity, initialization and non-observation.');
assert.ok(!shortStatus.includes('Wolken aus Originalterminen')&&!shortStatus.includes('Bildtermin'),
 'Detailed temporal algorithm and duplicate image terminology must not flood the compact status.');
assert.ok(!component.includes("cloudForecast.image.temporalMethod==='cloud-linear'")&&
 cloudSource.includes('if(Date.parse(ref.time)!==now)continue;')&&
 !cloudSource.slice(cloudSource.indexOf('export async function loadVerifiedSurroundingsCloud('),cloudSource.indexOf('export function useSurroundingsCloudImage(')).includes('interpolateVerifiedSurroundingsCloud('),
 'Surroundings no longer invents cloud/WW 15-minute frames from hourly neighbors; only exact source times are admitted.');
assert.ok(shortStatus.includes('Math.abs(Date.parse(cloudForecast.image.validTime)-cloudTarget)>90*1000'),
 'A stale/original image may never masquerade as the selected future 15-min target.');
assert.ok(shortStatus.includes('cloudForecast.loading&&<small>')&&shortStatus.includes('cloudForecast.unavailable&&<small>'),
 'Refresh/failure states remain explicit without blanking the verified prior frame.');
assert.ok(css.includes('.current-surroundings-data-status>strong')&&css.includes('overflow-wrap:anywhere'),
 '320px and Dynamic Type must wrap compact metadata without obstructing the map.');

// Native IR10.8 source must remain offline/read-only until an independently calibrated
// channel identity and real GRIB/bitmap/georeferencing evidence exist.
const irFixtureResult=execFileSync('python3',[
 '-m','unittest','discover','-s','tools/ruc','-p','test_ir108_*.py'
],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',timeout:15000});
assert.equal(typeof irFixtureResult,'string');
console.log('MID: native IR10.8 spectral/bitmap, ten-frame UTC cadence and bounded original-staging offline QA passed.');

// Same-run, original-time, native-grid 15-minute GSP rates (rain/snow/graupel).
// This is metadata/bitmap shadow QA only, never a synthetic WMO 4677 WW code.
const phaseOriginalFixtureResult=execFileSync('python3',[
 '-m','unittest','discover','-s','tools/ruc','-p','test_original_15min_phase_gate.py'
],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',timeout:15000});
assert.equal(typeof phaseOriginalFixtureResult,'string');
console.log('MID: original 15-min IR/GSP phase-rate SHA, grid, valid-time and NoData SHADOW QA passed.');
const gspStagingFixtures=execFileSync('python3',[
 '-m','unittest','discover','-s','tools/ruc','-p','test_stage_original_15min_gsp.py'
],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',timeout:15000});
assert.equal(typeof gspStagingFixtures,'string');
console.log('MID: 3x10 original DWD GSP bounded staging, manifest SHA256 and atomic failure offline QA passed.');

const nativePreviewFixtures=execFileSync('python3',[
 '-m','unittest','discover','-s','tools/ruc','-p','test_ir108_gsp_native_preview.py'
],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',timeout:15000});
assert.equal(typeof nativePreviewFixtures,'string');
console.log('MID: original IR10.8+GSP SHA-bound native RUC pixel lookup, PNG/NoData and private preview SHADOW QA passed.');




console.log('MID: georeferenced city temperatures, shared basemap and NoData/pixel-collision contracts passed.');
