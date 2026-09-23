import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript-strada');
const root=new URL('../',import.meta.url);
const [weather,fusion,periods,seven,portal,app,worker,versionSource,pkgSource]=await Promise.all([
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/forecastFusion.ts',root),'utf8'),
 readFile(new URL('src/forecastPeriods.ts',root),'utf8'),
 readFile(new URL('src/SevenDayForecastSummary.tsx',root),'utf8'),
 readFile(new URL('src/AppPortalPopover.tsx',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
 readFile(new URL('src/version.ts',root),'utf8'),
 readFile(new URL('package.json',root),'utf8')
]);
assert.ok(weather.includes("mid:forecast-core:v4:"),'Forecast-Core-Cachevertrag wurde nicht versioniert.');
assert.ok(weather.includes('forecastCoreDimensionSuffix(options)'),'Frontend-Cache enthält keine Höhen-/Zeitzonendimension.');
assert.ok(weather.includes("query.set('elevation',String(dimensions.elevation))"),'Direktabruf übernimmt die angeforderte Höhe nicht.');
assert.ok(weather.includes('timezone:dimensions.timeZone'),'Direktabruf übernimmt die effektive Zeitzone nicht.');
assert.ok(weather.includes('forecast-core:v4:'),'Worker-Request-Cachekey ist nicht dimensionsgebunden.');
assert.ok(!weather.includes('legacy.value,legacy.time'),'Unsichere Legacy-Cachemigration ist weiterhin aktiv.');
assert.ok(worker.includes("CORE_FORECAST_EDGE_CACHE_VERSION='v3'"),'Worker-Edge-Cachevertrag wurde nicht versioniert.');
assert.ok(worker.includes('/e\${elevationKey}/tz\${timeZoneKey}'),'Worker-Edge-Cache trennt Höhe und Zeitzone nicht.');
assert.ok(worker.includes('timezone:timeZone'),'Worker reicht die angeforderte Zeitzone nicht an Open-Meteo weiter.');
assert.ok(worker.includes("query.set('elevation',String(elevation))"),'Worker reicht die angeforderte Höhe nicht an Open-Meteo weiter.');
assert.ok(fusion.includes("mid:forecast-fusion:v10:"),'Forecast-Fusion-Cache wurde nicht nach Höhe getrennt.');
assert.ok(fusion.includes('cacheKey(lat,lon,elevation)'),'Forecast-Fusion-Key enthält die Höhe nicht.');
assert.ok(fusion.includes('localForecastDayReferenceEpoch(relevant)-now'),'Tages-Reconciliation verwendet keine reale lokale Stundenepoche.');
assert.ok(fusion.includes('applyForecastFusionDayRows(baseDays:Day[],rows:ForecastFusionDay[]|undefined,active:boolean,hours:Hour[]=[]')),'Tagesfusion erhält keine lokalen Stundenepochen.');
assert.ok(!fusion.includes('Date.parse(\`\${day.date}T12:00:00Z\`)'),'Forecast-Fusion enthält weiterhin einen festen UTC-Mittagsanker.');
assert.ok(!periods.includes('setUTCDate(')&&!periods.includes('T12:00:00Z'),'Zivile Prognosedatumsarithmetik hängt weiterhin von UTC-Date-Arithmetik ab.');
assert.ok(seven.includes('addForecastDays(candidate.day.date,1)'),'7-Tage-Folgenacht nutzt nicht die gemeinsame lokale Kalenderarithmetik.');
assert.ok(!seven.includes('nextDate.setUTCDate'),'7-Tage-Folgenacht enthält weiterhin setUTCDate.');
assert.ok(portal.includes('appFocusLayerStack'),'Gemeinsamer Fokusstack fehlt.');
assert.ok(portal.includes("event.key!=='Tab'"),'Tab-/Shift-Tab-Fokusfang fehlt.');
assert.ok(portal.includes('trigger?.isConnected'),'Fokus-Rückgabe zum Trigger fehlt.');
assert.ok(portal.includes('appLayerIsTop(layer)'),'Verschachtelte Ebenen sind nicht top-layer-gebunden.');
for(const token of ['useAppLayerFocus(drawerOpen','useAppLayerFocus(open,popoverRef','useAppLayerFocus(open,dialogRef'])assert.ok(app.includes(token),`Direkter App-Dialog fehlt im Fokusvertrag: ${token}`);
assert.ok(app.includes('applyForecastFusionDays(days,forecastFusion,hours)'),'App übergibt Tagesfusion keine lokalen Stundenepochen.');
assert.equal(JSON.parse(pkgSource).version,'0.9.85.97');
assert.ok(versionSource.includes('0.9.85.97'));
const dir=await mkdtemp(join(tmpdir(),'mid-098597-'));
try{
 const source=periods.replace(/^import .*;\n/gm,'');
 const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'forecastPeriods.ts'}).outputText;
 const file=join(dir,'forecastPeriods.mjs');await writeFile(file,out);
 const mod=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 assert.equal(mod.addForecastDays('2026-03-28',1),'2026-03-29','CET→CEST-Kalendertag fehlerhaft.');
 assert.equal(mod.addForecastDays('2026-10-24',1),'2026-10-25','CEST→CET-Kalendertag fehlerhaft.');
 assert.equal(mod.addForecastDays('2028-02-28',1),'2028-02-29','Schaltjahr fehlerhaft.');
 assert.equal(mod.addForecastDays('2026-12-31',1),'2027-01-01','Jahresgrenze fehlerhaft.');
 assert.equal(mod.addForecastDays('2026-01-01',-1),'2025-12-31','Rückwärtsgrenze fehlerhaft.');
}finally{await rm(dir,{recursive:true,force:true})}
for(const zone of ['Europe/Berlin','America/Los_Angeles','Pacific/Kiritimati'])assert.doesNotThrow(()=>new Intl.DateTimeFormat('en',{timeZone:zone}).format(new Date('2026-09-24T00:00:00Z')));
console.log('MID 18.2.10 Replit-Audit-Fixes geprüft: Cache-Dimensionen, Fokusstack und lokale Tages-/Lead-Zeitbasis sind regressionsgeschützt.');
