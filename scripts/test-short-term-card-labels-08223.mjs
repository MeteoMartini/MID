import {readFile} from 'node:fs/promises';

const shortTerm=await readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const failures=[];
const need=(token)=>{if(!shortTerm.includes(token))failures.push(`fehlt: ${token}`)};
const forbid=(token)=>{if(shortTerm.includes(token))failures.push(`unerlaubt: ${token}`)};

need("forecastSourceLabel||'Best Match'");
need('<em>{sourceLabel}</em>');
need('<time><b>{point.timeLabel}</b></time>');
forbid('ohne zusätzlichen Abruf');
forbid('<b>{point.offsetLabel}</b>');
forbid('<small>{point.timeLabel}</small>');

if(failures.length){
 console.error('Kurzfrist-Kartenbeschriftung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Kurzfrist-Kartenbeschriftung und Headertext geprüft.');
