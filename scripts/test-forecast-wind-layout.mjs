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
  'v0.7.90.3 – Niederschlag, Sonne und Wind',
  'flex-wrap:nowrap',
  'grid-column:2 / -1',
  '.forecast-meta-wind{',
  'display:inline-flex!important',
  'white-space:nowrap!important',
  '.forecast-meta-wind .wind-direction-arrow'
]){
  if(!styles.includes(token))failures.push(`Einzeiliges Metadatenlayout fehlt: ${token}`);
}
if(styles.includes('flex:0 0 100%')){
  failures.push('Windangabe wird weiterhin erzwungen in eine eigene zweite Zeile verschoben.');
}
if(failures.length){
  console.error(`7-Tage-Windlayout-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('7-Tage-Windlayout geprüft: Niederschlag, Sonnenschein, Windsymbol, Richtung, Geschwindigkeit und Böen bleiben gemeinsam in einer Zeile.');
