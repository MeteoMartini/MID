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
  "event.kind==='high'?'Hochpunkt':'Tiefpunkt'",
  'timeLabel(event.time)} · {seaLevelText(event.level)',
  '<WaterTideRow points={points} events={tideEventsForDate(marine,window.date)}/>',
  'Gezeiten werden unabhängig vom angezeigten Aktivitätszeitfenster für den gesamten jeweiligen Kalendertag aufgeführt.',
  'Gezeiten- und Wasserstandswendepunkte',
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
console.log('Gezeiten-/Wasserstandsmatrix geprüft: Tageswendepunkte für bis zu drei Tage, exakte Zeit/Level-Angaben und kompakte Tabellenzeile vorhanden.');
