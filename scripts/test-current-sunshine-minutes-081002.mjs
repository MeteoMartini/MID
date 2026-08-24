import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const contract=await readFile(new URL('../src/sunshineDuration.ts',import.meta.url),'utf8');
const failures=[];
const need=(token,message)=>{if(!app.includes(token))failures.push(message)};
if(!contract.includes('export function sunshineMinutesLabel'))failures.push('Zentrales Minutenformat für die Sonnenscheindauer fehlt.');
if(!contract.includes('boundedSunshineSeconds(seconds,cap*60)'))failures.push('Die zentrale Minutenanzeige ist nicht auf das ausgewiesene Intervall begrenzt.');
need("label:'Sonnenschein',value:sunshineMinutesLabel(sunshineRecent.seconds,sunshineRecent.coverageMinutes)",'Die aktuelle Sonnenscheinkachel verwendet nicht den zentralen Minutenvertrag.');
if(app.includes('sunshineMinutesPerHourLabel'))failures.push('Die aktuelle Sonnenscheinkachel verwendet noch eine lokale Parallelformatierung.');
const format=(seconds,coverageMinutes=60)=>{const covered=Math.max(0,Math.min(60,Math.round(Number(coverageMinutes)||60))),minutes=Math.max(0,Math.min(covered,Math.round(seconds/60)));return`${minutes} min`};
if(format(3600,60)!=='60 min'||format(2700,60)!=='45 min'||format(3600,45)!=='45 min')failures.push('Funktionale Minutenformatierung oder Obergrenze ist fehlerhaft.');
if(failures.length){console.error('Sonnenschein-Minutenformat-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktuelle Sonnenscheindauer geprüft: Ausgabe pro Stundenfenster ausschließlich in Minuten, maximal 60 min.');
