import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {inlineSunshineDurationContract} from './sunshine-duration-regression-helper.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
for(const token of ['hoursByDate','completeCoverage=relevant.length>=DAY_HOURLY_FULL_COVERAGE_MIN_HOURS','precipitation=nearTerm||completeCoverage?hourlyPrecipitation:Math.max(dayPrecipitation,hourlyPrecipitation)','Der Sunshine-Contract aggregiert jeden lokalen Kalendertag'])assert.ok(source.includes(token),`fehlender Tages-/Stunden-Konsistenzvertrag: ${token}`);

const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const executable=inlineSunshineDurationContract(source).replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used')};").replace("import {reconcileForecastPrecipitation} from './precipitation';","const reconcileForecastPrecipitation=input=>({precipitation:Math.max(0,Number(input.precipitation)||0),rain:Math.max(0,Number(input.rain)||0),showers:Math.max(0,Number(input.showers)||0),snowfall:Math.max(0,Number(input.snowfall)||0),probability:Math.max(0,Math.min(100,Number(input.probability)||0)),code:Math.round(Number(input.code)||0),traceSuppressed:false});").replace("import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';","const readStoredJsonCache=()=>undefined;const writeStoredJsonCache=()=>false;").replace("import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'');
const transpiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName:'forecastFusion.ts'});
const diagnostics=(transpiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-daily-hourly-'));
const modulePath=path.join(tempDir,'forecastFusion.cjs');fs.writeFileSync(modulePath,transpiled.outputText);const mod=require(modulePath);
const originalNow=Date.now,now=Date.UTC(2026,7,2,6,0,0);Date.now=()=>now;
const day=(date,precipitation,probability)=>({date,code:3,max:30,min:18,sunrise:`${date}T06:00`,sunset:`${date}T21:00`,sunshineDuration:40000,precipitation,probability,wind:7,gust:14,direction:90,uvMax:6});
const hour=(time,epoch,precipitation,probability)=>({time,epoch,timezone:'Europe/Berlin',temperature:20,apparent:20,humidity:60,dewPoint:12,pressure:1015,precipitation,rain:precipitation,showers:0,snowfall:0,probability,code:precipitation>=.05?61:3,wind:5,gust:10,direction:90,cloud:70,lowCloud:50,uvIndex:0,visibility:10000,cape:0,liftedIndex:0,convectiveInhibition:0,columnWaterVapour:20,isDay:false});
try{
 const future=mod.reconcileForecastDaysWithHours([day('2026-08-03',0,24)],[hour('2026-08-03T23:00',now+41*3600000,.1,21)]);
 assert.equal(future[0].precipitation,.1,'sichtbare 0,1 mm um 23 Uhr müssen im Tageswert erscheinen');
 assert.equal(future[0].probability,24,'höherer bereits vorhandener Tages-Maximalwert bleibt erhalten');
 const retained=mod.reconcileForecastDaysWithHours([day('2026-08-03',.4,30)],[hour('2026-08-03T23:00',now+41*3600000,0,5)]);
 assert.equal(retained[0].precipitation,.4,'spätere Tagesprognose darf durch unvollständige Stundenwerte nicht künstlich abgesenkt werden');
 const near=mod.reconcileForecastDaysWithHours([day('2026-08-02',.2,20)],[hour('2026-08-02T09:00',now+60*60000,0,1)]);
 assert.equal(near[0].precipitation,0,'trockener unmittelbarer Nowcast muss einen älteren Tageswert weiterhin absenken dürfen');
 assert.equal(near[0].probability,1);
}finally{Date.now=originalNow;fs.rmSync(tempDir,{recursive:true,force:true})}
console.log('Tages-/Stunden-Niederschlagskonsistenz ab v0.8.33.6 geprüft.');
