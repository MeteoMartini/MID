import {readFile} from 'node:fs/promises';

const [app,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const checks=[
 /currentWeatherCode=currentPrecip\.type==='none'\?currentHour\.code:currentPrecip\.displayCode/,
 /currentWeatherLabel=currentPrecip\.type==='none'\?label\(currentHour\.code\):currentPrecip\.weatherLabel/,
 /icon\(currentWeatherCode,currentHour\.isDay\)/,
 /\{currentWeatherLabel\}/,
 /parts\.displayCode/
];
for(const pattern of checks){
 if(!pattern.test(app))failures.push(`Detailansicht nutzt die plausibilisierte Niederschlagsform nicht vollständig: ${pattern}`);
}
if((app.match(/precip-bar-key/g)||[]).length!==2)failures.push('Niederschlagslegende verwendet nicht in beiden Modi Balken-Schlüssel.');
for(const token of ['.detaillegend i.precip-bar-key','width:14px','height:12px','border-radius:3px']){
 if(!styles.includes(token))failures.push(`Balkendesign der Niederschlagslegende fehlt: ${token}`);
}
if(failures.length){
 console.error(`Detailansichts-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('Detailansicht geprüft: Wettertext, Symbol, Diagrammpiktogramme und Niederschlagsfeld verwenden dieselbe Plausibilitätsprüfung; Legendenmuster erscheinen als Balken.');
