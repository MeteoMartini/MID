import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const root=new URL('../',import.meta.url);
const [periodSource,weatherSource,appSource,cockpitSource,nightSource,pkgSource,baselineSource]=await Promise.all([
 readFile(new URL('src/forecastPeriods.ts',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/forecastNight.ts',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);

for(const [area,text,token] of [
 ['Tagescharakter',weatherSource,"const relevant=dayPeriodHoursForDate(day.date,hours);"],
 ['App',appSource,"import {dayPeriodHoursForDate,followingNightHoursForDate} from './forecastPeriods';"],
 ['Cockpit',cockpitSource,"import {dayPeriodHoursForDate,followingNightHoursForDate} from './forecastPeriods';"],
 ['Folgenacht-Minimum',nightSource,"import {followingNightHoursForDate} from './forecastPeriods';"],
 ['Cockpit-Regime',cockpitSource,"if(assessment.showery&&assessment.dominant)return'showery';"],
 ['7-Tage-Trend',appSource,'dayPrecipitation=dayAssessment.amount'],
 ['7-Tage-Trend',appSource,'totalPrecip=points.reduce((sum,point)=>sum+point.dayPrecipitation,0)']
])assert.ok(text.includes(token),`${area}: ${token}`);
assert.ok(!appSource.includes('function followingNightHoursForDate('),'App enthält weiterhin eine abweichende lokale Folgenacht-Implementierung.');
assert.ok(!cockpitSource.includes('function followingNightHoursForDate('),'Cockpit enthält weiterhin eine abweichende lokale Folgenacht-Implementierung.');
assert.ok(JSON.parse(pkgSource).scripts['test:day-following-night-boundaries'],'Package-Skript fehlt.');
assert.ok(JSON.parse(baselineSource).regressionTests.includes('scripts/test-day-following-night-boundaries-09155.mjs'),'Baseline-Regression fehlt.');

const dir=await mkdtemp(join(tmpdir(),'mid-09155-'));
try{
 const periodOut=ts.transpileModule(periodSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'forecastPeriods.ts'}).outputText;
 const periodFile=join(dir,'forecastPeriods.mjs');await writeFile(periodFile,periodOut);
 const periods=await import(`${pathToFileURL(periodFile).href}?v=${Date.now()}`);
 const makeHour=(date,hour,{rain=0,showers=0,probability=0,code=1,isDay=hour>=6&&hour<20,cloud=25}={})=>({time:`${date}T${String(hour).padStart(2,'0')}:00`,epoch:Date.parse(`${date}T${String(hour).padStart(2,'0')}:00:00Z`),timezone:'Europe/Berlin',temperature:20,apparent:20,humidity:50,dewPoint:10,pressure:1015,precipitation:rain+showers,rain,showers,snowfall:0,probability,code,wind:5,gust:8,direction:250,cloud,lowCloud:0,uvIndex:0,visibility:10000,cape:0,isDay});
 const date='2026-08-05',next='2026-08-06';
 const all=[...Array.from({length:24},(_,hour)=>makeHour(date,hour)),...Array.from({length:24},(_,hour)=>makeHour(next,hour))];
 const dayWindow=periods.dayPeriodHoursForDate(date,all),nightWindow=periods.followingNightHoursForDate(date,all);
 assert.ok(dayWindow.length>=12&&dayWindow.every(hour=>hour.time.startsWith(date)&&hour.isDay),'Tagesfenster enthält Nachtstunden.');
 assert.ok(nightWindow.some(hour=>hour.time.startsWith(date)&&Number(hour.time.slice(11,13))>=20),'Abend des Prognosetags fehlt in der Folgenacht.');
 assert.ok(nightWindow.some(hour=>hour.time.startsWith(next)&&Number(hour.time.slice(11,13))<6),'Morgenstunden des Folgetags fehlen in der Folgenacht.');
 assert.ok(nightWindow.every(hour=>!hour.isDay),'Folgenacht enthält Tagesstunden.');

 let source=weatherSource.replace(/^import .*;\n/gm,'');
 const stubs=`
const fetchWorkerJson=async()=>({}); const workerBaseCandidates=()=>[]; const formatDecimal=(v)=>String(v);
const formatDwdWarningDetailWithDirection=()=>''; const formatDwdWarningValue=()=>''; const summarizeDwdWarnings=()=>[];
const loadOperaRaster=async()=>null; const analyseOperaRasterNowcast=()=>null;
function precipitationParts(h){const c=Math.round(Number(h.code)||0),p=Math.max(0,Number(h.precipitation)||0),r=Math.max(0,Number(h.rain)||0),s=Math.max(0,Number(h.showers)||0),sn=Math.max(0,Number(h.snowfall)||0);if(c>=95)return{type:'thunderstorm',displayCode:c,weatherLabel:'Gewitter'};if((c>=80&&c<=86)||s>=.05)return{type:'showers',displayCode:c>=80?c:81,weatherLabel:'Regenschauer'};if((c>=71&&c<=77)||sn>=.05)return{type:'snow',displayCode:c>=71?c:73,weatherLabel:'Schnee'};if(c>=51&&c<=57)return{type:'drizzle',displayCode:c,weatherLabel:'Sprühregen'};if((c>=61&&c<=69)||r>=.05||p>=.05)return{type:'rain',displayCode:c>=61?c:61,weatherLabel:'Regen'};return{type:'none',displayCode:c,weatherLabel:'Trocken'};}
const naturalPossibleEventText=(event,timing)=>{const text=(timing?timing+' ':'')+event+' möglich';return text.charAt(0).toUpperCase()+text.slice(1)};
const naturalPossibleEventFallback=(event,timing)=>{const text=timing?timing+' '+event:event+' möglich';return text.charAt(0).toUpperCase()+text.slice(1)};
const fieldSiteCompatibility=()=>1; const fieldWeightPolicy=()=>({quality:1,sensitiveAllowed:true}); const normalisePrecipitationAccumulation=(v)=>v; const precipitationIntervalMinutes=()=>60; const sourcePolicyFor=()=>({quality:1});
function dayPeriodHoursForDate(date,hours){const dated=hours.filter(hour=>hour.time.slice(0,10)===date),astronomical=dated.filter(hour=>hour.isDay===true);if(astronomical.length>=2)return astronomical;return dated.filter(hour=>{const clock=Number(hour.time.slice(11,13));return clock>=7&&clock<19})}
`;
 source=stubs+source;
 const weatherOut=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'weather.ts'}).outputText;
 const weatherFile=join(dir,'weather.mjs');await writeFile(weatherFile,weatherOut);
 const weather=await import(`${pathToFileURL(weatherFile).href}?v=${Date.now()}`);
 const day={date,code:61,max:29,min:20,sunrise:`${date}T06:00`,sunset:`${date}T21:00`,sunshineDuration:9*3600,precipitation:5.3,probability:68,wind:8,gust:23,direction:250,uvMax:6};
 const nightRain=[...Array.from({length:24},(_,hour)=>makeHour(date,hour,hour<=4?{rain:1.06,probability:68,code:61,isDay:false,cloud:95}:{isDay:hour>=6&&hour<20,code:hour>=6&&hour<20?1:3,cloud:hour>=6&&hour<20?35:70})),...Array.from({length:24},(_,hour)=>makeHour(next,hour))];
 const character=weather.dayWeatherCharacter(day,nightRain);
 assert.equal(character.precipitationDominant,false,'Niederschlag der vorangegangenen Nacht dominiert weiterhin den Tagescharakter.');
 assert.ok(character.code<50,`Tagespiktogramm bleibt trotz trockenem Tag ein Niederschlagssymbol (${character.code}).`);
 assert.ok(!/regen|schauer/i.test(weather.dayWeatherCharacterText(character)),'Nachtregen erscheint weiterhin im Tagescharakter.');
 const showerHours=Array.from({length:24},(_,hour)=>makeHour(date,hour,hour>=14&&hour<=16?{showers:.34,probability:27,code:81,isDay:true,cloud:55}:{isDay:hour>=6&&hour<20,code:hour>=6&&hour<20?1:3,cloud:30}));
 const showerCharacter=weather.dayWeatherCharacter({...day,code:81,precipitation:1,probability:27},showerHours);
 assert.ok(/schauer/i.test(weather.dayWeatherCharacterText(showerCharacter)),'Tatsächliche Tagesschauer werden nicht im Tagescharakter ausgewiesen.');
}finally{await rm(dir,{recursive:true,force:true})}
console.log('Tag-/Folgenachtgrenzen geprüft: Tagescharakter ist strikt tagsüber; Nachtpiktogramm und Tropennacht nutzen dieselbe datumsübergreifende Folgenacht; Cockpit kennzeichnet Tagesschauer nicht als ruhig.');
