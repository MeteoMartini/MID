import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const root=new URL('../',import.meta.url);
const [weatherSource,appSource,sevenDaySource,cockpitSource,ensembleSource,pkgSource,baselineSource]=await Promise.all([
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/SevenDayForecastSummary.tsx',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/EnsemblePanel.tsx',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);

for(const [area,text,token] of [
 ['Zentrale Bewertung',weatherSource,'export function precipitationPeriodAssessment'],
 ['Tagesbewertung',weatherSource,'export function dayPrecipitationAssessment'],
 ['Dauerformat',weatherSource,'export function precipitationDurationLabel'],
 ['Kompaktdauer',weatherSource,'export function precipitationDurationCompactLabel'],
 ['Tagescharakter',weatherSource,'assessment=precipitationPeriodAssessment(relevant)'],
 ['7-Tage-Trend',sevenDaySource,'trendHours=[...dayHours,...followingNightHours]'],
 ['7-Tage-Trend',sevenDaySource,'hazards=summarizeDwdWarnings(trendHours,elevation)'],
 ['Folgenacht',sevenDaySource,'function sevenDayFollowingNightClause'],
 ['7-Tage-Karten',appSource,'precipitationDurationDayOverviewCompactLabel(precipitationAssessment.durationHours)'],
 ['Cockpit',cockpitSource,'className="cockpit-day-pop"'],
 ['Ensemble',ensembleSource,"{row.precipitationDuration?` · ${row.precipitationDuration}`:''}"]
 ])assert.ok(text.includes(token),`${area}: ${token}`);
assert.ok(!sevenDaySource.includes('hazards=summarizeDwdWarningsForDay(allHours,day.date,elevation)'),'7-Tage-Trend greift weiterhin auf das komplette Kalenderdatum einschließlich vorangegangener Nacht zu.');
assert.ok(JSON.parse(pkgSource).scripts['test:precipitation-duration-day-character'],'Package-Skript für Niederschlagsdauer und Tagescharakter fehlt.');
assert.ok(JSON.parse(baselineSource).regressionTests.includes('scripts/test-precipitation-duration-day-character-09160.mjs'),'Baseline enthält die neue Niederschlagsdauer-Regression nicht.');

let source=weatherSource.replace(/^import .*;\n/gm,'');
const stubs=`
const fetchWorkerJson=async()=>({}); const workerBaseCandidates=()=>[]; const formatDecimal=(v)=>String(v);
const formatDwdWarningDetailWithDirection=()=>''; const formatDwdWarningValue=()=>''; const summarizeDwdWarnings=()=>[];
const loadOperaRaster=async()=>null; const analyseOperaRasterNowcast=()=>null;
function precipitationParts(h){const c=Math.round(Number(h.code)||0),p=Math.max(0,Number(h.precipitation)||0),r=Math.max(0,Number(h.rain)||0),s=Math.max(0,Number(h.showers)||0),sn=Math.max(0,Number(h.snowfall)||0);if(c>=95)return{type:'thunderstorm',displayCode:c,weatherLabel:'Gewitter'};if((c>=80&&c<=86)||s>=.02)return{type:'showers',displayCode:c>=80?c:81,weatherLabel:'Regenschauer'};if((c>=71&&c<=77)||sn>=.02)return{type:'snow',displayCode:c>=71?c:73,weatherLabel:'Schnee'};if(c>=51&&c<=57)return{type:'drizzle',displayCode:c,weatherLabel:'Sprühregen'};if((c>=61&&c<=69)||r>=.02||p>=.02)return{type:'rain',displayCode:c>=61?c:61,weatherLabel:'Regen'};return{type:'none',displayCode:c,weatherLabel:'Trocken'};}
const naturalPossibleEventText=(event,timing)=>{const text=(timing?timing+' ':'')+event+' möglich';return text.charAt(0).toUpperCase()+text.slice(1)};
const naturalPossibleEventFallback=(event,timing)=>{const text=timing?timing+' '+event:event+' möglich';return text.charAt(0).toUpperCase()+text.slice(1)};
const fieldSiteCompatibility=()=>1; const fieldWeightPolicy=()=>({quality:1,sensitiveAllowed:true}); const normalisePrecipitationAccumulation=(v)=>v; const precipitationIntervalMinutes=()=>60; const sourcePolicyFor=()=>({quality:1});
function dayPeriodHoursForDate(date,hours){const dated=hours.filter(hour=>hour.time.slice(0,10)===date),astronomical=dated.filter(hour=>hour.isDay===true);if(astronomical.length>=2)return astronomical;return dated.filter(hour=>{const clock=Number(hour.time.slice(11,13));return clock>=7&&clock<19})}
`;
source=stubs+source;
const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'weather.ts'});
const dir=await mkdtemp(join(tmpdir(),'mid-09160-'));
try{
 const file=join(dir,'weather.mjs');await writeFile(file,out.outputText);
 const weather=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 const date='2026-08-05',day={date,code:1,max:28,min:18,sunrise:`${date}T06:00`,sunset:`${date}T21:00`,sunshineDuration:10*3600,precipitation:.1,probability:70,wind:7,gust:17,direction:250,uvMax:6};
 const makeHour=(hour,{amount=0,probability=0,code=1,showers=0,isDay=hour>=6&&hour<21,cloud=25}={})=>({time:`${date}T${String(hour).padStart(2,'0')}:00`,epoch:Date.parse(`${date}T${String(hour).padStart(2,'0')}:00:00Z`),timezone:'Europe/Berlin',temperature:22,apparent:22,humidity:55,dewPoint:12,pressure:1015,precipitation:amount,rain:Math.max(0,amount-showers),showers,snowfall:0,probability,code,wind:5,gust:8,direction:250,cloud,lowCloud:0,uvIndex:0,visibility:10000,cape:0,isDay});
 const hours=Array.from({length:24},(_,hour)=>makeHour(hour,hour===15?{amount:.1,showers:.1,probability:70,code:81,cloud:55}:{code:hour>=6&&hour<21?1:3,isDay:hour>=6&&hour<21,cloud:hour>=6&&hour<21?25:70}));
 const minute15=[0,15,30,45].map((minute,index)=>({time:`${date}T15:${String(minute).padStart(2,'0')}`,epoch:Date.parse(`${date}T15:${String(minute).padStart(2,'0')}:00Z`),timezone:'Europe/Berlin',precipitation:index===1?.1:0,rain:0,showers:index===1?.1:0,snowfall:0,probability:index===1?70:5,code:index===1?81:1}));
 const shortAssessment=weather.dayPrecipitationAssessment(day,hours,minute15);
 assert.equal(shortAssessment.durationHours,.25,'Ein einzelner 15-Minuten-Schauer wird nicht als 15 Minuten erkannt.');
 assert.equal(shortAssessment.dominant,false,'Ein einzelner 15-Minuten-Schauer bestimmt weiterhin den gesamten Tagescharakter.');
 assert.equal(shortAssessment.showery,true,'Das verbleibende Schauerrisiko wird vollständig herausgeglättet.');
 assert.equal(weather.precipitationDurationLabel(shortAssessment.durationHours),'15 min','Niederschlagsdauer ist falsch formatiert.');
 assert.equal(weather.precipitationDurationCompactLabel(shortAssessment.durationHours),'15m','Kompakte Niederschlagsdauer ist falsch formatiert.');
 assert.equal(weather.precipitationDurationCompactLabel(1.5),'1½h','Kompakte 90-Minuten-Dauer ist falsch formatiert.');
 assert.equal(weather.precipitationDurationCompactLabel(0),'','Nullminuten duerfen in Kompaktkarten keinen redundanten Text erzeugen.');
 assert.equal(weather.precipitationDurationDayOverviewLabel(1.5),'2 h','Tagesübersicht muss Niederschlagsdauer auf volle Stunden runden.');
 assert.equal(weather.precipitationDurationDayOverviewCompactLabel(1.5),'2h','Kompakte Tagesübersicht muss Niederschlagsdauer auf volle Stunden runden.');
 const shortCharacter=weather.dayWeatherCharacter(day,hours);
 assert.equal(shortCharacter.precipitationDominant,false,'Kurzer Schauerschwerpunkt dominiert weiterhin den Tagescharakter.');
 assert.ok(/schauer/i.test(weather.dayWeatherCharacterText(shortCharacter)),'Das kurze Schauerrisiko wird im sekundären Hinweis nicht mehr genannt.');

 const sustainedHours=Array.from({length:24},(_,hour)=>makeHour(hour,hour>=14&&hour<=16?{amount:.34,showers:.34,probability:42,code:81,cloud:60}:{code:hour>=6&&hour<21?2:3,isDay:hour>=6&&hour<21,cloud:hour>=6&&hour<21?45:75}));
 const sustained=weather.dayPrecipitationAssessment({...day,precipitation:1.02,probability:42},sustainedHours);
 assert.equal(sustained.dominant,true,'Mehrstündige, mengenrelevante Schauer werden fälschlich nur als Nebenrisiko bewertet.');
 assert.ok(sustained.durationHours>=2,'Mehrstündige Schauer erhalten eine unplausibel kurze Dauer.');

 const nightOnly=Array.from({length:24},(_,hour)=>makeHour(hour,hour<=4?{amount:1,probability:80,code:63,isDay:false,cloud:95}:{code:hour>=6&&hour<21?1:3,isDay:hour>=6&&hour<21,cloud:hour>=6&&hour<21?20:70}));
 const nightCharacter=weather.dayWeatherCharacter({...day,code:63,precipitation:5,probability:80},nightOnly);
 assert.equal(nightCharacter.precipitationDominant,false,'Niederschlag der vorangegangenen Nacht dominiert weiterhin den Tag.');
 assert.ok(!/regen|schauer/i.test(weather.dayWeatherCharacterText(nightCharacter)),'Niederschlag der vorangegangenen Nacht erscheint weiterhin im Tagescharakter.');
}finally{await rm(dir,{recursive:true,force:true})}
console.log('Niederschlagscharakter geprüft: Detaildauer bleibt 15-minütig; Tagesübersichten runden die Niederschlagsdauer auf volle Stunden.');
