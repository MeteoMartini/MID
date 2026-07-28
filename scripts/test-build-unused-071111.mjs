import {readFile} from 'node:fs/promises';
const [verification,weather]=await Promise.all([
  readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.ts',import.meta.url),'utf8')
]);
const failures=[];
if(verification.includes('function currentWeightedForecasts(store:Store'))failures.push('Ungenutzter Store-Parameter in currentWeightedForecasts ist noch vorhanden.');
if(verification.includes('currentWeightedForecasts(store,days,ensemble,evaluations)'))failures.push('Veralteter Aufruf mit ungenutztem Store-Argument ist noch vorhanden.');
if(!verification.includes('function currentWeightedForecasts(days:Day[],ensemble:EnsembleDay[],evaluations:Evaluation[]'))failures.push('Bereinigte currentWeightedForecasts-Signatur fehlt.');
if(weather.includes('dates.find((date,index)=>'))failures.push('Ungenutzter date-Parameter bei der Szenario-Divergenz ist noch vorhanden.');
if(!weather.includes('dates.find((_,index)=>'))failures.push('Bereinigte Divergenzsuche fehlt.');
if(failures.length){console.error('Build-/Unused-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('GitHub-Buildfix geprüft: ungenutzte Parameter in Prognosegewichtung und Szenariocluster entfernt.');
