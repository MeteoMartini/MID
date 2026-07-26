import {readFile} from 'node:fs/promises';

const radar=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const failures=[];
const importLine=radar.split('\n').find(line=>line.includes("from 'lucide-react'"))||'';

if(!radar.includes('<ChevronDown size={15}/>'))failures.push('Der Chevron der einklappbaren Komposit-Legende fehlt.');
if(!/\bChevronDown\b/.test(importLine))failures.push('ChevronDown wird trotz JSX-Verwendung nicht aus lucide-react importiert.');
if((radar.match(/<ChevronDown\b/g)||[]).length>0&&(importLine.match(/\bChevronDown\b/g)||[]).length!==1)failures.push('ChevronDown ist nicht genau einmal im Lucide-Import vorhanden.');

if(failures.length){
 console.error('Build-Regression v0.7.100.4 fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Build-Regression v0.7.100.4 geprüft: ChevronDown ist für die Komposit-Legende korrekt importiert.');
