import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const astronomy=await readFile(path.join(root,'src','astronomy.ts'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];
for(const token of [
  "import {astronomySummary,formatAstronomyTime,formatDayLengthChange,formatDuration} from './astronomy';",
  'const mappedHours=mapHours(w),mappedDays=mapDays(w),todayDate=localDateInZone(w.timezone),currentDay=mappedDays.find(day=>day.date===todayDate)??mappedDays[0],pressureChange=pressureTendency(mappedHours),astronomy=astronomySummary(w);',
  "label:'Sonne / Mond'",
  'className="sun-moon-primary"',
  'className="sun-moon-detail"',
  "className={x.label==='Luftqualität'?'air-quality-card':undefined}"
]) if(!app.includes(token)) failures.push(`Sonne-/Mond-Karte fehlt: ${token}`);
for(const token of [
  'export function astronomySummary',
  'export function formatAstronomyTime',
  'export function formatDuration',
  'export function formatDayLengthChange'
]) if(!astronomy.includes(token)) failures.push(`Astronomie-Berechnung fehlt: ${token}`);
for(const token of [
  '.metrics .sun-moon-detail{',
  '@media(min-width:1101px){.metrics{grid-template-columns:repeat(10,minmax(0,1fr))}'
]) if(!styles.includes(token)) failures.push(`Sonne-/Mond-Stil fehlt: ${token}`);
if(app.includes("x.label==='Sonne / Mond'?'sun-moon-card'")) failures.push('Sonne/Mond verwendet weiterhin eine abweichende Spezialkarte.');
if(styles.includes('.metrics .sun-moon-card{')) failures.push('Sonne/Mond besitzt weiterhin einen abweichenden Spezialhintergrund.');
if(failures.length){console.error('Astronomie-Kartenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Astronomie-Karte geprüft: Sonne/Mond ist als zehnte aktuelle Wetterkarte vollständig vorhanden und nutzt wieder das normale Kartendesign.');
