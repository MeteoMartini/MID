import assert from 'node:assert/strict';
import fs,{readFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {inlineSunshineDurationContract} from './sunshine-duration-regression-helper.mjs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const fusion=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const v078=readFileSync(new URL('../src/v078.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,33,16];let atLeast=true;for(let index=0;index<minimum.length;index++){if((parts[index]??0)>minimum[index])break;if((parts[index]??0)<minimum[index]){atLeast=false;break}}if(!atLeast)failures.push(`package.json liegt vor 0.8.33.16: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != ${pkg.version}`);
for(const token of [
 'export function reconcileCurrentTemperatureObservation',
 'bestDistance>90*60000',
 'result[bestIndex]={...current,temperature}',
 'hourlyMax=temperatures.length?Math.max(...temperatures):Number.NaN',
 'max=Number.isFinite(hourlyMax)?Math.max(day.max,hourlyMax):day.max',
 'min=Number.isFinite(hourlyMin)?Math.min(day.min,hourlyMin):day.min',
 'return{...day,max,min,precipitation:signal.precipitation'
])need('Temperaturkonsistenz',fusion,token);
for(const token of [
 'finalizeForecastHours',
 "finalizationObservedTemperature=shortTermAnchor?.observed?.temperature?undefined:",
 'observedTemperature:finalizationObservedTemperature',
 'finalizedHours=useMemo',
 'currentRange=currentDay?{min:Math.min(currentDay.min,temp),max:Math.max(currentDay.max,temp)}:null',
 'Tagesbereich aus Vorhersage und aktuellem Wert'
])need('App-Einbindung',app,token);
for(const token of [
 'MID v0.8.33.16 · iOS-Paintstabilität und durchgehender App-Hintergrund',
 'background-color:var(--bg);',
 'overscroll-behavior-y:none;',
 'body,#root{',
 'background:var(--bg)!important;',
 '.hero>.hero-day-range,',
 'backdrop-filter:none!important;'
])need('Paint-CSS',css,token);
need('Tagespille',v078,'mobile Tagesbereich ohne eigene Blur-Compositor-Ebene');
if(app.includes("root.classList.add('mid-fast-scroll')")||css.includes('html.mid-fast-scroll'))failures.push('Globale Scroll-Klassenumschaltung ist weiterhin enthalten.');
if(app.includes('activationTimer=')||app.includes('requestIdle(run,{timeout:260})'))failures.push('ViewportGate wartet weiterhin auf Timer/Idle und kann beim schnellen Scrollen leer bleiben.');
if(failures.length){console.error('MID v0.8.33.16 iOS-Scroll-/Temperaturprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const executable=inlineSunshineDurationContract(fusion)
 .replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used')};")
 .replace("import {reconcileForecastPrecipitation} from './precipitation';",`const reconcileForecastPrecipitation=input=>({precipitation:Math.max(0,Number(input.precipitation)||0),rain:Math.max(0,Number(input.rain)||0),showers:Math.max(0,Number(input.showers)||0),snowfall:Math.max(0,Number(input.snowfall)||0),probability:Math.max(0,Math.min(100,Number(input.probability)||0)),code:Math.round(Number(input.code)||0),traceSuppressed:false});`)
 .replace("import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';","const readStoredJsonCache=()=>undefined;const writeStoredJsonCache=()=>false;")
 .replace("import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'');
const transpiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName:'forecastFusion.ts'});
assert.equal((transpiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error).length,0);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-current-extremes-')),modulePath=path.join(dir,'forecastFusion.cjs'),originalNow=Date.now;
try{
 fs.writeFileSync(modulePath,transpiled.outputText);const mod=require(modulePath),now=Date.UTC(2026,7,2,16,5),date='2026-08-02';Date.now=()=>now;
 const hour=index=>({time:`${date}T${String(index).padStart(2,'0')}:00`,epoch:Date.UTC(2026,7,2,index,0),timezone:'Europe/Berlin',temperature:index===16?31:24,apparent:24,humidity:50,dewPoint:14,pressure:1014,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:1,wind:5,gust:8,direction:90,cloud:15,lowCloud:5,uvIndex:0,visibility:20000,cape:0,isDay:index>=6&&index<=21});
 const baseHours=Array.from({length:24},(_,index)=>hour(index)),day={date,code:1,max:31,min:19,sunshineDuration:50000,precipitation:0,probability:0,wind:5,gust:8,direction:90,uvMax:7};
 const raisedHours=mod.reconcileCurrentTemperatureObservation(baseHours,32,now);assert.equal(raisedHours[16].temperature,32,'aktueller Wert muss die nächste Stundenposition anheben');
 const raisedDay=mod.reconcileForecastDaysWithHours([day],raisedHours)[0];assert.equal(raisedDay.max,32,'aktuelle 32 °C müssen eine prognostizierte Tmax von 31 °C erweitern');assert.equal(raisedDay.min,19);
 const loweredHours=mod.reconcileCurrentTemperatureObservation(baseHours,18,now);const loweredDay=mod.reconcileForecastDaysWithHours([day],loweredHours)[0];assert.equal(loweredDay.min,18,'aktueller Wert unter Tmin muss den Tagesbereich nach unten erweitern');assert.equal(loweredDay.max,31);
 const ignored=mod.reconcileCurrentTemperatureObservation(baseHours,40,now+12*3600000);assert.equal(ignored,baseHours,'eine zeitlich nicht zuordenbare Beobachtung darf die Stunden nicht verändern');
}finally{Date.now=originalNow;fs.rmSync(dir,{recursive:true,force:true})}
console.log('MID v0.8.33.16 geprüft: durchgehender Root-Hintergrund, reduzierte mobile Compositor-Ebenen, direkte Viewport-Aktivierung und Tagesextreme als Hülle aus Prognose und aktuellem Wert.');
