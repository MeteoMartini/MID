import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8');
const failures=[];
if(!source.includes('function movingAverage(values:number[],radius:number){return values.map((_,index)=>'))failures.push('movingAverage muss den ungenutzten map-Wertparameter verwerfen und nur den Index verwenden.');
if(source.includes('values.map((value,index)=>'))failures.push("Der ungenutzte Parameter 'value' darf in movingAverage nicht erneut eingeführt werden.");
if(failures.length){console.error('WaterSports-TypeScript-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('WaterSports-TypeScript-Buildfix geprüft: kein ungenutzter map-Wertparameter in movingAverage.');
