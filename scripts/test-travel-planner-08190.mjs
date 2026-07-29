import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [app,panel,logic,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/TravelPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/travelPlanner.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 "const LazyTravelPlanner=lazy(()=>import('./TravelPlannerPanel'))",
 'id="travel-planner" title="Reisewetter & Reiseplaner"',
 'summary="Klimatologie und bestes Reisezeitfenster"',
 'defaultOpen={false}',
 '<MemoLazyTravelPlanner initialLocation={loc}',
 "'forecast-verification','travel-planner','meteogram'"
])need('App-Integration',app,token);
if(app.indexOf('id="travel-planner"')<app.indexOf('id="ensemble"'))failures.push('Reiseplaner ist nicht im unteren App-Bereich nach dem Ensemble einsortiert.');

for(const token of [
 'Reisewetter & Reiseplaner',
 'Fester Zeitraum',
 'Bestes Zeitfenster',
 'Anderes Reiseziel suchen',
 'Eigene Bedingungen',
 'Mind. Ø Tageshöchstwert',
 'Max. erwartete Regentage',
 'Mind. mittlere Schneehöhe',
 'Bestes Reisezeitfenster finden',
 'Das Ergebnis ist eine klimatologische Erwartung',
 'searchLocations(value,controller.signal)'
])need('Reiseplaner-Oberfläche',panel,token);

for(const token of [
 "type TravelPreference='balanced'|'dry'|'warm'|'cold'|'sunny'|'snow'|'calm'",
 "start_date:'1991-01-01'",
 "end_date:'2020-12-31'",
 "models:'era5_land'",
 "hourly:'snow_depth'",
 'export function bestTravelWindows(',
 'export function summarizeTravelPeriod(',
 'export function travelNarrative(',
 'Klimatologisch ist der Zeitraum',
 "source:'Open-Meteo ERA5-Land-Reanalyse'",
 'CACHE_MAX_AGE=180*86400000'
])need('Reiseplaner-Logik',logic,token);

for(const token of [
 '.travel-planner{',
 '.travel-mode-switch{',
 '.travel-constraints{',
 '.travel-metrics{',
 '.travel-day-strip{',
 '@media(max-width:520px)'
])need('Reiseplaner-Design',styles,token);
need('Package-Test',pkg,'test:travel-planner');
need('Baseline-Test',baseline,'scripts/test-travel-planner-08190.mjs');

const compileDir=await mkdtemp(path.join(tmpdir(),'mid-travel-test-'));
try{
 const compile=spawnSync('tsc',['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/travelPlanner.ts')],{cwd:path.resolve('.'),encoding:'utf8'});
 if(compile.status!==0)failures.push(`TypeScript: ${compile.stdout||compile.stderr}`);
 else{
  const module=await import(`${pathToFileURL(path.join(compileDir,'travelPlanner.js')).href}?v=${Date.now()}`);
  const daily={time:[],weather_code:[],temperature_2m_mean:[],temperature_2m_max:[],temperature_2m_min:[],precipitation_sum:[],precipitation_hours:[],sunshine_duration:[],daylight_duration:[],wind_speed_10m_max:[],snowfall_sum:[],cloud_cover_mean:[],relative_humidity_2m_mean:[]};
  for(let year=1991;year<=2020;year++)for(let day=1;day<=20;day++){
   const dry=day<=5,warm=day>=11&&day<=15,date=`${year}-01-${String(day).padStart(2,'0')}`;
   daily.time.push(date);daily.weather_code.push(dry?1:day<=10?61:2);daily.temperature_2m_mean.push(warm?24:dry?20:14);daily.temperature_2m_max.push(warm?30:dry?26:18);daily.temperature_2m_min.push(warm?18:dry?14:9);daily.precipitation_sum.push(dry?0:day<=10?6:1.5);daily.precipitation_hours.push(dry?0:4);daily.sunshine_duration.push((dry?9:warm?7:2)*3600);daily.daylight_duration.push(10*3600);daily.wind_speed_10m_max.push(dry?15:28);daily.snowfall_sum.push(0);daily.cloud_cover_mean.push(dry?20:70);daily.relative_humidity_2m_mean.push(dry?55:78);
  }
  const dataset=module.aggregateTravelClimate({latitude:50.8,longitude:7.0,elevation:60,timezone:'Europe/Berlin',daily});
  const windows=module.bestTravelWindows(dataset,'2027-01-01','2027-01-20',5,'dry',{maxWetDays:.5},3);
  if(windows[0]?.start!=='2027-01-01'||windows[0]?.end!=='2027-01-05'||!windows[0]?.meetsAll)failures.push(`Dynamik: trockenes Bestfenster falsch (${JSON.stringify(windows[0])})`);
  const warm=module.bestTravelWindows(dataset,'2027-01-01','2027-01-20',5,'warm',{},1);
  if(warm[0]?.start!=='2027-01-11')failures.push(`Dynamik: warmes Bestfenster falsch (${warm[0]?.start})`);
  const summary=module.summarizeTravelPeriod(module.travelPeriod(dataset,'2027-01-01','2027-01-05'));
  if(Math.round(summary.avgMax)!==26||summary.wetDaysExpected!==0||Math.round(summary.sunshinePerDay)!==9)failures.push(`Dynamik: Periodenmittel falsch (${JSON.stringify(summary)})`);
 }
}finally{await rm(compileDir,{recursive:true,force:true})}

if(failures.length){console.error('Reiseplaner-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Reiseplaner geprüft: eingeklappte Sektion, Zielortsuche, Festzeitraum, flexible Zeitfenster, Bedingungen, ERA5-Land-Klimatologie und optionale Schneehöhe vorhanden.');
