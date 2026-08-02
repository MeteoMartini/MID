import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const root=new URL('../',import.meta.url),files={precipitation:await readFile(new URL('src/precipitation.ts',root),'utf8'),weather:await readFile(new URL('src/weather.ts',root),'utf8'),fusion:await readFile(new URL('src/forecastFusion.ts',root),'utf8'),app:await readFile(new URL('src/App.tsx',root),'utf8'),shortTerm:await readFile(new URL('src/ShortTermForecast.tsx',root),'utf8'),worker:await readFile(new URL('worker/metar-proxy.js',root),'utf8'),package:await readFile(new URL('package.json',root),'utf8')};
const required={
 precipitation:['UNSUPPORTED_FORECAST_MAX_PROBABILITY=5','WEAK_FORECAST_AMOUNT_MAX_MM=.35','export function reconcileForecastPrecipitation','deterministicSignalMinimumProbability'],
 weather:['mapHours(w:Weather)','mapMinutely15(w:Weather)','mapDays(w:Weather)','leadHours:(epoch-Date.now())/3600000','sunshineDuration,weatherSourceId:\'best_match\''],
 fusion:["import {reconcileForecastPrecipitation} from './precipitation';",'function dryAdjustedHour','weatherHours?:ForecastWeatherBundleHour[]','dailyWeatherCodeFromHours','reconcileForecastDaysWithHours'],
 app:['postProcessedHours=useMemo(()=>applyConvectiveNowcastHours','reconcileForecastHoursWithDays(temperatureObservedHours,baseDisplayDays)','hour-tooltip-source'],
 shortTerm:["import {precipitationParts,reconcileForecastPrecipitation} from './precipitation';"],
 worker:['const FORECAST_PRECIPITATION_CODES=new Set','supportMinimum=lead<=24?10:lead<=72?15:20','FORECAST_FUSION_HOURLY','weatherHours'],
 package:['test:precip-probability-consistency']
};
for(const[name,tokens]of Object.entries(required))for(const token of tokens)assert.ok(files[name].includes(token),`${name}: fehlender Konsistenzvertrag ${token}`);
const dir=await mkdtemp(join(tmpdir(),'mid-083312-'));
try{
 const out=ts.transpileModule(files.precipitation,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'precipitation.ts',reportDiagnostics:true}),diagnostics=(out.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
 const modulePath=join(dir,'precipitation.mjs');await writeFile(modulePath,out.outputText);const {reconcileForecastPrecipitation}=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const tiny=reconcileForecastPrecipitation({precipitation:.1,rain:.1,probability:0,code:61,cloud:70,leadHours:1});assert.equal(tiny.precipitation,0);assert.equal(tiny.code,2);assert.equal(tiny.suppressionReason,'probability');
 const distant=reconcileForecastPrecipitation({precipitation:.1,rain:.1,probability:10,code:61,cloud:45,lowCloud:5,cape:20,sunshineDuration:2500,isDay:true,leadHours:120});assert.equal(distant.precipitation,0);assert.equal(distant.probability,10);assert.equal(distant.suppressionReason,'weak-distant-signal');
 const supported=reconcileForecastPrecipitation({precipitation:.4,rain:.4,probability:20,code:61,cloud:95,lowCloud:85,humidity:95,sunshineDuration:0,isDay:true,leadHours:120});assert.equal(supported.precipitation,.4);assert.equal(supported.code,61);assert.equal(supported.traceSuppressed,false);
 const shower=reconcileForecastPrecipitation({precipitation:.4,rain:.4,probability:35,code:61,cloud:55,lowCloud:10,cape:300,sunshineDuration:1800,isDay:true,leadHours:96});assert.ok([80,81,82].includes(shower.code));assert.equal(shower.rain,0);assert.ok(shower.showers>0);
 const fog=reconcileForecastPrecipitation({precipitation:.1,probability:0,code:48,cloud:100,leadHours:96});assert.equal(fog.code,48,'Nebelcode darf nicht entfernt werden');
}finally{await rm(dir,{recursive:true,force:true})}
console.log('Niederschlagskonsistenz geprüft: Wahrscheinlichkeit, Horizont, Bewölkung und Phase werden zentral gekoppelt; Rohwahrscheinlichkeiten bleiben ohne erfundene Stunden erhalten.');
