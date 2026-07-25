import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const weather=await readFile(path.join(root,'src','weather.ts'),'utf8');
const failures=[];

for(const token of [
  'const xAt=(i:number)=>left+(i/Math.max(1,p.length-1))*plotW;',
  'const xClock=(minutes:number)=>left+(clamp(minutes,0,23*60)/(23*60))*plotW;',
  '{sunriseX!==null&&sunriseX>left&&<rect',
  '{sunsetX!==null&&sunsetX<W-right&&<rect'
]) if(!app.includes(token)) failures.push(`Volltages-Zeitachse fehlt: ${token}`);

for(const token of [
  "forecast_days:'14',past_hours:'24',forecast_minutely_15:'24',past_minutely_15:'4'",
  "timezone:'auto'"
]) if(!weather.includes(token)) failures.push(`Anforderung für vollständigen Tagesverlauf fehlt: ${token}`);

for(const banned of [
  'const hourMinutes=p.map(x=>clockMinutes(x.time));',
  'const plottedMinuteStart=hourMinutes.find(value=>value!==null)??0',
  'const xForMinute=(minutes:number)=>left+((clamp(minutes,plottedMinuteStart,plottedMinuteEnd)-plottedMinuteStart)/plottedMinuteRange)*plotW;'
]) if(app.includes(banned)) failures.push(`Teilfenster-Logik ist noch vorhanden: ${banned}`);

if(failures.length){
  console.error('Zeitachsen-Prüfung der Detailansicht fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Zeitachsen-Prüfung bestanden: Die Detailansicht bleibt auf 00:00–23:00 skaliert und lädt für den aktuellen Tag zusätzlich die vergangenen 24 Stunden nach.');
