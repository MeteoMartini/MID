import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript-strada';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const source=await read('src/extremeWeatherOutlook.ts');
const panel=await read('src/ExtremeWeatherOutlookPanel.tsx');
const pkg=JSON.parse(await read('package.json'));
const baseline=JSON.parse(await read('MID_BASELINE.json'));
const test='scripts/test-extreme-outlook-module-recovery-0985296.mjs';
assert.match(pkg.version,/^0\.9\.85\.\d+$/);
assert.ok(Number(pkg.version.split('.').at(-1))>=296);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),test+' fehlt in '+key);
assert.ok(panel.includes('isExtremeChunkLoadError(error)')&&panel.includes('window.location.reload()'),'Explizite Wiederherstellung fehlt');
assert.ok(panel.includes('previewExtremeWeatherOutlook(range)')&&panel.includes('setSlowStart(true)'),'Sichtbarer Cache-Kaltstart mit begrenztem Wartezustand fehlt');
assert.ok(source.includes('age<=maxAgeMs')&&source.includes('SHORT_WORKER_TIMEOUT_MS=18000'),'Berechnungszeit und kurzes Worker-Zeitfenster fehlen');
assert.ok(source.includes('validExtendedOutlook(data)')&&!source.includes("import('./extremeWeatherOutlookExtendedFallback')"),'Worker muss unabhängig vom Zusatzmodul starten');

// Run the real loader code after replacing only the two service interfaces and
// the optional dynamic import; TypeScript transpilation leaves all weather logic intact.
const executable=source
 .replace("import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';",
  "const readStoredJsonCache=globalThis.__midTestCacheRead,writeStoredJsonCache=globalThis.__midTestCacheWrite;")
 .replace("import {fetchWorkerJson} from './workerClient';",
  "const fetchWorkerJson=globalThis.__midTestFetchWorker;")
 .replaceAll("await import('./extremeWeatherOutlookDirect.generated.js')",
  "await globalThis.__midTestDirectImport()");
