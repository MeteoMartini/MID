import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const appSource=readFileSync('src/App.tsx','utf8'),meanCloudLayerSource=appSource.match(/^function meanCloudLayer[^\n]+/m)[0],detailSource=appSource.match(/function detailHoursByResolution[\s\S]*?\n}/)[0],detailHelpers=['periodDisplayCode','periodWeatherImpact'].map(name=>appSource.match(new RegExp('^function '+name+'[^\n]+','m'))[0]).join('\n');
const meanOutput=await build({stdin:{contents:'export '+meanCloudLayerSource,loader:'ts'},write:false,format:'esm',logLevel:'silent'});
const {meanCloudLayer}=await import('data:text/javascript;base64,'+Buffer.from(meanOutput.outputFiles[0].text).toString('base64'));
const detailContents="import{precipitationParts}from'./src/precipitation';import{weatherPictogramKind}from'./src/WeatherPictogram';import{periodWeatherVisual}from'./src/periodWeatherVisual';import{label}from'./src/weather';"+meanCloudLayerSource+detailHelpers+'export '+detailSource;
const output=await build({stdin:{contents:detailContents+"export{buildShortTermForecast,shortTermNinetyMinutePoints}from'./src/ShortTermForecast';export{detailSkyBarHourCells,detailSkyBarSegments}from'./src/detailSkyBar';export{periodWeatherVisual}from'./src/periodWeatherVisual';export{WeatherPictogram}from'./src/WeatherPictogram';export{shortTermCloudLayers,shortTermCloudLabel,shortTermProfileHourlyPoints}from'./src/ForecastCockpit';export{createElement}from'react';export{renderToStaticMarkup}from'react-dom/server';",resolveDir:process.cwd(),loader:'ts'},plugins:[{name:'qa-exports',setup(b){for(const [file,names] of [['ForecastCockpit','shortTermCloudLayers,shortTermCloudLabel']])b.onLoad({filter:new RegExp(`/${file}\\.tsx$`)},()=>({contents:readFileSync(`src/${file}.tsx`,'utf8')+`\nexport{${names}};`,loader:'tsx',resolveDir:process.cwd()+'/src'}));}}],loader:{'.css':'empty'},define:{'import.meta.env':'{}'},bundle:true,jsx:'automatic',write:false,platform:'node',format:'cjs',logLevel:'silent'});
const qa=mkdtempSync(join(tmpdir(),'mid206-'));writeFileSync(join(qa,'qa.cjs'),output.outputFiles[0].text);const m=createRequire(import.meta.url)(join(qa,'qa.cjs'));rmSync(qa,{recursive:true,force:true});
const now=Date.UTC(2026,9,8,15,27),base={temperature:13,apparent:12,humidity:70,dewPoint:8,pressure:1015,wind:7,gust:22,direction:225,cloud:60,lowCloud:20,midCloud:20,highCloud:20,visibility:30000,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:2,isDay:true,sunshineDuration:1800};
const hours=Array.from({length:27},(_,i)=>({...base,epoch:now+i*3600000,time:new Date(now+i*3600000).toISOString()}));
for(const missing of [null,undefined,'',' ']){
 const rows=[{...hours[0],cloud:missing,lowCloud:missing,midCloud:missing,highCloud:missing},{...hours[1],cloud:60}];
 assert.equal(m.periodWeatherVisual(rows,true,2,'Wolkig').cloud,60);
 assert.equal(meanCloudLayer(rows,'cloud'),60);
 const unknown=m.periodWeatherVisual([rows[0]],true,2,'Wolkig');assert.equal(unknown.cloud,undefined);assert.notEqual(unknown.code,0);
 const markup=m.renderToStaticMarkup(m.createElement(m.WeatherPictogram,{code:3,cloud:missing,lowCloud:missing}));assert.match(markup,/data-weather-kind="cloudy"/,'missing cover must retain the known code, never turn it clear');
 assert.equal(m.shortTermCloudLabel(missing),'n. v.');assert.equal(m.shortTermCloudLayers(rows[0]).total,undefined);
 const point={...base,cloud:missing,sunshineDuration:missing,isDay:false};const cell=m.detailSkyBarHourCells([point])[0];assert.equal(cell.state,'unavailable');assert.match(cell.title,/Bewölkung nicht verfügbar/);assert.equal(cell.base,null);
 const unknownHours=hours.map(h=>({...h,cloud:missing,lowCloud:missing,midCloud:missing,highCloud:missing,sunshineDuration:null}));
 const result=m.buildShortTermForecast([],unknownHours,'Europe/Berlin',now,{active:false});assert.ok(result.every(p=>!Number.isFinite(p.cloud)&&!Number.isFinite(p.midCloud)&&!Number.isFinite(p.highCloud)));
 const fallback=m.shortTermProfileHourlyPoints(unknownHours,[],'Europe/Berlin',now);assert.ok(fallback.every(p=>!Number.isFinite(p.cloud)));
}
const known=m.detailSkyBarHourCells([{...base,cloud:35,sunshineDuration:300,precipitationIntervalStartEpoch:0,precipitationIntervalEndEpoch:900000}])[0];assert.equal(known.state,'weather');assert.equal(known.base,null);assert.match(known.title,/35 %/);assert.match(known.title,/33 %/);assert.doesNotMatch(known.title,/nicht verfügbar/);
const detailRows=[0,90,0].map((cloud,i)=>({...hours[i],epoch:Date.UTC(2026,9,8,12+i),time:`2026-10-08T${12+i}:00`,cloud,code:cloud?3:0}));const detail=m.detailHoursByResolution(detailRows,'3h')[0];assert.equal(detail.cloud,30);assert.equal(detail.code,1,'3h dry description and icon must follow the same cloud mean');assert.equal(m.detailHoursByResolution(detailRows,'1h'),detailRows);assert.equal(m.detailHoursByResolution(detailRows.map(h=>({...h,code:61,precipitation:1,rain:1})),'3h')[0].code,61,'rain must survive dry sky reconciliation');
assert.equal(m.shortTermCloudLabel(0),'0 %');assert.equal(meanCloudLayer([{cloud:0},{cloud:null}],'cloud'),0);
const quarters=Array.from({length:8},(_,i)=>({...base,epoch:Date.UTC(2026,9,8,15,30)+i*900000,time:new Date(Date.UTC(2026,9,8,15,30)+i*900000).toISOString(),cloud:[60,60,55,40,35,30,30,30][i],sunshineDuration:[900,900,900,300,600,600,0,0][i]}));
const points=m.shortTermNinetyMinutePoints(m.buildShortTermForecast(quarters,hours,'Europe/Berlin',now,{active:false}),now);assert.equal(points.length,6);assert.deepEqual(points.map(p=>p.timeLabel),['17:30','17:45','18:00','18:15','18:30','18:45']);
const cells=m.detailSkyBarHourCells(points),segments=m.detailSkyBarSegments(points,0,0,600,8);
for(const [i,p] of points.entries()){assert.match(p.weatherLabel,p.cloud>=43.75?/Wolkig/:/Leicht bewölkt/);const segment=segments.find(s=>s.layer==='base'&&s.x1<=i*100+50&&s.x2>i*100+50);assert.equal(segment?.color,cells[i].base?.color);if(p.cloud>=50)assert.equal(segment.color,'#aeb3b9');assert.match(cells[i].title,new RegExp(`${Math.round(p.cloud)} %`));}
console.log('C23 .206: six screenshot time slots, physical band gaps, missing vs zero clouds, all shared icons/periods/detail/cloud layers and short-term fallback passed.');

if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-c23-sunset-browser-0985206.mjs'],{stdio:'inherit',timeout:360000});
