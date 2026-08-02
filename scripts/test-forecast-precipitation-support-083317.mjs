import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url),precipitation=await readFile(new URL('src/precipitation.ts',root),'utf8'),fusion=await readFile(new URL('src/forecastFusion.ts',root),'utf8'),app=await readFile(new URL('src/App.tsx',root),'utf8'),worker=await readFile(new URL('worker/metar-proxy.js',root),'utf8');
for(const token of ['UNSUPPORTED_FORECAST_MAX_PROBABILITY=5','WEAK_FORECAST_AMOUNT_MAX_MM=.35','deterministicSignalMinimumProbability','weak-distant-signal','sky-contradiction'])assert.ok(precipitation.includes(token),`fehlender zentraler Niederschlagsvertrag: ${token}`);
for(const token of ['weatherHours?:ForecastWeatherBundleHour[]','weatherBundleKind:repaired?\'coherent-model\':\'best-match\'','Eine Tagesaggregation darf keine bislang nicht vorhandene Niederschlagsstunde','const normalized=hours.map(reconcileForecastHourPrecipitation)'])assert.ok(fusion.includes(token),`fehlender kohärenter Stundenvertrag: ${token}`);
assert.ok(!fusion.includes('distributeDailyPrecipitationDeficit'),'Tagesmengen dürfen nicht mehr zu Stunden umverteilt werden');
for(const token of ["case'current':return <MemoCurrent key={id} w={w!} hours={displayHours}","case'water':return currentFavorite?.water.enabled?",'weather={w!} hours={displayHours} unit={unit}','combineThunderstormInformation(thunderAnalysis,displayHours,radarAnalysis'])assert.ok(app.includes(token),`Sektion nutzt nicht die final reconcilierten Stunden: ${token}`);
for(const token of ['supportMinimum=lead<=24?10:lead<=72?15:20','FORECAST_FUSION_HOURLY','weatherHours','MOSMIX wird bewusst nur als lokales Postprocessing'])assert.ok(worker.includes(token),`Worker-Vertrag fehlt: ${token}`);

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const dir=await mkdtemp(join(tmpdir(),'mid-083317-'));
try{
 const out=ts.transpileModule(precipitation,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'precipitation.ts',reportDiagnostics:true}),diagnostics=(out.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
 const modulePath=join(dir,'precipitation.mjs');await writeFile(modulePath,out.outputText);const {reconcileForecastPrecipitation}=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 for(const amount of [.1,.4,6.4]){const result=reconcileForecastPrecipitation({precipitation:amount,rain:amount,probability:0,code:61,cloud:90,leadHours:120});assert.equal(result.precipitation,0,`${amount} mm bei 0 % darf nicht sichtbar bleiben`)}
 const distantWeak=reconcileForecastPrecipitation({precipitation:.1,rain:.1,probability:10,code:61,cloud:45,lowCloud:10,cape:50,sunshineDuration:2600,isDay:true,leadHours:120});
 assert.equal(distantWeak.precipitation,0,'0,1 mm bei 10 % in Tag 5 bleibt nur als Wahrscheinlichkeit sichtbar');assert.equal(distantWeak.probability,10);
 const distantDaily=reconcileForecastPrecipitation({precipitation:.3,rain:.3,probability:13,code:61,cloud:40,lowCloud:10,cape:40,sunshineDuration:2500,isDay:true,leadHours:120});assert.equal(distantDaily.precipitation,0,'0,3 mm bei 13 % in Tag 5 ist kein belastbarer deterministischer Tagesniederschlag');
 const supportedShower=reconcileForecastPrecipitation({precipitation:.4,rain:.4,probability:35,code:61,cloud:55,lowCloud:15,cape:350,sunshineDuration:1800,isDay:true,leadHours:96});assert.equal(supportedShower.precipitation,.4);assert.ok([80,81,82].includes(supportedShower.code),'bei sonnigen Auflockerungen und Konvektion wird stratiformer Regen zu Schauer korrigiert');assert.ok(supportedShower.showers>0&&supportedShower.rain===0);
 const stratiform=reconcileForecastPrecipitation({precipitation:.4,rain:.4,probability:35,code:61,cloud:95,lowCloud:85,humidity:94,sunshineDuration:0,isDay:true,leadHours:96});assert.equal(stratiform.code,61,'geschlossene tiefe Bewölkung trägt ein Regen-Signal');
}finally{await rm(dir,{recursive:true,force:true})}
console.log('Finale Niederschlagsunterstützung geprüft: horizonabhängige Stützung, physikalische Regen-/Schauerprüfung, kohärente Modellbündel und keine Tages-zu-Stunden-Erfindung.');
