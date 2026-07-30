import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const [weather,app,pkg,baseline,audit]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_QUALITY_AUDIT_0.8.20.0.md',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'function equivalentStationCandidate(',
 'separation<=2000',
 'function mergeEquivalentStationCandidates(',
 'function residualCircularField(',
 'function reconcileThermodynamics(',
 'validateWindPair(Number(rawWind),Number(rawGust))',
 "ranked.filter(authoritative),'ceilingHft'",
 "residualField(ranked,backgrounds,target,'visibility','visibility'",
 "residualField(ranked,backgrounds,target,'cloudCover','cloudCover'",
 'workerStationsAvailable=workerBaseCandidates(\'metar\').length>0',
 'if(!workerStationsAvailable&&inGermany)tasks.push(brightSkyStation'
])need('Hyperlokale Qualitätslogik',weather,token);
for(const token of ['function stationNeedsEnrichment(', 'if(stationNeedsEnrichment(value))'])need('Abrufbudget',app,token);
for(const token of ['SFTP, HTTPS und SOAP', 'Kein Scraping von LINET view', 'direkter DWD-Open-Data-Fallback', 'Quellenregister zentralisieren'])need('Audit',audit,token);
need('Package-Test',pkg,'test:hyperlocal-quality-audit');
need('Baseline-Test',baseline,'scripts/test-hyperlocal-quality-audit-08200.mjs');

function extractFunction(source,name){
 const start=source.indexOf(`function ${name}(`);if(start<0)throw new Error(`${name} nicht gefunden`);
 const brace=source.indexOf('{',start);let depth=0,quote='',escaped=false;
 for(let index=brace;index<source.length;index++){
  const char=source[index];
  if(quote){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote='';continue}
  if(char==='"'||char==="'"||char==='`'){quote=char;continue}
  if(char==='{')depth++;else if(char==='}'&&--depth===0)return source.slice(start,index+1);
 }
 throw new Error(`${name} unvollständig`);
}

try{
 const source=`
 type Station=Record<string,any>;
 const clampNumber=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
 const normalizeStationTimestamp=(value:any)=>{if(value===undefined||value===null||value==='')return undefined;const date=new Date(value);return Number.isFinite(date.getTime())?date.toISOString():undefined};
 const haversine=(lat1:number,lon1:number,lat2:number,lon2:number)=>{const r=6371000,toRad=(x:number)=>x*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(a))};
 ${extractFunction(weather,'stationObservationEpoch')}
 ${extractFunction(weather,'equivalentStationCandidate')}
 ${extractFunction(weather,'angularDifference')}
 ${extractFunction(weather,'humidityFromTemperatureAndDewPoint')}
 ${extractFunction(weather,'dewPointFromTemperatureAndHumidity')}
 ${extractFunction(weather,'reconcileThermodynamics')}
 ${extractFunction(app,'stationNeedsEnrichment')}
 export {equivalentStationCandidate,angularDifference,reconcileThermodynamics,stationNeedsEnrichment};`;
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'hyperlocal-quality-audit.ts'});
 if(compiled.diagnostics?.length)failures.push('Dynamische Qualitätsfunktionen konnten nicht transpiliert werden.');
 else{
  const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`),now=new Date().toISOString();
  const nearA={stationId:'EDDG',provider:'METAR',latitude:52.1346,longitude:7.6848,height:48,timestamp:now,temperature:18},nearB={stationId:'EDDG',provider:'DWD',latitude:52.135,longitude:7.685,height:50,timestamp:now,temperature:18.4};
  if(!module.equivalentStationCandidate(nearA,nearB))failures.push('Nahe Aliasstationen werden nicht erkannt.');
  if(module.equivalentStationCandidate(nearA,{...nearB,latitude:48.35,longitude:11.78}))failures.push('Entfernte Stationen mit gleicher Kennung werden fälschlich zusammengeführt.');
  if(Math.abs(module.angularDifference(5,355)-10)>.001||Math.abs(module.angularDifference(355,5)+10)>.001)failures.push('360°-Windrichtungsdifferenz ist fehlerhaft.');
  const thermo=module.reconcileThermodynamics(20,95,24);if(!(thermo.dewPoint<=20&&thermo.humidity>=0&&thermo.humidity<=100))failures.push('Thermodynamische Endkontrolle ist fehlerhaft.');
  if(module.stationNeedsEnrichment({candidateCount:6,sourceProviders:['A','B'],uncertainty:.7,effectiveResolutionKm:12})!==false)failures.push('Gute Stationsanalyse löst unnötige Anreicherung aus.');
  if(module.stationNeedsEnrichment({candidateCount:2,sourceProviders:['A'],uncertainty:2,effectiveResolutionKm:42})!==true)failures.push('Schwache Stationsanalyse löst keine Anreicherung aus.');
 }
}catch(error){failures.push(error instanceof Error?error.message:String(error))}

if(failures.length){console.error('Hyperlokale Qualitäts-/Quellenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Hyperlokale Qualitätsprüfung bestanden: physische Stationsentdopplung, zirkuläre Windrichtung, thermodynamische Konsistenz, sensible Quellenfilter und bedarfsgesteuerte Anreicherung sind geschützt.');
