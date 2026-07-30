import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const [quality,weather,workerClient,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/sourceQuality.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/workerClient.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'export function sourcePolicyFor(',
 'export function fieldWeightPolicy(',
 'export function fieldSiteCompatibility(',
 'export function precipitationIntervalMinutes(',
 'export function normalisePrecipitationAccumulation(',
 'sensitiveAllowed:false',
 'GENERIC_OFFICIAL'
])need('Quellenregister',quality,token);
for(const token of [
 "fieldWeightPolicy(s.provider,s.networkClass,field)",
 'fieldSiteCompatibility(field,targetUrban,candidateSiteClass(s))',
 'normalisePrecipitationAccumulation(value,precipitationIntervalMinutes(',
 'const localBackgroundCache=new Map',
 'Date.now()-cached.at<=5*60000',
 'Date.now()-cached.at<=20*60000',
 'const stationAnalysisCache=new Map',
 'freshMs=fast?4*60000:6*60000',
 'staleFallback:true',
 'support=Math.min(.98',
 'maxAgeMs:fast?180000:300000',
 'staleIfErrorMs:fast?600000:1200000'
])need('Hyperlokale Performance/Genauigkeit',weather,token);
for(const token of [
 'maxAgeMs?:number',
 'staleIfErrorMs?:number',
 'const workerResponseCache=new Map',
 'const workerEndpointHealth=new Map',
 'function endpointBlocked(',
 'failures>=4?Date.now()+120000:failures>=2?Date.now()+30000:0',
 'function staleWorkerPayload<'
])need('Workerzugriff',workerClient,token);
for(const token of [
 'precipitationMinutes:w?.precipitation_10',
 'precipitationMinutes:10,provider:\'GeoSphere Austria / TAWES\'',
 'precipitationMinutes:60,provider:`Synoptic Data / MesoWest-MADIS',
 "'cache-control':'public, max-age=120, stale-while-revalidate=300'"
])need('Worker-Quellenvertrag',worker,token);
need('Package-Test',pkg,'test:source-quality-performance');
need('Baseline-Test',baseline,'scripts/test-source-quality-performance-08210.mjs');

try{
 const compiled=ts.transpileModule(quality,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'sourceQuality.ts'});
 if(compiled.diagnostics?.length)failures.push('Quellenregister konnte nicht transpiliert werden.');
 else{
  const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
  const dwd=module.sourcePolicyFor('DWD Open Data / Bright Sky','official'),generic=module.sourcePolicyFor('National Weather Service','official'),citizen=module.sourcePolicyFor('openSenseMap / senseBox','citizen'),wind=module.fieldWeightPolicy('DWD Open Data','official','windDirection'),temperature=module.fieldWeightPolicy('DWD Open Data','official','temperature');
  if(!dwd.sensitiveAllowed||citizen.sensitiveAllowed)failures.push('Sensible Felder sind nicht korrekt nach Quelle geschützt.');
  if(dwd.precipitationMinutes!==10||generic.precipitationMinutes!==60)failures.push('Explizite DWD- und generische amtliche Niederschlagsintervalle sind fehlerhaft.');
  if(!(wind.distanceScaleKm>temperature.distanceScaleKm))failures.push('Wind erhält keine größere räumliche Repräsentativität als Temperatur.');
  if(Math.abs(module.normalisePrecipitationAccumulation(1,10,60)-6)>.001)failures.push('10-Minuten-Niederschlag wird nicht korrekt auf 60 Minuten normalisiert.');
  if(Math.abs(module.fieldSiteCompatibility('temperature','urban','rural')-.72)>.001)failures.push('Standorttyp-Kompatibilität wird nicht korrekt gewichtet.');
 }
}catch(error){failures.push(error instanceof Error?error.message:String(error))}

if(failures.length){console.error('Quellen-/Performanceprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Quellenqualität und Abrufbudget geprüft: feldspezifische Gewichtung, Niederschlagsintervalle, Restfeld-Dämpfung, Kurzzeit-/Stale-Caches und Worker-Circuit-Breaker sind geschützt.');
