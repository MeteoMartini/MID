import {readFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,weather,route,meteogram,pictograms,worker,ensemble]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','weather.ts'),'utf8'),
 readFile(path.join(root,'src','routeWeather.ts'),'utf8'),
 readFile(path.join(root,'src','MeteogramPanel.tsx'),'utf8'),
 readFile(path.join(root,'src','detailPictograms.ts'),'utf8'),
 readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8')
]);
const failures=[];
for(const token of [
 "current:['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','is_day','precipitation','rain','showers','snowfall','weather_code','cloud_cover','cloud_cover_low'",
 'const part=precipitationParts(h);',
 "if(part.type!=='none')return part.displayCode;"
])if(!weather.includes(token))failures.push(`Best-Match-Zentrallogik fehlt: ${token}`);
for(const token of [
 'currentPrecip=precipitationParts({',
 'currentWeatherCode=currentPrecip.displayCode',
 '<WeatherPictogram code={currentWeatherCode} day={currentIsDay}',
 '<b>{currentWeatherLabel}</b>',
 'function mountainPrecipitationParts',
 'parts=mountainPrecipitationParts(source)',
 'code:part.displayCode',
 'summarizeDwdWarningsForDay(hours,day.date,elevation)',
 'hz=dailyHazards(d,hours,elevation,unit,1)',
 'hz:strongestDailyHazards(dailyHazards(d,hours,elevation??0,unit,1))'
])if(!app.includes(token))failures.push(`Appweite Plausibilisierung/Warnlogik fehlt: ${token}`);
for(const token of ['temperature:hour.temperature','const displayCode=precipitation.displayCode'])if(!route.includes(token))failures.push(`Routenwetter nicht zentral plausibilisiert: ${token}`);
for(const token of ["from './precipitation';",'precipitationParts','precipitationAmountLabel','const part=precipitationParts({',"snowGrains:{short:'SG'",'cloud_cover_low'])if(!meteogram.includes(token))failures.push(`Meteogramm nicht zentral plausibilisiert: ${token}`);
for(const token of ['return rawWeatherPriority(Math.round(Number(parts.displayCode)||0));','return parts.displayCode;'])if(!pictograms.includes(token))failures.push(`Detailpiktogramme umgehen den korrigierten Code: ${token}`);
if(!worker.includes("'weather_code','cloud_cover','cloud_cover_low','freezing_level_height'"))failures.push('Worker-Meteogramm fordert Wolkensignale für die Plausibilisierung nicht an.');
if(!ensemble.includes('summarizeDwdWarningsForDay(hours,x.date,elevation)'))failures.push('Ensemble-Hazards verwenden nicht die tagesbezogene Warnzusammenfassung.');

const outDir=path.join(root,'.daily-warning-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['--ignoreConfig','src/dwdWarnings.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.daily-warning-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {summarizeDwdWarningsForDay}=await import(`${pathToFileURL(path.join(outDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
const samples=[];
for(let hour=0;hour<48;hour++){
 const day=hour<24?'2026-07-30':'2026-07-31',clock=hour%24;
 samples.push({time:`${day}T${String(clock).padStart(2,'0')}:00`,temperature:22,apparent:clock===10&&hour<24?34:clock===15&&hour<24?36:22,precipitation:0,rain:0,showers:0,snowfall:0,gust:0,code:1,visibility:20000,isDay:clock>=6&&clock<21});
}
const heat=summarizeDwdWarningsForDay(samples,'2026-07-30',0).find(signal=>signal.kind==='heat');
if(!heat)failures.push('Tagesbezogene Hitzewarnung wird trotz 36 °C gefühltem Maximum nicht erzeugt.');
else if(Math.round(heat.value)!==36)failures.push(`Warn-Button verwendet ${Math.round(heat.value)} °C statt des Tagesmaximums 36 °C.`);
await rm(outDir,{recursive:true,force:true});

if(failures.length){console.error('Appweite Niederschlags-/Tageswarnprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Appweite Niederschlags- und Tageswarnprüfung bestanden: zentrale Regen-/Sprühregen- und Schnee-/Schneegriesel-Plausibilisierung sowie konsistentes Maximum der gefühlten Temperatur sind geschützt.');
