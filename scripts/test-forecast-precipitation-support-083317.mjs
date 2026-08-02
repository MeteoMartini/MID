import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url);
const precipitation=await readFile(new URL('src/precipitation.ts',root),'utf8');
const fusion=await readFile(new URL('src/forecastFusion.ts',root),'utf8');
const app=await readFile(new URL('src/App.tsx',root),'utf8');
const worker=await readFile(new URL('worker/metar-proxy.js',root),'utf8');

for(const token of [
 'UNSUPPORTED_FORECAST_MAX_PROBABILITY=5',
 'traceSuppressed=wetSignal&&probability<=UNSUPPORTED_FORECAST_MAX_PROBABILITY'
])assert.ok(precipitation.includes(token),`fehlender zentraler Niederschlagsvertrag: ${token}`);
assert.ok(!precipitation.includes('tinySignal='),'die finale Konsistenz darf nicht mehr nur kleine Mengen erfassen');

for(const token of [
 '.filter(item=>item.probability>=supportThreshold)',
 'function reconcileForecastHourPrecipitation(hour:Hour)',
 'const normalized=hours.map(reconcileForecastHourPrecipitation)'
])assert.ok(fusion.includes(token),`fehlende finale Stundenkonsistenz: ${token}`);
assert.ok(!fusion.includes('.filter(item=>item.wet||item.probability>=supportThreshold)'),'ein nasser Code darf keine Tagesmenge ohne Stundenwahrscheinlichkeit anziehen');

for(const token of [
 "case'current':return <MemoCurrent key={id} w={w!} hours={displayHours}",
 "case'water':return currentFavorite?.water.enabled?",
 'weather={w!} hours={displayHours} unit={unit}',
 'combineThunderstormInformation(thunderAnalysis,displayHours,radarAnalysis'
])assert.ok(app.includes(token),`Sektion nutzt nicht die final reconcilierten Stunden: ${token}`);

assert.ok(worker.includes("traceSuppressed=(wetCode||precipitation>=.01)&&chance<=5"),'Worker muss dieselbe 0–5-%-Regel anwenden');
assert.ok(!worker.includes('precipitation<=.15&&chance<=5'),'Worker darf größere ungestützte Mengen nicht mehr durchlassen');

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const dir=await mkdtemp(join(tmpdir(),'mid-083317-'));
try{
 const out=ts.transpileModule(precipitation,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'precipitation.ts',reportDiagnostics:true});
 const diagnostics=(out.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
 assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
 const modulePath=join(dir,'precipitation.mjs');await writeFile(modulePath,out.outputText);
 const {reconcileForecastPrecipitation}=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 for(const amount of [.1,.4,6.4]){
  const result=reconcileForecastPrecipitation({precipitation:amount,rain:amount,probability:0,code:61,cloud:90});
  assert.equal(result.precipitation,0,`${amount} mm bei 0 % darf nicht sichtbar bleiben`);
  assert.equal(result.code,3,`${amount} mm bei 0 % muss in trockenen Himmelszustand zurückfallen`);
 }
 const boundary=reconcileForecastPrecipitation({precipitation:.4,rain:.4,probability:5,code:61,cloud:90});
 assert.equal(boundary.precipitation,0,'5 % bleibt unterhalb der belastbaren Darstellungsgrenze');
 const supported=reconcileForecastPrecipitation({precipitation:.4,rain:.4,probability:6,code:61,cloud:90});
 assert.equal(supported.precipitation,.4,'ab 6 % bleibt das deterministische Signal erhalten');
 assert.equal(supported.code,61);
}finally{await rm(dir,{recursive:true,force:true})}

console.log('Finale Niederschlagsunterstützung ab v0.8.33.17 geprüft: kein Forecast-Regen bei 0–5 %, keine Tagesmengenverteilung auf ungestützte Stunden und alle primären Sektionen nutzen dieselben finalen Stunden.');
