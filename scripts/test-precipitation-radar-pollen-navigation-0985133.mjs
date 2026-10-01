import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const precipitationSource=readFileSync(new URL('../src/precipitation.ts',import.meta.url),'utf8');
const appSource=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const pollenSource=readFileSync(new URL('../src/PollenForecast.tsx',import.meta.url),'utf8');
const radarWorker=readFileSync(new URL('../worker-src/10-radar-nowcast.js',import.meta.url),'utf8');
const workerCore=readFileSync(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8');

assert.ok(precipitationSource.includes('precipitationSampleIntervalSeconds(h)/3600'),'Sprühregen-Plausibilität muss die tatsächliche Intervalllänge berücksichtigen.');
assert.ok(precipitationSource.includes("rate<=.5&&showerRate<.08"),'Sprühregen darf nur bei schwachem stratiformem Niederschlag bestehen bleiben.');
assert.ok(appSource.includes('canonicalPrecipitationTimeline(minutes,hours,now,24)'),'Aktuell und 24-h-Profil brauchen denselben 24-h-Niederschlagshorizont.');
assert.ok(appSource.includes('periods=timeline.periods.filter')&&appSource.includes('last=periods.at(-1)!'),'Fortsetzungstext muss alle relevanten Niederschlagsphasen statt nur der ersten berücksichtigen.');
assert.ok(radarWorker.includes("rateSource:'missing',dataAvailable:false"),'Fehlende DWD-RV-Zeitschritte müssen explizit als Datenlücke erhalten bleiben.');
assert.ok(radarWorker.includes("hitClass:!available?'missing'"),'Radar-Datenlücke darf nicht als trocken klassifiziert werden.');
assert.ok(appSource.includes("DWD-RV-Datenlücke · keine Trockenmeldung")&&appSource.includes('radar-nowcast-missing'),'Die sichtbare Radar-Zeitachse muss Datenlücken von Trockenphasen unterscheiden.');
assert.ok(pollenSource.includes("allDates.filter(date=>date>=todayKey).slice(0,3)"),'Pollenflug darf gestrige DWD-Zeilen nicht als heutige Prognose verwenden.');
assert.ok(pollenSource.includes("todayDate=forecastDates.find(date=>date===todayKey)"),'Heute muss kalendarisch bestimmt werden, nicht über den ersten WFS-Datensatz.');
assert.ok(pollenSource.includes("productUpdatedAt")&&workerCore.includes("productUpdatedAt"),'Pollenanzeige muss den DWD-Produktstand statt nur den Abrufzeitpunkt ausweisen können.');
assert.ok(appSource.includes("section&&(!area||primaryNavigationAreaForSection(section)===area)"),'Primärbereich muss beim Neustart einen widersprüchlichen alten Untermodulwert überstimmen.');
assert.ok(appSource.includes("!MODERN_FORECAST_MODULES.includes(active as DashboardModuleId)"),'Späte Forecast-Horizon-Ereignisse dürfen Aktuell/Karten/Mehr nicht überschreiben.');

const require=createRequire(import.meta.url),ts=require('typescript-strada');
const transpiled=ts.transpileModule(precipitationSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},fileName:'precipitation.ts'}).outputText;
const temp=mkdtempSync(join(tmpdir(),'mid-precip-character-')),modulePath=join(temp,'precipitation.mjs');writeFileSync(modulePath,transpiled);
try{
 const mod=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const start=Date.UTC(2026,9,1,7,30),end=start+15*60*1000;
 const base={epoch:start,time:'2026-10-01T09:30',precipitationIntervalStartEpoch:start,precipitationIntervalEndEpoch:end,precipitation:.6,rain:.6,showers:0,snowfall:0,probability:98,code:51,temperature:18,dewPoint:17,humidity:97,cloud:100,lowCloud:100,isDay:true};
 const stratiform=mod.precipitationParts(base);
 assert.notEqual(stratiform.type,'drizzle','0,6 mm in 15 min (=2,4 mm/h) darf nicht als Sprühregen fortgeschrieben werden.');
 assert.notEqual(stratiform.intensity,'light','2,4 mm/h darf nicht als leichter Niederschlag klassifiziert werden.');
 const showery=mod.precipitationParts({...base,rain:0,showers:.6,code:51});
 assert.equal(showery.type,'showers','Expliziter Schaueranteil muss einen widersprüchlichen schwachen Sprühregen-Code überstimmen.');
}finally{rmSync(temp,{recursive:true,force:true})}

console.log('MID v0.9.85.133: Radar-Datenlücken, 24-h-Niederschlagsphasen, Intervallintensität, Pollen-Datum und Startnavigation konsistent.');
