import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {inlineSunshineDurationContract} from './sunshine-duration-regression-helper.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
for(const token of [
 'DAY_HOURLY_FULL_COVERAGE_MIN_HOURS=18',
 'export function reconcileForecastHoursWithDays',
 'Eine Tagesaggregation darf keine bislang nicht vorhandene Niederschlagsstunde',
 'dailyWeatherCodeFromHours'
])assert.ok(source.includes(token),`fehlender kohärenter Tages-/Stundenvertrag: ${token}`);
assert.ok(!source.includes('distributeDailyPrecipitationDeficit'),'Tagesmengen dürfen nicht mehr künstlich auf Stunden verteilt werden');
assert.ok(!source.includes('DAY_HOURLY_PRECIPITATION_DEFICIT_MIN_MM'),'alte Tagesdefizit-Verteilung muss vollständig entfernt sein');

const app=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');
assert.ok(app.includes('finalizeForecastHours(twinHours,baseDisplayDays'), 'finale Darstellungsstunden müssen über die gemeinsame MID-Endstufe zentral geprüft werden');
assert.ok(source.includes('reconcileForecastHoursWithDays(observationHours,days)'), 'gemeinsame MID-Endstufe muss den Tages-/Stundenabgleich ausführen');
assert.ok(app.includes('reconcileForecastDaysWithHours(baseDisplayDays,displayHours)'), 'Tageskopf muss aus finalen Stunden abgeleitet werden');

const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const executable=inlineSunshineDurationContract(source)
 .replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used')};")
 .replace("import {reconcileForecastPrecipitation} from './precipitation';",`const reconcileForecastPrecipitation=input=>{const precipitation=Math.max(0,Number(input.precipitation)||0),rain=Math.max(0,Number(input.rain)||0),showers=Math.max(0,Number(input.showers)||0),snowfall=Math.max(0,Number(input.snowfall)||0),probability=Math.max(0,Math.min(100,Number(input.probability)||0)),code=Math.round(Number(input.code)||0),wet=[51,53,55,56,57,61,63,65,66,67,68,69,71,73,75,77,80,81,82,83,84,85,86,95,96,97,99].includes(code),lead=Math.max(0,Number(input.leadHours)||0),min=lead<=24?10:lead<=72?15:20,suppress=(wet||precipitation>=.01||rain>=.01||showers>=.01||snowfall>=.01)&&(probability<=5||Math.max(precipitation,rain,showers,snowfall)<=.35&&probability<min);return suppress?{precipitation:0,rain:0,showers:0,snowfall:0,probability,code:3,traceSuppressed:true}:{precipitation,rain,showers,snowfall,probability,code,traceSuppressed:false}};`)
 .replace("import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';","const readStoredJsonCache=()=>undefined;const writeStoredJsonCache=()=>false;")
 .replace("import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'');
const transpiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName:'forecastFusion.ts'}),diagnostics=(transpiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-no-daily-allocation-')),modulePath=path.join(tempDir,'forecastFusion.cjs');fs.writeFileSync(modulePath,transpiled.outputText);const mod=require(modulePath);
const originalNow=Date.now,now=Date.UTC(2026,7,2,13,30);Date.now=()=>now;
try{
 const date='2026-08-04',day={date,code:61,max:33,min:22,sunshineDuration:42000,precipitation:.4,probability:74,wind:8,gust:15,direction:90,uvMax:7};
 const hour=(index,precipitation=0,probability=0)=>({time:`${date}T${String(index).padStart(2,'0')}:00`,epoch:Date.UTC(2026,7,3,22+index),timezone:'Europe/Berlin',temperature:25,apparent:25,humidity:60,dewPoint:16,pressure:1012,precipitation,rain:precipitation,showers:0,snowfall:0,probability,code:precipitation?61:2,wind:6,gust:12,direction:90,cloud:55,lowCloud:20,uvIndex:0,visibility:10000,cape:50,sunshineDuration:1800,isDay:index>=6&&index<=21});
 const dryHours=Array.from({length:24},(_,index)=>hour(index,0,index===15?74:10));
 const untouched=mod.reconcileForecastHoursWithDays(dryHours,[day]);
 assert.equal(untouched.reduce((sum,item)=>sum+item.precipitation,0),0,'eine Tagesmenge darf keine künstliche Niederschlagsstunde erzeugen');
 const aligned=mod.reconcileForecastDaysWithHours([day],untouched)[0];
 assert.equal(aligned.precipitation,0,'bei vollständiger Stundenabdeckung gilt die Summe der kohärenten Stunden');
 assert.equal(aligned.probability,74,'die vorhandene Wahrscheinlichkeit bleibt als probabilistisches Signal sichtbar');
 const wetHours=dryHours.map((item,index)=>index===15?hour(index,.6,60):item);
 const preserved=mod.reconcileForecastHoursWithDays(wetHours,[day]);
 assert.equal(preserved[15].precipitation,.6,'ein tatsächlich vorhandenes, gestütztes Stundenmodell-Signal bleibt erhalten');
 const wetDay=mod.reconcileForecastDaysWithHours([day],preserved)[0];
 assert.ok(Math.abs(wetDay.precipitation-.6)<1e-9,'Tagesmenge wird ausschließlich aus vorhandenen Stunden aggregiert');
}finally{Date.now=originalNow;fs.rmSync(tempDir,{recursive:true,force:true})}
console.log('Tages-/Stunden-Niederschlag geprüft: MID erfindet keine Stunden aus Tagesmengen; der Tageskopf wird aus kohärenten finalen Stunden aggregiert.');
