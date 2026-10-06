import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync('src/mountainSports.ts','utf8'),requests=[],time=new Date().toISOString().slice(0,13)+':00';
const context={URLSearchParams,utciFromOutdoorState:()=>undefined,fetchWorkerJson:async()=>{throw Error('offline')},guardedOpenMeteoJson:async()=>{throw Error('offline')},guardedOpenMeteoFetch:async url=>{
 const q=new URL(url).searchParams;requests.push(q);const lat=q.get('latitude').split(','),lon=q.get('longitude').split(','),elev=q.get('elevation').split(',');
 return{ok:true,json:async()=>lat.map((v,i)=>({latitude:Number(v),longitude:Number(lon[i]),elevation:elev[0]==='nan'?400:Number(elev[i]),timezone:'UTC',utc_offset_seconds:0,current:{},hourly:{time:[time],freezing_level_height:[3000],snowfall_height:[2400],temperature_850hPa:[5],geopotential_height_850hPa:[1500]}}))};
}};
vm.createContext(context);vm.runInContext(stripTypeScriptTypes(source.replace(/^import .*;?$/gm,'').replace(/export /g,'')),context);
for(const missing of [null,undefined,'']){
 assert.ok(Number.isNaN(context.dwdSnowfallLimit({temperature850:missing,geopotentialHeight850:missing,freezingLevelHeight:missing})));
 assert.equal(context.dwdSnowfallLimit({temperature850:missing,geopotentialHeight850:1500,freezingLevelHeight:3000}),3000-2/.0065);
}
assert.equal(context.preferredSnowfallLimit({snowfallHeight:0,freezingLevelHeight:3000}),0);
const loc={latitude:46.969,longitude:11.01,country_code:'AT'},config={...context.defaultMountainConfig(loc),valleyElevation:1352,middleEnabled:true,middleElevation:2081,summitElevation:3340,valleyLatitude:null,valleyLongitude:null,middleLatitude:46.969,middleLongitude:11.01,summitLatitude:46.969,summitLongitude:11.01};
const points=context.configuredPoints(loc,config);assert.ok(points.every(p=>p.latitude===loc.latitude&&p.longitude===loc.longitude));
assert.equal(context.configuredPoints(loc,{...config,summitLatitude:47.01})[2].latitude,47.01,'Real horizontal coordinates must not be collapsed into an artificial common column');
const result=await context.mountainSportsForecast(loc,config);
await new Promise(resolve=>setImmediate(resolve));
assert.ok(requests.length>=3);
assert.ok(requests.every(q=>q.get('cell_selection')==='nearest'),'Surface, regional and atmospheric diagnostics must not switch grid cells with selected elevation');
assert.ok(requests.some(q=>q.get('elevation')==='1352,2081,3340'),'Surface downscaling must retain actual selected station elevations');
assert.ok(requests.some(q=>q.get('elevation')==='nan'),'Free atmospheric diagnostics must expose the model terrain, not selected summit terrain');
assert.ok(result.levels.every(l=>l.weather.hourly.freezing_level_height[0]===3000));
const merged=context.mergeMountainDiagnostics(result.levels[0].weather,{elevation:400,hourly:{time:[time],temperature_850hPa:[5]}});assert.equal(merged.columnElevation,400);
const app=fs.readFileSync('src/MountainWeather.tsx','utf8'),cloudFunctions=app.slice(app.indexOf('function mountainCloudLayerAssessment('),app.indexOf('\nfunction mountainVisibilityAssessment(')),baseFunction=app.slice(app.indexOf('function cloudBase('),app.indexOf('\n',app.indexOf('function cloudBase(')));
const pressures=[1000,950,925,900,850,800,700,600],heights=[200,800,1200,1600,2200,3000,4200,5000],covers=[100,90,90,0,0,0,90,90],hourly={cloud_cover:[100],cloud_cover_low:[100]};
pressures.forEach((p,i)=>{hourly[`geopotential_height_${p}hPa`]=[heights[i]];hourly[`cloud_cover_${p}hPa`]=[covers[i]]});
const c={MOUNTAIN_CLOUD_PROFILE_LEVELS:pressures,mountainHourlyValue:(l,k,i)=>l.weather.hourly[k]?.[i]??NaN};vm.createContext(c);vm.runInContext(stripTypeScriptTypes(baseFunction+'\n'+cloudFunctions),c);
const assessment=elevation=>c.mountainCloudLayerAssessment({elevation,weather:{columnElevation:400,hourly}},0,5,4);
const a=[600,1800,3200,4700].map(assessment);
assert.ok(a.every(v=>v.lowestBase===600),'Lowest cloud base must not be clipped at the selected station elevation');
assert.equal(a[0].inCloud,true);assert.equal(a[2].inCloud,false);assert.equal(a[3].inCloud,true,'Distinct higher cloud layers still affect local safety');
const missing=c.mountainCloudLayerAssessment({elevation:3340,weather:{hourly:{}}},0,5,4);assert.ok(Number.isNaN(missing.lowestBase));assert.equal(missing.source,'thermodynamic');
const unknownTerrain=c.mountainCloudLayerAssessment({elevation:3340,weather:{hourly}},0,5,4);assert.ok(Number.isNaN(unknownTerrain.lowestBase),'Unknown model terrain must not create an underground cloud base');
assert.ok(app.includes('Lokales Kondensationsniveau (NHN)'));
for(const file of ['src/weather.ts','src/weather-src/00-types-models-search.tsfrag'])assert.ok(fs.readFileSync(file,'utf8').includes("elevation:elevations.join(','),cell_selection:'nearest'"),'Legacy mountain comparison must use the same cell contract');
console.log('Mountain atmospheric columns: fixed cells, height-specific surface downscaling, missing-data safety, common lowest cloud base and distinct local cloud risk verified.');
