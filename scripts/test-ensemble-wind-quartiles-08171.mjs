import {readFile} from 'node:fs/promises';

const [panel,weather,styles]=await Promise.all([
  readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'windQ25:number;windQ75:number;',
  'gustQ25:number;gustQ75:number;',
  'windQ25=windVals.length>=6?weightedQuantile(windVals,.25):NaN',
  'windQ75=windVals.length>=6?weightedQuantile(windVals,.75):NaN',
  'gustQ25=gustVals.length>=6?weightedQuantile(gustVals,.25):NaN',
  'gustQ75=gustVals.length>=6?weightedQuantile(gustVals,.75):NaN',
  "const ENSEMBLE_CACHE_PREFIX='mid:ensemble:v9:'"
])need('Ensemble-Windquartile',weather,token);

for(const token of [
  'windQ25Plot:number|null;',
  'windQBandPlot:number|null;',
  'gustQ25Plot:number|null;',
  'gustQBandPlot:number|null;',
  "quartileLowKey=gust?'gustQ25Plot':'windQ25Plot'",
  "quartileBandKey=gust?'gustQBandPlot':'windQBandPlot'",
  'stackId="wind-quartile"',
  'fillOpacity={.42}',
  'row.x<7&&<span>P25–P75:',
  'P25–P75 <small>Tage 1–7</small>',
  'P25–P75 Tag 1–7 · ENS-Mittel'
])need('Winddiagramm P25–P75',panel,token);

for(const token of [
  '.wind-trend-toolbar{display:grid;justify-items:center;',
  '.wind-legend{display:flex;align-items:center;justify-content:center;',
  '.wind-legend i.area.quartile.wind{',
  '.wind-legend i.area.quartile.gust{'
])need('Mittige Windlegende',styles,token);

if(panel.includes('windQ25Plot:index<8')||panel.includes('gustQ25Plot:index<8'))failures.push('P25–P75 reicht fälschlich über die ersten sieben Tage hinaus.');
if(!panel.includes('windQ25Plot=index<7')||!panel.includes('gustQ25Plot=index<7'))failures.push('P25–P75 ist nicht auf Tage 1–7 begrenzt.');

if(failures.length){console.error('Ensemble-Windquartilprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Winddiagramm geprüft: dunkler P25–P75-Kernbereich für Tage 1–7 und mittig oberhalb angeordnete Legende.');
