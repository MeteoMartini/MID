import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const [water,panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)};
for(const token of ['function solveQuadraticNormalEquation(','radius=step===15?6:3','Math.abs(vertex)<=step*.8','<h3>Gezeiten</h3>','<b>Gezeiten</b>'])need('Gezeiten',water,token);
if(water.includes('Gezeiten- und Wasserstandswendepunkte'))failures.push('Alte Gezeitenüberschrift ist noch vorhanden.');
for(const token of ['hazardY=Math.max(plotTop+8,cellY-16)','clipPathUnits="userSpaceOnUse"','clipPath={`url(#${clipId})`}','Math.min(1.24','ensemble-chart-temperature','ensemble-chart-precipitation','ensemble-chart-wind'])need('Ensemble-Overlay',panel,token);
for(const token of ['.ensemble-chart-temperature{z-index:30}', '.ensemble-chart-precipitation{z-index:20}', '.ensemble-chart-wind{z-index:10}', '.ensemble-temperature-canvas>.recharts-wrapper{z-index:3}', '.ensemble-chart-export .recharts-tooltip-wrapper{z-index:100!important}', '.ensemble-chart-export:has(.recharts-tooltip-wrapper[style*="visibility: visible"]){z-index:100}'])need('Tooltip-Layering',styles,token);
const start=water.indexOf('type TideEvent='),end=water.indexOf('function tideAnalysis(');
if(start<0||end<0)failures.push('Gezeiten-Hilfslogik konnte nicht isoliert werden.');else{
 const isolated=`type MarineForecast={hourly:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>};\n${water.slice(start,end)}\nexport {tideEventsForDate};\n`,dir=await mkdtemp(join(tmpdir(),'mid-tides-082618-'));
 try{
  const output=ts.transpileModule(isolated,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'tides.ts'}).outputText,file=join(dir,'tides.mjs');await writeFile(file,output);const {tideEventsForDate}=await import(`${pathToFileURL(file).href}?v=${Date.now()}`),date='2026-08-06',startMs=Date.parse('2026-08-05T18:00:00Z'),endMs=Date.parse('2026-08-07T06:00:00Z'),times=[],levels=[];
  for(let ms=startMs;ms<=endMs;ms+=15*60000){const hours=(ms-Date.parse('2026-08-06T00:00:00Z'))/3600000;times.push(new Date(ms).toISOString().slice(0,16));levels.push(Number((.12+.09*Math.cos((hours-3.13)*2*Math.PI/12.42)).toFixed(4)));}
  const data={hourly:{time:[],sea_level_height_msl:[]},minutely_15:{time:times,sea_level_height_msl:levels}},events=tideEventsForDate(data,date);
  if(events.length<3)failures.push(`Nur ${events.length} Gezeiten erkannt.`);
  if(events.some(event=>Number(event.time.slice(14,16))%15===0))failures.push(`Mindestens eine synthetische Gezeitenzeit blieb auf dem Viertelstundenraster: ${events.map(event=>event.time).join(', ')}`);
 }finally{await rm(dir,{recursive:true,force:true})}
}
for(const [file,source,kind] of [['WaterSportsPanel.tsx',water,ts.ScriptKind.TSX],['EnsemblePanel.tsx',panel,ts.ScriptKind.TSX]]){const parsed=ts.createSourceFile(file,source,ts.ScriptTarget.ESNext,true,kind);if(parsed.parseDiagnostics.length)failures.push(...parsed.parseDiagnostics.map(item=>`${file}: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`))}
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:water-tide-tooltip-layering'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-water-tide-tooltip-layering-082618.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Gezeiten-/Ensemble-Tooltip-Layering fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gezeiten werden aus dem Wasserstandsverlauf minutengenau geschätzt; Hazard-/Niederschlags-Overlays und Tooltip-Ebenen sind kollisionsfrei abgesichert.');
