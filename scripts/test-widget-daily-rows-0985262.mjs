import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const out=mkdtempSync(join(tmpdir(),'mid-widget262-'));
try{
 await build({stdin:{contents:"export{widgetCurveDailyPrecipitation}from'./src/widgetCurveDailySummary';export{SevenDayCurveOverview}from'./src/ForecastCockpit';export{readWidgetUrlExportRequest}from'./src/widgetUrlExports';export{createElement}from'react';export{renderToStaticMarkup}from'react-dom/server';export{storedWidgetSettings}from'virtual:settings';",resolveDir:process.cwd()},plugins:[{name:'actual-widget-settings',setup(b){b.onResolve({filter:/^virtual:settings$/},()=>({path:'settings',namespace:'widget'}));b.onLoad({filter:/.*/,namespace:'widget'},()=>({contents:readFileSync('src/WidgetGenerator.tsx','utf8')+'\nexport{storedWidgetSettings};',loader:'tsx',resolveDir:join(process.cwd(),'src')}));}}],loader:{'.css':'empty'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:join(out,'qa.cjs'),logLevel:'silent'});
 const m=createRequire(import.meta.url)(join(out,'qa.cjs'));
 const epoch=Date.UTC(2026,9,15),days=Array.from({length:3},(_,i)=>({date:new Date(epoch+i*86400000).toISOString().slice(0,10),min:7,max:13,code:61,cloud:90,precipitation:i?0:1.2,probability:60,sunshineDuration:i?0:7200,wind:10,gust:20,direction:280}));
 const hours=Array.from({length:72},(_,i)=>({time:new Date(epoch+i*3600000).toISOString().slice(0,16),epoch:epoch+i*3600000,temperature:10,cloud:90,isDay:i%24>=7&&i%24<19,precipitation:i===5?1.2:0,rain:i===5?1.2:0,showers:0,snowfall:0,probability:60,code:61,wind:10,gust:20,direction:280,sunshineDuration:0}));
 const render=props=>m.renderToStaticMarkup(m.createElement(m.SevenDayCurveOverview,{days,hours,presentationReady:true,showDailyRows:true,showWind:true,selectedDate:days[0].date,onSelectedDate:()=>{},...props}));
 const full=render({});assert.ok(full.indexOf('seven-day-curve-temps')<full.indexOf('seven-day-curve-rain-row'));assert.ok(full.indexOf('seven-day-curve-rain-row')<full.indexOf('seven-day-curve-wind-row'));assert.ok(full.indexOf('seven-day-curve-sun-row')<full.indexOf('seven-day-curve-chart'));
 const bandCount=(full.match(/data-skybar-level=/g)||[]).length;assert.ok(bandCount>0);assert.ok(full.includes('1 mm'));assert.ok(full.includes('60 %'));assert.ok(full.includes('2 h'));
 for(const showRain of [true,false])for(const showSunshine of [true,false])for(const showSkybar of [true,false]){
  const html=render({showRain,showSunshine,showSkybar});
  assert.equal(html.includes('seven-day-curve-rain-row'),showRain);assert.equal(html.includes('seven-day-curve-sun-row'),showSunshine);assert.equal(html.includes('class="seven-day-curve-skybar"'),showSkybar);assert.equal(html.includes('class="weather-strip"'),showSkybar);
  assert.equal((html.match(/data-skybar-level=/g)||[]).length,showSkybar?bandCount:0,'Numerical options cannot filter the complete Skybar');
  assert.ok(html.includes('seven-day-curve-night-band'),'Night shading remains a chart property');
 }
 assert.equal(render({showDailyRows:false}).includes('seven-day-curve-meta-row'),false,'Regular 7-day consumer keeps its default layout');
 const settings={schema:5,showRain:false,showSunshine:false,showSkybar:false,days:5};globalThis.localStorage={getItem:()=>JSON.stringify(settings)};
 const stored=m.storedWidgetSettings();assert.equal(stored.showSkybar,false);assert.equal(stored.showRain,false);assert.equal(stored.showSunshine,false);delete settings.showSkybar;assert.equal(m.storedWidgetSettings().showSkybar,true,'Existing settings retain the visible Skybar by default');delete globalThis.localStorage;
 assert.deepEqual(m.widgetCurveDailyPrecipitation({precipitation:null,probability:null}),{amount:'– mm',probability:'–%',title:'– mm · Maximale Stundenwahrscheinlichkeit des lokalen Tages: keine Daten'});
 const base='https://www.midwx.app/?widget=malatya&ansicht=kurve&tage=7&design=light';
 assert.equal(m.readWidgetUrlExportRequest(base).showSkybar,true);assert.equal(m.readWidgetUrlExportRequest(base+'&skybar=0&regen=0&sonne=0').showSkybar,false);assert.equal(m.readWidgetUrlExportRequest(base+'&skybar=1&regen=0&sonne=0').showSkybar,true);
 console.log('Widget262: daily rows/order, all eight independent visibility combinations, canonical full Skybar/night shading, stored settings and URL overrides passed.');
}finally{rmSync(out,{recursive:true,force:true})}
