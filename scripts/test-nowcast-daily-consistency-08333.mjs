import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fusionPath=path.join(root,'src','forecastFusion.ts');
const appPath=path.join(root,'src','App.tsx');
const shortTermPath=path.join(root,'src','ShortTermForecast.tsx');
const fusionSource=fs.readFileSync(fusionPath,'utf8');
const appSource=fs.readFileSync(appPath,'utf8');
const shortTermSource=fs.readFileSync(shortTermPath,'utf8');

for(const token of ['drySignal','dryAdjustedHour','reconcileForecastDaysWithHours','weatherHours',"weatherBundleKind:'coherent-model'"])assert.ok(fusionSource.includes(token),`fehlender Nowcast-/Modellbündelvertrag: ${token}`);
assert.ok(appSource.includes('displayDays=useMemo(()=>reconcileForecastDaysWithHours(baseDisplayDays,displayHours)'), 'Tagesansicht muss aus den finalen Nowcast-Stunden reconciliert werden');
assert.ok(appSource.includes('totalRain=Number.isFinite(selectedDay.precipitation)'), 'Detailpille muss denselben Tagesniederschlag wie die 7-Tage-Karte verwenden');
assert.ok(appSource.includes('maxProb=Number.isFinite(selectedDay.probability)'), 'Detailpille muss dieselbe Tageswahrscheinlichkeit wie die 7-Tage-Karte verwenden');
assert.ok(appSource.includes('characterHours=presentationHours.length?presentationHours:p'), 'heutige Wetterbeschreibung muss abgelaufene Stunden ausblenden');
assert.ok(appSource.includes('futureHours=index===0?allDayHours.filter(hour=>hour.epoch>=Date.now()-30*60000):allDayHours'), '7-Tage-Trend muss für heute nur noch relevante Forecast-Stunden bewerten');
assert.ok(shortTermSource.includes('if(precipitationCode(raw)&&probability<30)return observedSkyCode'), 'Kurzfristkarten dürfen trockene Niederschlags-Wettercodes nicht als Regen darstellen');

const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

let executable=fusionSource
 .replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used in regression')};")
 .replace("import {reconcileForecastPrecipitation} from './precipitation';","const reconcileForecastPrecipitation=input=>({precipitation:Math.max(0,Number(input.precipitation)||0),rain:Math.max(0,Number(input.rain)||0),showers:Math.max(0,Number(input.showers)||0),snowfall:Math.max(0,Number(input.snowfall)||0),probability:Math.max(0,Math.min(100,Number(input.probability)||0)),code:Math.round(Number(input.code)||0),traceSuppressed:false});")
 .replace("import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'');
const transpiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName:'forecastFusion.ts'});
const diagnostics=(transpiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-nowcast-'));
const modulePath=path.join(tempDir,'forecastFusion.cjs');fs.writeFileSync(modulePath,transpiled.outputText);
const mod=require(modulePath);

const originalNow=Date.now;
const now=Date.UTC(2026,7,2,5,30,0);Date.now=()=>now;
try{
 const baseHour={time:'2026-08-02T08:00',epoch:now+30*60000,timezone:'Europe/Berlin',temperature:18,apparent:18,humidity:70,dewPoint:12,pressure:1018,precipitation:.2,rain:.2,showers:0,snowfall:0,probability:12,code:61,wind:4,gust:8,direction:90,cloud:82,lowCloud:70,uvIndex:0,visibility:10000,cape:0,liftedIndex:0,convectiveInhibition:0,columnWaterVapour:20,isDay:true};
 const baseDay={date:'2026-08-02',code:61,max:31,min:18,sunrise:'2026-08-02T06:00',sunset:'2026-08-02T21:16',sunshineDuration:41000,precipitation:.2,probability:12,wind:7,gust:14,direction:90,uvMax:6};
 const fusedDay={...baseDay,precipitation:0,probability:1};
 const fusion={active:true,hours:[{time:'2026-08-02T08:00:00.000Z',epoch:baseHour.epoch,temperature:18,dewPoint:12,humidity:70,pressure:1018,precipitation:3,probability:90,wind:4,gust:8}],weatherHours:[{time:'2026-08-02T08:00',epoch:baseHour.epoch,precipitation:0,rain:0,showers:0,snowfall:0,probability:1,code:3,cloud:82,lowCloud:70,cape:0,sunshineDuration:0,sourceId:'icon_d2',sourceLabel:'DWD ICON-D2',sourceFamily:'dwd'}],mosmix:{available:true,applied:true,quality:.95},days:[],sources:[],schema:'mid.forecast-fusion.v1',version:4,generatedAt:new Date(now).toISOString(),summary:'',strategy:''};
 const fusedHours=mod.applyForecastFusionHours([baseHour],[baseDay],[fusedDay],fusion);
 assert.equal(fusedHours[0].precipitation,0,'das kohärente Wettermodell muss Menge, Code und Wahrscheinlichkeit gemeinsam ersetzen');
 assert.equal(fusedHours[0].probability,1,'MOSMIX darf die Niederschlagswahrscheinlichkeit nicht verändern');
 assert.equal(fusedHours[0].code,3,'der trockene Modellzustand muss vollständig übernommen werden');
 assert.equal(fusedHours[0].weatherSourceId,'icon_d2');
 const radarDry={source:'dwd',provider:'DWD Radar',quality:'high',radarProbability:0,currentRate:0,peakRate:0,coverage:true,summary:'Kein Echo'};
 const radarHours=mod.applyOperationalNowcastHours(fusedHours,radarDry);
 assert.ok(radarHours[0].probability<=1,'hochwertiges trockenes Radar muss kurzfristig dominieren');
 assert.equal(radarHours[0].precipitation,0);
 assert.equal(radarHours[0].code,3);
 const reconciled=mod.reconcileForecastDaysWithHours([baseDay],radarHours);
 assert.equal(reconciled[0].precipitation,0,'Tageskarte und Detailansicht müssen denselben Nowcast-Niederschlag nutzen');
 assert.ok(reconciled[0].probability<=1,'Tageskarte und Detailansicht müssen dieselbe Nowcast-Wahrscheinlichkeit nutzen');
 const radarWet={source:'dwd',provider:'DWD Radar',quality:'high',radarProbability:90,currentRate:1.2,peakRate:2,arrivalMinutes:20,endMinutes:100,coverage:true,summary:'Echo nähert sich'};
 const wet=mod.applyOperationalNowcastHours([baseHour],radarWet)[0];
 assert.ok(wet.probability>baseHour.probability,'nasses Radar muss Regenwahrscheinlichkeit erhöhen statt unterdrücken');
 assert.ok(wet.precipitation>=baseHour.precipitation,'nasses Radar muss vorhandene Menge erhalten oder erhöhen');
}finally{Date.now=originalNow;fs.rmSync(tempDir,{recursive:true,force:true})}

console.log('Nowcast-/Tageskonsistenz ab v0.8.33.3 geprüft.');
