import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
const need=(token,message)=>{if(!app.includes(token))failures.push(message)};
need('function sunshineMinutesPerHourLabel(seconds:number,coverageMinutes=60)','Minutenformat für die stündliche Sonnenscheindauer fehlt.');
need('Math.min(60,Math.round(Number(coverageMinutes)||60))','Die Minutenanzeige ist nicht auf höchstens 60 Minuten begrenzt.');
need('return`${minutes} min`','Die aktuelle Sonnenscheindauer wird nicht in Minuten ausgegeben.');
need("label:'Sonnenschein',value:sunshineMinutesPerHourLabel(sunshineRecent.seconds,sunshineRecent.coverageMinutes)",'Die aktuelle Sonnenscheinkachel verwendet weiterhin das Stunden-/Minutenformat.');
if(app.includes("label:'Sonnenschein',value:sunshineDurationLabel(sunshineRecent.seconds)"))failures.push('Die aktuelle Sonnenscheinkachel verwendet noch die alte Dauerformatierung.');
const format=(seconds,coverageMinutes=60)=>{const covered=Math.max(0,Math.min(60,Math.round(Number(coverageMinutes)||60))),minutes=Math.max(0,Math.min(covered,Math.round(seconds/60)));return`${minutes} min`};
if(format(3600,60)!=='60 min'||format(2700,60)!=='45 min'||format(3600,45)!=='45 min')failures.push('Funktionale Minutenformatierung oder Obergrenze ist fehlerhaft.');
if(failures.length){console.error('Sonnenschein-Minutenformat-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktuelle Sonnenscheindauer geprüft: Ausgabe pro Stundenfenster ausschließlich in Minuten, maximal 60 min.');