const js=ts.transpileModule(executable,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
assert.ok(!js.includes("from './workerClient'")&&!js.includes("from './cachePolicy'"));
assert.ok(!js.includes("import('./extremeWeatherOutlookDirect.generated.js')"),'Beide optionalen Diensteinstiege müssen über denselben kontrollierten Import-Mock laufen');
const saved={storage:globalThis.localStorage,fetch:globalThis.__midTestFetchWorker,importer:globalThis.__midTestDirectImport,read:globalThis.__midTestCacheRead,write:globalThis.__midTestCacheWrite};
const dataMap=new Map();
const storage={
 get length(){return dataMap.size},
 key(i){return [...dataMap.keys()][i]??null},
 getItem(key){return dataMap.get(key)??null},
 setItem(key,value){dataMap.set(key,String(value))},
 removeItem(key){dataMap.delete(key)}
};
globalThis.localStorage=storage;
globalThis.__midTestCacheRead=(s,k,ttl)=>{
 const entry=JSON.parse(s.getItem(k)||'null');
 return entry&&Number.isFinite(entry.at)&&Date.now()-entry.at<=ttl?entry.value:undefined;
};
globalThis.__midTestCacheWrite=(s,k,v)=>{s.setItem(k,JSON.stringify({at:Date.now(),value:v}));return true};
let calls=0,imports=0,workerResult,workerError,importError,directResult;
globalThis.__midTestFetchWorker=async()=>{calls++;if(workerError)throw workerError;return workerResult};
globalThis.__midTestDirectImport=async()=>{imports++;if(importError)throw importError;return{loadDirectDachExtendedExtremeOutlook:async()=>directResult,loadDirectDachExtremeOutlook:async()=>directResult}};
const dates=[48,72,96,120,144,168],ids=['48-72','72-96','96-120','120-144','144-168'];
const base=Date.parse('2026-10-18T00:00:00Z');
const periods=ids.map((id,i)=>({id,label:id,startHour:dates[i],endHour:dates[i+1],start:new Date(base+dates[i]*3600000).toISOString(),end:new Date(base+dates[i+1]*3600000).toISOString()}));
const forecast=()=>({scope:'Mitteleuropa',provider:'MID',model:'ICON-EPS',checkedAt:new Date().toISOString(),officialWarning:false,periods,cells:[{id:'x',row:0,col:0,lat:50,lon:8,region:'Test',elevationM:90,periods:Object.fromEntries(ids.map(id=>[id,{hazards:{}}]))}],grid:{rows:6,cols:10,latStep:1,lonStep:1,pointCount:1,bounds:{west:-3.85,east:20.21,south:43.18,north:58}},thresholds:{probability:{overviewMin:40,hazardMin:10,extremeExceptionMin:2,bands:[]}},quality:{ensembleMembers:40,probabilityMethod:'EPS',modelResolution:'regional',displayGrid:'regional',dataCoveragePct:100,diagnosticCoveragePct:0,limitations:[]}});
let module;
try{
 module=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 workerResult=forecast();
 let result=await module.loadExtendedExtremeWeatherOutlook();
 assert.equal(result.delivery,'worker');assert.equal(calls,1);assert.equal(imports,0,'Worker darf keinen Direkt-Chunk importieren');
 result=await module.loadExtendedExtremeWeatherOutlook();
 assert.equal(result.delivery,'local-cache');assert.equal(calls,1,'Frischer Cache vermeidet Worker-Doppelabruf');
 dataMap.clear();calls=0;imports=0;
 workerResult={...forecast(),periods:[periods[0]]};
 result=await module.loadExtendedExtremeWeatherOutlook();
 assert.equal(result.delivery,'worker','Ein lückenloser echter Tag-3-Teilhorizont ist ein gültiger Worker-Ausblick.');
 assert.equal(calls,1);assert.equal(imports,0,'Ein gültiger Teilhorizont darf keinen unnötigen Direktabruf verursachen.');
 dataMap.clear();calls=0;imports=0;
 workerResult={...forecast(),periods:[periods[1]]};
 directResult=forecast();
 result=await module.loadExtendedExtremeWeatherOutlook();
 assert.equal(result.delivery,'browser-direct','Ein ohne Tag 3 beginnender Abschnitt ist kein gültiger zusammenhängender Teilhorizont.');
 assert.equal(calls,1);assert.equal(imports,1,'Ungültige Worker-Daten aktivieren genau einen Direktversuch');
 dataMap.clear();calls=0;imports=0;workerError=new Error('Worker offline');importError=new TypeError('Importing a module script failed.');
 await assert.rejects(()=>module.loadExtendedExtremeWeatherOutlook(),error=>module.isExtremeChunkLoadError(error)&&/App einmal neu laden/.test(error.message));
 assert.equal(calls,1);assert.equal(imports,1,'Kein erneuter Import in Fehler-Schleife');
 dataMap.set('mid:extreme-outlook:extended-payload:v4',JSON.stringify({at:Date.now()-4*3600000,value:forecast()}));
 result=await module.loadExtendedExtremeWeatherOutlook();
 assert.equal(result.delivery,'local-cache');assert.equal(result.stale,true);
 assert.ok(result.staleReason?.length>20);assert.equal(result.officialWarning,false);
 dataMap.clear();
 const importsBeforeAbort=imports;
 const aborted=new AbortController();aborted.abort();
 await assert.rejects(()=>module.loadExtendedExtremeWeatherOutlook(aborted.signal),error=>error?.name==='AbortError');
 assert.equal(imports,importsBeforeAbort,'Abbruch darf keine weiteren Importe erzeugen');
 dataMap.clear();workerError=undefined;importError=undefined;calls=0;imports=0;
 storage.setItem('mid:extreme-outlook:worker-limit-until:v1',String(Date.now()+3600000));directResult=forecast();
 result=await module.loadExtendedExtremeWeatherOutlook();
 assert.equal(result.delivery,'browser-direct');assert.equal(calls,0,'Bekanntes Tageslimit überspringt Worker');
 assert.equal(imports,1);
 // Malformed fresh cache entries must be rejected without throwing outside
 // the loader's recovery path; the next valid worker response remains usable.
 for(const corrupt of [
  data=>({...data,periods:[null,...data.periods.slice(1)]}),
  data=>({...data,periods:data.periods.map((p,i)=>i===2?{...p,start:new Date(Date.parse(p.start)+3600000).toISOString(),end:new Date(Date.parse(p.end)+3600000).toISOString()}:p)}),
  data=>({...data,cells:data.cells.map(cell=>({...cell,periods:{...cell.periods,'48-72':{hazards:null}}}))}),
  data=>({...data,cells:data.cells.map(cell=>({...cell,periods:{...cell.periods,'48-72':{hazards:[]}}}))}),
 ]){
  dataMap.clear();calls=0;imports=0;workerError=undefined;workerResult=forecast();
  storage.setItem('mid:extreme-outlook:extended-payload:v4',JSON.stringify({at:Date.now(),value:corrupt(forecast())}));
  result=await module.loadExtendedExtremeWeatherOutlook();
  assert.equal(result.delivery,'worker');assert.equal(calls,1);assert.equal(imports,0);
 }
 // Short range: cached forecasts display immediately but do not acquire a fresh status from a new storage timestamp.
 dataMap.clear();workerError=undefined;importError=undefined;calls=0;imports=0;workerResult=forecast();
 let shortResult=await module.loadExtremeWeatherOutlook();
 assert.equal(shortResult.delivery,'worker');assert.equal(calls,1);assert.equal(imports,0);
 assert.equal(module.previewExtremeWeatherOutlook('short')?.delivery,'local-cache');
 dataMap.clear();calls=0;imports=0;workerError=new Error('Zeitüberschreitung beim MID-Datendienst');directResult=forecast();
 shortResult=await module.loadExtremeWeatherOutlook();
 assert.equal(shortResult.delivery,'browser-direct');assert.match(shortResult.fallbackReason,/Zeitfenster überschritten/);assert.equal(calls,1);assert.equal(imports,1);
 const oldShort={...forecast(),checkedAt:new Date(Date.now()-21*60*1000).toISOString()};
 dataMap.clear();storage.setItem('mid:extreme-outlook:payload:v6',JSON.stringify({at:Date.now(),value:oldShort}));
 assert.equal(module.previewExtremeWeatherOutlook('short')?.stale,true,'Cache-Schreibzeit ist keine Prognosefrische');
 workerError=undefined;workerResult=forecast();calls=0;imports=0;
 shortResult=await module.loadExtremeWeatherOutlook();
 assert.equal(shortResult.delivery,'worker');assert.equal(calls,1,'20-Minuten-alter Modellstand erfordert Wiedervalidierung');
 console.log('MID .476: Kurzfrist-Vorschau, Frischevertrag und Fallback geprüft; bisherige .296-Regression bleibt bestehen.');
}finally{
 for(const [k,v] of Object.entries({localStorage:saved.storage,__midTestFetchWorker:saved.fetch,__midTestDirectImport:saved.importer,__midTestCacheRead:saved.read,__midTestCacheWrite:saved.write})){if(v===undefined)delete globalThis[k];else globalThis[k]=v}
}
