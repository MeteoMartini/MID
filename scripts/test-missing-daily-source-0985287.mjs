import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const temp=await mkdtemp(join(tmpdir(),'mid-missing-day-'));
try{
 const output=join(temp,'adapter.cjs');
 await build({stdin:{contents:"export{forecast,mapHours,mapDays,dailyPrecipitationProbabilityCompact}from'./src/weather';export{precipitationAmountLabel}from'./src/precipitation';export{widgetCurveDailyPrecipitation}from'./src/widgetCurveDailySummary';export{buildSevenDayForecastSummary}from'./src/SevenDayForecastSummary';export{applyForecastFusionDays,reconcileForecastDaysWithHours}from'./src/forecastFusion';export{daySkybarCalendarWindow}from'./src/daySkybarTimeline';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',outfile:output,define:{'import.meta.env':'{}'},logLevel:'silent'});
 const{forecast,buildSevenDayForecastSummary:summary,mapHours,mapDays,precipitationAmountLabel:label,dailyPrecipitationProbabilityCompact:pop,widgetCurveDailyPrecipitation:widget,applyForecastFusionDays:applyFusion,reconcileForecastDaysWithHours:reconcile,daySkybarCalendarWindow:calendar}=createRequire(import.meta.url)(output);
 const fixture=value=>({latitude:50,longitude:7,elevation:60,timezone:'Europe/Berlin',utc_offset_seconds:7200,hourly:{time:[],precipitation_probability:[]},daily:{time:['2026-10-18'],weather_code:[63],temperature_2m_max:[15],temperature_2m_min:[7],precipitation_sum:[value],precipitation_probability_max:[null],wind_speed_10m_max:[10],wind_gusts_10m_max:[20],wind_direction_10m_dominant:[180],uv_index_max:[1]}});
 for(const missing of[null,undefined,'',' ',false,true,NaN,Infinity,-1,'0']){
  const day=mapDays(fixture(missing))[0];
  assert.equal(day.precipitationAvailable,false,`availability: ${String(missing)}`);
  assert(Number.isNaN(day.precipitation),'unknown is distinct from genuine zero');
  assert.equal(day.code,63,'missing quantity must not turn weather code dry');
  assert.equal(day.rain,undefined);assert.equal(day.showers,undefined);assert.equal(day.snowfall,undefined);
  assert.equal(label(day),'– mm');assert.equal(pop(day),'–%');
  const cached=JSON.parse(JSON.stringify(day));
  assert.equal(label(cached),'– mm','JSON null roundtrip preserves missing quantity');
  assert.equal(widget(cached).amount,'– mm');assert.equal(widget(cached).probability,'–%');
 }
 const dry=mapDays(fixture(0))[0];assert.equal(dry.precipitationAvailable,true);assert.equal(dry.precipitation,0);assert.equal(label(dry),'0 mm');
 const wet=mapDays(fixture(5))[0];assert.equal(wet.precipitation,5,'unavailable probability must not damp a known quantity');assert.equal(wet.probabilityAvailable,false);
 const missingDay=mapDays(fixture(null))[0],fusedRow={date:missingDay.date,max:15,min:7,precipitation:null,rain:null,showers:null,snowfall:null,confidence:90,applied:true,code:61};
 assert.equal(applyFusion([missingDay],{active:true,days:[fusedRow]})[0],missingDay,'fused null must not turn into zero');
 const accepted=applyFusion([missingDay],{active:true,days:[{...fusedRow,precipitation:5}]})[0];
 assert.equal(accepted.precipitation,5);assert.equal(accepted.precipitationAvailable,true);assert.equal(accepted.rain,undefined);assert.equal(accepted.snowfall,undefined);
 const hourlyPayload=fixture(null);hourlyPayload.hourly=new Proxy({time:['2026-10-18T01:00'],temperature_2m:[10],relative_humidity_2m:[80],dew_point_2m:[7],precipitation:[null],precipitation_probability:[null],rain:[null],showers:[0],snowfall:[0]}, {get:(target,key)=>key in target?target[key]:[0]});
 const missingHour=mapHours(hourlyPayload)[0];assert.equal(missingHour.precipitationAvailable,false);assert.equal(missingHour.probabilityAvailable,false);assert.equal(missingHour.precipitationComponentsAvailable.rain,false);assert.equal(missingHour.precipitationComponentsAvailable.snowfall,true);
 const snowy=fixture(null);snowy.daily.rain_sum=[1];snowy.daily.showers_sum=[2];snowy.daily.snowfall_sum=[3];
 const snowDay=mapDays(snowy)[0];assert.equal(snowDay.precipitationAvailable,false);assert.match(label(snowDay),/^– mm.*3,0 cm$/,'independent snow cm may remain known');
 for(const [date,count]of[['2026-10-18',24],['2026-03-29',23],['2026-10-25',25]]){
  const window=calendar(date,'Europe/Berlin'),base={...mapDays(fixture(null))[0],date},raw=Array.from({length:count+1},(_,i)=>{
   const epoch=window.startEpoch+i*3600000,parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(epoch)).replace(' ','T');
   return{epoch,time:parts,timezone:'Europe/Berlin',temperature:12,precipitation:1,precipitationAvailable:i!==0,rain:1,showers:0,snowfall:0,probability:0,probabilityAvailable:false,code:61,cloud:100,wind:5,gust:10,isDay:true,sunshineDuration:null};
  });
  const restored=reconcile([base],raw)[0];assert.equal(restored.precipitationAvailable,true);assert.equal(restored.precipitation,count,`complete ${count}h total, regardless of unavailable probability`);assert.equal(restored.probabilityAvailable,false);assert.equal(pop(restored),'–%');
  const missingComponent=reconcile([base],raw.map((h,i)=>i===3?{...h,rain:0,precipitationComponentsAvailable:{rain:false,showers:true,snowfall:true}}:h))[0];
  assert.equal(missingComponent.precipitation,count);assert.equal(missingComponent.rain,undefined,'known water equivalent does not make an unknown rain component zero');
  const masked=raw.map((h,i)=>i===3?{...h,precipitation:0,precipitationAvailable:false}:h),partial=reconcile([base],masked)[0];
  assert.equal(partial.precipitationAvailable,false);assert.equal(label(partial),'– mm','incomplete masked hours must not synthesize a dry provider day');
 }
 const source=await readFile('worker-src/00-core-observations.js','utf8');
 const start=source.indexOf('function fusionDailyPrecipitation('),end=source.indexOf('\n}',start)+2;
 assert(start>=0&&end>start);
 // Execute the actual Worker adapter. Missing probability bypasses reconciliation;
 // any accidental attempt to synthesize a total must fail this fixture.
 const context={number:value=>value===null||value===undefined||value===''?NaN:Number(value),clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),reconcileForecastPrecipitation:()=>{throw new Error('unexpected reconciliation of missing source')}};
 vm.createContext(context);vm.runInContext(source.slice(start,end)+';this.run=fusionDailyPrecipitation;',context);
 for(const missing of[null,undefined,'',false,NaN,-1,'0']){
  const row=context.run(missing,null,63,1,2,3,12);assert(Number.isNaN(row.precipitation),'Worker must not sum rain mm and snow cm');assert.equal(row.snowfall,3);
 }
 assert.equal(context.run(0,null,3,0,0,0,12).precipitation,0);
 const widgetStart=source.indexOf('function nativeWidgetDailyPrecipitation('),widgetEnd=source.indexOf('\n}',widgetStart)+2;
 assert(widgetStart>=0&&widgetEnd>widgetStart);
 vm.runInContext(source.slice(widgetStart,widgetEnd)+';this.widget=nativeWidgetDailyPrecipitation;',context);
 const wire=JSON.parse(JSON.stringify(context.widget(null,null,63,1,2,3,12)));
 assert.equal(wire.precipitationAvailable,false);assert.equal(wire.probabilityAvailable,false);
 assert.equal(typeof wire.precipitationSum,'number','v1 nonoptional numeric Swift decoder remains compatible');
 assert.equal(typeof wire.precipitationProbabilityMax,'number');assert.equal(wire.code,63);
 assert.equal(context.widget(0,null,3,0,0,0,12).precipitationAvailable,true,'known zero differs from masked wire placeholder');
 assert.equal(context.widget(null,null,null,null,null,null,12).code,3,'native numeric weather-code decoder remains valid when an optional code is absent');
 const swift=await readFile('ios/App/MIDWidgets/MIDWidget.swift','utf8'),snapshot=await readFile('ios/App/MIDWidgets/MIDWidgetSnapshot.swift','utf8');
 assert(swift.includes('day.probabilityAvailable == false ? "–"'),'native UI must honor missing-probability mask');
 assert(snapshot.includes('let precipitationAvailable: Bool?')&&snapshot.includes('let probabilityAvailable: Bool?'),'old cached snapshots may omit additive masks');
 const cockpit=await readFile('src/ForecastCockpit.tsx','utf8'),uiOutput=join(temp,'cockpit.cjs');
 await build({stdin:{contents:cockpit+`\nimport{renderToStaticMarkup}from'react-dom/server';export function renderMissingDay(days){return renderToStaticMarkup(<FourteenDayHorizon ensemble={[]} days={days} hours={[]} scenarios={[]} climate={[]} selectedDate={days[0].date} onSelectedDate={()=>{}} loading={false} unit="kn" advancedMode={false} confidenceDisplayMode="compact" timezone="Europe/Berlin" location={{id:1,name:'Fixture',latitude:50,longitude:7}}/>);}`,loader:'tsx',resolveDir:join(process.cwd(),'src')},bundle:true,platform:'node',format:'cjs',outfile:uiOutput,jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env':'{}'},logLevel:'silent'});
 const ui=createRequire(import.meta.url)(uiOutput),html=ui.renderMissingDay([JSON.parse(JSON.stringify(missingDay))]);
 assert(html.includes('– mm')&&html.includes('– %'),'real fourteen-day rendering must show unknown values');
 assert(!html.includes('NaN'),'real forecast rendering must not emit NaN for unavailable precipitation');
 assert.match(summary([missingDay],[]),/regnerisch/,'summary must preserve a valid provider rain code when amount is missing');
 assert.match(summary([{...missingDay,code:71}],[]),/Schnee/,'summary must preserve independent provider snow code');
 assert(!summary([{...missingDay,code:3}],[]).includes('trocken'),'unknown totals must not become an unsupported dry summary');
 assert(summary([dry],[]).includes('trocken'),'a real known zero remains available to dry-weather interpretation');
 const weatherSource=await readFile('src/weather.ts','utf8'),prefix=weatherSource.match(/const FORECAST_CORE_CACHE_PREFIX='([^']+)'/)[1];
 const cachedWeather={...fixture(null),current:{},_mid_core_proxy:{fallback:false,provider:'Open-Meteo'}},storage=new Map([[`${prefix}50.000:7.000:eauto:tzauto`,JSON.stringify({time:Date.now(),value:cachedWeather})]]);
 const priorStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),priorFetch=globalThis.fetch;let fetches=0;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key),key:index=>[...storage.keys()][index]??null,get length(){return storage.size}}});
 globalThis.fetch=async()=>{fetches++;throw new Error('cache fixture must not request network')};
 try{
  const restored=await forecast(50,7);assert.equal(restored._mid_core_proxy.upstreamReason,'fresh-local-cache');assert.equal(fetches,0);
  assert.equal(restored.daily.precipitation_sum[0],null,'raw weather cache must preserve provider missingness');
  assert.equal(label(mapDays(restored)[0]),'– mm','actual cached forecast adapter must not turn null into a dry day');
 }finally{if(priorStorage)Object.defineProperty(globalThis,'localStorage',priorStorage);else delete globalThis.localStorage;globalThis.fetch=priorFetch}
 console.log('MID .287: strict missing vs zero, independent snow cm, 23/24/25h masks, actual cache, fusion, summary, React rendering and Worker/widget contracts passed. Release gates and physical device evidence remain separate.');
}finally{await rm(temp,{recursive:true,force:true})}
