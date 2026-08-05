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
if(!source.includes('chartFirstTick=chartTickValues[0]??0'))failures.push('expliziter erster Tick-Fallback fehlt');
if(!source.includes('chartSecondTick=chartTickValues[1]??chartFirstTick'))failures.push('expliziter zweiter Tick-Fallback fehlt');
if(!source.includes('chartTickStepValue=Math.abs(chartFirstTick-chartSecondTick)||shortTermTickStep(chartTempSpan)'))failures.push('eindeutige Tick-Schritt-Berechnung fehlt');

if(failures.length){
  console.error('TS5076-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('TS5076-Buildfix deterministisch und ohne umgebungsabhängigen TypeScript-Import geprüft.');
