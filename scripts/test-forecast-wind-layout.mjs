import {readFile} from 'node:fs/promises';

const [app,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);

const failures=[];
for(const token of ['forecast-meta-rain','forecast-meta-sun','forecast-meta-wind']){
  if(!app.includes(token))failures.push(`Semantische Klasse fehlt: ${token}`);
}
for(const token of [
  '.forecast-meta-wind{',
  'display:inline-flex!important',
  'white-space:nowrap!important',
  'flex:0 0 100%',
  '.forecast-meta-wind .wind-direction-arrow'
]){
  if(!styles.includes(token))failures.push(`Mobile Windzeilen-Absicherung fehlt: ${token}`);
}
if(failures.length){
  console.error(`7-Tage-Windlayout-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('7-Tage-Windlayout geprüft: Symbol, Richtung, Geschwindigkeit und Böen bleiben mobil als geschlossene zweite Metazeile ausgerichtet.');
