import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {inlineSunshineDurationContract} from './sunshine-duration-regression-helper.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const formatSource=fs.readFileSync(path.join(root,'src','format.ts'),'utf8');
const fusionSource=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
const appSource=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');
const waterSource=fs.readFileSync(path.join(root,'src','WaterSportsPanel.tsx'),'utf8');

assert.ok(formatSource.includes('export function formatUvi(value:number)'), 'zentrale ganzzahlige UVI-Formatierung fehlt');
for(const token of [
 "formatUvi(actualCurrentUv)",
 "formatUvi(maxUv)",
 "formatUvi(maxUvi)",
 "formatUvi(currentHour.uvIndex)"
])assert.ok(appSource.includes(token),`App-weite UVI-Rundung fehlt: ${token}`);
for(const token of ['formatUvi(point.uv)','formatUvi(currentHour.uvIndex)'])assert.ok(waterSource.includes(token),`Wasserwetter-UVI-Rundung fehlt: ${token}`);
assert.ok(appSource.includes('uvClassification=classifyUvIndex(roundedCurrentUv)'), 'UVI-Zahl und Gefahrenstufe müssen denselben gerundeten Wert verwenden');
assert.ok(!/UVI[^\n]{0,100}formatDecimal\([^\n]*(?:uv|Uv)/.test(appSource), 'UVI wird in App.tsx noch dezimal formatiert');
assert.ok(!/UVI[^\n]{0,100}formatNumber\([^\n]*uv/.test(waterSource), 'UVI wird im Wasserwetter noch dezimal formatiert');

assert.ok(fusionSource.includes('export function dryRadarNowcastProbability'), 'gemeinsame trockene Nowcast-Wahrscheinlichkeitsfunktion fehlt');
assert.ok(fusionSource.includes('dryBlend=dryRadarNowcastProbability(hour.probability,radar'), 'Stundenprognose nutzt nicht die gemeinsame trockene Nowcast-Wahrscheinlichkeit');
assert.ok(appSource.includes('dryRadarNowcastProbability(modelProbability,radar,0)'), 'Karte „Aktuelle Niederschlagswahrscheinlichkeit“ nutzt nicht die gemeinsame trockene Nowcast-Wahrscheinlichkeit');
assert.ok(appSource.includes("radarFinding=dryBlend?' · Radarbefund: kein Niederschlag am Standort':nearbyOnly?' · Radarbefund: Echo nur im Umfeld, kein direkter Standorttreffer':''"), 'Quellenhinweis kennzeichnet den niederschlagsfreien Radarbefund nicht');

const require=createRequire(import.meta.url);
const ts=require('typescript-strada');
function compile(source,fileName,replacements=[]){let executable=source;for(const[from,to]of replacements)executable=executable.replace(from,to);const result=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName});const diagnostics=(result.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-08335-')),modulePath=path.join(dir,fileName.replace(/\.tsx?$/,'.cjs'));fs.writeFileSync(modulePath,result.outputText);return{module:require(modulePath),dir}}

const formatCompiled=compile(formatSource,'format.ts');
try{
 assert.equal(formatCompiled.module.formatUvi(6.4),'6');
 assert.equal(formatCompiled.module.formatUvi(6.5),'7');
 assert.equal(formatCompiled.module.formatUvi(-.2),'0');
 assert.equal(formatCompiled.module.formatUvi(Number.NaN),'–');
}finally{fs.rmSync(formatCompiled.dir,{recursive:true,force:true})}

const fusionCompiled=compile(inlineSunshineDurationContract(fusionSource),'forecastFusion.ts',[
 ["import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used in regression')};"],
 ["import {reconcileForecastPrecipitation} from './precipitation';","const reconcileForecastPrecipitation=input=>({precipitation:Math.max(0,Number(input.precipitation)||0),rain:Math.max(0,Number(input.rain)||0),showers:Math.max(0,Number(input.showers)||0),snowfall:Math.max(0,Number(input.snowfall)||0),probability:Math.max(0,Math.min(100,Number(input.probability)||0)),code:Math.round(Number(input.code)||0),traceSuppressed:false});"],
 ["import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';","const readStoredJsonCache=()=>undefined;const writeStoredJsonCache=()=>false;"],
 ["import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'']
]);
try{
 const dryMedium={source:'dwd',coverage:true,quality:'medium',radarProbability:0,currentRate:0,peakRate:0};
 const blend=fusionCompiled.module.dryRadarNowcastProbability(12,dryMedium,0);
 assert.ok(blend,'mittleres trockenes Radar muss einen Blend liefern');
 assert.equal(blend.radarWeight,.82);
 assert.ok(Math.abs(blend.probability-2.16)<.001,`unerwartete trockene Wahrscheinlichkeit: ${blend.probability}`);
 const dryHigh=fusionCompiled.module.dryRadarNowcastProbability(20,{...dryMedium,quality:'high'},0);
 assert.equal(dryHigh.radarWeight,.94);
 assert.ok(dryHigh.probability<=1.21);
 const approaching=fusionCompiled.module.dryRadarNowcastProbability(12,{...dryMedium,arrivalMinutes:30},0);
 assert.equal(approaching,null,'belastbare Radarankunft darf nicht als niederschlagsfreier Radarbefund unterdrückt werden');
}finally{fs.rmSync(fusionCompiled.dir,{recursive:true,force:true})}

console.log('UVI-Ganzzahlformat und konsistente Radar-Nowcast-Wahrscheinlichkeit ab v0.8.33.5 geprüft.');
