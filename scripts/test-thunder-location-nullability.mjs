import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];

if(!app.includes("currentFavorite=useMemo(()=>matchingFavorite(favorites,loc)")||!app.includes("displayLocationName=currentFavorite?favoriteLabel(currentFavorite):loc?.name??'Standort'")){
 failures.push('Die sichtbare Favoritenbezeichnung wird nicht als Ortsname für die Gewitterinformation abgeleitet.');
}
if(!app.includes('combineThunderstormInformation(thunderAnalysis,hours,radarAnalysis,st,displayLocationName)')){
 failures.push('Die Gewitterinformation verwendet nicht den angezeigten beziehungsweise manuell vergebenen Ortsnamen.');
}
if(!app.includes('[thunderAnalysis,hours,radarAnalysis,st,displayLocationName]')){
 failures.push('Der angezeigte Ortsname fehlt in den Abhängigkeiten der Gewitterinformation.');
}
if(/combineThunderstormInformation\([^\n]*\bloc(?:\?|\.)\.name\b/.test(app)){
 failures.push('Ein direkter Ortsname aus loc wird weiterhin an der Favoritenbezeichnung vorbei verwendet.');
}

if(failures.length){
 console.error('Gewitter-Ortsbezeichnung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Gewitter-Ortsbezeichnung geprüft: manueller Favoritenname/alias wird nullsicher in Karte und Tooltip verwendet.');
