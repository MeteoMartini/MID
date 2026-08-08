import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const failures=[];

for(const invalid of [
  'chartTickValues[1]??chartTickValues[0]||0',
  'chartTickValues[1]??chartTickValues[0]??0',
  '??chartTickValues[0]||',
  '??chartFirstTick||'
]){
  if(source.includes(invalid))failures.push(`ungültige oder fragile Operatorverkettung gefunden: ${invalid}`);
}
for(const token of [
  'function shortTermTickStep(range:number)',
  'function shortTermTickValues(minimum:number,maximum:number)',
  'if(values.length<3){values.unshift(end+step);values.push(start-step)}',
  'chartTickValues=shortTermTickValues(chartRangeMin-2,chartRangeMax+2)',
  'chartTempMin=Math.min(...chartTickValues)',
  'chartTempMax=Math.max(...chartTickValues)',
  'chartTempSpan=Math.max(1,chartTempMax-chartTempMin)'
])if(!source.includes(token))failures.push(`robuste aktuelle Tick-Berechnung fehlt: ${token}`);

if(failures.length){
  console.error('TS5076-/Tick-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('TS5076-Buildfix bleibt ohne fragile ??/||-Verkettung erhalten; die aktuelle Wetterprofil-Skala nutzt robuste Tick-Fallbacks.');
