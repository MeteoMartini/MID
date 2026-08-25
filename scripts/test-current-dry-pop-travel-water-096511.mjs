import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve('.');
const [app,fusion,panel,travel,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/forecastFusion.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('src/travelPlanner.ts','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

// Aktuelle Niederschlagswahrscheinlichkeit: kein synthetischer 5-%-Boden.
assert.ok(app.includes("probability=maxProb<=5&&!continuation?0:Number(nearest.probability)||0"),'Trockene aktuelle Kurzfristlage wird nicht auf 0 % zurückgeführt.');
assert.ok(fusion.includes('safeModelProbability<=5&&radarProbability<=5?0:'),'Radar-/Modell-Trockenkonsens bis 5 % wird nicht auf 0 % gesetzt.');
assert.ok(fusion.includes('probability=safeModelProbability<=5?0:blendedProbability'),'Vollständig trockene Radarabdeckung behält einen künstlichen Restwert.');

// Reisewetter: erwartete Regentage werden nur in der Anzeige gerundet; interne Erwartungswerte bleiben kontinuierlich.
assert.ok(panel.includes('rund ${Math.round(active.summary.wetDaysExpected)} Tage mit ≥ 1 mm'),'Reiseplaner rundet erwartete Niederschlagstage nicht auf ganze Tage.');
assert.ok(travel.includes('const roundedWetDays=Math.round(summary.wetDaysExpected)'),'Reisenarrativ rundet Niederschlagstage nicht auf ganze Tage.');

// Küsten-Wassertemperatur: echte historische ERA5-SST statt aktuellem Marinewert.
for(const token of [
 "const WATER_CACHE_PREFIX='mid:travel-water-climate:1991-2020:v3:'",
 "const WATER_REFERENCE_YEARS=[1991,1995,1999,2003,2007,2011,2015,2020] as const",
 "hourly:'sea_surface_temperature'",
 "models:'era5_ocean'",
 "cell_selection:'sea'",
 'export async function fetchTravelWaterClimatology('
])assert.ok(travel.includes(token),`Klimatologische Wassertemperatur fehlt: ${token}`);
assert.ok(panel.includes('fetchTravelWaterClimatology(destination,active.start,active.end,controller.signal)'),'Reisezeitraum wird nicht an die SST-Klimatologie gebunden.');
assert.ok(!panel.includes('marineForecast('),'Reiseplaner verwendet wieder aktuelle Marine-Wassertemperaturen.');
assert.ok(!panel.includes('sea_surface_temperature_mean'),'Nicht unterstützte tägliche SST-Aggregation ist wieder aktiv.');
assert.ok(travel.includes("const MARINE_ARCHIVE_ENDPOINT='https://marine-api.open-meteo.com/v1/marine'"),'Historische SST wird nicht über die Marine API abgerufen.');
assert.ok(!travel.includes("payload=await fetchJson<HistoricalHourlyPayload>(`https://archive-api.open-meteo.com/v1/archive?${params}`)"),'SST wird weiterhin fälschlich über die atmosphärische Archive API abgefragt.');

// Aktuelle Warnlage bleibt streng an die Gültigkeitszeit gebunden: ein ab 23:00 gültiges Signal ist um 22:51 noch nicht aktuell.
assert.ok(app.includes('start<=now&&end>now'),'Warnkopf trennt zukünftige von aktuell gültigen Warnfenstern nicht mehr sauber.');

// Dynamischer SST-Test: kleine ERA5-SST-Ausschnitte aus gleichmäßig verteilten Referenzjahren, exakt auf den geplanten Kalenderzeitraum zugeschnitten.
const compileDir=await mkdtemp(path.join(tmpdir(),'mid-travel-water-'));
try{
 const compile=spawnSync('tsc',['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/travelPlanner.ts')],{cwd:root,encoding:'utf8'});
 assert.equal(compile.status,0,`TypeScript travelPlanner: ${compile.stdout||compile.stderr}`);
 const compiledPath=path.join(compileDir,'travelPlanner.js');
 const compiledSource=(await readFile(compiledPath,'utf8')).replace("from './cachePolicy'","from './cachePolicy.js'").replace("from './openMeteoGuard'","from './openMeteoGuard.js'");
 await writeFile(compiledPath,compiledSource);
 const module=await import(`${pathToFileURL(compiledPath).href}?v=${Date.now()}`);
 let fetchCount=0;const urls=[];
 globalThis.fetch=async url=>{
  fetchCount++;urls.push(String(url));const parsed=new URL(String(url)),start=String(parsed.searchParams.get('start_date')),end=String(parsed.searchParams.get('end_date')),time=[],sea_surface_temperature=[];
  for(let date=new Date(`${start}T12:00:00Z`),stop=new Date(`${end}T12:00:00Z`);date<=stop;date.setUTCDate(date.getUTCDate()+1)){time.push(`${date.toISOString().slice(0,10)}T12:00`);sea_surface_temperature.push(25+date.getUTCMonth()*.05)}
  return{ok:true,status:200,json:async()=>({latitude:35.4,longitude:24.7,hourly:{time,sea_surface_temperature}})};
 };
 const water=await module.fetchTravelWaterClimatology({latitude:35.4,longitude:24.65},'2026-08-24','2026-08-30');
 assert.equal(fetchCount,8,'Küsten-SST soll aus acht kleinen, über 1991–2020 verteilten Referenzjahres-Ausschnitten entstehen.');
 assert.ok(urls.every(url=>new URL(url).hostname==='marine-api.open-meteo.com'),'SST-Klimatologie nutzt nicht durchgehend die historische Marine API.');
 assert.ok(urls.every(url=>url.includes('hourly=sea_surface_temperature')&&url.includes('models=era5_ocean')&&url.includes('cell_selection=sea')),'ERA5-Ocean-/SST-/Meeresgittervertrag fehlt in mindestens einem Referenzjahr.');
 assert.ok(urls.every(url=>/start_date=\d{4}-08-24/.test(url)&&/end_date=\d{4}-08-30/.test(url)),'SST-Abrufe sind nicht auf die Kalendertage des Reisezeitraums begrenzt.');
 assert.ok(water&&water.days===7&&/1991–2020/.test(water.referencePeriod)&&/8 Referenzjahre/.test(water.referencePeriod)&&water.temperature>25&&water.temperature<26,`Klimatologische SST für Reisezeitraum unplausibel: ${JSON.stringify(water)}`);
}finally{await rm(compileDir,{recursive:true,force:true})}

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-current-dry-pop-travel-water-096511.mjs';
const versionParts=String(pkg.version).split('.').map(Number);assert.ok(versionParts[0]>0||versionParts[1]>9||versionParts[2]>65||(versionParts[2]===65&&(versionParts[3]??0)>=11),`Version muss mindestens 0.9.65.11 sein: ${pkg.version}`);
assert.equal(baseline.releaseVersion,pkg.version,'Baseline-Version nicht synchron.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: trockener Nowcast 0 %, klimatologische ERA5-SST, ganze Niederschlagstage und zeitstrenger Warnkopf geprüft.`);
