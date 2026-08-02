import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const root=new URL('../',import.meta.url),files={
 precipitation:await readFile(new URL('src/precipitation.ts',root),'utf8'),
 weather:await readFile(new URL('src/weather.ts',root),'utf8'),
 fusion:await readFile(new URL('src/forecastFusion.ts',root),'utf8'),
 app:await readFile(new URL('src/App.tsx',root),'utf8'),
 shortTerm:await readFile(new URL('src/ShortTermForecast.tsx',root),'utf8'),
 worker:await readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 package:await readFile(new URL('package.json',root),'utf8')
};
const required={
 precipitation:['UNSUPPORTED_FORECAST_MAX_PROBABILITY=5','export function reconcileForecastPrecipitation'],
 weather:['mapHours(w:Weather)','mapMinutely15(w:Weather)','mapDays(w:Weather)','reconcileForecastPrecipitation({precipitation:n(w.hourly.precipitation','reconcileForecastPrecipitation({precipitation:n(m.precipitation','reconcileForecastPrecipitation({precipitation:n(w.daily.precipitation_sum'],
 fusion:["import {reconcileForecastPrecipitation} from './precipitation';",'function dryAdjustedHour','signal=reconcileForecastPrecipitation({...parts','reconcileForecastDaysWithHours','signal=reconcileForecastPrecipitation({precipitation,probability,code:day.code})'],
 app:['postProcessedHours=useMemo(()=>applyConvectiveNowcastHours','reconcileForecastPrecipitation({...hour,cloud:hour.cloud})','reconcileForecastHoursWithDays(temperatureObservedHours,baseDisplayDays)'],
 shortTerm:["import {precipitationParts,reconcileForecastPrecipitation} from './precipitation';",'signal=reconcileForecastPrecipitation({precipitation,rain:rawRain'],
 worker:['const FORECAST_PRECIPITATION_CODES=new Set','function reconcileForecastPrecipitation(amount,probability,code,cloud)','signal=reconcileForecastPrecipitation(at(hourly.precipitation','signal=reconcileForecastPrecipitation(at(daily.precipitation_sum','const signal=reconcileForecastPrecipitation(hourPrecip[index],hourProbability[index],3)'],
 package:['test:precip-probability-consistency']
};
for(const [name,tokens] of Object.entries(required))for(const token of tokens)assert.ok(files[name].includes(token),`${name}: fehlender Konsistenzvertrag ${token}`);

const dir=await mkdtemp(join(tmpdir(),'mid-083312-'));
try{
 const out=ts.transpileModule(files.precipitation,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'precipitation.ts',reportDiagnostics:true});
 const diagnostics=(out.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
 assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
 const modulePath=join(dir,'precipitation.mjs');await writeFile(modulePath,out.outputText);
 const {reconcileForecastPrecipitation}=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const tiny=reconcileForecastPrecipitation({precipitation:.1,rain:.1,showers:0,snowfall:0,probability:0,code:61,cloud:70});
 assert.deepEqual(tiny,{precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:2,traceSuppressed:true},'0,1 mm bei 0 % muss als ungestützter Trace verschwinden');
 const codeOnly=reconcileForecastPrecipitation({precipitation:0,probability:0,code:61,cloud:90});
 assert.equal(codeOnly.code,3,'reiner Regencode bei 0 % muss in den trockenen Himmelszustand zurückfallen');
 assert.equal(codeOnly.traceSuppressed,true);
 const supported=reconcileForecastPrecipitation({precipitation:.1,rain:.1,probability:6,code:61,cloud:70});
 assert.equal(supported.precipitation,.1,'ab 6 % darf der kleine deterministische Impuls nicht pauschal verworfen werden');
 assert.equal(supported.code,61);
 assert.equal(supported.traceSuppressed,false);
 const material=reconcileForecastPrecipitation({precipitation:.3,rain:.3,probability:0,code:61,cloud:70});
 assert.equal(material.precipitation,0,'auch größere deterministische Mengen dürfen bei 0–5 % nicht als Regen dargestellt werden');
 assert.equal(material.code,2);
 assert.equal(material.traceSuppressed,true);
 const fog=reconcileForecastPrecipitation({precipitation:.1,probability:0,code:48,cloud:100});
 assert.equal(fog.code,48,'Nebelcode darf durch die Niederschlagskonsistenz nicht entfernt werden');
}finally{await rm(dir,{recursive:true,force:true})}
console.log('Niederschlagskonsistenz geprüft: Forecast-Menge, Niederschlagscode und Wahrscheinlichkeit werden zentral gekoppelt; Signale bei 0–5 % werden unabhängig von ihrer Menge entfernt.');
