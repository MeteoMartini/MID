// #795: deterministic multi-place model temperatures independent of radar and phase.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
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
assert.ok(Number(u.searchParams.get('forecast_hours'))<=3,'Bounded source horizon');
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
assert.ok(component.includes('loadSurroundingsTemperatures(nearbyCities'),'Only named settlements may receive temperature requests');
assert.ok(component.includes('chooseSurroundingsCities'),'Named cities are chosen by geographic priority');
assert.ok(!component.includes('temperaturePoints=['),'No synthetic four-corner sampling');
assert.ok(!component.includes('current-surroundings-orientation')&&!component.includes('orientation.paths'),'Simplified separate boundaries removed');
assert.ok(component.includes('<UnifiedVectorBasemap dark={darkMap}'),'Use exact MID vector land and water');
assert.ok(component.includes('<VectorReferenceLayer url={MID_REFERENCE_TILES}'),'Use MID border, city, waterway and road styling');
assert.ok(component.includes('<ImageQuadLayer id="surroundings-radar"'),'Radar stays georeferenced');
assert.ok(component.includes('nearbyCities.map((place,index)=>'),'Temperatures bind to ranked named settlements');
assert.ok(component.includes('current-surroundings-city-marker'),'Use MapLibre HTML markers');
assert.ok(css.includes('.current-surroundings-city-value'),'Readable city labels');
assert.ok(!css.includes('.current-surroundings-orientation'),'No parallel SVG border renderer');
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
const vector=fromTiles([
 {geometry:{type:'Point',coordinates:[11,47.1]},properties:{class:'town',name:'Ötztal',rank:7}},
 {geometry:{type:'Point',coordinates:[11,47.1]},properties:{class:'town',name:'Ötztal',rank:7}},
 {geometry:{type:'Point',coordinates:[11.1,47.1]},properties:{class:'hamlet',name:'Not a city'}}
]);
assert.equal(vector.length,1,'Duplicated vector tile features cannot become duplicate map labels');
assert.equal(choose(vector,{lat:46.97,lon:11},{west:9.6,east:12.4,south:46.32,north:47.62})[0]?.name,'Ötztal');
console.log('MID: georeferenced city temperatures, shared basemap and NoData/pixel-collision contracts passed.');
