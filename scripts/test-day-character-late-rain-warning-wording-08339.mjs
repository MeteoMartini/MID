import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript-strada')

const root=new URL('../',import.meta.url);
const [weatherSource,app,ensemble,pkgSource,baselineSource]=await Promise.all([
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/EnsemblePanel.tsx',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);
for(const token of ['dayPeriodHoursForDate(day.date,hours)','dayWeatherCharacterText'])assert.ok(weatherSource.includes(token),`Tagescharakter-Regel fehlt: ${token}`);
assert.ok(app.includes('<strong>Keine Warnung</strong>'),'Hauptwarnkarte verwendet nicht „Keine Warnung“.');
assert.ok(app.includes('✓ Keine Warnung'),'7-Tage-Karte verwendet nicht „Keine Warnung“.');
assert.ok(!app.includes('Keine Warnindikatoren'),'Veraltete Warnungsformulierung ist noch vorhanden.');
assert.ok(app.includes('title={dayWeatherCharacterText(character)}'),'7-Tage-Piktogramm verwendet nicht den vollständigen Tagescharakter.');
assert.ok(app.includes('title={dayWeatherCharacterText(selectedCharacter)}'),'Detailansicht verwendet nicht den vollständigen Tagescharakter.');
assert.ok(ensemble.includes('characterText:dayWeatherCharacterText(character)'),'14-Tage-Daten enthalten keinen vollständigen Tagescharakter.');
assert.ok(ensemble.includes('<small>{x.characterText}</small>'),'14-Tage-Karte zeigt den Hinweis auf ein spätes Niederschlagsereignis nicht an.');
assert.ok(JSON.parse(pkgSource).scripts['test:day-character-late-rain-warning-wording'],'Package-Skript für die neue Regression fehlt.');
assert.ok(JSON.parse(baselineSource).regressionTests.includes('scripts/test-day-character-late-rain-warning-wording-08339.mjs'),'Baseline enthält die neue Regression nicht.');

let source=weatherSource.replace(/^import .*;\n/gm,'');
const stubs=`
const fetchWorkerJson=async()=>({}); const workerBaseCandidates=()=>[]; const formatDecimal=(v)=>String(v);
const formatDwdWarningDetailWithDirection=()=>''; const formatDwdWarningValue=()=>''; const summarizeDwdWarnings=()=>[];
const loadOperaRaster=async()=>null; const analyseOperaRasterNowcast=()=>null;
function precipitationParts(h){const c=Math.round(Number(h.code)||0),p=Math.max(0,Number(h.precipitation)||0),r=Math.max(0,Number(h.rain)||0),s=Math.max(0,Number(h.showers)||0),sn=Math.max(0,Number(h.snowfall)||0);if(c>=95)return{type:'thunderstorm',displayCode:c,weatherLabel:'Gewitter'};if((c>=80&&c<=84)||s>=.05)return{type:'showers',displayCode:c>=80?c:81,weatherLabel:'Regenschauer'};if((c>=71&&c<=77)||sn>=.05)return{type:'snow',displayCode:c>=71?c:73,weatherLabel:'Schnee'};if(c>=51&&c<=57)return{type:'drizzle',displayCode:c,weatherLabel:'Sprühregen'};if((c>=61&&c<=69)||r>=.05||p>=.05)return{type:'rain',displayCode:c>=61?c:61,weatherLabel:'Regen'};return{type:'none',displayCode:c,weatherLabel:'Trocken'};}
function dayPeriodHoursForDate(date,hours){const dated=hours.filter(hour=>hour.time.slice(0,10)===date),day=dated.filter(hour=>hour.isDay);return day.length>=2?day:dated.filter(hour=>{const clock=Number(hour.time.slice(11,13));return clock>=7&&clock<19})}
const naturalPossibleEventText=(event,timing)=>{const text=(timing?timing+' ':'')+event+' möglich';return text.charAt(0).toUpperCase()+text.slice(1)};
const naturalPossibleEventFallback=(event,timing)=>{const text=timing?timing+' '+event:event+' möglich';return text.charAt(0).toUpperCase()+text.slice(1)};
const fieldSiteCompatibility=()=>1; const fieldWeightPolicy=()=>({quality:1,sensitiveAllowed:true}); const normalisePrecipitationAccumulation=(v)=>v; const precipitationIntervalMinutes=()=>60; const sourcePolicyFor=()=>({quality:1});
`;
source=stubs+source;
const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'weather.ts'});
const dir=await mkdtemp(join(tmpdir(),'mid-08339-'));
try{
 const file=join(dir,'weather.mjs');await writeFile(file,out.outputText);
 const weather=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 const day={date:'2026-08-03',code:61,max:35,min:20,sunrise:'2026-08-03T06:00',sunset:'2026-08-03T21:00',sunshineDuration:11.2*3600,precipitation:2.2,probability:32,wind:12,gust:36,direction:250,uvMax:6};
 const makeHours=(eventHours)=>Array.from({length:24},(_,hour)=>{const event=eventHours.includes(hour);return{time:`2026-08-03T${String(hour).padStart(2,'0')}:00`,epoch:0,timezone:'Europe/Berlin',temperature:20,apparent:20,humidity:50,dewPoint:10,pressure:1015,precipitation:event?2.2/eventHours.length:0,rain:event?2.2/eventHours.length:0,showers:0,snowfall:0,probability:event?32:0,code:event?61:(hour>=8&&hour<19?1:3),wind:5,gust:8,direction:250,cloud:hour<8?70:hour<19?25:60,lowCloud:0,uvIndex:0,visibility:10000,cape:0,isDay:hour>=6&&hour<21}});
 const late=weather.dayWeatherCharacter(day,makeHours([22]));
 assert.equal(late.precipitationDominant,false,'Ein einzelner mäßig wahrscheinlicher Regenimpuls um 22 Uhr dominiert weiterhin den Tagescharakter.');
 assert.ok(late.code<50,`Spätes Randereignis verwendet weiterhin ein Niederschlagspiktogramm (${late.code}).`);
 assert.equal(late.secondary,'','Nachtregen wird weiterhin als sekundärer Tageshinweis ausgegeben.');
 assert.ok(!/regen/i.test(weather.dayWeatherCharacterText(late)),'Nachtregen erscheint weiterhin im Tagescharakter.');
 const sustained=weather.dayWeatherCharacter({...day,precipitation:4.4,probability:65},makeHours([14,15,16]));
 assert.equal(sustained.precipitationDominant,true,'Mehrstündiger Tagesregen wird fälschlich nur als Randhinweis behandelt.');
 assert.ok(sustained.code>=50,'Mehrstündiger Tagesregen verliert sein Niederschlagspiktogramm.');
}finally{await rm(dir,{recursive:true,force:true})}
console.log('Tagescharakter geprüft: Niederschlag außerhalb des Tagesfensters bleibt vollständig dem Nachtpiktogramm vorbehalten; echter Tagesregen bleibt dominant.');
