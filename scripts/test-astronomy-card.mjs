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
  'const mappedHours=mapHours(w),astronomy=astronomySummary(w);',
  "label:'Sonne / Mond'",
  'className="sun-moon-primary"',
  'className="sun-moon-detail"',
  "x.label==='Sonne / Mond'?'sun-moon-card'"
]) if(!app.includes(token)) failures.push(`Sonne-/Mond-Karte fehlt: ${token}`);
for(const token of [
  'export function astronomySummary',
  'export function formatAstronomyTime',
  'export function formatDuration',
  'export function formatDayLengthChange'
]) if(!astronomy.includes(token)) failures.push(`Astronomie-Berechnung fehlt: ${token}`);
for(const token of [
  '.metrics .sun-moon-card{',
  '.metrics .sun-moon-detail{',
  '@media(min-width:1101px){.metrics{grid-template-columns:repeat(10,minmax(0,1fr))}'
]) if(!styles.includes(token)) failures.push(`Sonne-/Mond-Stil fehlt: ${token}`);
if(failures.length){console.error('Astronomie-Kartenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Astronomie-Karte geprüft: Sonne/Mond ist wieder als zehnte aktuelle Wetterkarte mit vollständigen Tages- und Mondwerten vorhanden.');
