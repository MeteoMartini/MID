import {readFile} from 'node:fs/promises';

const [water,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
  'function tideEventsFromSeries(series:TideSeries,startIndex=0,limit=36)',
  'function tideSeriesForDate(data:MarineForecast|undefined,date:string)',
  'function tideEventsForDate(data:MarineForecast|undefined,date:string)',
  'function WaterTideRow({points,events}',
  '>Gezeiten<',
  "event.kind==='high'?'Flut':'Ebbe'",
  'timeLabel(event.time)} · {seaLevelText(event.level)',
  '<WaterTideRow points={points} events={tideEventsForDate(marine,window.date)}/>',
  'Gezeiten werden unabhängig vom angezeigten Aktivitätszeitfenster für den gesamten jeweiligen Kalendertag aufgeführt.',
  '<h3>Gezeiten</h3>',
  'if(windows.length>=3)break'
])need('Wasserwetter-Tidenmatrix',water,token);
for(const token of [
  '.water-matrix-tide-row>.water-matrix-tide-events{grid-column:2/-1!important',
  '.water-matrix-tide-events>span.high b{color:#38bdf8}',
  '.water-matrix-tide-events>span.low b{color:#60a5fa}'
])need('Wasserwetter-Tidenstil',styles,token);
need('Package-Test',pkg,'test:water-tide-matrix');
need('Baseline-Test',baseline,'scripts/test-water-tide-matrix-081815.mjs');
if(failures.length){console.error('Gezeiten-/Wasserstandsmatrix-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}

/* Designaudit 1.6: transpile and execute the real strict hourly interval helper. */
const {mkdtemp,rm}=await import('node:fs/promises');
const {tmpdir}=await import('node:os');
const {join}=await import('node:path');
const {pathToFileURL}=await import('node:url');
const {build}=await import('esbuild');
const assert=(await import('node:assert/strict')).default;
const auditDir=await mkdtemp(join(tmpdir(),'mid-audit16-water-'));
try{
 await build({entryPoints:[new URL('../src/waterPrecipitationAggregation.ts',import.meta.url).pathname],outfile:join(auditDir,'water.mjs'),bundle:true,format:'esm',platform:'node'});
 const {sumCompletePrecipitation:sum}=await import(pathToFileURL(join(auditDir,'water.mjs')).href);
 const h=(values,available=undefined,epochs=undefined)=>values.map((value,i)=>({value,epoch:epochs?.[i]??1700000000000+i*3600000,available}));
 for(const [v,n,out] of [[h([0]),1,0],[h([0,0,0]),3,0],[h([.1,1.5,.4]),3,2],[h([0,.001,0]),3,.001]])assert.ok(Math.abs(sum(v,n)-out)<1e-9,'real zero/valid total changed');
 for(const [v,n] of [
 [[],1],[h([null]),1],[h([undefined]),1],[h(['']),1],[h(['0']),1],
 [h([false]),1],[h([NaN]),1],[h([Infinity]),1],[h([-1]),1],
 [h([1,null,2]),3],[h([0,0]),3],[h([0]),3],[h([0,0,0]),0],
 [h([0,0,0]),1.5],[h([1e308,1e308]),2],[h([0,0,0],false),3],
 [h([0,0,0],undefined,[1700000000000,1700007200000,1700010800000]),3],
 [[{value:0,epoch:null}],1],[[{value:0,epoch:undefined}],1],
 [[{value:0,epoch:0},{value:0,epoch:3599000}],2],
 [[{value:0,epoch:0,available:false}],1],
 [[{value:0,epoch:0},{value:0,epoch:3600000,available:false},{value:0,epoch:7200000}],3]
 ])assert.ok(Number.isNaN(sum(v,n)),'missing/partial/hour-gap must not become zero');
 for(const field of ['precipitation','rain','showers','snowfall'])assert.ok(water.includes('sumCompletePrecipitation(group.map(hour=>({value:hour.'+field+',epoch:hour.epoch,available:'),'missing field guard '+field);
 assert.ok(water.includes('statt 0 mm'),'missing-interval UI hint required');
}finally{await rm(auditDir,{recursive:true,force:true})}

console.log('Gezeiten-/Wasserstandsmatrix geprüft: Tageswendepunkte für bis zu drei Tage, exakte Zeit/Level-Angaben und kompakte Tabellenzeile vorhanden.');
