import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];

if(!app.includes("combineThunderstormInformation(thunderAnalysis,hours,radarAnalysis,st,loc?.name??'Standort')")){
 failures.push('Die Gewitterinformation verwendet keinen nullsicheren Ortsnamen-Fallback.');
}
if(!app.includes("[thunderAnalysis,hours,radarAnalysis,st,loc?.name]")){
 failures.push('Der Ortsname fehlt in den Abhängigkeiten der Gewitterinformation.');
}
if(/combineThunderstormInformation\([^\n]*\bloc\.name\b/.test(app)){
 failures.push('Direkter Zugriff auf loc.name in der Gewitterinformation ist weiterhin vorhanden.');
}

if(failures.length){
 console.error('Gewitter-Ortsnullbarkeit fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Gewitter-Ortsnullbarkeit geprüft: kein direkter Zugriff auf möglicherweise nulles loc.');
