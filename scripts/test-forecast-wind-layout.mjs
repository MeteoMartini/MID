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
  'MID v0.9.39.4 · keine abgeschnittenen Wetterwerte',
  'flex-wrap:wrap!important',
  '.forecast-meta-rain{',
  'display:inline-flex!important',
  '.forecast-meta-wind{',
  'flex-wrap:wrap',
  '.forecast-meta-wind .wind-direction-arrow'
]){
  if(!styles.includes(token))failures.push(`Responsives Metadatenlayout fehlt: ${token}`);
}
if(!app.includes('<b><Droplets size={12}/>{precipitationAmountLabel(d)}</b><small>'))failures.push('Niederschlagsmenge, Design-2.0-Vektoricon und kompakte PoP-Zusatzinformation sind nicht getrennt umbrechbar.');
if(styles.includes('.cockpit-day-rain b,.cockpit-day-rain small,.forecast-meta-rain,.widgetmeta>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'))failures.push('Veralteter Ellipsis-Schutz schneidet Wetterwerte weiterhin ab.');
if(failures.length){
  console.error(`7-Tage-Metadatenlayout-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('7-Tage-Metadatenlayout geprüft: Niederschlag, Sonne und Wind bleiben kompakt gruppiert, dürfen bei Platzmangel aber vollständig umbrechen statt abgeschnitten zu werden.');
