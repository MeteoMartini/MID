import fs from 'node:fs';
const weather=fs.readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
if(!/export type Hour=\{[^}]*pressure:number;/.test(weather))failures.push('Hour-Typ enthält kein pressure:number');
if(!/hourly:\[[^\]]*'pressure_msl'/.test(weather))failures.push('Best-Match-Stundenabruf lädt pressure_msl nicht');
if(!/pressure:n\(w\.hourly\.pressure_msl\?\.\[i\],NaN\)/.test(weather))failures.push('mapHours übernimmt pressure_msl nicht in Hour.pressure');
if(!/function pressureTendency\(hours:Hour\[\]\)/.test(app))failures.push('Luftdrucktendenz fehlt in App.tsx');
if(!/current\.pressure-past\.pressure/.test(app))failures.push('Dreistündige Druckdifferenz wird nicht aus Hour.pressure gebildet');
if(failures.length){console.error('Luftdrucktendenz-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Luftdrucktendenz geprüft: API-Feld, Hour-Typ, Mapping und 3-h-Auswertung sind vollständig verdrahtet.');
